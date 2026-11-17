// Kiểm thử logic báo cáo doanh thu và hoàn tiền trên SQLite in-memory (không cần PostgreSQL).
// Chạy: dotnet run --project Backend/verification/ReportLogicAudit
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SportsCenterManagement.BLL.Common;
using SportsCenterManagement.BLL.DTOs.Payments;
using SportsCenterManagement.BLL.Services;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;
using SportsCenterManagement.DAL.Repositories.Implementations;

var failures = new List<string>();
var checks = 0;
var config = new ConfigurationBuilder().Build();
var vnTime = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vnTime));
var from = today.AddDays(-3);
var to = today.AddDays(1);
var paidAt = DateTime.UtcNow.AddHours(-1);

async Task Check(string name, Func<Task<bool>> assertion)
{
    checks++;
    try
    {
        if (!await assertion()) throw new InvalidOperationException("Assertion failed");
        Console.WriteLine("PASS " + name);
    }
    catch (Exception exception)
    {
        failures.Add(name + ": " + exception.Message);
        Console.WriteLine("FAIL " + name + ": " + exception.Message);
    }
}

// Mỗi kịch bản dùng một database riêng để dữ liệu không ảnh hưởng nhau.
async Task<Fixture> NewFixture()
{
    var connection = new SqliteConnection("Data Source=:memory:");
    await connection.OpenAsync();
    var options = new DbContextOptionsBuilder<SportsCenterDbContext>().UseSqlite(connection).Options;
    var db = new SportsCenterDbContext(options);
    await db.Database.EnsureCreatedAsync();
    var now = DateTime.UtcNow;
    var managerRole = new Role { Name = "Manager", CreatedAt = now };
    var memberRole = new Role { Name = "Member", CreatedAt = now };
    db.Roles.AddRange(managerRole, memberRole);
    await db.SaveChangesAsync();
    var manager = new User { Username = "manager", Email = "manager@example.test", PasswordHash = "x", RoleId = managerRole.Id, Status = "Active", CreatedAt = now };
    var memberUser = new User { Username = "member", Email = "member@example.test", PasswordHash = "x", RoleId = memberRole.Id, Status = "Active", CreatedAt = now };
    db.Users.AddRange(manager, memberUser);
    var center = new Center { Name = "Center", Address = "Address", Status = "Active", CreatedAt = now };
    db.Centers.Add(center);
    await db.SaveChangesAsync();
    var member = new MemberProfile { UserId = memberUser.Id, CenterId = center.Id, MemberCode = "M001", FullName = "Member", CreatedAt = now };
    db.MemberProfiles.Add(member);
    await db.SaveChangesAsync();
    return new Fixture(connection, db, center, manager, member);
}

async Task<(Invoice Invoice, Payment Payment)> PaidInvoice(Fixture f, string number, decimal amount,
    string status = "Paid", params InvoiceItem[] items)
{
    var invoice = new Invoice
    {
        InvoiceNumber = number, MemberId = f.Member.Id, CenterId = f.Center.Id, Subtotal = amount,
        TotalAmount = amount, Status = status, IssuedAt = paidAt, PaidAt = paidAt
    };
    f.Db.Invoices.Add(invoice);
    await f.Db.SaveChangesAsync();
    foreach (var item in items)
    {
        item.InvoiceId = invoice.Id;
        f.Db.InvoiceItems.Add(item);
    }
    var payment = new Payment
    {
        InvoiceId = invoice.Id, MemberId = f.Member.Id, PaymentMethod = "CASH", Amount = amount,
        AmountReceived = amount, PaymentStatus = "Succeeded", PaidAt = paidAt, CreatedAt = paidAt, AttemptedAt = paidAt
    };
    f.Db.Payments.Add(payment);
    await f.Db.SaveChangesAsync();
    return (invoice, payment);
}

PaymentRefund Refund(Fixture f, Payment payment, decimal amount, string status, string key) => new()
{
    PaymentId = payment.Id, Amount = amount, Status = status, IdempotencyKey = key, Reason = "Hoàn tiền kiểm thử",
    RequestedBy = f.Manager.Id, CreatedAt = paidAt, ProcessedAt = DateTime.UtcNow.AddMinutes(-5),
    BankName = "VCB", BankAccountNumber = "0123456789", BankAccountName = "MEMBER"
};

