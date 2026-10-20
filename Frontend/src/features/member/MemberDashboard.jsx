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
  getBookingStatusLabel
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

// Helper to determine sport meta and styling
function getSportMeta(className = '', spec = '', isEn = false) {
  const cName = className.toLowerCase();
  const sSpec = spec.toLowerCase();

  // 1. Check class name first
  if (cName.includes('cầu lông') || cName.includes('badminton')) {
    return {
      name: isEn ? 'Badminton' : 'Cầu lông',
      icon: 'sports_tennis',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      gradient: 'from-emerald-500 to-teal-600'
    };
  }
  if (cName.includes('box') || cName.includes('kickfit') || cName.includes('võ') || cName.includes('mma') || cName.includes('muay')) {
    return {
      name: isEn ? 'Boxing & Martial Arts' : 'Boxing & Võ thuật',
      icon: 'sports_mma',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      gradient: 'from-amber-500 to-orange-600'
    };
  }
  if (cName.includes('bơi') || cName.includes('swim') || cName.includes('pool')) {
    return {
      name: isEn ? 'Swimming' : 'Bơi lội',
      icon: 'pool',
      badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
      gradient: 'from-sky-500 to-blue-600'
    };
  }
  if (cName.includes('yoga') || cName.includes('pilates') || cName.includes('giãn cơ') || cName.includes('stretch')) {
    return {
      name: isEn ? 'Yoga & Pilates' : 'Yoga & Pilates',
      icon: 'self_improvement',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
      gradient: 'from-purple-500 to-indigo-600'
    };
  }
  if (cName.includes('tennis') || cName.includes('quần vợt') || cName.includes('pickleball')) {
    return {
      name: isEn ? 'Tennis & Racket' : 'Tennis & Quần vợt',
      icon: 'sports_baseball',
      badgeBg: 'bg-lime-50 text-lime-800 border-lime-200',
      gradient: 'from-lime-500 to-emerald-600'
    };
  }
  if (cName.includes('bóng rổ') || cName.includes('basketball') || cName.includes('bóng đá') || cName.includes('bóng chuyền')) {
    return {
      name: isEn ? 'Team Sports & Ball' : 'Thể thao đồng đội',
      icon: 'sports_basketball',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
      gradient: 'from-blue-500 to-indigo-600'
    };
  }
  if (cName.includes('gym') || cName.includes('fitness') || cName.includes('tăng cơ') || cName.includes('cardio') || cName.includes('hypertrophy')) {
    return {
      name: isEn ? 'Gym & Fitness' : 'Gym & Fitness',
      icon: 'fitness_center',
      badgeBg: 'bg-red-50 text-red-700 border-red-200',
      gradient: 'from-red-500 to-rose-600'
    };
  }

  // 2. Fallback to coach specialization if className is generic
  if (sSpec.includes('cầu lông') || sSpec.includes('badminton')) {
    return {
      name: isEn ? 'Badminton' : 'Cầu lông',
      icon: 'sports_tennis',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      gradient: 'from-emerald-500 to-teal-600'
    };
  }
  if (sSpec.includes('box') || sSpec.includes('kickfit')) {
    return {
      name: isEn ? 'Boxing & Martial Arts' : 'Boxing & Võ thuật',
      icon: 'sports_mma',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      gradient: 'from-amber-500 to-orange-600'
    };
  }
  if (sSpec.includes('bơi') || sSpec.includes('swim')) {
    return {
      name: isEn ? 'Swimming' : 'Bơi lội',
      icon: 'pool',
      badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
      gradient: 'from-sky-500 to-blue-600'
    };
  }
  if (sSpec.includes('yoga') || sSpec.includes('pilates')) {
    return {
      name: isEn ? 'Yoga & Pilates' : 'Yoga & Pilates',
      icon: 'self_improvement',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
      gradient: 'from-purple-500 to-indigo-600'
    };
  }
  if (sSpec.includes('tennis') || sSpec.includes('pickleball')) {
    return {
      name: isEn ? 'Tennis & Racket' : 'Tennis & Quần vợt',
      icon: 'sports_baseball',
      badgeBg: 'bg-lime-50 text-lime-800 border-lime-200',
      gradient: 'from-lime-500 to-emerald-600'
    };
  }

  return {
    name: isEn ? 'Gym & Fitness' : 'Gym & Fitness',
    icon: 'fitness_center',
    badgeBg: 'bg-red-50 text-red-700 border-red-200',
    gradient: 'from-red-500 to-rose-600'
  };
}

