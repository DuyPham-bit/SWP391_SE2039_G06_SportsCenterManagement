import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { NotificationInbox } from '../common/NotificationInbox.jsx';

// Thông tin cơ sở duy nhất của hệ thống trung tâm thể thao SCMS
export const SINGLE_BRANCH = {
  id: 'HCM',
  nameVi: 'Cơ sở TP. Hồ Chí Minh (HCM)',
  nameEn: 'Ho Chi Minh City Campus (HCM)',
  code: 'HCM',
  tagVi: 'Cơ sở chính duy nhất',
  tagEn: 'Sole Main Campus',
  addressVi: 'Lô E2a-7, Đường D1, Khu Công nghệ cao, TP. Thủ Đức, TP. HCM',
  addressEn: 'Lot E2a-7, D1 Street, High-Tech Park, Thu Duc City, HCMC',
  hotline: '(028) 7300 5588',
  hoursVi: '06:00 - 22:00 hàng ngày',
  hoursEn: '06:00 - 22:00 Daily',
  statusVi: 'Đang mở cửa hoạt động',
  statusEn: 'Currently Open',
  facilitiesVi: '12 sân cầu lông, 4 sân tennis, 2 hồ bơi Olympic, tổ hợp Gym, Boxing & Yoga',
  facilitiesEn: '12 badminton courts, 4 tennis courts, 2 Olympic pools, Gym, Boxing & Yoga'
};

// Ngôn ngữ hỗ trợ
export const LANGUAGES = [
  {
    code: 'vi',
    name: 'Tiếng Việt',
    nativeName: 'Tiếng Việt (VN)',
    flag: 'vi'
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English (US/UK)',
    flag: 'en'
  }
];

// SVG cờ Việt Nam
function VietnamFlagIcon({ className = "w-4 h-3" }) {
  return (
    <svg className={`${className} rounded-[2px] shadow-2xs shrink-0`} viewBox="0 0 30 20" fill="none">
      <rect width="30" height="20" fill="#DA251D" />
      <polygon points="15,4 16.5,8.8 21.5,8.8 17.5,11.8 19,16.5 15,13.5 11,16.5 12.5,11.8 8.5,8.8 13.5,8.8" fill="#FF0" />
    </svg>
  );
}

// SVG cờ Vương quốc Anh
function UKFlagIcon({ className = "w-4 h-3" }) {
  return (
    <svg className={`${className} rounded-[2px] shadow-2xs shrink-0`} viewBox="0 0 60 30" fill="none">
      <clipPath id="uk-flag-clip"><path d="M0 0v30h60V0z"/></clipPath>
      <clipPath id="uk-diag-clip"><path d="M0 0l60 30m0-30L0 30"/></clipPath>
      <g clipPath="url(#uk-flag-clip)">
        <path d="M0 0v30h60V0z" fill="#012169"/>
        <path d="M0 0l60 30m0-30L0 30" stroke="#fff" strokeWidth="6"/>
        <path d="M0 0l60 30m0-30L0 30" clipPath="url(#uk-diag-clip)" stroke="#C8102E" strokeWidth="4"/>
        <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10"/>
        <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6"/>
      </g>
    </svg>
  );
}

