import React from 'react';
import { CoachError, CoachPeriod } from '../../../features/coach-workspace/index.js';
import { useAttendance } from '../model/useAttendance.js';
import { AttendanceHeader } from './AttendanceHeader.jsx';
import { ScheduleToolbar } from './ScheduleToolbar.jsx';
import { WeekStats } from './WeekStats.jsx';
import { SessionListFilters } from './SessionListFilters.jsx';
import { WeeklyScheduleView } from './WeeklyScheduleView.jsx';
import { SessionListView } from './SessionListView.jsx';
import { ActiveSessionCard } from './ActiveSessionCard.jsx';
import { RollCallToolbar } from './RollCallToolbar.jsx';
import { RosterList } from './RosterList.jsx';
import { SaveAttendanceBar } from './SaveAttendanceBar.jsx';

export function Attendance() {
  const {
    ATTENDANCE_STATUSES, DAY_FULL_LABELS, activeAttendanceRestriction, activeSession,
    activeSessionStatusInfo, availableSports, canAttend, filterRosterStatus, filteredMembers,
    filteredSessions, handleMarkAllPresent, handleNextWeek, handleNoteChange, handlePrevWeek,
    handleResetRecords, handleSaveAttendance, handleSelectSession, handleStatusChange,
    handleThisWeek, handleToggleLateNote, isEn, loadingMembers, memberError, members,
    readinessFilter, records, saving, schedule, searchMember, selectedDateIso, selectedDayInfo,
    selectedSport, sessionsByDate, setFilterRosterStatus, setReadinessFilter, setSearchMember,
    setSelectedDateIso, setSelectedSport, setShowCustomPeriod, setVersion, setViewMode,
    showCustomPeriod, stats, todayIso, viewMode, weekDays, weekStats, workbenchRef
  } = useAttendance();

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER BANNER */}
      <AttendanceHeader
        isEn={isEn}
        schedule={schedule}
        setShowCustomPeriod={setShowCustomPeriod}
        showCustomPeriod={showCustomPeriod}
      />

      {/* Optional custom period form */}
      {showCustomPeriod && (
        <div className="bg-brand-navy-50 p-4 rounded-2xl border border-brand-navy-200">
          <p className="text-xs font-bold text-brand-navy-700 mb-2">
            {isEn ? 'Select date range to load schedule data:' : 'Chọn khoảng thời gian tải dữ liệu lịch giảng dạy:'}
          </p>
          <CoachPeriod schedule={schedule} />
        </div>
      )}

      <CoachError message={schedule.error} retry={schedule.reload} />

      {/* SECTION 1: SCHEDULE CONTROLS & TIMETABLE (DẠNG SCHEDULE) */}
      <section className="bg-white rounded-2xl border border-brand-navy-200 shadow-sm p-4 md:p-6 space-y-5">
        {/* Schedule Header: Week Navigation + View Mode Switcher */}
        <ScheduleToolbar
          availableSports={availableSports}
          handleNextWeek={handleNextWeek}
          handlePrevWeek={handlePrevWeek}
          handleThisWeek={handleThisWeek}
          isEn={isEn}
          readinessFilter={readinessFilter}
          selectedSport={selectedSport}
          setReadinessFilter={setReadinessFilter}
          setSelectedSport={setSelectedSport}
          setViewMode={setViewMode}
          viewMode={viewMode}
          weekDays={weekDays}
        />

        {/* KPI Quick Overview Strip */}
        <WeekStats
          isEn={isEn}
          readinessFilter={readinessFilter}
          setReadinessFilter={setReadinessFilter}
          setSelectedDateIso={setSelectedDateIso}
          setViewMode={setViewMode}
          todayIso={todayIso}
          weekStats={weekStats}
        />

        {/* Day Tabs (For quick day filter in list view) */}
        {viewMode === 'list' && (
          <SessionListFilters
            DAY_FULL_LABELS={DAY_FULL_LABELS}
            isEn={isEn}
            selectedDateIso={selectedDateIso}
            sessionsByDate={sessionsByDate}
            setSelectedDateIso={setSelectedDateIso}
            todayIso={todayIso}
            weekDays={weekDays}
            weekStats={weekStats}
          />
        )}

        {/* LOADING STATE */}
        {schedule.loading && (
          <div className="p-12 text-center bg-brand-navy-50 rounded-2xl border border-dashed border-brand-navy-200">
            <div className="inline-block animate-spin text-brand-danger-600 mb-2">
              <span className="material-symbols-outlined text-3xl">progress_activity</span>
            </div>
            <p className="text-sm font-bold text-brand-navy-700">{isEn ? 'Loading teaching timetable...' : 'Đang tải thời khóa biểu ca dạy...'}</p>
            <p className="text-xs text-brand-navy-400 mt-1">{isEn ? 'Please wait a moment' : 'Vui lòng chờ trong giây lát'}</p>
          </div>
        )}

        {/* VIEW 1: WEEKLY TIMETABLE GRID (DẠNG LỊCH THỜI KHÓA BIỂU 7 CỘT) */}
        {!schedule.loading && viewMode === 'weekly' && (
          <WeeklyScheduleView
            DAY_FULL_LABELS={DAY_FULL_LABELS}
            activeSession={activeSession}
            handleSelectSession={handleSelectSession}
            isEn={isEn}
            sessionsByDate={sessionsByDate}
            todayIso={todayIso}
            weekDays={weekDays}
          />
        )}

        {/* VIEW 2: LIST VIEW (DANH SÁCH CA BẢNG BIỂU CHUYÊN NGHIỆP) */}
        {!schedule.loading && viewMode === 'list' && (
          <SessionListView
            activeSession={activeSession}
            filteredSessions={filteredSessions}
            handleSelectSession={handleSelectSession}
            isEn={isEn}
            readinessFilter={readinessFilter}
            selectedDateIso={selectedDateIso}
            selectedDayInfo={selectedDayInfo}
            selectedSport={selectedSport}
            setReadinessFilter={setReadinessFilter}
            setSelectedDateIso={setSelectedDateIso}
            setSelectedSport={setSelectedSport}
            todayIso={todayIso}
          />
        )}
      </section>

      {/* SECTION 2: ATTENDANCE WORKBENCH (KHU VỰC THỰC HIỆN ĐIỂM DANH CHO CA ĐÃ CHỌN) */}
      <section
        id="attendance-workbench"
        ref={workbenchRef}
        className="bg-white rounded-2xl border border-brand-navy-200 shadow-sm p-4 md:p-6 space-y-6"
      >
        {/* Selected Session Header Banner */}
        {activeSession ? (
          <ActiveSessionCard
            activeSession={activeSession}
            activeSessionStatusInfo={activeSessionStatusInfo}
            handleSelectSession={handleSelectSession}
            isEn={isEn}
            schedule={schedule}
          />
        ) : (
          <div className="p-8 text-center bg-brand-navy-50 rounded-2xl border border-brand-navy-200 text-brand-navy-500">
            {isEn ? 'No teaching session selected. Please pick a session from the timetable above.' : 'Chưa có ca dạy nào được chọn. Vui lòng chọn một ca từ lịch thời khóa biểu ở trên.'}
          </div>
        )}

        {/* Guardrail Policy Banner */}
        {activeSession && !canAttend && (
          <div role="alert" className="p-4 rounded-xl border bg-brand-sand-50 border-brand-sand-200 text-brand-sand-900 text-xs md:text-sm flex items-start gap-3">
            <span className="material-symbols-outlined text-brand-sand-700 dark:text-brand-sand-400 text-xl flex-shrink-0">info</span>
            <div>
              <p className="font-bold">{activeAttendanceRestriction.title}</p>
              <p className="mt-0.5 text-brand-sand-800 dark:text-brand-sand-400">{activeAttendanceRestriction.description}</p>
            </div>
          </div>
        )}

        <CoachError message={memberError} retry={() => setVersion(v => v + 1)} />

        {/* SUMMARY STATS & BATCH ACTIONS */}
        {activeSession && !memberError && (
          <RollCallToolbar
            ATTENDANCE_STATUSES={ATTENDANCE_STATUSES}
            canAttend={canAttend}
            filterRosterStatus={filterRosterStatus}
            handleMarkAllPresent={handleMarkAllPresent}
            handleResetRecords={handleResetRecords}
            isEn={isEn}
            members={members}
            saving={saving}
            searchMember={searchMember}
            setFilterRosterStatus={setFilterRosterStatus}
            setSearchMember={setSearchMember}
            stats={stats}
          />
        )}

        {/* LOADING ROSTER */}
        {loadingMembers && (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin text-brand-danger-600 mb-2">
              <span className="material-symbols-outlined text-3xl">progress_activity</span>
            </div>
            <p className="text-sm font-bold text-brand-navy-700">{isEn ? 'Loading student roster...' : 'Đang tải danh sách học viên điểm danh...'}</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loadingMembers && !memberError && activeSession && members.length === 0 && (
          <div className="p-8 text-center bg-brand-navy-50 rounded-2xl border border-dashed border-brand-navy-200">
            <span className="material-symbols-outlined text-4xl text-brand-navy-300">group_off</span>
            <p className="text-sm font-bold text-brand-navy-700 mt-2">{isEn ? 'No students enrolled for this session yet.' : 'Chưa có học viên đặt chỗ cho buổi học này.'}</p>
            <p className="text-xs text-brand-navy-500 mt-1">{isEn ? 'When students book a spot, the roster will show up here.' : 'Khi học viên đặt chỗ tham gia lớp, danh sách sẽ hiển thị tại đây.'}</p>
          </div>
        )}

        {/* ROSTER MEMBER CARDS */}
        {!loadingMembers && !memberError && filteredMembers.length > 0 && (
          <RosterList
            ATTENDANCE_STATUSES={ATTENDANCE_STATUSES}
            canAttend={canAttend}
            filteredMembers={filteredMembers}
            handleNoteChange={handleNoteChange}
            handleStatusChange={handleStatusChange}
            handleToggleLateNote={handleToggleLateNote}
            isEn={isEn}
            records={records}
            saving={saving}
          />
        )}

        {/* BOTTOM SAVE BAR */}
        {!loadingMembers && !memberError && members.length > 0 && (
          <SaveAttendanceBar
            canAttend={canAttend}
            handleSaveAttendance={handleSaveAttendance}
            isEn={isEn}
            saving={saving}
            stats={stats}
          />
        )}
      </section>
    </div>
  );
}
