/**
 * English version of the homepage content.
 *
 * Managers write the homepage in Vietnamese. The English page shows, for every Vietnamese text:
 *   1. the English text saved in the editor ("Bản tiếng Anh" tab), stored in content.translations
 *      as { "<Vietnamese text>": "<English text>" };
 *   2. otherwise a built-in translation of the standard texts below;
 *   3. otherwise the Vietnamese text itself, never an invented English sentence.
 * Because translations are keyed by the Vietnamese text, editing that text makes the old English
 * version stop applying, and the editor lists it again as "not translated".
 */
import {
  AMENITY_MAP, COURSE_HIGHLIGHT_MAP, FACILITY_BADGE_MAP, FACILITY_CATEGORY_MAP, FACILITY_DESCRIPTION_MAP,
  FACILITY_HIGHLIGHTS_MAP, FACILITY_NAME_MAP, LOCATION_MAP, METRIC_LABEL_MAP, METRIC_VALUE_MAP,
  SERVICE_AMENITY_MAP, SPEC_LABEL_MAP, SPEC_VALUE_MAP, SPORT_NAME_MAP, ZONE_ITEM_MAP, ZONE_NAME_MAP
} from './i18nHelper.js';

export const TRANSLATIONS_SECTION = 'translations';

// Standard texts of the current homepage. Managers can override any of them in the editor.
export const LANDING_TEXT_EN = {
  // Hero
  'TRUNG TÂM THỂ THAO': 'SPORTS CENTER',
  'ĐĂNG KÝ HỘI VIÊN': 'BECOME A MEMBER',
  'ĐĂNG KÝ HỘI VIÊN MỚI': 'BECOME A MEMBER',
  'KHÁM PHÁ BỘ MÔN': 'EXPLORE SPORTS',
  'KHÁM PHÁ MÔN HỌC': 'EXPLORE SPORTS',
  // About
  'VỀ TRUNG TÂM': 'ABOUT THE CENTER',
  'Thông tin trung tâm': 'About the center',
  // Sports
  'BỘ MÔN': 'SPORTS',
  'Bộ môn thể thao': 'Sports',
  'Chương trình đào tạo chuyên nghiệp': 'Training programs',
  'Bơi lội': 'Swimming',
  'Cầu lông': 'Badminton',
  'Bóng đá': 'Football',
  'Bóng rổ': 'Basketball',
  'Bóng bàn': 'Table tennis',
  'Bóng chuyền': 'Volleyball',
  'Chạy bộ': 'Running',
  'Điền kinh': 'Athletics',
  'Võ thuật': 'Martial arts',
  'Bể bơi': 'Swimming pool',
  'Sân cầu lông': 'Badminton court',
  'Sân bóng đá': 'Football pitch',
  'Không gian Yoga': 'Yoga studio',
  'Phòng Yoga': 'Yoga studio',
  'Phòng Gym': 'Gym',
  'Sân Tennis': 'Tennis court',
  'Sân bóng rổ': 'Basketball court',
  'Khu bóng bàn': 'Table tennis area',
  'Khu tập Boxing': 'Boxing area',
  'Đường chạy': 'Running track',
  'Học bơi từ cơ bản đến nâng cao với 4 kiểu ếch, sải, ngửa, bướm. Tăng sức bền tim phổi, toàn thân săn chắc, phù hợp mọi lứa tuổi.':
    'Learn to swim from beginner to advanced in all four strokes: breaststroke, freestyle, backstroke and butterfly. Builds heart and lung endurance and tones the whole body. Suitable for all ages.',
  'Luyện kỹ thuật cầm vợt, bộ pháp di chuyển, đập cầu và chiến thuật đánh đơn, đánh đôi. Tăng phản xạ và sự nhanh nhẹn.':
    'Practise grip, footwork, smashes and singles and doubles tactics. Sharpens reflexes and agility.',
  'Rèn kỹ thuật dẫn bóng, chuyền, sút và phối hợp đồng đội trên sân cỏ nhân tạo. Nâng cao thể lực và tinh thần tập thể.':
    'Work on dribbling, passing, shooting and teamwork on artificial turf. Builds fitness and team spirit.',
  'Yoga và Pilates giúp tăng độ dẻo dai, cải thiện tư thế, siết cơ trung tâm và giảm căng thẳng sau giờ làm việc.':
    'Yoga and Pilates improve flexibility and posture, strengthen your core and help you unwind after work.',
  'Tập tạ và thể lực theo giáo án cá nhân: tăng cơ, giảm mỡ, cải thiện sức mạnh và vóc dáng cùng huấn luyện viên kèm sát.':
    'Weight and fitness training on a personal plan: build muscle, lose fat and get stronger, with close support from a coach.',
  'Học kỹ thuật forehand, backhand, giao bóng và di chuyển trên sân. Tăng sức bền, phản xạ và tư duy chiến thuật.':
    'Learn the forehand, backhand, serve and court movement. Builds endurance, reflexes and tactical thinking.',
  'Luyện dẫn bóng, ném rổ, phòng thủ và chiến thuật đồng đội. Phát triển sức bật, sự linh hoạt và khả năng phối hợp.':
    'Practise dribbling, shooting, defence and team tactics. Develops jumping power, agility and coordination.',
  'Rèn kỹ thuật giao bóng, giật, cắt bóng và phản xạ nhanh. Môn thể thao nhẹ nhàng giúp tăng tập trung, hợp mọi lứa tuổi.':
    'Train your serve, topspin, backspin and quick reflexes. A low-impact sport that improves focus, suitable for all ages.',
  'Boxing và võ thuật đối kháng: rèn đòn tay, đòn chân, phản xạ và kỹ năng tự vệ. Đốt calo mạnh, giải tỏa căng thẳng.':
    'Boxing and combat sports: train punches, kicks, reflexes and self-defence. Burns plenty of calories and relieves stress.',
  'Chạy bộ theo giáo án: khởi động đúng cách, kỹ thuật bước chạy, nhịp thở và tăng dần cự ly. Cải thiện sức bền tim mạch.':
    'Running on a structured plan: proper warm-up, running form, breathing and gradually longer distances. Improves cardiovascular endurance.',
  // Facilities
  'PHÒNG VÀ SÂN TẬP': 'ROOMS AND COURTS',
  'Cơ sở vật chất': 'Facilities',
  'Thể thao': 'Sports',
  'Tập luyện': 'Training',
  'Phòng / sân': 'Room / court',
  'Bể bơi trong nhà chia làn riêng cho người mới học và người bơi luyện tập. Nước được lọc và kiểm tra hằng ngày, có khu tắm tráng và thay đồ.':
    'Indoor pool with separate lanes for beginners and lap swimmers. The water is filtered and tested daily, with showers and changing rooms.',
  'Sân cầu lông trong nhà, thảm chuyên dụng chống trơn, trần cao và ánh sáng chống chói, phù hợp cả tập luyện lẫn thi đấu giao hữu.':
    'Indoor badminton courts with non-slip sports flooring, a high ceiling and glare-free lighting, suited to both training and friendly matches.',
  'Sân cỏ nhân tạo có lớp hạt cao su giảm chấn, thoát nước nhanh sau mưa và hệ thống đèn chiếu sáng cho các buổi đá buổi tối.':
    'Artificial turf pitch with a shock-absorbing rubber infill, quick drainage after rain and floodlights for evening games.',
  'Phòng tập yên tĩnh, thoáng mát với sàn gỗ và gương lớn, có sẵn thảm, gạch và dây hỗ trợ cho các lớp Yoga và Pilates.':
    'A quiet, airy studio with a wooden floor and large mirrors. Mats, blocks and straps are provided for Yoga and Pilates classes.',
  'Khu tập có máy cardio, máy tập sức mạnh và khu tạ tự do, không gian rộng thoáng cho cả người mới bắt đầu lẫn người tập lâu năm.':
    'Cardio machines, strength machines and a free-weights area in a spacious room for both beginners and experienced members.',
  'Sân tennis mặt cứng sơn chuyên dụng, kẻ vạch theo chuẩn thi đấu, có lưới chắn bóng xung quanh và đèn chiếu sáng để chơi buổi tối.':
    'Hard tennis court with a sports coating, regulation lines, perimeter fencing and lights for evening play.',
  'Sân bóng rổ mặt sơn chống trơn, trụ rổ chắc chắn, đủ rộng cho tập kỹ năng, đấu tập theo đội và các giải phong trào.':
    'Basketball court with a non-slip coating and sturdy hoops, with room for skills training, team scrimmages and amateur tournaments.',
  'Khu bóng bàn trong nhà với bàn thi đấu tiêu chuẩn, ánh sáng đều không chói và khoảng trống rộng quanh mỗi bàn để di chuyển.':
    'Indoor table tennis area with standard match tables, even glare-free lighting and plenty of space around each table.',
  'Khu tập đối kháng có võ đài, bao cát, sàn đệm giảm chấn và đồ bảo hộ, phục vụ các lớp Boxing, Kickboxing và võ thuật.':
    'Combat training area with a ring, heavy bags, padded flooring and protective gear for Boxing, Kickboxing and martial arts classes.',
  'Đường chạy bề mặt êm, có vạch chia làn cùng khu khởi động và giãn cơ, phù hợp chạy rèn sức bền và các bài tập tốc độ.':
    'Cushioned running track with marked lanes and a warm-up and stretching area, suited to endurance runs and speed work.',
  // Training areas
  'KHÔNG GIAN TẬP LUYỆN': 'TRAINING SPACES',
  'Khu vực tập luyện': 'Training areas',
  'Sơ đồ khuôn viên': 'Campus map',
  // Contact and footer
  'LIÊN HỆ TRUNG TÂM': 'CONTACT US',
  'Liên hệ tư vấn': 'Get in touch',
  'Xem cơ sở vật chất': 'View facilities',
  'Xem gói tập': 'View packages',
  'Chưa cập nhật': 'Not updated',
  // Login page banner
  'Sân tập mở cửa 24/7': 'Open 24/7',
  'Khởi đầu bứt phá': 'Make a strong start',
  'Tập luyện hôm nay, bứt phá mỗi ngày.': 'Train today, get better every day.',
  'Hành trình mới, phiên bản khỏe hơn.': 'A new start, a healthier you.',
  'Hệ sinh thái thể thao đa năng với 9 cụm sân thi đấu chuẩn Olympic. Đặt sân siêu tốc, cá nhân hóa lịch tập và theo dõi chỉ số InBody cùng huấn luyện viên hàng đầu.':
    'A multi-sport center with 9 Olympic-standard court areas. Book courts quickly, personalise your training schedule and track your InBody results with top coaches.',
  'Đặt chỗ trong 30s': 'Book in 30 seconds',
  'Giữ sân & lớp học 7 ngày': 'Hold courts and classes for 7 days',
  'Chuẩn Olympic 5★': 'Olympic standard 5★',
  'Hệ thống sân bãi cao cấp': 'High-quality courts and facilities',
  'Bộ môn thi đấu': 'Sports',
  'Khu tập luyện': 'Training areas',
  'Hội viên active': 'Active members'
};

