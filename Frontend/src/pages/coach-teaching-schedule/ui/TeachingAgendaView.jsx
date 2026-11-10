import React from 'react';
import { parseIsoDate } from '../../../shared/lib/calendar.js';
import { getSportTheme } from '../lib/calendarView.js';
import { translateClassName, translateRoomName } from '../../../shared/i18n/i18nHelper.js';

export function TeachingAgendaView({ DAY_LABELS, STATUS_CONFIG, handleOpenDetail, isEn, sessionsByDate, todayStr }) {
  return (
    <div className="bg-white rounded-2xl border border-brand-navy-200 shadow-sm divide-y divide-brand-navy-100 overflow-hidden">
      {Array.from(sessionsByDate.entries()).length === 0 ? (
        <div className="p-12 text-center text-brand-navy-400 text-xs">
          <span className="material-symbols-outlined text-4xl text-brand-navy-300 block mb-2">event_busy</span>
          <p>{isEn ? 'No teaching sessions found matching the current filters.' : 'Không có ca dạy nào phù hợp với bộ lọc hiện tại.'}</p>
        </div>
      ) : (
        Array.from(sessionsByDate.entries()).map(([dateStr, daySessions]) => {
          const d = parseIsoDate(dateStr);
          const isToday = dateStr === todayStr;

          return (
            <div key={dateStr} className="p-4 sm:p-5 space-y-3">
              {/* Date Heading */}
              <div className="flex items-center gap-2.5">
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                            isToday
                              ? 'bg-brand-navy-700 text-brand-sand-300 shadow-xs'
                              : 'bg-brand-navy-900 text-white'
                          }`}
                >
                  {DAY_LABELS[d.getUTCDay()]} · {dateStr}
                </span>
                <span className="text-xs text-brand-navy-500 font-bold">
                  {daySessions.length} {isEn ? (daySessions.length === 1 ? 'assigned session' : 'assigned sessions') : 'ca dạy phân công'}
                </span>
              </div>

              {/* Sessions Rows */}
              <div className="divide-y divide-brand-navy-100 border border-brand-navy-200 rounded-xl overflow-hidden bg-brand-navy-50/20">
                {daySessions.map(s => {
                  const theme = getSportTheme(s.sportName, isEn);
                  const statusInfo = STATUS_CONFIG[s.status] || STATUS_CONFIG.SCHEDULED;

                  return (
                    <div
                      key={s.id}
                      onClick={() => handleOpenDetail(s)}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs cursor-pointer transition-colors bg-white hover:bg-brand-navy-50"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-24 shrink-0 font-mono font-bold text-brand-navy-900 text-sm">
                          {s.timeSlot}
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${theme.badge}`}>
                              {theme.tag}
                            </span>
                            <h4 className="font-chivo font-black text-brand-navy-900 text-sm truncate">
                              {translateClassName(s.name, isEn)}
                            </h4>
                          </div>
                          <p className="text-brand-navy-500 text-[11px]">
                            {isEn ? 'Room:' : 'Phòng:'} <strong className="text-brand-navy-800">{translateRoomName(s.roomName, isEn)}</strong> · {isEn ? 'Status:' : 'Trạng thái:'} <strong className="text-brand-navy-800">{statusInfo.label}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                        <div className="text-right">
                          <span className="text-[10px] text-brand-navy-400 uppercase font-bold block">{isEn ? 'Enrollment' : 'Sĩ số'}</span>
                          <span className="font-chivo font-bold text-brand-navy-900">
                            {s.enrolledCount}/{s.capacity} {isEn ? 'Students' : 'HV'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={`#/coach/members?classId=${s.classId}`}
                            onClick={e => e.stopPropagation()}
                            className="px-3 py-1.5 rounded-lg border border-brand-navy-200 hover:bg-brand-navy-100 text-brand-navy-700 font-bold transition-colors"
                          >
                            {isEn ? 'Students' : 'Học viên'}
                          </a>
                          <a
                            href={`#/coach/attendance?sessionId=${s.id}&date=${s.sessionDate}`}
                            onClick={e => e.stopPropagation()}
                            className="px-3.5 py-1.5 rounded-lg bg-brand-sand-300 hover:bg-brand-terra-500 text-brand-navy-900 hover:text-white font-bold transition-colors shadow-xs"
                          >
                            {isEn ? 'Attendance' : 'Điểm danh'}
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
