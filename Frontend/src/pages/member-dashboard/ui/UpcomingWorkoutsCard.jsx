import React from 'react';
import { parseDateParts, getSportMeta } from '../lib/display.js';
import { translateClassName, translateRoomName, translateCoachName, translateCoachFeedback, translateWorkoutResult, translatePlanTitle, translatePlanGoal } from '../../../shared/i18n/i18nHelper.js';
import { getBookingStatusLabel, isUpcomingBooking, formatMemberDate } from '../../../entities/member/index.js';

export function UpcomingWorkoutsCard({
  canBook, canCancel, canProgress, data, errors, isEn, latest, setBookingToCancel,
  setCancelModalOpen, upcoming
}) {
  return (
    <div className="lg:col-span-7 space-y-6">
      {/* Card A: Upcoming Workouts Feed */}
      <section aria-label={isEn ? 'Upcoming Workouts' : 'Lịch tập sắp tới'} className="bg-white dark:bg-brand-navy-900 p-6 rounded-3xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-xs space-y-4 hover-lift">
        <div className="flex items-center justify-between pb-3 border-b border-brand-navy-100 dark:border-brand-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-sage-50 dark:bg-brand-sage-950/60 text-brand-sage-700 dark:text-brand-sage-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
            </div>
            <h2 className="text-sm font-extrabold text-brand-navy-900 dark:text-white uppercase tracking-wide">
              {isEn ? 'Upcoming Workout Sessions' : 'Lịch tập sắp tới của bạn'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-sage-50 dark:bg-brand-sage-950/50 text-brand-sage-700 dark:text-brand-sage-300 text-xs font-bold border border-brand-sage-200/60 dark:border-brand-sage-800/40">
              {upcoming.length} {isEn ? 'sessions' : 'buổi'}
            </span>
          </div>
          <a
            href="#/member/bookings"
            className="text-xs font-bold text-brand-sage-700 dark:text-brand-sage-400 hover:underline flex items-center gap-1 group"
          >
            <span>{isEn ? 'Manage & Cancel' : 'Xem tất cả & Hủy'}</span>
            <span className="material-symbols-outlined text-[14px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
          </a>
        </div>

        {errors.bookings ? (
          <div className="p-4 rounded-2xl bg-brand-danger-50 dark:bg-brand-danger-950/30 text-xs text-brand-danger-700 dark:text-brand-danger-300">
            {isEn ? 'Unable to load schedule data.' : 'Chưa thể tải dữ liệu lịch học. Vui lòng thử lại sau.'}
          </div>
        ) : upcoming.length === 0 ? (
          /* High-End Empty State */
          <div className="text-center py-12 px-4 bg-brand-navy-50 dark:bg-brand-navy-800/30 rounded-3xl border border-dashed border-brand-navy-200 dark:border-brand-navy-700/80 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-brand-sage-50 dark:bg-brand-sage-950/50 text-brand-sage-700 dark:text-brand-sage-400 mx-auto flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-3xl">sports_gymnastics</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-brand-navy-800 dark:text-brand-navy-200">
                {isEn ? 'No upcoming workouts scheduled' : 'Bạn chưa có lịch tập nào sắp tới'}
              </h3>
              <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 max-w-sm mx-auto mt-1">
                {isEn
                  ? 'Pick your favorite classes from the Olympic timetable to begin training today.'
                  : 'Hãy chọn ca tập yêu thích từ thời khóa biểu chuẩn Olympic để rèn luyện ngay hôm nay.'}
              </p>
            </div>
            {canBook && (
              <a
                href="#/member/schedule"
                className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-brand-sage-700 hover:bg-brand-sage-900 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer mt-1"
              >
                <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
                <span>{isEn ? 'Book a Class Now' : 'Đăng ký ca tập ngay'}</span>
              </a>
            )}
          </div>
        ) : (
          /* Rich Session List */
          <div className="space-y-3">
            {upcoming.slice(0, 4).map(booking => {
              const dateParts = parseDateParts(booking.bookingDate, isEn);
              const sport = getSportMeta(booking.className, booking.coachSpecialization, isEn);

              return (
                <article
                  key={booking.id}
                  className="p-4 sm:p-5 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 hover:border-brand-sage-500/40 dark:hover:border-brand-sage-500/30 hover:shadow-md transition-all duration-200 bg-white dark:bg-brand-navy-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  {/* Left: Balanced Olympic Date Pod & Class Info */}
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Balanced Date Pod (Soft contrast in light mode, clean slate in dark mode) */}
                    <div className="w-14 sm:w-16 h-18 rounded-2xl bg-brand-navy-50 dark:bg-brand-navy-800 text-brand-navy-800 dark:text-brand-navy-200 flex flex-col items-center justify-center shrink-0 shadow-2xs border border-brand-navy-200/90 dark:border-brand-navy-700 group-hover:border-brand-sage-500/40 transition-colors">
                      <span className="text-[10px] font-bold text-brand-sage-700 dark:text-brand-sage-400 uppercase tracking-wider leading-none">
                        {dateParts.weekday}
                      </span>
                      <span className="text-xl font-black text-brand-navy-900 dark:text-white leading-tight mt-1 tabular-nums">
                        {dateParts.day}
                      </span>
                      <span className="text-[9.5px] text-brand-navy-500 dark:text-brand-navy-400 font-medium leading-none mt-0.5">
                        {dateParts.month}
                      </span>
                    </div>

                    {/* Class Meta */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10.5px] font-extrabold uppercase border flex items-center gap-1 ${sport.badgeBg}`}>
                          <span className="material-symbols-outlined text-[13px]">{sport.icon}</span>
                          {sport.name}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-800 dark:text-brand-navy-200 text-[10.5px] font-bold font-mono">
                          {booking.timeSlot}
                        </span>
                      </div>

                      <h3 className="text-sm font-extrabold text-brand-navy-900 dark:text-white group-hover:text-brand-sage-700 dark:group-hover:text-brand-sage-400 transition truncate">
                        {translateClassName(booking.className, isEn)}
                      </h3>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-brand-navy-600 dark:text-brand-navy-400">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px] text-brand-navy-400">stadium</span>
                          <span>{translateRoomName(booking.roomName, isEn)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px] text-brand-navy-400">sports</span>
                          <span>{isEn ? 'Coach:' : 'HLV:'} <strong className="text-brand-navy-800 dark:text-brand-navy-200">{translateCoachName(booking.coachName, isEn)}</strong></span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status & Quick Cancel Button */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-brand-navy-100 dark:border-brand-navy-800">
                    <span className="px-3 py-1 rounded-full bg-brand-sage-50 dark:bg-brand-sage-950/50 text-brand-sage-700 dark:text-brand-sage-300 border border-brand-sage-200 dark:border-brand-sage-800/40 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-sage-500 animate-pulse" />
                      {booking.sessionStatus === 'CANCELLED' ? (isEn ? 'Cancelled' : 'Đã hủy') : getBookingStatusLabel(booking.status, isEn)}
                    </span>

                    {canCancel && isUpcomingBooking(booking) && (
                      <button
                        type="button"
                        onClick={() => {
                          setBookingToCancel(booking);
                          setCancelModalOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-brand-danger-600 dark:text-brand-danger-400 hover:bg-brand-danger-50 dark:hover:bg-brand-danger-950/50 rounded-xl border border-brand-danger-200 dark:border-brand-danger-900/60 transition cursor-pointer active:scale-95 flex items-center gap-1 shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[14px]">event_busy</span>
                        <span>{isEn ? 'Cancel' : 'Hủy ca học'}</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Card B: Training Syllabus & Coach Advice */}
      <section aria-label={isEn ? 'Training & Biometrics' : 'Giáo án & Lời khuyên HLV'} className="bg-white dark:bg-brand-navy-900 p-6 rounded-3xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-xs space-y-4 hover-lift">
        <div className="flex items-center justify-between pb-3 border-b border-brand-navy-100 dark:border-brand-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-950/60 text-brand-navy-800 dark:text-brand-navy-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">assignment</span>
            </div>
            <h2 className="text-sm font-extrabold text-brand-navy-900 dark:text-white uppercase tracking-wide">
              {isEn ? 'Training Syllabus & Coach Advice' : 'Giáo án huấn luyện & Lời khuyên HLV'}
            </h2>
          </div>
          {canProgress && (
            <a href="#/member/progress" className="text-xs font-bold text-brand-sage-700 dark:text-brand-sage-400 hover:underline flex items-center gap-1 group">
              <span>{isEn ? 'Full Progress' : 'Xem toàn bộ'}</span>
              <span className="material-symbols-outlined text-[14px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Sub-block: Coach Advice Note */}
          <div className="p-4.5 rounded-2xl bg-brand-sage-50/70 dark:bg-brand-sage-950/30 border border-brand-sage-200/70 dark:border-brand-sage-800/40 space-y-2.5 flex flex-col justify-between shadow-2xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-brand-sage-900 dark:text-brand-sage-300 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-brand-sage-700 dark:text-brand-sage-400">format_quote</span>
                  {isEn ? 'Coach Feedback' : 'Nhận xét từ HLV'}
                </span>
                {latest?.date && (
                  <span className="text-[11px] text-brand-sage-800 dark:text-brand-sage-400 font-medium">
                    {formatMemberDate(latest.date, isEn)}
                  </span>
                )}
              </div>
              <p className="text-xs text-brand-navy-700 dark:text-brand-navy-300 italic leading-relaxed">
                "{latest?.coachFeedback ? translateCoachFeedback(latest.coachFeedback, isEn) : (isEn ? 'Maintain balanced heart rate, drink enough water and adhere to the training plan.' : 'Duy trì nhịp tim ổn định, bù đủ nước và tập theo đúng giáo án đã đề ra.')}"
              </p>
            </div>
            {latest?.workoutResult && (
              <div className="pt-2 border-t border-brand-sage-200/60 dark:border-brand-sage-800/40 text-[11px] text-brand-sage-900 dark:text-brand-sage-300 font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-brand-sage-700 dark:text-brand-sage-400">verified</span>
                <span>{isEn ? 'Result:' : 'Kết quả:'} {translateWorkoutResult(latest.workoutResult, isEn)}</span>
              </div>
            )}
          </div>

          {/* Right Sub-block: Active Lesson Plans */}
          <div className="p-4.5 rounded-2xl bg-brand-navy-50 dark:bg-brand-navy-800/50 border border-brand-navy-200/70 dark:border-brand-navy-700/60 space-y-2.5 flex flex-col justify-between shadow-2xs">
            {errors.plans ? (
              <p className="text-xs text-brand-danger-600 dark:text-brand-danger-400">
                {isEn ? 'Unable to load lesson plans.' : 'Chưa tải được giáo án.'}
              </p>
            ) : data.plans.length === 0 ? (
              <div className="py-4 text-center text-xs text-brand-navy-500 dark:text-brand-navy-400 space-y-1">
                <span className="material-symbols-outlined text-2xl text-brand-navy-400 block">fitness_center</span>
                <p className="font-semibold">{isEn ? 'No workout plans assigned yet' : 'Chưa có giáo án riêng từ HLV'}</p>
                <p className="text-[11px]">{isEn ? 'Request coach guidance during your next class' : 'Trao đổi cùng HLV trong buổi học tới'}</p>
              </div>
            ) : (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400 block mb-1">
                  {isEn ? 'Current Focus Plan' : 'Giáo án đang theo học'}
                </span>
                <h4 className="font-extrabold text-xs text-brand-navy-900 dark:text-white leading-snug">
                  {translatePlanTitle(data.plans[0].title, isEn)}
                </h4>
                <p className="text-xs text-brand-navy-600 dark:text-brand-navy-300 line-clamp-2 mt-1">
                  {isEn ? 'Goal:' : 'Mục tiêu:'} {translatePlanGoal(data.plans[0].goal, isEn) || (isEn ? 'Build endurance and stability' : 'Tăng cường thể lực và sức bền')}
                </p>
                <div className="mt-2.5 pt-2 border-t border-brand-navy-200/60 dark:border-brand-navy-700 text-[11px] text-brand-navy-500 dark:text-brand-navy-400 flex items-center justify-between">
                  <span>{isEn ? 'Coach:' : 'HLV:'} <strong className="text-brand-navy-800 dark:text-brand-navy-200">{translateCoachName(data.plans[0].coachName, isEn)}</strong></span>
                  <span>{isEn ? `From ${formatMemberDate(data.plans[0].startDate, isEn)}` : `Từ ${formatMemberDate(data.plans[0].startDate)}`}</span>
                </div>
              </div>
            )}
            <a
              href="#/member/progress"
              className="text-xs font-bold text-brand-sage-700 dark:text-brand-sage-400 hover:underline inline-flex items-center gap-1 mt-1"
            >
              <span>{isEn ? 'View all syllabus' : 'Xem giáo án chi tiết'}</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
