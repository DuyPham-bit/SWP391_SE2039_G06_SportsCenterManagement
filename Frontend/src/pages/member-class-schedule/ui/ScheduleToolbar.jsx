import React from 'react';
import { formatIsoDate, parseIsoDate } from '../../../shared/lib/calendar.js';
import { getSportTheme } from '../lib/calendarView.js';
import { translateSportName } from '../../../shared/i18n/i18nHelper.js';

const initialsOf = name => String(name || '?').trim().split(/\s+/).slice(-2).map(p => p[0]).join('').toUpperCase();

export function ScheduleToolbar({
  availableCoaches = [], selectedCoach = 'ALL', setSelectedCoach = () => {},
  availableSports, classes, currentDate, handleNext, handlePrev, handleToday, isEn, periodTitle,
  searchQuery, selectedSport, selectedStatusFilter, selectedTimeSlot, setCurrentDate, setSearchQuery,
  setSelectedCalendarDate, setSelectedSport, setSelectedStatusFilter, setSelectedTimeSlot,
  setViewMode, viewMode
}) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-brand-navy-200 shadow-sm space-y-4">
      {/* Row 1: Nav Date + Segmented Mode Switcher */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Calendar Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg border border-brand-navy-300 hover:bg-brand-navy-50 text-xs font-bold text-brand-navy-700 transition-colors"
          >
            {isEn ? 'Today' : 'Hôm Nay'}
          </button>
          <div className="flex items-center border border-brand-navy-300 rounded-lg overflow-hidden bg-white">
            <button
              onClick={handlePrev}
              title={isEn ? 'Previous Period' : 'Lùi kỳ trước'}
              className="p-1.5 hover:bg-brand-navy-100 text-brand-navy-700 transition-colors border-r border-brand-navy-200"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button
              onClick={handleNext}
              title={isEn ? 'Next Period' : 'Tiến kỳ sau'}
              className="p-1.5 hover:bg-brand-navy-100 text-brand-navy-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
          <span className="font-chivo text-base font-black text-brand-navy-900 pl-1 tracking-tight">
            {periodTitle}
          </span>
        </div>

        {/* Segmented Control Chế độ xem: Tuần | Tháng | Lịch biểu | Lưới thẻ */}
        <div className="inline-flex p-1 bg-brand-navy-100 rounded-xl border border-brand-navy-200/80 shrink-0">
          {[
            { id: 'week', label: isEn ? 'Week (Timetable)' : 'Tuần (Timetable)', icon: 'view_week' },
            { id: 'month', label: isEn ? 'Month' : 'Tháng', icon: 'calendar_view_month' },
            { id: 'agenda', label: isEn ? 'Agenda' : 'Lịch Biểu', icon: 'view_agenda' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo flex items-center gap-1.5 transition-all ${
                  viewMode === tab.id
                    ? 'bg-white text-brand-navy-900 shadow-xs'
                    : 'text-brand-navy-500 hover:text-brand-navy-900'
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: Bộ lọc nâng cao (Khung giờ, Trạng thái, Tìm kiếm) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-brand-navy-100 text-xs">
        {/* Search Input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-brand-navy-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder={isEn ? 'Search class, coach, venue...' : 'Tìm lớp, HLV, sân tập...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-danger-600 focus:border-brand-danger-600 bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-brand-navy-400 hover:text-brand-navy-700"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Time Slot Filter */}
        <div>
          <select
            value={selectedTimeSlot}
            onChange={e => setSelectedTimeSlot(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-danger-600 bg-white font-medium"
          >
            <option value="ALL">{isEn ? '🕒 All Time Slots' : '🕒 Tất cả khung giờ'}</option>
            <option value="MORNING">{isEn ? '🌅 Morning (Before 12:00)' : '🌅 Ca Sáng (Trước 12:00)'}</option>
            <option value="AFTERNOON">{isEn ? '☀️ Afternoon (12:00 - 17:00)' : '☀️ Ca Chiều (12:00 - 17:00)'}</option>
            <option value="EVENING">{isEn ? '🌙 Evening (After 17:00)' : '🌙 Ca Tối (Sau 17:00)'}</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatusFilter}
            onChange={e => setSelectedStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-danger-600 bg-white font-medium"
          >
            <option value="ALL">{isEn ? '🎯 All Class Statuses' : '🎯 Tất cả trạng thái lớp'}</option>
            <option value="AVAILABLE_ONLY">{isEn ? '🟢 Available Spots Only' : '🟢 Chỉ lớp còn chỗ trống'}</option>
            <option value="BOOKED_ONLY">{isEn ? '✅ My Booked Classes Only' : '✅ Chỉ lớp tôi đã đặt chỗ'}</option>
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
            className="w-full px-3 py-2 rounded-lg border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-danger-600 bg-white font-medium"
          />
        </div>
      </div>

      {/* Row 3: Sport Filter Chips (Kèm số lượng lớp mở) */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] font-bold text-brand-navy-400 uppercase tracking-wider mr-1">{isEn ? 'Sports:' : 'Bộ môn:'}</span>
        <button
          onClick={() => setSelectedSport('ALL')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold font-chivo transition-all ${
              selectedSport === 'ALL'
                ? 'bg-brand-navy-900 text-white shadow-xs'
                : 'bg-brand-navy-100 text-brand-navy-600 hover:bg-brand-navy-200'
            }`}
        >
          {isEn ? 'All' : 'Tất cả'} ({classes.length})
        </button>
        {availableSports.map(s => {
          const theme = getSportTheme(s.name, isEn);
          const isSelected = selectedSport === s.name;
          const displayName = translateSportName(s.name, isEn);
          return (
            <button
              key={s.name}
              onClick={() => setSelectedSport(s.name)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold font-chivo flex items-center gap-1.5 transition-all border ${
                  isSelected
                    ? 'bg-brand-danger-600 text-white border-brand-danger-600 shadow-xs'
                    : `bg-white ${theme.text} ${theme.border} hover:bg-brand-navy-50`
                }`}
            >
              <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : theme.dot}`} />
              <span>{displayName}</span>
              <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-brand-danger-700 text-white' : 'bg-brand-navy-100 text-brand-navy-600'}`}>
                {s.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Row 4: Coach chips — member picks the coach they want to train with */}
      {availableCoaches.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1" role="group" aria-label={isEn ? 'Filter by coach' : 'Lọc theo HLV'}>
          <span className="text-[11px] font-bold text-brand-navy-400 uppercase tracking-wider mr-1">{isEn ? 'Coach:' : 'HLV:'}</span>
          <button
            type="button"
            aria-pressed={selectedCoach === 'ALL'}
            onClick={() => setSelectedCoach('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold font-chivo transition-all ${
                selectedCoach === 'ALL'
                  ? 'bg-brand-navy-900 text-white shadow-xs'
                  : 'bg-brand-navy-100 text-brand-navy-600 hover:bg-brand-navy-200'
              }`}
          >
            {isEn ? 'All coaches' : 'Tất cả HLV'}
          </button>
          {availableCoaches.map(c => {
            const isSelected = selectedCoach === c.name;
            return (
              <button
                key={c.name}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedCoach(isSelected ? 'ALL' : c.name)}
                className={`pl-1 pr-2.5 py-1 rounded-lg text-xs font-bold font-chivo flex items-center gap-1.5 transition-all border ${
                    isSelected
                      ? 'bg-brand-teal-600 text-white border-brand-teal-600 shadow-xs'
                      : 'bg-white text-brand-navy-700 border-brand-navy-200 hover:bg-brand-navy-50'
                  }`}
              >
                <span aria-hidden="true" className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black ${isSelected ? 'bg-white/25 text-white' : 'bg-gradient-to-br from-brand-teal-500 to-brand-sage-600 text-white'}`}>
                  {initialsOf(c.name)}
                </span>
                <span>{c.name}</span>
                <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-brand-teal-700 text-white' : 'bg-brand-navy-100 text-brand-navy-600'}`}>
                  {c.count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
