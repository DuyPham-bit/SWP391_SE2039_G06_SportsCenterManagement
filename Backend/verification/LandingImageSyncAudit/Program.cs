using System.Text.Json.Nodes;
using LandingImageSync;

var checks = 0;
void Check(bool result, string name)
{
    if (!result) throw new InvalidOperationException("FAIL " + name);
    checks++;
    Console.WriteLine("PASS " + name);
}
MediaRow Media(long id, string key) => new(id, key, "r2:" + key, "photo.jpg", "image/jpeg", 42, DateTime.UtcNow);
var source = """
    {"heroBanner":{"posterMediaId":7,"title":"LOCAL TITLE"},"coursesSection":{"sportsList":[
        {"id":"swimming","name":"LOCAL SWIMMING","mediaId":8},
        {"id":"gym","mediaId":7}]},"whyUs":{"imageUrl":""}}
    """;
var target = """
    {"heroBanner":{"posterMediaId":7,"title":"RENDER TITLE"},"coursesSection":{"sportsList":[
        {"id":"gym","name":"TARGET GYM","mediaId":99},
        {"id":"swimming","name":"TARGET SWIMMING","mediaId":100}]},
     "whyUs":{"imageUrl":"https://keep.example/old.jpg"},"otherSetting":"unchanged"}
    """;
var localMedia = new[] { Media(7, "dashboard/one.jpg"), Media(8, "dashboard/two.jpg") };
var targetMedia = new[] { Media(7, "dashboard/different.jpg"), Media(501, "dashboard/one.jpg") };
var plan = ImageSyncPlanner.Create(source, target, localMedia, targetMedia);
Check(plan.Problems.Count == 0, "stable IDs match image slots even when target arrays are reordered");
Check(plan.NewMedia.Count == 1 && plan.NewMedia[0].StorageKey == "dashboard/two.jpg", "reuse target R2 key rather than colliding local numeric ID");
var result = JsonNode.Parse(plan.Render(new Dictionary<string, long> { ["dashboard/one.jpg"] = 501, ["dashboard/two.jpg"] = 502 }))!;
Check(result["heroBanner"]!["posterMediaId"]!.GetValue<long>() == 501, "hero uses the target media ID");
Check(result["coursesSection"]!["sportsList"]![0]!["mediaId"]!.GetValue<long>() == 501 && result["coursesSection"]!["sportsList"]![1]!["mediaId"]!.GetValue<long>() == 502, "image mapping follows array identities, not positions");
Check(result["heroBanner"]!["title"]!.GetValue<string>() == "RENDER TITLE" && result["coursesSection"]!["sportsList"]![0]!["name"]!.GetValue<string>() == "TARGET GYM", "target text survives image sync");
Check(result["whyUs"]!["imageUrl"]!.GetValue<string>() == "https://keep.example/old.jpg" && result["otherSetting"]!.GetValue<string>() == "unchanged", "empty local image never clears target image or other fields");
var again = ImageSyncPlanner.Create(source, result.ToJsonString(), localMedia, targetMedia.Append(Media(502, "dashboard/two.jpg")).ToArray());
Check(!again.HasChanges && again.NewMedia.Count == 0, "repeat sync is idempotent");
var missing = ImageSyncPlanner.Create(source, "{}", localMedia, targetMedia);
Check(missing.Problems.Count > 0, "missing target layout is reported instead of importing local layout");
try { ImageSyncPlanner.Create("{\"heroBanner\":{\"posterMediaId\":999}}", target, localMedia, targetMedia); throw new Exception("Missing source media accepted"); }
catch (SyncException) { Check(true, "unresolvable source image cannot be silently imported"); }
var duplicate = ImageSyncPlanner.Create("{\"heroBanner\":{\"posterMediaId\":7}}", "{\"heroBanner\":{}}", localMedia, new[] { Media(5, "dashboard/one.jpg"), Media(6, "dashboard/one.jpg") });
Check(duplicate.Problems.Count > 0, "duplicate target R2 metadata is not chosen arbitrarily");
Check(ConnectionOptions.Parse("postgresql://person:p%40ss%3Aword@example.invalid:5432/scms").Password == "p@ss:word", "PostgreSQL URLs decode credentials without printing them");
Console.WriteLine($"Planner audit: {checks} checks passed.");
if (Environment.GetEnvironmentVariable("SCMS_AUDIT_CONNECTION") is { Length: > 0 } auditConnection)
    await IntegrationAudit.RunAsync(auditConnection);