async Task<(Sport Sport, ClassEntity Class)> SportClass(Fixture f, string name)
{
    var sport = new Sport { CenterId = f.Center.Id, Name = name, Status = "Active" };
    f.Db.Sports.Add(sport);
    await f.Db.SaveChangesAsync();
    var cls = new ClassEntity
    {
        CenterId = f.Center.Id, SportId = sport.Id, Name = name + " class", Capacity = 10, DurationMinutes = 60,
        Status = "Published", CreatedAt = paidAt
    };
    f.Db.Classes.Add(cls);
    await f.Db.SaveChangesAsync();
    return (sport, cls);
}

async Task<ClassEnrollment> Enroll(Fixture f, ClassEntity cls, long? subscriptionId = null)
{
    var enrollment = new ClassEnrollment
    {
        ClassId = cls.Id, MemberId = f.Member.Id, SubscriptionId = subscriptionId, RegisteredAt = paidAt, Status = "Confirmed"
    };
    f.Db.ClassEnrollments.Add(enrollment);
    await f.Db.SaveChangesAsync();
    return enrollment;
}

async Task<(MembershipPackage Package, MemberSubscription Subscription)> PackageSubscription(
    Fixture f, decimal price, MembershipPackage? package = null, string status = "Active")
{
    if (package is null)
    {
        package = new MembershipPackage { CenterId = f.Center.Id, Name = "Gói tháng", DurationDays = 30, Price = price, Status = "Active", CreatedAt = paidAt };
        f.Db.MembershipPackages.Add(package);
        await f.Db.SaveChangesAsync();
    }
    var subscription = new MemberSubscription
    {
        MemberId = f.Member.Id, PackageId = package.Id, StartDate = today, EndDate = today.AddDays(29),
        DurationDays = 30, Price = price, Status = status, CreatedAt = paidAt
    };
    f.Db.MemberSubscriptions.Add(subscription);
    await f.Db.SaveChangesAsync();
    return (package, subscription);
}

ReportService Reports(Fixture f) =>
    new(new UnitOfWork(f.Db), new PaymentService(new UnitOfWork(f.Db), null!, null!, config), config);

await Check("doanh thu thuần chỉ tính hóa đơn chưa hoàn: thu 800k, hoàn 300k, thuần 500k", async () =>
{
    await using var f = await NewFixture();
    await PaidInvoice(f, "INV-A", 500_000m);
    var (_, paymentB) = await PaidInvoice(f, "INV-B", 300_000m, "Refunded");
    f.Db.PaymentRefunds.Add(Refund(f, paymentB, 300_000m, "Succeeded", "refund-b"));
    await f.Db.SaveChangesAsync();
    var report = await Reports(f).GetRevenueReportAsync(f.Center.Id, from, to, "day");
    return report.Gross == 800_000m && report.Refunds == 300_000m && report.Net == 500_000m;
});

await Check("refund Pending/Rejected/Failed không bị trừ vào doanh thu", async () =>
{
    await using var f = await NewFixture();
    var (_, payment) = await PaidInvoice(f, "INV-P", 300_000m);
    var pending = Refund(f, payment, 100_000m, "Pending", "pending");
    pending.ProcessedAt = null;
    f.Db.PaymentRefunds.AddRange(pending, Refund(f, payment, 100_000m, "Rejected", "rejected"),
        Refund(f, payment, 100_000m, "Failed", "failed"));
    await f.Db.SaveChangesAsync();
    var report = await Reports(f).GetRevenueReportAsync(f.Center.Id, from, to, "day");
    return report.Refunds == 0m && report.Net == 300_000m;
});

