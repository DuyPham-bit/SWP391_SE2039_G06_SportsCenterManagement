import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNotifications } from './useNotifications.js';
import { formatMemberDateTime } from '../../features/member/memberOverview.js';
import { translateNotificationTitle, translateNotificationContent } from '../../services/i18nHelper.js';
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
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const displayItems = backendItems;
  const unreadCount = displayItems.filter(item => !item.isRead).length;

  const toggle = () => {
    if (!open && refresh) refresh();
    setOpen(prev => !prev);
  };

  const handleMarkItemRead = item => {
    apiMarkRead(item);
    const target = notificationTarget(item, role);
    if (target) {
      setOpen(false);
      if (window.location.hash === target) {
        window.dispatchEvent(new HashChangeEvent('hashchange'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.location.hash = target;
      }
    }
  };

  const handleMarkAllRead = () => apiMarkAllRead();

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label={isEn ? "Notifications" : "Thông báo"}
        aria-expanded={open}
        className="w-9 h-9 rounded-full bg-[#81B29A]/15 hover:bg-[#81B29A]/25 text-[#2D6A4F] dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-[#81B29A] flex items-center justify-center transition-colors relative border border-[#81B29A]/20 dark:border-slate-700 shadow-2xs cursor-pointer"
        title={isEn ? "Notifications" : "Thông báo"}
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>
        {unreadCount > 0 && (
          <span
            aria-label={isEn ? `${unreadCount} unread notifications` : `${unreadCount} thông báo chưa đọc`}
            className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#E07A5F] ring-2 ring-white dark:ring-slate-900 animate-pulse"
          />
        )}
      </button>

      {open && (
        <div className="fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:w-96 sm:mt-2 max-h-[32rem] overflow-y-auto bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 space-y-3 z-50 animate-modal-entrance">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                {isEn ? 'Notifications' : 'Thông báo'}
              </h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#81B29A]/15 text-[#2D6A4F] dark:text-[#81B29A] text-[11px] font-bold">
                  {unreadCount} {isEn ? 'new' : 'mới'}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || loading || readingAll || readingId !== null}
              className="text-xs font-semibold text-[#2D6A4F] dark:text-[#81B29A] hover:text-[#E07A5F] hover:underline disabled:opacity-40 transition-opacity cursor-pointer"
            >
              {readingAll ? (isEn ? 'Saving...' : 'Đang lưu...') : (isEn ? 'Mark all as read' : 'Đọc tất cả')}
            </button>
          </div>

          {loading && <p role="status" className="text-xs text-slate-400 py-2">{isEn ? 'Loading notifications...' : 'Đang tải thông báo...'}</p>}
          {error && <p role="alert" className="text-xs text-rose-500 py-2">{error}</p>}

          <div className="space-y-2">
            {!loading && !error && displayItems.length === 0 && <p role="status" className="text-xs text-slate-500 py-4 text-center">{isEn ? 'No notifications.' : 'Chưa có thông báo.'}</p>}
            {displayItems.slice(0, 10).map(item => {
              const rawTitle = (isEn && item.titleEn) ? item.titleEn : (item.title || item.titleVi);
              const itemTitle = isEn ? translateNotificationTitle(rawTitle, true) : rawTitle;
              const rawContent = (isEn && item.contentEn) ? item.contentEn : (item.content || item.contentVi);
              const itemContent = isEn ? translateNotificationContent(rawContent, true) : rawContent;

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={readingId !== null || readingAll}
                  onClick={() => handleMarkItemRead(item)}
                  className={`block w-full text-left rounded-xl p-3 transition-all cursor-pointer ${
                    item.isRead
                      ? 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700/60'
                      : 'bg-[#81B29A]/10 hover:bg-[#81B29A]/20 dark:bg-[#81B29A]/15 dark:hover:bg-[#81B29A]/25 text-slate-900 dark:text-slate-100 border border-[#81B29A]/30 dark:border-[#81B29A]/30 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="block text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {itemTitle}
                    </span>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#81B29A] shrink-0 mt-1" />
                    )}
                  </div>
                  <span className="block text-xs whitespace-pre-wrap break-words mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">
                    {itemContent}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 block font-medium">
                    {formatMemberDateTime ? formatMemberDateTime(item.createdAt, isEn) : new Date(item.createdAt).toLocaleString(isEn ? 'en-US' : 'vi-VN')} · {item.isRead ? (isEn ? 'Read' : 'Đã đọc') : (isEn ? 'Unread' : 'Chưa đọc')}
                  </span>
                  {notificationTarget(item, role) && (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-[#2D6A4F] dark:text-[#81B29A] hover:underline">
                      {getNotificationActionLabel(item, role, isEn)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {role === 'MEMBER' && (
            <div className="pt-1 border-t border-slate-100 dark:border-slate-700">
              <a
                href="#/member/notifications"
                onClick={() => setOpen(false)}
                className="block text-center text-xs font-semibold text-[#2D6A4F] dark:text-[#81B29A] hover:text-[#E07A5F] hover:underline py-1"
              >
                {isEn ? 'View all notifications & reminders →' : 'Xem tất cả thông báo & Nhắc lịch →'}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
