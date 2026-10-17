import React, { useEffect, useState } from 'react';
import { reportApi, systemApi } from '../../services/api.js';
import { StatCard } from '../../components/common/StatCard.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import {
  formatDashboardTimestamp,
  getAuditPresentation,
  getManagerDashboardSummary
} from './managerDashboardView.js';

const operationGroups = [
  {
    title: 'Vận hành hằng ngày', description: 'Theo dõi con người, lớp học và lịch vận hành.', icon: 'monitoring', tone: 'red',
    items: [
      ['members', 'group', 'Thành viên', 'Hồ sơ, trạng thái và lịch sử gói'],
      ['staff', 'badge', 'Nhân sự', 'Huấn luyện viên và nhân viên'],
      ['classes-rooms', 'sports_score', 'Lớp & phòng', 'Bộ môn, phòng tập và lịch học'],
      ['coach-assignment', 'assignment_ind', 'Phân công HLV', 'Bố trí HLV và kiểm tra trùng lịch']
    ]
  },
  {
    title: 'Kinh doanh & báo cáo', description: 'Quản lý sản phẩm và theo dõi hiệu quả trung tâm.', icon: 'query_stats', tone: 'emerald',
    items: [
      ['reports', 'analytics', 'Báo cáo', 'Doanh thu, thành viên và lớp học'],
      ['packages', 'card_membership', 'Gói tập', 'Giá, thời hạn và trạng thái gói']
    ]
  },
  {
    title: 'Cấu hình hệ thống', description: 'Kiểm soát quyền, nội dung và khả năng truy vết.', icon: 'settings', tone: 'slate',
    items: [
      ['roles-permissions', 'admin_panel_settings', 'Phân quyền', 'Quyền nghiệp vụ theo vai trò'],
      ['audit-logs', 'history', 'Nhật ký', 'Tra cứu thay đổi quan trọng'],
      ['home-content', 'dashboard_customize', 'Trang chủ', 'Nội dung và hình ảnh hiển thị']
    ]
  }
];

const toneClasses = {
  red: 'bg-red-50 text-red-700 border-red-100', emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  slate: 'bg-slate-100 text-slate-700 border-slate-200', amber: 'bg-amber-50 text-amber-700 border-amber-100',
  blue: 'bg-blue-50 text-blue-700 border-blue-100', orange: 'bg-orange-50 text-orange-700 border-orange-100',
  purple: 'bg-purple-50 text-purple-700 border-purple-100'
};

function ProgressMetric({ label, value, hint, color = 'bg-red-600' }) {
  return <div className="space-y-2">
    <div className="flex items-end justify-between gap-3">
      <div><p className="text-xs font-bold text-slate-800">{label}</p><p className="text-[11px] text-slate-500 mt-0.5">{hint}</p></div>
      <strong className="font-chivo text-lg text-slate-900">{value}%</strong>
    </div>
    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-label={label} aria-valuemin="0" aria-valuemax="100" aria-valuenow={value}>
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
    </div>
  </div>;
}

