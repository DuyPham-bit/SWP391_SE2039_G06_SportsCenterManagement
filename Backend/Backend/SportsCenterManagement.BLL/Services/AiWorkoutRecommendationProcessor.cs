using System.Text.Json;
using System.Text.Json.Nodes;

namespace SportsCenterManagement.BLL.Services;

public static class AiWorkoutRecommendationProcessor
{
    private static readonly string[] RequiredTextFields =
    [
        "title", "targetAudience", "clinicalAssessment", "weeklyVolume", "heartRateZone",
        "nutritionGuidance", "coachReviewNote"
    ];

    private static readonly string[] RequiredListFields =
    [
        "conflictWarnings", "mandatoryAdjustments", "coachNotes"
    ];

    private static readonly string[] RequiredExerciseFields =
    [
        "name", "sets", "reps", "note"
    ];

    public static JsonObject Process(string reply, AiWorkoutSafetyProfile safety, decimal weightKg)
    {
        var result = ParseAndValidate(reply);
        var exercises = (JsonArray)result["exercises"]!;
        var violations = AiWorkoutSafetyPolicy.FindExerciseViolations(safety,
            exercises.Select(exercise => exercise!["name"]!.GetValue<string>()));

        if (violations.Length > 0)
            throw TaggedFailure(
                "AI sinh bài tập xung đột với hồ sơ sức khỏe: " + string.Join(" ", violations),
                422,
                "AI_SAFETY_CHECK_FAILED",
                "Không sử dụng kết quả này; kiểm tra hồ sơ sức khỏe và tạo lại gợi ý.");

        ApplyDeterministicOverrides(result, safety, weightKg);
        return result;
    }

    private static JsonObject ParseAndValidate(string reply)
    {
        try
        {
            if (JsonNode.Parse(reply) is not JsonObject result) throw new JsonException();

            foreach (var key in RequiredTextFields) RequireString(result, key);
            foreach (var key in RequiredListFields) RequireStringArray(result, key);

            if (result["exercises"] is not JsonArray exercises || exercises.Count is < 4 or > 6)
                throw new JsonException();

            foreach (var exercise in exercises)
            {
                if (exercise is not JsonObject item) throw new JsonException();
                foreach (var key in RequiredExerciseFields) RequireString(item, key);
            }

            return result;
        }
        catch (JsonException)
        {
            throw TaggedFailure(
                "AI trả giáo án không đúng định dạng. Vui lòng thử lại.",
                502,
                "AI_INVALID_RESPONSE",
                "Tạo lại giáo án; nếu lỗi lặp lại, kiểm tra cấu hình và phiên bản mô hình AI.");
        }
    }

