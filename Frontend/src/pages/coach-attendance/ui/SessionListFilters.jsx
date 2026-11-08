import React from 'react';
import { toIsoDate, formatDayMonth } from '../lib/attendanceCalendar.js';

export function SessionListFilters({
  DAY_FULL_LABELS, isEn, selectedDateIso, sessionsByDate, setSelectedDateIso, todayIso, weekDays,
  weekStats
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
      <button
        type="button"
        onClick={() => setSelectedDateIso('ALL')}
        className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                selectedDateIso === 'ALL'
                  ? 'bg-brand-navy-900 text-white border-brand-navy-900 shadow-sm'
                  : 'bg-brand-navy-50 text-brand-navy-600 border-brand-navy-200 hover:bg-brand-navy-100'
              }`}
      >
        <span>{isEn ? 'All Days' : 'Tất cả các ngày'}</span>
        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                selectedDateIso === 'ALL' ? 'bg-white/20 text-white' : 'bg-brand-navy-200 text-brand-navy-700'
              }`}>
          {weekStats.total}
        </span>
      </button>
      {weekDays.map((d, index) => {
        const iso = toIsoDate(d);
        const isSelected = selectedDateIso === iso;
        const isToday = iso === todayIso;
        const count = (sessionsByDate[iso] || []).length;
        return (
          <button
            key={iso}
            type="button"
            onClick={() => setSelectedDateIso(iso)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-brand-danger-600 text-white border-brand-danger-600 shadow-sm'
                      : isToday
                        ? 'bg-brand-danger-50 text-brand-danger-700 border-brand-danger-200 hover:bg-brand-danger-100 font-extrabold'
                        : 'bg-white text-brand-navy-700 border-brand-navy-200 hover:bg-brand-navy-50'
                  }`}
          >
            <span>{DAY_FULL_LABELS[index]}</span>
            <span className="opacity-75 font-normal">({formatDayMonth(d)})</span>
            {count > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected ? 'bg-white text-brand-danger-600' : 'bg-brand-navy-100 text-brand-navy-700'
                    }`}>
                {count}
              </span>
            )}
            {isToday && (
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] uppercase font-black tracking-wider ${
                      isSelected ? 'bg-white/25 text-white' : 'bg-brand-danger-600 text-white'
                    }`}>
                {isEn ? 'Today' : 'Hôm nay'}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
