using Microsoft.EntityFrameworkCore;
using SportsCenterManagement.BLL.Common.Helpers;
using SportsCenterManagement.DAL.Authorization;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;

namespace SportsCenterManagement.API.Authentication;

/// <summary>
/// Creates disposable local accounts only when an operator explicitly enables the development switch.
/// It never changes an existing account, including its password or role.
/// </summary>
public static class DevelopmentAccountBootstrapper
{
    public static async Task SeedAsync(SportsCenterDbContext db, IConfiguration configuration, IHostEnvironment environment)
    {
        if (!environment.IsDevelopment() || !configuration.GetValue<bool>("DevelopmentBootstrap:SeedDemoAccounts"))
        {
            return;
        }

        var center = await ResolveCenterAsync(db, configuration);
        var roles = await db.Roles.ToDictionaryAsync(role => role.Name, StringComparer.OrdinalIgnoreCase);
        var resetExistingAccounts = configuration.GetValue<bool>("DevelopmentBootstrap:ResetExistingDemoAccounts");
        var now = DateTime.UtcNow;

        var admin = await AddAccountIfMissingAsync(db, roles, "Admin", "admin", "admin@sportscenter.vn", "Admin@123456", now, resetExistingAccounts);
        var manager = await AddAccountIfMissingAsync(db, roles, "Manager", "manager01", "manager01@sportscenter.vn", "Manager@123456", now, resetExistingAccounts);
        var receptionist = await AddAccountIfMissingAsync(db, roles, "Receptionist", "reception01", "reception01@sportscenter.vn", "Reception@123456", now, resetExistingAccounts);
        var coach = await AddAccountIfMissingAsync(db, roles, "Coach", "coach01", "coach01@sportscenter.vn", "Coach@123456", now, resetExistingAccounts);
        var member = await AddAccountIfMissingAsync(db, roles, "Member", "member01", "member01@sportscenter.vn", "Member@123456", now, resetExistingAccounts);

        await db.SaveChangesAsync();

        await AddStaffProfileIfMissingAsync(db, manager, center.Id, "DEV-MANAGER", "Quản lý phát triển", "Manager", now, resetExistingAccounts);
        await AddStaffProfileIfMissingAsync(db, receptionist, center.Id, "DEV-RECEPTION", "Lễ tân phát triển", "Receptionist", now, resetExistingAccounts);
        await AddCoachProfileIfMissingAsync(db, coach, center.Id, now, resetExistingAccounts);
        await AddMemberProfileIfMissingAsync(db, member, center.Id, now);
        await db.SaveChangesAsync();
    }

    private static async Task<Center> ResolveCenterAsync(SportsCenterDbContext db, IConfiguration configuration)
    {
        var configuredCenterId = configuration.GetValue<long?>("DevelopmentBootstrap:CenterId");
        if (configuredCenterId is > 0)
        {
            return await db.Centers.SingleOrDefaultAsync(center => center.Id == configuredCenterId && center.Status == "Active")
                ?? throw new InvalidOperationException("DevelopmentBootstrap:CenterId must identify an active center.");
        }

        var center = await db.Centers.SingleOrDefaultAsync(item => item.Name == "SCMS Local Development Center");
        if (center is not null)
        {
            return center;
        }

        center = new Center
        {
            Name = "SCMS Local Development Center",
            Address = "Local development only",
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };
        db.Centers.Add(center);
        await db.SaveChangesAsync();
        return center;
    }

    private static async Task<User?> AddAccountIfMissingAsync(
        SportsCenterDbContext db, IReadOnlyDictionary<string, Role> roles, string roleName,
        string username, string email, string password, DateTime now, bool resetExistingAccount)
    {
        var existing = await db.Users.SingleOrDefaultAsync(user => user.Username == username && user.Email == email);
        if (existing is not null)
        {
            if (resetExistingAccount)
            {
                existing.PasswordHash = PasswordHashing.Hash(password);
                existing.Status = "Active";
                existing.FailedLoginAttempts = 0;
                existing.LockedUntil = null;
                existing.AuthVersion += 1;
                existing.UpdatedAt = now;
            }
            return existing;
        }

        if (await db.Users.AnyAsync(user => user.Username == username || user.Email == email))
        {
            return null;
        }

        if (!roles.TryGetValue(roleName, out var role))
        {
            throw new InvalidOperationException($"Required role '{roleName}' is missing.");
        }

        var user = new User
        {
            Username = username,
            Email = email,
            PasswordHash = PasswordHashing.Hash(password),
            RoleId = role.Id,
            Status = "Active",
            CreatedAt = now
        };
        db.Users.Add(user);
        return user;
    }

    private static async Task AddStaffProfileIfMissingAsync(SportsCenterDbContext db, User? user, long centerId,
        string code, string fullName, string position, DateTime now, bool resetExisting = false)
    {
        if (user is null) return;
        var existing = await db.StaffProfiles.FirstOrDefaultAsync(profile => profile.UserId == user.Id);
        if (existing is not null)
        {
            if (resetExisting && (existing.Status != "Active" || existing.CenterId != centerId))
            {
                existing.Status = "Active";
                existing.CenterId = centerId;
                existing.UpdatedAt = now;
            }
            return;
        }
        db.StaffProfiles.Add(new StaffProfile
        {
            UserId = user.Id, CenterId = centerId, StaffCode = code, FullName = fullName,
            Position = position, Status = "Active", CreatedAt = now
        });
    }

    private static async Task AddCoachProfileIfMissingAsync(SportsCenterDbContext db, User? user, long centerId, DateTime now, bool resetExisting = false)
    {
        if (user is null) return;
        var existing = await db.CoachProfiles.FirstOrDefaultAsync(profile => profile.UserId == user.Id);
        if (existing is not null)
        {
            if (resetExisting && (existing.Status != "Active" || existing.CenterId != centerId))
            {
                existing.Status = "Active";
                existing.CenterId = centerId;
                existing.UpdatedAt = now;
            }
            return;
        }
        db.CoachProfiles.Add(new CoachProfile
        {
            UserId = user.Id, CenterId = centerId, CoachCode = "DEV-COACH", FullName = "Huấn luyện viên phát triển",
            Specialization = "General fitness", Status = "Active", CreatedAt = now
        });
    }

    private static async Task AddMemberProfileIfMissingAsync(SportsCenterDbContext db, User? user, long centerId, DateTime now)
    {
        if (user is null || await db.MemberProfiles.AnyAsync(profile => profile.UserId == user.Id)) return;
        db.MemberProfiles.Add(new MemberProfile
        {
            UserId = user.Id, CenterId = centerId, MemberCode = "DEV-MEMBER", FullName = "Hội viên phát triển", CreatedAt = now
        });
    }
}
