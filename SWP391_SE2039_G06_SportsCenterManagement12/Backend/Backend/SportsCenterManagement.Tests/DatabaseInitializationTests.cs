using Microsoft.EntityFrameworkCore;
using SportsCenterManagement.BLL.Common.Helpers;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;
using Xunit;

namespace SportsCenterManagement.Tests;

public sealed class DatabaseInitializationTests
{
    private static SportsCenterDbContext CreateDatabase() => new(new DbContextOptionsBuilder<SportsCenterDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString("N")).Options);

    [Fact]
    public async Task RestartPreservesSavedValuesAndDoesNotRecreateRenamedOrCancelledDemoData()
    {
        await using var db = CreateDatabase();
        await DbInitializer.SeedAsync(db);
        var package = await db.MembershipPackages.FirstAsync();
        var member = await db.MemberProfiles.SingleAsync(item => item.MemberCode == "MEM-00002");
        var user = await db.Users.SingleAsync(item => item.Id == member.UserId);
        var subscription = await db.MemberSubscriptions.FirstAsync(item => item.MemberId == member.Id);
        var room = await db.Rooms.FirstAsync();
        var passwordHash = PasswordHashing.Hash("Changed@Password456!");
        var lockedUntil = DateTime.UtcNow.AddDays(2);
        package.Name = "Gói đã đổi tên";
        package.Price = 1234567m;
        package.DurationDays = 47;
        package.Description = "Mô tả do quản lý lưu";
        package.Status = "Inactive";
        user.Email = "edited@example.test";
        user.Phone = "0912345678";
        user.PasswordHash = passwordHash;
        user.Status = "Disabled";
        user.FailedLoginAttempts = 3;
        user.LockedUntil = lockedUntil;
        member.FullName = "Hồ sơ đã chỉnh sửa";
        member.HeightCm = 180;
        member.WeightKg = 80;
        member.FitnessGoal = "Mục tiêu đã lưu";
        subscription.Status = "Cancelled";
        room.Name = "Phòng đã đổi tên";
        room.Capacity = 17;
        await db.SaveChangesAsync();
        var counts = new[] { await db.Users.CountAsync(), await db.MembershipPackages.CountAsync(),
            await db.Rooms.CountAsync(), await db.MemberSubscriptions.CountAsync() };

        await DbInitializer.SeedAsync(db);
        db.ChangeTracker.Clear();

        var savedPackage = await db.MembershipPackages.SingleAsync(item => item.Id == package.Id);
        Assert.Equal("Gói đã đổi tên", savedPackage.Name);
        Assert.Equal(1234567m, savedPackage.Price);
        Assert.Equal(47, savedPackage.DurationDays);
        Assert.Equal("Mô tả do quản lý lưu", savedPackage.Description);
        Assert.Equal("Inactive", savedPackage.Status);
        var savedUser = await db.Users.SingleAsync(item => item.Id == user.Id);
        Assert.Equal("edited@example.test", savedUser.Email);
        Assert.Equal("0912345678", savedUser.Phone);
        Assert.Equal(passwordHash, savedUser.PasswordHash);
        Assert.Equal("Disabled", savedUser.Status);
        Assert.Equal(3, savedUser.FailedLoginAttempts);
        Assert.Equal(lockedUntil, savedUser.LockedUntil);
        var savedMember = await db.MemberProfiles.SingleAsync(item => item.Id == member.Id);
        Assert.Equal("Hồ sơ đã chỉnh sửa", savedMember.FullName);
        Assert.Equal(180, savedMember.HeightCm);
        Assert.Equal(80, savedMember.WeightKg);
        Assert.Equal("Mục tiêu đã lưu", savedMember.FitnessGoal);
        Assert.Equal("Cancelled", (await db.MemberSubscriptions.SingleAsync(item => item.Id == subscription.Id)).Status);
        Assert.Equal("Phòng đã đổi tên", (await db.Rooms.SingleAsync(item => item.Id == room.Id)).Name);
        Assert.Equal(counts, new[] { await db.Users.CountAsync(), await db.MembershipPackages.CountAsync(),
            await db.Rooms.CountAsync(), await db.MemberSubscriptions.CountAsync() });
    }

    [Fact]
    public async Task ExistingDatabaseIsNotFilledWithDemoAccountsOrPackagesOnStartup()
    {
        await using var db = CreateDatabase();
        await db.Database.EnsureCreatedAsync();
        db.Centers.Add(new Center { Name = "Trung tâm đang sử dụng", Address = "Địa chỉ kiểm thử", Status = "Active", CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        await DbInitializer.SeedAsync(db);
        await DbInitializer.SeedAsync(db);

        Assert.Single(await db.Centers.ToListAsync());
        Assert.Empty(await db.Users.ToListAsync());
        Assert.Empty(await db.MembershipPackages.ToListAsync());
        Assert.NotEmpty(await db.Roles.ToListAsync());
    }

    [Fact]
    public async Task ProductionInitializationCreatesRolesWithoutDemoBusinessData()
    {
        await using var db = CreateDatabase();
        await DbInitializer.SeedAsync(db, seedDemoData: false);
        await DbInitializer.SeedAsync(db, seedDemoData: false);
        Assert.Empty(await db.Users.ToListAsync());
        Assert.Empty(await db.Centers.ToListAsync());
        Assert.Contains(await db.Roles.ToListAsync(), role => role.Name == "Member");
        Assert.Contains(await db.Roles.ToListAsync(), role => role.Name == "Manager");
    }
}
