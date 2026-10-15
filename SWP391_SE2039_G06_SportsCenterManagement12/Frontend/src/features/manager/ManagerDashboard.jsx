import React, { useEffect, useState } from 'react';
import { reportApi, systemApi } from '../../services/api.js';
import { StatCard } from '../../components/common/StatCard.js';
import { LoadingSpinner } from '../../components/common/Table.js';

const shortcuts = [
  ['members', 'group', 'Quản lý thành viên', 'Hồ sơ, trạng thái tài khoản và lịch sử gói.'],
  ['staff', 'badge', 'Huấn luyện viên & nhân viên', 'Bổ nhiệm, cập nhật thông tin và trạng thái nhân sự.'],
  ['classes-rooms', 'sports_score', 'Lớp, bộ môn, phòng & lịch', 'Tạo lớp, quản lý bộ môn, phòng tập và lịch học.'],
  ['coach-assignment', 'assignment_ind', 'Phân công HLV', 'Chọn HLV phụ trách và kiểm tra trùng lịch.'],
  ['reports', 'analytics', 'Báo cáo theo thời gian', 'Thành viên, đăng ký lớp và doanh thu.'],
  ['packages', 'card_membership', 'Gói tập & học phí', 'Thiết lập giá, thời hạn và trạng thái gói.'],
  ['roles-permissions', 'admin_panel_settings', 'Phân quyền truy cập', 'Quyền nghiệp vụ của từng vai trò trong trung tâm.'],
  ['audit-logs', 'history', 'Lịch sử thao tác', 'Tra cứu các thay đổi quan trọng trên hệ thống.'],
  ['home-content', 'dashboard_customize', 'Nội dung trang chủ & đa phương tiện', 'Tùy biến nội dung landing page, môn học, cụm sân bãi và hình ảnh đám mây.']
];

export function ManagerDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [logError, setLogError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError(''); setLogError('');
    Promise.allSettled([reportApi.getOverview(), systemApi.getAuditLogs()]).then(([overview, activity]) => {
      if (!active) return;
      if (overview.status === 'fulfilled') setMetrics(overview.value); else { setMetrics(null); setError(overview.reason.message); }
      if (activity.status === 'fulfilled') setLogs(activity.value.slice(0, 6)); else { setLogs([]); setLogError(activity.reason.message); }
      setLoading(false);
    });
    return () => { active = false; };
  }, [revision]);
  return <div className="space-y-6">
    <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-xs text-red-400 uppercase tracking-widest">Trung tâm điều hành SCMS</p><h1 className="text-2xl font-bold mt-1">Bảng quản lý tổng quan</h1><p className="text-sm text-slate-300 mt-2">Theo dõi thành viên, lớp học và hoạt động của trung tâm.</p></div>
      <button className="border border-slate-600 rounded-lg px-4 py-2 disabled:opacity-50" disabled={loading} onClick={() => setRevision(x => x + 1)}>Làm mới</button>
    </div>
    {loading ? <LoadingSpinner text="Đang tải tổng quan..." /> : error ? <p role="alert" className="p-4 rounded-lg bg-red-50 text-red-700">{error}</p> : metrics && <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Tổng thành viên" value={metrics.totalMembers} subtitle={`Có gói hiệu lực hôm nay: ${metrics.activeMembers}`} icon="group" color="red" />
      <StatCard title="Doanh thu tháng" value={`${Number(metrics.monthlyRevenue).toLocaleString('vi-VN')}đ`} subtitle="Doanh thu thuần từ đầu tháng" icon="payments" color="slate" />
      <StatCard title="Đăng ký lớp hiện tại" value={metrics.totalBookings} subtitle="Đang xác nhận hoặc chờ chỗ" icon="event_seat" color="slate" />
      <StatCard title="Check-in hôm nay" value={metrics.todayCheckins} subtitle="Theo ngày Việt Nam" icon="fact_check" color="red" />
    </div>}
    <div className="grid lg:grid-cols-3 gap-5">
      <section className="lg:col-span-2 bg-white border rounded-xl p-5 space-y-4"><h2 className="font-bold">Nghiệp vụ quản lý</h2><div className="grid sm:grid-cols-2 gap-3">{shortcuts.map(([path, icon, title, description]) => <a key={path} href={`#/manager/${path}`} className="flex gap-3 p-4 border rounded-xl hover:border-red-500 hover:bg-red-50"><span className="material-symbols-outlined text-red-600">{icon}</span><div><h3 className="text-sm font-bold">{title}</h3><p className="text-xs text-slate-500 mt-1">{description}</p></div></a>)}</div></section>
      <section className="bg-white border rounded-xl p-5 space-y-3"><h2 className="font-bold">Thao tác gần đây</h2>{logError ? <p role="alert" className="text-red-700 text-sm">{logError}</p> : !loading && !logs.length ? <p className="text-sm text-slate-500">Chưa có thao tác được ghi nhận.</p> : logs.map(log => <article key={log.id} className="p-3 bg-slate-50 rounded-lg text-xs break-words"><p className="font-semibold">{log.action}</p><p className="text-slate-500 mt-1">{log.userName} · {log.timestamp}</p></article>)}<a className="block text-sm text-red-600 font-semibold" href="#/manager/audit-logs">Xem toàn bộ lịch sử</a></section>
    </div>
  </div>;
}