// Exact-match tables from the older dictionary; the texts above take precedence.
const LEGACY_TABLES = [
  SPORT_NAME_MAP, FACILITY_NAME_MAP, FACILITY_CATEGORY_MAP, FACILITY_BADGE_MAP, LOCATION_MAP,
  FACILITY_HIGHLIGHTS_MAP, FACILITY_DESCRIPTION_MAP, SPEC_LABEL_MAP, SPEC_VALUE_MAP, AMENITY_MAP,
  METRIC_LABEL_MAP, METRIC_VALUE_MAP, ZONE_NAME_MAP, ZONE_ITEM_MAP, SERVICE_AMENITY_MAP, COURSE_HIGHLIGHT_MAP
];

const foldKey = (text) => String(text).trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');

const BUILT_IN = (() => {
  const index = new Map();
  for (const table of [...LEGACY_TABLES].reverse().concat([LANDING_TEXT_EN])) {
    for (const [vi, en] of Object.entries(table || {})) {
      if (typeof en === 'string' && en.trim()) index.set(foldKey(vi), en);
    }
  }
  return index;
})();

// Field names that hold links, ids, codes or contact details rather than words to translate.
const NON_TEXT_KEY = /^(id|sportId|facilityId|category|catalogSource|icon|color|image|secondaryImage|posterUrl|imageUrl|videoUrl|model3dUrl|href|url|number|suffix|prefix|contactEmail|contactPhone|contactZaloPhone)$|(Id|Url|Link)$/;

