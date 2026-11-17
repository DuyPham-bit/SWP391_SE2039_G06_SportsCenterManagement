using System.Text.Json;
using Microsoft.Extensions.Configuration;
using SportsCenterManagement.BLL.Exceptions;
using SportsCenterManagement.BLL.Services;

namespace SportsCenterManagement.Tests;

/// <summary>
/// English homepage text is stored next to the content as { "Vietnamese": "English" } and survives a publish;
/// AI translation answers are mapped back to their source text by index.
/// </summary>
public sealed class LandingTranslationTests
{
    private const string Content = """
        {"heroBanner":{"badge":"TRUNG TÂM THỂ THAO"},"whyUs":{},"coursesSection":{},"facilitiesSection":{},
         "zonesLayout":{},"ctaAndFooter":{},
         "translations":{"TRUNG TÂM THỂ THAO":"SPORTS CENTER","Không gian Yoga":"Yoga studio"}}
        """;

    private static JsonElement Json(string json) => JsonDocument.Parse(json).RootElement.Clone();

    [Fact]
    public async Task SaveAsync_KeepsTheEnglishTranslations()
    {
        using var db = TestDb.Create();
        var service = new LandingContentService(db, new ConfigurationBuilder().Build());

        var saved = (await service.SaveAsync(Json(Content), 1, default)).Content!.Value;

        var translations = saved.GetProperty("translations");
        Assert.Equal("SPORTS CENTER", translations.GetProperty("TRUNG TÂM THỂ THAO").GetString());
        Assert.Equal("Yoga studio", translations.GetProperty("Không gian Yoga").GetString());
    }

    [Theory]
    [InlineData("[]")]
    [InlineData("""{"Sân":1}""")]
    [InlineData("""{"Sân":{"en":"Court"}}""")]
    [InlineData("""{"":"Court"}""")]
    public void Validate_RejectsTranslationsThatAreNotTextToText(string translations)
    {
        var content = $$"""{"heroBanner":{},"whyUs":{},"coursesSection":{},"facilitiesSection":{},"zonesLayout":{},"ctaAndFooter":{},"translations":{{translations}}}""";

        Assert.Throws<FlowException>(() => LandingContentService.Validate(Json(content)));
    }

    [Fact]
    public void Parse_MapsAnswersBackToTheirSourceTextByIndex()
    {
        var sources = new[] { "Bể bơi", "Không gian Yoga" };
        var answer = """{"items":[{"i":1,"en":"Yoga studio"},{"i":0,"en":" Swimming pool "},{"i":7,"en":"ignored"},{"i":0}]}""";

        var result = LandingTranslationService.Parse(answer, sources);

        Assert.Equal("Swimming pool", result["Bể bơi"]);
        Assert.Equal("Yoga studio", result["Không gian Yoga"]);
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public void Parse_RejectsAnAnswerThatIsNotJson() =>
        Assert.Throws<FlowException>(() => LandingTranslationService.Parse("Swimming pool", ["Bể bơi"]));

    [Fact]
    public async Task TranslateAsync_RejectsTooManyTextsBeforeCallingTheAi()
    {
        var service = new LandingTranslationService(new GeminiService(new HttpClient(), new ConfigurationBuilder().Build()));
        var texts = Enumerable.Range(0, LandingTranslationService.MaxTexts + 1).Select(i => $"Đoạn {i}");

        var error = await Assert.ThrowsAsync<FlowException>(() => service.TranslateAsync(texts, default));
        Assert.Equal(400, error.StatusCode);
    }

    [Fact]
    public async Task TranslateAsync_ReportsMissingAiKeyAsServiceUnavailable()
    {
        var service = new LandingTranslationService(new GeminiService(new HttpClient(), new ConfigurationBuilder().Build()));

        var error = await Assert.ThrowsAsync<FlowException>(() => service.TranslateAsync(["Bể bơi"], default));
        Assert.Equal(503, error.StatusCode);
    }
}
