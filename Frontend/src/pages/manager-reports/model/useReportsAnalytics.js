import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { reportApi } from '../../../entities/report/index.js';
import { downloadReportFile } from '../../../shared/lib/reportFiles.js';
import { createReportCsv } from '../../../shared/lib/reportExport.js';

export function useReportsAnalytics() {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const { showError } = useToast();
  const [period, setPeriod] = useState('30D');
  const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() + 7 * 3600000 - 29 * 86400000).toISOString().slice(0, 10);
  const [range, setRange] = useState({ from: thirtyDaysAgo, to: today, groupBy: 'day' });
  const [selection, setSelection] = useState('30D');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revision, setRevision] = useState(0);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  // Table filters
  const [activeTableTab, setActiveTableTab] = useState('classes'); // classes | sports | rooms | coaches | logs
  const [classSearch, setClassSearch] = useState('');
  const [classSportFilter, setClassSportFilter] = useState('ALL');
  const [classSortBy, setClassSortBy] = useState('booked'); // booked | occupancy | sessions
  const [roomSortBy, setRoomSortBy] = useState('booked'); // booked | sessions | occupancy

  const periodLabel = useMemo(() => {
    const mapEn = { '30D': 'Last 30 Days', LAST_MONTH: 'Last Month', DAY: 'Today', WEEK: 'This Week', MONTH: 'This Month', QUARTER: 'This Quarter', YEAR: 'This Year', CUSTOM: 'Custom Range' };
    const mapVi = { '30D': '30 ngày qua', LAST_MONTH: 'Tháng trước', DAY: 'Hôm nay', WEEK: 'Tuần này', MONTH: 'Tháng này', QUARTER: 'Quý này', YEAR: 'Năm nay', CUSTOM: 'Khoảng tùy chọn' };
    return (isEn ? mapEn[period] : mapVi[period]) || period;
  }, [period, isEn]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setMetrics(null);

    reportApi.getOverview(selection)
      .then(data => { if (active) setMetrics(data); })
      .catch(e => { if (active) setError(e); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [selection, revision]);

  const exportOptions = () => ({
    language,
    centerLabel: 'SCMS Olympic Sports Arena',
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
    activeTableTab, classSearch, classSortBy, classSportFilter, error, events, exportExcel,
    exportPdf, exportReport, exportingCsv, exportingPdf, exportingXlsx, isEn, loading, membership,
    metrics, period, periodLabel, processedClasses, processedRooms, range, revenue, roomSortBy,
    setActiveTableTab, setClassSearch, setClassSortBy, setClassSportFilter, setPeriod, setRange,
    setRevision, setRoomSortBy, setSelection, showError, topClass, topRevenueSport, topRoom,
    topSport
  };
}
