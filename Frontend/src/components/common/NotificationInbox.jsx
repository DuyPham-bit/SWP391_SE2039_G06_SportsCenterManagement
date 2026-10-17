import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useNotifications } from './useNotifications.js';
import { formatMemberDateTime } from '../../features/member/memberOverview.js';

export function NotificationInbox() {
  const [open, setOpen] = useState(false);
  const { role } = useAuth();
  const { items, loading, error, readingId, readingAll, refresh, markRead, markAllRead } = useNotifications();
  const unread = items.filter(item => !item.isRead).length;
  const toggle = () => { if (!open) refresh(); setOpen(value => !value); };
  return <div className="relative">
    <button type="button" onClick={toggle} aria-label="Thông báo" aria-expanded={open} className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors">
      <span className="material-symbols-outlined text-[22px]">notifications</span>
      {unread > 0 && <span aria-label={`${unread} thông báo chưa đọc`} className="absolute -top-1 -right-1 px-1.5 rounded-full bg-[#E07A5F] text-white text-[10px] font-bold shadow-xs">{unread > 99 ? '99+' : unread}</span>}
    </button>
    {open && <div className="fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:w-80 sm:mt-2 max-h-96 overflow-auto bg-[#232538] text-white border border-slate-700 rounded-2xl shadow-2xl p-4 space-y-3 z-50">
      <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-2.5">
        <h2 className="font-bold text-sm text-white">Thông báo của bạn</h2>
        <button type="button" onClick={markAllRead} disabled={!items.length || loading || readingAll || readingId !== null} className="min-h-11 text-xs font-bold text-[#F2CC8F] hover:text-[#E07A5F] disabled:opacity-50 transition-colors">{readingAll ? 'Đang lưu...' : 'Đọc tất cả'}</button>
      </div>
      {loading && <p role="status" className="text-xs text-slate-400">Đang tải...</p>}
      {error && <p role="alert" className="text-xs text-rose-400">{error}</p>}
      {!loading && !error && items.length === 0 && <p className="text-xs text-slate-400">Chưa có thông báo.</p>}
      {role === 'MEMBER' && <a href="#/member/notifications" onClick={() => setOpen(false)} className="block text-xs font-bold text-[#F2CC8F] hover:underline">Xem tất cả & Nhắc lịch / Hạn gói</a>}
      {items.slice(0, 10).map(item => <button key={item.id} type="button" disabled={readingId !== null || readingAll} onClick={() => markRead(item)} className={`block w-full text-left rounded-xl p-3 transition-colors ${item.isRead ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-[#81B29A]/15 hover:bg-[#81B29A]/25 text-white border border-[#81B29A]/30'}`}>
        <span className="block text-sm font-semibold text-white">{item.title}</span>
        <span className="block text-xs whitespace-pre-wrap break-words mt-0.5 text-slate-300">{item.content}</span>
        <span className="text-[10px] text-slate-400 mt-1 block">{formatMemberDateTime(item.createdAt)} · {item.isRead ? 'Đã đọc' : 'Chưa đọc'}</span>
      </button>)}
    </div>}
  </div>;
}
