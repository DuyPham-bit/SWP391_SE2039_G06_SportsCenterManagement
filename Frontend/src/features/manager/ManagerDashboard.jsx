import { parseApiDate } from '../../utils/dateTime.js';
import React, { useEffect, useState, useMemo } from 'react';
import { reportApi, systemApi } from '../../services/api.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import {
  MiniSparkline,
  RoomStatusDonutChart,
  FacilityOccupancyBars,
  PeriodCollectionRadialGauge,
  MemberDocumentsStackedBars,
  TwelveMonthRevenueExpensesProfitChart,
  ThreeMonthExpensesBars,
  SixMonthContractExpiryBars
} from './ManagerOverviewCharts.jsx';

function formatLogAction(action, isEn) {
  const act = String(action || '').toUpperCase();
  if (act.includes('BOOK') && !act.includes('CANCEL')) {
    return {
      label: isEn ? 'Booked Class Session' : 'Đặt ca lớp học',
      icon: 'event_available',
      badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60'
    };
  }
  if (act.includes('CANCEL')) {
    return {
      label: isEn ? 'Cancelled Booking' : 'Hủy đăng ký lớp',
      icon: 'event_busy',
      badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60'
    };
  }
  if (act.includes('PACKAGE') || act.includes('MEMBERSHIP')) {
    return {
      label: isEn ? 'Updated Package' : 'Cập nhật gói tập',
      icon: 'card_membership',
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60'
    };
  }
  if (act.includes('PAYMENT') || act.includes('INVOICE') || act.includes('REFUND')) {
    return {
      label: isEn ? 'Payment / Billing' : 'Thanh toán & Hóa đơn',
      icon: 'receipt_long',
      badgeClass: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/60'
    };
  }
  if (act.includes('STAFF') || act.includes('COACH') || act.includes('ASSIGN')) {
    return {
      label: isEn ? 'Staff / Coach Action' : 'Điều phối nhân sự & HLV',
      icon: 'badge',
      badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60'
    };
  }
  return {
    label: action?.replace(/[._]/g, ' ') || (isEn ? 'System Log' : 'Nhật ký hệ thống'),
    icon: 'tune',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
  };
}

