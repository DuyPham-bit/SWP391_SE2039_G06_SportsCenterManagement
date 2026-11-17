using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportsCenterManagement.API.Filters;
using SportsCenterManagement.BLL.Services;

namespace SportsCenterManagement.API.Controllers;

[Route("api/landing-content")]
[FlowExceptionFilter]
public sealed class LandingContentController(LandingContentService contentService, LandingTranslationService translationService) : FlowControllerBase
{
    public sealed record SaveRequest(JsonElement Content, DateTime? ExpectedUpdatedAt = null);
    public sealed record TranslateRequest(IReadOnlyList<string>? Texts);
    public sealed record TranslateResponse(IReadOnlyDictionary<string, string> Translations);

    [HttpGet]
    [AllowAnonymous]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<ActionResult<LandingContentResponse>> Get(CancellationToken ct) => Ok(await contentService.GetAsync(ct));

    [HttpPut]
    [Authorize(Roles = "ADMIN,MANAGER")]
    [RequestSizeLimit(2 * 1024 * 1024)]
    public async Task<ActionResult<LandingContentResponse>> Save(SaveRequest request, CancellationToken ct) =>
        Ok(await contentService.SaveAsync(request.Content, CurrentUserId, ct));

    [HttpGet("draft")]
    [Authorize(Roles = "ADMIN,MANAGER")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<ActionResult<LandingContentResponse>> GetDraft(CancellationToken ct) =>
        Ok(await contentService.GetDraftAsync(ct));

    [HttpPut("draft")]
    [Authorize(Roles = "ADMIN,MANAGER")]
    [RequestSizeLimit(2 * 1024 * 1024)]
    public async Task<ActionResult<LandingContentResponse>> SaveDraft(SaveRequest request, CancellationToken ct) =>
        Ok(await contentService.SaveDraftAsync(request.Content, CurrentUserId, ct, request.ExpectedUpdatedAt));

    /// <summary>Drafts English versions of Vietnamese homepage texts for the editor to review.</summary>
    [HttpPost("translate")]
    [Authorize(Roles = "ADMIN,MANAGER")]
    [RequestSizeLimit(256 * 1024)]
    public async Task<ActionResult<TranslateResponse>> Translate(TranslateRequest request, CancellationToken ct) =>
        Ok(new TranslateResponse(await translationService.TranslateAsync(request.Texts, ct)));

    [HttpDelete("draft")]
    [Authorize(Roles = "ADMIN,MANAGER")]
    public async Task<IActionResult> DiscardDraft(CancellationToken ct)
    {
        await contentService.DiscardDraftAsync(CurrentUserId, ct);
        return NoContent();
    }
}