    private static void ApplyDeterministicOverrides(JsonObject result, AiWorkoutSafetyProfile safety, decimal weightKg)
    {
        result["conflictWarnings"] = JsonSerializer.SerializeToNode(safety.ConflictWarnings);
        result["mandatoryAdjustments"] = JsonSerializer.SerializeToNode(safety.MandatoryAdjustments);

        var bmiStatus = safety.IsSeverelyUnderweight ? "thiếu cân nghiêm trọng"
            : safety.IsUnderweight ? "thiếu cân"
            : safety.IsOverweight ? "thừa cân"
            : "bình thường";
        var hasMedicalRestriction = safety.HasBackIssue || safety.HasWristOrShoulderIssue ||
            safety.HasKneeIssue || safety.HasHypertension;
        result["targetAudience"] =
            $"Học viên BMI {safety.Bmi:0.0} ({bmiStatus}), trình độ {safety.EffectiveLevel}; " +
            $"mục tiêu hiệu lực: {safety.EffectiveGoal}.";
        result["clinicalAssessment"] =
            $"BMI {safety.Bmi:0.0} được dùng làm dữ liệu thể trạng ưu tiên. " +
            (hasMedicalRestriction
                ? "Có lưu ý sức khỏe cần áp dụng các điều chỉnh bắt buộc bên dưới."
                : "Chưa phát hiện hạn chế y khoa trong dữ liệu được cung cấp; tiếp tục theo dõi phản ứng khi tập.");

        if (safety.WantsMuscleGain && safety.WantsFatLoss)
            result["title"] = safety.WantsEndurance
                ? "Phác đồ Tái cấu trúc Cơ thể & Phát triển Sức bền"
                : "Phác đồ Tái cấu trúc Cơ thể";

        if (safety.IsUnderweight)
        {
            result["weeklyVolume"] = safety.IsSeverelyUnderweight
                ? "2-3 buổi/tuần • 35-45 phút/buổi • cường độ thấp đến vừa"
                : "2-3 buổi/tuần • 40-55 phút/buổi • cường độ vừa";
            result["heartRateZone"] = safety.IsSeverelyUnderweight
                ? "Zone 1-2 • ưu tiên khả năng dung nạp và hồi phục"
                : "Zone 2 • tránh HIIT và khối lượng gây kiệt sức";
            var minimumProtein = Math.Round(weightKg * 1.6m);
            var maximumProtein = Math.Round(weightKg * 2m);
            result["nutritionGuidance"] =
                $"Thặng dư 300-500 kcal/ngày; protein tham khảo {minimumProtein:0}-{maximumProtein:0} g/ngày " +
                "(1,6-2,0 g/kg), chia đều các bữa và theo dõi khả năng dung nạp. " +
                "Điều chỉnh với chuyên gia dinh dưỡng nếu có bệnh nền.";
        }
        else if (safety.IsOverweight)
        {
            result["nutritionGuidance"] =
                "Thâm hụt 300-500 kcal/ngày; ưu tiên protein khoảng 1,6-2,0 g/kg/ngày, thực phẩm giàu chất xơ " +
                "và đủ nước. Điều chỉnh theo bệnh nền và đánh giá của chuyên gia dinh dưỡng.";
        }
        else if (safety.WantsMuscleGain && safety.WantsFatLoss)
        {
            var minimumProtein = Math.Round(weightKg * 1.6m);
            var maximumProtein = Math.Round(weightKg * 2.2m);
            result["nutritionGuidance"] =
                $"Duy trì năng lượng hoặc thâm hụt nhẹ 100-250 kcal/ngày; protein {minimumProtein:0}-{maximumProtein:0} g/ngày " +
                "(1,6-2,2 g/kg), ưu tiên thực phẩm ít chế biến và điều chỉnh theo xu hướng vòng eo, sức mạnh và cân nặng.";
        }
        else if (safety.WantsFatLoss)
        {
            result["nutritionGuidance"] =
                "Thâm hụt 250-400 kcal/ngày, protein 1,6-2,2 g/kg/ngày và theo dõi sức mạnh để hạn chế mất khối lượng nạc.";
        }
        else if (safety.WantsMuscleGain)
        {
            result["nutritionGuidance"] =
                "Thặng dư nhẹ 150-300 kcal/ngày, protein 1,6-2,0 g/kg/ngày; chỉ tăng năng lượng khi cân nặng và sức mạnh không tiến triển.";
        }
        else
        {
            result["nutritionGuidance"] =
                "Duy trì năng lượng, protein 1,4-1,8 g/kg/ngày và phân bổ carbohydrate quanh buổi tập để hỗ trợ hiệu suất.";
        }

        if (safety.WantsEndurance && !safety.IsUnderweight && !safety.HasHypertension)
            result["heartRateZone"] = safety.EffectiveLevel.Equals("Beginner", StringComparison.OrdinalIgnoreCase)
                ? "Zone 2 (60-70% HRmax) chủ đạo • thêm các đoạn Zone 3 ngắn khi đã dung nạp tốt"
                : "Zone 2 (60-70% HRmax) xây nền • 1 buổi/tuần interval Zone 3-4 (70-85% HRmax) để phát triển sức bền";

        if (safety.HasHypertension)
            result["heartRateZone"] =
                "Zone 1-2 • không vượt 75% HRmax • dừng tập khi chóng mặt, đau ngực hoặc khó thở bất thường";
    }

    private static void RequireString(JsonObject value, string key)
    {
        if (value[key] is not JsonValue item || !item.TryGetValue<string>(out var text) || string.IsNullOrWhiteSpace(text))
            throw new JsonException();
    }

    private static void RequireStringArray(JsonObject value, string key)
    {
        if (value[key] is not JsonArray array || array.Any(item => item is not JsonValue scalar ||
                !scalar.TryGetValue<string>(out var text) || string.IsNullOrWhiteSpace(text)))
            throw new JsonException();
    }

    private static InvalidOperationException TaggedFailure(
        string message,
        int statusCode,
        string code,
        string proposedHandling)
    {
        var exception = new InvalidOperationException(message);
        exception.Data["StatusCode"] = statusCode;
        exception.Data["Code"] = code;
        exception.Data["ProposedHandling"] = proposedHandling;
        return exception;
    }
}
