import React from 'react';
import { formatMemberDate } from '../../../entities/member/index.js';

export function MemberKeyMetrics({ currentUser, errors, isEn, latest, membership, unread, upcoming, validityPercent }) {
  return (
    <section aria-label={isEn ? 'Key Metrics' : 'Chỉ số trọng tâm'} className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 animate-fade-slide-up">
      {/* Metric 1: Upcoming Classes */}
      <div className="bg-white dark:bg-brand-navy-900 rounded-3xl p-5 border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-xs hover:border-brand-sage-500/50 dark:hover:border-brand-sage-500/40 transition hover-lift flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-sage-700 dark:text-brand-sage-400">
              {isEn ? 'Upcoming Workouts' : 'Lịch tập sắp tới'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-brand-sage-50 dark:bg-brand-sage-950/50 text-brand-sage-700 dark:text-brand-sage-400 border border-brand-sage-100 dark:border-brand-sage-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-brand-navy-900 dark:text-white tabular-nums">
              {errors.bookings ? '—' : upcoming.length}
            </span>
            <span className="text-xs font-semibold text-brand-navy-500 dark:text-brand-navy-400">
              {isEn ? 'sessions booked' : 'buổi đã xác nhận'}
            </span>
          </div>
          <p className="mt-1.5 text-[11.5px] text-brand-navy-600 dark:text-brand-navy-400 truncate">
            {upcoming.length > 0
              ? (isEn ? `Next: ${upcoming[0].timeSlot} (${upcoming[0].bookingDate})` : `Ca gần nhất: ${upcoming[0].timeSlot}`)
              : (isEn ? 'No workouts booked yet' : 'Chưa có buổi học mới')}
          </p>
        </div>
        <div className="mt-4 pt-2.5 border-t border-brand-navy-100 dark:border-brand-navy-800 flex items-center justify-between text-xs">
          <span className="text-[11px] text-brand-navy-400">
            {isEn ? 'Timetable access' : 'Thời khóa biểu'}
          </span>
          <a href="#/member/schedule" className="text-brand-sage-700 dark:text-brand-sage-400 font-extrabold hover:underline flex items-center gap-0.5">
            <span>{isEn ? 'Book session' : 'Đặt lớp'}</span>
            <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
          </a>
        </div>
      </div>

      {/* Metric 2: Membership Expiry & Validity */}
      <div className="bg-white dark:bg-brand-navy-900 rounded-3xl p-5 border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-xs hover:border-brand-sand-500/50 dark:hover:border-brand-sand-500/40 transition hover-lift flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-sand-700 dark:text-brand-sand-400">
              {isEn ? 'Package Status' : 'Trạng thái gói tập'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-brand-sand-50 dark:bg-brand-sand-950/50 text-brand-sand-700 dark:text-brand-sand-400 border border-brand-sand-100 dark:border-brand-sand-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">credit_card</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-black tracking-tight ${membership.active ? 'text-brand-sand-700 dark:text-brand-sand-400' : 'text-brand-danger-600 dark:text-brand-danger-400'}`}>
              {membership.label}
            </span>
            {membership.active && (
              <span className="text-xs font-bold text-brand-navy-500 dark:text-brand-navy-400">
                ({membership.daysLeft} {isEn ? 'days' : 'ngày'})
              </span>
            )}
          </div>
          {/* Visual validity progress bar */}
          <div className="mt-2">
            <div className="w-full bg-brand-navy-100 dark:bg-brand-navy-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${membership.active ? 'bg-brand-sand-500' : 'bg-brand-danger-500'}`}
                style={{ width: `${validityPercent}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-brand-navy-500 dark:text-brand-navy-400 truncate">
              {membership.active
                ? (isEn ? `Valid until: ${formatMemberDate(currentUser?.packageExpiry, isEn)}` : `Hạn: ${formatMemberDate(currentUser?.packageExpiry)}`)
                : (isEn ? 'Please renew package' : 'Vui lòng gia hạn gói')}
            </p>
          </div>
        </div>
        <div className="mt-4 pt-2.5 border-t border-brand-navy-100 dark:border-brand-navy-800 flex items-center justify-between text-xs">
          <span className="text-[11px] text-brand-navy-400">
            {isEn ? 'Plans & Pricing' : 'Quyền lợi gói'}
          </span>
          <a href="#/member/packages" className="text-brand-sand-700 dark:text-brand-sand-400 font-extrabold hover:underline flex items-center gap-0.5">
            <span>{isEn ? 'Renew' : 'Gia hạn'}</span>
            <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
          </a>
        </div>
      </div>

      {/* Metric 3: InBody & Fitness Biometrics */}
      <div className="bg-white dark:bg-brand-navy-900 rounded-3xl p-5 border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-xs hover:border-brand-teal-500/50 dark:hover:border-brand-teal-500/40 transition hover-lift flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-teal-700 dark:text-brand-teal-400">
              {isEn ? 'Body Biometrics' : 'Chỉ số thể chất'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-brand-teal-50 dark:bg-brand-teal-950/50 text-brand-teal-700 dark:text-brand-teal-400 border border-brand-teal-100 dark:border-brand-teal-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">monitor_weight</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-brand-navy-900 dark:text-white tabular-nums">
              {errors.progress ? '—' : (latest ? `${latest.weight || '--'} kg` : (isEn ? 'Pending' : 'Chờ đo'))}
            </span>
            {latest?.bodyFat ? (
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-brand-teal-50 dark:bg-brand-teal-950/50 text-brand-teal-700 dark:text-brand-teal-300 border border-brand-teal-200 dark:border-brand-teal-800/50">
                {isEn ? `${latest.bodyFat}% Fat` : `Mỡ: ${latest.bodyFat}%`}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-[11.5px] text-brand-navy-600 dark:text-brand-navy-400 truncate">
            {latest
              ? (isEn ? `Measured on ${formatMemberDate(latest.date, isEn)}` : `Đo ngày: ${formatMemberDate(latest.date)} (InBody)`)
              : (isEn ? 'Visit gym floor for InBody test' : 'Đến sàn tập để đo InBody miễn phí')}
          </p>
        </div>
        <div className="mt-4 pt-2.5 border-t border-brand-navy-100 dark:border-brand-navy-800 flex items-center justify-between text-xs">
          <span className="text-[11px] text-brand-navy-400">
            {isEn ? 'Progress track' : 'Nhật ký tiến độ'}
          </span>
          <a href="#/member/progress" className="text-brand-teal-700 dark:text-brand-teal-400 font-extrabold hover:underline flex items-center gap-0.5">
            <span>{isEn ? 'View stats' : 'Xem chi tiết'}</span>
            <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
          </a>
        </div>
      </div>

      {/* Metric 4: Smart Gate Check-in & Notifications */}
      <div className="bg-white dark:bg-brand-navy-900 rounded-3xl p-5 border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-xs hover:border-brand-navy-700/50 dark:hover:border-brand-navy-500/40 transition hover-lift flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-navy-800 dark:text-brand-navy-400">
              {isEn ? 'Gate & Activity' : 'Cổng & Điểm danh'}
            </span>
            <div className="w-10 h-10 rounded-2xl bg-brand-navy-50 dark:bg-brand-navy-950/50 text-brand-navy-700 dark:text-brand-navy-400 border border-brand-navy-100 dark:border-brand-navy-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">fact_check</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-brand-navy-900 dark:text-white tracking-tight">
              {isEn ? 'Smart QR' : 'Smart QR'}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-navy-50 dark:bg-brand-navy-950/50 text-brand-navy-800 dark:text-brand-navy-300 border border-brand-navy-200/80 dark:border-brand-navy-800/50">
              {isEn ? 'Ready' : 'Sẵn sàng'}
            </span>
          </div>
          <p className="mt-1.5 text-[11.5px] text-brand-navy-600 dark:text-brand-navy-400 truncate">
            {unread > 0
              ? (isEn ? `${unread} unread notices waiting` : `${unread} thông báo mới chưa đọc`)
              : (isEn ? 'Auto check-in via turnstile gate' : 'Check-in tự động tại cửa xoay')}
          </p>
        </div>
        <div className="mt-4 pt-2.5 border-t border-brand-navy-100 dark:border-brand-navy-800 flex items-center justify-between text-xs">
          <span className="text-[11px] text-brand-navy-400">
            {isEn ? 'Check-in logs' : 'Nhật ký ra vào'}
          </span>
          <a href="#/member/attendance" className="text-brand-navy-800 dark:text-brand-navy-400 font-extrabold hover:underline flex items-center gap-0.5">
            <span>{isEn ? 'History' : 'Xem lịch sử'}</span>
            <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
          </a>
        </div>
      </div>
    </section>
  );
}
