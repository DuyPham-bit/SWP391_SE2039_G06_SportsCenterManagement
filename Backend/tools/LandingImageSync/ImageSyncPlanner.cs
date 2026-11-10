using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace LandingImageSync;

public sealed class SyncException(string message) : Exception(message);
public sealed record MediaRow(long Id, string StorageKey, string DriveFileId, string FileName,
    string MimeType, long? FileSize, DateTime CreatedAt);
public sealed record ImageSlot(string[] Path, string UrlField, string IdField, string StorageKey);

public sealed class ImagePlan(string targetJson)
{
    public List<string> Problems { get; } = [];
    public List<MediaRow> NewMedia { get; } = [];
    public List<ImageSlot> Changes { get; } = [];
    public Dictionary<string, long> ExistingIds { get; } = new(StringComparer.Ordinal);
    public bool HasChanges => Changes.Count > 0;
    public string Render(IReadOnlyDictionary<string, long> ids)
    {
        var result = JsonNode.Parse(targetJson)!;
        foreach (var slot in Changes)
        {
            JsonNode current = result;
            foreach (var segment in slot.Path)
                current = current is JsonArray a ? a[int.Parse(segment)]! : current[segment]!;
            var obj = (JsonObject)current;
            obj.Remove(slot.UrlField);
            obj[slot.IdField] = ids[slot.StorageKey];
        }
        return result.ToJsonString();
    }
}

public static class ImageSyncPlanner
{
    // Keep aligned with LandingContentService.ImageFields. Only image fields are patched
    // in the supplied template; the caller explicitly chooses target or source layout.
    private static readonly Dictionary<string, string> Fields = new()
    {
        ["image"] = "mediaId", ["secondaryImage"] = "secondaryMediaId",
        ["posterUrl"] = "posterMediaId", ["imageUrl"] = "imageMediaId"
    };

    public static string Hash(string text) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(text)));

    public static ImagePlan Create(string sourceJson, string targetJson, IReadOnlyList<MediaRow> sourceMedia,
        IReadOnlyList<MediaRow> targetMedia, string? publicDomain = null)
    {
        var source = JsonNode.Parse(sourceJson) as JsonObject ?? throw new SyncException("Local landing content must be a JSON object.");
        var target = JsonNode.Parse(targetJson) as JsonObject ?? throw new SyncException("Target landing content must be a JSON object.");
        var plan = new ImagePlan(targetJson);
        Visit(source, target, []);
        return plan;

        void Visit(JsonObject from, JsonObject? to, string[] path)
        {
            foreach (var pair in Fields)
            {
                MediaRow? media = null;
                if (from[pair.Value] is JsonValue idValue && idValue.TryGetValue<long>(out var id))
                    media = sourceMedia.SingleOrDefault(m => m.Id == id)
                        ?? throw new SyncException($"Local media ID {id} is missing.");
                else if (from[pair.Key] is JsonValue urlValue && urlValue.TryGetValue<string>(out var url) && !string.IsNullOrWhiteSpace(url))
                {
                    var key = publicDomain is not null && url.StartsWith(publicDomain.TrimEnd('/') + "/", StringComparison.Ordinal)
                        ? url[(publicDomain.TrimEnd('/').Length + 1)..] : url;
                    var matches = sourceMedia.Where(m => m.StorageKey == key).ToArray();
                    if (matches.Length != 1) throw new SyncException("Local image URL does not resolve to one registered R2 key.");
                    media = matches[0];
                }
                if (media is null) continue; // Empty local slots never clear target images.
                var storageKey = media.StorageKey;
                if (!storageKey.StartsWith("dashboard/", StringComparison.Ordinal) || storageKey.Contains("..") ||
                    storageKey.IndexOfAny(['\\', '?', '#', '\r', '\n']) >= 0 || !media.MimeType.StartsWith("image/", StringComparison.Ordinal))
                    throw new SyncException("Only registered dashboard image keys can be imported.");
                if (to is null)
                {
                    plan.Problems.Add($"Missing target object: {string.Join('/', path)}");
                    continue;
                }
                var candidates = targetMedia.Where(m => m.StorageKey == storageKey ||
                    (m.StorageKey.Length == 0 && m.DriveFileId == "r2:" + storageKey)).ToArray();
                if (candidates.Length > 1 || candidates.Any(m => m.StorageKey.Length == 0))
                {
                    plan.Problems.Add($"Ambiguous or legacy target media requires review: {storageKey}");
                    continue;
                }
                if (candidates.Length == 1) plan.ExistingIds[storageKey] = candidates[0].Id;
                else if (plan.NewMedia.All(m => m.StorageKey != storageKey)) plan.NewMedia.Add(media);
                var unchanged = candidates.Length == 1 && to[pair.Value] is JsonValue targetId &&
                    targetId.TryGetValue<long>(out var currentId) && currentId == candidates[0].Id && !to.ContainsKey(pair.Key);
                if (!unchanged) plan.Changes.Add(new(path, pair.Key, pair.Value, storageKey));
            }
            foreach (var property in from)
            {
                if (property.Value is JsonObject child)
                    Visit(child, to?[property.Key] as JsonObject, [.. path, property.Key]);
                else if (property.Value is JsonArray array)
                {
                    var dest = to?[property.Key] as JsonArray;
                    foreach (var entry in array.OfType<JsonObject>())
                    {
                        var identityField = entry["id"] is JsonValue ? "id" : "name";
                        var identity = entry[identityField]?.ToJsonString();
                        var matches = dest?.Select((item, index) => (item, index)).Where(x => x.item is JsonObject o &&
                            identity is not null && o[identityField]?.ToJsonString() == identity).ToArray() ?? [];
                        var uniqueSource = identity is not null && array.OfType<JsonObject>().Count(o => o[identityField]?.ToJsonString() == identity) == 1;
                        if (matches.Length == 1 && uniqueSource)
                            Visit(entry, (JsonObject)matches[0].item!, [.. path, property.Key, matches[0].index.ToString()]);
                        else Visit(entry, null, [.. path, property.Key, "unmatched"]);
                    }
                }
            }
        }
    }
}
