import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { translateCoachName } from '../../services/i18nHelper.js';

export function Sidebar({ isOpen, isDesktopCollapsed = false, onClose, currentPath, onToggleDesktop }) {
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

  // Floating Popover state for Collapsed Mini-Sidebar (rendered fixed outside scroll container)
  const [activeFlyout, setActiveFlyout] = useState(null); // { item, top, left, isLocked }
  const flyoutTimerRef = useRef(null);

  const handleFlyoutHover = (item, e) => {
    if (!isDesktopCollapsed) return;
    if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveFlyout(prev => {
      if (prev?.isLocked && prev.item.id !== item.id) return prev;
      return {
        item,
        top: Math.round(rect.top + rect.height / 2),
        left: Math.round(rect.right + 12),
        isLocked: prev?.item?.id === item.id ? prev.isLocked : false
      };
    });
  };

  const handleFlyoutLeave = () => {
    if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
    flyoutTimerRef.current = setTimeout(() => {
      setActiveFlyout(prev => (prev?.isLocked ? prev : null));
    }, 180);
  };

  const handleItemClickToggle = (item, e) => {
    if (!isDesktopCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveFlyout(prev => {
      if (prev?.item?.id === item.id && prev.isLocked) {
        return null;
      }
      return {
        item,
        top: Math.round(rect.top + rect.height / 2),
        left: Math.round(rect.right + 12),
        isLocked: true
      };
    });
  };

  // Close flyout when route changes or sidebar collapses/expands
  useEffect(() => {
    setActiveFlyout(null);
  }, [currentPath, isDesktopCollapsed]);

  // Click outside to dismiss pinned flyout
  useEffect(() => {
    if (!activeFlyout?.isLocked) return;

    const handleClickOutside = (e) => {
      if (e.target && typeof e.target.closest === 'function' && (
        e.target.closest('.scms-floating-flyout') || e.target.closest('.mini-icon-btn')
      )) {
        return;
      }
      setActiveFlyout(null);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveFlyout(null);
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeFlyout]);

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

      {/* Sidebar Container: Floating Capsule Dock on Desktop */}
      <aside
        className={`fixed z-40 flex flex-col transition-all duration-300 ease-in-out ${
          isOpen
            ? 'top-0 left-0 bottom-0 w-64 bg-white dark:bg-slate-900 shadow-2xl translate-x-0'
            : 'top-0 left-0 bottom-0 w-64 bg-white dark:bg-slate-900 -translate-x-full lg:translate-x-0'
        } ${
          isDesktopCollapsed
            ? 'lg:top-[74px] lg:bottom-4 lg:left-3.5 lg:w-[72px] lg:rounded-[28px] lg:border lg:border-slate-200/80 dark:lg:border-slate-800/80 lg:bg-white/90 dark:lg:bg-slate-900/90 lg:backdrop-blur-xl lg:shadow-2xl lg:shadow-slate-900/10 dark:lg:shadow-black/50'
            : 'lg:top-[74px] lg:bottom-4 lg:left-3.5 lg:w-64 lg:rounded-[28px] lg:border lg:border-slate-200/80 dark:lg:border-slate-800/80 lg:bg-white/95 dark:lg:bg-slate-900/95 lg:backdrop-blur-xl lg:shadow-2xl lg:shadow-slate-900/10 dark:lg:shadow-black/50'
        }`}
      >
        {/* Floating Expand/Collapse Button on Edge matching reference */}
        {onToggleDesktop && (
          <button
            type="button"
            onClick={onToggleDesktop}
            className="hidden lg:flex absolute -right-3 top-6 z-50 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#2D6A4F] dark:hover:text-emerald-400 hover:scale-110 active:scale-95 transition-all cursor-pointer"
            title={isDesktopCollapsed ? (isEn ? 'Expand vertical sidebar' : 'Mở rộng thanh menu') : (isEn ? 'Collapse vertical sidebar' : 'Thu gọn thanh menu')}
            aria-label={isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="material-symbols-outlined text-[15px] font-bold">
              {isDesktopCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        )}

        {/* Capsule Top: macOS traffic lights & SCMS branding */}
        <div className="pt-3 pb-1 px-3 shrink-0 flex flex-col items-center">
          {/* Traffic Light Dots */}
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shadow-2xs" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-2xs" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-2xs" />
          </div>

          {isDesktopCollapsed ? (
            <>
              {/* Brand Logo & Monogram (Collapsed) */}
              <span className="text-[12px] font-black tracking-widest text-[#2D6A4F] dark:text-[#81B29A] uppercase mb-1">
                SCMS
              </span>
              <div className="w-7 h-[1px] bg-slate-200/80 dark:bg-slate-800 my-1 mx-auto" />
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2D6A4F] to-[#81B29A] text-white font-black text-sm flex items-center justify-center shadow-xs italic my-0.5">
                S
              </div>
              <div className="w-7 h-[1px] bg-slate-200/80 dark:bg-slate-800 my-1 mx-auto" />
              <span className="text-[9px] font-extrabold text-[#2D6A4F]/70 dark:text-emerald-400/70 tracking-widest uppercase text-center py-0.5">
                MENU
              </span>
            </>
          ) : (
            <div className="w-full flex items-center justify-between gap-2.5 px-1 py-1 mb-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2D6A4F] to-[#81B29A] text-white font-black text-sm flex items-center justify-center shadow-xs italic shrink-0">
                  S
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-black tracking-wider text-[#2D6A4F] dark:text-[#81B29A] leading-tight">
                    SCMS
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold truncate">
                    {roleLabel}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-black text-[#2D6A4F] dark:text-emerald-400 tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#81B29A]/15 border border-[#81B29A]/20">
                MENU
              </span>
            </div>
          )}
        </div>

        {/* Navigation Menu Body: Smoothly scrollable with sleek slim scrollbar */}
        <div className={`flex-1 overflow-y-auto scms-sidebar-scroll ${isDesktopCollapsed ? 'px-2 py-1 space-y-2' : 'px-3 py-2 space-y-4'}`}>
          {sections.map((section, idx) => (
            <div key={idx} className={isDesktopCollapsed ? 'space-y-1.5' : 'space-y-1'}>
              {/* Category Divider / Header */}
              {isDesktopCollapsed ? (
                idx > 0 && <div className="w-6 h-[1px] bg-slate-200 dark:bg-slate-800 my-1.5 mx-auto" />
              ) : (
                <div className="px-2.5 py-1 text-[11px] font-bold text-[#2D6A4F] dark:text-emerald-400 uppercase tracking-wider">
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

                /* MODE 1: COLLAPSED MINI-SIDEBAR */
                if (isDesktopCollapsed) {
                  const isFlyoutOpen = activeFlyout?.item?.id === item.id;

                  if (hasSubItems) {
                    return (
                      <div key={item.id} className="relative flex justify-center w-full">
                        <button
                          type="button"
                          onMouseEnter={(e) => handleFlyoutHover(item, e)}
                          onMouseLeave={handleFlyoutLeave}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleItemClickToggle(item, e);
                          }}
                          className={`mini-icon-btn w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative ${
                            isAnyChildActive || isFlyoutOpen
                              ? 'bg-[#81B29A]/25 text-[#2D6A4F] dark:text-emerald-300 border border-[#81B29A]/50 font-bold shadow-xs scale-105 ring-2 ring-[#81B29A]/20'
                              : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-[#81B29A]/15 hover:text-[#2D6A4F] dark:hover:text-emerald-400'
                          }`}
                          title={item.label}
                          aria-expanded={isFlyoutOpen}
                        >
                          <span className={`material-symbols-outlined text-[20px] ${isAnyChildActive || isFlyoutOpen ? 'text-[#2D6A4F] dark:text-emerald-400' : ''}`}>
                            {item.icon}
                          </span>
                          <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-[#81B29A] dark:bg-emerald-400" />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div key={item.id} className="relative flex justify-center w-full">
                      <a
                        href={item.path}
                        onMouseEnter={(e) => handleFlyoutHover(item, e)}
                        onMouseLeave={handleFlyoutLeave}
                        onClick={(e) => {
                          if (item.isPopup) {
                            e.preventDefault();
                            window.dispatchEvent(new CustomEvent('SCMS_OPEN_AI_POPUP'));
                          }
                          setActiveFlyout(null);
                        }}
                        className={`mini-icon-btn w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative ${
                          isActive
                            ? 'bg-[#81B29A]/25 text-[#2D6A4F] dark:text-emerald-300 border border-[#81B29A]/50 font-bold shadow-xs scale-105 ring-2 ring-[#81B29A]/20'
                            : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-[#81B29A]/15 hover:text-[#2D6A4F] dark:hover:text-emerald-400'
                        }`}
                        title={item.label}
                      >
                        <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-[#2D6A4F] dark:text-emerald-400' : ''}`}>
                          {item.icon}
                        </span>
                      </a>
                    </div>
                  );
                }

                /* MODE 2: EXPANDED FULL-SIDEBAR */
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

        {/* Capsule Bottom Footer */}
        <div className="p-2 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-[28px] shrink-0">
          {isDesktopCollapsed ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => { logout(); window.location.hash = '#/login'; }}
                className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                title={`${displayName} (${roleLabel}) - ${isEn ? 'Sign Out' : 'Đăng xuất'}`}
              >
                <span className="material-symbols-outlined text-[20px]">power_settings_new</span>
              </button>
            </div>
          ) : (
            <div className="p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-2xs gap-2 min-w-0">
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
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[120px]" title={displayName}>
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
                <span className="material-symbols-outlined text-[18px]">power_settings_new</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Floating Popover / Tooltip System for Collapsed Mini-Sidebar */}
      {isDesktopCollapsed && activeFlyout && (
        <div
          className="fixed z-50 pointer-events-auto scms-floating-flyout transition-all duration-150 animate-in fade-in zoom-in-95"
          style={{
            top: `${activeFlyout.top}px`,
            left: `${activeFlyout.left}px`,
            transform: 'translateY(-50%)'
          }}
          onMouseEnter={() => {
            if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
          }}
          onMouseLeave={handleFlyoutLeave}
        >
          {activeFlyout.item.subItems && activeFlyout.item.subItems.length > 0 ? (
            <div className="w-64 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl shadow-2xl shadow-slate-900/20 dark:shadow-black/70 p-2.5 relative">
              {/* Anchor Notch pointing back to button */}
              <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-slate-900 border-l border-t border-slate-200/90 dark:border-slate-700/80 -rotate-45" />

              {/* Group Title Header */}
              <div className="px-3 py-2 text-xs font-bold text-[#1E2235] dark:text-white border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-[#81B29A]/15 text-[#2D6A4F] dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[15px]">{activeFlyout.item.icon}</span>
                </div>
                <span className="truncate">{activeFlyout.item.label}</span>
              </div>

              {/* Submenu Links */}
              <div className="space-y-1">
                {activeFlyout.item.subItems.map((sub, sIdx) => {
                  const isChildActive = currentPath === sub.path || (currentPath?.startsWith(sub.path) && sub.path !== '#/manager/dashboard');
                  return (
                    <a
                      key={sIdx}
                      href={sub.path}
                      onClick={() => {
                        setActiveFlyout(null);
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
          ) : (
            <div className="px-3 py-1.5 bg-white dark:bg-slate-800 text-[#1E2235] dark:text-white text-xs font-semibold rounded-xl shadow-xl border border-slate-200/90 dark:border-slate-700 whitespace-nowrap relative">
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-white dark:bg-slate-800 border-l border-t border-slate-200/90 dark:border-slate-700 -rotate-45" />
              {activeFlyout.item.label}
            </div>
          )}
        </div>
      )}
    </>
  );
}
