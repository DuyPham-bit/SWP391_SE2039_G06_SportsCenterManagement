using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SportsCenterManagement.BLL.Common;
using SportsCenterManagement.BLL.DTOs.CoreFlows;
using SportsCenterManagement.BLL.Interfaces;
using SportsCenterManagement.DAL.Repositories.Interfaces;

namespace SportsCenterManagement.BLL.Services;

public sealed class ReportService(
    IUnitOfWork unitOfWork,
    IPaymentService paymentService,
    IConfiguration configuration) : IReportService
{
    private readonly IUnitOfWork _unitOfWork = unitOfWork;
    private readonly IPaymentService _paymentService = paymentService;
    private readonly IConfiguration _configuration = configuration;

    public async Task<int> GetCheckinCountAsync(long centerId, DateOnly from, DateOnly to,
        CancellationToken cancellationToken = default)
    {
        ValidateRequest(from, to, "day");
        await EnsureCenterExistsAsync(centerId, cancellationToken);
        var (startUtc, endUtc) = GetUtcRange(from, to, GetReportTimeZone());
        return await _unitOfWork.Context.CenterCheckins.CountAsync(c => c.CenterId == centerId &&
            c.CheckInTime >= startUtc && c.CheckInTime < endUtc, cancellationToken);
    }

    public Task<RevenueReportResponse> GetRevenueReportAsync(
        long centerId,
        DateOnly from,
        DateOnly to,
        string groupBy,
        CancellationToken cancellationToken = default) =>
        _paymentService.GetRevenueReportAsync(centerId, from, to, groupBy, cancellationToken);

    public async Task<SportRevenueReportResponse> GetSportRevenueReportAsync(
        long centerId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default)
    {
        ValidateRequest(from, to, "day");
        await EnsureCenterExistsAsync(centerId, cancellationToken);
        var (startUtc, endUtc) = GetUtcRange(from, to, GetReportTimeZone());
        var payments = await (
            from payment in _unitOfWork.Context.Payments.AsNoTracking()
            join invoice in _unitOfWork.Context.Invoices.AsNoTracking() on payment.InvoiceId equals invoice.Id
            where invoice.CenterId == centerId && payment.PaymentStatus == "Succeeded"
                && payment.PaidAt != null && payment.PaidAt >= startUtc && payment.PaidAt < endUtc
            select new { payment.Id, payment.InvoiceId, payment.Amount }).ToListAsync(cancellationToken);
        var refundRows = await (
            from refund in _unitOfWork.Context.PaymentRefunds.AsNoTracking()
            join payment in _unitOfWork.Context.Payments.AsNoTracking() on refund.PaymentId equals payment.Id
            join invoice in _unitOfWork.Context.Invoices.AsNoTracking() on payment.InvoiceId equals invoice.Id
            where invoice.CenterId == centerId && (refund.Status == "Succeeded" || refund.Status == "Approved")
                && refund.ProcessedAt != null && refund.ProcessedAt >= startUtc && refund.ProcessedAt < endUtc
            select new { payment.InvoiceId, refund.Amount }).ToListAsync(cancellationToken);
        var invoiceIds = payments.Select(item => item.InvoiceId)
            .Concat(refundRows.Select(item => item.InvoiceId)).Distinct().ToArray();
        var invoiceItems = await _unitOfWork.Context.InvoiceItems.AsNoTracking()
            .Where(item => invoiceIds.Contains(item.InvoiceId))
            .Select(item => new { item.InvoiceId, item.SubscriptionId, item.EnrollmentId })
            .ToListAsync(cancellationToken);
        var subscriptionIds = invoiceItems.Where(item => item.SubscriptionId.HasValue)
            .Select(item => item.SubscriptionId!.Value).Distinct().ToArray();
        var enrollmentIds = invoiceItems.Where(item => item.EnrollmentId.HasValue)
            .Select(item => item.EnrollmentId!.Value).Distinct().ToArray();
        var enrollmentSports = await (
            from enrollment in _unitOfWork.Context.ClassEnrollments.AsNoTracking()
            join cls in _unitOfWork.Context.Classes.AsNoTracking() on enrollment.ClassId equals cls.Id
            join sport in _unitOfWork.Context.Sports.AsNoTracking() on cls.SportId equals sport.Id
            where cls.CenterId == centerId &&
                (enrollmentIds.Contains(enrollment.Id)
                 || (enrollment.SubscriptionId.HasValue && subscriptionIds.Contains(enrollment.SubscriptionId.Value)))
            select new { enrollment.Id, enrollment.SubscriptionId, SportId = sport.Id, SportName = sport.Name })
            .ToListAsync(cancellationToken);
        var bookingSports = await (
            from booking in _unitOfWork.Context.SessionBookings.AsNoTracking()
            join session in _unitOfWork.Context.ClassSessions on booking.SessionId equals session.Id
            join cls in _unitOfWork.Context.Classes on session.ClassId equals cls.Id
            join sport in _unitOfWork.Context.Sports on cls.SportId equals sport.Id
            where cls.CenterId == centerId && booking.SubscriptionId.HasValue
                && subscriptionIds.Contains(booking.SubscriptionId.Value)
                && (booking.Status == "Booked" || booking.Status == "CancelledLate")
            select new { booking.SubscriptionId, SportId = sport.Id, SportName = sport.Name })
            .Distinct().ToListAsync(cancellationToken);

        var buckets = new Dictionary<(long? Id, string Name), (decimal Gross, decimal Refunds)>();
        (long? Id, string Name)[] Targets(long invoiceId)
        {
            var items = invoiceItems.Where(item => item.InvoiceId == invoiceId).ToArray();
            var directIds = items.Where(item => item.EnrollmentId.HasValue).Select(item => item.EnrollmentId!.Value).ToHashSet();
            var subs = items.Where(item => item.SubscriptionId.HasValue).Select(item => item.SubscriptionId!.Value).ToHashSet();
            var sports = enrollmentSports.Where(item => directIds.Contains(item.Id)
                    || (item.SubscriptionId.HasValue && subs.Contains(item.SubscriptionId.Value)))
                .Select(item => (item.SportId, item.SportName))
                .Concat(bookingSports.Where(item => subs.Contains(item.SubscriptionId!.Value))
                    .Select(item => (item.SportId, item.SportName))).Distinct().ToArray();
            return sports.Length > 0 ? sports.Select(item => ((long?)item.SportId, item.SportName)).ToArray()
                : new[] { ((long?)null, "Chưa phân bổ") };
        }
        foreach (var payment in payments)
        {
            var targets = Targets(payment.InvoiceId);
            foreach (var target in targets)
            {
                var current = buckets.GetValueOrDefault(target);
                buckets[target] = (current.Gross + payment.Amount / targets.Length, current.Refunds);
            }
        }
        foreach (var refund in refundRows)
        {
            var targets = Targets(refund.InvoiceId);
            foreach (var target in targets)
            {
                var current = buckets.GetValueOrDefault(target);
                buckets[target] = (current.Gross, current.Refunds + refund.Amount / targets.Length);
            }
        }

        var totalNet = payments.Sum(item => item.Amount) - refundRows.Sum(item => item.Amount);
        var rows = buckets.Select(item => new SportRevenueItem(item.Key.Id, item.Key.Name,
                decimal.Round(item.Value.Gross, 2), decimal.Round(item.Value.Refunds, 2),
                decimal.Round(item.Value.Gross - item.Value.Refunds, 2),
                totalNet > 0 ? decimal.Round((item.Value.Gross - item.Value.Refunds) / totalNet * 100, 2) : 0))
            .OrderByDescending(item => item.Net).ThenBy(item => item.SportName).ToArray();
        var unallocated = rows.Where(item => item.SportId is null).Sum(item => item.Net);
        return new SportRevenueReportResponse(centerId, from, to, totalNet,
            rows.Where(item => item.SportId is not null).Sum(item => item.Net), unallocated, rows);
    }

    public async Task<MembershipReportResponse> GetMembershipReportAsync(
        long centerId,
        DateOnly from,
        DateOnly to,
        string groupBy,
        CancellationToken cancellationToken = default)
    {
        ValidateRequest(from, to, groupBy);
        await EnsureCenterExistsAsync(centerId, cancellationToken);
        var timeZone = GetReportTimeZone();
        var (startUtc, endUtc) = GetUtcRange(from, to, timeZone);
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone));
        var db = _unitOfWork.Context;

        var centerMembers = await db.MemberProfiles.AsNoTracking()
            .Where(profile => profile.CenterId == centerId)
            .Select(profile => new { profile.Id, profile.CreatedAt })
            .ToListAsync(cancellationToken);
        var totalMembers = centerMembers.Count;

        var packages = await db.MembershipPackages.AsNoTracking()
            .Where(p => p.CenterId == centerId)
            .Select(p => new { p.Id, p.Name, p.Price, p.DurationDays })
            .ToListAsync(cancellationToken);

        var subs = await (
            from subscription in db.MemberSubscriptions.AsNoTracking()
            join package in db.MembershipPackages.AsNoTracking() on subscription.PackageId equals package.Id
            where package.CenterId == centerId
            select new {
                subscription.Id,
                subscription.MemberId,
                subscription.PackageId,
                subscription.StartDate,
                subscription.EndDate,
                subscription.Price,
                subscription.Status,
                subscription.CreatedAt
            }).ToListAsync(cancellationToken);

        var activeMemberIds = subs
            .Where(s => s.Status == "Active" && s.StartDate <= today && s.EndDate >= today)
            .Select(s => s.MemberId).ToHashSet();
        var activeMembers = activeMemberIds.Count;

        var expiredMembers = subs.Where(s => s.Status == "Expired" ||
                (s.Status == "Active" && s.EndDate < today))
            .Select(s => s.MemberId).Distinct().Count(m => !activeMemberIds.Contains(m));
        var inactiveMembers = Math.Max(0, totalMembers - activeMembers);

        // Sales are recognized on full payment; revenue follows actual collections and refunds.
        var sales = await (from item in db.InvoiceItems.AsNoTracking()
            join invoice in db.Invoices on item.InvoiceId equals invoice.Id
            where invoice.CenterId == centerId && item.PackageId.HasValue && item.SubscriptionId.HasValue
                && invoice.PaidAt >= startUtc && invoice.PaidAt < endUtc
            select new { PackageId = item.PackageId!.Value, item.SubscriptionId }).Distinct().ToListAsync(cancellationToken);
        var collected = await (from payment in db.Payments.AsNoTracking()
            join invoice in db.Invoices on payment.InvoiceId equals invoice.Id
            join item in db.InvoiceItems on invoice.Id equals item.InvoiceId
            where invoice.CenterId == centerId && item.PackageId.HasValue && invoice.Subtotal > 0
                && payment.PaymentStatus == "Succeeded" && payment.PaidAt >= startUtc && payment.PaidAt < endUtc
            select new { PackageId = item.PackageId!.Value, Amount = payment.Amount * item.Amount / invoice.Subtotal })
            .ToListAsync(cancellationToken);
        var refunded = await (from refund in db.PaymentRefunds.AsNoTracking()
            join payment in db.Payments on refund.PaymentId equals payment.Id
            join invoice in db.Invoices on payment.InvoiceId equals invoice.Id
            join item in db.InvoiceItems on invoice.Id equals item.InvoiceId
            where invoice.CenterId == centerId && item.PackageId.HasValue && invoice.Subtotal > 0
                && (refund.Status == "Succeeded" || refund.Status == "Approved") && refund.ProcessedAt >= startUtc && refund.ProcessedAt < endUtc
            select new { PackageId = item.PackageId!.Value, Amount = refund.Amount * item.Amount / invoice.Subtotal })
            .ToListAsync(cancellationToken);
        var packageStats = packages.Select(pkg =>
        {
            var pkgSubs = subs.Where(s => s.PackageId == pkg.Id).ToArray();
            var activeSubscribers = pkgSubs.Count(s => s.Status == "Active" && s.StartDate <= today && s.EndDate >= today);
            var soldInPeriod = sales.Count(s => s.PackageId == pkg.Id);
            var revenueInPeriod = decimal.Round(collected.Where(p => p.PackageId == pkg.Id).Sum(p => p.Amount)
                - refunded.Where(p => p.PackageId == pkg.Id).Sum(p => p.Amount), 2);
            return new MembershipPackageStatsItem(pkg.Id, pkg.Name, pkg.Price, pkg.DurationDays, activeSubscribers, soldInPeriod, revenueInPeriod);
        }).OrderByDescending(p => p.SoldInPeriod).ThenByDescending(p => p.RevenueInPeriod).ToArray();

        var newMemberRows = centerMembers
            .Where(row => row.CreatedAt >= startUtc && row.CreatedAt < endUtc)
            .ToArray();
        var newMembersByPeriod = newMemberRows
            .GroupBy(row => PeriodFor(row.CreatedAt, groupBy, timeZone))
            .ToDictionary(group => group.Key, group => group.Count());
        var periods = CreatePeriodStarts(from, to, groupBy)
            .Select(period => new MembershipReportPeriod(
                period, newMembersByPeriod.GetValueOrDefault(period)))
            .ToArray();

        return new MembershipReportResponse(
            centerId, from, to, timeZone.Id, totalMembers, activeMembers,
            newMemberRows.Length, periods, expiredMembers, inactiveMembers, packageStats);
    }

    public async Task<ClassEnrollmentReportResponse> GetClassEnrollmentReportAsync(
        long centerId,
        DateOnly from,
        DateOnly to,
        string groupBy,
        CancellationToken cancellationToken = default)
    {
        ValidateRequest(from, to, groupBy);
        await EnsureCenterExistsAsync(centerId, cancellationToken);
        var timeZone = GetReportTimeZone();
        var (startUtc, endUtc) = GetUtcRange(from, to, timeZone);
        var enrollmentCounts = await (
            from enrollment in _unitOfWork.Context.ClassEnrollments
            join classEntity in _unitOfWork.Context.Classes on enrollment.ClassId equals classEntity.Id
            where classEntity.CenterId == centerId
            group enrollment by enrollment.Status into statusGroup
            select new { Status = statusGroup.Key, Count = statusGroup.Count() })
            .ToListAsync(cancellationToken);
        var waitlistCounts = await (
            from item in _unitOfWork.Context.ClassWaitlists
            join classEntity in _unitOfWork.Context.Classes on item.ClassId equals classEntity.Id
            where classEntity.CenterId == centerId
            group item by item.Status into statusGroup
            select new { Status = statusGroup.Key, Count = statusGroup.Count() })
            .ToListAsync(cancellationToken);
        var bookingCounts = await (
            from booking in _unitOfWork.Context.SessionBookings
            join session in _unitOfWork.Context.ClassSessions on booking.SessionId equals session.Id
            join cls in _unitOfWork.Context.Classes on session.ClassId equals cls.Id
            where cls.CenterId == centerId
            group booking by booking.Status into statusGroup
            select new { Status = statusGroup.Key, Count = statusGroup.Count() }).ToListAsync(cancellationToken);

        var currentStatusCounts = enrollmentCounts.Concat(waitlistCounts).Concat(bookingCounts)
            .GroupBy(row => NormalizeStatus(row.Status), StringComparer.OrdinalIgnoreCase)
            .OrderBy(group => group.Key, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.Sum(row => row.Count), StringComparer.OrdinalIgnoreCase);

        var enrollmentEvents = await (
            from enrollment in _unitOfWork.Context.ClassEnrollments
            join classEntity in _unitOfWork.Context.Classes on enrollment.ClassId equals classEntity.Id
            let occurredAt = enrollment.Status == "Cancelled"
                ? enrollment.CancelledAt ?? enrollment.RegisteredAt
                : enrollment.RegisteredAt
            where classEntity.CenterId == centerId && occurredAt >= startUtc && occurredAt < endUtc
            select new { enrollment.Status, CreatedAtUtc = occurredAt })
            .ToListAsync(cancellationToken);
        var waitlistEvents = await (
            from item in _unitOfWork.Context.ClassWaitlists
            join classEntity in _unitOfWork.Context.Classes on item.ClassId equals classEntity.Id
            where classEntity.CenterId == centerId && item.JoinedAt >= startUtc && item.JoinedAt < endUtc
            select new { item.Status, CreatedAtUtc = item.JoinedAt })
            .ToListAsync(cancellationToken);
        var bookingEvents = await (
            from booking in _unitOfWork.Context.SessionBookings
            join session in _unitOfWork.Context.ClassSessions on booking.SessionId equals session.Id
            join cls in _unitOfWork.Context.Classes on session.ClassId equals cls.Id
            where cls.CenterId == centerId && booking.BookedAt >= startUtc && booking.BookedAt < endUtc
            select new { booking.Status, CreatedAtUtc = booking.BookedAt }).ToListAsync(cancellationToken);
        var statusEvents = enrollmentEvents
            .Select(row => new StatusEvent(row.Status, row.CreatedAtUtc))
            .Concat(waitlistEvents.Select(row => new StatusEvent(row.Status, row.CreatedAtUtc)))
            .Concat(bookingEvents.Select(row => new StatusEvent(row.Status, row.CreatedAtUtc)))
            .ToArray();
        var statusCountsByPeriod = statusEvents
            .GroupBy(row => PeriodFor(row.CreatedAtUtc, groupBy, timeZone))
            .ToDictionary(
                group => group.Key,
                group => (IReadOnlyDictionary<string, int>)group
                    .GroupBy(row => NormalizeStatus(row.Status), StringComparer.OrdinalIgnoreCase)
                    .OrderBy(statusGroup => statusGroup.Key, StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(statusGroup => statusGroup.Key, statusGroup => statusGroup.Count(), StringComparer.OrdinalIgnoreCase));
        var periods = CreatePeriodStarts(from, to, groupBy)
            .Select(period => new ClassEnrollmentReportPeriod(
                period, statusCountsByPeriod.GetValueOrDefault(period) ?? new Dictionary<string, int>()))
            .ToArray();

        return new ClassEnrollmentReportResponse(
            centerId, from, to, timeZone.Id, groupBy.Trim().ToLowerInvariant(), currentStatusCounts, periods);
    }

    public async Task<OperationsReportResponse> GetOperationsReportAsync(
        long centerId,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken = default)
    {
        ValidateRequest(from, to, "day");
        await EnsureCenterExistsAsync(centerId, cancellationToken);
        var db = _unitOfWork.Context;

        var staffRows = await (from profile in db.StaffProfiles.AsNoTracking()
            join user in db.Users.AsNoTracking() on profile.UserId equals user.Id
            join role in db.Roles.AsNoTracking() on user.RoleId equals role.Id
            where profile.CenterId == centerId
            select new { user.Id, Role = role.Name, ProfileStatus = profile.Status, UserStatus = user.Status })
            .ToListAsync(cancellationToken);
        var coachRows = await (from profile in db.CoachProfiles.AsNoTracking()
            join user in db.Users.AsNoTracking() on profile.UserId equals user.Id
            join role in db.Roles.AsNoTracking() on user.RoleId equals role.Id
            where profile.CenterId == centerId
            select new { user.Id, Role = role.Name, ProfileStatus = profile.Status, UserStatus = user.Status })
            .ToListAsync(cancellationToken);
        var personnel = staffRows.Concat(coachRows).GroupBy(row => row.Id).Select(group => group.First()).ToArray();
        var isActive = (string profileStatus, string userStatus) =>
            profileStatus.Equals("Active", StringComparison.OrdinalIgnoreCase)
            && userStatus.Equals("Active", StringComparison.OrdinalIgnoreCase);

        var classCounts = await db.Classes.AsNoTracking().Where(item => item.CenterId == centerId)
            .GroupBy(_ => 1).Select(group => new
            {
                Total = group.Count(),
                Active = group.Count(item => item.Status != "Cancelled" && item.Status != "Completed")
            }).SingleOrDefaultAsync(cancellationToken);
        var roomCounts = await db.Rooms.AsNoTracking().Where(item => item.CenterId == centerId)
            .GroupBy(_ => 1).Select(group => new
            {
                Total = group.Count(),
                Active = group.Count(item => item.Status == "Active")
            }).SingleOrDefaultAsync(cancellationToken);

        var centerRooms = await db.Rooms.AsNoTracking()
            .Where(r => r.CenterId == centerId)
            .ToListAsync(cancellationToken);
        var roomMap = centerRooms.ToDictionary(r => r.Id, r => r);

        var centerClasses = await (from cls in db.Classes.AsNoTracking()
            join sport in db.Sports.AsNoTracking() on cls.SportId equals sport.Id
            where cls.CenterId == centerId
            select new { cls.Id, cls.Name, cls.Capacity, cls.Status, cls.RoomId, SportId = sport.Id, SportName = sport.Name })
            .ToDictionaryAsync(c => c.Id, cancellationToken);

        var classIds = centerClasses.Keys.ToArray();

        var primaryCoaches = await (from assignment in db.ClassCoaches.AsNoTracking()
            join coach in db.CoachProfiles.AsNoTracking() on assignment.CoachId equals coach.Id
            where classIds.Contains(assignment.ClassId) && assignment.IsPrimary
            select new { assignment.ClassId, coach.Id, coach.FullName })
            .ToDictionaryAsync(c => c.ClassId, cancellationToken);

        var allCoaches = await (from coach in db.CoachProfiles.AsNoTracking()
            where coach.CenterId == centerId
            select new { coach.Id, coach.FullName, coach.CoachCode, coach.Specialization, coach.Status })
            .ToListAsync(cancellationToken);
        var coachMap = allCoaches.ToDictionary(c => c.Id, c => c);

        var rawSessions = await db.ClassSessions.AsNoTracking()
            .Where(session => classIds.Contains(session.ClassId) && session.SessionDate >= @from && session.SessionDate <= to
                && session.SessionStatus != "Cancelled")
            .ToListAsync(cancellationToken);

        var sessionIds = rawSessions.Select(s => s.Id).ToArray();
        var bookingsCountBySession = await db.SessionBookings.AsNoTracking()
            .Where(booking => sessionIds.Contains(booking.SessionId) && booking.Status == "Booked")
            .GroupBy(booking => booking.SessionId)
            .Select(g => new { SessionId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(item => item.SessionId, item => item.Count, cancellationToken);

        var sessionRows = rawSessions.Select(session =>
        {
            var cls = centerClasses[session.ClassId];
            var roomId = session.RoomId ?? cls.RoomId;
            var room = roomId.HasValue && roomMap.TryGetValue(roomId.Value, out var rm) ? rm : null;
            var coachId = session.CoachId ?? (primaryCoaches.TryGetValue(session.ClassId, out var pc) ? pc.Id : (long?)null);
            var coachName = coachId.HasValue && coachMap.TryGetValue(coachId.Value, out var cInfo) ? cInfo.FullName : "Chưa có Coach";
            var booked = bookingsCountBySession.GetValueOrDefault(session.Id, 0);

            return new
            {
                SessionId = session.Id,
                ClassId = cls.Id,
                ClassName = cls.Name,
                SportId = cls.SportId,
                SportName = cls.SportName,
                RoomId = room?.Id,
                RoomName = room?.Name,
                RoomType = room?.RoomType,
                RoomLocation = room?.LocationDescription,
                RoomCapacity = room?.Capacity ?? 0,
                CoachId = coachId,
                CoachName = coachName,
                Capacity = cls.Capacity,
                Booked = booked
            };
        }).ToArray();

        static decimal Rate(int booked, int capacity) => capacity > 0
            ? decimal.Round((decimal)booked / capacity * 100, 2) : 0;
        var totalBooked = sessionRows.Sum(row => row.Booked);
        var totalCapacity = sessionRows.Sum(row => row.Capacity);

        var classRows = sessionRows.GroupBy(row => new
            { row.ClassId, row.ClassName, row.SportName, row.CoachName, row.RoomName })
            .Select(group => new OperationalClassItem(
                group.Key.ClassId, group.Key.ClassName, group.Key.SportName, group.Key.CoachName, group.Key.RoomName,
                group.Count(), group.Sum(row => row.Booked), group.Sum(row => row.Capacity),
                Rate(group.Sum(row => row.Booked), group.Sum(row => row.Capacity))))
            .OrderByDescending(row => row.Booked).ThenByDescending(row => row.OccupancyRate).ThenBy(row => row.Name)
            .ToArray();

        var sportRows = sessionRows.GroupBy(row => new { row.SportId, row.SportName })
            .Select(group => new OperationalSportItem(
                group.Key.SportId, group.Key.SportName, group.Count(), group.Select(row => row.ClassId).Distinct().Count(),
                group.Sum(row => row.Booked), group.Sum(row => row.Capacity),
                Rate(group.Sum(row => row.Booked), group.Sum(row => row.Capacity)),
                totalBooked > 0 ? decimal.Round((decimal)group.Sum(row => row.Booked) / totalBooked * 100, 2) : 0))
            .OrderByDescending(row => row.Booked).ThenByDescending(row => row.OccupancyRate).ThenBy(row => row.Name)
            .ToArray();

        var roomRows = sessionRows.Where(row => row.RoomId.HasValue)
            .GroupBy(row => new { Id = row.RoomId!.Value, row.RoomName, row.RoomType, row.RoomLocation, row.RoomCapacity })
            .Select(group => new OperationalRoomItem(
                group.Key.Id, group.Key.RoomName!, group.Key.RoomType, group.Key.RoomLocation, group.Key.RoomCapacity,
                group.Count(), group.Select(row => row.ClassId).Distinct().Count(), group.Sum(row => row.Booked),
                group.Sum(row => row.Capacity), Rate(group.Sum(row => row.Booked), group.Sum(row => row.Capacity)),
                group.Select(row => row.ClassName).Distinct().OrderBy(name => name).ToArray()))
            .OrderByDescending(row => row.Booked).ThenByDescending(row => row.OccupancyRate).ThenBy(row => row.Name)
            .ToArray();

        var coachItems = allCoaches.Select(coach =>
        {
            var cSessions = sessionRows.Where(s => s.CoachId == coach.Id).ToArray();
            var cClassesCount = cSessions.Select(s => s.ClassId).Distinct().Count();
            var sCount = cSessions.Length;
            var booked = cSessions.Sum(s => s.Booked);
            var cap = cSessions.Sum(s => s.Capacity);
            return new OperationalCoachItem(
                coach.Id,
                coach.FullName,
                coach.CoachCode,
                coach.Specialization,
                coach.Status,
                cClassesCount,
                sCount,
                booked,
                cap,
                Rate(booked, cap)
            );
        }).OrderByDescending(c => c.Booked).ThenByDescending(c => c.SessionsCount).ToArray();

        return new OperationsReportResponse(
            centerId, from, to,
            personnel.Length,
            personnel.Count(row => isActive(row.ProfileStatus, row.UserStatus)),
            personnel.Count(row => row.Role.Equals("Manager", StringComparison.OrdinalIgnoreCase)),
            personnel.Count(row => row.Role.Equals("Coach", StringComparison.OrdinalIgnoreCase)),
            personnel.Count(row => row.Role.Equals("Receptionist", StringComparison.OrdinalIgnoreCase)),
            classCounts?.Total ?? 0, classCounts?.Active ?? 0,
            roomCounts?.Total ?? 0, roomCounts?.Active ?? 0,
            sessionRows.Length, totalBooked, totalCapacity, Rate(totalBooked, totalCapacity),
            classRows, sportRows, roomRows, coachItems);
    }

    private async Task EnsureCenterExistsAsync(long centerId, CancellationToken cancellationToken)
    {
        if (centerId <= 0 || !await _unitOfWork.Context.Centers.AnyAsync(
                center => center.Id == centerId, cancellationToken))
        {
            throw BusinessException.NotFound("Không tìm thấy trung tâm.");
        }
    }

    private static void ValidateRequest(DateOnly from, DateOnly to, string groupBy)
    {
        if (from > to || to == DateOnly.MaxValue || to.DayNumber - from.DayNumber > 365)
        {
            throw BusinessException.BadRequest("Khoảng ngày phải hợp lệ và không vượt quá 366 ngày.");
        }
        if (!string.Equals(groupBy?.Trim(), "day", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(groupBy?.Trim(), "month", StringComparison.OrdinalIgnoreCase))
        {
            throw BusinessException.BadRequest("groupBy chỉ nhận day hoặc month.");
        }
    }

    private static (DateTime StartUtc, DateTime EndUtc) GetUtcRange(
        DateOnly from, DateOnly to, TimeZoneInfo timeZone)
    {
        var startLocal = from.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);
        var endLocal = to.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);
        return (TimeZoneInfo.ConvertTimeToUtc(startLocal, timeZone), TimeZoneInfo.ConvertTimeToUtc(endLocal, timeZone));
    }

    private static IReadOnlyList<DateOnly> CreatePeriodStarts(DateOnly from, DateOnly to, string groupBy)
    {
        var result = new SortedSet<DateOnly>();
        var day = from;
        while (day <= to)
        {
            var period = groupBy.Trim().Equals("month", StringComparison.OrdinalIgnoreCase)
                ? new DateOnly(day.Year, day.Month, 1)
                : day;
            result.Add(period);
            day = groupBy.Trim().Equals("month", StringComparison.OrdinalIgnoreCase)
                ? period.AddMonths(1)
                : day.AddDays(1);
        }
        return result.ToArray();
    }

    private static DateOnly PeriodFor(DateTime utc, string groupBy, TimeZoneInfo timeZone)
    {
        var local = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), timeZone);
        var date = DateOnly.FromDateTime(local);
        return groupBy.Trim().Equals("month", StringComparison.OrdinalIgnoreCase)
            ? new DateOnly(date.Year, date.Month, 1)
            : date;
    }

    private static string NormalizeStatus(string? status) =>
        string.IsNullOrWhiteSpace(status) ? "Unknown" : status.Trim();

    private TimeZoneInfo GetReportTimeZone()
    {
        var configured = _configuration["Reports:TimeZoneId"];
        if (!string.IsNullOrWhiteSpace(configured))
        {
            return TimeZoneInfo.FindSystemTimeZoneById(configured);
        }
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
        }
    }

    private sealed record StatusEvent(string Status, DateTime CreatedAtUtc);
}
