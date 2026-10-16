import React, { useState } from 'react';
import { formatMemberDateTime } from '../../features/member/memberOverview.js';

export function NotificationList({ notifications, title = 'Thông báo của tôi' }) {
  const { items, loading, error, readingId, readingAll, refresh, markRead, markAllRead } = notifications;
  const [unreadOnly, setUnreadOnly] = useState(false);
  const unread = items.filter(item => !item.isRead).length;
  const filtered = unreadOnly ? items.filter(item => !item.isRead) : items;
  const busy = readingAll || readingId !== null;
  return <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-bold text-sm">{title} ({unread} chưa đọc)</h2>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={unreadOnly} onChange={event => setUnreadOnly(event.target.checked)} />Chỉ xem chưa đọc</label>
        <button type="button" disabled={loading || busy || !items.length} onClick={markAllRead} className="min-h-11 px-3 rounded-lg border text-sm font-bold text-red-700 disabled:opacity-50">{readingAll ? 'Đang lưu...' : 'Đọc tất cả'}</button>
        <button type="button" disabled={loading || busy} onClick={refresh} className="min-h-11 px-3 rounded-lg border text-sm disabled:opacity-50">Tải lại</button>
      </div>
    </div>
    {loading && <p role="status" className="text-sm text-slate-500">Đang tải thông báo...</p>}
    {error && <p role="alert" className="p-3 bg-red-50 text-red-700 rounded-lg">{error}</p>}
    {!loading && !error && !filtered.length && <p className="py-6 text-center text-sm text-slate-500">{unreadOnly ? 'Bạn đã đọc hết thông báo.' : 'Chưa có thông báo.'}</p>}
    {filtered.map(item => <article key={item.id} className={`p-4 rounded-xl space-y-2 border ${item.isRead ? 'bg-slate-50 border-slate-100' : 'bg-red-50 border-red-100'}`}>
      <div className="flex flex-wrap justify-between gap-2"><h3 className="font-bold text-sm break-words">{item.title}</h3><span className="text-xs font-semibold text-slate-500">{item.isRead ? 'Đã đọc' : 'Chưa đọc'}</span></div>
      <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{item.content}</p>
      <div className="flex flex-wrap items-center justify-between gap-2"><time className="text-xs text-slate-500">{formatMemberDateTime(item.createdAt)}</time>
        {!item.isRead && <button type="button" disabled={busy} onClick={() => markRead(item)} className="min-h-11 text-sm font-bold text-red-700 hover:underline disabled:opacity-50">{readingId === item.id ? 'Đang lưu...' : 'Đánh dấu đã đọc'}</button>}
      </div>
    </article>)}
  </section>;
}
