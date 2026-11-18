using SportsCenterManagement.DAL.Context;

namespace SportsCenterManagement.API.HealthChecks;

public sealed class DatabaseHealthCheck(SportsCenterDbContext db) : Microsoft.Extensions.Diagnostics.HealthChecks.IHealthCheck
{
    public async Task<Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult> CheckHealthAsync(
        Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var canConnect = await db.Database.CanConnectAsync(cancellationToken);
            return canConnect
                ? Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy("Database connection is healthy.")
                : Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Unhealthy("Database connection failed.");
        }
        catch (Exception ex)
        {
            return Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Unhealthy("Database connection threw exception.", ex);
        }
    }
}
