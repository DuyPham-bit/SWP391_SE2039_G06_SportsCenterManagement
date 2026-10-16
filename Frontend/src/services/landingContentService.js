 /**
 * SCMS Dynamic Content Management Service
 * Dịch vụ Quản lý Nội dung Động Trang Chủ (Landing Page)
 * Cho phép Manager chủ động thay đổi nội dung, thẻ môn học, thẻ cụm sân bãi và đa phương tiện.
 */

import { apiRequest } from './http.js';
import { SCMS_FACILITIES } from './facilitiesCatalog.js';
import { SUPPORTED_SPORTS } from './sportsCatalog.js';

const LEGACY_STORAGE_KEY = 'SCMS_DYNAMIC_LANDING_CONTENT_V1';
const PREVIEW_STORAGE_KEY = 'SCMS_LANDING_PREVIEW_V1';
const UPDATE_STORAGE_KEY = 'SCMS_LANDING_CONTENT_UPDATED';
export const LANDING_CONTENT_CHANGE_EVENT = 'SCMS_LANDING_CONTENT_CHANGED';

// Dữ liệu mặc định ban đầu bám sát 100% các thành phần trong 8 ảnh chụp screenshot
export const DEFAULT_LANDING_CONTENT = {
  // Ảnh 1: Hero Banner Section
  heroBanner: {
    badge: 'TRUNG TÂM THỂ THAO ĐẲNG CẤP QUỐC TẾ SCMS',
    title: 'SHAPING RESILIENCE THROUGH SPORTS',
    description: 'Phát triển thể lực, tôi luyện ý chí và bứt phá mọi giới hạn cùng hệ thống 9 cụm sân, phòng tập phục vụ 9 bộ môn thể thao.',
    videoUrl: './hero-video.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=75&w=1280&auto=format&fit=crop',
    primaryCtaText: 'ĐĂNG KÝ HỘI VIÊN MỚI',
    primaryCtaLink: '#/register',
    secondaryCtaText: 'KHÁM PHÁ MÔN HỌC',
    secondaryCtaLink: '#khoa-hoc',
    metrics: [
      { id: 'm1', value: '100%', label: 'Chuẩn Thi Đấu' },
      { id: 'm2', value: '24/7', label: 'Lọc Khí & Điều Hòa' },
      { id: 'm3', value: '50+', label: 'Chuyên Gia Huấn Luyện' },
      { id: 'm4', value: '5.0 ★', label: 'Đánh Giá Hội Viên' }
    ]
  },

  // Ảnh 2: Why Choose SCMS (Về chúng tôi & Chỉ số)
  whyUs: {
    badge: 'TẠI SAO NÊN CHỌN SCMS',
    title: 'Nền Tảng Vững Chắc Cho Hành Trình Chinh Phục Đỉnh Cao',
    description: 'SCMS tự hào là tổ hợp thể thao đa năng chuẩn quốc tế, mang đến không gian tập luyện chuyên nghiệp, đội ngũ huấn luyện viên chứng chỉ AFC & NASM cùng quy trình cá nhân hóa toàn diện cho từng học viên.',
    features: [
      {
        id: 'f1',
        icon: 'workspace_premium',
        title: 'Huấn luyện viên đạt chuẩn quốc tế',
        description: '100% đội ngũ huấn luyện sở hữu chứng chỉ AFC, FIBA, BWF hoặc NASM với kinh nghiệm đào tạo thực chiến.'
      },
      {
        id: 'f2',
        icon: 'tune',
        title: 'Giáo án cá nhân hóa theo từng thể trạng',
        description: 'Đo lường chỉ số InBody định kỳ, thiết lập biểu đồ vận động riêng biệt và AI Workout Recommender theo mục tiêu.'
      },
      {
        id: 'f3',
        icon: 'local_fire_department',
        title: 'Môi trường năng động và truyền cảm hứng',
        description: 'Cộng đồng hội viên văn minh, các giải đấu nội bộ định kỳ và hệ thống sân bãi đạt chuẩn thi đấu Olympic.'
      }
    ],
    stats: [
      {
        id: 's1',
        number: 9,
        suffix: '',
        title: 'CỤM SÂN & PHÒNG TẬP',
        subtitle: 'Tiêu chuẩn thi đấu chuyên nghiệp',
        icon: 'stadium',
        isAutoCount: false
      },
      {
        id: 's2',
        number: 9,
        suffix: '',
        title: 'MÔN THỂ THAO',
        subtitle: 'Đa dạng lựa chọn cho mọi lứa tuổi',
        icon: 'sports_kabaddi',
        isAutoCount: false
      },
      {
        id: 's3',
        number: 400,
        suffix: '+',
        title: 'HỌC VIÊN',
        subtitle: 'Thường xuyên rèn luyện mỗi ngày',
        icon: 'diversity_3',
        isAutoCount: false
      },
      {
        id: 's4',
        number: 13000,
        suffix: ' m²',
        title: 'DIỆN TÍCH',
        subtitle: 'Tổ hợp liên hợp khép kín hiện đại',
        icon: 'domain',
        formatThousands: true,
        isAutoCount: false
      }
    ],
    trustBanner: {
      title: 'Bảo hiểm rèn luyện toàn diện',
      description: 'Tất cả hội viên được trang bị y tế sơ cấp cứu tại sân 24/7',
      certificate: 'ISO 9001'
    }
  },

  // Ảnh 3 & 4: Danh mục và các thẻ Môn học (Courses)
  coursesSection: {
    badge: 'CHƯƠNG TRÌNH ĐÀO TẠO CHUYÊN NGHIỆP',
    title: 'Khóa Học Thể Thao Đa Năng',
    description: 'Thiết kế bài bản từ nền tảng đến chuyên sâu thi đấu, đáp ứng mọi nhu cầu rèn luyện thể chất chuẩn Olympic cùng đội ngũ huấn luyện viên kiện tướng quốc gia.',
    trustBadges: [
      { id: 'tb1', icon: 'military_tech', text: 'Chuẩn Đào Tạo Olympic' },
      { id: 'tb2', icon: 'verified', text: '100% HLV Chứng Chỉ Quốc Tế' },
      { id: 'tb3', icon: 'shield', text: 'Bảo Hiểm & Y Tế 24/7' }
    ],
    // Danh sách các thẻ môn học có thể chủ động sửa đổi nội dung, upload ảnh hoặc ẩn đi
    sportsList: [
      {
        id: 'boi-loi',
        name: 'Bơi lội',
        icon: 'pool',
        category: 'Sức bền & Tĩnh tâm',
        facilityId: 'room-01',
        venue: 'Bể Bơi 4 Mùa Nước Ấm 25m',
        location: 'Khu A • Tầng 1',
        rating: '4.9',
        ratingCount: '128',
        level: 'Mọi lứa tuổi • Nhập môn đến Thi đấu',
        coach: 'Kiện tướng Bơi lội Quốc Gia',
        schedule: '06:00 - 21:00',
        highlight: 'Bể bơi 25m tiêu chuẩn tập luyện, 5 làn bơi nước ấm 4 mùa, lọc ozone an toàn tuyệt đối.',
        price: 'Từ 50.000đ/buổi',
        capacity: '25 - 35 người/ca',
        badges: ['SỨC BỀN', 'NƯỚC ẤM 4 MÙA'],
        image: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?q=80&w=1200&auto=format&fit=crop',
        isVisible: true
      },
      {
        id: 'gym-fitness',
        name: 'Gym & Fitness',
        icon: 'fitness_center',
        category: 'Sức bền & Tĩnh tâm',
        facilityId: 'room-08',
        venue: 'Phòng Tập Gym & Fitness',
        location: 'Khu A • Tầng 2',
        rating: '5.0',
        ratingCount: '240',
        level: 'Tăng cơ • Giảm mỡ • Thể lực toàn diện',
        coach: 'Master Trainer & Chuyên gia Thể Hình',
        schedule: '05:30 - 21:30',
        highlight: 'Không gian 250m² trang bị giàn máy kháng lực Matrix, dàn tạ tự do đa dạng và máy đo InBody 770.',
        price: 'Từ 30.000đ/ngày',
        capacity: '30 - 45 hội viên/ca',
        badges: ['SỨC BỀN', 'MÁY TẬP ĐẦY ĐỦ'],
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop',
        isVisible: true
      },
      {
        id: 'yoga-pilates',
        name: 'Yoga & Pilates',
        icon: 'self_improvement',
        category: 'Sức bền & Tĩnh tâm',
        facilityId: 'room-09',
        venue: 'Phòng Tập Yoga & Pilates',
        location: 'Khu C • Tầng 3',
        rating: '4.9',
        ratingCount: '165',
        level: 'Tĩnh tâm • Dẻo dai • Cân bằng cột sống',
        coach: 'Giảng viên Yoga Alliance Quốc Tế',
        schedule: '06:00 - 21:00',
        highlight: 'Không gian yên tĩnh sàn gỗ tự nhiên, trang bị máy Pilates Reformer và thảm tập cao cấp lớp nhóm nhỏ.',
        price: 'Từ 50.000đ/buổi',
        capacity: '15 - 20 học viên/lớp',
        badges: ['SỨC BỀN', 'THƯ GIÃN & TĨNH TÂM'],
        image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=1200&auto=format&fit=crop',
        isVisible: true
      },
      {
        id: 'vo-thuat',
        name: 'Võ thuật & Boxing',
        icon: 'sports_mma',
        category: 'Thể thao đối kháng',
        facilityId: 'room-07',
        venue: 'Phòng Tập Võ Thuật & Boxing',
        location: 'Khu C • Tầng 1',
        rating: '4.9',
        ratingCount: '98',
        level: 'Boxing • Muay Thai • Vovinam • Tự vệ',
        coach: 'Võ sư Đai Đen & HLV Đội tuyển',
        schedule: '06:00 - 21:30',
        highlight: 'Sàn tập trải thảm xốp EVA dày 3cm chống trơn, dàn bao cát thi đấu kiên cố và trang bị bảo hộ đầy đủ.',
        price: 'Từ 300.000đ/tháng',
        capacity: '15 - 25 võ sinh/ca',
        badges: ['ĐỐI KHÁNG', 'ĐẤU TẬP CHUẨN'],
        image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=1200&auto=format&fit=crop',
        isVisible: true
      },
      {
        id: 'bong-da',
        name: 'Bóng đá',
        icon: 'sports_soccer',
        category: 'Bóng & Vợt',
        facilityId: 'room-02',
        venue: 'Sân Bóng Đá Cỏ Nhân Tạo',
        location: 'Khu Ngoài trời',
        rating: '4.8',
        ratingCount: '310',
        level: 'Sân 5 & Sân 7 • Phong trào & Năng khiếu',
        coach: 'Cựu Cầu Thủ Chuyên Nghiệp',
        schedule: '06:00 - 22:30',
        highlight: 'Mặt cỏ nhân tạo dày êm chân rải hạt cao su giảm chấn, thoát nước nhanh và dàn đèn LED cao áp đêm.',
        price: 'Từ 180.000đ/giờ',
        capacity: '10 - 20 cầu thủ/sân',
        badges: ['BÓNG & VỢT', 'CỎ TIÊU CHUẨN'],
        image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop',
        isVisible: true
      },
      {
        id: 'cau-long',
        name: 'Cầu lông',
        icon: 'sports_tennis',
        category: 'Bóng & Vợt',
        facilityId: 'room-03',
        venue: 'Cụm Sân Cầu Lông Thảm Chống Trượt',
        location: 'Khu B • Tầng 2',
        rating: '4.9',
        ratingCount: '280',
        level: 'Kỹ thuật • Tốc độ • Đánh đơn & Đánh đôi',
        coach: 'HLV Liên đoàn Cầu Lông Cấp 1',
        schedule: '06:00 - 22:00',
        highlight: '4 sân cầu lông trong nhà với thảm PVC vân kim cương chống trơn, trần 8m không gió tạt, đèn chống lóa.',
        price: 'Từ 60.000đ/giờ',
        capacity: '16 - 24 người chơi',
        badges: ['BÓNG & VỢT', 'THẢM CHUYÊN DỤNG'],
        image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop',
        isVisible: true
      },
      {
        id: 'bong-ro',
        name: 'Bóng rổ',
        icon: 'sports_basketball',
        category: 'Bóng & Vợt',
        facilityId: 'room-05',
        venue: 'Sân Bóng Rổ Tiêu Chuẩn Phong Trào',
        location: 'Khu B • Tầng 1',
        rating: '4.8',
        ratingCount: '190',
        level: 'Dẫn bóng • Sức bật • Chiến thuật nhóm',
        coach: 'VĐV Bóng Rổ Giải Quốc Gia',
        schedule: '06:00 - 22:00',
        highlight: 'Mặt sân sơn thể thao Acrylic chống trượt, trụ rổ kiên cố bảng kính cường lực độ nảy tốt, mái che mát.',
        price: 'Từ 80.000đ/nửa sân',
        capacity: '15 - 20 người chơi',
        badges: ['BÓNG & VỢT', 'MÁI CHE MÁT'],
        image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=1200&auto=format&fit=crop',
        isVisible: true
      },
      {
        id: 'bong-ban',
        name: 'Bóng bàn',
        icon: 'sports_score',
        category: 'Bóng & Vợt',
        facilityId: 'room-04',
        venue: 'Khu Bóng Bàn Trong Nhà',
        location: 'Khu B • Tầng 3',
        rating: '4.8',
        ratingCount: '115',
        level: 'Phản xạ • Kỹ thuật giật bóng & cắt bóng',
        coach: 'Kiện tướng Bóng Bàn Quốc Gia',
        schedule: '06:00 - 22:00',
        highlight: '4 bàn thi đấu đạt chuẩn quốc tế, ánh sáng đều hạn chế chói mắt, khoảng trống di chuyển an toàn.',
        price: 'Từ 40.000đ/giờ',
        capacity: '8 - 16 người chơi',
        badges: ['BÓNG & VỢT', 'PHÒNG MÁY LẠNH'],
        image: 'https://images.unsplash.com/photo-1708268411988-d30e0e1eef0c?q=80&w=1200&auto=format&fit=crop',
        isVisible: true
      },
      {
        id: 'pickleball',
        name: 'Pickleball',
        icon: 'sports_tennis',
        category: 'Bóng & Vợt',
        facilityId: 'room-06',
        venue: 'Cụm Sân Pickleball Ngoài Trời',
        location: 'Khu Ngoài trời',
        rating: '5.0',
        ratingCount: '210',
        level: 'Nhập môn • Dinking • Giao lưu phong trào',
        coach: 'HLV Chứng chỉ Pickleball Pro',
        schedule: '05:30 - 22:00',
        highlight: 'Cụm 4 sân ngoài trời mới nhất, mặt sơn Acrylic chống trơn, vạch bếp chuẩn và rào chắn bóng kiên cố.',
        price: 'Từ 50.000đ/giờ',
        capacity: '8 - 16 người chơi',
        badges: ['BÓNG & VỢT', 'BỘ MÔN HOT 2026'],
        image: 'https://images.unsplash.com/photo-1693142517898-2f986215e412?q=80&w=1200&auto=format&fit=crop',
        isVisible: true
      }
    ]
  },

  // Ảnh 5 & 6: Cơ sở vật chất & Thẻ Cụm Sân (Facilities)
  facilitiesSection: {
    badge: 'HẠ TẦNG THỂ THAO TIÊU CHUẨN',
    title: 'HỆ THỐNG CƠ SỞ VẬT CHẤT TIỆN NGHI & CHẤT LƯỢNG',
    description: 'Khu liên hợp thể thao rộng rãi, sạch đẹp với 9 cụm sân bãi và phòng tập dành cho bơi lội, Gym & Fitness, Yoga & Pilates, Võ thuật & Boxing, bóng đá, cầu lông, bóng rổ, bóng bàn và Pickleball. Phục vụ nhu cầu học tập, rèn luyện sức khỏe, sinh hoạt câu lạc bộ và thi đấu phong trào.',
    metrics: [
      { id: 'fm1', icon: 'domain', value: '3.500m²', label: 'TỔNG DIỆN TÍCH MẶT SÀN' },
      { id: 'fm2', icon: 'verified', value: '9 Khu Vực', label: 'ĐA DẠNG MÔN TẬP LUYỆN' },
      { id: 'fm3', icon: 'groups', value: '600+', label: 'LƯỢT TẬP LUYỆN/NGÀY' },
      { id: 'fm4', icon: 'cleaning_services', value: '100%', label: 'VỆ SINH & BẢO TRÌ ĐỊNH KỲ' }
    ],
    // Danh sách các thẻ cụm sân có thể sửa đổi, upload ảnh hoặc ẩn đi
    facilitiesList: SCMS_FACILITIES.map(fac => ({
      ...fac,
      isVisible: true
    }))
  },

  // Ảnh 7: Sơ đồ các khu vực tập luyện & Dịch vụ tiện ích (Campus Layout)
  zonesLayout: {
    badge: 'BỐ TRÍ KHÔNG GIAN THUẬN TIỆN',
    title: 'SƠ ĐỒ CÁC KHU VỰC TẬP LUYỆN',
    description: '9 cụm sân bãi và phòng tập được quy hoạch gọn gàng, lối đi thông thoáng, biển báo chỉ dẫn rõ ràng. Hệ thống quầy lễ tân tiếp đón chu đáo và hỗ trợ đặt sân nhanh chóng trực tiếp hoặc online.',
    serviceAmenities: [
      { id: 'sa1', icon: 'badge', text: 'Tủ cất đồ cá nhân có chìa khóa an toàn, thuận tiện sử dụng' },
      { id: 'sa2', icon: 'shower', text: 'Phòng thay đồ và khu vực tắm tráng nóng lạnh sạch sẽ' },
      { id: 'sa3', icon: 'local_cafe', text: 'Quầy căn-tin nước giải khát, nước khoáng phục vụ nhanh' },
      { id: 'sa4', icon: 'medical_services', text: 'Tủ thuốc y tế và dụng cụ sơ cứu ban đầu luôn sẵn sàng' }
    ],
    zones: [
      {
        id: 'zone-a',
        name: 'Khu A: Bơi Lội, Gym & Fitness',
        icon: 'pool',
        color: 'text-red-400',
        items: [
          'Tầng 1: Bể bơi 4 mùa 25m trong nhà nước ấm',
          'Tầng 2: Phòng tập Gym & Fitness',
          'Tầng 3: Khu thay đồ & tắm tráng nóng lạnh'
        ]
      },
      {
        id: 'zone-b',
        name: 'Khu B: Bóng Rổ, Cầu Lông & Bóng Bàn',
        icon: 'sports_basketball',
        color: 'text-blue-400',
        items: [
          'Tầng 1: Sân bóng rổ tiêu chuẩn phong trào có mái che',
          'Tầng 2: Cụm 4 sân cầu lông thảm cao su chống trượt',
          'Tầng 3: Khu bóng bàn trong nhà với 4 bàn tập'
        ]
      },
      {
        id: 'zone-c',
        name: 'Khu C: Võ Thuật, Boxing, Yoga & Pilates',
        icon: 'self_improvement',
        color: 'text-purple-400',
        items: [
          'Tầng 1: Phòng tập võ thuật & Boxing, thảm và bao cát',
          'Tầng 3: Phòng tập Yoga & Pilates, khu thảm và máy Reformer',
          'Tủ đồ cá nhân và khu thay đồ phục vụ học viên'
        ]
      },
      {
        id: 'zone-d',
        name: 'Khu Ngoài Trời: Bóng Đá & Pickleball',
        icon: 'stadium',
        color: 'text-emerald-400',
        items: [
          'Cụm sân bóng đá cỏ nhân tạo (sân 5 và sân 7)',
          'Cụm 4 sân Pickleball, có lưới riêng và vạch khu vực bếp',
          'Dàn đèn pha LED chiếu sáng ban đêm rõ nét'
        ]
      }
    ]
  },

  // Ảnh 8: Banner sự kiện & Thông tin liên hệ Footer
  ctaAndFooter: {
    ctaBadge: 'DÀNH CHO ĐỘI NHÓM & TỔ CHỨC SỰ KIỆN',
    ctaTitle: 'LIÊN HỆ ĐẶT THUÊ SÂN TẬP & TỔ CHỨC GIẢI ĐẤU',
    ctaDescription: 'Bạn đang tìm sân tập thường xuyên cho đội nhóm hoặc cần thuê sân tổ chức giao lưu, giải đấu phong trào? Hãy liên hệ ngay với chúng tôi để chọn khung giờ đẹp và nhận mức giá ưu đãi nhất.',
    ctaPrimaryText: 'ĐẶT THUÊ CỤM SÂN NGAY',
    ctaPrimaryLink: '#co-so-vat-chat',
    ctaSecondaryText: 'XEM BẢNG GIÁ GÓI TẬP',
    ctaSecondaryLink: '#/login',
    brandName: 'SCMS',
    brandTag: 'PRO',
    brandSubtitle: 'Olympic Sports Arena',
    brandDescription: 'Không gian học tập và rèn luyện thể thao dành cho mọi lứa tuổi. Cùng SCMS chọn bộ môn yêu thích, nâng cao thể lực và kết nối cộng đồng.',
    contactAddress: 'Khu công nghệ cao, Thủ Đức, TP. Hồ Chí Minh',
    contactPhone: '0859 859 367',
    contactEmail: 'lienhe@scmsportscenter.vn',
    contactZaloPhone: '',
    contactFacebookUrl: '',
    hoursWeekdays: '05:30 - 22:30',
    hoursWeekend: '06:00 - 22:00',
    hoursHolidays: 'Mở cửa linh hoạt',
    hoursNote: 'Giờ hoạt động cụ thể được ghi trong thông tin từng sân và phòng tập.',
    copyright: '© 2026 SCMS Sports Center. Bảo lưu mọi quyền.'
  }
};

