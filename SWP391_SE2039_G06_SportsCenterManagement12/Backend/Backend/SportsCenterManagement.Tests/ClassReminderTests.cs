using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using SportsCenterManagement.API.Controllers;
using SportsCenterManagement.BLL.Services;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;
using Xunit;

namespace SportsCenterManagement.Tests;

public sealed class ClassReminderTests
{
    [Theory]
    [InlineData(3601, 0)]
    [InlineData(3600, 1)]
    [InlineData(3599, 1)]
    [InlineData(1800, 1)]
    [InlineData(1, 1)]
    [InlineData(0, 0)]
    [InlineData(-1, 0)]
    public async Task SendsOnlyWithinTheHourBeforeStart(int secondsUntilStart, int expected)
    {
        await using var fixture = new ReminderFixture();
        await fixture.AddBookingAsync(fixture.Clock.GetUtcNow().AddSeconds(secondsUntilStart));

        Assert.Equal(expected, await fixture.Service.SendDueRemindersAsync());
        Assert.Equal(expected, await fixture.Db.UserNotifications.CountAsync());
    }

    [Fact]
    public async Task ReminderIsUnreadAndVisibleOnlyInTheBookedMembersInbox()
    {
        await using var fixture = new ReminderFixture();
        await fixture.AddBookingAsync(new DateTimeOffset(2026, 10, 15, 1, 30, 0, TimeSpan.Zero));

        Assert.Equal(1, await fixture.Service.SendDueRemindersAsync());
        var notification = await fixture.Db.Notifications.SingleAsync();
        Assert.Equal("ClassReminder", notification.NotificationType);
        Assert.Contains("Yoga Phục hồi", notification.Message);
        Assert.Contains("15/10/2026", notification.Message);
        Assert.Contains("08:30", notification.Message);
        Assert.Contains("09:30", notification.Message);
        Assert.Contains("Phòng Yoga", notification.Message);
        Assert.Equal(new DateTime(2026, 10, 15, 0, 30, 0, DateTimeKind.Utc), notification.ScheduledAt);
        Assert.Equal(fixture.Clock.GetUtcNow().UtcDateTime, notification.CreatedAt);
        var link = await fixture.Db.UserNotifications.SingleAsync();
        Assert.Equal(10, link.UserId); // Member profile ID is 1; login user ID is 10.
        Assert.False(link.IsRead);

        var mine = Assert.IsType<OkObjectResult>(await fixture.Controller(10).Mine(default));
        using var payload = JsonDocument.Parse(JsonSerializer.Serialize(mine.Value));
        var item = Assert.Single(payload.RootElement.EnumerateArray());
        Assert.Equal("ClassReminder", item.GetProperty("NotificationType").GetString());
        Assert.False(item.GetProperty("IsRead").GetBoolean());
        var other = Assert.IsType<OkObjectResult>(await fixture.Controller(20).Mine(default));
        using var otherPayload = JsonDocument.Parse(JsonSerializer.Serialize(other.Value));
        Assert.Empty(otherPayload.RootElement.EnumerateArray());

        Assert.IsType<NoContentResult>(await fixture.Controller(10).Read(notification.Id, default));
        fixture.Db.ChangeTracker.Clear();
        Assert.True((await fixture.Db.UserNotifications.SingleAsync()).IsRead);
        Assert.Equal(0, await fixture.Service.SendDueRemindersAsync());
    }

