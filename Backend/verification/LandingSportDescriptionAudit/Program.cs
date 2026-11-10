// Kiểm thử mô tả bộ môn trên trang chủ trên SQLite in-memory (không cần PostgreSQL):
// thẻ liên kết sportId đọc mô tả từ bảng sports, và trình sửa landing lưu ngược mô tả vào bảng đó.
// Chạy: dotnet run --project Backend/verification/LandingSportDescriptionAudit
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SportsCenterManagement.BLL.Exceptions;
using SportsCenterManagement.BLL.Services;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;

var failures = new List<string>();
var checks = 0;
var config = new ConfigurationBuilder()
    .AddInMemoryCollection(new Dictionary<string, string?> { ["R2Storage:PublicDomain"] = "https://media.example.test" })
    .Build();

async Task Check(string name, Func<Fixture, Task<bool>> assertion)
{
    checks++;
    await using var f = await NewFixture();
    try
    {
        if (!await assertion(f)) throw new InvalidOperationException("Assertion failed");
        Console.WriteLine("PASS " + name);
    }
    catch (Exception exception)
    {
        failures.Add(name + ": " + exception.Message);
        Console.WriteLine("FAIL " + name + ": " + exception.GetType().Name + " " + exception.Message);
    }
}

// Mỗi kịch bản dùng một database riêng để dữ liệu không ảnh hưởng nhau.
async Task<Fixture> NewFixture()
{
    var connection = new SqliteConnection("Data Source=:memory:");
    await connection.OpenAsync();
    var db = new SportsCenterDbContext(new DbContextOptionsBuilder<SportsCenterDbContext>().UseSqlite(connection).Options);
    await db.Database.EnsureCreatedAsync();
    var now = DateTime.UtcNow;
    var role = new Role { Name = "Manager", CreatedAt = now };
    db.Roles.Add(role);
    await db.SaveChangesAsync();
    var manager = new User { Username = "manager", Email = "manager@example.test", PasswordHash = "x", RoleId = role.Id, Status = "Active", CreatedAt = now };
    var centerA = new Center { Name = "A", Address = "A", Status = "Active", CreatedAt = now };
    var centerB = new Center { Name = "B", Address = "B", Status = "Active", CreatedAt = now };
    db.Users.Add(manager);
    db.Centers.AddRange(centerA, centerB);
    await db.SaveChangesAsync();
    var swim = new Sport { CenterId = centerA.Id, Name = "Bơi lội", Description = "Mô tả cũ", Status = "Active" };
    var golf = new Sport { CenterId = centerB.Id, Name = "Golf", Description = "Mô tả trung tâm B", Status = "Active" };
    var shared = new Sport { CenterId = null, Name = "Chung", Description = "Mô tả dùng chung", Status = "Active" };
    db.Sports.AddRange(swim, golf, shared);
    await db.SaveChangesAsync();
    var content = new JsonObject
    {
        ["heroBanner"] = new JsonObject(), ["whyUs"] = new JsonObject(),
        ["coursesSection"] = new JsonObject
        {
            ["sportsList"] = new JsonArray(
                new JsonObject { ["id"] = "swimming", ["name"] = "Bơi lội", ["sportId"] = swim.Id.ToString() },
                new JsonObject { ["id"] = "tennis", ["name"] = "Tennis", ["highlight"] = "Mô tả Tennis riêng" },
                new JsonObject { ["id"] = "golf", ["name"] = "Golf", ["sportId"] = golf.Id.ToString() },
                new JsonObject { ["id"] = "shared", ["name"] = "Chung", ["sportId"] = shared.Id.ToString() })
        },
        ["facilitiesSection"] = new JsonObject(), ["zonesLayout"] = new JsonObject(), ["ctaAndFooter"] = new JsonObject()
    };
    db.SystemSettings.Add(new SystemSetting { SettingKey = "site.landing-content", SettingValue = content.ToJsonString() });
    await db.SaveChangesAsync();
    db.ChangeTracker.Clear();
    return new Fixture(connection, db, new LandingContentService(db, config), manager, centerA, centerB, swim, golf, shared);
}

async Task<JsonObject> Published(Fixture f) =>
    JsonNode.Parse((await f.Service.GetAsync(default)).Content!.Value.GetRawText())!.AsObject();

JsonObject CardOf(JsonNode content, string id) =>
    content["coursesSection"]!["sportsList"]!.AsArray().Single(card => (string?)card!["id"] == id)!.AsObject();

async Task<JsonObject> StoredCard(Fixture f, string id)
{
    var json = await f.Db.SystemSettings.AsNoTracking().Where(s => s.SettingKey == "site.landing-content")
        .Select(s => s.SettingValue).SingleAsync();
    return CardOf(JsonNode.Parse(json!)!, id);
}

Task<string?> Description(Fixture f, Sport sport) =>
    f.Db.Sports.AsNoTracking().Where(s => s.Id == sport.Id).Select(s => s.Description).SingleAsync();

Task<int> SportAudits(Fixture f) => f.Db.AuditLogs.AsNoTracking().CountAsync(a => a.Action == "SPORT.UPDATED");

Task Save(Fixture f, JsonNode content, Func<long, CancellationToken, Task> ensureCenterAccess) =>
    f.Service.SaveAsync(JsonSerializer.SerializeToElement(content), f.Manager.Id, ensureCenterAccess, default);

async Task<int?> StatusOf(Func<Task> action)
{
    try { await action(); return null; }
    catch (FlowException exception) { return exception.StatusCode; }
}

