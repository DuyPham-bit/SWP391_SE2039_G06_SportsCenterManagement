import React, { useEffect, useState } from 'react';
import { reportApi, systemApi } from '../../services/api.js';
import { StatCard } from '../../components/common/StatCard.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

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
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return timestamp;
    return d.toLocaleString(isEn ? 'en-US' : 'vi-VN', {
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
      path: 'roles-permissions',
      icon: 'admin_panel_settings',
      title: isEn ? 'Roles & Permissions' : 'Phân quyền truy cập',
      description: isEn ? 'Operational permissions for each center role.' : 'Quyền nghiệp vụ của từng vai trò trong trung tâm.',
      tag: isEn ? 'Security' : 'Phân quyền',
      theme: {
        iconBg: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border border-purple-200/80 dark:border-purple-800/60',
        hoverCard: 'hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-purple-500/10 hover:bg-purple-50/20',
        badge: 'bg-purple-100/70 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300'
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
        setError(overview.reason.message);
      }
      if (activity.status === 'fulfilled') setLogs(activity.value.slice(0, 6));
      else {
        setLogs([]);
        setLogError(activity.reason.message);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [revision]);

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Top Banner Header (Exact Image 1 Olympic Multi-stop Gradient with 3 Frosted KPI Cards) */}
      <section
        className="relative overflow-hidden rounded-3xl text-white p-6 sm:p-8 shadow-xl shadow-[#24828F]/25 border border-white/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
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

        {/* Left column: Badge, Title & Description */}
        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/95 text-[#1B4332] text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/80 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>{isEn ? 'Olympic Operations Center' : 'Trung Tâm Điều Hành SCMS Olympic'}</span>
            </div>

            <button
              type="button"
              onClick={() => setRevision(x => x + 1)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/40 transition-all cursor-pointer disabled:opacity-50 shadow-xs hover-lift"
              title={isEn ? 'Refresh dashboard metrics' : 'Làm mới chỉ số'}
            >
              <span className={`material-symbols-outlined text-[15px] text-amber-200 ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>{isEn ? 'Refresh' : 'Làm mới'}</span>
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-chivo font-black tracking-tight text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            {isEn ? 'Management Overview Dashboard' : 'Bảng Quản Trị Hệ Thống Tổng Quan'}
          </h1>
          <p className="text-xs sm:text-sm text-white/95 leading-relaxed font-medium drop-shadow-xs">
            {isEn
              ? 'Real-time athletic center supervision: active members, revenue streams, coaching operations, and audit logs.'
              : 'Theo dõi thành viên, lớp học, tài chính và các hoạt động vận hành của trung tâm trong thời gian thực.'}
          </p>
        </div>

        {/* Right column: 3 Frosted KPI Cards matching Image 1 */}
        <div className="w-full lg:w-auto grid grid-cols-3 gap-3 sm:gap-4 shrink-0 relative z-10">
          {/* Card 1: Tổng Hội Viên */}
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 min-w-[110px] sm:min-w-[135px] flex flex-col justify-between shadow-xs hover:bg-white/25 transition-all">
            <span className="text-[11px] font-bold text-white/85 uppercase tracking-wider block truncate">
              {isEn ? 'Total Members' : 'Tổng hội viên'}
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-chivo font-black text-white">
                {loading ? '...' : (metrics?.totalMembers ?? 0)}
              </span>
              <span className="text-xs text-amber-200 font-bold">{isEn ? 'members' : 'người'}</span>
            </div>
            <span className="mt-1 text-[10px] text-white font-bold flex items-center gap-1 truncate">
              ● {metrics?.activeMembers || 0} {isEn ? 'active' : 'có gói'}
            </span>
          </div>

          {/* Card 2: Lượt Check-in Hôm Nay */}
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 min-w-[110px] sm:min-w-[135px] flex flex-col justify-between shadow-xs hover:bg-white/25 transition-all">
            <span className="text-[11px] font-bold text-white/85 uppercase tracking-wider block truncate">
              {isEn ? 'Check-ins Today' : 'Lượt check-in'}
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-chivo font-black text-white">
                {loading ? '...' : (metrics?.todayCheckins ?? 0)}
              </span>
              <span className="text-xs text-white/80 font-bold">{isEn ? 'entries' : 'lượt'}</span>
            </div>
            <span className="mt-1 text-[10px] text-amber-200 font-bold flex items-center gap-1 truncate">
              ↑ {isEn ? 'Turnstile gate' : 'Cổng tự động'}
            </span>
          </div>

          {/* Card 3: Đăng Ký Ca Lớp */}
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 min-w-[110px] sm:min-w-[135px] flex flex-col justify-between shadow-xs hover:bg-white/25 transition-all">
            <span className="text-[11px] font-bold text-white/85 uppercase tracking-wider block truncate">
              {isEn ? 'Class Bookings' : 'Đăng ký lớp'}
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-chivo font-black text-white">
                {loading ? '...' : (metrics?.totalBookings ?? 0)}
              </span>
              <span className="text-xs text-amber-200 font-bold">{isEn ? 'slots' : 'ca'}</span>
            </div>
            <span className="mt-1 text-[10px] text-white font-bold flex items-center gap-1 truncate">
              ● {isEn ? 'Scheduled' : 'Theo lịch học'}
            </span>
          </div>
        </div>
      </section>

      {loading ? (
        <LoadingSpinner text={isEn ? 'Loading management overview...' : 'Đang tải tổng quan...'} />
      ) : error ? (
        <div role="alert" className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      ) : (
        metrics && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={isEn ? 'Total Members' : 'Tổng thành viên'}
              value={metrics.totalMembers}
              subtitle={isEn ? `Active passes today: ${metrics.activeMembers}` : `Có gói hiệu lực hôm nay: ${metrics.activeMembers}`}
              icon="group"
              color="green"
            />
            <StatCard
              title={isEn ? 'Monthly Revenue' : 'Doanh thu tháng'}
              value={`${Number(metrics.monthlyRevenue).toLocaleString(isEn ? 'en-US' : 'vi-VN')} ${isEn ? 'VND' : 'đ'}`}
              subtitle={isEn ? 'Net revenue since month start' : 'Doanh thu thuần từ đầu tháng'}
              icon="payments"
              color="green"
            />
            <StatCard
              title={isEn ? 'Current Bookings' : 'Đăng ký lớp hiện tại'}
              value={metrics.totalBookings}
              subtitle={isEn ? 'Confirmed or waitlisted' : 'Đang xác nhận hoặc chờ chỗ'}
              icon="event_seat"
              color="slate"
            />
            <StatCard
              title={isEn ? 'Today Check-ins' : 'Check-in hôm nay'}
              value={metrics.todayCheckins}
              subtitle={isEn ? 'Turnstile gate entries' : 'Theo ngày Việt Nam'}
              icon="fact_check"
              color="green"
            />
          </div>
        )
      )}

      {/* Main Workspace Split */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Management Shortcuts (2 cols) */}
        <section className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5 transition-all">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#81B29A]/20 dark:bg-emerald-950/60 text-[#2D6A4F] dark:text-emerald-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">apps</span>
              </div>
              <div>
                <h2 className="font-chivo font-black text-sm uppercase tracking-wide text-slate-900 dark:text-white">
                  {isEn ? 'Operational Management Modules' : 'Nghiệp Vụ Quản Lý Vận Hành'}
                </h2>
                <p className="text-[11px] text-slate-400 font-medium">
                  {isEn ? 'Central operations & service administration' : 'Các phân hệ vận hành & quản trị tập trung'}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#81B29A]/15 text-[#2D6A4F] dark:text-emerald-300 border border-[#81B29A]/30">
              {shortcuts.length} {isEn ? 'modules' : 'phân hệ'}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3.5">
            {shortcuts.map((mod) => (
              <a
                key={mod.path}
                href={`#/manager/${mod.path}`}
                className={`flex items-start gap-3.5 p-4 border border-slate-200/90 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-800/40 ${mod.theme.hoverCard} transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 group`}
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-2xs ${mod.theme.iconBg}`}>
                  <span className="material-symbols-outlined text-[22px]">
                    {mod.icon}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <h3 className="text-sm font-bold font-chivo text-slate-900 dark:text-white group-hover:text-[#2D6A4F] dark:group-hover:text-[#81B29A] transition-colors truncate">
                      {mod.title}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${mod.theme.badge}`}>
                      {mod.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {mod.description}
                  </p>
                </div>
                <span className="material-symbols-outlined text-[18px] text-slate-300 dark:text-slate-600 group-hover:text-[#2D6A4F] dark:group-hover:text-[#81B29A] group-hover:translate-x-0.5 transition-all self-center shrink-0">
                  chevron_right
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Right Column: Recent Operations (1 col) */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4 transition-all">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">history</span>
              </div>
              <div>
                <h2 className="font-chivo font-black text-sm uppercase tracking-wide text-slate-900 dark:text-white">
                  {isEn ? 'Recent System Activity' : 'Thao Tác Gần Đây'}
                </h2>
                <p className="text-[11px] text-slate-400 font-medium">
                  {isEn ? 'Real-time audit events' : 'Nhật ký vận hành trực tiếp'}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {isEn ? 'Live' : 'Trực tiếp'}
            </span>
          </div>

          {logError ? (
            <p role="alert" className="text-red-700 dark:text-red-400 text-xs p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200">
              {logError}
            </p>
          ) : !loading && !logs.length ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-8">
              {isEn ? 'No operations recorded yet.' : 'Chưa có thao tác được ghi nhận.'}
            </p>
          ) : (
            <div className="space-y-2.5">
              {logs.map(log => {
                const meta = formatLogAction(log.action, isEn);
                return (
                  <article
                    key={log.id}
                    className="p-3 bg-slate-50/70 dark:bg-slate-800/60 rounded-xl text-xs border border-slate-200/70 dark:border-slate-800 hover:border-[#81B29A] dark:hover:border-emerald-500 transition-all flex items-start gap-2.5 group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${meta.badgeClass}`}>
                      <span className="material-symbols-outlined text-[16px]">{meta.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {meta.label}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {formatLogTime(log.timestamp, isEn)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between gap-1">
                        <span className="flex items-center gap-1 truncate font-medium">
                          <span className="material-symbols-outlined text-[13px] text-slate-400">person</span>
                          {log.userName || 'Hệ thống'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono opacity-60 truncate max-w-[110px]" title={log.action}>
                          {log.action}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <a
            className="flex items-center justify-center gap-1.5 text-xs font-chivo font-bold uppercase tracking-wider text-[#2D6A4F] dark:text-[#81B29A] hover:underline pt-3 border-t border-slate-100 dark:border-slate-800 text-center group"
            href="#/manager/audit-logs"
          >
            <span>{isEn ? 'View all audit history' : 'Xem toàn bộ lịch sử thao tác'}</span>
            <span className="material-symbols-outlined text-[15px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </a>
        </section>
      </div>
    </div>
  );
}
