import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { translateCoachName } from '../../services/i18nHelper.js';

export function Sidebar({ isOpen, isDesktopCollapsed = false, onClose, currentPath }) {
  const { currentUser, role, logout } = useAuth();
  const { language } = useLanguage();
  const [expandedGroups, setExpandedGroups] = useState({});

  const isEn = language === 'en';

  const effectiveRole = String(
    role || (
      currentPath?.startsWith('#/member') ? 'MEMBER' :
      currentPath?.startsWith('#/coach') ? 'COACH' :
      currentPath?.startsWith('#/admin') ? 'ADMIN' :
      currentPath?.startsWith('#/manager') ? 'MANAGER' :
      currentPath?.startsWith('#/receptionist') ? 'RECEPTIONIST' :
      'MEMBER'
    )
  ).toUpperCase();

  const getRoleLabel = (r) => {
    switch (String(r || '').toUpperCase()) {
      case 'ADMIN':
        return isEn ? 'System Admin' : 'Quản trị hệ thống';
      case 'MANAGER':
        return isEn ? 'Manager' : 'Quản lý (Manager)';
      case 'STAFF':
      case 'RECEPTIONIST':
        return isEn ? 'Receptionist' : 'Lễ tân (Receptionist)';
      case 'COACH':
        return isEn ? 'Coach' : 'Huấn luyện viên (Coach)';
      case 'MEMBER':
        return isEn ? 'Member' : 'Hội viên (Member)';
      default:
        return r || (isEn ? 'Member' : 'Hội viên');
    }
  };

  const getUserInitials = (name) => {
    if (!name) return 'H';
    const parts = name.trim().split(/\s+/).filter(w => !/^\d+$/.test(w));
    if (parts.length === 0) return 'SC';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const rawDisplayName = currentUser?.fullName || currentUser?.name || currentUser?.username || (
    effectiveRole === 'COACH' ? (isEn ? 'Coach 01' : 'Huấn luyện viên 01') :
    'Huỳnh Nhật Huy'
  );

  const displayName = effectiveRole === 'COACH' ? translateCoachName(rawDisplayName, isEn) : rawDisplayName;
  const roleLabel = getRoleLabel(effectiveRole);
  const userInitials = getUserInitials(displayName);

  // Cấu hình các nhóm danh mục đồng bộ đa ngôn ngữ (Tiếng Việt & English)
  const getFptMenuSections = () => {
    const normalizedRole = effectiveRole;

    if (normalizedRole === 'MEMBER') {
      return [
        {
          category: isEn ? 'TRAINING & SCHEDULE' : 'HỌC TẬP',
          items: [
            {
              id: 'member_dashboard',
              label: isEn ? 'Member Dashboard' : 'Trang cá nhân',
              icon: 'dashboard',
              path: '#/member/dashboard'
            },
            {
              id: 'member_schedule_group',
              label: isEn ? 'Class Schedule' : 'Lịch học',
              icon: 'calendar_month',
              subItems: [
                { label: isEn ? 'Timetable' : 'Thời khóa biểu', path: '#/member/schedule' },
                { label: isEn ? 'Booked & Cancelled' : 'Lớp đã đặt & Hủy', path: '#/member/bookings' }
              ]
            },
            {
              id: 'member_reports_group',
              label: isEn ? 'Learning Reports' : 'Báo cáo học tập',
              icon: 'fact_check',
              subItems: [
                { label: isEn ? 'Attendance Report' : 'Báo cáo điểm danh', path: '#/member/attendance' },
                { label: isEn ? 'Syllabus & Progress' : 'Giáo án & Tiến độ', path: '#/member/progress' }
              ]
            },
            {
              id: 'member_coach_portal',
              label: isEn ? 'Coach Interaction' : 'Tương tác với HLV',
              icon: 'connect_without_contact',
              path: '#/member/coach-portal'
            }
          ]
        },
        {
          category: isEn ? 'REQUESTS & FORMS' : 'ĐƠN TỪ',
          items: [
            {
              id: 'member_support',
              label: isEn ? 'Support Requests & Forms' : 'Yêu cầu hỗ trợ & Đơn từ',
              icon: 'support_agent',
              path: '#/member/support'
            },
            {
              id: 'member_notifications',
              label: isEn ? 'News & Announcements' : 'Tin tức & Thông báo',
              icon: 'notifications',
              path: '#/member/notifications'
            }
          ]
        },
        {
          category: isEn ? 'FINANCE & BILLING' : 'TÀI CHÍNH',
          items: [
            {
              id: 'member_packages',
              label: isEn ? 'Packages & Billing' : 'Gói tập & Thanh toán',
              icon: 'credit_card',
              subItems: [
                { label: isEn ? 'Packages & Billing' : 'Gói tập & Thanh toán', path: '#/member/packages' },
                { label: isEn ? 'Refund Requests' : 'Yêu cầu hoàn tiền', path: '#/member/refunds' }
              ]
            }
          ]
        }
      ];
    }

    if (normalizedRole === 'COACH') {
      return [
        {
          category: isEn ? 'SCHEDULE & ATTENDANCE' : 'LỊCH & ĐIỂM DANH',
          items: [
            {
              id: 'coach_dashboard',
              label: isEn ? 'Coach Overview' : 'Tổng quan Dashboard',
              icon: 'dashboard',
              path: '#/coach/dashboard'
            },
            {
              id: 'coach_schedule_group',
              label: isEn ? 'Schedule & Attendance' : 'Lịch & Điểm danh',
              icon: 'calendar_month',
              subItems: [
                { label: isEn ? 'Teaching Schedule' : 'Lịch giảng dạy', path: '#/coach/schedule' },
                { label: isEn ? 'Attendance Check-in' : 'Điểm danh học viên', path: '#/coach/attendance' },
                { label: isEn ? 'Leave Requests' : 'Xin nghỉ phép', path: '#/coach/professional?tab=schedule' }
              ]
            },
            {
              id: 'coach_members',
              label: isEn ? 'Students & Goals' : 'Học viên & Mục tiêu',
              icon: 'group',
              path: '#/coach/members'
            }
          ]
        },
        {
          category: isEn ? 'TRAINING & PROGRESS' : 'GIÁO ÁN & TIẾN ĐỘ',
          items: [
            {
              id: 'coach_plans_group',
              label: isEn ? 'Workout Plans & Journal' : 'Giáo án & Tiến độ',
              icon: 'fitness_center',
              subItems: [
                { label: isEn ? 'Create Workout Plans' : 'Tạo kế hoạch tập luyện', path: '#/coach/training-plan' },
                { label: isEn ? 'Session Journal & Progress' : 'Nhật ký & Đánh giá tiến độ', path: '#/coach/progress' }
              ]
            }
          ]
        },
        {
          category: isEn ? 'AI ASSISTANT' : 'TRỢ LÝ AI',
          items: [
            {
              id: 'coach_ai_recommendation',
              label: isEn ? 'AI Lesson Assistant' : 'Gợi ý giáo án AI',
              icon: 'neurology',
              path: '#/coach/ai-recommendation'
            }
          ]
        },
        {
          category: isEn ? 'INTERACTION & OPS' : 'TƯƠNG TÁC & VẬN HÀNH',
          items: [
            {
              id: 'coach_messages',
              label: isEn ? 'Student Messages' : 'Tin nhắn học viên',
              icon: 'chat',
              path: '#/coach/messages'
            },
            {
              id: 'coach_notifications',
              label: isEn ? 'Notices & Homework' : 'Tương tác & Bài tập về nhà',
              icon: 'forum',
              path: '#/coach/notifications'
            },
            {
              id: 'coach_performance',
              label: isEn ? 'Performance & Salary' : 'Hiệu suất & Lương',
              icon: 'monitoring',
              subItems: [
                { label: isEn ? 'Teaching Performance' : 'Thống kê hiệu suất', path: '#/coach/performance' },
                { label: isEn ? 'My Salary' : 'Bảng lương của tôi', path: '#/coach/salary' }
              ]
            }
          ]
        }
      ];
    }

    if (normalizedRole === 'RECEPTIONIST') {
      return [
        {
          category: isEn ? 'FRONT DESK' : 'QUẦY LỄ TÂN',
          items: [
            {
              id: 'rec_dashboard',
              label: isEn ? 'Shift Overview' : 'Tổng quan ca trực',
              icon: 'countertops',
              path: '#/receptionist/dashboard'
            }
          ]
        },
        {
          category: isEn ? 'MEMBER SERVICES' : 'NGHIỆP VỤ HỘI VIÊN',
          items: [
            {
              id: 'rec_members_group',
              label: isEn ? 'Members & Bookings' : 'Hội viên & Đặt chỗ',
              icon: 'person_search',
              subItems: [
                { label: isEn ? 'Member Lookup' : 'Tra cứu hội viên', path: '#/receptionist/lookup' },
                { label: isEn ? 'Court Check-in' : 'Check-in vào sân', path: '#/receptionist/check-in' },
                { label: isEn ? 'Counter Booking / Cancel' : 'Đặt / Hủy chỗ tại quầy', path: '#/receptionist/bookings' }
              ]
            }
          ]
        },
        {
          category: isEn ? 'FINANCE & SUPPORT' : 'TÀI CHÍNH & HỖ TRỢ',
          items: [
            {
              id: 'rec_billing_group',
              label: isEn ? 'Cashier & Invoices' : 'Thu ngân & Hóa đơn',
              icon: 'point_of_sale',
              subItems: [
                { label: isEn ? 'Counter Sign-up / Renewal' : 'ĐK / Gia hạn tại quầy', path: '#/receptionist/counter-register' },
                { label: isEn ? 'Invoices & Billing' : 'Hóa đơn & Thu tiền', path: '#/receptionist/invoices' }
              ]
            },
            {
              id: 'rec_support',
              label: isEn ? 'Receive Support Requests' : 'Tiếp nhận hỗ trợ',
              icon: 'support_agent',
              path: '#/receptionist/support'
            },
            {
              id: 'rec_payroll',
              label: isEn ? 'My Salary' : 'Bảng lương của tôi',
              icon: 'payments',
              path: '#/receptionist/payroll'
            }
          ]
        }
      ];
    }

    if (normalizedRole === 'ADMIN') {
      return [
        {
          category: isEn ? 'SYSTEM OVERVIEW' : 'TỔNG QUAN HỆ THỐNG',
          items: [
            { id: 'admin_dashboard', label: isEn ? 'Admin Dashboard' : 'Bảng quản trị', icon: 'admin_panel_settings', path: '#/admin/dashboard' }
          ]
        },
        {
          category: isEn ? 'SYSTEM GOVERNANCE' : 'QUẢN TRỊ HỆ THỐNG',
          items: [
            {
              id: 'admin_structure', label: isEn ? 'Centers & Managers' : 'Cơ sở & Manager', icon: 'account_tree',
              subItems: [
                { label: isEn ? 'Centers' : 'Quản lý cơ sở', path: '#/admin/centers' },
                { label: isEn ? 'Managers' : 'Tài khoản Manager', path: '#/admin/managers' },
                { label: isEn ? 'Accounts & Sessions' : 'Tài khoản & phiên đăng nhập', path: '#/admin/accounts' }
              ]
            }
          ]
        },
        {
          category: isEn ? 'SECURITY & CONTENT' : 'BẢO MẬT & NỘI DUNG',
          items: [
            { id: 'admin_roles', label: isEn ? 'Roles & Permissions' : 'Vai trò & phân quyền', icon: 'policy', path: '#/admin/roles-permissions' },
            { id: 'admin_audit', label: isEn ? 'System Audit Log' : 'Nhật ký audit hệ thống', icon: 'history', path: '#/admin/audit-logs' },
            { id: 'admin_content', label: isEn ? 'Homepage Content' : 'Nội dung trang chủ', icon: 'dashboard_customize', path: '#/admin/home-content' },
            { id: 'admin_payroll', label: isEn ? 'System Payroll' : 'Lương toàn hệ thống', icon: 'payments', path: '#/admin/payroll' }
          ]
        }
      ];
    }

    return [
      {
        category: isEn ? 'OVERVIEW' : 'TỔNG QUAN',
        items: [
          {
            id: 'mgr_dashboard',
            label: isEn ? 'Manager Dashboard' : 'Bảng quản lý cơ sở',
            icon: 'dashboard',
            path: '#/manager/dashboard'
          }
        ]
      },
      {
        category: isEn ? 'OPERATIONS & MEMBERS' : 'VẬN HÀNH & HỘI VIÊN',
        items: [
          {
            id: 'mgr_operation_group',
            label: isEn ? 'Operations Management' : 'Quản lý vận hành',
            icon: 'sports_score',
            subItems: [
              { label: isEn ? 'Member Management' : 'Quản lý thành viên', path: '#/manager/members' },
              { label: isEn ? 'Classes, Sports & Courts' : 'Lớp, bộ môn & phòng', path: '#/manager/classes-rooms' },
              { label: isEn ? 'Membership Packages' : 'Gói tập hội viên', path: '#/manager/packages' },
              { label: isEn ? 'Coach Assignment' : 'Phân công HLV', path: '#/manager/coach-assignment' },
              { label: isEn ? 'Coach Leave Approvals' : 'Duyệt đơn nghỉ HLV', path: '#/manager/coach-operations' },
              ...(normalizedRole === 'MANAGER' ? [{ label: isEn ? 'Support & Announcements' : 'Hỗ trợ & Thông báo', path: '#/manager/support-communications' }] : []),
              { label: isEn ? 'Homepage Content' : 'Nội dung trang chủ', path: '#/manager/home-content' }
            ]
          }
        ]
      },
      ...(normalizedRole === 'SYSTEMADMIN' ? [] : [{
        category: isEn ? 'FINANCE & BILLING' : 'TÀI CHÍNH & HÓA ĐƠN',
        items: [
          {
            id: 'mgr_invoices',
            label: isEn ? 'Invoices & Payments' : 'Hóa đơn & Tài chính',
            icon: 'receipt_long',
            subItems: [
              { label: isEn ? 'Invoices & Refunds' : 'Hóa đơn & Hoàn tiền', path: '#/manager/invoices' }
            ]
          }
        ]
      }]),
      {
        category: isEn ? 'SALARY' : 'TIỀN LƯƠNG',
        items: [
          { id: 'mgr_payroll', label: isEn ? 'Salary & Payroll Report' : 'Lương & Báo cáo tiền lương', icon: 'payments', path: '#/manager/payroll' }
        ]
      },
      {
        category: isEn ? 'CENTER STAFF' : 'NHÂN SỰ CƠ SỞ',
        items: [
          {
            id: 'mgr_staff',
            label: isEn ? 'Staff Management' : 'Quản lý nhân sự',
            icon: 'badge',
            path: '#/manager/staff'
          }
        ]
      },
      {
        category: isEn ? 'REPORTS & AUDIT' : 'BÁO CÁO & BẢO MẬT',
        items: [
          {
            id: 'mgr_reports',
            label: isEn ? 'Reports & Statistics' : 'Báo cáo & Thống kê',
            icon: 'analytics',
            path: '#/manager/reports'
          },
          {
            id: 'mgr_audit',
            label: isEn ? 'Audit Logs' : 'Nhật ký Audit Logs',
            icon: 'history',
            path: '#/manager/audit-logs'
          }
        ]
      }
    ];
  };

  const sections = getFptMenuSections();

  // Tự động mở menu cha nếu có menu con đang active theo đường dẫn hiện tại
  useEffect(() => {
    sections.forEach(sec => {
      sec.items?.forEach(item => {
        if (item.subItems) {
          const hasActiveChild = item.subItems.some(sub =>
            currentPath === sub.path || (currentPath?.startsWith(sub.path) && sub.path !== '#/manager/dashboard')
          );
          if (hasActiveChild) {
            setExpandedGroups(prev => ({ ...prev, [item.id]: true }));
          }
        }
      });
    });
  }, [currentPath]);

  const toggleGroup = (id) => {
    setExpandedGroups(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // State to track clicked/pinned flyout in collapsed mini-sidebar
  const [activeFlyoutId, setActiveFlyoutId] = useState(null);

  // Close flyout when route changes or sidebar collapses/expands
  useEffect(() => {
    setActiveFlyoutId(null);
  }, [currentPath, isDesktopCollapsed]);

  // Click outside to dismiss pinned flyout (debounced listener to avoid dismissing on same-tick click bubbling)
  useEffect(() => {
    if (!activeFlyoutId) return;

    let cleanup = () => {};
    const timer = setTimeout(() => {
      const handleClickOutside = (e) => {
        if (e.target && typeof e.target.closest === 'function' && e.target.closest('.mini-flyout-container')) {
          return;
        }
        setActiveFlyoutId(null);
      };
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setActiveFlyoutId(null);
      };
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);

      cleanup = () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, 50);

    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, [activeFlyoutId]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 left-0 bottom-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-2xl w-64' : '-translate-x-full'
        } ${
          isDesktopCollapsed
            ? 'lg:translate-x-0 lg:w-20'
            : 'lg:translate-x-0 lg:w-64'
        }`}
        style={isDesktopCollapsed ? { overflow: 'visible' } : undefined}
      >
        {/* Navigation Menu Body: overflow-visible guaranteed in collapsed mode so popovers are never clipped */}
        <div
          className={`flex-1 ${isDesktopCollapsed ? 'px-2 py-4 space-y-3' : 'overflow-y-auto px-3 py-4 space-y-5'}`}
          style={isDesktopCollapsed ? { overflow: 'visible' } : undefined}
        >
          {sections.map((section, idx) => (
            <div key={idx} className={isDesktopCollapsed ? 'space-y-2' : 'space-y-1'}>
              {/* Category Divider / Header */}
              {isDesktopCollapsed ? (
                idx > 0 && <div className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800 my-2 mx-auto" />
              ) : (
                <div className="px-2.5 py-1.5 text-[11px] font-bold text-[#2D6A4F] dark:text-emerald-400 uppercase tracking-wider">
                  {section.category}
                </div>
              )}

              {/* Menu Items */}
              {section.items.map((item) => {
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const isExpanded = expandedGroups[item.id] !== false;
                const isAnyChildActive = hasSubItems && item.subItems.some(sub =>
                  currentPath === sub.path ||
                  (currentPath?.startsWith(sub.path) && sub.path !== '#/manager/dashboard')
                );
                const isMemberDashboard =
                  (item.path === '#/member' || item.path === '#/member/dashboard') &&
                  (currentPath === '#/member' || currentPath === '#/member/dashboard');
                const isCoachDashboard =
                  (item.path === '#/coach' || item.path === '#/coach/dashboard') &&
                  (currentPath === '#/coach' || currentPath === '#/coach/dashboard');
                const isManagerDashboard =
                  (item.path === '#/manager' || item.path === '#/manager/dashboard') &&
                  (currentPath === '#/manager' || currentPath === '#/manager/dashboard');

                const isActive =
                  currentPath === item.path ||
                  isMemberDashboard ||
                  isCoachDashboard ||
                  isManagerDashboard ||
                  (currentPath?.startsWith(item.path) &&
                    item.path !== '#/manager/dashboard' &&
                    item.path !== '#/manager' &&
                    item.path !== '#/member' &&
                    item.path !== '#/member/dashboard' &&
                    item.path !== '#/coach' &&
                    item.path !== '#/coach/dashboard');

                /* ─────────────────────────────────────────────────────────────
                   MODE 1: COLLAPSED MINI-SIDEBAR (MATCHING USER REFERENCE)
                ───────────────────────────────────────────────────────────── */
                if (isDesktopCollapsed) {
                  const isFlyoutOpen = activeFlyoutId === item.id;

                  if (hasSubItems) {
                    return (
                      <div key={item.id} className="relative group mini-flyout-container flex justify-center w-full">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveFlyoutId(prev => prev === item.id ? null : item.id);
                          }}
                          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                            isAnyChildActive || isFlyoutOpen
                              ? 'bg-[#81B29A]/25 text-[#2D6A4F] dark:text-emerald-300 border border-[#81B29A]/40 font-bold shadow-2xs scale-105'
                              : 'bg-[#F0F4F8] dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-[#81B29A]/15 hover:text-[#2D6A4F] dark:hover:text-emerald-400'
                          }`}
                          title={item.label}
                          aria-expanded={isFlyoutOpen}
                        >
                          <span className={`material-symbols-outlined text-[20px] ${isAnyChildActive || isFlyoutOpen ? 'text-[#81B29A] dark:text-emerald-400' : ''}`}>
                            {item.icon}
                          </span>
                        </button>

                        {/* Floating Flyout Menu: unclipped, locked on click, opens on hover */}
                        <div
                          className={`absolute left-full top-1/2 -translate-y-1/2 ml-3 w-64 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl shadow-2xl shadow-slate-400/30 dark:shadow-black/60 p-2.5 z-50 pointer-events-auto transition-all ${
                            isFlyoutOpen ? 'block' : 'hidden group-hover:block'
                          }`}
                          style={{ zIndex: 100 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Anchor Notch pointing to button */}
                          <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-slate-900 border-l border-t border-slate-200/90 dark:border-slate-700/80 -rotate-45 z-10" />

                          {/* Hover bridge covering the entire gap */}
                          <div className="absolute -left-6 top-0 bottom-0 w-6 pointer-events-auto" />

                          {/* Header with Group Title */}
                          <div className="px-3 py-2 text-xs font-bold text-[#1E2235] dark:text-white border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 mb-1.5">
                            <div className="w-6 h-6 rounded-lg bg-[#81B29A]/15 text-[#2D6A4F] dark:text-emerald-400 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
                            </div>
                            <span className="truncate">{item.label}</span>
                          </div>

                          {/* Submenu Links matching user photo with mini hamburger icon boxes */}
                          <div className="space-y-1">
                            {item.subItems.map((sub, sIdx) => {
                              const isChildActive = currentPath === sub.path || (currentPath?.startsWith(sub.path) && sub.path !== '#/manager/dashboard');
                              return (
                                <a
                                  key={sIdx}
                                  href={sub.path}
                                  onClick={() => {
                                    setActiveFlyoutId(null);
                                    onClose?.();
                                  }}
                                  className={`flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                                    isChildActive
                                      ? 'bg-[#81B29A]/15 text-[#2D6A4F] dark:text-emerald-300 border border-[#81B29A]/30 shadow-2xs'
                                      : 'text-slate-700 dark:text-slate-300 hover:bg-[#81B29A]/10 hover:text-[#2D6A4F] dark:hover:text-emerald-300'
                                  }`}
                                >
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                    isChildActive
                                      ? 'bg-[#81B29A]/25 text-[#2D6A4F] dark:text-emerald-400'
                                      : 'bg-[#F0F4F8] dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                  }`}>
                                    <span className="material-symbols-outlined text-[16px]">menu</span>
                                  </div>
                                  <span className="truncate">{sub.label}</span>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={item.id} className="relative group flex justify-center w-full">
                      <a
                        href={item.path}
                        onClick={(e) => {
                          if (item.isPopup) {
                            e.preventDefault();
                            window.dispatchEvent(new CustomEvent('SCMS_OPEN_AI_POPUP'));
                          }
                        }}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#81B29A]/25 text-[#2D6A4F] dark:text-emerald-300 border border-[#81B29A]/40 font-bold shadow-2xs scale-105'
                            : 'bg-[#F0F4F8] dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-[#81B29A]/15 hover:text-[#2D6A4F] dark:hover:text-emerald-400'
                        }`}
                        title={item.label}
                      >
                        <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-[#81B29A] dark:text-emerald-400' : ''}`}>
                          {item.icon}
                        </span>
                      </a>

                      {/* Tooltip on Hover (Synchronized light card, NO black) */}
                      <div
                        className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-white dark:bg-slate-800 text-[#1E2235] dark:text-white text-xs font-semibold rounded-xl shadow-lg border border-slate-200/90 dark:border-slate-700 whitespace-nowrap hidden group-hover:block z-50 pointer-events-none"
                        style={{ zIndex: 100 }}
                      >
                        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-white dark:bg-slate-800 border-l border-t border-slate-200/90 dark:border-slate-700 -rotate-45" />
                        {item.label}
                      </div>
                    </div>
                  );
                }

                /* ─────────────────────────────────────────────────────────────
                   MODE 2: EXPANDED FULL-SIDEBAR (MATCHING IMAGE 2)
                ───────────────────────────────────────────────────────────── */
                if (hasSubItems) {
                  return (
                    <div key={item.id} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => toggleGroup(item.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          isAnyChildActive
                            ? 'text-[#2D6A4F] dark:text-emerald-300 bg-[#81B29A]/15 dark:bg-emerald-950/40 border border-[#81B29A]/20'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#81B29A] dark:hover:text-emerald-400'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            isAnyChildActive
                              ? 'bg-[#81B29A]/20 text-[#2D6A4F] dark:text-emerald-400'
                              : 'bg-[#F0F4F8] dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
                          </div>
                          <span className="truncate">{item.label}</span>
                        </div>

                        <span className={`material-symbols-outlined text-[17px] text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                          expand_more
                        </span>
                      </button>

                      {/* Accordion Submenu Children */}
                      {isExpanded && (
                        <div className="border-l-2 border-slate-200/80 dark:border-slate-800 ml-6 pl-3 py-1 space-y-0.5">
                          {item.subItems.map((sub, sIdx) => {
                            const isChildActive =
                              currentPath === sub.path ||
                              (currentPath?.startsWith(sub.path) && sub.path !== '#/manager/dashboard');

                            return (
                              <a
                                key={sIdx}
                                href={sub.path}
                                onClick={onClose}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                  isChildActive
                                    ? 'bg-[#81B29A]/15 dark:bg-emerald-900/40 text-[#2D6A4F] dark:text-emerald-300 font-bold border border-[#81B29A]/30'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                }`}
                              >
                                <span className={`text-[10px] ${isChildActive ? 'text-[#81B29A] dark:text-emerald-400 font-black' : 'text-slate-300 dark:text-slate-600'}`}>
                                  •
                                </span>
                                <span className="truncate">{sub.label}</span>
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                // Direct Link in Expanded Mode
                return (
                  <a
                    key={item.id}
                    href={item.path}
                    onClick={(e) => {
                      if (item.isPopup) {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('SCMS_OPEN_AI_POPUP'));
                        onClose?.();
                      } else {
                        onClose?.();
                      }
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                      isActive
                        ? 'bg-[#81B29A]/15 dark:bg-emerald-950/40 text-[#2D6A4F] dark:text-emerald-300 font-bold border border-[#81B29A]/30 shadow-2xs'
                        : 'text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#81B29A] dark:hover:text-emerald-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? 'bg-[#81B29A]/20 text-[#2D6A4F] dark:text-emerald-400'
                          : 'bg-[#F0F4F8] dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
                      </div>
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.isPopup && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[9px] font-bold uppercase border border-amber-200 dark:border-amber-800">
                        AI
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer: SCMS Status & Logout */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          {isDesktopCollapsed ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => { logout(); window.location.hash = '#/login'; }}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer shadow-2xs"
                title={`${displayName} (${roleLabel}) - ${isEn ? 'Sign Out' : 'Đăng xuất'}`}
              >
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={displayName}
                    className="w-7 h-7 rounded-lg object-cover"
                  />
                ) : (
                  <span className="text-xs font-black text-[#2D6A4F] dark:text-[#81B29A]">{userInitials}</span>
                )}
              </button>
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-2xs gap-2 min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={displayName}
                    className="w-8 h-8 rounded-[10px] object-cover border border-[#81B29A]/40 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-[#81B29A] via-[#A8DADC] to-[#F2CC8F] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs ring-1 ring-white/60 dark:ring-slate-700">
                    <span>{userInitials}</span>
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[130px]" title={displayName}>
                    {displayName}
                  </span>
                  <span className="text-[10px] text-[#2D6A4F] dark:text-[#81B29A] font-semibold truncate leading-tight">
                    {roleLabel}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { logout(); window.location.hash = '#/login'; }}
                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer shrink-0"
                title={isEn ? 'Sign Out' : 'Đăng xuất'}
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
