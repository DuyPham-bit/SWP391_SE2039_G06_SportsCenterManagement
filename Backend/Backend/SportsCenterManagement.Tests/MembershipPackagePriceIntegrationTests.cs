using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SportsCenterManagement.BLL.DTOs.MembershipPackages;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;
using Xunit;

namespace SportsCenterManagement.Tests;

public sealed class MembershipPackagePriceIntegrationTests
{
    [Fact]
    public async Task ManagerPackageListPlacesInactivePackagesAfterSellablePackages()
    {
        using var factory = new BranchApiFactory();
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<SportsCenterDbContext>();
            db.MembershipPackages.AddRange(
                new MembershipPackage
                {
                    CenterId = 1, Name = "Inactive Cheapest", DurationDays = 30,
                    Price = 10m, Status = "Inactive", CreatedAt = DateTime.UtcNow
                },
                new MembershipPackage
                {
                    CenterId = 1, Name = "Active Expensive", DurationDays = 30,
                    Price = 500m, Status = "Active", CreatedAt = DateTime.UtcNow
                },
                new MembershipPackage
                {
                    CenterId = 1, Name = "Inactive Mid", DurationDays = 30,
                    Price = 200m, Status = "Inactive", CreatedAt = DateTime.UtcNow
                });
            await db.SaveChangesAsync();
        }

        using var client = factory.CreateClient();
        await BranchApiFactory.LoginAsync(client, "manager@test.local");

        var packages = await client.GetFromJsonAsync<List<MembershipPackageResponse>>(
            "/api/centers/1/membership-packages/all");

        Assert.NotNull(packages);
        var firstInactiveIndex = packages.FindIndex(package => package.Status == "Inactive");
        Assert.True(firstInactiveIndex >= 0);
        Assert.All(packages.Take(firstInactiveIndex), package => Assert.NotEqual("Inactive", package.Status));
        Assert.All(packages.Skip(firstInactiveIndex), package => Assert.Equal("Inactive", package.Status));
        var relevantNames = new[] { "Monthly", "Active Expensive", "Inactive Cheapest", "Inactive Mid" };
        Assert.Equal(
            relevantNames,
            packages.Where(package => relevantNames.Contains(package.Name)).Select(package => package.Name));
    }

    [Fact]
    public async Task ManagerCanCreateAndUpdatePackageWithPricesOutsideFiftyThousandSteps()
    {
        using var factory = new BranchApiFactory();
        using var client = factory.CreateClient();
        await BranchApiFactory.LoginAsync(client, "manager@test.local");

        using var createdResponse = await client.PostAsJsonAsync("/api/centers/1/membership-packages", new
        {
            name = "Flexible Price Package",
            description = "Arbitrary positive price",
            durationDays = 45,
            price = 75001m,
            maxClasses = (int?)null,
            accessType = (string?)null,
            allowedSports = 2,
            badge = "LINH HOẠT",
            features = Array.Empty<string>()
        });

        Assert.Equal(HttpStatusCode.Created, createdResponse.StatusCode);
        var created = await createdResponse.Content.ReadFromJsonAsync<MembershipPackageResponse>();
        Assert.NotNull(created);
        Assert.Equal(75001m, created.Price);

        using var updatedResponse = await client.PutAsJsonAsync(
            $"/api/centers/1/membership-packages/{created.Id}",
            new
            {
                name = "Flexible Price Package",
                description = "Decimal price is also accepted by the API contract",
                durationDays = 45,
                price = 123456.78m,
                maxClasses = (int?)null,
                accessType = (string?)null,
                allowedSports = 2,
                badge = "LINH HOẠT",
                features = Array.Empty<string>()
            });

        Assert.Equal(HttpStatusCode.OK, updatedResponse.StatusCode);
        var updated = await updatedResponse.Content.ReadFromJsonAsync<MembershipPackageResponse>();
        Assert.NotNull(updated);
        Assert.Equal(123456.78m, updated.Price);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(123.456)]
    [InlineData(10_000_000_000d)]
    public async Task CreateRejectsPriceOutsideSupportedRange(double invalidPrice)
    {
        using var factory = new BranchApiFactory();
        using var client = factory.CreateClient();
        await BranchApiFactory.LoginAsync(client, "manager@test.local");

        using var response = await client.PostAsJsonAsync("/api/centers/1/membership-packages", new
        {
            name = $"Invalid Price {invalidPrice}",
            description = "Must not be stored",
            durationDays = 30,
            price = invalidPrice,
            maxClasses = (int?)null,
            accessType = (string?)null,
            allowedSports = 1,
            badge = (string?)null,
            features = Array.Empty<string>()
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
