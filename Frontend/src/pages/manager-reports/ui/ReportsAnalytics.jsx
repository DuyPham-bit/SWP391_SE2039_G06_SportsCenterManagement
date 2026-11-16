import React from 'react';
import { LoadingSpinner } from '../../../shared/ui/Table.jsx';
import { BusinessAlert } from '../../../shared/ui/BusinessAlert.jsx';
import { useReportsAnalytics } from '../model/useReportsAnalytics.js';
import { PrintReportHeader } from './PrintReportHeader.jsx';
import { ReportsHeroBanner } from './ReportsHeroBanner.jsx';
import { ReportPeriodSelector } from './ReportPeriodSelector.jsx';
import { ExecutiveKpiCards } from './ExecutiveKpiCards.jsx';
import { MembershipDistribution } from './MembershipDistribution.jsx';
import { ClassStatusStrip } from './ClassStatusStrip.jsx';
import { PerformanceGaugesRow } from './PerformanceGaugesRow.jsx';
import { SalesOverviewRow } from './SalesOverviewRow.jsx';
import { SportRevenueRow } from './SportRevenueRow.jsx';
import { ClassesActivityRow } from './ClassesActivityRow.jsx';
import { LeaderboardsRow } from './LeaderboardsRow.jsx';
import { OperationalInsights } from './OperationalInsights.jsx';
import { DetailTableTabs } from './DetailTableTabs.jsx';
import { ClassesDetailTable } from './ClassesDetailTable.jsx';
import { SportsDetailTable } from './SportsDetailTable.jsx';
import { RoomsDetailTable } from './RoomsDetailTable.jsx';
import { CoachesDetailTable } from './CoachesDetailTable.jsx';
import { RevenueLogTable } from './RevenueLogTable.jsx';

