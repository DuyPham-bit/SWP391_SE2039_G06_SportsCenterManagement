import { formatVietnamDate, vietnamDate } from '../../utils/dateTime.js';
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { payrollApi } from '../../services/api.js';

// Format currency
const money = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '0 ₫';
  return Number(val).toLocaleString('vi-VN') + ' ₫';
};

// Format short date
const dt = (d) => {
  if (!d) return '—';
  try {
    return formatVietnamDate(d);
  } catch {
    return String(d);
  }
};

// Current Month/Year helper
const currentPeriod = () => {
  const [year, month] = vietnamDate().split('-').map(Number);
  return { year, month };
};

// Role badge styles
const ROLE_BADGES = {
  COACH: {
    labelVi: 'HLV',
    labelEn: 'Coach',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
  },
  RECEPTIONIST: {
    labelVi: 'Lễ tân',
    labelEn: 'Receptionist',
    badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
  },
  MANAGER: {
    labelVi: 'Quản lý',
    labelEn: 'Manager',
    badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
  },
  ADMIN: {
    labelVi: 'Quản trị viên',
    labelEn: 'Admin',
    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
  }
};

// Avatar Initials
const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarGradient = (name = '') => {
  const gradients = [
    'from-emerald-500 to-teal-700',
    'from-blue-500 to-indigo-700',
    'from-amber-500 to-orange-700',
    'from-purple-500 to-violet-700',
    'from-rose-500 to-pink-700',
    'from-cyan-500 to-blue-700'
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return gradients[sum % gradients.length];
};

// Generic Modal Container
function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full ${maxWidth} rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-chivo text-lg font-black text-slate-900 dark:text-slate-100">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function PayrollPage() {
  const { user } = useAuth();
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
  const renderKpiBadge = (row) => {
    const isCoach = String(row.role || '').toUpperCase() === 'COACH';
    if (!isCoach) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          <span className="material-symbols-outlined text-[12px]">schedule</span>
          <span>{isEn ? 'Standard' : 'Định mức'}</span>
        </span>
      );
    }

    if (row.kpiStatus === 'EXCELLENT') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 shadow-2xs">
          <span className="material-symbols-outlined text-[13px] text-amber-500">star</span>
          <span>{isEn ? 'Surpassed KPI' : 'Vượt KPI'}</span>
        </span>
      );
    }

    if (row.kpiStatus === 'MET') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800">
          <span className="material-symbols-outlined text-[13px]">check_circle</span>
          <span>{isEn ? 'Met KPI' : 'Đạt KPI'}</span>
        </span>
      );
    }

    if (row.kpiStatus === 'IN_PROGRESS') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
          <span className="material-symbols-outlined text-[13px]">trending_up</span>
          <span>{isEn ? 'In Progress' : 'Đang phấn đấu'}</span>
        </span>
      );
    }

    if (row.kpiStatus === 'BEHIND') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
          <span className="material-symbols-outlined text-[13px]">warning</span>
          <span>{isEn ? 'Below Target' : 'Chưa đạt'}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <span>{isEn ? 'No KPI Set' : 'Chưa gán KPI'}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-slide-up pb-12">
      {/* 1. Header Banner */}
      <section
        className="relative overflow-hidden rounded-3xl text-white p-6 sm:p-8 shadow-xl shadow-[#24828F]/25 border border-white/30"
        style={{
          background: 'linear-gradient(108deg, #2F7B5D 0%, #24828F 25%, #3FAEB8 48%, #76B386 70%, #DEAC46 88%, #E5A33C 100%)'
        }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-[#F2CC8F]/40 via-[#E5A33C]/30 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-gradient-to-tr from-[#81B29A]/40 via-[#2F7B5D]/30 to-transparent blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/95 text-[#1B4332] text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/80 shadow-xs mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>{isEn ? 'Compensation & Teaching Workspace' : 'Phân hệ Lương & Thù Lao Ca Dạy · Olympic SCMS'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-chivo tracking-tight text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
              {canManage
                ? isEn
                  ? 'Salary & Teaching Performance'
                  : 'Quản lý Lương & Thù lao giảng dạy'
                : isEn
                ? 'My Salary & Teaching Statement'
                : 'Bảng kê thu nhập & Số ca đứng lớp cá nhân'}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-white/90 max-w-2xl font-medium drop-shadow-sm">
              {canManage
                ? isEn
                  ? 'Automated monthly compensation, teaching session bonuses, and Coach session KPI tracking.'
                  : 'Tự động tính lương cứng, thù lao ca dạy thực tế và theo dõi tiến độ hoàn thành chỉ tiêu ca dạy của HLV.'
                : isEn
                ? 'Detailed payslip statement, completed teaching volume, and session payouts.'
                : 'Bảng kê chi tiết thu nhập, số buổi đứng lớp thực tế và thù lao theo từng ca học.'}
            </p>
          </div>

          {/* Interactive Period Selector Controls */}
          <div className="flex items-center gap-2 bg-white/20 dark:bg-slate-900/40 backdrop-blur-md p-2 rounded-2xl border border-white/30 self-start lg:self-auto shadow-sm">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-9 h-9 rounded-xl bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
              title={isEn ? 'Previous month' : 'Tháng trước'}
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>

            <div className="px-3 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-white/80">
                {isEn ? 'Pay Period' : 'Kỳ thanh toán'}
              </span>
              <span className="text-sm font-black font-chivo text-white">
                Tháng {String(month).padStart(2, '0')}/{year}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="w-9 h-9 rounded-xl bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
              title={isEn ? 'Next month' : 'Tháng sau'}
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>

            <button
              type="button"
              onClick={handleCurrentMonth}
              className="px-3 py-1.5 rounded-xl bg-white text-[#1B4332] text-xs font-bold hover:bg-white/90 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              {isEn ? 'Current' : 'Hiện tại'}
            </button>
          </div>
        </div>
      </section>

      {/* 2. Top Bento KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Payroll */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover-lift transition-all col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEn ? 'Total Payroll' : 'Tổng quỹ lương'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black font-chivo text-emerald-700 dark:text-emerald-400">
              {money(metrics.totalEstimated)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-medium">
            {metrics.totalStaff} {isEn ? 'staff members' : 'nhân sự trong kỳ'}
          </p>
        </div>

        {/* Card 2: Fixed Base */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover-lift transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEn ? 'Fixed Base Pay' : 'Lương cơ bản'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg sm:text-xl font-black font-chivo text-blue-600 dark:text-blue-400">
              {money(metrics.totalBase)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-medium">
            {metrics.baseSharePercent}% {isEn ? 'of total payroll' : 'quỹ lương cố định'}
          </p>
        </div>

        {/* Card 3: Variable Pay (Session Pay & Allowances) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover-lift transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEn ? 'Session Pay & Bonus' : 'Thù lao ca & Phụ cấp'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">sports</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg sm:text-xl font-black font-chivo text-teal-700 dark:text-teal-400">
              {money(metrics.totalVariable)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-medium">
            {metrics.variableSharePercent}% {isEn ? 'variable pay' : 'chi trả theo ca dạy'}
          </p>
        </div>

        {/* Card 4: Teaching Sessions & KPI */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover-lift transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEn ? 'Teaching Volume' : 'Số ca dạy HLV'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">event_available</span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-black font-chivo text-amber-700 dark:text-amber-400">
              {metrics.totalSessions}
            </span>
            {metrics.totalTargetSessions > 0 ? (
              <span className="text-xs text-slate-400 font-medium">
                /{metrics.totalTargetSessions} ({metrics.sessionKpiAchievementRate}%)
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-medium">{isEn ? 'sessions' : 'ca hoàn thành'}</span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-medium">{money(metrics.totalSessionBonus)} thù lao</p>
        </div>

        {/* Card 5: Coach KPI Achievement */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover-lift transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEn ? 'Coach KPI Rate' : 'Tỉ lệ đạt KPI ca'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">verified</span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-black font-chivo text-indigo-600 dark:text-indigo-400">
              {metrics.coachesKpiRate}%
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ({metrics.coachesMeetingKpi}/{metrics.coachCount} HLV)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-medium">
            {metrics.coverageRate}% {isEn ? 'policies set' : 'độ phủ chính sách'}
          </p>
        </div>
      </div>

      {/* 3. Navigation Tabs (If Manager/Admin) */}
      {canManage && (
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
          <button
            onClick={() => setActiveTab('sheet')}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'sheet'
                ? 'bg-[#1E2235] text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">table_chart</span>
            <span>{isEn ? 'Detailed Payroll & KPI Sheet' : 'Tab 1: Bảng lương & KPI chi tiết'}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'sheet' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {rows.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-[#2D6A4F] text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">query_stats</span>
            <span>{isEn ? 'Reports & Performance Analytics' : 'Tab 2: Báo cáo & Phân tích ca dạy'}</span>
            <span className="w-2 h-2 rounded-full bg-teal-400" />
          </button>
        </div>
      )}

      {/* 4. Tab 1: Detailed Payroll Sheet */}
      {activeTab === 'sheet' && (
        <div className="space-y-4">
          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isEn ? 'Search employee, coach, staff code...' : 'Tìm kiếm nhân sự, HLV, mã nhân viên...'}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>sync</span>
                <span>{isEn ? 'Reload' : 'Tải lại'}</span>
              </button>

              {canManage && (
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>{isEn ? 'Export CSV' : 'Xuất file CSV'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters Bar */}
          {canManage && (
            <div className="flex items-center justify-between flex-wrap gap-3 px-1">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {/* Role Filter */}
                <span className="text-slate-400 font-medium">{isEn ? 'Filter:' : 'Bộ lọc:'}</span>
                {['ALL', 'COACH', 'RECEPTIONIST', 'MANAGER'].map((rf) => (
                  <button
                    key={rf}
                    onClick={() => setRoleFilter(rf)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      roleFilter === rf
                        ? 'bg-[#2D6A4F] text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {rf === 'ALL'
                      ? isEn
                        ? 'All Staff'
                        : 'Tất cả nhân sự'
                      : rf === 'COACH'
                      ? isEn
                        ? 'Coaches'
                        : 'HLV'
                      : rf === 'RECEPTIONIST'
                      ? isEn
                        ? 'Receptionists'
                        : 'Lễ tân'
                      : isEn
                      ? 'Managers'
                      : 'Quản lý'}
                  </button>
                ))}
              </div>

              {/* Extra Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* KPI Status Filter */}
                <select
                  aria-label={isEn ? 'KPI Filter' : 'Lọc theo KPI'}
                  value={kpiFilter}
                  onChange={(e) => setKpiFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">{isEn ? 'All KPI Status' : 'Tất cả KPI ca'}</option>
                  <option value="MET">{isEn ? 'Met / Surpassed KPI' : 'Đạt / Vượt KPI'}</option>
                  <option value="NOT_MET">{isEn ? 'In Progress / Below Target' : 'Đang phấn đấu / Chưa đạt'}</option>
                </select>

                {/* Policy Filter */}
                <select
                  aria-label={isEn ? 'Policy filter' : 'Lọc chính sách'}
                  value={policyFilter}
                  onChange={(e) => setPolicyFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">{isEn ? 'All Policies' : 'Tất cả chính sách'}</option>
                  <option value="CONFIGURED">{isEn ? 'Configured' : 'Đã cấu hình'}</option>
                  <option value="NOT_CONFIGURED">{isEn ? 'Unconfigured' : 'Chưa cấu hình'}</option>
                </select>

                {/* Sort By */}
                <select
                  aria-label={isEn ? 'Sort by' : 'Sắp xếp theo'}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="TOTAL_DESC">{isEn ? 'Total Salary: High to Low' : 'Tổng lương: Cao đến Thấp'}</option>
                  <option value="TOTAL_ASC">{isEn ? 'Total Salary: Low to High' : 'Tổng lương: Thấp đến Cao'}</option>
                  <option value="BASE_DESC">{isEn ? 'Base Salary: High to Low' : 'Lương cơ bản cao nhất'}</option>
                  <option value="SESSIONS_DESC">{isEn ? 'Sessions: High to Low' : 'Ca dạy nhiều nhất'}</option>
                  <option value="KPI_DESC">{isEn ? 'KPI %: High to Low' : '% Đạt KPI cao nhất'}</option>
                  <option value="NAME_ASC">{isEn ? 'Name: A-Z' : 'Họ tên: A đến Z'}</option>
                </select>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50/70 dark:bg-slate-800/60 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-3.5 px-4">{isEn ? 'Employee' : 'Nhân sự'}</th>
                    <th className="py-3.5 px-4">{isEn ? 'Policy Status' : 'Chính sách'}</th>
                    <th className="py-3.5 px-4">{isEn ? 'Base Salary' : 'Lương cơ bản'}</th>
                    <th className="py-3.5 px-4">{isEn ? 'Allowance' : 'Phụ cấp'}</th>
                    <th className="py-3.5 px-4">{isEn ? 'Session Pay' : 'Thù lao ca dạy'}</th>
                    <th className="py-3.5 px-4">{isEn ? 'Session KPI' : 'Tiến độ KPI ca'}</th>
                    <th className="py-3.5 px-4">{isEn ? 'KPI Rating' : 'Đánh giá KPI'}</th>
                    <th className="py-3.5 px-4">{isEn ? 'Estimated Total' : 'Tổng thu nhập'}</th>
                    {canManage && <th className="py-3.5 px-4 text-right">{isEn ? 'Actions' : 'Thao tác'}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={canManage ? 9 : 8} className="py-12 text-center text-slate-400">
                        <span className="material-symbols-outlined text-[36px] text-slate-300 block mb-2">search_off</span>
                        <span>{isEn ? 'No staff matching the search criteria.' : 'Không có nhân sự nào khớp với bộ lọc tìm kiếm.'}</span>
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((row) => {
                      const roleUpper = String(row.role || 'STAFF').toUpperCase();
                      const roleCfg = ROLE_BADGES[roleUpper] || ROLE_BADGES.RECEPTIONIST;
                      const isCoach = roleUpper === 'COACH';

                      // Proportions
                      const totalPay = Number(row.estimatedTotal || 0);
                      const basePay = Number(row.baseSalary || 0);
                      const basePercent = totalPay > 0 ? Math.round((basePay / totalPay) * 100) : 0;
                      const varPercent = 100 - basePercent;

                      return (
                        <tr key={row.userId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          {/* Employee Info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                                  row.fullName
                                )} flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs`}
                              >
                                {getInitials(row.fullName)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                                  {row.fullName}
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                  <span className="font-mono text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                                    {row.employeeCode}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${roleCfg.badge}`}>
                                    {isEn ? roleCfg.labelEn : roleCfg.labelVi}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Policy status */}
                          <td className="py-3.5 px-4">
                            {row.policyConfigured ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>{isEn ? 'Active' : 'Đã chuẩn hóa'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span>{isEn ? 'Not set' : 'Chưa cấu hình'}</span>
                              </span>
                            )}
                          </td>

                          {/* Base Salary */}
                          <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{money(row.baseSalary)}</td>

                          {/* Allowance */}
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                            {row.allowance > 0 ? (
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{money(row.allowance)}</span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>

                          {/* Session Bonus */}
                          <td className="py-3.5 px-4">
                            {isCoach ? (
                              <div>
                                <div className="font-bold text-teal-700 dark:text-teal-400">{money(row.sessionBonus)}</div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                  <span className="material-symbols-outlined text-[13px] text-teal-600">sports</span>
                                  <span>{row.completedSessions} ca hoàn thành</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>

                          {/* Session KPI */}
                          <td className="py-3.5 px-4">
                            {isCoach ? (
                              <div className="space-y-1">
                                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                  {row.completedSessions} / {row.targetSessions > 0 ? `${row.targetSessions} ca` : 'Không áp'}
                                  {row.sessionKpiPercent !== null && (
                                    <span className={`ml-1 font-black ${row.sessionKpiPercent >= 100 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                      ({row.sessionKpiPercent}%)
                                    </span>
                                  )}
                                </div>
                                {row.targetSessions > 0 && (
                                  <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden" title={`Đạt ${row.sessionKpiPercent}% KPI ca dạy`}>
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        row.sessionKpiPercent >= 100 ? 'bg-emerald-500' : row.sessionKpiPercent >= 70 ? 'bg-teal-500' : 'bg-amber-500'
                                      }`}
                                      style={{ width: `${Math.min(100, row.sessionKpiPercent)}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>

                          {/* KPI Performance Rating */}
                          <td className="py-3.5 px-4">
                            {renderKpiBadge(row)}
                          </td>

                          {/* Total Estimated */}
                          <td className="py-3.5 px-4">
                            <div>
                              <div className="font-black text-sm text-[#2D6A4F] dark:text-[#81B29A]">{money(row.estimatedTotal)}</div>
                              <div className="w-24 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex mt-1" title={`${basePercent}% Cố định / ${varPercent}% Thù lao ca`}>
                                <div className="bg-blue-500 h-full" style={{ width: `${basePercent}%` }} />
                                <div className="bg-teal-500 h-full" style={{ width: `${varPercent}%` }} />
                              </div>
                            </div>
                          </td>

                          {/* Action Buttons */}
                          {canManage && (
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setViewingPayslip(row)}
                                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                                  title={isEn ? 'View payslip' : 'Xem phiếu lương'}
                                >
                                  <span className="material-symbols-outlined text-[15px] align-middle">receipt_long</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(row)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2D6A4F]/10 hover:bg-[#2D6A4F] text-[#2D6A4F] hover:text-white dark:bg-[#81B29A]/15 dark:text-[#81B29A] dark:hover:bg-[#81B29A] dark:hover:text-[#1B4332] text-xs font-bold transition-all cursor-pointer shadow-2xs"
                                >
                                  <span className="material-symbols-outlined text-[15px]">edit_note</span>
                                  <span>{isEn ? 'Set Salary' : 'Sửa lương & KPI'}</span>
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div>
                {isEn ? 'Showing' : 'Hiển thị'} <span className="font-bold text-slate-800 dark:text-slate-200">{displayedRows.length}</span>{' '}
                {isEn ? 'of' : 'trên tổng số'} <span className="font-bold text-slate-800 dark:text-slate-200">{rows.length}</span>{' '}
                {isEn ? 'staff members' : 'nhân sự'}
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>{isEn ? 'Blue: Base Pay' : 'Xanh dương: Lương cứng'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                  <span>{isEn ? 'Teal: Session Pay' : 'Xanh ngọc: Thù lao ca dạy'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Reports & Analytics */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Section A: Cost Allocation by Role/Department */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 font-chivo flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#2D6A4F] dark:text-[#81B29A]">pie_chart</span>
                  <span>{isEn ? 'Department & Role Payroll Allocation' : 'Phân bổ chi phí lương theo bộ phận & vai trò'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isEn
                    ? 'Proportion of total compensation spent on Coaches, Receptionists, and Center Managers.'
                    : 'Tỷ trọng ngân sách chi trả cho Đội ngũ HLV, Lễ tân và Quản lý trung tâm trong kỳ.'}
                </p>
              </div>
              <div className="text-xs font-bold text-slate-400">
                {isEn ? 'Total Payroll' : 'Tổng quỹ lương'}: <span className="text-slate-800 dark:text-slate-200">{money(metrics.totalEstimated)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {metrics.roleBreakdown.map((item) => {
                const roleCfg = ROLE_BADGES[item.role] || ROLE_BADGES.RECEPTIONIST;
                return (
                  <div
                    key={item.role}
                    className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${roleCfg.badge}`}>
                        {isEn ? roleCfg.labelEn : roleCfg.labelVi}
                      </span>
                      <span className="text-lg font-black text-slate-800 dark:text-slate-200">{item.sharePercent}%</span>
                    </div>

                    <div>
                      <div className="text-2xl font-black font-chivo text-slate-900 dark:text-slate-100">{money(item.totalPay)}</div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-2">
                        <div className="bg-[#2D6A4F] h-full rounded-full transition-all" style={{ width: `${item.sharePercent}%` }} />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        {item.count} {isEn ? 'members' : 'nhân sự'}
                      </span>
                      <span>
                        {isEn ? 'Avg' : 'Bình quân'}: <strong>{money(item.averagePay)}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section B: Earnings Structure Breakdown + Coach Efficiency Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Earnings Structure */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 font-chivo flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">donut_small</span>
                <span>{isEn ? 'Earnings Components Structure' : 'Cấu phần thu nhập toàn trung tâm'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEn
                  ? 'Breakdown between fixed base wages, allowances, and coaching session payouts.'
                  : 'Tỷ lệ đóng góp giữa lương cứng cố định, phụ cấp trách nhiệm và thù lao theo ca dạy.'}
              </p>

              <div className="space-y-4 pt-2">
                {/* 1. Base Salary */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span>{isEn ? 'Fixed Base Salary' : 'Lương cơ bản (Cố định)'}</span>
                    </span>
                    <span className="text-slate-900 dark:text-slate-100">{money(metrics.totalBase)} ({metrics.baseSharePercent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${metrics.baseSharePercent}%` }} />
                  </div>
                </div>

                {/* 2. Coaching Bonus */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                      <span>{isEn ? 'Coaching Sessions Pay' : 'Thù lao ca dạy HLV'}</span>
                    </span>
                    <span className="text-slate-900 dark:text-slate-100">
                      {money(metrics.totalSessionBonus)} (
                      {metrics.totalEstimated > 0 ? Math.round((metrics.totalSessionBonus / metrics.totalEstimated) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-500 h-full rounded-full"
                      style={{
                        width: `${metrics.totalEstimated > 0 ? (metrics.totalSessionBonus / metrics.totalEstimated) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>

                {/* 3. Monthly Allowance */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      <span>{isEn ? 'Allowances' : 'Phụ cấp ăn trưa, điện thoại, trách nhiệm'}</span>
                    </span>
                    <span className="text-slate-900 dark:text-slate-100">
                      {money(metrics.totalAllowance)} (
                      {metrics.totalEstimated > 0 ? Math.round((metrics.totalAllowance / metrics.totalEstimated) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full"
                      style={{
                        width: `${metrics.totalEstimated > 0 ? (metrics.totalAllowance / metrics.totalEstimated) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Coach Efficiency & Analytics */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 font-chivo flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2D6A4F] dark:text-[#81B29A]">fitness_center</span>
                <span>{isEn ? 'Coach Performance & Teaching Payout' : 'Hiệu suất giảng dạy & Thù lao HLV'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEn
                  ? 'Operational volume of classes taught and cost efficiency per session.'
                  : 'Đo lường số buổi đứng lớp thực tế và chi phí thù lao bình quân trên mỗi ca học.'}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/70 dark:border-teal-800/60">
                  <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 uppercase">{isEn ? 'Total Sessions' : 'Tổng số ca dạy'}</span>
                  <div className="text-2xl font-black font-chivo text-teal-800 dark:text-teal-200 mt-1">{metrics.totalSessions}</div>
                  <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">{isEn ? 'Completed in period' : 'Đã hoàn thành trong kỳ'}</span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">{isEn ? 'Avg Sessions / Coach' : 'Bình quân ca / HLV'}</span>
                  <div className="text-2xl font-black font-chivo text-emerald-800 dark:text-emerald-200 mt-1">{metrics.avgSessionsPerCoach}</div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{metrics.coachCount} {isEn ? 'active coaches' : 'HLV đang hoạt động'}</span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 col-span-2">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase">{isEn ? 'Avg Cost per Session' : 'Chi phí trung bình / Ca dạy'}</span>
                  <div className="text-2xl font-black font-chivo text-amber-800 dark:text-amber-200 mt-1">{money(metrics.avgCostPerSession)}</div>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">{isEn ? 'Calculated on actual taught sessions' : 'Tính trên số buổi học hoàn tất'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section C: Coach KPI Performance & Tracking */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 font-chivo flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#2D6A4F] dark:text-[#81B29A]">verified</span>
                  <span>{isEn ? 'Coach Session KPI Tracking Report' : 'Báo cáo Giám sát & Đánh giá Chỉ tiêu ca dạy HLV'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isEn
                    ? 'Comparing actual teaching sessions against assigned monthly targets.'
                    : 'Đối chiếu số ca dạy thực tế với các chỉ tiêu định mức ca đứng lớp đã thiết lập trong chính sách.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  {metrics.coachesMeetingKpi} / {metrics.coachCount} HLV Đạt chuẩn ({metrics.coachesKpiRate}%)
                </span>
              </div>
            </div>

            {/* KPI Summary Card */}
            <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-teal-800 dark:text-teal-300">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">sports</span>
                  <span>{isEn ? 'Total Session Volume vs Target' : 'Tổng ca dạy thực tế vs Chỉ tiêu ca toàn trung tâm'}</span>
                </span>
                <span className="text-sm font-black">{metrics.sessionKpiAchievementRate}%</span>
              </div>
              <div className="text-xl font-black font-chivo text-slate-900 dark:text-slate-100">
                {metrics.totalSessions} <span className="text-sm font-medium text-slate-400">/ {metrics.totalTargetSessions} ca mục tiêu</span>
              </div>
              <div className="w-full bg-teal-200/50 dark:bg-teal-900/50 h-2 rounded-full overflow-hidden">
                <div className="bg-teal-600 h-full rounded-full transition-all" style={{ width: `${Math.min(100, metrics.sessionKpiAchievementRate)}%` }} />
              </div>
            </div>

            {/* Coach Detailed KPI Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 mt-3">
              <table className="min-w-full text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-3 text-left">{isEn ? 'Coach' : 'Huấn luyện viên'}</th>
                    <th className="py-2.5 px-3 text-left">{isEn ? 'Teaching Sessions (Act / Target)' : 'Tiến độ Ca dạy (Thực tế / Chỉ tiêu)'}</th>
                    <th className="py-2.5 px-3 text-right">{isEn ? 'Session Pay' : 'Thù lao ca dạy'}</th>
                    <th className="py-2.5 px-3 text-center">{isEn ? 'Rating' : 'Xếp loại'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {metrics.coaches.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        {isEn ? 'No coach records found for this period.' : 'Chưa có dữ liệu HLV trong kỳ này.'}
                      </td>
                    </tr>
                  ) : (
                    metrics.coaches.map((c) => (
                      <tr key={c.userId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{c.fullName}</div>
                          <div className="text-[10px] font-mono text-slate-400">{c.employeeCode}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-700 dark:text-slate-300">
                            {c.completedSessions} / {c.targetSessions > 0 ? `${c.targetSessions} ca` : 'Không áp KPI'}
                            {c.sessionKpiPercent !== null && (
                              <span className={`ml-1 font-bold ${c.sessionKpiPercent >= 100 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                ({c.sessionKpiPercent}%)
                              </span>
                            )}
                          </div>
                          {c.targetSessions > 0 && (
                            <div className="w-28 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full rounded-full ${c.sessionKpiPercent >= 100 ? 'bg-emerald-500' : 'bg-teal-500'}`}
                                style={{ width: `${Math.min(100, c.sessionKpiPercent)}%` }}
                              />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-[#2D6A4F] dark:text-[#81B29A]">{money(c.sessionBonus)}</div>
                          <div className="text-[10px] text-slate-400">{money(c.commissionPerSession)} / ca</div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {renderKpiBadge(c)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section D: Top Earners Leaderboard */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 font-chivo flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">military_tech</span>
              <span>{isEn ? 'Top 5 Earners of the Period' : 'Top 5 nhân sự có thu nhập cao nhất trong kỳ'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEn
                ? 'Recognition of high-performing instructors and staff based on total generated compensation.'
                : 'Bảng xếp hạng đóng góp và thu nhập của đội ngũ nhân sự trong tháng.'}
            </p>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {metrics.topEarners.map((earner, idx) => {
                const medalColors = [
                  'bg-amber-400 text-[#1B4332]',
                  'bg-slate-300 text-slate-800',
                  'bg-amber-700 text-white',
                  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
                  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                ];

                return (
                  <div key={earner.userId} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${medalColors[idx]}`}>
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                          {earner.fullName}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>{earner.role}</span>
                          {earner.completedSessions > 0 && (
                            <>
                              <span>•</span>
                              <span>
                                {earner.completedSessions} {isEn ? 'sessions' : 'ca dạy'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-black text-sm text-[#2D6A4F] dark:text-[#81B29A]">{money(earner.estimatedTotal)}</div>
                      <div className="text-[10px] text-slate-400">
                        {isEn ? 'Base' : 'Lương cứng'}: {money(earner.baseSalary)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. Edit Salary Policy Modal */}
      <Modal
        isOpen={Boolean(editing)}
        onClose={() => !busy && setEditing(null)}
        title={
          editing
            ? isEn
              ? `Salary & Session KPI Policy · ${editing.fullName}`
              : `Cấu hình chính sách lương & ca dạy · ${editing.fullName}`
            : ''
        }
        maxWidth="max-w-xl"
      >
        {editing && (
          <form onSubmit={handleSavePolicy} className="space-y-4">
            {/* Employee Preview Header */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                  editing.fullName
                )} flex items-center justify-center text-white font-black text-xs shrink-0`}
              >
                {getInitials(editing.fullName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{editing.fullName}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                  <span className="font-mono">{editing.employeeCode}</span>
                  <span>•</span>
                  <span className="font-bold text-[#2D6A4F] dark:text-[#81B29A]">{editing.role}</span>
                  {editing.centerName && <span>• {editing.centerName}</span>}
                </div>
              </div>
            </div>

            {/* Effective Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Effective From *' : 'Hiệu lực từ ngày *'}
                </label>
                <input
                  type="date"
                  required
                  value={editForm.effectiveFrom}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, effectiveFrom: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Effective To' : 'Hiệu lực đến (Tùy chọn)'}
                </label>
                <input
                  type="date"
                  value={editForm.effectiveTo}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, effectiveTo: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>
            </div>

            {/* Base Salary */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Monthly Base Salary (VND) *' : 'Lương cơ bản tháng (VNĐ) *'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="100000"
                  required
                  value={editForm.baseSalary}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, baseSalary: Number(e.target.value) }))}
                  className="w-full pl-3 pr-12 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">₫</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">{money(editForm.baseSalary)}</p>
            </div>

            {/* Conditional Fields: Coach vs Staff */}
            {String(editing.role).toUpperCase() === 'COACH' ? (
              <div className="p-4 bg-teal-50/60 dark:bg-teal-950/30 rounded-2xl border border-teal-200/70 dark:border-teal-800/60 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 dark:text-teal-300">
                  <span className="material-symbols-outlined text-[16px]">sports</span>
                  <span>{isEn ? 'Coach Session Compensation Policy' : 'Chính sách thù lao ca dạy & Chỉ tiêu KPI'}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isEn ? 'Pay per Session (VND)' : 'Thù lao mỗi ca dạy (VNĐ)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50000"
                      value={editForm.commissionPerSession}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, commissionPerSession: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">{money(editForm.commissionPerSession)} / ca</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isEn ? 'Target Sessions / Month' : 'Chỉ tiêu ca dạy / tháng (KPI)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.targetSessions}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, targetSessions: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">VD: 40 hoặc 60 buổi/tháng</span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Monthly Allowance (VND)' : 'Phụ cấp hàng tháng (VNĐ)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={editForm.allowance}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, allowance: Number(e.target.value) }))}
                    className="w-full pl-3 pr-12 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">₫</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">{money(editForm.allowance)}</p>
              </div>
            )}

            {/* Estimated Pay Preview */}
            <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                  {isEn ? 'Guaranteed Minimum Pay' : 'Mức thu nhập cơ bản cam kết'}
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  {String(editing.role).toUpperCase() === 'COACH' ? 'Lương cứng + thù lao ca dạy thực nhận' : 'Lương cơ bản + Phụ cấp'}
                </span>
              </div>
              <span className="text-base font-black font-chivo text-emerald-700 dark:text-emerald-300">
                {money(editForm.baseSalary + (String(editing.role).toUpperCase() === 'COACH' ? 0 : editForm.allowance))}
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={busy}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isEn ? 'Cancel' : 'Hủy bỏ'}
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-black transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>{busy ? (isEn ? 'Saving...' : 'Đang lưu...') : isEn ? 'Save Changes' : 'Lưu chính sách'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* 7. Payslip View Modal */}
      <Modal
        isOpen={Boolean(viewingPayslip)}
        onClose={() => setViewingPayslip(null)}
        title={isEn ? 'Official Payslip' : 'Phiếu lương nhân sự'}
        maxWidth="max-w-lg"
      >
        {viewingPayslip && (
          <div className="space-y-4 text-slate-800 dark:text-slate-200">
            {/* Header info */}
            <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="text-xs font-black uppercase tracking-widest text-[#2D6A4F] dark:text-[#81B29A]">
                {viewingPayslip.centerName || 'Olympic Sports Center SCMS'}
              </div>
              <h2 className="text-lg font-black mt-1 font-chivo">
                {isEn ? 'PAYSLIP STATEMENT' : 'PHIẾU THANH TOÁN LƯƠNG & THÙ LAO'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEn ? 'Period' : 'Kỳ lương'}: Tháng {month}/{year}
              </p>
            </div>

            {/* Employee Details */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
              <div>
                <span className="text-slate-400">{isEn ? 'Employee' : 'Họ và tên'}:</span>
                <p className="font-bold text-slate-900 dark:text-slate-100">{viewingPayslip.fullName}</p>
              </div>
              <div>
                <span className="text-slate-400">{isEn ? 'Staff Code' : 'Mã nhân sự'}:</span>
                <p className="font-mono font-bold text-slate-900 dark:text-slate-100">{viewingPayslip.employeeCode}</p>
              </div>
              <div>
                <span className="text-slate-400">{isEn ? 'Position' : 'Vị trí công việc'}:</span>
                <p className="font-bold">{viewingPayslip.role}</p>
              </div>
              <div>
                <span className="text-slate-400">{isEn ? 'Status' : 'Chính sách'}:</span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400">
                  {viewingPayslip.policyConfigured ? (isEn ? 'Standard' : 'Đã chuẩn hóa') : isEn ? 'Draft' : 'Chưa thiết lập'}
                </p>
              </div>
            </div>

            {/* Coach KPI Performance Block */}
            {String(viewingPayslip.role).toUpperCase() === 'COACH' && (
              <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/70 dark:border-teal-800/60 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-teal-800 dark:text-teal-300">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">verified</span>
                    <span>{isEn ? 'Session Target & Performance' : 'Chỉ tiêu ca dạy & Tiến độ hoàn thành'}</span>
                  </span>
                  <span>{renderKpiBadge(viewingPayslip)}</span>
                </div>
                <div className="pt-1 border-t border-teal-200/60 dark:border-teal-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Ca dạy thực tế / KPI:</span>
                    <strong className="text-slate-800 dark:text-slate-200 text-sm">
                      {viewingPayslip.completedSessions} / {viewingPayslip.targetSessions > 0 ? `${viewingPayslip.targetSessions} ca` : 'Không áp'}
                    </strong>
                  </div>
                  {viewingPayslip.sessionKpiPercent !== null && (
                    <span className={`text-xs font-black ${viewingPayslip.sessionKpiPercent >= 100 ? 'text-emerald-600' : 'text-teal-600'}`}>
                      Đạt {viewingPayslip.sessionKpiPercent}%
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Earnings Itemized Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 font-bold uppercase text-slate-600 dark:text-slate-300">
                {isEn ? 'Earnings Breakdown' : 'Chi tiết các khoản thu nhập'}
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 p-1">
                <div className="flex items-center justify-between py-2 px-2.5">
                  <span>{isEn ? '1. Fixed Base Salary' : '1. Lương cơ bản tháng'}</span>
                  <span className="font-bold">{money(viewingPayslip.baseSalary)}</span>
                </div>
                {viewingPayslip.allowance > 0 && (
                  <div className="flex items-center justify-between py-2 px-2.5">
                    <span>{isEn ? '2. Monthly Allowances' : '2. Các khoản phụ cấp'}</span>
                    <span className="font-bold">{money(viewingPayslip.allowance)}</span>
                  </div>
                )}
                {viewingPayslip.completedSessions > 0 && (
                  <div className="flex items-center justify-between py-2 px-2.5">
                    <div>
                      <span>{isEn ? '3. Teaching Sessions Pay' : '3. Thù lao ca dạy thực tế'}</span>
                      <span className="text-slate-400 block text-[10px]">
                        ({viewingPayslip.completedSessions} {isEn ? 'completed classes' : 'ca học đã dạy'} × {money(viewingPayslip.commissionPerSession)})
                      </span>
                    </div>
                    <span className="font-bold text-teal-700 dark:text-teal-400">{money(viewingPayslip.sessionBonus)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2.5 px-2.5 bg-emerald-50/60 dark:bg-emerald-950/40 text-sm font-black text-[#2D6A4F] dark:text-[#81B29A]">
                  <span>{isEn ? 'TOTAL ESTIMATED NET' : 'TỔNG THU NHẬP DỰ KIẾN'}</span>
                  <span>{money(viewingPayslip.estimatedTotal)}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setViewingPayslip(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {isEn ? 'Close' : 'Đóng'}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E2235] text-white text-xs font-bold"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>{isEn ? 'Print Payslip' : 'In phiếu lương'}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default PayrollPage;
