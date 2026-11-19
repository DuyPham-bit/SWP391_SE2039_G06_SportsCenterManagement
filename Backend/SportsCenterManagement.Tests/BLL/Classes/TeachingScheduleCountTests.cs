using SportsCenterManagement.DAL.Entities;
using SportsCenterManagement.DAL.Repositories.Common;

namespace SportsCenterManagement.Tests.BLL.Classes;

/// <summary>
/// The coach schedule count must match the attendance roster: enrolled class members plus session
/// bookings (it showed 0/16 for a class whose 8 enrolled members were all on the roll call).
/// </summary>
public sealed class TeachingScheduleCountTests
{
    private const long CoachUserId = 24;

    [Fact]
    public async Task BookedCount_IncludesEnrolledMembersAndBookings_WithoutDoubleCounting()
    {
        using var db = TestDb.Create();
        db.Add(new Center { Id = 1, Name = "CS1", Address = "HN", Status = "Active" });
        db.Add(new User { Id = CoachUserId, Username = "coach", Email = "c@test.vn", PasswordHash = "x", Status = "Active", RoleId = 3 });
        var sport = new Sport { CenterId = 1, Name = "Cầu lông", Status = "Active" };
        var coach = new CoachProfile { UserId = CoachUserId, CenterId = 1, CoachCode = "CO24", FullName = "HLV", Status = "Active" };
        db.AddRange(sport, coach);
        db.SaveChanges();
        var cls = new ClassEntity { CenterId = 1, SportId = sport.Id, Name = "Cầu lông nâng cao", Status = "Published", Capacity = 16, DurationMinutes = 90 };
        db.Add(cls);
        db.SaveChanges();
        db.Add(new ClassCoach { ClassId = cls.Id, CoachId = coach.Id, IsPrimary = true });
        var session = new ClassSession
        {
            ClassId = cls.Id, SessionDate = TestDb.Today, StartTime = new TimeOnly(18, 0), EndTime = new TimeOnly(19, 30),
            SessionStatus = FlowStatuses.SessionScheduled
        };
        db.Add(session);

        var members = Enumerable.Range(1, 4).Select(i =>
        {
            db.Add(new User { Id = 100 + i, Username = $"m{i}", Email = $"m{i}@test.vn", PasswordHash = "x", Status = "Active", RoleId = 5 });
            return new MemberProfile { UserId = 100 + i, CenterId = 1, MemberCode = $"MB{i}", FullName = $"HV{i}", CreatedAt = TestDb.Now };
        }).ToList();
        db.AddRange(members);
        db.SaveChanges();
        // 3 enrolled (one of them also booked the session), 1 booking-only, plus one cancelled enrollment.
        db.AddRange(
            new ClassEnrollment { ClassId = cls.Id, MemberId = members[0].Id, Status = "Confirmed" },
            new ClassEnrollment { ClassId = cls.Id, MemberId = members[1].Id, Status = "Confirmed" },
            new ClassEnrollment { ClassId = cls.Id, MemberId = members[2].Id, Status = "Cancelled" },
            new SessionBooking { SessionId = session.Id, MemberId = members[1].Id, Status = FlowStatuses.BookingBooked, BookedAt = TestDb.Now },
            new SessionBooking { SessionId = session.Id, MemberId = members[3].Id, Status = FlowStatuses.BookingBooked, BookedAt = TestDb.Now });
        db.SaveChanges();

        var schedule = await new ClassScheduleQueryService(new UnitOfWork(db))
            .GetTeachingScheduleAsync(CoachUserId, TestDb.Today, TestDb.Today);

        Assert.Equal(3, Assert.Single(schedule).BookedCount); // members 0, 1 (once), 3
    }
}
