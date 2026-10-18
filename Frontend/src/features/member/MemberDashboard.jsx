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
import {
  formatMemberDate,
  formatMemberDateTime,
  formatMeasurement,
  getLatestProgress,
  getMembershipSummary,
  getUpcomingBookings,
  getMemberReminders,
  isUpcomingBooking,
  BOOKING_LABELS
} from './memberOverview.js';

// Helper to determine sport meta and styling
function getSportMeta(className = '', spec = '') {
  const cName = className.toLowerCase();
  const sSpec = spec.toLowerCase();

  // 1. Check class name first
  if (cName.includes('cầu lông') || cName.includes('badminton')) {
    return {
      name: 'Cầu lông',
      icon: 'sports_tennis',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      gradient: 'from-emerald-500 to-teal-600'
    };
  }
  if (cName.includes('box') || cName.includes('kickfit') || cName.includes('võ') || cName.includes('mma') || cName.includes('muay')) {
    return {
      name: 'Boxing & Võ thuật',
      icon: 'sports_mma',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      gradient: 'from-amber-500 to-orange-600'
    };
  }
  if (cName.includes('bơi') || cName.includes('swim') || cName.includes('pool')) {
    return {
      name: 'Bơi lội',
      icon: 'pool',
      badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
      gradient: 'from-sky-500 to-blue-600'
    };
  }
  if (cName.includes('yoga') || cName.includes('pilates') || cName.includes('giãn cơ') || cName.includes('stretch')) {
    return {
      name: 'Yoga & Pilates',
      icon: 'self_improvement',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
      gradient: 'from-purple-500 to-indigo-600'
    };
  }
  if (cName.includes('gym') || cName.includes('fitness') || cName.includes('tăng cơ') || cName.includes('cardio') || cName.includes('hypertrophy')) {
    return {
      name: 'Gym & Fitness',
      icon: 'fitness_center',
      badgeBg: 'bg-red-50 text-red-700 border-red-200',
      gradient: 'from-red-500 to-rose-600'
    };
  }

  // 2. Fallback to coach specialization if className is generic
  if (sSpec.includes('cầu lông')) {
    return {
      name: 'Cầu lông',
      icon: 'sports_tennis',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      gradient: 'from-emerald-500 to-teal-600'
    };
  }
  if (sSpec.includes('box') || sSpec.includes('kickfit')) {
    return {
      name: 'Boxing & Võ thuật',
      icon: 'sports_mma',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      gradient: 'from-amber-500 to-orange-600'
    };
  }
  if (sSpec.includes('bơi')) {
    return {
      name: 'Bơi lội',
      icon: 'pool',
      badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
      gradient: 'from-sky-500 to-blue-600'
    };
  }
  if (sSpec.includes('yoga') || sSpec.includes('pilates')) {
    return {
      name: 'Yoga & Pilates',
      icon: 'self_improvement',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
      gradient: 'from-purple-500 to-indigo-600'
    };
  }

  return {
    name: 'Gym & Fitness',
    icon: 'fitness_center',
    badgeBg: 'bg-red-50 text-red-700 border-red-200',
    gradient: 'from-red-500 to-rose-600'
  };
}

// Helper to parse date string into rich day/month/weekday badges
function parseDateParts(dateStr) {
  if (!dateStr) return { day: '--', month: '--', weekday: '--' };
  const d = new Date(`${String(dateStr).slice(0, 10)}T12:00:00+07:00`);
  if (Number.isNaN(d.getTime())) return { day: '--', month: '--', weekday: '--' };
  const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: `Tháng ${d.getMonth() + 1}`,
    weekday: weekdays[d.getDay()]
  };
}

