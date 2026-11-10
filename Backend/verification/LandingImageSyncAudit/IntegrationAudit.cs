using System.Text.Json.Nodes;
using LandingImageSync;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SportsCenterManagement.DAL.Context;

internal static class IntegrationAudit
{
    public static async Task RunAsync(string adminConnection)
    {
        var options = new NpgsqlConnectionStringBuilder(adminConnection) { Database = "postgres", Pooling = false };
        if (options.Host is not ("localhost" or "127.0.0.1")) throw new Exception("Audit must use a local server.");
        var prefix = "scms_image_sync_audit_" + Guid.NewGuid().ToString("N");
        var names = new[] { prefix + "_source", prefix + "_target" };
        var created = new List<string>();
        var directory = Path.Combine(".validation", "landing-image-sync-audit", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(directory);
        await using var admin = new NpgsqlConnection(options.ConnectionString);
        await admin.OpenAsync();
        var checks = 0;
        void Check(bool condition, string name)
        {
            if (!condition) throw new Exception("FAIL " + name);
            checks++;
            Console.WriteLine("PASS " + name);
        }
        async Task Rejected(Func<Task> action, string name)
        {
            try { await action(); }
            catch (SyncException) { Check(true, name); return; }
            throw new Exception("FAIL " + name);
        }
        try
        {
            foreach (var name in names)
            {
                await new NpgsqlCommand($"CREATE DATABASE {name}", admin).ExecuteNonQueryAsync();
                created.Add(name);
                options.Database = name;
                options.Pooling = true;
                await using var context = new SportsCenterDbContext(new DbContextOptionsBuilder<SportsCenterDbContext>().UseNpgsql(options.ConnectionString).Options);
                await context.Database.MigrateAsync();
            }
            options.Database = names[0];
            var source = options.ConnectionString;
            options.Database = names[1];
            var target = options.ConnectionString;
            await using var sourceDb = new NpgsqlConnection(source);
            await using var targetDb = new NpgsqlConnection(target);
            await sourceDb.OpenAsync();
            await targetDb.OpenAsync();
            const string localJson = """
                {"heroBanner":{"title":"LOCAL TITLE","posterMediaId":7},"whyUs":{"description":"Local text"},
                "coursesSection":{"sportsList":[{"id":"swim","name":"Swim","mediaId":8}]}}
                """;
            await new NpgsqlCommand("""
                INSERT INTO public.uploaded_media ("Id", storage_key, drive_file_id, file_name, mime_type, file_url, created_at)
                VALUES (7, 'dashboard/one.jpg', 'r2:dashboard/one.jpg', 'one.jpg', 'image/jpeg', '', NOW()),
                       (8, 'dashboard/two.jpg', 'r2:dashboard/two.jpg', 'two.jpg', 'image/jpeg', '', NOW());
                """, sourceDb).ExecuteNonQueryAsync();
            await using (var seed = new NpgsqlCommand("INSERT INTO public.system_settings(setting_key,setting_value) VALUES ('site.landing-content',@json)", sourceDb))
            {
                seed.Parameters.AddWithValue("json", localJson);
                await seed.ExecuteNonQueryAsync();
            }
            await new NpgsqlCommand("""
                INSERT INTO public.uploaded_media ("Id", storage_key, drive_file_id, file_name, mime_type, file_url, created_at)
                VALUES (7, 'dashboard/collision.jpg', 'r2:dashboard/collision.jpg', 'different.jpg', 'image/jpeg', '', NOW()),
                       (501, 'dashboard/one.jpg', 'r2:dashboard/one.jpg', 'one.jpg', 'image/jpeg', '', NOW());
                SELECT setval(pg_get_serial_sequence('public.uploaded_media','Id'), 600);
                INSERT INTO public.system_settings(setting_key,setting_value) VALUES ('unrelated.setting','DO NOT TOUCH');
                INSERT INTO public.centers(name,address,status,created_at) VALUES ('Untouched center','Address','Active',NOW());
                """, targetDb).ExecuteNonQueryAsync();
            async Task<string?> Landing()
            {
                var value = await new NpgsqlCommand("SELECT setting_value FROM public.system_settings WHERE setting_key='site.landing-content'", targetDb).ExecuteScalarAsync();
                return value as string;
            }
            async Task<long> MediaCount() => (long)(await new NpgsqlCommand("SELECT count(*) FROM public.uploaded_media", targetDb).ExecuteScalarAsync())!;
            await Rejected(async () => await SyncDatabase.RunAsync(source, target, null, false, null, directory), "image-only mode refuses absent target layout");
            var preview = await SyncDatabase.RunAsync(source, target, null, false, null, directory, copyContent: true);
            Check(!preview.Applied && preview.NewMedia == 1 && preview.Problems.Length == 0 && await Landing() is null && await MediaCount() == 2,
                "full-content preview supports empty target and makes no writes");
            await Rejected(async () => await SyncDatabase.RunAsync(source, target, null, true, "wrong-plan", directory, copyContent: true), "wrong approval hash makes no writes");
            var blockedDirectory = Path.Combine(directory, "not-a-directory");
            await File.WriteAllTextAsync(blockedDirectory, "block");
            try { await SyncDatabase.RunAsync(source, target, null, true, preview.PlanHash, blockedDirectory, copyContent: true); throw new Exception("Backup failure accepted"); }
            catch (IOException) { Check(await Landing() is null && await MediaCount() == 2, "backup write failure rolls back setting and media insertion"); }
            var applied = await SyncDatabase.RunAsync(source, target, null, true, preview.PlanHash, directory, copyContent: true);
            var json = JsonNode.Parse((await Landing())!)!;
            Check(applied.Applied && applied.NewMedia == 1 && File.Exists(applied.BackupPath), "full-content apply creates durable backup and commits");
            Check(json["heroBanner"]!["posterMediaId"]!.GetValue<long>() == 501 && json["coursesSection"]!["sportsList"]![0]!["mediaId"]!.GetValue<long>() > 600,
                "full copy reuses R2 keys and remaps colliding numeric IDs");
            Check(json["heroBanner"]!["title"]!.GetValue<string>() == "LOCAL TITLE" && json["whyUs"]!["description"]!.GetValue<string>() == "Local text",
                "explicit full-content mode copies text and layout");
            var verification = await SyncDatabase.VerifyAsync(source, target, null);
            Check(verification.ContentMatches && verification.ReferencedImages == 2, "verification compares content using R2 keys instead of database IDs");
            var repeat = await SyncDatabase.RunAsync(source, target, null, false, null, directory, copyContent: true);
            var noOp = await SyncDatabase.RunAsync(source, target, null, true, repeat.PlanHash, directory, copyContent: true);
            Check(!noOp.Applied && noOp.NewMedia == 0, "repeat full-content import is a no-op");
            Check((string)(await new NpgsqlCommand("SELECT setting_value FROM public.system_settings WHERE setting_key='unrelated.setting'", targetDb).ExecuteScalarAsync())! == "DO NOT TOUCH" &&
                (long)(await new NpgsqlCommand("SELECT count(*) FROM public.centers WHERE name='Untouched center'", targetDb).ExecuteScalarAsync())! == 1,
                "unrelated settings and business data are untouched");
            await Rejected(() => SyncDatabase.RollbackAsync(source, applied.BackupPath!), "rollback refuses a different database");
            await new NpgsqlCommand("UPDATE public.system_settings SET setting_value=setting_value || ' ' WHERE setting_key='site.landing-content'", targetDb).ExecuteNonQueryAsync();
            await Rejected(() => SyncDatabase.RollbackAsync(target, applied.BackupPath!), "rollback refuses later edits");
            await Rejected(async () => await SyncDatabase.RunAsync(source, target, null, true, repeat.PlanHash, directory, copyContent: true), "stale snapshot cannot overwrite target changes");
            await using (var restore = new NpgsqlCommand("UPDATE public.system_settings SET setting_value=@json WHERE setting_key='site.landing-content'", targetDb))
            {
                restore.Parameters.AddWithValue("json", json.ToJsonString());
                await restore.ExecuteNonQueryAsync();
            }
            await SyncDatabase.RollbackAsync(target, applied.BackupPath!);
            Check(await Landing() is null && await MediaCount() == 3, "rollback restores absent landing without deleting reusable media");
            await new NpgsqlCommand("INSERT INTO public.system_settings(setting_key,setting_value) VALUES ('site.landing-content','{\"heroBanner\":{\"title\":\"OLD\"}}')", targetDb).ExecuteNonQueryAsync();
            var replacement = await SyncDatabase.RunAsync(source, target, null, false, null, directory, copyContent: true);
            var replaced = await SyncDatabase.RunAsync(source, target, null, true, replacement.PlanHash, directory, copyContent: true);
            await SyncDatabase.RollbackAsync(target, replaced.BackupPath!);
            Check((await Landing()) == "{\"heroBanner\":{\"title\":\"OLD\"}}", "rollback restores existing target content exactly");
            await new NpgsqlCommand("ALTER TABLE public.uploaded_media DROP COLUMN storage_key", targetDb).ExecuteNonQueryAsync();
            await Rejected(async () => await SyncDatabase.RunAsync(source, target, null, false, null, directory, copyContent: true),
                "old target schema is rejected without automatic migration");
            Console.WriteLine($"PostgreSQL image sync audit: {checks} checks passed.");
        }
        finally
        {
            NpgsqlConnection.ClearAllPools();
            foreach (var name in created)
            {
                if (!names.Contains(name) || !name.StartsWith("scms_image_sync_audit_", StringComparison.Ordinal)) throw new Exception("Unsafe cleanup target");
                await new NpgsqlCommand($"DROP DATABASE {name} WITH (FORCE)", admin).ExecuteNonQueryAsync();
            }
        }
    }
}