await Check("manager không thể hoàn lần hai khi refund thủ công Approved đã hoàn đủ tiền", async () =>
{
    await using var f = await NewFixture();
    var (_, payment) = await PaidInvoice(f, "INV-M", 300_000m, "Refunded");
    f.Db.PaymentRefunds.Add(Refund(f, payment, 300_000m, "Approved", "manual-approved"));
    await f.Db.SaveChangesAsync();
    var service = new PaymentService(new UnitOfWork(f.Db), null!, null!, config);
    try
    {
        await service.RefundPaymentAsync(f.Manager.Id, f.Center.Id, payment.Id, "second-refund",
            new CreateRefundRequest { Amount = 300_000m, Reason = "Hoàn lại lần hai" }, "127.0.0.1");
        return false;
    }
    catch (BusinessException)
    {
        return await f.Db.PaymentRefunds.CountAsync() == 1;
    }
});

await Check("manager vẫn hoàn được phần còn lại sau refund thủ công Approved một phần", async () =>
{
    await using var f = await NewFixture();
    var (_, payment) = await PaidInvoice(f, "INV-N", 300_000m, "PartiallyRefunded");
    f.Db.PaymentRefunds.Add(Refund(f, payment, 100_000m, "Approved", "manual-partial"));
    await f.Db.SaveChangesAsync();
    var service = new PaymentService(new UnitOfWork(f.Db), null!, null!, config);
    var result = await service.RefundPaymentAsync(f.Manager.Id, f.Center.Id, payment.Id, "rest-refund",
        new CreateRefundRequest { Amount = 200_000m, Reason = "Hoàn phần còn lại" }, "127.0.0.1");
    var report = await Reports(f).GetRevenueReportAsync(f.Center.Id, from, to, "day");
    return report.Refunds == 300_000m && report.Net == 0m;
});

await Check("doanh thu theo môn phân bổ theo giá từng dòng hóa đơn (600k/200k, không chia đều)", async () =>
{
    await using var f = await NewFixture();
    var (gym, gymClass) = await SportClass(f, "Gym");
    var (yoga, yogaClass) = await SportClass(f, "Yoga");
    var gymEnrollment = await Enroll(f, gymClass);
    var yogaEnrollment = await Enroll(f, yogaClass);
    await PaidInvoice(f, "INV-S", 800_000m, "Paid",
        new InvoiceItem { EnrollmentId = gymEnrollment.Id, Description = "Gym", Quantity = 1, UnitPrice = 600_000m, Amount = 600_000m },
        new InvoiceItem { EnrollmentId = yogaEnrollment.Id, Description = "Yoga", Quantity = 1, UnitPrice = 200_000m, Amount = 200_000m });
    var report = await Reports(f).GetSportRevenueReportAsync(f.Center.Id, from, to);
    var gymRow = report.Sports.Single(row => row.SportId == gym.Id);
    var yogaRow = report.Sports.Single(row => row.SportId == yoga.Id);
    return gymRow.Gross == 600_000m && yogaRow.Gross == 200_000m && gymRow.Share == 75m && yogaRow.Share == 25m
        && report.UnallocatedNet == 0m;
});

await Check("refund theo môn cũng phân bổ theo giá dòng hóa đơn", async () =>
{
    await using var f = await NewFixture();
    var (gym, gymClass) = await SportClass(f, "Gym");
    var (yoga, yogaClass) = await SportClass(f, "Yoga");
    var gymEnrollment = await Enroll(f, gymClass);
    var yogaEnrollment = await Enroll(f, yogaClass);
    var (_, payment) = await PaidInvoice(f, "INV-R", 800_000m, "PartiallyRefunded",
        new InvoiceItem { EnrollmentId = gymEnrollment.Id, Description = "Gym", Quantity = 1, UnitPrice = 600_000m, Amount = 600_000m },
        new InvoiceItem { EnrollmentId = yogaEnrollment.Id, Description = "Yoga", Quantity = 1, UnitPrice = 200_000m, Amount = 200_000m });
    f.Db.PaymentRefunds.Add(Refund(f, payment, 400_000m, "Succeeded", "sport-refund"));
    await f.Db.SaveChangesAsync();
    var report = await Reports(f).GetSportRevenueReportAsync(f.Center.Id, from, to);
    var gymRow = report.Sports.Single(row => row.SportId == gym.Id);
    var yogaRow = report.Sports.Single(row => row.SportId == yoga.Id);
    return gymRow.Refunds == 300_000m && yogaRow.Refunds == 100_000m && report.Net == 400_000m
        && gymRow.Net + yogaRow.Net == report.Net;
});

