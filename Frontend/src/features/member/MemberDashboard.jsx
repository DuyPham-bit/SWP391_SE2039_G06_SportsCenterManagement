import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { bookingApi, memberApi } from '../../services/api.js';
import { useNotifications } from '../../components/common/useNotifications.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { Modal } from '../../components/common/Modal.js';
import { ProfileModal } from '../auth/ProfileModal.jsx';
import { MemberReminders } from './MemberReminders.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import {
  formatMemberDate,
  formatMemberDateTime,
  formatMeasurement,
  getLatestProgress,
  getMembershipSummary,
  getUpcomingBookings,
  getMemberReminders,
  isUpcomingBooking,
  getBookingStatusLabel,
  bookingStart,
  getSportTheme
} from './memberOverview.js';
import {
  translateClassName,
  translateSportName,
  translateCoachName,
  translateRoomName,
  translatePlanTitle,
  translatePlanGoal,
  translateNotificationTitle,
  translateNotificationContent,
  translatePackageName,
  translateCoachFeedback,
  translateWorkoutResult
} from '../../services/i18nHelper.js';

// Helper to determine sport meta, icon, and curated aesthetic color theme
function getSportMeta(className = '', spec = '', isEn = false) {
  const cName = (className || '').toLowerCase();
  const sSpec = (spec || '').toLowerCase();

  if (cName.includes('golf') || cName.includes('swing') || cName.includes('trackman') || cName.includes('driving range') || sSpec.includes('golf')) {
    return {
      name: isEn ? 'Golf & Precision' : 'Golf & Thể thao đỉnh cao',
      icon: 'sports_golf',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
      pillColor: 'from-emerald-600 to-teal-700',
      accentColor: '#059669'
    };
  }
  if (cName.includes('cầu lông') || cName.includes('badminton') || sSpec.includes('cầu lông') || sSpec.includes('badminton')) {
    return {
      name: isEn ? 'Badminton' : 'Cầu lông Olympic',
      icon: 'sports_tennis',
      badgeBg: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60',
      pillColor: 'from-teal-500 to-emerald-600',
      accentColor: '#0D9488'
    };
  }
  if (cName.includes('box') || cName.includes('kickfit') || cName.includes('võ') || cName.includes('mma') || cName.includes('muay') || sSpec.includes('box')) {
    return {
      name: isEn ? 'Boxing & Martial Arts' : 'Boxing & Võ thuật',
      icon: 'sports_mma',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
      pillColor: 'from-amber-500 to-orange-600',
      accentColor: '#D97706'
    };
  }
  if (cName.includes('bơi') || cName.includes('swim') || cName.includes('pool') || sSpec.includes('bơi') || sSpec.includes('swim')) {
    return {
      name: isEn ? 'Swimming & Aquatic' : 'Bơi lội & Thủy sinh',
      icon: 'pool',
      badgeBg: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
      pillColor: 'from-sky-500 to-blue-600',
      accentColor: '#0284C7'
    };
  }
  if (cName.includes('yoga') || cName.includes('pilates') || cName.includes('giãn cơ') || cName.includes('stretch') || sSpec.includes('yoga') || sSpec.includes('pilates')) {
    return {
      name: isEn ? 'Yoga & Pilates' : 'Yoga & Trị liệu',
      icon: 'self_improvement',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
      pillColor: 'from-purple-500 to-indigo-600',
      accentColor: '#7C3AED'
    };
  }
  if (cName.includes('tennis') || cName.includes('quần vợt') || cName.includes('pickleball') || sSpec.includes('tennis')) {
    return {
      name: isEn ? 'Tennis & Racket' : 'Tennis & Quần vợt',
      icon: 'sports_baseball',
      badgeBg: 'bg-lime-50 text-lime-800 border-lime-200 dark:bg-lime-950/40 dark:text-lime-300 dark:border-lime-800/60',
      pillColor: 'from-lime-500 to-emerald-600',
      accentColor: '#65A30D'
    };
  }
  if (cName.includes('bóng rổ') || cName.includes('basketball') || cName.includes('bóng đá') || cName.includes('bóng chuyền')) {
    return {
      name: isEn ? 'Team Sports' : 'Thể thao đồng đội',
      icon: 'sports_basketball',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
      pillColor: 'from-blue-500 to-indigo-600',
      accentColor: '#2563EB'
    };
  }

  return {
    name: isEn ? 'Gym & Fitness' : 'Gym & Thể hình',
    icon: 'fitness_center',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
    pillColor: 'from-rose-500 to-red-600',
    accentColor: '#E11D48'
  };
}

// Parse date into structured visual badge parts
function parseDateParts(dateStr, isEn = false) {
  if (!dateStr) return { day: '--', month: '--', weekday: '--' };
  const d = new Date(`${String(dateStr).slice(0, 10)}T12:00:00+07:00`);
  if (Number.isNaN(d.getTime())) return { day: '--', month: '--', weekday: '--' };
  const weekdaysVi = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: isEn ? monthsEn[d.getMonth()] : `Tháng ${d.getMonth() + 1}`,
    weekday: isEn ? weekdaysEn[d.getDay()] : weekdaysVi[d.getDay()]
  };
}

// Time-based polite greeting
function getTimeGreeting(isEn = false) {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return isEn ? 'Good morning' : 'Chào buổi sáng';
  if (hour >= 12 && hour < 18) return isEn ? 'Good afternoon' : 'Chào buổi chiều';
  return isEn ? 'Good evening' : 'Chào buổi tối';
}

