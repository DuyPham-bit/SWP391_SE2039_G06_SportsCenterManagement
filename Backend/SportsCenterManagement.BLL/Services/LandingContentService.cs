using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using SportsCenterManagement.BLL.Exceptions;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;

namespace SportsCenterManagement.BLL.Services;

public sealed record LandingContentResponse(JsonElement? Content, DateTime? UpdatedAt);

public sealed class LandingContentService(SportsCenterDbContext db, IConfiguration configuration)
{
    private const string SettingKey = "site.landing-content";
    // Unpublished editor work, shared by every Manager/Admin and kept across devices.
    private const string DraftKey = "site.landing-content.draft";
    private static readonly string[] RequiredSections = ["heroBanner", "whyUs", "coursesSection", "facilitiesSection", "zonesLayout", "ctaAndFooter"];
    private static readonly string[] Sections = ["heroBanner", "whyUs", "coursesSection", "facilitiesSection", "zonesLayout", "ctaAndFooter", "authShowcase", TranslationsSection];
    // English text for the language switch: { "<Vietnamese text>": "<English text>" }.
    // Keyed by the Vietnamese source, so editing the Vietnamese text leaves it visibly untranslated
    // instead of showing an English version of the old wording.
    internal const string TranslationsSection = "translations";
    internal const int MaxTranslations = 2000;
    private static readonly HashSet<string> ObjectArrays = ["metrics", "features", "stats", "sportsList", "facilitiesList", "zones", "serviceAmenities", "specs", "trustBadges"];
    private static readonly HashSet<string> TextArrays = ["tags", "badges", "amenities", "items"];
    private static readonly HashSet<string> Booleans = ["isVisible", "isAutoCount", "formatThousands"];
    private const int SportDescriptionMaxLength = 500; // sports.description column length

    // Content saved by v1.5 references uploaded_media by id instead of storing the image path.
    private static readonly IReadOnlyDictionary<string, string> LegacyMediaFields = new Dictionary<string, string>
    {
        ["mediaId"] = "image", ["secondaryMediaId"] = "secondaryImage",
        ["posterMediaId"] = "posterUrl", ["imageMediaId"] = "imageUrl"
    };

    public async Task<LandingContentResponse> GetAsync(CancellationToken ct)
    {
        var setting = await db.SystemSettings.AsNoTracking().SingleOrDefaultAsync(s => s.SettingKey == SettingKey, ct);
        if (setting?.SettingValue is null) return new(null, null);
        return new(await ReadFromDatabaseAsync(JsonNode.Parse(setting.SettingValue)!, ct), setting.UpdatedAt);
    }

    public async Task<LandingContentResponse> SaveAsync(JsonElement content, long userId, CancellationToken ct)
    {
        var node = JsonNode.Parse(content.GetRawText())!;
        // Legacy media ids become stored image paths, so the saved content uses the current format.
        await ResolveLegacyMediaAsync(node, ct);
        var storedContent = TransformR2Urls(JsonSerializer.SerializeToElement(node), toPublicUrl: false);
        Validate(storedContent);
        node = JsonNode.Parse(storedContent.GetRawText())!;
        // Linked sport cards: the sports table owns the text; edits are written there, not copied here.
        await StoreSportDescriptionsAsync(node, userId, ct);
        storedContent = JsonSerializer.SerializeToElement(node);
        var setting = await db.SystemSettings.SingleOrDefaultAsync(s => s.SettingKey == SettingKey, ct);
        var previous = new { setting?.UpdatedAt, setting?.UpdatedBy };
        if (setting is null)
        {
            setting = new SystemSetting { SettingKey = SettingKey, Description = "Nội dung trang chủ công khai" };
            db.SystemSettings.Add(setting);
        }
        setting.SettingValue = storedContent.GetRawText();
        setting.UpdatedBy = userId;
        setting.UpdatedAt = DateTime.UtcNow;
        await SyncCenterPhoneAsync(storedContent, userId, ct);
        AddAudit(userId, "landing.content.published", previous, new { setting.UpdatedAt, Bytes = setting.SettingValue.Length });
        // Publishing consumes the draft in the same save: published content, sport descriptions and the
        // draft removal commit together or not at all.
        var draft = await db.SystemSettings.SingleOrDefaultAsync(s => s.SettingKey == DraftKey, ct);
        if (draft is not null) db.SystemSettings.Remove(draft);
        await db.SaveChangesAsync(ct);
        return new(await ReadFromDatabaseAsync(JsonNode.Parse(storedContent.GetRawText())!, ct), setting.UpdatedAt);
    }

