using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SportsCenterManagement.BLL.Exceptions;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;

namespace SportsCenterManagement.BLL.Services;

public sealed record LandingContentResponse(JsonElement? Content, DateTime? UpdatedAt);

public sealed class LandingContentService(SportsCenterDbContext db)
{
    private const string SettingKey = "site.landing-content";
    private static readonly string[] Sections = ["heroBanner", "whyUs", "coursesSection", "facilitiesSection", "zonesLayout", "ctaAndFooter"];
    private static readonly HashSet<string> ObjectArrays = ["metrics", "features", "stats", "sportsList", "facilitiesList", "zones", "serviceAmenities", "specs", "trustBadges"];
    private static readonly HashSet<string> TextArrays = ["tags", "badges", "amenities", "items"];
    private static readonly HashSet<string> Booleans = ["isVisible", "isAutoCount", "formatThousands"];

    public async Task<LandingContentResponse> GetAsync(CancellationToken ct)
    {
        var setting = await db.SystemSettings.AsNoTracking().SingleOrDefaultAsync(s => s.SettingKey == SettingKey, ct);
        if (setting?.SettingValue is null) return new(null, null);
        using var document = JsonDocument.Parse(setting.SettingValue);
        return new(document.RootElement.Clone(), setting.UpdatedAt);
    }

    public async Task<LandingContentResponse> SaveAsync(JsonElement content, long userId, CancellationToken ct)
    {
        Validate(content);
        var setting = await db.SystemSettings.SingleOrDefaultAsync(s => s.SettingKey == SettingKey, ct);
        if (setting is null)
        {
            setting = new SystemSetting { SettingKey = SettingKey, Description = "Nội dung trang chủ công khai" };
            db.SystemSettings.Add(setting);
        }
        setting.SettingValue = content.GetRawText();
        setting.UpdatedBy = userId;
        setting.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return new(content.Clone(), setting.UpdatedAt);
    }

    private static void Validate(JsonElement content)
    {
        if (content.ValueKind != JsonValueKind.Object || Encoding.UTF8.GetByteCount(content.GetRawText()) > 1024 * 1024)
            throw InvalidContent();
        foreach (var section in Sections)
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
        if (name.EndsWith("Url", StringComparison.Ordinal) || name.EndsWith("Link", StringComparison.Ordinal) || name is "image" or "secondaryImage")
        {
            var url = value.GetString()!.Trim();
            if (url.Length == 0) return;
            if (url.Any(char.IsControl) || url.Contains('\\') || url.StartsWith("//")) throw InvalidContent();
            if (url.StartsWith('#') || url.StartsWith('/') || url.StartsWith("./")) return;
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || uri.Scheme is not ("http" or "https")) throw InvalidContent();
        }
    }

    private static FlowException InvalidContent() => new(400, "Nội dung trang chủ không hợp lệ. Kiểm tra văn bản, danh sách và liên kết HTTP/HTTPS.");
}
