using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using SportsCenterManagement.DAL.Context;
using Xunit;

namespace SportsCenterManagement.Tests;

public sealed class SqlServerFactAttribute : FactAttribute
{
    public SqlServerFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("SCMS_TEST_SQL_CONNECTION")))
            Skip = "Set SCMS_TEST_SQL_CONNECTION to run against an isolated database on SQL Server.";
    }
}

public sealed class SqlServerPersistenceTests : IAsyncLifetime
{
    private readonly string databaseName = "SCMS_Persistence_Test_" + Guid.NewGuid().ToString("N");
    private string connectionString = "";
    private SqlPersistenceFactory? application;

    private SportsCenterDbContext OpenDatabase() => new(new DbContextOptionsBuilder<SportsCenterDbContext>()
        .UseSqlServer(connectionString).Options);

    public Task InitializeAsync()
    {
        var configured = Environment.GetEnvironmentVariable("SCMS_TEST_SQL_CONNECTION");
        if (string.IsNullOrWhiteSpace(configured)) return Task.CompletedTask;
        connectionString = new SqlConnectionStringBuilder(configured) { InitialCatalog = databaseName }.ConnectionString;
        application = new SqlPersistenceFactory(connectionString);
        return Task.CompletedTask;
    }

    [SqlServerFact]
    public async Task AccountAndBusinessEditsRemainInSqlAfterRestartAndLoginFromAnotherClient()
    {
        using var firstClient = application!.CreateClient();
        long centerId, packageId;
        await using (var db = OpenDatabase())
        {
            Assert.Equal("Microsoft.EntityFrameworkCore.SqlServer", db.Database.ProviderName);
            centerId = await db.Centers.Select(item => item.Id).FirstAsync();
            packageId = await db.MembershipPackages.Select(item => item.Id).FirstAsync();
        }
        const string email = "persistent@example.test";
        const string password = "Test@Password123!";
        const string newPassword = "Changed@Password456!";
        await Request(firstClient, HttpMethod.Post, "/api/auth/register", new
        {
            username = "persistent_member", email, password, fullName = "Hội viên SQL", centerId
        }, HttpStatusCode.Created);
        await Login(firstClient, email, password);
        await Request(firstClient, HttpMethod.Patch, "/api/profile/me", new { fullName = "Hồ sơ lưu SQL", phone = "0934567891" });
        await Request(firstClient, HttpMethod.Post, "/api/auth/change-password", new { currentPassword = password, newPassword });
        long memberId;
        await using (var db = OpenDatabase())
        {
            var user = await db.Users.SingleAsync(item => item.Email == email);
            Assert.Equal("0934567891", user.Phone);
            Assert.NotEqual(newPassword, user.PasswordHash);
            var profile = await db.MemberProfiles.SingleAsync(item => item.UserId == user.Id);
            memberId = profile.Id;
            Assert.Equal("Hồ sơ lưu SQL", profile.FullName);
            Assert.Equal(centerId, profile.CenterId);
        }

        using var manager = application.CreateClient();
        await Login(manager, "manager01@sportscenter.vn", "Manager@123456");
        await Request(manager, HttpMethod.Put, $"/api/centers/{centerId}/membership-packages/{packageId}", new
        {
            name = "Gói đã lưu SQL", description = "Mô tả đã lưu", durationDays = 47, price = 1234567,
            maxClasses = 3, accessType = "3 môn", allowedSports = 3, badge = "SQL", features = new[] { "Đã ghi SQL" }
        });
        await Request(manager, HttpMethod.Patch, $"/api/centers/{centerId}/membership-packages/{packageId}/status", new { status = "Inactive" });
        var room = await Request(manager, HttpMethod.Post, $"/api/centers/{centerId}/rooms", new
        {
            name = "Phòng mới SQL", type = "Studio", capacity = 20, location = "Tầng kiểm thử"
        }, HttpStatusCode.Created);
        var roomId = room.GetProperty("id").GetInt64();
        await Request(manager, HttpMethod.Put, $"/api/centers/{centerId}/rooms/{roomId}", new
        {
            name = "Phòng sửa SQL", type = "Studio mới", capacity = 18, location = "Vị trí đã sửa"
        });
        var sport = await Request(manager, HttpMethod.Post, $"/api/centers/{centerId}/sports", new
        {
            name = "Bộ môn SQL", description = "Mô tả mới", status = "Active"
        }, HttpStatusCode.Created);
        var sportId = sport.GetProperty("id").GetInt64();
        await Request(manager, HttpMethod.Put, $"/api/centers/{centerId}/sports/{sportId}", new
        {
            name = "Bộ môn sửa SQL", description = "Mô tả đã sửa", status = "Active"
        });
        var cls = await Request(manager, HttpMethod.Post, "/api/classes", new
        {
            centerId, sportId, roomId, name = "Lớp SQL", description = "Lớp mới", level = "Beginner", capacity = 15, durationMinutes = 60, allowWaitlist = true
        }, HttpStatusCode.Created);
        var classId = cls.GetProperty("id").GetInt64();
        await Request(manager, HttpMethod.Put, $"/api/classes/{classId}", new
        {
            sportId, roomId, name = "Lớp sửa SQL", description = "Mô tả đã sửa", level = "Intermediate", capacity = 12, durationMinutes = 45, allowWaitlist = false
        });
        var support = await Request(manager, HttpMethod.Post, $"/api/centers/{centerId}/support-requests", new
        {
            memberId, subject = "Yêu cầu xử lý ngoại lệ check-in", description = "Lý do: kiểm tra thẻ; chưa mở cổng.", priority = "High"
        });
        var supportId = support.GetProperty("request").GetProperty("id").GetInt64();
        await Request(manager, HttpMethod.Patch, $"/api/centers/{centerId}/support-requests/{supportId}", new
        {
            status = "InProgress", note = "Ghi chú xử lý đã lưu SQL"
        });
        await Request(manager, HttpMethod.Post, $"/api/centers/{centerId}/staff", new
        {
            username = "sql_coach", email = "coach.sql@example.test", password = "Coach@Password123!", fullName = "HLV SQL",
            roleName = "Coach", phone = "0934567892", hireDate = "2026-10-01", specialization = "Bơi", experienceYears = 2,
            sportIds = new[] { sportId }
        }, HttpStatusCode.Created);
        long staffId;
        await using (var db = OpenDatabase()) staffId = await db.Users.Where(item => item.Email == "coach.sql@example.test").Select(item => item.Id).SingleAsync();
        await Request(manager, HttpMethod.Patch, $"/api/centers/{centerId}/staff/{staffId}", new
        {
            fullName = "HLV đã sửa SQL", email = "coach.edited@example.test", phone = "0934567892", status = "Active",
            roleName = "Coach", specialization = "Gym", certification = "Chứng nhận SQL", experienceYears = 4, bio = "Hồ sơ SQL",
            sportIds = new[] { sportId }
        });
        await using (var db = OpenDatabase())
        {
            var editedPackage = await db.MembershipPackages.SingleAsync(item => item.Id == packageId);
            Assert.Equal(1234567m, editedPackage.Price);
            Assert.Equal("Inactive", editedPackage.Status);
            Assert.Contains("Đã ghi SQL", JsonSerializer.Deserialize<string[]>(editedPackage.Features!)!);
            Assert.Equal("Phòng sửa SQL", (await db.Rooms.SingleAsync(item => item.Id == roomId)).Name);
            Assert.Equal("Bộ môn sửa SQL", (await db.Sports.SingleAsync(item => item.Id == sportId)).Name);
            Assert.Equal(12, (await db.Classes.SingleAsync(item => item.Id == classId)).Capacity);
            Assert.Equal("InProgress", (await db.SupportRequests.SingleAsync(item => item.Id == supportId)).Status);
            Assert.Equal("Ghi chú xử lý đã lưu SQL", (await db.SupportRequestMessages.SingleAsync(item => item.RequestId == supportId)).Message);
            Assert.Equal("HLV đã sửa SQL", (await db.CoachProfiles.SingleAsync(item => item.UserId == staffId)).FullName);
            Assert.Equal(4, (await db.CoachProfiles.SingleAsync(item => item.UserId == staffId)).ExperienceYears);
            Assert.True(await db.AuditLogs.AnyAsync(item => item.EntityId == supportId && item.Action == "Support.Created"));
        }

        // A new backend process and independent client share SQL, not browser memory.
        await application.DisposeAsync();
        application = new SqlPersistenceFactory(connectionString);
        using var otherDevice = application.CreateClient();
        await Login(otherDevice, email, newPassword);
        var profileOnOtherDevice = await Request(otherDevice, HttpMethod.Get, "/api/profile/me");
        Assert.Equal("Hồ sơ lưu SQL", profileOnOtherDevice.GetProperty("fullName").GetString());
        Assert.Equal("0934567891", profileOnOtherDevice.GetProperty("phone").GetString());
        await Login(otherDevice, "manager01@sportscenter.vn", "Manager@123456");
        var packages = await Request(otherDevice, HttpMethod.Get, $"/api/centers/{centerId}/membership-packages/all");
        var packageOnOtherDevice = packages.EnumerateArray().Single(item => item.GetProperty("id").GetInt64() == packageId);
        Assert.Equal("Gói đã lưu SQL", packageOnOtherDevice.GetProperty("name").GetString());
        Assert.Equal(1234567m, packageOnOtherDevice.GetProperty("price").GetDecimal());
        Assert.Equal("Inactive", packageOnOtherDevice.GetProperty("status").GetString());
        await using (var db = OpenDatabase())
        {
            Assert.Equal("Phòng sửa SQL", (await db.Rooms.SingleAsync(item => item.Id == roomId)).Name);
            Assert.Equal("Bộ môn sửa SQL", (await db.Sports.SingleAsync(item => item.Id == sportId)).Name);
            Assert.Equal("Lớp sửa SQL", (await db.Classes.SingleAsync(item => item.Id == classId)).Name);
            Assert.Equal("InProgress", (await db.SupportRequests.SingleAsync(item => item.Id == supportId)).Status);
            Assert.Equal("coach.edited@example.test", (await db.Users.SingleAsync(item => item.Id == staffId)).Email);
        }
    }

