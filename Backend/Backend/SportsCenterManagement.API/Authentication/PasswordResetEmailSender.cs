using System.Net.Http.Headers;
using Microsoft.EntityFrameworkCore;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;

namespace SportsCenterManagement.API.Authentication;

public sealed class PasswordResetEmailSender(
    SportsCenterDbContext db, IHttpClientFactory clients, IConfiguration configuration)
{
    private Uri? Endpoint => Uri.TryCreate(configuration["ExternalCommunications:Email:WebhookUrl"], UriKind.Absolute, out var uri)
        && (uri.Scheme == Uri.UriSchemeHttps || (uri.Scheme == Uri.UriSchemeHttp && uri.IsLoopback)) ? uri : null;

    public bool IsConfigured => Endpoint is not null;

    public async Task<bool> SendAsync(User recipient, PasswordResetToken reset, string otp, CancellationToken ct)
    {
        var endpoint = Endpoint;
        if (endpoint is null) return false;
        // OTPs never enter the notification inbox, database payloads, or provider response logs.
        var delivery = new CommunicationDelivery
        {
            RecipientUserId = recipient.Id, Channel = "Email", Status = "Sending", CreatedAt = DateTime.UtcNow
        };
        db.CommunicationDeliveries.Add(delivery);
        await db.SaveChangesAsync(ct);
        using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
        var bearer = configuration["ExternalCommunications:Email:BearerToken"];
        if (string.IsNullOrWhiteSpace(bearer)) bearer = configuration["ExternalCommunications:BearerToken"];
        if (!string.IsNullOrWhiteSpace(bearer)) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearer);
        request.Headers.Add("Idempotency-Key", $"password-reset-{reset.Id}");
        request.Content = JsonContent.Create(new
        {
            deliveryId = delivery.Id, channel = "Email", recipientUserId = recipient.Id, to = recipient.Email,
            title = "Mã đặt lại mật khẩu", message = $"Mã xác thực của bạn: {otp}. Mã hết hạn sau 10 phút.",
            notificationType = "PasswordReset", createdAt = reset.CreatedAt, expiresAt = reset.ExpiresAt
        });
        try
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeout.CancelAfter(TimeSpan.FromSeconds(15));
            using var response = await clients.CreateClient(nameof(PasswordResetEmailSender)).SendAsync(request, timeout.Token);
            delivery.Status = response.IsSuccessStatusCode ? "Sent" : "Failed";
            delivery.SentAt = response.IsSuccessStatusCode ? DateTime.UtcNow : null;
            delivery.ProviderMessage = $"HTTP {(int)response.StatusCode}";
        }
        catch (Exception exception) when (exception is HttpRequestException or OperationCanceledException)
        {
            delivery.Status = "Failed";
            delivery.ProviderMessage = "Email gateway unavailable.";
        }
        if (delivery.Status != "Sent")
        {
            await db.PasswordResetTokens.Where(t => t.Id == reset.Id && t.UsedAt == null)
                .ExecuteUpdateAsync(s => s.SetProperty(t => t.UsedAt, DateTime.UtcNow), CancellationToken.None);
        }
        await db.SaveChangesAsync(CancellationToken.None);
        return delivery.Status == "Sent";
    }
}
