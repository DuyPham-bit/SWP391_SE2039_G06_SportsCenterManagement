using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using SportsCenterManagement.BLL.Common.Helpers;
using SportsCenterManagement.BLL.Exceptions;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;

namespace SportsCenterManagement.BLL.Services;

public sealed record LandingContentResponse(JsonElement? Content, DateTime? UpdatedAt);

public sealed class LandingContentService(SportsCenterDbContext db, IConfiguration configuration)
{
    private const string SettingKey = "site.landing-content";
    // Unpublished editor work, shared by every Manager/Admin and kept across devices (system_settings row).
    private const string DraftKey = "site.landing-content.draft";
    private const int SportDescriptionMaxLength = 500; // sports.description column length
    private static readonly string[] RequiredSections = ["heroBanner", "whyUs", "coursesSection", "facilitiesSection", "zonesLayout", "ctaAndFooter"];
    private static readonly string[] Sections = ["heroBanner", "whyUs", "coursesSection", "facilitiesSection", "zonesLayout", "ctaAndFooter", "authShowcase"];
    private static readonly HashSet<string> ObjectArrays = ["metrics", "features", "stats", "sportsList", "facilitiesList", "zones", "serviceAmenities", "specs", "trustBadges"];
    private static readonly HashSet<string> TextArrays = ["tags", "badges", "amenities", "items"];
    private static readonly HashSet<string> Booleans = ["isVisible", "isAutoCount", "formatThousands"];

    public static readonly IReadOnlyDictionary<string, string> ImageFields = new Dictionary<string, string>
    {
        ["image"] = "mediaId", ["secondaryImage"] = "secondaryMediaId",
        ["posterUrl"] = "posterMediaId", ["imageUrl"] = "imageMediaId"
    };

    public static HashSet<long> ReferencedMediaIds(string? json)
    {
        var result = new HashSet<long>();
        if (string.IsNullOrWhiteSpace(json)) return result;
        using var doc = JsonDocument.Parse(json);
        Visit(doc.RootElement);
        return result;
        void Visit(JsonElement node)
        {
            if (node.ValueKind == JsonValueKind.Object)
                foreach (var property in node.EnumerateObject())
                {
                    if (ImageFields.Values.Contains(property.Name) && property.Value.ValueKind == JsonValueKind.Number && property.Value.TryGetInt64(out var id))
                        result.Add(id);
                    else if (property.Value.ValueKind is JsonValueKind.Object or JsonValueKind.Array) Visit(property.Value);
                }
            else if (node.ValueKind == JsonValueKind.Array)
                foreach (var child in node.EnumerateArray()) Visit(child);
        }
    }

    public async Task<LandingContentResponse> GetAsync(CancellationToken ct)
    {
        var setting = await db.SystemSettings.AsNoTracking().SingleOrDefaultAsync(s => s.SettingKey == SettingKey, ct);
        if (setting?.SettingValue is null) return new(null, null);
        var ids = ReferencedMediaIds(setting.SettingValue);
        var media = await db.UploadedMedias.AsNoTracking().Where(m => ids.Contains(m.Id)).ToDictionaryAsync(m => m.Id, ct);
        var node = JsonNode.Parse(setting.SettingValue)!;
        Hydrate(node, media);
        await HydrateSportDescriptionsAsync(node, ct);
        return new(JsonSerializer.SerializeToElement(node), setting.UpdatedAt);
    }

    /// <param name="ensureCenterAccess">Throws when the caller may not edit sports of the given center.
    /// It runs only for sports whose description this save actually changes.</param>
    public async Task<LandingContentResponse> SaveAsync(JsonElement content, long userId,
        Func<long, CancellationToken, Task> ensureCenterAccess, CancellationToken ct)
    {
        var node = JsonNode.Parse(content.GetRawText())!;
        var media = await db.UploadedMedias.AsNoTracking().Where(m => m.StorageKey.StartsWith("dashboard/")).ToListAsync(ct);
        StoreReferences(node, media.ToDictionary(m => m.StorageKey), media.ToDictionary(m => m.Id));
        Validate(JsonSerializer.SerializeToElement(node));
        await StoreSportDescriptionsAsync(node, userId, ensureCenterAccess, ct);
        var storedContent = JsonSerializer.SerializeToElement(node);
        var setting = await db.SystemSettings.SingleOrDefaultAsync(s => s.SettingKey == SettingKey, ct);
        if (setting is null)
        {
            setting = new SystemSetting { SettingKey = SettingKey, Description = "Nội dung trang chủ công khai" };
            db.SystemSettings.Add(setting);
        }
        setting.SettingValue = storedContent.GetRawText();
        setting.UpdatedBy = userId;
        setting.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        // Publishing consumes the draft — only once the published content is safely stored.
        await db.SystemSettings.Where(s => s.SettingKey == DraftKey).ExecuteDeleteAsync(ct);
        return await GetAsync(ct);
    }

