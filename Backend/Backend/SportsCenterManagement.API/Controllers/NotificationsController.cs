using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SportsCenterManagement.API.Authorization;
using SportsCenterManagement.API.Filters;
using SportsCenterManagement.BLL.DTOs.Notifications;
using SportsCenterManagement.BLL.Interfaces;
using SportsCenterManagement.DAL.Context;

namespace SportsCenterManagement.API.Controllers;

[Authorize]
[FlowExceptionFilter]
public sealed class NotificationsController(
    SportsCenterDbContext db,
    ICenterNotificationService centerNotificationService) : FlowControllerBase
{
    [HttpPost("centers/{centerId:long}/notifications")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<SendCenterNotificationResponse>> SendToCenter(
        long centerId,
        SendCenterNotificationRequest request,
        CancellationToken ct) =>
        Ok(await centerNotificationService.SendAsync(CurrentUserId, centerId, request, ct));

    [HttpGet("notifications/me")]
    public async Task<IActionResult> Mine(CancellationToken ct) => Ok(await (
        from link in db.UserNotifications join n in db.Notifications on link.NotificationId equals n.Id
        where link.UserId == CurrentUserId orderby n.CreatedAt descending, n.Id descending
        select new { n.Id, n.Title, Content = n.Message, n.NotificationType, n.CreatedAt, link.IsRead }
    ).Take(200).ToListAsync(ct));

    [HttpPut("notifications/{notificationId:long}/read")]
    public async Task<IActionResult> Read(long notificationId, CancellationToken ct)
    {
        var count = await db.UserNotifications.Where(n => n.NotificationId == notificationId && n.UserId == CurrentUserId)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true).SetProperty(n => n.ReadAt, DateTime.UtcNow), ct);
        return count == 0 ? NotFound() : NoContent();
    }

    [HttpPut("notifications/me/read-all")]
    public async Task<IActionResult> ReadAll(CancellationToken ct)
    {
        var readAt = DateTime.UtcNow;
        await db.UserNotifications.Where(link => link.UserId == CurrentUserId && !link.IsRead)
            .ExecuteUpdateAsync(setters => setters.SetProperty(link => link.IsRead, true)
                .SetProperty(link => link.ReadAt, readAt), ct);
        return NoContent();
    }

    [HttpGet("coaches/me/notifications")]
    [Authorize(Roles = "COACH")]
    [CenterCapability("view_teaching_schedule")]
    public async Task<IActionResult> Sent(CancellationToken ct) => Ok(await db.Notifications
        .Where(n => n.SenderId == CurrentUserId && n.NotificationType == "CoachMessage")
        .OrderByDescending(n => n.CreatedAt).ThenByDescending(n => n.Id).Take(200)
        .Select(n => new {
            n.Id,
            n.Title,
            Content = n.Message,
            n.CreatedAt,
            RecipientCount = db.UserNotifications.Count(l => l.NotificationId == n.Id),
            Target = db.UserNotifications.Count(l => l.NotificationId == n.Id) == 1
                ? (db.MemberProfiles.Where(m => db.UserNotifications.Any(l => l.NotificationId == n.Id && l.UserId == m.UserId)).Select(m => "Học viên: " + m.FullName).FirstOrDefault() ?? "Học viên được phân công")
                : "Học viên được phân công"
        })
        .ToListAsync(ct));
}
