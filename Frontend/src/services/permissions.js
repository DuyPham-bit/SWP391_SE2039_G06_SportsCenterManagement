
import { getAuthUser } from './authState.js';

export const SYSTEM_CAPABILITIES = [
  // 1. Quản lý chung
  {
    id: 'manage_staff',
    label: 'Quản lý Nhân sự',
    desc: 'Thêm, sửa, kích hoạt/khóa tài khoản HLV và nhân viên',
    path: '#/manager/staff',
    icon: 'badge',
    category: 'VẬN HÀNH & NHÂN SỰ',
    targetScreenName: 'Quản Lý Nhân Viên',
    defaultRole: 'MANAGER'
  },
  {
    id: 'manage_packages',
    label: 'Quản lý Gói tập',
    desc: 'Thiết lập cấu hình giá cước và thời hạn thẻ tập',
    path: '#/manager/packages',
    icon: 'card_membership',
    category: 'VẬN HÀNH & NHÂN SỰ',
    targetScreenName: 'Gói Tập Hội Viên',
    defaultRole: 'MANAGER'
  },
  {
    id: 'manage_classes',
    label: 'Quản lý Lớp & Sân',
    desc: 'Quản lý lớp học, bộ môn, phòng tập và lịch hoạt động',
    path: '#/manager/classes-rooms',
    icon: 'sports_score',
    category: 'VẬN HÀNH & NHÂN SỰ',
    targetScreenName: 'Lớp Học & Sân Bãi',
    defaultRole: 'MANAGER'
  },
  {
    id: 'assign_coach',
    label: 'Phân công HLV',
    desc: 'Chỉ định huấn luyện viên đứng lớp và kiểm tra xung đột',
    path: '#/manager/coach-assignment',
    icon: 'assignment_ind',
    category: 'VẬN HÀNH & NHÂN SỰ',
    targetScreenName: 'Phân Công Huấn Luyện Viên',
    defaultRole: 'MANAGER'
  },
  {
    id: 'view_reports',
    label: 'Báo cáo Thống kê',
    desc: 'Xem biểu đồ doanh thu và công suất khai thác sân bãi',
    path: '#/manager/reports',
    icon: 'analytics',
    category: 'BÁO CÁO & BẢO MẬT',
    targetScreenName: 'Báo Cáo & Thống Kê',
    defaultRole: 'MANAGER'
  },
  {
    id: 'manage_roles',
    label: 'Cấu hình Phân quyền',
    desc: 'Thiết lập ma trận quyền hạn cho các nhóm người dùng',
    path: '#/manager/roles-permissions',
    icon: 'admin_panel_settings',
    category: 'BÁO CÁO & BẢO MẬT',
    targetScreenName: 'Vai Trò & Phân Quyền',
    defaultRole: 'MANAGER'
  },
  {
    id: 'view_audit_logs',
    label: 'Xem Audit Logs',
    desc: 'Tra cứu lịch sử thao tác của toàn bộ tài khoản',
    path: '#/manager/audit-logs',
    icon: 'history',
    category: 'BÁO CÁO & BẢO MẬT',
    targetScreenName: 'Nhật Ký Audit Logs',
    defaultRole: 'MANAGER'
  },

  // 2. Nghiệp vụ Lễ tân
  {
    id: 'lookup_member',
    label: 'Tra cứu Hội viên',
    desc: 'Tìm kiếm hồ sơ hội viên bằng số điện thoại, mã thẻ',
    path: '#/receptionist/lookup',
    icon: 'person_search',
    category: 'NGHIỆP VỤ LỄ TÂN',
    targetScreenName: 'Tra Cứu Hội Viên',
    defaultRole: 'RECEPTIONIST'
  },
  {
    id: 'register_counter_package',
    label: 'Thu ngân Tại Quầy',
    desc: 'Đăng ký và gia hạn gói tập trực tiếp tại bàn lễ tân',
    path: '#/receptionist/counter-register',
    icon: 'point_of_sale',
    category: 'NGHIỆP VỤ LỄ TÂN',
    targetScreenName: 'ĐK / Gia Hạn Tại Quầy',
    defaultRole: 'RECEPTIONIST'
  },
  {
    id: 'checkin_member',
    label: 'Check-in Vào Sân',
    desc: 'Quét thẻ xác thực quyền vào cổng tập luyện',
    path: '#/receptionist/check-in',
    icon: 'qr_code_scanner',
    category: 'NGHIỆP VỤ LỄ TÂN',
    targetScreenName: 'Check-in Vào Sân',
    defaultRole: 'RECEPTIONIST'
  },

  // 3. Huấn luyện viên
  {
    id: 'view_teaching_schedule',
    label: 'Xem Lịch Dạy',
    desc: 'Truy cập lịch trình các ca dạy được giao',
    path: '#/coach/schedule',
    icon: 'calendar_month',
    category: 'HUẤN LUYỆN VIÊN',
    targetScreenName: 'Lịch Giảng Dạy',
    defaultRole: 'COACH'
  },
  {
    id: 'take_attendance',
    label: 'Điểm danh Học viên',
    desc: 'Ghi nhận điểm danh có mặt/vắng mặt trong ca dạy',
    path: '#/coach/attendance',
    icon: 'fact_check',
    category: 'HUẤN LUYỆN VIÊN',
    targetScreenName: 'Điểm Danh Lớp',
    defaultRole: 'COACH'
  },
  {
    id: 'create_training_plan',
    label: 'Thiết lập Giáo án',
    desc: 'Soạn giáo án rèn luyện thể chất cho học viên',
    path: '#/coach/training-plan',
    icon: 'fitness_center',
    category: 'GIÁO ÁN & CHUYÊN MÔN',
    targetScreenName: 'Tạo Giáo Án',
    defaultRole: 'COACH'
  },
  {
    id: 'get_ai_recommendation',
    label: 'Trợ lý Giáo án AI',
    desc: 'Sử dụng AI gợi ý bài tập nâng cao thể lực',
    path: '#/coach/ai-recommendation',
    icon: 'psychology',
    category: 'GIÁO ÁN & CHUYÊN MÔN',
    targetScreenName: 'Gợi Ý Giáo Án AI',
    defaultRole: 'COACH'
  },

  // 4. Hội viên
  {
    id: 'book_class',
    label: 'Đặt chỗ Lớp học',
    desc: 'Hội viên đăng ký tham gia lớp học thể thao',
    path: '#/member/schedule',
    icon: 'event_available',
    category: 'HỘI VIÊN & ĐẶT CHỖ',
    targetScreenName: 'Lịch Lớp Thể Thao',
    defaultRole: 'MEMBER'
  },
  {
    id: 'ask_ai_assistant',
    label: 'Trợ lý AI Hội viên',
    desc: 'Tương tác hỏi đáp kiến thức thể lực & dinh dưỡng',
    path: '#/member/ai-assistant',
    icon: 'smart_toy',
    category: 'HỘI VIÊN & ĐẶT CHỖ',
    targetScreenName: 'Trợ Lý Thể Thao AI',
    defaultRole: 'MEMBER'
  }
];

