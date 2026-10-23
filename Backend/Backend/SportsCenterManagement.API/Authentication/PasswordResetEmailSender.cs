using System.Net.Http.Headers;
using System.Net;
using System.Net.Mail;
using Microsoft.EntityFrameworkCore;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;

namespace SportsCenterManagement.API.Authentication;

public sealed class PasswordResetEmailSender(
    SportsCenterDbContext db, IHttpClientFactory clients, IConfiguration configuration)
{
    private Uri? Endpoint => Uri.TryCreate(configuration["ExternalCommunications:Email:WebhookUrl"], UriKind.Absolute, out var uri)
        && (uri.Scheme == Uri.UriSchemeHttps || (uri.Scheme == Uri.UriSchemeHttp && uri.IsLoopback)) ? uri : null;

    private string? SmtpHost => configuration["ExternalCommunications:Email:Smtp:Host"];
    private string? SmtpFrom => configuration["ExternalCommunications:Email:Smtp:From"];
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
                using var smtp = new SmtpClient(SmtpHost, configuration.GetValue("ExternalCommunications:Email:Smtp:Port", 587));
                // Require STARTTLS for mailbox credentials; loopback-only fixtures may opt out.
                smtp.EnableSsl = configuration.GetValue("ExternalCommunications:Email:Smtp:EnableSsl", true);
                if (!smtp.EnableSsl && !string.Equals(SmtpHost, "localhost", StringComparison.OrdinalIgnoreCase)
                    && !(IPAddress.TryParse(SmtpHost, out var address) && IPAddress.IsLoopback(address)))
                    return (false, "SMTP requires TLS.");
                smtp.UseDefaultCredentials = false;
                var username = configuration["ExternalCommunications:Email:Smtp:Username"];
                if (!string.IsNullOrWhiteSpace(username))
                    smtp.Credentials = new NetworkCredential(username, configuration["ExternalCommunications:Email:Smtp:Password"]);
                using var mail = new MailMessage(SmtpFrom!, email, title, message);
                await smtp.SendMailAsync(mail, timeout.Token);
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
        catch (Exception exception) when (exception is HttpRequestException or OperationCanceledException or SmtpException or FormatException or ArgumentException)
        {
            // Provider errors can contain credentials, email content or OTPs. Keep only a safe status.
            return (false, "Email gateway unavailable.");
        }
    }
}
