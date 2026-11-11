namespace SportsCenterManagement.API.Services;

public interface IR2StorageService : SportsCenterManagement.BLL.Interfaces.IObjectStorageClient
{
    Task<(string ContentType, long Size)> GetMetadataAsync(string key, CancellationToken cancellationToken = default);
    Task<string> UploadImageAsync(IFormFile file, string folder, long maxFileSize, CancellationToken cancellationToken = default);
    Task<string> UploadRefundBillAsync(IFormFile file, CancellationToken cancellationToken = default);
    /// <summary>Caller must first authorize the actor for the member (same center, counter staff).</summary>
    Task<string> UploadMemberAvatarAsync(IFormFile file, long memberUserId, long maxFileSize, CancellationToken cancellationToken = default);
    Task DeleteMemberAvatarAsync(string key, long memberUserId, CancellationToken cancellationToken = default);
    Task<string> UploadMediaAsync(IFormFile file, CancellationToken cancellationToken = default);
    string GetPresignedUrl(string key, TimeSpan expiresIn);
}

