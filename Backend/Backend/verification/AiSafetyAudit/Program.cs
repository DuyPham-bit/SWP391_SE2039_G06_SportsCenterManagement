using System.Text.Json;
using SportsCenterManagement.BLL.DTOs.Training;
using SportsCenterManagement.BLL.Services;

var failures = new List<string>();
var checks = 0;

void Check(string name, Func<bool> assertion)
{
    checks++;
    try
    {
        if (!assertion()) throw new InvalidOperationException("Assertion failed");
        Console.WriteLine("PASS " + name);
    }
    catch (Exception exception)
    {
        failures.Add(name + ": " + exception.Message);
        Console.WriteLine("FAIL " + name + ": " + exception.Message);
    }
}

RecommendationContext Context(decimal bmi, string? medicalNote = null, HealthRecordSummary[]? healthRecords = null) =>
    new("Gym", "Tăng cơ", "Intermediate", medicalNote, [], 170m, Math.Round(bmi * 1.7m * 1.7m, 1),
        "Other", new DateOnly(2000, 1, 1), 26, bmi, "test", healthRecords ?? []);

string RecommendationJson(params string[] exerciseNames) => JsonSerializer.Serialize(new
{
    title = "Safe plan",
    targetAudience = "Test member",
    clinicalAssessment = "Assessment",
    weeklyVolume = "3 sessions",
    heartRateZone = "Zone 2",
    nutritionGuidance = "Balanced nutrition",
    coachReviewNote = "Review before use",
    conflictWarnings = Array.Empty<string>(),
    mandatoryAdjustments = Array.Empty<string>(),
    coachNotes = new[] { "Control breathing" },
    exercises = exerciseNames.Select(name => new { name, sets = "3", reps = "10", note = "Controlled form" })
});

Check("underweight objective data overrides fat-loss goal and high-stamina tag", () =>
{
    var result = AiWorkoutSafetyPolicy.Resolve(Context(17m), "Giảm mỡ HIIT", "Advanced", ["high_endurance", "mass_focus"]);
    return result.IsUnderweight && result.EffectiveGoal.Contains("tăng cân", StringComparison.OrdinalIgnoreCase) &&
        result.DiscardedTags.Contains("high_endurance") && result.ConflictWarnings.Length > 0;
});

Check("normal BMI overrides skinny tag and resolves mixed body-composition plus endurance goals", () =>
{
    var safety = AiWorkoutSafetyPolicy.Resolve(
        Context(19.6m), "Tăng cơ, giảm mỡ, cải thiện sức bền", "Intermediate", ["skinny_gain", "mass_focus"]);
    var result = AiWorkoutRecommendationProcessor.Process(RecommendationJson(
        "Barbell Back Squat", "Barbell Bench Press", "Cable Row", "Romanian Deadlift"), safety, 60m);
    return safety.DiscardedTags.Contains("skinny_gain") &&
        !safety.AcceptedTags.Contains("skinny_gain") &&
        safety.EffectiveLevel == "Intermediate" &&
        safety.MandatoryAdjustments.Any(item => item.Contains("không tự động hạ cấp", StringComparison.OrdinalIgnoreCase)) &&
        result["title"]?.GetValue<string>() == "Phác đồ Tái cấu trúc Cơ thể & Phát triển Sức bền" &&
        result["targetAudience"]?.GetValue<string>().Contains("BMI 19.6", StringComparison.Ordinal) == true &&
        result["nutritionGuidance"]?.GetValue<string>().Contains("thâm hụt nhẹ", StringComparison.OrdinalIgnoreCase) == true &&
        result["nutritionGuidance"]?.GetValue<string>().Contains("400-500", StringComparison.Ordinal) == false &&
        result["heartRateZone"]?.GetValue<string>().Contains("Zone 3-4", StringComparison.Ordinal) == true;
});

Check("severe underweight forces beginner safety foundation", () =>
{
    var result = AiWorkoutSafetyPolicy.Resolve(Context(15.5m), "Tăng cơ", "Advanced", ["mass_focus"]);
    return result.IsSeverelyUnderweight && result.EffectiveLevel.StartsWith("Beginner", StringComparison.OrdinalIgnoreCase);
});

Check("back condition rejects axial-loading exercise", () =>
{
    var result = AiWorkoutSafetyPolicy.Resolve(Context(22m, "Đau lưng và gù lưng"), "Tăng cơ", "Intermediate", []);
    var safeExercises = new[] { "Seated Machine Leg Press", "Chest-Supported Row", "Cable Face Pull", "Deadbug Core Stabilization" };
    return result.HasBackIssue && AiWorkoutSafetyPolicy.FindExerciseViolations(result, ["Barbell Back Squat"]).Length > 0 &&
        AiWorkoutSafetyPolicy.FindExerciseViolations(result, safeExercises).Length == 0;
});

Check("active health record overrides a conflicting subjective tag", () =>
{
    var records = new[] { new HealthRecordSummary("Injury", "Đau khớp vai", "Đau chóp xoay", new DateOnly(2026, 10, 1)) };
    var result = AiWorkoutSafetyPolicy.Resolve(Context(23m, healthRecords: records), "Tăng cơ", "Advanced", ["high_endurance"]);
    return result.HasWristOrShoulderIssue &&
        AiWorkoutSafetyPolicy.FindExerciseViolations(result, ["Barbell Bench Press"]).Length > 0 &&
        AiWorkoutSafetyPolicy.FindExerciseViolations(result, ["Neutral-Grip Dumbbell Floor Press"]).Length == 0;
});

