import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../entities/session/index.js';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { currentPeriod } from '../lib/format.js';
import { payrollApi } from '../../../entities/payroll/index.js';

export function usePayroll() {
  const { currentUser: user } = useAuth();
  const role = user?.role || '';
  const { language } = useLanguage();
  const { showSuccess, showError } = useToast();
  const isEn = language === 'en';
  const canManage = ['MANAGER', 'ADMIN'].includes(String(role || '').toUpperCase());

  // Period state
  const initial = currentPeriod();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);

  // Tab state: 'sheet' (Bảng lương chi tiết) | 'reports' (Báo cáo & Phân tích)
  const [activeTab, setActiveTab] = useState('sheet');

  // Data states
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Filters & Sorting in Sheet Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [policyFilter, setPolicyFilter] = useState('ALL');
  const [kpiFilter, setKpiFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('TOTAL_DESC');

  // Modals
  const [editing, setEditing] = useState(null);
  const [viewingPayslip, setViewingPayslip] = useState(null);

  // Form state for Salary Policy editing
  const [editForm, setEditForm] = useState({
    baseSalary: 0,
    allowance: 0,
    commissionPerSession: 0,
    targetSessions: 0,
    effectiveFrom: '',
    effectiveTo: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = canManage ? await payrollApi.getReport(year, month) : await payrollApi.getMine(year, month);
      setData(res);
    } catch (error) {
      showError(error.message || (isEn ? 'Cannot load payroll data' : 'Không thể tải dữ liệu lương'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [year, month, canManage]);

  // Navigate months
  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleCurrentMonth = () => {
    const cur = currentPeriod();
    setYear(cur.year);
    setMonth(cur.month);
  };

  // Open Edit Modal with prefilled values
  const openEditModal = (row) => {
    setEditing(row);
    setEditForm({
      baseSalary: row.baseSalary || 0,
      allowance: row.allowance || 0,
      commissionPerSession: row.commissionPerSession || 0,
      targetSessions: row.targetSessions || 0,
      effectiveFrom: row.effectiveFrom ? String(row.effectiveFrom).slice(0, 10) : `${year}-${String(month).padStart(2, '0')}-01`,
      effectiveTo: row.effectiveTo ? String(row.effectiveTo).slice(0, 10) : ''
    });
  };

  // Save Salary Policy
  const handleSavePolicy = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      const isCoach = String(editing.role).toUpperCase() === 'COACH';
      const payload = {
        userId: Number(editing.userId),
        monthlyBaseSalary: Number(editForm.baseSalary || 0),
        monthlyAllowance: isCoach ? 0 : Number(editForm.allowance || 0),
        effectiveFrom: editForm.effectiveFrom || `${year}-${String(month).padStart(2, '0')}-01`,
        effectiveTo: editForm.effectiveTo?.trim() ? editForm.effectiveTo.trim() : null,
        commissionPerSession: isCoach ? Number(editForm.commissionPerSession || 0) : null,
        targetSessions: isCoach ? Number(editForm.targetSessions || 0) : null
      };

      await payrollApi.saveStaffPolicy(payload);
      showSuccess(isEn ? `Salary policy updated for ${editing.fullName}` : `Đã cập nhật chính sách thù lao cho ${editing.fullName}`);
      setEditing(null);
      await load();
    } catch (error) {
      showError(error.message || (isEn ? 'Failed to update salary policy' : 'Lỗi cập nhật chính sách lương'));
    } finally {
      setBusy(false);
    }
  };

  // Normalized rows list with session calculations and KPI evaluation
  const rows = useMemo(() => {
    let rawList = [];
    if (!canManage) {
      rawList = data ? [data] : [];
    } else {
      rawList = data?.employees || [];
    }

    return rawList.map((r) => {
      const isCoach = String(r.role || '').toUpperCase() === 'COACH';
      const completedSessions = r.completedSessions ?? r.sessions ?? 0;
      const targetSessions = Number(r.targetSessions || 0);
      const sessionBonus = Number(r.sessionBonus || 0);
      const sessionKpiPercent = targetSessions > 0 ? Math.round((completedSessions / targetSessions) * 100) : null;

      // Overall KPI achievement evaluation
      let kpiStatus = 'STANDARD';
      if (isCoach) {
        if (targetSessions === 0) {
          kpiStatus = 'NO_KPI';
        } else {
          const rate = completedSessions / targetSessions;
          if (rate >= 1.2) kpiStatus = 'EXCELLENT';
          else if (rate >= 1.0) kpiStatus = 'MET';
          else if (rate >= 0.7) kpiStatus = 'IN_PROGRESS';
          else kpiStatus = 'BEHIND';
        }
      }

      return {
        ...r,
        employeeCode: r.employeeCode || r.code || `ID-${r.userId}`,
        policyConfigured: r.policyConfigured ?? r.hasPolicy ?? false,
        completedSessions,
        sessionBonus,
        targetSessions,
        sessionKpiPercent,
        kpiStatus,
        commissionPerSession: Number(r.commissionPerSession || 0)
      };
    });
  }, [data, canManage]);

  // Overall Financial & KPI Metrics
  const metrics = useMemo(() => {
    const totalStaff = rows.length;
    const configuredCount = rows.filter((r) => r.policyConfigured).length;
    const unconfiguredCount = totalStaff - configuredCount;

    const totalEstimated = canManage ? Number(data?.estimatedPayroll || 0) : Number(data?.estimatedTotal || 0);
    const totalBase = canManage ? Number(data?.totalBaseSalary || 0) : Number(data?.baseSalary || 0);
    const totalVariable = canManage
      ? Number(data?.totalVariablePay || 0)
      : Number((data?.allowance || 0) + (data?.sessionBonus || 0));

    const totalSessions = rows.reduce((acc, r) => acc + (r.completedSessions || 0), 0);
    const totalSessionBonus = rows.reduce((acc, r) => acc + Number(r.sessionBonus || 0), 0);
    const totalAllowance = rows.reduce((acc, r) => acc + Number(r.allowance || 0), 0);

    // Breakdown by Role
    const byRole = {};
    rows.forEach((r) => {
      const roleKey = String(r.role || 'STAFF').toUpperCase();
      if (!byRole[roleKey]) {
        byRole[roleKey] = {
          role: roleKey,
          count: 0,
          totalPay: 0,
          totalBase: 0,
          totalBonus: 0,
          sessions: 0
        };
      }
      byRole[roleKey].count += 1;
      byRole[roleKey].totalPay += Number(r.estimatedTotal || 0);
      byRole[roleKey].totalBase += Number(r.baseSalary || 0);
      byRole[roleKey].totalBonus += Number((r.allowance || 0) + (r.sessionBonus || 0));
      byRole[roleKey].sessions += r.completedSessions || 0;
    });

    const roleBreakdown = Object.values(byRole).map((item) => ({
      ...item,
      sharePercent: totalEstimated > 0 ? Math.round((item.totalPay / totalEstimated) * 100) : 0,
      averagePay: item.count > 0 ? Math.round(item.totalPay / item.count) : 0
    }));

    // Top Earners
    const topEarners = [...rows].sort((a, b) => (b.estimatedTotal || 0) - (a.estimatedTotal || 0)).slice(0, 5);

    // Coaches efficiency & KPI Analysis
    const coaches = rows.filter((r) => String(r.role).toUpperCase() === 'COACH');
    const coachCount = coaches.length;
    const avgSessionsPerCoach = coachCount > 0 ? (totalSessions / coachCount).toFixed(1) : 0;
    const avgCostPerSession = totalSessions > 0 ? Math.round(totalSessionBonus / totalSessions) : 0;

    const totalTargetSessions = coaches.reduce((acc, c) => acc + (c.targetSessions || 0), 0);
    const sessionKpiAchievementRate = totalTargetSessions > 0 ? Math.round((totalSessions / totalTargetSessions) * 100) : 0;
    const coachesMeetingKpi = coaches.filter((c) => c.kpiStatus === 'MET' || c.kpiStatus === 'EXCELLENT').length;
    const coachesKpiRate = coachCount > 0 ? Math.round((coachesMeetingKpi / coachCount) * 100) : 0;

    return {
      totalStaff,
      configuredCount,
      unconfiguredCount,
      coverageRate: totalStaff > 0 ? Math.round((configuredCount / totalStaff) * 100) : 0,
      totalEstimated,
      totalBase,
      baseSharePercent: totalEstimated > 0 ? Math.round((totalBase / totalEstimated) * 100) : 0,
      totalVariable,
      variableSharePercent: totalEstimated > 0 ? Math.round((totalVariable / totalEstimated) * 100) : 0,
      totalSessions,
      totalSessionBonus,
      totalAllowance,
      roleBreakdown,
      topEarners,
      coaches,
      coachCount,
      avgSessionsPerCoach,
      avgCostPerSession,
      totalTargetSessions,
      sessionKpiAchievementRate,
      coachesMeetingKpi,
      coachesKpiRate
    };
  }, [rows, data, canManage]);

  // Filtered & Sorted Rows in Sheet Tab
  const displayedRows = useMemo(() => {
    let list = [...rows];

    // Filter Role
    if (roleFilter !== 'ALL') {
      list = list.filter((r) => String(r.role || '').toUpperCase() === roleFilter);
    }

    // Filter Policy
    if (policyFilter === 'CONFIGURED') {
      list = list.filter((r) => r.policyConfigured);
    } else if (policyFilter === 'NOT_CONFIGURED') {
      list = list.filter((r) => !r.policyConfigured);
    }

    // Filter KPI
    if (kpiFilter === 'MET') {
      list = list.filter((r) => r.kpiStatus === 'MET' || r.kpiStatus === 'EXCELLENT');
    } else if (kpiFilter === 'NOT_MET') {
      list = list.filter((r) => r.kpiStatus === 'IN_PROGRESS' || r.kpiStatus === 'BEHIND');
    }

    // Search Query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          (r.fullName || '').toLowerCase().includes(q) ||
          (r.employeeCode || '').toLowerCase().includes(q) ||
          (r.role || '').toLowerCase().includes(q) ||
          (r.centerName || '').toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'TOTAL_DESC') {
      list.sort((a, b) => (b.estimatedTotal || 0) - (a.estimatedTotal || 0));
    } else if (sortBy === 'TOTAL_ASC') {
      list.sort((a, b) => (a.estimatedTotal || 0) - (b.estimatedTotal || 0));
    } else if (sortBy === 'BASE_DESC') {
      list.sort((a, b) => (b.baseSalary || 0) - (a.baseSalary || 0));
    } else if (sortBy === 'SESSIONS_DESC') {
      list.sort((a, b) => (b.completedSessions || 0) - (a.completedSessions || 0));
    } else if (sortBy === 'KPI_DESC') {
      list.sort((a, b) => (b.sessionKpiPercent || 0) - (a.sessionKpiPercent || 0));
    } else if (sortBy === 'NAME_ASC') {
      list.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'vi'));
    }

    return list;
  }, [rows, roleFilter, policyFilter, kpiFilter, searchQuery, sortBy]);

  // Export CSV
  const handleExportCsv = () => {
    if (!rows.length) return;
    const headers = [
      isEn ? 'Employee Code' : 'Mã NV',
      isEn ? 'Full Name' : 'Họ và tên',
      isEn ? 'Role' : 'Vai trò',
      isEn ? 'Center' : 'Trung tâm',
      isEn ? 'Policy Status' : 'Trạng thái chính sách',
      isEn ? 'Base Salary (VND)' : 'Lương cơ bản (VNĐ)',
      isEn ? 'Monthly Allowance (VND)' : 'Phụ cấp (VNĐ)',
      isEn ? 'Completed Sessions' : 'Số ca dạy thực tế',
      isEn ? 'Target Sessions' : 'Chỉ tiêu ca dạy (KPI)',
      isEn ? 'Session KPI %' : 'Tỉ lệ đạt KPI ca (%)',
      isEn ? 'Session Pay (VND)' : 'Thù lao ca dạy (VNĐ)',
      isEn ? 'KPI Rating' : 'Xếp loại KPI',
      isEn ? 'Estimated Total (VND)' : 'Tổng thu nhập dự kiến (VNĐ)'
    ];

    const dataLines = rows.map((r) => [
      `"${r.employeeCode || ''}"`,
      `"${(r.fullName || '').replace(/"/g, '""')}"`,
      `"${r.role || ''}"`,
      `"${(r.centerName || '').replace(/"/g, '""')}"`,
      `"${r.policyConfigured ? (isEn ? 'Active Policy' : 'Đã cấu hình') : (isEn ? 'Missing Policy' : 'Chưa cấu hình')}"`,
      r.baseSalary || 0,
      r.allowance || 0,
      r.completedSessions || 0,
      r.targetSessions || 0,
      r.sessionKpiPercent || 0,
      r.sessionBonus || 0,
      `"${r.kpiStatus || ''}"`,
      r.estimatedTotal || 0
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...dataLines.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bang_Luong_T${String(month).padStart(2, '0')}_${year}_OlympicSCMS.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showSuccess(isEn ? 'Exported payroll report successfully!' : 'Đã xuất bảng lương thành công!');
  };

  // Helper render badge KPI

  return {
    activeTab, busy, canManage, displayedRows, editForm, editing, handleCurrentMonth,
    handleExportCsv, handleNextMonth, handlePrevMonth, handleSavePolicy, isEn, kpiFilter, load,
    loading, metrics, month, openEditModal, policyFilter, roleFilter, rows, searchQuery,
    setActiveTab, setEditForm, setEditing, setKpiFilter, setPolicyFilter, setRoleFilter,
    setSearchQuery, setSortBy, setViewingPayslip, sortBy, viewingPayslip, year
  };
}
