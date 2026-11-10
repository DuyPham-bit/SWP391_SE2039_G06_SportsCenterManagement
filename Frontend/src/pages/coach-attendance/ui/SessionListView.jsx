import React from 'react';
import { formatFullDate, formatDayMonth } from '../lib/attendanceCalendar.js';
import { getSessionStatusInfo } from '../lib/attendanceStatus.js';
import { canAttendSession } from '../../../entities/coach/index.js';
import { getSportBadgeTheme, getTimeOfDayBadge } from '../lib/badges.js';
import { parseCalendarDate } from '../../../shared/lib/dateTime.js';
import { translateSportName, translateClassName, translateRoomName } from '../../../shared/i18n/i18nHelper.js';

export function SessionListView({
  activeSession, filteredSessions, handleSelectSession, isEn, readinessFilter, selectedDateIso,
  selectedDayInfo, selectedSport, setReadinessFilter, setSelectedDateIso, setSelectedSport, todayIso
}) {
  return (
    <div className="space-y-4">
      {/* Optional Selected Day Focus Banner */}
      {selectedDateIso !== 'ALL' && selectedDayInfo && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-brand-danger-500/10 via-brand-sand-500/5 to-brand-navy-50 border border-brand-danger-200 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-danger-600 text-white flex items-center justify-center font-black shadow-xs">
              <span className="material-symbols-outlined text-lg">event</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-chivo font-black text-sm md:text-base text-brand-navy-900">
                  {selectedDayInfo.dayFullLabel}, {formatFullDate(selectedDayInfo.date)}
                </span>
                {selectedDateIso === todayIso && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-danger-600 text-white">
                    {isEn ? 'Today' : 'Hôm nay'}
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-danger-100 text-brand-danger-800 border border-brand-danger-200">
                  {filteredSessions.length} {isEn ? 'sessions' : 'ca dạy'}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDateIso('ALL')}
            className="text-xs font-bold text-brand-navy-700 hover:text-brand-danger-600 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-navy-300 bg-white hover:bg-brand-navy-50 transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-sm">view_agenda</span>
            <span>{isEn ? 'View all days this week' : 'Xem tất cả các ngày trong tuần'}</span>
          </button>
        </div>
      )}

      {filteredSessions.length === 0 ? (
        <div className="p-10 text-center bg-brand-navy-50 rounded-2xl border border-dashed border-brand-navy-200">
          <span className="material-symbols-outlined text-4xl text-brand-navy-300">event_busy</span>
          <p className="text-sm font-bold text-brand-navy-700 mt-2">
            {isEn ? 'No teaching sessions match your current filter.' : 'Không tìm thấy ca dạy nào phù hợp với bộ lọc.'}
          </p>
          <p className="text-xs text-brand-navy-500 mt-1">
            {isEn ? 'Try selecting another day, sport, or clearing readiness filters.' : 'Thử chọn ngày khác, môn học khác hoặc xóa bộ lọc trạng thái.'}
          </p>
          {(selectedDateIso !== 'ALL' || selectedSport !== 'ALL' || readinessFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSelectedDateIso('ALL');
                setSelectedSport('ALL');
                setReadinessFilter('ALL');
              }}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-navy-900 hover:bg-brand-navy-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              <span>{isEn ? 'Reset all filters' : 'Xóa tất cả bộ lọc'}</span>
            </button>
          )}
        </div>
      ) : (
        /* REAL HIGH-DENSITY LIST TABLE VIEW */
        <div className="overflow-x-auto rounded-2xl border border-brand-navy-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-brand-navy-50 border-b border-brand-navy-200 text-brand-navy-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">{isEn ? 'Time Slot' : 'Thời gian'}</th>
                <th className="py-3 px-4">{isEn ? 'Sport & Class' : 'Môn học & Lớp'}</th>
                <th className="py-3 px-4">{isEn ? 'Room / Venue' : 'Phòng học'}</th>
                <th className="py-3 px-4">{isEn ? 'Enrolled' : 'Sĩ số'}</th>
                <th className="py-3 px-4">{isEn ? 'Status' : 'Trạng thái'}</th>
                <th className="py-3 px-4 text-right">{isEn ? 'Action' : 'Thao tác'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-navy-100">
              {filteredSessions.map(s => {
                const isSelected = activeSession?.id === s.id;
                const statusInfo = getSessionStatusInfo(s, isEn);
                const attendable = canAttendSession(s);
                const sportTheme = getSportBadgeTheme(s.sportName, isEn);
                const timeOfDay = getTimeOfDayBadge(s.timeSlot, isEn);
                const fillPercent = s.capacity > 0 ? Math.round((s.enrolledCount / s.capacity) * 100) : 0;
                return (
                  <tr
                    key={s.id}
                    onClick={() => handleSelectSession(s)}
                    className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-brand-danger-50/50 font-medium' : 'hover:bg-brand-navy-50'
                          }`}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-chivo font-black text-brand-navy-900">{s.timeSlot}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${timeOfDay.badge}`}>
                          {timeOfDay.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-brand-navy-500 font-semibold mt-0.5">
                        {s.dayOfWeek}, {formatDayMonth(parseCalendarDate(s.sessionDate))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${sportTheme.tagBg}`}>
                          <span className="material-symbols-outlined text-xs">{sportTheme.icon}</span>
                          <span>{translateSportName(s.sportName, isEn)}</span>
                        </span>
                      </div>
                      <div className="font-chivo font-bold text-brand-navy-900 line-clamp-1">
                        {translateClassName(s.name, isEn)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-brand-navy-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-brand-navy-400">stadium</span>
                        <span>{translateRoomName(s.roomName, isEn)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-brand-navy-800">
                        {s.enrolledCount}/{s.capacity} <span className="text-[10px] font-normal text-brand-navy-500">({fillPercent}%)</span>
                      </div>
                      <div className="w-24 bg-brand-navy-100 rounded-full h-1 mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${fillPercent >= 100 ? 'bg-brand-danger-500' : fillPercent >= 80 ? 'bg-brand-sand-500' : 'bg-brand-sage-500'}`}
                          style={{ width: `${Math.min(100, fillPercent)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {attendable ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-sage-100 text-brand-sage-800 border border-brand-sage-300 flex items-center gap-1 w-fit shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse"></span>
                          <span>{isEn ? '⚡ Ready' : '⚡ Sẵn sàng'}</span>
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 w-fit ${statusInfo.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                          <span>{statusInfo.label}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs ${
                                isSelected
                                  ? 'bg-brand-danger-600 text-white shadow-brand-danger-500/20'
                                  : attendable
                                    ? 'bg-brand-sage-700 hover:bg-brand-sage-800 text-white shadow-brand-sage-600/20'
                                    : 'bg-brand-navy-900 hover:bg-brand-danger-600 text-white'
                              }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {isSelected ? 'check' : attendable ? 'fact_check' : 'visibility'}
                        </span>
                        <span>
                          {isSelected
                            ? (isEn ? 'Taking attendance' : 'Đang điểm danh')
                            : attendable
                              ? (isEn ? 'Roll-call' : 'Điểm danh ngay')
                              : (isEn ? 'Select' : 'Chọn ca')}
                        </span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
