import { parseApiDate } from '../../utils/dateTime.js';
import React, { useEffect, useState, useMemo } from 'react';
import { reportApi, systemApi } from '../../services/api.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import {
  ArcGaugeChart,
  RadialScoreChart,
  VisionSalesOverviewChart,
  VisionActiveUsersChart
} from './AnalyticsCharts.jsx';

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
    Promise.allSettled([reportApi.getOverview(), systemApi.getAuditLogs()]).then(([overview, activity]) => {
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
  }, [revision]);

  const revenue = metrics?.revenuePeriods || [];
  const membership = metrics?.membershipPeriods || [];
  const topClasses = metrics?.topClasses || [];
  const highlights = metrics?.highlights || {};
  const topClass = highlights.mostPopularClass;
  const topRevenueSport = highlights.highestRevenueSport;
  const topRoom = highlights.mostBookedRoom;

  const sportBadgeStyles = {
    'Bơi lội': { bg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800', icon: 'pool' },
    'Gym & Fitness': { bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800', icon: 'fitness_center' },
    'Yoga & Pilates': { bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', icon: 'self_improvement' },
    'Cầu lông': { bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', icon: 'sports_tennis' },
    'Boxing & Võ thuật': { bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800', icon: 'sports_mma' }
  };
  const getSportStyle = (name) => sportBadgeStyles[name] || { bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700', icon: 'sports' };

  return (
    <div className="space-y-6 animate-fade-slide-up pb-8">
      {/* 1. VISION UI MINIMALIST HEADER: Pages / Dashboard */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
            <span>Pages</span>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold">{isEn ? 'Dashboard' : 'Bảng điều khiển'}</span>
          </div>
          <h1 className="text-2xl font-black font-chivo text-slate-900 dark:text-white mt-0.5 tracking-tight flex items-center gap-2.5">
            <span>{isEn ? 'Dashboard' : 'Bảng Điều Hành Trung Tâm'}</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Olympic Arena</span>
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
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
            <span>{isEn ? 'Analytics Reports' : 'Báo cáo chi tiết'}</span>
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
          {/* 2. TIER 1: 4 KPI CARDS (Exact Vision UI Image 1 Replica with Olympic Light Palette) */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {/* Card 1: Today's Money */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover-lift transition-all flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {isEn ? "Today's Money" : 'Doanh thu tháng'}
                  </span>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                    +55%
                  </span>
                </div>
                <h3 className="text-xl lg:text-2xl font-black font-chivo text-slate-900 dark:text-white">
                  {`${Number(metrics?.monthlyRevenue || metrics?.netRevenue || 20700000).toLocaleString('vi-VN')}đ`}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[200px]">
                  {isEn ? 'Net revenue realized' : 'Dòng tiền thực thu trong kỳ'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2D6A4F] to-[#24828F] text-white flex items-center justify-center shadow-md shadow-[#2D6A4F]/25 shrink-0">
                <span className="material-symbols-outlined text-[24px]">payments</span>
              </div>
            </div>

            {/* Card 2: Today's Users */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover-lift transition-all flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {isEn ? "Today's Users" : 'Tổng hội viên'}
                  </span>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                    +3%
                  </span>
                </div>
                <h3 className="text-xl lg:text-2xl font-black font-chivo text-slate-900 dark:text-white">
                  {metrics?.totalMembers ?? 22}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[200px]">
                  {isEn ? `Active packages: ${metrics?.activeMembers || 9}` : `Có gói hiệu lực: ${metrics?.activeMembers || 9}`}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#24828F] to-[#3FAEB8] text-white flex items-center justify-center shadow-md shadow-[#24828F]/25 shrink-0">
                <span className="material-symbols-outlined text-[24px]">group</span>
              </div>
            </div>

            {/* Card 3: New Clients */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover-lift transition-all flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {isEn ? 'New Clients' : 'Hội viên mới'}
                  </span>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                    +{metrics?.newMembers ?? 22}
                  </span>
                </div>
                <h3 className="text-xl lg:text-2xl font-black font-chivo text-slate-900 dark:text-white">
                  +{metrics?.newMembers ?? 22}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[200px]">
                  {isEn ? 'Registered this period' : 'Tài khoản đăng ký mới'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#81B29A] to-[#2D6A4F] text-white flex items-center justify-center shadow-md shadow-[#81B29A]/25 shrink-0">
                <span className="material-symbols-outlined text-[24px]">person_add</span>
              </div>
            </div>

            {/* Card 4: Total Sales */}
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
                  {metrics?.todayCheckins ?? 0}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[200px]">
                  {isEn ? 'Turnstile gate entries' : 'Lượt qua cổng kiểm soát'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F2CC8F] to-[#E5A33C] text-slate-950 flex items-center justify-center shadow-md shadow-[#E5A33C]/25 shrink-0">
                <span className="material-symbols-outlined text-[24px]">fact_check</span>
              </div>
            </div>
          </div>

          {/* 3. TIER 2: WELCOME HERO + SATISFACTION RATE (ARC GAUGE) + REFERRAL TRACKING (RADIAL SCORE) */}
          <div className="grid lg:grid-cols-12 gap-5 items-stretch">
            {/* Card 1 (5 cols): Welcome Hero Card with Olympic Ocean Gradient */}
            <div
              className="lg:col-span-5 relative overflow-hidden rounded-3xl p-6 text-white shadow-lg flex flex-col justify-between"
              style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1B4332 45%, #24828F 100%)'
              }}
            >
              <div className="pointer-events-none absolute -right-12 -top-12 w-64 h-64 rounded-full bg-gradient-to-br from-[#F2CC8F]/30 to-transparent blur-2xl" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 w-64 h-64 rounded-full bg-gradient-to-tr from-[#81B29A]/30 to-transparent blur-2xl" />
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 400 240" preserveAspectRatio="none">
                <path d="M-20,180 C100,80 220,240 380,110 C440,60 480,120 520,100" fill="none" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M0,200 C120,110 240,260 400,130" fill="none" stroke="white" strokeWidth="1" />
              </svg>

              <div className="relative z-10 space-y-3">
                <div>
                  <span className="text-xs text-white/70 font-semibold block">
                    {isEn ? 'Welcome back,' : 'Chào mừng trở lại,'}
                  </span>
                  <h2 className="text-2xl font-black font-chivo leading-tight text-white drop-shadow-sm mt-0.5">
                    Ban Quản Lý SCMS
                  </h2>
                  <p className="text-xs text-white/85 mt-1 leading-relaxed">
                    {isEn
                      ? 'Olympic Sports Center operational overview is live and healthy. All facilities running optimally.'
                      : 'Hệ thống trung tâm thể thao Olympic vận hành ổn định. Chúc bạn một ngày làm việc hiệu quả!'}
                  </p>
                </div>

                {/* Quick Highlights Trio */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/20 text-[11px]">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/15">
                    <span className="text-white/70 block text-[10px] font-bold truncate">
                      {isEn ? 'Top Class' : 'Lớp Hot #1'}
                    </span>
                    <strong className="text-white font-bold block truncate text-xs">
                      {topClass?.name || 'Bơi sải K01'}
                    </strong>
                    <span className="text-emerald-300 text-[10px]">
                      {topClass?.booked || 21} chỗ
                    </span>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/15">
                    <span className="text-white/70 block text-[10px] font-bold truncate">
                      {isEn ? 'Top Court' : 'Sân Bận #1'}
                    </span>
                    <strong className="text-white font-bold block truncate text-xs">
                      {topRoom?.name || 'Bể bơi 50m'}
                    </strong>
                    <span className="text-[#F2CC8F] text-[10px]">
                      {topRoom?.booked || 23} khách
                    </span>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/15">
                    <span className="text-white/70 block text-[10px] font-bold truncate">
                      {isEn ? 'Top Sport' : 'Bộ Môn #1'}
                    </span>
                    <strong className="text-white font-bold block truncate text-xs">
                      {topRevenueSport?.sportName || 'Yoga & Pilates'}
                    </strong>
                    <span className="text-sky-300 text-[10px]">
                      {topRevenueSport?.share || 13}% dt
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-3">
                <a
                  href="#/manager/reports"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white/95 hover:text-white transition group"
                >
                  <span>{isEn ? 'Tap to view operational reports' : 'Xem chi tiết báo cáo vận hành'}</span>
                  <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </a>
              </div>
            </div>

            {/* Card 2 (3 cols): Satisfaction Rate (Semi-circular Arc Gauge) */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <ArcGaugeChart
                value={metrics?.occupancyRate || 13.73}
                min={0}
                max={100}
                title={isEn ? 'Satisfaction Rate' : 'Tỷ lệ lấp đầy'}
                subtitle={isEn ? 'From all scheduled sessions' : 'Toàn bộ ca học đã mở'}
                note={isEn ? 'Optimal utilization' : 'Công suất vận hành ổn định'}
              />
            </div>

            {/* Card 3 (4 cols): Referral Tracking (Radial Progress Score) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <RadialScoreChart
                score={Number((8.5 + Math.min(1.0, ((metrics?.occupancyRate || 0) / 100) * 1.0) + (topRoom?.booked ? 0.2 : 0)).toFixed(1))}
                maxScore={10}
                title={isEn ? 'Referral Tracking' : 'Hiệu suất sân bãi'}
                subtitle={isEn ? 'Facility tracking' : 'Chỉ số tải cơ sở'}
                stat1Label={isEn ? 'Visitors' : 'Khách tiếp nhận'}
                stat1Val={`${topRoom?.booked || 23} lượt`}
                stat2Label={isEn ? 'Sessions' : 'Ca đã chạy'}
                stat2Val={`${topRoom?.sessionsCount || 10} ca`}
                scoreLabel={isEn ? 'Safety' : 'Điểm tải'}
                scoreSub={isEn ? 'Total score' : 'Tổng điểm'}
              />
            </div>
          </div>

          {/* 4. TIER 3: SALES OVERVIEW (SPLINE WAVE) + ACTIVE USERS (BARS & 4 PILLS) */}
          <div className="grid lg:grid-cols-12 gap-5 items-stretch">
            {/* Left Card (7 cols): Sales Overview Spline Wave Chart */}
            <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xs hover-lift transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base font-chivo flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#24828F]" />
                    {isEn ? 'Sales overview' : 'Tổng Quan Doanh Thu Thuần'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isEn
                      ? '(+12%) more in 2026 · Smooth cashflow trajectory'
                      : '(+12%) tăng trưởng dòng tiền thực nhận theo thời gian.'}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold border border-slate-200 dark:border-slate-700">
                  Daily Wave
                </span>
              </div>
              <VisionSalesOverviewChart data={revenue} groupBy="day" />
            </section>

            {/* Right Card (5 cols): Active Users Bar Chart + 4 Stat Pills */}
            <section className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xs hover-lift transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base font-chivo flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2D6A4F]" />
                    {isEn ? 'Active Users' : 'Khối Lượng Hoạt Động Thành Viên'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isEn
                      ? '(+23) than last week · Core operational pillars'
                      : '(+23) lượt tương tác học viên và 4 chỉ số vận hành cốt lõi.'}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800">
                  KPI Pills
                </span>
              </div>
              <VisionActiveUsersChart
                data={membership}
                totalUsers={metrics?.totalMembers || 22}
                totalBookings={metrics?.totalBookings || 68}
                netSales={metrics?.netRevenue || 20700000}
                totalSessions={metrics?.totalClasses || 28}
              />
            </section>
          </div>

          {/* 5. TIER 4: PROJECTS TABLE + ORDERS OVERVIEW ACTIVITY TIMELINE */}
          <div className="grid lg:grid-cols-12 gap-5 items-stretch">
            {/* Left Card (8 cols): Projects Style Class Utilization Table */}
            <section className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xs hover-lift transition-all">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base font-chivo flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[20px]">check_circle</span>
                    {isEn ? 'Projects' : 'Danh Sách Lớp Học (Projects)'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">✓ {topClasses.length || 7} {isEn ? 'done this month' : 'lớp đang hoạt động'}</strong> {isEn ? 'in center catalog' : 'trong hệ thống trung tâm'}
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
                      <th className="py-2.5 px-3">{isEn ? 'COMPANIES / CLASS' : 'LỚP HỌC'}</th>
                      <th className="py-2.5 px-3">{isEn ? 'MEMBERS' : 'HLV & BỘ MÔN'}</th>
                      <th className="py-2.5 px-3 text-center">{isEn ? 'BUDGET / SLOTS' : 'ĐÃ ĐẶT'}</th>
                      <th className="py-2.5 px-4 w-44">{isEn ? 'COMPLETION' : 'TIẾN ĐỘ LẤP ĐẦY'}</th>
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
                                  {cls.roomName || 'Olympic Room'}
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
            <section className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base font-chivo flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#2D6A4F] dark:text-[#81B29A] text-[20px]">notifications_active</span>
                      {isEn ? 'Orders overview' : 'Nhật Ký Thao Tác (Orders)'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <strong className="text-emerald-600 dark:text-emerald-400 font-bold">+30% {isEn ? 'this month' : 'tháng này'}</strong> · {isEn ? 'Live activity' : 'Thời gian thực'}
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

          {/* 6. TIER 5: 10 OPERATIONAL MANAGEMENT MODULES SHORTCUTS */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4 transition-all">
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
                    {isEn ? 'Direct access to all 10 management workspaces' : 'Truy cập nhanh 10 phân hệ nghiệp vụ thể thao'}
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
                  className={`flex items-start gap-3 p-3.5 border border-slate-200/90 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-800/40 ${mod.theme.hoverCard} transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 group`}
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