    public async Task<LandingContentResponse> GetDraftAsync(CancellationToken ct)
    {
        var draft = await db.SystemSettings.AsNoTracking().SingleOrDefaultAsync(s => s.SettingKey == DraftKey, ct);
        if (draft?.SettingValue is null) return new(null, null);
        return new(await ReadFromDatabaseAsync(JsonNode.Parse(draft.SettingValue)!, ct), draft.UpdatedAt);
    }

    /// <summary>Fills what the database owns (images by media id, linked sport descriptions) and publishes R2 paths.</summary>
    private async Task<JsonElement> ReadFromDatabaseAsync(JsonNode node, CancellationToken ct)
    {
        await ResolveLegacyMediaAsync(node, ct);
        await HydrateSportDescriptionsAsync(node, ct);
        return TransformR2Urls(JsonSerializer.SerializeToElement(node), toPublicUrl: true);
    }

    /// <summary>
    /// Replaces each legacy media id with the image path from uploaded_media ("dashboard/…" R2 key, or the
    /// stored file URL). An image path already present wins, so a newer upload is never overwritten.
    /// An id that no longer resolves is kept untouched rather than silently dropped.
    /// </summary>
    private async Task ResolveLegacyMediaAsync(JsonNode node, CancellationToken ct)
    {
        var ids = new HashSet<long>();
        Collect(node);
        if (ids.Count == 0) return;
        var media = await db.UploadedMedias.AsNoTracking().Where(m => ids.Contains(m.Id))
            .Select(m => new { m.Id, m.DriveFileId, m.FileUrl }).ToListAsync(ct);
        var paths = media.Select(m => (m.Id, Path: MediaPath(m.DriveFileId, m.FileUrl)))
            .Where(m => m.Path is not null).ToDictionary(m => m.Id, m => m.Path!);
        Apply(node);

        void Collect(JsonNode? current)
        {
            if (current is JsonObject obj)
                foreach (var property in obj)
                {
                    if (LegacyMediaFields.ContainsKey(property.Key) && TryGetId(property.Value, out var id)) ids.Add(id);
                    else Collect(property.Value);
                }
            else if (current is JsonArray array)
                foreach (var child in array) Collect(child);
        }

        void Apply(JsonNode? current)
        {
            if (current is JsonObject obj)
            {
                foreach (var (idField, imageField) in LegacyMediaFields)
                {
                    if (!TryGetId(obj[idField], out var id) || !paths.TryGetValue(id, out var path)) continue;
                    var existing = obj[imageField] is JsonValue value && value.TryGetValue<string>(out var text) ? text : null;
                    if (string.IsNullOrWhiteSpace(existing)) obj[imageField] = path;
                    obj.Remove(idField);
                }
                foreach (var property in obj.ToArray()) Apply(property.Value);
            }
            else if (current is JsonArray array)
                foreach (var child in array) Apply(child);
        }
    }

    private static string? MediaPath(string? driveFileId, string? fileUrl)
    {
        if (!string.IsNullOrWhiteSpace(driveFileId) && driveFileId.StartsWith(MediaAccessScope.R2FileIdPrefix, StringComparison.Ordinal)
            && driveFileId.Length > MediaAccessScope.R2FileIdPrefix.Length)
            return driveFileId[MediaAccessScope.R2FileIdPrefix.Length..];
        return string.IsNullOrWhiteSpace(fileUrl) ? null : fileUrl.Trim();
    }

    private static bool TryGetId(JsonNode? node, out long id)
    {
        id = 0;
        if (node is not JsonValue value) return false;
        if (value.TryGetValue<long>(out id)) return id > 0;
        return value.TryGetValue<string>(out var text) && long.TryParse(text, out id) && id > 0;
    }

    // Homepage sport cards may link to a sports row through "sportId"; for those the sports table is the
    // single source of the card's "highlight" text (as in v1.5).
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

