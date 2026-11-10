namespace SportsCenterManagement.API.Services;

public interface IR2StorageService : SportsCenterManagement.BLL.Interfaces.IObjectStorageClient
{
    Task<(string ContentType, long Size)> GetMetadataAsync(string key, CancellationToken cancellationToken = default);
    Task<string> UploadImageAsync(IFormFile file, string folder, long maxFileSize, CancellationToken cancellationToken = default);
    Task<string> UploadRefundBillAsync(IFormFile file, CancellationToken cancellationToken = default);
    Task<string> UploadMediaAsync(IFormFile file, CancellationToken cancellationToken = default);
    string GetPresignedUrl(string key, TimeSpan expiresIn);
}

