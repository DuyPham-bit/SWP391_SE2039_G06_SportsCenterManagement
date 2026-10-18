import React, { useState } from 'react';
import { Header } from './Header.js';
import { Sidebar } from './Sidebar.js';
import { ProfileModal } from '../../features/auth/ProfileModal.js';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { MemberAIChatPopup, openMemberAIChat } from '../../features/member/MemberAIChatPopup.jsx';

export function AppLayout({ children, currentPath }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const { role } = useAuth();
  const { language, t } = useLanguage();

  const isMemberArea = role === 'MEMBER' || (currentPath && currentPath.startsWith('#/member'));

  const getBreadcrumbTitle = (path) => {
    if (!path) return language === 'en' ? 'Dashboard' : 'Bảng điều khiển';
    const clean = path.split('?')[0];

    const routeKeyMap = {
      '#/': 'nav.home',
      '#/login': 'nav.login',
      '#/payment-result': 'nav.payment_result',
      // Member
      '#/member/dashboard': 'nav.member_dashboard',
      '#/member/schedule': 'nav.member_schedule',
      '#/member/bookings': 'nav.member_bookings',
      '#/member/attendance': 'nav.member_attendance',
      '#/member/progress': 'nav.member_progress',
      '#/member/packages': 'nav.member_packages',
      '#/member/support': 'nav.member_support',
      '#/member/notifications': 'nav.member_notifications',
      '#/member/coach-portal': 'nav.member_coach_portal',
      '#/member/ai-assistant': 'nav.member_ai_assistant',
      // Coach
      '#/coach/dashboard': 'nav.coach_dashboard',
      '#/coach/schedule': 'nav.coach_schedule',
      '#/coach/members': 'nav.coach_members',
      '#/coach/attendance': 'nav.coach_attendance',
      '#/coach/training-plan': 'nav.coach_training_plan',
      '#/coach/progress': 'nav.coach_progress',
      '#/coach/notifications': 'nav.coach_notifications',
      '#/coach/ai-recommendation': 'nav.coach_ai_recommendation',
      '#/coach/salary-kpi': 'nav.coach_salary_kpi',
      '#/coach/kpi': 'nav.coach_salary_kpi',
      '#/coach/resources': 'nav.coach_resources',
      '#/coach/equipment': 'nav.coach_resources',
      '#/coach/professional': 'nav.coach_professional',
      '#/coach/support': 'nav.coach_support',
      // Manager
      '#/manager/dashboard': 'nav.manager_dashboard',
      '#/manager/members': 'nav.manager_members',
      '#/manager/staff': 'nav.manager_staff',
      '#/manager/packages': 'nav.manager_packages',
      '#/manager/classes-rooms': 'nav.manager_classes_rooms',
      '#/manager/coach-assignment': 'nav.manager_coach_assignment',
      '#/manager/coach-operations': 'nav.manager_coach_operations',
      '#/manager/reports': 'nav.manager_reports',
      '#/manager/roles-permissions': 'nav.manager_roles_permissions',
      '#/manager/audit-logs': 'nav.manager_audit_logs',
      '#/manager/home-content': 'nav.manager_home_content',
      // Receptionist
      '#/receptionist/dashboard': 'nav.receptionist_dashboard',
      '#/receptionist/lookup': 'nav.receptionist_lookup',
      '#/receptionist/check-in': 'nav.receptionist_check_in',
      '#/receptionist/bookings': 'nav.receptionist_bookings',
      '#/receptionist/counter-register': 'nav.receptionist_counter_register',
      '#/receptionist/invoices': 'nav.receptionist_invoices',
      '#/receptionist/support': 'nav.receptionist_support'
    };

    const key = routeKeyMap[clean];
    if (key) return t(key);
    return language === 'en' ? 'Detail Page' : 'Trang chi tiết';
  };

  const breadcrumbTitle = getBreadcrumbTitle(currentPath);

  return (
    <div className="min-h-screen bg-[#F4F6FA] dark:bg-slate-950 flex flex-col font-sans transition-colors">
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
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
              <span className="material-symbols-outlined text-[17px] text-slate-400">home</span>
              <a href="#/" className="hover:text-[#1A3B8B] dark:hover:text-blue-400 transition-colors">
                {t('nav.home', 'Trang chủ')}
              </a>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="font-bold text-slate-900 dark:text-white">{breadcrumbTitle}</span>
            </div>

            {children}
          </div>

          {/* Theme Clean Footer */}
          <footer className="py-3 px-6 bg-[#F4F6FA] dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 mt-auto transition-colors">
            <span>{t('footer.copyright', 'Bản quyền © 2026 SCMS - Sports Center Management System. Đã đăng ký bản quyền.')}</span>
            <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <span>{t('footer.version', 'Phiên bản: 2.0.0.0')}</span>
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