export function Header({ onOpenProfile, onToggleSidebar }) {
  const { currentUser, role, logout } = useAuth();
  const { showSuccess, showInfo, showWarning } = useToast();
  const { language, setLanguage, t } = useLanguage();

  // State 1: Modal chi tiết cơ sở duy nhất
  const [showBranchModal, setShowBranchModal] = useState(false);
  const branchRef = useRef(null);

  // State 2: Dropdown chọn ngôn ngữ
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef(null);

  // State 3: Chế độ sáng / tối (Dark Mode)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('SCMS_THEME_MODE');
    if (saved) return saved === 'dark';
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  });

  // State 4: Toàn màn hình (Fullscreen)
  const [isFullscreen, setIsFullscreen] = useState(false);

  // State 5: Menu người dùng
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Khởi tạo và đồng bộ Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Lắng nghe sự kiện toàn màn hình từ hệ thống / phím F11 / Esc
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFull = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement ||
        document.body.classList.contains('scms-simulated-fullscreen')
      );
      setIsFullscreen(isCurrentlyFull);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('scms-simulated-fullscreen')) {
        document.body.classList.remove('scms-simulated-fullscreen');
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Xử lý đóng tất cả dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (branchRef.current && !branchRef.current.contains(e.target)) {
        setShowBranchModal(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handler đổi ngôn ngữ
  const handleSelectLang = (langCode) => {
    setLanguage(langCode);
    setShowLangMenu(false);
    if (showSuccess) {
      showSuccess(langCode === 'vi' ? 'Đã đổi ngôn ngữ sang Tiếng Việt 🇻🇳' : 'Language switched to English 🇬🇧');
    }
  };

  // Handler bật / tắt Dark Mode
  const handleToggleDarkMode = () => {
    const nextState = !isDarkMode;
    setIsDarkMode(nextState);
    if (nextState) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('SCMS_THEME_MODE', 'dark');
      if (showSuccess) showSuccess(language === 'vi' ? 'Đã chuyển sang Chế độ tối 🌙' : 'Dark Mode enabled 🌙');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('SCMS_THEME_MODE', 'light');
      if (showInfo) showInfo(language === 'vi' ? 'Đã chuyển sang Chế độ sáng ☀️' : 'Light Mode enabled ☀️');
    }
  };

  // Handler bật / tắt Toàn màn hình
  const handleToggleFullscreen = () => {
    const isCurrentlyFull = Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement ||
      document.body.classList.contains('scms-simulated-fullscreen')
    );

    if (!isCurrentlyFull) {
      const el = document.documentElement;
      let nativeRequested = false;

      const reqFn = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
      if (reqFn) {
        try {
          const res = reqFn.call(el);
          if (res && typeof res.then === 'function') {
            res.then(() => {
              setIsFullscreen(true);
            }).catch((err) => {
              console.warn('Native requestFullscreen denied, activating simulated fullscreen:', err);
              document.body.classList.add('scms-simulated-fullscreen');
              setIsFullscreen(true);
            });
            nativeRequested = true;
          } else {
            setIsFullscreen(true);
            nativeRequested = true;
          }
        } catch (e) {
          console.warn('Native fullscreen call threw:', e);
        }
      }

      if (!nativeRequested) {
        document.body.classList.add('scms-simulated-fullscreen');
        setIsFullscreen(true);
      }
      if (showSuccess) showSuccess(language === 'vi' ? 'Đã mở chế độ Toàn màn hình ⛶' : 'Fullscreen enabled ⛶');
    } else {
      document.body.classList.remove('scms-simulated-fullscreen');
      const exitFn = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
      if (exitFn && (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement)) {
        try {
          const res = exitFn.call(document);
          if (res && typeof res.then === 'function') {
            res.catch((err) => console.warn('exitFullscreen rejected:', err));
          }
        } catch (e) {
          console.warn('exitFullscreen threw:', e);
        }
      }
      setIsFullscreen(false);
      if (showInfo) showInfo(language === 'vi' ? 'Đã thoát chế độ Toàn màn hình' : 'Exited fullscreen');
    }
  };

  const getRoleLabel = (r) => {
    const normalized = String(r || '').toLowerCase();
    return t(`role.${normalized}`, r);
  };

  // Trích xuất 2 chữ cái đầu viết tắt cho Avatar (Ví dụ: Huấn luyện viên 01 -> HV)
  const getUserInitials = (name) => {
    if (!name) return 'HV';
    // Bỏ qua các từ là số (ví dụ: '01', '02', '123') để lấy đúng chữ cái đầu của tên
    const parts = name.trim().split(/\s+/).filter(w => !/^\d+$/.test(w));
    if (parts.length === 0) return 'SC';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const displayName = currentUser?.fullName || (role === 'COACH' ? (language === 'vi' ? 'Huấn luyện viên 01' : 'Coach 01') : 'Huỳnh Nhật Huy');
  const roleLabel = getRoleLabel(role);
  const userInitials = getUserInitials(displayName);

  const branchDisplayName = language === 'en' ? SINGLE_BRANCH.nameEn : SINGLE_BRANCH.nameVi;
  const currentLangObj = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <header className="h-16 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-3 sm:px-6 flex items-center justify-between shadow-xs transition-colors">
      {/* Left: Brand Logo SCMS & Hamburger Toggle */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* SCMS Brand Logo */}
        <a href="#/" aria-label="SCMS Sports Center - Trang chủ" className="flex items-center gap-2.5 group text-decoration-none">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1A3B8B] to-[#2563EB] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0 tracking-tight">
            S
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[15px] font-black tracking-tight text-[#1A3B8B] dark:text-blue-400">
                SCMS
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/60 text-[#1A3B8B] dark:text-blue-300 font-bold uppercase border border-blue-100 dark:border-blue-800">
                ARENA
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mt-1 leading-none">
              {t('header.brand_sub', 'TRUNG TÂM THỂ THAO')}
            </span>
          </div>
        </a>

        {/* Sidebar Toggle Button */}
        <button
          onClick={onToggleSidebar}
          type="button"
          className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs"
          title={t('header.menu_toggle', 'Ẩn / Hiện Menu')}
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>
      </div>

      {/* Right Controls: Branch (1 cơ sở duy nhất), Language, Notification, DarkMode, Fullscreen, User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* 1. Facility / Campus (1 cơ sở duy nhất - SCMS TP. Hồ Chí Minh) */}
        <div className="relative hidden md:block" ref={branchRef}>
          <button
            type="button"
            onClick={() => {
              setShowBranchModal(prev => !prev);
              setShowLangMenu(false);
              setShowUserMenu(false);
            }}
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all cursor-pointer shadow-2xs hover:border-slate-300 dark:hover:border-slate-600"
            title={t('branch.title', 'Thông tin cơ sở hoạt động')}
          >
            <span className="material-symbols-outlined text-[18px] text-slate-400">location_on</span>
            <span className="truncate max-w-[210px]">{branchDisplayName}</span>
            <span className={`material-symbols-outlined text-[16px] text-slate-400 transition-transform duration-200 ${showBranchModal ? 'rotate-180' : ''}`}>
              keyboard_arrow_down
            </span>
          </button>

          {showBranchModal && (
            <div className="absolute left-0 mt-2 w-88 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-3.5 z-50 animate-modal-entrance">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {language === 'en' ? SINGLE_BRANCH.tagEn : SINGLE_BRANCH.tagVi}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
                  {language === 'en' ? SINGLE_BRANCH.statusEn : SINGLE_BRANCH.statusVi}
                </span>
              </div>

              <div className="mt-3 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/60">
                  <p className="font-bold text-xs text-[#1A3B8B] dark:text-blue-300">
                    {language === 'en' ? 'SCMS Sports Center - Ho Chi Minh City' : 'Trung tâm Thể thao SCMS - TP. Hồ Chí Minh'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {language === 'en' ? SINGLE_BRANCH.addressEn : SINGLE_BRANCH.addressVi}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700">
                    <span className="text-slate-400 block font-medium">Hotline:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{SINGLE_BRANCH.hotline}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700">
                    <span className="text-slate-400 block font-medium">
                      {language === 'en' ? 'Opening Hours:' : 'Giờ hoạt động:'}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {language === 'en' ? SINGLE_BRANCH.hoursEn : SINGLE_BRANCH.hoursVi}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                    {language === 'en' ? 'Olympic Facilities:' : 'Khu phức hợp sân bãi:'}
                  </span>
                  {language === 'en' ? SINGLE_BRANCH.facilitiesEn : SINGLE_BRANCH.facilitiesVi}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Language Selector Dropdown (Chuyển đổi Tiếng Việt & English thực tế) */}
        <div className="relative hidden sm:block" ref={langMenuRef}>
          <button
            type="button"
            onClick={() => {
              setShowLangMenu(prev => !prev);
              setShowBranchModal(false);
              setShowUserMenu(false);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
            title="Chọn ngôn ngữ / Select Language"
          >
            {language === 'vi' ? <VietnamFlagIcon /> : <UKFlagIcon />}
            <span>{currentLangObj.name}</span>
            <span className={`material-symbols-outlined text-[16px] text-slate-400 transition-transform duration-200 ${showLangMenu ? 'rotate-180' : ''}`}>
              keyboard_arrow_down
            </span>
          </button>

          {showLangMenu && (
            <div className="absolute right-0 sm:left-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50 animate-modal-entrance">
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700/80 mb-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ngôn ngữ / Language
                </span>
              </div>

              <div className="space-y-1">
                {LANGUAGES.map(lang => {
                  const isSelected = lang.code === language;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelectLang(lang.code)}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/40 text-[#1A3B8B] dark:text-blue-300 font-bold border border-blue-100 dark:border-blue-800/60'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 border border-transparent font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {lang.code === 'vi' ? <VietnamFlagIcon className="w-5 h-3.5" /> : <UKFlagIcon className="w-5 h-3.5" />}
                        <span className="text-xs">{lang.nativeName}</span>
                      </div>
                      {isSelected && (
                        <span className="material-symbols-outlined text-[18px] text-[#1A3B8B] dark:text-blue-400">
                          check
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. Notification Bell Dropdown */}
        <NotificationInbox />

        {/* 4. Dark Mode Toggle */}
        <button
          type="button"
          onClick={handleToggleDarkMode}
          className="w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-amber-400 flex items-center justify-center transition-colors cursor-pointer"
          title={isDarkMode ? t('header.light_mode', 'Chế độ sáng') : t('header.dark_mode', 'Chế độ tối')}
        >
          <span className="material-symbols-outlined text-[20px]">
            {isDarkMode ? 'light_mode' : 'bedtime'}
          </span>
        </button>

        {/* 5. Fullscreen Toggle */}
        <button
          type="button"
          onClick={handleToggleFullscreen}
          className="w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          title={isFullscreen ? t('header.exit_fullscreen', 'Thu nhỏ màn hình (Esc)') : t('header.fullscreen', 'Toàn màn hình')}
        >
          <span className="material-symbols-outlined text-[20px]">
            {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
          </span>
        </button>

        {/* 6. User Profile Info & Dropdown */}
        <div className="relative ml-1 sm:ml-2" ref={userMenuRef}>
          <button
            onClick={() => {
              setShowUserMenu(prev => !prev);
              setShowBranchModal(false);
              setShowLangMenu(false);
            }}
            type="button"
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
          >
            {/* Blue Circle Avatar with Initials */}
            <div className="w-9 h-9 rounded-full bg-[#1A3B8B] dark:bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
              {userInitials}
            </div>

            <div className="text-left hidden md:block leading-tight">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[140px]">
                {displayName}
              </div>
              <div className="text-[11px] text-[#1A3B8B] dark:text-blue-400 font-bold tracking-wide">
                {roleLabel}
              </div>
            </div>
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-modal-entrance"
            >
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{displayName}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {currentUser?.email || (currentUser?.username && !currentUser.username.startsWith('SE') ? `${currentUser.username.toLowerCase()}@sportscenter.vn` : 'coach@sportscenter.vn')}
                </p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/60 text-[#1A3B8B] dark:text-blue-300 text-[10px] font-bold border border-blue-100 dark:border-blue-800">
                  {roleLabel}
                </span>
              </div>

              <div className="p-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => { setShowUserMenu(false); onOpenProfile(); }}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-[#1A3B8B] dark:hover:text-blue-300 rounded-lg flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
                  <span>{t('header.profile', 'Hồ sơ & Đổi mật khẩu')}</span>
                </button>

                <a
                  href="#/"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-[#1A3B8B] dark:hover:text-blue-300 rounded-lg flex items-center gap-2.5 transition-colors font-medium"
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-400">home</span>
                  <span>{t('header.landing', 'Trang chủ Landing Page')}</span>
                </a>

                {(role === 'MEMBER' || role === 'COACH') && (
                  <a
                    href={role === 'COACH' ? '#/coach/support' : '#/member/support'}
                    onClick={() => setShowUserMenu(false)}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-[#1A3B8B] dark:hover:text-blue-300 rounded-lg flex items-center gap-2.5 transition-colors font-medium"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#F26522]">support_agent</span>
                    <span>{t('header.support', 'Gửi yêu cầu hỗ trợ')}</span>
                  </a>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

              <div className="p-1">
                <button
                  type="button"
                  onClick={() => { setShowUserMenu(false); logout(); window.location.hash = '#/login'; }}
                  className="w-full text-left px-3.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center gap-2.5 font-bold transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span>{t('header.logout', 'Đăng xuất')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
