// Kiểm thử số hội viên hiển thị trên gói tập (SQLite in-memory, không cần PostgreSQL):
// chỉ đếm hội viên khác nhau đang có gói còn hiệu lực; lượt huỷ/hoàn tiền/chờ thanh toán/hết hạn không tính,
// nhưng gói đã từng có giao dịch vẫn bị khoá sửa.
// Chạy: dotnet run --project Backend/verification/PackageSubscriberCountAudit
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SportsCenterManagement.BLL.Common;
using SportsCenterManagement.BLL.Services;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;
using SportsCenterManagement.DAL.Repositories.Implementations;

var failures = 0;
void Check(string name, bool ok, string detail = "")
{
    Console.WriteLine((ok ? "PASS " : "FAIL ") + name + (ok ? "" : " " + detail));
    if (!ok) failures++;
}

await using var connection = new SqliteConnection("Data Source=:memory:");
await connection.OpenAsync();
await using var db = new SportsCenterDbContext(new DbContextOptionsBuilder<SportsCenterDbContext>().UseSqlite(connection).Options);
await db.Database.EnsureCreatedAsync();
var now = DateTime.UtcNow;
var today = VietnamTime.Today;
var role = new Role { Name = "Member", CreatedAt = now };
db.Roles.Add(role);
var center = new Center { Name = "A", Address = "A", Status = "Active", CreatedAt = now };
db.Centers.Add(center);
await db.SaveChangesAsync();

MemberProfile NewMember(int i)
{
    var user = new User { Username = "m" + i, Email = $"m{i}@example.test", PasswordHash = "x", RoleId = role.Id, Status = "Active", CreatedAt = now };
    db.Users.Add(user);
    db.SaveChanges();
    var profile = new MemberProfile { UserId = user.Id, CenterId = center.Id, MemberCode = "M" + i, FullName = "Member " + i, CreatedAt = now };
    db.Set<MemberProfile>().Add(profile);
    db.SaveChanges();
    return profile;
}
MembershipPackage NewPackage(string name)
{
    var p = new MembershipPackage { CenterId = center.Id, Name = name, DurationDays = 30, Price = 100, Status = "Active", CreatedAt = now };
    db.MembershipPackages.Add(p);
    db.SaveChanges();
    return p;
}
void Sub(MemberProfile m, MembershipPackage p, string status, int endOffsetDays = 20) =>
    db.MemberSubscriptions.Add(new MemberSubscription
    {
        MemberId = m.Id, PackageId = p.Id, Status = status, DurationDays = 30, Price = 100, CreatedAt = now,
        StartDate = today.AddDays(endOffsetDays - 30), EndDate = today.AddDays(endOffsetDays)
    });

var basic = NewPackage("Basic");
var pro = NewPackage("Pro");
var empty = NewPackage("Empty");
var m1 = NewMember(1); var m2 = NewMember(2); var m3 = NewMember(3);
// Basic: m1 hủy 9 lần + 1 gói đang dùng; m2 hoàn tiền; m3 có gói đã hết hạn nhưng chưa đổi trạng thái.
for (var i = 0; i < 9; i++) Sub(m1, basic, "Cancelled");
Sub(m1, basic, "Active");
Sub(m2, basic, "Refunded");
Sub(m3, basic, "Active", endOffsetDays: -1);
// Pro: chỉ có một lượt chờ thanh toán.
Sub(m2, pro, "PendingPayment");
await db.SaveChangesAsync();
db.ChangeTracker.Clear();

var service = new MembershipPackageService(new UnitOfWork(db));
var packages = (await service.GetPackagesAsync(center.Id)).ToDictionary(p => p.Name);

Check("Basic đếm 1 hội viên đang dùng (không tính 9 lượt hủy, hoàn tiền, gói hết hạn)",
    packages["Basic"].SubscriberCount == 1, $"got {packages["Basic"].SubscriberCount}");
Check("Basic vẫn khoá sửa vì đã có giao dịch", packages["Basic"].HasOrders && !packages["Basic"].IsEditable);
Check("Pro chỉ chờ thanh toán: 0 hội viên đang dùng", packages["Pro"].SubscriberCount == 0, $"got {packages["Pro"].SubscriberCount}");
Check("Pro vẫn khoá sửa vì đã có lượt đặt", packages["Pro"].HasOrders && !packages["Pro"].IsEditable);
Check("Gói chưa có giao dịch: 0 và sửa được", packages["Empty"].SubscriberCount == 0 && packages["Empty"].IsEditable);

var toggled = await service.SetPackageStatusAsync(0, center.Id, basic.Id, "Active");
Check("Đổi trạng thái trả cùng cách đếm", toggled.SubscriberCount == 1, $"got {toggled.SubscriberCount}");

Console.WriteLine(failures == 0 ? "All checks passed." : $"{failures} check(s) failed.");
return failures == 0 ? 0 : 1;
