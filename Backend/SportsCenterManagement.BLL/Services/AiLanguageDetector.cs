using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace SportsCenterManagement.BLL.Services;

/// <summary>
/// Lightweight language guess for a member's chat message, so the reply language is an explicit
/// instruction instead of something the model has to infer against a Vietnamese prompt and history.
/// Returns null when the text gives no clear signal.
/// </summary>
public static class AiLanguageDetector
{
    private static readonly (Regex Script, string Language)[] Scripts =
    [
        (new(@"[぀-ヿ]"), "Japanese"), // Kana first: Japanese also uses Han characters.
        (new(@"[가-힯]"), "Korean"),
        (new(@"[一-鿿]"), "Chinese"),
        (new(@"[฀-๿]"), "Thai"),
        (new(@"[Ѐ-ӿ]"), "Russian"),
        (new(@"[؀-ۿ]"), "Arabic"),
    ];

    private static readonly Regex VietnameseLetters = new(
        "[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]", RegexOptions.IgnoreCase);
    private static readonly Regex Words = new(@"[\p{L}']+");

    private static readonly HashSet<string> English = new(StringComparer.Ordinal)
    {
        "the", "a", "an", "is", "are", "am", "was", "do", "does", "did", "can", "could", "would", "will", "you", "your",
        "i", "me", "my", "we", "our", "what", "when", "where", "which", "who", "how", "much", "many", "please", "help",
        "want", "need", "book", "slot", "class", "classes", "schedule", "price", "prices", "package", "packages",
        "open", "opening", "hours", "time", "today", "tomorrow", "tomorow", "tonight", "week", "next", "this", "there",
        "any", "have", "has", "in", "on", "at", "for", "to", "of", "with", "and", "or", "about", "hello", "hi", "thanks",
        "thank", "court", "pool", "swimming", "gym", "coach", "trainer", "membership"
    };

    private static readonly HashSet<string> VietnameseUnaccented = new(StringComparer.Ordinal)
    {
        "toi", "ban", "lop", "hom", "nay", "mai", "gio", "co", "khong", "ko", "gi", "nao", "may", "cho", "la", "di",
        "tap", "gia", "goi", "lich", "ngay", "tuan", "thang", "san", "phong", "trung", "tam", "mo", "cua", "dang", "ky",
        "duoc", "minh", "em", "anh", "chi", "oi", "a", "nhe", "vay", "sao", "the", "nhieu", "bao", "luc"
    };

    private static readonly HashSet<string> French = new(StringComparer.Ordinal)
        { "bonjour", "merci", "je", "vous", "est", "cours", "quel", "quelle", "demain", "aujourd'hui", "prix", "horaire", "salut", "les", "des" };
    private static readonly HashSet<string> Spanish = new(StringComparer.Ordinal)
        { "hola", "gracias", "clase", "clases", "cuanto", "cuánto", "donde", "dónde", "quiero", "mañana", "hoy", "precio", "horario", "por", "favor" };

    public static string? Detect(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;
        foreach (var (script, language) in Scripts)
            if (script.IsMatch(text)) return language;
        if (VietnameseLetters.IsMatch(text)) return "Vietnamese";

        var words = Words.Matches(text.ToLowerInvariant()).Select(match => match.Value).ToList();
        if (words.Count == 0) return null;
        var unaccented = words.Select(StripMarks).ToList();
        var scores = new (string Language, int Score)[]
        {
            ("English", words.Count(English.Contains)),
            ("Vietnamese", unaccented.Count(VietnameseUnaccented.Contains)),
            ("French", words.Count(French.Contains)),
            ("Spanish", words.Count(Spanish.Contains)),
        }.OrderByDescending(item => item.Score).ToArray();
        // Require a clear winner; a tie (e.g. "a", "the" exist in both lists) means "let the model decide".
        return scores[0].Score > 0 && scores[0].Score > scores[1].Score ? scores[0].Language : null;
    }

    private static string StripMarks(string word) => string.Concat(word.Normalize(NormalizationForm.FormD)
        .Where(character => CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark))
        .Replace('đ', 'd');
}
