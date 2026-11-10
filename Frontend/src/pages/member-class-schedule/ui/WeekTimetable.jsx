import React from 'react';
import { formatIsoDate } from '../../../shared/lib/calendar.js';
import { getSportTheme } from '../lib/calendarView.js';
import { translateSportName, translateClassName, translateCoachName, translateRoomName } from '../../../shared/i18n/i18nHelper.js';

export function WeekTimetable({
  DAY_LABELS, bookedSessionIds, classesByDate, handleOpenSessionDetail, isEn, selectedCalendarDate,
  setSelectedCalendarDate, todayStr, weekDays
}) {
  return (
    <div className="bg-white rounded-2xl border border-brand-navy-200 shadow-sm overflow-hidden">
      {/* Weekday Header Columns */}
      <div className="grid grid-cols-7 border-b border-brand-navy-200 bg-brand-navy-50/80 divide-x divide-brand-navy-200 dark:divide-brand-navy-700 text-center">
        {weekDays.map(day => {
          const dayStr = formatIsoDate(day);
          const isToday = dayStr === todayStr;
          const isSelected = dayStr === selectedCalendarDate;
          const dayClassesCount = (classesByDate.get(dayStr) || []).length;

          return (
            <div
              key={dayStr}
              onClick={() => setSelectedCalendarDate(dayStr)}
              className={`py-3 px-1 transition-colors cursor-pointer ${
                    isSelected ? 'bg-brand-danger-50/60 dark:bg-brand-danger-900/25' : 'hover:bg-brand-navy-100/60 dark:hover:bg-brand-navy-700/40'
                  }`}
            >
              <span className="text-[11px] font-bold uppercase text-brand-navy-500 block">
                {DAY_LABELS[day.getUTCDay()]}
              </span>
              <div className="mt-1 flex items-center justify-center gap-1">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-chivo text-sm font-black transition-all ${
                        isToday
                          ? 'bg-brand-danger-600 text-white shadow-xs'
                          : 'text-brand-navy-900'
                      }`}
                >
                  {day.getUTCDate()}
                </span>
              </div>
              {dayClassesCount > 0 ? (
                <span className="inline-block mt-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-brand-navy-200/80 text-brand-navy-700">
                  {dayClassesCount} {isEn ? 'sess' : 'ca'}
                </span>
              ) : (
                <span className="text-[10px] text-brand-navy-400 block mt-1">{isEn ? 'Empty' : 'Trống'}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 7 Cột Lịch Ca Học Trong Tuần */}
      <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-brand-navy-200 dark:divide-brand-navy-700 min-h-[480px] bg-brand-navy-50/30">
        {weekDays.map(day => {
          const dayStr = formatIsoDate(day);
          const dayClasses = classesByDate.get(dayStr) || [];
          const isToday = dayStr === todayStr;

          return (
            <div
              key={dayStr}
              className={`p-2.5 space-y-2.5 transition-colors ${
                    isToday ? 'bg-brand-danger-50/20 dark:bg-brand-danger-900/10' : ''
                  }`}
            >
              {/* Tiêu đề ngày trên màn hình mobile nhỏ */}
              <div className="md:hidden pb-1 border-b border-brand-navy-200 flex justify-between items-center text-xs font-bold">
                <span>{DAY_LABELS[day.getUTCDay()]} ({dayStr})</span>
                <span className="text-brand-navy-500">{dayClasses.length} {isEn ? 'sessions' : 'ca học'}</span>
              </div>

              {dayClasses.length === 0 ? (
                <div className="py-8 text-center text-brand-navy-400 text-xs">
                  <span className="material-symbols-outlined text-2xl text-brand-navy-300 block mb-1">
                    event_busy
                  </span>
                  <span>{isEn ? 'No sessions' : 'Không có ca'}</span>
                </div>
              ) : (
                dayClasses.map(cls => {
                  const theme = getSportTheme(cls.sportName, isEn);
                  const isBooked = bookedSessionIds.has(cls.sessionId) || bookedSessionIds.has(cls.id);
                  const isFull = cls.enrolledCount >= cls.capacity;

                  return (
                    <div
                      key={cls.sessionId || cls.id}
                      onClick={() => handleOpenSessionDetail(cls)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 space-y-2 ${
                            isBooked
                              ? 'bg-brand-sage-50/90 dark:bg-brand-sage-950/50 border-brand-sage-400 dark:border-brand-sage-600 ring-2 ring-brand-sage-500/20 shadow-xs'
                              : `${theme.bg} ${theme.border} shadow-xs`
                          }`}
                    >
                      {/* Time & Sport Tag */}
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-[11px] text-brand-navy-900 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-brand-danger-600">schedule</span>
                          <span>{cls.timeSlot}</span>
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${theme.badge}`}>
                          {translateSportName(cls.sportName, isEn)}
                        </span>
                      </div>

                      {/* Class Name */}
                      <h4 className="font-chivo font-black text-brand-navy-900 leading-snug line-clamp-2">
                        {translateClassName(cls.name, isEn)}
                      </h4>

                      {/* Coach & Room Info */}
                      <div className="text-[11px] text-brand-navy-600 space-y-0.5">
                        <div className="truncate">{isEn ? 'Coach' : 'HLV'}: <strong>{translateCoachName(cls.coachName, isEn)}</strong></div>
                        <div className="truncate text-brand-navy-500">{translateRoomName(cls.roomName, isEn)}</div>
                      </div>

                      {/* Capacity & Action Status Footer */}
                      <div className="pt-1.5 border-t border-black/5 flex items-center justify-between">
                        <div className="text-[10px] font-bold">
                          <span className="text-brand-navy-600">{cls.enrolledCount}/{cls.capacity} {isEn ? 'spots' : 'chỗ'}</span>
                        </div>

                        {isBooked ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-black uppercase text-brand-sage-800 bg-brand-sage-100 px-1.5 py-0.5 rounded border border-brand-sage-300">
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            <span>{isEn ? 'BOOKED' : 'ĐÃ ĐẶT'}</span>
                          </span>
                        ) : isFull ? (
                          <span className="text-[10px] font-bold text-brand-navy-500 bg-brand-navy-200 px-1.5 py-0.5 rounded">
                            {isEn ? 'FULL' : 'HẾT CHỖ'}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSessionDetail(cls);
                            }}
                            className="px-2 py-0.5 rounded bg-brand-danger-600 hover:bg-brand-danger-700 text-white font-bold text-[10px] uppercase tracking-wide transition-colors"
                          >
                            {isEn ? 'BOOK NOW' : 'ĐẶT CHỖ'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