    private async Task StoreSportDescriptionsAsync(JsonNode node, long userId, CancellationToken ct)
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
            await EnsureCanEditCenterAsync(userId, centerId, ct);
        }
        foreach (var (sportId, text) in changes)
        {
            var sport = sports[sportId];
            var previous = sport.Description;
            sport.Description = text;
            db.AuditLogs.Add(new AuditLog
            {
                UserId = userId > 0 ? userId : null, CenterId = sport.CenterId, Action = "SPORT.UPDATED",
                EntityType = "Sport", EntityId = sport.Id,
                OldValues = JsonSerializer.Serialize(new { Description = previous }),
                NewValues = JsonSerializer.Serialize(new { Description = text }), CreatedAt = DateTime.UtcNow
            });
        }
    }

    // Admins edit any center; a Manager only the center of their active staff profile.
    private async Task EnsureCanEditCenterAsync(long userId, long centerId, CancellationToken ct)
    {
        var role = await (from user in db.Users.AsNoTracking()
                          join r in db.Roles.AsNoTracking() on user.RoleId equals r.Id
                          where user.Id == userId && user.Status == "Active"
                          select r.Name).SingleOrDefaultAsync(ct);
        if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) return;
        var managesCenter = string.Equals(role, "Manager", StringComparison.OrdinalIgnoreCase)
            && await db.StaffProfiles.AsNoTracking().AnyAsync(s => s.UserId == userId && s.CenterId == centerId && s.Status == "Active", ct);
        if (!managesCenter)
            throw FlowException.Forbidden("Bạn chỉ được sửa mô tả bộ môn của trung tâm mình quản lý.");
    }

    private static List<(JsonObject Card, long SportId)> LinkedSportCards(JsonNode node)
    {
        var result = new List<(JsonObject, long)>();
        if (node is not JsonObject root || root["coursesSection"] is not JsonObject section
            || section["sportsList"] is not JsonArray cards) return result;
        foreach (var card in cards.OfType<JsonObject>())
        {
            var link = card["sportId"];
            if (link is null || (link is JsonValue v && v.TryGetValue<string>(out var s) && string.IsNullOrWhiteSpace(s))) continue;
            result.Add((card, TryGetId(link, out var id) ? id : 0));
        }
        return result;
    }

    /// <summary>Autosaved, possibly incomplete content: only shape-checked, never shown publicly.</summary>
    /// <param name="expectedUpdatedAt">
    /// The draft version the editor last loaded/saved. When given and another editor has saved since,
    /// the write is rejected (409) instead of silently overwriting their work. Omitted = legacy last-write-wins.
    /// </param>
    public async Task<LandingContentResponse> SaveDraftAsync(JsonElement content, long userId, CancellationToken ct,
        DateTime? expectedUpdatedAt = null)
    {
        if (content.ValueKind != JsonValueKind.Object)
            throw new FlowException(400, "Bản nháp trang chủ phải là một đối tượng JSON.");
        var stored = TransformR2Urls(content, toPublicUrl: false);
        var draft = await db.SystemSettings.SingleOrDefaultAsync(s => s.SettingKey == DraftKey, ct);
        // Postgres keeps microseconds while the echoed value may carry ticks, so compare with a 1 ms tolerance.
        if (expectedUpdatedAt is { } expected && draft?.UpdatedAt is { } current
            && Math.Abs((current.ToUniversalTime() - expected.ToUniversalTime()).TotalMilliseconds) >= 1)
            throw new FlowException(409, "Bản nháp trang chủ vừa được người khác chỉnh sửa. Tải lại trang để xem bản mới nhất trước khi tiếp tục.");
        if (draft is null)
        {
            draft = new SystemSetting { SettingKey = DraftKey, Description = "Bản nháp nội dung trang chủ (chưa xuất bản)" };
            db.SystemSettings.Add(draft);
        }
        draft.SettingValue = stored.GetRawText();
        draft.UpdatedBy = userId;
        draft.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return new(TransformR2Urls(stored, toPublicUrl: true), draft.UpdatedAt);
    }

    public async Task DiscardDraftAsync(long userId, CancellationToken ct)
    {
        var draft = await db.SystemSettings.SingleOrDefaultAsync(s => s.SettingKey == DraftKey, ct);
        if (draft is null) return;
        // Delete and audit commit together.
        db.SystemSettings.Remove(draft);
        AddAudit(userId, "landing.draft.discarded", new { draft.UpdatedAt, draft.UpdatedBy }, null);
        await db.SaveChangesAsync(ct);
    }

    /// <summary>Keeps Center.Phone aligned with the published footer hotline for the publisher's center (or sole active center).</summary>
    internal async Task SyncCenterPhoneAsync(JsonElement content, long userId, CancellationToken ct)
    {
        if (!content.TryGetProperty("ctaAndFooter", out var footer)
            || !footer.TryGetProperty("contactPhone", out var phoneProp)
            || phoneProp.ValueKind != JsonValueKind.String)
            return;

        var phone = phoneProp.GetString()?.Trim();
        if (string.IsNullOrWhiteSpace(phone) || phone.Length > 20) return;

        var actorCenterId = await db.StaffProfiles.AsNoTracking()
            .Where(staff => staff.UserId == userId && staff.Status == "Active")
            .Select(staff => (long?)staff.CenterId)
            .FirstOrDefaultAsync(ct);

        Center? center = null;
        if (actorCenterId.HasValue)
        {
            center = await db.Centers.SingleOrDefaultAsync(item => item.Id == actorCenterId.Value, ct);
        }
        else
        {
            var activeCenters = await db.Centers.Where(item => item.Status == "Active").Take(2).ToListAsync(ct);
            if (activeCenters.Count == 1) center = activeCenters[0];
        }

        if (center is not null && !string.Equals(center.Phone, phone, StringComparison.Ordinal))
        {
            center.Phone = phone;
        }
    }

    private void AddAudit(long userId, string action, object? oldValues, object? newValues) =>
        db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            Action = action,
            EntityType = "SystemSetting",
            OldValues = oldValues is null ? null : JsonSerializer.Serialize(oldValues),
            NewValues = newValues is null ? null : JsonSerializer.Serialize(newValues),
            CreatedAt = DateTime.UtcNow
        });

    private JsonElement TransformR2Urls(JsonElement content, bool toPublicUrl)
    {
        var publicDomain = configuration["R2Storage:PublicDomain"]?.Trim().TrimEnd('/') ?? string.Empty;
        if (string.IsNullOrEmpty(publicDomain))
        {
            return content.Clone();
        }
        var node = JsonNode.Parse(content.GetRawText())!;
        TransformNode(node, publicDomain, toPublicUrl);
        return JsonSerializer.SerializeToElement(node);
    }

    private static void TransformNode(JsonNode node, string publicDomain, bool toPublicUrl)
    {
        if (node is JsonObject obj)
        {
            foreach (var property in obj.ToArray())
            {
                if (property.Value is JsonValue value && value.TryGetValue<string>(out var text))
                {
                    if (toPublicUrl && text.StartsWith("dashboard/", StringComparison.Ordinal))
                        obj[property.Key] = $"{publicDomain}/{text}";
                    else if (!toPublicUrl && text.StartsWith($"{publicDomain}/dashboard/", StringComparison.Ordinal))
                        obj[property.Key] = text[(publicDomain.Length + 1)..];
                }
                else if (property.Value is not null) TransformNode(property.Value, publicDomain, toPublicUrl);
            }
        }
        else if (node is JsonArray array)
        {
            foreach (var child in array)
                if (child is not null) TransformNode(child, publicDomain, toPublicUrl);
        }
    }

    internal static void Validate(JsonElement content)
    {
        if (content.ValueKind != JsonValueKind.Object || Encoding.UTF8.GetByteCount(content.GetRawText()) > 1024 * 1024)
            throw InvalidContent();
        foreach (var section in RequiredSections)
            if (!content.TryGetProperty(section, out var value) || value.ValueKind != JsonValueKind.Object) throw InvalidContent();
        foreach (var section in content.EnumerateObject())
        {
            if (!Sections.Contains(section.Name)) throw InvalidContent();
            if (section.Name == TranslationsSection) ValidateTranslations(section.Value);
            else ValidateObject(section.Value, 0);
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
            else if (property.Name == "number")
            {
                if (item.ValueKind != JsonValueKind.Number || !item.TryGetDouble(out var number) || !double.IsFinite(number) || number < 0 || number > 1_000_000_000) throw InvalidContent();
            }
            else if (property.Name == "sportId" || LegacyMediaFields.ContainsKey(property.Name))
            {
                // Database references: a positive id, as a number or (sportId, from the editor) a numeric string.
                var valid = item.ValueKind switch
                {
                    JsonValueKind.Number => item.TryGetInt64(out var id) && id > 0,
                    JsonValueKind.String => property.Name == "sportId" &&
                        (string.IsNullOrWhiteSpace(item.GetString()) || (long.TryParse(item.GetString(), out var sid) && sid > 0)),
                    JsonValueKind.Null => true,
                    _ => false
                };
                if (!valid) throw InvalidContent();
            }
            else ValidateText(item, property.Name);
        }
    }

    private static void ValidateTranslations(JsonElement value)
    {
        if (value.ValueKind != JsonValueKind.Object) throw InvalidContent();
        var count = 0;
        foreach (var entry in value.EnumerateObject())
        {
            if (++count > MaxTranslations || string.IsNullOrWhiteSpace(entry.Name) || entry.Name.Length > 10000 ||
                entry.Value.ValueKind != JsonValueKind.String || entry.Value.GetString()!.Length > 10000) throw InvalidContent();
        }
    }

    private static void ValidateText(JsonElement value, string name)
    {
        if (value.ValueKind != JsonValueKind.String || value.GetString()!.Length > 10000) throw InvalidContent();
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
