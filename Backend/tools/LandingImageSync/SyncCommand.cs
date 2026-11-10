using System.Data;
using System.Text.Json;
using Npgsql;

namespace LandingImageSync;

public static class SyncCommand
{
    public static async Task RunAsync(string[] args)
    {
        if (args.Any(a => a is not ("--inspect" or "--apply" or "--expected-plan" or "--rollback" or "--copy-content" or "--verify" or "--check-assets") &&
            !a.Equals(ValueAfter(args, "--expected-plan")) && !a.Equals(ValueAfter(args, "--rollback"))))
            throw new SyncException("Usage: [--inspect] | [--copy-content] [--apply --expected-plan HASH] | [--verify [--check-assets]] | [--rollback BACKUP_PATH]");
        LoadEnv("docker/landing-sync.env", ["LANDING_SYNC_SOURCE_CONNECTION", "LANDING_SYNC_TARGET_CONNECTION", "LANDING_SYNC_PUBLIC_DOMAIN"]);
        var source = Environment.GetEnvironmentVariable("LANDING_SYNC_SOURCE_CONNECTION");
        if (string.IsNullOrWhiteSpace(source))
        {
            var docker = ReadEnv("docker/.env");
            if (!docker.TryGetValue("POSTGRES_PASSWORD", out var password) || string.IsNullOrWhiteSpace(password))
                throw new SyncException("Set LANDING_SYNC_SOURCE_CONNECTION or configure docker/.env.");
            source = new NpgsqlConnectionStringBuilder
            {
                Host = "localhost", Port = 5433, Username = "scms", Database = "SportsCenterManagement",
                Password = password, SslMode = SslMode.Disable
            }.ConnectionString;
            if (docker.TryGetValue("R2_PUBLIC_DOMAIN", out var domain) && Environment.GetEnvironmentVariable("LANDING_SYNC_PUBLIC_DOMAIN") is null)
                Environment.SetEnvironmentVariable("LANDING_SYNC_PUBLIC_DOMAIN", domain);
        }
        var target = Environment.GetEnvironmentVariable("LANDING_SYNC_TARGET_CONNECTION");
        if (string.IsNullOrWhiteSpace(target)) throw new SyncException("LANDING_SYNC_TARGET_CONNECTION is missing.");
        var sourceOptions = ConnectionOptions.Parse(source);
        var targetOptions = ConnectionOptions.Parse(target);
        if (ConnectionOptions.Identity(sourceOptions) == ConnectionOptions.Identity(targetOptions))
            throw new SyncException("Source and target must be different databases.");
        if (targetOptions.Host is not ("localhost" or "127.0.0.1") && targetOptions.SslMode is not (SslMode.Require or SslMode.VerifyCA or SslMode.VerifyFull))
            throw new SyncException("External target must require TLS.");
        if (args.Contains("--inspect"))
        {
            await InspectAsync("Local", sourceOptions.ConnectionString);
            await InspectAsync("Render", targetOptions.ConnectionString);
            return;
        }
        if (args.Contains("--verify"))
        {
            var verification = await SyncDatabase.VerifyAsync(sourceOptions.ConnectionString, targetOptions.ConnectionString,
                Environment.GetEnvironmentVariable("LANDING_SYNC_PUBLIC_DOMAIN"));
            Console.WriteLine($"ContentMatches={verification.ContentMatches}; ReferencedImages={verification.ReferencedImages}");
            if (!verification.ContentMatches) throw new SyncException("Target landing does not match local content/R2 references.");
            if (args.Contains("--check-assets"))
            {
                var domain = Environment.GetEnvironmentVariable("LANDING_SYNC_PUBLIC_DOMAIN");
                if (!Uri.TryCreate(domain, UriKind.Absolute, out var root) || root.Scheme != "https")
                    throw new SyncException("Set LANDING_SYNC_PUBLIC_DOMAIN to the public HTTPS domain for asset checks.");
                using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(20) };
                var passed = 0;
                await Parallel.ForEachAsync(verification.StorageKeys, new ParallelOptions { MaxDegreeOfParallelism = 4 }, async (key, ct) =>
                {
                    using var request = new HttpRequestMessage(HttpMethod.Head, domain!.TrimEnd('/') + "/" + key);
                    using var response = await http.SendAsync(request, ct);
                    if (!response.IsSuccessStatusCode || response.Content.Headers.ContentType?.MediaType?.StartsWith("image/", StringComparison.Ordinal) != true)
                        throw new SyncException("A referenced public R2 image is unavailable or not served as an image.");
                    Interlocked.Increment(ref passed);
                });
                Console.WriteLine($"Public R2 images checked: {passed}/{verification.ReferencedImages}");
            }
            return;
        }
        var rollback = ValueAfter(args, "--rollback");
        if (rollback is not null)
        {
            await SyncDatabase.RollbackAsync(targetOptions.ConnectionString, rollback);
            Console.WriteLine("Landing setting restored. Imported media metadata retained; no R2 files deleted.");
            return;
        }
        var apply = args.Contains("--apply");
        var hash = ValueAfter(args, "--expected-plan");
        if (apply && hash is null) throw new SyncException("Apply requires --expected-plan from a reviewed dry-run.");
        var outcome = await SyncDatabase.RunAsync(sourceOptions.ConnectionString, targetOptions.ConnectionString,
            Environment.GetEnvironmentVariable("LANDING_SYNC_PUBLIC_DOMAIN"), apply, hash,
            Path.Combine(".validation", "landing-image-sync"), copyContent: args.Contains("--copy-content"));
        Console.WriteLine(JsonSerializer.Serialize(outcome, new JsonSerializerOptions { WriteIndented = true }));
    }

    private static string? ValueAfter(string[] args, string key)
    {
        var index = Array.IndexOf(args, key);
        return index >= 0 && index + 1 < args.Length ? args[index + 1] : null;
    }

    private static Dictionary<string, string> ReadEnv(string path)
    {
        var result = new Dictionary<string, string>(StringComparer.Ordinal);
        if (!File.Exists(path)) return result;
        foreach (var line in File.ReadLines(path))
        {
            var text = line.Trim();
            if (text.Length == 0 || text.StartsWith('#')) continue;
            var parts = text.Split('=', 2);
            if (parts.Length != 2) continue;
            var value = parts[1].Trim();
            if (value.Length >= 2 && ((value[0] == '"' && value[^1] == '"') || (value[0] == '\'' && value[^1] == '\''))) value = value[1..^1];
            result[parts[0].Trim()] = value;
        }
        return result;
    }

    private static void LoadEnv(string path, string[] allowed)
    {
        foreach (var item in ReadEnv(path))
            if (allowed.Contains(item.Key) && string.IsNullOrEmpty(Environment.GetEnvironmentVariable(item.Key)))
                Environment.SetEnvironmentVariable(item.Key, item.Value);
    }

    private static async Task InspectAsync(string label, string connection)
    {
        await using var db = new NpgsqlConnection(connection);
        await db.OpenAsync();
        await using var tx = await db.BeginTransactionAsync(IsolationLevel.RepeatableRead);
        await new NpgsqlCommand("SET TRANSACTION READ ONLY", db, tx).ExecuteNonQueryAsync();
        var hasSettings = await new NpgsqlCommand("SELECT to_regclass('public.system_settings') IS NOT NULL", db, tx).ExecuteScalarAsync();
        var hasMedia = await new NpgsqlCommand("SELECT to_regclass('public.uploaded_media') IS NOT NULL", db, tx).ExecuteScalarAsync();
        Console.WriteLine($"{label}: connected; system_settings={hasSettings}; uploaded_media={hasMedia}");
        await using (var schema = new NpgsqlCommand("SELECT table_name, string_agg(column_name, ', ' ORDER BY ordinal_position) FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('system_settings','uploaded_media') GROUP BY table_name ORDER BY table_name", db, tx))
        await using (var columns = await schema.ExecuteReaderAsync())
            while (await columns.ReadAsync()) Console.WriteLine($"{label}: {columns.GetString(0)} columns: {columns.GetString(1)}");
        if (hasSettings is true)
        {
            var count = await new NpgsqlCommand("SELECT count(*) FROM public.system_settings WHERE setting_key='site.landing-content' AND setting_value IS NOT NULL", db, tx).ExecuteScalarAsync();
            Console.WriteLine($"{label}: landing setting count={count}");
        }
    }
}
