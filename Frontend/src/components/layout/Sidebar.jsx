import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { getDynamicNavItems } from '../../services/permissions.js';

export function Sidebar({ isOpen, onClose, currentPath }) {
  const { role, logout } = useAuth();
  const { language } = useLanguage();
  const [expandedGroups, setExpandedGroups] = useState({});

  const isEn = language === 'en';

  // Cấu hình các nhóm danh mục đồng bộ đa ngôn ngữ (Tiếng Việt & English)
  const getFptMenuSections = () => {
    const normalizedRole = String(role || '').toUpperCase();

    if (normalizedRole === 'MEMBER') {
      return [
        {
          category: isEn ? 'TRAINING & SCHEDULE' : 'HỌC TẬP',
          items: [
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
            },
            {
              id: 'member_ai_assistant',
              label: isEn ? 'AI Sports Assistant' : 'Trợ lý thể thao AI',
              icon: 'smart_toy',
              path: '#/member/ai-assistant',
              isPopup: true
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
              path: '#/member/packages'
            },
            {
              id: 'member_payment_result',
              label: isEn ? 'Transaction History' : 'Lịch sử giao dịch',
              icon: 'receipt_long',
              path: '#/payment-result'
            }
          ]
        }
      ];
    }

    if (normalizedRole === 'COACH') {
      return [
        {
          category: isEn ? 'TEACHING & SCHEDULE' : 'GIẢNG DẠY & HỌC VIÊN',
          items: [
            {
              id: 'coach_dashboard',
              label: isEn ? 'Coach Overview' : 'Tổng quan HLV',
              icon: 'dashboard',
              path: '#/coach/dashboard'
            },
            {
              id: 'coach_schedule_group',
              label: isEn ? 'Schedule & Leave' : 'Lịch & Nghỉ phép',
              icon: 'calendar_month',
              subItems: [
                { label: isEn ? 'Teaching Schedule' : 'Lịch giảng dạy', path: '#/coach/schedule' },
                { label: isEn ? 'Attendance Report' : 'Báo cáo điểm danh', path: '#/coach/attendance' },
                { label: isEn ? 'Leave Requests' : 'Xin nghỉ phép', path: '#/coach/support' }
              ]
            },
            {
              id: 'coach_members',
              label: isEn ? 'Students' : 'Học viên',
              icon: 'group',
              path: '#/coach/members'
            }
          ]
        },
        {
          category: isEn ? 'PROFESSIONAL' : 'CHUYÊN MÔN',
          items: [
            {
              id: 'coach_plans_group',
              label: isEn ? 'Lesson Plans & Nutrition' : 'Giáo án & Dinh dưỡng',
              icon: 'fitness_center',
              subItems: [
                { label: isEn ? 'Create Workout Plans' : 'Tạo giáo án rèn luyện', path: '#/coach/training-plan' },
                { label: isEn ? 'Track Progress' : 'Ghi nhận tiến độ', path: '#/coach/progress' },
                { label: isEn ? 'AI Suggestions' : 'Gợi ý AI', path: '#/coach/ai-recommendation' }
              ]
            }
          ]
        },
        {
          category: isEn ? 'OPERATIONS & FINANCE' : 'TƯƠNG TÁC & VẬN HÀNH',
          items: [
            {
              id: 'coach_notifications',
              label: isEn ? 'Interaction & Chat' : 'Tương tác & Chat',
              icon: 'forum',
              path: '#/coach/notifications'
            },
            {
              id: 'coach_salary_kpi',
              label: isEn ? 'KPI & Income' : 'KPI & Thu nhập',
              icon: 'monitoring',
              path: '#/coach/salary-kpi'
            },
            {
              id: 'coach_resources',
              label: isEn ? 'Resources & Equipment' : 'Tài nguyên & Thiết bị',
              icon: 'inventory_2',
              path: '#/coach/resources'
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
            }
          ]
        }
      ];
    }

    // MANAGER / ADMIN / SYSTEMADMIN
    return [
      {
        category: isEn ? 'OVERVIEW' : 'TỔNG QUAN',
        items: [
          {
            id: 'mgr_dashboard',
            label: isEn ? 'Admin Dashboard' : 'Bảng quản trị hệ thống',
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
              { label: isEn ? 'Coach Operations' : 'Vận hành đội ngũ HLV', path: '#/manager/coach-operations' },
              { label: isEn ? 'Homepage Content' : 'Nội dung trang chủ', path: '#/manager/home-content' }
            ]
          }
        ]
      },
      {
        category: isEn ? 'HR & PERMISSIONS' : 'NHÂN SỰ & PHÂN QUYỀN',
        items: [
          {
            id: 'mgr_staff',
            label: isEn ? 'Staff Management' : 'Quản lý nhân sự',
            icon: 'badge',
            path: '#/manager/staff'
          },
          {
            id: 'mgr_roles',
            label: isEn ? 'Roles & Permissions' : 'Vai trò & Phân quyền',
            icon: 'admin_panel_settings',
            path: '#/manager/roles-permissions'
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
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-40 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Navigation Menu Body */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {/* Category Header */}
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {section.category}
              </div>

              {/* Menu Items */}
              {section.items.map((item) => {
                // Trường hợp 1: Có Sub-Items (Accordion Dropdown)
                if (item.subItems && item.subItems.length > 0) {
                  const isExpanded = expandedGroups[item.id] !== false;
                  const isAnyChildActive = item.subItems.some(sub =>
                    currentPath === sub.path ||
                    (currentPath?.startsWith(sub.path) && sub.path !== '#/manager/dashboard')
                  );

                  return (
                    <div key={item.id} className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => toggleGroup(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          isAnyChildActive
                            ? 'text-[#1A3B8B] dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#1A3B8B] dark:hover:text-blue-400'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className={`material-symbols-outlined text-[19px] shrink-0 ${isAnyChildActive ? 'text-[#1A3B8B] dark:text-blue-400' : 'text-slate-400'}`}>
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </div>

                        <span className={`material-symbols-outlined text-[16px] text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                          expand_more
                        </span>
                      </button>

                      {/* Accordion Submenu Children */}
                      {isExpanded && (
                        <div className="pl-7 pr-1 py-0.5 space-y-0.5">
                          {item.subItems.map((sub, sIdx) => {
                            const isChildActive =
                              currentPath === sub.path ||
                              (currentPath?.startsWith(sub.path) && sub.path !== '#/manager/dashboard');

                            return (
                              <a
                                key={sIdx}
                                href={sub.path}
                                onClick={onClose}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                  isChildActive
                                    ? 'bg-[#EBF2FC] dark:bg-blue-900/40 text-[#1A3B8B] dark:text-blue-300 font-bold'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                }`}
                              >
                                <span className={`text-[10px] ${isChildActive ? 'text-[#1A3B8B] dark:text-blue-300' : 'text-slate-300 dark:text-slate-600'}`}>
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

                // Trường hợp 2: Link Trực Tiếp Đơn Lẻ
                const isActive =
                  currentPath === item.path ||
                  (currentPath?.startsWith(item.path) && item.path !== '#/manager/dashboard');

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
                    className={`flex items-center justify-between px-3 py-2 rounded-[8px] text-xs transition-colors ${
                      isActive
                        ? 'bg-[#f1f5f9] dark:bg-slate-800 text-[#1e3a8a] dark:text-blue-400 font-bold shadow-2xs'
                        : 'text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#1e3a8a] dark:hover:text-blue-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={`material-symbols-outlined text-[19px] shrink-0 ${isActive ? 'text-[#1A3B8B] dark:text-blue-400' : 'text-slate-400'}`}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.isPopup && (
                      <span className="px-1.5 py-0.2 rounded bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[9px] font-bold uppercase border border-red-200 dark:border-red-800">
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
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1A3B8B] dark:text-blue-400 text-[18px]">verified</span>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Olympic Arena</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500">
                  {isEn ? 'SCMS Standard' : 'Tiêu chuẩn SCMS'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { logout(); window.location.hash = '#/login'; }}
              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 transition-colors cursor-pointer"
              title={isEn ? 'Sign Out' : 'Đăng xuất'}
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
