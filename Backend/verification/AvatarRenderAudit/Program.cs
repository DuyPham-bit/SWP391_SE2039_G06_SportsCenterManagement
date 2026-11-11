// Read-only audit of avatar persistence on a deployed (e.g. Render) PostgreSQL database.
//
// Usage (PowerShell):
//   $env:SCMS_AUDIT_DB = "Host=...;Port=5432;Database=...;Username=...;Password=...;SSL Mode=Require"
//   $env:SCMS_AUDIT_R2_PUBLIC_DOMAIN = "https://<r2-public-domain>"   # optional: HEAD-checks avatar URLs
//   dotnet run --project Backend/verification/AvatarRenderAudit
//
// Runs inside a READ ONLY transaction; never prints emails, phones or secrets.
using Npgsql;

var connectionString = Environment.GetEnvironmentVariable("SCMS_AUDIT_DB");
if (string.IsNullOrWhiteSpace(connectionString))
{
    Console.Error.WriteLine("Set SCMS_AUDIT_DB to the ADO.NET connection string of the database to audit.");
    return 2;
}
var publicDomain = Environment.GetEnvironmentVariable("SCMS_AUDIT_R2_PUBLIC_DOMAIN")?.Trim().TrimEnd('/');

await using var connection = new NpgsqlConnection(connectionString);
await connection.OpenAsync();
await using var tx = await connection.BeginTransactionAsync();
await using (var ro = new NpgsqlCommand("SET TRANSACTION READ ONLY", connection, tx)) await ro.ExecuteNonQueryAsync();

var failures = 0;

// 1) Schema: users.avatar_key must exist (created by InitialPostgres migration).
await using (var cmd = new NpgsqlCommand("""
    SELECT data_type, character_maximum_length
    FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'users' AND column_name = 'avatar_key'
    """, connection, tx))
await using (var reader = await cmd.ExecuteReaderAsync())
{
    if (await reader.ReadAsync())
        Console.WriteLine($"[OK]   users.avatar_key exists ({reader.GetString(0)}({(reader.IsDBNull(1) ? "?" : reader.GetInt32(1))}))");
    else
    {
        Console.WriteLine("[FAIL] users.avatar_key column is missing — apply EF migrations on this database.");
        failures++;
    }
}
if (failures > 0) return 1;

// 2) Migration state.
await using (var cmd = new NpgsqlCommand("""
    SELECT "MigrationId" FROM "__EFMigrationsHistory" ORDER BY "MigrationId" DESC LIMIT 1
    """, connection, tx))
{
    try { Console.WriteLine($"[INFO] Latest applied migration: {await cmd.ExecuteScalarAsync() ?? "(none)"}"); }
    catch (PostgresException ex) { Console.WriteLine($"[WARN] Could not read __EFMigrationsHistory: {ex.MessageText}"); }
}

// 3) Coverage per role.
Console.WriteLine("[INFO] Avatar coverage by role (users with avatar_key / total):");
await using (var cmd = new NpgsqlCommand("""
    SELECT r.name, COUNT(*) FILTER (WHERE NULLIF(BTRIM(u.avatar_key), '') IS NOT NULL), COUNT(*)
    FROM users u JOIN roles r ON r."Id" = u.role_id
    GROUP BY r.name ORDER BY r.name
    """, connection, tx))
await using (var reader = await cmd.ExecuteReaderAsync())
{
    while (await reader.ReadAsync())
        Console.WriteLine($"         {reader.GetString(0),-14} {reader.GetInt64(1),4} / {reader.GetInt64(2)}");
}

// 4) Key shape: ProfileService only accepts "avatars/{userId}/..." keys.
var keys = new List<(long UserId, string Key)>();
await using (var cmd = new NpgsqlCommand("""
    SELECT "Id", avatar_key FROM users WHERE NULLIF(BTRIM(avatar_key), '') IS NOT NULL ORDER BY "Id"
    """, connection, tx))
await using (var reader = await cmd.ExecuteReaderAsync())
{
    while (await reader.ReadAsync()) keys.Add((reader.GetInt64(0), reader.GetString(1)));
}
var malformed = keys.Where(k => !k.Key.StartsWith($"avatars/{k.UserId}/", StringComparison.Ordinal)).ToList();
if (malformed.Count == 0)
    Console.WriteLine($"[OK]   All {keys.Count} avatar keys follow avatars/{{userId}}/...");
