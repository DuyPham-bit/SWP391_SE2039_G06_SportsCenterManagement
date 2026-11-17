using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SportsCenterManagement.BLL.Exceptions;
using SportsCenterManagement.BLL.Services;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;

namespace SportsCenterManagement.Tests;

/// <summary>
/// Homepage content keeps reading images and sport descriptions from the database, as in v1.5:
/// legacy "mediaId" references resolve through uploaded_media, and a sport card linked by "sportId"
/// shows (and edits) sports.description.
/// </summary>
public sealed class LandingContentDbSourceTests
{
    private const string Domain = "https://cdn.test";

    // Shape stored by v1.5: media referenced by id, sport cards linked by string sportId, no highlight copy.
    private const string LegacyContent = """
        {"heroBanner":{},"whyUs":{},"zonesLayout":{},"ctaAndFooter":{},
         "coursesSection":{"sportsList":[{"id":"c1","name":"Bơi","sportId":"1","mediaId":5}]},
         "facilitiesSection":{"facilitiesList":[{"id":"f1","name":"Hồ bơi","description":"Hồ bơi 4 làn","mediaId":5,"secondaryMediaId":6}]}}
        """;

    private static LandingContentService Service(SportsCenterDbContext db) => new(db,
        new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["R2Storage:PublicDomain"] = Domain }).Build());

    private static JsonElement Json(string json) => JsonDocument.Parse(json).RootElement.Clone();

    private static SportsCenterDbContext Seed(string content = LegacyContent)
    {
        var db = TestDb.Create();
        db.SystemSettings.Add(new SystemSetting { SettingKey = "site.landing-content", SettingValue = content, UpdatedAt = TestDb.Now });
        db.UploadedMedias.AddRange(
            new UploadedMedia { Id = 5, DriveFileId = "r2:dashboard/2026/11/pool.jpg", FileName = "pool.jpg", MimeType = "image/jpeg", FileUrl = "" },
            new UploadedMedia { Id = 6, DriveFileId = "", FileName = "lane.jpg", MimeType = "image/jpeg", FileUrl = $"{Domain}/dashboard/2026/11/lane.jpg" });
        db.Centers.Add(new Center { Id = 1, Name = "Center", Address = "A", Status = "Active", CreatedAt = TestDb.Now });
        db.Sports.Add(new Sport { Id = 1, CenterId = 1, Name = "Bơi lội", Description = "Học bơi 4 kiểu", Status = "Active" });
        db.Roles.Add(new Role { Id = 2, Name = "Manager", CreatedAt = TestDb.Now });
        db.Users.Add(new User { Id = 10, Username = "m", Email = "m@test", PasswordHash = "x", RoleId = 2, Status = "Active", CreatedAt = TestDb.Now });
        db.StaffProfiles.Add(new StaffProfile { UserId = 10, CenterId = 1, StaffCode = "S1", FullName = "M", Position = "Manager", Status = "Active", CreatedAt = TestDb.Now });
        db.SaveChanges();
        return db;
    }

    private static JsonElement Facility(JsonElement content) => content.GetProperty("facilitiesSection").GetProperty("facilitiesList")[0];
    private static JsonElement Card(JsonElement content) => content.GetProperty("coursesSection").GetProperty("sportsList")[0];

    [Fact]
    public async Task GetAsync_ResolvesLegacyMediaIdsToPublicImageUrls()
    {
        using var db = Seed();
        var content = (await Service(db).GetAsync(default)).Content!.Value;

        Assert.Equal($"{Domain}/dashboard/2026/11/pool.jpg", Facility(content).GetProperty("image").GetString());
        Assert.Equal($"{Domain}/dashboard/2026/11/lane.jpg", Facility(content).GetProperty("secondaryImage").GetString());
        Assert.Equal($"{Domain}/dashboard/2026/11/pool.jpg", Card(content).GetProperty("image").GetString());
        Assert.False(Facility(content).TryGetProperty("mediaId", out _));
        Assert.Equal("Hồ bơi 4 làn", Facility(content).GetProperty("description").GetString());
    }

    [Fact]
    public async Task GetAsync_FillsLinkedSportCardHighlightFromSportsTable()
    {
        using var db = Seed();
        var content = (await Service(db).GetAsync(default)).Content!.Value;

        Assert.Equal("Học bơi 4 kiểu", Card(content).GetProperty("highlight").GetString());
    }

    [Fact]
    public async Task GetDraftAsync_AlsoResolvesMediaAndSportDescriptions()
    {
        using var db = Seed();
        db.SystemSettings.Add(new SystemSetting { SettingKey = "site.landing-content.draft", SettingValue = LegacyContent, UpdatedAt = TestDb.Now });
        db.SaveChanges();
        var content = (await Service(db).GetDraftAsync(default)).Content!.Value;

        Assert.Equal($"{Domain}/dashboard/2026/11/pool.jpg", Facility(content).GetProperty("image").GetString());
        Assert.Equal("Học bơi 4 kiểu", Card(content).GetProperty("highlight").GetString());
    }

    [Fact]
    public async Task SaveAsync_AcceptsLegacyContentInsteadOfRejectingNumericIds()
    {
        using var db = Seed();
        var saved = await Service(db).SaveAsync(Json(LegacyContent), 10, default);

        Assert.Equal($"{Domain}/dashboard/2026/11/pool.jpg", Facility(saved.Content!.Value).GetProperty("image").GetString());
    }

    [Fact]
    public async Task SaveAsync_WritesEditedSportHighlightBackToSportsTable()
    {
        using var db = Seed();
        var service = Service(db);
        var edited = LegacyContent.Replace("\"sportId\":\"1\"", "\"sportId\":\"1\",\"highlight\":\"Bơi sải chuẩn Olympic\"");

        var saved = await service.SaveAsync(Json(edited), 10, default);

        Assert.Equal("Bơi sải chuẩn Olympic", (await db.Sports.SingleAsync(s => s.Id == 1)).Description);
        Assert.Equal("Bơi sải chuẩn Olympic", Card(saved.Content!.Value).GetProperty("highlight").GetString());
        // The sports table stays the single source: no copy kept in the stored JSON.
        Assert.DoesNotContain("Bơi sải chuẩn Olympic", (await db.SystemSettings.SingleAsync(s => s.SettingKey == "site.landing-content")).SettingValue);
    }

    [Fact]
    public async Task SaveAsync_BlankHighlightNeverWipesTheStoredDescription()
    {
        using var db = Seed();
        await Service(db).SaveAsync(Json(LegacyContent.Replace("\"sportId\":\"1\"", "\"sportId\":\"1\",\"highlight\":\"\"")), 10, default);

        Assert.Equal("Học bơi 4 kiểu", (await db.Sports.SingleAsync(s => s.Id == 1)).Description);
    }

    [Fact]
    public async Task SaveAsync_ManagerOfAnotherCenterCannotEditTheSportDescription()
    {
        using var db = Seed();
        db.StaffProfiles.Single().CenterId = 99;
        db.SaveChanges();
        var edited = LegacyContent.Replace("\"sportId\":\"1\"", "\"sportId\":\"1\",\"highlight\":\"Đổi trái phép\"");

        var error = await Assert.ThrowsAsync<FlowException>(() => Service(db).SaveAsync(Json(edited), 10, default));

        Assert.Equal(403, error.StatusCode);
        Assert.Equal("Học bơi 4 kiểu", (await db.Sports.SingleAsync(s => s.Id == 1)).Description);
    }
}
