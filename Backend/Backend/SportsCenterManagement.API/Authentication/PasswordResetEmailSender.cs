using System.Net.Http.Headers;
using System.Net;
using System.Net.Mail;
using Microsoft.EntityFrameworkCore;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;

using Microsoft.Extensions.Logging;

namespace SportsCenterManagement.API.Authentication;

public sealed class PasswordResetEmailSender(
    SportsCenterDbContext db, IHttpClientFactory clients, IConfiguration configuration,
    ILogger<PasswordResetEmailSender>? logger = null)
{
    private Uri? Endpoint => Uri.TryCreate(configuration["ExternalCommunications:Email:WebhookUrl"], UriKind.Absolute, out var uri)
        && (uri.Scheme == Uri.UriSchemeHttps || (uri.Scheme == Uri.UriSchemeHttp && uri.IsLoopback)) ? uri : null;

    private string? SmtpHost => string.IsNullOrWhiteSpace(configuration["ExternalCommunications:Email:Smtp:Host"])
        ? configuration["MailSettings:Host"]
        : configuration["ExternalCommunications:Email:Smtp:Host"];
    private string? SmtpFrom => string.IsNullOrWhiteSpace(configuration["ExternalCommunications:Email:Smtp:From"])
        ? configuration["MailSettings:Mail"]
        : configuration["ExternalCommunications:Email:Smtp:From"];
    private bool SmtpConfigured => !string.IsNullOrWhiteSpace(SmtpHost) && MailAddress.TryCreate(SmtpFrom, out _);
    public bool IsConfigured => Endpoint is not null || SmtpConfigured;

    public async Task<bool> SendAsync(User recipient, PasswordResetToken reset, string otp, CancellationToken ct)
    {
        if (!IsConfigured) return false;
        // OTPs never enter the notification inbox, database payloads, or provider response logs.
        var delivery = new CommunicationDelivery
        {
            RecipientUserId = recipient.Id, Channel = "Email", Status = "Sending", CreatedAt = DateTime.UtcNow
        };
        db.CommunicationDeliveries.Add(delivery);
        await db.SaveChangesAsync(ct);
        var title = "Mã đặt lại mật khẩu SCMS";
        var message = $"Mã xác thực đặt lại mật khẩu của bạn: {otp}. Mã hết hạn sau 10 phút. Không chia sẻ mã này với người khác.";
        var result = await SendCodeAsync(recipient.Email, title, message, $"password-reset-{reset.Id}", new
        {
            deliveryId = delivery.Id, channel = "Email", recipientUserId = recipient.Id, to = recipient.Email,
            title, message,
            notificationType = "PasswordReset", createdAt = reset.CreatedAt, expiresAt = reset.ExpiresAt
        }, ct);
        delivery.Status = result.Success ? "Sent" : "Failed";
        delivery.SentAt = result.Success ? DateTime.UtcNow : null;
        delivery.ProviderMessage = result.Status;
        if (!result.Success)
        {
            await db.PasswordResetTokens.Where(t => t.Id == reset.Id && t.UsedAt == null)
                .ExecuteUpdateAsync(s => s.SetProperty(t => t.UsedAt, DateTime.UtcNow), CancellationToken.None);
        }
        await db.SaveChangesAsync(CancellationToken.None);
        return result.Success;
    }

    public async Task<bool> SendVerificationAsync(EmailVerificationToken verification, string otp, CancellationToken ct)
    {
        var title = "Xác thực email đăng ký SCMS";
        var message = $"Mã xác thực đăng ký tài khoản của bạn: {otp}. Mã hết hạn sau 10 phút. Không chia sẻ mã này với người khác.";
        var result = await SendCodeAsync(verification.Email, title, message, $"email-verification-{verification.Id}", new
        {
            channel = "Email", to = verification.Email, title, message,
            notificationType = "EmailVerification", createdAt = verification.CreatedAt, expiresAt = verification.ExpiresAt
        }, ct);
        if (!result.Success)
            await db.EmailVerificationTokens.Where(t => t.Id == verification.Id && t.UsedAt == null)
                .ExecuteUpdateAsync(s => s.SetProperty(t => t.UsedAt, DateTime.UtcNow), CancellationToken.None);
        return result.Success;
    }

    private async Task<(bool Success, string Status)> SendCodeAsync(
        string email, string title, string message, string key, object payload, CancellationToken ct)
    {
        try
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeout.CancelAfter(TimeSpan.FromSeconds(15));
            if (Endpoint is not { } endpoint)
            {
                if (!SmtpConfigured) return (false, "Email sender unavailable.");
                var port = configuration.GetValue("ExternalCommunications:Email:Smtp:Port", 0);
                if (port <= 0) port = configuration.GetValue("MailSettings:Port", 587);
                var enableSsl = configuration.GetValue("ExternalCommunications:Email:Smtp:EnableSsl", true);
                if (!enableSsl && !string.Equals(SmtpHost, "localhost", StringComparison.OrdinalIgnoreCase)
                    && !(IPAddress.TryParse(SmtpHost, out var address) && IPAddress.IsLoopback(address)))
                    return (false, "SMTP requires TLS.");
                var username = configuration["ExternalCommunications:Email:Smtp:Username"];
                if (string.IsNullOrWhiteSpace(username)) username = configuration["MailSettings:Mail"];
                var password = configuration["ExternalCommunications:Email:Smtp:Password"];
                if (string.IsNullOrWhiteSpace(password)) password = configuration["MailSettings:Password"];

                using var client = new MailKit.Net.Smtp.SmtpClient();
                var secureOption = enableSsl
                    ? MailKit.Security.SecureSocketOptions.StartTls
                    : MailKit.Security.SecureSocketOptions.Auto;
                await client.ConnectAsync(SmtpHost, port, secureOption, timeout.Token);
                if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
                {
                    await client.AuthenticateAsync(username, password, timeout.Token);
                }
                var mime = new MimeKit.MimeMessage();
                mime.From.Add(MimeKit.MailboxAddress.Parse(SmtpFrom!));
                mime.To.Add(MimeKit.MailboxAddress.Parse(email));
                mime.Subject = title;
                var builder = new MimeKit.BodyBuilder { TextBody = message };
                mime.Body = builder.ToMessageBody();
                await client.SendAsync(mime, timeout.Token);
                await client.DisconnectAsync(true, timeout.Token);
                return (true, "SMTP accepted");
            }
            using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
            var bearer = configuration["ExternalCommunications:Email:BearerToken"];
            if (string.IsNullOrWhiteSpace(bearer)) bearer = configuration["ExternalCommunications:BearerToken"];
            if (!string.IsNullOrWhiteSpace(bearer)) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearer);
            request.Headers.Add("Idempotency-Key", key);
            request.Content = JsonContent.Create(payload);
            using var response = await clients.CreateClient(nameof(PasswordResetEmailSender)).SendAsync(request, timeout.Token);
            return (response.IsSuccessStatusCode, $"HTTP {(int)response.StatusCode}");
        }
        catch (Exception exception)
        {
            logger?.LogWarning("Email delivery failed for {Email}: {Error}", email, exception.Message);
            // Provider errors can contain credentials, email content or OTPs. Keep only a safe status.
            return (false, "Email gateway unavailable.");
        }
    }
}
