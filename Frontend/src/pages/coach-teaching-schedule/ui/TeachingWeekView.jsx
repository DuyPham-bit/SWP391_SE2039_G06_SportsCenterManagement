import React from 'react';
import { formatIsoDate } from '../../../shared/lib/calendar.js';
import { getSportTheme } from '../lib/calendarView.js';
import { translateClassName, translateRoomName } from '../../../shared/i18n/i18nHelper.js';

export function TeachingWeekView({
  DAY_LABELS, STATUS_CONFIG, handleOpenDetail, isEn, selectedCalendarDate, sessionsByDate,
  setSelectedCalendarDate, todayStr, weekDays
}) {
  return (
    <div className="bg-white rounded-2xl border border-brand-navy-200 shadow-sm overflow-hidden">
      {/* Weekday Header Columns */}
      <div className="grid grid-cols-7 border-b border-brand-navy-200 bg-brand-navy-50/80 divide-x divide-brand-navy-200 text-center">
        {weekDays.map(day => {
          const dayStr = formatIsoDate(day);
          const isToday = dayStr === todayStr;
          const isSelected = dayStr === selectedCalendarDate;
          const daySessionsCount = (sessionsByDate.get(dayStr) || []).length;

          return (
            <div
              key={dayStr}
              onClick={() => setSelectedCalendarDate(dayStr)}
              className={`py-3 px-1 transition-colors cursor-pointer ${
                        isSelected ? 'bg-brand-danger-50/60' : 'hover:bg-brand-navy-100/60'
                      }`}
            >
              <span className="text-[11px] font-bold uppercase text-brand-navy-500 block truncate">
                {DAY_LABELS[day.getUTCDay()]}
              </span>
              <div className="mt-1 flex items-center justify-center gap-1">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                            isToday
                              ? 'bg-brand-navy-700 text-brand-sand-300 shadow-xs'
                              : 'text-brand-navy-900'
                          }`}
                >
                  {day.getUTCDate()}
                </span>
              </div>
              {daySessionsCount > 0 ? (
                <span className="inline-block mt-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-brand-navy-200/80 text-brand-navy-700">
                  {daySessionsCount} {isEn ? (daySessionsCount === 1 ? 'session' : 'sessions') : 'ca'}
                </span>
              ) : (
                <span className="text-[10px] text-brand-navy-400 block mt-1">{isEn ? 'Free' : 'Trống'}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 7 Cột Ca Học Trong Tuần */}
      <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-brand-navy-200 min-h-[480px] bg-brand-navy-50/30">
        {weekDays.map(day => {
          const dayStr = formatIsoDate(day);
          const daySessions = sessionsByDate.get(dayStr) || [];
          const isToday = dayStr === todayStr;

          return (
            <div
              key={dayStr}
              className={`p-2.5 space-y-2.5 transition-colors ${
                        isToday ? 'bg-brand-sage-500/10' : ''
                      }`}
            >
              {/* Tiêu đề ngày trên mobile nhỏ */}
              <div className="md:hidden pb-1 border-b border-brand-navy-200 flex justify-between items-center text-xs font-bold">
                <span>{DAY_LABELS[day.getUTCDay()]} ({dayStr})</span>
                <span className="text-brand-navy-500">
                  {daySessions.length} {isEn ? (daySessions.length === 1 ? 'session' : 'sessions') : 'ca dạy'}
                </span>
              </div>

              {daySessions.length === 0 ? (
                <div className="py-8 text-center text-brand-navy-400 text-xs">
                  <span className="material-symbols-outlined text-2xl text-brand-navy-300 block mb-1">
                    event_busy
                  </span>
                  <span>{isEn ? 'No sessions' : 'Không có ca'}</span>
                </div>
              ) : (
                daySessions.map(s => {
                  const theme = getSportTheme(s.sportName, isEn);
                  const statusInfo = STATUS_CONFIG[s.status] || STATUS_CONFIG.SCHEDULED;
                  const percent = s.capacity > 0 ? Math.min(100, Math.round((s.enrolledCount / s.capacity) * 100)) : 0;

                  return (
                    <div
                      key={s.id}
                      onClick={() => handleOpenDetail(s)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 space-y-2 ${theme.bg} ${theme.border} shadow-xs`}
                    >
                      {/* Time & Sport Tag */}
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-[11px] text-brand-navy-900 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-brand-sand-300">schedule</span>
                          <span>{s.timeSlot}</span>
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${theme.badge}`}>
                          {theme.tag}
                        </span>
                      </div>

                      {/* Class Name */}
                      <h4 className="font-chivo font-black text-brand-navy-900 leading-snug line-clamp-2">
                        {translateClassName(s.name, isEn)}
                      </h4>

                      {/* Room & Status */}
                      <div className="text-[11px] text-brand-navy-600 space-y-1">
                        <div className="truncate flex items-center gap-1 text-brand-navy-600">
                          <span className="material-symbols-outlined text-[13px] text-brand-navy-400">meeting_room</span>
                          <span>{translateRoomName(s.roomName, isEn)}</span>
                        </div>

                        <div className="flex items-center justify-between gap-1 pt-1 border-t border-black/5">
                          <span className="font-bold text-brand-navy-700">
                            {s.enrolledCount}/{s.capacity} {isEn ? 'Students' : 'HV'}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${statusInfo.badgeClass}`}>
                            {statusInfo.label}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-brand-navy-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${percent >= 100 ? 'bg-brand-danger-500' : 'bg-brand-sage-500'}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Action Links */}
                      <div className="pt-2 border-t border-black/5 flex items-center justify-between text-[11px] font-bold">
                        <a
                          href={`#/coach/members?classId=${s.classId}`}
                          onClick={e => e.stopPropagation()}
                          className="text-brand-navy-700 hover:text-brand-navy-900 flex items-center gap-0.5 hover:underline"
                        >
                          <span className="material-symbols-outlined text-[13px]">group</span>
                          <span>{isEn ? 'Students' : 'Học viên'}</span>
                        </a>
                        <a
                          href={`#/coach/attendance?sessionId=${s.id}&date=${s.sessionDate}`}
                          onClick={e => e.stopPropagation()}
                          className="text-brand-navy-700 hover:text-brand-terra-500 flex items-center gap-0.5 hover:underline font-semibold"
                        >
                          <span className="material-symbols-outlined text-[13px]">how_to_reg</span>
                          <span>{isEn ? 'Attendance' : 'Điểm danh'}</span>
                        </a>
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
