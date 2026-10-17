import { useAuth } from '../../context/AuthContext.js';
import { Badge } from '../common/StatCard.js';
import { NotificationInbox } from '../common/NotificationInbox.jsx';

const { useState } = React;

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

  return (
    <header className="h-16 bg-[#1E2235] text-white border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between shadow-md">
      {/* Left: Mobile Toggle & Brand Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden w-9 h-9 rounded-xl border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        {/* Brand Logo Matching 100% User Reference */}
        <a href="#/" aria-label="SCMS Olympic Sports Arena - Trang chủ" className="flex items-center gap-3 group text-decoration-none">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--primary-color)] via-[#A8DADC] to-[var(--custom-btn-bg-color)] text-white flex items-center justify-center shadow-md font-sans font-bold text-xl transition-transform duration-300 group-hover:scale-105 shrink-0">
            S
          </div>
          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-sans font-bold text-lg tracking-tight text-white leading-none">
                SCMS
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--primary-color)]/20 text-[#A8DADC] font-bold uppercase border border-[var(--primary-color)]/40 leading-none">
                OLYMPIC
              </span>
            </div>
            <span className="text-[9px] font-bold text-[var(--custom-btn-bg-color)]/90 tracking-[0.2em] uppercase mt-1 leading-none">
              Olympic Sports Arena
            </span>
          </div>
        </a>

        {/* Live System Indicator */}
        <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-slate-200 border border-white/10 ml-4">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Hệ thống trực tuyến</span>
        </div>
      </div>

      {/* Right: User Role Badge + User Avatar */}
      <div className="flex items-center gap-3">
        {/* User Role Badge */}
        <NotificationInbox />
        <div className="hidden sm:flex items-center">
          <Badge variant={role} size="sm">{role}</Badge>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl hover:bg-white/10 transition-colors border border-transparent hover:border-slate-700"
          >
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white leading-tight">
                {currentUser?.fullName || 'Người dùng'}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                {currentUser?.email}
              </div>
            </div>
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
              alt="Avatar"
              className="w-9 h-9 rounded-full object-cover border-2 border-[#81B29A] shadow-sm"
            />
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-60 bg-[#232538] text-white rounded-2xl shadow-2xl border border-slate-700 py-2 z-50"
              onMouseLeave={() => setShowUserMenu(false)}
            >
              <div className="px-4 py-2.5 border-b border-slate-700">
                <p className="text-xs font-bold text-white">{currentUser?.fullName}</p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{currentUser?.email}</p>
                <p className="text-[10px] text-[#81B29A] font-bold uppercase mt-1 tracking-wider">{getRoleLabel(role)}</p>
              </div>

              <div className="p-1 space-y-0.5">
                <button
                  onClick={() => { setShowUserMenu(false); onOpenProfile(); }}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-white/10 rounded-lg flex items-center gap-2.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
                  <span>Hồ sơ & Đổi mật khẩu</span>
                </button>

                <a
                  href="#/"
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-white/10 rounded-lg flex items-center gap-2.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-400">home</span>
                  <span>Trang chủ Landing Page</span>
                </a>

                {(role === 'MEMBER' || role === 'COACH') && (
                  <a
                    href={role === 'COACH' ? '#/coach/support' : '#/member/support'}
                    onClick={() => setShowUserMenu(false)}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-white/10 rounded-lg flex items-center gap-2.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#F2CC8F]">support_agent</span>
                    <span>Gửi yêu cầu hỗ trợ</span>
                  </a>
                )}
              </div>

              <div className="border-t border-slate-700 my-1" />

              <div className="p-1">
                <button
                  onClick={() => { setShowUserMenu(false); logout(); window.location.hash = '#/login'; }}
                  className="w-full text-left px-3.5 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-2.5 font-bold transition-colors"
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
