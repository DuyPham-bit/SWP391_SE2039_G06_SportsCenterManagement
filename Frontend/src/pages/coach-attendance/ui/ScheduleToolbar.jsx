import React from 'react';
import { formatFullDate } from '../lib/attendanceCalendar.js';
import { translateSportName } from '../../../shared/i18n/i18nHelper.js';

export function ScheduleToolbar({
  availableSports, handleNextWeek, handlePrevWeek, handleThisWeek, isEn, readinessFilter,
  selectedSport, setReadinessFilter, setSelectedSport, setViewMode, viewMode, weekDays
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-brand-navy-100">
      {/* Week Navigation Controls */}
      <div className="flex items-center flex-wrap gap-2">
        <div className="flex items-center bg-brand-navy-100 p-1 rounded-xl border border-brand-navy-200">
          <button
            type="button"
            onClick={handlePrevWeek}
            title={isEn ? "Previous week" : "Tuần trước"}
            className="p-1.5 rounded-lg hover:bg-white text-brand-navy-700 transition-all flex items-center"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={handleThisWeek}
            className="px-3 py-1 rounded-lg text-xs font-bold text-brand-navy-700 hover:bg-white transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm text-brand-danger-600 dark:text-brand-danger-400">today</span>
            <span>{isEn ? 'This week' : 'Tuần này'}</span>
          </button>
          <button
            type="button"
            onClick={handleNextWeek}
            title={isEn ? "Next week" : "Tuần sau"}
            className="p-1.5 rounded-lg hover:bg-white text-brand-navy-700 transition-all flex items-center"
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>

        <div className="bg-brand-navy-50 px-3 py-1.5 rounded-xl border border-brand-navy-200 text-xs font-bold text-brand-navy-800 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-brand-navy-500">calendar_month</span>
          <span>
            {formatFullDate(weekDays[0])} – {formatFullDate(weekDays[6])}
          </span>
        </div>
      </div>

      {/* View Mode & Filters */}
      <div className="flex items-center flex-wrap gap-2">
        {/* View Mode Switcher */}
        <div className="flex items-center bg-brand-navy-100 p-1 rounded-xl border border-brand-navy-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode('weekly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'weekly'
                    ? 'bg-white text-brand-danger-600 shadow-sm font-extrabold'
                    : 'text-brand-navy-600 hover:text-brand-navy-900'
                }`}
          >
            <span className="material-symbols-outlined text-sm">calendar_view_week</span>
            <span>{isEn ? 'Weekly' : 'Lịch tuần'}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-brand-danger-600 shadow-sm font-extrabold'
                    : 'text-brand-navy-600 hover:text-brand-navy-900'
                }`}
          >
            <span className="material-symbols-outlined text-sm">format_list_bulleted</span>
            <span>{isEn ? 'List' : 'Danh sách ca'}</span>
          </button>
        </div>

        {/* Sport Filter */}
        {availableSports.length > 2 && (
          <select
            aria-label={isEn ? "Filter by sport" : "Lọc theo môn"}
            value={selectedSport}
            onChange={e => setSelectedSport(e.target.value)}
            className="px-3 py-1.5 bg-white border border-brand-navy-200 rounded-xl text-xs font-bold text-brand-navy-700 focus:ring-2 focus:ring-brand-danger-600 focus:outline-none"
          >
            <option value="ALL">{isEn ? 'All Sports' : 'Tất cả môn'}</option>
            {availableSports.filter(s => s !== 'ALL').map(sport => (
              <option key={sport} value={sport}>{translateSportName(sport, isEn)}</option>
            ))}
          </select>
        )}

        {/* Readiness Filter */}
        <select
          aria-label={isEn ? "Filter by readiness" : "Lọc theo trạng thái điểm danh"}
          value={readinessFilter}
          onChange={e => setReadinessFilter(e.target.value)}
          className="px-3 py-1.5 bg-white border border-brand-navy-200 rounded-xl text-xs font-bold text-brand-navy-700 focus:ring-2 focus:ring-brand-danger-600 focus:outline-none"
        >
          <option value="ALL">{isEn ? 'All Sessions' : 'Tất cả ca'}</option>
          <option value="READY">{isEn ? '⚡ Ready for Attendance' : '⚡ Sẵn sàng điểm danh'}</option>
          <option value="UPCOMING">{isEn ? '⏳ Upcoming' : '⏳ Sắp diễn ra'}</option>
          <option value="CANCELLED">{isEn ? '✕ Cancelled' : '✕ Đã hủy'}</option>
        </select>
      </div>
    </div>
  );
}