const VIETNAMESE = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

/** True for text a visitor reads in Vietnamese (has Vietnamese letters). */
export function needsEnglish(text) {
  return typeof text === 'string' && VIETNAMESE.test(text);
}

const isUpperCaseText = (text) => text === text.toLocaleUpperCase('vi') && text !== text.toLocaleLowerCase('vi');

/** Built-in English for a standard text, keeping an all-caps source in capitals. */
export function builtInEnglish(text) {
  if (typeof text !== 'string' || !text.trim()) return '';
  const english = BUILT_IN.get(foldKey(text));
  if (!english) return '';
  return isUpperCaseText(text.trim()) ? english.toLocaleUpperCase('en') : english;
}

/** English shown for one Vietnamese text: the editor's version first, then the built-in one. */
export function englishFor(text, translations) {
  if (typeof text !== 'string') return text;
  const saved = translations && typeof translations === 'object' ? (translations[text] ?? translations[text.trim()]) : '';
  if (typeof saved === 'string' && saved.trim()) return saved.trim();
  return builtInEnglish(text) || text;
}

function mapTexts(value, key, visit) {
  if (typeof value === 'string') return key && NON_TEXT_KEY.test(key) ? value : visit(value);
  if (Array.isArray(value)) return value.map(item => mapTexts(item, key, visit));
  if (value && typeof value === 'object') {
    const result = {};
    for (const [childKey, child] of Object.entries(value)) {
      result[childKey] = childKey === TRANSLATIONS_SECTION ? child : mapTexts(child, childKey, visit);
    }
    return result;
  }
  return value;
}

