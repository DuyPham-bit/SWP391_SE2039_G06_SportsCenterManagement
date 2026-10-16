using System.Text;
using System.Buffers.Binary;
using SportsCenterManagement.BLL.Exceptions;

namespace SportsCenterManagement.BLL.Services;

public static class ImageUploadValidator
{
    public const long MaxFileSize = 15 * 1024 * 1024;

    public static string? GetMimeTypeForFileName(string name) => Path.GetExtension(name).ToLowerInvariant() switch
    {
        ".png" => "image/png", ".jpg" or ".jpeg" => "image/jpeg", ".gif" => "image/gif",
        ".webp" => "image/webp", ".avif" => "image/avif", _ => null
    };

    public static bool IsSupportedFileName(string name) => GetMimeTypeForFileName(name) is not null;

    public static async Task<(string FileName, string MimeType)> ValidateAsync(Stream stream, string fileName, string mimeType, CancellationToken ct)
    {
        if (!stream.CanSeek || stream.Length == 0 || stream.Length > MaxFileSize)
            throw new FlowException(400, "Ảnh phải có dung lượng từ 1 byte đến 15MB.");

        var header = new byte[(int)Math.Min(stream.Length, 4096)];
        stream.Position = 0;
        var count = await stream.ReadAtLeastAsync(header, header.Length, throwOnEndOfStream: false, cancellationToken: ct);
        stream.Position = 0;

        string? detected = null;
        if (count >= 8 && header.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 })) detected = "image/png";
        else if (count >= 3 && header[0] == 255 && header[1] == 216 && header[2] == 255) detected = "image/jpeg";
        else if (count >= 6 && Encoding.ASCII.GetString(header, 0, 6) is "GIF87a" or "GIF89a") detected = "image/gif";
        else if (count >= 12 && Encoding.ASCII.GetString(header, 0, 4) == "RIFF" && Encoding.ASCII.GetString(header, 8, 4) == "WEBP") detected = "image/webp";
        else if (HasAvifFileType(header.AsSpan(0, count), stream.Length)) detected = "image/avif";

        var expected = GetMimeTypeForFileName(fileName);
        if (detected is null || detected != expected || !string.Equals(detected, mimeType, StringComparison.OrdinalIgnoreCase))
            throw new FlowException(400, "Chỉ hỗ trợ ảnh PNG, JPG/JPEG, GIF, WEBP, AVIF đúng định dạng. Không hỗ trợ SVG hoặc tệp giả mạo hình ảnh.");

        var safeName = Path.GetFileName(fileName.Replace('\\', '/'));
        if (safeName.Length > 500) throw new FlowException(400, "Tên tệp ảnh quá dài (tối đa 500 ký tự).");
        return (safeName, detected);
    }

    // AVIF uses ISO-BMFF: check a bounded, complete FileTypeBox, not an arbitrary substring.
    private static bool HasAvifFileType(ReadOnlySpan<byte> header, long fileLength)
    {
        var offset = 0;
        while (offset <= header.Length - 8)
        {
            ulong size = BinaryPrimitives.ReadUInt32BigEndian(header.Slice(offset, 4));
            var boxHeaderSize = 8;
            if (size == 1)
            {
                if (offset > header.Length - 16) return false;
                size = BinaryPrimitives.ReadUInt64BigEndian(header.Slice(offset + 8, 8));
                boxHeaderSize = 16;
            }
            else if (size == 0) size = (ulong)(fileLength - offset);
            if (size < (ulong)boxHeaderSize || size > (ulong)(fileLength - offset) || size > (ulong)(header.Length - offset)) return false;

            if (header.Slice(offset + 4, 4).SequenceEqual("ftyp"u8))
            {
                var contentStart = offset + boxHeaderSize;
                var end = offset + (int)size;
                if (end - contentStart < 8 || (end - contentStart) % 4 != 0) return false;
                if (IsAvifBrand(header.Slice(contentStart, 4))) return true;
                for (var brandOffset = contentStart + 8; brandOffset <= end - 4; brandOffset += 4)
                    if (IsAvifBrand(header.Slice(brandOffset, 4))) return true;
                return false;
            }
            offset += (int)size;
        }
        return false;
    }

    private static bool IsAvifBrand(ReadOnlySpan<byte> brand) => brand.SequenceEqual("avif"u8) || brand.SequenceEqual("avis"u8);
}
