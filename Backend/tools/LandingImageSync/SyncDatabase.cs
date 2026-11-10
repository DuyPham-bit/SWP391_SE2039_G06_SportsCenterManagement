using System.Data;
using System.Text.Json;
using System.Text.Json.Nodes;
using Npgsql;

namespace LandingImageSync;

public sealed record SettingRow(long Id, string? Json, long? UpdatedBy, DateTime? UpdatedAt);
public sealed record DatabaseSnapshot(SettingRow? Setting, List<MediaRow> Media);
public sealed record SyncOutcome(bool Applied, string PlanHash, int ChangedSlots, int NewMedia,
    string[] Paths, string[] Problems, string? BackupPath);
public sealed record SyncBackup(string TargetFingerprint, SettingRow? Before, long AfterId, string AfterJson);
public sealed record SyncVerification(bool ContentMatches, int ReferencedImages, string[] StorageKeys);

public static class SyncDatabase
{
    public static async Task<SyncOutcome> RunAsync(string sourceConnection, string targetConnection, string? publicDomain,
        bool apply, string? expectedHash, string backupDirectory, bool copyContent = false)
    {
        if (ConnectionOptions.Identity(ConnectionOptions.Parse(sourceConnection)) == ConnectionOptions.Identity(ConnectionOptions.Parse(targetConnection)))
            throw new SyncException("Source and target must be different databases.");
        await using var source = new NpgsqlConnection(sourceConnection);
        await source.OpenAsync();
        await using var sourceTx = await source.BeginTransactionAsync(IsolationLevel.RepeatableRead);
        await new NpgsqlCommand("SET TRANSACTION READ ONLY", source, sourceTx).ExecuteNonQueryAsync();
        var local = await ReadAsync(source, sourceTx, false);
        if (string.IsNullOrWhiteSpace(local.Setting?.Json)) throw new SyncException("Local landing content is absent.");
        await using var target = new NpgsqlConnection(targetConnection);
        await target.OpenAsync();
        await using var tx = await target.BeginTransactionAsync(IsolationLevel.Serializable);
        if (!apply) await new NpgsqlCommand("SET TRANSACTION READ ONLY", target, tx).ExecuteNonQueryAsync();
        var remote = await ReadAsync(target, tx, apply);
        if (!copyContent && string.IsNullOrWhiteSpace(remote.Setting?.Json))
            throw new SyncException("Target landing layout is absent. Use explicit --copy-content only when copying text/layout is authorized.");
        var plan = ImageSyncPlanner.Create(local.Setting.Json, copyContent ? local.Setting.Json : remote.Setting!.Json!, local.Media, remote.Media, publicDomain);
        var fingerprint = ConnectionOptions.Identity(ConnectionOptions.Parse(targetConnection));
        // Bind approval to both DB snapshots and the target, not just the number of changes.
        var hash = ImageSyncPlanner.Hash(JsonSerializer.Serialize(new { fingerprint, local, remote, publicDomain, copyContent }));
        var paths = plan.Changes.Select(s => string.Join('/', s.Path) + "/" + s.IdField).ToArray();
        if (!apply) return new(false, hash, paths.Length, plan.NewMedia.Count, paths, [.. plan.Problems], null);
        if (hash != expectedHash) throw new SyncException("Plan changed since dry-run. Review a fresh dry-run before applying.");
        if (plan.Problems.Count > 0) throw new SyncException("Plan has unresolved target-layout or media problems; nothing applied.");
        if (plan.NewMedia.Count == 0 && JsonNode.DeepEquals(JsonNode.Parse(plan.Render(plan.ExistingIds)),
            remote.Setting?.Json is { } current ? JsonNode.Parse(current) : null))
            return new(false, hash, 0, 0, [], [], null);
        var ids = new Dictionary<string, long>(plan.ExistingIds, StringComparer.Ordinal);
        foreach (var media in plan.NewMedia)
        {
            // Source tenant/user IDs never cross the DB boundary. Use target setting owner only.
            await using var insert = new NpgsqlCommand("""
                INSERT INTO public.uploaded_media
                (storage_key, drive_file_id, file_name, mime_type, file_size, file_url, uploaded_by_user_id, created_at)
                VALUES (@key, @drive, @name, @mime, @size, @url, @owner, @created) RETURNING "Id"
                """, target, tx);
            insert.Parameters.AddWithValue("key", media.StorageKey);
            insert.Parameters.AddWithValue("drive", "r2:" + media.StorageKey);
            insert.Parameters.AddWithValue("name", media.FileName);
            insert.Parameters.AddWithValue("mime", media.MimeType);
            insert.Parameters.AddWithValue("size", NpgsqlTypes.NpgsqlDbType.Bigint, (object?)media.FileSize ?? DBNull.Value);
            insert.Parameters.AddWithValue("url", media.StorageKey);
            insert.Parameters.AddWithValue("owner", NpgsqlTypes.NpgsqlDbType.Bigint, (object?)remote.Setting?.UpdatedBy ?? DBNull.Value);
            insert.Parameters.AddWithValue("created", DateTime.SpecifyKind(media.CreatedAt, DateTimeKind.Utc));
            ids[media.StorageKey] = (long)(await insert.ExecuteScalarAsync())!;
        }
        var after = plan.Render(ids);
        long settingId;
        if (remote.Setting is null)
        {
            await using var create = new NpgsqlCommand("INSERT INTO public.system_settings(setting_key,setting_value,description,updated_at) VALUES ('site.landing-content',@json,'Landing content imported from local',NOW()) RETURNING \"Id\"", target, tx);
            create.Parameters.AddWithValue("json", after);
            settingId = (long)(await create.ExecuteScalarAsync())!;
        }
        else
        {
            settingId = remote.Setting.Id;
            await UpdateAsync(target, tx, settingId, after, DateTime.UtcNow);
        }
        Directory.CreateDirectory(backupDirectory);
        var backupPath = Path.Combine(backupDirectory, $"landing-before-{DateTime.UtcNow:yyyyMMdd-HHmmss}-{Guid.NewGuid():N}.json");
        // FileMode.CreateNew and Flush(true): cannot commit if a durable backup cannot be written.
        using (var file = new FileStream(backupPath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            JsonSerializer.Serialize(file, new SyncBackup(fingerprint, remote.Setting, settingId, after), new JsonSerializerOptions { WriteIndented = true });
            file.Flush(true);
        }
        await tx.CommitAsync();
        return new(true, hash, paths.Length, plan.NewMedia.Count, paths, [], backupPath);
    }

    public static async Task RollbackAsync(string targetConnection, string backupPath)
    {
        var backup = JsonSerializer.Deserialize<SyncBackup>(await File.ReadAllTextAsync(backupPath))
            ?? throw new SyncException("Invalid backup.");
        if (backup.TargetFingerprint != ConnectionOptions.Identity(ConnectionOptions.Parse(targetConnection)))
            throw new SyncException("Backup belongs to a different target database.");
        await using var target = new NpgsqlConnection(targetConnection);
        await target.OpenAsync();
        await using var tx = await target.BeginTransactionAsync(IsolationLevel.Serializable);
        var state = await ReadAsync(target, tx, true);
        if (state.Setting?.Id != backup.AfterId || state.Setting.Json != backup.AfterJson)
            throw new SyncException("Target content changed after sync; refusing to overwrite later edits.");
        if (backup.Before is { } before) await UpdateAsync(target, tx, before.Id, before.Json, before.UpdatedAt);
        else
        {
            await using var remove = new NpgsqlCommand("DELETE FROM public.system_settings WHERE \"Id\"=@id AND setting_key='site.landing-content'", target, tx);
            remove.Parameters.AddWithValue("id", backup.AfterId);
            if (await remove.ExecuteNonQueryAsync() != 1) throw new SyncException("Rollback target changed unexpectedly.");
        }
        await tx.CommitAsync();
    }

    public static async Task<SyncVerification> VerifyAsync(string sourceConnection, string targetConnection, string? publicDomain)
    {
        async Task<DatabaseSnapshot> Snapshot(string connection)
        {
            await using var db = new NpgsqlConnection(connection);
            await db.OpenAsync();
            await using var tx = await db.BeginTransactionAsync(IsolationLevel.RepeatableRead);
            await new NpgsqlCommand("SET TRANSACTION READ ONLY", db, tx).ExecuteNonQueryAsync();
            return await ReadAsync(db, tx, false);
        }
        var source = await Snapshot(sourceConnection);
        var target = await Snapshot(targetConnection);
        if (source.Setting?.Json is not { } local || target.Setting?.Json is not { } remote)
            throw new SyncException("Both databases must have landing content for verification.");
        var plan = ImageSyncPlanner.Create(local, local, source.Media, target.Media, publicDomain);
        var matches = plan.Problems.Count == 0 && plan.NewMedia.Count == 0 &&
            JsonNode.DeepEquals(JsonNode.Parse(plan.Render(plan.ExistingIds)), JsonNode.Parse(remote));
        return new(matches, plan.ExistingIds.Count, plan.ExistingIds.Keys.Order(StringComparer.Ordinal).ToArray());
    }

    private static async Task UpdateAsync(NpgsqlConnection db, NpgsqlTransaction tx, long id, string? json, DateTime? timestamp)
    {
        await using var update = new NpgsqlCommand("UPDATE public.system_settings SET setting_value=@json, updated_at=@time WHERE \"Id\"=@id AND setting_key='site.landing-content'", db, tx);
        update.Parameters.AddWithValue("json", NpgsqlTypes.NpgsqlDbType.Text, (object?)json ?? DBNull.Value);
        update.Parameters.AddWithValue("time", NpgsqlTypes.NpgsqlDbType.TimestampTz, timestamp is null ? DBNull.Value : DateTime.SpecifyKind(timestamp.Value, DateTimeKind.Utc));
        update.Parameters.AddWithValue("id", id);
        if (await update.ExecuteNonQueryAsync() != 1) throw new SyncException("Target setting changed unexpectedly.");
    }

    private static async Task<DatabaseSnapshot> ReadAsync(NpgsqlConnection db, NpgsqlTransaction tx, bool locked)
    {
        await using (var schema = new NpgsqlCommand("SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uploaded_media' AND column_name='storage_key')", db, tx))
            if (await schema.ExecuteScalarAsync() is not true)
                throw new SyncException("Database schema lacks uploaded_media.storage_key. Deploy the PostgreSQL/R2 backend migrations to the correct database before syncing. No schema or data was changed.");
        await using var command = new NpgsqlCommand("SELECT \"Id\", setting_value, updated_by, updated_at FROM public.system_settings WHERE setting_key='site.landing-content'" + (locked ? " FOR UPDATE" : ""), db, tx);
        SettingRow? setting = null;
        await using (var rows = await command.ExecuteReaderAsync())
        {
            if (await rows.ReadAsync())
                setting = new(rows.GetInt64(0), rows.IsDBNull(1) ? null : rows.GetString(1), rows.IsDBNull(2) ? null : rows.GetInt64(2), rows.IsDBNull(3) ? null : rows.GetDateTime(3));
            if (await rows.ReadAsync()) throw new SyncException("Duplicate landing settings; no data changed.");
        }
        var media = new List<MediaRow>();
        await using var mediaCommand = new NpgsqlCommand("SELECT \"Id\", storage_key, drive_file_id, file_name, mime_type, file_size, created_at FROM public.uploaded_media ORDER BY \"Id\"", db, tx);
        await using var reader = await mediaCommand.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            media.Add(new(reader.GetInt64(0), reader.IsDBNull(1) ? "" : reader.GetString(1), reader.IsDBNull(2) ? "" : reader.GetString(2),
                reader.GetString(3), reader.GetString(4), reader.IsDBNull(5) ? null : reader.GetInt64(5), reader.GetDateTime(6)));
        return new(setting, media);
    }
}
