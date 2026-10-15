using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SportsCenterManagement.BLL.Common;
using SportsCenterManagement.BLL.DTOs.Payments;
using SportsCenterManagement.BLL.Interfaces;
using SportsCenterManagement.BLL.Services;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Repositories.Implementations;
using Xunit;

namespace SportsCenterManagement.Tests;

public sealed class PayOsLinkCreationTests
{
    [Fact]
    public async Task CreateEndpointReturnsChannelErrorToFrontend()
    {
        using var database = new BranchApiFactory();
        using var application = database.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("PayOS:BaseUrl", "https://payos.test");
            builder.UseSetting("PayOS:ClientId", "test-client");
            builder.UseSetting("PayOS:ApiKey", "test-api");
            builder.UseSetting("PayOS:ChecksumKey", "test-checksum");
            builder.UseSetting("PayOS:ReturnUrl", "https://site.test/payment-result");
            builder.UseSetting("PayOS:CancelUrl", "https://site.test/payment-result?cancel=true");
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IPayOsService>();
                services.AddSingleton(new HttpClient(new ResponseHandler("214")));
                services.AddScoped<IPayOsService>(provider => new PayOsService(
                    provider.GetRequiredService<IConfiguration>(), provider.GetRequiredService<HttpClient>()));
            });
        });
        using var client = application.CreateClient();
        await BranchApiFactory.LoginAsync(client, "member@test.local");
        client.DefaultRequestHeaders.Add("Idempotency-Key", "payos-rejected-channel-api-test");

        using var response = await client.PostAsJsonAsync("/api/payments/create-payos-url", new { packageId = 1 });

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("PAYOS_CHANNEL_UNAVAILABLE", document.RootElement.GetProperty("code").GetString());
        Assert.Contains("tạm dừng", document.RootElement.GetProperty("message").GetString());
        using var scope = application.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SportsCenterDbContext>();
        Assert.Equal("Failed", (await db.Payments.SingleAsync()).PaymentStatus);
    }

    [Fact]
    public async Task PausedChannelReturnsActionableErrorAndFailsOnlyTheRejectedAttempt()
    {
        await using var fixture = new LinkFixture("214");

        var error = await Assert.ThrowsAsync<BusinessException>(() => fixture.Service.CreatePayOsPaymentUrlAsync(
            1, new CreatePaymentRequest { PackageId = 1 }, "payos-channel-rejected-214"));

        Assert.Equal(HttpStatusCode.ServiceUnavailable, error.StatusCode);
        Assert.Equal("PAYOS_CHANNEL_UNAVAILABLE", error.Code);
        Assert.Contains("tạm dừng", error.Message);
        Assert.Equal("Failed", (await fixture.Db.Payments.SingleAsync()).PaymentStatus);
        Assert.Equal("Issued", (await fixture.Db.Invoices.SingleAsync()).Status);
        Assert.Null((await fixture.Db.Invoices.SingleAsync()).PaidAt);
        Assert.Equal(1, await fixture.Db.MemberSubscriptions.CountAsync(item => item.Status == "PendingPayment"));
        Assert.Empty(await fixture.Db.Notifications.ToListAsync());
    }

    [Theory]
    [InlineData("205")]
    [InlineData("00")]
    [InlineData(null)]
    public async Task UncertainResponseStillRequiresReconciliation(string? providerCode)
    {
        await using var fixture = new LinkFixture(providerCode);

        var error = await Assert.ThrowsAsync<BusinessException>(() => fixture.Service.CreatePayOsPaymentUrlAsync(
            1, new CreatePaymentRequest { PackageId = 1 }, "payos-uncertain-result-test"));

        Assert.Equal(HttpStatusCode.ServiceUnavailable, error.StatusCode);
        Assert.Null(error.Code);
        Assert.Contains("giữ Pending", error.Message);
        Assert.Equal("Pending", (await fixture.Db.Payments.SingleAsync()).PaymentStatus);
        Assert.Equal("Issued", (await fixture.Db.Invoices.SingleAsync()).Status);
    }

    private sealed class LinkFixture : IAsyncDisposable
    {
        private readonly SqliteConnection connection = new("Data Source=:memory:");
        private readonly UnitOfWork unitOfWork;
        private readonly HttpClient client;
        public SportsCenterDbContext Db { get; }
        public PaymentService Service { get; }

        public LinkFixture(string? providerCode)
        {
            connection.Open();
            Db = new SportsCenterDbContext(new DbContextOptionsBuilder<SportsCenterDbContext>()
                .UseSqlite(connection).ReplaceService<IModelCustomizer, BranchSqliteModelCustomizer>().Options);
            Db.Database.EnsureCreated();
            BranchTestData.Seed(Db);
            unitOfWork = new UnitOfWork(Db);
            client = new HttpClient(new ResponseHandler(providerCode));
            var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["PayOS:BaseUrl"] = "https://payos.test", ["PayOS:ClientId"] = "test-client",
                ["PayOS:ApiKey"] = "test-api", ["PayOS:ChecksumKey"] = "test-checksum",
                ["PayOS:ReturnUrl"] = "https://site.test/payment-result",
                ["PayOS:CancelUrl"] = "https://site.test/payment-result?cancel=true"
            }).Build();
            Service = new PaymentService(unitOfWork, new PaymentTestVnPay(), new PaymentTestMomo(),
                new PayOsService(configuration, client), configuration);
        }

        public async ValueTask DisposeAsync()
        {
            client.Dispose();
            await unitOfWork.DisposeAsync();
            await connection.DisposeAsync();
        }
    }

    private sealed class ResponseHandler(string? providerCode) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            if (providerCode is null)
                throw new HttpRequestException("Simulated lost provider response.");
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent($$"""{"code":"{{providerCode}}","desc":"Cổng thanh toán không tồn tại hoặc đã tạm dừng, vui lòng chọn cổng khác","data":null}""",
                    Encoding.UTF8, "application/json")
            });
        }
    }
}
