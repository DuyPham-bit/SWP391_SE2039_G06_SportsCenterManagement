import React, { useEffect, useState } from 'react';
import { bookingApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useNotifications } from '../../components/common/useNotifications.js';
import { MemberReminders } from './MemberReminders.jsx';
import { getMemberReminders } from './memberOverview.js';

import { NotificationList } from '../../components/common/NotificationList.jsx';

export function MemberNotifications() {
  const { currentUser } = useAuth();
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
      catch (err) { if (active) setBookingError(err.message || 'Không thể tải nhắc lịch học.'); }
    };
    load();
    const timer = window.setInterval(() => { if (!document.hidden) load(); }, 60000);
    return () => { active = false; window.clearInterval(timer); };
  }, [currentUser?.id, canBook, reload]);


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div><h1 className="font-chivo text-2xl font-black text-slate-900">Thông Báo Của Tôi</h1><p className="text-xs text-slate-500 mt-1">Lịch học, giáo án, kết quả tập, gói thành viên và phản hồi hỗ trợ. Thông báo tự làm mới mỗi 15 giây khi mở trang.</p></div>
        <button type="button" disabled={loading} onClick={() => { refresh(); setReload(value => value + 1); }} className="px-4 py-2 rounded-lg border text-xs font-bold disabled:opacity-50">Tải lại</button>
      </div>
      {bookingError && <p role="alert" className="p-4 bg-red-50 text-red-700 rounded-xl">Nhắc lịch học: {bookingError}</p>}
      <MemberReminders items={getMemberReminders(currentUser, bookings)} />
      <NotificationList notifications={notifications} title="Tin từ trung tâm & HLV" />
    </div>
  );
}
