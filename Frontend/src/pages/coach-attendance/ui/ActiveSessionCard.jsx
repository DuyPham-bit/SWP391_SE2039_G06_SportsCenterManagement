import React from 'react';
import { translateSportName, translateRoomName, translateClassName } from '../../../shared/i18n/i18nHelper.js';
import { formatFullDate } from '../lib/attendanceCalendar.js';
import { parseCalendarDate } from '../../../shared/lib/dateTime.js';

export function ActiveSessionCard({ activeSession, activeSessionStatusInfo, handleSelectSession, isEn, schedule }) {
  return (
    <div className="bg-gradient-to-r from-brand-sage-700 via-brand-teal-600 via-brand-teal-500 to-brand-sand-500 dark:from-brand-sage-900 dark:via-brand-teal-900 dark:via-brand-teal-800 dark:to-brand-sand-900 text-white p-5 md:p-6 rounded-2xl relative overflow-hidden shadow-lg border border-white/20">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -right-12 -top-12 w-64 h-64 rounded-full bg-gradient-to-br from-brand-sand-300/35 via-brand-sand-500/20 to-transparent blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-gradient-to-tr from-brand-sage-500/30 via-brand-sage-700/20 to-transparent blur-2xl" />
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-danger-600 text-white">
              {translateSportName(activeSession.sportName, isEn)}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
              {isEn ? `Room: ${translateRoomName(activeSession.roomName, isEn)}` : `Phòng: ${activeSession.roomName}`}
            </span>
            {activeSessionStatusInfo && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${activeSessionStatusInfo.dot}`}></span>
                {activeSessionStatusInfo.label}
              </span>
            )}
          </div>

          <h2 className="font-chivo text-xl md:text-2xl font-black tracking-tight text-white">
            {translateClassName(activeSession.name, isEn)}
          </h2>

          <p className="text-brand-navy-300 text-xs md:text-sm mt-1 flex items-center flex-wrap gap-x-3 gap-y-1">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-brand-danger-400">calendar_month</span>
              <strong>{activeSession.dayOfWeek}, {formatFullDate(parseCalendarDate(activeSession.sessionDate))}</strong>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-brand-danger-400">schedule</span>
              <strong>{activeSession.timeSlot}</strong>
            </span>
            <span>·</span>
            <span>{isEn ? 'Enrolled students: ' : 'Sĩ số đăng ký: '}<strong>{activeSession.enrolledCount}/{activeSession.capacity} {isEn ? 'students' : 'học viên'}</strong></span>
          </p>
        </div>

        {/* Quick Session Switcher Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-0 sm:min-w-[260px]">
          <div className="bg-white/10 p-2.5 rounded-xl border border-white/15 text-xs text-brand-navy-200">
            <span className="text-[10px] text-brand-navy-400 uppercase font-bold block mb-1">
              {isEn ? 'Switch session:' : 'Đổi ca dạy khác:'}
            </span>
            <select
              aria-label={isEn ? "Switch session" : "Đổi ca dạy nhanh"}
              value={activeSession.id}
              onChange={e => {
                const found = schedule.sessions.find(s => s.id === Number(e.target.value));
                if (found) handleSelectSession(found, false);
              }}
              className="w-full bg-brand-navy-900 border border-brand-navy-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-brand-danger-500"
            >
              {schedule.sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {translateClassName(s.name, isEn)} · {s.sessionDate} · {s.timeSlot}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
