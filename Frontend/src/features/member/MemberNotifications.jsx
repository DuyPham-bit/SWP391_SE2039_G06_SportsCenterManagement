import React, { useEffect, useState } from 'react';
import { bookingApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNotifications } from '../../components/common/useNotifications.js';
import { MemberReminders } from './MemberReminders.jsx';
import { getMemberReminders } from './memberOverview.js';
import { NotificationList } from '../../components/common/NotificationList.jsx';

export function MemberNotifications() {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const notifications = useNotifications();
  const { loading, refresh } = notifications;
  const [bookings, setBookings] = useState([]);
  const [bookingError, setBookingError] = useState('');
  const [reload, setReload] = useState(0);
  const canBook = currentUser?.capabilities?.includes('book_class');

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!canBook) { setBookings([]); return; }
      try { const data = await bookingApi.getMemberBookings(); if (active) { setBookings(data); setBookingError(''); } }
      catch (err) { if (active) setBookingError(err.message || (isEn ? 'Unable to load schedule reminders.' : 'Không thể tải nhắc lịch học.')); }
    };
    load();
    const timer = window.setInterval(() => { if (!document.hidden) load(); }, 60000);
    return () => { active = false; window.clearInterval(timer); };
  }, [currentUser?.id, canBook, reload, isEn]);

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* 1. Olympic Notifications Masterpiece Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#2F7B5D] via-[#24828F] via-[#3FAEB8] to-[#E5A33C] dark:from-[#184534] dark:via-[#144850] dark:via-[#1B5760] dark:to-[#5E4014] text-white p-6 sm:p-7 border border-white/30 dark:border-white/10 shadow-xl shadow-[#24828F]/20 overflow-hidden">
        {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-[#F2CC8F]/45 via-[#E5A33C]/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-[#81B29A]/40 via-[#2F7B5D]/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-[#A8DADC]/30 rounded-full blur-3xl pointer-events-none" />
        {/* Subtle decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
          <circle cx="890" cy="110" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
        </svg>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[#1B4332] dark:text-emerald-300 border border-white/80 dark:border-white/20 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <span className="material-symbols-outlined text-[13px] text-amber-500">campaign</span>
                OLYMPIC NOTIFICATIONS CENTER
              </span>
              <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-800 dark:text-slate-200 border border-white/80 dark:border-white/20 text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {notifications.length} {isEn ? 'messages' : 'thông báo'}
              </span>
            </div>

            <h1 className="font-chivo text-2xl lg:text-3xl font-black text-white tracking-tight mt-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
              {isEn ? 'My Notifications & Inbox' : 'Thông Báo Của Tôi & Hộp Thư'}
            </h1>
            <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-2xl font-medium leading-relaxed drop-shadow-xs">
              {isEn
                ? 'Classes, lesson plans, workout results, memberships and support updates. Refreshes automatically.'
                : 'Lịch học, giáo án, kết quả tập, gói thành viên và phản hồi hỗ trợ. Thông báo tự làm mới mỗi 15 giây khi mở trang.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              disabled={loading}
              onClick={() => { refresh(); setReload(value => value + 1); }}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-white/95 text-slate-900 border border-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md hover:shadow-lg active:scale-95 cursor-pointer backdrop-blur-md disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] text-[#24828F] ${loading ? 'animate-spin' : ''}`}>sync</span>
              <span>{isEn ? 'Sync Notifications' : 'Đồng bộ thông báo'}</span>
            </button>
          </div>
        </div>
      </div>
      {bookingError && (
        <p role="alert" className="p-4 bg-[#E07A5F]/10 border border-[#E07A5F]/30 text-[#E07A5F] rounded-xl text-xs font-semibold">
          {isEn ? 'Schedule Reminder:' : 'Nhắc lịch học:'} {bookingError}
        </p>
      )}
      <MemberReminders items={getMemberReminders(currentUser, bookings, new Date(), isEn)} />
      <NotificationList notifications={notifications} title={isEn ? 'Announcements from Center & Coaches' : 'Tin từ trung tâm & HLV'} />
    </div>
  );
}
