import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { NotificationInbox } from '../common/NotificationInbox.jsx';

export function Header({ onOpenProfile, onToggleSidebar }) {
  const { currentUser, role, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getRoleLabel = (r) => {
    const normalized = String(r || '').toUpperCase();
    switch (normalized) {
      case 'SYSTEMADMIN': return 'Quản trị hệ thống (System Admin)';
      case 'ADMIN': return 'Quản trị viên (Admin)';
      case 'MANAGER': return 'Quản lý (Manager)';
      case 'RECEPTIONIST': return 'Lễ tân (Receptionist)';
      case 'COACH': return 'Huấn luyện viên (Coach)';
      case 'MEMBER': return 'Hội viên (Member)';
      default: return r;
    }
  };

  // Trích xuất 2 chữ cái đầu viết tắt cho Avatar (Ví dụ: Huỳnh Nhật Huy -> HH)
  const getUserInitials = (name) => {
    if (!name) return 'HH';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const displayName = currentUser?.fullName || 'Huỳnh Nhật Huy';
  const displayCode = currentUser?.username || 'SE190363';
  const userInitials = getUserInitials(displayName);

  return (
    <header className="h-16 bg-white text-slate-800 border-b border-slate-200 sticky top-0 z-40 px-3 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Brand Logo FPT Education & Hamburger Toggle */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* SCMS Brand Logo in Clean Theme */}
        <a href="#/" aria-label="SCMS Sports Center - Trang chủ" className="flex items-center gap-2.5 group text-decoration-none">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1A3B8B] to-[#2563EB] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0 tracking-tight">
            S
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[15px] font-black tracking-tight text-[#1A3B8B]">
                SCMS
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-[#1A3B8B] font-bold uppercase border border-blue-100">
                ARENA
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mt-1 leading-none">
              TRUNG TÂM THỂ THAO
            </span>
          </div>
        </a>

        {/* Sidebar Toggle Button */}
        <button
          onClick={onToggleSidebar}
          type="button"
          className="w-9 h-9 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
          title="Ẩn / Hiện Menu"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>
      </div>

      {/* Right Controls: Branch, Language, Notification, DarkMode, Fullscreen, User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Branch / Campus Selector */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 font-medium px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
          <span className="material-symbols-outlined text-[17px] text-slate-400">location_on</span>
          <span>Cơ sở TP. Hồ Chí Minh (HCM)</span>
          <span className="material-symbols-outlined text-[15px] text-slate-400">keyboard_arrow_down</span>
        </div>

        {/* Language Selector */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
          <svg className="w-4 h-3 rounded-[2px] shadow-2xs shrink-0" viewBox="0 0 30 20" fill="none">
            <rect width="30" height="20" fill="#DA251D" />
            <polygon points="15,4 16.5,8.8 21.5,8.8 17.5,11.8 19,16.5 15,13.5 11,16.5 12.5,11.8 8.5,8.8 13.5,8.8" fill="#FF0" />
          </svg>
          <span>Tiếng Việt</span>
          <span className="material-symbols-outlined text-[15px] text-slate-400">keyboard_arrow_down</span>
        </div>

        {/* Notification Bell */}
        <NotificationInbox />

        {/* Dark Mode Icon Toggle */}
        <button
          type="button"
          onClick={() => {}}
          className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors"
          title="Chế độ tối"
        >
          <span className="material-symbols-outlined text-[20px]">bedtime</span>
        </button>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen?.().catch(() => {});
            } else {
              document.exitFullscreen?.().catch(() => {});
            }
          }}
          className="hidden sm:flex w-9 h-9 rounded-full hover:bg-slate-100 text-slate-600 items-center justify-center transition-colors"
          title="Toàn màn hình"
        >
          <span className="material-symbols-outlined text-[20px]">fullscreen</span>
        </button>

        {/* User Profile Info & Dropdown */}
        <div className="relative ml-1 sm:ml-2">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            type="button"
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100/80 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
          >
            {/* Blue Circle Avatar with Initials */}
            <div className="w-9 h-9 rounded-full bg-[#1A3B8B] text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
              {userInitials}
            </div>

            <div className="text-left hidden md:block leading-tight">
              <div className="text-xs font-bold text-slate-800 truncate max-w-[140px]">
                {displayName}
              </div>
              <div className="text-[11px] text-slate-400 font-medium tracking-wide">
                {displayCode}
              </div>
            </div>
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-modal-entrance"
              onMouseLeave={() => setShowUserMenu(false)}
            >
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{displayName}</p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{currentUser?.email || `${displayCode.toLowerCase()}@sportscenter.vn`}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-[#1A3B8B] text-[10px] font-bold border border-blue-100">
                  {getRoleLabel(role)}
                </span>
              </div>

              <div className="p-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => { setShowUserMenu(false); onOpenProfile(); }}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#1A3B8B] rounded-lg flex items-center gap-2.5 transition-colors font-medium"
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
                  <span>Hồ sơ & Đổi mật khẩu</span>
                </button>

                <a
                  href="#/"
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#1A3B8B] rounded-lg flex items-center gap-2.5 transition-colors font-medium"
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-400">home</span>
                  <span>Trang chủ Landing Page</span>
                </a>

                {(role === 'MEMBER' || role === 'COACH') && (
                  <a
                    href={role === 'COACH' ? '#/coach/support' : '#/member/support'}
                    onClick={() => setShowUserMenu(false)}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-[#1A3B8B] rounded-lg flex items-center gap-2.5 transition-colors font-medium"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#F26522]">support_agent</span>
                    <span>Gửi yêu cầu hỗ trợ</span>
                  </a>
                )}
              </div>

              <div className="border-t border-slate-100 my-1" />

              <div className="p-1">
                <button
                  type="button"
                  onClick={() => { setShowUserMenu(false); logout(); window.location.hash = '#/login'; }}
                  className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2.5 font-bold transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
