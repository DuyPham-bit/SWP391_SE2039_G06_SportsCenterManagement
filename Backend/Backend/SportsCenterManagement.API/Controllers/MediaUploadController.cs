using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SportsCenterManagement.API.Models;
using SportsCenterManagement.API.Services;
using SportsCenterManagement.BLL.DTOs.Media;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;

namespace SportsCenterManagement.API.Controllers;

[ApiController]
[Route("api/media")]
[Authorize(Roles = "COACH,MANAGER,ADMIN")]
public sealed class MediaUploadController(
    SportsCenterDbContext db,
    MediaCatalogService mediaCatalog) : FlowControllerBase
{
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<ActionResult<UploadMediaResultDto>> Upload(IFormFile? file, CancellationToken ct)
    {
        if (file is null) return BadRequest();
        var entity = await mediaCatalog.UploadAsync(file, CurrentUserId, ct);
        return Ok(ToDto(entity));
    }

    [HttpGet("files")]
    [HttpGet("recent")]
    public async Task<ActionResult<List<UploadMediaResultDto>>> Files([FromQuery] int limit = 100, CancellationToken ct = default)
    {
        var entries = await db.UploadedMedias.AsNoTracking().Where(m => m.StorageKey.StartsWith("dashboard/"))
            .OrderByDescending(m => m.CreatedAt).Take(Math.Clamp(limit, 1, 200)).ToListAsync(ct);
        return Ok(entries.Select(ToDto).ToList());
    }

    private UploadMediaResultDto ToDto(UploadedMedia media)
    {
        var url = mediaCatalog.PublicUrl(media.StorageKey);
        return new(media.Id, media.StorageKey, url, media.FileName, media.MimeType,
            media.FileSize, media.CreatedAt, url);
    }
}