export function MemberDashboard() {
  const { currentUser, refreshUser } = useAuth();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const { showSuccess, showError, showInfo } = useToast();
  const { items: notifications, error: notificationError, refresh: refreshNotifications } = useNotifications();

  const [data, setData] = useState({ bookings: [], progress: [], plans: [] });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Quick cancel modal states
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const memberCode = currentUser?.memberCode || 'MEM-00001';

  // Generate genuine scannable QR Code
  useEffect(() => {
    if (memberCode) {
      QRCode.toDataURL(memberCode, {
        width: 320,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      })
        .then(url => {
          setQrDataUrl(url);
        })
        .catch(err => {
          console.error('Error generating QR code:', err);
        });
    }
  }, [memberCode]);

  const capabilities = currentUser?.capabilities || [];
  const canBook = capabilities.includes('book_class');
  const canProgress = capabilities.includes('view_my_progress');
  const canCancel = capabilities.includes('cancel_booking');

  useEffect(() => {
    let active = true;
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    if (typeof refreshUser === 'function') {
      refreshUser().catch(() => {});
    }
    const sources = [
      ['bookings', canBook ? bookingApi.getMemberBookings(currentUser.id) : Promise.resolve([])],
      ['progress', canProgress ? memberApi.getMyProgress() : Promise.resolve([])],
      ['plans', canProgress ? memberApi.getMyPlans() : Promise.resolve([])]
    ];

    Promise.allSettled(sources.map(([, request]) => request)).then(results => {
      if (!active) return;
      const nextData = {};
      const nextErrors = {};
      results.forEach((result, index) => {
        const key = sources[index][0];
        nextData[key] = result.status === 'fulfilled' ? result.value : [];
        if (result.status === 'rejected') {
          nextErrors[key] = result.reason?.message || (isEn ? 'Unable to load data.' : 'Không thể tải dữ liệu.');
        }
      });
      setData(nextData);
      setErrors(nextErrors);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [currentUser?.id, canBook, canProgress, reload, isEn]);

  const handleCopyMemberCode = () => {
    if (!currentUser?.memberCode) return;
    navigator.clipboard.writeText(currentUser.memberCode);
    setCopiedCode(true);
    showInfo(isEn ? `Member code copied: ${currentUser.memberCode}` : `Đã sao chép mã hội viên: ${currentUser.memberCode}`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSyncData = async () => {
    setIsRefreshing(true);
    setReload(v => v + 1);
    refreshNotifications();
    try {
      if (typeof refreshUser === 'function') await refreshUser();
      showSuccess(isEn ? 'Member data synced successfully!' : 'Đã đồng bộ dữ liệu hội viên thành công!');
    } catch {
      showInfo(isEn ? 'Refreshed member data.' : 'Đã làm mới dữ liệu hội viên.');
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const handleConfirmCancelBooking = async () => {
    if (!bookingToCancel || !currentUser) return;
    setCancelling(true);
    try {
      const res = await bookingApi.cancelBooking(bookingToCancel.id, currentUser.id);
      showSuccess(res?.message || (isEn ? 'Booking cancelled successfully.' : 'Hủy lịch đặt chỗ thành công.'));
      setCancelModalOpen(false);
      setBookingToCancel(null);
      setReload(r => r + 1);
    } catch (err) {
      showError(err.message || (isEn ? 'Unable to cancel class.' : 'Không thể hủy buổi học.'));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <LoadingSpinner text={isEn ? 'Syncing Olympic Member account...' : 'Đang tải dữ liệu tài khoản hội viên Olympic...'} />
      </div>
    );
  }

  const upcoming = getUpcomingBookings(data.bookings);
  const membership = getMembershipSummary(currentUser, new Date(), isEn);
  const latest = getLatestProgress(data.progress);
  const unread = notifications.filter(item => !item.isRead).length;
  const displayErrors = { ...errors, ...(notificationError ? { notifications: notificationError } : {}) };
  const reminders = getMemberReminders(currentUser, data.bookings, new Date(), isEn);
  const greeting = getTimeGreeting(isEn);

  // Validity percentage calculation for visual progress meter
  const daysLeftNum = membership.daysLeft || 0;
  const validityPercent = Math.min(100, Math.max(5, Math.round((daysLeftNum / 365) * 100)));

  return (
    <div className="w-full space-y-6 pb-16 font-lexend max-w-[1600px] mx-auto animate-fade-slide-up transition-colors">
      {/* ─────────────────────────────────────────────────────────────
          1. OLYMPIC PRO ATHLETE HERO COMMAND BANNER
      ───────────────────────────────────────────────────────────── */}
      <section
        aria-label={isEn ? 'Athlete Overview' : 'Tổng quan hội viên'}
        className="relative rounded-3xl bg-gradient-to-r from-[#144336] via-[#1B5E4A] to-[#12382D] dark:from-[#091D17] dark:via-[#103026] dark:to-[#0A1F18] text-white p-6 sm:p-8 border border-emerald-400/20 dark:border-white/10 shadow-xl shadow-emerald-950/20 overflow-hidden"
      >
        {/* Ambient energy orbs matching Olympic emerald & gold palette */}
        <div className="absolute -top-24 -right-24 w-88 h-88 bg-gradient-to-br from-amber-400/20 to-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-88 h-88 bg-gradient-to-tr from-emerald-500/25 to-teal-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-40 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Dynamic decorative athletic curves */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 240">
          <path d="M-50,180 C250,50 500,220 800,90 C950,30 1050,140 1100,110" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,210 C280,80 520,250 820,120 C970,60 1060,160 1120,130" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="860" cy="60" r="100" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
        </svg>

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          {/* Athlete Profile & Status */}
          <div className="flex items-start sm:items-center gap-5 min-w-0">
            {/* VIP Avatar with dynamic glow */}
            <div className="relative shrink-0">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser?.fullName || 'Avatar'}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-xl border-2 border-white/80 dark:border-white/20 select-none transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/95 dark:bg-slate-900/90 text-[#1A4D3E] dark:text-emerald-400 flex items-center justify-center font-black text-2xl sm:text-3xl uppercase tracking-wider shadow-xl border-2 border-white/80 dark:border-white/20 select-none transition-transform duration-300 hover:scale-105">
                  <span className="bg-gradient-to-tr from-[#1A4D3E] via-[#2D6A4F] to-[#F59E0B] bg-clip-text text-transparent font-black">
                    {currentUser?.fullName?.charAt(0) || 'M'}
                  </span>
                </div>
              )}
              <span
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-md"
                title={isEn ? 'Account Online' : 'Tài khoản đang hoạt động'}
              >
                <span className="material-symbols-outlined text-[12px] text-white font-bold">check</span>
              </span>
            </div>

            {/* Member Details */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[#1A4D3E] dark:text-emerald-300 border border-white/80 dark:border-white/20 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                  <span className="material-symbols-outlined text-[14px] text-amber-500">workspace_premium</span>
                  {isEn ? 'OLYMPIC ATHLETE • SCMS PRO' : 'HỘI VIÊN CHÍNH THỨC • SCMS PRO'}
                </span>
                <span
                  className={`px-3 py-0.5 rounded-full text-[11px] font-bold border backdrop-blur-md flex items-center gap-1.5 shadow-xs ${
                    membership.active
                      ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/40'
                      : 'bg-rose-500/25 text-rose-200 border-rose-400/40'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${membership.active ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  {membership.label} {membership.active && (isEn ? `(${membership.daysLeft} days left)` : `(Còn ${membership.daysLeft} ngày)`)}
                </span>
              </div>

              <h1 className="font-chivo text-2xl sm:text-3xl font-black text-white mt-1.5 tracking-tight truncate drop-shadow-sm">
                {greeting}, {currentUser?.fullName}!
              </h1>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs mt-2.5">
                {/* 1-click Copy Member Card Code */}
                <button
                  type="button"
                  onClick={handleCopyMemberCode}
                  className="flex items-center gap-1.5 bg-white/90 hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-900 px-3 py-1 rounded-xl border border-white/80 dark:border-white/20 text-slate-800 dark:text-slate-100 transition font-mono group cursor-pointer active:scale-95 shadow-xs backdrop-blur-md"
                  title={isEn ? 'Click to copy card code' : 'Bấm để sao chép mã thẻ'}
                >
                  <span className="material-symbols-outlined text-[15px] text-[#2D6A4F] group-hover:scale-110 transition">badge</span>
                  <span>{isEn ? 'ID' : 'Mã'}: <strong className="text-slate-950 dark:text-white font-black">{currentUser?.memberCode || (isEn ? 'Unassigned' : 'Chưa cấp')}</strong></span>
                  <span className="material-symbols-outlined text-[14px] text-slate-500 group-hover:text-slate-800 dark:group-hover:text-white transition">
                    {copiedCode ? 'done' : 'content_copy'}
                  </span>
                </button>

                {/* Package Name Pill */}
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[#1A4D3E] dark:text-emerald-300 font-bold border border-white/80 dark:border-white/20 shadow-xs">
                  <span className="material-symbols-outlined text-[15px] text-amber-500">card_membership</span>
                  <span>{translatePackageName(currentUser?.packageName, isEn)}</span>
                </span>

                {/* Phone Pill */}
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-800 dark:text-slate-200 shadow-xs font-medium border border-white/70 dark:border-white/20">
                  <span className="material-symbols-outlined text-[15px] text-slate-500">call</span>
                  <span>{currentUser?.phone || (isEn ? 'No phone' : 'Chưa có SĐT')}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Hero Action Toolbar (Streamlined & Non-Redundant) */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 xl:pt-0">
            {/* Primary Action: QR Code Gate Access */}
            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              className="px-4.5 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-[#144336] font-extrabold text-xs shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 active:scale-95 cursor-pointer border border-white/90 group"
            >
              <div className="w-6 h-6 rounded-lg bg-[#144336] text-white flex items-center justify-center group-hover:rotate-6 transition-transform">
                <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
              </div>
              <span>{isEn ? 'Gate Check-in QR' : 'Mã Check-in QR'}</span>
            </button>

            {/* Book Session CTA */}
            {canBook && (
              <a
                href="#/member/schedule"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-1.5 active:scale-95 cursor-pointer border border-amber-300/40"
              >
                <span className="material-symbols-outlined text-[17px]">event_available</span>
                <span>{isEn ? 'Book Class' : 'Đặt ca tập mới'}</span>
              </a>
            )}

            {/* Profile Edit */}
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1.5 active:scale-95 cursor-pointer border border-white/20 backdrop-blur-md"
              title={isEn ? 'Edit Profile' : 'Chỉnh sửa hồ sơ cá nhân'}
            >
              <span className="material-symbols-outlined text-[16px] text-amber-300">badge</span>
              <span>{isEn ? 'Profile' : 'Hồ sơ'}</span>
            </button>

            {/* Sync & Refresh Button */}
            <button
              type="button"
              onClick={handleSyncData}
              disabled={isRefreshing}
              className={`p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition shadow-md cursor-pointer ${
                isRefreshing ? 'animate-spin' : 'hover:scale-105 active:scale-95'
              }`}
              title={isEn ? 'Sync Data' : 'Đồng bộ dữ liệu'}
            >
              <span className="material-symbols-outlined text-[18px]">sync</span>
            </button>
          </div>
        </div>
      </section>

      {/* Error alert banner if any endpoint failed */}
      {Object.keys(displayErrors).length > 0 && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 space-y-1 shadow-xs animate-fade-slide-up">
          <p className="font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-rose-600 dark:text-rose-400">error</span>
            {isEn ? 'Some data could not be loaded.' : 'Một số dữ liệu chưa tải được. Bấm nút đồng bộ trên thanh tiêu đề để thử lại.'}
          </p>
          {Object.entries(displayErrors).map(([key, message]) => (
            <p key={key} className="pl-6 text-slate-700 dark:text-slate-300">
              • {({
                bookings: isEn ? 'Schedule' : 'Lịch tập',
                progress: isEn ? 'Progress' : 'Chỉ số thể chất',
                plans: isEn ? 'Lesson Plans' : 'Giáo án rèn luyện',
                notifications: isEn ? 'Notifications' : 'Thông báo'
              })[key] || key}: {message}
            </p>
          ))}
        </div>
      )}

      {/* Contextual Member Reminders (Only renders when needed) */}
      <MemberReminders items={reminders} />

      {/* ─────────────────────────────────────────────────────────────
          2. CORE BENTO METRICS BAR (4 High-Signal, Non-Redundant Cards)
      ───────────────────────────────────────────────────────────── */}
      <section aria-label={isEn ? 'Key Metrics' : 'Chỉ số trọng tâm'} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-slide-up">
        {/* Metric 1: Upcoming Classes */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 dark:hover:border-emerald-500/40 transition hover-lift flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                {isEn ? 'Upcoming Workouts' : 'Lịch tập sắp tới'}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                {errors.bookings ? '—' : upcoming.length}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {isEn ? 'sessions booked' : 'buổi đã xác nhận'}
              </span>
            </div>
            <p className="mt-1.5 text-[11.5px] text-slate-600 dark:text-slate-400 truncate">
              {upcoming.length > 0
                ? (isEn ? `Next: ${upcoming[0].timeSlot} (${upcoming[0].bookingDate})` : `Ca gần nhất: ${upcoming[0].timeSlot}`)
                : (isEn ? 'No workouts booked yet' : 'Chưa có buổi học mới')}
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">
              {isEn ? 'Timetable access' : 'Thời khóa biểu'}
            </span>
            <a href="#/member/schedule" className="text-emerald-700 dark:text-emerald-400 font-extrabold hover:underline flex items-center gap-0.5">
              <span>{isEn ? 'Book session' : 'Đặt lớp'}</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </a>
          </div>
        </div>

        {/* Metric 2: Membership Expiry & Validity */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-amber-500/50 dark:hover:border-amber-500/40 transition hover-lift flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                {isEn ? 'Package Status' : 'Trạng thái gói tập'}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">credit_card</span>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-2xl font-black tracking-tight ${membership.active ? 'text-amber-700 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {membership.label}
              </span>
              {membership.active && (
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  ({membership.daysLeft} {isEn ? 'days' : 'ngày'})
                </span>
              )}
            </div>
            {/* Visual validity progress bar */}
            <div className="mt-2">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${membership.active ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${validityPercent}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {membership.active
                  ? (isEn ? `Valid until: ${formatMemberDate(currentUser?.packageExpiry, isEn)}` : `Hạn: ${formatMemberDate(currentUser?.packageExpiry)}`)
                  : (isEn ? 'Please renew package' : 'Vui lòng gia hạn gói')}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">
              {isEn ? 'Plans & Pricing' : 'Quyền lợi gói'}
            </span>
            <a href="#/member/packages" className="text-amber-700 dark:text-amber-400 font-extrabold hover:underline flex items-center gap-0.5">
              <span>{isEn ? 'Renew' : 'Gia hạn'}</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </a>
          </div>
        </div>

        {/* Metric 3: InBody & Fitness Biometrics */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-sky-500/50 dark:hover:border-sky-500/40 transition hover-lift flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                {isEn ? 'Body Biometrics' : 'Chỉ số thể chất'}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">monitor_weight</span>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                {errors.progress ? '—' : (latest ? `${latest.weight || '--'} kg` : (isEn ? 'Pending' : 'Chờ đo'))}
              </span>
              {latest?.bodyFat ? (
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50">
                  {isEn ? `${latest.bodyFat}% Fat` : `Mỡ: ${latest.bodyFat}%`}
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 text-[11.5px] text-slate-600 dark:text-slate-400 truncate">
              {latest
                ? (isEn ? `Measured on ${formatMemberDate(latest.date, isEn)}` : `Đo ngày: ${formatMemberDate(latest.date)} (InBody)`)
                : (isEn ? 'Visit gym floor for InBody test' : 'Đến sàn tập để đo InBody miễn phí')}
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">
              {isEn ? 'Progress track' : 'Nhật ký tiến độ'}
            </span>
            <a href="#/member/progress" className="text-sky-700 dark:text-sky-400 font-extrabold hover:underline flex items-center gap-0.5">
              <span>{isEn ? 'View stats' : 'Xem chi tiết'}</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </a>
          </div>
        </div>

        {/* Metric 4: Smart Gate Check-in & Notifications */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-500/50 dark:hover:border-indigo-500/40 transition hover-lift flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                {isEn ? 'Gate & Activity' : 'Cổng & Điểm danh'}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">fact_check</span>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isEn ? 'Smart QR' : 'Smart QR'}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/50">
                {isEn ? 'Ready' : 'Sẵn sàng'}
              </span>
            </div>
            <p className="mt-1.5 text-[11.5px] text-slate-600 dark:text-slate-400 truncate">
              {unread > 0
                ? (isEn ? `${unread} unread notices waiting` : `${unread} thông báo mới chưa đọc`)
                : (isEn ? 'Auto check-in via turnstile gate' : 'Check-in tự động tại cửa xoay')}
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">
              {isEn ? 'Check-in logs' : 'Nhật ký ra vào'}
            </span>
            <a href="#/member/attendance" className="text-indigo-700 dark:text-indigo-400 font-extrabold hover:underline flex items-center gap-0.5">
              <span>{isEn ? 'History' : 'Xem lịch sử'}</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </a>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN ASYMMETRICAL BENTO WORKSPACE (7 Cols / 5 Cols)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ═════════════════════════════════════════════════════════════
            LEFT STREAM (7 COLS): WORKOUT SCHEDULE & TRAINING SYLLABUS
        ═════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card A: Upcoming Workouts Feed */}
          <section aria-label={isEn ? 'Upcoming Workouts' : 'Lịch tập sắp tới'} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 hover-lift">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#2D6A4F] dark:text-emerald-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                </div>
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">
                  {isEn ? 'Upcoming Workout Sessions' : 'Lịch tập sắp tới của bạn'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[#2D6A4F] dark:text-emerald-300 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/40">
                  {upcoming.length} {isEn ? 'sessions' : 'buổi'}
                </span>
              </div>
              <a
                href="#/member/bookings"
                className="text-xs font-bold text-[#2D6A4F] dark:text-emerald-400 hover:underline flex items-center gap-1 group"
              >
                <span>{isEn ? 'Manage & Cancel' : 'Xem tất cả & Hủy'}</span>
                <span className="material-symbols-outlined text-[14px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
              </a>
            </div>

            {errors.bookings ? (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-700 dark:text-rose-300">
                {isEn ? 'Unable to load schedule data.' : 'Chưa thể tải dữ liệu lịch học. Vui lòng thử lại sau.'}
              </div>
            ) : upcoming.length === 0 ? (
              /* High-End Empty State */
              <div className="text-center py-12 px-4 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#2D6A4F] dark:text-emerald-400 mx-auto flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-3xl">sports_gymnastics</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {isEn ? 'No upcoming workouts scheduled' : 'Bạn chưa có lịch tập nào sắp tới'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                    {isEn
                      ? 'Pick your favorite classes from the Olympic timetable to begin training today.'
                      : 'Hãy chọn ca tập yêu thích từ thời khóa biểu chuẩn Olympic để rèn luyện ngay hôm nay.'}
                  </p>
                </div>
                {canBook && (
                  <a
                    href="#/member/schedule"
                    className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer mt-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
                    <span>{isEn ? 'Book a Class Now' : 'Đăng ký ca tập ngay'}</span>
                  </a>
                )}
              </div>
            ) : (
              /* Rich Session List */
              <div className="space-y-3">
                {upcoming.slice(0, 4).map(booking => {
                  const dateParts = parseDateParts(booking.bookingDate, isEn);
                  const sport = getSportMeta(booking.className, booking.coachSpecialization, isEn);

                  return (
                    <article
                      key={booking.id}
                      className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 hover:shadow-md transition-all duration-200 bg-white dark:bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                    >
                      {/* Left: Balanced Olympic Date Pod & Class Info */}
                      <div className="flex items-start gap-4 min-w-0">
                        {/* Balanced Date Pod (Soft contrast in light mode, clean slate in dark mode) */}
                        <div className="w-14 sm:w-16 h-18 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center shrink-0 shadow-2xs border border-slate-200/90 dark:border-slate-700 group-hover:border-emerald-500/40 transition-colors">
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider leading-none">
                            {dateParts.weekday}
                          </span>
                          <span className="text-xl font-black text-slate-900 dark:text-white leading-tight mt-1 tabular-nums">
                            {dateParts.day}
                          </span>
                          <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium leading-none mt-0.5">
                            {dateParts.month}
                          </span>
                        </div>

                        {/* Class Meta */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            <span className={`px-2.5 py-0.5 rounded-md text-[10.5px] font-extrabold uppercase border flex items-center gap-1 ${sport.badgeBg}`}>
                              <span className="material-symbols-outlined text-[13px]">{sport.icon}</span>
                              {sport.name}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10.5px] font-bold font-mono">
                              {booking.timeSlot}
                            </span>
                          </div>

                          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition truncate">
                            {translateClassName(booking.className, isEn)}
                          </h3>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[15px] text-slate-400">stadium</span>
                              <span>{translateRoomName(booking.roomName, isEn)}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[15px] text-slate-400">sports</span>
                              <span>{isEn ? 'Coach:' : 'HLV:'} <strong className="text-slate-800 dark:text-slate-200">{translateCoachName(booking.coachName, isEn)}</strong></span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Status & Quick Cancel Button */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                        <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[#2D6A4F] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {booking.sessionStatus === 'CANCELLED' ? (isEn ? 'Cancelled' : 'Đã hủy') : getBookingStatusLabel(booking.status, isEn)}
                        </span>

                        {canCancel && isUpcomingBooking(booking) && (
                          <button
                            type="button"
                            onClick={() => {
                              setBookingToCancel(booking);
                              setCancelModalOpen(true);
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl border border-rose-200 dark:border-rose-900/60 transition cursor-pointer active:scale-95 flex items-center gap-1 shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-[14px]">event_busy</span>
                            <span>{isEn ? 'Cancel' : 'Hủy ca học'}</span>
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Card B: Training Syllabus & Coach Advice */}
          <section aria-label={isEn ? 'Training & Biometrics' : 'Giáo án & Lời khuyên HLV'} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 hover-lift">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">assignment</span>
                </div>
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">
                  {isEn ? 'Training Syllabus & Coach Advice' : 'Giáo án huấn luyện & Lời khuyên HLV'}
                </h2>
              </div>
              {canProgress && (
                <a href="#/member/progress" className="text-xs font-bold text-[#2D6A4F] dark:text-emerald-400 hover:underline flex items-center gap-1 group">
                  <span>{isEn ? 'Full Progress' : 'Xem toàn bộ'}</span>
                  <span className="material-symbols-outlined text-[14px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Sub-block: Coach Advice Note */}
              <div className="p-4.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 space-y-2.5 flex flex-col justify-between shadow-2xs">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-[#144336] dark:text-emerald-300 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-400">format_quote</span>
                      {isEn ? 'Coach Feedback' : 'Nhận xét từ HLV'}
                    </span>
                    {latest?.date && (
                      <span className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium">
                        {formatMemberDate(latest.date, isEn)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                    "{latest?.coachFeedback ? translateCoachFeedback(latest.coachFeedback, isEn) : (isEn ? 'Maintain balanced heart rate, drink enough water and adhere to the training plan.' : 'Duy trì nhịp tim ổn định, bù đủ nước và tập theo đúng giáo án đã đề ra.')}"
                  </p>
                </div>
                {latest?.workoutResult && (
                  <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 text-[11px] text-[#144336] dark:text-emerald-300 font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-emerald-600 dark:text-emerald-400">verified</span>
                    <span>{isEn ? 'Result:' : 'Kết quả:'} {translateWorkoutResult(latest.workoutResult, isEn)}</span>
                  </div>
                )}
              </div>

              {/* Right Sub-block: Active Lesson Plans */}
              <div className="p-4.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-2.5 flex flex-col justify-between shadow-2xs">
                {errors.plans ? (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    {isEn ? 'Unable to load lesson plans.' : 'Chưa tải được giáo án.'}
                  </p>
                ) : data.plans.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <span className="material-symbols-outlined text-2xl text-slate-400 block">fitness_center</span>
                    <p className="font-semibold">{isEn ? 'No workout plans assigned yet' : 'Chưa có giáo án riêng từ HLV'}</p>
                    <p className="text-[11px]">{isEn ? 'Request coach guidance during your next class' : 'Trao đổi cùng HLV trong buổi học tới'}</p>
                  </div>
                ) : (
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                      {isEn ? 'Current Focus Plan' : 'Giáo án đang theo học'}
                    </span>
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white leading-snug">
                      {translatePlanTitle(data.plans[0].title, isEn)}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-1">
                      {isEn ? 'Goal:' : 'Mục tiêu:'} {translatePlanGoal(data.plans[0].goal, isEn) || (isEn ? 'Build endurance and stability' : 'Tăng cường thể lực và sức bền')}
                    </p>
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>{isEn ? 'Coach:' : 'HLV:'} <strong className="text-slate-800 dark:text-slate-200">{translateCoachName(data.plans[0].coachName, isEn)}</strong></span>
                      <span>{isEn ? `From ${formatMemberDate(data.plans[0].startDate, isEn)}` : `Từ ${formatMemberDate(data.plans[0].startDate)}`}</span>
                    </div>
                  </div>
                )}
                <a
                  href="#/member/progress"
                  className="text-xs font-bold text-[#2D6A4F] dark:text-emerald-400 hover:underline inline-flex items-center gap-1 mt-1"
                >
                  <span>{isEn ? 'View all syllabus' : 'Xem giáo án chi tiết'}</span>
                  <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* ═════════════════════════════════════════════════════════════
            RIGHT STREAM (5 COLS): SMART DIGITAL PASS & UTILITIES
        ═════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-5 space-y-6">
          {/* Panel 1: Luxury Olympic Smart Digital Pass */}
          <section
            aria-label={isEn ? 'Smart Digital Pass' : 'Thẻ hội viên thông minh'}
            className="bg-gradient-to-br from-[#144336] via-[#1B5E4A] to-[#12382D] dark:from-[#091D17] dark:via-[#103026] dark:to-[#0A1F18] text-white p-6 sm:p-7 rounded-3xl border border-emerald-400/30 dark:border-emerald-500/20 shadow-xl relative overflow-hidden group hover-lift transition-all"
          >
            {/* Holographic accent shine */}
            <div className="absolute inset-0 pointer-events-none animate-gold-shimmer opacity-20" />
            <div className="absolute -top-12 -right-12 w-56 h-56 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />

            {/* Pass Header: Brand & NFC */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-300 flex items-center justify-center font-black text-sm shadow-md">
                  <span className="material-symbols-outlined text-[18px]">stadium</span>
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-widest text-amber-300 uppercase">SCMS APEX ARENA</h3>
                  <p className="text-[10px] text-emerald-200 uppercase tracking-wider">Olympic Member Pass</p>
                </div>
              </div>

              {/* Contactless Wave & Smart Chip */}
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-200 text-[20px]" title="NFC Contactless">
                  contactless
                </span>
                <div className="w-8 h-6 rounded bg-gradient-to-br from-[#FCE5B8] via-[#F2CC8F] to-[#C89B55] border border-amber-200/60 shadow flex items-center justify-center">
                  <div className="w-6 h-4 border border-amber-900/30 rounded grid grid-cols-2 gap-0.5 p-0.5">
                    <div className="bg-amber-600/30 rounded-xs" />
                    <div className="bg-amber-600/30 rounded-xs" />
                  </div>
                </div>
              </div>
            </div>

            {/* Pass Athlete Identity */}
            <div className="mt-6 relative z-10">
              <span className="text-[10px] uppercase tracking-widest text-emerald-200/80 font-bold block">
                {isEn ? 'Athlete / Member' : 'Chủ thẻ / Athlete'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide mt-0.5 truncate uppercase">
                {currentUser?.fullName || (isEn ? 'SCMS ATHLETE' : 'HỘI VIÊN SCMS')}
              </h2>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/15 border border-white/25 text-emerald-100 text-xs font-bold backdrop-blur-sm">
                <span className="material-symbols-outlined text-[14px] text-amber-300">military_tech</span>
                <span>{translatePackageName(currentUser?.packageName, isEn)}</span>
              </div>
            </div>

            {/* Pass Meta: Number & Expiry */}
            <div className="mt-4 pt-3 border-t border-white/15 flex items-end justify-between relative z-10 text-xs">
              <div>
                <span className="text-[10px] uppercase text-emerald-200/80 block font-bold">
                  {isEn ? 'Card Number' : 'Mã số thẻ'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyMemberCode}
                  className="font-mono text-base font-black tracking-wider text-amber-300 hover:text-amber-200 flex items-center gap-1 mt-0.5 group/btn cursor-pointer transition"
                  title={isEn ? 'Click to copy' : 'Bấm để chép mã'}
                >
                  <span>{currentUser?.memberCode || 'MEM-00000'}</span>
                  <span className="material-symbols-outlined text-[14px] opacity-70 group-hover/btn:opacity-100">
                    content_copy
                  </span>
                </button>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase text-emerald-200/80 block font-bold">
                  {isEn ? 'Valid Until' : 'Hạn sử dụng'}
                </span>
                <span className="font-mono font-bold text-white mt-0.5 block">
                  {formatMemberDate(currentUser?.packageExpiry, isEn)}
                </span>
              </div>
            </div>

            {/* Authentic Embedded Scannable QR Pod - unified with emerald theme */}
            <div
              onClick={() => setQrModalOpen(true)}
              className="mt-5 bg-white dark:bg-slate-900 p-3.5 rounded-2xl cursor-pointer hover:ring-2 hover:ring-amber-300 transition flex items-center justify-between gap-4 shadow-xl group/cardqr border border-emerald-100 dark:border-slate-800"
              title={isEn ? 'Tap to expand QR code' : 'Chạm để phóng to mã QR'}
            >
              <div className="flex items-center gap-3">
                {qrDataUrl ? (
                  <div className="w-14 h-14 rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-white shrink-0 shadow-xs group-hover/cardqr:scale-105 transition flex items-center justify-center">
                    <img src={qrDataUrl} alt="Gate Check-in QR" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1">
                    <span>{isEn ? 'Gate Check-in QR Code' : 'Mã QR Check-in qua cổng'}</span>
                    <span className="material-symbols-outlined text-[14px] text-emerald-600 dark:text-emerald-400">check_circle</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isEn ? 'Tap to view full screen scanner' : 'Chạm để phóng to khi qua cửa kiểm soát'}
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover/cardqr:text-slate-900 dark:group-hover/cardqr:text-white group-hover/cardqr:translate-x-0.5 transition-transform">
                fullscreen
              </span>
            </div>

            {/* Pass CTAs - Cohesive Olympic Gold/Amber CTA */}
            <div className="mt-4 pt-3 border-t border-white/15 flex items-center gap-2">
              <a
                href="#/member/packages"
                className="flex-1 py-2.5 text-center bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs shadow-lg transition-all duration-200 active:scale-98"
              >
                {isEn ? 'Renew / Upgrade Package' : 'Gia hạn / Nâng cấp gói'}
              </a>
              <button
                type="button"
                onClick={() => setQrModalOpen(true)}
                className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition active:scale-95 cursor-pointer border border-white/20"
                title={isEn ? 'Open Fullscreen QR' : 'Mở toàn màn hình mã QR'}
              >
                <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
              </button>
            </div>
          </section>

          {/* Panel 2: Streamlined Utility Hub (4 High-Value Cards) */}
          <section aria-label={isEn ? 'Member Shortcuts' : 'Tiện ích nhanh'} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 px-1">
              <span className="material-symbols-outlined text-[16px] text-[#144336] dark:text-emerald-400">widgets</span>
              {isEn ? 'Member Utility Center' : 'Trung tâm tiện ích hội viên'}
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <a
                href="#/member/schedule"
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 hover:border-emerald-500/40 transition group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#144336] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[18px]">event_available</span>
                </div>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white mt-2 group-hover:text-[#144336] dark:group-hover:text-emerald-400 transition">
                  {isEn ? 'Classes Timetable' : 'Thời khóa biểu'}
                </h4>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                  {isEn ? 'Book sports sessions' : 'Đăng ký các bộ môn'}
                </p>
              </a>

              <a
                href="#/member/attendance"
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 hover:border-emerald-500/40 transition group"
              >
                <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[18px]">fact_check</span>
                </div>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white mt-2 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition">
                  {isEn ? 'Attendance Log' : 'Lịch sử check-in'}
                </h4>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                  {isEn ? 'Automated turnstile logs' : 'Nhật ký qua cổng tự động'}
                </p>
              </a>

              <a
                href="#/member/progress"
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 hover:border-emerald-500/40 transition group"
              >
                <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[18px]">monitoring</span>
                </div>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white mt-2 group-hover:text-sky-700 dark:group-hover:text-sky-400 transition">
                  {isEn ? 'InBody & Syllabus' : 'Chỉ số & Giáo án'}
                </h4>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                  {isEn ? 'Track body transformation' : 'Theo dõi chỉ số hình thể'}
                </p>
              </a>

              <a
                href="#/member/support"
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 hover:border-emerald-500/40 transition group"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[18px]">support_agent</span>
                </div>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white mt-2 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition">
                  {isEn ? 'Support & Inquiries' : 'Hỗ trợ & Khiếu nại'}
                </h4>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                  {isEn ? '24/7 Front desk assistance' : 'Quầy lễ tân & Ban quản lý'}
                </p>
              </a>
            </div>
          </section>

          {/* Panel 3: Center Bulletins & Notifications */}
          <section aria-label={isEn ? 'Center Announcements' : 'Thông báo trung tâm'} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <span className="material-symbols-outlined text-amber-500 text-[18px]">campaign</span>
                {isEn ? 'Center Notifications' : 'Thông báo trung tâm'}
              </h3>
              <a href="#/member/notifications" className="text-[11px] font-bold text-[#2D6A4F] dark:text-emerald-400 hover:underline">
                {isEn ? 'View All' : 'Xem tất cả'}
              </a>
            </div>

            {notificationError ? (
              <p className="text-xs text-rose-600 dark:text-rose-400">
                {isEn ? 'Unable to load notifications.' : 'Chưa tải được thông báo.'}
              </p>
            ) : notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined text-2xl text-slate-300 dark:text-slate-600 block mb-1">notifications_off</span>
                {isEn ? 'No announcements.' : 'Không có thông báo mới.'}
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 3).map(item => (
                  <a
                    key={item.id}
                    href="#/member/notifications"
                    className={`block p-3 rounded-2xl border text-xs space-y-1 transition hover-lift ${
                      item.isRead
                        ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/50'
                        : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-white truncate pr-2">
                        {translateNotificationTitle(item.title, isEn)}
                      </h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title={isEn ? 'Unread' : 'Chưa đọc'} />
                      )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 line-clamp-1 text-[11px]">
                      {translateNotificationContent(item.content, isEn)}
                    </p>
                    <span className="text-[10px] text-slate-400 block pt-0.5 font-mono">
                      {formatMemberDateTime(item.createdAt, isEn)}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. QR CHECK-IN MODAL (Ultra-Clean Olympic Scannable QR)
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title={isEn ? 'Digital Access Card & Gate QR' : 'Mã Số Thẻ Check-in Điện Tử Qua Cổng'}
      >
        <div className="p-6 text-center space-y-5">
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#2D6A4F] dark:text-emerald-400">
              SCMS OLYMPIC SMART ACCESS
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {currentUser?.fullName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {isEn ? 'Card' : 'Mã thẻ'}: <strong className="text-slate-800 dark:text-slate-200">{currentUser?.memberCode || 'MEM-00000'}</strong> · {translatePackageName(currentUser?.packageName, isEn)}
            </p>
          </div>

          {/* Genuine Scannable QR Code with Target Corners & Scan Beam */}
          <div className="relative mx-auto w-64 h-64 p-3 bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-900 dark:border-slate-700 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
            {/* Corner decorations */}
            <div className="absolute top-2.5 left-2.5 w-5 h-5 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg pointer-events-none" />
            <div className="absolute top-2.5 right-2.5 w-5 h-5 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg pointer-events-none" />
            <div className="absolute bottom-2.5 left-2.5 w-5 h-5 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg pointer-events-none" />
            <div className="absolute bottom-2.5 right-2.5 w-5 h-5 border-b-4 border-r-4 border-emerald-500 rounded-br-lg pointer-events-none" />

            {/* Laser scanning sweep line */}
            <div className="absolute inset-x-3 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_14px_#10B981] animate-scanner-beam pointer-events-none z-10" />

            {qrDataUrl ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={qrDataUrl}
                  alt={`QR Check-in: ${memberCode}`}
                  className="w-56 h-56 object-contain rounded-2xl select-none"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-300 font-black text-xs flex items-center justify-center shadow-lg border-2 border-white tracking-wider">
                    SCMS
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-xs text-slate-400">
                <span className="material-symbols-outlined text-3xl animate-spin text-emerald-500 mb-2">progress_activity</span>
                <span>{isEn ? 'Generating QR Code...' : 'Đang tạo mã QR...'}</span>
              </div>
            )}
          </div>

          {/* Quick Actions Under QR */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyMemberCode}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[15px]">content_copy</span>
              <span>{copiedCode ? (isEn ? 'Copied!' : 'Đã sao chép!') : (isEn ? 'Copy Code' : 'Chép mã thẻ')}</span>
            </button>
            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`SCMS-QR-${memberCode}.png`}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-[#2D6A4F] dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition border border-emerald-500/30 active:scale-95"
              >
                <span className="material-symbols-outlined text-[15px]">download</span>
                <span>{isEn ? 'Download QR' : 'Tải ảnh QR'}</span>
              </a>
            )}
          </div>

          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-300 space-y-1">
            <p className="font-bold flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-amber-600 dark:text-amber-400">info</span>
              {isEn ? 'Automated Check-in Guide' : 'Hướng dẫn check-in tự động'}
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              {isEn
                ? 'Present this QR code in front of the scanner camera at the gate turnstile or front desk to log gym entry.'
                : 'Đưa màn hình mã QR này vào trước camera máy quét tại cửa xoay hoặc quầy lễ tân để ghi nhận lượt tập.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setQrModalOpen(false)}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer active:scale-98"
          >
            {isEn ? 'Close Window' : 'Đóng cửa sổ'}
          </button>
        </div>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          5. CANCEL BOOKING MODAL (Clear 2-Hour Refund Policy)
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title={isEn ? 'Cancel Class Booking' : 'Xác nhận hủy đặt chỗ'}
        maxWidth="max-w-md"
      >
        {bookingToCancel && (() => {
          const startTime = bookingStart(bookingToCancel);
          const hasTimeInfo = !Number.isNaN(startTime);
          const isEligibleForRefund = hasTimeInfo ? (startTime - Date.now() >= 2 * 60 * 60 * 1000) : true;
          const sportTheme = getSportTheme(bookingToCancel.sportName, bookingToCancel.className, isEn);

          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/50">
                  <span className="material-symbols-outlined text-[22px]">event_busy</span>
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {isEn ? 'Cancel this class booking?' : 'Bạn muốn hủy lịch ca tập này?'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isEn ? 'Please review session info and refund policy below.' : 'Vui lòng kiểm tra thông tin ca tập và quyền lợi hoàn lượt bên dưới.'}
                  </p>
                </div>
              </div>

              {/* Class Info Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {translateClassName(bookingToCancel.className, isEn)}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${sportTheme.badge}`}>
                    {sportTheme.tag}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">calendar_month</span>
                    <span>{formatMemberDate(bookingToCancel.bookingDate, isEn)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
                    <span className="font-mono font-semibold">{bookingToCancel.timeSlot}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 sm:col-span-2">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">location_on</span>
                    <span>{translateRoomName(bookingToCancel.roomName, isEn)}</span>
                  </div>
                </div>
              </div>

              {/* Refund Policy Callout */}
              {isEligibleForRefund ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                  <span className="material-symbols-outlined text-[20px] text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">check_circle</span>
                  <div className="space-y-0.5">
                    <span className="font-bold block text-emerald-800 dark:text-emerald-300">
                      {isEn ? '1 Session Credit will be refunded' : 'Được hoàn lại 01 lượt tập'}
                    </span>
                    <p className="text-[11.5px] text-emerald-700 dark:text-emerald-300/90 leading-relaxed">
                      {isEn
                        ? 'Because you are cancelling more than 2 hours before start time, your session credit will be returned automatically.'
                        : 'Do bạn hủy trước giờ học hơn 2 tiếng, 1 lượt tập sẽ được tự động hoàn lại vào gói của bạn ngay sau khi xác nhận hủy.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                  <span className="material-symbols-outlined text-[20px] text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">warning</span>
                  <div className="space-y-0.5">
                    <span className="font-bold block text-amber-800 dark:text-amber-300">
                      {isEn ? 'Session starts in less than 2 hours' : 'Ca học diễn ra trong vòng 2 giờ tới'}
                    </span>
                    <p className="text-[11.5px] text-amber-700 dark:text-amber-300/90 leading-relaxed">
                      {isEn
                        ? 'According to center policy, late cancellations will not refund session credit. For medical emergencies, please visit the front desk.'
                        : 'Theo quy định trung tâm, việc hủy sát giờ sẽ không được hoàn lại lượt tập. Nếu có sự cố sức khỏe khẩn cấp, vui lòng liên hệ trực tiếp quầy lễ tân.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  disabled={cancelling}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {isEn ? 'Keep Session' : 'Giữ lại ca học'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancelBooking}
                  disabled={cancelling}
                  className="px-4.5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  {cancelling ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{isEn ? 'Cancelling...' : 'Đang xử lý...'}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">close</span>
                      <span>{isEn ? 'Confirm Cancellation' : 'Đồng ý hủy chỗ'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Profile Update Modal */}
      {profileOpen && (
        <ProfileModal isOpen onClose={() => setProfileOpen(false)} />
      )}
    </div>
  );
}
