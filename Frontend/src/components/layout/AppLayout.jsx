import React, { useState } from 'react';
import { Header } from './Header.js';
import { Sidebar } from './Sidebar.js';
import { ProfileModal } from '../../features/auth/ProfileModal.js';
import { useAuth } from '../../context/AuthContext.js';
import { MemberAIChatPopup, openMemberAIChat } from '../../features/member/MemberAIChatPopup.jsx';

export function AppLayout({ children, currentPath }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const { role } = useAuth();

  const isMemberArea = role === 'MEMBER' || (currentPath && currentPath.startsWith('#/member'));

  const getBreadcrumbTitle = (path) => {
    if (!path) return 'Bảng điều khiển';
    const clean = path.split('?')[0];
    const titles = {
      '#/': 'Trang chủ',
      '#/login': 'Đăng nhập',
      '#/payment-result': 'Kết quả thanh toán',
      // Member
      '#/member/dashboard': 'Trang cá nhân',
      '#/member/schedule': 'Thời khóa biểu',
      '#/member/bookings': 'Đơn đổi lớp & Đặt chỗ',
      '#/member/attendance': 'Báo cáo điểm danh',
      '#/member/progress': 'Báo cáo học tập & Tiến độ',
      '#/member/packages': 'Gói tập & Thanh toán',
      '#/member/support': 'Đơn từ & Yêu cầu hỗ trợ',
      '#/member/notifications': 'Tin tức & Thông báo',
      '#/member/coach-portal': 'Tương tác với HLV',
      '#/member/ai-assistant': 'Trợ lý thể thao AI',
      // Coach
      '#/coach/dashboard': 'Tổng quan giảng viên',
      '#/coach/schedule': 'Lịch giảng dạy',
      '#/coach/members': 'Danh sách học viên',
      '#/coach/attendance': 'Báo cáo điểm danh',
      '#/coach/training-plan': 'Giáo án giảng dạy',
      '#/coach/progress': 'Báo cáo tiến độ học viên',
      '#/coach/notifications': 'Gửi bài tập & Thông báo',
      '#/coach/ai-recommendation': 'Gợi ý giáo án AI',
      '#/coach/professional': 'Hồ sơ chuyên môn HLV',
      '#/coach/support': 'Yêu cầu hỗ trợ giảng viên',
      // Manager
      '#/manager/dashboard': 'Bảng quản trị hệ thống',
      '#/manager/members': 'Quản lý thành viên',
      '#/manager/staff': 'Quản lý nhân viên',
      '#/manager/packages': 'Gói tập hội viên',
      '#/manager/classes-rooms': 'Lớp học & Sân bãi',
      '#/manager/coach-assignment': 'Phân công HLV',
      '#/manager/coach-operations': 'Vận hành đội ngũ HLV',
      '#/manager/reports': 'Báo cáo & Thống kê',
      '#/manager/roles-permissions': 'Vai trò & Phân quyền',
      '#/manager/audit-logs': 'Nhật ký Audit Logs',
      '#/manager/home-content': 'Nội dung trang chủ & Đa phương tiện',
      // Receptionist
      '#/receptionist/dashboard': 'Tổng quan ca trực lễ tân',
      '#/receptionist/lookup': 'Tra cứu hội viên',
      '#/receptionist/check-in': 'Check-in vào sân',
      '#/receptionist/bookings': 'Đặt / Hủy chỗ tại quầy',
      '#/receptionist/counter-register': 'Đăng ký gói tại quầy',
      '#/receptionist/invoices': 'Hóa đơn & Thu tiền',
      '#/receptionist/support': 'Tiếp nhận yêu cầu hỗ trợ'
    };
    return titles[clean] || 'Trang chi tiết';
  };

  const breadcrumbTitle = getBreadcrumbTitle(currentPath);

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onOpenProfile={() => setProfileModalOpen(true)}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
      />

      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentPath={currentPath}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 lg:pl-64 flex flex-col min-w-0 transition-all duration-300">
          <div className="flex-1 p-3.5 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto">
            {/* FPT Portal Breadcrumb Bar */}
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
              <span className="material-symbols-outlined text-[17px] text-slate-400">home</span>
              <a href="#/" className="hover:text-[#1A3B8B] transition-colors">Trang chủ</a>
              <span className="text-slate-300">/</span>
              <span className="font-bold text-slate-900">{breadcrumbTitle}</span>
            </div>

            {children}
          </div>

          {/* Theme Clean Footer */}
          <footer className="py-3 px-6 bg-[#F4F6FA] border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 mt-auto">
            <span>Bản quyền © 2026 SCMS - Sports Center Management System. Đã đăng ký bản quyền.</span>
            <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500">
              <span className="text-slate-400">Phiên bản: 2.0.0.0</span>
            </div>
          </footer>
        </main>
      </div>

      {/* Floating AI Chat Popup Widget for Members */}
      {isMemberArea && <MemberAIChatPopup />}

      {/* User Profile & Password Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  );
}
