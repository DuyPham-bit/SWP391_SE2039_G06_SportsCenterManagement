using System.Net;
using System.Text;
using System.Text.Json;
using Google.Apis.Drive.v3;
using Google.Apis.Http;
using Google.Apis.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using SportsCenterManagement.BLL.Exceptions;
using SportsCenterManagement.BLL.Services;
using SportsCenterManagement.DAL.Context;
using SportsCenterManagement.DAL.Entities;
using Xunit;

namespace SportsCenterManagement.Tests;

public sealed class MediaStorageTests
{
    private static readonly byte[] Png = Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR1sAAAAASUVORK5CYII=");

    // ISO-BMFF FileTypeBox with AVIF major/compatible brands.
    internal static readonly byte[] AvifHeader = Convert.FromHexString("00000020667479706176696600000000617669666D6966316D6961664D413142");

    [Fact]
    public async Task DriveLibraryAndStatusIncludeAvifWithGenericMimeTypesAcrossPages()
    {
        await using var db = BranchTestData.CreateDatabase();
        var service = new StubDriveService(db, request =>
        {
            if (!request.RequestUri!.Query.Contains("pageToken=avif-page"))
                return Json(new { nextPageToken = "avif-page", files = Enumerable.Range(0, 4).Select(i => new { id = "jpeg-" + i, name = "photo-" + i + ".jpg", mimeType = "image/jpeg" }) });
            return Json(new
            {
                files = new[]
                {
                    new { id = "avif-image", name = "photo.avif", mimeType = (string?)"image/avif" },
                    new { id = "avif-generic", name = "photo-generic.AVIF", mimeType = (string?)"application/octet-stream" },
                    new { id = "avif-unknown", name = "photo-unknown.avif", mimeType = (string?)null },
                    new { id = "svg", name = "unsafe.svg", mimeType = (string?)"image/svg+xml" },
                    new { id = "document", name = "document.avif", mimeType = (string?)"application/pdf" }
                }
            });
        });
        var results = await service.GetDriveFolderImagesAsync();
        Assert.Equal(7, results.Count);
        foreach (var id in new[] { "avif-image", "avif-generic", "avif-unknown" })
            Assert.Equal("image/avif", Assert.Single(results, image => image.FileId == id).MimeType);
        Assert.Equal(7, await db.UploadedMedias.CountAsync());
        Assert.Equal(7, (await service.GetStatusAsync()).TotalImages);
    }

    [Fact]
    public async Task AcceptsAvifFileTypeBrandsWithoutAcceptingOtherBmffFormats()
    {
        using var stream = new MemoryStream(AvifHeader);
        var result = await ImageUploadValidator.ValidateAsync(stream, "photo.avif", "image/avif", CancellationToken.None);
        Assert.Equal("image/avif", result.MimeType);
        Assert.Equal(0, stream.Position);

        using var mp4 = new MemoryStream(Convert.FromHexString("000000186674797069736F6D0000000069736F6D6D703432"));
        await Assert.ThrowsAsync<FlowException>(() => ImageUploadValidator.ValidateAsync(mp4, "video.avif", "image/avif", CancellationToken.None));
        using var html = new MemoryStream("<html>avif<script>alert(1)</script></html>"u8.ToArray());
        await Assert.ThrowsAsync<FlowException>(() => ImageUploadValidator.ValidateAsync(html, "payload.avif", "image/avif", CancellationToken.None));
    }

    [Theory]
    [InlineData("payload.html", "image/png", true)]
    [InlineData("payload.png", "image/png", false)]
    [InlineData("payload.svg", "image/svg+xml", false)]
    [InlineData("payload.png", "image/jpeg", true)]
    public async Task RejectsUnsafeExtensionsSpoofedContentAndMimeMismatch(string name, string mime, bool pngBytes)
    {
        using var stream = new MemoryStream(pngBytes ? Png : Encoding.UTF8.GetBytes("<html><script>alert(1)</script></html>"));
        var error = await Assert.ThrowsAsync<FlowException>(() => ImageUploadValidator.ValidateAsync(stream, name, mime, CancellationToken.None));
        Assert.Equal(400, error.StatusCode);
    }

    [Fact]
    public async Task RejectsActualOversizedStreamRegardlessOfClaimedSize()
    {
        using var stream = new MemoryStream(new byte[ImageUploadValidator.MaxFileSize + 1]);
        await Assert.ThrowsAsync<FlowException>(() => ImageUploadValidator.ValidateAsync(stream, "large.png", "image/png", CancellationToken.None));
    }

    [Fact]
    public async Task LocalUploadWritesVerifiedBytesUnderConfiguredWebRootAndStoresActor()
    {
        await using var db = BranchTestData.CreateDatabase();
        var root = Path.Combine(Path.GetTempPath(), "SCMS_Media_Test_" + Guid.NewGuid().ToString("N"));
        try
        {
            var service = new GoogleDriveService(db, Configuration("Local"), NullLogger<GoogleDriveService>.Instance, root);
            using var stream = new MemoryStream(Png);
            var result = await service.UploadFileAsync(stream, "../../photo.png", "image/png", 1, 30);
            Assert.StartsWith("/uploads/", result.Url);
            Assert.EndsWith(".png", result.Url);
            Assert.Equal(Png.LongLength, result.FileSize);
            Assert.Equal("photo.png", result.FileName);
            Assert.Equal(Png, await File.ReadAllBytesAsync(Path.Combine(root, result.Url.TrimStart('/'))));
            db.ChangeTracker.Clear();
            var saved = await db.UploadedMedias.SingleAsync();
            Assert.Equal(30, saved.UploadedByUserId);
            Assert.Single(await service.GetDriveFolderImagesAsync());
            Assert.True((await service.GetStatusAsync()).IsConnected);
        }
        finally
        {
            // Only this test's newly allocated directory may be removed.
            if (Path.GetFullPath(root).StartsWith(Path.GetFullPath(Path.GetTempPath()), StringComparison.OrdinalIgnoreCase) && Directory.Exists(root))
                Directory.Delete(root, recursive: true);
        }
    }