await Check("gói tập chỉ có lượt hủy muộn (CANCELLED_LATE_CHARGED) vẫn được phân bổ về đúng môn", async () =>
{
    await using var f = await NewFixture();
    var (yoga, yogaClass) = await SportClass(f, "Yoga");
    var (package, subscription) = await PackageSubscription(f, 400_000m);
    var session = new ClassSession
    {
        ClassId = yogaClass.Id, SessionDate = today, StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(9, 0),
        SessionStatus = "Scheduled", CreatedAt = paidAt
    };
    f.Db.ClassSessions.Add(session);
    await f.Db.SaveChangesAsync();
    f.Db.SessionBookings.Add(new SessionBooking
    {
        SessionId = session.Id, MemberId = f.Member.Id, SubscriptionId = subscription.Id, BookedAt = paidAt,
        Status = "CANCELLED_LATE_CHARGED"
    });
    await PaidInvoice(f, "INV-L", 400_000m, "Paid",
        new InvoiceItem { PackageId = package.Id, SubscriptionId = subscription.Id, Description = "Gói", Quantity = 1, UnitPrice = 400_000m, Amount = 400_000m });
    var report = await Reports(f).GetSportRevenueReportAsync(f.Center.Id, from, to);
    return report.Sports.Any(row => row.SportId == yoga.Id && row.Gross == 400_000m) && report.UnallocatedNet == 0m;
});

await Check("số gói đã bán không đếm hóa đơn đã hoàn toàn bộ; doanh thu gói đã trừ refund", async () =>
{
    await using var f = await NewFixture();
    var (package, refundedSubscription) = await PackageSubscription(f, 500_000m, status: "Refunded");
    var (_, keptSubscription) = await PackageSubscription(f, 500_000m, package);
    var (_, refundedPayment) = await PaidInvoice(f, "INV-G1", 500_000m, "Refunded",
        new InvoiceItem { PackageId = package.Id, SubscriptionId = refundedSubscription.Id, Description = "Gói", Quantity = 1, UnitPrice = 500_000m, Amount = 500_000m });
    await PaidInvoice(f, "INV-G2", 500_000m, "Paid",
        new InvoiceItem { PackageId = package.Id, SubscriptionId = keptSubscription.Id, Description = "Gói", Quantity = 1, UnitPrice = 500_000m, Amount = 500_000m });
    f.Db.PaymentRefunds.Add(Refund(f, refundedPayment, 500_000m, "Succeeded", "package-refund"));
    await f.Db.SaveChangesAsync();
    var report = await Reports(f).GetMembershipReportAsync(f.Center.Id, from, to, "day");
    var stats = report.Packages!.Single(item => item.Id == package.Id);
    return stats.SoldInPeriod == 1 && stats.RevenueInPeriod == 500_000m && stats.ActiveSubscribers == 1;
});

async Task<(MemberSubscription Subscription, Payment Payment)> PaidPackage(Fixture f, string number, decimal price)
{
    var (package, subscription) = await PackageSubscription(f, price);
    var (_, payment) = await PaidInvoice(f, number, price, "Paid",
        new InvoiceItem { PackageId = package.Id, SubscriptionId = subscription.Id, Description = "Gói", Quantity = 1, UnitPrice = price, Amount = price });
    return (subscription, payment);
}

await Check("manager hoàn một phần trực tiếp (giảm giá bù): gói vẫn giữ Active", async () =>
{
    await using var f = await NewFixture();
    var (subscription, payment) = await PaidPackage(f, "INV-PR", 300_000m);
    var service = new PaymentService(new UnitOfWork(f.Db), null!, null!, config);
    await service.RefundPaymentAsync(f.Manager.Id, f.Center.Id, payment.Id, "partial-package-refund",
        new CreateRefundRequest { Amount = 50_000m, Reason = "Giảm giá bù" }, "127.0.0.1");
    await f.Db.Entry(subscription).ReloadAsync();
    var invoice = await f.Db.Invoices.SingleAsync(i => i.Id == payment.InvoiceId);
    return subscription.Status == "Active" && invoice.Status == "PartiallyRefunded";
});

