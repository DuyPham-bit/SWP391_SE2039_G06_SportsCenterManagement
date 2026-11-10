import React from 'react';
import { CenterModal } from './CenterModal.jsx';
import { ManagerModal } from './ManagerModal.jsx';
import { AccountActionModal } from './AccountActionModal.jsx';
import { useAdminDashboard } from '../model/useAdminDashboard.js';
import { AdminHeroBanner } from './AdminHeroBanner.jsx';
import { AdminOverviewTab } from './AdminOverviewTab.jsx';
import { CentersTab } from './CentersTab.jsx';
import { ManagersTab } from './ManagersTab.jsx';
import { AccountsTab } from './AccountsTab.jsx';

// ─────────────────────────────────────────────────────────────
// Main Component: AdminDashboard
// ─────────────────────────────────────────────────────────────
export function AdminDashboard({ initialSection }) {
  const {
    PS, TABS, aPage, aPgs, aQ, aRole, aSt, aTotal, accs, actA, activeCenters, centerSearch,
    centerStatusFilter, centers, confirmAction, deleteMember, err, filteredCenters, filteredManagers,
    handleExecuteAction, loadA, loadAFn, loadC, loadCFn, loadM, loadMFn, loadOv, loadOvFn,
    managerCenterFilter, managerSearch, managers, ov, patchC, patchM, saving, setAPage, setAQ,
    setARole, setASt, setCenterSearch, setCenterStatusFilter, setConfirmAction, setErr,
    setManagerCenterFilter, setManagerSearch, setShowCC, setShowCM, showCC, showCM, showSuccess,
    switchTab, tab
  } = useAdminDashboard({ initialSection });

  return (
    <div className="w-full space-y-6 pb-12 transition-colors">
      {/* Modals */}
      {showCC && (
        <CenterModal
          onClose={() => setShowCC(false)}
          onSaved={() => {
            setShowCC(false);
            showSuccess('Tạo cơ sở thể thao thành công!');
            loadCFn();
            loadOvFn();
          }}
        />
      )}

      {showCM && (
        <ManagerModal
          centers={centers}
          onClose={() => setShowCM(false)}
          onSaved={() => {
            setShowCM(false);
            showSuccess('Cấp tài khoản Manager thành công!');
            loadMFn();
            loadOvFn();
          }}
        />
      )}

      {confirmAction && (
        <AccountActionModal
          actionData={confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleExecuteAction}
          isSaving={saving === 'a' + confirmAction.account.id}
        />
      )}

      {/* Global Error Banner if any */}
      {err && (
        <div className="p-4 rounded-2xl bg-brand-danger-50 dark:bg-brand-danger-950/60 border border-brand-danger-200 dark:border-brand-danger-800 text-brand-danger-700 dark:text-brand-danger-300 text-sm flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-brand-danger-600">error</span>
            <span className="font-semibold">{err}</span>
          </div>
          <button
            onClick={() => setErr('')}
            className="text-brand-danger-500 hover:text-brand-danger-700 dark:hover:text-brand-danger-200"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. Sleek Command Header (Olympic Athletics Mesh + Telemetry)
      ───────────────────────────────────────────────────────────── */}
      <AdminHeroBanner
        TABS={TABS}
        loadA={loadA}
        loadAFn={loadAFn}
        loadC={loadC}
        loadCFn={loadCFn}
        loadM={loadM}
        loadMFn={loadMFn}
        loadOv={loadOv}
        loadOvFn={loadOvFn}
        ov={ov}
        switchTab={switchTab}
        tab={tab}
      />

      {/* ─────────────────────────────────────────────────────────────
          2. Tab 1: OVERVIEW
      ───────────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <AdminOverviewTab
          activeCenters={activeCenters}
          centers={centers}
          managers={managers}
          ov={ov}
          setShowCC={setShowCC}
          setShowCM={setShowCM}
          switchTab={switchTab}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. Tab 2: CENTERS MANAGEMENT
      ───────────────────────────────────────────────────────────── */}
      {tab === 'centers' && (
        <CentersTab
          centerSearch={centerSearch}
          centerStatusFilter={centerStatusFilter}
          centers={centers}
          filteredCenters={filteredCenters}
          loadC={loadC}
          patchC={patchC}
          saving={saving}
          setCenterSearch={setCenterSearch}
          setCenterStatusFilter={setCenterStatusFilter}
          setShowCC={setShowCC}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. Tab 3: MANAGERS MANAGEMENT
      ───────────────────────────────────────────────────────────── */}
      {tab === 'managers' && (
        <ManagersTab
          activeCenters={activeCenters}
          centers={centers}
          filteredManagers={filteredManagers}
          loadM={loadM}
          managerCenterFilter={managerCenterFilter}
          managerSearch={managerSearch}
          managers={managers}
          patchM={patchM}
          saving={saving}
          setManagerCenterFilter={setManagerCenterFilter}
          setManagerSearch={setManagerSearch}
          setShowCM={setShowCM}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. Tab 4: ACCOUNTS & SESSIONS MANAGEMENT
      ───────────────────────────────────────────────────────────── */}
      {tab === 'accounts' && (
        <AccountsTab
          PS={PS}
          aPage={aPage}
          aPgs={aPgs}
          aQ={aQ}
          aRole={aRole}
          aSt={aSt}
          aTotal={aTotal}
          accs={accs}
          actA={actA}
          deleteMember={deleteMember}
          loadA={loadA}
          loadAFn={loadAFn}
          saving={saving}
          setAPage={setAPage}
          setAQ={setAQ}
          setARole={setARole}
          setASt={setASt}
        />
      )}
    </div>
  );
}

export default AdminDashboard;
