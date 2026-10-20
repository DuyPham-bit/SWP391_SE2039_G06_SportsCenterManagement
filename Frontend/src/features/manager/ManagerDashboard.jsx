import React, { useEffect, useState } from 'react';
import { reportApi, systemApi } from '../../services/api.js';
import { StatCard } from '../../components/common/StatCard.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function ManagerDashboard() {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const shortcuts = [
    [
      'members',
      'group',
      isEn ? 'Member Management' : 'Quản lý thành viên',
      isEn ? 'Profiles, account status and package history.' : 'Hồ sơ, trạng thái tài khoản và lịch sử gói.'
    ],
    [
      'staff',
      'badge',
      isEn ? 'Coaches & Staff' : 'Huấn luyện viên & nhân sự',
      isEn ? 'Appointments, staff info and personnel status.' : 'Bổ nhiệm, cập nhật thông tin và trạng thái nhân sự.'
    ],
    [
      'classes-rooms',
      'sports_score',
      isEn ? 'Classes, Sports & Courts' : 'Lớp, bộ môn, phòng & lịch',
      isEn ? 'Create classes, manage sports, training courts and schedule.' : 'Tạo lớp, quản lý bộ môn, phòng tập và lịch học.'
    ],
    [
      'coach-assignment',
      'assignment_ind',
      isEn ? 'Coach Assignment' : 'Phân công HLV',
      isEn ? 'Assign head coaches and resolve schedule conflicts.' : 'Chọn HLV phụ trách và kiểm tra trùng lịch.'
    ],
    [
      'coach-operations',
      'diversity_3',
      isEn ? 'Coach Team Operations' : 'Vận hành đội ngũ HLV',
      isEn ? 'Workload metrics, qualification audit and coaching KPIs.' : 'Chỉ số khối lượng công việc, chứng chỉ và KPI giảng dạy.'
    ],
    [
      'reports',
      'analytics',
      isEn ? 'Time-based Reports' : 'Báo cáo theo thời gian',
      isEn ? 'Members, class bookings, attendance and revenue.' : 'Thành viên, đăng ký lớp và doanh thu.'
    ],
    [
      'packages',
      'card_membership',
      isEn ? 'Packages & Pricing' : 'Gói tập & học phí',
      isEn ? 'Set prices, validity and package availability.' : 'Thiết lập giá, thời hạn và trạng thái gói.'
    ],
    [
      'roles-permissions',
      'admin_panel_settings',
      isEn ? 'Roles & Permissions' : 'Phân quyền truy cập',
      isEn ? 'Operational permissions for each center role.' : 'Quyền nghiệp vụ của từng vai trò trong trung tâm.'
    ],
    [
      'audit-logs',
      'history',
      isEn ? 'Audit Logs' : 'Lịch sử thao tác',
      isEn ? 'Look up critical system changes and audit trails.' : 'Tra cứu các thay đổi quan trọng trên hệ thống.'
    ],
    [
      'home-content',
      'dashboard_customize',
      isEn ? 'Home Content & Media' : 'Nội dung trang chủ & đa phương tiện',
      isEn ? 'Customize landing page content, sports, courts and cloud media.' : 'Tùy biến nội dung landing page, môn học, cụm sân bãi và hình ảnh đám mây.'
    ]
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
      {/* Top Banner Header */}
      <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-[#1E2235] via-[#242A42] to-[#1E2235] text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-white/10 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#81B29A]/15 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-[#F2CC8F]/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-1">
          <span className="font-chivo text-xs uppercase tracking-widest text-[#F2CC8F] font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#81B29A] animate-pulse" />
            {isEn ? 'SCMS EXECUTIVE OPERATIONS CENTER' : 'TRUNG TÂM ĐIỀU HÀNH SCMS OLYMPIC'}
          </span>
          <h1 className="font-chivo text-2xl md:text-3xl font-black mt-1 text-white tracking-tight">
            {isEn ? 'Management Overview Dashboard' : 'Bảng Quản Trị Hệ Thống Tổng Quan'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            {isEn
              ? 'Real-time athletic center supervision: active members, revenue streams, coaching operations, and audit logs.'
              : 'Theo dõi thành viên, lớp học, tài chính và các hoạt động vận hành của trung tâm trong thời gian thực.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10 shrink-0">
          <button
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all border border-white/15 hover-lift flex items-center gap-2 backdrop-blur-sm cursor-pointer disabled:opacity-50"
            disabled={loading}
            onClick={() => setRevision(x => x + 1)}
          >
            <span className={`material-symbols-outlined text-[18px] text-[#F2CC8F] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{isEn ? 'Refresh Metrics' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

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
        <section className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 hover-lift transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-chivo font-black text-sm uppercase tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#81B29A]" />
              {isEn ? 'Operational Management Modules' : 'Nghiệp Vụ Quản Lý Vận Hành'}
            </h2>
            <span className="text-xs text-slate-400 font-bold">{shortcuts.length} {isEn ? 'modules' : 'phân hệ'}</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3.5">
            {shortcuts.map(([path, icon, title, description]) => (
              <a
                key={path}
                href={`#/manager/${path}`}
                className="flex items-start gap-3.5 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-800/40 hover:border-[#81B29A] dark:hover:border-[#81B29A] hover:bg-[#81B29A]/5 transition-all hover-lift group"
              >
                <div className="w-11 h-11 rounded-xl bg-[#1E2235] text-[#F2CC8F] flex items-center justify-center shrink-0 group-hover:bg-[#2D6A4F] group-hover:text-white transition-all shadow-xs">
                  <span className="material-symbols-outlined text-[22px]">
                    {icon}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold font-chivo text-slate-900 dark:text-white group-hover:text-[#2D6A4F] dark:group-hover:text-[#81B29A] transition-colors truncate">
                    {title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Right Column: Recent Operations (1 col) */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 hover-lift transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-chivo font-black text-sm uppercase tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#2D6A4F] dark:text-[#81B29A]">history</span>
              {isEn ? 'Recent System Activity' : 'Thao Tác Gần Đây'}
            </h2>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {isEn ? 'Live' : 'Trực tiếp'}
            </span>
          </div>

          {logError ? (
            <p role="alert" className="text-red-700 dark:text-red-400 text-xs">
              {logError}
            </p>
          ) : !loading && !logs.length ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">
              {isEn ? 'No operations recorded yet.' : 'Chưa có thao tác được ghi nhận.'}
            </p>
          ) : (
            <div className="space-y-2.5">
              {logs.map(log => (
                <article
                  key={log.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs break-words border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                >
                  <p className="font-semibold text-slate-900 dark:text-white">{log.action}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                    <span>{log.userName}</span>
                    <span className="font-mono">{log.timestamp}</span>
                  </p>
                </article>
              ))}
            </div>
          )}

          <a
            className="block text-xs font-chivo font-bold uppercase tracking-wider text-[#2D6A4F] dark:text-[#81B29A] hover:underline pt-2 text-center"
            href="#/manager/audit-logs"
          >
            {isEn ? 'View all audit history →' : 'Xem toàn bộ lịch sử thao tác →'}
          </a>
        </section>
      </div>
    </div>
  );
}