    [Theory]
    [InlineData("Cancelled", "Scheduled", "Published", "Active", "Active")]
    [InlineData("CANCELLED_LATE_CHARGED", "Scheduled", "Published", "Active", "Active")]
    [InlineData("Booked", "Cancelled", "Published", "Active", "Active")]
    [InlineData("Booked", "Scheduled", "Cancelled", "Active", "Active")]
    [InlineData("Booked", "Scheduled", "Draft", "Active", "Active")]
    [InlineData("Booked", "Scheduled", "Completed", "Active", "Active")]
    [InlineData("Booked", "Scheduled", "Published", "Disabled", "Active")]
    [InlineData("Booked", "Scheduled", "Published", "Active", "Inactive")]
    public async Task SkipsBookingsThatAreNoLongerActive(string bookingStatus, string sessionStatus,
        string classStatus, string userStatus, string centerStatus)
    {
        await using var fixture = new ReminderFixture();
        await fixture.AddBookingAsync(fixture.Clock.GetUtcNow().AddHours(1));
        (await fixture.Db.SessionBookings.SingleAsync()).Status = bookingStatus;
        (await fixture.Db.ClassSessions.SingleAsync()).SessionStatus = sessionStatus;
        (await fixture.Db.Classes.SingleAsync()).Status = classStatus;
        (await fixture.Db.Users.SingleAsync(user => user.Id == 10)).Status = userStatus;
        (await fixture.Db.Centers.SingleAsync(center => center.Id == 1)).Status = centerStatus;
        await fixture.Db.SaveChangesAsync();

        Assert.Equal(0, await fixture.Service.SendDueRemindersAsync());
        Assert.Empty(await fixture.Db.Notifications.ToListAsync());
    }

    [Fact]
    public async Task RestartAndRepeatedPollingDoNotDuplicateReminders()
    {
        await using var fixture = new ReminderFixture();
        await fixture.AddBookingAsync(fixture.Clock.GetUtcNow().AddHours(1));
        Assert.Equal(1, await fixture.Service.SendDueRemindersAsync());
        Assert.Equal(0, await fixture.Service.SendDueRemindersAsync());

        await using var restartedDb = fixture.CreateContext();
        fixture.Clock.Now = fixture.Clock.Now.AddMinutes(10);
        Assert.Equal(0, await new ClassReminderService(restartedDb, fixture.Clock).SendDueRemindersAsync());
        Assert.Single(await restartedDb.Notifications.ToListAsync());
        Assert.Single(await restartedDb.UserNotifications.ToListAsync());
    }

    [Fact]
    public async Task HandlesVietnamMidnightAndNeverSendsEarly()
    {
        await using var fixture = new ReminderFixture();
        fixture.Clock.Now = new DateTimeOffset(2026, 10, 15, 16, 30, 0, TimeSpan.Zero); // 23:30 Vietnam.
        await fixture.AddBookingAsync(new DateTimeOffset(2026, 10, 16, 0, 15, 0, TimeSpan.FromHours(7)));
        await fixture.AddBookingAsync(new DateTimeOffset(2026, 10, 16, 0, 31, 0, TimeSpan.FromHours(7)));

        Assert.Equal(1, await fixture.Service.SendDueRemindersAsync());
        var notification = await fixture.Db.Notifications.SingleAsync();
        Assert.Contains("16/10/2026", notification.Message);
        Assert.Contains("00:15", notification.Message);
    }

    [Fact]
    public async Task RescheduledSessionReceivesANewReminderAtItsNewTime()
    {
        await using var fixture = new ReminderFixture();
        await fixture.AddBookingAsync(fixture.Clock.GetUtcNow().AddHours(1));
        Assert.Equal(1, await fixture.Service.SendDueRemindersAsync());
        var session = await fixture.Db.ClassSessions.SingleAsync();
        session.StartTime = new TimeOnly(10, 30);
        session.EndTime = new TimeOnly(11, 30);
        await fixture.Db.SaveChangesAsync();
        Assert.Equal(0, await fixture.Service.SendDueRemindersAsync());

        fixture.Clock.Now = new DateTimeOffset(2026, 10, 15, 2, 30, 0, TimeSpan.Zero); // 09:30 Vietnam.
        Assert.Equal(1, await fixture.Service.SendDueRemindersAsync());
        Assert.Equal(2, await fixture.Db.UserNotifications.CountAsync());
        Assert.Contains(await fixture.Db.Notifications.ToListAsync(), item => item.Message.Contains("10:30"));
    }

