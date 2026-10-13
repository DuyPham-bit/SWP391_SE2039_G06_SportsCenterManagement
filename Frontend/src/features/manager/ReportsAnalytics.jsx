import React, { useEffect, useState } from 'react';
import { reportApi } from '../../services/api.js';
import { createReportCsv } from '../../services/reportExport.js';
import { StatCard } from '../../components/common/StatCard.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { useToast } from '../../context/ToastContext.js';

const field = 'border rounded-lg p-2 text-sm';
const button = 'px-3 py-2 rounded-lg bg-slate-900 text-white text-sm disabled:opacity-50';
const statusName = status => ({ Confirmed: 'Đã xác nhận', Cancelled: 'Đã hủy', Waiting: 'Đang chờ', Promoted: 'Đã chuyển vào lớp' })[status] || status;

export function ReportsAnalytics() {
  const { showError } = useToast();
  const [period, setPeriod] = useState('MONTH');
  const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
  const [range, setRange] = useState({ from: `${today.slice(0, 7)}-01`, to: today, groupBy: 'day' });
  const [selection, setSelection] = useState('MONTH');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError(''); setMetrics(null);
    reportApi.getOverview(selection).then(data => { if (active) setMetrics(data); })
      .catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selection, revision]);
  const exportReport = () => {
    try {
      const url = URL.createObjectURL(new Blob([createReportCsv(metrics, period)], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a'); link.href = url; link.download = `SCMS-report-${period}.csv`;
      document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { showError(e.message); }
  };
  const revenue = metrics?.revenuePeriods || [], membership = metrics?.membershipPeriods || [], events = metrics?.classPeriods || [];
  const maxRevenue = Math.max(1, ...revenue.map(r => Number(r.net)));
  return <div className="space-y-5">
    <div className="flex flex-wrap justify-between items-center gap-3"><div><h1 className="text-2xl font-bold">Báo cáo & thống kê hoạt động</h1><p className="text-sm text-slate-500">Doanh thu, hội viên mới và tình trạng đăng ký lớp theo thời gian.</p></div><button className={button} disabled={loading || !metrics} onClick={exportReport}>Xuất Báo Cáo</button></div>
    <div className="flex flex-wrap gap-2">{[['MONTH','Tháng này'],['QUARTER','Quý này'],['YEAR','Năm nay']].map(([id,label]) => <button key={id} className={`${button} ${period === id ? 'ring-2 ring-red-500' : ''}`} onClick={() => { setPeriod(id); setSelection(id); }}>{label}</button>)}</div>
    <form className="flex flex-wrap gap-3 items-end bg-white border rounded-xl p-4" onSubmit={e => { e.preventDefault(); setPeriod('CUSTOM'); setSelection({ ...range }); }}>
      <label className="flex flex-col gap-1 text-sm">Từ ngày<input className={field} type="date" name="from" required value={range.from} onChange={e => setRange(r => ({ ...r, from: e.target.value }))} /></label>
      <label className="flex flex-col gap-1 text-sm">Đến ngày<input className={field} type="date" name="to" required min={range.from} value={range.to} onChange={e => setRange(r => ({ ...r, to: e.target.value }))} /></label>
      <label className="flex flex-col gap-1 text-sm">Nhóm theo<select className={field} name="groupBy" value={range.groupBy} onChange={e => setRange(r => ({ ...r, groupBy: e.target.value }))}><option value="day">Ngày</option><option value="month">Tháng</option></select></label>
      <button className={button}>Áp dụng khoảng ngày</button>
    </form>
    {loading ? <LoadingSpinner text="Đang tải báo cáo..." /> : error ? <div role="alert" className="bg-red-50 p-4 rounded-lg"><p>{error}</p><button className={button} onClick={() => setRevision(x => x + 1)}>Thử lại</button></div> : metrics && <>
      <p className="text-sm font-semibold">Kỳ báo cáo: {metrics.from} – {metrics.to} · {metrics.groupBy === 'month' ? 'Theo tháng' : 'Theo ngày'}</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Doanh thu thuần" value={`${Number(metrics.monthlyRevenue).toLocaleString('vi-VN')}đ`} subtitle="Trong kỳ đã chọn" icon="payments" color="red" />
        <StatCard title="Tổng thành viên" value={metrics.totalMembers} subtitle={`Gói hiệu lực hôm nay: ${metrics.activeMembers}`} icon="group" color="slate" />
        <StatCard title="Thành viên mới" value={metrics.newMembers} subtitle="Đăng ký tài khoản trong kỳ" icon="person_add" color="slate" />
        <StatCard title="Check-in hôm nay" value={metrics.todayCheckins} subtitle="Theo ngày Việt Nam" icon="fact_check" color="red" />
      </div>
      <section className="bg-white border rounded-xl p-5 space-y-3"><h2 className="font-bold">Tình trạng đăng ký lớp hiện tại</h2><div className="flex flex-wrap gap-3">{Object.entries(metrics.classStatusCounts).map(([status,count]) => <p key={status} className="border rounded-lg p-3 text-sm">{statusName(status)}: <strong>{count}</strong></p>)}{!Object.keys(metrics.classStatusCounts).length && <p>Chưa có đăng ký lớp.</p>}</div><p className="text-xs text-slate-500">Tổng thành viên, gói hiệu lực và trạng thái đăng ký phản ánh hiện tại. Các bảng bên dưới áp dụng kỳ đã chọn.</p></section>
      <div className="grid lg:grid-cols-2 gap-5">
        <section className="bg-white border rounded-xl p-5 space-y-3"><h2 className="font-bold">Doanh thu theo {metrics.groupBy === 'month' ? 'tháng' : 'ngày'}</h2>{revenue.length ? revenue.map(r => <div key={r.periodStart}><p className="text-sm flex justify-between gap-3"><span>{r.periodStart}</span><span>{Number(r.net).toLocaleString('vi-VN')}đ</span></p><div className="h-2 rounded bg-slate-100 mt-1"><div className="h-2 rounded bg-red-600" style={{ width: `${Math.max(0, Math.min(100, Number(r.net) / maxRevenue * 100))}%` }} /></div></div>) : <p>Chưa có doanh thu trong kỳ.</p>}</section>
        <section className="bg-white border rounded-xl p-5 space-y-3"><h2 className="font-bold">Tỷ lệ đặt chỗ theo bộ môn</h2>{metrics.utilizationBySport.length ? metrics.utilizationBySport.map(r => <p key={r.name} className="text-sm">{r.name}: {r.booked}/{r.capacity} chỗ ({r.percentage}%)</p>) : <p>Chưa có buổi học trong kỳ.</p>}</section>
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <section className="bg-white border rounded-xl p-5"><h2 className="font-bold mb-3">Thành viên mới theo kỳ</h2><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr><th className="p-2">Kỳ</th><th className="p-2">Số mới</th></tr></thead><tbody>{membership.map(r => <tr key={r.periodStart} className="border-t"><td className="p-2">{r.periodStart}</td><td className="p-2">{r.newMembers}</td></tr>)}</tbody></table></div></section>
        <section className="bg-white border rounded-xl p-5"><h2 className="font-bold mb-3">Sự kiện đăng ký lớp trong kỳ</h2><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr><th className="p-2">Kỳ</th><th className="p-2">Trạng thái / số lượng</th></tr></thead><tbody>{events.map(r => <tr key={r.periodStart} className="border-t"><td className="p-2">{r.periodStart}</td><td className="p-2">{Object.entries(r.statusCounts).map(([status,count]) => `${statusName(status)}: ${count}`).join(' · ') || '0'}</td></tr>)}</tbody></table></div></section>
      </div>
    </>}
  </div>;
}
