using System.Text.Json;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;
using SportsCenterManagement.DAL.Repositories.Interfaces;

namespace SportsCenterManagement.BLL.Common.Helpers;

public static class AuditLogWriter
{
    public static void Add(
        IUnitOfWork unitOfWork,
        long? actorUserId,
        long? centerId,
        string action,
        string entityType,
        long? entityId,
        object? oldValues = null,
        object? newValues = null) =>
        Add(unitOfWork.Context, actorUserId, centerId, action, entityType, entityId, oldValues, newValues);

    public static void Add(
        SportsCenterDbContext context,
        long? actorUserId,
        long? centerId,
        string action,
        string entityType,
        long? entityId,
        object? oldValues = null,
        object? newValues = null)
    {
        context.AuditLogs.Add(new AuditLog
        {
            UserId = actorUserId,
            CenterId = centerId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            OldValues = oldValues is null ? null : JsonSerializer.Serialize(oldValues),
            NewValues = newValues is null ? null : JsonSerializer.Serialize(newValues),
            CreatedAt = DateTime.UtcNow
        });
    }
}
