import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../entities/session/index.js';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { useNotifications } from '../model/useNotifications.js';
import { formatMemberDateTime } from '../../../entities/member/index.js';
import { translateNotificationTitle, translateNotificationContent } from '../../../shared/i18n/i18nHelper.js';
import { notificationTarget, getNotificationActionLabel, parseNotificationDetails } from '../lib/notificationNavigation.js';

export function NotificationInbox() {
  const [open, setOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
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

  const handleMarkAsRead = async (itemOrId, e) => {
    e?.stopPropagation();
    await apiMarkRead(itemOrId);
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
        className="relative p-2.5 rounded-xl hover:bg-brand-navy-100 dark:hover:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-300 transition-colors cursor-pointer"
        title={isEn ? 'Notifications' : 'Thông báo'}
        aria-label={isEn ? 'Notifications' : 'Thông báo'}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">notifications</span>
        {unreadCount > 0 && (
          <span
            aria-label={isEn ? `${unreadCount} unread notifications` : `${unreadCount} thông báo chưa đọc`}
            className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-brand-danger-600 text-[10px] font-bold text-white shadow-xs animate-pulse"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-brand-navy-900 rounded-2xl shadow-xl border border-brand-navy-200/80 dark:border-brand-navy-800 z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-brand-navy-100 dark:border-brand-navy-800/80 flex items-center justify-between bg-brand-navy-50/50 dark:bg-brand-navy-800/40">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-navy-700 dark:text-brand-navy-200 text-[20px]">notifications</span>
              <h3 className="font-chivo font-black text-sm text-brand-navy-800 dark:text-brand-navy-100 uppercase tracking-wider">
                {isEn ? 'Notifications' : 'Thông báo'}
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-danger-100 text-brand-danger-600 dark:bg-brand-danger-950/40 dark:text-brand-danger-400">
                  {unreadCount} {isEn ? 'new' : 'mới'}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={readingAll}
                className="text-xs text-brand-danger-600 hover:text-brand-danger-700 dark:text-brand-danger-400 dark:hover:text-brand-danger-300 font-bold hover:underline cursor-pointer disabled:opacity-50"
              >
                {readingAll ? (isEn ? 'Marking...' : 'Đang xử lý...') : (isEn ? 'Mark all read' : 'Đọc tất cả')}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-brand-navy-100 dark:divide-brand-navy-800/60">
            {loading && items.length === 0 ? (
              <div className="p-8 text-center text-brand-navy-400 text-xs flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-brand-danger-600 border-t-transparent rounded-full animate-spin" />
                <span>{isEn ? 'Loading notifications...' : 'Đang tải thông báo...'}</span>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-xs text-brand-danger-600 dark:text-brand-danger-400">
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
              <div className="p-8 text-center text-brand-navy-400 dark:text-brand-navy-500 text-xs">
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
                    className={`w-full text-left p-3.5 hover:bg-brand-navy-50/80 dark:hover:bg-brand-navy-800/50 focus-visible:outline-none focus-visible:bg-brand-navy-100 dark:focus-visible:bg-brand-navy-800 transition-colors flex items-start gap-3 cursor-pointer ${
                      !item.isRead ? 'bg-brand-danger-50/20 dark:bg-brand-danger-950/10' : ''
                    }`}
                    onClick={() => {
                      if (!item.isRead) handleMarkAsRead(item);
                      if (target) {
                        setOpen(false);
                        const details = parseNotificationDetails(item);
                        window.dispatchEvent(new CustomEvent('scms:open-schedule-target', { detail: details }));
                        if (window.location.hash !== target) {
                          window.location.hash = target;
                        }
                      } else {
                        setSelectedNotification(item);
                      }
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        !item.isRead
                          ? 'bg-brand-danger-100 text-brand-danger-600 dark:bg-brand-danger-950/60 dark:text-brand-danger-400'
                          : 'bg-brand-navy-100 text-brand-navy-400 dark:bg-brand-navy-800 dark:text-brand-navy-500'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {item.type === 'ClassReminder' ? 'alarm' : item.type === 'Booking' ? 'calendar_today' : 'info'}
                      </span>
                    </span>
                    <span className="block flex-1 min-w-0">
                      <span className="flex items-start justify-between gap-2">
                        <span className={`block text-xs font-bold truncate ${!item.isRead ? 'text-brand-navy-900 dark:text-brand-navy-100' : 'text-brand-navy-600 dark:text-brand-navy-400'}`}>
                          {translateNotificationTitle(item.title, language)}
                        </span>
                        {!item.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-danger-600 shrink-0 mt-1" aria-label={isEn ? 'Unread' : 'Chưa đọc'} />
                        )}
                      </span>
                      <span className="block text-[11px] text-brand-navy-500 dark:text-brand-navy-400 mt-0.5 line-clamp-2">
                        {translateNotificationContent(item.content, language)}
                      </span>
                      <span className="flex items-center justify-between gap-2 mt-1.5">
                        <span className="text-[10px] text-brand-navy-400 dark:text-brand-navy-500 font-medium">
                          {formatMemberDateTime(item.createdAt)}
                        </span>
                        {target && (
                          <span className="text-[10px] font-bold text-brand-danger-600 dark:text-brand-danger-400 flex items-center gap-0.5">
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

      {/* Modal bung ra xem toàn bộ chi tiết thông báo nếu không có trang đích riêng */}
      {selectedNotification && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy-950/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedNotification(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-brand-navy-900 rounded-3xl p-6 shadow-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-brand-navy-100 dark:border-brand-navy-800">
              <h3 className="font-chivo font-black text-base text-brand-navy-900 dark:text-brand-navy-100">
                {isEn ? 'Notification Details' : 'Chi Tiết Thông Báo'}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-brand-navy-400 hover:text-brand-navy-700 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-800 transition-colors cursor-pointer"
                aria-label={isEn ? 'Close' : 'Đóng'}
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-brand-navy-50 dark:bg-brand-navy-800/60 border border-brand-navy-200/80 dark:border-brand-navy-700">
              <span className="w-10 h-10 rounded-full bg-brand-danger-100 text-brand-danger-600 dark:bg-brand-danger-950/60 dark:text-brand-danger-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">
                  {selectedNotification.type === 'ClassReminder' ? 'alarm' : selectedNotification.type === 'Booking' ? 'calendar_today' : 'info'}
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="font-chivo font-black text-sm text-brand-navy-900 dark:text-brand-navy-100 leading-snug">
                  {translateNotificationTitle(selectedNotification.title, language)}
                </h4>
                <time className="text-[11px] text-brand-navy-400 dark:text-brand-navy-500 font-mono block mt-0.5">
                  {formatMemberDateTime(selectedNotification.createdAt)}
                </time>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-brand-navy-950/40 border border-brand-navy-100 dark:border-brand-navy-800 text-sm text-brand-navy-800 dark:text-brand-navy-200 whitespace-pre-wrap leading-relaxed shadow-xs">
              {translateNotificationContent(selectedNotification.content, language)}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-brand-navy-100 dark:border-brand-navy-800">
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 text-xs font-bold text-brand-navy-700 dark:text-brand-navy-200 transition-colors cursor-pointer"
              >
                {isEn ? 'Close' : 'Đóng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationInbox;