/** Homepage content as the visitor reads it in the chosen language. */
export function localizeLandingContent(content, isEn) {
  if (!content || !isEn) return content;
  const translations = content[TRANSLATIONS_SECTION];
  return mapTexts(content, '', text => needsEnglish(text) ? englishFor(text, translations) : text);
}

/**
 * Every Vietnamese text of the homepage, once each, with the section it first appears in.
 * Used by the editor to list what needs an English version.
 */
export function collectLandingTexts(content) {
  const found = new Map();
  for (const [section, value] of Object.entries(content || {})) {
    if (section === TRANSLATIONS_SECTION) continue;
    mapTexts(value, section, text => {
      const trimmed = text.trim();
      if (needsEnglish(trimmed) && !found.has(trimmed)) found.set(trimmed, { text: trimmed, section });
      return text;
    });
  }
  return [...found.values()];
}

/** Drops English versions of texts that are no longer on the page, and empty ones. */
export function pruneTranslations(content) {
  const translations = content?.[TRANSLATIONS_SECTION];
  if (!translations || typeof translations !== 'object') return content;
  const live = new Set(collectLandingTexts(content).map(item => item.text));
  const kept = {};
  for (const [vi, en] of Object.entries(translations)) {
    if (live.has(vi.trim()) && typeof en === 'string' && en.trim()) kept[vi.trim()] = en.trim();
  }
  return { ...content, [TRANSLATIONS_SECTION]: kept };
}