    [Fact]
    public async Task EachBookedMemberReceivesOneReminderWithTheSessionRoom()
    {
        await using var fixture = new ReminderFixture();
        await fixture.AddBookingAsync(fixture.Clock.GetUtcNow().AddHours(1));
        fixture.Db.MemberProfiles.Add(new MemberProfile { Id = 2, UserId = 20, MemberCode = "MB002", FullName = "Member 2" });
        fixture.Db.Rooms.Add(new Room { Id = 2, CenterId = 1, Name = "Phòng thay thế", Status = "Active" });
        var session = await fixture.Db.ClassSessions.SingleAsync();
        session.RoomId = 2;
        fixture.Db.SessionBookings.Add(new SessionBooking { SessionId = session.Id, MemberId = 2, Status = "Booked" });
        await fixture.Db.SaveChangesAsync();

        Assert.Equal(2, await fixture.Service.SendDueRemindersAsync());
        Assert.Equal(0, await fixture.Service.SendDueRemindersAsync());
        Assert.Equal(new long[] { 10, 20 }, await fixture.Db.UserNotifications.OrderBy(item => item.UserId)
            .Select(item => item.UserId).ToArrayAsync());
        Assert.All(await fixture.Db.Notifications.ToListAsync(), item => Assert.Contains("Phòng thay thế", item.Message));
    }

    [Fact]
    public async Task FailedRecipientInsertRollsBackAndCanBeRetried()
    {
        await using var fixture = new ReminderFixture();
        await fixture.AddBookingAsync(fixture.Clock.GetUtcNow().AddHours(1));
        await fixture.Db.Database.ExecuteSqlRawAsync("""
            CREATE TRIGGER fail_recipient BEFORE INSERT ON user_notifications
            BEGIN SELECT RAISE(ABORT, 'simulated recipient failure'); END;
            """);

        await Assert.ThrowsAsync<DbUpdateException>(() => fixture.Service.SendDueRemindersAsync());
        fixture.Db.ChangeTracker.Clear();
        Assert.Empty(await fixture.Db.Notifications.ToListAsync());
        Assert.Empty(await fixture.Db.UserNotifications.ToListAsync());
        await fixture.Db.Database.ExecuteSqlRawAsync("DROP TRIGGER fail_recipient;");

        Assert.Equal(1, await fixture.Service.SendDueRemindersAsync());
        Assert.Single(await fixture.Db.UserNotifications.ToListAsync());
    }

    [Fact]
    public async Task DatabaseRejectsDuplicateReminderKeys()
    {
        await using var fixture = new ReminderFixture();
        await fixture.AddBookingAsync(fixture.Clock.GetUtcNow().AddHours(1));
        await fixture.Service.SendDueRemindersAsync();
        var original = await fixture.Db.Notifications.SingleAsync();
        fixture.Db.Notifications.Add(new Notification { SenderId = 10, Title = "Duplicate", Message = "Duplicate",
            NotificationType = "ClassReminder", ReminderKey = original.ReminderKey });

        await Assert.ThrowsAsync<DbUpdateException>(() => fixture.Db.SaveChangesAsync());
        fixture.Db.ChangeTracker.Clear();
        Assert.Single(await fixture.Db.Notifications.ToListAsync());
    }

