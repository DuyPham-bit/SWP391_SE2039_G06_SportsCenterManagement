import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { reportApi } from '../../../entities/report/index.js';
import { adminApi } from '../../../entities/center/index.js';
import { downloadReportFile } from '../../../shared/lib/reportFiles.js';
import { createReportCsv } from '../../../shared/lib/reportExport.js';
import { reportDate } from '../../../shared/lib/reportFileData.js';

export function useReportsAnalytics({ adminMode = false } = {}) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const { showError } = useToast();
  const [period, setPeriod] = useState('30D');
  // Every selection is normalized to { from, to, groupBy } so the UI, exports and API use the same dates.
  const [selection, setSelection] = useState(() => reportApi.getPeriodRange('30D'));
  const [range, setRange] = useState(() => ({ ...selection }));
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revision, setRevision] = useState(0);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [centers, setCenters] = useState([]);
  const [selectedCenterId, setSelectedCenterId] = useState('ALL');
  const [centersLoading, setCentersLoading] = useState(adminMode);
  const [centersError, setCentersError] = useState(null);

  // Table filters
  const [activeTableTab, setActiveTableTab] = useState('classes'); // classes | sports | rooms | coaches | logs
  const [classSearch, setClassSearch] = useState('');
  const [classSportFilter, setClassSportFilter] = useState('ALL');
  const [classSortBy, setClassSortBy] = useState('booked'); // booked | occupancy | sessions
  const [roomSortBy, setRoomSortBy] = useState('booked'); // booked | sessions | occupancy
  const hasPendingRange = range.from !== selection.from || range.to !== selection.to || range.groupBy !== selection.groupBy;

  const periodLabel = useMemo(() => {
    const mapEn = { '30D': 'Last 30 Days', LAST_MONTH: 'Last Month', DAY: 'Today', WEEK: 'This Week', MONTH: 'This Month', QUARTER: 'This Quarter', YEAR: 'This Year', CUSTOM: 'Custom Range' };
    const mapVi = { '30D': '30 ngày qua', LAST_MONTH: 'Tháng trước', DAY: 'Hôm nay', WEEK: 'Tuần này', MONTH: 'Tháng này', QUARTER: 'Quý này', YEAR: 'Năm nay', CUSTOM: 'Khoảng tùy chọn' };
    return (isEn ? mapEn[period] : mapVi[period]) || period;
  }, [period, isEn]);

  useEffect(() => {
    if (!adminMode) return undefined;
    let active = true;
    setCentersLoading(true);
    setCentersError(null);
    adminApi.getCenters()
      .then(data => { if (active) setCenters(Array.isArray(data) ? data : []); })
      .catch(e => { if (active) setCentersError(e); })
      .finally(() => { if (active) setCentersLoading(false); });
    return () => { active = false; };
  }, [adminMode]);

  useEffect(() => {
    if (adminMode && centersLoading) return undefined;
    let active = true;
    setLoading(true);
    setError(null);
    setMetrics(null);

    const request = adminMode
      ? (selectedCenterId === 'ALL'
          ? reportApi.getSystemOverview(selection, centers)
          : reportApi.getOverview(selection, { centerId: Number(selectedCenterId) }))
      : reportApi.getOverview(selection);
    request
      .then(data => { if (active) setMetrics(data); })
      .catch(e => { if (active) setError(e); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [adminMode, centers, centersLoading, selectedCenterId, selection, revision]);

  const selectedCenter = centers.find(center => String(center.id) === String(selectedCenterId));
  const reportScopeLabel = adminMode
    ? (selectedCenterId === 'ALL'
        ? (isEn ? `All centers (${centers.length})` : `Toàn hệ thống (${centers.length} cơ sở)`)
        : selectedCenter?.name || (isEn ? 'Selected center' : 'Cơ sở đã chọn'))
    : 'SCMS Olympic Sports Arena';

  const exportOptions = () => ({
    language,
    centerLabel: reportScopeLabel,
    generatedAt: new Date()
  });

  const exportPdf = async () => {
    if (exportingPdf || !metrics) return;
    setExportingPdf(true);
    try { await downloadReportFile(metrics, exportOptions(), 'pdf'); }
    catch (e) { showError(e); }
    finally { setExportingPdf(false); }
  };

  const exportExcel = async () => {
    if (exportingXlsx || !metrics) return;
    setExportingXlsx(true);
    try { await downloadReportFile(metrics, exportOptions(), 'xlsx'); }
    catch (e) { showError(e); }
    finally { setExportingXlsx(false); }
  };

  const exportReport = () => {
    if (exportingCsv || !metrics) return;
    setExportingCsv(true);
    try {
      const url = URL.createObjectURL(new Blob([createReportCsv(metrics, period)], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `SCMS-BaoCao-ChiTiet-${period}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      showError(e);
    } finally {
      setExportingCsv(false);
    }
  };

  // Filtered and sorted classes
  const processedClasses = useMemo(() => {
    if (!metrics?.topClasses) return [];
    return metrics.topClasses
      .filter(c => {
        const matchSearch = !classSearch || c.name.toLowerCase().includes(classSearch.toLowerCase()) || (c.coachName && c.coachName.toLowerCase().includes(classSearch.toLowerCase()));
        const matchSport = classSportFilter === 'ALL' || c.sportName === classSportFilter;
        return matchSearch && matchSport;
      })
      .sort((a, b) => {
        if (classSortBy === 'occupancy') return b.occupancyRate - a.occupancyRate || b.booked - a.booked;
        if (classSortBy === 'sessions') return b.sessionsCount - a.sessionsCount || b.booked - a.booked;
        return b.booked - a.booked || b.occupancyRate - a.occupancyRate;
      });
  }, [metrics?.topClasses, classSearch, classSportFilter, classSortBy]);

  // Sorted rooms
  const processedRooms = useMemo(() => {
    if (!metrics?.topRooms) return [];
    return [...metrics.topRooms].sort((a, b) => {
      if (roomSortBy === 'sessions') return b.sessionsCount - a.sessionsCount || b.booked - a.booked;
      if (roomSortBy === 'occupancy') return b.occupancyRate - a.occupancyRate || b.booked - a.booked;
      return b.booked - a.booked || b.sessionsCount - a.sessionsCount;
    });
  }, [metrics?.topRooms, roomSortBy]);

  const revenue = metrics?.revenuePeriods || [];
  const membership = metrics?.membershipPeriods || [];
  const events = metrics?.classPeriods || [];

  const highlights = metrics?.highlights || {};
  const topClass = highlights.mostPopularClass;
  const topSport = highlights.mostPopularSport;
  const topRevenueSport = highlights.highestRevenueSport;
  const topRoom = highlights.mostBookedRoom;

  return {
    adminMode, centers, centersError, centersLoading, hasPendingRange, reportDate, reportScopeLabel,
    selectedCenterId, selection, setSelectedCenterId,
    activeTableTab, classSearch, classSortBy, classSportFilter, error, events, exportExcel,
    exportPdf, exportReport, exportingCsv, exportingPdf, exportingXlsx, isEn, loading, membership,
    metrics, period, periodLabel, processedClasses, processedRooms, range, revenue, roomSortBy,
    setActiveTableTab, setClassSearch, setClassSortBy, setClassSportFilter, setPeriod, setRange,
    setRevision, setRoomSortBy, setSelection, showError, topClass, topRevenueSport, topRoom,
    topSport
  };
}
