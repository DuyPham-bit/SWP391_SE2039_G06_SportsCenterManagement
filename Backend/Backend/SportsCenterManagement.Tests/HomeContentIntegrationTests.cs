using System.Net;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Xunit;

namespace SportsCenterManagement.Tests;

public sealed class HomeContentIntegrationTests
{
    [Theory]
    [InlineData("/api/media/upload", "POST")]
    [InlineData("/api/media/drive-files", "GET")]
    [InlineData("/api/media/status", "GET")]
    [InlineData("/api/media/recent", "GET")]
    public async Task MediaManagementRequiresLogin(string path, string method)
    {
        using var factory = new BranchApiFactory();
        using var client = factory.CreateClient();
        using var request = new HttpRequestMessage(new HttpMethod(method), path);
        if (method == "POST") request.Content = new MultipartFormDataContent();
        using var response = await client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task MemberCannotUploadEvenWithAValidJwt()
    {
        using var factory = new BranchApiFactory();
        using var client = factory.CreateClient();
        await BranchApiFactory.LoginAsync(client, "member@test.local");
        using var response = await client.PostAsync("/api/media/upload", new MultipartFormDataContent());
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task ManagerPublishesContentThatAnotherAnonymousClientCanRead()
    {
        using var factory = new BranchApiFactory();
        using var manager = factory.CreateClient();
        await BranchApiFactory.LoginAsync(manager, "manager@test.local");
        using var saved = await manager.PutAsJsonAsync("/api/landing-content", new { content = Content("Published title") });
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);

        using var visitor = factory.CreateClient();
        var result = await visitor.GetFromJsonAsync<JsonElement>("/api/landing-content");
        Assert.Equal("Published title", result.GetProperty("content").GetProperty("heroBanner").GetProperty("title").GetString());
    }

    [Theory]
    [InlineData(null, HttpStatusCode.Unauthorized)]
    [InlineData("member@test.local", HttpStatusCode.Forbidden)]
    [InlineData("reception@test.local", HttpStatusCode.Forbidden)]
    public async Task PublishingRequiresAnAdministrativeRole(string? email, HttpStatusCode expected)
    {
        using var factory = new BranchApiFactory();
        using var client = factory.CreateClient();
        if (email is not null) await BranchApiFactory.LoginAsync(client, email);
        using var response = await client.PutAsJsonAsync("/api/landing-content", new { content = Content("Unauthorized edit") });
        Assert.Equal(expected, response.StatusCode);
    }

    [Fact]
    public async Task InvalidContentDoesNotReplacePublishedContent()
    {
        using var factory = new BranchApiFactory();
        using var manager = factory.CreateClient();
        await BranchApiFactory.LoginAsync(manager, "manager@test.local");
        using var saved = await manager.PutAsJsonAsync("/api/landing-content", new { content = Content("Kept title") });
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        using var invalid = await manager.PutAsJsonAsync("/api/landing-content", new { content = new { heroBanner = "invalid" } });
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
        using var visitor = factory.CreateClient();
        var result = await visitor.GetFromJsonAsync<JsonElement>("/api/landing-content");
        Assert.Equal("Kept title", result.GetProperty("content").GetProperty("heroBanner").GetProperty("title").GetString());
    }

    [Theory]
    [InlineData("payload.html", "image/png")]
    [InlineData("payload.png", "image/png")]
    [InlineData("payload.svg", "image/svg+xml")]
    public async Task UploadEndpointRejectsUnsafeFilesBeforeCallingStorage(string name, string mime)
    {
        using var factory = new BranchApiFactory();
        using var manager = factory.CreateClient();
        await BranchApiFactory.LoginAsync(manager, "manager@test.local");
        using var form = new MultipartFormDataContent();
        var file = new ByteArrayContent("<html><script>alert(1)</script></html>"u8.ToArray());
        file.Headers.ContentType = new MediaTypeHeaderValue(mime);
        form.Add(file, "file", name);
        using var response = await manager.PostAsync("/api/media/upload", form);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(string.IsNullOrWhiteSpace(error.GetProperty("message").GetString()));
    }

    [Theory]
    [InlineData("javascript:alert(1)")]
    [InlineData("data:text/html,<script>alert(1)</script>")]
    public async Task PublishingRejectsScriptLinks(string link)
    {
        using var factory = new BranchApiFactory();
        using var manager = factory.CreateClient();
        await BranchApiFactory.LoginAsync(manager, "manager@test.local");
        var content = JsonSerializer.SerializeToElement(Content("Safe title"));
        var sections = JsonSerializer.Deserialize<Dictionary<string, object>>(content.GetRawText())!;
        sections["heroBanner"] = new { title = "Safe title", primaryCtaLink = link };
        using var response = await manager.PutAsJsonAsync("/api/landing-content", new { content = sections });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData("photo.png", "image/png", false)]
    [InlineData("photo.avif", "image/avif", true)]
    public async Task LocalUploadCanBeReadAnonymouslyWithoutUsingTheFrontendBuildDirectory(string fileName, string mimeType, bool avif)
    {
        var root = Path.Combine(Path.GetTempPath(), "SCMS_Media_Api_Test_" + Guid.NewGuid().ToString("N"));
        try
        {
            using var factory = new BranchApiFactory();
            using var application = factory.WithWebHostBuilder(builder =>
            {
                builder.UseSetting("GoogleDrive:StorageProvider", "Local");
                builder.UseSetting("GoogleDrive:LocalStoragePath", root);
            });
            using var manager = application.CreateClient();
            await BranchApiFactory.LoginAsync(manager, "manager@test.local");
            var bytes = avif ? MediaStorageTests.AvifHeader : Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR1sAAAAASUVORK5CYII=");
            using var form = new MultipartFormDataContent();
            var file = new ByteArrayContent(bytes);
            file.Headers.ContentType = new MediaTypeHeaderValue(mimeType);
            form.Add(file, "file", fileName);
            using var upload = await manager.PostAsync("/api/media/upload", form);
            Assert.Equal(HttpStatusCode.OK, upload.StatusCode);
            var result = await upload.Content.ReadFromJsonAsync<JsonElement>();
            var url = result.GetProperty("url").GetString()!;
            Assert.True(File.Exists(Path.Combine(root, url.TrimStart('/'))));
            using var visitor = application.CreateClient();
            using var image = await visitor.GetAsync(url);
            Assert.Equal(HttpStatusCode.OK, image.StatusCode);
            Assert.Equal(mimeType, image.Content.Headers.ContentType?.MediaType);
            Assert.Equal("nosniff", Assert.Single(image.Headers.GetValues("X-Content-Type-Options")));
            Assert.Equal(bytes, await image.Content.ReadAsByteArrayAsync());
            await File.WriteAllTextAsync(Path.Combine(root, "uploads", "old.html"), "<script>alert(1)</script>");
            using var unsafeFile = await visitor.GetAsync("/uploads/old.html");
            Assert.Equal(HttpStatusCode.NotFound, unsafeFile.StatusCode);
        }
        finally
        {
            if (Path.GetFullPath(root).StartsWith(Path.GetFullPath(Path.GetTempPath()), StringComparison.OrdinalIgnoreCase) && Directory.Exists(root))
                Directory.Delete(root, recursive: true);
        }
    }

    internal static object Content(string title) => new
    {
        heroBanner = new { title, metrics = Array.Empty<object>() },
        whyUs = new { features = Array.Empty<object>(), stats = Array.Empty<object>() },
        coursesSection = new { sportsList = Array.Empty<object>() },
        facilitiesSection = new { facilitiesList = Array.Empty<object>() },
        zonesLayout = new { serviceAmenities = Array.Empty<object>(), zones = Array.Empty<object>() },
        ctaAndFooter = new { contactEmail = "contact@example.test" }
    };
}