    public async Task<LandingContentResponse> GetDraftAsync(CancellationToken ct)
    {
        var draft = await db.SystemSettings.AsNoTracking().SingleOrDefaultAsync(s => s.SettingKey == DraftKey, ct);
        if (draft?.SettingValue is null) return new(null, null);
        using var document = JsonDocument.Parse(draft.SettingValue);
        return new(document.RootElement.Clone(), draft.UpdatedAt);
    }

    /// <summary>Autosaved, possibly incomplete content: only shape-checked, never shown publicly.</summary>
    public async Task<LandingContentResponse> SaveDraftAsync(JsonElement content, long userId, CancellationToken ct)
    {
        if (content.ValueKind != JsonValueKind.Object)
            throw FlowException.BadRequest("Bản nháp trang chủ phải là một đối tượng JSON.");
        var draft = await db.SystemSettings.SingleOrDefaultAsync(s => s.SettingKey == DraftKey, ct);
        if (draft is null)
        {
            draft = new SystemSetting { SettingKey = DraftKey, Description = "Bản nháp nội dung trang chủ (chưa xuất bản)" };
            db.SystemSettings.Add(draft);
        }
        draft.SettingValue = content.GetRawText();
        draft.UpdatedBy = userId;
        draft.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return new(content.Clone(), draft.UpdatedAt);
    }

    public Task DiscardDraftAsync(CancellationToken ct) =>
        db.SystemSettings.Where(s => s.SettingKey == DraftKey).ExecuteDeleteAsync(ct);

    private string PublicDomain => configuration["R2Storage:PublicDomain"]?.Trim().TrimEnd('/')
        ?? throw new InvalidOperationException("R2Storage:PublicDomain is not configured.");

    // Homepage sport cards may link to a `sports` row through "sportId". For linked cards the
    // sports table is the single source of the "highlight" text: GET fills it in, PUT writes
    // changed text back to the sport and never stores a copy in the landing JSON.
    private async Task HydrateSportDescriptionsAsync(JsonNode node, CancellationToken ct)
    {
        var cards = LinkedSportCards(node).Where(card => card.SportId > 0).ToList();
        if (cards.Count == 0) return;
        var ids = cards.Select(card => card.SportId).Distinct().ToList();
        var descriptions = await db.Sports.AsNoTracking().Where(s => ids.Contains(s.Id))
            .ToDictionaryAsync(s => s.Id, s => s.Description, ct);
        foreach (var (card, sportId) in cards)
            if (descriptions.TryGetValue(sportId, out var description)) card["highlight"] = description ?? "";
    }

