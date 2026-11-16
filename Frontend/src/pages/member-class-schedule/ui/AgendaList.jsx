import React from 'react';
import { parseIsoDate } from '../../../shared/lib/calendar.js';
import { getSportTheme } from '../lib/calendarView.js';
import { getSessionAction } from '../lib/sessionAction.js';
import { SessionActionButton } from './SessionActionButton.jsx';
import { translateSportName, translateClassName, translateCoachName, translateRoomName } from '../../../shared/i18n/i18nHelper.js';

export function AgendaList({ DAY_LABELS, bookedSessionIds, classesByDate, handleOpenSessionDetail, isEn, todayStr }) {
  return (
    <div className="bg-white rounded-2xl border border-brand-navy-200 shadow-sm divide-y divide-brand-navy-100 overflow-hidden">
      {Array.from(classesByDate.entries()).length === 0 ? (
        <div className="p-12 text-center text-brand-navy-400 text-xs">
          <span className="material-symbols-outlined text-4xl text-brand-navy-300 block mb-2">event_busy</span>
          <p>{isEn ? 'No classes match the current filter.' : 'Không có ca học nào phù hợp với bộ lọc hiện tại.'}</p>
        </div>
      ) : (
        Array.from(classesByDate.entries()).map(([dateStr, dayClasses]) => {
          const d = parseIsoDate(dateStr);
          const isToday = dateStr === todayStr;

          return (
            <div key={dateStr} className="p-4 sm:p-5 space-y-3">
              {/* Date Heading */}
              <div className="flex items-center gap-2.5">
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                        isToday
                          ? 'bg-brand-danger-600 text-white shadow-xs'
                          : 'bg-brand-navy-900 text-white'
                      }`}
                >
                  {DAY_LABELS[d.getUTCDay()]} · {dateStr}
                </span>
                <span className="text-xs text-brand-navy-500 font-bold">
                  {dayClasses.length} {isEn ? 'training sessions' : 'ca tập rèn luyện'}
                </span>
              </div>

              {/* Table Rows of Sessions */}
              <div className="divide-y divide-brand-navy-100 border border-brand-navy-200 rounded-xl overflow-hidden bg-brand-navy-50/20">
                {dayClasses.map(cls => {
                  const theme = getSportTheme(cls.sportName, isEn);
                  const action = getSessionAction(cls, bookedSessionIds, isEn);
                  const isBooked = action.state === 'ALREADY_BOOKED';

                  return (
                    <div
                      key={cls.sessionId || cls.id}
                      onClick={() => handleOpenSessionDetail(cls)}
                      className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${action.dimmed ? 'opacity-50 pointer-events-none ' : ''}${
                            isBooked
                              ? 'bg-brand-sage-50/70 hover:bg-brand-sage-100/70'
                              : 'bg-white hover:bg-brand-navy-50'
                          }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Time Badge */}
                        <div className="w-24 shrink-0 font-mono font-bold text-brand-navy-900 text-sm">
                          {cls.timeSlot}
                        </div>

                        {/* Info */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${theme.badge}`}>
                              {translateSportName(cls.sportName, isEn)}
                            </span>
                            <h4 className="font-chivo font-black text-brand-navy-900 text-sm truncate">
                              {translateClassName(cls.name, isEn)}
                            </h4>
                          </div>
                          <p className="text-brand-navy-500 text-[11px]">
                            {isEn ? 'Coach' : 'HLV'}: <strong className="text-brand-navy-800">{translateCoachName(cls.coachName, isEn)}</strong> · {isEn ? 'Venue' : 'Địa điểm'}: <strong className="text-brand-navy-800">{translateRoomName(cls.roomName, isEn)}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Capacity & Action Buttons */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                        <div className="text-right">
                          <span className="text-[10px] text-brand-navy-400 uppercase font-bold block">{isEn ? 'Capacity' : 'Sức chứa'}</span>
                          <span className="font-chivo font-bold text-brand-navy-900">
                            {cls.enrolledCount}/{cls.capacity} ({cls.capacity - cls.enrolledCount} {isEn ? 'left' : 'trống'})
                          </span>
                        </div>

                        <SessionActionButton action={action} cls={cls} handleOpenSessionDetail={handleOpenSessionDetail} size="md" />
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
