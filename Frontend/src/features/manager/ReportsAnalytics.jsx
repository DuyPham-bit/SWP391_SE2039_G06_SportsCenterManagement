import React, { useEffect, useState, useMemo } from 'react';
import { reportApi } from '../../services/api.js';
import { createReportWorkbook, createReportCsv } from '../../services/reportExport.js';
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
  const [activeTableTab, setActiveTableTab] = useState('classes'); // classes | coaches | packages | sports | rooms | logs
  const [classSearch, setClassSearch] = useState('');
  const [classSportFilter, setClassSportFilter] = useState('ALL');
  const [classSortBy, setClassSortBy] = useState('booked'); // booked | occupancy | sessions
  const [roomSortBy, setRoomSortBy] = useState('booked'); // booked | sessions | occupancy
  const [coachSearch, setCoachSearch] = useState('');
  const [coachSortBy, setCoachSortBy] = useState('booked'); // booked | sessions | occupancy
  const [packageSearch, setPackageSearch] = useState('');
  const [packageSortBy, setPackageSortBy] = useState('revenue'); // revenue | sold | active

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
      const url = URL.createObjectURL(new Blob([createReportWorkbook(metrics, period)], { type: 'application/vnd.ms-excel;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `SCMS-BaoCao-DoanhThu-VanHanh-${period}.xls`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      showError(e);
    }
  };

  const exportCsv = () => {
    try {
      const url = URL.createObjectURL(new Blob([createReportCsv(metrics, period)], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `SCMS-BaoCao-DoanhThu-VanHanh-${period}.csv`;
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

  // Filtered and sorted coaches
  const processedCoaches = useMemo(() => {
    if (!metrics?.topCoaches) return [];
    return metrics.topCoaches
      .filter(c => {
        if (!coachSearch) return true;
        const q = coachSearch.toLowerCase();
        return c.fullName.toLowerCase().includes(q) ||
          (c.coachCode && c.coachCode.toLowerCase().includes(q)) ||
          (c.specialization && c.specialization.toLowerCase().includes(q));
      })
      .sort((a, b) => {
        if (coachSortBy === 'occupancy') return b.occupancyRate - a.occupancyRate || b.booked - a.booked;
        if (coachSortBy === 'sessions') return b.sessionsCount - a.sessionsCount || b.booked - a.booked;
        return b.booked - a.booked || b.sessionsCount - a.sessionsCount;
      });
  }, [metrics?.topCoaches, coachSearch, coachSortBy]);

  // Filtered and sorted membership packages
  const processedPackages = useMemo(() => {
    if (!metrics?.membershipPackages) return [];
    const totalPkgRev = metrics.membershipPackages.reduce((sum, p) => sum + (p.revenueInPeriod || 0), 0) || 1;
    return metrics.membershipPackages
      .filter(p => !packageSearch || p.name.toLowerCase().includes(packageSearch.toLowerCase()))
      .map(p => ({
        ...p,
        share: Math.round(((p.revenueInPeriod || 0) / totalPkgRev) * 100)
      }))
      .sort((a, b) => {
        if (packageSortBy === 'sold') return b.soldInPeriod - a.soldInPeriod || b.revenueInPeriod - a.revenueInPeriod;
        if (packageSortBy === 'active') return b.activeSubscribers - a.activeSubscribers || b.revenueInPeriod - a.revenueInPeriod;
        return b.revenueInPeriod - a.revenueInPeriod || b.soldInPeriod - a.soldInPeriod;
      });
  }, [metrics?.membershipPackages, packageSearch, packageSortBy]);

  // Operational alerts
  const highLoadClasses = useMemo(() => {
    return (metrics?.topClasses || []).filter(c => c.occupancyRate >= 80 && c.booked > 0);
  }, [metrics?.topClasses]);

  const lowLoadClasses = useMemo(() => {
    return (metrics?.topClasses || []).filter(c => c.occupancyRate < 40 && c.sessionsCount > 0);
  }, [metrics?.topClasses]);

  const revenue = metrics?.revenuePeriods || [];
  const membership = metrics?.membershipPeriods || [];
  const events = metrics?.classPeriods || [];
  const maxRevenue = Math.max(1, ...revenue.map(r => Number(r.net || 0)));

  const highlights = metrics?.highlights || {};
  const topClass = highlights.mostPopularClass;
  const topSport = highlights.mostPopularSport;
  const topRevenueSport = highlights.highestRevenueSport;
  const topRoom = highlights.mostBookedRoom;
  const topCoach = highlights.topCoach || metrics?.topCoaches?.[0];

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
            Tổng hợp đối soát doanh thu, cơ cấu hội viên, năng suất huấn luyện viên và hiệu suất vận hành toàn trung tâm.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-300 disabled:opacity-50"
            disabled={loading || !metrics}
            onClick={exportCsv}
            title="Xuất file CSV chuẩn UTF-8 chứa đầy đủ bảng đối soát doanh thu, nhân sự và học viên"
          >
            <span className="material-symbols-outlined text-[18px] text-emerald-600">table</span>
            Xuất Dữ Liệu CSV (.CSV)
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            disabled={loading || !metrics}
            onClick={exportReport}
            title="Xuất bảng tính Excel chuyên nghiệp có định dạng màu sắc và kẻ bảng"
          >
            <span className="material-symbols-outlined text-[18px] text-emerald-400">table_view</span>
            Xuất Báo Cáo Excel (.XLS)
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
              subtitle={`Thu: ${Number(metrics.grossRevenue || 0).toLocaleString('vi-VN')}đ · Hoàn: ${Number(metrics.refundedRevenue || 0).toLocaleString('vi-VN')}đ`}
              icon="payments"
              color="red"
            />
            <StatCard
              title="Học viên & Hội viên"
              value={`${metrics.activeMembers || 0} / ${metrics.totalMembers || 0}`}
              subtitle={`Gói hiệu lực · ${metrics.expiredMembers || 0} hết hạn · +${metrics.newMembers || 0} mới`}
              icon="group"
              color="slate"
            />
            <StatCard
              title="Đội ngũ nhân sự"
              value={`${metrics.activeStaff || 0} / ${metrics.totalStaff || 0}`}
              subtitle={`${metrics.coachCount || 0} HLV · ${metrics.receptionistCount || 0} lễ tân · ${metrics.managerCount || 0} quản lý`}
              icon="badge"
              color="slate"
            />
            <StatCard
              title="Check-in & Lấp đầy"
              value={`${metrics.todayCheckins || 0} lượt`}
              subtitle={`Hôm nay · Tỷ lệ lấp đầy lớp: ${metrics.occupancyRate || 0}%`}
              icon="fact_check"
              color="red"
            />
          </div>

          {/* 3a. NGUỒN LỰC NHÂN SỰ, HỌC VIÊN & CƠ SỞ VẬT CHẤT */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-700 text-[20px]">hub</span>
                  Thống Kê Nguồn Lực Nhân Sự, Hội Viên & Hạ Tầng
                </h2>
                <p className="text-xs text-slate-500">Số liệu thời gian thực hỗ trợ ban quản lý phân bổ ca kíp và kiểm soát nguồn lực.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {metrics.activeStaff}/{metrics.totalStaff} nhân viên đang làm việc
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                  {metrics.activeMembers}/{metrics.totalMembers} hội viên có gói
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
              {[
                ['Nhân sự tổng', metrics.totalStaff, `${metrics.activeStaff} làm việc`, 'badge', 'text-slate-800'],
                ['Huấn luyện viên', metrics.coachCount, 'Giảng dạy', 'sports', 'text-red-600'],
                ['Lễ tân & CSKH', metrics.receptionistCount, 'Tiếp đón', 'support_agent', 'text-blue-600'],
                ['Quản lý', metrics.managerCount, 'Điều hành', 'manage_accounts', 'text-purple-600'],
                ['HV có gói', metrics.activeMembers, `Tổng ${metrics.totalMembers} HV`, 'card_membership', 'text-emerald-600'],
                ['HV hết hạn', metrics.expiredMembers || 0, 'Cần gia hạn', 'person_off', 'text-amber-600'],
                ['Lớp học', metrics.activeClasses, `Tổng ${metrics.classCatalogCount} lớp`, 'school', 'text-indigo-600'],
                ['Sân & Phòng', metrics.activeRooms, `Tổng ${metrics.totalRooms} phòng`, 'meeting_room', 'text-teal-600']
              ].map(([label, value, note, icon, iconColor]) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 hover:bg-white hover:shadow-xs transition-all">
                  <span className={`material-symbols-outlined text-[20px] ${iconColor}`}>{icon}</span>
                  <div className="mt-1 text-xl font-black text-slate-900">{value || 0}</div>
                  <div className="text-xs font-bold text-slate-700 truncate">{label}</div>
                  <div className="mt-0.5 text-[10px] text-slate-500 truncate">{note}</div>
                </div>
              ))}
            </div>
          </section>

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

          {/* 4. CHỈ SỐ VẬN HÀNH TRỌNG YẾU (4 TRỤ CỘT TRUNG TÂM) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                  <span className="material-symbols-outlined text-[24px]">speed</span>
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight font-chivo text-slate-900 flex items-center gap-2">
                    Chỉ Số Vận Hành Trọng Yếu Trong Kỳ
                  </h2>
                  <p className="text-xs text-slate-500">
                    Dữ liệu hoạt động thực tế từ {metrics.from} đến {metrics.to} · {metrics.totalClasses} ca học đã tổ chức
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-500">Tỷ lệ lấp đầy toàn trung tâm</span>
                <p className="text-xl font-black text-slate-900">{metrics.occupancyRate}%</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pillar 1: Lớp học hàng đầu */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-red-600">fitness_center</span>
                      Lớp học đông nhất
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                      Theo lượt đặt
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 line-clamp-1" title={topClass?.name}>
                    {topClass ? topClass.name : 'Chưa có lớp'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{topClass?.sportName || 'N/A'}</span>
                    <span>•</span>
                    <span className="truncate">{topClass?.roomName || 'N/A'}</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">Đã đặt / Sức chứa</span>
                    <p className="text-sm font-bold text-slate-900">
                      {topClass ? `${topClass.booked} / ${topClass.capacity} chỗ` : '0/0'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500">Tỷ lệ lấp đầy</span>
                    <p className="text-sm font-bold text-emerald-700">
                      {topClass ? `${topClass.occupancyRate}%` : '0%'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pillar 2: Doanh thu bộ môn */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-sky-600">monetization_on</span>
                      Bộ môn doanh thu số 1
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                      Theo doanh thu
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 line-clamp-1" title={topRevenueSport?.sportName}>
                    {topRevenueSport ? topRevenueSport.sportName : 'Chưa có doanh thu'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                    <span>Tỷ trọng doanh thu: <strong className="text-sky-700 font-bold">{topRevenueSport?.share || 0}%</strong></span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">Doanh thu thuần</span>
                    <p className="text-sm font-bold text-slate-900">
                      {topRevenueSport ? `${Number(topRevenueSport.net || 0).toLocaleString('vi-VN')}đ` : '0đ'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500">Hoàn tiền</span>
                    <p className="text-sm font-bold text-slate-600">
                      {topRevenueSport ? `${Number(topRevenueSport.refunds || 0).toLocaleString('vi-VN')}đ` : '0đ'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pillar 3: HLV dẫn đầu khối lượng */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-amber-600">sports_martial_arts</span>
                      HLV năng suất nhất
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      Theo học viên dạy
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 line-clamp-1" title={topCoach?.fullName || topCoach?.coachName}>
                    {topCoach ? (topCoach.fullName || topCoach.coachName) : 'Chưa có HLV'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{topCoach?.specialization || topCoach?.specialty || 'Huấn luyện viên'}</span>
                    <span>•</span>
                    <span>{topCoach?.classesCount || 0} lớp</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">Ca dạy / Học viên</span>
                    <p className="text-sm font-bold text-slate-900">
                      {topCoach ? `${topCoach.sessionsCount} ca · ${topCoach.totalStudents ?? topCoach.booked ?? 0} HV` : '0 ca'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500">Lấp đầy lớp</span>
                    <p className="text-sm font-bold text-amber-700">
                      {topCoach ? `${topCoach.occupancyRate || 0}%` : '0%'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pillar 4: Sân / Phòng hoạt động nhiều nhất */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-emerald-600">stadium</span>
                      Sân/phòng dùng nhiều nhất
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Theo lượt sử dụng
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 line-clamp-1" title={topRoom?.name}>
                    {topRoom ? topRoom.name : 'Chưa có sân'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                    <span>{topRoom?.type || 'Sân/Phòng'}</span>
                    <span>•</span>
                    <span className="truncate">{topRoom?.location || 'Trung tâm'}</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">Ca học / Lượt khách</span>
                    <p className="text-sm font-bold text-slate-900">
                      {topRoom ? `${topRoom.sessionsCount} ca · ${topRoom.booked} lượt` : '0'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500">Tỷ lệ khai thác</span>
                    <p className="text-sm font-bold text-emerald-700">
                      {topRoom ? `${topRoom.occupancyRate || 0}%` : '0%'}
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

          {/* 6. MA TRẬN CẢNH BÁO TẢI VẬN HÀNH & HÀNH ĐỘNG QUẢN LÝ */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-chivo font-black text-base text-white">
                <span className="material-symbols-outlined text-amber-400 text-[22px]">notification_important</span>
                Ma Trận Cảnh Báo Tải Vận Hành & Khuyến Nghị Tác Vụ Quản Lý
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Phân tích định lượng dựa trên dữ liệu thực tế
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-4 text-xs">
              {/* Alert 1: Lớp tải cao */}
              <div className="bg-slate-800/90 p-4 rounded-xl border border-red-500/30 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-red-400 flex items-center gap-1.5 text-xs">
                      <span className="material-symbols-outlined text-[16px]">warning</span>
                      Cảnh báo tải cao (≥ 80% công suất)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-800">
                      {highLoadClasses.length} lớp
                    </span>
                  </div>
                  {highLoadClasses.length > 0 ? (
                    <div className="space-y-1.5 mt-2">
                      {highLoadClasses.slice(0, 3).map(c => (
                        <div key={c.id || c.name} className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/60 flex items-center justify-between">
                          <span className="font-semibold text-slate-200 truncate pr-2">{c.name}</span>
                          <span className="text-red-400 font-bold whitespace-nowrap">{c.occupancyRate}% ({c.booked}/{c.capacity})</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 mt-2">
                      Tất cả các lớp hiện tại đang vận hành trong ngưỡng an toàn, không có tình trạng quá tải hoặc nghẽn chỗ.
                    </p>
                  )}
                </div>
                <div className="pt-2.5 border-t border-slate-700/70 text-[11px] text-slate-300">
                  <strong className="text-amber-400">Tác vụ đề xuất:</strong> {highLoadClasses.length > 0 ? 'Mở thêm khung giờ ca học mới hoặc chuyển đổi sang phòng tập quy mô lớn hơn.' : 'Duy trì lịch tập hiện tại và theo dõi tiếp danh sách chờ.'}
                </div>
              </div>

              {/* Alert 2: Lớp tải thấp */}
              <div className="bg-slate-800/90 p-4 rounded-xl border border-amber-500/30 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5 text-xs">
                      <span className="material-symbols-outlined text-[16px]">trending_down</span>
                      Cảnh báo dưới tải (&lt; 40% công suất)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
                      {lowLoadClasses.length} lớp
                    </span>
                  </div>
                  {lowLoadClasses.length > 0 ? (
                    <div className="space-y-1.5 mt-2">
                      {lowLoadClasses.slice(0, 3).map(c => (
                        <div key={c.id || c.name} className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/60 flex items-center justify-between">
                          <span className="font-semibold text-slate-200 truncate pr-2">{c.name}</span>
                          <span className="text-amber-400 font-bold whitespace-nowrap">{c.occupancyRate}% ({c.booked}/{c.capacity})</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 mt-2">
                      Tỷ lệ đăng ký tất cả các lớp đang mở đều đạt từ 40% trở lên, tối ưu chi phí giảng viên và điện năng.
                    </p>
                  )}
                </div>
                <div className="pt-2.5 border-t border-slate-700/70 text-[11px] text-slate-300">
                  <strong className="text-amber-400">Tác vụ đề xuất:</strong> {lowLoadClasses.length > 0 ? 'Phối hợp chạy ưu đãi trải nghiệm học thử, ghép ca học hoặc khảo sát lại khung giờ thuận tiện.' : 'Các lớp duy trì hiệu suất ổn định.'}
                </div>
              </div>

              {/* Alert 3: Khai thác hạ tầng & Giữ chân hội viên */}
              <div className="bg-slate-800/90 p-4 rounded-xl border border-blue-500/30 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-blue-400 flex items-center gap-1.5 text-xs">
                      <span className="material-symbols-outlined text-[16px]">domain</span>
                      Hạ tầng sân bãi & Gia hạn hội viên
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-800">
                      Vận hành
                    </span>
                  </div>
                  <div className="space-y-2 mt-2">
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/60">
                      <span className="text-slate-400 text-[11px] block">Sân/Phòng thấp điểm nhất:</span>
                      <strong className="text-slate-200">
                        {processedRooms.length ? `${processedRooms[processedRooms.length - 1]?.name} (${processedRooms[processedRooms.length - 1]?.occupancyRate}% khai thác · ${processedRooms[processedRooms.length - 1]?.sessionsCount} ca)` : 'Chưa có dữ liệu'}
                      </strong>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700/60">
                      <span className="text-slate-400 text-[11px] block">Hội viên đã hết hạn gói:</span>
                      <strong className="text-amber-400">
                        {metrics.expiredMembers || 0} hội viên cần chăm sóc gia hạn
                      </strong>
                    </div>
                  </div>
                </div>
                <div className="pt-2.5 border-t border-slate-700/70 text-[11px] text-slate-300">
                  <strong className="text-amber-400">Tác vụ đề xuất:</strong> Mở bán ca thuê sân tự do vào các khung giờ trống và phân công lễ tân liên hệ gia hạn hội viên.
                </div>
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
                  Tra cứu chi tiết từng lớp học, huấn luyện viên, gói hội viên, bộ môn, sân bãi và nhật ký sự kiện.
                </p>
              </div>

              {/* Table Tab Switcher */}
              <div className="flex flex-wrap gap-2">
                {[
                  ['classes', '🏅 Bảng Lớp học'],
                  ['coaches', '👨‍🏫 Năng Suất HLV'],
                  ['packages', '💳 Gói Tập & Hội Viên'],
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

            {/* TABLE TAB 2: NĂNG SUẤT HUẤN LUYỆN VIÊN */}
            {activeTableTab === 'coaches' && (
              <section className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Chi tiết năng suất và khối lượng giảng dạy của Huấn luyện viên
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Đo lường số ca dạy, lượng học viên phục vụ và tỷ lệ lấp đầy lớp của từng HLV trong kỳ.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Search box */}
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-[18px]">
                        search
                      </span>
                      <input
                        type="text"
                        placeholder="Tìm theo tên HLV, môn..."
                        value={coachSearch}
                        onChange={e => setCoachSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    {/* Sort selector */}
                    <select
                      className="text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none"
                      value={coachSortBy}
                      onChange={e => setCoachSortBy(e.target.value)}
                    >
                      <option value="booked">Sắp xếp: Lượt HV tiếp nhận</option>
                      <option value="sessions">Sắp xếp: Số ca dạy nhiều nhất</option>
                      <option value="occupancy">Sắp xếp: % Lấp đầy lớp cao nhất</option>
                    </select>
                  </div>
                </div>

                {/* Coaches Table */}
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-chivo text-xs uppercase tracking-wider border-b border-slate-200">
                        <th className="py-3 px-3 w-14 text-center">Hạng</th>
                        <th className="py-3 px-4">Huấn Luyện Viên</th>
                        <th className="py-3 px-4">Chuyên Môn</th>
                        <th className="py-3 px-3 text-center">Số lớp quản lý</th>
                        <th className="py-3 px-3 text-center">Ca dạy trong kỳ</th>
                        <th className="py-3 px-4 text-center">Học viên tiếp nhận / Chỗ</th>
                        <th className="py-3 px-4 w-44">Tỷ lệ lấp đầy lớp</th>
                        <th className="py-3 px-3 text-center">Tình trạng tải</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {processedCoaches.length ? processedCoaches.map((c, idx) => {
                        const isTop1 = idx === 0 && coachSortBy === 'booked' && !coachSearch;
                        const isTop2 = idx === 1 && coachSortBy === 'booked' && !coachSearch;
                        const isTop3 = idx === 2 && coachSortBy === 'booked' && !coachSearch;

                        let badgeRank = `#${idx + 1}`;
                        let badgeRankColor = 'bg-slate-100 text-slate-600 border-slate-200';
                        if (isTop1) { badgeRank = '🥇 #1'; badgeRankColor = 'bg-amber-100 text-amber-900 border-amber-300 font-bold'; }
                        else if (isTop2) { badgeRank = '🥈 #2'; badgeRankColor = 'bg-slate-200 text-slate-800 border-slate-300 font-bold'; }
                        else if (isTop3) { badgeRank = '🥉 #3'; badgeRankColor = 'bg-amber-50 text-amber-800 border-amber-200 font-bold'; }

                        const studentsCount = c.totalStudents ?? c.booked ?? 0;
                        const capacityCount = c.capacity || c.totalCapacity || 0;

                        return (
                          <tr key={c.coachId || c.fullName} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs border ${badgeRankColor}`}>
                                {badgeRank}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center font-black text-xs">
                                  {(c.fullName || c.coachName || 'HLV').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-slate-900">{c.fullName || c.coachName}</div>
                                  {c.coachCode && (
                                    <span className="text-[10px] text-slate-400 font-medium">{c.coachCode}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                <span className="material-symbols-outlined text-[14px] text-slate-500">sports</span>
                                {c.specialization || c.specialty || 'Huấn luyện'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center font-semibold text-slate-700">
                              {c.classesCount || 0} lớp
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-slate-900">
                              {c.sessionsCount || 0} ca
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-black text-slate-900 text-base">{studentsCount}</span>
                              <span className="text-xs text-slate-400"> / {capacityCount} chỗ</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold">
                                  <span className={c.occupancyRate >= 20 ? 'text-emerald-600' : 'text-slate-600'}>
                                    {c.occupancyRate}%
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-normal">
                                    {capacityCount ? `${studentsCount}/${capacityCount}` : '0/0'}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-500 ${
                                      c.occupancyRate >= 20
                                        ? 'bg-emerald-500'
                                        : c.occupancyRate >= 10
                                        ? 'bg-blue-500'
                                        : 'bg-slate-400'
                                    }`}
                                    style={{ width: `${Math.min(100, c.occupancyRate)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              {c.sessionsCount >= 10 ? (
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  🔥 Lịch dày
                                </span>
                              ) : c.sessionsCount >= 3 ? (
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  ✅ Ổn định
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                  ⚠️ Nhận thêm ca
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                            Không có dữ liệu huấn luyện viên nào thỏa mãn điều kiện lọc.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* TABLE TAB 3: GÓI TẬP & HỘI VIÊN */}
            {activeTableTab === 'packages' && (
              <section className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Thống kê hiệu quả các Gói Hội Viên & Đăng ký
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Đo lường doanh số bán, số lượng hội viên đang sở hữu và tỷ trọng doanh thu từng gói.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Search box */}
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-[18px]">
                        search
                      </span>
                      <input
                        type="text"
                        placeholder="Tìm tên gói tập..."
                        value={packageSearch}
                        onChange={e => setPackageSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    {/* Sort selector */}
                    <select
                      className="text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none"
                      value={packageSortBy}
                      onChange={e => setPackageSortBy(e.target.value)}
                    >
                      <option value="revenue">Sắp xếp: Doanh thu cao nhất</option>
                      <option value="sold">Sắp xếp: Số lượt mua mới</option>
                      <option value="active">Sắp xếp: Số HV đang kích hoạt</option>
                    </select>
                  </div>
                </div>

                {/* Package Quick Stats Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block">Tổng gói mở bán</span>
                    <strong className="text-base font-black text-slate-900">{processedPackages.length} gói</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Hội viên có gói hiệu lực</span>
                    <strong className="text-base font-black text-emerald-700">{metrics.activeMembers || 0} hội viên</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Hội viên đã hết hạn</span>
                    <strong className="text-base font-black text-amber-700">{metrics.expiredMembers || 0} hội viên</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Doanh thu gói trong kỳ</span>
                    <strong className="text-base font-black text-slate-900">
                      {Number(processedPackages.reduce((sum, p) => sum + (p.revenueInPeriod || 0), 0)).toLocaleString('vi-VN')}đ
                    </strong>
                  </div>
                </div>

                {/* Packages Table */}
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-chivo text-xs uppercase tracking-wider border-b border-slate-200">
                        <th className="py-3 px-3 w-14 text-center">Hạng</th>
                        <th className="py-3 px-4">Tên Gói Hội Viên</th>
                        <th className="py-3 px-4">Bộ Môn</th>
                        <th className="py-3 px-3 text-center">Thời Hạn</th>
                        <th className="py-3 px-4 text-right">Đơn Giá</th>
                        <th className="py-3 px-3 text-center">HV Đang Dùng</th>
                        <th className="py-3 px-3 text-center">Mua Mới Trong Kỳ</th>
                        <th className="py-3 px-4 text-right">Doanh Thu Thuần</th>
                        <th className="py-3 px-3 text-center">Tỷ Trọng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {processedPackages.length ? processedPackages.map((pkg, idx) => {
                        const sportStyle = getSportStyle(pkg.sportName);
                        const isTop1 = idx === 0 && packageSortBy === 'revenue' && !packageSearch;
                        const isTop2 = idx === 1 && packageSortBy === 'revenue' && !packageSearch;
                        const isTop3 = idx === 2 && packageSortBy === 'revenue' && !packageSearch;

                        let badgeRank = `#${idx + 1}`;
                        let badgeRankColor = 'bg-slate-100 text-slate-600 border-slate-200';
                        if (isTop1) { badgeRank = '🥇 #1'; badgeRankColor = 'bg-amber-100 text-amber-900 border-amber-300 font-bold'; }
                        else if (isTop2) { badgeRank = '🥈 #2'; badgeRankColor = 'bg-slate-200 text-slate-800 border-slate-300 font-bold'; }
                        else if (isTop3) { badgeRank = '🥉 #3'; badgeRankColor = 'bg-amber-50 text-amber-800 border-amber-200 font-bold'; }

                        return (
                          <tr key={pkg.packageId || pkg.name} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs border ${badgeRankColor}`}>
                                {badgeRank}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-slate-400 text-[18px]">card_membership</span>
                                <span>{pkg.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${sportStyle.bg}`}>
                                <span className="material-symbols-outlined text-[13px]">{sportStyle.icon}</span>
                                {pkg.sportName || 'Toàn năng'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center font-semibold text-slate-700">
                              {pkg.durationMonths ? `${pkg.durationMonths} tháng` : 'Theo buổi'}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-slate-700">
                              {Number(pkg.price || 0).toLocaleString('vi-VN')}đ
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="font-bold text-slate-900 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                                {pkg.activeSubscribers || 0} HV
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center font-black text-slate-900">
                              +{pkg.soldInPeriod || 0}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-slate-900">
                              {Number(pkg.revenueInPeriod || 0).toLocaleString('vi-VN')}đ
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="font-bold text-xs text-sky-700">
                                {pkg.share || 0}%
                              </span>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                            Không có dữ liệu gói hội viên nào phù hợp với bộ lọc.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* TABLE TAB 4: DANH SÁCH BỘ MÔN */}
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
