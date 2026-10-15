using Google.Apis.Auth.OAuth2;
using Google.Apis.Drive.v3;
using Google.Apis.Services;
using Google.Apis.Upload;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SportsCenterManagement.BLL.DTOs.Media;
using SportsCenterManagement.BLL.Exceptions;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;

namespace SportsCenterManagement.BLL.Services;

public class GoogleDriveService
{
    private readonly SportsCenterDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GoogleDriveService> _logger;

    public GoogleDriveService(
        SportsCenterDbContext dbContext,
        IConfiguration configuration,
        ILogger<GoogleDriveService> logger)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _logger = logger;
    }

    public string ResolveCredentialsPath()
    {
        var credentialsPath = _configuration["GoogleDrive:CredentialsPath"] ?? "credentials.json";

        if (File.Exists(credentialsPath))
            return credentialsPath;

        var baseDirCandidate = Path.Combine(AppContext.BaseDirectory, credentialsPath);
        if (File.Exists(baseDirCandidate))
            return baseDirCandidate;

        var currentDirCandidate = Path.Combine(Directory.GetCurrentDirectory(), credentialsPath);
        if (File.Exists(currentDirCandidate))
            return currentDirCandidate;

        var parentCandidate = Path.Combine(Directory.GetCurrentDirectory(), "SportsCenterManagement.API", credentialsPath);
        if (File.Exists(parentCandidate))
            return parentCandidate;

        return credentialsPath;
    }

    private DriveService CreateDriveService()
    {
        var resolvedPath = ResolveCredentialsPath();

        if (!File.Exists(resolvedPath))
        {
            throw new FlowException(500, $"Không tìm thấy tệp credentials.json xác thực Google Drive tại: {resolvedPath}. Vui lòng đặt file credentials.json trong thư mục API.");
        }

        var credential = GoogleCredential.FromFile(resolvedPath)
            .CreateScoped(DriveService.ScopeConstants.Drive);

        return new DriveService(new BaseClientService.Initializer
        {
            HttpClientInitializer = credential,
            ApplicationName = "SCMS-SportsCenterManagement"
        });
    }

    public async Task<UploadMediaResultDto> UploadFileAsync(
        Stream fileStream,
        string fileName,
        string mimeType,
        long? fileSize,
        long? currentUserId = null,
        CancellationToken cancellationToken = default)
    {
        if (fileStream == null || fileStream.Length == 0)
        {
            throw new FlowException(400, "Tệp tải lên không được rỗng.");
        }

        var driveService = CreateDriveService();
        var folderId = _configuration["GoogleDrive:FolderId"];

        var fileMetadata = new Google.Apis.Drive.v3.Data.File
        {
            Name = fileName,
            MimeType = mimeType
        };

        if (!string.IsNullOrWhiteSpace(folderId) && folderId != "YOUR_GOOGLE_DRIVE_FOLDER_ID")
        {
            fileMetadata.Parents = new List<string> { folderId.Trim() };
        }

        var request = driveService.Files.Create(fileMetadata, fileStream, mimeType);
        request.Fields = "id, name, mimeType, size, webViewLink, thumbnailLink";

        var progress = await request.UploadAsync(cancellationToken);
        if (progress.Status != UploadStatus.Completed)
        {
            _logger.LogError(progress.Exception, "Lỗi khi upload file lên Google Drive: {Error}", progress.Exception?.Message);
            throw new FlowException(500, $"Tải file lên Google Drive thất bại: {progress.Exception?.Message}");
        }

        var driveFile = request.ResponseBody;
        var fileId = driveFile.Id;

        // Cấp quyền xem công khai reader/anyone để ảnh có thể hiển thị trực tiếp
        try
        {
            var permission = new Google.Apis.Drive.v3.Data.Permission
            {
                Role = "reader",
                Type = "anyone"
            };
            await driveService.Permissions.Create(permission, fileId).ExecuteAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không thể mở quyền xem công khai cho file {FileId}: {Message}", fileId, ex.Message);
        }

        // Định dạng URL ảnh công khai từ Google Usercontent theo ID
        var publicUrl = $"https://lh3.googleusercontent.com/d/{fileId}";

        // Lưu vào Database thông qua Code-First Entity
        var entity = new UploadedMedia
        {
            DriveFileId = fileId,
            FileName = fileName,
            MimeType = mimeType,
            FileSize = fileSize ?? fileStream.Length,
            FileUrl = publicUrl,
            WebViewLink = driveFile.WebViewLink,
            UploadedByUserId = currentUserId,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.UploadedMedias.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new UploadMediaResultDto(
            entity.Id,
            entity.DriveFileId,
            entity.FileUrl,
            entity.FileName,
            entity.MimeType,
            entity.FileSize,
            entity.CreatedAt,
            driveFile.ThumbnailLink ?? publicUrl
        );
    }

    /// <summary>
    /// Lấy danh sách ảnh trực tiếp từ thư mục Google Drive đã cấu hình, đồng thời đồng bộ vào DB
    /// </summary>
    public async Task<List<UploadMediaResultDto>> GetDriveFolderImagesAsync(CancellationToken cancellationToken = default)
    {
        var results = new List<UploadMediaResultDto>();
        var folderId = _configuration["GoogleDrive:FolderId"]?.Trim();

        try
        {
            var driveService = CreateDriveService();
            var request = driveService.Files.List();
            request.PageSize = 100;
            request.Fields = "files(id, name, mimeType, size, createdTime, webViewLink, thumbnailLink)";

            if (!string.IsNullOrWhiteSpace(folderId) && folderId != "YOUR_GOOGLE_DRIVE_FOLDER_ID")
            {
                request.Q = $"'{folderId}' in parents and trashed = false";
            }
            else
            {
                request.Q = "trashed = false and mimeType contains 'image/'";
            }

            var response = await request.ExecuteAsync(cancellationToken);
            if (response.Files != null && response.Files.Count > 0)
            {
                var imageFiles = response.Files.Where(f =>
                    (f.MimeType != null && f.MimeType.StartsWith("image/")) ||
                    IsImageFile(f.Name)
                ).ToList();

                var existingDbItems = await _dbContext.UploadedMedias.ToListAsync(cancellationToken);
                var existingByFileId = existingDbItems.ToDictionary(x => x.DriveFileId, x => x);
                bool hasNewEntities = false;

                foreach (var file in imageFiles)
                {
                    var publicUrl = $"https://lh3.googleusercontent.com/d/{file.Id}";
                    var thumbUrl = file.ThumbnailLink ?? publicUrl;

                    if (!existingByFileId.TryGetValue(file.Id, out var dbEntity))
                    {
                        dbEntity = new UploadedMedia
                        {
                            DriveFileId = file.Id,
                            FileName = file.Name ?? "drive_image.jpg",
                            MimeType = file.MimeType ?? "image/jpeg",
                            FileSize = file.Size,
                            FileUrl = publicUrl,
                            WebViewLink = file.WebViewLink,
                            CreatedAt = file.CreatedTimeDateTimeOffset?.UtcDateTime ?? DateTime.UtcNow
                        };
                        _dbContext.UploadedMedias.Add(dbEntity);
                        existingByFileId[file.Id] = dbEntity;
                        hasNewEntities = true;
                    }

                    results.Add(new UploadMediaResultDto(
                        dbEntity.Id,
                        file.Id,
                        publicUrl,
                        file.Name ?? "Google Drive Image",
                        file.MimeType ?? "image/jpeg",
                        file.Size,
                        file.CreatedTimeDateTimeOffset?.UtcDateTime ?? DateTime.UtcNow,
                        thumbUrl
                    ));
                }

                if (hasNewEntities)
                {
                    try
                    {
                        await _dbContext.SaveChangesAsync(cancellationToken);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Lỗi khi lưu đồng bộ file từ Google Drive vào DB: {Message}", ex.Message);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy danh sách file từ Google Drive API: {Message}", ex.Message);
        }

        // Lấy thêm từ DB nếu có ảnh chưa nằm trong results
        var dbList = await _dbContext.UploadedMedias
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync(cancellationToken);

        var existingIds = results.Select(r => r.FileId).ToHashSet();
        foreach (var m in dbList)
        {
            if (!existingIds.Contains(m.DriveFileId))
            {
                results.Add(new UploadMediaResultDto(
                    m.Id,
                    m.DriveFileId,
                    m.FileUrl,
                    m.FileName,
                    m.MimeType,
                    m.FileSize,
                    m.CreatedAt,
                    m.FileUrl
                ));
            }
        }

        return results;
    }

    /// <summary>
    /// Kiểm tra trạng thái kết nối Google Drive API và quyền truy cập thư mục
    /// </summary>
    public async Task<GoogleDriveStatusDto> GetStatusAsync(CancellationToken cancellationToken = default)
    {
        var folderId = _configuration["GoogleDrive:FolderId"]?.Trim() ?? "";
        string serviceAccountEmail = "";

        try
        {
            var resolvedPath = ResolveCredentialsPath();
            if (File.Exists(resolvedPath))
            {
                var json = await File.ReadAllTextAsync(resolvedPath, cancellationToken);
                using var doc = System.Text.Json.JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("client_email", out var emailProp))
                {
                    serviceAccountEmail = emailProp.GetString() ?? "";
                }
            }

            var driveService = CreateDriveService();
            var request = driveService.Files.List();
            request.PageSize = 100;
            request.Fields = "files(id, name, mimeType)";
            if (!string.IsNullOrWhiteSpace(folderId) && folderId != "YOUR_GOOGLE_DRIVE_FOLDER_ID")
            {
                request.Q = $"'{folderId}' in parents and trashed = false";
            }
            else
            {
                request.Q = "trashed = false and mimeType contains 'image/'";
            }

            var res = await request.ExecuteAsync(cancellationToken);
            var imageCount = res.Files?.Count(f => (f.MimeType != null && f.MimeType.StartsWith("image/")) || IsImageFile(f.Name)) ?? 0;

            return new GoogleDriveStatusDto(
                IsConnected: true,
                ServiceAccountEmail: serviceAccountEmail,
                FolderId: folderId,
                TotalImages: imageCount,
                Message: "Kết nối Google Drive API thành công. Thư mục đã sẵn sàng."
            );
        }
        catch (Exception ex)
        {
            return new GoogleDriveStatusDto(
                IsConnected: false,
                ServiceAccountEmail: serviceAccountEmail,
                FolderId: folderId,
                TotalImages: 0,
                Message: $"Không thể kết nối Google Drive: {ex.Message}. Vui lòng chia sẻ thư mục Google Drive cho email: {serviceAccountEmail} với quyền Người chỉnh sửa (Editor)."
            );
        }
    }

    public async Task<List<UploadMediaResultDto>> GetRecentUploadsAsync(int limit = 50, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UploadedMedias
            .OrderByDescending(m => m.CreatedAt)
            .Take(limit)
            .Select(m => new UploadMediaResultDto(
                m.Id,
                m.DriveFileId,
                m.FileUrl,
                m.FileName,
                m.MimeType,
                m.FileSize,
                m.CreatedAt,
                m.FileUrl
            ))
            .ToListAsync(cancellationToken);
    }

    private static bool IsImageFile(string? fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName)) return false;
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        return ext is ".png" or ".jpg" or ".jpeg" or ".webp" or ".gif" or ".bmp" or ".svg";
    }
}