Func<long, CancellationToken, Task> Recorder(List<long> calls) => (centerId, _) => { calls.Add(centerId); return Task.CompletedTask; };
Func<long, CancellationToken, Task> Deny() => (_, _) => throw FlowException.Forbidden("Không có quyền");

await Check("đọc trang chủ: thẻ liên kết lấy mô tả từ bảng sports, thẻ chưa liên kết giữ nội dung riêng", async f =>
{
    var content = await Published(f);
    return (string?)CardOf(content, "swimming")["highlight"] == "Mô tả cũ"
        && (string?)CardOf(content, "golf")["highlight"] == "Mô tả trung tâm B"
        && (string?)CardOf(content, "tennis")["highlight"] == "Mô tả Tennis riêng";
});

await Check("sửa mô tả trong trình sửa landing: lưu vào sports, ghi audit, JSON không giữ bản sao", async f =>
{
    var content = await Published(f);
    CardOf(content, "swimming")["highlight"] = "  Mô tả mới cho bơi lội  ";
    var calls = new List<long>();
    await Save(f, content, Recorder(calls));
    var stored = await StoredCard(f, "swimming");
    var republished = await Published(f);
    return await Description(f, f.Swim) == "Mô tả mới cho bơi lội"
        && calls.SequenceEqual([f.CenterA.Id])
        && await SportAudits(f) == 1
        && stored["highlight"] is null && (string?)stored["sportId"] == f.Swim.Id.ToString()
        && (string?)(await StoredCard(f, "tennis"))["highlight"] == "Mô tả Tennis riêng"
        && (string?)CardOf(republished, "swimming")["highlight"] == "Mô tả mới cho bơi lội";
});

await Check("lưu lại nội dung không đổi mô tả: không kiểm tra quyền, không sửa bộ môn", async f =>
{
    var calls = new List<long>();
    await Save(f, await Published(f), Recorder(calls));
    return calls.Count == 0 && await SportAudits(f) == 0
        && await Description(f, f.Swim) == "Mô tả cũ" && await Description(f, f.Golf) == "Mô tả trung tâm B"
        && await Description(f, f.Shared) == "Mô tả dùng chung";
});

await Check("thẻ liên kết thiếu hoặc để trống mô tả không xoá mô tả trong bảng sports", async f =>
{
    var content = await Published(f);
    CardOf(content, "swimming").Remove("highlight");
    CardOf(content, "golf")["highlight"] = "   ";
    await Save(f, content, Deny());
    return await Description(f, f.Swim) == "Mô tả cũ" && await Description(f, f.Golf) == "Mô tả trung tâm B"
        && await SportAudits(f) == 0;
});

await Check("liên kết tới bộ môn không tồn tại hoặc sportId sai định dạng bị từ chối", async f =>
{
    var missing = await Published(f);
    CardOf(missing, "swimming")["sportId"] = "999999";
    var malformed = await Published(f);
    CardOf(malformed, "swimming")["sportId"] = "abc";
    return await StatusOf(() => Save(f, missing, Recorder([]))) == 400
        && await StatusOf(() => Save(f, malformed, Recorder([]))) == 400
        && (string?)(await StoredCard(f, "swimming"))["sportId"] == f.Swim.Id.ToString();
});

await Check("mô tả quá 500 ký tự bị từ chối và không lưu gì", async f =>
{
    var content = await Published(f);
    CardOf(content, "swimming")["highlight"] = new string('a', 501);
    return await StatusOf(() => Save(f, content, Recorder([]))) == 400
        && await Description(f, f.Swim) == "Mô tả cũ" && await SportAudits(f) == 0;
});

await Check("không có quyền ở trung tâm của bộ môn: từ chối cả lần lưu, không sửa bộ môn nào", async f =>
{
    var content = await Published(f);
    CardOf(content, "swimming")["highlight"] = "Đổi mô tả A";
    CardOf(content, "golf")["highlight"] = "Đổi mô tả B";
    Func<long, CancellationToken, Task> onlyA = (centerId, _) =>
        centerId == f.CenterA.Id ? Task.CompletedTask : throw FlowException.Forbidden("Không có quyền");
    return await StatusOf(() => Save(f, content, onlyA)) == 403
        && await Description(f, f.Swim) == "Mô tả cũ" && await Description(f, f.Golf) == "Mô tả trung tâm B"
        && await SportAudits(f) == 0;
});

await Check("bộ môn dùng chung (không thuộc trung tâm) không sửa mô tả từ trang chủ", async f =>
{
    var content = await Published(f);
    CardOf(content, "shared")["highlight"] = "Đổi mô tả dùng chung";
    return await StatusOf(() => Save(f, content, Recorder([]))) == 403
        && await Description(f, f.Shared) == "Mô tả dùng chung";
});

await Check("bỏ liên kết: thẻ giữ nội dung giới thiệu riêng, bộ môn không bị sửa", async f =>
{
    var content = await Published(f);
    CardOf(content, "swimming")["sportId"] = "";
    var calls = new List<long>();
    await Save(f, content, Recorder(calls));
    return (string?)(await StoredCard(f, "swimming"))["highlight"] == "Mô tả cũ"
        && await Description(f, f.Swim) == "Mô tả cũ" && calls.Count == 0;
});

Console.WriteLine($"{checks - failures.Count}/{checks} checks passed");
return failures.Count == 0 ? 0 : 1;

sealed record Fixture(SqliteConnection Connection, SportsCenterDbContext Db, LandingContentService Service, User Manager,
    Center CenterA, Center CenterB, Sport Swim, Sport Golf, Sport Shared) : IAsyncDisposable
{
    public async ValueTask DisposeAsync()
    {
        await Db.DisposeAsync();
        await Connection.DisposeAsync();
    }
}
