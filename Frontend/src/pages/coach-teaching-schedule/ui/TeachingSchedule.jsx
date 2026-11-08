import React from 'react';
import { CoachError } from '../../../features/coach-workspace/index.js';
import { useTeachingSchedule } from '../model/useTeachingSchedule.js';
import { TeachingHeader } from './TeachingHeader.jsx';
import { PeriodConfigForm } from './PeriodConfigForm.jsx';
import { TeachingSummary } from './TeachingSummary.jsx';
import { TeachingToolbar } from './TeachingToolbar.jsx';
import { TeachingWeekView } from './TeachingWeekView.jsx';
import { TeachingMonthView } from './TeachingMonthView.jsx';
import { TeachingAgendaView } from './TeachingAgendaView.jsx';
import { TeachingSessionModal } from './TeachingSessionModal.jsx';

// --- TIỆN ÍCH NGÀY THÁNG VÀ LỊCH CHUẨN OLYMPIC ---

export function TeachingSchedule() {
  const {
    DAY_LABELS, SHORT_DAY_LABELS, STATUS_CONFIG, activeSession, availableSports, currentDate,
    detailModalOpen, formatDayOfWeek, handleNext, handleOpenDetail, handlePrev, handleToday, isEn,
    periodTitle, schedule, searchQuery, selectedCalendarDate, selectedSport, selectedStatus,
    selectedTimeSlot, sessionsByDate, setCurrentDate, setDetailModalOpen, setSearchQuery,
    setSelectedCalendarDate, setSelectedSport, setSelectedStatus, setSelectedTimeSlot,
    setShowPeriodConfig, setViewMode, showPeriodConfig, stats, todayStr, viewMode, weekDays
  } = useTeachingSchedule();

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER BANNER */}
      <TeachingHeader
        isEn={isEn}
        schedule={schedule}
        setShowPeriodConfig={setShowPeriodConfig}
        showPeriodConfig={showPeriodConfig}
      />

      {/* Tùy chỉnh khoảng ngày API (Collapsible) */}
      {showPeriodConfig && (
        <PeriodConfigForm isEn={isEn} schedule={schedule} />
      )}

      {/* 2. KPI QUICK STAT CARDS */}
      <TeachingSummary isEn={isEn} stats={stats} />

      <CoachError message={schedule.error} retry={schedule.reload} />

      {/* 3. CALENDAR CONTROLS & MULTI-FILTER BAR */}
      <TeachingToolbar
        availableSports={availableSports}
        currentDate={currentDate}
        handleNext={handleNext}
        handlePrev={handlePrev}
        handleToday={handleToday}
        isEn={isEn}
        periodTitle={periodTitle}
        schedule={schedule}
        searchQuery={searchQuery}
        selectedSport={selectedSport}
        selectedStatus={selectedStatus}
        selectedTimeSlot={selectedTimeSlot}
        setCurrentDate={setCurrentDate}
        setSearchQuery={setSearchQuery}
        setSelectedCalendarDate={setSelectedCalendarDate}
        setSelectedSport={setSelectedSport}
        setSelectedStatus={setSelectedStatus}
        setSelectedTimeSlot={setSelectedTimeSlot}
        setViewMode={setViewMode}
        viewMode={viewMode}
      />

      {/* Loading feedback */}
      {schedule.loading && (
        <div role="status" className="p-12 text-center bg-white rounded-2xl border border-brand-navy-200 space-y-2">
          <span className="material-symbols-outlined text-brand-sage-500 text-[32px] animate-spin">
            progress_activity
          </span>
          <p className="text-sm font-semibold text-brand-navy-700">
            {isEn ? 'Loading coach teaching schedule...' : 'Đang tải lịch giảng dạy của huấn luyện viên...'}
          </p>
        </div>
      )}

      {/* 4. MAIN CALENDAR BODY BY VIEW MODE */}
      {!schedule.loading && (
        <>
          {/* --- A. CHẾ ĐỘ LỊCH TUẦN (WEEK TIMETABLE VIEW - 7 CỘT THỨ 2 ĐẾN CN) --- */}
          {viewMode === 'week' && (
            <TeachingWeekView
              DAY_LABELS={DAY_LABELS}
              STATUS_CONFIG={STATUS_CONFIG}
              handleOpenDetail={handleOpenDetail}
              isEn={isEn}
              selectedCalendarDate={selectedCalendarDate}
              sessionsByDate={sessionsByDate}
              setSelectedCalendarDate={setSelectedCalendarDate}
              todayStr={todayStr}
              weekDays={weekDays}
            />
          )}

          {/* --- B. CHẾ ĐỘ LỊCH THÁNG (MONTH CALENDAR VIEW - 42 Ô LƯỚI) --- */}
          {viewMode === 'month' && (
            <TeachingMonthView
              SHORT_DAY_LABELS={SHORT_DAY_LABELS}
              STATUS_CONFIG={STATUS_CONFIG}
              currentDate={currentDate}
              handleOpenDetail={handleOpenDetail}
              isEn={isEn}
              selectedCalendarDate={selectedCalendarDate}
              sessionsByDate={sessionsByDate}
              setSelectedCalendarDate={setSelectedCalendarDate}
              todayStr={todayStr}
            />
          )}

          {/* --- C. CHẾ ĐỘ LỊCH BIỂU (TIMELINE AGENDA - THEO DÒNG THỜI GIAN) --- */}
          {viewMode === 'agenda' && (
            <TeachingAgendaView
              DAY_LABELS={DAY_LABELS}
              STATUS_CONFIG={STATUS_CONFIG}
              handleOpenDetail={handleOpenDetail}
              isEn={isEn}
              sessionsByDate={sessionsByDate}
              todayStr={todayStr}
            />
          )}
        </>
      )}

      {/* 5. MODAL XEM CHI TIẾT CA DẠY */}
      {activeSession && (
        <TeachingSessionModal
          STATUS_CONFIG={STATUS_CONFIG}
          activeSession={activeSession}
          detailModalOpen={detailModalOpen}
          formatDayOfWeek={formatDayOfWeek}
          isEn={isEn}
          setDetailModalOpen={setDetailModalOpen}
        />
      )}
    </div>
  );
}
