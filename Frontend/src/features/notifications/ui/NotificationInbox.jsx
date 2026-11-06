import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../app/providers/AuthContext.jsx';
import { useLanguage } from '../../../app/providers/LanguageContext.jsx';
import { useNotifications } from '../model/useNotifications.js';
import { formatMemberDateTime } from '../../member/memberOverview.js';
import { translateNotificationTitle, translateNotificationContent } from '../../../services/i18nHelper.js';
import { notificationTarget, getNotificationActionLabel } from './notificationNavigation.js';

export function NotificationInbox() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const { role } = useAuth();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const { items: backendItems, loading, error, readingId, readingAll, refresh, markRead: apiMarkRead, markAllRead: apiMarkAllRead } = useNotifications();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const items = backendItems;
  const unreadCount = items.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    await apiMarkRead(id);
  };

  const handleMarkAllRead = async () => {
    await apiMarkAllRead();
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) refresh();
        }}
        className="relative p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
        title={isEn ? 'Notifications' : 'Thông báo'}
        aria-label={isEn ? 'Notifications' : 'Thông báo'}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">notifications</span>
        {unreadCount > 0 && (
          <span
            aria-label={isEn ? `${unreadCount} unread notifications` : `${unreadCount} thông báo chưa đọc`}
            className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs animate-pulse"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-700 dark:text-slate-200 text-[20px]">notifications</span>
              <h3 className="font-chivo font-black text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                {isEn ? 'Notifications' : 'Thông báo'}
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                  {unreadCount} {isEn ? 'new' : 'mới'}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={readingAll}
                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold hover:underline cursor-pointer disabled:opacity-50"
              >
                {readingAll ? (isEn ? 'Marking...' : 'Đang xử lý...') : (isEn ? 'Mark all read' : 'Đọc tất cả')}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading && items.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                <span>{isEn ? 'Loading notifications...' : 'Đang tải thông báo...'}</span>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-xs text-red-600 dark:text-red-400">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={refresh}
                  className="mt-2 text-xs font-bold underline hover:no-underline cursor-pointer"
                >
                  {isEn ? 'Retry' : 'Thử lại'}
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                <span className="material-symbols-outlined text-[32px] block mb-2 opacity-50">notifications_off</span>
                {isEn ? 'No notifications' : 'Không có thông báo mới'}
              </div>
            ) : (
              items.map((item) => {
                const target = notificationTarget(item, role);
                const actionLabel = getNotificationActionLabel(item, role, isEn);
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`w-full text-left p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 focus-visible:outline-none focus-visible:bg-slate-100 dark:focus-visible:bg-slate-800 transition-colors flex items-start gap-3 cursor-pointer ${
                      !item.isRead ? 'bg-red-50/20 dark:bg-red-950/10' : ''
                    }`}
                    onClick={() => {
                      if (!item.isRead) handleMarkAsRead(item.id);
                      if (target) {
                        setOpen(false);
                        window.location.hash = target;
                      }
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        !item.isRead
                          ? 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {item.type === 'ClassReminder' ? 'alarm' : item.type === 'Booking' ? 'calendar_today' : 'info'}
                      </span>
                    </span>
                    <span className="block flex-1 min-w-0">
                      <span className="flex items-start justify-between gap-2">
                        <span className={`block text-xs font-bold truncate ${!item.isRead ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                          {translateNotificationTitle(item.title, language)}
                        </span>
                        {!item.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0 mt-1" aria-label={isEn ? 'Unread' : 'Chưa đọc'} />
                        )}
                      </span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {translateNotificationContent(item.content, language)}
                      </span>
                      <span className="flex items-center justify-between gap-2 mt-1.5">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          {formatMemberDateTime(item.createdAt)}
                        </span>
                        {target && (
                          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-0.5">
                            <span>{actionLabel}</span>
                            <span className="material-symbols-outlined text-[12px]" aria-hidden="true">arrow_forward</span>
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationInbox;
