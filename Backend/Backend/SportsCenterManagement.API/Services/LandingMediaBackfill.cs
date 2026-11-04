using System.Globalization;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SportsCenterManagement.BLL.Services;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;

namespace SportsCenterManagement.API.Services;

// One-time, idempotent conversion of existing R2 keys into catalog rows and media IDs.
// It reads object metadata only; no R2 object is uploaded, replaced or deleted.
public static class LandingMediaBackfill
{
    public static async Task RunAsync(SportsCenterDbContext db, IR2StorageService storage, LandingContentService content, CancellationToken ct = default)
    {
        var setting = await db.SystemSettings.AsNoTracking().SingleOrDefaultAsync(s => s.SettingKey == "site.landing-content", ct);
        if (string.IsNullOrEmpty(setting?.SettingValue)) return;
        var keys = LandingMediaCleanup.Keys(setting.SettingValue);
        if (keys.Count == 0) return;
        var existing = await db.UploadedMedias.Where(m => keys.Contains(m.StorageKey)).ToDictionaryAsync(m => m.StorageKey, ct);
        var additions = new List<UploadedMedia>();
        foreach (var key in keys.Except(existing.Keys))
        {
            var metadata = await storage.GetMetadataAsync(key, ct);
            var name = Path.GetFileName(key);
            var created = DateTime.TryParseExact(name.Split('-')[0], "yyyyMMddHHmmssfff", CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var timestamp)
                ? timestamp : setting.UpdatedAt ?? DateTime.UtcNow;
            additions.Add(new UploadedMedia { StorageKey = key, FileName = name,
                MimeType = metadata.ContentType, FileSize = metadata.Size,
                UploadedByUserId = setting.UpdatedBy, CreatedAt = created });
        }
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        db.UploadedMedias.AddRange(additions);
        await db.SaveChangesAsync(ct);
        using var document = JsonDocument.Parse(setting.SettingValue);
        await content.SaveAsync(document.RootElement, setting.UpdatedBy ?? 0, ct);
        await transaction.CommitAsync(ct);
    }
}
