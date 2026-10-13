import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useNotifications } from './useNotifications.js';
import { formatMemberDateTime } from '../../features/member/memberOverview.js';

export function NotificationInbox() {
  const [open, setOpen] = useState(false);
  const { role } = useAuth();
  const { items, loading, error, readingId, refresh, markRead } = useNotifications();
  const unread = items.filter(item => !item.isRead).length;
  const toggle = () => { if (!open) refresh(); setOpen(value => !value); };
  return <div className="relative">
    <button type="button" onClick={toggle} aria-label="Thông báo" aria-expanded={open} className="relative p-2 rounded-lg hover:bg-slate-100">
      <span className="material-symbols-outlined">notifications</span>
      {unread > 0 && <span aria-label={`${unread} thông báo chưa đọc`} className="absolute -top-1 -right-1 px-1.5 rounded-full bg-red-600 text-white text-[10px] font-bold">{unread > 99 ? '99+' : unread}</span>}
    </button>
    {open && <div className="fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:w-80 sm:mt-2 max-h-96 overflow-auto bg-white border rounded-xl shadow-xl p-3 space-y-2 z-50">
      <h2 className="font-bold text-sm">Thông báo của bạn</h2>
      {loading && <p role="status" className="text-xs">Đang tải...</p>}
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
      {!loading && !error && items.length === 0 && <p className="text-xs text-slate-500">Chưa có thông báo.</p>}
      {role === 'MEMBER' && <a href="#/member/notifications" onClick={() => setOpen(false)} className="block text-xs font-bold text-red-700 hover:underline">Xem tất cả & Nhắc lịch / Hạn gói</a>}
      {items.slice(0, 10).map(item => <button key={item.id} type="button" disabled={readingId !== null} onClick={() => markRead(item)} className={`block w-full text-left rounded p-3 ${item.isRead ? 'bg-slate-50' : 'bg-red-50'}`}>
        <span className="block text-sm font-semibold">{item.title}</span>
        <span className="block text-xs whitespace-pre-wrap break-words">{item.content}</span>
        <span className="text-[10px] text-slate-500">{formatMemberDateTime(item.createdAt)} · {item.isRead ? 'Đã đọc' : 'Chưa đọc'}</span>
      </button>)}
    </div>}
  </div>;
}
