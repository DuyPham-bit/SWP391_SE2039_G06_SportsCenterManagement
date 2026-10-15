using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
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
        var authMode = _configuration["GoogleDrive:AuthMode"] ?? "ServiceAccount";

        if (string.Equals(authMode, "OAuth", StringComparison.OrdinalIgnoreCase))
        {
            var clientId = _configuration["GoogleDrive:ClientId"];
            var clientSecret = _configuration["GoogleDrive:ClientSecret"];
            var refreshToken = _configuration["GoogleDrive:RefreshToken"];

            if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret) || string.IsNullOrWhiteSpace(refreshToken))
            {
                throw new FlowException(500, "Cấu hình Google Drive OAuth (ClientId, ClientSecret, RefreshToken) chưa đầy đủ.");
            }

            var tokenResponse = new TokenResponse
            {
                RefreshToken = refreshToken
            };

            var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
            {
                ClientSecrets = new ClientSecrets
                {
                    ClientId = clientId.Trim(),
                    ClientSecret = clientSecret.Trim()
                },
                Scopes = new[] { DriveService.ScopeConstants.Drive }
            });

            var credential = new UserCredential(flow, "scms_user", tokenResponse);

            return new DriveService(new BaseClientService.Initializer
            {
                HttpClientInitializer = credential,
                ApplicationName = "SCMS-SportsCenterManagement"
            });
        }
        else
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
    }

    private async Task<UploadMediaResultDto> SaveLocalFileAsync(
        Stream fileStream,
        string fileName,
        string mimeType,
        long? fileSize,
        long? currentUserId,
        CancellationToken cancellationToken)
    {
        var webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        if (!Directory.Exists(webRoot))
        {
            var apiSubdir = Path.Combine(Directory.GetCurrentDirectory(), "SportsCenterManagement.API", "wwwroot");
            if (Directory.Exists(apiSubdir))
            {
                webRoot = apiSubdir;
            }
            else
            {
                Directory.CreateDirectory(webRoot);
            }
        }

        var uploadsDir = Path.Combine(webRoot, "uploads");
        if (!Directory.Exists(uploadsDir))
        {
            Directory.CreateDirectory(uploadsDir);
        }

        var ext = Path.GetExtension(fileName);
        var safeFileName = $"{Guid.NewGuid():N}{ext}";
        var physicalPath = Path.Combine(uploadsDir, safeFileName);

        if (fileStream.CanSeek)
        {
            fileStream.Position = 0;
        }

        using (var destStream = new FileStream(physicalPath, FileMode.Create, FileAccess.Write))
        {
            await fileStream.CopyToAsync(destStream, cancellationToken);
        }

        var publicUrl = $"/uploads/{safeFileName}";
        var entity = new UploadedMedia
        {
            DriveFileId = $"local_{Guid.NewGuid():N}",
            FileName = fileName,
            MimeType = mimeType,
            FileSize = fileSize ?? fileStream.Length,
            FileUrl = publicUrl,
            WebViewLink = publicUrl,
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
            entity.FileUrl
        );
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

        var storageProvider = _configuration["GoogleDrive:StorageProvider"] ?? "GoogleDrive";
        if (string.Equals(storageProvider, "Local", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogInformation("StorageProvider được chỉ định là 'Local'. Lưu trực tiếp vào bộ nhớ máy chủ.");
            return await SaveLocalFileAsync(fileStream, fileName, mimeType, fileSize, currentUserId, cancellationToken);
        }

        try
        {
            var driveService = CreateDriveService();

            var folderId = _configuration["GoogleDrive:FolderId"];
            if (string.IsNullOrWhiteSpace(folderId) || folderId == "YOUR_GOOGLE_DRIVE_FOLDER_ID")
            {
                folderId = "1nRmC1FaHiICnhfvfPHKGHc3iBZJLl01R"; 
            }

            _logger.LogInformation(">>> Đang tải file lên thư mục Google Drive ID: '{FolderId}'", folderId);

            var fileMetadata = new Google.Apis.Drive.v3.Data.File
            {
                Name = fileName,
                MimeType = mimeType,
                Parents = new List<string> { folderId.Trim() }
            };

            if (fileStream.CanSeek)
            {
                fileStream.Position = 0;
            }

            var request = driveService.Files.Create(fileMetadata, fileStream, mimeType);
            request.SupportsAllDrives = true;
            request.Fields = "id, name, mimeType, size, webViewLink, thumbnailLink";

            var progress = await request.UploadAsync(cancellationToken);
            if (progress.Status != UploadStatus.Completed)
            {
                _logger.LogError(progress.Exception, "Lỗi khi upload file lên Google Drive: {Error}", progress.Exception?.Message);
                throw progress.Exception ?? new Exception($"Upload failed with status: {progress.Status}");
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
                var permReq = driveService.Permissions.Create(permission, fileId);
                permReq.SupportsAllDrives = true;
                await permReq.ExecuteAsync(cancellationToken);
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Upload lên Google Drive thất bại: {Error}. Đang tự động lưu file cục bộ (Local Fallback)...", ex.Message);
            try
            {
                return await SaveLocalFileAsync(fileStream, fileName, mimeType, fileSize, currentUserId, cancellationToken);
            }
            catch (Exception localEx)
            {
                _logger.LogError(localEx, "Lưu file cục bộ cũng thất bại: {Error}", localEx.Message);
                throw new FlowException(500, $"Tải file lên Google Drive thất bại: {ex.Message}");
            }
        }
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
            request.SupportsAllDrives = true;
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
        var authMode = _configuration["GoogleDrive:AuthMode"] ?? "ServiceAccount";
        string accountInfo = "";

        try
        {
            if (string.Equals(authMode, "OAuth", StringComparison.OrdinalIgnoreCase))
            {
                accountInfo = "OAuth2 Personal Google Drive";
            }
            else
            {
                var resolvedPath = ResolveCredentialsPath();
                if (File.Exists(resolvedPath))
                {
                    var json = await File.ReadAllTextAsync(resolvedPath, cancellationToken);
                    using var doc = System.Text.Json.JsonDocument.Parse(json);
                    if (doc.RootElement.TryGetProperty("client_email", out var emailProp))
                    {
                        accountInfo = emailProp.GetString() ?? "";
                    }
                }
            }

            var driveService = CreateDriveService();
            var request = driveService.Files.List();
            request.SupportsAllDrives = true;
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
                ServiceAccountEmail: accountInfo,
                FolderId: folderId,
                TotalImages: imageCount,
                Message: "Kết nối Google Drive API thành công. Thư mục đã sẵn sàng."
            );
        }
        catch (Exception ex)
        {
            return new GoogleDriveStatusDto(
                IsConnected: false,
                ServiceAccountEmail: accountInfo,
                FolderId: folderId,
                TotalImages: 0,
                Message: $"Không thể kết nối Google Drive: {ex.Message}."
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
