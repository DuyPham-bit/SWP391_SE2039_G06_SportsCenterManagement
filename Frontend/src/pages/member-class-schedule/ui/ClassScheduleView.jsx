import { parseCalendarDate } from '../../../shared/lib/dateTime.js';
import React from 'react';
import { LoadingSpinner } from '../../../shared/ui/Table.jsx';
import { formatIsoDate } from '../../../shared/lib/calendar.js';
import { useClassSchedule } from '../model/useClassSchedule.js';
import { ScheduleHeader } from './ScheduleHeader.jsx';
import { ScheduleSummaryCards } from './ScheduleSummaryCards.jsx';
import { ScheduleToolbar } from './ScheduleToolbar.jsx';
import { WeekTimetable } from './WeekTimetable.jsx';
import { MonthCalendar } from './MonthCalendar.jsx';
import { AgendaList } from './AgendaList.jsx';
import { SessionDetailModal } from './SessionDetailModal.jsx';

// --- HÀM TIỆN ÍCH NGÀY THÁNG VÀ LỊCH TRÌNH CHUẨN OLYMPIC ---

export function ClassScheduleView() {
  const {
    DAY_LABELS, activeSession, availableSports, bookedSessionIds, bookingError, bookingLoading,
    cancelLoading, entitlements, handleCancelBooking,
    classes, classesByDate, conflictingBooking, currentDate, detailModalOpen, handleExecuteBooking,
    handleNext, handleOpenSessionDetail, handlePrev, handleToday, isEn, loading, periodTitle,
    searchQuery, selectedCalendarDate, selectedSport, selectedStatusFilter, selectedTimeSlot,
    setCurrentDate, setDetailModalOpen, setSearchQuery, setSelectedCalendarDate, setSelectedSport,
    setSelectedStatusFilter, setSelectedTimeSlot, setViewMode, stats, viewMode, weekDays
    , availableCoaches, selectedCoach, setSelectedCoach
  } = useClassSchedule();

  if (loading) return <LoadingSpinner text={isEn ? 'Syncing class schedule & spot availability...' : 'Đang đồng bộ lịch mở lớp & trạng thái vé tập...'} />;

  const todayStr = formatIsoDate(parseCalendarDate());

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* 1. Olympic Schedule Masterpiece Banner */}
      <ScheduleHeader bookedSessionIds={bookedSessionIds} isEn={isEn} stats={stats} />

      {/* 2. KPI Summary Strip (Gọn gàng & Đậm chất Olympic) */}
      <ScheduleSummaryCards
        isEn={isEn}
        selectedStatusFilter={selectedStatusFilter}
        setSelectedStatusFilter={setSelectedStatusFilter}
        stats={stats}
      />

      {/* 3. Calendar Control Bar & View Mode Switcher */}
      <ScheduleToolbar
        availableCoaches={availableCoaches}
        selectedCoach={selectedCoach}
        setSelectedCoach={setSelectedCoach}
        availableSports={availableSports}
        classes={classes}
        currentDate={currentDate}
        handleNext={handleNext}
        handlePrev={handlePrev}
        handleToday={handleToday}
        isEn={isEn}
        periodTitle={periodTitle}
        searchQuery={searchQuery}
        selectedSport={selectedSport}
        selectedStatusFilter={selectedStatusFilter}
        selectedTimeSlot={selectedTimeSlot}
        setCurrentDate={setCurrentDate}
        setSearchQuery={setSearchQuery}
        setSelectedCalendarDate={setSelectedCalendarDate}
        setSelectedSport={setSelectedSport}
        setSelectedStatusFilter={setSelectedStatusFilter}
        setSelectedTimeSlot={setSelectedTimeSlot}
        setViewMode={setViewMode}
        viewMode={viewMode}
      />

      {/* 4. MAIN CALENDAR BODY THEO CHẾ ĐỘ XEM ĐÃ CHỌN */}

      {/* --- A. CHẾ ĐỘ TUẦN (WEEK TIMETABLE VIEW - GỌN GÀNG, ĐA NĂNG) --- */}
      {viewMode === 'week' && (
        <WeekTimetable
          DAY_LABELS={DAY_LABELS}
          bookedSessionIds={bookedSessionIds}
          classesByDate={classesByDate}
          handleOpenSessionDetail={handleOpenSessionDetail}
          isEn={isEn}
          selectedCalendarDate={selectedCalendarDate}
          setSelectedCalendarDate={setSelectedCalendarDate}
          todayStr={todayStr}
          weekDays={weekDays}
        />
      )}

      {/* --- B. CHẾ ĐỘ THÁNG (MONTH CALENDAR GRID - TỔNG THỂ, TRỰC QUAN) --- */}
      {viewMode === 'month' && (
        <MonthCalendar
          DAY_LABELS={DAY_LABELS}
          bookedSessionIds={bookedSessionIds}
          classesByDate={classesByDate}
          currentDate={currentDate}
          handleOpenSessionDetail={handleOpenSessionDetail}
          isEn={isEn}
          selectedCalendarDate={selectedCalendarDate}
          setSelectedCalendarDate={setSelectedCalendarDate}
          todayStr={todayStr}
        />
      )}

      {/* --- C. CHẾ ĐỘ LỊCH BIỂU (TIMELINE AGENDA - CỰC GỌN & TIẾT KIỆM KHÔNG GIAN) --- */}
      {viewMode === 'agenda' && (
        <AgendaList
          DAY_LABELS={DAY_LABELS}
          bookedSessionIds={bookedSessionIds}
          classesByDate={classesByDate}
          handleOpenSessionDetail={handleOpenSessionDetail}
          isEn={isEn}
          todayStr={todayStr}
        />
      )}

      {/* 5. MODAL XÁC NHẬN ĐẶT CHỖ & XEM CHI TIẾT CA TẬP */}
      <SessionDetailModal
        activeSession={activeSession}
        cancelLoading={cancelLoading}
        entitlements={entitlements}
        handleCancelBooking={handleCancelBooking}
        bookedSessionIds={bookedSessionIds}
        bookingError={bookingError}
        bookingLoading={bookingLoading}
        conflictingBooking={conflictingBooking}
        detailModalOpen={detailModalOpen}
        handleExecuteBooking={handleExecuteBooking}
        isEn={isEn}
        setDetailModalOpen={setDetailModalOpen}
      />
    </div>
  );
}