// Helper to parse date string into rich day/month/weekday badges
function parseDateParts(dateStr, isEn = false) {
  if (!dateStr) return { day: '--', month: '--', weekday: '--' };
  const d = new Date(`${String(dateStr).slice(0, 10)}T12:00:00+07:00`);
  if (Number.isNaN(d.getTime())) return { day: '--', month: '--', weekday: '--' };
  const weekdaysVi = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
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
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const { showSuccess, showError, showInfo } = useToast();
  const { items: notifications, error: notificationError, refresh: refreshNotifications } = useNotifications();

  const [data, setData] = useState({ bookings: [], progress: [], plans: [] });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Quick cancel modal states
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const memberCode = currentUser?.memberCode || 'MEM-00005';

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
  const canAskAI = capabilities.includes('ask_ai_assistant');
  const canCancel = capabilities.includes('cancel_booking');

  useEffect(() => {
    let active = true;
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
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
      <div className="py-20 flex flex-col items-center justify-center">
        <LoadingSpinner text={isEn ? 'Syncing Olympic Member account...' : 'Đang đồng bộ dữ liệu tài khoản hội viên Olympic...'} />
      </div>
    );
  }

  const upcoming = getUpcomingBookings(data.bookings);
  const membership = getMembershipSummary(currentUser, new Date(), isEn);
  const latest = getLatestProgress(data.progress);
  const unread = notifications.filter(item => !item.isRead).length;
  const displayErrors = { ...errors, ...(notificationError ? { notifications: notificationError } : {}) };
  const reminders = getMemberReminders(currentUser, data.bookings, new Date(), isEn);

  // Quick Action Shortcuts with high-energy colors & badges
  const shortcuts = [
    {
      href: '#/member/packages',
      icon: 'card_membership',
      title: isEn ? 'Packages & Renewal' : 'Gói tập & Gia hạn',
      subtitle: isEn ? 'Benefits & Expiry' : 'Quyền lợi & Hạn sử dụng',
      color: 'from-[#1E2235] to-[#2B2D42]',
      badge: membership.active ? (isEn ? `${membership.daysLeft} days` : `${membership.daysLeft} ngày`) : (isEn ? 'Needs Renewal' : 'Cần gia hạn'),
      badgeColor: membership.active ? 'bg-[#81B29A]/15 text-[#2D6A4F] dark:text-[#81B29A] font-bold' : 'bg-[#E07A5F]/15 text-[#C85A3F] dark:text-[#E07A5F] font-bold'
    },
    ...(canBook
      ? [
          {
            href: '#/member/schedule',
            icon: 'event_available',
            title: isEn ? 'Classes & Booking' : 'Xem & Đăng ký lớp',
            subtitle: isEn ? 'Sports Timetable' : 'Thời khóa biểu thể thao',
            color: 'from-[#2D6A4F] to-[#81B29A]',
            badge: isEn ? '4 Sports' : '4 bộ môn',
            badgeColor: 'bg-[#81B29A]/15 text-[#2D6A4F] dark:text-[#81B29A] font-bold'
          },
          {
            href: '#/member/bookings',
            icon: 'calendar_month',
            title: isEn ? 'My Schedule & Cancel' : 'Lịch cá nhân & Hủy',
            subtitle: isEn ? `${upcoming.length} upcoming sessions` : `${upcoming.length} buổi sắp diễn ra`,
            color: 'from-[#C85A3F] to-[#E07A5F]',
            badge: isEn ? `${upcoming.length} classes` : `${upcoming.length} lớp`,
            badgeColor: 'bg-[#E07A5F]/15 text-[#C85A3F] dark:text-[#E07A5F] font-bold'
          },
          {
            href: '#/member/attendance',
            icon: 'fact_check',
            title: isEn ? 'Attendance History' : 'Lịch sử điểm danh',
            subtitle: isEn ? 'Check-in entry logs' : 'Nhật ký check-in ra vào',
            color: 'from-[#0077B6] to-[#0096C7]',
            badge: isEn ? 'Automated' : 'Tự động',
            badgeColor: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold'
          }
        ]
      : []),
    ...(canProgress
      ? [
          {
            href: '#/member/progress',
            icon: 'monitoring',
            title: isEn ? 'Syllabus & Progress' : 'Giáo án & Tiến độ',
            subtitle: isEn ? 'InBody & Coach Advice' : 'InBody & Lời khuyên HLV',
            color: 'from-[#6D28D9] to-[#8B5CF6]',
            badge: latest ? `${latest.weight || '--'} kg` : (isEn ? 'Pending' : 'Chờ đo'),
            badgeColor: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold'
          }
        ]
      : []),
    {
      href: '#/member/notifications',
      icon: 'notifications',
      title: isEn ? 'My Notifications' : 'Thông báo của tôi',
      subtitle: isEn ? 'News & Schedule alerts' : 'Tin tức & Xác nhận lịch',
      color: 'from-[#D97706] to-[#F2CC8F]',
      badge: unread > 0 ? (isEn ? `${unread} new` : `${unread} mới`) : (isEn ? 'All read' : 'Đã đọc hết'),
      badgeColor: unread > 0 ? 'bg-[#F2CC8F]/25 text-[#B45309] dark:text-[#F2CC8F] font-black' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium'
    },
    {
      href: '#/member/support',
      icon: 'support_agent',
      title: isEn ? 'Support & Requests' : 'Hỗ trợ & Khiếu nại',
      subtitle: isEn ? 'Send requests to Desk / Mgmt' : 'Gửi yêu cầu tới Lễ tân / BQL',
      color: 'from-[#3D405B] to-[#4F5D75]',
      badge: '24/7',
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold'
    }
  ];

  const greeting = getTimeGreeting(isEn);

  return (
    <div className="space-y-6 pb-12 font-lexend">
      {/* 1. Olympic Hero Masterpiece Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#121624] via-[#181D2F] to-[#1E2235] text-white p-6 sm:p-8 border border-slate-700/60 shadow-xl overflow-hidden animate-fade-slide-up">
        {/* Glow accents */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#81B29A]/15 rounded-full blur-3xl pointer-events-none animate-float" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#F2CC8F]/10 rounded-full blur-3xl pointer-events-none animate-float" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0">
            {/* Avatar block with initial & verified dot */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#F2CC8F] via-[#81B29A] to-[#E07A5F] p-0.5 shadow-lg shadow-black/40">
                <div className="w-full h-full rounded-[14px] bg-[#1E2235] flex items-center justify-center text-[#F2CC8F] font-black text-2xl sm:text-3xl uppercase tracking-wider">
                  {currentUser?.fullName?.charAt(0) || 'M'}
                </div>
              </div>
              <span
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#1E2235] flex items-center justify-center shadow animate-pulse-ring"
                title={isEn ? 'Account Online' : 'Tài khoản đang trực tuyến'}
              >
                <span className="material-symbols-outlined text-[12px] text-white font-bold">check</span>
              </span>
            </div>

            {/* Member Greeting and Identity Details */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#F2CC8F]/15 text-[#F2CC8F] border border-[#F2CC8F]/35 text-[11px] font-extrabold uppercase tracking-widest flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-[#F2CC8F]">workspace_premium</span>
                  {isEn ? 'OFFICIAL ATHLETE • SCMS PRO' : 'HỘI VIÊN CHÍNH THỨC • SCMS PRO'}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${
                    membership.active
                      ? 'bg-[#81B29A]/20 text-[#81B29A] border-[#81B29A]/40'
                      : 'bg-[#E07A5F]/20 text-[#E07A5F] border-[#E07A5F]/40'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${membership.active ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                  {membership.label} {membership.active && (isEn ? `(${membership.daysLeft} days left)` : `(Còn ${membership.daysLeft} ngày)`)}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1.5 tracking-tight truncate">
                {greeting}, {currentUser?.fullName}!
              </h1>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-300 mt-2">
                <button
                  type="button"
                  onClick={handleCopyMemberCode}
                  className="flex items-center gap-1.5 bg-[#24293D] hover:bg-[#2C324B] px-2.5 py-1 rounded-lg border border-slate-700 hover:border-[#81B29A]/50 text-slate-200 transition font-mono group cursor-pointer active:scale-95"
                  title={isEn ? 'Click to copy code' : 'Bấm để sao chép mã'}
                >
                  <span className="material-symbols-outlined text-[14px] text-[#F2CC8F] group-hover:scale-110 transition">badge</span>
                  <span>{isEn ? 'Card' : 'Mã thẻ'}: <strong className="text-white">{currentUser?.memberCode || (isEn ? 'Unassigned' : 'Chưa cấp')}</strong></span>
                  <span className="material-symbols-outlined text-[13px] text-slate-400 group-hover:text-white transition">
                    {copiedCode ? 'done' : 'content_copy'}
                  </span>
                </button>

                <span className="flex items-center gap-1 text-slate-300">
                  <span className="material-symbols-outlined text-[14px] text-slate-400">call</span>
                  {currentUser?.phone || (isEn ? 'No phone added' : 'Chưa cập nhật SĐT')}
                </span>

                <span className="flex items-center gap-1 text-slate-300">
                  <span className="material-symbols-outlined text-[14px] text-[#F2CC8F]">card_membership</span>
                  {translatePackageName(currentUser?.packageName, isEn)}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#F2CC8F]/15 hover:bg-[#F2CC8F]/25 border border-[#F2CC8F]/40 text-[#F2CC8F] hover:text-white text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-xs hover:shadow-md active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-[#F2CC8F]">qr_code_scanner</span>
              <span>{isEn ? 'Check-in QR' : 'Mã Check-in'}</span>
            </button>

            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2D6A4F] to-[#81B29A] hover:from-[#245841] hover:to-[#729F89] text-white text-xs font-bold shadow-md shadow-[#2D6A4F]/25 hover:shadow-lg transition-all duration-200 flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">edit</span>
              <span>{isEn ? 'Personal Profile' : 'Hồ sơ cá nhân'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setReload(v => v + 1);
                refreshNotifications();
                showInfo(isEn ? 'Refreshing data...' : 'Đang làm mới dữ liệu...');
              }}
              className="p-2.5 rounded-xl bg-[#24293D] hover:bg-[#2C324B] border border-slate-700 text-slate-300 hover:text-white transition active:rotate-180 duration-300 cursor-pointer"
              title={isEn ? 'Refresh Data' : 'Tải lại dữ liệu'}
            >
              <span className="material-symbols-outlined text-[18px]">sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error alert if any sub-request failed */}
      {Object.keys(displayErrors).length > 0 && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 space-y-1 shadow-xs animate-fade-slide-up">
          <p className="font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-rose-600 dark:text-rose-400">error</span>
            {isEn
              ? 'Some data could not be loaded. Click "Refresh" on the header to try again.'
              : 'Một số dữ liệu chưa tải được. Bấm "Tải lại" trên thanh điều hướng để thử lại.'}
          </p>
          {Object.entries(displayErrors).map(([key, message]) => (
            <p key={key} className="pl-6 text-slate-700 dark:text-slate-300">
              • {({
                bookings: isEn ? 'Schedule' : 'Lịch học',
                progress: isEn ? 'Progress' : 'Kết quả tập',
                plans: isEn ? 'Lesson Plans' : 'Giáo án',
                notifications: isEn ? 'Notifications' : 'Thông báo'
              })[key] || key}: {message}
            </p>
          ))}
        </div>
      )}

      {/* Member Reminders Section */}
      <MemberReminders items={reminders} />

      {/* 2. Olympic Quick Actions Hub */}
      <div className="space-y-2.5 animate-fade-slide-up stagger-1">
        <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-[#81B29A]">dashboard_customize</span>
            {isEn ? 'Member Utility Center (Quick Access)' : 'Trung tâm tiện ích hội viên (Truy cập nhanh)'}
          </span>
          <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500 lowercase">
            {isEn ? 'tap to open feature' : 'chạm để mở tính năng'}
          </span>
        </div>

        <section aria-label={isEn ? 'Quick Access Hub' : 'Truy cập nhanh'} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {shortcuts.map(item => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                if (item.isAiPopup) {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent('SCMS_OPEN_AI_POPUP'));
                }
              }}
              className="group relative p-3.5 bg-white dark:bg-slate-900 hover:bg-[#FAF8F5]/80 dark:hover:bg-slate-800/80 border border-slate-200/90 dark:border-slate-800 hover:border-[#81B29A]/50 dark:hover:border-[#81B29A]/40 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between active:scale-[0.98] hover-lift"
            >
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:rotate-2 transition-transform duration-300`}>
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </div>

              <div className="mt-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#2D6A4F] dark:group-hover:text-[#81B29A] transition flex items-center justify-between">
                  <span className="truncate">{item.title}</span>
                  <span className="material-symbols-outlined text-[14px] text-slate-400 dark:text-slate-500 group-hover:text-[#81B29A] group-hover:translate-x-1 transition duration-200">
                    chevron_right
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.subtitle}</p>
              </div>
            </a>
          ))}
        </section>
      </div>

      {/* 3. 4 Bento KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-slide-up stagger-2">
        {/* KPI 1: Upcoming Classes */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-[#81B29A]/50 dark:hover:border-[#81B29A]/40 transition hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEn ? 'Upcoming Classes' : 'Lịch tập sắp tới'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#81B29A]/15 border border-[#81B29A]/30 text-[#2D6A4F] dark:text-[#81B29A] flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[22px]">calendar_month</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {errors.bookings ? '—' : upcoming.length}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isEn ? 'confirmed sessions' : 'buổi đã xác nhận'}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="truncate">
              {upcoming.length > 0
                ? (isEn ? `Next: ${upcoming[0].timeSlot}` : `Ca gần nhất: ${upcoming[0].timeSlot}`)
                : (isEn ? 'No upcoming workouts' : 'Chưa có buổi học mới')}
            </span>
            <a href="#/member/schedule" className="text-[#2D6A4F] dark:text-[#81B29A] font-bold hover:underline shrink-0">
              {isEn ? 'Book Class' : 'Đặt lớp'}
            </a>
          </div>
        </div>

        {/* KPI 2: Membership Expiry Status */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-[#81B29A]/50 dark:hover:border-[#81B29A]/40 transition hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEn ? 'Package Status' : 'Trạng thái gói tập'}
            </span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border group-hover:scale-110 transition-transform ${
              membership.active ? 'bg-[#81B29A]/15 border-[#81B29A]/30 text-[#2D6A4F] dark:text-[#81B29A]' : 'bg-[#E07A5F]/15 border-[#E07A5F]/30 text-[#C85A3F] dark:text-[#E07A5F]'
            }`}>
              <span className="material-symbols-outlined text-[22px]">credit_card</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-black tracking-tight ${membership.active ? 'text-[#2D6A4F] dark:text-[#81B29A]' : 'text-[#C85A3F] dark:text-[#E07A5F]'}`}>
              {membership.label}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="truncate">
              {membership.active
                ? (isEn ? `Expires: ${formatMemberDate(currentUser?.packageExpiry, isEn)}` : `Hạn: ${formatMemberDate(currentUser?.packageExpiry)}`)
                : (isEn ? 'Please renew package' : 'Vui lòng gia hạn')}
            </span>
            <a href="#/member/packages" className="text-[#2D6A4F] dark:text-[#81B29A] font-bold hover:underline shrink-0">
              {isEn ? 'Renew' : 'Gia hạn'}
            </a>
          </div>
        </div>

        {/* KPI 3: Body Progress & InBody */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-purple-300 dark:hover:border-purple-700 transition hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEn ? 'Body Progress' : 'Tiến độ thể chất'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[22px]">vital_signs</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {errors.progress ? '—' : (latest ? `${latest.weight || '--'} kg` : (isEn ? 'Pending' : 'Chờ đo'))}
            </span>
            {latest?.bodyFat && (
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                ({latest.bodyFat}% {isEn ? 'fat' : 'mỡ'})
              </span>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="truncate">
              {latest
                ? (isEn ? `Measured: ${formatMemberDate(latest.date, isEn)}` : `Đo ngày: ${formatMemberDate(latest.date)}`)
                : (isEn ? 'No InBody records yet' : 'Chưa có dữ liệu InBody')}
            </span>
            <a href="#/member/progress" className="text-purple-700 dark:text-purple-400 font-bold hover:underline shrink-0">
              {isEn ? 'Details' : 'Chi tiết'}
            </a>
          </div>
        </div>

        {/* KPI 4: Unread Notifications */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:border-[#F2CC8F]/50 dark:hover:border-[#F2CC8F]/40 transition hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEn ? 'Inbox & News' : 'Hộp thư & Thông báo'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#F2CC8F]/20 dark:bg-amber-950/40 border border-[#F2CC8F]/40 dark:border-amber-800 text-[#B45309] dark:text-[#F2CC8F] flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[22px]">notifications</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {notificationError ? '—' : unread}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isEn ? 'unread alerts' : 'tin nhắn chưa đọc'}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="truncate">
              {isEn ? 'Schedule & package notices' : 'Cập nhật lịch & gói dịch vụ'}
            </span>
            <a href="#/member/notifications" className="text-[#B45309] dark:text-[#F2CC8F] font-bold hover:underline shrink-0">
              {isEn ? 'View all' : 'Xem hết'}
            </a>
          </div>
        </div>
      </div>

      {/* 4. Main Content Grid: Olympic Digital Pass & Schedule Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 Cols): Luxury Olympic Digital Membership Pass & Biometric Card */}
        <div className="lg:col-span-5 space-y-6 animate-fade-slide-up stagger-3">
          {/* Olympic Digital Card */}
          <div className="bg-gradient-to-br from-[#0B0F1A] via-[#141824] to-[#1E2235] text-white p-6 sm:p-7 rounded-3xl border border-[#F2CC8F]/35 shadow-2xl relative overflow-hidden group hover:shadow-[0_20px_50px_rgba(242,204,143,0.15)] hover-lift transition-all duration-300">
            {/* Holographic accent shine */}
            <div className="absolute inset-0 pointer-events-none animate-gold-shimmer opacity-35" />
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#81B29A]/15 rounded-full blur-2xl pointer-events-none animate-float" />

            {/* Card Top: Brand & Chip */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#F2CC8F] to-[#D4A373] text-[#1E2235] flex items-center justify-center font-black text-sm shadow">
                  <span className="material-symbols-outlined text-[18px]">stadium</span>
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-widest text-[#F2CC8F] uppercase">SCMS APEX ARENA</h3>
                  <p className="text-[10px] text-slate-300 uppercase tracking-wider">Olympic Member Pass</p>
                </div>
              </div>

              {/* EMV Chip & Contactless Wave */}
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-[20px]" title="NFC Contactless">
                  contactless
                </span>
                <div className="w-9 h-7 rounded bg-gradient-to-br from-[#FCE5B8] via-[#F2CC8F] to-[#C89B55] border border-amber-200/60 shadow flex items-center justify-center">
                  <div className="w-7 h-5 border border-amber-900/30 rounded grid grid-cols-2 gap-0.5 p-0.5">
                    <div className="bg-amber-600/30 rounded-xs" />
                    <div className="bg-amber-600/30 rounded-xs" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card Middle: Member Name & Package Badge */}
            <div className="mt-8 relative z-10">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                {isEn ? 'Athlete / Member' : 'Chủ thẻ / Athlete'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide mt-0.5 truncate uppercase">
                {currentUser?.fullName || (isEn ? 'SCMS ATHLETE' : 'HỘI VIÊN SCMS')}
              </h2>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#81B29A]/20 border border-[#81B29A]/40 text-[#81B29A] text-xs font-bold">
                <span className="material-symbols-outlined text-[14px] text-[#F2CC8F]">military_tech</span>
                <span>{translatePackageName(currentUser?.packageName, isEn)}</span>
              </div>
            </div>

            {/* Card Bottom: Code & Expiry */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-end justify-between relative z-10 text-xs">
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-bold">
                  {isEn ? 'Card Number' : 'Mã số thẻ'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyMemberCode}
                  className="font-mono text-base font-black tracking-wider text-[#F2CC8F] hover:text-[#FCE5B8] flex items-center gap-1 mt-0.5 group/btn cursor-pointer transition"
                >
                  <span>{currentUser?.memberCode || 'MEM-00000'}</span>
                  <span className="material-symbols-outlined text-[14px] opacity-70 group-hover/btn:opacity-100">
                    content_copy
                  </span>
                </button>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase text-slate-400 block font-bold">
                  {isEn ? 'Expiry Date' : 'Hạn sử dụng'}
                </span>
                <span className="font-mono font-bold text-slate-200 mt-0.5 block">
                  {formatMemberDate(currentUser?.packageExpiry, isEn)}
                </span>
              </div>
            </div>

            {/* Quick QR Barcode Trigger button */}
            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              className="mt-5 w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-slate-100 flex items-center justify-center gap-2 transition backdrop-blur-sm active:scale-98 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px] text-[#F2CC8F]">qr_code_2</span>
              <span>{isEn ? 'Tap to view Gate Check-in QR' : 'Chạm để mở mã QR Check-in qua cổng'}</span>
            </button>

            {/* Barcode & Mini Real QR Preview */}
            <div
              onClick={() => setQrModalOpen(true)}
              className="mt-3 bg-white p-2 rounded-xl cursor-pointer hover:ring-2 hover:ring-[#F2CC8F] transition flex items-center justify-between gap-2 overflow-hidden shadow-inner group/cardqr"
              title={isEn ? 'Tap to expand QR code & barcode' : 'Chạm để phóng to mã QR & mã vạch Check-in'}
            >
              <div className="flex-1 flex items-center gap-1 overflow-hidden h-7">
                {[12, 4, 8, 16, 6, 10, 3, 14, 8, 18, 5, 9, 15, 6, 12, 4, 8, 10, 4, 16, 7, 11, 4, 14, 6].map((w, i) => (
                  <div key={i} className="h-full bg-slate-900" style={{ width: `${w * 1.5}px` }} />
                ))}
              </div>
              {qrDataUrl && (
                <div className="w-8 h-8 rounded border border-slate-200 p-0.5 bg-white shrink-0 shadow-xs group-hover/cardqr:scale-110 transition flex items-center justify-center">
                  <img src={qrDataUrl} alt="Mini QR" className="w-full h-full object-contain" />
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
              <a
                href="#/member/packages"
                className="flex-1 py-3 text-center bg-gradient-to-r from-[#F2CC8F] via-[#E8B878] to-[#E07A5F] hover:from-[#E8B878] hover:to-[#C85A3F] text-[#1E2235] font-black rounded-xl text-xs shadow-md shadow-[#F2CC8F]/20 hover:shadow-lg transition-all duration-200 active:scale-98"
              >
                {isEn ? 'Renew / Upgrade Package' : 'Gia hạn / Nâng cấp gói'}
              </a>
            </div>
          </div>

          {/* Biometrics & InBody Snapshot */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover-lift">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-purple-600 dark:text-purple-400">monitor_weight</span>
                {isEn ? 'InBody Metrics & Coach Advice' : 'Chỉ số InBody & Lời khuyên HLV'}
              </h2>
              {canProgress && (
                <a href="#/member/progress" className="text-xs font-bold text-[#2D6A4F] dark:text-[#81B29A] hover:underline">
                  {isEn ? 'View History' : 'Xem lịch sử'}
                </a>
              )}
            </div>

            {latest ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      {isEn ? 'Weight' : 'Cân nặng'}
                    </span>
                    <span className="text-lg font-black text-slate-900 dark:text-white block mt-0.5">
                      {formatMeasurement(latest.weight, 'kg', isEn)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
                    <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 block">
                      {isEn ? 'Body Fat' : 'Tỷ lệ mỡ'}
                    </span>
                    <span className="text-lg font-black text-purple-700 dark:text-purple-300 block mt-0.5">
                      {formatMeasurement(latest.bodyFat, '%', isEn)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block">
                      {isEn ? 'Muscle' : 'Khối cơ'}
                    </span>
                    <span className="text-lg font-black text-emerald-700 dark:text-emerald-300 block mt-0.5">
                      {formatMeasurement(latest.muscleMass, 'kg', isEn)}
                    </span>
                  </div>
                </div>

                {/* Coach Feedback Note */}
                <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-slate-800/80 border border-[#F2CC8F]/40 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 dark:text-[#F2CC8F] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-amber-700 dark:text-[#F2CC8F]">format_quote</span>
                      {isEn ? 'Coach' : 'HLV'}: {translateCoachName(latest.coachName, isEn) || (isEn ? 'Assigned Coach' : 'Huấn luyện viên phụ trách')}
                    </span>
                    <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                      {formatMemberDate(latest.date, isEn)}
                    </span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 italic leading-relaxed">
                    "{translateCoachFeedback(latest.coachFeedback, isEn) || (isEn ? 'Great workout session. Maintain heart rate and hydrate properly.' : 'Buổi tập diễn ra hiệu quả. Duy trì nhịp tim và chế độ bù nước đúng cách.')}"
                  </p>
                  {latest.workoutResult && (
                    <div className="pt-2 border-t border-amber-200/60 dark:border-slate-700 text-[11px] text-amber-900 dark:text-[#F2CC8F]">
                      <strong>{isEn ? 'Result:' : 'Kết quả:'}</strong> {translateWorkoutResult(latest.workoutResult, isEn)}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">fitness_center</span>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isEn ? 'No InBody records yet' : 'Chưa có kết quả đo InBody'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  {isEn
                    ? 'Contact your coach at the training floor to record biometric stats and set up personalized workout goals.'
                    : 'Hãy liên hệ HLV tại sàn tập để được đo chỉ số sinh trắc học và lập giáo án rèn luyện chuyên biệt.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 Cols): Upcoming Schedule & Notifications Feed */}
        <div className="lg:col-span-7 space-y-6 animate-fade-slide-up stagger-3">
          {/* Upcoming Schedule Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover-lift">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#2D6A4F] dark:text-[#81B29A]">schedule</span>
                  {isEn ? 'Upcoming Classes' : 'Lịch tập sắp tới'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#81B29A]/15 text-[#2D6A4F] dark:text-[#81B29A] text-xs font-bold">
                  {upcoming.length} {isEn ? 'sessions' : 'buổi'}
                </span>
              </div>
              <a href="#/member/bookings" className="text-xs font-bold text-[#2D6A4F] dark:text-[#81B29A] hover:underline flex items-center gap-1">
                <span>{isEn ? 'View all & Cancel' : 'Xem tất cả & Hủy lớp'}</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </a>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEn
                ? 'You will receive reminders 1 hour before each workout session starts.'
                : 'Bạn sẽ nhận thông báo nhắc lịch trước giờ bắt đầu ca học 1 tiếng.'}
            </p>

            {errors.bookings ? (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-700 dark:text-rose-300">
                {isEn ? 'Unable to load schedule data. Please try again later.' : 'Chưa thể tải dữ liệu lịch học. Vui lòng thử lại sau.'}
              </div>
            ) : upcoming.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#81B29A]/15 text-[#2D6A4F] dark:text-[#81B29A] mx-auto flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">event_busy</span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {isEn ? 'No upcoming workouts scheduled' : 'Bạn chưa có lịch tập nào sắp tới'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {isEn
                    ? 'Pick your favorite classes from the Olympic timetable to begin training today.'
                    : 'Hãy chọn buổi học yêu thích từ thời khóa biểu chuẩn Olympic để rèn luyện ngay hôm nay.'}
                </p>
                <a
                  href="#/member/schedule"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold shadow transition active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
                  <span>{isEn ? 'Book Session Now' : 'Đăng ký ca tập ngay'}</span>
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.slice(0, 4).map(booking => {
                  const dateParts = parseDateParts(booking.bookingDate, isEn);
                  const sport = getSportMeta(booking.className, booking.coachSpecialization, isEn);

                  return (
                    <article
                      key={booking.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#81B29A]/50 dark:hover:border-[#81B29A]/40 hover:shadow-md transition-all duration-200 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:-translate-y-0.5"
                    >
                      {/* Left: Date Block & Class Info */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        {/* High-contrast Date Pod */}
                        <div className="w-14 h-16 rounded-2xl bg-gradient-to-b from-[#1E2235] to-[#121624] text-white flex flex-col items-center justify-center shrink-0 shadow-xs border border-slate-700">
                          <span className="text-[10px] font-bold text-[#F2CC8F] uppercase leading-none">
                            {dateParts.weekday}
                          </span>
                          <span className="text-lg font-black leading-tight mt-0.5">
                            {dateParts.day}
                          </span>
                          <span className="text-[9px] text-slate-300 font-medium leading-none">
                            {dateParts.month}
                          </span>
                        </div>

                        {/* Class Meta */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border flex items-center gap-1 ${sport.badgeBg}`}>
                              <span className="material-symbols-outlined text-[12px]">{sport.icon}</span>
                              {sport.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                              {booking.timeSlot}
                            </span>
                          </div>

                          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-[#2D6A4F] dark:group-hover:text-[#81B29A] transition truncate">
                            {translateClassName(booking.className, isEn)}
                          </h3>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px] text-slate-400">stadium</span>
                              <span>{translateRoomName(booking.roomName, isEn)}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px] text-slate-400">sports</span>
                              <span>{isEn ? 'Coach:' : 'HLV:'} <strong className="text-slate-700 dark:text-slate-300">{translateCoachName(booking.coachName, isEn)}</strong></span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action: Cancel or Status */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                        <span className="px-2.5 py-1 rounded-full bg-[#81B29A]/15 text-[#2D6A4F] dark:text-[#81B29A] border border-[#81B29A]/30 text-[10px] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {booking.sessionStatus === 'CANCELLED' ? (isEn ? 'Cancelled' : 'Đã hủy') : getBookingStatusLabel(booking.status, isEn)}
                        </span>

                        {canCancel && isUpcomingBooking(booking) && (
                          <button
                            type="button"
                            onClick={() => {
                              setBookingToCancel(booking);
                              setCancelModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900/50 transition cursor-pointer active:scale-95"
                          >
                            {isEn ? 'Cancel Session' : 'Hủy ca học'}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Training Plans & Center Notifications Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Training Plans */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 hover-lift">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#81B29A] text-[17px]">assignment</span>
                  {isEn ? 'Lesson Plans' : 'Giáo án rèn luyện'}
                </h3>
                {canProgress && (
                  <a href="#/member/progress" className="text-[11px] font-bold text-[#2D6A4F] dark:text-[#81B29A] hover:underline">
                    {isEn ? 'View All' : 'Xem hết'}
                  </a>
                )}
              </div>

              {errors.plans ? (
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  {isEn ? 'Unable to load lesson plans.' : 'Chưa tải được giáo án.'}
                </p>
              ) : data.plans.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  <span className="material-symbols-outlined text-2xl text-slate-300 dark:text-slate-600 block mb-1">fitness_center</span>
                  {isEn ? 'No workout plans assigned yet.' : 'Chưa có giáo án từ HLV phụ trách.'}
                </div>
              ) : (
                data.plans.slice(0, 2).map(plan => (
                  <div key={plan.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 rounded-xl space-y-1 text-xs hover:border-[#81B29A]/40 transition">
                    <h4 className="font-bold text-slate-900 dark:text-white truncate">{translatePlanTitle(plan.title, isEn)}</h4>
                    <p className="text-slate-600 dark:text-slate-300 line-clamp-1">
                      {isEn ? 'Goal:' : 'Mục tiêu:'} {translatePlanGoal(plan.goal, isEn) || (isEn ? 'Build endurance' : 'Tăng cường thể lực')}
                    </p>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700">
                      <span>{isEn ? 'Coach:' : 'HLV:'} {translateCoachName(plan.coachName, isEn) || (isEn ? 'Trainer' : 'Chuyên viên')}</span>
                      <span>{isEn ? `From ${formatMemberDate(plan.startDate, isEn)}` : `Từ ${formatMemberDate(plan.startDate)}`}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Latest Center Notifications */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 hover-lift">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#F2CC8F] text-[17px]">campaign</span>
                  {isEn ? 'Center Notifications' : 'Thông báo trung tâm'}
                </h3>
                <a href="#/member/notifications" className="text-[11px] font-bold text-[#2D6A4F] dark:text-[#81B29A] hover:underline">
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
                notifications.slice(0, 2).map(item => (
                  <a
                    key={item.id}
                    href="#/member/notifications"
                    className={`block p-3 rounded-xl border text-xs space-y-1 transition ${
                      item.isRead
                        ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
                        : 'bg-[#F2CC8F]/10 dark:bg-amber-950/20 border-[#F2CC8F]/40 hover:border-[#F2CC8F]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-white truncate">{translateNotificationTitle(item.title, isEn)}</h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#D97706] dark:bg-[#F2CC8F] shrink-0" title={isEn ? 'Unread' : 'Chưa đọc'} />
                      )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 line-clamp-1 text-[11px]">{translateNotificationContent(item.content, isEn)}</p>
                    <span className="text-[10px] text-slate-400 block pt-0.5">
                      {formatMemberDateTime(item.createdAt, isEn)}
                    </span>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Check-in Modal */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title={isEn ? 'Digital Access Card & QR Check-in' : 'Mã Số Thẻ Check-in Điện Tử'}
      >
        <div className="p-6 text-center space-y-5">
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#2D6A4F] dark:text-[#81B29A]">
              SCMS OLYMPIC SMART ACCESS
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {currentUser?.fullName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {isEn ? 'Card' : 'Mã thẻ'}: <strong className="text-slate-800 dark:text-slate-200">{currentUser?.memberCode || 'MEM-00000'}</strong> · {translatePackageName(currentUser?.packageName, isEn)}
            </p>
          </div>

          {/* Real Scannable QR Code Container with target marks */}
          <div className="relative mx-auto w-64 h-64 p-3 bg-white dark:bg-slate-900 rounded-3xl border-2 border-[#1E2235] dark:border-slate-700 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
            {/* Corner decorations in Olympic Sage */}
            <div className="absolute top-2.5 left-2.5 w-5 h-5 border-t-4 border-l-4 border-[#81B29A] rounded-tl-lg pointer-events-none" />
            <div className="absolute top-2.5 right-2.5 w-5 h-5 border-t-4 border-r-4 border-[#81B29A] rounded-tr-lg pointer-events-none" />
            <div className="absolute bottom-2.5 left-2.5 w-5 h-5 border-b-4 border-l-4 border-[#81B29A] rounded-bl-lg pointer-events-none" />
            <div className="absolute bottom-2.5 right-2.5 w-5 h-5 border-b-4 border-r-4 border-[#81B29A] rounded-br-lg pointer-events-none" />

            {/* Laser scanning sweep line */}
            <div className="absolute inset-x-3 h-1 bg-gradient-to-r from-transparent via-[#81B29A] to-transparent shadow-[0_0_14px_#81B29A] animate-scanner-beam pointer-events-none z-10" />

            {/* Authentic Scannable QR Code Image */}
            {qrDataUrl ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={qrDataUrl}
                  alt={`QR Check-in: ${memberCode}`}
                  className="w-56 h-56 object-contain rounded-2xl select-none"
                />
                {/* Center SCMS Badge */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-xl bg-[#1E2235] text-[#F2CC8F] font-black text-xs flex items-center justify-center shadow-lg border-2 border-white/90 tracking-wider">
                    SCMS
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-xs text-slate-400">
                <span className="material-symbols-outlined text-3xl animate-spin text-[#81B29A] mb-2">progress_activity</span>
                <span>{isEn ? 'Generating QR Code...' : 'Đang tạo mã QR...'}</span>
              </div>
            )}
          </div>

          {/* Quick Actions Under QR */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyMemberCode}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[15px]">content_copy</span>
              <span>{copiedCode ? (isEn ? 'Copied!' : 'Đã sao chép!') : (isEn ? 'Copy Code' : 'Chép mã thẻ')}</span>
            </button>
            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`SCMS-QR-${memberCode}.png`}
                className="px-3 py-1.5 rounded-xl bg-[#81B29A]/15 hover:bg-[#81B29A]/25 text-[#2D6A4F] dark:text-[#81B29A] text-xs font-bold flex items-center gap-1.5 transition border border-[#81B29A]/30 active:scale-95"
              >
                <span className="material-symbols-outlined text-[15px]">download</span>
                <span>{isEn ? 'Download QR' : 'Tải ảnh QR'}</span>
              </a>
            )}
          </div>

          <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-300 space-y-1">
            <p className="font-bold flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-amber-700 dark:text-amber-400">info</span>
              {isEn ? 'Automated Check-in Guide' : 'Hướng dẫn check-in tự động'}
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              {isEn
                ? 'Present this QR code in front of the scanner camera at the gate or front desk to log your gym entry.'
                : 'Đưa màn hình mã QR này vào trước camera máy quét tại cổng kiểm soát hoặc quầy lễ tân để ghi nhận lượt tập.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setQrModalOpen(false)}
            className="w-full py-2.5 rounded-xl bg-[#1E2235] hover:bg-[#2B2D42] text-white text-xs font-bold transition-colors cursor-pointer active:scale-98"
          >
            {isEn ? 'Close Window' : 'Đóng cửa sổ'}
          </button>
        </div>
      </Modal>

      {/* Cancel Booking Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title={isEn ? 'Confirm Class Cancellation' : 'Xác Nhận Hủy Ca Học'}
      >
        {bookingToCancel && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-950 dark:text-rose-200 space-y-2">
              <span className="font-bold text-sm block text-rose-900 dark:text-rose-300">
                {isEn ? 'Are you sure you want to cancel this booking?' : 'Bạn có chắc chắn muốn hủy đặt chỗ cho buổi học này?'}
              </span>
              <div className="text-slate-800 dark:text-slate-200 space-y-1">
                <div>{isEn ? 'Class:' : 'Lớp:'} <strong className="text-slate-900 dark:text-white">{translateClassName(bookingToCancel.className, isEn)}</strong></div>
                <div>{isEn ? 'Time:' : 'Thời gian:'} <strong>{formatMemberDate(bookingToCancel.bookingDate, isEn)} ({bookingToCancel.timeSlot})</strong></div>
                <div>{isEn ? 'Location:' : 'Địa điểm:'} <strong>{translateRoomName(bookingToCancel.roomName, isEn)}</strong></div>
              </div>
              <p className="pt-2 text-rose-700 dark:text-rose-300 text-[11px] leading-relaxed border-t border-rose-200 dark:border-rose-900/50">
                {isEn
                  ? '[ME-06] Cancellation Policy: Cancellations at least 2 hours before class start will have session credits returned. Late cancellations or no-shows count as attended.'
                  : '[ME-06] Quy định hủy: Hủy trước thời gian diễn ra tối thiểu 2 giờ sẽ được hoàn lại lượt tập. Hủy muộn hoặc không đến sẽ tính là đã tham gia ca học.'}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelling}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                {isEn ? 'Keep Session' : 'Giữ lại buổi học'}
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelBooking}
                disabled={cancelling}
                className="px-4 py-2 rounded-xl bg-[#C85A3F] hover:bg-[#B34D34] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              >
                {cancelling ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    <span>{isEn ? 'Processing...' : 'Đang xử lý...'}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    <span>{isEn ? 'Confirm Cancellation' : 'Xác nhận hủy chỗ'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Profile Update Modal */}
      {profileOpen && (
        <ProfileModal isOpen onClose={() => setProfileOpen(false)} />
      )}
    </div>
  );
}