export function ManagerDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [logError, setLogError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setLogError('');
    Promise.allSettled([reportApi.getOverview(), systemApi.getAuditLogs()]).then(([overview, activity]) => {
      if (!active) return;
      if (overview.status === 'fulfilled') setMetrics(overview.value);
      else { setMetrics(null); setError(overview.reason?.message || 'Không thể tải số liệu tổng quan.'); }
      if (activity.status === 'fulfilled') setLogs(activity.value.slice(0, 6));
      else { setLogs([]); setLogError(activity.reason?.message || 'Không thể tải hoạt động gần đây.'); }
      setLoading(false);
    });
    return () => { active = false; };
  }, [revision]);

  const summary = getManagerDashboardSummary(metrics || {});
  const refresh = () => setRevision(value => value + 1);

  return <div className="space-y-6" aria-busy={loading}>
    <header className="relative overflow-hidden p-6 md:p-8 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-lg border border-slate-800">
      <div className="absolute -right-16 -top-20 w-64 h-64 rounded-full bg-red-600/20 blur-3xl pointer-events-none" />
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="max-w-2xl">
          <p className="font-chivo text-xs text-red-400 uppercase tracking-[0.18em] font-bold">Trung tâm điều hành SCMS</p>
          <h1 className="font-chivo text-2xl md:text-3xl font-black mt-2 tracking-tight">Bảng quản lý tổng quan</h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">Nắm nhanh sức khỏe vận hành, theo dõi hoạt động mới nhất và đi thẳng đến nghiệp vụ cần xử lý.</p>
        </div>
        <button type="button" className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 transition" disabled={loading} onClick={refresh}>
          <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
          {loading ? 'Đang cập nhật' : 'Làm mới dữ liệu'}
        </button>
      </div>
    </header>

    {loading && !metrics ? <LoadingSpinner text="Đang tải số liệu điều hành..." /> : null}
    {error ? <div role="alert" className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2"><span className="material-symbols-outlined">error</span>{error}</span>
      <button type="button" onClick={refresh} className="font-bold underline underline-offset-2">Thử lại</button>
    </div> : null}

    {metrics ? <>
      <section aria-label="Chỉ số vận hành" className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Tổng thành viên" value={summary.totalMembers.toLocaleString('vi-VN')} subtitle={`${summary.activeMembers.toLocaleString('vi-VN')} đang có gói hiệu lực`} icon="group" color="red" />
        <StatCard title="Doanh thu tháng" value={`${summary.monthlyRevenue.toLocaleString('vi-VN')}đ`} subtitle="Doanh thu thuần từ đầu tháng" icon="payments" color="slate" />
        <StatCard title="Đăng ký lớp hiện tại" value={summary.totalBookings.toLocaleString('vi-VN')} subtitle="Đã xác nhận hoặc đang chờ chỗ" icon="event_seat" color="slate" />
        <StatCard title="Check-in hôm nay" value={summary.todayCheckins.toLocaleString('vi-VN')} subtitle="Ghi nhận theo giờ Việt Nam" icon="fact_check" color="red" />
      </section>

      <section aria-label="Nhịp vận hành" className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5"><span className="material-symbols-outlined text-red-600">monitor_heart</span><div><h2 className="font-chivo text-sm font-black text-slate-900 uppercase tracking-wide">Nhịp vận hành</h2><p className="text-xs text-slate-500">Hai tỷ lệ cần theo dõi thường xuyên</p></div></div>
          <div className="grid sm:grid-cols-2 gap-6">
            <ProgressMetric label="Thành viên có gói hiệu lực" value={summary.activeMemberRate} hint={`${summary.activeMembers}/${summary.totalMembers} thành viên`} />
            <ProgressMetric label="Mức lấp đầy lớp học" value={summary.occupancyRate} hint="Số chỗ đã đặt trên tổng sức chứa" color="bg-emerald-500" />
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-chivo text-sm font-black text-slate-900 uppercase tracking-wide">Điểm đáng chú ý</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3"><span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center material-symbols-outlined">person_add</span><div><p className="text-[11px] text-slate-500">Thành viên mới trong tháng</p><p className="font-bold text-slate-900">+{summary.newMembers.toLocaleString('vi-VN')} người</p></div></div>
            <div className="flex items-center gap-3"><span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center material-symbols-outlined">emoji_events</span><div className="min-w-0"><p className="text-[11px] text-slate-500">Lớp được quan tâm nhất</p><p className="font-bold text-slate-900 truncate" title={summary.popularClass}>{summary.popularClass}</p></div></div>
          </div>
        </div>
      </section>
    </> : null}

    <div className="grid xl:grid-cols-3 gap-5 items-start">
      <section className="xl:col-span-2 space-y-4" aria-labelledby="manager-operations-heading">
        <div><h2 id="manager-operations-heading" className="font-chivo text-lg font-black text-slate-900">Nghiệp vụ quản lý</h2><p className="text-xs text-slate-500 mt-1">Các chức năng được nhóm theo mục đích để dễ tìm và theo dõi.</p></div>
        <div className="space-y-4">{operationGroups.map(group => <article key={group.title} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-3 mb-4"><span className={`w-10 h-10 rounded-xl border flex items-center justify-center material-symbols-outlined shrink-0 ${toneClasses[group.tone]}`}>{group.icon}</span><div><h3 className="font-chivo text-sm font-black text-slate-900">{group.title}</h3><p className="text-xs text-slate-500 mt-0.5">{group.description}</p></div></div>
          <div className="grid sm:grid-cols-2 gap-2.5">{group.items.map(([path, icon, title, description]) => <a key={path} href={`#/manager/${path}`} className="group flex items-center gap-3 p-3.5 border border-slate-200 rounded-xl hover:border-red-300 hover:bg-red-50/50 hover:shadow-sm transition-all">
            <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-red-600 group-hover:text-white flex items-center justify-center material-symbols-outlined text-[20px] transition-colors">{icon}</span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-900 group-hover:text-red-700">{title}</span><span className="block text-[11px] text-slate-500 truncate">{description}</span></span>
            <span className="material-symbols-outlined text-[18px] text-slate-300 group-hover:text-red-500">arrow_forward</span>
          </a>)}</div>
        </article>)}</div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm xl:sticky xl:top-24" aria-labelledby="recent-activity-heading">
        <div className="flex items-start justify-between gap-3 mb-4"><div><h2 id="recent-activity-heading" className="font-chivo text-sm font-black text-slate-900 uppercase tracking-wide">Hoạt động gần đây</h2><p className="text-[11px] text-slate-500 mt-1">6 thay đổi mới nhất trong trung tâm</p></div><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 pulse-live" aria-label="Đang theo dõi" /></div>
        {loading && !logs.length ? <p className="text-sm text-slate-500 py-6 text-center">Đang tải hoạt động...</p> : null}
        {logError ? <div role="alert" className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs"><p>{logError}</p><button type="button" onClick={refresh} className="font-bold mt-2 underline">Thử lại</button></div> : null}
        {!loading && !logError && !logs.length ? <div className="py-8 text-center"><span className="material-symbols-outlined text-3xl text-slate-300">history</span><p className="text-sm font-semibold text-slate-700 mt-2">Chưa có thao tác được ghi nhận</p><p className="text-xs text-slate-400 mt-1">Hoạt động mới sẽ xuất hiện tại đây.</p></div> : null}
        {!logError && logs.length ? <div className="relative space-y-1 before:absolute before:left-[17px] before:top-4 before:bottom-4 before:w-px before:bg-slate-200">{logs.map((log, index) => {
          const presentation = getAuditPresentation(log.action);
          return <article key={log.id ?? `${log.action}-${index}`} className="relative flex gap-3 py-2.5">
            <span className={`relative z-10 w-9 h-9 rounded-full border flex items-center justify-center material-symbols-outlined text-[18px] shrink-0 ${toneClasses[presentation.tone] || toneClasses.slate}`}>{presentation.icon}</span>
            <div className="min-w-0 pt-0.5"><p className="text-xs font-bold text-slate-900 leading-snug">{presentation.label}</p><p className="text-[11px] text-slate-500 mt-1 truncate" title={log.userName}>{log.userName || 'Hệ thống'}</p><time className="text-[10px] text-slate-400" dateTime={log.timestamp}>{formatDashboardTimestamp(log.timestamp)}</time></div>
          </article>;
        })}</div> : null}
        <a className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-bold transition" href="#/manager/audit-logs">Xem toàn bộ nhật ký<span className="material-symbols-outlined text-[16px]">arrow_forward</span></a>
      </section>
    </div>
  </div>;
}