    [Fact]
    public async Task DriveFailureWithLocalImagesKeepsAllMetadataAndReturnsCachedLibrary()
    {
        await using var db = BranchTestData.CreateDatabase();
        SeedMedia(db);
        var service = new StubDriveService(db, _ => throw new HttpRequestException("Drive offline"));
        var results = await service.GetDriveFolderImagesAsync();
        Assert.Equal(2, results.Count);
        Assert.Contains(results, x => x.FileId == "drive-existing");
        Assert.Equal(2, await db.UploadedMedias.CountAsync());
    }

    [Fact]
    public async Task ReadsAllDrivePagesBeforeSynchronizingAndPreservesMetadataForMissingFiles()
    {
        await using var db = BranchTestData.CreateDatabase();
        SeedMedia(db);
        var requests = new List<string>();
        var service = new StubDriveService(db, request =>
        {
            var query = request.RequestUri!.Query;
            requests.Add(query);
            var second = query.Contains("pageToken=next-page");
            var files = Enumerable.Range(second ? 100 : 0, second ? 1 : 100)
                .Select(i => new { id = "drive-" + i, name = "photo-" + i + ".png", mimeType = "image/png" });
            return Json(new { nextPageToken = second ? null : "next-page", files });
        });
        var results = await service.GetDriveFolderImagesAsync();
        Assert.Equal(2, requests.Count);
        Assert.Equal(102, results.Count); // 101 Drive files + one local image.
        Assert.Contains(results, x => x.FileId == "drive-100" && x.Id > 0);
        Assert.DoesNotContain(results, x => x.FileId == "drive-existing");
        Assert.Equal(103, await db.UploadedMedias.CountAsync()); // Missing file metadata remains recoverable.
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task IncompleteOrFailedLaterPageNeverAppliesAPartialSnapshot(bool incomplete)
    {
        await using var db = BranchTestData.CreateDatabase();
        SeedMedia(db);
        var service = new StubDriveService(db, request =>
        {
            if (request.RequestUri!.Query.Contains("pageToken=")) return new HttpResponseMessage(HttpStatusCode.BadRequest);
            return Json(new
            {
                incompleteSearch = incomplete,
                nextPageToken = incomplete ? null : "later-page",
                files = new[] { new { id = "new-partial-file", name = "new.png", mimeType = "image/png" } }
            });
        });
        var results = await service.GetDriveFolderImagesAsync();
        Assert.Equal(2, results.Count);
        Assert.Equal(2, await db.UploadedMedias.CountAsync());
        Assert.False(await db.UploadedMedias.AnyAsync(m => m.DriveFileId == "new-partial-file"));
    }

    private static IConfiguration Configuration(string provider = "GoogleDrive") => new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?> { ["GoogleDrive:StorageProvider"] = provider, ["GoogleDrive:FolderId"] = "test-folder" }).Build();

    private static void SeedMedia(SportsCenterDbContext db)
    {
        db.UploadedMedias.AddRange(
            new UploadedMedia { DriveFileId = "local_existing", FileName = "local.png", FileUrl = "/uploads/local.png", MimeType = "image/png", CreatedAt = DateTime.UtcNow },
            new UploadedMedia { DriveFileId = "drive-existing", FileName = "existing.png", FileUrl = "https://lh3.googleusercontent.com/d/drive-existing", MimeType = "image/png", CreatedAt = DateTime.UtcNow.AddDays(-1) });
        db.SaveChanges();
    }

    private static HttpResponseMessage Json(object value) => new(HttpStatusCode.OK)
    {
        Content = new StringContent(JsonSerializer.Serialize(value), Encoding.UTF8, "application/json")
    };

    private sealed class StubDriveService(SportsCenterDbContext db, Func<HttpRequestMessage, HttpResponseMessage> respond)
        : GoogleDriveService(db, Configuration(), NullLogger<GoogleDriveService>.Instance, Path.GetTempPath())
    {
        protected override DriveService CreateDriveService() => new(new BaseClientService.Initializer { HttpClientFactory = new StubHttpFactory(respond) });
    }

    private sealed class StubHttpFactory(Func<HttpRequestMessage, HttpResponseMessage> respond) : Google.Apis.Http.IHttpClientFactory
    {
        public ConfigurableHttpClient CreateHttpClient(CreateHttpClientArgs args) => new(new ConfigurableMessageHandler(new StubHandler(respond)));
    }

    private sealed class StubHandler(Func<HttpRequestMessage, HttpResponseMessage> respond) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();
            return Task.FromResult(respond(request));
        }
    }
}
