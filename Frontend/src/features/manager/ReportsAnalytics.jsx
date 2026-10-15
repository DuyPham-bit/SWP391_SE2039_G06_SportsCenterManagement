import React, { useEffect, useState, useMemo } from 'react';
import { reportApi } from '../../services/api.js';
import { createReportCsv } from '../../services/reportExport.js';
import { StatCard } from '../../components/common/StatCard.jsx';
import { LoadingSpinner } from '../../components/common/Table.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { BusinessAlert } from '../../components/common/BusinessAlert.jsx';
import {
  RevenueTrendChart,
  NewMembersAreaChart,
  SportsDonutChart,
  ClassCapacityBarChart,
  SportRevenueRankingChart,
  RoomUsageRankingChart,
  SportRevenueBarChart
} from './AnalyticsCharts.jsx';

const field = 'border border-slate-200 rounded-lg p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500';
const button = 'px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm';
const statusName = status => ({
  Confirmed: 'Đã xác nhận',
  Cancelled: 'Đã hủy',
  Waiting: 'Đang chờ',
  Promoted: 'Đã chuyển vào lớp',
  Booked: 'Đã đặt chỗ',
  Attended: 'Đã tham gia'
})[status] || status;

const sportBadgeStyles = {
  'Bơi lội': { bg: 'bg-sky-50 text-sky-700 border-sky-200', icon: 'pool', bar: 'bg-sky-500' },
  'Gym & Fitness': { bg: 'bg-red-50 text-red-700 border-red-200', icon: 'fitness_center', bar: 'bg-red-500' },
  'Yoga & Pilates': { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'self_improvement', bar: 'bg-emerald-500' },
  'Cầu lông': { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'sports_tennis', bar: 'bg-amber-500' },
  'Boxing & Võ thuật': { bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: 'sports_mma', bar: 'bg-purple-500' }
};

const getSportStyle = (name) => sportBadgeStyles[name] || { bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: 'sports', bar: 'bg-slate-600' };

