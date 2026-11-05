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

    public async Task<bool> SendAsync(
        User recipient,
        PasswordResetToken reset,
        string otp,
        CancellationToken ct,
        string actionEn = "reset password",
        string actionVi = "đặt lại mật khẩu tài khoản")
    {
        if (!IsConfigured) return false;
        // OTPs never enter the notification inbox, database payloads, or provider response logs.
        var delivery = new CommunicationDelivery
        {
            RecipientUserId = recipient.Id, Channel = "Email", Status = "Sending", CreatedAt = DateTime.UtcNow
        };
        db.CommunicationDeliveries.Add(delivery);
        await db.SaveChangesAsync(ct);
        var title = $"Your SCMS security code: {otp}";
        var message = $"We received a request from Ho Chi Minh City, Vietnam to confirm the following action on your SCMS account: {actionEn}. Use this code:\n\n{otp}\n\nThis code expires in 10 minutes. If you did not request it, you can safely ignore this email.";
        var html = BuildOtpEmailHtml(
            recipient.Email,
            actionEn,
            actionVi,
            otp,
            10);
        var result = await SendCodeAsync(recipient.Email, title, message, html, $"password-reset-{reset.Id}", new
        {
            deliveryId = delivery.Id, channel = "Email", recipientUserId = recipient.Id, to = recipient.Email,
            title, message, html,
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
        var title = $"Your SCMS security code: {otp}";
        var message = $"We received a request from Ho Chi Minh City, Vietnam to confirm the following action on your SCMS account: confirm account registration. Use this code:\n\n{otp}\n\nThis code expires in 10 minutes. If you did not request it, you can safely ignore this email.";
        var html = BuildOtpEmailHtml(
            verification.Email,
            "confirm account registration",
            "kích hoạt đăng ký tài khoản",
            otp,
            10);
        var result = await SendCodeAsync(verification.Email, title, message, html, $"email-verification-{verification.Id}", new
        {
            channel = "Email", to = verification.Email, title, message, html,
            notificationType = "EmailVerification", createdAt = verification.CreatedAt, expiresAt = verification.ExpiresAt
        }, ct);
        if (!result.Success)
            await db.EmailVerificationTokens.Where(t => t.Id == verification.Id && t.UsedAt == null)
                .ExecuteUpdateAsync(s => s.SetProperty(t => t.UsedAt, DateTime.UtcNow), CancellationToken.None);
        return result.Success;
    }

    private async Task<(bool Success, string Status)> SendCodeAsync(
        string email, string title, string message, string htmlMessage, string key, object payload, CancellationToken ct)
    {
        try
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeout.CancelAfter(TimeSpan.FromSeconds(15));
            if (Endpoint is not { } endpoint)
            {
                var smtpHost = SmtpHost;
                var smtpFrom = SmtpFrom;
                if (string.IsNullOrWhiteSpace(smtpHost) || !MailAddress.TryCreate(smtpFrom, out _))
                    return (false, "Email sender unavailable.");
                var port = configuration.GetValue("ExternalCommunications:Email:Smtp:Port", 0);
                if (port <= 0) port = configuration.GetValue("MailSettings:Port", 587);
                var enableSsl = configuration.GetValue("ExternalCommunications:Email:Smtp:EnableSsl", true);
                if (!enableSsl && !string.Equals(smtpHost, "localhost", StringComparison.OrdinalIgnoreCase)
                    && !(IPAddress.TryParse(smtpHost, out var address) && IPAddress.IsLoopback(address)))
                    return (false, "SMTP requires TLS.");
                var username = configuration["ExternalCommunications:Email:Smtp:Username"];
                if (string.IsNullOrWhiteSpace(username)) username = configuration["MailSettings:Mail"];
                var password = configuration["ExternalCommunications:Email:Smtp:Password"];
                if (string.IsNullOrWhiteSpace(password)) password = configuration["MailSettings:Password"];

                using var client = new MailKit.Net.Smtp.SmtpClient();
                var secureOption = enableSsl
                    ? MailKit.Security.SecureSocketOptions.StartTls
                    : MailKit.Security.SecureSocketOptions.Auto;
                await client.ConnectAsync(smtpHost, port, secureOption, timeout.Token);
                if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
                {
                    await client.AuthenticateAsync(username, password, timeout.Token);
                }
                var mime = new MimeKit.MimeMessage();
                var displayName = configuration["MailSettings:DisplayName"];
                if (string.IsNullOrWhiteSpace(displayName)) displayName = configuration["ExternalCommunications:Email:Smtp:DisplayName"];
                if (string.IsNullOrWhiteSpace(displayName)) displayName = "SCMS - Trung Tâm Thể Thao";
                mime.From.Add(new MimeKit.MailboxAddress(displayName, smtpFrom));
                mime.To.Add(MimeKit.MailboxAddress.Parse(email));
                mime.Subject = title;
                var builder = new MimeKit.BodyBuilder
                {
                    TextBody = message,
                    HtmlBody = htmlMessage
                };
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

    private static string BuildOtpEmailHtml(
        string recipientEmail,
        string actionEn,
        string actionVi,
        string otp,
        int expiryMinutes = 10)
    {
        var digitCells = string.Concat(otp.Select(c => $@"
                      <td align=""center"" valign=""middle"" style=""width: 44px; height: 50px; background-color: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 10px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 24px; font-weight: 800; color: #0f172a; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.05);"">
                        {c}
                      </td>
                      <td style=""width: 8px;""></td>"));

        return $@"<!DOCTYPE html>
<html lang=""vi"">
<head>
  <meta charset=""UTF-8"">
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
  <title>Your SCMS security code: {otp}</title>
  <script type=""application/ld+json"">
  {{
    ""@context"": ""http://schema.org"",
    ""@type"": ""EmailMessage"",
    ""description"": ""Your SCMS security code: {otp}""
  }}
  </script>
</head>
<body style=""margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;"">
  <table role=""presentation"" width=""100%"" border=""0"" cellspacing=""0"" cellpadding=""0"" style=""background-color: #f8fafc; padding: 40px 16px;"">
    <tr>
      <td align=""center"">
        <table role=""presentation"" width=""100%"" border=""0"" cellspacing=""0"" cellpadding=""0"" style=""max-width: 540px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;"">
          <!-- Top Accent Bar -->
          <tr>
            <td style=""height: 4px; background: linear-gradient(90deg, #1B4332 0%, #2D6A4F 50%, #81B29A 100%);""></td>
          </tr>
          <!-- Header -->
          <tr>
            <td style=""padding: 32px 36px 16px 36px;"">
              <div style=""display: inline-block; font-size: 16px; font-weight: 800; color: #1B4332; letter-spacing: 0.5px;"">
                OLYMPIC SPORTS ARENA <span style=""font-size: 13px; font-weight: 600; color: #81B29A;"">• SCMS</span>
              </div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style=""padding: 0 36px 36px 36px;"">
              <p style=""margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #1f2937;"">
                We received a request from <strong>Ho Chi Minh City, Vietnam</strong> to confirm the following action on your SCMS account: <strong>{actionEn}</strong>. Use this code:
              </p>
              <p style=""margin: 0 0 24px 0; font-size: 13px; line-height: 20px; color: #6b7280;"">
                (Chúng tôi đã nhận được yêu cầu từ <strong>TP. Hồ Chí Minh, Việt Nam</strong> để xác nhận hành động trên tài khoản SCMS của bạn: <strong>{actionVi}</strong>. Sử dụng mã này:)
              </p>

              <!-- Stylized 6-Digit Cards (Matching Gmail's Summary Box Card [ 7 ] [ 4 ] [ 8 ] [ 6 ] [ 1 ] [ 9 ]) -->
              <table role=""presentation"" border=""0"" cellspacing=""0"" cellpadding=""0"" style=""margin: 0 0 20px 0;"">
                <tr>
                  {digitCells}
                </tr>
              </table>

              <!-- Large Bold Fallback Code (Plain code for native email copy parsers) -->
              <div style=""font-family: ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #000000; line-height: 1; margin: 0 0 24px 0;"">
                {otp}
              </div>

              <p style=""margin: 0 0 8px 0; font-size: 14px; line-height: 22px; color: #374151;"">
                This code expires in <strong>{expiryMinutes} minutes</strong>. If you did not request it, you can safely ignore this email.
              </p>
              <p style=""margin: 0 0 28px 0; font-size: 13px; line-height: 20px; color: #9ca3af;"">
                (Mã này sẽ hết hạn sau <strong>{expiryMinutes} phút</strong>. Nếu bạn không yêu cầu mã này, bạn có thể yên tâm bỏ qua email này.)
              </p>

              <hr style=""border: none; border-top: 1px solid #f1f5f9; margin: 24px 0 20px 0;"" />

              <p style=""margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8;"">
                Olympic Sports Arena • SCMS Security System<br />
                Lô E2a-7, Đường D1, Khu Công nghệ cao, TP. Thủ Đức, TP. Hồ Chí Minh<br />
                Email tự động, vui lòng không phản hồi trực tiếp.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>";
    }
}
