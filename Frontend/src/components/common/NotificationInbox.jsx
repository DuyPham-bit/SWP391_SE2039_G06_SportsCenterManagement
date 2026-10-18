import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useNotifications } from './useNotifications.js';
import { formatMemberDateTime } from '../../features/member/memberOverview.js';

const SAMPLE_NOTIFICATIONS = [
  {
    id: 'sample-1',
    title: 'Lịch giảng dạy & Huấn luyện PT',
    content: 'Bạn có buổi huấn luyện lớp Yoga nâng cao vào lúc 07:00 ngày mai tại Sân đa năng B.',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    isRead: false
  },
  {
    id: 'sample-2',
    title: 'Bảng lương & KPI tháng 10/2026',
    content: 'Báo cáo KPI và tính lương chu kỳ tháng 10/2026 của bạn đã được Phòng Quản trị phê duyệt.',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    isRead: false
  },
  {
    id: 'sample-3',
    title: 'Hội viên đăng ký gia hạn',
    content: 'Hội viên SC-8829 vừa hoàn tất gia hạn Gói tập VIP 12 tháng tại Cơ sở TP. Hồ Chí Minh.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    isRead: true
  }
];

export function NotificationInbox() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const { role } = useAuth();
  const { items: backendItems, loading, error, readingId, readingAll, refresh, markRead: apiMarkRead, markAllRead: apiMarkAllRead } = useNotifications();
  
  // Local state to augment or fallback if backend items are empty
  const [localItems, setLocalItems] = useState(SAMPLE_NOTIFICATIONS);

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

  // Use backend items if available, otherwise local items
  const displayItems = (backendItems && backendItems.length > 0) ? backendItems : localItems;
  const unreadCount = displayItems.filter(item => !item.isRead).length;

  const toggle = () => {
    if (!open && refresh) refresh();
    setOpen(prev => !prev);
  };

  const handleMarkItemRead = (item) => {
    if (backendItems && backendItems.length > 0) {
      apiMarkRead(item);
    } else {
      setLocalItems(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
    }
  };

  const handleMarkAllRead = () => {
    if (backendItems && backendItems.length > 0) {
      apiMarkAllRead();
    } else {
      setLocalItems(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label="Thông báo"
        aria-expanded={open}
        className="w-9 h-9 rounded-full bg-blue-50/80 hover:bg-blue-100 text-[#1A3B8B] dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-blue-400 flex items-center justify-center transition-colors relative border border-blue-100 dark:border-slate-700 shadow-2xs cursor-pointer"
        title="Thông báo"
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>
        {unreadCount > 0 && (
          <span
            aria-label={`${unreadCount} thông báo chưa đọc`}
            className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900 animate-pulse"
          />
        )}
      </button>

      {open && (
        <div className="fixed left-4 right-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:w-96 sm:mt-2 max-h-[32rem] overflow-y-auto bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 space-y-3 z-50 animate-modal-entrance">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">Thông báo</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#1A3B8B] dark:text-blue-300 text-[11px] font-bold">
                  {unreadCount} mới
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || loading || readingAll || readingId !== null}
              className="text-xs font-semibold text-[#1A3B8B] dark:text-blue-400 hover:underline disabled:opacity-40 transition-opacity cursor-pointer"
            >
              {readingAll ? 'Đang lưu...' : 'Đọc tất cả'}
            </button>
          </div>

          {loading && <p role="status" className="text-xs text-slate-400 py-2">Đang tải thông báo...</p>}
          {error && <p role="alert" className="text-xs text-rose-500 py-2">{error}</p>}

          <div className="space-y-2">
            {displayItems.slice(0, 10).map(item => (
              <button
                key={item.id}
                type="button"
                disabled={readingId !== null || readingAll}
                onClick={() => handleMarkItemRead(item)}
                className={`block w-full text-left rounded-xl p-3 transition-all cursor-pointer ${
                  item.isRead
                    ? 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700/60'
                    : 'bg-[#EEF4FE] hover:bg-blue-100/70 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-slate-900 dark:text-slate-100 border border-blue-200/80 dark:border-blue-800/50 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="block text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {item.title}
                  </span>
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 mt-1" />
                  )}
                </div>
                <span className="block text-xs whitespace-pre-wrap break-words mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.content}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 block font-medium">
                  {formatMemberDateTime ? formatMemberDateTime(item.createdAt) : new Date(item.createdAt).toLocaleString('vi-VN')} · {item.isRead ? 'Đã đọc' : 'Chưa đọc'}
                </span>
              </button>
            ))}
          </div>

          {role === 'MEMBER' && (
            <div className="pt-1 border-t border-slate-100 dark:border-slate-700">
              <a
                href="#/member/notifications"
                onClick={() => setOpen(false)}
                className="block text-center text-xs font-semibold text-[#1A3B8B] dark:text-blue-400 hover:underline py-1"
              >
                Xem tất cả thông báo & Nhắc lịch →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
