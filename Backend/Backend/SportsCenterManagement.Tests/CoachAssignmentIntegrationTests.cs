using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SportsCenterManagement.BLL.DTOs.Classes;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;
using Xunit;

namespace SportsCenterManagement.Tests;

public sealed class CoachAssignmentIntegrationTests
{
    [Fact]
    public async Task ManagerCanAssignCoachToNewDraftClassBeforeCreatingSchedule()
    {
        using var factory = new BranchApiFactory();
        var ids = await SeedAssignmentScenarioAsync(factory, includeExistingSchedule: false);
        using var client = factory.CreateClient();
        await BranchApiFactory.LoginAsync(client, "manager@test.local");

        using var response = await client.PostAsJsonAsync($"/api/classes/{ids.TargetClassId}/coaches",
            new { coachId = ids.CoachId, isPrimary = true });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var assignment = await response.Content.ReadFromJsonAsync<ClassCoachResponse>();
        Assert.NotNull(assignment);
        Assert.Equal(ids.TargetClassId, assignment.ClassId);
        Assert.Equal(ids.CoachId, assignment.CoachId);
        Assert.True(assignment.IsPrimary);

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<SportsCenterDbContext>();
        Assert.True(await db.ClassCoaches.AnyAsync(item => item.ClassId == ids.TargetClassId
            && item.CoachId == ids.CoachId && item.IsPrimary));
    }

    [Fact]
    public async Task AssigningCoachToCancelledClassIsRejected()
    {
        using var factory = new BranchApiFactory();
        var ids = await SeedAssignmentScenarioAsync(factory, includeExistingSchedule: false, targetStatus: "Cancelled");
        using var client = factory.CreateClient();
        await BranchApiFactory.LoginAsync(client, "manager@test.local");

        using var response = await client.PostAsJsonAsync($"/api/classes/{ids.TargetClassId}/coaches",
            new { coachId = ids.CoachId, isPrimary = true });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("Không thể phân công HLV", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task ScheduleCreatedAfterEarlyAssignmentStillRejectsCoachConflict()
    {
        using var factory = new BranchApiFactory();
        var ids = await SeedAssignmentScenarioAsync(factory, includeExistingSchedule: true);
        using var client = factory.CreateClient();
        await BranchApiFactory.LoginAsync(client, "manager@test.local");

        using var assignmentResponse = await client.PostAsJsonAsync($"/api/classes/{ids.TargetClassId}/coaches",
            new { coachId = ids.CoachId, isPrimary = true });
        Assert.Equal(HttpStatusCode.OK, assignmentResponse.StatusCode);

        using var scheduleResponse = await client.PostAsJsonAsync($"/api/classes/{ids.TargetClassId}/schedules", new
        {
            roomId = ids.TargetRoomId,
            dayOfWeek = ids.DayOfWeek,
            startTime = "08:30:00",
            endTime = "09:30:00",
            startDate = ids.StartDate,
            endDate = ids.EndDate
        });

        Assert.Equal(HttpStatusCode.Conflict, scheduleResponse.StatusCode);
        using var error = JsonDocument.Parse(await scheduleResponse.Content.ReadAsStringAsync());
        Assert.Equal("CM-04", error.RootElement.GetProperty("code").GetString());
        Assert.Contains("trùng khung giờ", error.RootElement.GetProperty("message").GetString());
    }

    [Fact]
    public async Task ReplacingPrimaryCoachRemovesFormerPrimaryAssignment()
    {
        using var factory = new BranchApiFactory();
        var ids = await SeedAssignmentScenarioAsync(factory, includeExistingSchedule: false);
        long replacementCoachId;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SportsCenterDbContext>();
            db.ClassCoaches.Add(new ClassCoach
            {
                ClassId = ids.TargetClassId, CoachId = ids.CoachId, IsPrimary = true, AssignedDate = ids.StartDate
            });
            replacementCoachId = await AddCoachAsync(db, ids.SportId, "replacement", "Replacement Coach");
            await db.SaveChangesAsync();
        }
        using var client = factory.CreateClient();
        await BranchApiFactory.LoginAsync(client, "manager@test.local");

        using var response = await client.PostAsJsonAsync($"/api/classes/{ids.TargetClassId}/coaches",
            new { coachId = replacementCoachId, isPrimary = true, replacePrimary = true });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await using var assertionScope = factory.Services.CreateAsyncScope();
        var assertionDb = assertionScope.ServiceProvider.GetRequiredService<SportsCenterDbContext>();
        var assignments = await assertionDb.ClassCoaches.Where(item => item.ClassId == ids.TargetClassId).ToListAsync();
        Assert.Single(assignments);
        Assert.Equal(replacementCoachId, assignments[0].CoachId);
        Assert.True(assignments[0].IsPrimary);
    }

    [Fact]
    public async Task AssignedCoachPreventsOverlappingSchedulesInsideTheSameClass()
    {
        using var factory = new BranchApiFactory();
        var ids = await SeedAssignmentScenarioAsync(factory, includeExistingSchedule: false);
        using var client = factory.CreateClient();
        await BranchApiFactory.LoginAsync(client, "manager@test.local");
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync($"/api/classes/{ids.TargetClassId}/coaches",
            new { coachId = ids.CoachId, isPrimary = true })).StatusCode);