// Time-based polite greeting
function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Chào buổi sáng';
  if (hour >= 12 && hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export function MemberDashboard() {
  const { currentUser } = useAuth();
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
          nextErrors[key] = result.reason?.message || 'Không thể tải dữ liệu.';
        }
      });
      setData(nextData);
      setErrors(nextErrors);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [currentUser?.id, canBook, canProgress, reload]);

  const handleCopyMemberCode = () => {
    if (!currentUser?.memberCode) return;
    navigator.clipboard.writeText(currentUser.memberCode);
    setCopiedCode(true);
    showInfo(`Đã sao chép mã hội viên: ${currentUser.memberCode}`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleConfirmCancelBooking = async () => {
    if (!bookingToCancel || !currentUser) return;
    setCancelling(true);
    try {
      const res = await bookingApi.cancelBooking(bookingToCancel.id, currentUser.id);
      showSuccess(res?.message || 'Hủy lịch đặt chỗ thành công.');
      setCancelModalOpen(false);
      setBookingToCancel(null);
      setReload(r => r + 1);
    } catch (err) {
      showError(err.message || 'Không thể hủy buổi học.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <LoadingSpinner text="Đang đồng bộ dữ liệu tài khoản hội viên Olympic..." />
      </div>
    );
  }

  const upcoming = getUpcomingBookings(data.bookings);
  const membership = getMembershipSummary(currentUser);
  const latest = getLatestProgress(data.progress);
  const unread = notifications.filter(item => !item.isRead).length;
  const displayErrors = { ...errors, ...(notificationError ? { notifications: notificationError } : {}) };
  const reminders = getMemberReminders(currentUser, data.bookings);

  // Quick Action Shortcuts with high-energy colors & badges
  const shortcuts = [
    {
      href: '#/member/packages',
      icon: 'card_membership',
      title: 'Gói tập & Gia hạn',
      subtitle: 'Quyền lợi & Hạn sử dụng',
      color: 'from-indigo-600 to-blue-700',
      badge: membership.active ? `${membership.daysLeft} ngày` : 'Cần gia hạn',
      badgeColor: membership.active ? 'bg-indigo-50 text-indigo-700' : 'bg-red-50 text-red-700'
    },
    ...(canBook
      ? [
          {
            href: '#/member/schedule',
            icon: 'event_available',
            title: 'Xem & Đăng ký lớp',
            subtitle: 'Thời khóa biểu thể thao',
            color: 'from-red-600 to-rose-700',
            badge: '4 bộ môn',
            badgeColor: 'bg-red-50 text-red-700'
          },
          {
            href: '#/member/bookings',
            icon: 'calendar_month',
            title: 'Lịch cá nhân & Hủy',
            subtitle: `${upcoming.length} buổi sắp diễn ra`,
            color: 'from-amber-500 to-orange-600',
            badge: `${upcoming.length} lớp`,
            badgeColor: 'bg-amber-50 text-amber-800'
          },
          {
            href: '#/member/attendance',
            icon: 'fact_check',
            title: 'Lịch sử điểm danh',
            subtitle: 'Nhật ký check-in ra vào',
            color: 'from-emerald-600 to-teal-700',
            badge: 'Tự động',
            badgeColor: 'bg-emerald-50 text-emerald-700'
          }
        ]
      : []),
    ...(canProgress
      ? [
          {
            href: '#/member/progress',
            icon: 'monitoring',
            title: 'Giáo án & Tiến độ',
            subtitle: 'InBody & Lời khuyên HLV',
            color: 'from-purple-600 to-indigo-700',
            badge: latest ? `${latest.weight || '--'} kg` : 'Chờ đo',
            badgeColor: 'bg-purple-50 text-purple-700'
          }
        ]
      : []),
    ...(canAskAI
      ? [
          {
            href: '#/member/ai-assistant',
            icon: 'smart_toy',
            title: 'Trợ lý Thể Thao AI',
            subtitle: 'Hỏi đáp giáo án & dinh dưỡng',
            color: 'from-fuchsia-600 to-pink-600',
            badge: 'Popup 24/7',
            badgeColor: 'bg-fuchsia-50 text-fuchsia-700',
            isAiPopup: true
          }
        ]
      : []),
    {
      href: '#/member/notifications',
      icon: 'notifications',
      title: 'Thông báo của tôi',
      subtitle: 'Tin tức & Xác nhận lịch',
      color: 'from-sky-600 to-cyan-700',
      badge: unread > 0 ? `${unread} mới` : 'Đã đọc hết',
      badgeColor: unread > 0 ? 'bg-red-50 text-red-600 font-bold' : 'bg-slate-100 text-slate-600'
    },
    {
      href: '#/member/support',
      icon: 'support_agent',
      title: 'Hỗ trợ & Khiếu nại',
      subtitle: 'Gửi yêu cầu tới Lễ tân / BQL',
      color: 'from-emerald-600 to-teal-700',
      badge: '24/7',
      badgeColor: 'bg-emerald-50 text-emerald-700'
    }
  ];

  const greeting = getTimeGreeting();

  return (
    <div className="space-y-6 pb-12 font-lexend">
      {/* 1. Olympic Hero Masterpiece Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 text-white p-6 sm:p-8 border border-slate-800 shadow-xl overflow-hidden">
        {/* Glow accents */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0">
            {/* Avatar block with initial & verified dot */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 p-0.5 shadow-lg shadow-red-950/50">
                <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-white font-black text-2xl sm:text-3xl uppercase tracking-wider">
                  {currentUser?.fullName?.charAt(0) || 'M'}
                </div>
              </div>
              <span
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center shadow"
                title="Tài khoản đang trực tuyến"
              >
                <span className="material-symbols-outlined text-[12px] text-white font-bold">check</span>
              </span>
            </div>

            {/* Member Greeting and Identity Details */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-extrabold uppercase tracking-widest flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-amber-400">workspace_premium</span>
                  HỘI VIÊN CHÍNH THỨC • SCMS PRO
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${
                    membership.active
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border-red-500/30'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${membership.active ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                  {membership.label} {membership.active && `(Còn ${membership.daysLeft} ngày)`}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1.5 tracking-tight truncate">
                {greeting}, {currentUser?.fullName}!
              </h1>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-300 mt-2">
                <button
                  type="button"
                  onClick={handleCopyMemberCode}
                  className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700/80 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-200 transition font-mono group"
                  title="Bấm để sao chép mã"
                >
                  <span className="material-symbols-outlined text-[14px] text-red-400 group-hover:scale-110 transition">badge</span>
                  <span>Mã thẻ: <strong className="text-white">{currentUser?.memberCode || 'Chưa cấp'}</strong></span>
                  <span className="material-symbols-outlined text-[13px] text-slate-400">
                    {copiedCode ? 'done' : 'content_copy'}
                  </span>
                </button>

                <span className="flex items-center gap-1 text-slate-300">
                  <span className="material-symbols-outlined text-[14px] text-slate-400">call</span>
                  {currentUser?.phone || 'Chưa cập nhật SĐT'}
                </span>

                <span className="flex items-center gap-1 text-slate-300">
                  <span className="material-symbols-outlined text-[14px] text-amber-400">card_membership</span>
                  {currentUser?.packageName || 'Chưa có gói tập'}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px] text-amber-400">qr_code_scanner</span>
              <span>Mã Check-in</span>
            </button>

            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-md shadow-red-900/40 transition flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-[17px]">edit</span>
              <span>Hồ sơ cá nhân</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setReload(v => v + 1);
                refreshNotifications();
                showInfo('Đang làm mới dữ liệu...');
              }}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition active:rotate-180 duration-300"
              title="Tải lại dữ liệu"
            >
              <span className="material-symbols-outlined text-[18px]">sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error alert if any sub-request failed */}
      {Object.keys(displayErrors).length > 0 && (
        <div role="alert" className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1 shadow-sm">
          <p className="font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-red-600">error</span>
            Một số dữ liệu chưa tải được. Bấm "Tải lại" trên thanh điều hướng để thử lại.
          </p>
          {Object.entries(displayErrors).map(([key, message]) => (
            <p key={key} className="pl-6 text-slate-700">
              • {({ bookings: 'Lịch học', progress: 'Kết quả tập', plans: 'Giáo án', notifications: 'Thông báo' })[key] || key}: {message}
            </p>
          ))}
        </div>
      )}

      {/* Member Reminders Section */}
      <MemberReminders items={reminders} />

      {/* 2. Olympic Quick Actions Hub */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-500 px-1">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-red-600">dashboard_customize</span>
            Trung tâm tiện ích hội viên (Truy cập nhanh)
          </span>
          <span className="text-[11px] font-normal text-slate-400 lowercase">chạm để mở tính năng</span>
        </div>

        <section aria-label="Truy cập nhanh" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
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
              className="group relative p-3.5 bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-red-300 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between active:scale-[0.98]"
            >
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </div>

              <div className="mt-3">
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition flex items-center justify-between">
                  <span className="truncate">{item.title}</span>
                  <span className="material-symbols-outlined text-[14px] text-slate-400 group-hover:text-red-500 group-hover:translate-x-0.5 transition">
                    chevron_right
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.subtitle}</p>
              </div>
            </a>
          ))}
        </section>
      </div>

      {/* 3. 4 Bento KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Upcoming Classes */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-red-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Lịch tập sắp tới</span>
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">calendar_month</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {errors.bookings ? '—' : upcoming.length}
            </span>
            <span className="text-xs font-bold text-slate-500">buổi đã xác nhận</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="truncate">
              {upcoming.length > 0 ? `Ca gần nhất: ${upcoming[0].timeSlot}` : 'Chưa có buổi học mới'}
            </span>
            <a href="#/member/schedule" className="text-red-600 font-bold hover:underline shrink-0">
              Đặt lớp
            </a>
          </div>
        </div>

        {/* KPI 2: Membership Expiry Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Trạng thái gói tập</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              membership.active ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'
            }`}>
              <span className="material-symbols-outlined text-[22px]">credit_card</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-black tracking-tight ${membership.active ? 'text-emerald-600' : 'text-red-600'}`}>
              {membership.label}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="truncate">
              {membership.active ? `Hạn: ${formatMemberDate(currentUser?.packageExpiry)}` : 'Vui lòng gia hạn'}
            </span>
            <a href="#/member/packages" className="text-emerald-700 font-bold hover:underline shrink-0">
              Gia hạn
            </a>
          </div>
        </div>

        {/* KPI 3: Body Progress & InBody */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-purple-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tiến độ thể chất</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">vital_signs</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {errors.progress ? '—' : (latest ? `${latest.weight || '--'} kg` : 'Chờ đo')}
            </span>
            {latest?.bodyFat && <span className="text-xs font-bold text-purple-700">({latest.bodyFat}% mỡ)</span>}
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="truncate">
              {latest ? `Đo ngày: ${formatMemberDate(latest.date)}` : 'Chưa có dữ liệu InBody'}
            </span>
            <a href="#/member/progress" className="text-purple-700 font-bold hover:underline shrink-0">
              Chi tiết
            </a>
          </div>
        </div>

        {/* KPI 4: Unread Notifications */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Hộp thư & Thông báo</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">notifications</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {notificationError ? '—' : unread}
            </span>
            <span className="text-xs font-bold text-slate-500">tin nhắn chưa đọc</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="truncate">Cập nhật lịch & gói dịch vụ</span>
            <a href="#/member/notifications" className="text-amber-700 font-bold hover:underline shrink-0">
              Xem hết
            </a>
          </div>
        </div>
      </div>

      {/* 4. Main Content Grid: Olympic Digital Pass & Schedule Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 Cols): Luxury Olympic Digital Membership Pass & Biometric Card */}
        <div className="lg:col-span-5 space-y-6">
          {/* Olympic Digital Card */}
          <div className="bg-gradient-to-br from-slate-950 via-zinc-900 to-black text-white p-6 sm:p-7 rounded-3xl border border-amber-500/30 shadow-2xl relative overflow-hidden group">
            {/* Holographic accent shine */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-400/10 via-red-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

            {/* Card Top: Brand & Chip */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-sm shadow">
                  <span className="material-symbols-outlined text-[18px]">stadium</span>
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-widest text-amber-400 uppercase">SCMS APEX ARENA</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Olympic Member Pass</p>
                </div>
              </div>

              {/* EMV Chip & Contactless Wave */}
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-[20px]" title="NFC Contactless">
                  contactless
                </span>
                <div className="w-9 h-7 rounded bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-600 border border-amber-200/60 shadow flex items-center justify-center">
                  <div className="w-7 h-5 border border-amber-900/30 rounded grid grid-cols-2 gap-0.5 p-0.5">
                    <div className="bg-amber-500/40 rounded-sm" />
                    <div className="bg-amber-500/40 rounded-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card Middle: Member Name & Package Badge */}
            <div className="mt-8 relative z-10">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                Chủ thẻ / Athlete
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide mt-0.5 truncate uppercase">
                {currentUser?.fullName || 'HỘI VIÊN SCMS'}
              </h2>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-red-600/30 to-rose-600/30 border border-red-500/40 text-red-300 text-xs font-bold">
                <span className="material-symbols-outlined text-[14px] text-amber-400">military_tech</span>
                <span>{currentUser?.packageName || 'Gói chưa kích hoạt'}</span>
              </div>
            </div>

            {/* Card Bottom: Code & Expiry */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-end justify-between relative z-10 text-xs">
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-bold">Mã số thẻ</span>
                <button
                  type="button"
                  onClick={handleCopyMemberCode}
                  className="font-mono text-base font-black tracking-wider text-amber-400 hover:text-amber-300 flex items-center gap-1 mt-0.5 group/btn"
                >
                  <span>{currentUser?.memberCode || 'MEM-00000'}</span>
                  <span className="material-symbols-outlined text-[14px] opacity-70 group-hover/btn:opacity-100">
                    content_copy
                  </span>
                </button>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase text-slate-400 block font-bold">Hạn sử dụng</span>
                <span className="font-mono font-bold text-slate-200 mt-0.5 block">
                  {formatMemberDate(currentUser?.packageExpiry)}
                </span>
              </div>
            </div>

            {/* Quick QR Barcode Trigger button */}
            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              className="mt-5 w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition backdrop-blur-sm"
            >
              <span className="material-symbols-outlined text-[17px] text-amber-400">qr_code_2</span>
              <span>Chạm để mở mã QR Check-in qua cổng</span>
            </button>

            {/* Barcode & Mini Real QR Preview */}
            <div
              onClick={() => setQrModalOpen(true)}
              className="mt-3 bg-white p-2 rounded-xl cursor-pointer hover:ring-2 hover:ring-amber-400 transition flex items-center justify-between gap-2 overflow-hidden shadow-inner group/cardqr"
              title="Chạm để phóng to mã QR & mã vạch Check-in"
            >
              <div className="flex-1 flex items-center gap-1 overflow-hidden h-7">
                {[12, 4, 8, 16, 6, 10, 3, 14, 8, 18, 5, 9, 15, 6, 12, 4, 8, 10, 4, 16, 7, 11, 4, 14, 6].map((w, i) => (
                  <div key={i} className="h-full bg-slate-900" style={{ width: `${w * 1.5}px` }} />
                ))}
              </div>
              {qrDataUrl && (
                <div className="w-8 h-8 rounded border border-slate-200 p-0.5 bg-white shrink-0 shadow-sm group-hover/cardqr:scale-110 transition flex items-center justify-center">
                  <img src={qrDataUrl} alt="Mini QR" className="w-full h-full object-contain" />
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
              <a
                href="#/member/packages"
                className="flex-1 py-2.5 text-center bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                Gia hạn / Nâng cấp gói
              </a>
            </div>
          </div>

          {/* Biometrics & InBody Snapshot */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-purple-600">monitor_weight</span>
                Chỉ số InBody & Lời khuyên HLV
              </h2>
              {canProgress && (
                <a href="#/member/progress" className="text-xs font-bold text-red-600 hover:underline">
                  Xem lịch sử
                </a>
              )}
            </div>

            {latest ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Cân nặng</span>
                    <span className="text-lg font-black text-slate-900 block mt-0.5">
                      {formatMeasurement(latest.weight, 'kg')}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100">
                    <span className="text-[10px] uppercase font-bold text-purple-700 block">Tỷ lệ mỡ</span>
                    <span className="text-lg font-black text-purple-700 block mt-0.5">
                      {formatMeasurement(latest.bodyFat, '%')}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">Khối cơ</span>
                    <span className="text-lg font-black text-emerald-700 block mt-0.5">
                      {formatMeasurement(latest.muscleMass, 'kg')}
                    </span>
                  </div>
                </div>

                {/* Coach Feedback Note */}
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-amber-700">format_quote</span>
                      HLV: {latest.coachName || 'Huấn luyện viên phụ trách'}
                    </span>
                    <span className="text-[11px] text-amber-700 font-medium">
                      {formatMemberDate(latest.date)}
                    </span>
                  </div>
                  <p className="text-slate-800 italic leading-relaxed">
                    "{latest.coachFeedback || 'Buổi tập diễn ra hiệu quả. Duy trì nhịp tim và chế độ bù nước đúng cách.'}"
                  </p>
                  {latest.workoutResult && (
                    <div className="pt-2 border-t border-amber-200/60 text-[11px] text-amber-900">
                      <strong>Kết quả:</strong> {latest.workoutResult}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <span className="material-symbols-outlined text-4xl text-slate-300">fitness_center</span>
                <p className="text-xs font-bold text-slate-700">Chưa có kết quả đo InBody</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Hãy liên hệ HLV tại sàn tập để được đo chỉ số sinh trắc học và lập giáo án rèn luyện chuyên biệt.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 Cols): Upcoming Schedule & Notifications Feed */}
        <div className="lg:col-span-7 space-y-6">
          {/* Upcoming Schedule Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-600">schedule</span>
                  Lịch tập sắp tới
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                  {upcoming.length} buổi
                </span>
              </div>
              <a href="#/member/bookings" className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1">
                <span>Xem tất cả & Hủy lớp</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </a>
            </div>

            <p className="text-xs text-slate-500">Bạn sẽ nhận thông báo nhắc lịch trước giờ bắt đầu ca học 1 tiếng.</p>

            {errors.bookings ? (
              <div className="p-4 rounded-xl bg-red-50 text-xs text-red-700">
                Chưa thể tải dữ liệu lịch học. Vui lòng thử lại sau.
              </div>
            ) : upcoming.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 mx-auto flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">event_busy</span>
                </div>
                <h3 className="text-sm font-bold text-slate-800">Bạn chưa có lịch tập nào sắp tới</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Hãy chọn buổi học yêu thích từ thời khóa biểu chuẩn Olympic để rèn luyện ngay hôm nay.
                </p>
                <a
                  href="#/member/schedule"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow transition"
                >
                  <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
                  <span>Đăng ký ca tập ngay</span>
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.slice(0, 4).map(booking => {
                  const dateParts = parseDateParts(booking.bookingDate);
                  const sport = getSportMeta(booking.className, booking.coachSpecialization);

                  return (
                    <article
                      key={booking.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-red-300 hover:shadow-md transition-all duration-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                    >
                      {/* Left: Date Block & Class Info */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        {/* High-contrast Date Pod */}
                        <div className="w-14 h-16 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col items-center justify-center shrink-0 shadow-sm border border-slate-700">
                          <span className="text-[10px] font-bold text-red-400 uppercase leading-none">
                            {dateParts.weekday}
                          </span>
                          <span className="text-lg font-black leading-tight mt-0.5">
                            {dateParts.day}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium leading-none">
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
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                              {booking.timeSlot}
                            </span>
                          </div>

                          <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-red-600 transition truncate">
                            {booking.className}
                          </h3>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px] text-slate-400">stadium</span>
                              <span>{booking.roomName}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px] text-slate-400">sports</span>
                              <span>HLV: <strong className="text-slate-700">{booking.coachName}</strong></span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action: Cancel or Status */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {booking.sessionStatus === 'CANCELLED' ? 'Đã hủy' : BOOKING_LABELS[booking.status] || 'Đã xác nhận'}
                        </span>

                        {canCancel && isUpcomingBooking(booking) && (
                          <button
                            type="button"
                            onClick={() => {
                              setBookingToCancel(booking);
                              setCancelModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition"
                          >
                            Hủy ca học
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
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-red-600 text-[17px]">assignment</span>
                  Giáo án rèn luyện
                </h3>
                {canProgress && (
                  <a href="#/member/progress" className="text-[11px] font-bold text-red-600 hover:underline">
                    Xem hết
                  </a>
                )}
              </div>

              {errors.plans ? (
                <p className="text-xs text-red-600">Chưa tải được giáo án.</p>
              ) : data.plans.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  <span className="material-symbols-outlined text-2xl text-slate-300 block mb-1">fitness_center</span>
                  Chưa có giáo án từ HLV phụ trách.
                </div>
              ) : (
                data.plans.slice(0, 2).map(plan => (
                  <div key={plan.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-xs">
                    <h4 className="font-bold text-slate-900 truncate">{plan.title}</h4>
                    <p className="text-slate-600 line-clamp-1">Mục tiêu: {plan.goal || 'Tăng cường thể lực'}</p>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span>HLV: {plan.coachName || 'Chuyên viên'}</span>
                      <span>Từ {formatMemberDate(plan.startDate)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Latest Center Notifications */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-amber-600 text-[17px]">campaign</span>
                  Thông báo trung tâm
                </h3>
                <a href="#/member/notifications" className="text-[11px] font-bold text-red-600 hover:underline">
                  Xem tất cả
                </a>
              </div>

              {notificationError ? (
                <p className="text-xs text-red-600">Chưa tải được thông báo.</p>
              ) : notifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  <span className="material-symbols-outlined text-2xl text-slate-300 block mb-1">notifications_off</span>
                  Không có thông báo mới.
                </div>
              ) : (
                notifications.slice(0, 2).map(item => (
                  <a
                    key={item.id}
                    href="#/member/notifications"
                    className={`block p-3 rounded-xl border text-xs space-y-1 transition ${
                      item.isRead
                        ? 'bg-slate-50 border-slate-100 hover:border-slate-300'
                        : 'bg-red-50/60 border-red-200 hover:border-red-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 truncate">{item.title}</h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" title="Chưa đọc" />
                      )}
                    </div>
                    <p className="text-slate-600 line-clamp-1 text-[11px]">{item.content}</p>
                    <span className="text-[10px] text-slate-400 block pt-0.5">
                      {formatMemberDateTime(item.createdAt)}
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
        title="Mã Số Thẻ Check-in Điện Tử"
      >
        <div className="p-6 text-center space-y-5">
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-widest text-red-600">
              SCMS OLYMPIC SMART ACCESS
            </span>
            <h3 className="text-lg font-black text-slate-900">
              {currentUser?.fullName}
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Mã thẻ: <strong>{currentUser?.memberCode || 'MEM-00000'}</strong> · {currentUser?.packageName}
            </p>
          </div>

          {/* Real Scannable QR Code Container with target marks */}
          <div className="relative mx-auto w-64 h-64 p-3 bg-white rounded-3xl border-2 border-slate-900 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
            {/* Corner decorations */}
            <div className="absolute top-2.5 left-2.5 w-5 h-5 border-t-4 border-l-4 border-red-600 rounded-tl-lg pointer-events-none" />
            <div className="absolute top-2.5 right-2.5 w-5 h-5 border-t-4 border-r-4 border-red-600 rounded-tr-lg pointer-events-none" />
            <div className="absolute bottom-2.5 left-2.5 w-5 h-5 border-b-4 border-l-4 border-red-600 rounded-bl-lg pointer-events-none" />
            <div className="absolute bottom-2.5 right-2.5 w-5 h-5 border-b-4 border-r-4 border-red-600 rounded-br-lg pointer-events-none" />

            {/* Laser scanning sweep line */}
            <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_10px_rgba(239,68,68,0.9)] animate-pulse top-1/2 pointer-events-none z-10" />

            {/* Authentic Scannable QR Code Image */}
            {qrDataUrl ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={qrDataUrl}
                  alt={`Mã QR Check-in: ${memberCode}`}
                  className="w-56 h-56 object-contain rounded-2xl select-none"
                />
                {/* Center SCMS Badge */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-lg border-2 border-white tracking-wider">
                    SCMS
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-xs text-slate-400">
                <span className="material-symbols-outlined text-3xl animate-spin text-red-600 mb-2">progress_activity</span>
                <span>Đang tạo mã QR...</span>
              </div>
            )}
          </div>

          {/* Quick Actions Under QR */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyMemberCode}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <span className="material-symbols-outlined text-[15px]">content_copy</span>
              <span>{copiedCode ? 'Đã sao chép!' : 'Chép mã thẻ'}</span>
            </button>
            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`SCMS-QR-${memberCode}.png`}
                className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1.5 transition border border-red-200"
              >
                <span className="material-symbols-outlined text-[15px]">download</span>
                <span>Tải ảnh QR</span>
              </a>
            )}
          </div>

          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-amber-700">info</span>
              Hướng dẫn check-in tự động
            </p>
            <p className="text-[11px] text-slate-600">
              Đưa màn hình mã QR này vào trước camera máy quét tại cổng kiểm soát hoặc quầy lễ tân để ghi nhận lượt tập.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setQrModalOpen(false)}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
          >
            Đóng cửa sổ
          </button>
        </div>
      </Modal>

      {/* Cancel Booking Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Xác Nhận Hủy Ca Học"
      >
        {bookingToCancel && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-950 space-y-2">
              <span className="font-bold text-sm block text-red-900">
                Bạn có chắc chắn muốn hủy đặt chỗ cho buổi học này?
              </span>
              <div className="text-slate-800 space-y-1">
                <div>Lớp: <strong className="text-slate-900">{bookingToCancel.className}</strong></div>
                <div>Thời gian: <strong>{formatMemberDate(bookingToCancel.bookingDate)} ({bookingToCancel.timeSlot})</strong></div>
                <div>Địa điểm: <strong>{bookingToCancel.roomName}</strong></div>
              </div>
              <p className="pt-2 text-red-700 text-[11px] leading-relaxed border-t border-red-200">
                [ME-06] Quy định hủy: Hủy trước thời gian diễn ra tối thiểu 2 giờ sẽ được hoàn lại lượt tập. Hủy muộn hoặc không đến sẽ tính là đã tham gia ca học.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelling}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold"
              >
                Giữ lại buổi học
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelBooking}
                disabled={cancelling}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow"
              >
                {cancelling ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    <span>Xác nhận hủy chỗ</span>
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
