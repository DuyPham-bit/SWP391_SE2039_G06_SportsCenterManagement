import React from 'react';
import { usePayroll } from '../model/usePayroll.js';
import { PayrollHeader } from './PayrollHeader.jsx';
import { PayrollMetrics } from './PayrollMetrics.jsx';
import { PayrollTabs } from './PayrollTabs.jsx';
import { PayrollSheetTab } from './PayrollSheetTab.jsx';
import { PayrollReportsTab } from './PayrollReportsTab.jsx';
import { SalaryPolicyModal } from './SalaryPolicyModal.jsx';
import { PayslipModal } from './PayslipModal.jsx';

export function PayrollPage() {
  const {
    activeTab, busy, canManage, displayedRows, editForm, editing, handleCurrentMonth,
    handleExportCsv, handleNextMonth, handlePrevMonth, handleSavePolicy, isEn, kpiFilter, load,
    loading, metrics, month, openEditModal, policyFilter, roleFilter, rows, searchQuery,
    setActiveTab, setEditForm, setEditing, setKpiFilter, setPolicyFilter, setRoleFilter,
    setSearchQuery, setSortBy, setViewingPayslip, sortBy, viewingPayslip, year
  } = usePayroll();

  return (
    <div className="space-y-6 animate-fade-slide-up pb-12">
      {/* 1. Header Banner */}
      <PayrollHeader
        canManage={canManage}
        handleCurrentMonth={handleCurrentMonth}
        handleNextMonth={handleNextMonth}
        handlePrevMonth={handlePrevMonth}
        isEn={isEn}
        month={month}
        year={year}
      />

      {/* 2. Top Bento KPI Cards */}
      <PayrollMetrics isEn={isEn} metrics={metrics} />

      {/* 3. Navigation Tabs (If Manager/Admin) */}
      {canManage && (
        <PayrollTabs activeTab={activeTab} isEn={isEn} rows={rows} setActiveTab={setActiveTab} />
      )}

      {/* 4. Tab 1: Detailed Payroll Sheet */}
      {activeTab === 'sheet' && (
        <PayrollSheetTab
          canManage={canManage}
          displayedRows={displayedRows}
          handleExportCsv={handleExportCsv}
          isEn={isEn}
          kpiFilter={kpiFilter}
          load={load}
          loading={loading}
          openEditModal={openEditModal}
          policyFilter={policyFilter}
          roleFilter={roleFilter}
          rows={rows}
          searchQuery={searchQuery}
          setKpiFilter={setKpiFilter}
          setPolicyFilter={setPolicyFilter}
          setRoleFilter={setRoleFilter}
          setSearchQuery={setSearchQuery}
          setSortBy={setSortBy}
          setViewingPayslip={setViewingPayslip}
          sortBy={sortBy}
        />
      )}

      {/* 5. Tab 2: Reports & Analytics */}
      {activeTab === 'reports' && (
        <PayrollReportsTab isEn={isEn} metrics={metrics} />
      )}

      {/* 6. Edit Salary Policy Modal */}
      <SalaryPolicyModal
        busy={busy}
        editForm={editForm}
        editing={editing}
        handleSavePolicy={handleSavePolicy}
        isEn={isEn}
        setEditForm={setEditForm}
        setEditing={setEditing}
      />

      {/* 7. Payslip View Modal */}
      <PayslipModal
        isEn={isEn}
        month={month}
        setViewingPayslip={setViewingPayslip}
        viewingPayslip={viewingPayslip}
        year={year}
      />
    </div>
  );
}

export default PayrollPage;
