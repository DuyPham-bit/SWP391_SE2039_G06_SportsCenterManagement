using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SportsCenterManagement.API.Models;
using SportsCenterManagement.BLL.Common;
using SportsCenterManagement.BLL.Services;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;

namespace SportsCenterManagement.API.Services;

public sealed class MediaCatalogService(SportsCenterDbContext db, IR2StorageService storage, IOptions<R2StorageOptions> options)
{
    public string PublicUrl(string key) => $"{options.Value.PublicDomain.TrimEnd('/')}/{key}";

    public async Task<UploadedMedia> UploadAsync(IFormFile file, long userId, CancellationToken ct)
    {
        var key = await storage.UploadImageAsync(file, "dashboard", 5 * 1024 * 1024, ct);
        // Storage writes the catalog and ownership metadata atomically with its upload.
        return await db.UploadedMedias.SingleAsync(m => m.StorageKey == key && m.UploadedByUserId == userId, ct);
    }

    public async Task DeleteAsync(string key, CancellationToken ct)
    {
        if (!System.Text.RegularExpressions.Regex.IsMatch(key,
            @"^dashboard/[0-9]{4}/[0-9]{2}/[0-9]{17}-[a-f0-9]{32}\.(jpg|jpeg|png|webp)$"))
            throw BusinessException.BadRequest("Relative key R2 không hợp lệ.");
        var media = await db.UploadedMedias.SingleOrDefaultAsync(m => m.StorageKey == key, ct);
        if (media is null) return;
        var published = await db.SystemSettings.AsNoTracking().Where(s => s.SettingKey == "site.landing-content")
            .Select(s => s.SettingValue).SingleOrDefaultAsync(ct);
        if (LandingContentService.ReferencedMediaIds(published).Contains(media.Id))
            throw BusinessException.Conflict("Ảnh vẫn đang được sử dụng trên trang chủ.");
        var url = PublicUrl(key);
        if (await db.Exercises.AnyAsync(e => e.ImageUrl == key || e.ImageUrl == url, ct))
            throw BusinessException.Conflict("Ảnh vẫn đang được sử dụng trong bài tập.");
        await storage.DeleteAsync(key, ct);
    }
}
