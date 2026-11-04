using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SportsCenterManagement.API.Models;
using SportsCenterManagement.API.Services;
using SportsCenterManagement.DAL.Context;

namespace SportsCenterManagement.API.Controllers;

[ApiController]
[Authorize]
[Route("api/r2-images")]
public sealed class R2ImageStorageController(
    IR2StorageService storageService,
    IOptions<R2StorageOptions> options,
    MediaCatalogService mediaCatalog) : ControllerBase
{
    [HttpPost("dashboard")]
    [Authorize(Roles = "MANAGER,ADMIN")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<ActionResult<R2ImageUploadResponse>> UploadDashboardImage(IFormFile? file, CancellationToken ct)
    {
        if (file is null) return BadRequest();
        var media = await mediaCatalog.UploadAsync(file, CurrentUserId(), ct);
        return StatusCode(201, new R2ImageUploadResponse(media.StorageKey, mediaCatalog.PublicUrl(media.StorageKey), media.Id));
    }

    [HttpPost("avatar")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<ActionResult<R2ImageUploadResponse>> UploadAvatar(IFormFile? file, CancellationToken ct)
    {
        if (file is null) return BadRequest();
        var key = await storageService.UploadImageAsync(file, $"avatars/{CurrentUserId()}", 5 * 1024 * 1024, ct);
        return StatusCode(201, BuildResponse(key));
    }

    [HttpDelete("dashboard")]
    [Authorize(Roles = "MANAGER,ADMIN")]
    public async Task<IActionResult> DeleteDashboardImage([FromQuery] string key, CancellationToken ct)
    {
        if (!key.StartsWith("dashboard/", StringComparison.Ordinal)) return BadRequest();
        await mediaCatalog.DeleteAsync(key, ct);
        return NoContent();
    }

    [HttpDelete("avatar")]
    public async Task<IActionResult> DeleteUploadedAvatar([FromQuery] string key, CancellationToken ct)
    {
        if (!key.StartsWith($"avatars/{CurrentUserId()}/", StringComparison.Ordinal)) return BadRequest();
        await storageService.DeleteAsync(key, ct);
        return NoContent();
    }

    private R2ImageUploadResponse BuildResponse(string key) =>
        new(key, $"{options.Value.PublicDomain.TrimEnd('/')}/{key}");

    private long CurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return long.TryParse(claim, out var id) ? id : throw new UnauthorizedAccessException();
    }
}

// PublicUrl is derived for rendering only; persistence uses Key.
public sealed record R2ImageUploadResponse(string Key, string PublicUrl, long? Id = null);
