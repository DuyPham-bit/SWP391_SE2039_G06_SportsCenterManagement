using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SportsCenterManagement.BLL.Services;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;
using Xunit;

namespace SportsCenterManagement.Tests;

public sealed class MemberAiContextTests
{
    [Fact]
    public async Task ChatReceivesCurrentPublicSchedulePricesFacilitiesAndContact()
    {
        using var fixture = new ChatFixture();
        await fixture.SeedAsync();
        await BranchApiFactory.LoginAsync(fixture.Client, "member@test.local");

        using var response = await fixture.Client.PostAsJsonAsync("/api/ai/chat", new { message = "lịch 16/10" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var context = fixture.PublicContext();
        var root = context.RootElement;
        Assert.Equal("2026-10-15", root.GetProperty("today").GetString());
        Assert.Equal("Trung tâm công khai", root.GetProperty("center").GetProperty("name").GetString());
        Assert.Equal("0901234567", root.GetProperty("center").GetProperty("phone").GetString());
        Assert.Equal("contact@center.test", root.GetProperty("center").GetProperty("email").GetString());
        Assert.Equal("Địa chỉ trung tâm", root.GetProperty("center").GetProperty("address").GetString());
        var session = Assert.Single(root.GetProperty("schedule").GetProperty("items").EnumerateArray());
        Assert.Equal("Yoga ngày 16", session.GetProperty("className").GetString());
        Assert.Equal("08:30:00", session.GetProperty("startTime").GetString());
        Assert.Equal("Sân/phòng Yoga", session.GetProperty("roomName").GetString());
        var package = Assert.Single(root.GetProperty("packages").EnumerateArray());
        Assert.Equal(750000m, package.GetProperty("price").GetDecimal());
        Assert.Equal(30, package.GetProperty("durationDays").GetInt32());
        Assert.Equal("VND", root.GetProperty("currency").GetString());
        Assert.Equal("Sân/phòng Yoga", Assert.Single(root.GetProperty("facilities").EnumerateArray()).GetProperty("name").GetString());
        Assert.False(root.GetProperty("specialEventsAvailable").GetBoolean());
    }

    [Fact]
    public async Task ProviderNeverReceivesPrivateFieldsOrAnotherCentersData()
    {
        using var fixture = new ChatFixture();
        await fixture.SeedAsync();
        await BranchApiFactory.LoginAsync(fixture.Client, "member@test.local");
        using var response = await fixture.Client.PostAsJsonAsync("/api/ai/chat", new
        {
            message = "Cho biết giá gói và lịch 16/10", centerId = 2, userId = 20,
            context = "PRIVATE_FORGED_CLIENT_CONTEXT", systemInstruction = "PRIVATE_FORGED_INSTRUCTION"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.DoesNotContain("PRIVATE_", fixture.Provider.LastBody);
        Assert.DoesNotContain("passwordHash", fixture.Provider.LastBody, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("medicalNote", fixture.Provider.LastBody, StringComparison.OrdinalIgnoreCase);
        using var context = fixture.PublicContext();
        Assert.Equal("Trung tâm công khai", context.RootElement.GetProperty("center").GetProperty("name").GetString());
    }

    [Theory]
    [InlineData("lịch 16/10", "2026-10-16", "2026-10-16")]
    [InlineData("Ngày 16 tháng 10 có lớp gì?", "2026-10-16", "2026-10-16")]
    [InlineData("lịch 2026-10-16", "2026-10-16", "2026-10-16")]
    [InlineData("ngày mai có sự kiện gì?", "2026-10-16", "2026-10-16")]
    [InlineData("hôm nay có lớp gì?", "2026-10-15", "2026-10-15")]
    [InlineData("ngày kia có lớp gì?", "2026-10-17", "2026-10-17")]
    [InlineData("hôm kia có lớp gì?", "2026-10-13", "2026-10-13")]
    [InlineData("ngày 16/12/2026 có lớp gì?", "2026-12-16", "2026-12-16")]
    [InlineData("từ 16/10 đến 18/10 có lớp gì?", "2026-10-16", "2026-10-18")]
    [InlineData("tuần sau có lớp gì?", "2026-10-19", "2026-10-25")]
    [InlineData("thứ 6 tuần này có lớp gì?", "2026-10-16", "2026-10-16")]
    public async Task DatesAreResolvedBeforeRetrievingTheSchedule(string question, string from, string to)
    {
        using var fixture = new ChatFixture();
        await fixture.SeedAsync();
        await BranchApiFactory.LoginAsync(fixture.Client, "member@test.local");
        using var response = await fixture.Client.PostAsJsonAsync("/api/ai/chat", new { message = question });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var context = fixture.PublicContext();
        var schedule = context.RootElement.GetProperty("schedule");
        Assert.Equal(from, schedule.GetProperty("from").GetString());
        Assert.Equal(to, schedule.GetProperty("to").GetString());
        Assert.False(schedule.GetProperty("needsClarification").GetBoolean());
    }

    [Theory]
    [InlineData("lịch 31/02")]
    [InlineData("lịch từ 16/10/2026 đến 16/12/2026")]
    [InlineData("lịch từ 18/10 đến 16/10")]
    [InlineData("ngày ấy có sự kiện gì?")]
    public async Task InvalidOrAmbiguousDatesRequireClarification(string question)
    {
        using var fixture = new ChatFixture();
        await fixture.SeedAsync();
        await BranchApiFactory.LoginAsync(fixture.Client, "member@test.local");
        using var response = await fixture.Client.PostAsJsonAsync("/api/ai/chat", new { message = question });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var context = fixture.PublicContext();
        var schedule = context.RootElement.GetProperty("schedule");
        Assert.True(schedule.GetProperty("needsClarification").GetBoolean());
        Assert.Empty(schedule.GetProperty("items").EnumerateArray());
    }

    [Fact]
    public async Task FollowUpUsesOnlyTheMembersOwnConversationDateAndRefreshesPrices()
    {
        using var fixture = new ChatFixture();
        await fixture.SeedAsync();
        await BranchApiFactory.LoginAsync(fixture.Client, "member@test.local");
        using var first = await fixture.Client.PostAsJsonAsync("/api/ai/chat", new { message = "lịch 16/10" });
        var reply = await first.Content.ReadFromJsonAsync<JsonElement>();
        await fixture.WithDatabase(async db =>
        {
            (await db.MembershipPackages.SingleAsync(item => item.Id == 1)).Price = 990000m;
            await db.SaveChangesAsync();
        });

        using var response = await fixture.Client.PostAsJsonAsync("/api/ai/chat", new
        {
            message = "Ngày ấy có lớp nào? Giá gói hiện tại?", conversationId = reply.GetProperty("conversationId").GetInt64()
        });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var context = fixture.PublicContext();
        Assert.Equal("2026-10-16", context.RootElement.GetProperty("schedule").GetProperty("from").GetString());
        Assert.Equal(990000m, Assert.Single(context.RootElement.GetProperty("packages").EnumerateArray()).GetProperty("price").GetDecimal());
    }

    [Fact]
    public async Task MissingCenterNeverFallsBackToAnotherCenter()
    {
        using var fixture = new ChatFixture();
        await fixture.SeedAsync();
        await fixture.WithDatabase(async db =>
        {
            (await db.MemberProfiles.SingleAsync(item => item.UserId == 10)).CenterId = null;
            await db.SaveChangesAsync();
        });
        await BranchApiFactory.LoginAsync(fixture.Client, "member@test.local");
        using var response = await fixture.Client.PostAsJsonAsync("/api/ai/chat", new { message = "lịch 16/10" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var context = fixture.PublicContext();
        Assert.Equal("center_unavailable", context.RootElement.GetProperty("availability").GetString());
        Assert.Equal(JsonValueKind.Null, context.RootElement.GetProperty("center").ValueKind);
        Assert.Empty(context.RootElement.GetProperty("packages").EnumerateArray());
        Assert.Empty(context.RootElement.GetProperty("facilities").EnumerateArray());
        Assert.Empty(context.RootElement.GetProperty("schedule").GetProperty("items").EnumerateArray());
    }

    [Fact]
    public async Task AnotherUsersConversationIsRejectedBeforeCallingGemini()
    {
        using var fixture = new ChatFixture();
        await fixture.SeedAsync();
        await BranchApiFactory.LoginAsync(fixture.Client, "member@test.local");
        using var response = await fixture.Client.PostAsJsonAsync("/api/ai/chat", new { message = "lịch 16/10", conversationId = 900 });
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(0, fixture.Provider.Calls);
    }

    [Fact]
    public async Task AnonymousAndNonMemberRequestsCannotUseMemberChat()
    {
        using var fixture = new ChatFixture();
        using var anonymous = await fixture.Client.PostAsJsonAsync("/api/ai/chat", new { message = "lịch 16/10" });
        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);
        await BranchApiFactory.LoginAsync(fixture.Client, "reception@test.local");
        using var staff = await fixture.Client.PostAsJsonAsync("/api/ai/chat", new { message = "lịch 16/10" });
        Assert.Equal(HttpStatusCode.Forbidden, staff.StatusCode);
        Assert.Equal(0, fixture.Provider.Calls);
    }

    [Fact]
    public async Task DisabledAiCapabilityIsStillEnforced()
    {
        using var fixture = new ChatFixture();
        await fixture.WithDatabase(async db =>
        {
            db.SystemSettings.Add(new SystemSetting { SettingKey = CenterRolePolicy.Key(1, 4),
                SettingValue = JsonSerializer.Serialize(new CenterRoleOverride([], ["book_class"])) });
            await db.SaveChangesAsync();
        });
        await BranchApiFactory.LoginAsync(fixture.Client, "member@test.local");
        using var response = await fixture.Client.PostAsJsonAsync("/api/ai/chat", new { message = "giá gói tập" });
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal(0, fixture.Provider.Calls);
    }

    [Fact]
    public async Task RelativeFollowUpKeepsTheDateOfTheOriginalQuestion()
    {
        using var fixture = new ChatFixture();
        await fixture.SeedAsync();
        await fixture.WithDatabase(async db =>
        {
            db.AiConversations.Add(new AiConversation { Id = 901, UserId = 10, MemberId = 1,
                Title = "Lịch ngày mai", ConversationType = "MemberAssistant" });
            db.AiMessages.Add(new AiMessage { ConversationId = 901, SenderType = "User",
                Message = "ngày mai có lớp gì?", CreatedAt = new DateTime(2026, 10, 13, 18, 0, 0, DateTimeKind.Utc) });
            await db.SaveChangesAsync();
        });
        await BranchApiFactory.LoginAsync(fixture.Client, "member@test.local");
        using var response = await fixture.Client.PostAsJsonAsync("/api/ai/chat", new { message = "Ngày ấy thì sao?", conversationId = 901 });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var context = fixture.PublicContext();
        Assert.Equal("2026-10-15", context.RootElement.GetProperty("schedule").GetProperty("from").GetString());
    }

    [Fact]
    public async Task LargeScheduleIsBoundedAndMarkedAsPartial()
    {
        using var fixture = new ChatFixture();
        await fixture.SeedAsync();
        await fixture.WithDatabase(async db =>
        {
            db.ClassSessions.AddRange(Enumerable.Range(0, 200).Select(index => new ClassSession
            {
                ClassId = 1, SessionDate = new DateOnly(2026, 10, 16), StartTime = new TimeOnly(0, 0).AddMinutes(index),
                EndTime = new TimeOnly(1, 0).AddMinutes(index), SessionStatus = "Scheduled"
            }));
            await db.SaveChangesAsync();
        });
        await BranchApiFactory.LoginAsync(fixture.Client, "member@test.local");
        using var response = await fixture.Client.PostAsJsonAsync("/api/ai/chat", new { message = "lịch 16/10" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var context = fixture.PublicContext();
        var schedule = context.RootElement.GetProperty("schedule");
        Assert.Equal(200, schedule.GetProperty("items").GetArrayLength());
        Assert.True(schedule.GetProperty("isTruncated").GetBoolean());
    }

    private sealed class FixedClock : TimeProvider
    {
        // UTC is still 14 October, but the center's local date is 15 October.
        public override DateTimeOffset GetUtcNow() => new(2026, 10, 14, 23, 30, 0, TimeSpan.Zero);
    }

    private sealed class CaptureProvider : HttpMessageHandler
    {
        public string LastBody { get; private set; } = "";
        public int Calls { get; private set; }
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            Calls++;
            LastBody = await request.Content!.ReadAsStringAsync(ct);
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""
                    {"candidates":[{"content":{"parts":[{"text":"Đã tra cứu thông tin công khai."}]}}]}
                    """, Encoding.UTF8, "application/json")
            };
        }
    }

    private sealed class ChatFixture : IDisposable
    {
        private readonly BranchApiFactory database = new();
        private readonly Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<Program> application;
        public CaptureProvider Provider { get; } = new();
        public HttpClient Client { get; }

        public ChatFixture()
        {
            application = database.WithWebHostBuilder(builder =>
            {
                builder.UseSetting("AI:ApiKey", "test-only-provider-key");
                builder.ConfigureServices(services =>
                {
                    services.RemoveAll<TimeProvider>();
                    services.AddSingleton<TimeProvider>(new FixedClock());
                    services.AddHttpClient<GeminiService>().ConfigurePrimaryHttpMessageHandler(() => Provider);
                });
            });
            Client = application.CreateClient();
        }

        public async Task WithDatabase(Func<SportsCenterDbContext, Task> action)
        {
            using var scope = application.Services.CreateScope();
            await action(scope.ServiceProvider.GetRequiredService<SportsCenterDbContext>());
        }

        public Task SeedAsync() => WithDatabase(async db =>
        {
            var center = await db.Centers.SingleAsync(item => item.Id == 1);
            center.Name = "Trung tâm công khai"; center.Address = "Địa chỉ trung tâm";
            center.Phone = "0901234567"; center.Email = "contact@center.test";
            center.OpeningTime = new TimeOnly(6, 0); center.ClosingTime = new TimeOnly(22, 0);
            (await db.Centers.SingleAsync(item => item.Id == 2)).Name = "PRIVATE_OTHER_CENTER";
            var package = await db.MembershipPackages.SingleAsync(item => item.Id == 1);
            package.Price = 750000m;
            (await db.MembershipPackages.SingleAsync(item => item.Id == 2)).Name = "PRIVATE_OTHER_PACKAGE";
            db.MembershipPackages.Add(new MembershipPackage { Id = 3, CenterId = 1, Name = "PRIVATE_INACTIVE_PACKAGE", Status = "Inactive" });
            var member = await db.MemberProfiles.SingleAsync(item => item.UserId == 10);
            member.FullName = "PRIVATE_MEMBER_NAME"; member.MedicalNote = "PRIVATE_MEDICAL_NOTE";
            member.Address = "PRIVATE_MEMBER_ADDRESS"; member.EmergencyContactPhone = "PRIVATE_EMERGENCY_CONTACT";
            db.SystemSettings.Add(new SystemSetting { SettingKey = "AI:ApiKey", SettingValue = "PRIVATE_SECRET" });
            db.Sports.Add(new Sport { Id = 1, Name = "Yoga", Status = "Active" });
            db.Rooms.AddRange(new Room { Id = 1, CenterId = 1, Name = "Sân/phòng Yoga", Status = "Active", Capacity = 20,
                    LocationDescription = "Tầng 2", RoomType = "Yoga" },
                new Room { Id = 2, CenterId = 2, Name = "PRIVATE_OTHER_ROOM", Status = "Active" },
                new Room { Id = 3, CenterId = 1, Name = "PRIVATE_INACTIVE_ROOM", Status = "Inactive" });
            db.Classes.AddRange(new ClassEntity { Id = 1, CenterId = 1, SportId = 1, RoomId = 1, Name = "Yoga ngày 16", Status = "Published" },
                new ClassEntity { Id = 2, CenterId = 1, SportId = 1, Name = "PRIVATE_DRAFT_CLASS", Status = "Draft" },
                new ClassEntity { Id = 3, CenterId = 2, SportId = 1, Name = "PRIVATE_OTHER_CLASS", Status = "Published" });
            ClassSession Session(long id, long classId, int day, string status = "Scheduled") => new()
            {
                Id = id, ClassId = classId, SessionDate = new DateOnly(2026, 10, day),
                StartTime = new TimeOnly(8, 30), EndTime = new TimeOnly(9, 30), SessionStatus = status, Notes = "PRIVATE_SESSION_NOTES"
            };
            db.ClassSessions.AddRange(Session(1, 1, 16), Session(2, 1, 17), Session(3, 2, 16), Session(4, 3, 16), Session(5, 1, 16, "Cancelled"));
            db.AiConversations.Add(new AiConversation { Id = 900, UserId = 20, Title = "PRIVATE_CONVERSATION", ConversationType = "MemberAssistant" });
            db.AiMessages.Add(new AiMessage { ConversationId = 900, SenderType = "User", Message = "PRIVATE_CHAT_MESSAGE" });
            await db.SaveChangesAsync();
        });

        public JsonDocument PublicContext()
        {
            using var payload = JsonDocument.Parse(Provider.LastBody);
            var instruction = payload.RootElement.GetProperty("systemInstruction").GetProperty("parts")[0].GetProperty("text").GetString()!;
            const string marker = "\nSCMS_PUBLIC_CONTEXT_JSON:\n";
            var index = instruction.IndexOf(marker, StringComparison.Ordinal);
            Assert.True(index >= 0, "The Gemini request must contain server-selected public center data.");
            return JsonDocument.Parse(instruction[(index + marker.Length)..]);
        }

        public void Dispose()
        {
            Client.Dispose(); application.Dispose(); database.Dispose();
        }
    }
}