// Published content is cached only in memory. SQL/API remains the source of truth.
let publishedContent = null;
const clone = value => JSON.parse(JSON.stringify(value));

function mergeContent(defaults, value) {
  if (Array.isArray(defaults)) {
    if (!Array.isArray(value)) return clone(defaults);
    return value.map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return clone(item);
      const template = defaults[index] || defaults[0] || {};
      const merged = mergeContent(template, item);
      if (!Object.hasOwn(item, 'id')) delete merged.id;
      return merged;
    });
  }
  if (defaults && typeof defaults === 'object') {
    const input = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const result = {};
    for (const key of new Set([...Object.keys(defaults), ...Object.keys(input)])) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      result[key] = key in defaults ? mergeContent(defaults[key], input[key]) : clone(input[key]);
    }
    return result;
  }
  return value === undefined || value === null ? clone(defaults) : clone(value);
}

export function getDefaultLandingContent() {
  return clone(DEFAULT_LANDING_CONTENT);
}

export function getLandingContent() {
  return clone(publishedContent || DEFAULT_LANDING_CONTENT);
}

export function getLegacyLandingContent() {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    return raw ? mergeContent(DEFAULT_LANDING_CONTENT, JSON.parse(raw)) : null;
  } catch { return null; }
}

export async function loadLandingContent({ signal } = {}) {
  const response = await apiRequest('landing-content', { signal, token: null });
  publishedContent = mergeContent(DEFAULT_LANDING_CONTENT, response?.content);
  return { content: getLandingContent(), hasPublishedContent: response?.content != null };
}