await Check("member gửi yêu cầu hoàn toàn bộ, manager duyệt: gói bị thu hồi", async () =>
{
    await using var f = await NewFixture();
    var (subscription, payment) = await PaidPackage(f, "INV-MR", 300_000m);
    f.Db.StaffProfiles.Add(new StaffProfile { UserId = f.Manager.Id, CenterId = f.Center.Id, StaffCode = "S001", FullName = "Manager", Position = "Manager", Status = "Active", CreatedAt = paidAt });
    f.Db.UploadedMedias.Add(new UploadedMedia { DriveFileId = "r2:refund-bills/proof.jpg", FileName = "proof.jpg", MimeType = "image/jpeg", FileUrl = "https://example.test/proof.jpg", CenterId = f.Center.Id, CreatedAt = paidAt });
    await f.Db.SaveChangesAsync();
    var service = new PaymentService(new UnitOfWork(f.Db), null!, null!, config);
    await service.SubmitManualRefundRequestAsync(f.Member.UserId, payment.Id, "member-request", new SubmitManualRefundRequest
    {
        Amount = 300_000m, Reason = "Chuyển nhà, xin nghỉ tập", BankName = "VCB",
        BankAccountNumber = "0123456789", BankAccountName = "MEMBER"
    });
    var request = await f.Db.PaymentRefunds.SingleAsync(r => r.PaymentId == payment.Id);
    await service.ReviewManualRefundRequestAsync(f.Manager.Id, f.Center.Id, request.Id, new ReviewManualRefundRequest
    {
        Status = "Approved", TransferProofUrl = "refund-bills/proof.jpg", ReviewNote = "Đã chuyển khoản"
    });
    await f.Db.Entry(subscription).ReloadAsync();
    return subscription.Status == "Refunded";
});

await Check("member yêu cầu hoàn một phần số tiền, được duyệt: gói bị thu hồi dù hóa đơn chỉ PartiallyRefunded", async () =>
{
    await using var f = await NewFixture();
    var (subscription, payment) = await PaidPackage(f, "INV-MP", 300_000m);
    f.Db.StaffProfiles.Add(new StaffProfile { UserId = f.Manager.Id, CenterId = f.Center.Id, StaffCode = "S001", FullName = "Manager", Position = "Manager", Status = "Active", CreatedAt = paidAt });
    f.Db.UploadedMedias.Add(new UploadedMedia { DriveFileId = "r2:refund-bills/proof.jpg", FileName = "proof.jpg", MimeType = "image/jpeg", FileUrl = "https://example.test/proof.jpg", CenterId = f.Center.Id, CreatedAt = paidAt });
    await f.Db.SaveChangesAsync();
    var service = new PaymentService(new UnitOfWork(f.Db), null!, null!, config);
    await service.SubmitManualRefundRequestAsync(f.Member.UserId, payment.Id, "member-partial", new SubmitManualRefundRequest
    {
        Amount = 200_000m, Reason = "Đã tập 10 ngày, xin hoàn phần còn lại", BankName = "VCB",
        BankAccountNumber = "0123456789", BankAccountName = "MEMBER"
    });
    var request = await f.Db.PaymentRefunds.SingleAsync(r => r.PaymentId == payment.Id);
    await service.ReviewManualRefundRequestAsync(f.Manager.Id, f.Center.Id, request.Id, new ReviewManualRefundRequest
    {
        Status = "Approved", TransferProofUrl = "refund-bills/proof.jpg"
    });
    await f.Db.Entry(subscription).ReloadAsync();
    var invoice = await f.Db.Invoices.SingleAsync(i => i.Id == payment.InvoiceId);
    return subscription.Status == "Refunded" && invoice.Status == "PartiallyRefunded";
});

