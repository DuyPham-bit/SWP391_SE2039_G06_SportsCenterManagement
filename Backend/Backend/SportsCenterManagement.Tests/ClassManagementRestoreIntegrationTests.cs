using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SportsCenterManagement.BLL.DTOs.Classes;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;
using Xunit;

namespace SportsCenterManagement.Tests;

public sealed class ClassManagementRestoreIntegrationTests
{
    [Fact]
    public async Task CancelledClassCanBeRestoredAsDraftWithoutRevivingCancelledHistory()
    {
        using var factory = new BranchApiFactory();
        long classId;
        long scheduleId;
        long sessionId;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SportsCenterDbContext>();
            var sport = new Sport { CenterId = 1, Name = "Restore Test Sport", Status = "Active" };
            var room = new Room
            {
                CenterId = 1, Name = "Restore Test Room", Capacity = 20,
                Status = "Active", CreatedAt = DateTime.UtcNow
            };
            db.AddRange(sport, room);
            await db.SaveChangesAsync();

            var classEntity = new ClassEntity
            {
                CenterId = 1, SportId = sport.Id, RoomId = room.Id, Name = "Restore Test Class",
                Capacity = 20, DurationMinutes = 60, Status = "Draft", CreatedAt = DateTime.UtcNow
            };
            db.Classes.Add(classEntity);
            await db.SaveChangesAsync();
            classId = classEntity.Id;

            var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
            var schedule = new ClassSchedule
            {
                ClassId = classId, RoomId = room.Id, DayOfWeek = (int)today.AddDays(1).DayOfWeek,
                StartDate = today, EndDate = today.AddDays(30), StartTime = new TimeOnly(8, 0),
                EndTime = new TimeOnly(9, 0), Status = "Active"
            };
            db.ClassSchedules.Add(schedule);
            await db.SaveChangesAsync();
            scheduleId = schedule.Id;

            var session = new ClassSession
            {
                ClassId = classId, ScheduleId = scheduleId, RoomId = room.Id,
                SessionDate = today.AddDays(1), StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(9, 0),
                SessionStatus = "Scheduled", CreatedAt = DateTime.UtcNow
            };
            db.ClassSessions.Add(session);
            await db.SaveChangesAsync();
            sessionId = session.Id;
        }

        using var client = factory.CreateClient();
        await BranchApiFactory.LoginAsync(client, "manager@test.local");

        using var cancelResponse = await client.DeleteAsync($"/api/classes/{classId}");
        Assert.Equal(HttpStatusCode.OK, cancelResponse.StatusCode);

        using var restoreResponse = await client.PostAsync($"/api/classes/{classId}/restore", null);
        Assert.Equal(HttpStatusCode.OK, restoreResponse.StatusCode);
        var restored = await restoreResponse.Content.ReadFromJsonAsync<ClassDetailResponse>();
        Assert.NotNull(restored);
        Assert.Equal("Draft", restored.Status);

        await using var assertionScope = factory.Services.CreateAsyncScope();
        var assertionDb = assertionScope.ServiceProvider.GetRequiredService<SportsCenterDbContext>();
        Assert.Equal("Cancelled", (await assertionDb.ClassSchedules.SingleAsync(item => item.Id == scheduleId)).Status);
        Assert.Equal("Cancelled", (await assertionDb.ClassSessions.SingleAsync(item => item.Id == sessionId)).SessionStatus);
    }

    [Fact]
    public async Task RestoreRejectsClassThatIsNotCancelled()
    {
        using var factory = new BranchApiFactory();
        long classId;
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SportsCenterDbContext>();
            var sport = new Sport { CenterId = 1, Name = "Active Restore Test Sport", Status = "Active" };
            db.Sports.Add(sport);
            await db.SaveChangesAsync();
            var classEntity = new ClassEntity
            {
                CenterId = 1, SportId = sport.Id, Name = "Already Active Class", Capacity = 10,
                DurationMinutes = 45, Status = "Draft", CreatedAt = DateTime.UtcNow
            };
            db.Classes.Add(classEntity);
            await db.SaveChangesAsync();
            classId = classEntity.Id;
        }

        using var client = factory.CreateClient();
        await BranchApiFactory.LoginAsync(client, "manager@test.local");
        using var response = await client.PostAsync($"/api/classes/{classId}/restore", null);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("Chỉ lớp đã hủy mới có thể mở lại", body);
    }
}
