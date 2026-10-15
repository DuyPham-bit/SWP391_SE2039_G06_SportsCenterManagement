import { SUPPORTED_SPORTS } from './sportsCatalog.js';

export const INITIAL_SPORTS = SUPPORTED_SPORTS;

// Các tài khoản hội viên và nhân sự đều được lưu và xác thực từ Database (Backend API).
// Không lưu tài khoản mẫu ở mockData để đảm bảo tính đồng bộ với DB.
export const INITIAL_USERS = [];

export const INITIAL_ROOMS = [
  { id: 'room-01', name: 'Bể bơi Olympic 50m', sportId: 'boi-loi', capacity: 30, status: 'AVAILABLE', note: 'Chuẩn thi đấu quốc tế, xử lý muối điện phân' },
  { id: 'room-02', name: 'Sân bóng mini cỏ nhân tạo A', sportId: 'bong-da', capacity: 14, status: 'AVAILABLE', note: 'Đèn cao áp 800W' },
  { id: 'room-03', name: 'Sân Cầu lông Thảm Yonex #1', sportId: 'cau-long', capacity: 12, status: 'AVAILABLE', note: 'Sàn gỗ lót thảm chuẩn BWF' },
  { id: 'room-04', name: 'CLB Bóng bàn Hoàng Gia', sportId: 'bong-ban', capacity: 16, status: 'AVAILABLE', note: 'Bàn thi đấu tiêu chuẩn ITTF' },
  { id: 'room-05', name: 'Nhà thi đấu Bóng rổ Sàn Gỗ Phong', sportId: 'bong-ro', capacity: 20, status: 'AVAILABLE', note: 'Rổ nâng hạ thủy lực' },
  { id: 'room-06', name: 'Cụm sân Pickleball Quốc Tế', sportId: 'pickleball', capacity: 16, status: 'AVAILABLE', note: 'Sơn phủ US Open Cushion Court' },
  { id: 'room-07', name: 'Võ đài Boxing & MMA Cage', sportId: 'vo-thuat', capacity: 15, status: 'AVAILABLE', note: 'Lồng bát giác & sàn đài có bảo hộ' },
  { id: 'room-08', name: 'Phòng Gym High-Performance', sportId: 'gym-fitness', capacity: 40, status: 'AVAILABLE', note: 'Dàn tạ Eleiko & máy chạy LifeFitness' },
  { id: 'room-09', name: 'Phòng Yoga & Pilates Reformer', sportId: 'yoga-pilates', capacity: 18, status: 'AVAILABLE', note: 'Trang bị 10 giường Reformer gỗ sồi' }
];

export const INITIAL_PACKAGES = [
  {
    id: 1,
    name: 'Gói Basic Thể Thao',
    description: 'Rèn luyện 1 bộ môn tự chọn, phù hợp cho người mới bắt đầu hoặc lịch tập cố định.',
    durationDays: 30,
    price: 650000,
    maxClasses: 1,
    allowedSports: 1,
    accessType: '1 môn tự chọn',
    status: 'ACTIVE'
  },
  {
    id: 2,
    name: 'Gói Pro Bứt Phá',
    description: 'Lựa chọn 3 bộ môn kết hợp (ví dụ: Gym + Bơi lội + Cầu lông), kèm 1 buổi kiểm tra InBody.',
    durationDays: 90,
    price: 1800000,
    maxClasses: 3,
    allowedSports: 3,
    accessType: '3 môn tự chọn',
    status: 'ACTIVE'
  },
  {
    id: 3,
    name: 'Gói Elite Chuyên Nghiệp',
    description: 'Trải nghiệm thể thao đa năng toàn diện, hỗ trợ đặt sân ưu tiên và quyền vào phòng xông hơi Sauna.',
    durationDays: 180,
    price: 3200000,
    maxClasses: 6,
    allowedSports: 6,
    accessType: '6 môn tự chọn',
    status: 'ACTIVE'
  },
  {
    id: 4,
    name: 'Gói All-Access Olympic Pass',
    description: 'Toàn quyền sử dụng 15 bộ môn và 9 sân thi đấu đẳng cấp quốc tế 365 ngày.',
    durationDays: 365,
    price: 5800000,
    maxClasses: 15,
    allowedSports: 15,
    accessType: 'Toàn quyền 15 môn',
    status: 'ACTIVE'
  }
];

