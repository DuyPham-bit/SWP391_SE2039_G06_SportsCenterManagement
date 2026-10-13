import { systemApi } from '../../services/api.js';
import { Table, LoadingSpinner } from '../../components/common/Table.js';

const { useState, useEffect } = React;

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

const ACTION_META = {
  'CLASS_COACH.ASSIGNED': { label: 'Phân công HLV', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: 'assignment_ind' },
  'CLASS_COACH.UNASSIGNED': { label: 'Gỡ phân công HLV', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'person_remove' },
  'SPORT.CREATED': { label: 'Tạo bộ môn', color: 'bg-teal-50 text-teal-700 border-teal-200', icon: 'sports' },
  'SPORT.UPDATED': { label: 'Cập nhật bộ môn', color: 'bg-teal-50 text-teal-700 border-teal-200', icon: 'edit' },
  'MEMBER.CREATED': { label: 'Đăng Ký Hội Viên', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'person_add' },
  'MEMBER.ACCOUNT_STATUS.UPDATED': { label: 'Đổi Trạng Thái Hội Viên', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'manage_accounts' },
  'STAFF.CREATED': { label: 'Bổ Nhiệm Nhân Sự', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: 'badge' },
  'STAFF.UPDATED': { label: 'Cập Nhật Nhân Sự', color: 'bg-slate-50 text-slate-700 border-slate-200', icon: 'edit' },
  'MEMBERSHIP_PACKAGE.CREATED': { label: 'Tạo Gói Tập', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: 'card_membership' },
  'MEMBERSHIP_PACKAGE.UPDATED': { label: 'Sửa Gói Tập', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: 'edit' },
  'MEMBERSHIP_PACKAGE.STATUS_UPDATED': { label: 'Đổi Trạng Thái Gói', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'toggle_on' },
  'CLASS.CREATED': { label: 'Tạo Lớp Học', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: 'fitness_center' },
  'CLASS.PUBLISHED': { label: 'Mở Đăng Ký Lớp', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'publish' },
  'CLASS.UPDATED': { label: 'Cập Nhật Lớp', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: 'edit' },
  'CLASS.CANCELLED': { label: 'Hủy Lớp Học', color: 'bg-red-50 text-red-700 border-red-200', icon: 'cancel' },
  'CLASS_SCHEDULE.CREATED': { label: 'Thêm Lịch Hoạt Động', color: 'bg-teal-50 text-teal-700 border-teal-200', icon: 'calendar_add_on' },
  'CLASS_SCHEDULE.UPDATED': { label: 'Sửa Lịch Hoạt Động', color: 'bg-teal-50 text-teal-700 border-teal-200', icon: 'edit_calendar' },
  'CLASS_SCHEDULE.CANCELLED': { label: 'Hủy Lịch Hoạt Động', color: 'bg-red-50 text-red-700 border-red-200', icon: 'event_busy' },
  'BOOK_SESSION': { label: 'Đặt Chỗ Buổi Tập', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: 'bookmark_added' },
  'CANCEL_SESSION_BOOKING': { label: 'Hủy Đặt Chỗ', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: 'bookmark_remove' },
  'JOIN_SESSION_WAITLIST': { label: 'Vào Hàng Chờ Lớp', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'hourglass_empty' },
  'PAYMENT.CASH.RECORDED': { label: 'Thu Tiền Mặt Tại Quầy', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'payments' },
  'ROLE.PERMISSIONS.REPLACED': { label: 'Phân Quyền Vai Trò', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: 'security' },
};

function getActionMeta(actionCode = '') {
  const code = String(actionCode).toUpperCase();
  if (ACTION_META[code]) return ACTION_META[code];
  for (const [key, meta] of Object.entries(ACTION_META)) {
    if (code.includes(key) || key.includes(code)) return meta;
  }
  return {
    label: actionCode.replace(/[._]/g, ' '),
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    icon: 'history'
  };
}

function renderAuditDetails(row) {
  const raw = row.newValues || row.oldValues || row.details;
  if (!raw) return <span className="text-slate-400 italic text-xs">Không có chi tiết</span>;

  let parsed = null;
  if (typeof raw === 'object') {
    parsed = raw;
  } else if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return <span className="text-xs text-slate-700 font-medium">{raw}</span>;
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return <span className="text-xs text-slate-700 font-medium">{String(raw)}</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-0.5">
      {parsed.MemberCode && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-red-50 text-red-700 border border-red-200">
          <span className="text-[10px] uppercase font-sans text-red-500 font-medium">Mã thẻ:</span>
          {parsed.MemberCode}
        </span>
      )}
      {parsed.UserId && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
          <span className="text-[10px] text-slate-400 font-medium">User:</span>
          #{parsed.UserId}
        </span>
      )}
      {parsed.RegistrationSource && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="text-slate-500">Kênh:</span>
          <span className="font-semibold">{parsed.RegistrationSource === 'self' ? 'Tự đăng ký Web' : parsed.RegistrationSource}</span>
        </span>
      )}
      {parsed.Email && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-slate-600 bg-slate-50 border border-slate-200">
          {parsed.Email}
        </span>
      )}
      {parsed.FullName && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-800 bg-slate-100 border border-slate-200">
          {parsed.FullName}
        </span>
      )}
      {parsed.RoleName && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200">
          Vai trò: {parsed.RoleName}
        </span>
      )}
      {parsed.PackageName && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200">
          Gói: {parsed.PackageName}
        </span>
      )}
      {parsed.ClassName && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-orange-700 bg-orange-50 border border-orange-200">
          Lớp: {parsed.ClassName}
        </span>
      )}
      {parsed.Amount && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
          {Number(parsed.Amount).toLocaleString('vi-VN')}đ
        </span>
      )}
      {parsed.Status && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200">
          Trạng thái: {parsed.Status}
        </span>
      )}
      {parsed.Reason && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-slate-600 bg-slate-50 border border-slate-200 italic">
          "{parsed.Reason}"
        </span>
      )}

      {/* Các trường còn lại nếu có */}
      {Object.entries(parsed)
        .filter(([k]) => !['MemberCode', 'UserId', 'RegistrationSource', 'Email', 'FullName', 'RoleName', 'PackageName', 'ClassName', 'Amount', 'Status', 'Reason', 'EmailPresent', 'PhonePresent'].includes(k))
        .map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-slate-600 bg-slate-50 border border-slate-200">
            <span className="text-slate-400">{k}:</span>
            <span className="font-medium">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
          </span>
        ))}
    </div>
  );
}

