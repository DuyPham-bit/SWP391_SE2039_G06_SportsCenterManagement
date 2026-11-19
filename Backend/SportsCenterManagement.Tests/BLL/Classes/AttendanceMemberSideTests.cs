using SportsCenterManagement.BLL.DTOs.Classes;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;
using SportsCenterManagement.DAL.Repositories.Classes;
using SportsCenterManagement.DAL.Repositories.Common;

namespace SportsCenterManagement.Tests.BLL.Classes;

/// <summary>
/// Tester report: a coach marked the roll call for an enrolled class, but the members got no notice,
/// did not see the result in their attendance history, and the class showed 0/16 seats.
/// </summary>
public sealed class AttendanceMemberSideTests
{
    private const long CoachUserId = 24;
    private static readonly long[] MemberUserIds = [101, 102, 103];

    [Fact]
    public async Task RollCall_NotifiesEachMember_OnlyWhenTheirResultChanges()
    {
        using var db = TestDb.Create();
        var (sessionId, memberIds) = Seed(db);
        var service = Service(db);

        await service.RecordAttendanceAsync(CoachUserId, sessionId,
        [
            new AttendanceRecordDto(memberIds[0], "PRESENT", null),
            new AttendanceRecordDto(memberIds[1], "ABSENT", "Đến muộn 10 phút."),
            new AttendanceRecordDto(memberIds[2], "EXCUSED", "Bị ốm")
        ]);
        Assert.Equal(3, Notices(db).Count);
        Assert.Contains(Notices(db), n => n.UserId == MemberUserIds[1] && n.Message.Contains("Vắng mặt") && n.Message.Contains("Đến muộn 10 phút."));
        Assert.Contains(Notices(db), n => n.UserId == MemberUserIds[2] && n.Message.Contains("Vắng có phép"));

        // Saving the same roll call again must not spam; changing one result notifies only that member.
        await service.RecordAttendanceAsync(CoachUserId, sessionId,
        [
            new AttendanceRecordDto(memberIds[0], "PRESENT", null),
            new AttendanceRecordDto(memberIds[1], "PRESENT", null),
            new AttendanceRecordDto(memberIds[2], "EXCUSED", "Bị ốm")
        ]);
        Assert.Equal(4, Notices(db).Count);
        Assert.Equal(2, Notices(db).Count(n => n.UserId == MemberUserIds[1]));
    }

    [Fact]
    public async Task EnrolledMember_SeesRollCallResult_InTheirHistory()
    {
        using var db = TestDb.Create();
        var (sessionId, memberIds) = Seed(db);
        var service = Service(db);
        await service.RecordAttendanceAsync(CoachUserId, sessionId,
            memberIds.Select(id => new AttendanceRecordDto(id, "PRESENT", null)).ToList());

        var history = await service.ListMyClassAttendanceAsync(MemberUserIds[0]);

        var row = Assert.Single(history);
        Assert.Equal(sessionId, row.SessionId);
        Assert.Equal("PRESENT", row.AttendanceStatus);
        Assert.Equal("Enrolled", row.Status);
        Assert.True(row.Id < 0); // never collides with (or is cancellable as) a booking
        Assert.Empty(await service.ListMyBookingsAsync(MemberUserIds[0]));
    }

    [Fact]
    public async Task EnrolledMembers_TakeSeats_ForBookingCapacity()
    {
        using var db = TestDb.Create();
        var (sessionId, memberIds) = Seed(db);
        var classId = db.ClassSessions.Single(s => s.Id == sessionId).ClassId;
        Assert.Equal(3, await SessionSeats.CountOccupiedAsync(db, sessionId, classId, default));

        // An enrolled member who also books the session is still one seat; a cancelled enrollment frees it.
        db.Add(new SessionBooking { SessionId = sessionId, MemberId = memberIds[0], Status = FlowStatuses.BookingBooked, BookedAt = TestDb.Now });
        db.ClassEnrollments.Single(e => e.MemberId == memberIds[2]).Status = "Cancelled";
        db.SaveChanges();
        Assert.Equal(2, await SessionSeats.CountOccupiedAsync(db, sessionId, classId, default));
    }

    private static SessionBookingService Service(SportsCenterDbContext db) =>
        new(new UnitOfWork(db), new ClassRepository(db), null!);

    private static List<(long UserId, string Message)> Notices(SportsCenterDbContext db) =>
        (from link in db.UserNotifications
         join note in db.Notifications on link.NotificationId equals note.Id
         where note.NotificationType == "AttendanceRecorded"
         select new { link.UserId, note.Message }).AsEnumerable().Select(x => (x.UserId, x.Message)).ToList();

    private static (long SessionId, long[] MemberIds) Seed(SportsCenterDbContext db)
    {
        db.Add(new User { Id = CoachUserId, Username = "coach", Email = "c@test.vn", PasswordHash = "x", Status = "Active", RoleId = 3 });
        var coach = new CoachProfile { UserId = CoachUserId, CenterId = 1, CoachCode = "CO24", FullName = "Lê Thị Thu Hà", Status = "Active" };
        var cls = new ClassEntity { CenterId = 1, Name = "Cầu lông nâng cao", Status = "Published", Capacity = 16, DurationMinutes = 90 };
        db.AddRange(coach, cls);
        db.SaveChanges();
        db.Add(new ClassCoach { ClassId = cls.Id, CoachId = coach.Id, IsPrimary = true });
        // Started an hour ago: roll call is open.
        var start = ScheduleTime.VietnamNow.AddHours(-1);
        var session = new ClassSession
        {
            ClassId = cls.Id, SessionDate = DateOnly.FromDateTime(start), StartTime = TimeOnly.FromDateTime(start),
            EndTime = TimeOnly.FromDateTime(start.AddMinutes(90)), SessionStatus = FlowStatuses.SessionScheduled
        };
        db.Add(session);
        var members = MemberUserIds.Select(uid =>
        {
            db.Add(new User { Id = uid, Username = $"m{uid}", Email = $"m{uid}@test.vn", PasswordHash = "x", Status = "Active", RoleId = 5 });
            return new MemberProfile { UserId = uid, CenterId = 1, MemberCode = $"MB{uid}", FullName = $"HV{uid}", CreatedAt = TestDb.Now };
        }).ToList();
        db.AddRange(members);
        db.SaveChanges();
        // Enrolled in the class only: none of them booked the session itself.
        foreach (var member in members)
            db.Add(new ClassEnrollment { ClassId = cls.Id, MemberId = member.Id, Status = "Confirmed" });
        db.SaveChanges();
        return (session.Id, members.Select(m => m.Id).ToArray());
    }
}
