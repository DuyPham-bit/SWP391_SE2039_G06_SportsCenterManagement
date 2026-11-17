import React from 'react';
import { translateSportName, translateRoomName, translateClassName } from '../../../shared/i18n/i18nHelper.js';
import { formatFullDate } from '../lib/attendanceCalendar.js';
import { parseCalendarDate } from '../../../shared/lib/dateTime.js';
import { SCMS_HERO_SECTION_CLASS, ScmsHeroDecor } from '../../../shared/ui/ScmsHeroBanner.jsx';

export function ActiveSessionCard({ activeSession, activeSessionStatusInfo, handleSelectSession, isEn, schedule }) {
  return (
    <div className={`${SCMS_HERO_SECTION_CLASS} !rounded-2xl !p-5 md:!p-6`}>
      <ScmsHeroDecor />
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white/95 text-brand-sage-900 shadow-2xs">
              {translateSportName(activeSession.sportName, isEn)}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/15 text-white border border-white/25">
              {isEn ? `Room: ${translateRoomName(activeSession.roomName, isEn)}` : `Phòng: ${activeSession.roomName}`}
            </span>
            {activeSessionStatusInfo && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/25 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${activeSessionStatusInfo.dot}`}></span>
                {activeSessionStatusInfo.label}
              </span>
            )}
          </div>

          <h2 className="font-chivo text-xl md:text-2xl font-black tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            {translateClassName(activeSession.name, isEn)}
          </h2>

          <p className="text-white/95 text-xs md:text-sm mt-1 flex items-center flex-wrap gap-x-3 gap-y-1 font-medium">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-brand-sand-200">calendar_month</span>
              <strong>{activeSession.dayOfWeek}, {formatFullDate(parseCalendarDate(activeSession.sessionDate))}</strong>
            </span>
            <span className="opacity-70">·</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-brand-sand-200">schedule</span>
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
