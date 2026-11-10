using LandingImageSync;

try
{
    await SyncCommand.RunAsync(args);
    return 0;
}
catch (Exception ex)
{
    // Never print provider messages or connection strings: these can contain credentials.
    Console.Error.WriteLine(ex is SyncException ? ex.Message : ex is Npgsql.PostgresException pg
        ? $"PostgreSQL rejected the operation (SQLSTATE {pg.SqlState}; table={pg.TableName}; column={pg.ColumnName}; position={pg.Position}). No credentials are logged."
        : $"Sync failed ({ex.GetType().Name}). No credentials are logged.");
    return 1;
}