else
{
    failures++;
    Console.WriteLine($"[FAIL] {malformed.Count} avatar keys do not match avatars/{{userId}}/ (user ids: {string.Join(", ", malformed.Select(k => k.UserId).Take(20))})");
}

// 5) Refund transfer proofs: the proof endpoint only presigns keys matching this pattern.
var proofKeyPattern = new System.Text.RegularExpressions.Regex(@"\Arefund-bills/[a-zA-Z0-9/_.-]+\z");
var proofs = new List<(long RefundId, string Status, string Proof)>();
await using (var cmd = new NpgsqlCommand("""
    SELECT "Id", status, transfer_proof_url FROM payment_refunds
    WHERE NULLIF(BTRIM(transfer_proof_url), '') IS NOT NULL ORDER BY "Id"
    """, connection, tx))
await using (var reader = await cmd.ExecuteReaderAsync())
{
    while (await reader.ReadAsync()) proofs.Add((reader.GetInt64(0), reader.GetString(1), reader.GetString(2)));
}
await using (var cmd = new NpgsqlCommand("SELECT status, COUNT(*) FROM payment_refunds GROUP BY status ORDER BY status", connection, tx))
await using (var reader = await cmd.ExecuteReaderAsync())
{
    var parts = new List<string>();
    while (await reader.ReadAsync()) parts.Add($"{reader.GetString(0)}={reader.GetInt64(1)}");
    Console.WriteLine($"[INFO] Refund requests by status: {(parts.Count == 0 ? "(none)" : string.Join(", ", parts))}; with transfer proof: {proofs.Count}");
}
var badProofs = proofs.Where(p => !proofKeyPattern.IsMatch(p.Proof) || p.Proof.Split('/').Any(s => s is "" or "." or "..")).ToList();
if (badProofs.Count == 0)
    Console.WriteLine($"[OK]   All {proofs.Count} transfer proofs are R2 keys the proof endpoint can presign");
else
{
    failures++;
    Console.WriteLine($"[FAIL] {badProofs.Count} transfer proofs are not presignable refund-bills/ keys (refund ids: {string.Join(", ", badProofs.Select(p => p.RefundId).Take(20))})");
}

await tx.RollbackAsync();

if (!string.IsNullOrEmpty(publicDomain) && proofs.Count > 0)
{
    using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
    var missing = new List<long>();
    foreach (var proof in proofs.Where(p => proofKeyPattern.IsMatch(p.Proof)).Take(50))
    {
        try
        {
            using var response = await http.SendAsync(new HttpRequestMessage(HttpMethod.Head, $"{publicDomain}/{proof.Proof}"));
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound) missing.Add(proof.RefundId);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException) { missing.Add(proof.RefundId); }
    }
    if (missing.Count == 0)
        Console.WriteLine("[OK]   Transfer proof objects still exist in the R2 bucket");
    else
    {
        failures++;
        Console.WriteLine($"[FAIL] {missing.Count} transfer proof objects missing on R2 (refund ids: {string.Join(", ", missing.Take(20))})");
    }
}

// 5) Optional: confirm the public URLs the API now returns actually resolve on R2.
if (!string.IsNullOrEmpty(publicDomain) && keys.Count > 0)
{
    using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
    var broken = new List<long>();
    foreach (var (userId, key) in keys.Take(50))
    {
        try
        {
            using var response = await http.SendAsync(new HttpRequestMessage(HttpMethod.Head, $"{publicDomain}/{key}"));
            if (!response.IsSuccessStatusCode) broken.Add(userId);
        }
        catch (HttpRequestException) { broken.Add(userId); }
        catch (TaskCanceledException) { broken.Add(userId); }
    }
    if (broken.Count == 0)
        Console.WriteLine($"[OK]   {Math.Min(keys.Count, 50)} avatar URLs resolve on {publicDomain}");
    else
    {
        failures++;
        Console.WriteLine($"[FAIL] {broken.Count} avatar objects unreachable on R2 (user ids: {string.Join(", ", broken.Take(20))})");
    }
}
else if (string.IsNullOrEmpty(publicDomain))
{
    Console.WriteLine("[SKIP] Set SCMS_AUDIT_R2_PUBLIC_DOMAIN to HEAD-check avatar URLs on R2.");
}

Console.WriteLine(failures == 0 ? "Avatar audit passed." : $"Avatar audit found {failures} problem(s).");
return failures == 0 ? 0 : 1;