await Check("hoàn toàn bộ gói tập: gói chuyển Refunded", async () =>
{
    await using var f = await NewFixture();
    var (subscription, payment) = await PaidPackage(f, "INV-FR", 300_000m);
    var service = new PaymentService(new UnitOfWork(f.Db), null!, null!, config);
    await service.RefundPaymentAsync(f.Manager.Id, f.Center.Id, payment.Id, "full-package-refund",
        new CreateRefundRequest { Amount = 300_000m, Reason = "Hoàn toàn bộ gói" }, "127.0.0.1");
    await f.Db.Entry(subscription).ReloadAsync();
    return subscription.Status == "Refunded";
});

await Check("hồ sơ hội viên sau khi gói bị hoàn tiền: không hiện ngày hết hạn, trạng thái REFUNDED", async () =>
{
    await using var f = await NewFixture();
    await PackageSubscription(f, 300_000m, status: "Refunded");
    var members = new MemberService(new UnitOfWork(f.Db), null!, new BusinessClock(config));
    var me = await members.GetMeAsync(f.Member.UserId);
    return me.PackageStatus == "REFUNDED" && me.PackageExpiry is null && me.PackageStartDate is null;
});

// Two chained purchases of the same package: A runs now, B is queued right after A.
async Task<(MemberSubscription A, Payment PayA, MemberSubscription B, Payment PayB, MemberSubscription C)> ChainedPackages(Fixture f)
{
    var (package, a) = await PackageSubscription(f, 300_000m);
    var (_, b) = await PackageSubscription(f, 300_000m, package);
    var (_, c) = await PackageSubscription(f, 300_000m, package);
    b.StartDate = today.AddDays(30); b.EndDate = today.AddDays(59);
    c.StartDate = today.AddDays(60); c.EndDate = today.AddDays(89);
    await f.Db.SaveChangesAsync();
    InvoiceItem Item(MemberSubscription s) => new() { PackageId = package.Id, SubscriptionId = s.Id, Description = "Gói", Quantity = 1, UnitPrice = 300_000m, Amount = 300_000m };
    var (_, payA) = await PaidInvoice(f, "INV-CA", 300_000m, "Paid", Item(a));
    var (_, payB) = await PaidInvoice(f, "INV-CB", 300_000m, "Paid", Item(b));
    await PaidInvoice(f, "INV-CC", 300_000m, "Paid", Item(c));
    return (a, payA, b, payB, c);
}

await Check("hoàn gói 1 đang chạy: gói gia hạn kế tiếp bắt đầu ngay hôm nay, giữ đủ số ngày", async () =>
{
    await using var f = await NewFixture();
    var (a, payA, b, _, c) = await ChainedPackages(f);
    var service = new PaymentService(new UnitOfWork(f.Db), null!, null!, config);
    await service.RefundPaymentAsync(f.Manager.Id, f.Center.Id, payA.Id, "refund-chain-a",
        new CreateRefundRequest { Amount = 300_000m, Reason = "Hoàn gói đang chạy" }, "127.0.0.1");
    foreach (var s in new[] { a, b, c }) await f.Db.Entry(s).ReloadAsync();
    return a.Status == "Refunded" && b.StartDate == today && b.EndDate == today.AddDays(29)
        && c.StartDate == today.AddDays(30) && c.EndDate == today.AddDays(59);
});

await Check("hoàn gói gia hạn ở giữa: gói sau dồn lên nối tiếp gói đang chạy", async () =>
{
    await using var f = await NewFixture();
    var (a, _, b, payB, c) = await ChainedPackages(f);
    var service = new PaymentService(new UnitOfWork(f.Db), null!, null!, config);
    await service.RefundPaymentAsync(f.Manager.Id, f.Center.Id, payB.Id, "refund-chain-b",
        new CreateRefundRequest { Amount = 300_000m, Reason = "Hoàn gói gia hạn" }, "127.0.0.1");
    foreach (var s in new[] { a, b, c }) await f.Db.Entry(s).ReloadAsync();
    return a.Status == "Active" && a.EndDate == today.AddDays(29) && b.Status == "Refunded"
        && c.StartDate == today.AddDays(30) && c.EndDate == today.AddDays(59);
});