    [SqlServerFact]
    public async Task SqlServerMigrationAndReminderSurviveANewContext()
    {
        var connectionString = new SqlConnectionStringBuilder(Environment.GetEnvironmentVariable("SCMS_TEST_SQL_CONNECTION"))
        {
            InitialCatalog = "SCMS_ClassReminder_Test_" + Guid.NewGuid().ToString("N")
        }.ConnectionString;
        var options = new DbContextOptionsBuilder<SportsCenterDbContext>().UseSqlServer(connectionString).Options;
        await using var db = new SportsCenterDbContext(options);
        try
        {
            await db.Database.MigrateAsync();
            Assert.Contains(await db.Database.GetAppliedMigrationsAsync(),
                name => name.EndsWith("_AddClassReminderKey", StringComparison.Ordinal));
            var role = new Role { Name = "Member" };
            var center = new Center { Name = "Reminder test", Address = "Test", Status = "Active" };
            var sport = new Sport { Name = "Yoga", Status = "Active" };
            db.AddRange(role, center, sport);
            await db.SaveChangesAsync();
            var user = new User { RoleId = role.Id, Username = "reminder-member", Email = "reminder@example.test",
                PasswordHash = "unused-in-service-test", Status = "Active" };
            var cls = new ClassEntity { CenterId = center.Id, SportId = sport.Id, Name = "Yoga", Status = "Published" };
            db.AddRange(user, cls);
            await db.SaveChangesAsync();
            var member = new MemberProfile { UserId = user.Id, MemberCode = "REMINDER-TEST", FullName = "Reminder member" };
            var session = new ClassSession { ClassId = cls.Id, SessionDate = new DateOnly(2026, 10, 15),
                StartTime = new TimeOnly(8, 30), EndTime = new TimeOnly(9, 30), SessionStatus = "Scheduled" };
            db.AddRange(member, session);
            await db.SaveChangesAsync();
            db.SessionBookings.Add(new SessionBooking { SessionId = session.Id, MemberId = member.Id, Status = "Booked" });
            await db.SaveChangesAsync();
            var clock = new TestClock();

            Assert.Equal(1, await new ClassReminderService(db, clock).SendDueRemindersAsync());
            await using var restartedDb = new SportsCenterDbContext(options);
            Assert.Equal(0, await new ClassReminderService(restartedDb, clock).SendDueRemindersAsync());
            Assert.Equal(user.Id, (await restartedDb.UserNotifications.SingleAsync()).UserId);
            Assert.Equal("ClassReminder", (await restartedDb.Notifications.SingleAsync()).NotificationType);
            Assert.False(restartedDb.Database.HasPendingModelChanges());
        }
        finally
        {
            await db.Database.EnsureDeletedAsync();
        }
    }

    private sealed class TestClock : TimeProvider
    {
        public DateTimeOffset Now { get; set; } = new(2026, 10, 15, 0, 30, 0, TimeSpan.Zero);
        public override DateTimeOffset GetUtcNow() => Now;
    }

    private sealed class ReminderFixture : IAsyncDisposable
    {
        private readonly SqliteConnection connection = new("Data Source=:memory:");
        public SportsCenterDbContext Db { get; }
        public TestClock Clock { get; } = new();
        public ClassReminderService Service => new(Db, Clock);

        public ReminderFixture()
        {
            connection.Open();
            Db = CreateContext();
            Db.Database.EnsureCreated();
            BranchTestData.Seed(Db);
            Db.Sports.Add(new Sport { Id = 1, Name = "Yoga", Status = "Active" });
            Db.Rooms.Add(new Room { Id = 1, CenterId = 1, Name = "Phòng Yoga", Status = "Active" });
            Db.Classes.Add(new ClassEntity { Id = 1, CenterId = 1, SportId = 1, RoomId = 1,
                Name = "Yoga Phục hồi", Status = "Published" });
            Db.SaveChanges();
        }

        public SportsCenterDbContext CreateContext() => new(new DbContextOptionsBuilder<SportsCenterDbContext>()
            .UseSqlite(connection).ReplaceService<IModelCustomizer, BranchSqliteModelCustomizer>().Options);

        public async Task AddBookingAsync(DateTimeOffset start)
        {
            var localStart = start.ToOffset(TimeSpan.FromHours(7)).DateTime;
            var session = new ClassSession { ClassId = 1, SessionDate = DateOnly.FromDateTime(localStart),
                StartTime = TimeOnly.FromDateTime(localStart), EndTime = TimeOnly.FromDateTime(localStart.AddHours(1)),
                SessionStatus = "Scheduled" };
            Db.ClassSessions.Add(session);
            await Db.SaveChangesAsync();
            Db.SessionBookings.Add(new SessionBooking { SessionId = session.Id, MemberId = 1,
                Status = "Booked", BookedAt = Clock.GetUtcNow().UtcDateTime.AddDays(-1) });
            await Db.SaveChangesAsync();
        }

        public NotificationsController Controller(long userId) => new(Db)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, userId.ToString())], "test"))
            } }
        };

        public async ValueTask DisposeAsync()
        {
            await Db.DisposeAsync();
            await connection.DisposeAsync();
        }
    }
}