export const INITIAL_CLASSES = [
  {
    id: 101,
    name: 'Bơi sải Kỹ thuật Olympic K01',
    sportId: 'boi-loi',
    sportName: 'Bơi lội',
    coachId: 40,
    coachName: 'Huấn luyện viên mẫu',
    roomName: 'Bể bơi Olympic 50m',
    timeSlot: '07:00 - 08:00',
    dayOfWeek: 'Thứ 2, 4, 6',
    capacity: 15,
    enrolledCount: 3,
    status: 'OPEN'
  },
  {
    id: 102,
    name: 'Gym Tăng cơ Tối đa (Hypertrophy)',
    sportId: 'gym-fitness',
    sportName: 'Gym & Fitness',
    coachId: 40,
    coachName: 'Huấn luyện viên mẫu',
    roomName: 'Phòng Gym High-Performance',
    timeSlot: '18:00 - 19:15',
    dayOfWeek: 'Thứ 2, 4, 6',
    capacity: 20,
    enrolledCount: 3,
    status: 'OPEN'
  },
  {
    id: 103,
    name: 'Yoga Phục hồi & Trị liệu Cột sống',
    sportId: 'yoga-pilates',
    sportName: 'Yoga & Pilates',
    coachId: 40,
    coachName: 'Huấn luyện viên mẫu',
    roomName: 'Phòng Yoga & Pilates Reformer',
    timeSlot: '08:30 - 09:30',
    dayOfWeek: 'Thứ 3, 5, 7',
    capacity: 15,
    enrolledCount: 2,
    status: 'OPEN'
  },
  {
    id: 104,
    name: 'Cầu lông Nâng cao Tấn công & Di chuyển',
    sportId: 'cau-long',
    sportName: 'Cầu lông',
    coachId: 40,
    coachName: 'Huấn luyện viên mẫu',
    roomName: 'Sân Cầu lông Tiêu chuẩn #1',
    timeSlot: '19:00 - 20:30',
    dayOfWeek: 'Thứ 3, 5',
    capacity: 12,
    enrolledCount: 2,
    status: 'OPEN'
  },
  {
    id: 105,
    name: 'Boxing & Kickfit Đốt mỡ Cường độ cao',
    sportId: 'vo-thuat',
    sportName: 'Boxing & Võ thuật',
    coachId: 40,
    coachName: 'Huấn luyện viên mẫu',
    roomName: 'Võ đài Boxing & Kickfit',
    timeSlot: '19:30 - 20:30',
    dayOfWeek: 'Thứ 2, 4',
    capacity: 16,
    enrolledCount: 2,
    status: 'OPEN'
  }
];

export const INITIAL_BOOKINGS = [
  {
    id: 'bk-01',
    classId: 101,
    memberId: 5,
    memberName: 'Phạm Minh Tuấn',
    status: 'CONFIRMED',
    bookingDate: '2026-10-12'
  },
  {
    id: 'bk-02',
    classId: 101,
    memberId: 6,
    memberName: 'Hoàng Hải Yến',
    status: 'CONFIRMED',
    bookingDate: '2026-10-12'
  },
  {
    id: 'bk-03',
    classId: 101,
    memberId: 7,
    memberName: 'Đặng Quốc Bảo',
    status: 'CONFIRMED',
    bookingDate: '2026-10-12'
  },
  {
    id: 'bk-04',
    classId: 102,
    memberId: 5,
    memberName: 'Phạm Minh Tuấn',
    status: 'CONFIRMED',
    bookingDate: '2026-10-13'
  },
  {
    id: 'bk-05',
    classId: 102,
    memberId: 6,
    memberName: 'Hoàng Hải Yến',
    status: 'CONFIRMED',
    bookingDate: '2026-10-13'
  },
  {
    id: 'bk-06',
    classId: 102,
    memberId: 7,
    memberName: 'Đặng Quốc Bảo',
    status: 'CONFIRMED',
    bookingDate: '2026-10-13'
  }
];