        var first = new { roomId = ids.TargetRoomId, dayOfWeek = ids.DayOfWeek, startTime = "08:00:00",
            endTime = "09:00:00", startDate = ids.StartDate, endDate = ids.EndDate };
        Assert.Equal(HttpStatusCode.Created,
            (await client.PostAsJsonAsync($"/api/classes/{ids.TargetClassId}/schedules", first)).StatusCode);

        using var response = await client.PostAsJsonAsync($"/api/classes/{ids.TargetClassId}/schedules", new
        {
            roomId = ids.AlternateRoomId, dayOfWeek = ids.DayOfWeek, startTime = "08:30:00",
            endTime = "09:30:00", startDate = ids.StartDate, endDate = ids.EndDate
        });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        using var error = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("CM-04", error.RootElement.GetProperty("code").GetString());
    }

    [Fact]
    public async Task ScheduleCreatedAfterEarlyAssignmentRejectsApprovedCoachLeave()
    {
        using var factory = new BranchApiFactory();
        var ids = await SeedAssignmentScenarioAsync(factory, includeExistingSchedule: false);
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SportsCenterDbContext>();
            db.CoachLeaves.Add(new CoachLeave
            {
                CoachId = ids.CoachId,
                StartAt = ids.StartDate.ToDateTime(new TimeOnly(7, 30)),
                EndAt = ids.StartDate.ToDateTime(new TimeOnly(10, 0)),
                Status = "Approved"
            });
            await db.SaveChangesAsync();
        }
        using var client = factory.CreateClient();
        await BranchApiFactory.LoginAsync(client, "manager@test.local");
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync($"/api/classes/{ids.TargetClassId}/coaches",
            new { coachId = ids.CoachId, isPrimary = true })).StatusCode);

        using var response = await client.PostAsJsonAsync($"/api/classes/{ids.TargetClassId}/schedules", new
        {
            roomId = ids.TargetRoomId, dayOfWeek = ids.DayOfWeek, startTime = "08:00:00",
            endTime = "09:00:00", startDate = ids.StartDate, endDate = ids.EndDate
        });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        using var error = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("CM-05", error.RootElement.GetProperty("code").GetString());
    }

    [Fact]
    public async Task ScheduleCreatedAfterEarlyAssignmentEnforcesDailyTeachingLimit()
    {
        using var factory = new BranchApiFactory();
        var ids = await SeedAssignmentScenarioAsync(factory, includeExistingSchedule: false);
        using var client = factory.CreateClient();
        await BranchApiFactory.LoginAsync(client, "manager@test.local");
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync($"/api/classes/{ids.TargetClassId}/coaches",
            new { coachId = ids.CoachId, isPrimary = true })).StatusCode);

        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync(
            $"/api/classes/{ids.TargetClassId}/schedules", new
            {
                roomId = ids.TargetRoomId, dayOfWeek = ids.DayOfWeek, startTime = "00:00:00",
                endTime = "08:00:00", startDate = ids.StartDate, endDate = ids.EndDate
            })).StatusCode);

        using var response = await client.PostAsJsonAsync($"/api/classes/{ids.TargetClassId}/schedules", new
        {
            roomId = ids.TargetRoomId, dayOfWeek = ids.DayOfWeek, startTime = "09:00:00",
            endTime = "10:00:00", startDate = ids.StartDate, endDate = ids.EndDate
        });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        using var error = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("CM-06", error.RootElement.GetProperty("code").GetString());
    }

    private static async Task<AssignmentScenario> SeedAssignmentScenarioAsync(
        BranchApiFactory factory,
        bool includeExistingSchedule,
        string targetStatus = "Draft")
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<SportsCenterDbContext>();
        var coachRole = await db.Roles.SingleAsync(role => role.Name == "Coach");
        var coachUser = new User
        {
            RoleId = coachRole.Id, Username = "assignment-coach", Email = "assignment-coach@test.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(BranchApiFactory.Password, workFactor: 4),
            Status = "Active", CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(coachUser);
        var sport = new Sport { CenterId = 1, Name = "Yoga Assignment", Status = "Active" };
        var targetRoom = new Room
        {
            CenterId = 1, Name = "Target Assignment Room", Capacity = 20,
            Status = "Active", CreatedAt = DateTime.UtcNow
        };
        var existingRoom = new Room
        {
            CenterId = 1, Name = "Existing Assignment Room", Capacity = 20,
            Status = "Active", CreatedAt = DateTime.UtcNow
        };
        db.AddRange(sport, targetRoom, existingRoom);
        await db.SaveChangesAsync();
        var coach = new CoachProfile
        {
            UserId = coachUser.Id, CenterId = 1, CoachCode = "COACH-ASSIGN-1", FullName = "Coach Assignment",
            Specialization = sport.Name, Status = "Active", CreatedAt = DateTime.UtcNow
        };
        db.CoachProfiles.Add(coach);
        await db.SaveChangesAsync();
        db.CoachSports.Add(new CoachSport { CoachId = coach.Id, SportId = sport.Id });
        await db.SaveChangesAsync();
        var targetClass = new ClassEntity
        {
            CenterId = 1, SportId = sport.Id, RoomId = targetRoom.Id, Name = "Brand New Draft Class",
            Capacity = 20, DurationMinutes = 60, Status = targetStatus, CreatedAt = DateTime.UtcNow
        };
        db.Classes.Add(targetClass);
        await db.SaveChangesAsync();

        var startDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7)).AddDays(1);
        var endDate = startDate.AddDays(28);
        var dayOfWeek = (int)startDate.DayOfWeek;
        if (includeExistingSchedule)
        {
            var existingClass = new ClassEntity
            {
                CenterId = 1, SportId = sport.Id, RoomId = existingRoom.Id, Name = "Existing Coach Class",
                Capacity = 20, DurationMinutes = 60, Status = "Published", CreatedAt = DateTime.UtcNow
            };
            db.Classes.Add(existingClass);
            await db.SaveChangesAsync();
            db.ClassCoaches.Add(new ClassCoach
            {
                ClassId = existingClass.Id, CoachId = coach.Id, IsPrimary = true, AssignedDate = startDate
            });
            db.ClassSchedules.Add(new ClassSchedule
            {
                ClassId = existingClass.Id, RoomId = existingRoom.Id, DayOfWeek = dayOfWeek,
                StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(9, 0),
                StartDate = startDate, EndDate = endDate, Status = "Active"
            });
            await db.SaveChangesAsync();
        }

        return new AssignmentScenario(targetClass.Id, coach.Id, sport.Id, targetRoom.Id, existingRoom.Id,
            dayOfWeek, startDate, endDate);
    }

    private static async Task<long> AddCoachAsync(
        SportsCenterDbContext db, long sportId, string suffix, string fullName)
    {
        var roleId = await db.Roles.Where(role => role.Name == "Coach").Select(role => role.Id).SingleAsync();
        var sportName = await db.Sports.Where(sport => sport.Id == sportId).Select(sport => sport.Name).SingleAsync();
        var user = new User
        {
            RoleId = roleId, Username = $"assignment-{suffix}", Email = $"assignment-{suffix}@test.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(BranchApiFactory.Password, workFactor: 4),
            Status = "Active", CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        var coach = new CoachProfile
        {
            UserId = user.Id, CenterId = 1, CoachCode = $"COACH-{suffix}", FullName = fullName,
            Specialization = sportName, Status = "Active", CreatedAt = DateTime.UtcNow
        };
        db.CoachProfiles.Add(coach);
        await db.SaveChangesAsync();
        db.CoachSports.Add(new CoachSport { CoachId = coach.Id, SportId = sportId });
        await db.SaveChangesAsync();
        return coach.Id;
    }

    private sealed record AssignmentScenario(
        long TargetClassId,
        long CoachId,
        long SportId,
        long TargetRoomId,
        long AlternateRoomId,
        int DayOfWeek,
        DateOnly StartDate,
        DateOnly EndDate);
}
