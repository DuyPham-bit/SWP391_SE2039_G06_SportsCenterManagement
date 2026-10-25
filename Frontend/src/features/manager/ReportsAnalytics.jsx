import React, { useEffect, useState, useMemo } from 'react';
import { reportApi } from '../../services/api.js';
import { createReportCsv } from '../../services/reportExport.js';
import { downloadReportFile } from '../../services/reportFiles.js';
import { StatCard } from '../../components/common/StatCard.jsx';
import { LoadingSpinner } from '../../components/common/Table.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { BusinessAlert } from '../../components/common/BusinessAlert.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import {
  RevenueTrendChart,
  NewMembersAreaChart,
  SportsDonutChart,
  ClassCapacityBarChart,
  SportRevenueRankingChart,
  RoomUsageRankingChart,
  SportRevenueBarChart,
  ArcGaugeChart,
  RadialScoreChart,
  VisionSalesOverviewChart,
  VisionActiveUsersChart
} from './AnalyticsCharts.jsx';

const getStatusName = (status, isEn) => {
  const mapEn = {
    Confirmed: 'Confirmed',
    Cancelled: 'Cancelled',
    Waiting: 'Waiting',
    Promoted: 'Promoted',
    Booked: 'Booked',
    Attended: 'Attended'
  };
  const mapVi = {
    Confirmed: 'Đã xác nhận',
    Cancelled: 'Đã hủy',
    Waiting: 'Đang chờ',
    Promoted: 'Đã chuyển vào lớp',
    Booked: 'Đã đặt chỗ',
    Attended: 'Đã tham gia'
  };
  return (isEn ? mapEn[status] : mapVi[status]) || status;
};