function notifyPublishedContent() {
  window.dispatchEvent(new CustomEvent(LANDING_CONTENT_CHANGE_EVENT, { detail: getLandingContent() }));
  // This is only a refresh signal for other tabs; a storage failure cannot undo a successful API save.
  try { localStorage.setItem(UPDATE_STORAGE_KEY, `${Date.now()}-${Math.random()}`); } catch { /* optional */ }
}

export function getExternalContactUrl(value) {
  if (typeof value !== 'string') return '';
  const url = value.trim();
  if (!/^https?:\/\//i.test(url) || /[\u0000-\u001f\u007f\\]/.test(url)) return '';
  try {
    return new URL(url).hostname ? url : '';
  } catch { return ''; }
}

export function normalizeZaloPhone(value) {
  if (typeof value !== 'string') return '';
  const phone = value.replace(/[\s().-]/g, '');
  return /^(0\d{9}|\+84\d{9})$/.test(phone) ? phone.replace(/^\+84/, '0') : '';
}

export async function saveLandingContent(content) {
  const footer = { ...content.ctaAndFooter };
  const zaloValue = footer.contactZaloPhone ?? '';
  const zaloPhone = normalizeZaloPhone(zaloValue);
  if (typeof zaloValue !== 'string' || (zaloValue.trim() && !zaloPhone)) {
    throw new Error('Số điện thoại Zalo phải gồm 10 chữ số, bắt đầu bằng 0 hoặc dùng đầu số +84. Để trống để ẩn Zalo.');
  }
  footer.contactZaloPhone = zaloPhone;
  const facebookValue = footer.contactFacebookUrl ?? '';
  const facebookUrl = getExternalContactUrl(facebookValue);
  if (typeof facebookValue !== 'string' || (facebookValue.trim() && !facebookUrl)) {
    throw new Error('Liên kết Facebook phải là đường dẫn HTTP/HTTPS hợp lệ hoặc để trống.');
  }
  footer.contactFacebookUrl = facebookUrl;
  const response = await apiRequest('landing-content', { method: 'PUT', body: { content: { ...content, ctaAndFooter: footer } } });
  publishedContent = mergeContent(DEFAULT_LANDING_CONTENT, response.content);
  notifyPublishedContent();
  return getLandingContent();
}

export async function resetLandingContentToDefault() {
  return saveLandingContent(getDefaultLandingContent());
}

export function getLandingPreviewContent() {
  const query = (window.location.hash || '').split('?')[1] || '';
  if (new URLSearchParams(query).get('preview') !== '1') return null;
  try {
    const raw = sessionStorage.getItem(PREVIEW_STORAGE_KEY);
    return raw ? mergeContent(DEFAULT_LANDING_CONTENT, JSON.parse(raw)) : null;
  } catch { return null; }
}

export function openLandingPreview(content) {
  const previewWindow = window.open('about:blank', '_blank');
  if (!previewWindow) throw new Error('Trình duyệt đã chặn tab xem trước. Vui lòng cho phép mở tab mới.');
  try {
    previewWindow.opener = null;
    previewWindow.sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(content));
    previewWindow.location.replace(new URL('#/?preview=1', window.location.href).href);
  } catch (error) {
    previewWindow.close();
    throw error;
  }
}

export function subscribeLandingContentRefresh(refresh) {
  const onStorage = event => { if (event.key === UPDATE_STORAGE_KEY) refresh(); };
  window.addEventListener('storage', onStorage);
  window.addEventListener('focus', refresh);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('focus', refresh);
  };
}
