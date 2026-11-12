import React from 'react';
import { getMonthCalendarGrid, getSportTheme } from '../lib/calendarView.js';
import { getSessionAction } from '../lib/sessionAction.js';
import { SessionActionButton } from './SessionActionButton.jsx';
import { formatIsoDate } from '../../../shared/lib/calendar.js';
import { translateClassName, translateSportName, translateCoachName, translateRoomName } from '../../../shared/i18n/i18nHelper.js';

export function MonthCalendar({
  DAY_LABELS, bookedSessionIds, classesByDate, currentDate, handleOpenSessionDetail, isEn,
  selectedCalendarDate, setSelectedCalendarDate, todayStr
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-brand-navy-200 shadow-sm overflow-hidden">
        {/* Header 7 Thứ */}
        <div className="grid grid-cols-7 border-b border-brand-navy-200 bg-brand-navy-50 text-center py-2.5 text-xs font-black uppercase text-brand-navy-600 tracking-wider">
          {DAY_LABELS.map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* 42 Ngày của Tháng */}
        <div className="grid grid-cols-7 divide-x divide-y divide-brand-navy-200 bg-brand-navy-100/40">
          {getMonthCalendarGrid(currentDate.getUTCFullYear(), currentDate.getUTCMonth()).map(d => {
            const dayStr = formatIsoDate(d);
            const isCurrentMonth = d.getUTCMonth() === currentDate.getUTCMonth();
            const isToday = dayStr === todayStr;
            const isSelected = dayStr === selectedCalendarDate;
            const dayClasses = classesByDate.get(dayStr) || [];
            const hasBooked = dayClasses.some(c => bookedSessionIds.has(c.sessionId) || bookedSessionIds.has(c.id));

            return (
              <div
                key={dayStr}
                onClick={() => setSelectedCalendarDate(dayStr)}
                className={`min-h-[105px] p-2 transition-all cursor-pointer flex flex-col justify-between ${
                      !isCurrentMonth ? 'bg-brand-navy-50/50 text-brand-navy-400' : 'bg-white'
                    } ${isSelected ? 'ring-2 ring-brand-danger-500 bg-brand-danger-50/20 z-10' : 'hover:bg-brand-navy-50'}`}
              >
                {/* Top Row: Ngày + Badge số lớp */}
                <div className="flex items-center justify-between">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isToday
                            ? 'bg-brand-danger-600 text-white font-black'
                            : isCurrentMonth
                            ? 'text-brand-navy-900'
                            : 'text-brand-navy-400'
                        }`}
                  >
                    {d.getUTCDate()}
                  </span>
                  <div className="flex items-center gap-1">
                    {hasBooked && (
                      <span className="w-2 h-2 rounded-full bg-brand-sage-500" title={isEn ? 'Has booked session' : 'Có lớp đã đặt vé'} />
                    )}
                    {dayClasses.length > 0 && (
                      <span className="text-[10px] font-bold text-brand-navy-500 bg-brand-navy-100 px-1 rounded">
                        {dayClasses.length} {isEn ? 'sess' : 'ca'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Danh sách các pill lớp thu nhỏ */}
                <div className="space-y-1 my-1">
                  {dayClasses.slice(0, 2).map(c => {
                    const theme = getSportTheme(c.sportName, isEn);
                    const isBooked = bookedSessionIds.has(c.sessionId) || bookedSessionIds.has(c.id);
                    return (
                      <div
                        key={c.sessionId || c.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSessionDetail(c);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold truncate flex items-center gap-1 border ${
                              isBooked
                                ? 'bg-brand-sage-100 text-brand-sage-900 border-brand-sage-300'
                                : `${theme.bg} ${theme.text} ${theme.border}`
                            }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isBooked ? 'bg-brand-sage-600' : theme.dot}`} />
                        <span className="truncate">{c.timeSlot.slice(0, 5)} {translateClassName(c.name, isEn)}</span>
                      </div>
                    );
                  })}
                  {dayClasses.length > 2 && (
                    <span className="text-[9px] font-bold text-brand-navy-500 block text-right">
                      +{dayClasses.length - 2} {isEn ? 'more' : 'ca nữa'}
                    </span>
                  )}
                </div>

                <div className="h-1" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Chi tiết ca học của ngày được click chọn trong Tháng */}
      <div className="p-4 rounded-2xl bg-white border border-brand-navy-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-brand-navy-100">
          <h3 className="font-chivo font-black text-sm text-brand-navy-900 uppercase tracking-wide flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-danger-600 text-[18px]">event</span>
            <span>{isEn ? 'Sessions on' : 'Ca học ngày'}: {selectedCalendarDate} ({(classesByDate.get(selectedCalendarDate) || []).length} {isEn ? 'sessions' : 'ca'})</span>
          </h3>
          <span className="text-xs text-brand-navy-400">{isEn ? 'Click on a session to view details or book' : 'Nhấn vào ca tập để xem chi tiết hoặc đặt chỗ'}</span>
        </div>

        {(classesByDate.get(selectedCalendarDate) || []).length === 0 ? (
          <p className="text-xs text-brand-navy-500 italic py-2">
            {isEn ? 'No workout sessions scheduled on this day. Please select another date from the calendar.' : 'Không có ca tập nào mở trong ngày này. Vui lòng chọn ngày khác trên lưới lịch.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(classesByDate.get(selectedCalendarDate) || []).map(cls => {
              const theme = getSportTheme(cls.sportName, isEn);
              const action = getSessionAction(cls, bookedSessionIds, isEn);
              const isBooked = action.state === 'ALREADY_BOOKED';

              return (
                <div
                  key={cls.sessionId || cls.id}
                  onClick={() => handleOpenSessionDetail(cls)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all hover:shadow-md flex flex-col justify-between ${action.dimmed ? 'opacity-50 pointer-events-none ' : ''}${
                        isBooked
                          ? 'bg-brand-sage-50 border-brand-sage-400 shadow-xs'
                          : `${theme.bg} ${theme.border}`
                      }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${theme.badge}`}>
                        {translateSportName(cls.sportName, isEn)}
                      </span>
                      <span className="font-bold text-brand-navy-700">{cls.timeSlot}</span>
                    </div>
                    <h4 className="font-chivo font-black text-sm text-brand-navy-900 leading-snug">
                      {translateClassName(cls.name, isEn)}
                    </h4>
                    <p className="text-[11px] text-brand-navy-600 mt-1">
                      {isEn ? 'Coach' : 'HLV'}: <strong>{translateCoachName(cls.coachName, isEn)}</strong> · {translateRoomName(cls.roomName, isEn)}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-black/5 flex justify-between items-center">
                    <span className="font-bold text-[11px] text-brand-navy-700">
                      {cls.enrolledCount}/{cls.capacity} {isEn ? 'spots' : 'chỗ'} ({cls.capacity - cls.enrolledCount} {isEn ? 'left' : 'trống'})
                    </span>
                    <SessionActionButton action={action} cls={cls} handleOpenSessionDetail={handleOpenSessionDetail} />
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
