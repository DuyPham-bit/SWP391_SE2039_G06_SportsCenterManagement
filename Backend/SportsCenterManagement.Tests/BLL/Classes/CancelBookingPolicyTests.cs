using SportsCenterManagement.DAL.Entities;
using SportsCenterManagement.DAL.Repositories.Classes;
using SportsCenterManagement.DAL.Repositories.Common;

namespace SportsCenterManagement.Tests.BLL.Classes;

/// <summary>
/// One cancel rule for every package: more than 2 hours ahead the credit comes back; inside 2 hours the
/// member can still cancel (credit consumed, status CancelledLate). A package's own cancel window never blocks.
/// </summary>
public sealed class CancelBookingPolicyTests
{
    private const long MemberUserId = 500;

    [Theory]
    [InlineData(1, true)]    // 1h before class: allowed, but late
    [InlineData(5, false)]   // 5h before class: normal cancel, credit returned
    public async Task PackageWithLongCancelWindow_NeverBlocksCancelling(int hoursBeforeStart, bool expectLate)
    {
        using var db = TestDb.Create();
        var bookingId = Seed(db, packageCancelBeforeHours: 24, hoursBeforeStart);
        var service = new SessionBookingService(new UnitOfWork(db), new ClassRepository(db), null!);

        var result = await service.CancelBookingAsync(MemberUserId, bookingId);

        Assert.Equal(expectLate, result.IsLateCancellation);
        var booking = db.SessionBookings.Single(b => b.Id == bookingId);
        Assert.Equal(expectLate ? FlowStatuses.BookingCancelledLate : FlowStatuses.BookingCancelled, booking.Status);
    }

    private static long Seed(SportsCenterManagement.DAL.Context.SportsCenterDbContext db, int packageCancelBeforeHours, int hoursBeforeStart)
    {
        var package = TestDb.Package(db, "Gói 24h", 1);
        package.CancelBeforeHours = packageCancelBeforeHours;
        var member = new MemberProfile { UserId = MemberUserId, CenterId = 1, MemberCode = "MB500", FullName = "Hội viên test", CreatedAt = TestDb.Now };
        db.Add(member);
        db.SaveChanges();
        var subscription = TestDb.Subscription(db, package, "Active", TestDb.Today.AddDays(-1), TestDb.Today.AddDays(30));
        subscription.MemberId = member.Id;

        var cls = new ClassEntity { CenterId = 1, Name = "Yoga", Status = "Active", Capacity = 10, DurationMinutes = 60 };
        db.Add(cls);
        db.SaveChanges();

        var start = ScheduleTime.VietnamNow.AddHours(hoursBeforeStart);
        var session = new ClassSession
        {
            ClassId = cls.Id,
            SessionDate = DateOnly.FromDateTime(start),
            StartTime = TimeOnly.FromDateTime(start),
            EndTime = TimeOnly.FromDateTime(start.AddMinutes(60)),
            SessionStatus = FlowStatuses.SessionScheduled
        };
        db.Add(session);
        db.SaveChanges();

        var booking = new SessionBooking
        {
            SessionId = session.Id, MemberId = member.Id, SubscriptionId = subscription.Id,
            Status = FlowStatuses.BookingBooked, BookedAt = TestDb.Now
        };
        db.Add(booking);
        db.SaveChanges();
        return booking.Id;
    }
}
