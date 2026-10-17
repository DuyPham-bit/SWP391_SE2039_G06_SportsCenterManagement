import React, { useState } from 'react';
import { formatMemberDateTime } from '../../features/member/memberOverview.js';

export function NotificationList({ notifications, title = 'Thông báo của tôi' }) {
  const { items = [], loading, error, readingId, readingAll, refresh, markRead, markAllRead } = notifications || {};
  const [unreadOnly, setUnreadOnly] = useState(false);
  const unread = items.filter(item => !item.isRead).length;
  const filtered = unreadOnly ? items.filter(item => !item.isRead) : items;
  const busy = readingAll || readingId !== null;

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
          </div>
          <h2 className="font-chivo font-black text-slate-900 text-base">
            {title}
          </h2>
          {unread > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 animate-pulse">
              {unread} chưa đọc
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              Đã đọc hết
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              unreadOnly
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {unreadOnly ? 'check_box' : 'check_box_outline_blank'}
            </span>
            <span>Chỉ xem chưa đọc</span>
          </button>

          {unread > 0 && (
            <button
              type="button"
              disabled={loading || busy || !items.length}
              onClick={markAllRead}
              className="px-3.5 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">done_all</span>
              <span>{readingAll ? 'Đang lưu...' : 'Đọc tất cả'}</span>
            </button>
          )}

          <button
            type="button"
            disabled={loading || busy}
            onClick={refresh}
            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
            title="Tải lại danh sách"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>
        </div>
      </div>

      {loading && (
        <div role="status" className="p-8 text-center space-y-2">
          <span className="material-symbols-outlined text-red-600 text-[28px] animate-spin">
            progress_activity
          </span>
          <p className="text-xs font-semibold text-slate-500">Đang tải thông báo...</p>
        </div>
      )}

      {error && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-red-500 text-[20px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && !filtered.length && (
        <div className="py-12 text-center space-y-2 max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[28px]">notifications_off</span>
          </div>
          <p className="text-sm font-bold text-slate-700">
            {unreadOnly ? 'Bạn đã đọc hết mọi thông báo.' : 'Hộp thư đến đang trống.'}
          </p>
          <p className="text-xs text-slate-400">
            {unreadOnly ? 'Tắt bộ lọc để xem lại các thông báo trước đó.' : 'Các thông báo mới từ trung tâm sẽ xuất hiện tại đây.'}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(item => (
          <article
            key={item.id}
            className={`p-4 rounded-xl space-y-2 border transition-all ${
              item.isRead
                ? 'bg-slate-50/60 border-slate-200/70'
                : 'bg-white border-red-200 shadow-xs ring-1 ring-red-500/10'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {!item.isRead && (
                  <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" title="Chưa đọc" />
                )}
                <h3 className="font-bold text-sm text-slate-900 break-words">
                  {item.title}
                </h3>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                item.isRead
                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {item.isRead ? 'Đã đọc' : 'Chưa đọc'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
              {item.content}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/5 text-xs text-slate-500">
              <time className="flex items-center gap-1 font-mono text-[11px]">
                <span className="material-symbols-outlined text-[13px]">schedule</span>
                {formatMemberDateTime(item.createdAt)}
              </time>
              {!item.isRead && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => markRead(item)}
                  className="font-bold text-red-600 hover:text-red-700 hover:underline disabled:opacity-50 cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">check</span>
                  <span>{readingId === item.id ? 'Đang lưu...' : 'Đánh dấu đã đọc'}</span>
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

