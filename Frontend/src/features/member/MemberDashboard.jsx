import React, { useEffect, useState } from 'react';
import { bookingApi, memberApi } from '../../services/api.js';
import { useNotifications } from '../../components/common/useNotifications.js';
import { useAuth } from '../../context/AuthContext.js';
import { StatCard } from '../../components/common/StatCard.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { ProfileModal } from '../auth/ProfileModal.js';
import { MemberReminders } from './MemberReminders.jsx';
import { formatMemberDate, formatMeasurement, getLatestProgress, getMembershipSummary, getUpcomingBookings, getMemberReminders } from './memberOverview.js';

export function MemberDashboard() {
  const { currentUser } = useAuth();
  const { items: notifications, error: notificationError, refresh: refreshNotifications } = useNotifications();
  const [data, setData] = useState({ bookings: [], progress: [], plans: [] });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const capabilities = currentUser?.capabilities || [];
  const canBook = capabilities.includes('book_class');
  const canProgress = capabilities.includes('view_my_progress');
  const canAskAI = capabilities.includes('ask_ai_assistant');

  useEffect(() => {
    let active = true;
    if (!currentUser) { setLoading(false); return; }
    setLoading(true);
    const sources = [
      ['bookings', canBook ? bookingApi.getMemberBookings() : Promise.resolve([])],
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
        if (result.status === 'rejected') nextErrors[key] = result.reason.message || 'Không thể tải dữ liệu.';
      });
      setData(nextData); setErrors(nextErrors); setLoading(false);
    });
    return () => { active = false; };
  }, [currentUser?.id, canBook, canProgress, reload]);

  if (loading) return <LoadingSpinner text="Đang tải dữ liệu hội viên..." />;

  const upcoming = getUpcomingBookings(data.bookings);
  const membership = getMembershipSummary(currentUser);
  const latest = getLatestProgress(data.progress);
  const unread = notifications.filter(item => !item.isRead).length;
  const displayErrors = { ...errors, ...(notificationError ? { notifications: notificationError } : {}) };
  const reminders = getMemberReminders(currentUser, data.bookings);
  const shortcuts = [
    { href: '#/member/packages', icon: 'card_membership', label: 'Gói tập & Gia hạn' },
    ...(canBook ? [
      { href: '#/member/schedule', icon: 'event_available', label: 'Xem & Đăng ký lớp' },
      { href: '#/member/bookings', icon: 'calendar_month', label: 'Lịch cá nhân & Hủy lớp' },
      { href: '#/member/attendance', icon: 'fact_check', label: 'Lịch sử điểm danh' }
    ] : []),
    ...(canProgress ? [{ href: '#/member/progress', icon: 'monitoring', label: 'Giáo án & Kết quả tập' }] : []),
    ...(canAskAI ? [{ href: '#/member/ai-assistant', icon: 'smart_toy', label: 'Hỏi đáp AI' }] : []),
    { href: '#/member/notifications', icon: 'notifications', label: 'Thông báo của tôi' }
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="font-chivo text-xs uppercase tracking-widest text-red-400 font-bold">HỘI VIÊN SCMS</span>
          <h1 className="font-chivo text-2xl font-black mt-1 break-words">Chào mừng, {currentUser?.fullName}!</h1>
          <p className="text-xs text-slate-300 mt-2 break-words">Mã thẻ: <strong>{currentUser?.memberCode || 'Chưa cấp mã'}</strong> · SĐT: {currentUser?.phone || 'Chưa cập nhật'}</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button type="button" onClick={() => setProfileOpen(true)} className="px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-bold">Cập nhật hồ sơ</button>
          <button type="button" onClick={() => { setReload(value => value + 1); refreshNotifications(); }} className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold">Tải lại</button>
        </div>
      </div>

      {Object.keys(displayErrors).length > 0 && <div role="alert" className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 space-y-1">
        <p className="font-bold">Một số dữ liệu chưa tải được. Bấm Tải lại để thử lại.</p>
        {Object.entries(displayErrors).map(([key, message]) => <p key={key}>{({ bookings: 'Lịch học', progress: 'Kết quả tập', plans: 'Giáo án', notifications: 'Thông báo' })[key]}: {message}</p>)}
      </div>}

      <MemberReminders items={reminders} />

      <section aria-label="Truy cập nhanh" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {shortcuts.map(item => <a key={item.href} href={item.href} className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 hover:border-red-400 hover:text-red-700">
          <span aria-hidden="true" className="material-symbols-outlined text-red-600 shrink-0">{item.icon}</span><span>{item.label}</span>
        </a>)}
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {canBook && <StatCard title="Lớp sắp tới" value={errors.bookings ? '—' : upcoming.length} subtitle="Buổi chưa bắt đầu, đã xác nhận" icon="calendar_month" color="red" />}
        <StatCard title="Trạng thái gói tập" value={membership.label} subtitle={membership.active ? `Hạn: ${formatMemberDate(currentUser?.packageExpiry)}` : 'Xem gói và gia hạn trực tuyến'} icon="credit_card" color="slate" />
        {canProgress && <StatCard title="Kết quả tập luyện" value={errors.progress ? '—' : data.progress.length} subtitle={latest ? `Cập nhật: ${formatMemberDate(latest.date)}` : 'Chưa có đánh giá từ HLV'} icon="monitoring" color="slate" />}
        <StatCard title="Thông báo chưa đọc" value={notificationError ? '—' : unread} subtitle="Tin nhắn và cập nhật từ trung tâm" icon="notifications" color="slate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <section className="bg-slate-900 text-white p-6 rounded-2xl space-y-4">
          <h2 className="font-chivo text-sm font-bold uppercase">Thẻ thành viên</h2>
          <p className="font-chivo text-xl font-black">{currentUser?.packageName || 'Chưa đăng ký gói tập'}</p>
          <dl className="grid grid-cols-2 gap-4 text-xs border-t border-white/10 pt-4">
            <div><dt className="text-slate-400">Ngày hết hạn</dt><dd className="font-bold mt-1">{formatMemberDate(currentUser?.packageExpiry)}</dd></div>
            <div><dt className="text-slate-400">Mã hội viên</dt><dd className="font-bold mt-1">{currentUser?.memberCode || 'Chưa cấp mã'}</dd></div>
          </dl>
          <a href="#/member/packages" className="block text-center p-3 bg-red-600 hover:bg-red-700 rounded-xl text-xs font-bold">Đăng ký / Gia hạn gói tập</a>
        </section>

        {canBook && <section className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-chivo text-sm font-bold">Lịch tập sắp tới</h2><a href="#/member/bookings" className="text-xs font-bold text-red-700 hover:underline">Xem tất cả & Hủy lớp</a></div>
          {errors.bookings ? <p className="text-sm text-red-700">Chưa tải được lịch học.</p> : upcoming.length === 0 ? <p className="text-sm text-slate-500">Bạn chưa có buổi học sắp tới. <a href="#/member/schedule" className="text-red-700 hover:underline">Đăng ký lớp học</a></p> : upcoming.slice(0, 4).map(booking => <article key={booking.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-xs">
            <h3 className="font-bold text-sm text-slate-900">{booking.className}</h3>
            <p className="font-bold text-red-700">{formatMemberDate(booking.bookingDate)} · {booking.timeSlot}</p>
            <p>Địa điểm: {booking.roomName}</p>
            <p>HLV: <strong>{booking.coachName}</strong>{booking.coachSpecialization && ` · ${booking.coachSpecialization}`}</p>
          </article>)}
        </section>}

        {canProgress && <section className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex flex-wrap justify-between gap-2"><h2 className="font-chivo text-sm font-bold">Giáo án & Nhận xét mới nhất</h2><a href="#/member/progress" className="text-xs font-bold text-red-700 hover:underline">Xem chi tiết</a></div>
          {errors.plans ? <p className="text-sm text-red-700">Chưa tải được giáo án.</p> : data.plans.length === 0 ? <p className="text-xs text-slate-500">HLV chưa gửi kế hoạch tập luyện.</p> : data.plans.slice(0, 2).map(plan => <div key={plan.id} className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
            <h3 className="font-bold text-sm">{plan.title}</h3><p>Mục tiêu: {plan.goal || 'Chưa ghi mục tiêu'}</p><p>HLV: {plan.coachName || 'Chưa có thông tin'}</p>
            <p>Từ {formatMemberDate(plan.startDate)}{plan.endDate && ` đến ${formatMemberDate(plan.endDate)}`}</p>
          </div>)}
          {errors.progress ? <p className="text-sm text-red-700">Chưa tải được kết quả tập.</p> : latest ? <div className="p-4 bg-blue-50 rounded-xl text-xs space-y-2">
            <p className="font-bold">Đánh giá ngày {formatMemberDate(latest.date)} · {latest.coachName}</p>
            <p>Cân nặng: {formatMeasurement(latest.weight, 'kg')} · Mỡ: {formatMeasurement(latest.bodyFat, '%')} · Cơ: {formatMeasurement(latest.muscleMass, 'kg')}</p>
            <p>Kết quả: {latest.workoutResult}</p><p>Nhận xét: {latest.coachFeedback || 'Chưa có nhận xét'}</p>
          </div> : <p className="text-xs text-slate-500">Chưa có kết quả tập luyện được ghi nhận.</p>}
        </section>}

        <section className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex flex-wrap justify-between gap-2"><h2 className="font-chivo text-sm font-bold">Thông báo mới nhất</h2><a href="#/member/notifications" className="text-xs font-bold text-red-700 hover:underline">Xem tất cả</a></div>
          {notificationError ? <p className="text-sm text-red-700">Chưa tải được thông báo.</p> : notifications.length === 0 ? <p className="text-xs text-slate-500">Chưa có thông báo từ trung tâm.</p> : notifications.slice(0, 3).map(item => <a key={item.id} href="#/member/notifications" className={`block p-3 rounded-lg space-y-1 ${item.isRead ? 'bg-slate-50' : 'bg-red-50'}`}>
            <h3 className="font-bold text-sm">{item.title}</h3><p className="text-xs text-slate-600 whitespace-pre-wrap break-words">{item.content}</p><p className="text-xs text-slate-500">{item.isRead ? 'Đã đọc' : 'Chưa đọc'}</p>
          </a>)}
        </section>
      </div>
      {profileOpen && <ProfileModal isOpen onClose={() => setProfileOpen(false)} />}
    </div>
  );
}
