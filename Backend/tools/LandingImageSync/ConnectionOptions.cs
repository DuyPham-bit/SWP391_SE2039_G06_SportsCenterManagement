using Npgsql;

namespace LandingImageSync;

public static class ConnectionOptions
{
    public static NpgsqlConnectionStringBuilder Parse(string value)
    {
        NpgsqlConnectionStringBuilder result;
        if (value.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) || value.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        {
            var uri = new Uri(value);
            var user = uri.UserInfo.Split(':', 2);
            if (user.Length != 2 || uri.AbsolutePath.Length < 2) throw new SyncException("Invalid PostgreSQL URL.");
            result = new()
            {
                Host = uri.Host, Port = uri.IsDefaultPort ? 5432 : uri.Port,
                Username = Uri.UnescapeDataString(user[0]), Password = Uri.UnescapeDataString(user[1]),
                Database = Uri.UnescapeDataString(uri.AbsolutePath[1..]), SslMode = SslMode.Require
            };
            // Render external URLs use TLS. Do not accept URL options that could disable it.
            if (uri.Query.Length > 0 && uri.Query != "?sslmode=require" && uri.Query != "?sslmode=verify-full")
                throw new SyncException("Unsupported URL options; use Render's unmodified external connection URL.");
            if (uri.Query == "?sslmode=verify-full") result.SslMode = SslMode.VerifyFull;
        }
        else result = new(value);
        result.Timeout = 20;
        result.CommandTimeout = 30;
        result.IncludeErrorDetail = false;
        return result;
    }

    public static string Identity(NpgsqlConnectionStringBuilder c) => ImageSyncPlanner.Hash($"{c.Host?.ToLowerInvariant()}:{c.Port}/{c.Database}");
}