export const INITIAL_CHECKINS = [
  {
    id: 'ck-01',
    memberId: 5,
    memberName: 'Phạm Minh Tuấn',
    memberCode: 'MEM-00001',
    checkInTime: new Date(Date.now() - 3600000).toISOString(),
    status: 'SUCCESS',
    centerName: 'Sports Center Quận 1'
  }
];

export const INITIAL_TRAINING_PLANS = [
  {
    id: 'tp-01',
    classId: 101,
    className: 'Bơi sải Kỹ thuật Olympic K01',
    coachId: 40,
    coachName: 'Huấn luyện viên mẫu',
    title: 'Giáo án Hoàn thiện kỹ thuật bơi sải & Nhịp thở Olympic',
    goal: 'Tối ưu nhịp thở 2 bên, vươn sải tay xa, hoàn thành 500m bơi liên tục',
    startDate: '2026-10-01',
    endDate: '2026-11-30',
    isCustom: false,
    status: 'ACTIVE',
    createdAt: '2026-10-01',
    exercises: [
      { name: 'Khởi động xoay khớp vai & gân gối trên cạn', sets: '2', reps: '10 phút', note: 'Tăng biên độ khớp' },
      { name: 'Đạp chân sải với phao tim Kickboard', sets: '4', reps: '50m', note: 'Nhịp đập đều, giữ hông nổi' },
      { name: 'Quạt tay sải kẹp phao Pullbuoy', sets: '6', reps: '50m', note: 'Tập trung lực kéo dưới nước' },
      { name: 'Bơi phối hợp biến tốc Interval', sets: '4', reps: '100m', note: 'Pace 1p25s, nghỉ 30s' }
    ]
  },
  {
    id: 'tp-02',
    classId: 102,
    className: 'Gym Tăng cơ Tối đa (Hypertrophy)',
    coachId: 40,
    coachName: 'Huấn luyện viên mẫu',
    title: 'Giáo án Tăng phì đại cơ thân trên Hypertrophy Chu kỳ 1',
    goal: 'Tăng 2kg khối lượng cơ nạc thân trên, cải thiện Bench Press lên 80kg',
    startDate: '2026-10-01',
    endDate: '2026-11-30',
    isCustom: false,
    status: 'ACTIVE',
    createdAt: '2026-10-01',
    exercises: [
      { name: 'Khởi động động lực học xoay vai & foam roller', sets: '2', reps: '8 phút', note: 'Làm nóng khớp xoay vai' },
      { name: 'Barbell Bench Press (Đẩy ngực đòn ngang)', sets: '4', reps: '8 - 10', note: 'RPE 8.0, nghỉ 90s' },
      { name: 'Incline Dumbbell Press (Đẩy tạ đơn ngực trên)', sets: '3', reps: '10 - 12', note: 'Tempo 3-0-1' },
      { name: 'Lat Pulldown (Kéo xô máy rộng tay)', sets: '4', reps: '12', note: 'Ép chặt bả vai ở đáy' }
    ]
  },
  {
    id: 'tp-03',
    classId: 103,
    className: 'Yoga Phục hồi & Trị liệu Cột sống',
    coachId: 40,
    coachName: 'Huấn luyện viên mẫu',
    title: 'Giáo án Yoga Trị liệu Cột sống & Mở khớp hông',
    goal: 'Giải tỏa căng thẳng vùng thắt lưng, cải thiện tư thế đứng và độ dẻo dai khớp hông',
    startDate: '2026-10-01',
    endDate: '2026-11-30',
    isCustom: false,
    status: 'ACTIVE',
    createdAt: '2026-10-01',
    exercises: [
      { name: 'Thở Pranayama hít sâu bụng 4 nhịp', sets: '3', reps: '5 phút', note: 'Tập trung hơi thở' },
      { name: 'Chuỗi Cat-Cow uốn cột sống', sets: '3', reps: '10 lần', note: 'Chuyển động nhịp nhàng theo hơi thở' },
      { name: 'Tư thế chim bồ câu Pigeon Pose', sets: '3', reps: '45s', note: 'Mở rộng khớp hông' },
      { name: 'Tư thế rắn hổ mang Cobra Pose', sets: '3', reps: '30s', note: 'Kéo giãn cơ lưng' }
    ]
  },
  {
    id: 'tp-04',
    classId: 104,
    className: 'Cầu lông Nâng cao Tấn công & Di chuyển',
    coachId: 40,
    coachName: 'Huấn luyện viên mẫu',
    title: 'Giáo án Bộ chân di chuyển & Đập cầu góc hẹp Smash',
    goal: 'Nâng cao tốc độ hồi sân, tăng lực phát bóng và đập cầu chính xác góc lưới',
    startDate: '2026-10-01',
    endDate: '2026-11-30',
    isCustom: false,
    status: 'ACTIVE',
    createdAt: '2026-10-01',
    exercises: [
      { name: 'Bộ chân di chuyển bóng sao 6 góc sân', sets: '4', reps: '20 lần', note: 'Bước chân chéo nhanh, trọng tâm thấp' },
      { name: 'Tập cổ tay với vợt nặng Training Racket', sets: '3', reps: '15 lần', note: 'Phát lực cổ tay dứt khoát' },
      { name: 'Đập cầu dốc góc lưới Smash', sets: '5', reps: '12 quả', note: 'Bật nhảy đón cầu ở điểm cao nhất' },
      { name: 'Thực chiến phản xạ giao cầu và gài lưới', sets: '3', reps: '10 phút', note: 'Kiểm soát nhịp độ trận đấu' }
    ]
  },
  {
    id: 'tp-05',
    classId: 105,
    className: 'Boxing & Kickfit Đốt mỡ Cường độ cao',
    coachId: 40,
    coachName: 'Huấn luyện viên mẫu',
    title: 'Giáo án Footwork né đòn & Tổ hợp đòn đấm 1-2-3 Boxing',
    goal: 'Đốt cháy 600 kcal/buổi, hoàn thiện combo đòn Jab - Cross - Lead Hook uy lực',
    startDate: '2026-10-01',
    endDate: '2026-11-30',
    isCustom: false,
    status: 'ACTIVE',
    createdAt: '2026-10-01',
    exercises: [
      { name: 'Nhảy dây tăng tốc Footwork', sets: '3', reps: '3 phút', note: 'Nhảy nhón gót, giữ nhịp thở đều' },
      { name: 'Đấm gió Shadow Boxing', sets: '3', reps: '3 phút', note: 'Tập trung kỹ thuật xoay mũi chân' },
      { name: 'Đánh Pad tổ hợp đòn Jab-Cross-Hook', sets: '5', reps: '3 phút', note: 'Phát lực từ hông, bảo vệ cằm' },
      { name: 'Bài tập né đòn Slip và Roll', sets: '4', reps: '2 phút', note: 'Lắc đầu tránh đòn kết hợp phản công' }
    ]
  }
];

