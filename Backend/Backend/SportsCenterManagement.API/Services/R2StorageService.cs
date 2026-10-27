using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;
using SportsCenterManagement.API.Models;
using SportsCenterManagement.BLL.Common;

namespace SportsCenterManagement.API.Services;

public sealed class R2StorageService(
    IAmazonS3 s3Client,
    IOptions<R2StorageOptions> options,
    TimeProvider timeProvider) : IR2StorageService
{
    private const long MaxFileSize = 5 * 1024 * 1024;
    private const string RefundBillPrefix = "refund-bills/";

    private static readonly IReadOnlyDictionary<string, string> AllowedTypes =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".png"] = "image/png",
            [".webp"] = "image/webp"
        };

    private readonly R2StorageOptions _options = options.Value;

    public async Task<string> UploadRefundBillAsync(
        IFormFile file,
        CancellationToken cancellationToken = default) =>
        await UploadImageAsync(file, "refund-bills", MaxFileSize, cancellationToken);

    public async Task<string> UploadImageAsync(
        IFormFile file,
        string folder,
        long maxFileSize,
        CancellationToken cancellationToken = default)
    {
        if (folder is not ("refund-bills" or "dashboard") && !folder.StartsWith("avatars/", StringComparison.Ordinal))
            throw new ArgumentException("R2 image folder is not allowed.", nameof(folder));
        if (file.Length <= 0)
            throw BusinessException.BadRequest("Vui lòng chọn ảnh để tải lên.");
        if (file.Length > maxFileSize)
            throw BusinessException.BadRequest($"Ảnh không được vượt quá {maxFileSize / 1024 / 1024}MB.");

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedTypes.TryGetValue(extension, out var contentType))
            throw BusinessException.BadRequest("Chỉ hỗ trợ ảnh JPG, JPEG, PNG hoặc WEBP.");
        if (!string.Equals(file.ContentType, contentType, StringComparison.OrdinalIgnoreCase))
            throw BusinessException.BadRequest("Content-Type của ảnh không khớp với phần mở rộng.");

        await using var stream = file.OpenReadStream();
        await ValidateSignatureAsync(stream, extension, cancellationToken);

        var now = timeProvider.GetUtcNow();
        var fileName = $"{now:yyyyMMddHHmmssfff}-{Guid.NewGuid():N}{extension}";
        var key = $"{folder}/{now:yyyy/MM}/{fileName}";

        var request = new PutObjectRequest
        {
            BucketName = Required(_options.BucketName, nameof(_options.BucketName)),
            Key = key,
            InputStream = stream,
            ContentType = contentType,
            AutoCloseStream = false,
            DisablePayloadSigning = true
        };
        request.Headers.CacheControl = "public, max-age=31536000, immutable";

        await s3Client.PutObjectAsync(request, cancellationToken);
        return key;
    }

    public async Task DeleteAsync(string key, CancellationToken cancellationToken = default)
    {
        var normalizedKey = (key ?? string.Empty).Trim().Replace('\\', '/').TrimStart('/');
        if (!(normalizedKey.StartsWith(RefundBillPrefix, StringComparison.Ordinal) ||
              normalizedKey.StartsWith("dashboard/", StringComparison.Ordinal) ||
              normalizedKey.StartsWith("avatars/", StringComparison.Ordinal)) ||
            normalizedKey.Contains("../", StringComparison.Ordinal) ||
            normalizedKey.EndsWith("/", StringComparison.Ordinal))
        {
            throw BusinessException.BadRequest("Đường dẫn ảnh hóa đơn R2 không hợp lệ.");
        }

        await s3Client.DeleteObjectAsync(new DeleteObjectRequest
        {
            BucketName = Required(_options.BucketName, nameof(_options.BucketName)),
            Key = normalizedKey
        }, cancellationToken);
    }

    private static async Task ValidateSignatureAsync(
        Stream stream,
        string extension,
        CancellationToken cancellationToken)
    {
        var header = new byte[12];
        var bytesRead = await stream.ReadAtLeastAsync(
            header,
            header.Length,
            throwOnEndOfStream: false,
            cancellationToken);
        stream.Position = 0;

        var valid = extension switch
        {
            ".jpg" or ".jpeg" => bytesRead >= 3 &&
                header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF,
            ".png" => bytesRead >= 8 &&
                header.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }),
            ".webp" => bytesRead >= 12 &&
                header.AsSpan(0, 4).SequenceEqual("RIFF"u8) &&
                header.AsSpan(8, 4).SequenceEqual("WEBP"u8),
            _ => false
        };

        if (!valid)
            throw BusinessException.BadRequest("Nội dung tệp không đúng định dạng ảnh đã khai báo.");
    }

    private static string Required(string value, string propertyName) =>
        !string.IsNullOrWhiteSpace(value)
            ? value
            : throw new InvalidOperationException($"R2Storage:{propertyName} is not configured.");
}
