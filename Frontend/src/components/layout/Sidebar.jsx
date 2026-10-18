import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { getDynamicNavItems } from '../../services/permissions.js';

export function Sidebar({ isOpen, onClose, currentPath }) {
  const { role, logout } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState({});

  // Cấu hình các nhóm danh mục đồng bộ 100% giao diện FPT University / FAP Portal
  const getFptMenuSections = () => {
    const normalizedRole = String(role || '').toUpperCase();

    if (normalizedRole === 'MEMBER') {
      return [
        {
          category: 'HỌC TẬP',
          items: [
            {
              id: 'member_schedule_group',
              label: 'Lịch học',
              icon: 'calendar_month',
              subItems: [
                { label: 'Thời khóa biểu', path: '#/member/schedule' },
                { label: 'Lớp đã đặt & Hủy', path: '#/member/bookings' }
              ]
            },
            {
              id: 'member_reports_group',
              label: 'Báo cáo học tập',
              icon: 'fact_check',
              subItems: [
                { label: 'Báo cáo điểm danh', path: '#/member/attendance' },
                { label: 'Giáo án & Tiến độ', path: '#/member/progress' }
              ]
            },
            {
              id: 'member_coach_portal',
              label: 'Tương tác với HLV',
              icon: 'connect_without_contact',
              path: '#/member/coach-portal'
            },
            {
              id: 'member_ai_assistant',
              label: 'Trợ lý thể thao AI',
              icon: 'smart_toy',
              path: '#/member/ai-assistant',
              isPopup: true
            }
          ]
        },
        {
          category: 'ĐƠN TỪ',
          items: [
            {
              id: 'member_support',
              label: 'Yêu cầu hỗ trợ & Đơn từ',
              icon: 'support_agent',
              path: '#/member/support'
            },
            {
              id: 'member_notifications',
              label: 'Tin tức & Thông báo',
              icon: 'notifications',
              path: '#/member/notifications'
            }
          ]
        },
        {
          category: 'TÀI CHÍNH',
          items: [
            {
              id: 'member_packages',
              label: 'Gói tập & Thanh toán',
              icon: 'credit_card',
              path: '#/member/packages'
            },
            {
              id: 'member_payment_result',
              label: 'Lịch sử giao dịch',
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
          category: 'GIẢNG DẠY',
          items: [
            {
              id: 'coach_dashboard',
              label: 'Tổng quan giảng viên',
              icon: 'sports',
              path: '#/coach/dashboard'
            },
            {
              id: 'coach_teaching_group',
              label: 'Lịch dạy & Điểm danh',
              icon: 'calendar_month',
              subItems: [
                { label: 'Lịch giảng dạy', path: '#/coach/schedule' },
                { label: 'Báo cáo điểm danh', path: '#/coach/attendance' },
                { label: 'Danh sách học viên', path: '#/coach/members' }
              ]
            },
            {
              id: 'coach_plans_group',
              label: 'Giáo án & Chuyên môn',
              icon: 'fitness_center',
              subItems: [
                { label: 'Tạo giáo án rèn luyện', path: '#/coach/training-plan' },
                { label: 'Ghi nhận tiến độ', path: '#/coach/progress' },
                { label: 'Gợi ý giáo án AI', path: '#/coach/ai-recommendation' }
              ]
            },
            {
              id: 'coach_hub',
              label: 'Coach Professional Hub',
              icon: 'workspace_premium',
              path: '#/coach/professional'
            }
          ]
        },
        {
          category: 'ĐƠN TỪ & THÔNG BÁO',
          items: [
            {
              id: 'coach_notifications',
              label: 'Gửi bài tập / Thông báo',
              icon: 'outgoing_mail',
              path: '#/coach/notifications'
            },
            {
              id: 'coach_support',
              label: 'Yêu cầu hỗ trợ',
              icon: 'support_agent',
              path: '#/coach/support'
            }
          ]
        }
      ];
    }

    if (normalizedRole === 'RECEPTIONIST') {
      return [
        {
          category: 'QUẦY LỄ TÂN',
          items: [
            {
              id: 'rec_dashboard',
              label: 'Tổng quan ca trực',
              icon: 'countertops',
              path: '#/receptionist/dashboard'
            }
          ]
        },
        {
          category: 'NGHIỆP VỤ HỘI VIÊN',
          items: [
            {
              id: 'rec_members_group',
              label: 'Hội viên & Đặt chỗ',
              icon: 'person_search',
              subItems: [
                { label: 'Tra cứu hội viên', path: '#/receptionist/lookup' },
                { label: 'Check-in vào sân', path: '#/receptionist/check-in' },
                { label: 'Đặt / Hủy chỗ tại quầy', path: '#/receptionist/bookings' }
              ]
            }
          ]
        },
        {
          category: 'TÀI CHÍNH & HỖ TRỢ',
          items: [
            {
              id: 'rec_billing_group',
              label: 'Thu ngân & Hóa đơn',
              icon: 'point_of_sale',
              subItems: [
                { label: 'ĐK / Gia hạn tại quầy', path: '#/receptionist/counter-register' },
                { label: 'Hóa đơn & Thu tiền', path: '#/receptionist/invoices' }
              ]
            },
            {
              id: 'rec_support',
              label: 'Tiếp nhận hỗ trợ',
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
        category: 'TỔNG QUAN',
        items: [
          {
            id: 'mgr_dashboard',
            label: 'Bảng quản trị hệ thống',
            icon: 'dashboard',
            path: '#/manager/dashboard'
          }
        ]
      },
      {
        category: 'VẬN HÀNH & HỘI VIÊN',
        items: [
          {
            id: 'mgr_operation_group',
            label: 'Quản lý vận hành',
            icon: 'sports_score',
            subItems: [
              { label: 'Quản lý thành viên', path: '#/manager/members' },
              { label: 'Lớp, bộ môn & phòng', path: '#/manager/classes-rooms' },
              { label: 'Gói tập hội viên', path: '#/manager/packages' },
              { label: 'Phân công HLV', path: '#/manager/coach-assignment' },
              { label: 'Vận hành đội ngũ HLV', path: '#/manager/coach-operations' },
              { label: 'Nội dung trang chủ', path: '#/manager/home-content' }
            ]
          }
        ]
      },
      {
        category: 'NHÂN SỰ & PHÂN QUYỀN',
        items: [
          {
            id: 'mgr_staff',
            label: 'Quản lý nhân sự',
            icon: 'badge',
            path: '#/manager/staff'
          },
          {
            id: 'mgr_roles',
            label: 'Vai trò & Phân quyền',
            icon: 'admin_panel_settings',
            path: '#/manager/roles-permissions'
          }
        ]
      },
      {
        category: 'BÁO CÁO & BẢO MẬT',
        items: [
          {
            id: 'mgr_reports',
            label: 'Báo cáo & Thống kê',
            icon: 'analytics',
            path: '#/manager/reports'
          },
          {
            id: 'mgr_audit',
            label: 'Nhật ký Audit Logs',
            icon: 'history',
            path: '#/manager/audit-logs'
          },
          {
            id: 'mgr_support',
            label: 'Tiếp nhận yêu cầu hỗ trợ',
            icon: 'support_agent',
            path: '#/receptionist/support'
          }
        ]
      }
    ];
  };

  const sections = getFptMenuSections();

  // Tự động mở group chứa URL hiện tại
  useEffect(() => {
    const nextState = { ...expandedGroups };
    sections.forEach(sec => {
      sec.items.forEach(item => {
        if (item.subItems) {
          const hasActiveChild = item.subItems.some(sub => currentPath === sub.path || currentPath?.startsWith(sub.path));
          if (hasActiveChild) {
            nextState[item.id] = true;
          }
        }
      });
    });
    setExpandedGroups(nextState);
  }, [currentPath, role]);

  const toggleGroup = (id) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* FPT University Theme Sidebar Panel */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white text-slate-700 flex flex-col border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation Section List */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {/* Category Header (e.g. HỌC TẬP, ĐƠN TỪ, TÀI CHÍNH) */}
              <div className="px-3 pt-2 pb-1 text-[11px] font-bold tracking-wider text-[#1A3B8B] uppercase">
                {section.category}
              </div>

              {/* Items in this category */}
              {section.items.map((item) => {
                // Trường hợp 1: Nhóm có menu con (Expandable Submenu)
                if (item.subItems) {
                  const isExpanded = Boolean(expandedGroups[item.id]);
                  const hasActiveChild = item.subItems.some(
                    sub => currentPath === sub.path || (currentPath?.startsWith(sub.path) && sub.path !== '#/manager/dashboard')
                  );

                  return (
                    <div key={item.id} className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => toggleGroup(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          hasActiveChild ? 'text-[#1A3B8B] bg-blue-50/50' : 'text-slate-700 hover:bg-slate-50 hover:text-[#1A3B8B]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`material-symbols-outlined text-[19px] shrink-0 ${hasActiveChild ? 'text-[#1A3B8B]' : 'text-slate-400'}`}>
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </div>
                        <span className="material-symbols-outlined text-[16px] text-slate-400 transition-transform duration-200">
                          {isExpanded ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}
                        </span>
                      </button>

                      {/* Expanded Submenu Items */}
                      {isExpanded && (
                        <div className="pl-6 space-y-0.5">
                          {item.subItems.map((sub, subIdx) => {
                            const isSubActive =
                              currentPath === sub.path ||
                              (currentPath?.startsWith(sub.path) && sub.path !== '#/manager/dashboard');

                            return (
                              <a
                                key={subIdx}
                                href={sub.path}
                                onClick={onClose}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                                  isSubActive
                                    ? 'bg-[#EBF2FC] text-[#1A3B8B] font-bold shadow-2xs'
                                    : 'text-slate-600 hover:text-[#1A3B8B] hover:bg-slate-50 font-medium'
                                }`}
                              >
                                <span className={`text-[12px] leading-none ${isSubActive ? 'text-[#1A3B8B] font-black' : 'text-slate-400'}`}>•</span>
                                <span className="truncate">{sub.label}</span>
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                // Trường hợp 2: Mục đơn lẻ (Single Nav Item)
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
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#EBF2FC] text-[#1A3B8B] font-bold shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-[#1A3B8B]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={`material-symbols-outlined text-[19px] shrink-0 ${isActive ? 'text-[#1A3B8B]' : 'text-slate-400'}`}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.isPopup && (
                      <span className="px-1.5 py-0.2 rounded bg-red-50 text-red-600 text-[9px] font-bold uppercase border border-red-200">
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
        <div className="p-3 border-t border-slate-100 bg-slate-50/70">
          <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1A3B8B] text-[18px]">verified</span>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-800 leading-tight">Olympic Arena</span>
                <span className="text-[9px] text-slate-400">Tiêu chuẩn SCMS</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { logout(); window.location.hash = '#/login'; }}
              className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
              title="Đăng xuất"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
