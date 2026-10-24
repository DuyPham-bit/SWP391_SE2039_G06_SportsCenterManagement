import React, { useState, useEffect, useMemo } from 'react';
import { systemApi } from '../../services/api.js';
import { Table, LoadingSpinner } from '../../components/common/Table.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.js';
import { MotionButton } from '../../components/common/MotionButton.jsx';

function LogDetailModal({ log, isEn, onClose }) {
  if (!log) return null;
  const { date, time } = formatTimestamp(log.timestamp);
  const meta = getActionMeta(log.action, isEn);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-sm transition-all"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 text-left transition-all overflow-hidden animate-fade-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl ${meta.color}`}>
              <span className="material-symbols-outlined text-[22px]">{meta.icon}</span>
            </span>
            <div>
              <h3 className="font-chivo font-black text-base text-slate-900 dark:text-white">
                {meta.label}
              </h3>
              <p className="text-xs text-slate-400 font-mono uppercase tracking-wider mt-0.5">
                {log.action}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {isEn ? 'Recorded Timestamp' : 'Thời Điểm Ghi Nhận'}
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5 font-chivo">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">schedule</span>
              {time} - {date}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Múi giờ Asia/Ho_Chi_Minh (UTC+7)</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {isEn ? 'Actor / Executor' : 'Người Thực Hiện'}
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-blue-600">person</span>
              {log.userName || (isEn ? 'System automated' : 'Hệ thống tự động')}
            </div>
            {log.role && (
              <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                {log.role}
              </span>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {isEn ? 'Affected Object' : 'Đối Tượng Tác Động'}
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-purple-600">target</span>
              {log.entityType || (isEn ? 'System Resource' : 'Tài nguyên hệ thống')}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
              {log.entityId ? `#${log.entityId}` : 'N/A'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {isEn ? 'Security Status' : 'Trạng Thái Kiểm Toán'}
            </div>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              {isEn ? 'Immutable Ledger' : 'Đã Ghi Nhật Ký An Toàn'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">SCMS Audit Trail Protocol</div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <MotionButton
            onClick={onClose}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider transition-all"
          >
            {isEn ? 'Close' : 'Đóng'}
          </MotionButton>
        </div>
      </div>
    </div>
  );
}

function formatTimestamp(isoString) {
  if (!isoString) return { date: '—', time: '—' };
  try {
    const value = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(isoString) ? isoString : isoString + 'Z';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return { date: isoString, time: '' };
    const date = d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = d.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return { date, time };
  } catch {
    return { date: isoString, time: '' };
  }
}

const getActionMetaMap = isEn => ({
  'CLASS_COACH.ASSIGNED': { label: isEn ? 'Assign Coach' : 'Phân công HLV', color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', icon: 'assignment_ind' },
  'CLASS_COACH.UNASSIGNED': { label: isEn ? 'Unassign Coach' : 'Gỡ phân công HLV', color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', icon: 'person_remove' },
  'SPORT.CREATED': { label: isEn ? 'Create Sport' : 'Tạo bộ môn', color: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800', icon: 'sports' },
  'SPORT.UPDATED': { label: isEn ? 'Update Sport' : 'Cập nhật bộ môn', color: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800', icon: 'edit' },
  'MEMBER.CREATED': { label: isEn ? 'Member Registered' : 'Đăng Ký Hội Viên', color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', icon: 'person_add' },
  'MEMBER.ACCOUNT_STATUS.UPDATED': { label: isEn ? 'Member Status Change' : 'Đổi Trạng Thái Hội Viên', color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', icon: 'manage_accounts' },
  'STAFF.CREATED': { label: isEn ? 'Appoint Staff' : 'Bổ Nhiệm Nhân Sự', color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', icon: 'badge' },
  'STAFF.UPDATED': { label: isEn ? 'Update Staff' : 'Cập Nhật Nhân Sự', color: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700', icon: 'edit' },
  'MEMBERSHIP_PACKAGE.CREATED': { label: isEn ? 'Create Package' : 'Tạo Gói Tập', color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800', icon: 'card_membership' },
  'MEMBERSHIP_PACKAGE.UPDATED': { label: isEn ? 'Edit Package' : 'Sửa Gói Tập', color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800', icon: 'edit' },
  'MEMBERSHIP_PACKAGE.STATUS_UPDATED': { label: isEn ? 'Package Status Change' : 'Đổi Trạng Thái Gói', color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', icon: 'toggle_on' },
  'CLASS.CREATED': { label: isEn ? 'Create Class' : 'Tạo Lớp Học', color: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800', icon: 'fitness_center' },
  'CLASS.PUBLISHED': { label: isEn ? 'Publish Class' : 'Mở Đăng Ký Lớp', color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', icon: 'publish' },
  'CLASS.UPDATED': { label: isEn ? 'Update Class' : 'Cập Nhật Lớp', color: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800', icon: 'edit' },
  'CLASS.CANCELLED': { label: isEn ? 'Cancel Class' : 'Hủy Lớp Học', color: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800', icon: 'cancel' },
  'CLASS_SCHEDULE.CREATED': { label: isEn ? 'Add Schedule' : 'Thêm Lịch Hoạt Động', color: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800', icon: 'calendar_add_on' },
  'CLASS_SCHEDULE.UPDATED': { label: isEn ? 'Edit Schedule' : 'Sửa Lịch Hoạt Động', color: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800', icon: 'edit_calendar' },
  'CLASS_SCHEDULE.CANCELLED': { label: isEn ? 'Cancel Schedule' : 'Hủy Lịch Hoạt Động', color: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800', icon: 'event_busy' },
  'BOOK_SESSION': { label: isEn ? 'Book Session' : 'Đặt Chỗ Buổi Tập', color: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800', icon: 'bookmark_added' },
  'CANCEL_SESSION_BOOKING': { label: isEn ? 'Cancel Booking' : 'Hủy Đặt Chỗ', color: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800', icon: 'bookmark_remove' },
  'JOIN_SESSION_WAITLIST': { label: isEn ? 'Join Waitlist' : 'Vào Hàng Chờ Lớp', color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', icon: 'hourglass_empty' },
  'PAYMENT.CASH.RECORDED': { label: isEn ? 'Counter Cash Payment' : 'Thu Tiền Mặt Tại Quầy', color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', icon: 'payments' },
  'ROLE.PERMISSIONS.REPLACED': { label: isEn ? 'Role Permissions Updated' : 'Phân Quyền Vai Trò', color: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800', icon: 'security' },
  'SUPPORT.SUBMITTED': { label: isEn ? 'Support Request Submitted' : 'Gửi Yêu Cầu Hỗ Trợ', color: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800', icon: 'support_agent' },
  'SUPPORT.UPDATED': { label: isEn ? 'Support Request Updated' : 'Cập Nhật Yêu Cầu Hỗ Trợ', color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', icon: 'published_with_changes' },
  'SUPPORT.REPLIED': { label: isEn ? 'Support Reply Added' : 'Phản Hồi Yêu Cầu Hỗ Trợ', color: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800', icon: 'forum' },
  'CENTER_NOTIFICATION_SENT': { label: isEn ? 'Center Notification Sent' : 'Gửi Thông Báo Trung Tâm', color: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800', icon: 'campaign' },
});

function getActionMeta(actionCode = '', isEn = false) {
  const code = String(actionCode).toUpperCase();
  const metaMap = getActionMetaMap(isEn);
  if (metaMap[code]) return metaMap[code];
  for (const [key, meta] of Object.entries(metaMap)) {
    if (code.includes(key) || key.includes(code)) return meta;
  }
  return {
    label: actionCode.replace(/[._]/g, ' '),
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
    icon: 'history'
  };
}

export function AuditLogs() {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const { currentUser } = useAuth();

  const [logs, setLogs] = useState([]);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'timeline'
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  const centerId = currentUser?.centerId || Number(import.meta.env.VITE_SPORTS_CENTER_ID) || null;
  const isManager = currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN';

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    systemApi
      .getAuditPage(page)
      .then(data => {
        if (active) {
          setLogs(data.items);
          setTotalCount(data.totalCount);
        }
      })
      .catch(e => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, revision]);

  const filteredLogs =
    actionFilter === 'ALL'
      ? logs
      : logs.filter(l => (l.action || '').toUpperCase().includes(actionFilter));

  // Compute visual activity distribution from current logs
  const categoryStats = useMemo(() => {
    const list = [
      { id: 'MEMBER', label: isEn ? 'Members' : 'Hội Viên', color: '#10B981', bg: 'bg-emerald-500', match: 'MEMBER' },
      { id: 'PACKAGE', label: isEn ? 'Packages' : 'Gói Tập', color: '#8B5CF6', bg: 'bg-purple-500', match: 'PACKAGE' },
      { id: 'CLASS', label: isEn ? 'Classes' : 'Lớp Học', color: '#F97316', bg: 'bg-orange-500', match: 'CLASS' },
      { id: 'PAYMENT', label: isEn ? 'Payments' : 'Thanh Toán', color: '#059669', bg: 'bg-emerald-600', match: 'PAYMENT' },
      { id: 'ROLE', label: isEn ? 'Permissions' : 'Phân Quyền', color: '#6366F1', bg: 'bg-indigo-500', match: 'ROLE' },
      { id: 'STAFF', label: isEn ? 'Staff' : 'Nhân Sự', color: '#3B82F6', bg: 'bg-blue-500', match: 'STAFF' },
      { id: 'SPORT', label: isEn ? 'Sports' : 'Bộ Môn', color: '#14B8A6', bg: 'bg-teal-500', match: 'SPORT' },
      { id: 'SUPPORT', label: isEn ? 'Support' : 'Hỗ Trợ', color: '#06B6D4', bg: 'bg-cyan-500', match: 'SUPPORT' }
    ];

    const total = logs.length || 1;
    const computed = list.map(cat => {
      const count = logs.filter(l => (l.action || '').toUpperCase().includes(cat.match)).length;
      const pct = Math.max(1, Math.round((count / total) * 100));
      return { ...cat, count, pct };
    }).filter(c => c.count > 0);

    const knownCount = computed.reduce((acc, c) => acc + c.count, 0);
    const otherCount = Math.max(0, logs.length - knownCount);
    if (otherCount > 0) {
      computed.push({
        id: 'ALL',
        label: isEn ? 'Other' : 'Khác',
        color: '#64748B',
        bg: 'bg-slate-500',
        count: otherCount,
        pct: Math.max(1, Math.round((otherCount / total) * 100))
      });
    }
    return computed;
  }, [logs, isEn]);

  const columns = [
    {
      header: isEn ? 'Timestamp (Local)' : 'Thời Gian (Việt Nam)',
      render: row => {
        const { date, time } = formatTimestamp(row.timestamp);
        return (
          <div className="flex flex-col py-0.5">
            <span className="font-chivo text-xs text-slate-900 dark:text-white font-bold tracking-tight">{time}</span>
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[12px]">calendar_today</span>
              <span>{date}</span>
            </span>
          </div>
        );
      }
    },
    {
      header: isEn ? 'Actor / User' : 'Người Thực Hiện',
      render: row => {
        const isSystem = !row.userId;
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
              <span className="material-symbols-outlined text-[17px]">
                {isSystem ? 'dns' : 'person'}
              </span>
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                {row.userName}
              </div>
              {row.role && row.role !== '—' && (
                <span className="inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  {row.role}
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: isEn ? 'System Action' : 'Hành Động Hệ Thống',
      render: row => {
        const meta = getActionMeta(row.action, isEn);
        return (
          <div className="flex flex-col gap-1 py-0.5">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border shadow-2xs w-fit ${meta.color}`}>
              <span className="material-symbols-outlined text-[15px]">{meta.icon}</span>
              <span>{meta.label}</span>
            </span>
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wide">
              {row.action}
            </span>
          </div>
        );
      }
    },
    {
      header: isEn ? 'Affected Object' : 'Đối Tượng Tác Động',
      render: row => (
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-slate-400">target</span>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{row.entityType || (isEn ? 'System' : 'Hệ thống')}</div>
            <div className="text-[11px] text-slate-400">{row.entityId ? `${isEn ? 'ID' : 'Mã'} #${row.entityId}` : (isEn ? 'No object ID' : 'Không có mã đối tượng')}</div>
          </div>
        </div>
      )
    },
    {
      header: isEn ? 'Status' : 'Ghi nhận',
      render: () => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <span className="material-symbols-outlined text-[14px]">check_circle</span>
          <span>{isEn ? 'Logged' : 'Đã lưu'}</span>
        </span>
      )
    },
    {
      header: isEn ? 'Inspect' : 'Chi Tiết',
      render: row => (
        <MotionButton
          onClick={() => setSelectedLog(row)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#2F7B5D] hover:text-white text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
          title={isEn ? 'Inspect details' : 'Xem chi tiết sự kiện'}
        >
          <span className="material-symbols-outlined text-[16px]">visibility</span>
          <span className="hidden xl:inline">{isEn ? 'View' : 'Xem'}</span>
        </MotionButton>
      )
    }
  ];

  const filterTabs = [
    { id: 'ALL', label: isEn ? 'All' : 'Tất cả', icon: 'list_alt' },
    { id: 'MEMBER', label: isEn ? 'Members' : 'Hội viên', icon: 'person' },
    { id: 'STAFF', label: isEn ? 'Staff' : 'Nhân sự', icon: 'badge' },
    { id: 'PACKAGE', label: isEn ? 'Packages' : 'Gói tập', icon: 'card_membership' },
    { id: 'CLASS', label: isEn ? 'Classes' : 'Lớp học', icon: 'fitness_center' },
    { id: 'SPORT', label: isEn ? 'Sports' : 'Bộ môn', icon: 'sports' },
    { id: 'ROOM', label: isEn ? 'Rooms' : 'Phòng tập', icon: 'meeting_room' },
    { id: 'SESSION', label: isEn ? 'Bookings' : 'Đặt chỗ', icon: 'calendar_month' },
    { id: 'PAYMENT', label: isEn ? 'Payments' : 'Thanh toán', icon: 'payments' },
    { id: 'ROLE', label: isEn ? 'Permissions' : 'Phân quyền', icon: 'verified_user' },
    { id: 'SUPPORT', label: isEn ? 'Support' : 'Hỗ trợ', icon: 'support_agent' },
    { id: 'NOTIFICATION', label: isEn ? 'Notifications' : 'Thông báo', icon: 'campaign' }
  ];

  if (loading) return <LoadingSpinner text={isEn ? 'Loading system audit logs...' : 'Đang tải nhật ký kiểm toán hệ thống...'} />;

  return (
    <div className="space-y-6 pb-16 animate-fade-slide-up">
      {/* Modal chi tiết sự kiện */}
      {selectedLog && (
        <LogDetailModal
          log={selectedLog}
          isEn={isEn}
          onClose={() => setSelectedLog(null)}
        />
      )}

      {/* Top Banner / Header - Olympic Multi-stop Gradient */}
      <section
        className="relative overflow-hidden rounded-3xl text-white p-6 lg:p-8 shadow-xl shadow-[#24828F]/20 border border-white/30"
        style={{
          background: 'linear-gradient(108deg, #2F7B5D 0%, #24828F 25%, #3FAEB8 48%, #76B386 70%, #DEAC46 88%, #E5A33C 100%)'
        }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-[#F2CC8F]/50 via-[#E5A33C]/35 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-gradient-to-tr from-[#81B29A]/45 via-[#2F7B5D]/30 to-transparent blur-3xl" />

        {/* Subtle decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
          <circle cx="890" cy="110" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
        </svg>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider bg-white/20 text-white uppercase backdrop-blur-md border border-white/30 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                {isEn ? 'System Audit & Security Trail' : 'Nhật Ký Kiểm Toán & Bảo Mật Hệ Thống'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white border border-white/30">
                {centerId ? `${isEn ? 'Facility' : 'Cơ sở'} #${centerId}` : (isEn ? 'Enterprise-wide' : 'Toàn hệ thống')}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight font-chivo text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
              {isEn ? 'System Audit Trails (Audit Logs)' : 'Nhật Ký Kiểm Toán Hệ Thống (Audit Logs)'}
            </h1>
            <p className="text-sm text-white/95 mt-1 max-w-3xl leading-relaxed drop-shadow-xs">
              {isEn
                ? 'Trace all critical activities: membership registrations, staff appointments, class openings, payments, and permission changes.'
                : 'Theo dõi truy vết toàn bộ hoạt động đăng ký, đăng nhập, giao dịch, mở lớp, phân công và kiểm tra tại quầy.'}
            </p>
          </div>

          {/* Quick Metrics & Refresh */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="grid grid-cols-3 gap-3 bg-white/20 p-3 rounded-2xl border border-white/30 backdrop-blur-md shadow-xs">
              <div className="text-center px-3">
                <div className="text-xl font-black text-white">{totalCount || logs.length}</div>
                <div className="text-[10px] text-white/90 uppercase tracking-wider font-bold">
                  {isEn ? 'Logs' : 'Bản Ghi'}
                </div>
              </div>
              <div className="text-center px-3 border-l border-white/20">
                <div className="text-xl font-black text-white">{filteredLogs.length}</div>
                <div className="text-[10px] text-white/90 uppercase tracking-wider font-bold">
                  {isEn ? 'Showing' : 'Hiển Thị'}
                </div>
              </div>
              <div className="text-center px-3 border-l border-white/20">
                <div className="text-xl font-black text-white">{filterTabs.length - 1}</div>
                <div className="text-[10px] text-white/90 uppercase tracking-wider font-bold">
                  {isEn ? 'Modules' : 'Chức Năng'}
                </div>
              </div>
            </div>

            <MotionButton
              onClick={() => setRevision(x => x + 1)}
              whileHover={{ y: -1, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-2xl text-xs font-bold font-chivo uppercase tracking-wider transition-all border border-white/30 backdrop-blur-md shadow-xs cursor-pointer"
              title={isEn ? 'Refresh logs' : 'Làm mới dữ liệu'}
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              <span className="hidden sm:inline">{isEn ? 'Refresh' : 'Làm Mới'}</span>
            </MotionButton>
          </div>
        </div>

        {/* Master Navigation Tabs */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-white/20">
          {filterTabs.map(tab => {
            const isActive = actionFilter === tab.id;
            return (
              <MotionButton
                key={tab.id}
                onClick={() => setActionFilter(tab.id)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-white text-[#1B4332] shadow-lg shadow-black/15 font-black scale-102'
                    : 'bg-white/20 text-white hover:bg-white/30 border border-white/20 backdrop-blur-md'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === 'ALL' && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    isActive ? 'bg-[#1B4332]/10 text-[#1B4332]' : 'bg-white/25 text-white'
                  }`}>
                    {totalCount || logs.length}
                  </span>
                )}
              </MotionButton>
            );
          })}
        </div>
      </section>

      {/* Dải Thống Kê & Phân Bổ Hoạt Động Trực Quan (Interactive Distribution & View Switcher) */}
      <section className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#2F7B5D]">analytics</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-chivo">
              {isEn ? 'Activity Category Distribution' : 'Phân Bổ Tần Suất Nghiệp Vụ Trong Trang'}
            </span>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {logs.length} {isEn ? 'events' : 'sự kiện'}
            </span>
          </div>

          {/* View Mode Toggle: Table vs Visual Timeline */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit self-end sm:self-auto">
            <MotionButton
              onClick={() => setViewMode('table')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-[#2F7B5D] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">table_chart</span>
              <span>{isEn ? 'Table View' : 'Dạng Bảng'}</span>
            </MotionButton>
            <MotionButton
              onClick={() => setViewMode('timeline')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-slate-900 text-[#2F7B5D] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">timeline</span>
              <span>{isEn ? 'Timeline Stream' : 'Dòng Thời Gian'}</span>
            </MotionButton>
          </div>
        </div>

        {/* Multi-segmented Visual Progress Bar */}
        {categoryStats.length > 0 && (
          <div className="space-y-2.5">
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
              {categoryStats.map(stat => (
                <div
                  key={stat.id}
                  onClick={() => setActionFilter(stat.id)}
                  style={{ width: `${stat.pct}%`, backgroundColor: stat.color }}
                  className="h-full hover:brightness-110 cursor-pointer transition-all relative group"
                  title={`${stat.label}: ${stat.count} (${stat.pct}%)`}
                />
              ))}
            </div>

            {/* Interactive Category Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {categoryStats.map(stat => {
                const isSelected = actionFilter === stat.id;
                return (
                  <MotionButton
                    key={stat.id}
                    onClick={() => setActionFilter(stat.id)}
                    whileHover={{ y: -1, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'border-[#2F7B5D] bg-emerald-50 dark:bg-emerald-950/40 text-[#2F7B5D] shadow-xs font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stat.color }} />
                    <span>{stat.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({stat.count})</span>
                  </MotionButton>
                );
              })}
              {actionFilter !== 'ALL' && (
                <MotionButton
                  onClick={() => setActionFilter('ALL')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-xs text-[#2F7B5D] font-bold hover:underline flex items-center gap-1 ml-1"
                >
                  <span className="material-symbols-outlined text-[14px]">clear</span>
                  {isEn ? 'Reset filter' : 'Xóa bộ lọc'}
                </MotionButton>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Main Audit Display: Table or Timeline */}
      {error ? (
        <div role="alert" className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      ) : viewMode === 'timeline' ? (
        /* Visual Timeline Stream */
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isEn ? `Timeline stream (${filteredLogs.length} events)` : `Dòng sự kiện thời gian thực (${filteredLogs.length} ghi nhận)`}
            </div>
            <div className="text-xs text-slate-400">
              {isEn ? 'Click any card to inspect details' : 'Nhấp vào thẻ để soi chi tiết'}
            </div>
          </div>

          <div className="relative pl-6 sm:pl-8 border-l-2 border-[#2F7B5D]/30 space-y-6 ml-2 sm:ml-4">
            {filteredLogs.map((row, idx) => {
              const { date, time } = formatTimestamp(row.timestamp);
              const meta = getActionMeta(row.action, isEn);
              const isSystem = !row.userId;
              return (
                <div key={idx} className="relative group animate-fade-slide-up">
                  {/* Glowing connector node */}
                  <div className="absolute -left-[31px] sm:-left-[39px] top-3 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-[#2F7B5D] flex items-center justify-center ring-4 ring-[#2F7B5D]/15 group-hover:scale-110 group-hover:ring-[#2F7B5D]/35 transition-all">
                    <span className="w-2 h-2 rounded-full bg-[#2F7B5D]" />
                  </div>

                  {/* Visual Timeline Card */}
                  <div
                    onClick={() => setSelectedLog(row)}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-[#2F7B5D]/60 hover:shadow-lg transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold border ${meta.color}`}>
                          <span className="material-symbols-outlined text-[15px]">{meta.icon}</span>
                          <span>{meta.label}</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">
                          {row.action}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700 dark:text-slate-300">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                            <span className="material-symbols-outlined text-[13px]">{isSystem ? 'dns' : 'person'}</span>
                          </span>
                          {row.userName}
                        </span>
                        {row.role && row.role !== '—' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {row.role}
                          </span>
                        )}
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px] text-slate-400">target</span>
                          {row.entityType || 'System'} {row.entityId ? `#${row.entityId}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      <div className="text-right">
                        <div className="font-chivo text-xs font-bold text-slate-900 dark:text-white">{time}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 justify-end">
                          <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                          {date}
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-[#2F7B5D] group-hover:translate-x-1 transition-all text-[22px]">
                        chevron_right
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {!filteredLogs.length && (
              <div className="py-12 text-center text-slate-400 text-xs">
                {isEn ? 'No audit records match the current filter' : 'Không có nhật ký nào phù hợp với bộ lọc'}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Visual Table View */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover-lift transition-all">
          <Table
            key={`${page}:${actionFilter}:${revision}`}
            columns={columns}
            data={filteredLogs}
            searchKey="searchIndex"
            searchPlaceholder={isEn ? 'Filter rows in current page...' : 'Tìm trong trang hiện tại...'}
            emptyMessage={isEn ? 'No audit records match the current filter' : 'Không có nhật ký nào phù hợp với bộ lọc'}
            pageSize={50}
          />
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-wrap justify-between items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-600 dark:text-slate-400 shadow-xs">
        <MotionButton
          className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold uppercase tracking-wider disabled:opacity-40 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          disabled={page <= 1}
          onClick={() => setPage(p => p - 1)}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          {isEn ? 'Previous Page' : 'Trang trước'}
        </MotionButton>
        <span className="font-medium">
          {isEn ? 'Page' : 'Trang'} <strong>{page}</strong> / {Math.max(1, Math.ceil(totalCount / 50))} · {totalCount} {isEn ? 'audit logs' : 'thao tác'}
        </span>
        <MotionButton
          className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold uppercase tracking-wider disabled:opacity-40 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          disabled={page * 50 >= totalCount || Boolean(error)}
          onClick={() => setPage(p => p + 1)}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          {isEn ? 'Next Page' : 'Trang sau'}
        </MotionButton>
      </div>
    </div>
  );
}
