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
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between shadow-sm">
      {/* Left: Mobile Toggle & Center Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        <a href="#/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-red-600/30 font-chivo font-black text-base transition-transform duration-300 group-hover:scale-105">
            S
          </div>
          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-chivo font-black text-sm tracking-tight text-slate-900 leading-none">
                SCMS
              </span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-red-600/10 text-red-600 font-extrabold uppercase border border-red-500/20">
                PRO
              </span>
            </div>
            <span className="text-[9px] font-bold text-slate-500 tracking-[0.16em] uppercase mt-0.5 leading-none">
              Olympic Sports Arena
            </span>
          </div>
        </a>

        {/* Live System Indicator */}
        <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-600 ml-3">
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
            className="flex items-center gap-2 p-1 pl-2 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
          >
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {currentUser?.fullName || 'Người dùng'}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                {currentUser?.email}
              </div>
            </div>
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
              alt="Avatar"
              className="w-9 h-9 rounded-full object-cover border-2 border-red-600 shadow-sm"
            />
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50"
              onMouseLeave={() => setShowUserMenu(false)}
            >
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{currentUser?.fullName}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                <p className="text-[10px] text-red-600 font-bold uppercase mt-1">{getRoleLabel(role)}</p>
              </div>

              <button
                onClick={() => { setShowUserMenu(false); onOpenProfile(); }}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
                <span>Hồ sơ & Đổi mật khẩu</span>
              </button>

              <a
                href="#/"
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px] text-slate-400">home</span>
                <span>Trang chủ Landing Page</span>
              </a>

              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={() => { setShowUserMenu(false); logout(); window.location.hash = '#/login'; }}
                className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
