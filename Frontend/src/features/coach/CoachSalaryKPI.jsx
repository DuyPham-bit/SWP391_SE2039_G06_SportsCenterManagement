import React, { useEffect, useState } from 'react';
import { coachProfessionalApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { LoadingSpinner } from '../../components/common/Table.jsx';
import { CoachError } from './CoachShared.jsx';
import { currency } from './coachProfessionalView.js';

function SectionCard({ title, icon, action, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-4 sm:p-5 shadow-xs transition-colors ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1A3B8B] dark:text-blue-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[19px]">{icon}</span>
            </div>
          )}
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ icon = 'inbox', children, isEn = false }) {
  const content = children || (isEn ? 'No data available.' : 'Chưa có dữ liệu.');
  return (
    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 p-6 text-center">
      <span className="material-symbols-outlined text-[32px] text-slate-300 dark:text-slate-600 mb-1.5 block">
        {icon}
      </span>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{content}</p>
    </div>
  );
}

function formatDate(value, isEn = false) {
  return value ? new Date(value).toLocaleString(isEn ? 'en-US' : 'vi-VN') : '—';
}

export function CoachSalaryKPI() {
  const { showError } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await coachProfessionalApi.getWorkspace();
      setData(result);
    } catch (e) {
      setError(e);
      showError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return <LoadingSpinner text={isEn ? 'Loading KPI & Income data...' : 'Đang tải dữ liệu KPI & Thu nhập...'} />;
  }

  const coachName = data?.profile?.fullName || (isEn ? 'Coach' : 'Huấn luyện viên');
  const k = data?.kpi || {};

  const sessionPercent = k.targetSessions ? Math.min(100, Math.round(((k.completedSessions || 0) / k.targetSessions) * 100)) : 0;
  const salesPercent = k.targetSales ? Math.min(100, Math.round(((k.sales || 0) / k.targetSales) * 100)) : 0;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. Header Banner */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1A3B8B] via-[#1E40AF] to-[#2563EB] text-white p-5 sm:p-7 shadow-md">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-bold uppercase tracking-wider backdrop-blur-xs border border-white/20 shadow-2xs">
              <span className="material-symbols-outlined text-[15px]">monitoring</span>
              {isEn ? 'Coach Performance & Income' : 'KPI & Thu nhập Huấn luyện viên'}
            </span>

            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 px-3.5 py-1.5 text-xs font-bold text-white transition-all backdrop-blur-xs border border-white/20 cursor-pointer shadow-2xs"
            >
              <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>{isEn ? 'Refresh' : 'Làm mới'}</span>
            </button>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
            {isEn ? `Performance & Salary · Coach ${coachName}` : `KPI & Bảng kê thu nhập · HLV ${coachName}`}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-blue-100/90 max-w-3xl leading-relaxed">
            {isEn
              ? 'Transparent performance tracking: completed teaching hours, membership sales progress, commission breakdowns, and real-time student evaluation ratings.'
              : 'Theo dõi chỉ tiêu giảng dạy, doanh số, hoa hồng và bảng kê thu nhập minh bạch được tính toán tự động theo chính sách trung tâm.'}
          </p>

          {/* Quick Stats Grid inside Hero Header */}
          <div className="mt-4 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-blue-200 block">
                {isEn ? 'Monthly Sessions' : 'Buổi dạy trong tháng'}
              </span>
              <span className="text-lg font-black text-white">
                {k.completedSessions || 0}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-blue-200 block">
                {isEn ? 'KPI Session Rate' : 'Tiến độ buổi dạy'}
              </span>
              <span className="text-lg font-black text-white">
                {sessionPercent}%
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-blue-200 block">
                {isEn ? 'Average Rating' : 'Đánh giá trung bình'}
              </span>
              <span className="text-lg font-black text-amber-300 flex items-center gap-1">
                ★ {k.averageRating || '5.0'}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-blue-200 block">
                {isEn ? 'Estimated Income' : 'Thu nhập tạm tính'}
              </span>
              <span className="text-base sm:text-lg font-black text-emerald-300 truncate block">
                {currency(k.estimatedIncome || 0)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <CoachError message={error} retry={loadData} />

      {/* 2. Key Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">{isEn ? 'Teaching Sessions' : 'Số ca giảng dạy'}</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {k.completedSessions || 0}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            {isEn
              ? `${k.completedClassSessions || 0} classes · ${k.completedPersonalSessions || 0} PT sessions`
              : `${k.completedClassSessions || 0} lớp · ${k.completedPersonalSessions || 0} ca PT`}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">{isEn ? 'Student Retention Rate' : 'Tỷ lệ giữ chân học viên'}</span>
          <span className="text-2xl font-black text-[#1A3B8B] dark:text-blue-400 mt-1 block">
            {k.retentionRate || 0}%
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            {isEn
              ? `${k.retainedClients || 0}/${k.activeClients || 0} retained students`
              : `${k.retainedClients || 0}/${k.activeClients || 0} học viên duy trì`}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">{isEn ? 'Recorded Sales' : 'Doanh số ghi nhận'}</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block truncate">
            {currency(k.sales)}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">{isEn ? 'Packages & new enrollments' : 'Gói tập & hội viên mới'}</span>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">{isEn ? 'Average Rating' : 'Đánh giá trung bình'}</span>
          <span className="text-2xl font-black text-amber-500 mt-1 block">
            ★ {k.averageRating || '5.0'}/5
          </span>
          <span className="text-xs text-slate-500 mt-1 block">{isEn ? `${k.reviewCount || 0} student reviews` : `${k.reviewCount || 0} lượt nhận xét`}</span>
        </div>
      </div>

      {/* 3. KPI Progress & Income Breakdown */}
      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title={isEn ? 'KPI Target Progress' : 'Tiến độ hoàn thành chỉ tiêu KPI'} icon="trending_up">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                <span>{isEn ? `Teaching Sessions (${sessionPercent}%)` : `Số buổi dạy (${sessionPercent}%)`}</span>
                <span>{k.completedSessions || 0} / {k.targetSessions || 0} {isEn ? 'sessions' : 'buổi'}</span>
              </div>
              <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#1A3B8B] dark:bg-blue-500 transition-all duration-500"
                  style={{ width: `${sessionPercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                <span>{isEn ? `Package Sales (${salesPercent}%)` : `Doanh số bán gói (${salesPercent}%)`}</span>
                <span>{currency(k.sales)} / {currency(k.targetSales)}</span>
              </div>
              <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${salesPercent}%` }}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title={isEn ? 'Transparent Estimated Income' : 'Bảng tính thu nhập dự kiến minh bạch'} icon="payments">
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">{isEn ? 'Base Coach Salary:' : 'Lương cơ bản ngạch HLV:'}</span>
              <strong className="text-slate-900 dark:text-white">{currency(k.baseSalary)}</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">{isEn ? 'Session Teaching Commission:' : 'Hoa hồng buổi dạy (Session Commission):'}</span>
              <strong className="text-slate-900 dark:text-white">{currency(k.sessionCommission)}</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">{isEn ? 'Sales & Membership Commission:' : 'Hoa hồng doanh số ký mới (Sales Commission):'}</span>
              <strong className="text-slate-900 dark:text-white">{currency(k.salesCommission)}</strong>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-sm mt-3">
              <span className="font-bold text-emerald-900 dark:text-emerald-200">{isEn ? 'Total Estimated Income:' : 'Tổng thu nhập dự kiến:'}</span>
              <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                {currency(k.estimatedIncome)}
              </span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* 4. Student Reviews */}
      <SectionCard title={isEn ? 'Student Reviews & Feedback' : 'Đánh giá & Phản hồi từ học viên'} icon="rate_review">
        {!data?.reviews?.length ? (
          <EmptyState icon="star_outline" isEn={isEn}>
            {isEn ? 'No student reviews received this period.' : 'Chưa có đánh giá nào từ học viên trong kỳ này.'}
          </EmptyState>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.reviews.map(x => (
              <div key={x.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-750 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {x.memberName || (isEn ? `Student #${x.memberId}` : `Học viên #${x.memberId}`)}
                  </span>
                  <span className="text-amber-500 font-bold">
                    {'★'.repeat(x.rating)}{'☆'.repeat(5 - x.rating)}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  "{x.comment || (isEn ? 'No detailed review.' : 'Không có nhận xét chi tiết.')}"
                </p>
                <span className="text-[10px] text-slate-400 block pt-1">
                  {formatDate(x.updatedAt || x.createdAt, isEn)}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