export const INITIAL_PROGRESS_RECORDS = [
  {
    id: 'prg-01',
    memberId: 5,
    memberName: 'Phạm Minh Tuấn',
    coachId: 3,
    coachName: 'Nguyễn Văn Huấn',
    date: '2026-10-08',
    weight: 71.5,
    muscleMass: 33.8,
    bodyFat: 16.2,
    exerciseResults: 'Hoàn thành 100m bơi sải trong 1p22s. Thể lực tốt, nhịp tim hồi phục nhanh sau 2 phút nghỉ.',
    coachFeedback: 'Kỹ thuật quạt tay đã cải thiện rõ rệt, lưu ý giữ đầu thấp hơn khi lấy hơi để tránh chìm chân.'
  },
  {
    id: 'prg-02',
    memberId: 6,
    memberName: 'Hoàng Hải Yến',
    coachId: 3,
    coachName: 'Nguyễn Văn Huấn',
    date: '2026-10-07',
    weight: 52.0,
    muscleMass: 22.4,
    bodyFat: 20.1,
    exerciseResults: 'Squat 45kg x 8 reps, Bench Press 25kg x 10 reps.',
    coachFeedback: 'Tư thế squat chuẩn, lưng thẳng, gối không sụp. Có thể thử mức tạ 50kg ở buổi tập tới.'
  }
];

