import { parseApiDate } from '../../../shared/lib/dateTime.js';
import { AnimatedNumber } from '../../../shared/lib/useCountUp.jsx';
import React, { useEffect, useState, useMemo } from 'react';
import { reportApi } from '../../../entities/report/index.js';
import { systemApi } from '../../../entities/permission/index.js';
import { LoadingSpinner } from '../../../shared/ui/Table.jsx';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
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
      badgeClass: 'bg-brand-sage-50 text-brand-sage-700 dark:bg-brand-sage-950/60 dark:text-brand-sage-300 border-brand-sage-200/80 dark:border-brand-sage-800/60'
    };
  }
  if (act.includes('CANCEL')) {
    return {
      label: isEn ? 'Cancelled Booking' : 'Hủy đăng ký lớp',
      icon: 'event_busy',
      badgeClass: 'bg-brand-danger-50 text-brand-danger-700 dark:bg-brand-danger-950/60 dark:text-brand-danger-300 border-brand-danger-200/80 dark:border-brand-danger-800/60'
    };
  }
  if (act.includes('PACKAGE') || act.includes('MEMBERSHIP')) {
    return {
      label: isEn ? 'Updated Package' : 'Cập nhật gói tập',
      icon: 'card_membership',
      badgeClass: 'bg-brand-sand-50 text-brand-sand-700 dark:bg-brand-sand-950/60 dark:text-brand-sand-300 border-brand-sand-200/80 dark:border-brand-sand-800/60'
    };
  }
  if (act.includes('PAYMENT') || act.includes('INVOICE') || act.includes('REFUND')) {
    return {
      label: isEn ? 'Payment / Billing' : 'Thanh toán & Hóa đơn',
      icon: 'receipt_long',
      badgeClass: 'bg-brand-teal-50 text-brand-teal-700 dark:bg-brand-teal-950/60 dark:text-brand-teal-300 border-brand-teal-200/80 dark:border-brand-teal-800/60'
    };
  }
  if (act.includes('STAFF') || act.includes('COACH') || act.includes('ASSIGN')) {
    return {
      label: isEn ? 'Staff / Coach Action' : 'Điều phối nhân sự & HLV',
      icon: 'badge',
      badgeClass: 'bg-brand-navy-50 text-brand-navy-800 dark:bg-brand-navy-950/60 dark:text-brand-navy-300 border-brand-navy-200/80 dark:border-brand-navy-800/60'
    };
  }
  return {
    label: action?.replace(/[._]/g, ' ') || (isEn ? 'System Log' : 'Nhật ký hệ thống'),
    icon: 'tune',
    badgeClass: 'bg-brand-navy-100 text-brand-navy-700 dark:bg-brand-navy-800 dark:text-brand-navy-300 border-brand-navy-200/80 dark:border-brand-navy-700'
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
      title: isEn ? 'Member Management' : 'Quản lý hội viên',
      description: isEn ? 'Profiles, account status and package history.' : 'Hồ sơ, trạng thái tài khoản và lịch sử gói.',
      tag: isEn ? 'Members' : 'Hội viên',
      theme: {
        iconBg: 'bg-brand-sage-50 dark:bg-brand-sage-950/50 text-brand-sage-700 dark:text-brand-sage-400 border border-brand-sage-200/80 dark:border-brand-sage-800/60',
        hoverCard: 'hover:border-brand-sage-500 dark:hover:border-brand-sage-600 hover:shadow-brand-sage-500/10 hover:bg-brand-sage-500/5',
        badge: 'bg-brand-sage-100/70 text-brand-sage-700 dark:bg-brand-sage-950/70 dark:text-brand-sage-300'
      }
    },
    {
      path: 'staff',
      icon: 'badge',
      title: isEn ? 'Coaches & Staff' : 'Huấn luyện viên & nhân sự',
      description: isEn ? 'Appointments, staff info and personnel status.' : 'Bổ nhiệm, cập nhật thông tin và trạng thái nhân sự.',
      tag: isEn ? 'Staff' : 'Nhân sự',
      theme: {
        iconBg: 'bg-brand-sand-50 dark:bg-brand-sand-950/50 text-brand-sand-700 dark:text-brand-sand-400 border border-brand-sand-200/80 dark:border-brand-sand-800/60',
        hoverCard: 'hover:border-brand-sand-400 dark:hover:border-brand-sand-600 hover:shadow-brand-sand-500/10 hover:bg-brand-sand-50/20',
        badge: 'bg-brand-sand-100/70 text-brand-sand-800 dark:bg-brand-sand-950/70 dark:text-brand-sand-300'
      }
    },
    {
      path: 'classes-rooms',
      icon: 'sports_score',
      title: isEn ? 'Classes, Sports & Courts' : 'Lớp, bộ môn, sân & phòng',
      description: isEn ? 'Create classes, manage sports, training courts and schedule.' : 'Tạo lớp, quản lý bộ môn, sân bãi và lịch tập.',
      tag: isEn ? 'Courts' : 'Lớp & Sân',
      theme: {
        iconBg: 'bg-brand-teal-50 dark:bg-brand-teal-950/50 text-brand-teal-700 dark:text-brand-teal-400 border border-brand-teal-200/80 dark:border-brand-teal-800/60',
        hoverCard: 'hover:border-brand-teal-400 dark:hover:border-brand-teal-600 hover:shadow-brand-teal-500/10 hover:bg-brand-teal-50/20',
        badge: 'bg-brand-teal-100/70 text-brand-teal-800 dark:bg-brand-teal-950/70 dark:text-brand-teal-300'
      }
    },
    {
      path: 'coach-assignment',
      icon: 'assignment_ind',
      title: isEn ? 'Coach Assignment' : 'Phân công HLV',
      description: isEn ? 'Assign head coaches and resolve schedule conflicts.' : 'Chọn HLV phụ trách và kiểm tra trùng lịch.',
      tag: isEn ? 'Assignment' : 'Phân công',
      theme: {
        iconBg: 'bg-brand-navy-50 dark:bg-brand-navy-950/50 text-brand-navy-800 dark:text-brand-navy-400 border border-brand-navy-200/80 dark:border-brand-navy-800/60',
        hoverCard: 'hover:border-brand-navy-700 dark:hover:border-brand-navy-600 hover:shadow-brand-navy-700/10 hover:bg-brand-navy-50/20',
        badge: 'bg-brand-navy-100/70 text-brand-navy-800 dark:bg-brand-navy-950/70 dark:text-brand-navy-300'
      }
    },
    {
      path: 'coach-operations',
      icon: 'diversity_3',
      title: isEn ? 'Coach Team Operations' : 'Vận hành đội ngũ HLV',
      description: isEn ? 'Workload metrics, qualification audit and coaching KPIs.' : 'Chỉ số khối lượng công việc, chứng chỉ và KPI giảng dạy.',
      tag: isEn ? 'Coaching' : 'HLV & KPI',
      theme: {
        iconBg: 'bg-brand-danger-50 dark:bg-brand-danger-950/50 text-brand-danger-700 dark:text-brand-danger-400 border border-brand-danger-200/80 dark:border-brand-danger-800/60',
        hoverCard: 'hover:border-brand-danger-400 dark:hover:border-brand-danger-600 hover:shadow-brand-danger-500/10 hover:bg-brand-danger-50/20',
        badge: 'bg-brand-danger-100/70 text-brand-danger-800 dark:bg-brand-danger-950/70 dark:text-brand-danger-300'
      }
    },
    {
      path: 'reports',
      icon: 'analytics',
      title: isEn ? 'Time-based Reports' : 'Báo cáo theo thời gian',
      description: isEn ? 'Members, class bookings, attendance and revenue.' : 'Thành viên, đăng ký lớp và doanh thu.',
      tag: isEn ? 'Analytics' : 'Báo cáo',
      theme: {
        iconBg: 'bg-brand-teal-50 dark:bg-brand-teal-950/50 text-brand-teal-700 dark:text-brand-teal-400 border border-brand-teal-200/80 dark:border-brand-teal-800/60',
        hoverCard: 'hover:border-brand-teal-400 dark:hover:border-brand-teal-600 hover:shadow-brand-teal-500/10 hover:bg-brand-teal-50/20',
        badge: 'bg-brand-teal-100/70 text-brand-teal-800 dark:bg-brand-teal-950/70 dark:text-brand-teal-300'
      }
    },
    {
      path: 'packages',
      icon: 'card_membership',
      title: isEn ? 'Packages & Pricing' : 'Gói tập & học phí',
      description: isEn ? 'Set prices, validity and package availability.' : 'Thiết lập giá, thời hạn và trạng thái gói.',
      tag: isEn ? 'Pricing' : 'Gói tập',
      theme: {
        iconBg: 'bg-brand-sand-50 dark:bg-brand-sand-950/50 text-brand-sand-800 dark:text-brand-sand-400 border border-brand-sand-200/80 dark:border-brand-sand-800/60',
        hoverCard: 'hover:border-brand-sand-400 dark:hover:border-brand-sand-600 hover:shadow-brand-sand-500/10 hover:bg-brand-sand-50/20',
        badge: 'bg-brand-sand-100/70 text-brand-sand-800 dark:bg-brand-sand-950/70 dark:text-brand-sand-300'
      }
    },
    {
      path: 'audit-logs',
      icon: 'history',
      title: isEn ? 'Audit Logs' : 'Lịch sử thao tác',
      description: isEn ? 'Look up critical system changes and audit trails.' : 'Tra cứu các thay đổi quan trọng trên hệ thống.',
      tag: isEn ? 'Audit' : 'Nhật ký',
      theme: {
        iconBg: 'bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300 border border-brand-navy-200/80 dark:border-brand-navy-700',
        hoverCard: 'hover:border-brand-navy-400 dark:hover:border-brand-navy-600 hover:shadow-brand-navy-500/10 hover:bg-brand-navy-50/40',
        badge: 'bg-brand-navy-200/70 text-brand-navy-800 dark:bg-brand-navy-800 dark:text-brand-navy-300'
      }
    },
    {
      path: 'home-content',
      icon: 'dashboard_customize',
      title: isEn ? 'Home Content & Media' : 'Nội dung trang chủ & đa phương tiện',
      description: isEn ? 'Customize landing page content, sports, courts and cloud media.' : 'Tùy biến nội dung landing page, môn học, cụm sân bãi và hình ảnh đám mây.',
      tag: isEn ? 'CMS' : 'Trang chủ',
      theme: {
        iconBg: 'bg-brand-terra-50 dark:bg-brand-terra-950/50 text-brand-terra-700 dark:text-brand-terra-400 border border-brand-terra-200/80 dark:border-brand-terra-800/60',
        hoverCard: 'hover:border-brand-terra-400 dark:hover:border-brand-terra-600 hover:shadow-brand-terra-500/10 hover:bg-brand-terra-50/20',
        badge: 'bg-brand-terra-100/70 text-brand-terra-800 dark:bg-brand-terra-950/70 dark:text-brand-terra-300'
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

  // Sourced 100% from actual database query response (metrics)
  const revenue = metrics?.revenuePeriods || [];
  const topClasses = metrics?.topClasses || [];
  const topSports = metrics?.topSports || [];
  const revenueBySport = metrics?.revenueBySport || [];
  const highlights = metrics?.highlights || {};
  const topRevenueSport = highlights.highestRevenueSport;

  const totalMembers = metrics?.totalMembers ?? 0;
  const activeMembers = metrics?.activeMembers ?? 0;
  const expiredMembers = metrics?.expiredMembers ?? 0;
  const newMembers = metrics?.newMembers ?? 0;
  const membersWithPackage = metrics?.membersWithPackage ?? activeMembers;
  const membersWithoutPackage = metrics?.membersWithoutPackage ?? Math.max(0, totalMembers - activeMembers);

  const totalRooms = metrics?.totalRooms ?? 0;
  const activeRooms = metrics?.activeRooms ?? 0;
  const vacantRooms = Math.max(0, totalRooms - activeRooms);

  const todayCheckins = metrics?.todayCheckins ?? 0;
  const occupancyRate = Number(metrics?.occupancyRate ?? 0);
  const netRevenue = Number(metrics?.netRevenue ?? metrics?.monthlyRevenue ?? 0);
  const grossRevenue = Number(metrics?.grossRevenue ?? netRevenue);
  const refundedRevenue = Number(metrics?.refundedRevenue ?? 0);
  const totalClasses = metrics?.totalClasses ?? 0;
  const totalBookings = metrics?.totalBookings ?? 0;



  // Real room donut segments computed from DB
  const roomDonutData = useMemo(() => {
    const list = [];
    if (activeRooms > 0) list.push({ label: 'Đang có lớp', value: activeRooms, color: '#81B29A' });
    if (vacantRooms > 0) list.push({ label: 'Sẵn sàng / Trống', value: vacantRooms, color: '#3FAEB8' });
    if (list.length === 0) list.push({ label: 'Chưa có sân', value: totalRooms || 1, color: '#6C6D70' });
    return list;
  }, [activeRooms, vacantRooms, totalRooms]);

  // Real sport occupancy items from DB with clean 2-letter codes
  const sportOccupancyItems = useMemo(() => {
    return topSports.map(sp => {
      const meaningfulWords = (sp.name || '')
        .trim()
        .split(/\s+/)
        .filter(w => !['&', 'và', 'and', '-', '/', '+'].includes(w.toLowerCase()));
      const code = meaningfulWords.length >= 2
        ? (meaningfulWords[0][0] + meaningfulWords[1][0]).toUpperCase()
        : (sp.name || 'BM').slice(0, 2).toUpperCase();
      return {
        code,
        name: sp.name,
        pct: sp.percentage || 0,
        current: sp.booked || 0,
        max: sp.capacity || 0
      };
    });
  }, [topSports]);

  // Real member package status segments from DB
  const memberStackedItems = useMemo(() => {
    return [
      {
        label: isEn ? 'Packages' : 'Gói tập',
        greenVal: membersWithPackage,
        redVal: membersWithoutPackage,
        greenLabel: isEn ? 'Subscribed' : 'Có gói',
        redLabel: isEn ? 'No package' : 'Chưa có gói'
      },
      {
        label: isEn ? 'Validity' : 'Thời hạn',
        greenVal: activeMembers,
        redVal: expiredMembers,
        greenLabel: isEn ? 'Active' : 'Hiệu lực',
        redLabel: isEn ? 'Expired' : 'Hết hạn'
      }
    ];
  }, [membersWithPackage, membersWithoutPackage, activeMembers, expiredMembers, isEn]);

  // Real sport revenue breakdown items from DB
  const sportRevenueItems = useMemo(() => {
    return revenueBySport.map(sp => ({
      label: sp.sportName,
      rawNet: Number(sp.net || 0),
      value: `${Number(sp.net || 0).toLocaleString('vi-VN')}đ`,
      pct: sp.share || 0
    }));
  }, [revenueBySport]);

  // Real class booking items from DB (Ranked classes with full metadata)
  const classBookingItems = useMemo(() => {
    return topClasses.slice(0, 6).map((cls, idx) => ({
      rank: idx + 1,
      id: cls.id,
      name: cls.name,
      sportName: cls.sportName || '',
      coachName: cls.coachName || '',
      roomName: cls.roomName || '',
      val: cls.booked || 0,
      capacity: cls.capacity || 0,
      occupancyRate: cls.occupancyRate != null ? cls.occupancyRate : (cls.capacity > 0 ? Math.round(((cls.booked || 0) / cls.capacity) * 100) : 0),
      isCurrent: idx === 0,
      month: cls.name
    }));
  }, [topClasses]);

  // Dynamic time-based greeting
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
    'Bơi lội': { bg: 'bg-brand-teal-50 dark:bg-brand-teal-950/40 text-brand-teal-700 dark:text-brand-teal-300 border-brand-teal-200 dark:border-brand-teal-800', icon: 'pool' },
    'Gym & Fitness': { bg: 'bg-brand-danger-50 dark:bg-brand-danger-950/40 text-brand-danger-700 dark:text-brand-danger-300 border-brand-danger-200 dark:border-brand-danger-800', icon: 'fitness_center' },
    'Yoga & Pilates': { bg: 'bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-300 border-brand-sage-200 dark:border-brand-sage-800', icon: 'self_improvement' },
    'Cầu lông': { bg: 'bg-brand-sand-50 dark:bg-brand-sand-950/40 text-brand-sand-700 dark:text-brand-sand-300 border-brand-sand-200 dark:border-brand-sand-800', icon: 'sports_tennis' },
    'Boxing & Võ thuật': { bg: 'bg-brand-navy-50 dark:bg-brand-navy-950/40 text-brand-navy-800 dark:text-brand-navy-300 border-brand-navy-200 dark:border-brand-navy-800', icon: 'sports_mma' }
  };
  const getSportStyle = (name) => sportBadgeStyles[name] || { bg: 'bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300 border-brand-navy-200 dark:border-brand-navy-700', icon: 'sports' };

  return (
    <div className="space-y-5 animate-fade-slide-up pb-8">
      {/* 1. TOP MINIMALIST BREADCRUMB & CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl font-black font-chivo text-brand-navy-900 dark:text-white tracking-tight flex flex-wrap items-center gap-2.5">
            <span>{isEn ? 'Executive Dashboard' : 'Bảng Điều Hành Trung Tâm'}</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-sage-50 text-brand-sage-700 dark:bg-brand-sage-950/50 dark:text-brand-sage-300 border border-brand-sage-200/80 dark:border-brand-sage-800/60">
              <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse" />
              <span>Olympic Sports Arena</span>
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector Tabs */}
          <div className="flex items-center gap-1 p-1 bg-brand-navy-100 dark:bg-brand-navy-800/80 rounded-xl border border-brand-navy-200/80 dark:border-brand-navy-700/80">
            {[
              { id: '30D', label: isEn ? '30 Days' : '30 ngày qua' },
              { id: 'MONTH', label: isEn ? 'This Month' : 'Tháng này' },
              { id: 'LAST_MONTH', label: isEn ? 'Last Month' : 'Tháng trước' },
              { id: 'QUARTER', label: isEn ? 'Quarter' : 'Quý này' }
            ].map((p) => {
              const active = period === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    active
                      ? 'bg-white dark:bg-brand-navy-900 text-brand-sage-700 dark:text-brand-sage-500 shadow-xs'
                      : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-white'
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
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-brand-navy-900 border border-brand-navy-200/90 dark:border-brand-navy-800 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300 text-xs font-bold transition-all shadow-xs hover-lift"
          >
            <span className={`material-symbols-outlined text-[16px] text-brand-sage-700 dark:text-brand-sage-500 ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{isEn ? 'Refresh' : 'Làm mới'}</span>
          </button>
          <a
            href="#/manager/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-sage-700 hover:bg-brand-sage-900 text-white text-xs font-bold transition-all shadow-xs hover-lift"
          >
            <span className="material-symbols-outlined text-[16px]">monitoring</span>
            <span>{isEn ? 'Reports' : 'Báo cáo chi tiết'}</span>
          </a>
        </div>
      </div>

      {loading && !metrics ? (
        <LoadingSpinner text={isEn ? 'Loading management dashboard...' : 'Đang tải dữ liệu bảng điều khiển...'} />
      ) : error ? (
        <div role="alert" className="p-4 rounded-xl bg-brand-danger-50 dark:bg-brand-danger-950/30 border border-brand-danger-200 dark:border-brand-danger-800 text-brand-danger-700 dark:text-brand-danger-300 text-sm">
          {error}
        </div>
      ) : (
        <>
          {/* ========================================================
              2. GREETING & ALERT BANNER (100% REAL DB METRICS)
             ======================================================== */}
          <div className="relative overflow-hidden bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/90 dark:border-brand-navy-800 p-5 shadow-xs transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Left: Greeting + Real Operational Alerts */}
              <div className="space-y-1">
                <span className="text-xs text-brand-navy-400 dark:text-brand-navy-500 font-medium block">
                  {greetingText}
                </span>
                <h2 className="text-xl sm:text-2xl font-black font-chivo text-brand-navy-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>{isEn ? 'Sports Center Manager' : 'Quản Lý Olympic Sports Arena'}</span>
                </h2>
                <p className="text-xs sm:text-[13px] text-brand-navy-600 dark:text-brand-navy-300 pt-0.5 leading-relaxed">
                  {isEn ? (
                    <>
                      In this period, there are <strong className="font-bold text-brand-navy-900 dark:text-white">{expiredMembers} expired memberships</strong>, <strong className="font-bold text-brand-navy-900 dark:text-white">{totalClasses} scheduled sessions</strong>, <strong className="font-bold text-brand-navy-900 dark:text-white">{todayCheckins} check-ins today</strong> and <strong className="font-bold text-brand-navy-900 dark:text-white">{membersWithoutPackage} members without active packages</strong>.
                    </>
                  ) : (
                    <>
                      Kỳ này ghi nhận <strong className="font-bold text-brand-navy-900 dark:text-white">{expiredMembers} gói tập hết hạn</strong>, <strong className="font-bold text-brand-navy-900 dark:text-white">{totalClasses} ca học vận hành</strong>, <strong className="font-bold text-brand-navy-900 dark:text-white">{todayCheckins} lượt check-in hôm nay</strong> và <strong className="font-bold text-brand-navy-900 dark:text-white">{membersWithoutPackage} hội viên chưa có gói</strong>.
                    </>
                  )}
                </p>
              </div>

              {/* Right: 4 Quick Actions for Sports Center Operations */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 shrink-0">
                <a
                  href="#/manager/members"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-brand-navy-800/80 border border-brand-navy-200/90 dark:border-brand-navy-700/80 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 text-brand-navy-800 dark:text-brand-navy-100 text-xs font-bold transition-all shadow-2xs hover:shadow-xs group hover-lift"
                >
                  <span className="material-symbols-outlined text-[17px] text-brand-teal-700 dark:text-brand-teal-400 group-hover:scale-110 transition-transform">
                    person_add
                  </span>
                  <span>{isEn ? 'Add Member' : 'Thêm hội viên'}</span>
                </a>

                <a
                  href="#/manager/classes-rooms"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-brand-navy-800/80 border border-brand-navy-200/90 dark:border-brand-navy-700/80 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 text-brand-navy-800 dark:text-brand-navy-100 text-xs font-bold transition-all shadow-2xs hover:shadow-xs group hover-lift"
                >
                  <span className="material-symbols-outlined text-[17px] text-brand-sage-700 dark:text-brand-sage-400 group-hover:scale-110 transition-transform">
                    sports_score
                  </span>
                  <span>{isEn ? 'Create Class' : 'Mở lớp học mới'}</span>
                </a>

                <a
                  href="#/manager/packages"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-brand-navy-800/80 border border-brand-navy-200/90 dark:border-brand-navy-700/80 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 text-brand-navy-800 dark:text-brand-navy-100 text-xs font-bold transition-all shadow-2xs hover:shadow-xs group hover-lift"
                >
                  <span className="material-symbols-outlined text-[17px] text-brand-sand-700 dark:text-brand-sand-400 group-hover:scale-110 transition-transform">
                    card_membership
                  </span>
                  <span>{isEn ? 'Renew Package' : 'Gia hạn gói tập'}</span>
                </a>

                <a
                  href="#/manager/classes-rooms"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-brand-navy-800/80 border border-brand-navy-200/90 dark:border-brand-navy-700/80 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 text-brand-navy-800 dark:text-brand-navy-100 text-xs font-bold transition-all shadow-2xs hover:shadow-xs group hover-lift"
                >
                  <span className="material-symbols-outlined text-[17px] text-brand-navy-700 group-hover:scale-110 transition-transform">
                    stadium
                  </span>
                  <span>{isEn ? 'Courts & Rooms' : 'Sơ đồ sân & phòng'}</span>
                </a>
              </div>
            </div>
          </div>

          {/* ========================================================
              3. ROW 1: 6 TOP KPI CARDS (100% REAL DB DATA)
             ======================================================== */}
          <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-3.5">
            {/* Card 1: TỔNG HỘI VIÊN */}
            <div className="bg-white dark:bg-brand-navy-900 rounded-2xl p-4 border border-brand-navy-200/90 dark:border-brand-navy-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy-400 dark:text-brand-navy-500">
                    {isEn ? 'TOTAL MEMBERS' : 'TỔNG HỘI VIÊN'}
                  </span>
                  <h3 className="text-2xl font-black font-chivo text-brand-navy-900 dark:text-white mt-1">
                    <AnimatedNumber value={totalMembers} duration={1000} />
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-brand-teal-800 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">group</span>
                </div>
              </div>
              <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 mt-2 truncate">
                {isEn ? `${activeMembers} active · ${newMembers} new` : `${activeMembers} có gói hiệu lực · ${newMembers} mới`}
              </p>
            </div>

            {/* Card 2: LƯỢT CHECK-IN */}
            <div className="bg-white dark:bg-brand-navy-900 rounded-2xl p-4 border border-brand-navy-200/90 dark:border-brand-navy-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy-400 dark:text-brand-navy-500">
                    {isEn ? 'TODAY CHECK-IN' : 'LƯỢT CHECK-IN'}
                  </span>
                  <h3 className="text-2xl font-black font-chivo text-brand-navy-900 dark:text-white mt-1">
                    <AnimatedNumber value={todayCheckins} duration={1000} />
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-brand-sage-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">fact_check</span>
                </div>
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 truncate">
                  {isEn ? `Occupancy ${occupancyRate}% · ${totalBookings} booked` : `Lấp đầy ${occupancyRate}% · ${totalBookings} lượt đặt`}
                </p>
                <div className="w-full bg-brand-navy-100 dark:bg-brand-navy-800 rounded-full h-1 overflow-hidden">
                  <div
                    className="bg-brand-sage-500 h-1 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(occupancyRate > 0 ? 5 : 0, occupancyRate))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Card 3: SÂN & PHÒNG SẴN SÀNG */}
            <div className="relative overflow-hidden bg-white dark:bg-brand-navy-900 rounded-2xl p-4 border border-brand-navy-200/90 dark:border-brand-navy-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div className="pointer-events-none absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-brand-teal-500/10 dark:bg-brand-teal-500/5 blur-xl" />
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy-400 dark:text-brand-navy-500">
                    {isEn ? 'AVAILABLE COURTS' : 'SÂN & PHÒNG KHẢ DỤNG'}
                  </span>
                  <h3 className="text-2xl font-black font-chivo text-brand-navy-900 dark:text-white mt-1">
                    <AnimatedNumber value={vacantRooms} duration={1000} />
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-brand-teal-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">stadium</span>
                </div>
              </div>
              <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 mt-2 truncate relative z-10">
                {isEn ? `${vacantRooms}/${totalRooms} courts ready` : `${vacantRooms}/${totalRooms} sân & phòng sẵn sàng`}
              </p>
            </div>

            {/* Card 4: GÓI HẾT HẠN */}
            <div className="bg-white dark:bg-brand-navy-900 rounded-2xl p-4 border border-brand-navy-200/90 dark:border-brand-navy-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy-400 dark:text-brand-navy-500">
                    {isEn ? 'EXPIRED PACKAGES' : 'GÓI HẾT HẠN'}
                  </span>
                  <h3 className="text-2xl font-black font-chivo text-brand-navy-900 dark:text-white mt-1">
                    <AnimatedNumber value={expiredMembers} duration={1000} />
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-brand-terra-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
                </div>
              </div>
              <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 mt-2 truncate">
                {isEn ? `${membersWithoutPackage} members without package` : `${membersWithoutPackage} hội viên chưa có gói`}
              </p>
            </div>

            {/* Card 5: DOANH THU THỰC NHẬN */}
            <div className="bg-white dark:bg-brand-navy-900 rounded-2xl p-4 border border-brand-navy-200/90 dark:border-brand-navy-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy-400 dark:text-brand-navy-500">
                      {isEn ? 'NET REVENUE' : 'DOANH THU THỰC NHẬN'}
                    </span>
                    <h3 className="text-2xl font-black font-chivo text-brand-navy-900 dark:text-white mt-1">
                      <AnimatedNumber value={netRevenue} duration={1200} suffix="đ" />
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-brand-sand-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">payments</span>
                  </div>
                </div>
                <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 mt-1 truncate">
                  {isEn
                    ? `Gross: ${grossRevenue.toLocaleString('vi-VN')}đ`
                    : `Tổng thu ${grossRevenue.toLocaleString('vi-VN')}đ${refundedRevenue > 0 ? ` · Hoàn ${refundedRevenue.toLocaleString('vi-VN')}đ` : ''}`}
                </p>
              </div>
              <div className="mt-2 -mb-1">
                <MiniSparkline color="#E07A5F" data={revenue.length > 0 ? revenue.map(p => Number(p.net || 0)) : []} />
              </div>
            </div>

            {/* Card 6: TOP BỘ MÔN DOANH THU */}
            <div className="bg-white dark:bg-brand-navy-900 rounded-2xl p-4 border border-brand-navy-200/90 dark:border-brand-navy-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy-400 dark:text-brand-navy-500">
                      {isEn ? 'TOP SPORT' : 'BỘ MÔN DOANH THU #1'}
                    </span>
                    <h3 className="text-xl font-black font-chivo text-brand-navy-900 dark:text-white mt-1 truncate max-w-[120px]" title={topRevenueSport?.sportName || 'Chưa có'}>
                      {topRevenueSport ? <AnimatedNumber value={topRevenueSport.net || 0} duration={1200} suffix="đ" /> : '0đ'}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-brand-sage-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">trending_up</span>
                  </div>
                </div>
                <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 mt-1 truncate">
                  {topRevenueSport ? `${topRevenueSport.sportName} (${topRevenueSport.share || 0}% DT)` : (isEn ? 'No transactions' : 'Chưa có giao dịch')}
                </p>
              </div>
              <div className="mt-2 -mb-1">
                <MiniSparkline color="#81B29A" data={revenue.length > 0 ? revenue.map(p => Number(p.gross || 0)) : []} />
              </div>
            </div>
          </div>

          {/* ========================================================
              4. ROW 2: 4 ANALYTICS CARDS (100% REAL DB DATA)
             ======================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 items-stretch">
            {/* Card 1: Trạng thái sân bãi & phòng tập (Donut Chart) */}
            <div className="bg-white dark:bg-brand-navy-900 rounded-2xl p-4 border border-brand-navy-200/90 dark:border-brand-navy-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-2.5">
                <h4 className="text-xs font-bold text-brand-navy-900 dark:text-white font-chivo">
                  {isEn ? 'Courts & Facilities Status' : 'Trạng thái sân & phòng tập'}
                </h4>
                <span className="text-[11px] text-brand-navy-400 font-medium">
                  {totalRooms} {isEn ? 'facilities' : 'sân/phòng'}
                </span>
              </div>
              <div className="py-2 flex-1 flex items-center justify-center">
                <RoomStatusDonutChart total={totalRooms} data={roomDonutData} activeRooms={activeRooms} vacantRooms={vacantRooms} />
              </div>
            </div>

            {/* Card 2: Lấp đầy theo bộ môn thể thao (Horizontal Bars) */}
            <div className="bg-white dark:bg-brand-navy-900 rounded-2xl p-4 border border-brand-navy-200/90 dark:border-brand-navy-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-2.5">
                <h4 className="text-xs font-bold text-brand-navy-900 dark:text-white font-chivo">
                  {isEn ? 'Sports Discipline Occupancy' : 'Lấp đầy theo bộ môn'}
                </h4>
                <span className="text-[11px] text-brand-navy-400 font-medium">
                  {isEn ? 'Enrolled / Capacity' : 'Đã đặt / Sức chứa'}
                </span>
              </div>
              <div className="py-2 flex-1">
                <FacilityOccupancyBars items={sportOccupancyItems} />
              </div>
            </div>

            {/* Card 3: Tỷ lệ lấp đầy toàn trung tâm (Radial Open Arc Gauge) */}
            <div className="bg-white dark:bg-brand-navy-900 rounded-2xl p-4 border border-brand-navy-200/90 dark:border-brand-navy-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-2.5">
                <h4 className="text-xs font-bold text-brand-navy-900 dark:text-white font-chivo">
                  {isEn ? 'Center Capacity Occupancy' : 'Tỷ lệ lấp đầy trung tâm'}
                </h4>
                <span className="text-[11px] text-brand-navy-400 font-medium">
                  {occupancyRate}%
                </span>
              </div>
              <div className="py-2 flex-1 flex items-center justify-center">
                <PeriodCollectionRadialGauge
                  percentage={occupancyRate}
                  collectedText={isEn ? `${totalBookings} booked / ${totalClasses} sessions` : `${totalBookings} lượt đặt / ${totalClasses} ca học`}
                  remainingText={isEn ? `${activeMembers} active members` : `${activeMembers} HV có gói`}
                  totalBookings={totalBookings}
                  totalClasses={totalClasses}
                  activeMembers={activeMembers}
                />
              </div>
            </div>

            {/* Card 4: Hồ sơ & Thẻ hội viên (Stacked Horizontal Bars) */}
            <div className="bg-white dark:bg-brand-navy-900 rounded-2xl p-4 border border-brand-navy-200/90 dark:border-brand-navy-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-2.5">
                <h4 className="text-xs font-bold text-brand-navy-900 dark:text-white font-chivo">
                  {isEn ? 'Member Packages Status' : 'Tình trạng gói tập hội viên'}
                </h4>
                <span className="text-[11px] text-brand-navy-400 font-medium">
                  {totalMembers} {isEn ? 'members' : 'hội viên'}
                </span>
              </div>
              <div className="py-2 flex-1">
                <MemberDocumentsStackedBars items={memberStackedItems} totalMembers={totalMembers} activeMembers={activeMembers} membersWithPackage={membersWithPackage} membersWithoutPackage={membersWithoutPackage} expiredMembers={expiredMembers} />
              </div>
            </div>
          </div>

          {/* ========================================================
              5. ROW 3: 3 DETAILED INSIGHT CARDS (100% REAL DB DATA)
             ======================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-12 gap-4 items-stretch">
            {/* Card 1 (6 cols): Biến động doanh thu theo thời gian */}
            <section className="md:col-span-2 2xl:col-span-6 bg-white dark:bg-brand-navy-900 border border-brand-navy-200/90 dark:border-brand-navy-800 rounded-2xl p-4 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-2.5">
                  <h4 className="text-xs font-bold text-brand-navy-900 dark:text-white font-chivo">
                    {isEn ? 'Cashflow Trajectory (Gross – Refunds – Net)' : 'Biến động doanh thu theo thời gian'}
                  </h4>
                  <span className="text-[11px] text-brand-navy-400 font-medium">
                    {period === '30D' ? (isEn ? 'Last 30 Days' : '30 ngày qua') : period === 'MONTH' ? (isEn ? 'This Month' : 'Tháng này') : period === 'LAST_MONTH' ? (isEn ? 'Last Month' : 'Tháng trước') : (isEn ? 'This Quarter' : 'Quý này')}
                  </span>
                </div>

                {/* Streamlined Executive KPI Strip (Compact & High-Density) */}
                <div className="grid grid-cols-3 gap-2.5 pt-2.5 pb-1">
                  <div className="px-3 py-2 rounded-xl bg-brand-sand-50/80 dark:bg-brand-sand-950/50 border border-brand-sand-200/80 dark:border-brand-sand-800/60 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-brand-sand-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <span className="material-symbols-outlined text-[15px]">trending_up</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-sand-800 dark:text-brand-sand-400 block truncate">
                        {isEn ? 'Net Revenue' : 'Thực thu ròng'}
                      </span>
                      <span className="text-sm font-black font-chivo text-brand-navy-900 dark:text-white block truncate leading-tight">
                        <AnimatedNumber value={netRevenue} duration={1200} suffix="đ" />
                      </span>
                    </div>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-brand-teal-50/80 dark:bg-brand-teal-950/50 border border-brand-teal-200/80 dark:border-brand-teal-800/60 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-brand-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <span className="material-symbols-outlined text-[15px]">payments</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-teal-800 dark:text-brand-teal-400 block truncate">
                        {isEn ? 'Gross Revenue' : 'Doanh thu gộp'}
                      </span>
                      <span className="text-sm font-black font-chivo text-brand-navy-900 dark:text-white block truncate leading-tight">
                        <AnimatedNumber value={grossRevenue} duration={1200} suffix="đ" />
                      </span>
                    </div>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-brand-danger-50/80 dark:bg-brand-danger-950/50 border border-brand-danger-200/80 dark:border-brand-danger-800/60 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-brand-danger-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <span className="material-symbols-outlined text-[15px]">assignment_return</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-danger-700 dark:text-brand-danger-400 block truncate">
                        {isEn ? 'Refunds' : 'Đã hoàn tiền'}
                      </span>
                      <span className="text-sm font-black font-chivo text-brand-navy-900 dark:text-white block truncate leading-tight">
                        <AnimatedNumber value={refundedRevenue} duration={1200} suffix="đ" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart container - Enlarge to fit the entire card */}
              <div className="flex-1 flex flex-col justify-end pt-2 pb-1 min-h-[340px]">
                <TwelveMonthRevenueExpensesProfitChart revenuePeriods={revenue} />
              </div>
            </section>

            {/* Card 2 (3 cols): Cơ cấu doanh thu theo bộ môn */}
            <section className="2xl:col-span-3 bg-white dark:bg-brand-navy-900 border border-brand-navy-200/90 dark:border-brand-navy-800 rounded-2xl p-4 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-2.5">
                  <h4 className="text-xs font-bold text-brand-navy-900 dark:text-white font-chivo">
                    {isEn ? 'Revenue by Sport' : 'Doanh thu theo bộ môn'}
                  </h4>
                  <span className="text-[11px] text-brand-navy-400 font-medium">
                    {revenueBySport.length} {isEn ? 'sports' : 'bộ môn'}
                  </span>
                </div>
                <div className="pt-2">
                  <ThreeMonthExpensesBars items={sportRevenueItems} emptyText={isEn ? 'No sport revenue in period.' : 'Chưa có doanh thu bộ môn trong kỳ.'} />
                </div>
              </div>
            </section>

            {/* Card 3 (3 cols): Lượt đặt theo lớp học */}
            <section className="2xl:col-span-3 bg-white dark:bg-brand-navy-900 border border-brand-navy-200/90 dark:border-brand-navy-800 rounded-2xl p-4 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-2.5">
                  <h4 className="text-xs font-bold text-brand-navy-900 dark:text-white font-chivo">
                    {isEn ? 'Bookings by Class' : 'Lượt đặt theo lớp học'}
                  </h4>
                  <span className="text-[11px] text-brand-navy-400 font-medium">
                    {topClasses.length} {isEn ? 'classes' : 'lớp'}
                  </span>
                </div>
                <div className="pt-2">
                  <SixMonthContractExpiryBars items={classBookingItems} emptyText={isEn ? 'No class sessions in period.' : 'Chưa có lớp học nào mở trong kỳ.'} />
                </div>
              </div>
            </section>
          </div>

          {/* ========================================================
              6. ROW 4: OPERATIONAL CONTINUITY (CLASS UTILIZATION & AUDIT TRAIL)
             ======================================================== */}
          <div className="grid lg:grid-cols-12 gap-4 items-stretch">
            {/* Left Card (8 cols): Projects Style Class Utilization Table */}
            <section className="lg:col-span-8 bg-white dark:bg-brand-navy-900 border border-brand-navy-200/90 dark:border-brand-navy-800 rounded-2xl p-5 space-y-4 shadow-xs hover-lift transition-all">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-navy-100 dark:border-brand-navy-800 pb-3">
                <div>
                  <h3 className="font-black text-brand-navy-900 dark:text-white text-base font-chivo flex items-center gap-2">
                    <span className="material-symbols-outlined text-brand-sage-700 dark:text-brand-sage-400 text-[20px]">check_circle</span>
                    {isEn ? 'Classes & Training Sessions' : 'Danh Sách Lớp Học Vận Hành'}
                  </h3>
                  <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-0.5">
                    <strong className="text-brand-sage-700 dark:text-brand-sage-400 font-bold">✓ {topClasses.length} {isEn ? 'active classes' : 'lớp đang hoạt động'}</strong> {isEn ? 'in Olympic Sports Arena' : 'trong hệ thống trung tâm thể thao'}
                  </p>
                </div>

                <a
                  href="#/manager/classes-rooms"
                  className="text-xs font-bold text-brand-sage-700 dark:text-brand-sage-500 hover:underline flex items-center gap-1"
                >
                  <span>{isEn ? 'Manage all classes' : 'Quản lý toàn bộ'}</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </a>
              </div>

              {/* Projects Style Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="text-brand-navy-400 dark:text-brand-navy-500 font-bold uppercase tracking-wider border-b border-brand-navy-100 dark:border-brand-navy-800">
                      <th className="py-2.5 px-3">{isEn ? 'CLASS / SPORT' : 'LỚP HỌC'}</th>
                      <th className="py-2.5 px-3">{isEn ? 'COACH' : 'HLV & BỘ MÔN'}</th>
                      <th className="py-2.5 px-3 text-center">{isEn ? 'SLOTS' : 'ĐÃ ĐẶT'}</th>
                      <th className="py-2.5 px-4 w-44">{isEn ? 'OCCUPANCY' : 'TIẾN ĐỘ LẤP ĐẦY'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-navy-100 dark:divide-brand-navy-800">
                    {topClasses.slice(0, 6).map((cls, idx) => {
                      const sportStyle = getSportStyle(cls.sportName);
                      const isTop1 = idx === 0;

                      return (
                        <tr key={cls.id || idx} className="hover:bg-brand-navy-50/70 dark:hover:bg-brand-navy-800/40 transition-colors">
                          {/* Class Name + Icon */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${sportStyle.bg}`}>
                                <span className="material-symbols-outlined text-[16px]">{sportStyle.icon}</span>
                              </div>
                              <div>
                                <strong className="text-brand-navy-900 dark:text-white font-bold block truncate max-w-[190px]">
                                  {cls.name}
                                </strong>
                                <span className="text-[10px] text-brand-navy-400 dark:text-brand-navy-500">
                                  {cls.roomName || 'Olympic Arena Room'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Coach & Discipline */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-brand-teal-600/20 text-brand-teal-700 flex items-center justify-center text-[10px] font-bold">
                                {cls.coachName ? cls.coachName.charAt(0) : 'H'}
                              </div>
                              <div>
                                <span className="font-semibold text-brand-navy-800 dark:text-brand-navy-200 block truncate max-w-[120px]">
                                  {cls.coachName || 'HLV phụ trách'}
                                </span>
                                <span className="text-[10px] text-brand-navy-400">
                                  {cls.sportName}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Booked / Capacity */}
                          <td className="py-3 px-3 text-center">
                            <span className="font-black text-brand-navy-900 dark:text-white">
                              <AnimatedNumber value={cls.booked} duration={1000} />
                            </span>
                            <span className="text-brand-navy-400"> / {cls.capacity}</span>
                          </td>

                          {/* Completion Progress Bar */}
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <span className="font-black text-xs text-brand-sage-700 dark:text-brand-sage-500 block">
                                <AnimatedNumber value={cls.occupancyRate} suffix="%" duration={1000} />
                              </span>
                              <div className="w-full bg-brand-navy-100 dark:bg-brand-navy-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-500 ${
                                    isTop1
                                      ? 'bg-gradient-to-r from-brand-sage-700 to-brand-sand-300'
                                      : cls.occupancyRate >= 20
                                      ? 'bg-brand-sage-700'
                                      : 'bg-brand-teal-500'
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
            <section className="lg:col-span-4 bg-white dark:bg-brand-navy-900 border border-brand-navy-200/90 dark:border-brand-navy-800 rounded-2xl p-5 space-y-4 shadow-xs hover-lift transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-3">
                  <div>
                    <h3 className="font-black text-brand-navy-900 dark:text-white text-base font-chivo flex items-center gap-2">
                      <span className="material-symbols-outlined text-brand-sage-700 dark:text-brand-sage-500 text-[20px]">notifications_active</span>
                      {isEn ? 'Operational Log' : 'Nhật Ký Thao Tác Gần Đây'}
                    </h3>
                    <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-0.5">
                      <strong className="text-brand-sage-700 dark:text-brand-sage-400 font-bold">Thời gian thực</strong> · {isEn ? 'Live audit activity' : 'Kiểm toán hệ thống'}
                    </p>
                  </div>
                </div>

                {/* Vertical Timeline Nodes */}
                <div className="space-y-4 pt-3 relative before:absolute before:left-3.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-brand-navy-200 dark:before:bg-brand-navy-800">
                  {logs.length ? logs.slice(0, 5).map((log, i) => {
                    const meta = formatLogAction(log.action, isEn);
                    return (
                      <div key={log.id || i} className="flex items-start gap-3 relative">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 shadow-xs border ${meta.badgeClass}`}>
                          <span className="material-symbols-outlined text-[15px]">{meta.icon}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-brand-navy-900 dark:text-white truncate">
                            {meta.label}
                          </p>
                          <span className="text-[10px] text-brand-navy-400 dark:text-brand-navy-500 block truncate">
                            {log.userName || 'Hệ thống'} · {formatLogTime(log.timestamp, isEn)}
                          </span>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="py-6 text-center text-xs text-brand-navy-400">
                      {isEn ? 'No recent operations recorded.' : 'Chưa có nhật ký gần đây.'}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-brand-navy-100 dark:border-brand-navy-800">
                <a
                  href="#/manager/audit-logs"
                  className="flex items-center justify-center gap-1.5 py-2 text-center text-xs font-bold text-brand-sage-700 dark:text-brand-sage-500 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 rounded-xl transition"
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
          <section className="bg-white dark:bg-brand-navy-900 border border-brand-navy-200/90 dark:border-brand-navy-800 rounded-2xl p-5 shadow-xs space-y-4 transition-all">
            <div className="flex items-center justify-between pb-3.5 border-b border-brand-navy-100 dark:border-brand-navy-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-sage-500/20 dark:bg-brand-sage-950/60 text-brand-sage-700 dark:text-brand-sage-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">apps</span>
                </div>
                <div>
                  <h2 className="font-chivo font-black text-sm uppercase tracking-wide text-brand-navy-900 dark:text-white">
                    {isEn ? 'Operational Management Modules' : 'Phân Hệ Nghiệp Vụ Quản Lý Vận Hành'}
                  </h2>
                  <p className="text-[11px] text-brand-navy-400 font-medium">
                    {isEn ? 'Direct access to all 10 management workspaces' : 'Truy cập nhanh 10 phân hệ nghiệp vụ Olympic Sports Arena'}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-brand-sage-500/15 text-brand-sage-700 dark:text-brand-sage-300 border border-brand-sage-500/30">
                {shortcuts.length} {isEn ? 'workspaces' : 'phân hệ'}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {shortcuts.map((mod) => (
                <a
                  key={mod.path}
                  href={`#/manager/${mod.path}`}
                  className={`flex items-start gap-3 p-3.5 border border-brand-navy-200/90 dark:border-brand-navy-800 rounded-xl bg-white dark:bg-brand-navy-800/40 ${mod.theme.hoverCard} transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 group`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-2xs ${mod.theme.iconBg}`}>
                    <span className="material-symbols-outlined text-[18px]">
                      {mod.icon}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold font-chivo text-brand-navy-900 dark:text-white group-hover:text-brand-sage-700 dark:group-hover:text-brand-sage-500 transition-colors truncate">
                      {mod.title}
                    </h3>
                    <p className="text-[11px] text-brand-navy-400 mt-0.5 line-clamp-1">
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
