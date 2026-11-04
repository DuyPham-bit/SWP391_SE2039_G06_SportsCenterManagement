using System.Text.Json;

namespace SportsCenterManagement.API.Services;

public static class LandingMediaCleanup
{
    public static bool ContainsKey(string? json, string key) => Keys(json).Contains(key);

    public static HashSet<string> Keys(string? json)
    {
        var keys = new HashSet<string>(StringComparer.Ordinal);
        if (string.IsNullOrWhiteSpace(json)) return keys;
        using var doc = JsonDocument.Parse(json);
        Visit(doc.RootElement);
        return keys;
        void Visit(JsonElement node)
        {
            if (node.ValueKind == JsonValueKind.Object)
                foreach (var p in node.EnumerateObject()) Visit(p.Value);
            else if (node.ValueKind == JsonValueKind.Array)
                foreach (var child in node.EnumerateArray()) Visit(child);
            else if (node.ValueKind == JsonValueKind.String)
            {
                var value = node.GetString()!;
                if (value.StartsWith("dashboard/", StringComparison.Ordinal)) keys.Add(value);
            }
        }
    }
}
