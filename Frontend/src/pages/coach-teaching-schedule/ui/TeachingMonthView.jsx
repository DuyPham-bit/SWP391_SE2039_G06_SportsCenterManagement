import React from 'react';
import { getMonthCalendarGrid, getSportTheme } from '../lib/calendarView.js';
import { formatIsoDate } from '../../../shared/lib/calendar.js';
import { translateClassName, translateRoomName } from '../../../shared/i18n/i18nHelper.js';

export function TeachingMonthView({
  SHORT_DAY_LABELS, STATUS_CONFIG, currentDate, handleOpenDetail, isEn, selectedCalendarDate,
  sessionsByDate, setSelectedCalendarDate, todayStr
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-brand-navy-200 shadow-sm overflow-hidden">
        {/* Header 7 Ngày trong tuần */}
        <div className="grid grid-cols-7 border-b border-brand-navy-200 bg-brand-navy-50/80 divide-x divide-brand-navy-200 text-center py-2 text-xs font-bold text-brand-navy-600">
          {SHORT_DAY_LABELS.map(lbl => (
            <div key={lbl} className="uppercase tracking-wider">{lbl}</div>
          ))}
        </div>

        {/* Grid 42 Ngày của Tháng */}
        <div className="grid grid-cols-7 divide-x divide-y divide-brand-navy-100 bg-brand-navy-50/20">
          {getMonthCalendarGrid(currentDate.getUTCFullYear(), currentDate.getUTCMonth()).map((d, index) => {
            const dateStr = formatIsoDate(d);
            const isCurrentMonth = d.getUTCMonth() === currentDate.getUTCMonth();
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedCalendarDate;
            const daySessions = sessionsByDate.get(dateStr) || [];

            return (
              <div
                key={index}
                onClick={() => setSelectedCalendarDate(dateStr)}
                className={`min-h-[90px] p-1.5 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-brand-danger-50/70 ring-2 ring-brand-danger-500/30'
                            : isToday
                            ? 'bg-brand-danger-50/20 hover:bg-brand-navy-100/60'
                            : isCurrentMonth
                            ? 'bg-white hover:bg-brand-navy-50'
                            : 'bg-brand-navy-50/60 text-brand-navy-400 hover:bg-brand-navy-100/40'
                        }`}
              >
                {/* Header ngày */}
                <div className="flex items-center justify-between">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isToday
                                ? 'bg-brand-navy-700 text-brand-sand-300 font-black'
                                : isCurrentMonth
                                ? 'text-brand-navy-900'
                                : 'text-brand-navy-400'
                            }`}
                  >
                    {d.getUTCDate()}
                  </span>
                  {daySessions.length > 0 && (
                    <span className="text-[10px] font-bold text-brand-navy-600 bg-brand-navy-100 px-1 rounded-full">
                      {daySessions.length} {isEn ? 'sess.' : 'ca'}
                    </span>
                  )}
                </div>

                {/* Session Chips */}
                <div className="space-y-1 my-1">
                  {daySessions.slice(0, 2).map(s => {
                    const theme = getSportTheme(s.sportName, isEn);
                    return (
                      <div
                        key={s.id}
                        onClick={e => {
                          e.stopPropagation();
                          handleOpenDetail(s);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold truncate flex items-center gap-1 border ${theme.bg} ${theme.text} ${theme.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.dot}`} />
                        <span className="truncate">{s.timeSlot.slice(0, 5)} {translateClassName(s.name, isEn)}</span>
                      </div>
                    );
                  })}
                  {daySessions.length > 2 && (
                    <span className="text-[9px] font-bold text-brand-navy-500 block text-right">
                      {isEn ? `+${daySessions.length - 2} more` : `+${daySessions.length - 2} ca nữa`}
                    </span>
                  )}
                </div>

                <div className="h-1" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Chi tiết ca dạy của ngày được chọn trong Tháng */}
      <div className="p-4 rounded-2xl bg-white border border-brand-navy-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-brand-navy-100 flex-wrap gap-2">
          <h3 className="font-chivo font-black text-sm text-brand-navy-900 uppercase tracking-wide flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-sand-300 text-[18px]">event</span>
            <span>
              {isEn
                ? `Sessions on: ${selectedCalendarDate} (${(sessionsByDate.get(selectedCalendarDate) || []).length} sessions)`
                : `Ca dạy ngày: ${selectedCalendarDate} (${(sessionsByDate.get(selectedCalendarDate) || []).length} ca)`}
            </span>
          </h3>
          <span className="text-xs text-brand-navy-400">
            {isEn ? 'Click on a session to view details or record attendance' : 'Nhấp vào ca dạy để xem thông tin hoặc điểm danh'}
          </span>
        </div>

        {(sessionsByDate.get(selectedCalendarDate) || []).length === 0 ? (
          <p className="text-xs text-brand-navy-500 italic py-2">
            {isEn
              ? 'No teaching sessions assigned for this date. Please pick another date on the calendar.'
              : 'Không có ca dạy nào được phân công trong ngày này. Vui lòng chọn ngày khác trên lịch.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(sessionsByDate.get(selectedCalendarDate) || []).map(s => {
              const theme = getSportTheme(s.sportName, isEn);
              const statusInfo = STATUS_CONFIG[s.status] || STATUS_CONFIG.SCHEDULED;

              return (
                <div
                  key={s.id}
                  onClick={() => handleOpenDetail(s)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all hover:shadow-md flex flex-col justify-between ${theme.bg} ${theme.border}`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${theme.badge}`}>
                        {theme.tag}
                      </span>
                      <span className="font-bold text-brand-navy-700">{s.timeSlot}</span>
                    </div>
                    <h4 className="font-chivo font-black text-sm text-brand-navy-900 leading-snug">
                      {translateClassName(s.name, isEn)}
                    </h4>
                    <p className="text-[11px] text-brand-navy-600 mt-1">
                      {isEn ? 'Court / Room:' : 'Địa điểm:'} <strong>{translateRoomName(s.roomName, isEn)}</strong> · {isEn ? 'Enrolled:' : 'Sĩ số:'} <strong>{s.enrolledCount}/{s.capacity}</strong>
                    </p>
                  </div>

                  <div className="pt-2 mt-2 border-t border-black/5 flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeClass}`}>
                      {statusInfo.label}
                    </span>
                    <div className="flex items-center gap-2 font-bold">
                      <a
                        href={`#/coach/attendance?sessionId=${s.id}&date=${s.sessionDate}`}
                        onClick={e => e.stopPropagation()}
                        className="text-brand-navy-700 hover:text-brand-terra-500 hover:underline"
                      >
                        {isEn ? 'Attendance →' : 'Điểm danh →'}
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