    private async Task StoreSportDescriptionsAsync(JsonNode node, long userId,
        Func<long, CancellationToken, Task> ensureCenterAccess, CancellationToken ct)
    {
        var cards = LinkedSportCards(node);
        if (cards.Count == 0) return;
        if (cards.Any(card => card.SportId <= 0))
            throw FlowException.BadRequest("Liên kết bộ môn trên thẻ trang chủ không hợp lệ.");
        var ids = cards.Select(card => card.SportId).Distinct().ToList();
        var sports = await db.Sports.Where(s => ids.Contains(s.Id)).ToDictionaryAsync(s => s.Id, ct);
        if (sports.Count != ids.Count)
            throw FlowException.BadRequest("Bộ môn liên kết trên thẻ trang chủ không tồn tại.");

        var changes = new Dictionary<long, string>();
        foreach (var (card, sportId) in cards)
        {
            var text = card["highlight"] is JsonValue value && value.TryGetValue<string>(out var raw) ? raw.Trim() : "";
            card.Remove("highlight");
            // Blank or missing text (e.g. a raw re-save) never wipes a stored description.
            if (text.Length == 0 || text == sports[sportId].Description) continue;
            if (text.Length > SportDescriptionMaxLength)
                throw FlowException.BadRequest($"Mô tả bộ môn tối đa {SportDescriptionMaxLength} ký tự.");
            if (changes.TryGetValue(sportId, out var other) && other != text)
                throw FlowException.BadRequest("Hai thẻ cùng liên kết một bộ môn nhưng có mô tả khác nhau.");
            changes[sportId] = text;
        }

        // Check every change before touching any entity so a refusal leaves nothing half-applied.
        foreach (var sportId in changes.Keys)
        {
            if (sports[sportId].CenterId is not long centerId)
                throw FlowException.Forbidden("Bộ môn dùng chung không sửa mô tả từ trang chủ; hãy dùng mục Quản lý bộ môn.");
            await ensureCenterAccess(centerId, ct);
        }
        foreach (var (sportId, text) in changes)
        {
            var sport = sports[sportId];
            var previous = sport.Description;
            sport.Description = text;
            AuditLogWriter.Add(db, userId > 0 ? userId : null, sport.CenterId, "SPORT.UPDATED", "Sport", sport.Id,
                new { Description = previous }, new { Description = text });
        }
    }

    private static List<(JsonObject Card, long SportId)> LinkedSportCards(JsonNode node)
    {
        var result = new List<(JsonObject, long)>();
        if (node is not JsonObject root || root["coursesSection"] is not JsonObject section
            || section["sportsList"] is not JsonArray cards) return result;
        foreach (var card in cards.OfType<JsonObject>())
        {
            if (card["sportId"] is not JsonValue value || !value.TryGetValue<string>(out var link)
                || string.IsNullOrWhiteSpace(link)) continue;
            result.Add((card, long.TryParse(link.Trim(), NumberStyles.None, CultureInfo.InvariantCulture, out var id) ? id : 0));
        }
        return result;
    }

    private void Hydrate(JsonNode node, Dictionary<long, UploadedMedia> media)
    {
        if (node is JsonObject obj)
        {
            foreach (var field in ImageFields)
            {
                if (obj[field.Value] is JsonValue idValue && idValue.TryGetValue<long>(out var id))
                    obj[field.Key] = media.TryGetValue(id, out var image) ? $"{PublicDomain}/{image.StorageKey}" : "";
            }
            foreach (var property in obj.ToArray())
                if (property.Value is JsonObject or JsonArray) Hydrate(property.Value, media);
        }
        else if (node is JsonArray array)
            foreach (var child in array) if (child is not null) Hydrate(child, media);
    }

    private void StoreReferences(JsonNode node, Dictionary<string, UploadedMedia> byKey, Dictionary<long, UploadedMedia> byId)
    {
        if (node is JsonObject obj)
        {
            foreach (var field in ImageFields)
            {
                if (obj.TryGetPropertyValue(field.Key, out var value))
                {
                    if (value is not JsonValue textValue || !textValue.TryGetValue<string>(out var text)) throw InvalidContent();
                    obj.Remove(field.Key);
                    if (text.Length == 0) { obj.Remove(field.Value); continue; }
                    var key = text.StartsWith(PublicDomain + "/", StringComparison.Ordinal)
                        ? text[(PublicDomain.Length + 1)..] : text;
                    if (!byKey.TryGetValue(key, out var image))
                        throw new FlowException(400, "Ảnh chưa có trong thư viện. Vui lòng tải lên hoặc chọn ảnh đã lưu.");
                    obj[field.Value] = image.Id;
                }
                else if (obj.TryGetPropertyValue(field.Value, out var idNode))
                {
                    if (idNode is not JsonValue idValue || !idValue.TryGetValue<long>(out var id) || !byId.ContainsKey(id))
                        throw new FlowException(400, "ID ảnh không tồn tại trong thư viện.");
                }
            }
            foreach (var property in obj.ToArray())
                if (property.Value is JsonObject or JsonArray) StoreReferences(property.Value, byKey, byId);
        }
        else if (node is JsonArray array)
            foreach (var child in array) if (child is not null) StoreReferences(child, byKey, byId);
    }

