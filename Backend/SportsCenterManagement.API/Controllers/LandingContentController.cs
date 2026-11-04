using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportsCenterManagement.API.Filters;
using SportsCenterManagement.BLL.Services;
using SportsCenterManagement.API.Services;
using Microsoft.EntityFrameworkCore;
using SportsCenterManagement.DAL.Context;

namespace SportsCenterManagement.API.Controllers;

[Route("api/landing-content")]
[FlowExceptionFilter]
public sealed class LandingContentController(LandingContentService contentService,
    SportsCenterDbContext db, MediaCatalogService mediaCatalog, ILogger<LandingContentController> logger) : FlowControllerBase
{
    public sealed record SaveRequest(JsonElement Content);

    [HttpGet]
    [AllowAnonymous]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<ActionResult<LandingContentResponse>> Get(CancellationToken ct) => Ok(await contentService.GetAsync(ct));

    [HttpPut]
    [Authorize(Roles = "ADMIN,MANAGER")]
    [RequestSizeLimit(2 * 1024 * 1024)]
    public async Task<ActionResult<LandingContentResponse>> Save(SaveRequest request, CancellationToken ct)
    {
        var previous = await db.SystemSettings.AsNoTracking().Where(s => s.SettingKey == "site.landing-content")
            .Select(s => s.SettingValue).SingleOrDefaultAsync(ct);
        var result = await contentService.SaveAsync(request.Content, CurrentUserId, ct);
        var current = await db.SystemSettings.AsNoTracking().Where(s => s.SettingKey == "site.landing-content")
            .Select(s => s.SettingValue).SingleOrDefaultAsync(ct);
        // Only retire images removed by this successful CMS save. Shared references survive.
        var retiredIds = LandingContentService.ReferencedMediaIds(previous)
            .Except(LandingContentService.ReferencedMediaIds(current)).ToList();
        var retired = await db.UploadedMedias.AsNoTracking().Where(m => retiredIds.Contains(m.Id)).ToListAsync(ct);
        foreach (var media in retired)
        {
            try { await mediaCatalog.DeleteAsync(media.StorageKey, ct); }
            catch (Exception ex) { logger.LogWarning(ex, "Could not remove retired landing image {MediaId}", media.Id); }
        }
        return Ok(result);
    }
}
