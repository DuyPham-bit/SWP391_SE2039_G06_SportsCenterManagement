import React, { useState, useEffect } from 'react';
import { systemApi } from '../../services/api.js';
import { Table, LoadingSpinner } from '../../components/common/Table.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

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

  const [logs, setLogs] = useState([]);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

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
    }
  ];

  const filterTabs = [
    { id: 'ALL', label: isEn ? 'All' : 'Tất cả' },
    { id: 'MEMBER', label: isEn ? 'Members' : 'Hội viên' },
    { id: 'STAFF', label: isEn ? 'Staff' : 'Nhân sự' },
    { id: 'PACKAGE', label: isEn ? 'Packages' : 'Gói tập' },
    { id: 'CLASS', label: isEn ? 'Classes' : 'Lớp học' },
    { id: 'SPORT', label: isEn ? 'Sports' : 'Bộ môn' },
    { id: 'ROOM', label: isEn ? 'Rooms' : 'Phòng tập' },
    { id: 'SESSION', label: isEn ? 'Bookings' : 'Đặt chỗ' },
    { id: 'PAYMENT', label: isEn ? 'Payments' : 'Thanh toán' },
    { id: 'ROLE', label: isEn ? 'Permissions' : 'Phân quyền' },
    { id: 'SUPPORT', label: isEn ? 'Support' : 'Hỗ trợ' },
    { id: 'NOTIFICATION', label: isEn ? 'Notifications' : 'Thông báo' }
  ];

  if (loading) return <LoadingSpinner text={isEn ? 'Loading system audit logs...' : 'Đang tải nhật ký kiểm toán hệ thống...'} />;

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Top Banner Header */}
      <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-[#1E2235] via-[#242A42] to-[#1E2235] text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-white/10 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#81B29A]/15 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-[#F2CC8F]/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-1">
          <span className="font-chivo text-xs uppercase tracking-widest text-[#F2CC8F] font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#81B29A] animate-pulse" />
            {isEn ? 'SYSTEM AUDIT & SECURITY TRAIL' : 'NHẬT KÝ KIỂM TOÁN & BẢO MẬT HỆ THỐNG'}
          </span>
          <h1 className="font-chivo text-2xl md:text-3xl font-black mt-1 text-white tracking-tight">
            {isEn ? 'System Audit Trails (Audit Logs)' : 'Nhật Ký Kiểm Toán Hệ Thống (Audit Logs)'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            {isEn
              ? 'Trace all critical activities: membership registrations, staff appointments, class openings, payments, and permission changes.'
              : 'Theo dõi truy vết toàn bộ hoạt động đăng ký, đăng nhập, giao dịch, mở lớp, phân công và kiểm tra tại quầy.'}
          </p>
        </div>

        <button
          onClick={() => setRevision(x => x + 1)}
          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all border border-white/15 hover-lift flex items-center gap-2 backdrop-blur-sm cursor-pointer relative z-10"
        >
          <span className="material-symbols-outlined text-[18px] text-[#F2CC8F]">refresh</span>
          <span>{isEn ? 'Refresh Logs' : 'Làm Mới'}</span>
        </button>
      </div>

      {/* Action Filters */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3">
          {isEn ? 'Filter in page:' : 'Lọc trong trang:'}
        </span>
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActionFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all hover-lift cursor-pointer ${
              actionFilter === tab.id
                ? 'bg-[#1E2235] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Audit Log Table */}
      {error ? (
        <div role="alert" className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      ) : (
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
        <button
          className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold uppercase tracking-wider disabled:opacity-40 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          disabled={page <= 1}
          onClick={() => setPage(p => p - 1)}
        >
          {isEn ? 'Previous Page' : 'Trang trước'}
        </button>
        <span className="font-medium">
          {isEn ? 'Page' : 'Trang'} <strong>{page}</strong> / {Math.max(1, Math.ceil(totalCount / 50))} · {totalCount} {isEn ? 'audit logs' : 'thao tác'}
        </span>
        <button
          className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold uppercase tracking-wider disabled:opacity-40 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          disabled={page * 50 >= totalCount || Boolean(error)}
          onClick={() => setPage(p => p + 1)}
        >
          {isEn ? 'Next Page' : 'Trang sau'}
        </button>
      </div>
    </div>
  );
}