    private static void Validate(JsonElement content)
    {
        if (content.ValueKind != JsonValueKind.Object || Encoding.UTF8.GetByteCount(content.GetRawText()) > 1024 * 1024)
            throw InvalidContent();
        foreach (var section in RequiredSections)
            if (!content.TryGetProperty(section, out var value) || value.ValueKind != JsonValueKind.Object) throw InvalidContent();
        foreach (var section in content.EnumerateObject())
        {
            if (!Sections.Contains(section.Name)) throw InvalidContent();
            ValidateObject(section.Value, 0);
        }
    }

    private static void ValidateObject(JsonElement value, int depth)
    {
        if (depth > 8) throw InvalidContent();
        foreach (var property in value.EnumerateObject())
        {
            var item = property.Value;
            if (ObjectArrays.Contains(property.Name) || TextArrays.Contains(property.Name))
            {
                if (item.ValueKind != JsonValueKind.Array || item.GetArrayLength() > 200) throw InvalidContent();
                var ids = new HashSet<string>();
                foreach (var entry in item.EnumerateArray())
                {
                    if (TextArrays.Contains(property.Name)) { ValidateText(entry, property.Name); continue; }
                    if (entry.ValueKind != JsonValueKind.Object) throw InvalidContent();
                    ValidateObject(entry, depth + 1);
                    if (property.Name is "sportsList" or "facilitiesList")
                    {
                        if (!entry.TryGetProperty("id", out var id) || string.IsNullOrWhiteSpace(id.GetString()) || !ids.Add(id.GetString()!) ||
                            !entry.TryGetProperty("name", out var name) || string.IsNullOrWhiteSpace(name.GetString())) throw InvalidContent();
                    }
                }
            }
            else if (property.Name == "trustBanner")
            {
                if (item.ValueKind != JsonValueKind.Object) throw InvalidContent();
                ValidateObject(item, depth + 1);
            }
            else if (Booleans.Contains(property.Name))
            {
                if (item.ValueKind is not (JsonValueKind.True or JsonValueKind.False)) throw InvalidContent();
            }
            else if (ImageFields.Values.Contains(property.Name))
            {
                if (item.ValueKind != JsonValueKind.Number || !item.TryGetInt64(out var mediaId) || mediaId <= 0) throw InvalidContent();
            }
            else if (property.Name == "number")
            {
                if (item.ValueKind != JsonValueKind.Number || !item.TryGetDouble(out var number) || !double.IsFinite(number) || number < 0 || number > 1_000_000_000) throw InvalidContent();
            }
            else ValidateText(item, property.Name);
        }
    }

    private static void ValidateText(JsonElement value, string name)
    {
        if (value.ValueKind != JsonValueKind.String || value.GetString()!.Length > 10000) throw InvalidContent();
        if (name is "image" or "secondaryImage" or "posterUrl" or "videoUrl" or "imageUrl")
        {
            var key = value.GetString()!;
            if (key.Length == 0) return;
            if (!System.Text.RegularExpressions.Regex.IsMatch(key,
                @"^dashboard/[0-9]{4}/[0-9]{2}/[0-9]{17}-[a-f0-9]{32}\.(jpg|jpeg|png|webp)$"))
                throw new FlowException(400, "Ảnh trang chủ phải là relative key R2 hợp lệ.");
            return;
        }
        if (name.EndsWith("Url", StringComparison.Ordinal) || name.EndsWith("Link", StringComparison.Ordinal) || name is "image" or "secondaryImage")
        {
            var url = value.GetString()!.Trim();
            if (url.Length == 0) return;
            if (url.Any(char.IsControl) || url.Contains('\\') || url.StartsWith("//")) throw InvalidContent();
            if (url.StartsWith('#') || url.StartsWith('/') || url.StartsWith("./") ||
                url.StartsWith("dashboard/", StringComparison.Ordinal)) return;
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || uri.Scheme is not ("http" or "https")) throw InvalidContent();
        }
    }

    private static FlowException InvalidContent() => new(400, "Nội dung trang chủ không hợp lệ. Kiểm tra văn bản, danh sách và liên kết HTTP/HTTPS.");
}