// Helper to get active permissions of a role
export function getPermissionsForRole(role) {
  const normalized = String(role || '').toUpperCase();
  const user = getAuthUser();
  if (String(user?.role || '').toUpperCase() === normalized && Array.isArray(user?.capabilities)) return user.capabilities;
  return [];
}

// Helper to check if a role has a specific capability
export function hasCapability(role, capId) {
  const normalized = String(role || '').toUpperCase();
  if (normalized === 'MANAGER' || normalized === 'ADMIN' || normalized === 'SYSTEMADMIN') return true; // Superuser access
  if (!capId) return true;
  const perms = getPermissionsForRole(role);
  return perms.includes(capId);
}

// Helper to get capability metadata by ID
export function getCapabilityById(capId) {
  return SYSTEM_CAPABILITIES.find(c => c.id === capId);
}

// Helper to get dynamic navigation items for Sidebar based on role's permissions
export function getDynamicNavItems(role) {
  const normalized = String(role || '').toUpperCase();
  const perms = getPermissionsForRole(role);

  switch (normalized) {
    case 'SYSTEMADMIN':
    case 'ADMIN':
    case 'MANAGER': {
      // Base manager & admin nav
      const isSystemAdmin = normalized === 'SYSTEMADMIN';
      const isAnyAdmin = normalized === 'ADMIN' || isSystemAdmin;
      const items = [
        { label: 'TỔNG QUAN', isHeader: true },
        { path: '#/manager/dashboard', icon: 'dashboard', label: isSystemAdmin ? 'Bảng Quản Trị Hệ Thống' : (isAnyAdmin ? 'Bảng Quản Trị Admin' : 'Bảng Quản Lý') },
        { label: 'VẬN HÀNH & NHÂN SỰ', isHeader: true }
      ];

      if (normalized === 'MANAGER') items.push({ path: '#/manager/members', icon: 'group', label: 'Quản Lý Thành Viên' });
      if (perms.includes('manage_staff')) items.push({ path: '#/manager/staff', icon: 'badge', label: 'Quản Lý Nhân Viên' });
      if (perms.includes('manage_packages')) items.push({ path: '#/manager/packages', icon: 'card_membership', label: 'Gói Tập Hội Viên' });
      if (perms.includes('manage_classes')) items.push({ path: '#/manager/classes-rooms', icon: 'sports_score', label: 'Lớp, Bộ Môn & Phòng' });
      if (perms.includes('assign_coach')) items.push({ path: '#/manager/coach-assignment', icon: 'assignment_ind', label: 'Phân Công HLV' });

      items.push({ label: 'BÁO CÁO & BẢO MẬT', isHeader: true });
      if (perms.includes('view_reports')) items.push({ path: '#/manager/reports', icon: 'analytics', label: 'Báo Cáo & Thống Kê' });
      if (perms.includes('manage_roles')) items.push({ path: '#/manager/roles-permissions', icon: 'admin_panel_settings', label: 'Vai Trò & Phân Quyền' });
      if (perms.includes('view_audit_logs')) items.push({ path: '#/manager/audit-logs', icon: 'history', label: 'Nhật Ký Audit Logs' });

      return items;
    }

    case 'RECEPTIONIST': {
      const items = [
        { label: 'QUẦY LỄ TÂN', isHeader: true },
        { path: '#/receptionist/dashboard', icon: 'countertops', label: 'Tổng Quan Ca Trực' },
        { label: 'NGHIỆP VỤ HỘI VIÊN', isHeader: true }
      ];

      if (perms.includes('lookup_member')) {
        items.push({ path: '#/receptionist/lookup', icon: 'person_search', label: 'Tra Cứu Hội Viên' });
        items.push({ path: '#/receptionist/bookings', icon: 'event_available', label: 'Đặt / Hủy Lớp Tại Quầy' });
        items.push({ path: '#/receptionist/support', icon: 'support_agent', label: 'Yêu Cầu Hỗ Trợ' });
      }
      if (perms.includes('register_counter_package')) {
        items.push({ path: '#/receptionist/counter-register', icon: 'point_of_sale', label: 'ĐK / Gia Hạn Tại Quầy' });
        items.push({ path: '#/receptionist/invoices', icon: 'receipt_long', label: 'Hóa Đơn & Thu Tiền' });
      }
      if (perms.includes('checkin_member')) items.push({ path: '#/receptionist/check-in', icon: 'qr_code_scanner', label: 'Check-in Vào Sân' });

      // Add extra granted permissions if assigned by Manager
      const defaultReceptionistCapIds = ['lookup_member', 'register_counter_package', 'checkin_member', 'view_schedule'];
      const extraCaps = perms.filter(capId => !defaultReceptionistCapIds.includes(capId));

      if (extraCaps.length > 0) {
        items.push({ label: 'QUYỀN ĐƯỢC CẤP THÊM', isHeader: true });
        extraCaps.forEach(capId => {
          const cap = getCapabilityById(capId);
          if (cap) {
            items.push({ path: cap.path, icon: cap.icon, label: cap.targetScreenName });
          }
        });
      }

      return items;
    }

    case 'COACH': {
      const items = [
        { label: 'HUẤN LUYỆN VIÊN', isHeader: true },
        { path: '#/coach/dashboard', icon: 'sports', label: 'Tổng Quan HLV' }
      ];

      if (perms.includes('view_teaching_schedule')) {
        items.push({ path: '#/coach/schedule', icon: 'calendar_month', label: 'Lịch Giảng Dạy' });
        items.push({ path: '#/coach/members', icon: 'group', label: 'Danh Sách Học Viên' });
      }
      if (perms.includes('take_attendance')) {
        items.push({ path: '#/coach/attendance', icon: 'fact_check', label: 'Điểm Danh Lớp' });
      }

      const hasPlanCaps = perms.includes('create_training_plan') || perms.includes('get_ai_recommendation');
      if (hasPlanCaps) {
        items.push({ label: 'GIÁO ÁN & CHUYÊN MÔN', isHeader: true });
        if (perms.includes('create_training_plan')) {
          items.push({ path: '#/coach/training-plan', icon: 'fitness_center', label: 'Tạo Giáo Án' });
          items.push({ path: '#/coach/progress', icon: 'monitoring', label: 'Ghi Nhận Tiến Độ' });
        }
        if (perms.includes('view_teaching_schedule')) {
          items.push({ path: '#/coach/notifications', icon: 'outgoing_mail', label: 'Gửi Bài Tập/TB' });
        }
        if (perms.includes('get_ai_recommendation')) {
          items.push({ path: '#/coach/ai-recommendation', icon: 'psychology', label: 'Gợi Ý Giáo Án AI' });
        }
      }

      // Add extra granted permissions if assigned by Manager
      const defaultCoachCapIds = ['view_teaching_schedule', 'view_class_members', 'create_training_plan', 'record_workout_progress', 'take_attendance', 'send_coach_notifications', 'get_ai_recommendation'];
      const extraCaps = perms.filter(capId => !defaultCoachCapIds.includes(capId));

      if (extraCaps.length > 0) {
        items.push({ label: 'QUYỀN ĐƯỢC CẤP THÊM', isHeader: true });
        extraCaps.forEach(capId => {
          const cap = getCapabilityById(capId);
          if (cap) {
            items.push({ path: cap.path, icon: cap.icon, label: cap.targetScreenName });
          }
        });
      }

      return items;
    }

    case 'MEMBER': {
      const items = [
        { label: 'HỘI VIÊN SCMS', isHeader: true },
        { path: '#/member/dashboard', icon: 'home_app_logo', label: 'Trang Cá Nhân' },
        { path: '#/member/packages', icon: 'card_membership', label: 'Mua / Gia Hạn Gói' }
      ];

      if (perms.includes('book_class')) {
        items.push({ label: 'LỊCH HỌC & ĐẶT CHỖ', isHeader: true });
        items.push({ path: '#/member/schedule', icon: 'event_available', label: 'Lịch Lớp Thể Thao' });
        items.push({ path: '#/member/bookings', icon: 'bookmark_check', label: 'Lớp Đã Đặt & Hủy' });
        items.push({ path: '#/member/attendance', icon: 'fact_check', label: 'Lịch Sử Điểm Danh' });
      }

      items.push({ label: 'RÈN LUYỆN & HỖ TRỢ', isHeader: true });
      if (perms.includes('view_my_progress')) items.push({ path: '#/member/progress', icon: 'stacked_line_chart', label: 'Giáo Án, Tiến Độ & Nhận Xét' });
      items.push({ path: '#/member/notifications', icon: 'notifications', label: 'Thông Báo Của Tôi' });

      if (perms.includes('ask_ai_assistant')) {
        items.push({ path: '#/member/ai-assistant', icon: 'smart_toy', label: 'Trợ Lý Thể Thao AI' });
      }

      // Add extra granted permissions if assigned by Manager
      const defaultMemberCapIds = ['view_packages', 'subscribe_package', 'view_schedules', 'book_class', 'cancel_booking', 'view_my_progress', 'ask_ai_assistant'];
      const extraCaps = perms.filter(capId => !defaultMemberCapIds.includes(capId));

      if (extraCaps.length > 0) {
        items.push({ label: 'QUYỀN ĐƯỢC CẤP THÊM', isHeader: true });
        extraCaps.forEach(capId => {
          const cap = getCapabilityById(capId);
          if (cap) {
            items.push({ path: cap.path, icon: cap.icon, label: cap.targetScreenName });
          }
        });
      }

      return items;
    }

    default:
      return [];
  }
}