export function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true; setLoading(true); setError('');
    systemApi.getAuditPage(page).then(data => { if (active) { setLogs(data.items); setTotalCount(data.totalCount); } })
      .catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, revision]);

  const filteredLogs = actionFilter === 'ALL'
    ? logs
    : logs.filter(l => (l.action || '').toUpperCase().includes(actionFilter));

  const columns = [
    {
      header: 'Thời Gian (Việt Nam)',
      render: (row) => {
        const { date, time } = formatTimestamp(row.timestamp);
        return (
          <div className="flex flex-col py-0.5">
            <span className="font-chivo text-xs text-slate-900 font-bold tracking-tight">{time}</span>
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[12px]">calendar_today</span>
              <span>{date}</span>
            </span>
          </div>
        );
      }
    },
    {
      header: 'Người Thực Hiện',
      render: (row) => {
        const isSystem = !row.userId;
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
              <span className="material-symbols-outlined text-[17px]">
                {isSystem ? 'dns' : 'person'}
              </span>
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 leading-tight">
                {row.userName}
              </div>
              {row.role && row.role !== '—' && (
                <span className="inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase bg-slate-100 text-slate-600 border border-slate-200">
                  {row.role}
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Hành Động Hệ Thống',
      render: (row) => {
        const meta = getActionMeta(row.action);
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
      header: 'Chi Tiết Thao Tác',
      render: (row) => <div className="space-y-2">{renderAuditDetails(row)}<details><summary className="cursor-pointer text-xs text-red-600">Giá trị trước / sau</summary><pre className="text-xs whitespace-pre-wrap break-all mt-2">{`Trước: ${row.oldValues || '—'}\nSau: ${row.newValues || '—'}`}</pre></details></div>
    },
    {
      header: 'Ghi nhận',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="material-symbols-outlined text-[14px]">check_circle</span>
          <span>Đã lưu nhật ký</span>
        </span>
      )
    }
  ];

  const filterTabs = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'MEMBER', label: 'Hội viên' },
    { id: 'STAFF', label: 'Nhân sự' },
    { id: 'PACKAGE', label: 'Gói tập' },
    { id: 'CLASS', label: 'Lớp học' },
    { id: 'SPORT', label: 'Bộ môn' },
    { id: 'ROOM', label: 'Phòng tập' },
    { id: 'SESSION', label: 'Đặt chỗ' },
    { id: 'PAYMENT', label: 'Thanh toán' },
    { id: 'ROLE', label: 'Phân quyền' }
  ];

  if (loading) return <LoadingSpinner text="Đang tải nhật ký kiểm toán hệ thống..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
            VIEW AUDIT LOGS
          </span>
          <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
            Nhật Ký Kiểm Toán Hệ Thống (Audit Logs)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi truy vết toàn bộ hoạt động đăng ký, đăng nhập, giao dịch, mở lớp, phân công và kiểm tra tại quầy.
          </p>
        </div>

        <button
          onClick={() => setRevision(x => x + 1)}
          className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold font-chivo uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          <span>Làm Mới</span>
        </button>
      </div>

      {/* Action Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Lọc trong trang hiện tại:</span>
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActionFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo uppercase tracking-wider transition-all ${
              actionFilter === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Audit Log Table */}
      {error ? <p role="alert" className="text-red-700">{error}</p> : <Table
        key={`${page}:${actionFilter}:${revision}`}
        columns={columns}
        data={filteredLogs}
        searchKey="searchIndex"
        searchPlaceholder="Tìm trong trang hiện tại..."
        emptyMessage="Không có nhật ký nào phù hợp với bộ lọc"
        pageSize={50}
      />}
      <div className="flex flex-wrap items-center gap-3 text-sm"><button className="border rounded px-3 py-2 disabled:opacity-50" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trang trước</button><span>Trang {page} / {Math.max(1, Math.ceil(totalCount / 50))} · {totalCount} thao tác</span><button className="border rounded px-3 py-2 disabled:opacity-50" disabled={page * 50 >= totalCount || Boolean(error)} onClick={() => setPage(p => p + 1)}>Trang sau</button></div>
    </div>
  );
}