await Check("hoàn gói: hủy ghi danh lớp và lịch đặt sắp tới dùng gói đó, giữ lịch sử buổi đã qua", async () =>
{
    await using var f = await NewFixture();
    var (subscription, payment) = await PaidPackage(f, "INV-BK", 300_000m);
    var (_, cls) = await SportClass(f, "Yoga");
    var enrollment = await Enroll(f, cls, subscription.Id);
    ClassSession Session(DateOnly date) => new()
    {
        ClassId = cls.Id, SessionDate = date, StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(9, 0),
        SessionStatus = "Scheduled", CreatedAt = paidAt
    };
    var past = Session(today.AddDays(-2));
    var future = Session(today.AddDays(2));
    f.Db.ClassSessions.AddRange(past, future);
    await f.Db.SaveChangesAsync();
    SessionBooking Booking(ClassSession s) => new()
    {
        SessionId = s.Id, MemberId = f.Member.Id, SubscriptionId = subscription.Id, EnrollmentId = enrollment.Id,
        BookedAt = paidAt, Status = "Booked"
    };
    var pastBooking = Booking(past);
    var futureBooking = Booking(future);
    var later = Session(today.AddDays(3));
    f.Db.ClassSessions.Add(later);
    await f.Db.SaveChangesAsync();
    // Generated from the enrollment only: no subscription stamped on the booking.
    var enrollmentOnlyBooking = Booking(later);
    enrollmentOnlyBooking.SubscriptionId = null;
    f.Db.SessionBookings.AddRange(pastBooking, futureBooking, enrollmentOnlyBooking);
    await f.Db.SaveChangesAsync();

    var service = new PaymentService(new UnitOfWork(f.Db), null!, null!, config);
    await service.RefundPaymentAsync(f.Manager.Id, f.Center.Id, payment.Id, "refund-bookings",
        new CreateRefundRequest { Amount = 300_000m, Reason = "Hoàn gói đang học" }, "127.0.0.1");
    foreach (var e in new object[] { enrollment, pastBooking, futureBooking, enrollmentOnlyBooking }) await f.Db.Entry(e).ReloadAsync();
    return enrollment.Status == "Cancelled" && enrollment.CancelledAt != null
        && futureBooking.Status == "Cancelled" && enrollmentOnlyBooking.Status == "Cancelled"
        && pastBooking.Status == "Booked";
});

async Task<(User CoachUser, CoachProfile Coach)> PrimaryCoach(Fixture f, ClassEntity cls)
{
    var role = await f.Db.Roles.SingleOrDefaultAsync(r => r.Name == "Coach") ?? new Role { Name = "Coach", CreatedAt = paidAt };
    if (role.Id == 0) { f.Db.Roles.Add(role); await f.Db.SaveChangesAsync(); }
    var user = new User { Username = "coach", Email = "coach@example.test", PasswordHash = "x", RoleId = role.Id, Status = "Active", CreatedAt = paidAt };
    f.Db.Users.Add(user);
    await f.Db.SaveChangesAsync();
    var coach = new CoachProfile { UserId = user.Id, CenterId = f.Center.Id, CoachCode = "C001", FullName = "Coach", Status = "Active", CreatedAt = paidAt };
    f.Db.CoachProfiles.Add(coach);
    await f.Db.SaveChangesAsync();
    f.Db.ClassCoaches.Add(new ClassCoach { ClassId = cls.Id, CoachId = coach.Id, IsPrimary = true });
    await f.Db.SaveChangesAsync();
    return (user, coach);
}

async Task<MemberProfile> ExtraMember(Fixture f, string code)
{
    var role = await f.Db.Roles.SingleAsync(r => r.Name == "Member");
    var user = new User { Username = code, Email = code + "@example.test", PasswordHash = "x", RoleId = role.Id, Status = "Active", CreatedAt = paidAt };
    f.Db.Users.Add(user);
    await f.Db.SaveChangesAsync();
    var member = new MemberProfile { UserId = user.Id, CenterId = f.Center.Id, MemberCode = code, FullName = code, CreatedAt = paidAt };
    f.Db.MemberProfiles.Add(member);
    await f.Db.SaveChangesAsync();
    return member;
}

