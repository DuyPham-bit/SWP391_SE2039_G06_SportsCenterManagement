import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export const TRANSLATIONS = {
  vi: {
    // Header
    'branch.name': 'Cơ sở TP. Hồ Chí Minh (HCM)',
    'branch.tag': 'Cơ sở chính duy nhất',
    'branch.title': 'Thông tin cơ sở hoạt động',
    'branch.desc': 'Hệ thống thể thao SCMS hiện vận hành tập trung tại 1 cơ sở tiêu chuẩn Olympic tại TP. Hồ Chí Minh.',
    'branch.address': 'Lô E2a-7, Đường D1, Khu CNC, TP. Thủ Đức, TP. Hồ Chí Minh',
    'branch.hotline': '(028) 7300 5588',
    'branch.hours': '06:00 - 22:00 hàng ngày',
    'branch.status': 'Đang mở cửa hoạt động',
    'branch.facilities': 'Sân cầu lông, Tennis, Hồ bơi Olympic, Gym & Yoga',
    'header.brand_sub': 'TRUNG TÂM THỂ THAO',
    'header.menu_toggle': 'Ẩn / Hiện Menu',
    'header.notifications': 'Thông báo',
    'header.dark_mode': 'Chế độ tối',
    'header.light_mode': 'Chế độ sáng',
    'header.fullscreen': 'Toàn màn hình',
    'header.exit_fullscreen': 'Thu nhỏ màn hình (Esc)',
    'header.profile': 'Hồ sơ & Đổi mật khẩu',
    'header.landing': 'Trang chủ Landing Page',
    'header.support': 'Gửi yêu cầu hỗ trợ',
    'header.logout': 'Đăng xuất',
    'role.systemadmin': 'Quản trị hệ thống (System Admin)',
    'role.admin': 'Quản trị viên (Admin)',
    'role.manager': 'Quản lý (Manager)',
    'role.receptionist': 'Lễ tân (Receptionist)',
    'role.coach': 'Huấn luyện viên (Coach)',
    'role.member': 'Hội viên (Member)',

    // Breadcrumbs
    'nav.home': 'Trang chủ',
    'nav.login': 'Đăng nhập',
    'nav.payment_result': 'Kết quả thanh toán',
    'nav.member_dashboard': 'Trang cá nhân',
    'nav.member_schedule': 'Thời khóa biểu',
    'nav.member_bookings': 'Đơn đổi lớp & Đặt chỗ',
    'nav.member_attendance': 'Báo cáo điểm danh',
    'nav.member_progress': 'Báo cáo học tập & Tiến độ',
    'nav.member_packages': 'Gói tập & Thanh toán',
    'nav.member_support': 'Đơn từ & Yêu cầu hỗ trợ',
    'nav.member_notifications': 'Tin tức & Thông báo',
    'nav.member_coach_portal': 'Tương tác với HLV',
    'nav.member_ai_assistant': 'Trợ lý thể thao AI',
    'nav.coach_dashboard': 'Tổng quan giảng viên',
    'nav.coach_schedule': 'Lịch giảng dạy',
    'nav.coach_members': 'Danh sách học viên',
    'nav.coach_attendance': 'Báo cáo điểm danh',
    'nav.coach_training_plan': 'Giáo án giảng dạy',
    'nav.coach_progress': 'Báo cáo tiến độ học viên',
    'nav.coach_notifications': 'Gửi bài tập & Thông báo',
    'nav.coach_ai_recommendation': 'Gợi ý giáo án AI',
    'nav.coach_salary_kpi': 'KPI & Thu nhập',
    'nav.coach_resources': 'Tài nguyên & Thiết bị',
    'nav.coach_professional': 'Hồ sơ chuyên môn HLV',
    'nav.coach_support': 'Yêu cầu hỗ trợ giảng viên',
    'nav.manager_dashboard': 'Bảng quản trị hệ thống',
    'nav.manager_members': 'Quản lý thành viên',
    'nav.manager_staff': 'Quản lý nhân viên',
    'nav.manager_packages': 'Gói tập hội viên',
    'nav.manager_classes_rooms': 'Lớp học & Sân bãi',
    'nav.manager_coach_assignment': 'Phân công HLV',
    'nav.manager_coach_operations': 'Vận hành đội ngũ HLV',
    'nav.manager_reports': 'Báo cáo & Thống kê',
    'nav.manager_roles_permissions': 'Vai trò & Phân quyền',
    'nav.manager_audit_logs': 'Nhật ký Audit Logs',
    'nav.manager_home_content': 'Nội dung trang chủ & Đa phương tiện',
    'nav.receptionist_dashboard': 'Tổng quan ca trực lễ tân',
    'nav.receptionist_lookup': 'Tra cứu hội viên',
    'nav.receptionist_check_in': 'Check-in vào sân',
    'nav.receptionist_bookings': 'Đặt / Hủy chỗ tại quầy',
    'nav.receptionist_counter_register': 'Đăng ký gói tại quầy',
    'nav.receptionist_invoices': 'Hóa đơn & Thu tiền',
    'nav.receptionist_support': 'Tiếp nhận yêu cầu hỗ trợ',

    // Sidebar Categories
    'cat.learning': 'HỌC TẬP',
    'cat.forms': 'ĐƠN TỪ',
    'cat.finance': 'TÀI CHÍNH',
    'cat.teaching': 'GIẢNG DẠY',
    'cat.professional': 'CHUYÊN MÔN',
    'cat.administration': 'QUẢN TRỊ',
    'cat.operations': 'VẬN HÀNH',
    'cat.frontdesk': 'TIẾP TÂN',
    'cat.receptionist_desk': 'QUẦY LỄ TÂN',

    // Sidebar Items
    'menu.class_schedule': 'Lịch học',
    'menu.timetable': 'Thời khóa biểu',
    'menu.booked_classes': 'Lớp đã đặt & Hủy',
    'menu.learning_reports': 'Báo cáo học tập',
    'menu.attendance_report': 'Báo cáo điểm danh',
    'menu.syllabus_progress': 'Giáo án & Tiến độ',
    'menu.coach_interaction': 'Tương tác với HLV',
    'menu.ai_assistant': 'Trợ lý thể thao AI',
    'menu.support_requests': 'Yêu cầu hỗ trợ & Đơn từ',
    'menu.news_notifications': 'Tin tức & Thông báo',
    'menu.packages_payment': 'Gói tập & Thanh toán',
    'menu.transaction_history': 'Lịch sử giao dịch',
    'menu.coach_overview': 'Tổng quan giảng viên',
    'menu.teaching_schedule': 'Lịch giảng dạy',
    'menu.classes_students': 'Danh sách học viên',
    'menu.class_attendance': 'Điểm danh lớp',
    'menu.lesson_plans': 'Giáo án giảng dạy',
    'menu.student_progress': 'Đánh giá học viên',
    'menu.send_exercises': 'Gửi bài tập & Thông báo',
    'menu.ai_exercise_tips': 'Gợi ý bài tập AI',
    'menu.professional_profile': 'Hồ sơ chuyên môn',
    'menu.coach_support_req': 'Yêu cầu hỗ trợ HLV',
    'menu.admin_dashboard': 'Bảng quản trị hệ thống',
    'menu.member_mgmt': 'Quản lý thành viên',
    'menu.staff_mgmt': 'Quản lý nhân viên',
    'menu.package_mgmt': 'Gói tập hội viên',
    'menu.classes_courts_mgmt': 'Lớp học & Sân bãi',
    'menu.coach_assign': 'Phân công HLV',
    'menu.coach_team_ops': 'Vận hành đội ngũ HLV',
    'menu.reports_stats': 'Báo cáo & Thống kê',
    'menu.roles_perms': 'Vai trò & Phân quyền',
    'menu.audit_logs': 'Nhật ký Audit Logs',
    'menu.home_content': 'Nội dung trang chủ',
    'menu.reception_overview': 'Tổng quan ca trực lễ tân',
    'menu.member_lookup': 'Tra cứu hội viên',
    'menu.court_checkin': 'Check-in vào sân',
    'menu.counter_booking': 'Đặt / Hủy chỗ tại quầy',
    'menu.counter_pkg_reg': 'Đăng ký gói tại quầy',
    'menu.invoices_cashier': 'Hóa đơn & Thu tiền',
    'menu.reception_support': 'Tiếp nhận yêu cầu hỗ trợ',

    // Footer
    'footer.copyright': 'Bản quyền © 2026 SCMS - Sports Center Management System. Đã đăng ký bản quyền.',
    'footer.version': 'Phiên bản: 2.0.0.0'
  },

  en: {
    // Header
    'branch.name': 'Ho Chi Minh City Campus (HCM)',
    'branch.tag': 'Sole Main Campus',
    'branch.title': 'Facility Information',
    'branch.desc': 'The SCMS sports system is currently operating centrally at a single Olympic-standard campus in Ho Chi Minh City.',
    'branch.address': 'Lot E2a-7, D1 Street, High-Tech Park, Thu Duc City, Ho Chi Minh City',
    'branch.hotline': '(028) 7300 5588',
    'branch.hours': '06:00 - 22:00 Daily',
    'branch.status': 'Currently Open & Operating',
    'branch.facilities': 'Badminton, Tennis Courts, Olympic Pool, Gym & Yoga',
    'header.brand_sub': 'SPORTS CENTER',
    'header.menu_toggle': 'Toggle Sidebar Menu',
    'header.notifications': 'Notifications',
    'header.dark_mode': 'Dark Mode',
    'header.light_mode': 'Light Mode',
    'header.fullscreen': 'Fullscreen',
    'header.exit_fullscreen': 'Exit Fullscreen (Esc)',
    'header.profile': 'Profile & Change Password',
    'header.landing': 'Home / Landing Page',
    'header.support': 'Submit Support Request',
    'header.logout': 'Sign Out',
    'role.systemadmin': 'System Administrator',
    'role.admin': 'Administrator (Admin)',
    'role.manager': 'Manager',
    'role.receptionist': 'Receptionist',
    'role.coach': 'Coach / Instructor',
    'role.member': 'Member',

    // Breadcrumbs
    'nav.home': 'Home',
    'nav.login': 'Sign In',
    'nav.payment_result': 'Payment Results',
    'nav.member_dashboard': 'Member Dashboard',
    'nav.member_schedule': 'Class Schedule',
    'nav.member_bookings': 'Class Changes & Bookings',
    'nav.member_attendance': 'Attendance Report',
    'nav.member_progress': 'Learning & Workout Progress',
    'nav.member_packages': 'Packages & Billing',
    'nav.member_support': 'Requests & Support Forms',
    'nav.member_notifications': 'News & Announcements',
    'nav.member_coach_portal': 'Coach Interaction',
    'nav.member_ai_assistant': 'AI Sports Assistant',
    'nav.coach_dashboard': 'Coach Overview',
    'nav.coach_schedule': 'Teaching Schedule',
    'nav.coach_members': 'Enrolled Students',
    'nav.coach_attendance': 'Attendance Tracking',
    'nav.coach_training_plan': 'Lesson Plans',
    'nav.coach_progress': 'Student Progress Report',
    'nav.coach_notifications': 'Send Exercises & Notes',
    'nav.coach_ai_recommendation': 'AI Lesson Plan Advice',
    'nav.coach_salary_kpi': 'KPI & Income',
    'nav.coach_resources': 'Resources & Equipment',
    'nav.coach_professional': 'Professional Profile',
    'nav.coach_support': 'Coach Support Requests',
    'nav.manager_dashboard': 'Admin Dashboard',
    'nav.manager_members': 'Member Management',
    'nav.manager_staff': 'Staff Management',
    'nav.manager_packages': 'Membership Packages',
    'nav.manager_classes_rooms': 'Classes & Facilities',
    'nav.manager_coach_assignment': 'Coach Assignment',
    'nav.manager_coach_operations': 'Coach Team Operations',
    'nav.manager_reports': 'Reports & Statistics',
    'nav.manager_roles_permissions': 'Roles & Permissions',
    'nav.manager_audit_logs': 'System Audit Logs',
    'nav.manager_home_content': 'Homepage Media & Content',
    'nav.receptionist_dashboard': 'Front Desk Overview',
    'nav.receptionist_lookup': 'Member Lookup',
    'nav.receptionist_check_in': 'Facility Check-In',
    'nav.receptionist_bookings': 'Counter Booking & Cancellation',
    'nav.receptionist_counter_register': 'Counter Package Sign-up',
    'nav.receptionist_invoices': 'Invoices & Cashier',
    'nav.receptionist_support': 'Support Inquiries',

    // Sidebar Categories
    'cat.learning': 'TRAINING & SCHEDULE',
    'cat.forms': 'REQUESTS & FORMS',
    'cat.finance': 'FINANCE & PACKAGES',
    'cat.teaching': 'COACHING',
    'cat.professional': 'PROFESSIONAL',
    'cat.administration': 'ADMINISTRATION',
    'cat.operations': 'OPERATIONS',
    'cat.frontdesk': 'FRONT DESK',
    'cat.receptionist_desk': 'RECEPTION DESK',

    // Sidebar Items
    'menu.class_schedule': 'Schedule & Classes',
    'menu.timetable': 'Class Schedule',
    'menu.booked_classes': 'Booked & Cancelled Classes',
    'menu.learning_reports': 'Learning Reports',
    'menu.attendance_report': 'Attendance Report',
    'menu.syllabus_progress': 'Syllabus & Progress',
    'menu.coach_interaction': 'Coach Interaction',
    'menu.ai_assistant': 'AI Sports Assistant',
    'menu.support_requests': 'Support Requests & Forms',
    'menu.news_notifications': 'News & Announcements',
    'menu.packages_payment': 'Packages & Billing',
    'menu.transaction_history': 'Transaction History',
    'menu.coach_overview': 'Coach Dashboard',
    'menu.teaching_schedule': 'Teaching Schedule',
    'menu.classes_students': 'Enrolled Students',
    'menu.class_attendance': 'Class Attendance',
    'menu.lesson_plans': 'Lesson Plans',
    'menu.student_progress': 'Student Evaluation',
    'menu.send_exercises': 'Send Exercises & Notes',
    'menu.ai_exercise_tips': 'AI Workout Suggestions',
    'menu.professional_profile': 'Professional Profile',
    'menu.coach_support_req': 'Coach Support Request',
    'menu.admin_dashboard': 'System Dashboard',
    'menu.member_mgmt': 'Member Management',
    'menu.staff_mgmt': 'Staff Management',
    'menu.package_mgmt': 'Membership Packages',
    'menu.classes_courts_mgmt': 'Classes & Courts',
    'menu.coach_assign': 'Coach Assignment',
    'menu.coach_team_ops': 'Coach Operations',
    'menu.reports_stats': 'Reports & Statistics',
    'menu.roles_perms': 'Roles & Permissions',
    'menu.audit_logs': 'System Audit Logs',
    'menu.home_content': 'Homepage Content',
    'menu.reception_overview': 'Reception Overview',
    'menu.member_lookup': 'Member Lookup',
    'menu.court_checkin': 'Court Check-in',
    'menu.counter_booking': 'Counter Booking',
    'menu.counter_pkg_reg': 'Counter Registration',
    'menu.invoices_cashier': 'Invoices & Cashier',
    'menu.reception_support': 'Support Inquiries',

    // Footer
    'footer.copyright': 'Copyright © 2026 SCMS - Sports Center Management System. All rights reserved.',
    'footer.version': 'Version: 2.0.0.0'
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('SCMS_LANGUAGE') || 'vi';
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('SCMS_LANGUAGE', lang);
    localStorage.setItem('SCMS_SELECTED_LANG', lang);
    window.dispatchEvent(new CustomEvent('SCMS_LANG_CHANGED', { detail: lang }));
  };

  const t = (key, fallback = '') => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.vi;
    if (dict[key] !== undefined) return dict[key];
    if (fallback) return fallback;
    const defaultDict = TRANSLATIONS.vi;
    return defaultDict[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'vi',
      setLanguage: () => {},
      t: (key, fallback) => fallback || key
    };
  }
  return context;
}