function formatLogTime(timestamp, isEn) {
  if (!timestamp) return '—';
  try {
    const d = parseApiDate(timestamp);
    if (isNaN(d.getTime())) return timestamp;
    return d.toLocaleString(isEn ? 'en-US' : 'vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  } catch {
    return timestamp;
  }
}

export function ManagerDashboard() {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const shortcuts = [
    {
      path: 'members',
      icon: 'group',
      title: isEn ? 'Member Management' : 'Quản lý thành viên',
      description: isEn ? 'Profiles, account status and package history.' : 'Hồ sơ, trạng thái tài khoản và lịch sử gói.',
      tag: isEn ? 'Members' : 'Hội viên',
      theme: {
        iconBg: 'bg-emerald-50 dark:bg-emerald-950/50 text-[#2D6A4F] dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60',
        hoverCard: 'hover:border-[#81B29A] dark:hover:border-emerald-600 hover:shadow-emerald-500/10 hover:bg-[#81B29A]/5',
        badge: 'bg-emerald-100/70 text-[#2D6A4F] dark:bg-emerald-950/70 dark:text-emerald-300'
      }
    },
    {
      path: 'staff',
      icon: 'badge',
      title: isEn ? 'Coaches & Staff' : 'Huấn luyện viên & nhân sự',
      description: isEn ? 'Appointments, staff info and personnel status.' : 'Bổ nhiệm, cập nhật thông tin và trạng thái nhân sự.',
      tag: isEn ? 'Staff' : 'Nhân sự',
      theme: {
        iconBg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60',
        hoverCard: 'hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-amber-500/10 hover:bg-amber-50/20',
        badge: 'bg-amber-100/70 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
      }
    },
    {
      path: 'classes-rooms',
      icon: 'sports_score',
      title: isEn ? 'Classes, Sports & Courts' : 'Lớp, bộ môn, phòng & lịch',
      description: isEn ? 'Create classes, manage sports, training courts and schedule.' : 'Tạo lớp, quản lý bộ môn, phòng tập và lịch học.',
      tag: isEn ? 'Courts' : 'Lớp & Sân',
      theme: {
        iconBg: 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border border-teal-200/80 dark:border-teal-800/60',
        hoverCard: 'hover:border-teal-400 dark:hover:border-teal-600 hover:shadow-teal-500/10 hover:bg-teal-50/20',
        badge: 'bg-teal-100/70 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300'
      }
    },
    {
      path: 'coach-assignment',
      icon: 'assignment_ind',
      title: isEn ? 'Coach Assignment' : 'Phân công HLV',
      description: isEn ? 'Assign head coaches and resolve schedule conflicts.' : 'Chọn HLV phụ trách và kiểm tra trùng lịch.',
      tag: isEn ? 'Assignment' : 'Phân công',
      theme: {
        iconBg: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60',
        hoverCard: 'hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-indigo-500/10 hover:bg-indigo-50/20',
        badge: 'bg-indigo-100/70 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300'
      }
    },
    {
      path: 'coach-operations',
      icon: 'diversity_3',
      title: isEn ? 'Coach Team Operations' : 'Vận hành đội ngũ HLV',
      description: isEn ? 'Workload metrics, qualification audit and coaching KPIs.' : 'Chỉ số khối lượng công việc, chứng chỉ và KPI giảng dạy.',
      tag: isEn ? 'Coaching' : 'HLV & KPI',
      theme: {
        iconBg: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60',
        hoverCard: 'hover:border-rose-400 dark:hover:border-rose-600 hover:shadow-rose-500/10 hover:bg-rose-50/20',
        badge: 'bg-rose-100/70 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
      }
    },
    {
      path: 'reports',
      icon: 'analytics',
      title: isEn ? 'Time-based Reports' : 'Báo cáo theo thời gian',
      description: isEn ? 'Members, class bookings, attendance and revenue.' : 'Thành viên, đăng ký lớp và doanh thu.',
      tag: isEn ? 'Analytics' : 'Báo cáo',
      theme: {
        iconBg: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border border-sky-200/80 dark:border-sky-800/60',
        hoverCard: 'hover:border-sky-400 dark:hover:border-sky-600 hover:shadow-sky-500/10 hover:bg-sky-50/20',
        badge: 'bg-sky-100/70 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300'
      }
    },
    {
      path: 'packages',
      icon: 'card_membership',
      title: isEn ? 'Packages & Pricing' : 'Gói tập & học phí',
      description: isEn ? 'Set prices, validity and package availability.' : 'Thiết lập giá, thời hạn và trạng thái gói.',
      tag: isEn ? 'Pricing' : 'Gói tập',
      theme: {
        iconBg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60',
        hoverCard: 'hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-amber-500/10 hover:bg-amber-50/20',
        badge: 'bg-amber-100/70 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
      }
    },
    {
      path: 'audit-logs',
      icon: 'history',
      title: isEn ? 'Audit Logs' : 'Lịch sử thao tác',
      description: isEn ? 'Look up critical system changes and audit trails.' : 'Tra cứu các thay đổi quan trọng trên hệ thống.',
      tag: isEn ? 'Audit' : 'Nhật ký',
      theme: {
        iconBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700',
        hoverCard: 'hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-slate-500/10 hover:bg-slate-50/40',
        badge: 'bg-slate-200/70 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
      }
    },
    {
      path: 'home-content',
      icon: 'dashboard_customize',
      title: isEn ? 'Home Content & Media' : 'Nội dung trang chủ & đa phương tiện',
      description: isEn ? 'Customize landing page content, sports, courts and cloud media.' : 'Tùy biến nội dung landing page, môn học, cụm sân bãi và hình ảnh đám mây.',
      tag: isEn ? 'CMS' : 'Trang chủ',
      theme: {
        iconBg: 'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border border-orange-200/80 dark:border-orange-800/60',
        hoverCard: 'hover:border-orange-400 dark:hover:border-orange-600 hover:shadow-orange-500/10 hover:bg-orange-50/20',
        badge: 'bg-orange-100/70 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300'
      }
    }
  ];

  const [metrics, setMetrics] = useState(null);
  const [period, setPeriod] = useState('30D');
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [logError, setLogError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setLogError('');
    Promise.allSettled([reportApi.getOverview(period), systemApi.getAuditLogs()]).then(([overview, activity]) => {
      if (!active) return;
      if (overview.status === 'fulfilled') setMetrics(overview.value);
      else {
        setMetrics(null);
        setError(overview.reason?.message || 'Không thể tải dữ liệu bảng điều khiển.');
      }
      if (activity.status === 'fulfilled') setLogs(activity.value?.slice(0, 6) || []);
      else {
        setLogs([]);
        setLogError(activity.reason?.message || '');
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [revision, period]);

  const topClasses = metrics?.topClasses || [];

  // Dynamic greeting based on current time
  const currentHour = new Date().getHours();
  const greetingText = isEn
    ? currentHour < 12
      ? 'Good morning,'
      : currentHour < 18
      ? 'Good afternoon,'
      : 'Good evening,'
    : currentHour < 12
    ? 'Chào buổi sáng,'
    : currentHour < 18
    ? 'Chào buổi chiều,'
    : 'Chào buổi tối,';

  const sportBadgeStyles = {
    'Bơi lội': { bg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800', icon: 'pool' },
    'Gym & Fitness': { bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800', icon: 'fitness_center' },
    'Yoga & Pilates': { bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', icon: 'self_improvement' },
    'Cầu lông': { bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', icon: 'sports_tennis' },
    'Boxing & Võ thuật': { bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800', icon: 'sports_mma' }
  };
  const getSportStyle = (name) => sportBadgeStyles[name] || { bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700', icon: 'sports' };

  return (
    <div className="space-y-5 animate-fade-slide-up pb-8">
      {/* 1. TOP MINIMALIST BREADCRUMB & CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
            <span>Pages</span>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold">{isEn ? 'Dashboard' : 'Bảng điều khiển'}</span>
          </div>
          <h1 className="text-2xl font-black font-chivo text-slate-900 dark:text-white mt-0.5 tracking-tight flex items-center gap-2.5">
            <span>{isEn ? 'Executive Dashboard' : 'Bảng Điều Hành Trung Tâm'}</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Olympic Sports Arena</span>
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            {[
              { id: '30D', label: isEn ? '30 Days' : '30 ngày qua' },
              { id: 'MONTH', label: isEn ? 'This Month' : 'Tháng 11' },
              { id: 'LAST_MONTH', label: isEn ? 'Last Month' : 'Tháng 10' },
              { id: 'QUARTER', label: isEn ? 'Quarter' : 'Quý 4' }
            ].map((p) => {
              const active = period === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-[#2D6A4F] dark:text-[#81B29A] shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setRevision(x => x + 1)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-xs hover-lift"
          >
            <span className={`material-symbols-outlined text-[16px] text-[#2D6A4F] dark:text-[#81B29A] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{isEn ? 'Refresh' : 'Làm mới'}</span>
          </button>
          <a
            href="#/manager/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold transition-all shadow-xs hover-lift"
          >
            <span className="material-symbols-outlined text-[16px]">monitoring</span>
            <span>{isEn ? 'Reports' : 'Báo cáo chi tiết'}</span>
          </a>
        </div>
      </div>

      {loading && !metrics ? (
        <LoadingSpinner text={isEn ? 'Loading management dashboard...' : 'Đang tải dữ liệu bảng điều khiển...'} />
      ) : error ? (
        <div role="alert" className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      ) : (
        <>
          {/* ========================================================
              2. GREETING & ALERT HEADER WITH 4 PILL BUTTONS (EXACT REPLICA)
             ======================================================== */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Left: Greeting + Operational Alerts */}
              <div className="space-y-1">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium block">
                  {greetingText}
                </span>
                <h2 className="text-xl sm:text-2xl font-black font-chivo text-slate-900 dark:text-white tracking-tight">
                  {isEn ? 'Administrator' : 'Quản trị viên'}
                </h2>
                <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 pt-0.5 leading-relaxed">
                  {isEn ? (
                    <>
                      Today there are <strong className="font-bold text-slate-900 dark:text-white">6 contracts expiring soon</strong>, <strong className="font-bold text-slate-900 dark:text-white">8 rooms pending collection in Nov 2026</strong> and <strong className="font-bold text-slate-900 dark:text-white">46 members missing ID info</strong>.
                    </>
                  ) : (
                    <>
                      Hôm nay có <strong className="font-bold text-slate-900 dark:text-white">6 hợp đồng sắp hết hạn</strong>, <strong className="font-bold text-slate-900 dark:text-white">8 phòng chưa thu kỳ 11/2026</strong> và <strong className="font-bold text-slate-900 dark:text-white">46 khách thiếu CCCD</strong>.
                    </>
                  )}
                </p>
              </div>

              {/* Right: 4 Action Pill Buttons in 2 Columns */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 shrink-0">
                <a
                  href="#/manager/members"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold transition-all shadow-2xs hover:shadow-xs group hover-lift"
                >
                  <span className="material-symbols-outlined text-[17px] text-blue-500 group-hover:scale-110 transition-transform">
                    person_add
                  </span>
                  <span>{isEn ? '+ Add Member' : '+ Thêm khách'}</span>
                </a>

                <a
                  href="#/manager/packages"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold transition-all shadow-2xs hover:shadow-xs group hover-lift"
                >
                  <span className="material-symbols-outlined text-[17px] text-emerald-500 group-hover:scale-110 transition-transform">
                    description
                  </span>
                  <span>{isEn ? 'Create Contract' : 'Lập hợp đồng'}</span>
                </a>

                <a
                  href="#/counter/invoices"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold transition-all shadow-2xs hover:shadow-xs group hover-lift"
                >
                  <span className="material-symbols-outlined text-[17px] text-amber-500 group-hover:scale-110 transition-transform">
                    payments
                  </span>
                  <span>{isEn ? 'Collect Payment' : 'Thu tiền'}</span>
                </a>

                <a
                  href="#/manager/classes-rooms"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold transition-all shadow-2xs hover:shadow-xs group hover-lift"
                >
                  <span className="material-symbols-outlined text-[17px] text-purple-500 group-hover:scale-110 transition-transform">
                    grid_view
                  </span>
                  <span>{isEn ? 'Room Layout' : 'Sơ đồ phòng'}</span>
                </a>
              </div>
            </div>
          </div>

          {/* ========================================================
              3. ROW 1: 6 TOP KPI CARDS (EXACT REPLICA)
             ======================================================== */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
            {/* Card 1: TỔNG PHÒNG */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {isEn ? 'TOTAL ROOMS' : 'TỔNG PHÒNG'}
                  </span>
                  <h3 className="text-2xl font-black font-chivo text-slate-900 dark:text-white mt-1">
                    {metrics?.totalRooms ?? 41}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#165B53] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">meeting_room</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 truncate">
                {isEn ? '4 centers · 1 maintenance' : '4 cơ sở · 1 bảo trì'}
              </p>
            </div>

            {/* Card 2: ĐANG THUÊ */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {isEn ? 'OCCUPIED' : 'ĐANG THUÊ'}
                  </span>
                  <h3 className="text-2xl font-black font-chivo text-slate-900 dark:text-white mt-1">
                    {metrics?.activeRooms ?? 26}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">home</span>
                </div>
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {isEn ? '65% occupancy · 48 guests' : 'Lấp đầy 65% · 48 khách'}
                </p>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                  <div className="bg-[#10B981] h-1 rounded-full w-[65%]" />
                </div>
              </div>
            </div>

            {/* Card 3: PHÒNG TRỐNG */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div className="pointer-events-none absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-xl" />
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {isEn ? 'VACANT' : 'PHÒNG TRỐNG'}
                  </span>
                  <h3 className="text-2xl font-black font-chivo text-slate-900 dark:text-white mt-1">
                    {metrics?.vacantRooms ?? 14}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#3B82F6] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">key</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 truncate relative z-10">
                {isEn ? 'Ready for rental' : 'Sẵn sàng cho thuê'}
              </p>
            </div>

            {/* Card 4: HĐ SẮP HẾT HẠN */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {isEn ? 'EXPIRING' : 'HĐ SẮP HẾT HẠN'}
                  </span>
                  <h3 className="text-2xl font-black font-chivo text-slate-900 dark:text-white mt-1">
                    {metrics?.expiringContracts ?? 6}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#EA580C] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 truncate">
                {isEn ? '0 overdue · Next 30 days' : 'Không có HĐ quá hạn · 30 ngày tới'}
              </p>
            </div>

            {/* Card 5: ĐÃ THU KỲ 11/2026 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {isEn ? 'COLLECTED 11/2026' : 'ĐÃ THU KỲ 11/2026'}
                    </span>
                    <h3 className="text-2xl font-black font-chivo text-slate-900 dark:text-white mt-1">
                      {metrics?.monthlyRevenue ? `${(metrics.monthlyRevenue / 1000000).toFixed(1)} tr` : '58.7 tr'}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#D97706] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">payments</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                  <span className="text-rose-500 font-bold">▼ 41%</span> {isEn ? 'vs last · 8 unpaid' : 'so kỳ trước · 8 phòng chưa thu'}
                </p>
              </div>
              <div className="mt-2 -mb-1">
                <MiniSparkline color="#F97316" data={[40, 55, 48, 62, 50, 68, 52, 60, 48, 38]} />
              </div>
            </div>

            {/* Card 6: LỢI NHUẬN 11/2026 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {isEn ? 'PROFIT 11/2026' : 'LỢI NHUẬN 11/2026'}
                    </span>
                    <h3 className="text-2xl font-black font-chivo text-slate-900 dark:text-white mt-1">
                      {metrics?.netRevenue ? `${(metrics.netRevenue / 1000000).toFixed(1)} tr` : '50.1 tr'}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">trending_up</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {isEn ? 'Rev 61 tr · exp 10.9 tr' : 'Thu 61 tr · chi 10.9 tr'}
                </p>
              </div>
              <div className="mt-2 -mb-1">
                <MiniSparkline color="#10B981" data={[30, 42, 38, 50, 45, 58, 52, 65, 58, 62]} />
              </div>
            </div>
          </div>

          {/* ========================================================
              4. ROW 2: 4 ANALYTICS CARDS (EXACT REPLICA)
             ======================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
            {/* Card 1: Trạng thái phòng (Donut Chart) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white font-chivo">
                  {isEn ? 'Room Status' : 'Trạng thái phòng'}
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  {metrics?.totalRooms ?? 41} {isEn ? 'rooms' : 'phòng'}
                </span>
              </div>
              <div className="py-2 flex-1 flex items-center justify-center">
                <RoomStatusDonutChart total={metrics?.totalRooms ?? 41} />
              </div>
            </div>

            {/* Card 2: Lấp đầy theo cơ sở (Horizontal Bars) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white font-chivo">
                  {isEn ? 'Facility Occupancy' : 'Lấp đầy theo cơ sở'}
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  {isEn ? 'Occupied / total' : 'Đang thuê / tổng'}
                </span>
              </div>
              <div className="py-2 flex-1">
                <FacilityOccupancyBars />
              </div>
            </div>

            {/* Card 3: Thu tiền kỳ 11/2026 (Radial Open Arc Gauge) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white font-chivo">
                  {isEn ? 'Period Collection' : 'Thu tiền kỳ 11/2026'}
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  {isEn ? 'Remaining 21.6 tr' : 'Còn 21.6 tr'}
                </span>
              </div>
              <div className="py-2 flex-1 flex items-center justify-center">
                <PeriodCollectionRadialGauge
                  percentage={69}
                  collectedText={isEn ? 'Collected 18/26 rooms' : 'Đã thu 18/26 phòng'}
                  remainingText={isEn ? 'Remaining 21.6 tr' : 'Còn 21.6 tr'}
                />
              </div>
            </div>

            {/* Card 4: Hồ sơ khách đang ở (Stacked Horizontal Bars) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white font-chivo">
                  {isEn ? 'Active Resident Profiles' : 'Hồ sơ khách đang ở'}
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  {metrics?.totalMembers ?? 48} {isEn ? 'members' : 'khách'}
                </span>
              </div>
              <div className="py-2 flex-1">
                <MemberDocumentsStackedBars totalMembers={metrics?.totalMembers ?? 48} />
              </div>
            </div>
          </div>

          {/* ========================================================
              5. ROW 3: 3 DETAILED INSIGHT CARDS (EXACT REPLICA)
             ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Card 1 (6 cols): Thu - chi - lợi nhuận 12 tháng */}
            <section className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs hover-lift transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white font-chivo">
                  {isEn ? '12-Month Revenue – Expenses – Profit' : 'Thu – chi – lợi nhuận 12 tháng'}
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  {isEn ? 'Nov 2026 in progress' : 'Tháng 11/2026 đang thu dở'}
                </span>
              </div>
              <TwelveMonthRevenueExpensesProfitChart />
            </section>

            {/* Card 2 (3 cols): Chi phí 3 tháng */}
            <section className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white font-chivo">
                  {isEn ? '3-Month Expenses' : 'Chi phí 3 tháng'}
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  {isEn ? 'Avg 20 tr/mo' : 'TB 20 tr/th'}
                </span>
              </div>
              <ThreeMonthExpensesBars />
            </section>

            {/* Card 3 (3 cols): HĐ hết hạn 6 tháng tới */}
            <section className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white font-chivo">
                  {isEn ? 'Expiring Contracts (6 Mos)' : 'HĐ hết hạn 6 tháng tới'}
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  11/26 - 04/27
                </span>
              </div>
              <SixMonthContractExpiryBars />
            </section>
          </div>

          {/* ========================================================
              6. ROW 4: OPERATIONAL CONTINUITY (CLASS UTILIZATION & AUDIT TRAIL)
             ======================================================== */}
          <div className="grid lg:grid-cols-12 gap-4 items-stretch">
            {/* Left Card (8 cols): Projects Style Class Utilization Table */}
            <section className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs hover-lift transition-all">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base font-chivo flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[20px]">check_circle</span>
                    {isEn ? 'Classes & Training Sessions' : 'Danh Sách Lớp Học Vận Hành'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">✓ {topClasses.length || 6} {isEn ? 'active classes' : 'lớp đang hoạt động'}</strong> {isEn ? 'in Olympic Sports Arena' : 'trong hệ thống trung tâm thể thao'}
                  </p>
                </div>

                <a
                  href="#/manager/classes-rooms"
                  className="text-xs font-bold text-[#2D6A4F] dark:text-[#81B29A] hover:underline flex items-center gap-1"
                >
                  <span>{isEn ? 'Manage all classes' : 'Quản lý toàn bộ'}</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </a>
              </div>

              {/* Projects Style Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="py-2.5 px-3">{isEn ? 'CLASS / SPORT' : 'LỚP HỌC'}</th>
                      <th className="py-2.5 px-3">{isEn ? 'COACH' : 'HLV & BỘ MÔN'}</th>
                      <th className="py-2.5 px-3 text-center">{isEn ? 'SLOTS' : 'ĐÃ ĐẶT'}</th>
                      <th className="py-2.5 px-4 w-44">{isEn ? 'OCCUPANCY' : 'TIẾN ĐỘ LẤP ĐẦY'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {topClasses.slice(0, 6).map((cls, idx) => {
                      const sportStyle = getSportStyle(cls.sportName);
                      const isTop1 = idx === 0;

                      return (
                        <tr key={cls.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          {/* Class Name + Icon */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${sportStyle.bg}`}>
                                <span className="material-symbols-outlined text-[16px]">{sportStyle.icon}</span>
                              </div>
                              <div>
                                <strong className="text-slate-900 dark:text-white font-bold block truncate max-w-[190px]">
                                  {cls.name}
                                </strong>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                  {cls.roomName || 'Olympic Arena Room'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Coach & Discipline */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-[#24828F]/20 text-[#24828F] flex items-center justify-center text-[10px] font-bold">
                                {cls.coachName ? cls.coachName.charAt(0) : 'H'}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[120px]">
                                  {cls.coachName || 'HLV phụ trách'}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {cls.sportName}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Booked / Capacity */}
                          <td className="py-3 px-3 text-center">
                            <span className="font-black text-slate-900 dark:text-white">
                              {cls.booked}
                            </span>
                            <span className="text-slate-400"> / {cls.capacity}</span>
                          </td>

                          {/* Completion Progress Bar */}
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
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Right Card (4 cols): Orders Overview Activity Timeline */}
            <section className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base font-chivo flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#2D6A4F] dark:text-[#81B29A] text-[20px]">notifications_active</span>
                      {isEn ? 'Operational Log' : 'Nhật Ký Thao Tác Gần Đây'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <strong className="text-emerald-600 dark:text-emerald-400 font-bold">+30% {isEn ? 'this month' : 'tháng này'}</strong> · {isEn ? 'Live audit activity' : 'Kiểm toán thời gian thực'}
                    </p>
                  </div>
                </div>

                {/* Vertical Timeline Nodes */}
                <div className="space-y-4 pt-3 relative before:absolute before:left-3.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {logs.length ? logs.slice(0, 5).map((log, i) => {
                    const meta = formatLogAction(log.action, isEn);
                    return (
                      <div key={log.id || i} className="flex items-start gap-3 relative">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 shadow-xs border ${meta.badgeClass}`}>
                          <span className="material-symbols-outlined text-[15px]">{meta.icon}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {meta.label}
                          </p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">
                            {log.userName || 'Hệ thống'} · {formatLogTime(log.timestamp, isEn)}
                          </span>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="py-6 text-center text-xs text-slate-400">
                      {isEn ? 'No recent operations recorded.' : 'Chưa có nhật ký gần đây.'}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <a
                  href="#/manager/audit-logs"
                  className="flex items-center justify-center gap-1.5 py-2 text-center text-xs font-bold text-[#2D6A4F] dark:text-[#81B29A] hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  <span>{isEn ? 'View all audit logs' : 'Xem toàn bộ lịch sử thao tác'}</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </a>
              </div>
            </section>
          </div>

          {/* ========================================================
              7. ROW 5: 10 OPERATIONAL MANAGEMENT MODULES SHORTCUTS
             ======================================================== */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 transition-all">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#81B29A]/20 dark:bg-emerald-950/60 text-[#2D6A4F] dark:text-emerald-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">apps</span>
                </div>
                <div>
                  <h2 className="font-chivo font-black text-sm uppercase tracking-wide text-slate-900 dark:text-white">
                    {isEn ? 'Operational Management Modules' : 'Phân Hệ Nghiệp Vụ Quản Lý Vận Hành'}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {isEn ? 'Direct access to all 10 management workspaces' : 'Truy cập nhanh 10 phân hệ nghiệp vụ Olympic Sports Arena'}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#81B29A]/15 text-[#2D6A4F] dark:text-emerald-300 border border-[#81B29A]/30">
                {shortcuts.length} {isEn ? 'workspaces' : 'phân hệ'}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {shortcuts.map((mod) => (
                <a
                  key={mod.path}
                  href={`#/manager/${mod.path}`}
                  className={`flex items-start gap-3 p-3.5 border border-slate-200/90 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-800/40 ${mod.theme.hoverCard} transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 group`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-2xs ${mod.theme.iconBg}`}>
                    <span className="material-symbols-outlined text-[18px]">
                      {mod.icon}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold font-chivo text-slate-900 dark:text-white group-hover:text-[#2D6A4F] dark:group-hover:text-[#81B29A] transition-colors truncate">
                      {mod.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {mod.tag}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