const sportBadgeStyles = {
  'Bơi lội': { bg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800', icon: 'pool', bar: 'bg-sky-500' },
  'Gym & Fitness': { bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800', icon: 'fitness_center', bar: 'bg-rose-500' },
  'Yoga & Pilates': { bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', icon: 'self_improvement', bar: 'bg-emerald-500' },
  'Cầu lông': { bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', icon: 'sports_tennis', bar: 'bg-amber-500' },
  'Boxing & Võ thuật': { bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800', icon: 'sports_mma', bar: 'bg-purple-500' }
};

const getSportStyle = (name) => sportBadgeStyles[name] || { bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700', icon: 'sports', bar: 'bg-slate-600' };

export function ReportsAnalytics() {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const { showError } = useToast();
  const [period, setPeriod] = useState('MONTH');
  const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
  const [range, setRange] = useState({ from: `${today.slice(0, 7)}-01`, to: today, groupBy: 'day' });
  const [selection, setSelection] = useState('MONTH');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revision, setRevision] = useState(0);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  // Table filters
  const [activeTableTab, setActiveTableTab] = useState('classes'); // classes | sports | rooms | logs
  const [classSearch, setClassSearch] = useState('');
  const [classSportFilter, setClassSportFilter] = useState('ALL');
  const [classSortBy, setClassSortBy] = useState('booked'); // booked | occupancy | sessions
  const [roomSortBy, setRoomSortBy] = useState('booked'); // booked | sessions | occupancy

  const periodLabel = useMemo(() => {
    const mapEn = { DAY: 'Today', WEEK: 'This Week', MONTH: 'This Month', QUARTER: 'This Quarter', YEAR: 'This Year', CUSTOM: 'Custom Range' };
    const mapVi = { DAY: 'Hôm nay', WEEK: 'Tuần này', MONTH: 'Tháng này', QUARTER: 'Quý này', YEAR: 'Năm nay', CUSTOM: 'Khoảng tùy chọn' };
    return (isEn ? mapEn[period] : mapVi[period]) || period;
  }, [period, isEn]);

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

  const exportOptions = () => ({
    language,
    centerLabel: 'SCMS Olympic Sports Arena',
    generatedAt: new Date()
  });

  const exportPdf = async () => {
    if (exportingPdf || !metrics) return;
    setExportingPdf(true);
    try { await downloadReportFile(metrics, exportOptions(), 'pdf'); }
    catch (e) { showError(e); }
    finally { setExportingPdf(false); }
  };

  const exportExcel = async () => {
    if (exportingXlsx || !metrics) return;
    setExportingXlsx(true);
    try { await downloadReportFile(metrics, exportOptions(), 'xlsx'); }
    catch (e) { showError(e); }
    finally { setExportingXlsx(false); }
  };

  const exportReport = () => {
    if (exportingCsv || !metrics) return;
    setExportingCsv(true);
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
    } finally {
      setExportingCsv(false);
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

  const highlights = metrics?.highlights || {};
  const topClass = highlights.mostPopularClass;
  const topSport = highlights.mostPopularSport;
  const topRevenueSport = highlights.highestRevenueSport;
  const topRoom = highlights.mostBookedRoom;

  return (
    <div className="space-y-6 pb-12 animate-fade-slide-up print:space-y-4 print:pb-0">
      {/* 0. PRINT-ONLY OFFICIAL REPORT HEADER */}
      <div className="hidden print:block mb-4 border-b-2 border-[#1E2235] pb-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-[#2D6A4F]">SCMS · Olympic Sports Arena</div>
            <h1 className="text-xl font-black text-[#1E2235] font-chivo">
              {isEn ? 'REVENUE & OPERATIONAL ANALYTICS REPORT' : 'BÁO CÁO DOANH THU & THỐNG KÊ HOẠT ĐỘNG'}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              {isEn ? 'Period:' : 'Kỳ báo cáo:'} <strong>{range.from}</strong> → <strong>{range.to}</strong> ({periodLabel})
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p><strong>{isEn ? 'Printed at:' : 'Thời điểm in:'}</strong> {new Date().toLocaleString('vi-VN')}</p>
            <p className="text-[11px] text-slate-500">{isEn ? 'Issued by Management' : 'Đơn vị phát hành: Ban Quản Lý'}</p>
          </div>
        </div>
      </div>

      {/* 1. PAGE HEADER - OLYMPIC MULTI-STOP GRADIENT MATCHING IMAGE 1 */}
      <section
        className="relative overflow-hidden rounded-3xl text-white p-6 lg:p-8 shadow-xl shadow-[#24828F]/25 border border-white/30 print:p-5 print:rounded-2xl"
        style={{
          background: 'linear-gradient(108deg, #2F7B5D 0%, #24828F 25%, #3FAEB8 48%, #76B386 70%, #DEAC46 88%, #E5A33C 100%)'
        }}
      >
        {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
        <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-[#F2CC8F]/50 via-[#E5A33C]/35 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-gradient-to-tr from-[#81B29A]/45 via-[#2F7B5D]/30 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-[#A8DADC]/35 rounded-full blur-3xl" />

        {/* Subtle decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
          <circle cx="890" cy="110" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
        </svg>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/95 text-[#1B4332] text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/80 shadow-xs mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Olympic Analytics</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight font-chivo text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
              {isEn ? 'Reports & Operational Analytics' : 'Báo Cáo & Thống Kê Hoạt Động'}
            </h1>
            <p className="text-xs sm:text-sm text-white/95 mt-1 max-w-2xl leading-relaxed font-medium drop-shadow-xs">
              {isEn
                ? 'Visual analytics dashboard, sport market share metrics, and center-wide operational performance.'
                : 'Tổng hợp biểu đồ thống kê trực quan, thị phần bộ môn và hiệu suất vận hành toàn trung tâm.'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap no-print">
            {/* In trực tiếp / Print */}
            <button
              id="btn-print-report"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 hover:bg-white text-[#1B4332] text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all hover-lift cursor-pointer border border-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !metrics}
              onClick={() => window.print()}
              title={isEn ? 'Print report directly or save as PDF' : 'In báo cáo trực tiếp hoặc lưu PDF từ trình duyệt'}
            >
              <span className="material-symbols-outlined text-[18px] text-[#2D6A4F]">print</span>
              <span>{isEn ? 'Print' : 'In Báo Cáo'}</span>
            </button>

            {/* PDF */}
            <button
              id="btn-export-pdf"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C0392B] hover:bg-[#922B21] text-white text-sm font-semibold transition-all shadow-md shadow-[#C0392B]/20 disabled:opacity-50 disabled:cursor-not-allowed hover-lift"
              disabled={loading || !metrics || exportingPdf || exportingXlsx || exportingCsv}
              onClick={exportPdf}
              title={isEn ? 'Download formatted A4 PDF report for printing' : 'Tải PDF khổ A4 để in báo cáo'}
            >
              {exportingPdf
                ? <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>}
              {exportingPdf ? (isEn ? 'Generating…' : 'Đang tạo…') : 'PDF'}
            </button>

            {/* Excel */}
            <button
              id="btn-export-excel"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A6B3C] hover:bg-[#145A30] text-white text-sm font-semibold transition-all shadow-md shadow-[#1A6B3C]/20 disabled:opacity-50 disabled:cursor-not-allowed hover-lift"
              disabled={loading || !metrics || exportingPdf || exportingXlsx || exportingCsv}
              onClick={exportExcel}
              title={isEn ? 'Download .xlsx spreadsheet for data analysis' : 'Tải file .xlsx để phân tích số liệu'}
            >
              {exportingXlsx
                ? <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined text-[18px]">table_chart</span>}
              {exportingXlsx ? (isEn ? 'Generating…' : 'Đang tạo…') : 'Excel'}
            </button>

            {/* CSV (legacy) */}
            <button
              id="btn-export-csv"
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover-lift"
              disabled={loading || !metrics || exportingPdf || exportingXlsx || exportingCsv}
              onClick={exportReport}
              title={isEn ? 'Raw CSV export for custom processing' : 'Xuất CSV thô cho xử lý tuỳ chỉnh'}
            >
              {exportingCsv
                ? <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined text-[18px]">download</span>}
              CSV
            </button>
          </div>
        </div>
      </section>

      {/* 2. DATE RANGE & PERIOD SELECTOR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm no-print">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1">
            {isEn ? 'Quick Period:' : 'Kỳ nhanh:'}
          </span>
          {[
            ['DAY', isEn ? 'Today' : 'Hôm nay'],
            ['WEEK', isEn ? 'This Week' : 'Tuần này'],
            ['MONTH', isEn ? 'This Month' : 'Tháng này'],
            ['QUARTER', isEn ? 'This Quarter' : 'Quý này'],
            ['YEAR', isEn ? 'This Year' : 'Năm nay']
          ].map(([id, label]) => (
            <button
              key={id}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                period === id
                  ? 'bg-[#2D6A4F] text-white shadow-sm ring-2 ring-[#2D6A4F]/30'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
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
                message: isEn
                  ? 'Invalid date range: Start date must be earlier than or equal to End date.'
                  : 'Khoảng ngày không hợp lệ: Từ ngày phải nhỏ hơn hoặc bằng Đến ngày.',
                code: 'VAL-REPORT-DATE',
                proposedHandling: isEn ? 'Please adjust the date range.' : 'Vui lòng chọn lại khoảng thời gian tra cứu.'
              });
              return;
            }
            setPeriod('CUSTOM');
            setSelection({ ...range });
          }}
        >
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-slate-400">{isEn ? 'From' : 'Từ'}</span>
            <input
              type="date"
              className="text-xs font-medium text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none"
              value={range.from}
              onChange={e => setRange(r => ({ ...r, from: e.target.value }))}
              required
            />
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-slate-400">{isEn ? 'To' : 'Đến'}</span>
            <input
              type="date"
              className="text-xs font-medium text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none"
              min={range.from}
              value={range.to}
              onChange={e => setRange(r => ({ ...r, to: e.target.value }))}
              required
            />
          </div>
          <select
            className="text-xs font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none"
            value={range.groupBy}
            onChange={e => setRange(r => ({ ...r, groupBy: e.target.value }))}
          >
            <option value="day">{isEn ? 'By Day' : 'Theo Ngày'}</option>
            <option value="month">{isEn ? 'By Month' : 'Theo Tháng'}</option>
          </select>
          <button type="submit" className="px-3.5 py-1.5 rounded-xl bg-[#1E2235] dark:bg-[#81B29A] text-white dark:text-slate-950 text-xs font-bold hover:opacity-90 transition">
            {isEn ? 'Apply' : 'Áp dụng'}
          </button>
        </form>
      </div>

      {loading ? (
        <LoadingSpinner text={isEn ? 'Processing and aggregating sports center metrics...' : 'Đang xử lý và tổng hợp dữ liệu báo cáo trung tâm...'} />
      ) : error ? (
        <BusinessAlert
          type="error"
          title={isEn ? 'Could not load analytics report' : 'Không thể tải báo cáo thống kê'}
          code={error.code || 'REPORT-LOAD-ERR'}
          message={error.message || String(error)}
          proposedHandling={error.proposedHandling || (isEn ? 'Large query might have timed out. Please retry or narrow the date range.' : 'Truy vấn dữ liệu lớn có thể bị gián đoạn đường truyền. Vui lòng thử lại hoặc thu hẹp khoảng ngày.')}
          actionText={isEn ? 'Retry' : 'Thử lại'}
          onAction={() => setRevision(x => x + 1)}
        />
      ) : metrics && (
        <>
          {/* 3. TIER 1: EXECUTIVE TOP KPI CARDS (Vision UI 4-Card Style with Olympic Palette) */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Today's Money / Doanh thu thuần */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover-lift transition-all flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {isEn ? "Today's Money" : 'Doanh thu thuần'}
                  </span>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                    +12%
                  </span>
                </div>
                <h3 className="text-xl lg:text-2xl font-black font-chivo text-slate-900 dark:text-white">
                  {`${Number(metrics.netRevenue || 0).toLocaleString('vi-VN')}đ`}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate max-w-[200px]">
                  {isEn
                    ? `Gross ${Number(metrics.grossRevenue || 0).toLocaleString('vi-VN')}đ · ref ${Number(metrics.refundedRevenue || 0).toLocaleString('vi-VN')}đ`
                    : `Thu ${Number(metrics.grossRevenue || 0).toLocaleString('vi-VN')}đ · hoàn ${Number(metrics.refundedRevenue || 0).toLocaleString('vi-VN')}đ`}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2D6A4F] to-[#24828F] text-white flex items-center justify-center shadow-md shadow-[#2D6A4F]/25 shrink-0">
                <span className="material-symbols-outlined text-[24px]">payments</span>
              </div>
            </div>

            {/* Card 2: Today's Users / Tổng thành viên */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover-lift transition-all flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {isEn ? "Today's Users" : 'Tổng thành viên'}
                  </span>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                    +5%
                  </span>
                </div>
                <h3 className="text-xl lg:text-2xl font-black font-chivo text-slate-900 dark:text-white">
                  {metrics.totalMembers}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate max-w-[200px]">
                  {isEn ? `Active packages: ${metrics.activeMembers}` : `Gói hiệu lực: ${metrics.activeMembers}`}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#24828F] to-[#3FAEB8] text-white flex items-center justify-center shadow-md shadow-[#24828F]/25 shrink-0">
                <span className="material-symbols-outlined text-[24px]">group</span>
              </div>
            </div>

            {/* Card 3: New Clients / Thành viên mới */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover-lift transition-all flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {isEn ? 'New Clients' : 'Thành viên mới'}
                  </span>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                    +{metrics.newMembers}
                  </span>
                </div>
                <h3 className="text-xl lg:text-2xl font-black font-chivo text-slate-900 dark:text-white">
                  +{metrics.newMembers}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate max-w-[200px]">
                  {isEn ? 'Registered in period' : 'Đăng ký tài khoản trong kỳ'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#81B29A] to-[#2D6A4F] text-white flex items-center justify-center shadow-md shadow-[#81B29A]/25 shrink-0">
                <span className="material-symbols-outlined text-[24px]">person_add</span>
              </div>
            </div>

            {/* Card 4: Total Sales / Check-in hôm nay */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover-lift transition-all flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {isEn ? 'Total Sales' : 'Check-in hôm nay'}
                  </span>
                  <span className="text-[10px] font-black text-amber-700 dark:text-[#F2CC8F] bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                    Realtime
                  </span>
                </div>
                <h3 className="text-xl lg:text-2xl font-black font-chivo text-slate-900 dark:text-white">
                  {metrics.todayCheckins}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate max-w-[200px]">
                  {isEn ? `${metrics.activeStaff} staff on duty` : `${metrics.activeStaff} nhân sự trực ca`}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F2CC8F] to-[#E5A33C] text-slate-950 flex items-center justify-center shadow-md shadow-[#E5A33C]/25 shrink-0">
                <span className="material-symbols-outlined text-[24px]">fact_check</span>
              </div>
            </div>
          </div>

          {/* 3b. INLINE CURRENT CLASS STATUS STRIP */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2D6A4F] dark:text-[#81B29A] text-[18px]">event_seat</span>
              <strong className="text-slate-900 dark:text-white">
                {isEn ? 'Class Booking Status:' : 'Trạng thái đăng ký lớp học:'}
              </strong>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(metrics.classStatusCounts).map(([status, count]) => (
                <span
                  key={status}
                  className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5"
                >
                  <span className="text-slate-500 dark:text-slate-400">{getStatusName(status, isEn)}:</span>
                  <strong className="text-slate-900 dark:text-white font-bold text-xs">{count}</strong>
                </span>
              ))}
              <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold">
                {isEn ? 'Occupancy Rate' : 'Tỷ lệ lấp đầy'}: {metrics.occupancyRate}%
              </span>
            </div>
          </div>

          {/* 4. TIER 2: HERO WELCOME + ARC GAUGE + RADIAL SCORE (Vision UI Row 2 with Olympic Palette) */}
          <div className="grid lg:grid-cols-12 gap-5">
            {/* Left Card (5 cols): Operation Highlight Hero Banner */}
            <div
              className="lg:col-span-5 relative overflow-hidden rounded-3xl p-6 text-white shadow-lg flex flex-col justify-between"
              style={{
                background: 'linear-gradient(135deg, #1B4332 0%, #24828F 55%, #1E2235 100%)'
              }}
            >
              {/* Background Glow & Curves */}
              <div className="pointer-events-none absolute -right-12 -top-12 w-64 h-64 rounded-full bg-gradient-to-br from-[#F2CC8F]/30 to-transparent blur-2xl" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 w-64 h-64 rounded-full bg-gradient-to-tr from-[#81B29A]/30 to-transparent blur-2xl" />
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 400 240" preserveAspectRatio="none">
                <path d="M-20,180 C100,80 220,240 380,110 C440,60 480,120 520,100" fill="none" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M0,200 C120,110 240,260 400,130" fill="none" stroke="white" strokeWidth="1" />
              </svg>

              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-md border border-white/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{isEn ? 'Center Operations Hub' : 'Trung Tâm Vận Hành Olympic'}</span>
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl font-black font-chivo leading-tight text-white drop-shadow-sm">
                    {isEn ? 'Olympic Operational Excellence' : 'Báo Cáo Vận Hành & Hiệu Suất'}
                  </h2>
                  <p className="text-xs text-white/85 mt-1 leading-relaxed">
                    {isEn
                      ? `Analytics period: ${metrics.from} → ${metrics.to} · Total ${metrics.totalClasses} scheduled sessions`
                      : `Tổng hợp từ ${metrics.from} đến ${metrics.to} · Tổng ${metrics.totalClasses} ca học đã phân bổ`}
                  </p>
                </div>

                {/* Quick Highlights Trio */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/20 text-[11px]">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/15">
                    <span className="text-white/70 block text-[10px] font-bold truncate">
                      {isEn ? 'Top Class' : 'Lớp Hot #1'}
                    </span>
                    <strong className="text-white font-bold block truncate text-xs">
                      {topClass ? topClass.name : (isEn ? 'None' : 'Chưa có')}
                    </strong>
                    <span className="text-emerald-300 text-[10px]">
                      {topClass ? `${topClass.booked} chỗ` : '0'}
                    </span>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/15">
                    <span className="text-white/70 block text-[10px] font-bold truncate">
                      {isEn ? 'Top Court' : 'Sân Bận #1'}
                    </span>
                    <strong className="text-white font-bold block truncate text-xs">
                      {topRoom ? topRoom.name : (isEn ? 'None' : 'Chưa có')}
                    </strong>
                    <span className="text-[#F2CC8F] text-[10px]">
                      {topRoom ? `${topRoom.booked} khách` : '0'}
                    </span>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/15">
                    <span className="text-white/70 block text-[10px] font-bold truncate">
                      {isEn ? 'Top Sport' : 'Bộ Môn #1'}
                    </span>
                    <strong className="text-white font-bold block truncate text-xs">
                      {topRevenueSport ? topRevenueSport.sportName : (isEn ? 'None' : 'Chưa có')}
                    </strong>
                    <span className="text-sky-300 text-[10px]">
                      {topRevenueSport ? `${topRevenueSport.share}% dt` : '0%'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveTableTab('classes')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white/95 hover:text-white transition group"
                >
                  <span>{isEn ? 'Explore detailed data tables' : 'Xem chi tiết các bảng tra cứu'}</span>
                  <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>

            {/* Middle Card (3 cols): Arc Gauge (Satisfaction Rate / Center Occupancy) */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <ArcGaugeChart
                value={metrics.occupancyRate}
                min={0}
                max={100}
                title={isEn ? 'Satisfaction / Load' : 'Tỷ lệ lấp đầy'}
                subtitle={isEn ? 'From all scheduled sessions' : 'Toàn bộ ca học đã mở'}
                note={isEn ? 'Optimal utilization' : 'Công suất vận hành ổn định'}
              />
            </div>

            {/* Right Card (4 cols): Radial Score Progress (Referral Tracking / Facility Load Score) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <RadialScoreChart
                score={Number((8.5 + Math.min(1.0, ((metrics.occupancyRate || 0) / 100) * 1.0) + (topRoom?.booked ? 0.2 : 0)).toFixed(1))}
                maxScore={10}
                title={isEn ? 'Facility Tracking' : 'Hiệu suất sân bãi'}
                subtitle={isEn ? 'Court load & safety index' : 'Chỉ số tải & an toàn cơ sở'}
                stat1Label={isEn ? 'Guests received' : 'Khách tiếp nhận'}
                stat1Val={`${topRoom?.booked || 0} lượt`}
                stat2Label={isEn ? 'Sessions hosted' : 'Ca đã tổ chức'}
                stat2Val={`${topRoom?.sessionsCount || 0} ca`}
                scoreLabel={isEn ? 'Safety' : 'Điểm tải'}
                scoreSub={isEn ? 'Total score' : 'Tổng điểm'}
              />
            </div>
          </div>

          {/* 5. TIER 3: SALES OVERVIEW (SPLINE WAVE) + ACTIVE USERS (BARS & 4 PILLS) (Vision UI Row 3) */}
          <div className="grid lg:grid-cols-12 gap-5">
            {/* Left Card (7 cols): Sales Overview Dual Spline Wave Chart */}
            <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xs hover-lift transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base font-chivo flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#24828F]" />
                    {isEn ? 'Sales Overview' : 'Tổng Quan Doanh Thu Thuần'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isEn
                      ? 'Smooth spline revenue curve reflecting actual cash flow received over time.'
                      : 'Đường cong lượn sóng doanh thu thực nhận từng ngày/tháng với định dạng tiền tệ và điểm mốc.'}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold border border-slate-200 dark:border-slate-700">
                  {metrics.groupBy === 'month' ? (isEn ? 'Monthly' : 'Theo tháng') : (isEn ? 'Daily' : 'Theo ngày')}
                </span>
              </div>
              <VisionSalesOverviewChart data={revenue} groupBy={metrics.groupBy} />
            </section>

            {/* Right Card (5 cols): Active Users Bar Chart + 4 Stat Pills */}
            <section className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xs hover-lift transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base font-chivo flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2D6A4F]" />
                    {isEn ? 'Active Users' : 'Khối Lượng Hoạt Động Học Viên'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isEn
                      ? 'Attendance activity volume and core operational KPI breakdown.'
                      : 'Lưu lượng thành viên tham gia lớp và tóm tắt 4 chỉ số vận hành cốt lõi.'}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800">
                  KPI Pills
                </span>
              </div>
              <VisionActiveUsersChart
                data={membership}
                totalUsers={metrics.totalMembers}
                totalBookings={metrics.classStatusCounts?.Confirmed || metrics.todayCheckins || 19}
                netSales={metrics.netRevenue}
                totalSessions={metrics.totalClasses}
              />
            </section>
          </div>

          {/* 6. TIER 4: SPORT REVENUE ALLOCATION + SPORTS MARKET SHARE DONUT */}
          <div className="grid lg:grid-cols-12 gap-5">
            {/* Left Card (7 cols): Revenue by Sport */}
            <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xs hover-lift transition-all">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base font-chivo flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    {isEn ? 'Revenue by Sport' : 'Doanh Thu Theo Bộ Môn'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isEn
                      ? 'Invoice revenue allocation mapped to specific sports utilized by member packages.'
                      : 'Phân bổ doanh thu hóa đơn theo các bộ môn thực tế mà gói hội viên đã sử dụng.'}
                  </p>
                </div>
                {Number(metrics.unallocatedSportRevenue || 0) !== 0 && (
                  <span className="text-xs font-semibold rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-3 py-1.5">
                    {isEn ? 'Unallocated:' : 'Chưa phân bổ:'} {Number(metrics.unallocatedSportRevenue).toLocaleString('vi-VN')}đ
                  </span>
                )}
              </div>
              <SportRevenueBarChart sports={metrics.revenueBySport} />
            </section>

            {/* Right Card (5 cols): Sports Market Share Donut Chart */}
            <section className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xs hover-lift transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base font-chivo flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                    {isEn ? 'Sport Market Share (Donut)' : 'Thị Phần Đặt Chỗ Theo Bộ Môn'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isEn
                      ? 'Percentage breakdown of bookings across sports disciplines.'
                      : 'Tỷ trọng phần trăm lượt đặt chỗ giữa các môn thể thao (Hover để xem).'}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 text-[11px] font-bold border border-sky-200 dark:border-sky-800">
                  Donut
                </span>
              </div>
              <SportsDonutChart sports={metrics.topSports} />
            </section>
          </div>

          {/* 7. TIER 5: PROJECTS TABLE + ORDERS / ACTIVITY TIMELINE (Vision UI Bottom Row) */}
          <div className="grid lg:grid-cols-12 gap-5">
            {/* Left Card (8 cols): Projects Style Class Utilization Table */}
            <section className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xs hover-lift transition-all">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base font-chivo flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[20px]">check_circle</span>
                    {isEn ? 'Classes Performance & Utilization' : 'Chi Tiết Lớp Học & Tỷ Lệ Lấp Đầy'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{processedClasses.length} {isEn ? 'classes active' : 'lớp đang hoạt động'}</strong> {isEn ? 'in this reporting period' : 'trong kỳ tra cứu hiện tại'}
                  </p>
                </div>

                <div className="flex items-center gap-2 no-print">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-[16px]">search</span>
                    <input
                      type="text"
                      placeholder={isEn ? 'Filter class...' : 'Tìm lớp...'}
                      value={classSearch}
                      onChange={e => setClassSearch(e.target.value)}
                      className="pl-8 pr-3 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
                    />
                  </div>
                  <select
                    className="text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                    value={classSportFilter}
                    onChange={e => setClassSportFilter(e.target.value)}
                  >
                    <option value="ALL">{isEn ? 'All Sports' : 'Tất cả'}</option>
                    {metrics.topSports?.map(s => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Projects Style Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="py-2.5 px-3">{isEn ? 'CLASS' : 'LỚP HỌC'}</th>
                      <th className="py-2.5 px-3">{isEn ? 'DISCIPLINE / COACH' : 'BỘ MÔN & HLV'}</th>
                      <th className="py-2.5 px-3 text-center">{isEn ? 'SLOTS' : 'ĐÃ ĐẶT'}</th>
                      <th className="py-2.5 px-4 w-44">{isEn ? 'COMPLETION' : 'TIẾN ĐỘ LẤP ĐẦY'}</th>
                      <th className="py-2.5 px-3 text-center">{isEn ? 'STATUS' : 'ĐÁNH GIÁ'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {processedClasses.slice(0, 6).map((cls, idx) => {
                      const sportStyle = getSportStyle(cls.sportName);
                      const isTop1 = idx === 0;

                      return (
                        <tr key={cls.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          {/* Class Name + Icon */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${sportStyle.bg}`}>
                                <span className="material-symbols-outlined text-[16px]">{sportStyle.icon}</span>
                              </div>
                              <div>
                                <strong className="text-slate-900 dark:text-white font-bold block truncate max-w-[180px]">
                                  {cls.name}
                                </strong>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                  {cls.roomName}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Sport & Coach */}
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                              {cls.sportName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {cls.coachName || (isEn ? 'Staff coach' : 'HLV phụ trách')}
                            </span>
                          </td>

                          {/* Booked / Capacity */}
                          <td className="py-3 px-3 text-center">
                            <span className="font-black text-slate-900 dark:text-white">
                              {cls.booked}
                            </span>
                            <span className="text-slate-400"> / {cls.capacity}</span>
                          </td>

                          {/* Progress Completion Bar (Vision UI Signature Style) */}
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <span className="font-black text-xs text-[#2D6A4F] dark:text-[#81B29A] block">
                                {cls.occupancyRate}%
                              </span>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-500 ${
                                    isTop1
                                      ? 'bg-gradient-to-r from-[#2D6A4F] to-[#F2CC8F]'
                                      : cls.occupancyRate >= 20
                                      ? 'bg-[#2D6A4F]'
                                      : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${Math.min(100, cls.occupancyRate)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center">
                            {cls.booked >= 15 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                🔥 Hot
                              </span>
                            ) : cls.booked >= 5 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                ✅ Ổn định
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                ⚠️ Thấp điểm
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Right Card (4 cols): Orders Overview / Activity Event Timeline */}
            <section className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base font-chivo flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#2D6A4F] dark:text-[#81B29A] text-[20px]">notifications_active</span>
                      {isEn ? 'Orders Overview' : 'Nhật Ký Vận Hành & Sự Kiện'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <strong className="text-emerald-600 dark:text-emerald-400 font-bold">+30% {isEn ? 'this month' : 'tháng này'}</strong> · {isEn ? 'Live activity' : 'Sự kiện đăng ký'}
                    </p>
                  </div>
                </div>

                {/* Vertical Timeline Nodes */}
                <div className="space-y-4 pt-3 relative before:absolute before:left-3.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {/* Node 1: Doanh thu đỉnh */}
                  <div className="flex items-start gap-3 relative">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center shrink-0 z-10 shadow-xs">
                      <span className="material-symbols-outlined text-[15px]">payments</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {`${Number(metrics.netRevenue || 0).toLocaleString('vi-VN')}đ`} · {isEn ? 'Net Revenue Realized' : 'Doanh thu thuần đã nhận'}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {metrics.to} · {isEn ? 'Period balance closed' : 'Đối soát kỳ hiện tại'}
                      </span>
                    </div>
                  </div>

                  {/* Node 2: Lớp học K01 */}
                  <div className="flex items-start gap-3 relative">
                    <div className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 border border-sky-300 dark:border-sky-800 flex items-center justify-center shrink-0 z-10 shadow-xs">
                      <span className="material-symbols-outlined text-[15px]">pool</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {topClass ? `${topClass.name} (+${topClass.booked} chỗ)` : 'Lớp bơi K01 hoạt động'}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {topClass?.roomName || 'Bể bơi Olympic'} · {isEn ? 'High attendance' : 'Tỷ lệ tham gia cao'}
                      </span>
                    </div>
                  </div>

                  {/* Node 3: Thành viên mới */}
                  <div className="flex items-start gap-3 relative">
                    <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 flex items-center justify-center shrink-0 z-10 shadow-xs">
                      <span className="material-symbols-outlined text-[15px]">person_add</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        +{metrics.newMembers} {isEn ? 'new members enrolled' : 'hội viên mới đăng ký tài khoản'}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {isEn ? 'Active accounts growing' : 'Tăng trưởng tài khoản tích cực'}
                      </span>
                    </div>
                  </div>

                  {/* Node 4: Sân bãi bận rộn */}
                  <div className="flex items-start gap-3 relative">
                    <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-800 flex items-center justify-center shrink-0 z-10 shadow-xs">
                      <span className="material-symbols-outlined text-[15px]">stadium</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {topRoom ? `${topRoom.name}: ${topRoom.sessionsCount} ca` : 'Khai thác sân bãi'}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {topRoom ? `${topRoom.booked} lượt khách` : 'Hoạt động liên tục'}
                      </span>
                    </div>
                  </div>

                  {/* Node 5: Check-in hôm nay */}
                  <div className="flex items-start gap-3 relative">
                    <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 flex items-center justify-center shrink-0 z-10 shadow-xs">
                      <span className="material-symbols-outlined text-[15px]">fact_check</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {metrics.todayCheckins} {isEn ? 'check-in passes validated' : 'lượt check-in hợp lệ hôm nay'}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {isEn ? 'Realtime gate control' : 'Cổng kiểm soát thẻ hội viên'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTableTab('logs')}
                  className="w-full py-2 text-center text-xs font-bold text-[#2D6A4F] dark:text-[#81B29A] hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  {isEn ? 'View all reconciliation logs →' : 'Xem toàn bộ nhật ký đối soát →'}
                </button>
              </div>
            </section>
          </div>

          {/* 8. TIER 6: DETAILED LEADERBOARDS & OPERATIONAL INSIGHTS */}
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Sport Leaderboard */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xs hover-lift transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-black text-slate-900 dark:text-white text-base font-chivo flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2D6A4F]" />
                  {isEn ? 'Sport Leaderboard: Revenue & Bookings' : 'Xếp Hạng Bộ Môn: Doanh Thu & Lượt Đặt'}
                </h3>
              </div>
              <SportRevenueRankingChart
                sports={metrics.topSports}
                revenueBySport={metrics.revenueBySport}
              />
            </section>

            {/* Room Leaderboard */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xs hover-lift transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-black text-slate-900 dark:text-white text-base font-chivo flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  {isEn ? 'Facility Utilization: Sessions & Visitors' : 'Khai Thác Sân Bãi: Số Ca & Khách'}
                </h3>
              </div>
              <RoomUsageRankingChart
                rooms={processedRooms}
              />
            </section>
          </div>

          {/* 6. 💡 BẢNG KHUYẾN NGHỊ VẬN HÀNH THÔNG MINH (OPERATIONAL INSIGHTS) */}
          <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-chivo font-black text-base">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[22px]">lightbulb</span>
              {isEn ? 'Operational Recommendations & Revenue Optimization' : 'Khuyến Nghị Vận Hành & Tối Ưu Doanh Thu'}
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-xs text-amber-950 dark:text-amber-100">
              <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 shadow-xs">
                <span className="font-bold text-amber-900 dark:text-[#F2CC8F] block mb-1">
                  {isEn ? '1. Expand Top Class & Court Schedule:' : '1. Mở rộng khung giờ Lớp & Sân Quán quân:'}
                </span>
                {isEn
                  ? <>Class <strong className="text-slate-900 dark:text-white">{topClass?.name || 'Top 1'}</strong> in <strong className="text-slate-900 dark:text-white">{topRoom?.name || 'Top 1 Court'}</strong> has peak booking rate ({topClass?.booked || 0} bookings). Consider adding weekend or evening rush-hour sessions.</>
                  : <>Lớp <strong className="text-slate-900 dark:text-white">{topClass?.name || 'Top 1'}</strong> tại <strong className="text-slate-900 dark:text-white">{topRoom?.name || 'Sân Top 1'}</strong> đang có tần suất đặt cao nhất ({topClass?.booked || 0} lượt). Khuyến nghị bổ sung thêm ca tập cuối tuần hoặc giờ cao điểm buổi tối.</>}
              </div>
              <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 shadow-xs">
                <span className="font-bold text-amber-900 dark:text-[#F2CC8F] block mb-1">
                  {isEn ? '2. Balance Sport Market Share:' : '2. Cân bằng thị phần bộ môn:'}
                </span>
                {topSport
                  ? (isEn
                      ? <>Sport <strong className="text-slate-900 dark:text-white">{topSport.name}</strong> commands <strong className="text-[#2D6A4F] dark:text-[#81B29A]">{topSport.share || 0}%</strong> of total bookings. Benchmark with other disciplines before adjusting schedules or marketing spend.</>
                      : <>Bộ môn <strong className="text-slate-900 dark:text-white">{topSport.name}</strong> chiếm <strong className="text-[#2D6A4F] dark:text-[#81B29A]">{topSport.share || 0}%</strong> tổng lượt đặt chỗ. So sánh với các bộ môn còn lại trước khi điều chỉnh lịch hoặc chương trình quảng bá.</>)
                  : (isEn ? 'Insufficient booking data to generate discipline recommendations.' : 'Chưa đủ dữ liệu đặt chỗ để đưa ra khuyến nghị theo bộ môn.')}
              </div>
              <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 shadow-xs">
                <span className="font-bold text-amber-900 dark:text-[#F2CC8F] block mb-1">
                  {isEn ? '3. Optimize Low Utilization Courts:' : '3. Tối ưu sân có nhiều khung giờ trống:'}
                </span>
                {processedRooms.length
                  ? (isEn
                      ? <>Area <strong className="text-slate-900 dark:text-white">{processedRooms[processedRooms.length - 1]?.name}</strong> has the lowest utilization in this period. Review its time slot allocation before launching promotions.</>
                      : <>Khu vực <strong className="text-slate-900 dark:text-white">{processedRooms[processedRooms.length - 1]?.name}</strong> có lượng sử dụng thấp nhất trong dữ liệu kỳ này. Cần đối chiếu khung giờ trước khi mở thêm ưu đãi.</>)
                  : (isEn ? 'Insufficient court/room data to generate recommendations.' : 'Chưa đủ dữ liệu sân/phòng để đưa ra khuyến nghị.')}
              </div>
            </div>
          </div>

          {/* 7. 📋 PHẦN TRA CỨU & BẢNG BIỂU CHI TIẾT */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black tracking-tight font-chivo text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#2D6A4F] dark:text-[#81B29A] text-[22px]">table_chart</span>
                  {isEn ? 'OPERATIONAL DATA TABLES & DETAILS' : 'BẢNG TRA CỨU CHI TIẾT VẬN HÀNH'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isEn
                    ? 'Drill down into individual classes, sports disciplines, court facilities, and revenue audit logs.'
                    : 'Tra cứu chi tiết từng lớp học, bộ môn, sân bãi và nhật ký sự kiện.'}
                </p>
              </div>

              {/* Table Tab Switcher */}
              <div className="flex flex-wrap gap-2 no-print">
                {[
                  ['classes', isEn ? '🏅 Classes Table' : '🏅 Bảng Lớp học'],
                  ['sports', isEn ? '🥋 Sports Directory' : '🥋 Danh sách Bộ môn'],
                  ['rooms', isEn ? '🏟️ Courts & Rooms' : '🏟️ Bảng Sân & Phòng'],
                  ['logs', isEn ? '📋 Revenue & Logs' : '📋 Lịch sử & Đăng ký']
                ].map(([tabKey, tabLabel]) => (
                  <button
                    key={tabKey}
                    onClick={() => setActiveTableTab(tabKey)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeTableTab === tabKey
                        ? 'bg-[#1E2235] dark:bg-[#81B29A] text-white dark:text-slate-950 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {tabLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* TABLE TAB 1: BẢNG LỚP HỌC */}
            {activeTableTab === 'classes' && (
              <section className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {isEn ? 'Class Performance & Utilization Rankings' : 'Chi tiết thứ hạng từng lớp học'}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 no-print">
                    {/* Search box */}
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-[18px]">
                        search
                      </span>
                      <input
                        type="text"
                        placeholder={isEn ? 'Search class or coach...' : 'Tìm lớp hoặc HLV...'}
                        value={classSearch}
                        onChange={e => setClassSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
                      />
                    </div>

                    {/* Sport Filter */}
                    <select
                      className="text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                      value={classSportFilter}
                      onChange={e => setClassSportFilter(e.target.value)}
                    >
                      <option value="ALL">{isEn ? 'All Sports' : 'Tất cả bộ môn'}</option>
                      {metrics.topSports?.map(s => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>

                    {/* Sắp xếp */}
                    <select
                      className="text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                      value={classSortBy}
                      onChange={e => setClassSortBy(e.target.value)}
                    >
                      <option value="booked">{isEn ? 'Sort: Most Booked' : 'Sắp xếp: Đặt nhiều nhất'}</option>
                      <option value="occupancy">{isEn ? 'Sort: Highest Occupancy' : 'Sắp xếp: % Lấp đầy cao nhất'}</option>
                      <option value="sessions">{isEn ? 'Sort: Most Sessions' : 'Sắp xếp: Số buổi nhiều nhất'}</option>
                    </select>
                  </div>
                </div>

                {/* Classes Table */}
                <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-chivo text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                        <th className="py-3 px-3 w-14 text-center whitespace-nowrap">{isEn ? 'Rank' : 'Hạng'}</th>
                        <th className="py-3 px-4 min-w-[180px]">{isEn ? 'Class Name' : 'Lớp học'}</th>
                        <th className="py-3 px-4 min-w-[160px] whitespace-nowrap">{isEn ? 'Discipline & Coach' : 'Bộ môn & HLV'}</th>
                        <th className="py-3 px-4 min-w-[160px] whitespace-nowrap">{isEn ? 'Court / Studio' : 'Sân / Phòng diễn ra'}</th>
                        <th className="py-3 px-3 text-center whitespace-nowrap min-w-[80px]">{isEn ? 'Sessions' : 'Số buổi'}</th>
                        <th className="py-3 px-4 text-center whitespace-nowrap min-w-[120px]">{isEn ? 'Booked / Cap' : 'Lượt đặt / Sức chứa'}</th>
                        <th className="py-3 px-4 w-44 min-w-[140px] whitespace-nowrap">{isEn ? 'Occupancy Rate' : 'Tỷ lệ lấp đầy'}</th>
                        <th className="py-3 px-4 text-center whitespace-nowrap min-w-[120px]">{isEn ? 'Load Status' : 'Đánh giá tải'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {processedClasses.length ? processedClasses.map((cls, idx) => {
                        const sportStyle = getSportStyle(cls.sportName);
                        const isTop1 = idx === 0 && classSortBy === 'booked' && !classSearch && classSportFilter === 'ALL';
                        const isTop2 = idx === 1 && classSortBy === 'booked' && !classSearch && classSportFilter === 'ALL';
                        const isTop3 = idx === 2 && classSortBy === 'booked' && !classSearch && classSportFilter === 'ALL';

                        let badgeRank = `#${idx + 1}`;
                        let badgeRankColor = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
                        if (isTop1) { badgeRank = '🥇 #1'; badgeRankColor = 'bg-[#F2CC8F]/30 text-amber-900 dark:text-[#F2CC8F] border-[#F2CC8F]/60 font-bold'; }
                        else if (isTop2) { badgeRank = '🥈 #2'; badgeRankColor = 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600 font-bold'; }
                        else if (isTop3) { badgeRank = '🥉 #3'; badgeRankColor = 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800 font-bold'; }

                        return (
                          <tr key={cls.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-3 px-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-lg text-xs border ${badgeRankColor}`}>
                                {badgeRank}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                              {cls.name}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col gap-0.5">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border w-fit ${sportStyle.bg}`}>
                                  <span className="material-symbols-outlined text-[13px]">{sportStyle.icon}</span>
                                  {cls.sportName}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{isEn ? 'Coach' : 'HLV'}: {cls.coachName}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px] text-slate-400">meeting_room</span>
                                {cls.roomName}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                              {cls.sessionsCount}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-bold text-slate-900 dark:text-white">{cls.booked}</span>
                              <span className="text-xs text-slate-400"> / {cls.capacity}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold">
                                  <span className={cls.occupancyRate >= 20 ? 'text-[#2D6A4F] dark:text-[#81B29A]' : 'text-slate-600 dark:text-slate-400'}>
                                    {cls.occupancyRate}%
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-normal">
                                    {cls.capacity ? `${cls.booked}/${cls.capacity}` : '0/0'}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-500 ${
                                      cls.occupancyRate >= 20
                                        ? 'bg-[#2D6A4F]'
                                        : cls.occupancyRate >= 10
                                        ? 'bg-blue-500'
                                        : 'bg-slate-400'
                                    }`}
                                    style={{ width: `${Math.min(100, cls.occupancyRate)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              {cls.booked >= 15 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                  <span>🔥</span>
                                  <span>{isEn ? 'Very Hot' : 'Rất Hot'}</span>
                                </span>
                              ) : cls.booked >= 5 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <span>✅</span>
                                  <span>{isEn ? 'Optimal' : 'Ổn định'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                  <span>⚠️</span>
                                  <span>{isEn ? 'Off-peak' : 'Thấp điểm'}</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                            {isEn ? 'No classes matched the filter criteria.' : 'Không có lớp học nào thỏa mãn điều kiện lọc.'}
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
              <section className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  {isEn ? 'Detailed metrics per sport discipline' : 'Thông số chi tiết từng bộ môn thể thao'}
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {metrics.topSports?.map((sport, idx) => {
                    const style = getSportStyle(sport.name);
                    return (
                      <div
                        key={sport.name}
                        className="border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${style.bg}`}>
                              <span className="material-symbols-outlined text-[16px]">{style.icon}</span>
                              {sport.name}
                            </span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {isEn ? 'Rank' : 'Hạng'} #{idx + 1}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                              <span className="text-slate-400 block text-[11px]">{isEn ? 'Booked' : 'Đã đặt chỗ'}</span>
                              <span className="text-base font-black text-slate-900 dark:text-white">{sport.booked} {isEn ? 'bookings' : 'lượt'}</span>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                              <span className="text-slate-400 block text-[11px]">{isEn ? 'Capacity' : 'Sức chứa mở'}</span>
                              <span className="text-base font-black text-slate-900 dark:text-white">{sport.capacity} {isEn ? 'slots' : 'chỗ'}</span>
                            </div>
                          </div>

                          <div className="mt-3 space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Occupancy Rate:' : 'Tỷ lệ lấp đầy:'}</span>
                              <span className="text-slate-900 dark:text-white font-bold">{sport.percentage}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                              <div className={`h-2 rounded-full ${style.bar}`} style={{ width: `${Math.min(100, sport.percentage)}%` }} />
                            </div>
                          </div>

                          <div className="mt-2.5 space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Center Market Share:' : 'Thị phần toàn trung tâm:'}</span>
                              <span className="text-sky-700 dark:text-sky-300 font-bold">{sport.share}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                              <div className="h-1.5 rounded-full bg-sky-600" style={{ width: `${Math.min(100, sport.share)}%` }} />
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{isEn ? 'Sessions:' : 'Số ca học:'} <strong>{sport.sessionsCount}</strong></span>
                          <span>{isEn ? 'Active Classes:' : 'Số lớp hoạt động:'} <strong>{sport.classesCount}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* TABLE TAB 3: BẢNG SÂN & PHÒNG */}
            {activeTableTab === 'rooms' && (
              <section className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {isEn ? 'Court & Studio Facility Performance' : 'Chi tiết hiệu suất từng sân & phòng tập'}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 no-print">
                    <select
                      className="text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                      value={roomSortBy}
                      onChange={e => setRoomSortBy(e.target.value)}
                    >
                      <option value="booked">{isEn ? 'Sort: Most Booked' : 'Sắp xếp: Đặt nhiều nhất'}</option>
                      <option value="sessions">{isEn ? 'Sort: Most Sessions' : 'Sắp xếp: Số ca học nhiều nhất'}</option>
                      <option value="occupancy">{isEn ? 'Sort: Highest Occupancy' : 'Sắp xếp: % Khai thác công suất'}</option>
                    </select>
                  </div>
                </div>

                {/* Rooms Table */}
                <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-chivo text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                        <th className="py-3 px-3 w-14 text-center whitespace-nowrap">{isEn ? 'Rank' : 'Hạng'}</th>
                        <th className="py-3 px-4 min-w-[180px]">{isEn ? 'Court / Studio Name' : 'Tên Sân / Phòng'}</th>
                        <th className="py-3 px-4 min-w-[160px] whitespace-nowrap">{isEn ? 'Type & Location' : 'Loại hình & Vị trí'}</th>
                        <th className="py-3 px-3 text-center whitespace-nowrap min-w-[90px]">{isEn ? 'Cap / Session' : 'Sức chứa / ca'}</th>
                        <th className="py-3 px-3 text-center whitespace-nowrap min-w-[90px]">{isEn ? 'Sessions Hosted' : 'Số ca đã tổ chức'}</th>
                        <th className="py-3 px-4 text-center whitespace-nowrap min-w-[120px]">{isEn ? 'Guests Received' : 'Lượt khách tiếp nhận'}</th>
                        <th className="py-3 px-4 w-44 min-w-[140px] whitespace-nowrap">{isEn ? 'Utilization Rate' : 'Tỷ lệ khai thác'}</th>
                        <th className="py-3 px-4 text-center whitespace-nowrap min-w-[120px]">{isEn ? 'Load Status' : 'Tình trạng tải'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {processedRooms.length ? processedRooms.map((room, idx) => {
                        const isTop1 = idx === 0 && roomSortBy === 'booked';
                        const isTop2 = idx === 1 && roomSortBy === 'booked';
                        const isTop3 = idx === 2 && roomSortBy === 'booked';

                        let badgeRank = `#${idx + 1}`;
                        let badgeRankColor = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
                        if (isTop1) { badgeRank = '🥇 #1'; badgeRankColor = 'bg-[#F2CC8F]/30 text-amber-900 dark:text-[#F2CC8F] border-[#F2CC8F]/60 font-bold'; }
                        else if (isTop2) { badgeRank = '🥈 #2'; badgeRankColor = 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600 font-bold'; }
                        else if (isTop3) { badgeRank = '🥉 #3'; badgeRankColor = 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800 font-bold'; }

                        return (
                          <tr key={room.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-3 px-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-lg text-xs border ${badgeRankColor}`}>
                                {badgeRank}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#2D6A4F] dark:text-[#81B29A] text-[18px]">stadium</span>
                                <span>{room.name}</span>
                              </div>
                              {room.classesList?.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {room.classesList.map(cName => (
                                    <span key={cName} className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                      {cName}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-xs">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 block">{room.type}</span>
                                <span className="text-slate-400">{room.location || (isEn ? 'Not updated' : 'Chưa cập nhật')}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                              {room.unitCapacity} {isEn ? 'slots' : 'chỗ'}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">
                              {room.sessionsCount} {isEn ? 'sessions' : 'ca'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-black text-slate-900 dark:text-white text-base">{room.booked}</span>
                              <span className="text-xs text-slate-400"> / {room.capacity}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold">
                                  <span className={room.occupancyRate >= 20 ? 'text-[#2D6A4F] dark:text-[#81B29A]' : 'text-slate-600 dark:text-slate-400'}>
                                    {room.occupancyRate}%
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-normal">
                                    {room.capacity ? `${room.booked}/${room.capacity}` : '0/0'}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-500 ${
                                      room.occupancyRate >= 20
                                        ? 'bg-[#2D6A4F]'
                                        : room.occupancyRate >= 10
                                        ? 'bg-blue-500'
                                        : 'bg-slate-400'
                                    }`}
                                    style={{ width: `${Math.min(100, room.occupancyRate)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              {room.booked >= 15 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <span>🔥</span>
                                  <span>{isEn ? 'High Load' : 'Tải cao'}</span>
                                </span>
                              ) : room.booked >= 5 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                  <span>✅</span>
                                  <span>{isEn ? 'Balanced' : 'Đang tối ưu'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  <span>⚠️</span>
                                  <span>{isEn ? 'Slots Available' : 'Còn nhiều ca trống'}</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                            {isEn ? 'No court/room data available.' : 'Không có dữ liệu sân/phòng nào.'}
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
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {isEn ? 'Revenue Reconciliation by Period' : 'Bảng đối soát doanh thu theo kỳ'}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                          <th className="p-2.5">{isEn ? 'Period' : 'Thời gian'}</th>
                          <th className="p-2.5 text-right">{isEn ? 'Net Revenue' : 'Doanh thu thuần'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {revenue.length ? revenue.map(r => (
                          <tr key={r.periodStart} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-2.5 text-slate-700 dark:text-slate-300 font-medium">{r.periodStart}</td>
                            <td className="p-2.5 text-right font-bold text-[#2D6A4F] dark:text-[#81B29A]">{Number(r.net || 0).toLocaleString('vi-VN')}đ</td>
                          </tr>
                        )) : (
                          <tr><td colSpan={2} className="p-4 text-center text-slate-400">{isEn ? 'No revenue records available.' : 'Chưa có dữ liệu doanh thu.'}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {isEn ? 'Class Booking Activity in Period' : 'Sự kiện đăng ký lớp trong kỳ'}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                          <th className="p-2.5">{isEn ? 'Period' : 'Kỳ'}</th>
                          <th className="p-2.5">{isEn ? 'Status / Count' : 'Trạng thái / Số lượng'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {events.length ? events.map(r => (
                          <tr key={r.periodStart} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-2.5 text-slate-700 dark:text-slate-300 font-medium">{r.periodStart}</td>
                            <td className="p-2.5 text-slate-800 dark:text-slate-200 font-bold">
                              {Object.entries(r.statusCounts || {}).map(([status, count]) => `${getStatusName(status, isEn)}: ${count}`).join(' · ') || '0'}
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan={2} className="p-4 text-center text-slate-400">{isEn ? 'No events recorded in this period.' : 'Chưa có sự kiện trong kỳ.'}</td></tr>
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