    [SqlServerFact]
    public async Task FourOperationalRolesCanLoadTheirFrontendApiDataFromSqlServer()
    {
        using var client = application!.CreateClient();
        long centerId;
        await using (var db = OpenDatabase()) centerId = await db.Centers.Select(center => center.Id).FirstAsync();
        var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7)).ToString("yyyy-MM-dd");
        var query = $"from={today}&to={today}&groupBy=day&centerId={centerId}";
        var center = $"/api/centers/{centerId}";
        var accounts = new[]
        {
            (Role: "MANAGER", Email: "manager01@sportscenter.vn", Password: "Manager@123456"),
            (Role: "RECEPTIONIST", Email: "reception01@sportscenter.vn", Password: "Reception@123456"),
            (Role: "COACH", Email: "coach01@sportscenter.vn", Password: "Coach@123456"),
            (Role: "MEMBER", Email: "member01@sportscenter.vn", Password: "Member@123456")
        };

        foreach (var account in accounts)
        {
            await Login(client, account.Email, account.Password);
            var endpoints = new List<string>
            {
                "/api/profile/me", "/api/access/me/capabilities", "/api/notifications/me",
                $"{center}/membership-packages{(account.Role == "MANAGER" ? "/all" : "")}",
            };
            if (account.Role == "MANAGER")
            {
                endpoints.AddRange(new[]
                {
                    $"{center}/members", $"{center}/staff", $"{center}/classes/all", $"{center}/rooms",
                    $"{center}/sports", $"{center}/sports/all", $"{center}/coaches",
                    $"/api/reports/revenue?{query}", $"/api/reports/revenue-by-sport?{query}",
                    $"/api/reports/membership?{query}", $"/api/reports/classes?{query}",
                    $"/api/reports/checkins?{query}",
                    $"{center}/audit-logs", $"{center}/roles"
                });
            }
            if (account.Role == "RECEPTIONIST") endpoints.AddRange(new[]
            {
                $"{center}/members?query=member", $"{center}/invoices", $"{center}/support-requests",
                $"{center}/checkins/today", $"{center}/checkins/summary", $"/api/class-sessions?{query}"
            });
            if (account.Role == "COACH") endpoints.AddRange(new[]
            {
                "/api/coaches/me/classes", $"/api/coaches/me/teaching-schedule?{query}",
                "/api/coaches/me/training-plans", "/api/coaches/me/progress", "/api/coaches/me/notifications"
            });
            if (account.Role == "MEMBER") endpoints.AddRange(new[]
            {
                "/api/members/me", $"/api/class-sessions?{query}", "/api/members/me/session-bookings",
                "/api/members/me/session-waitlist", "/api/members/me/progress", "/api/members/me/training-plans",
                "/api/payments/my-pending-invoices"
            });
            foreach (var endpoint in endpoints) await Request(client, HttpMethod.Get, endpoint);
        }
    }

    private static async Task Login(HttpClient client, string email, string password)
    {
        client.DefaultRequestHeaders.Authorization = null;
        var auth = await Request(client, HttpMethod.Post, "/api/auth/login", new { email, password });
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.GetProperty("accessToken").GetString());
    }

    private static async Task<JsonElement> Request(HttpClient client, HttpMethod method, string path, object? body = null,
        HttpStatusCode expected = HttpStatusCode.OK)
    {
        using var request = new HttpRequestMessage(method, path);
        if (body is not null) request.Content = JsonContent.Create(body);
        using var response = await client.SendAsync(request);
        var text = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == expected, $"{method} {path}: expected {(int)expected}, got {(int)response.StatusCode}. {text}");
        return JsonSerializer.Deserialize<JsonElement>(text);
    }

    public async Task DisposeAsync()
    {
        if (application is not null) await application.DisposeAsync();
        if (string.IsNullOrEmpty(connectionString)) return;
        // This test may only delete its own generated database, never the application database.
        var target = new SqlConnectionStringBuilder(connectionString).InitialCatalog;
        if (target != databaseName || !target.StartsWith("SCMS_Persistence_Test_", StringComparison.Ordinal))
            throw new InvalidOperationException("Refusing to delete a database outside the test scope.");
        SqlConnection.ClearAllPools();
        await using var db = OpenDatabase();
        await db.Database.EnsureDeletedAsync();
    }
}