await Check("danh sách học viên của coach chỉ gồm ghi danh còn hiệu lực hoặc lịch học sắp tới", async () =>
{
    await using var f = await NewFixture();
    var (_, cls) = await SportClass(f, "Gym");
    var (coachUser, _) = await PrimaryCoach(f, cls);
    var former = await ExtraMember(f, "FORMER");
    ClassSession Session(DateOnly date) => new()
    {
        ClassId = cls.Id, SessionDate = date, StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(9, 0),
        SessionStatus = "Scheduled", CreatedAt = paidAt
    };
    var past = Session(today.AddDays(-5));
    var upcoming = Session(today.AddDays(2));
    f.Db.ClassSessions.AddRange(past, upcoming);
    await f.Db.SaveChangesAsync();
    f.Db.SessionBookings.AddRange(
        new SessionBooking { SessionId = past.Id, MemberId = former.Id, BookedAt = paidAt, Status = "Booked" },
        new SessionBooking { SessionId = upcoming.Id, MemberId = f.Member.Id, BookedAt = paidAt, Status = "Booked" });
    await f.Db.SaveChangesAsync();
    var json = System.Text.Json.JsonSerializer.Serialize(await new TrainingService(f.Db).ListMembersAsync(coachUser.Id, cls.Id, default));
    return json.Contains("\"M001\"") && !json.Contains("\"FORMER\"");
});

await Check("hoàn gói giải phóng chỗ: hội viên đầu danh sách chờ được tự động nhận chỗ", async () =>
{
    await using var f = await NewFixture();
    var (subscription, payment) = await PaidPackage(f, "INV-WL", 300_000m);
    var (_, cls) = await SportClass(f, "Boxing");
    cls.Capacity = 1;
    await PrimaryCoach(f, cls);
    var session = new ClassSession
    {
        ClassId = cls.Id, SessionDate = today.AddDays(2), StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(9, 0),
        SessionStatus = "Scheduled", CreatedAt = paidAt
    };
    f.Db.ClassSessions.Add(session);
    await f.Db.SaveChangesAsync();
    f.Db.SessionBookings.Add(new SessionBooking
    {
        SessionId = session.Id, MemberId = f.Member.Id, SubscriptionId = subscription.Id, BookedAt = paidAt, Status = "Booked"
    });
    var waiting = await ExtraMember(f, "WAIT");
    var package = await f.Db.MembershipPackages.SingleAsync();
    f.Db.MemberSubscriptions.Add(new MemberSubscription
    {
        MemberId = waiting.Id, PackageId = package.Id, StartDate = today, EndDate = today.AddDays(29),
        DurationDays = 30, Price = 300_000m, Status = "Active", CreatedAt = paidAt
    });
    f.Db.ClassWaitlists.Add(new ClassWaitlist { SessionId = session.Id, ClassId = cls.Id, MemberId = waiting.Id, JoinedAt = paidAt, Status = "Waiting" });
    await f.Db.SaveChangesAsync();

    var bookings = new SessionBookingService(new UnitOfWork(f.Db), null!, null!);
    var service = new PaymentService(new UnitOfWork(f.Db), null!, null!, config, sessionBookings: bookings);
    await service.RefundPaymentAsync(f.Manager.Id, f.Center.Id, payment.Id, "refund-waitlist",
        new CreateRefundRequest { Amount = 300_000m, Reason = "Hoàn gói, nhường chỗ" }, "127.0.0.1");
    return await f.Db.SessionBookings.AnyAsync(b => b.SessionId == session.Id && b.MemberId == waiting.Id && b.Status == "Booked")
        && await f.Db.ClassWaitlists.AnyAsync(w => w.MemberId == waiting.Id && w.Status == "Promoted");
});

Console.WriteLine($"{checks - failures.Count}/{checks} checks passed");
return failures.Count == 0 ? 0 : 1;

sealed record Fixture(SqliteConnection Connection, SportsCenterDbContext Db, Center Center, User Manager, MemberProfile Member)
    : IAsyncDisposable
{
    public async ValueTask DisposeAsync()
    {
        await Db.DisposeAsync();
        await Connection.DisposeAsync();
    }
}
