using SportsCenterManagement.DAL.Entities;
using SportsCenterManagement.DAL.Repositories.Common;

namespace SportsCenterManagement.Tests.BLL.Classes;

/// <summary>When a manager cancels a class, its coaches are notified, with or without upcoming sessions.</summary>
public sealed class CancelClassCoachNotificationTests
{
    private const long CoachUserId = 900;
    private const long ManagerUserId = 1;

    [Theory]
    [InlineData(true, "Lịch dạy đã bị hủy")]   // upcoming sessions: per-session notice
    [InlineData(false, "Lớp đã bị hủy")]        // nothing upcoming: class-level notice
    public async Task CancellingAClass_NotifiesItsCoach(bool withUpcomingSession, string expectedTitlePrefix)
    {
        using var db = TestDb.Create();
        var cls = new ClassEntity { CenterId = 1, Name = "Bơi cơ bản", Status = "Active", Capacity = 10, DurationMinutes = 60 };
        db.Add(cls);
        var coach = new CoachProfile { UserId = CoachUserId, CenterId = 1, CoachCode = "HLV900", FullName = "HLV Test", Status = "Active" };
        db.Add(coach);
        db.SaveChanges();
        db.Add(new ClassCoach { ClassId = cls.Id, CoachId = coach.Id, IsPrimary = true });
        if (withUpcomingSession)
        {
            var start = ScheduleTime.VietnamNow.AddDays(2);
            db.Add(new ClassSession
            {
                ClassId = cls.Id, SessionDate = DateOnly.FromDateTime(start), StartTime = new TimeOnly(9, 0),
                EndTime = new TimeOnly(10, 0), SessionStatus = FlowStatuses.SessionScheduled
            });
        }
        db.SaveChanges();

        await new ClassManagementService(new UnitOfWork(db)).CancelClassAsync(ManagerUserId, cls.Id);

        var titles = (from link in db.UserNotifications
                      join note in db.Notifications on link.NotificationId equals note.Id
                      where link.UserId == CoachUserId
                      select note.Title).ToList();
        Assert.Single(titles);
        Assert.StartsWith(expectedTitlePrefix, titles[0]);
    }
}
