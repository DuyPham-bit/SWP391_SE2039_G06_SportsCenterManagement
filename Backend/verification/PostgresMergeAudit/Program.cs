using System.Net;
using System.Net.Http.Json;
using System.Net.Sockets;
using System.Diagnostics;
using System.Reflection;
using System.Security.Claims;
using System.Text.Json;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Npgsql;
using SportsCenterManagement.API.Controllers;
using SportsCenterManagement.API.Models;
using SportsCenterManagement.API.Services;
using SportsCenterManagement.BLL.Common;
using SportsCenterManagement.BLL.Services;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;
using SportsCenterManagement.DAL.Repositories.Implementations;

var source = Environment.GetEnvironmentVariable("SCMS_AUDIT_CONNECTION")
    ?? throw new InvalidOperationException("Set SCMS_AUDIT_CONNECTION to a local PostgreSQL test server (not production).");
var database = "scms_merge_audit_" + Guid.NewGuid().ToString("N");
Console.WriteLine("Audit database: " + database);
var connection = new NpgsqlConnectionStringBuilder(source) { Database = "postgres", Pooling = false };
await using var admin = new NpgsqlConnection(connection.ConnectionString);
await admin.OpenAsync();
await using (var create = new NpgsqlCommand($"CREATE DATABASE {database}", admin)) await create.ExecuteNonQueryAsync();
var checks = 0;
void Check(bool condition, string name)
{
    if (!condition) throw new InvalidOperationException("FAIL " + name);
    checks++;
    Console.WriteLine("PASS " + name);
}
try
{
    connection.Database = database;
    connection.Pooling = true;
    var options = new DbContextOptionsBuilder<SportsCenterDbContext>().UseNpgsql(connection.ConnectionString).Options;
    await using var migrationDb = new SportsCenterDbContext(options);
    await migrationDb.GetService<IMigrator>().MigrateAsync("20261103155627_AddMediaStorageKey");
    await migrationDb.Database.ExecuteSqlRawAsync("""
        INSERT INTO uploaded_media ("Id", storage_key, drive_file_id, file_name, mime_type, file_url, created_at)
        VALUES (900001, 'dashboard/legacy.jpg', '', 'legacy.jpg', 'image/jpeg', '', NOW());
        """);
    await migrationDb.Database.MigrateAsync();
    var legacy = await migrationDb.UploadedMedias.SingleAsync(m => m.Id == 900001);
    Check(legacy.StorageKey == "dashboard/legacy.jpg" && legacy.DriveFileId == "", "upgrade preserves existing media IDs and keys");
    Check(!migrationDb.Database.HasPendingModelChanges(), "PostgreSQL migrations match the merged model");
    await migrationDb.DisposeAsync();
    await using var db = new SportsCenterDbContext(options);
    Console.WriteLine("Starting authorization seed on a fresh context...");
    await DbInitializer.SeedAsync(db);
    var roleCount = await db.Roles.CountAsync();
    await DbInitializer.SeedAsync(db);
    Check(roleCount == await db.Roles.CountAsync(), "authorization seeding is idempotent on PostgreSQL");

    var centerA = new Center { Name = "Audit A", Address = "Audit", Status = "Active", CreatedAt = DateTime.UtcNow };
    var centerB = new Center { Name = "Audit B", Address = "Audit", Status = "Active", CreatedAt = DateTime.UtcNow };
    db.Centers.AddRange(centerA, centerB);
    await db.SaveChangesAsync();
    var managerRole = await db.Roles.SingleAsync(r => r.Name == "Manager");
    var manager = new User { Username = "audit-manager", Email = "audit-manager@example.test", PasswordHash = "fixture", RoleId = managerRole.Id, Status = "Active", CreatedAt = DateTime.UtcNow };
    var other = new User { Username = "audit-other", Email = "audit-other@example.test", PasswordHash = "fixture", RoleId = managerRole.Id, Status = "Active", CreatedAt = DateTime.UtcNow };
    db.Users.AddRange(manager, other);
    await db.SaveChangesAsync();
    db.StaffProfiles.AddRange(
        new StaffProfile { UserId = manager.Id, CenterId = centerA.Id, StaffCode = "AUDIT-A", FullName = "Manager A", Position = "Manager", Status = "Active", CreatedAt = DateTime.UtcNow },
        new StaffProfile { UserId = other.Id, CenterId = centerB.Id, StaffCode = "AUDIT-B", FullName = "Manager B", Position = "Manager", Status = "Active", CreatedAt = DateTime.UtcNow });
    await db.SaveChangesAsync();
    await DbInitializer.SeedAsync(db);

    var coachRole = await db.Roles.SingleAsync(r => r.Name == "Coach");
    var coachUser = new User { Username = "audit-coach", Email = "audit-coach@example.test", PasswordHash = "fixture", RoleId = coachRole.Id, Status = "Active", CreatedAt = DateTime.UtcNow };
    db.Users.Add(coachUser);
    await db.SaveChangesAsync();
    var coach = new CoachProfile { UserId = coachUser.Id, CenterId = centerA.Id, CoachCode = "AUDIT-COACH", FullName = "Audit Coach", Status = "Active", CreatedAt = DateTime.UtcNow };
    db.CoachProfiles.Add(coach);
    await db.SaveChangesAsync();
    var auditClass = new ClassEntity { CenterId = centerA.Id, SportId = await db.Sports.Select(s => s.Id).FirstAsync(), RoomId = await db.Rooms.Where(r => r.CenterId == centerA.Id).Select(r => r.Id).FirstAsync(), Name = "Audit class", Capacity = 12, DurationMinutes = 60, Status = "Active", CreatedAt = DateTime.UtcNow };
    db.Classes.Add(auditClass);
    await db.SaveChangesAsync();
    db.ClassCoaches.Add(new ClassCoach { ClassId = auditClass.Id, CoachId = coach.Id, IsPrimary = true });
    db.ClassSessions.Add(new ClassSession { ClassId = auditClass.Id, SessionDate = new DateOnly(2026, 11, 4), StartTime = new TimeOnly(10, 0), EndTime = new TimeOnly(11, 0), SessionStatus = "Scheduled", CreatedAt = DateTime.UtcNow });
    await db.SaveChangesAsync();

    var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["R2Storage:PublicDomain"] = "https://media.example.test" }).Build();
    var report = new ReportService(new UnitOfWork(db), null!, configuration);
    var summary = await report.GetOperationsReportAsync(centerA.Id, new DateOnly(2026, 11, 1), new DateOnly(2026, 11, 30));
    Check(summary.CenterId == centerA.Id, "Dapper operations report executes PostgreSQL SQL");
    Check(summary.SessionsCount == 1 && summary.CapacitySeats == 12 && summary.Coaches!.Single().FullName == "Audit Coach", "PostgreSQL lateral join and Dapper mappings retain real session/coach data");

    var accessor = new HttpContextAccessor { HttpContext = new DefaultHttpContext() };
    void AsUser(long id) => accessor.HttpContext!.User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, id.ToString())], "audit"));
    AsUser(manager.Id);
    var s3 = DispatchProxy.Create<IAmazonS3, AuditS3>();
    var r2Options = Options.Create(new R2StorageOptions { BucketName = "audit", PublicDomain = "https://media.example.test" });
    using var storage = new R2StorageService(r2Options, TimeProvider.System, db, accessor, NullLogger<R2StorageService>.Instance, new AuditHttpFactory(), s3);
    var catalog = new MediaCatalogService(db, storage, r2Options);
    byte[] png = [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0];
    var file = new FormFile(new MemoryStream(png), 0, png.Length, "file", "audit.png") { Headers = new HeaderDictionary(), ContentType = "image/png" };
    var image = await catalog.UploadAsync(file, manager.Id, default);
    Check(image.Id > 0 && image.CenterId == centerA.Id && image.StorageKey.StartsWith("dashboard/"), "upload creates exactly one catalog ID with tenant ownership");
    Check(await db.UploadedMedias.CountAsync(m => m.StorageKey == image.StorageKey) == 1, "catalog does not duplicate the storage metadata row");

    var landing = new LandingContentService(db, configuration);
    var content = JsonSerializer.SerializeToElement(new Dictionary<string, object>
    {
        ["heroBanner"] = new { image = catalog.PublicUrl(image.StorageKey) },
        ["whyUs"] = new { }, ["coursesSection"] = new { }, ["facilitiesSection"] = new { },
        ["zonesLayout"] = new { }, ["ctaAndFooter"] = new { }
    });
    var published = await landing.SaveAsync(content, manager.Id, default);
    var stored = await db.SystemSettings.SingleAsync(s => s.SettingKey == "site.landing-content");
    Check(LandingContentService.ReferencedMediaIds(stored.SettingValue).Contains(image.Id) && !stored.SettingValue!.Contains("https://"), "landing stores media IDs, not public URLs");
    Check(published.Content!.Value.GetProperty("heroBanner").GetProperty("image").GetString() == catalog.PublicUrl(image.StorageKey), "landing hydrates IDs to renderable URLs");
    try { await catalog.DeleteAsync(image.StorageKey, default); throw new Exception("Published image was deleted"); }
    catch (BusinessException ex) { Check(ex.StatusCode == HttpStatusCode.Conflict, "referenced landing images cannot be deleted"); }
    AsUser(other.Id);
    try { await storage.DeleteAsync(image.StorageKey); throw new Exception("Cross-center delete succeeded"); }
    catch (BusinessException ex) { Check(ex.StatusCode == HttpStatusCode.NotFound, "R2 deletion rejects a different center on PostgreSQL"); }
    AsUser(manager.Id);
    db.SystemSettings.Remove(stored);
    await db.SaveChangesAsync();
    await catalog.DeleteAsync(image.StorageKey, default);
    Check(!await db.UploadedMedias.AnyAsync(m => m.Id == image.Id), "unused image deletion removes catalog metadata");

    // A fresh database exercises the complete migration chain rather than only upgrades.
    Check((await db.Database.GetAppliedMigrationsAsync()).Count() == 3, "all three PostgreSQL migrations applied");

    // Boot the real API against this disposable database and exercise the new browser session contract.
    var listener = new TcpListener(IPAddress.Loopback, 0);
    listener.Start();
    var port = ((IPEndPoint)listener.LocalEndpoint).Port;
    listener.Stop();
    var password = "Audit!" + Guid.NewGuid().ToString("N");
    var start = new ProcessStartInfo("dotnet") { UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true, WorkingDirectory = AppContext.BaseDirectory };
    start.ArgumentList.Add(typeof(R2StorageService).Assembly.Location);
    start.Environment["ASPNETCORE_ENVIRONMENT"] = "Production";
    start.Environment["ASPNETCORE_URLS"] = $"http://127.0.0.1:{port}";
    start.Environment["ConnectionStrings__SportsCenter"] = connection.ConnectionString;
    start.Environment["Jwt__Key"] = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
    start.Environment["Jwt__Issuer"] = "SportsCenterManagement.API";
    start.Environment["Jwt__Audience"] = "SportsCenterManagement.FE";
    start.Environment["Bootstrap__Admin__Username"] = "merge-audit-admin";
    start.Environment["Bootstrap__Admin__Email"] = "merge-audit-admin@example.test";
    start.Environment["Bootstrap__Admin__Password"] = password;
    start.Environment["Logging__LogLevel__Default"] = "Warning";
    using var apiProcess = Process.Start(start) ?? throw new InvalidOperationException("Cannot launch audit API");
    var apiOutput = apiProcess.StandardOutput.ReadToEndAsync();
    var apiErrors = apiProcess.StandardError.ReadToEndAsync();
    try
    {
        using var client = new HttpClient(new HttpClientHandler { CookieContainer = new CookieContainer() }) { BaseAddress = new Uri($"http://127.0.0.1:{port}/api/"), Timeout = TimeSpan.FromSeconds(10) };
        var healthy = false;
        for (var attempt = 0; attempt < 120 && !apiProcess.HasExited; attempt++)
        {
            try { healthy = (await client.GetAsync("health/ready")).IsSuccessStatusCode; } catch (HttpRequestException) { }
            if (healthy) break;
            await Task.Delay(250);
        }
        if (!healthy && apiProcess.HasExited) throw new InvalidOperationException("Audit API failed: " + await apiErrors + await apiOutput);
        Check(healthy, "real API startup applies PostgreSQL migrations, advisory lock and readiness check");
        Check((await client.GetAsync("profile/me")).StatusCode == HttpStatusCode.Unauthorized, "profile rejects anonymous HTTP requests");
        client.DefaultRequestHeaders.Add("X-SCMS-Session", Guid.NewGuid().ToString("N"));
        var login = await client.PostAsJsonAsync("auth/login", new { email = "merge-audit-admin@example.test", password });
        Check(login.IsSuccessStatusCode, "real admin login works after PostgreSQL bootstrap");
        Check(login.Headers.TryGetValues("Set-Cookie", out var cookies) && cookies.Any(c => c.Contains("httponly", StringComparison.OrdinalIgnoreCase)), "browser login issues an HttpOnly session cookie");
        Check((await client.GetAsync("profile/me")).IsSuccessStatusCode, "cookie and per-tab session selector authorize profile");
        Check((await client.GetAsync("media/files?folder=dashboard")).IsSuccessStatusCode, "dashboard catalog endpoint retains legacy media after merge");
        client.DefaultRequestHeaders.Remove("X-SCMS-Session");
        Check((await client.GetAsync("profile/me")).StatusCode == HttpStatusCode.Unauthorized, "cookie alone cannot bypass the session selector");
    }
    finally
    {
        if (!apiProcess.HasExited) apiProcess.Kill(entireProcessTree: true);
        await apiProcess.WaitForExitAsync();
    }
    Console.WriteLine($"PostgreSQL merge audit: {checks} checks passed.");
}
finally
{
    // Only the uniquely named database created by this process may be removed.
    if (!database.StartsWith("scms_merge_audit_") || database.Length != "scms_merge_audit_".Length + 32) throw new InvalidOperationException("Unexpected audit database name");
    await using var drop = new NpgsqlCommand($"DROP DATABASE {database} WITH (FORCE)", admin);
    await drop.ExecuteNonQueryAsync();
}

public class AuditS3 : DispatchProxy
{
    protected override object? Invoke(MethodInfo? method, object?[]? args) => method?.Name switch
    {
        "PutObjectAsync" => Task.FromResult(new PutObjectResponse { HttpStatusCode = HttpStatusCode.OK }),
        "DeleteObjectAsync" => Task.FromResult(new DeleteObjectResponse { HttpStatusCode = HttpStatusCode.NoContent }),
        "Dispose" => null,
        _ => throw new NotSupportedException("Unexpected S3 operation: " + method?.Name)
    };
}
sealed class AuditHttpFactory : IHttpClientFactory { public HttpClient CreateClient(string name) => new(); }
