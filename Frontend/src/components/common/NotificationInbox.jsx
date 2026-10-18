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

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label="Thông báo"
        aria-expanded={open}
        className="w-9 h-9 rounded-full bg-blue-50/80 hover:bg-blue-100/80 text-[#1A3B8B] flex items-center justify-center transition-colors relative border border-blue-100"
      >
        <span className="material-symbols-outlined text-[20px] text-[#1A3B8B]">notifications</span>
        {unread > 0 && (
          <span
            aria-label={`${unread} thông báo chưa đọc`}
            className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white"
          />
        )}
      </button>

      {open && (
        <div className="fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:w-88 sm:mt-2 max-h-96 overflow-auto bg-white text-slate-800 border border-slate-200 rounded-2xl shadow-xl p-4 space-y-3 z-50">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <h2 className="font-bold text-sm text-slate-900">Thông báo của bạn</h2>
            <button
              type="button"
              onClick={markAllRead}
              disabled={!items.length || loading || readingAll || readingId !== null}
              className="text-xs font-semibold text-[#1A3B8B] hover:text-[#142F70] disabled:opacity-50 transition-colors"
            >
              {readingAll ? 'Đang lưu...' : 'Đọc tất cả'}
            </button>
          </div>

          {loading && <p role="status" className="text-xs text-slate-400">Đang tải...</p>}
          {error && <p role="alert" className="text-xs text-rose-500">{error}</p>}
          {!loading && !error && items.length === 0 && <p className="text-xs text-slate-400">Chưa có thông báo mới.</p>}

          {role === 'MEMBER' && (
            <a
              href="#/member/notifications"
              onClick={() => setOpen(false)}
              className="block text-xs font-semibold text-[#1A3B8B] hover:underline"
            >
              Xem tất cả & Nhắc lịch / Hạn gói
            </a>
          )}

          <div className="space-y-1.5">
            {items.slice(0, 10).map(item => (
              <button
                key={item.id}
                type="button"
                disabled={readingId !== null || readingAll}
                onClick={() => markRead(item)}
                className={`block w-full text-left rounded-xl p-3 transition-colors ${
                  item.isRead
                    ? 'bg-slate-50 hover:bg-slate-100/80 text-slate-600 border border-slate-100'
                    : 'bg-[#EEF4FE] hover:bg-blue-100/60 text-slate-900 border border-blue-200/60 shadow-2xs'
                }`}
              >
                <span className="block text-xs font-bold text-slate-900">{item.title}</span>
                <span className="block text-xs whitespace-pre-wrap break-words mt-0.5 text-slate-600 leading-relaxed">
                  {item.content}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                  {formatMemberDateTime(item.createdAt)} · {item.isRead ? 'Đã đọc' : 'Chưa đọc'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
