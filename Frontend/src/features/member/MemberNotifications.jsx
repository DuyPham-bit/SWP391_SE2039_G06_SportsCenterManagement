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
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="font-chivo text-2xl font-black text-slate-900 dark:text-white">
            {isEn ? 'My Notifications' : 'Thông Báo Của Tôi'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isEn
              ? 'Classes, lesson plans, workout results, memberships and support updates. Refreshes every 15s.'
              : 'Lịch học, giáo án, kết quả tập, gói thành viên và phản hồi hỗ trợ. Thông báo tự làm mới mỗi 15 giây khi mở trang.'}
          </p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => { refresh(); setReload(value => value + 1); }}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 shadow-sm"
        >
          <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>sync</span>
          {isEn ? 'Refresh' : 'Tải lại'}
        </button>
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