internal sealed class SqlPersistenceFactory(string connectionString) : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseContentRoot(Path.GetFullPath(Path.Combine(Path.GetDirectoryName(SourcePath())!, "../SportsCenterManagement.API")));
        builder.UseEnvironment("Development");
        builder.UseSetting("ConnectionStrings:SportsCenter", connectionString);
        builder.UseSetting("Database:BaselineLegacySchema", "false");
        builder.UseSetting("Database:SeedDemoData", "true");
        builder.UseSetting("Jwt:Key", "test-only-sql-persistence-key-at-least-32-bytes");
        builder.UseSetting("Bootstrap:SystemAdmin:Username", "sql-test-admin");
        builder.UseSetting("Bootstrap:SystemAdmin:Email", "sql.admin@example.test");
        builder.UseSetting("Bootstrap:SystemAdmin:Password", "Test@Password123!");
        if (!new SqlConnectionStringBuilder(connectionString).InitialCatalog.StartsWith("SCMS_Persistence_Test_", StringComparison.Ordinal))
            throw new InvalidOperationException("The persistence fixture requires its own test database.");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<SportsCenterDbContext>();
            services.RemoveAll<DbContextOptions<SportsCenterDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<SportsCenterDbContext>>();
            services.AddDbContext<SportsCenterDbContext>(options => options.UseSqlServer(connectionString));
        });
        builder.ConfigureLogging(logging => logging.ClearProviders().AddConsole().SetMinimumLevel(LogLevel.Error));
    }

    private static string SourcePath([CallerFilePath] string path = "") => path;
}
