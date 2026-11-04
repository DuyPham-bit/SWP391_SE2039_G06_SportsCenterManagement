import React from 'react';
import { getSportTheme, formatMemberDate } from '../model/bookingMapper.js';
import { CancelBookingButton } from './CancelBookingButton.jsx';

export function BookingCard({
  booking,
  onCancel,
  canCancel = true,
  className = ''
}) {
  if (!booking) return null;
  const theme = getSportTheme(booking.sportName || booking.sport);

  return (
    <div className={`p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-700 ${className}`}>
      <div className="flex items-start gap-3.5 min-w-0">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${theme?.bg || 'bg-slate-100 dark:bg-slate-800'} ${theme?.color || 'text-slate-600 dark:text-slate-400'}`}>
          <span className="material-symbols-outlined text-[22px]">
            {theme?.icon || 'fitness_center'}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {booking.className || 'Buổi tập'}
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {booking.status || 'Đã đặt'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              {formatMemberDate(booking.date)}
            </span>
            {booking.startTime && (
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {booking.startTime} {booking.endTime ? `- ${booking.endTime}` : ''}
              </span>
            )}
          </p>
        </div>
      </div>

      {canCancel && onCancel && (
        <div className="shrink-0 flex items-center justify-end">
          <CancelBookingButton booking={booking} onCancel={onCancel} />
        </div>
      )}
    </div>
  );
}

export default BookingCard;