Check("subjective pain tag conservatively activates the matching safety restriction", () =>
{
    var result = AiWorkoutSafetyPolicy.Resolve(Context(23m), "Tăng cơ", "Intermediate", ["back_pain"]);
    return result.HasBackIssue &&
        AiWorkoutSafetyPolicy.FindExerciseViolations(result, ["Front Squat"]).Length > 0;
});

Check("coach health note activates safety restrictions even when no tag is selected", () =>
{
    var result = AiWorkoutSafetyPolicy.Resolve(Context(23m), "Tăng cơ", "Intermediate", [], "Đau vai khi đẩy tạ");
    return result.HasWristOrShoulderIssue &&
        AiWorkoutSafetyPolicy.FindExerciseViolations(result, ["Barbell Bench Press"]).Length > 0;
});

Check("overweight profile rejects high-impact plyometrics", () =>
{
    var result = AiWorkoutSafetyPolicy.Resolve(Context(31m), "Giảm mỡ", "Beginner", ["overweight_endo"]);
    return result.IsOverweight && AiWorkoutSafetyPolicy.FindExerciseViolations(result, ["Box Jump"]).Length == 1;
});

Check("knee-pain tag rejects impact and requires a controlled knee-friendly exercise", () =>
{
    var result = AiWorkoutSafetyPolicy.Resolve(Context(22m), "Tăng cơ", "Intermediate", ["knee_pain"]);
    var safeExercises = new[] { "Seated Leg Curl", "Machine Chest Press", "Cable Row", "Deadbug" };
    return result.HasKneeIssue &&
        AiWorkoutSafetyPolicy.FindExerciseViolations(result, ["Jump Squat"]).Length > 0 &&
        AiWorkoutSafetyPolicy.FindExerciseViolations(result, safeExercises).Length == 0;
});

Check("missing required biometrics is rejected before provider call", () =>
{
    var incomplete = new RecommendationContext("Gym", "Tăng cơ", "Beginner", null, [], null, 50m);
    try
    {
        AiWorkoutSafetyPolicy.Resolve(incomplete, "Tăng cơ", "Beginner", []);
        return false;
    }
    catch (InvalidOperationException exception)
    {
        return exception.Data["StatusCode"] is 400 && exception.Data["Code"] as string == "INSUFFICIENT_CONTEXT_FOR_AI";
    }
});

Check("recommendation processor rejects a non-object provider response with a tagged gateway error", () =>
{
    var safety = AiWorkoutSafetyPolicy.Resolve(Context(22m), "Tăng cơ", "Intermediate", []);
    try
    {
        AiWorkoutRecommendationProcessor.Process("[]", safety, 64m);
        return false;
    }
    catch (InvalidOperationException exception)
    {
        return exception.Data["StatusCode"] is 502 && exception.Data["Code"] as string == "AI_INVALID_RESPONSE";
    }
});

Check("recommendation processor rejects an unsafe provider exercise", () =>
{
    var safety = AiWorkoutSafetyPolicy.Resolve(Context(22m, "Đau lưng"), "Tăng cơ", "Intermediate", []);
    try
    {
        AiWorkoutRecommendationProcessor.Process(RecommendationJson(
            "Barbell Back Squat", "Chest-Supported Machine Row", "Cable Face Pull", "Deadbug"), safety, 64m);
        return false;
    }
    catch (InvalidOperationException exception)
    {
        return exception.Data["StatusCode"] is 422 && exception.Data["Code"] as string == "AI_SAFETY_CHECK_FAILED";
    }
});

Check("recommendation processor applies deterministic underweight overrides", () =>
{
    var safety = AiWorkoutSafetyPolicy.Resolve(Context(17m), "Giảm mỡ HIIT", "Advanced", ["high_endurance"]);
    var result = AiWorkoutRecommendationProcessor.Process(RecommendationJson(
        "Seated Leg Curl", "Machine Chest Press", "Cable Row", "Deadbug"), safety, 49m);
    return result["weeklyVolume"]?.GetValue<string>().StartsWith("2-3 buổi", StringComparison.Ordinal) == true &&
        result["nutritionGuidance"]?.GetValue<string>().Contains("300-500 kcal", StringComparison.Ordinal) == true &&
        result["conflictWarnings"]?.AsArray().Count > 0;
});

Check("recommendation processor caps hypertension guidance below 75 percent HRmax", () =>
{
    var safety = AiWorkoutSafetyPolicy.Resolve(Context(24m, "Cao huyết áp"), "Tăng cơ", "Beginner", []);
    var result = AiWorkoutRecommendationProcessor.Process(RecommendationJson(
        "Seated Leg Curl", "Machine Chest Press", "Cable Row", "Deadbug"), safety, 69m);
    return safety.HasHypertension &&
        result["heartRateZone"]?.GetValue<string>().Contains("75% HRmax", StringComparison.Ordinal) == true;
});

Console.WriteLine($"RESULT {checks - failures.Count}/{checks} checks passed");
if (failures.Count > 0)
{
    foreach (var failure in failures) Console.Error.WriteLine(failure);
    Environment.ExitCode = 1;
}
