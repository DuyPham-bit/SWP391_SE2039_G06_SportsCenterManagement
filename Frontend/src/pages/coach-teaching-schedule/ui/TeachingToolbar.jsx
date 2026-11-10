import React from 'react';
import { formatIsoDate, parseIsoDate } from '../../../shared/lib/calendar.js';
import { getSportTheme } from '../lib/calendarView.js';
import { translateSportName } from '../../../shared/i18n/i18nHelper.js';

export function TeachingToolbar({
  availableSports, currentDate, handleNext, handlePrev, handleToday, isEn, periodTitle, schedule,
  searchQuery, selectedSport, selectedStatus, selectedTimeSlot, setCurrentDate, setSearchQuery,
  setSelectedCalendarDate, setSelectedSport, setSelectedStatus, setSelectedTimeSlot, setViewMode,
  viewMode
}) {
  return (
    <div className="p-4 rounded-2xl bg-white border border-brand-navy-200 shadow-sm space-y-4">
      {/* Row 1: Calendar Navigation & View Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-brand-navy-100">
        {/* Navigation buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePrev}
            className="w-9 h-9 rounded-xl border border-brand-navy-200 bg-white hover:bg-brand-navy-50 flex items-center justify-center text-brand-navy-700 transition-colors shadow-xs cursor-pointer"
            title={isEn ? 'Previous' : 'Khoảng trước'}
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="px-3.5 py-1.5 rounded-xl border border-brand-navy-200 bg-white hover:bg-brand-navy-50 text-xs font-bold text-brand-navy-800 transition-colors shadow-xs cursor-pointer"
          >
            {isEn ? 'Today' : 'Hôm nay'}
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="w-9 h-9 rounded-xl border border-brand-navy-200 bg-white hover:bg-brand-navy-50 flex items-center justify-center text-brand-navy-700 transition-colors shadow-xs cursor-pointer"
            title={isEn ? 'Next' : 'Khoảng sau'}
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>

          <h2 className="font-chivo font-black text-brand-navy-900 text-sm sm:text-base ml-2">
            {periodTitle}
          </h2>
        </div>

        {/* View mode switcher */}
        <div className="flex items-center gap-1 bg-brand-navy-100 p-1 rounded-xl self-start md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'week' ? 'bg-white text-brand-navy-900 shadow-xs' : 'text-brand-navy-600 hover:text-brand-navy-900'
              }`}
          >
            <span className="material-symbols-outlined text-[16px]">view_week</span>
            <span>{isEn ? 'Week View' : 'Lịch Tuần'}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'month' ? 'bg-white text-brand-navy-900 shadow-xs' : 'text-brand-navy-600 hover:text-brand-navy-900'
              }`}
          >
            <span className="material-symbols-outlined text-[16px]">calendar_month</span>
            <span>{isEn ? 'Month View' : 'Lịch Tháng'}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('agenda')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'agenda' ? 'bg-white text-brand-navy-900 shadow-xs' : 'text-brand-navy-600 hover:text-brand-navy-900'
              }`}
          >
            <span className="material-symbols-outlined text-[16px]">view_agenda</span>
            <span>{isEn ? 'Agenda' : 'Lịch Biểu'}</span>
          </button>
        </div>
      </div>

      {/* Row 2: Search, Time Slot & Status Dropdowns, Quick Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Search Input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-brand-navy-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isEn ? 'Search class, room, sport...' : 'Tìm tên lớp, phòng, bộ môn...'}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-danger-500/20 focus:border-brand-danger-500 bg-white font-medium"
          />
        </div>

        {/* Time Slot Filter */}
        <div>
          <select
            value={selectedTimeSlot}
            onChange={e => setSelectedTimeSlot(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-danger-500/20 focus:border-brand-danger-500 bg-white font-medium cursor-pointer"
          >
            <option value="ALL">{isEn ? '⏰ All Time Slots' : '⏰ Tất cả khung giờ'}</option>
            <option value="MORNING">{isEn ? '🌅 Morning (< 12:00)' : '🌅 Ca Sáng (< 12:00)'}</option>
            <option value="AFTERNOON">{isEn ? '☀️ Afternoon (12:00 - 17:00)' : '☀️ Ca Chiều (12:00 - 17:00)'}</option>
            <option value="EVENING">{isEn ? '🌙 Evening (> 17:00)' : '🌙 Ca Tối (> 17:00)'}</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-danger-500/20 focus:border-brand-danger-500 bg-white font-medium cursor-pointer"
          >
            <option value="ALL">{isEn ? '🎯 All Statuses' : '🎯 Tất cả trạng thái'}</option>
            <option value="SCHEDULED">{isEn ? '🔵 Scheduled' : '🔵 Đã lên lịch'}</option>
            <option value="COMPLETED">{isEn ? '🟢 Completed' : '🟢 Đã kết thúc'}</option>
            <option value="CANCELLED">{isEn ? '🔴 Cancelled' : '🔴 Đã hủy'}</option>
          </select>
        </div>

        {/* Quick Date Picker */}
        <div>
          <input
            type="date"
            value={formatIsoDate(currentDate)}
            onChange={e => {
              if (e.target.value) {
                const d = parseIsoDate(e.target.value);
                setCurrentDate(d);
                setSelectedCalendarDate(e.target.value);
              }
            }}
            className="w-full px-3 py-2 rounded-xl border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-danger-500/20 focus:border-brand-danger-500 bg-white font-medium"
          />
        </div>
      </div>

      {/* Row 3: Sport Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] font-bold text-brand-navy-400 uppercase tracking-wider mr-1">
          {isEn ? 'Sport:' : 'Bộ môn:'}
        </span>
        <button
          type="button"
          onClick={() => setSelectedSport('ALL')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold font-chivo transition-all cursor-pointer ${
              selectedSport === 'ALL'
                ? 'bg-brand-navy-900 text-white shadow-xs'
                : 'bg-brand-navy-100 text-brand-navy-600 hover:bg-brand-navy-200'
            }`}
        >
          {isEn ? `All (${schedule.sessions.length})` : `Tất cả (${schedule.sessions.length})`}
        </button>
        {availableSports.map(s => {
          const theme = getSportTheme(s.name, isEn);
          const isSelected = selectedSport === s.name;
          return (
            <button
              type="button"
              key={s.name}
              onClick={() => setSelectedSport(s.name)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-brand-navy-700 text-brand-sand-300 border-brand-navy-700 shadow-xs'
                    : `bg-white ${theme.text} ${theme.border} hover:bg-brand-navy-50`
                }`}
            >
              <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-brand-sand-300' : theme.dot}`} />
              <span>{translateSportName(s.name, isEn)}</span>
              <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-brand-sand-300 text-brand-navy-900' : 'bg-brand-navy-100 text-brand-navy-600'}`}>
                {s.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
