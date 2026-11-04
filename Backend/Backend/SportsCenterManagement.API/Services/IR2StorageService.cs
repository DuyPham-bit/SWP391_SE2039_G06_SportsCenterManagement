namespace SportsCenterManagement.API.Services;

public interface IR2StorageService
{
    Task<(string ContentType, long Size)> GetMetadataAsync(string key, CancellationToken cancellationToken = default);
    Task<string> UploadImageAsync(IFormFile file, string folder, long maxFileSize, CancellationToken cancellationToken = default);
    Task<string> UploadRefundBillAsync(IFormFile file, CancellationToken cancellationToken = default);
    Task DeleteAsync(string key, CancellationToken cancellationToken = default);
}