export function ReportsAnalytics() {
  const { showError } = useToast();
  const [period, setPeriod] = useState('MONTH');
  const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
  const [range, setRange] = useState({ from: `${today.slice(0, 7)}-01`, to: today, groupBy: 'day' });
  const [selection, setSelection] = useState('MONTH');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revision, setRevision] = useState(0);

  // Table filters
  const [activeTableTab, setActiveTableTab] = useState('classes'); // classes | sports | rooms | logs
  const [classSearch, setClassSearch] = useState('');
  const [classSportFilter, setClassSportFilter] = useState('ALL');
  const [classSortBy, setClassSortBy] = useState('booked'); // booked | occupancy | sessions
  const [roomSortBy, setRoomSortBy] = useState('booked'); // booked | sessions | occupancy

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setMetrics(null);

    reportApi.getOverview(selection)
      .then(data => { if (active) setMetrics(data); })
      .catch(e => { if (active) setError(e); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [selection, revision]);

  const exportReport = () => {
    try {
      const url = URL.createObjectURL(new Blob([createReportCsv(metrics, period)], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `SCMS-BaoCao-ChiTiet-${period}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      showError(e);
    }
  };

  // Filtered and sorted classes
  const processedClasses = useMemo(() => {
    if (!metrics?.topClasses) return [];
    return metrics.topClasses
      .filter(c => {
        const matchSearch = !classSearch || c.name.toLowerCase().includes(classSearch.toLowerCase()) || (c.coachName && c.coachName.toLowerCase().includes(classSearch.toLowerCase()));
        const matchSport = classSportFilter === 'ALL' || c.sportName === classSportFilter;
        return matchSearch && matchSport;
      })
      .sort((a, b) => {
        if (classSortBy === 'occupancy') return b.occupancyRate - a.occupancyRate || b.booked - a.booked;
        if (classSortBy === 'sessions') return b.sessionsCount - a.sessionsCount || b.booked - a.booked;
        return b.booked - a.booked || b.occupancyRate - a.occupancyRate;
      });
  }, [metrics?.topClasses, classSearch, classSportFilter, classSortBy]);

  // Sorted rooms
  const processedRooms = useMemo(() => {
    if (!metrics?.topRooms) return [];
    return [...metrics.topRooms].sort((a, b) => {
      if (roomSortBy === 'sessions') return b.sessionsCount - a.sessionsCount || b.booked - a.booked;
      if (roomSortBy === 'occupancy') return b.occupancyRate - a.occupancyRate || b.booked - a.booked;
      return b.booked - a.booked || b.sessionsCount - a.sessionsCount;
    });
  }, [metrics?.topRooms, roomSortBy]);

  const revenue = metrics?.revenuePeriods || [];
  const membership = metrics?.membershipPeriods || [];
  const events = metrics?.classPeriods || [];
  const maxRevenue = Math.max(1, ...revenue.map(r => Number(r.net || 0)));

  const highlights = metrics?.highlights || {};
  const topClass = highlights.mostPopularClass;
  const topSport = highlights.mostPopularSport;
  const topRevenueSport = highlights.highestRevenueSport;
  const topRoom = highlights.mostBookedRoom;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 font-chivo">
              Báo Cáo & Thống Kê Hoạt Động
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
              Olympic Analytics
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Tổng hợp biểu đồ thống kê trực quan, thị phần bộ môn và hiệu suất vận hành toàn trung tâm.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
            disabled={loading || !metrics}
            onClick={exportReport}
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Xuất Báo Cáo Chi Tiết (.CSV)
          </button>
        </div>
      </div>

      {/* 2. DATE RANGE & PERIOD SELECTOR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1">Kỳ nhanh:</span>
          {[
            ['DAY', 'Hôm nay'],
            ['WEEK', 'Tuần này'],
            ['MONTH', 'Tháng này'],
            ['QUARTER', 'Quý này'],
            ['YEAR', 'Năm nay']
          ].map(([id, label]) => (
            <button
              key={id}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === id
                  ? 'bg-red-600 text-white shadow-sm shadow-red-500/20 ring-2 ring-red-600/30'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
              onClick={() => {
                setPeriod(id);
                setSelection(id);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={e => {
            e.preventDefault();
            if (range.from && range.to && range.from > range.to) {
              showError({
                message: 'Khoảng ngày không hợp lệ: Từ ngày phải nhỏ hơn hoặc bằng Đến ngày.',
                code: 'VAL-REPORT-DATE',
                proposedHandling: 'Vui lòng chọn lại khoảng thời gian tra cứu.'
              });
              return;
            }
            setPeriod('CUSTOM');
            setSelection({ ...range });
          }}
        >
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-400">Từ</span>
            <input
              type="date"
              className="text-xs font-medium text-slate-800 focus:outline-none"
              value={range.from}
              onChange={e => setRange(r => ({ ...r, from: e.target.value }))}
              required
            />
          </div>
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-400">Đến</span>
            <input
              type="date"
              className="text-xs font-medium text-slate-800 focus:outline-none"
              min={range.from}
              value={range.to}
              onChange={e => setRange(r => ({ ...r, to: e.target.value }))}
              required
            />
          </div>
          <select
            className="text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            value={range.groupBy}
            onChange={e => setRange(r => ({ ...r, groupBy: e.target.value }))}
          >
            <option value="day">Theo Ngày</option>
            <option value="month">Theo Tháng</option>
          </select>
          <button type="submit" className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition">
            Áp dụng
          </button>
        </form>
      </div>

      {loading ? (
        <LoadingSpinner text="Đang xử lý và tổng hợp dữ liệu báo cáo trung tâm..." />
      ) : error ? (
        <BusinessAlert
          type="error"
          title="Không thể tải báo cáo thống kê"
          code={error.code || 'REPORT-LOAD-ERR'}
          message={error.message || String(error)}
          proposedHandling={error.proposedHandling || 'Truy vấn dữ liệu lớn có thể bị gián đoạn đường truyền. Vui lòng thử lại hoặc thu hẹp khoảng ngày.'}
          actionText="Thử lại"
          onAction={() => setRevision(x => x + 1)}
        />
      ) : metrics && (
        <>
          {/* 3. EXECUTIVE TOP KPI CARDS */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Doanh thu thuần"
              value={`${Number(metrics.netRevenue || 0).toLocaleString('vi-VN')}đ`}
              subtitle={`Thu ${Number(metrics.grossRevenue || 0).toLocaleString('vi-VN')}đ · hoàn ${Number(metrics.refundedRevenue || 0).toLocaleString('vi-VN')}đ`}
              icon="payments"
              color="red"
            />
            <StatCard
              title="Tổng thành viên"
              value={metrics.totalMembers}
              subtitle={`Gói hiệu lực hôm nay: ${metrics.activeMembers}`}
              icon="group"
              color="slate"
            />
            <StatCard
              title="Thành viên mới"
              value={metrics.newMembers}
              subtitle="Đăng ký tài khoản trong kỳ"
              icon="person_add"
              color="slate"
            />
            <StatCard
              title="Check-in hôm nay"
              value={metrics.todayCheckins}
              subtitle="Cập nhật theo thời gian thực"
              icon="fact_check"
              color="red"
            />
          </div>

          {/* 3b. INLINE CURRENT CLASS STATUS STRIP */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-500 text-[18px]">event_seat</span>
              <strong className="text-slate-900">Trạng thái đăng ký lớp học:</strong>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(metrics.classStatusCounts).map(([status, count]) => (
                <span
                  key={status}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5"
                >
                  <span className="text-slate-500">{statusName(status)}:</span>
                  <strong className="text-slate-900 font-bold text-xs">{count}</strong>
                </span>
              ))}
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                Tỷ lệ lấp đầy: {metrics.occupancyRate}%
              </span>
            </div>
          </div>

          {/* 4. 🏆 BỘ 3 QUÁN QUÂN HOẠT ĐỘNG (TOP OPERATIONAL PERFORMERS) */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-700/60">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                  <span className="material-symbols-outlined text-[24px]">emoji_events</span>
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight font-chivo text-white flex items-center gap-2">
                    BỘ 3 DẪN ĐẦU TRUNG TÂM
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      TOP PERFORMERS
                    </span>
                  </h2>
                  <p className="text-xs text-slate-300">
                    Phân tích từ {metrics.from} đến {metrics.to} · Tổng {metrics.totalClasses} ca học đã phân bổ
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-400">Tỷ lệ lấp đầy trung tâm</span>
                <p className="text-xl font-black text-emerald-400">{metrics.occupancyRate}%</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Top 1 Lớp học */}
              <div className="bg-white/5 hover:bg-white/10 transition-all rounded-xl p-4 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                      🥇 LỚP HỌC ĐẶT NHIỀU NHẤT
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                      TOP 1 CLASS
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-white line-clamp-1">
                    {topClass ? topClass.name : 'Chưa có lớp'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-300">
                    <span className="font-semibold text-amber-200">{topClass?.sportName || 'N/A'}</span>
                    <span>•</span>
                    <span className="truncate">{topClass?.roomName || 'N/A'}</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Lượt đặt / Sức chứa</span>
                    <p className="text-sm font-bold text-white">
                      {topClass ? `${topClass.booked} / ${topClass.capacity} chỗ` : '0/0'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400">Tỷ lệ lấp đầy</span>
                    <p className="text-sm font-bold text-emerald-300">
                      {topClass ? `${topClass.occupancyRate}%` : '0%'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Top 1 doanh thu bộ môn */}
              <div className="bg-white/5 hover:bg-white/10 transition-all rounded-xl p-4 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                      🥇 BỘ MÔN DOANH THU CAO NHẤT
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      TOP 1 SPORT
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-white line-clamp-1">
                    {topRevenueSport ? topRevenueSport.sportName : 'Chưa có doanh thu'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-300">
                    <span>Tỷ trọng doanh thu: <strong className="text-sky-300">{topRevenueSport?.share || 0}%</strong></span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Doanh thu thuần</span>
                    <p className="text-sm font-bold text-white">
                      {topRevenueSport ? `${Number(topRevenueSport.net || 0).toLocaleString('vi-VN')}đ` : '0đ'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400">Đã hoàn tiền</span>
                    <p className="text-sm font-bold text-sky-300">
                      {topRevenueSport ? `${Number(topRevenueSport.refunds || 0).toLocaleString('vi-VN')}đ` : '0đ'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Top 1 Sân / Phòng */}
              <div className="bg-white/5 hover:bg-white/10 transition-all rounded-xl p-4 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                      🥇 SÂN / PHÒNG TẢI CAO NHẤT
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      TOP 1 COURT
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-white line-clamp-1">
                    {topRoom ? topRoom.name : 'Chưa có sân'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-300">
                    <span>{topRoom?.type || 'Sân'}</span>
                    <span>•</span>
                    <span className="truncate">{topRoom?.location || 'Trung tâm'}</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Ca học đã tổ chức</span>
                    <p className="text-sm font-bold text-white">
                      {topRoom ? `${topRoom.sessionsCount} ca` : '0'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400">Lượt khách tiếp nhận</span>
                    <p className="text-sm font-bold text-emerald-300">
                      {topRoom ? `${topRoom.booked} lượt` : '0'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. 📊 KHỐI BIỂU ĐỒ THỐNG KÊ TỔNG QUAN (ĐẨY LÊN ĐẦU TIÊN) */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600 text-[22px]">monitoring</span>
              <h2 className="text-lg font-black tracking-tight font-chivo text-slate-900">
                TRUNG TÂM BIỂU ĐỒ THỐNG KÊ TRỰC QUAN
              </h2>
              <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[11px] font-bold">
                CHARTS SHOWCASE
              </span>
            </div>

            {/* Hàng biểu đồ 1: Doanh thu & Hội viên mới */}
            <div className="grid lg:grid-cols-2 gap-5">
              <section className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <h3 className="font-black text-slate-900 text-base font-chivo flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                    Biểu Đồ Cột Doanh Thu Thuần ({metrics.groupBy === 'month' ? 'Theo Tháng' : 'Theo Ngày'})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Trực quan hóa doanh thu thực nhận từng ngày/tháng với định dạng tiền tệ và mốc doanh thu đỉnh.
                  </p>
                </div>
                <RevenueTrendChart data={revenue} groupBy={metrics.groupBy} />
              </section>

              <section className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <h3 className="font-black text-slate-900 text-base font-chivo flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    Biểu Đồ Miền Xu Hướng Thành Viên Mới
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Đường cong tăng trưởng số lượng học viên đăng ký tài khoản trung tâm theo từng ngày.
                  </p>
                </div>
                <NewMembersAreaChart data={membership} />
              </section>
            </div>

            <section className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-900 text-base font-chivo flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    Doanh Thu Theo Bộ Môn
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Phân bổ doanh thu hóa đơn theo các bộ môn thực tế mà gói hội viên đã sử dụng.</p>
                </div>
                {Number(metrics.unallocatedSportRevenue || 0) !== 0 && (
                  <span className="text-xs font-semibold rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5">
                    Chưa phân bổ: {Number(metrics.unallocatedSportRevenue).toLocaleString('vi-VN')}đ
                  </span>
                )}
              </div>
              <SportRevenueBarChart sports={metrics.revenueBySport} />
            </section>

            {/* Hàng biểu đồ 2: Thị phần Bộ môn (Donut) & So sánh công suất lớp học */}
            <div className="grid lg:grid-cols-2 gap-5">
              <section className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <h3 className="font-black text-slate-900 text-base font-chivo flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                    Biểu Đồ Donut Thị Phần Đặt Chỗ Theo Bộ Môn
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tỷ trọng phần trăm lượt đặt chỗ giữa các môn thể thao (Di chuột vào từng phần quạt màu).
                  </p>
                </div>
                <SportsDonutChart sports={metrics.topSports} />
              </section>

              <section className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <h3 className="font-black text-slate-900 text-base font-chivo flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    Biểu Đồ So Sánh Công Suất & Lượt Đặt Top Lớp
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    So sánh kép số chỗ đã đặt (Booked) với tổng sức chứa tối đa mở bán (Capacity).
                  </p>
                </div>
                <ClassCapacityBarChart classes={processedClasses} />
              </section>
            </div>

            {/* Hàng biểu đồ 3: Xếp hạng Bộ môn & Sân bãi theo Doanh thu / Lượt đặt */}
            <div className="grid lg:grid-cols-2 gap-5">
              <section className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <h3 className="font-black text-slate-900 text-base font-chivo flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                    Biểu Đồ Xếp Hạng Bộ Môn: Doanh Thu & Lượt Đặt Chỗ
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thống kê bộ môn thể thao nào mang lại nhiều tiền nhất và được hội viên đặt chỗ nhiều nhất.
                  </p>
                </div>
                <SportRevenueRankingChart
                  sports={metrics.topSports}
                  revenueBySport={metrics.revenueBySport}
                />
              </section>

              <section className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <h3 className="font-black text-slate-900 text-base font-chivo flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    Biểu Đồ Khai Thác Sân Bãi: Số Ca Học & Lượt Khách
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thống kê số ca học và lượt khách thực tế theo sân bãi / phòng tập.
                  </p>
                </div>
                <RoomUsageRankingChart
                  rooms={processedRooms}
                />
              </section>
            </div>
          </div>

          {/* 6. 💡 BẢNG KHUYẾN NGHỊ VẬN HÀNH THÔNG MINH (OPERATIONAL INSIGHTS) */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-chivo font-black text-base">
              <span className="material-symbols-outlined text-amber-600 text-[22px]">lightbulb</span>
              Khuyến Nghị Vận Hành & Tối Ưu Doanh Thu
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-xs text-amber-950">
              <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/60 shadow-xs">
                <span className="font-bold text-amber-900 block mb-1">
                  1. Mở rộng khung giờ Lớp & Sân Quán quân:
                </span>
                Lớp <strong className="text-slate-900">{topClass?.name || 'Top 1'}</strong> tại <strong className="text-slate-900">{topRoom?.name || 'Sân Top 1'}</strong> đang có tần suất đặt cao nhất ({topClass?.booked || 0} lượt). Khuyến nghị bổ sung thêm ca tập cuối tuần hoặc giờ cao điểm buổi tối.
              </div>
              <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/60 shadow-xs">
                <span className="font-bold text-amber-900 block mb-1">
                  2. Cân bằng thị phần bộ môn:
                </span>
                {topSport
                  ? <>Bộ môn <strong className="text-slate-900">{topSport.name}</strong> chiếm <strong className="text-red-600">{topSport.share || 0}%</strong> tổng lượt đặt chỗ. So sánh với các bộ môn còn lại trước khi điều chỉnh lịch hoặc chương trình quảng bá.</>
                  : 'Chưa đủ dữ liệu đặt chỗ để đưa ra khuyến nghị theo bộ môn.'}
              </div>
              <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/60 shadow-xs">
                <span className="font-bold text-amber-900 block mb-1">
                  3. Tối ưu sân có nhiều khung giờ trống:
                </span>
                {processedRooms.length
                  ? <>Khu vực <strong>{processedRooms[processedRooms.length - 1]?.name}</strong> có lượng sử dụng thấp nhất trong dữ liệu kỳ này. Cần đối chiếu khung giờ trước khi mở thêm ưu đãi.</>
                  : 'Chưa đủ dữ liệu sân/phòng để đưa ra khuyến nghị.'}
              </div>
            </div>
          </div>

          {/* 7. 📋 PHẦN TRA CỨU & BẢNG BIỂU CHI TIẾT (ĐẶT Ở NỬA DƯỚI) */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black tracking-tight font-chivo text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-700 text-[22px]">table_chart</span>
                  BẢNG TRA CỨU CHI TIẾT VẬN HÀNH
                </h2>
                <p className="text-xs text-slate-500">
                  Tra cứu chi tiết từng lớp học, bộ môn, sân bãi và nhật ký sự kiện.
                </p>
              </div>

              {/* Table Tab Switcher */}
              <div className="flex flex-wrap gap-2">
                {[
                  ['classes', '🏅 Bảng Lớp học'],
                  ['sports', '🥋 Danh sách Bộ môn'],
                  ['rooms', '🏟️ Bảng Sân & Phòng'],
                  ['logs', '📋 Lịch sử & Đăng ký']
                ].map(([tabKey, tabLabel]) => (
                  <button
                    key={tabKey}
                    onClick={() => setActiveTableTab(tabKey)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeTableTab === tabKey
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {tabLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* TABLE TAB 1: BẢNG LỚP HỌC */}
            {activeTableTab === 'classes' && (
              <section className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Chi tiết thứ hạng từng lớp học
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Search box */}
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-[18px]">
                        search
                      </span>
                      <input
                        type="text"
                        placeholder="Tìm lớp hoặc HLV..."
                        value={classSearch}
                        onChange={e => setClassSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    {/* Sport Filter */}
                    <select
                      className="text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none"
                      value={classSportFilter}
                      onChange={e => setClassSportFilter(e.target.value)}
                    >
                      <option value="ALL">Tất cả bộ môn</option>
                      {metrics.topSports?.map(s => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>

                    {/* Sắp xếp */}
                    <select
                      className="text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none"
                      value={classSortBy}
                      onChange={e => setClassSortBy(e.target.value)}
                    >
                      <option value="booked">Sắp xếp: Đặt nhiều nhất</option>
                      <option value="occupancy">Sắp xếp: % Lấp đầy cao nhất</option>
                      <option value="sessions">Sắp xếp: Số buổi nhiều nhất</option>
                    </select>
                  </div>
                </div>

                {/* Classes Table */}
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-chivo text-xs uppercase tracking-wider border-b border-slate-200">
                        <th className="py-3 px-3 w-14 text-center">Hạng</th>
                        <th className="py-3 px-4">Lớp học</th>
                        <th className="py-3 px-4">Bộ môn & HLV</th>
                        <th className="py-3 px-4">Sân / Phòng diễn ra</th>
                        <th className="py-3 px-3 text-center">Số buổi</th>
                        <th className="py-3 px-4 text-center">Lượt đặt / Sức chứa</th>
                        <th className="py-3 px-4 w-44">Tỷ lệ lấp đầy</th>
                        <th className="py-3 px-3 text-center">Đánh giá tải</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {processedClasses.length ? processedClasses.map((cls, idx) => {
                        const sportStyle = getSportStyle(cls.sportName);
                        const isTop1 = idx === 0 && classSortBy === 'booked' && !classSearch && classSportFilter === 'ALL';
                        const isTop2 = idx === 1 && classSortBy === 'booked' && !classSearch && classSportFilter === 'ALL';
                        const isTop3 = idx === 2 && classSortBy === 'booked' && !classSearch && classSportFilter === 'ALL';

                        let badgeRank = `#${idx + 1}`;
                        let badgeRankColor = 'bg-slate-100 text-slate-600 border-slate-200';
                        if (isTop1) { badgeRank = '🥇 #1'; badgeRankColor = 'bg-amber-100 text-amber-900 border-amber-300 font-bold'; }
                        else if (isTop2) { badgeRank = '🥈 #2'; badgeRankColor = 'bg-slate-200 text-slate-800 border-slate-300 font-bold'; }
                        else if (isTop3) { badgeRank = '🥉 #3'; badgeRankColor = 'bg-amber-50 text-amber-800 border-amber-200 font-bold'; }

                        return (
                          <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs border ${badgeRankColor}`}>
                                {badgeRank}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {cls.name}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col gap-0.5">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border w-fit ${sportStyle.bg}`}>
                                  <span className="material-symbols-outlined text-[13px]">{sportStyle.icon}</span>
                                  {cls.sportName}
                                </span>
                                <span className="text-xs text-slate-500">HLV: {cls.coachName}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs font-medium text-slate-700">
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px] text-slate-400">meeting_room</span>
                                {cls.roomName}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-semibold text-slate-700">
                              {cls.sessionsCount}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-bold text-slate-900">{cls.booked}</span>
                              <span className="text-xs text-slate-400"> / {cls.capacity}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold">
                                  <span className={cls.occupancyRate >= 20 ? 'text-emerald-600' : 'text-slate-600'}>
                                    {cls.occupancyRate}%
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-normal">
                                    {cls.capacity ? `${cls.booked}/${cls.capacity}` : '0/0'}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-500 ${
                                      cls.occupancyRate >= 20
                                        ? 'bg-emerald-500'
                                        : cls.occupancyRate >= 10
                                        ? 'bg-blue-500'
                                        : 'bg-slate-400'
                                    }`}
                                    style={{ width: `${Math.min(100, cls.occupancyRate)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              {cls.booked >= 15 ? (
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                                  🔥 Rất Hot
                                </span>
                              ) : cls.booked >= 5 ? (
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  ✅ Ổn định
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                  ⚠️ Thấp điểm
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                            Không có lớp học nào thỏa mãn điều kiện lọc.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* TABLE TAB 2: DANH SÁCH BỘ MÔN */}
            {activeTableTab === 'sports' && (
              <section className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">
                  Thông số chi tiết từng bộ môn thể thao
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {metrics.topSports?.map((sport, idx) => {
                    const style = getSportStyle(sport.name);
                    return (
                      <div
                        key={sport.name}
                        className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/40 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${style.bg}`}>
                              <span className="material-symbols-outlined text-[16px]">{style.icon}</span>
                              {sport.name}
                            </span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                              Hạng #{idx + 1}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                              <span className="text-slate-400 block text-[11px]">Đã đặt chỗ</span>
                              <span className="text-base font-black text-slate-900">{sport.booked} lượt</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                              <span className="text-slate-400 block text-[11px]">Sức chứa mở</span>
                              <span className="text-base font-black text-slate-900">{sport.capacity} chỗ</span>
                            </div>
                          </div>

                          <div className="mt-3 space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-500">Tỷ lệ lấp đầy:</span>
                              <span className="text-slate-900 font-bold">{sport.percentage}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div className={`h-2 rounded-full ${style.bar}`} style={{ width: `${Math.min(100, sport.percentage)}%` }} />
                            </div>
                          </div>

                          <div className="mt-2.5 space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-500">Thị phần toàn trung tâm:</span>
                              <span className="text-sky-700 font-bold">{sport.share}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div className="h-1.5 rounded-full bg-sky-600" style={{ width: `${Math.min(100, sport.share)}%` }} />
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Số ca học: <strong>{sport.sessionsCount}</strong> buổi</span>
                          <span>Số lớp hoạt động: <strong>{sport.classesCount}</strong> lớp</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* TABLE TAB 3: BẢNG SÂN & PHÒNG */}
            {activeTableTab === 'rooms' && (
              <section className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Chi tiết hiệu suất từng sân & phòng tập
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      className="text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none"
                      value={roomSortBy}
                      onChange={e => setRoomSortBy(e.target.value)}
                    >
                      <option value="booked">Sắp xếp: Đặt nhiều nhất</option>
                      <option value="sessions">Sắp xếp: Số ca học nhiều nhất</option>
                      <option value="occupancy">Sắp xếp: % Khai thác công suất</option>
                    </select>
                  </div>
                </div>

                {/* Rooms Table */}
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-chivo text-xs uppercase tracking-wider border-b border-slate-200">
                        <th className="py-3 px-3 w-14 text-center">Hạng</th>
                        <th className="py-3 px-4">Tên Sân / Phòng</th>
                        <th className="py-3 px-4">Loại hình & Vị trí</th>
                        <th className="py-3 px-3 text-center">Sức chứa / ca</th>
                        <th className="py-3 px-3 text-center">Số ca đã tổ chức</th>
                        <th className="py-3 px-4 text-center">Lượt khách tiếp nhận</th>
                        <th className="py-3 px-4 w-44">Tỷ lệ khai thác</th>
                        <th className="py-3 px-3 text-center">Tình trạng tải</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {processedRooms.length ? processedRooms.map((room, idx) => {
                        const isTop1 = idx === 0 && roomSortBy === 'booked';
                        const isTop2 = idx === 1 && roomSortBy === 'booked';
                        const isTop3 = idx === 2 && roomSortBy === 'booked';

                        let badgeRank = `#${idx + 1}`;
                        let badgeRankColor = 'bg-slate-100 text-slate-600 border-slate-200';
                        if (isTop1) { badgeRank = '🥇 #1'; badgeRankColor = 'bg-amber-100 text-amber-900 border-amber-300 font-bold'; }
                        else if (isTop2) { badgeRank = '🥈 #2'; badgeRankColor = 'bg-slate-200 text-slate-800 border-slate-300 font-bold'; }
                        else if (isTop3) { badgeRank = '🥉 #3'; badgeRankColor = 'bg-amber-50 text-amber-800 border-amber-200 font-bold'; }

                        return (
                          <tr key={room.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs border ${badgeRankColor}`}>
                                {badgeRank}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-slate-400 text-[18px]">stadium</span>
                                <span>{room.name}</span>
                              </div>
                              {room.classesList?.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {room.classesList.map(cName => (
                                    <span key={cName} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                      {cName}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-xs">
                                <span className="font-semibold text-slate-800 block">{room.type}</span>
                                <span className="text-slate-400">{room.location || 'Chưa cập nhật'}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-semibold text-slate-700">
                              {room.unitCapacity} chỗ
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-slate-900">
                              {room.sessionsCount} ca
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-black text-slate-900 text-base">{room.booked}</span>
                              <span className="text-xs text-slate-400"> / {room.capacity} chỗ</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold">
                                  <span className={room.occupancyRate >= 20 ? 'text-emerald-600' : 'text-slate-600'}>
                                    {room.occupancyRate}%
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-normal">
                                    {room.capacity ? `${room.booked}/${room.capacity}` : '0/0'}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-500 ${
                                      room.occupancyRate >= 20
                                        ? 'bg-emerald-500'
                                        : room.occupancyRate >= 10
                                        ? 'bg-blue-500'
                                        : 'bg-slate-400'
                                    }`}
                                    style={{ width: `${Math.min(100, room.occupancyRate)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              {room.booked >= 15 ? (
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  🔥 Tải cao
                                </span>
                              ) : room.booked >= 5 ? (
                                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                  ✅ Đang tối ưu
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  ⚠️ Còn nhiều ca trống
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                            Không có dữ liệu sân/phòng nào.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* TABLE TAB 4: LỊCH SỬ & ĐĂNG KÝ */}
            {activeTableTab === 'logs' && (
              <div className="grid lg:grid-cols-2 gap-5">
                <section className="bg-white border rounded-2xl p-5 space-y-3 shadow-sm">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Bảng đối soát doanh thu theo kỳ
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <th className="p-2.5">Thời gian</th>
                          <th className="p-2.5 text-right">Doanh thu thuần</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {revenue.length ? revenue.map(r => (
                          <tr key={r.periodStart} className="hover:bg-slate-50">
                            <td className="p-2.5 text-slate-700 font-medium">{r.periodStart}</td>
                            <td className="p-2.5 text-right font-bold text-slate-900">{Number(r.net || 0).toLocaleString('vi-VN')}đ</td>
                          </tr>
                        )) : (
                          <tr><td colSpan={2} className="p-4 text-center text-slate-400">Chưa có dữ liệu doanh thu.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="bg-white border rounded-2xl p-5 space-y-3 shadow-sm">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Sự kiện đăng ký lớp trong kỳ
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <th className="p-2.5">Kỳ</th>
                          <th className="p-2.5">Trạng thái / Số lượng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {events.length ? events.map(r => (
                          <tr key={r.periodStart} className="hover:bg-slate-50">
                            <td className="p-2.5 text-slate-700 font-medium">{r.periodStart}</td>
                            <td className="p-2.5 text-slate-800 font-bold">
                              {Object.entries(r.statusCounts || {}).map(([status, count]) => `${statusName(status)}: ${count}`).join(' · ') || '0'}
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan={2} className="p-4 text-center text-slate-400">Chưa có sự kiện trong kỳ.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
