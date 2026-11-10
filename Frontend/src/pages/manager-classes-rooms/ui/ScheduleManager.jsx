import React from 'react';
import { CLASS_STATUS, WEEK_DAYS, effectiveScheduleRoom, groupSchedulesByDay, filterRoomsForSport } from '../model/classManagementView.js';
import { todayDate, futureDate, addMinutesToTime, getTimePeriodInfo, timeValue } from '../lib/scheduleTime.js';
import { Icon } from './Icon.jsx';

export function ScheduleManager({
  row,
  schedules,
  rooms,
  sports = [],
  form,
  change,
  busy,
  isEn,
  editingScheduleId,
  setEditingScheduleId,
  setForm,
  onCancelSchedule,
  onReset
}) {
  const groups = groupSchedulesByDay(schedules);
  const readOnly = row.status === CLASS_STATUS.CANCELLED;
  const durationMinutes = Number(row.durationMinutes || 60);

  // Active schedules and metrics
  const activeSchedules = schedules.filter((s) => s.status === 'Active');
  const totalWeeklyMinutes = activeSchedules.reduce((acc, curr) => {
    const [sh, sm] = String(curr.startTime || '0:0').split(':').map(Number);
    const [eh, em] = String(curr.endTime || '0:0').split(':').map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    return acc + (mins > 0 ? mins : durationMinutes);
  }, 0);
  const totalWeeklyHours = (totalWeeklyMinutes / 60).toFixed(1);

  // Selected days state for batch creation
  const selectedDays = Array.isArray(form.selectedDays) && form.selectedDays.length > 0
    ? form.selectedDays
    : [Number(form.dayOfWeek ?? 1)];

  // Preset day configurations
  const DAY_PRESETS = [
    { label: isEn ? 'Mon - Wed - Fri' : 'Thứ 2 - 4 - 6', days: [1, 3, 5] },
    { label: isEn ? 'Tue - Thu - Sat' : 'Thứ 3 - 5 - 7', days: [2, 4, 6] },
    { label: isEn ? 'Weekend (Sat, Sun)' : 'Cuối tuần (T7, CN)', days: [6, 0] },
    { label: isEn ? 'Weekdays (Mon - Fri)' : 'Thứ 2 đến Thứ 6', days: [1, 2, 3, 4, 5] },
    { label: isEn ? 'Daily (7 days)' : 'Cả tuần (7 ngày)', days: [0, 1, 2, 3, 4, 5, 6] }
  ];

  // Common popular start time slots
  const POPULAR_SLOTS = ['06:00', '08:00', '09:45', '14:00', '16:00', '18:00', '19:30'];

  // Duration presets for validity date range
  const DATE_PRESETS = [
    { label: isEn ? '1 Month (30d)' : '1 Tháng (30d)', days: 30 },
    { label: isEn ? '3 Months (90d)' : '3 Tháng (90d)', days: 90 },
    { label: isEn ? '6 Months (180d)' : '6 Tháng (180d)', days: 180 },
    { label: isEn ? '1 Year (365d)' : '1 Năm (365d)', days: 365 }
  ];

  const toggleDay = (dayIndex) => {
    if (editingScheduleId) {
      setForm((prev) => ({ ...prev, dayOfWeek: dayIndex }));
      return;
    }
    const current = selectedDays;
    let next;
    if (current.includes(dayIndex)) {
      if (current.length === 1) return; // Keep at least one day
      next = current.filter((d) => d !== dayIndex);
    } else {
      next = [...current, dayIndex].sort((a, b) => a - b);
    }
    setForm((prev) => ({
      ...prev,
      selectedDays: next,
      dayOfWeek: next[0] ?? 1
    }));
  };

  const applyDayPreset = (presetDays) => {
    setForm((prev) => ({
      ...prev,
      selectedDays: presetDays,
      dayOfWeek: presetDays[0] ?? 1
    }));
  };

  const applyTimeSlot = (slotStart) => {
    const slotEnd = addMinutesToTime(slotStart, durationMinutes);
    setForm((prev) => ({
      ...prev,
      startTime: slotStart,
      endTime: slotEnd
    }));
  };

  const handleStartTimeChange = (e) => {
    const newStart = e.target.value;
    const newEnd = addMinutesToTime(newStart, durationMinutes);
    setForm((prev) => ({
      ...prev,
      startTime: newStart,
      endTime: newEnd
    }));
  };

  const applyDatePreset = (days) => {
    setForm((prev) => ({
      ...prev,
      startDate: todayDate(),
      endDate: futureDate(days)
    }));
  };

  const quickTargetDay = (dayIndex) => {
    if (editingScheduleId) {
      setEditingScheduleId(null);
    }
    setForm((prev) => ({
      ...prev,
      selectedDays: [dayIndex],
      dayOfWeek: dayIndex
    }));
    const studio = document.getElementById('schedule-automation-studio');
    if (studio) {
      studio.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Class Header Summary Banner - Matched exactly to Image 2 (MemberManagement banner) */}
      <div
        className="relative overflow-hidden rounded-2xl text-white p-5 sm:p-6 shadow-xl shadow-brand-teal-600/20 border border-white/20"
        style={{
          background: 'linear-gradient(108deg, #2D6A4F 0%, #24828F 25%, #3FAEB8 48%, #81B29A 70%, #E5A33C 88%, #E5A33C 100%)'
        }}
      >
        {/* Dynamic ambient glow & sports wave overlays matching Image 2 */}
        <div className="pointer-events-none absolute -right-12 -top-12 w-64 h-64 rounded-full bg-gradient-to-br from-brand-sand-300/50 via-brand-sand-500/35 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-gradient-to-tr from-brand-sage-500/45 via-brand-sage-700/30 to-transparent blur-3xl" />

        {/* Subtle decorative Olympic curved motion lines from Image 2 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
          <circle cx="890" cy="110" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
        </svg>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/95 text-brand-sage-900 text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/80 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-sage-500 animate-pulse shrink-0" />
              <span>{isEn ? 'Class Schedule Operations' : 'Quản trị lịch học SCMS'}</span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black font-chivo tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
                {row.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white/20 text-white backdrop-blur-md border border-white/30 drop-shadow-xs">
                {row.status === 'Active' ? (isEn ? 'Open' : 'Đang mở') : row.status}
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-white/95 mt-1 font-medium flex-wrap drop-shadow-xs">
              <span className="inline-flex items-center gap-1 font-bold">
                <Icon className="text-[15px]">sports</Icon>
                {row.sportName}
              </span>
              <span className="opacity-60">·</span>
              <span className="inline-flex items-center gap-1">
                <Icon className="text-[15px]">meeting_room</Icon>
                {row.roomName || (isEn ? 'No court assigned' : 'Chưa phân phòng')}
              </span>
              <span className="opacity-60">·</span>
              <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/30 font-bold">
                <Icon className="text-[14px]">timer</Icon>
                {durationMinutes} {isEn ? 'mins/session' : 'phút/buổi'}
              </span>
            </div>
          </div>

          {/* Quick Metrics in frosted glass */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white text-center shadow-xs transition">
              <p className="text-[10px] uppercase font-bold tracking-wider text-white/85">
                {isEn ? 'Sessions / Week' : 'Ca / tuần'}
              </p>
              <p className="text-base font-black text-white drop-shadow-xs">
                {activeSchedules.length} <span className="text-xs font-semibold">{isEn ? 'sessions' : 'ca'}</span>
              </p>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white text-center shadow-xs transition">
              <p className="text-[10px] uppercase font-bold tracking-wider text-white/85">
                {isEn ? 'Weekly Volume' : 'Khối lượng'}
              </p>
              <p className="text-base font-black text-white drop-shadow-xs">
                {totalWeeklyHours} <span className="text-xs font-semibold">{isEn ? 'hrs/wk' : 'giờ/tuần'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Compact Weekly Timetable Overview (7 Days) */}
      <section aria-label={isEn ? 'Weekly timetable' : 'Thời khóa biểu hàng tuần'} className="space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-teal-700 dark:text-brand-teal-400 text-[20px]">calendar_view_week</span>
            <h3 className="text-sm font-black text-brand-navy-900 dark:text-brand-navy-100 uppercase tracking-wide">
              {isEn ? 'Weekly Timetable Overview' : 'Thời khóa biểu tuần (7 ngày)'}
            </h3>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-300 border border-brand-sage-200 dark:border-brand-sage-800">
            <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse" />
            <span>{activeSchedules.length} {isEn ? 'active session(s)' : 'ca đang kích hoạt'}</span>
          </div>
        </div>

        {/* 7 Columns Day Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2">
          {groups.map((group) => {
            const hasItems = group.items.length > 0;
            return (
              <div
                key={group.dayOfWeek}
                className={`flex flex-col rounded-xl border transition-all p-2 ${
                  hasItems
                    ? 'border-brand-sage-500/30 dark:border-brand-sage-800/50 bg-brand-sage-50/20 dark:bg-brand-sage-950/10 shadow-xs'
                    : 'border-brand-navy-200 dark:border-brand-navy-800 bg-brand-navy-50/50 dark:bg-brand-navy-900/60'
                }`}
              >
                {/* Day Column Header */}
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-brand-navy-200/60 dark:border-brand-navy-800">
                  <h4 className="text-xs font-black text-brand-navy-800 dark:text-brand-navy-200">
                    {group.label}
                  </h4>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      hasItems
                        ? 'bg-brand-teal-700 text-white shadow-xs'
                        : 'bg-brand-navy-200 dark:bg-brand-navy-700 text-brand-navy-500 dark:text-brand-navy-400'
                    }`}
                  >
                    {group.items.length}
                  </span>
                </div>

                {/* Day Session Cards */}
                <div className="space-y-1.5 flex-1">
                  {group.items.map((schedule) => {
                    const period = getTimePeriodInfo(schedule.startTime);
                    const isActive = schedule.status === 'Active';
                    const isEditing = editingScheduleId === schedule.id;

                    return (
                      <div
                        key={schedule.id}
                        className={`rounded-lg border p-2 text-xs transition-all ${
                          isEditing
                            ? 'ring-2 ring-brand-teal-600 border-brand-teal-600 bg-brand-sage-50 dark:bg-brand-sage-950/40 shadow-sm'
                            : isActive
                            ? 'border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-900 shadow-xs'
                            : 'border-brand-navy-200 dark:border-brand-navy-800 bg-brand-navy-100 dark:bg-brand-navy-800/60 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold border ${period.badge}`}>
                            <span className="material-symbols-outlined text-[11px]">{period.icon}</span>
                            <span>{period.label}</span>
                          </span>
                          <span
                            className={`h-2 w-2 rounded-full ${isActive ? 'bg-brand-sage-500 shadow-[0_0_5px_#81B29A]' : 'bg-brand-navy-400'}`}
                            title={isActive ? (isEn ? 'Active' : 'Đang hoạt động') : isEn ? 'Cancelled' : 'Đã hủy'}
                          />
                        </div>

                        <strong className="text-xs font-black text-brand-navy-900 dark:text-brand-navy-100 block tracking-tight">
                          {timeValue(schedule.startTime)} – {timeValue(schedule.endTime)}
                        </strong>

                        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-brand-navy-600 dark:text-brand-navy-300 truncate font-medium">
                          <Icon className="text-[12px] text-brand-navy-400 shrink-0">meeting_room</Icon>
                          <span className="truncate">{effectiveScheduleRoom(schedule, row, rooms)}</span>
                        </p>

                        {!readOnly && isActive && (
                          <div className="mt-1.5 flex items-center justify-between border-t border-brand-navy-100 dark:border-brand-navy-800 pt-1">
                            <button
                              type="button"
                              aria-label={`Sửa lịch ${group.label} ${timeValue(schedule.startTime)}`}
                              className="text-brand-teal-700 dark:text-brand-teal-400 hover:text-brand-teal-700 font-bold flex items-center gap-0.5 text-[10px] hover:underline"
                              disabled={busy}
                              onClick={() => {
                                setEditingScheduleId(schedule.id);
                                setForm({
                                  ...schedule,
                                  selectedDays: [schedule.dayOfWeek],
                                  roomId: schedule.roomId || '',
                                  startTime: timeValue(schedule.startTime),
                                  endTime: timeValue(schedule.endTime)
                                });
                                const studio = document.getElementById('schedule-automation-studio');
                                if (studio) {
                                  studio.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                }
                              }}
                            >
                              <span className="material-symbols-outlined text-[11px]">edit</span>
                              <span>{isEn ? 'Edit' : 'Sửa'}</span>
                            </button>

                            <button
                              type="button"
                              className="text-brand-danger-600 dark:text-brand-danger-400 hover:text-brand-danger-700 font-bold flex items-center gap-0.5 text-[10px] hover:underline"
                              disabled={busy}
                              onClick={() => onCancelSchedule(schedule.id)}
                            >
                              <span className="material-symbols-outlined text-[11px]">delete</span>
                              <span>{isEn ? 'Cancel' : 'Hủy'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Clean compact + Add button: replaces the old 96px empty box */}
                  {!hasItems && !readOnly && (
                    <button
                      type="button"
                      onClick={() => quickTargetDay(group.dayOfWeek)}
                      className="w-full py-2 px-1 rounded-lg border border-dashed border-brand-navy-200 dark:border-brand-navy-700 hover:border-brand-teal-600 dark:hover:border-brand-teal-500 hover:bg-brand-sage-50/50 dark:hover:bg-brand-navy-800/60 flex items-center justify-center gap-1 text-brand-navy-400 hover:text-brand-teal-700 transition-all cursor-pointer group text-[11px] font-bold"
                    >
                      <span className="material-symbols-outlined text-[14px] group-hover:scale-110 transition">add</span>
                      <span>{isEn ? 'Add' : '+ Thêm'}</span>
                    </button>
                  )}

                  {!hasItems && readOnly && (
                    <p className="py-2 text-center text-[10px] text-brand-navy-400 italic">
                      {isEn ? 'Empty' : 'Trống'}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Streamlined Smart Automation Studio (Compact 3-Row Layout) */}
      {!readOnly && (
        <section
          id="schedule-automation-studio"
          className="rounded-2xl border border-brand-navy-200 dark:border-brand-navy-800 bg-white dark:bg-brand-navy-900 p-4 sm:p-5 shadow-sm space-y-4"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-brand-navy-100 dark:border-brand-navy-800 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-teal-700 to-brand-teal-500 text-white flex items-center justify-center shadow-xs shrink-0">
                <span className="material-symbols-outlined text-[18px]">
                  {editingScheduleId ? 'edit_calendar' : 'auto_fix_high'}
                </span>
              </div>
              <div>
                <h3 className="font-black text-brand-navy-900 dark:text-brand-navy-100 text-sm">
                  {editingScheduleId
                    ? (isEn ? `Edit Session: ${WEEK_DAYS[form.dayOfWeek]}` : `Chỉnh sửa ca học: ${WEEK_DAYS[form.dayOfWeek]}`)
                    : (isEn ? 'Smart Automated Scheduling' : '⚡ Thiết lập xếp lịch tự động')}
                </h3>
                <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400">
                  {editingScheduleId
                    ? (isEn ? 'Update session time and room details.' : 'Cập nhật lại giờ học hoặc phòng cho ca đã chọn.')
                    : (isEn
                        ? `Class duration: ${durationMinutes} mins. End time calculated automatically.`
                        : `Thời lượng lớp: ${durationMinutes} phút/buổi · Giờ kết thúc tự động tính theo thời lượng.`)}
                </p>
              </div>
            </div>

            {editingScheduleId && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-brand-navy-200 dark:border-brand-navy-700 bg-brand-navy-50 dark:bg-brand-navy-800 hover:bg-brand-navy-100 text-brand-navy-700 dark:text-brand-navy-200 text-xs font-bold transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">arrow_back</span>
                <span>{isEn ? 'Discard Edit (Back)' : 'Bỏ sửa (Quay lại tạo mới)'}</span>
              </button>
            )}
          </div>

          {/* ROW 1: Day selection with inline presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 flex items-center gap-1.5">
                <span>{editingScheduleId ? (isEn ? 'Day of Week *' : 'Ngày trong tuần *') : (isEn ? 'Select Days (Batch) *' : '1. Chọn thứ học trong tuần *')}</span>
                {!editingScheduleId && (
                  <span className="text-[11px] font-normal text-brand-sage-700 dark:text-brand-sage-400">
                    (Đã chọn: <strong>{selectedDays.map((d) => WEEK_DAYS[d]).join(', ')}</strong> — {selectedDays.length} ca)
                  </span>
                )}
              </label>

              {/* Quick Presets Inline */}
              {!editingScheduleId && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] font-semibold text-brand-navy-400">{isEn ? 'Presets:' : 'Mẫu nhanh:'}</span>
                  {DAY_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyDayPreset(preset.days)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-navy-100 dark:bg-brand-navy-800 hover:bg-brand-teal-50 text-brand-navy-600 dark:text-brand-navy-300 hover:text-brand-teal-700 border border-brand-navy-200 dark:border-brand-navy-700 transition cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 7 Days Toggle Pills */}
            <div className="grid grid-cols-7 gap-1.5">
              {WEEK_DAYS.map((dayName, idx) => {
                const isSelected = selectedDays.includes(idx);
                return (
                  <button
                    key={dayName}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                      isSelected
                        ? 'bg-brand-teal-700 text-white border-brand-teal-700 shadow-xs scale-[1.02]'
                        : 'bg-brand-navy-50 dark:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300 border-brand-navy-200 dark:border-brand-navy-700 hover:border-brand-teal-600 hover:bg-white'
                    }`}
                  >
                    {isSelected && <span className="material-symbols-outlined text-[13px]">check</span>}
                    <span>{dayName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ROW 2: Time Slots + Start Time + End Time + Room (3 Columns) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300">
                {isEn ? '2. Session Time & Facility *' : '2. Khung giờ & Phòng học *'}
              </label>
              {/* Quick popular slot pills */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] font-semibold text-brand-navy-400">{isEn ? 'Quick slots:' : 'Gợi ý giờ:'}</span>
                {POPULAR_SLOTS.map((slot) => {
                  const isCurrent = form.startTime === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => applyTimeSlot(slot)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-brand-teal-700 text-white border-brand-teal-700'
                          : 'bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-300 border-brand-navy-200 dark:border-brand-navy-700 hover:border-brand-teal-600'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-brand-navy-600 dark:text-brand-navy-400 mb-1">
                  {isEn ? 'Start Time *' : 'Giờ bắt đầu *'}
                </label>
                <input
                  required
                  type="time"
                  name="startTime"
                  min="05:00"
                  max="22:00"
                  value={form.startTime || '08:00'}
                  onChange={handleStartTimeChange}
                  className="w-full p-2 bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-300 dark:border-brand-navy-700 rounded-xl text-xs font-bold text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-teal-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-brand-navy-600 dark:text-brand-navy-400 mb-1">
                  {isEn ? 'End Time (Auto)' : `Giờ kết thúc * (Tự +${durationMinutes}p)`}
                </label>
                <input
                  required
                  type="time"
                  name="endTime"
                  min="05:00"
                  max="22:00"
                  value={form.endTime || '09:30'}
                  onChange={change}
                  className="w-full p-2 bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-300 dark:border-brand-navy-700 rounded-xl text-xs font-bold text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-teal-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-brand-navy-600 dark:text-brand-navy-400 mb-1">
                  {isEn ? 'Court / Facility' : 'Sân / Phòng tập'}
                </label>
                <select
                  name="roomId"
                  value={form.roomId || ''}
                  onChange={change}
                  className="w-full p-2 bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-300 dark:border-brand-navy-700 rounded-xl text-xs font-bold text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-teal-600"
                >
                  <option value="">{isEn ? 'Class default court' : 'Phòng mặc định của lớp'}</option>
                  {filterRoomsForSport(
                    rooms,
                    sports.find((s) => String(s.id) === String(row?.sportId)),
                    form.roomId
                  ).map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name} · {room.capacity} {isEn ? 'people' : 'người'}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400">
              {isEn
                ? `Center hours: 05:00–22:00. Maximum ${durationMinutes} minutes per session.`
                : `Giờ trung tâm: 05:00–22:00. Tối đa ${durationMinutes} phút mỗi buổi.`}
            </p>
          </div>

          {/* ROW 3: Date Range & Unified Action Button */}
          <div className="space-y-1.5 pt-1 border-t border-brand-navy-100 dark:border-brand-navy-800">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300">
                {isEn ? '3. Validity Period & Actions *' : '3. Thời hạn áp dụng *'}
              </label>
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] font-semibold text-brand-navy-400">{isEn ? 'Duration:' : 'Thời hạn:'}</span>
                {DATE_PRESETS.map((dp) => (
                  <button
                    key={dp.days}
                    type="button"
                    onClick={() => applyDatePreset(dp.days)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-navy-100 dark:bg-brand-navy-800 hover:bg-brand-teal-50 text-brand-navy-600 dark:text-brand-navy-300 hover:text-brand-teal-700 border border-brand-navy-200 dark:border-brand-navy-700 transition cursor-pointer"
                  >
                    {dp.label.split(' - ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-brand-navy-600 dark:text-brand-navy-400 mb-1">
                  {isEn ? 'Start Date *' : 'Từ ngày *'}
                </label>
                <input
                  required
                  type="date"
                  name="startDate"
                  value={form.startDate || ''}
                  onChange={change}
                  className="w-full p-2 bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-300 dark:border-brand-navy-700 rounded-xl text-xs font-bold text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-teal-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-brand-navy-600 dark:text-brand-navy-400 mb-1">
                  {isEn ? 'End Date *' : 'Đến ngày *'}
                </label>
                <input
                  required
                  type="date"
                  name="endDate"
                  min={form.startDate || undefined}
                  value={form.endDate || ''}
                  onChange={change}
                  className="w-full p-2 bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-300 dark:border-brand-navy-700 rounded-xl text-xs font-bold text-brand-navy-900 dark:text-brand-navy-100 focus:ring-2 focus:ring-brand-teal-600"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  style={{
                    background: 'linear-gradient(108deg, #2D6A4F 0%, #24828F 35%, #3FAEB8 65%, #E5A33C 100%)'
                  }}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {editingScheduleId ? 'save' : 'bolt'}
                  </span>
                  <span>
                    {busy
                      ? (isEn ? 'Saving...' : 'Đang xử lý...')
                      : editingScheduleId
                      ? (isEn ? `Save Schedule (${WEEK_DAYS[form.dayOfWeek]})` : `Lưu ca (${WEEK_DAYS[form.dayOfWeek]})`)
                      : (isEn
                          ? `Auto-Create ${selectedDays.length} Session(s)`
                          : `⚡ Tự động tạo ${selectedDays.length} ca học`)}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
