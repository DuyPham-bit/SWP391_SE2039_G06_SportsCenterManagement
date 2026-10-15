import React, { useEffect, useState } from 'react';
import { bookingApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useNotifications } from '../../components/common/useNotifications.js';
import { MemberReminders } from './MemberReminders.jsx';
import { formatMemberDateTime, getMemberReminders } from './memberOverview.js';

export function MemberNotifications() {
  const { currentUser } = useAuth();
  const { items, loading, error, readingId, refresh, markRead } = useNotifications();
  const [bookings, setBookings] = useState([]);
  const [bookingError, setBookingError] = useState('');
  const [reload, setReload] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
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

  const filtered = unreadOnly ? items.filter(item => !item.isRead) : items;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div><h1 className="font-chivo text-2xl font-black text-slate-900">Thông Báo Của Tôi</h1><p className="text-xs text-slate-500 mt-1">Lịch học, giáo án, kết quả tập, gói thành viên và phản hồi hỗ trợ. Thông báo tự làm mới mỗi 15 giây khi mở trang.</p></div>
        <button type="button" disabled={loading} onClick={() => { refresh(); setReload(value => value + 1); }} className="px-4 py-2 rounded-lg border text-xs font-bold disabled:opacity-50">Tải lại</button>
      </div>
      {bookingError && <p role="alert" className="p-4 bg-red-50 text-red-700 rounded-xl">Nhắc lịch học: {bookingError}</p>}
      <MemberReminders items={getMemberReminders(currentUser, bookings)} />
      <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold text-sm">Tin từ trung tâm & HLV ({items.filter(item => !item.isRead).length} chưa đọc)</h2><label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={unreadOnly} onChange={event => setUnreadOnly(event.target.checked)} />Chỉ xem chưa đọc</label></div>
        {loading && <p role="status" className="text-sm text-slate-500">Đang tải thông báo...</p>}
        {error && <p role="alert" className="p-3 bg-red-50 text-red-700 rounded-lg">{error}</p>}
        {!loading && !error && filtered.length === 0 && <p className="py-6 text-center text-sm text-slate-500">{unreadOnly ? 'Bạn đã đọc hết thông báo.' : 'Chưa có thông báo từ trung tâm.'}</p>}
        {filtered.map(item => <article key={item.id} className={`p-4 rounded-xl space-y-2 border ${item.isRead ? 'bg-slate-50 border-slate-100' : 'bg-red-50 border-red-100'}`}>
          <div className="flex flex-wrap justify-between gap-2"><h3 className="font-bold text-sm break-words">{item.title}</h3><span className="text-xs font-semibold text-slate-500">{item.isRead ? 'Đã đọc' : 'Chưa đọc'}</span></div>
          <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{item.content}</p>
          <div className="flex flex-wrap items-center justify-between gap-2"><time className="text-xs text-slate-500">{formatMemberDateTime(item.createdAt)}</time>
            {!item.isRead && <button type="button" disabled={readingId !== null} onClick={() => markRead(item)} className="text-xs font-bold text-red-700 hover:underline disabled:opacity-50">{readingId === item.id ? 'Đang lưu...' : 'Đánh dấu đã đọc'}</button>}
          </div>
        </article>)}
      </section>
    </div>
  );
}