export const INITIAL_ATTENDANCES = [
  {
    id: 'att-01',
    classId: 101,
    className: 'Bơi sải Kỹ thuật Olympic K01',
    coachId: 3,
    date: '2026-10-09',
    recordedAt: '09/10/2026, 07:35:00',
    members: [
      { memberId: 5, memberName: 'Phạm Minh Tuấn', status: 'PRESENT', note: 'Đến đúng giờ, tập tích cực' },
      { memberId: 6, memberName: 'Hoàng Hải Yến', status: 'PRESENT', note: 'Đến đúng giờ' },
      { memberId: 7, memberName: 'Đặng Quốc Bảo', status: 'ABSENT', note: 'Báo bận đột xuất' }
    ]
  }
];

export const INITIAL_COACH_NOTIFICATIONS = [
  {
    id: 'notif-01',
    classId: 101,
    className: 'Bơi sải Kỹ thuật Olympic K01',
    coachId: 3,
    coachName: 'Nguyễn Văn Huấn',
    title: 'Bài tập bổ trợ nhịp thở và giãn cơ vai tại nhà',
    message: 'Các học viên lớp bơi chú ý thực hiện bài tập giãn cơ vai và cơ liên sườn mỗi tối 10 phút để tránh căng cứng khớp.',
    homework: 'Giãn cơ vai cánh bướm 3 hiệp x 30 giây, hít sâu thở chậm bằng bụng 15 nhịp.',
    createdAt: '09/10/2026, 10:15:00'
  }
];

export const INITIAL_AUDIT_LOGS = [
  {
    id: 'log-01',
    timestamp: '2026-10-10 08:30:00',
    user: 'manager01',
    role: 'MANAGER',
    action: 'CREATE_CLASS',
    details: 'Tạo lớp học mới: Bơi sải Kỹ thuật Olympic K01'
  },
  {
    id: 'log-02',
    timestamp: '2026-10-10 09:15:00',
    user: 'coach01',
    role: 'COACH',
    action: 'CREATE_TRAINING_PLAN',
    details: 'Tạo giáo án cho lớp Bơi sải Kỹ thuật Olympic K01'
  }
];

export const INITIAL_PERMISSIONS = {
  ADMIN: {
    name: 'Quản trị viên toàn hệ thống',
    permissions: ['VIEW_USERS', 'MANAGE_USERS', 'MANAGE_ROLES', 'VIEW_REPORTS', 'MANAGE_PACKAGES', 'VIEW_AUDIT_LOGS']
  },
  MANAGER: {
    name: 'Quản lý cơ sở trung tâm',
    permissions: ['VIEW_MEMBERS', 'MANAGE_STAFF', 'MANAGE_CLASSES', 'ASSIGN_COACH', 'MANAGE_PACKAGES', 'VIEW_REPORTS', 'VIEW_AUDIT_LOGS']
  },
  COACH: {
    name: 'Huấn luyện viên thể thao',
    permissions: ['VIEW_TEACHING_SCHEDULE', 'VIEW_CLASS_MEMBERS', 'CREATE_TRAINING_PLAN', 'RECORD_WORKOUT_PROGRESS', 'TAKE_ATTENDANCE', 'SEND_COACH_NOTIFICATION']
  },
  RECEPTIONIST: {
    name: 'Nhân viên lễ tân',
    permissions: ['VIEW_MEMBERS', 'CHECK_IN_MEMBER', 'SELL_PACKAGE', 'VIEW_PACKAGES']
  },
  MEMBER: {
    name: 'Khách hàng hội viên',
    permissions: ['VIEW_PROFILE', 'VIEW_PACKAGES', 'BUY_PACKAGE', 'VIEW_CLASSES', 'BOOK_CLASS', 'VIEW_MY_PROGRESS']
  }
};
