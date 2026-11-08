import React from 'react';
import { toIsoDate, formatDayMonth } from '../lib/attendanceCalendar.js';
import { getSessionStatusInfo } from '../lib/attendanceStatus.js';
import { canAttendSession } from '../../../entities/coach/index.js';
import { getSportBadgeTheme } from '../lib/badges.js';
import { translateSportName, translateClassName, translateRoomName } from '../../../shared/i18n/i18nHelper.js';

export function WeeklyScheduleView({ DAY_FULL_LABELS, activeSession, handleSelectSession, isEn, sessionsByDate, todayIso, weekDays }) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="min-w-[840px] grid grid-cols-7 gap-3">
        {weekDays.map((d, index) => {
          const iso = toIsoDate(d);
          const daySessions = sessionsByDate[iso] || [];
          const isToday = iso === todayIso;

          return (
            <div
              key={iso}
              className={`flex flex-col rounded-2xl border transition-all ${
                      isToday
                        ? 'bg-brand-danger-50/20 dark:bg-brand-danger-900/15 border-brand-danger-200 dark:border-brand-danger-800 shadow-sm'
                        : 'bg-brand-navy-50/50 border-brand-navy-200'
                    }`}
            >
              {/* Day Column Header */}
              <div className={`p-3 text-center border-b rounded-t-2xl ${
                      isToday
                        ? 'bg-brand-danger-700 text-white border-brand-danger-700'
                        : 'bg-white text-brand-navy-800 border-brand-navy-200'
                    }`}>
                <div className="text-[11px] uppercase tracking-wider font-extrabold">
                  {DAY_FULL_LABELS[index]}
                </div>
                <div className="text-base font-black mt-0.5">
                  {formatDayMonth(d)}
                </div>
                <div className="flex items-center justify-center gap-1 mt-1 text-[10px]">
                  {isToday && (
                    <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-white font-bold">
                      {isEn ? 'Today' : 'Hôm nay'}
                    </span>
                  )}
                  <span className={isToday ? 'text-white/90' : 'text-brand-navy-500 font-semibold'}>
                    {isEn ? `${daySessions.length} sessions` : `${daySessions.length} ca dạy`}
                  </span>
                </div>
              </div>

              {/* Day Sessions List */}
              <div className="p-2 space-y-2 flex-1 min-h-[160px]">
                {daySessions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-brand-navy-400 py-6 text-center">
                    <span className="material-symbols-outlined text-2xl text-brand-navy-300">event_busy</span>
                    <span className="text-[11px] mt-1">{isEn ? 'No sessions' : 'Không có ca'}</span>
                  </div>
                ) : (
                  daySessions.map(s => {
                    const isSelected = activeSession?.id === s.id;
                    const statusInfo = getSessionStatusInfo(s, isEn);
                    const attendable = canAttendSession(s);
                    const sportTheme = getSportBadgeTheme(s.sportName, isEn);
                    const fillPercent = s.capacity > 0 ? Math.round((s.enrolledCount / s.capacity) * 100) : 0;

                    return (
                      <div
                        key={s.id}
                        onClick={() => handleSelectSession(s)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && handleSelectSession(s)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative group ${
                                isSelected
                                  ? 'bg-white border-brand-danger-600 ring-2 ring-brand-danger-600/30 shadow-md scale-[1.02]'
                                  : attendable
                                    ? 'bg-white border-brand-sage-300 hover:border-brand-sage-500 hover:shadow-sm'
                                    : 'bg-white border-brand-navy-200 hover:border-brand-danger-300 hover:shadow-sm'
                              } border-l-4 ${sportTheme.accent}`}
                      >
                        {/* Selected Marker */}
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-danger-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-danger-600"></span>
                            </span>
                          </div>
                        )}

                        {/* Time & Sport */}
                        <div className="flex items-center gap-1 text-[11px] font-extrabold text-brand-navy-900 mb-1">
                          <span className="material-symbols-outlined text-xs text-brand-danger-600">schedule</span>
                          <span>{s.timeSlot}</span>
                        </div>

                        <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${sportTheme.tagBg}`}>
                            <span className="material-symbols-outlined text-[11px]">{sportTheme.icon}</span>
                            <span className="truncate max-w-[85px]">{translateSportName(s.sportName, isEn)}</span>
                          </span>
                          {attendable && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-sage-100 text-brand-sage-800 border border-brand-sage-300 flex items-center gap-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-sage-500 animate-pulse"></span>
                              {isEn ? 'Roll-call' : 'Điểm danh'}
                            </span>
                          )}
                        </div>

                        {/* Class Name */}
                        <h2 className="text-xs font-black text-brand-navy-900 leading-snug line-clamp-2">
                          {translateClassName(s.name, isEn)}
                        </h2>

                        {/* Room & Capacity */}
                        <div className="mt-2 pt-2 border-t border-brand-navy-100 text-[10px] text-brand-navy-500 space-y-1">
                          <div className="flex items-center gap-1 truncate">
                            <span className="material-symbols-outlined text-[13px] text-brand-navy-400">stadium</span>
                            <span className="truncate">{translateRoomName(s.roomName, isEn)}</span>
                          </div>
                          <div className="flex items-center justify-between text-brand-navy-600 font-semibold">
                            <span>{isEn ? 'Enrolled:' : 'Đã đặt:'}</span>
                            <span className={`font-bold ${fillPercent >= 100 ? 'text-brand-danger-600' : 'text-brand-navy-900'}`}>{s.enrolledCount}/{s.capacity}</span>
                          </div>
                          <div className="w-full bg-brand-navy-100 rounded-full h-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${fillPercent >= 100 ? 'bg-brand-danger-500' : fillPercent >= 80 ? 'bg-brand-sand-500' : 'bg-brand-sage-500'}`}
                              style={{ width: `${Math.min(100, fillPercent)}%` }}
                            />
                          </div>
                        </div>

                        {/* Action prompt */}
                        <div className={`mt-2 text-center py-1 rounded text-[10px] font-bold transition-colors ${
                                isSelected
                                  ? 'bg-brand-danger-600 text-white'
                                  : attendable
                                    ? 'bg-brand-sage-50 text-brand-sage-800 border border-brand-sage-200 group-hover:bg-brand-sage-600 group-hover:text-white'
                                    : 'bg-brand-navy-50 text-brand-navy-600 group-hover:bg-brand-danger-50 group-hover:text-brand-danger-700'
                              }`}>
                          {isSelected
                            ? (isEn ? 'Selected for Attendance' : 'Đang chọn điểm danh')
                            : attendable
                              ? (isEn ? '⚡ Take attendance' : '⚡ Điểm danh ca này')
                              : (isEn ? 'Select this session' : 'Chọn ca này')}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