export function ReportsAnalytics() {
  const {
    activeTableTab, classSearch, classSortBy, classSportFilter, error, events, exportExcel,
    exportPdf, exportReport, exportingCsv, exportingPdf, exportingXlsx, isEn, loading, membership,
    metrics, period, periodLabel, processedClasses, processedRooms, range, revenue, roomSortBy,
    setActiveTableTab, setClassSearch, setClassSortBy, setClassSportFilter, setPeriod, setRange,
    setRevision, setRoomSortBy, setSelection, showError, topClass, topRevenueSport, topRoom,
    topSport
  } = useReportsAnalytics();

  return (
    <div className="space-y-6 pb-12 animate-fade-slide-up print:space-y-4 print:pb-0">
      {/* 0. PRINT-ONLY OFFICIAL REPORT HEADER */}
      <PrintReportHeader isEn={isEn} periodLabel={periodLabel} range={range} />

      {/* 1. PAGE HEADER - OLYMPIC MULTI-STOP GRADIENT MATCHING IMAGE 1 */}
      <ReportsHeroBanner
        exportExcel={exportExcel}
        exportPdf={exportPdf}
        exportReport={exportReport}
        exportingCsv={exportingCsv}
        exportingPdf={exportingPdf}
        exportingXlsx={exportingXlsx}
        isEn={isEn}
        loading={loading}
        metrics={metrics}
      />

      {/* 2. DATE RANGE & PERIOD SELECTOR */}
      <ReportPeriodSelector
        isEn={isEn}
        period={period}
        range={range}
        setPeriod={setPeriod}
        setRange={setRange}
        setSelection={setSelection}
        showError={showError}
      />

      {loading ? (
        <LoadingSpinner text={isEn ? 'Processing and aggregating sports center metrics...' : 'Đang xử lý và tổng hợp dữ liệu báo cáo trung tâm...'} />
      ) : error ? (
        <BusinessAlert
          type="error"
          title={isEn ? 'Could not load analytics report' : 'Không thể tải báo cáo thống kê'}
          code={error.code || 'REPORT-LOAD-ERR'}
          message={error.message || String(error)}
          proposedHandling={error.proposedHandling || (isEn ? 'Large query might have timed out. Please retry or narrow the date range.' : 'Truy vấn dữ liệu lớn có thể bị gián đoạn đường truyền. Vui lòng thử lại hoặc thu hẹp khoảng ngày.')}
          actionText={isEn ? 'Retry' : 'Thử lại'}
          onAction={() => setRevision(x => x + 1)}
        />
      ) : metrics && (
        <>
          {/* 3. TIER 1: EXECUTIVE TOP KPI CARDS (Vision UI 4-Card Style with Olympic Palette) */}
          <ExecutiveKpiCards isEn={isEn} metrics={metrics} />

          {/* 3a. CURRENT MEMBERSHIP DISTRIBUTION */}
          <MembershipDistribution isEn={isEn} metrics={metrics} />

          {/* 3b. INLINE CURRENT CLASS STATUS STRIP */}
          <ClassStatusStrip isEn={isEn} metrics={metrics} />

          {/* 4. TIER 2: HERO WELCOME + ARC GAUGE + RADIAL SCORE (Vision UI Row 2 with Olympic Palette) */}
          <PerformanceGaugesRow
            isEn={isEn}
            metrics={metrics}
            setActiveTableTab={setActiveTableTab}
            topClass={topClass}
            topRevenueSport={topRevenueSport}
            topRoom={topRoom}
          />

          {/* 5. TIER 3: SALES OVERVIEW (SPLINE WAVE) + ACTIVE USERS (BARS & 4 PILLS) (Vision UI Row 3) */}
          <SalesOverviewRow
            isEn={isEn}
            membership={membership}
            metrics={metrics}
            revenue={revenue}
          />

          {/* 6. TIER 4: SPORT REVENUE ALLOCATION + SPORTS MARKET SHARE DONUT */}
          <SportRevenueRow isEn={isEn} metrics={metrics} />

          {/* 7. TIER 5: PROJECTS TABLE + ORDERS / ACTIVITY TIMELINE (Vision UI Bottom Row) */}
          <ClassesActivityRow
            classSearch={classSearch}
            classSportFilter={classSportFilter}
            isEn={isEn}
            metrics={metrics}
            processedClasses={processedClasses}
            setActiveTableTab={setActiveTableTab}
            setClassSearch={setClassSearch}
            setClassSportFilter={setClassSportFilter}
            topClass={topClass}
            topRoom={topRoom}
          />

          {/* 8. TIER 6: DETAILED LEADERBOARDS & OPERATIONAL INSIGHTS */}
          <LeaderboardsRow isEn={isEn} metrics={metrics} processedRooms={processedRooms} />

          {/* 6. 💡 BẢNG KHUYẾN NGHỊ VẬN HÀNH THÔNG MINH (OPERATIONAL INSIGHTS) */}
          <OperationalInsights
            isEn={isEn}
            processedRooms={processedRooms}
            topClass={topClass}
            topRoom={topRoom}
            topSport={topSport}
          />

          {/* 7. 📋 PHẦN TRA CỨU & BẢNG BIỂU CHI TIẾT */}
          <div className="space-y-4 pt-4 border-t border-brand-navy-200 dark:border-brand-navy-800">
            <DetailTableTabs
              activeTableTab={activeTableTab}
              isEn={isEn}
              setActiveTableTab={setActiveTableTab}
            />

            {/* TABLE TAB 1: BẢNG LỚP HỌC */}
            {activeTableTab === 'classes' && (
              <ClassesDetailTable
                classSearch={classSearch}
                classSortBy={classSortBy}
                classSportFilter={classSportFilter}
                isEn={isEn}
                metrics={metrics}
                processedClasses={processedClasses}
                setClassSearch={setClassSearch}
                setClassSortBy={setClassSortBy}
                setClassSportFilter={setClassSportFilter}
              />
            )}

            {/* TABLE TAB 2: DANH SÁCH BỘ MÔN */}
            {activeTableTab === 'sports' && (
              <SportsDetailTable isEn={isEn} metrics={metrics} />
            )}

            {/* TABLE TAB 3: BẢNG SÂN & PHÒNG */}
            {activeTableTab === 'rooms' && (
              <RoomsDetailTable
                isEn={isEn}
                processedRooms={processedRooms}
                roomSortBy={roomSortBy}
                setRoomSortBy={setRoomSortBy}
              />
            )}

            {/* TABLE TAB 4: HIỆU SUẤT HUẤN LUYỆN VIÊN */}
            {activeTableTab === 'coaches' && (
              <CoachesDetailTable isEn={isEn} metrics={metrics} />
            )}

            {/* TABLE TAB 5: LỊCH SỬ & ĐĂNG KÝ */}
            {activeTableTab === 'logs' && (
              <RevenueLogTable events={events} isEn={isEn} revenue={revenue} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
