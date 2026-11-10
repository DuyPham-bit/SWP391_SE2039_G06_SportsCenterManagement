export const PACKAGE_PRESETS = [
  {
    id: 'starter',
    icon: 'fitness_center',
    tag: 'STARTER',
    tagEn: 'STARTER',
    name: 'Gói Basic Thể Thao',
    nameEn: 'Starter Fitness Pass',
    price: 650000,
    durationDays: 30,
    allowedSports: 1,
    badge: 'TIẾT KIỆM',
    badgeEn: 'SAVER',
    description: 'Rèn luyện 1 bộ môn tự chọn, phù hợp cho người mới bắt đầu hoặc lịch tập cố định. Bao gồm quyền sử dụng tủ locker và tiện ích tập luyện.',
    descriptionEn: 'Single discipline pass ideal for beginners. Includes smart locker and standard Olympic amenities.'
  },
  {
    id: 'pro',
    icon: 'bolt',
    tag: 'PRO ATHLETE',
    tagEn: 'PRO ATHLETE',
    name: 'Gói Pro Bứt Phá',
    nameEn: 'Pro Athlete Pass',
    price: 1800000,
    durationDays: 90,
    allowedSports: 3,
    badge: 'PHỔ BIẾN',
    badgeEn: 'POPULAR',
    description: 'Lựa chọn 3 bộ môn kết hợp (Gym + Bơi lội + Cầu lông), kèm 1 buổi kiểm tra chỉ số InBody và tủ locker riêng.',
    descriptionEn: 'Access to 3 sports of choice, 1 complimentary InBody fitness assessment, and digital locker.'
  },
  {
    id: 'elite',
    icon: 'diamond',
    tag: 'ELITE ATHLETE',
    tagEn: 'ELITE ATHLETE',
    name: 'Gói Elite Chuyên Nghiệp',
    nameEn: 'Elite Performance Pass',
    price: 3200000,
    durationDays: 180,
    allowedSports: 6,
    badge: 'ELITE ATHLETE',
    badgeEn: 'ELITE',
    description: 'Trải nghiệm thể thao đa năng toàn diện, hỗ trợ đặt sân ưu tiên và quyền vào phòng xông hơi Sauna đẳng cấp quốc tế.',
    descriptionEn: 'Comprehensive multi-sport pass with priority court booking and Finnish Sauna access.'
  },
  {
    id: 'olympic',
    icon: 'workspace_premium',
    tag: 'VIP OLYMPIC',
    tagEn: 'VIP OLYMPIC',
    name: 'Gói All-Access Olympic Pass',
    nameEn: 'Olympic VIP All-Access',
    price: 5800000,
    durationDays: 365,
    allowedSports: 10,
    badge: 'VIP OLYMPIC',
    badgeEn: 'VIP PASS',
    description: 'Toàn quyền sử dụng toàn bộ môn thể thao và cụm sân thi đấu đẳng cấp quốc tế 365 ngày, dịch vụ phục hồi thể lực VIP.',
    descriptionEn: 'Unlimited 365-day access to all Olympic disciplines, championship arenas, and VIP recovery zone.'
  }
];

export const QUICK_PRICES = [500000, 650000, 1200000, 1800000, 3200000, 5800000];
export const QUICK_DURATIONS = [
  { days: 30, label: '30 ngày' },
  { days: 90, label: '90 ngày' },
  { days: 180, label: '180 ngày' },
  { days: 365, label: '365 ngày' }
];
export const QUICK_BADGES = ['TIẾT KIỆM', 'PHỔ BIẾN', 'HOT', 'ELITE ATHLETE', 'VIP OLYMPIC', 'ƯU ĐÃI'];
