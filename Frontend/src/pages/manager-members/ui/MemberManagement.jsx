import React from 'react';
import { LoadingSpinner } from '../../../shared/ui/Table.jsx';
import { useMemberManagement } from '../model/useMemberManagement.js';
import { MembersHeroBanner } from './MembersHeroBanner.jsx';
import { MembersMetrics } from './MembersMetrics.jsx';
import { MembersFilters } from './MembersFilters.jsx';
import { MembersTable } from './MembersTable.jsx';
import { MemberFormModal } from './MemberFormModal.jsx';
import { MemberDetailModal } from './MemberDetailModal.jsx';
import { SubscriptionHistoryModal } from './SubscriptionHistoryModal.jsx';
import { MemberStatusModal } from './MemberStatusModal.jsx';

export function MemberManagement() {
  const {
    busy, copiedCode, copyMemberCode, data, error, filter, filteredAndSortedItems, form,
    handleFormChange, handleResetSearch, handleSaveMember, handleSearchSubmit,
    handleToggleAccountStatus, isEn, loading, loadingSubs, modal, openDetail, openEdit,
    openStatusConfirm, openSubscriptions, query, setFilter, setModal, setQuery, setRevision,
    setSortBy, setStatusFilter, sortBy, stats, statusFilter, subscriptionError, subscriptions,
    totalPages
  } = useMemberManagement();

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* 1. Header Banner (Olympic Multi-stop Gradient matching Image 1) */}
      <MembersHeroBanner
        busy={busy}
        isEn={isEn}
        loading={loading}
        openEdit={openEdit}
        setRevision={setRevision}
      />

      {/* 2. Bento KPI Metric Cards */}
      <MembersMetrics isEn={isEn} stats={stats} />

      {/* 3. Search Bar & Filter Controls */}
      <MembersFilters
        data={data}
        filter={filter}
        filteredAndSortedItems={filteredAndSortedItems}
        handleResetSearch={handleResetSearch}
        handleSearchSubmit={handleSearchSubmit}
        isEn={isEn}
        loading={loading}
        query={query}
        setQuery={setQuery}
        setSortBy={setSortBy}
        setStatusFilter={setStatusFilter}
        sortBy={sortBy}
        statusFilter={statusFilter}
      />

      {/* 4. Table & Loading/Error states */}
      {loading ? (
        <div className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 p-12">
          <LoadingSpinner text={isEn ? 'Loading member directory...' : 'Đang tải danh sách thành viên...'} />
        </div>
      ) : error ? (
        <div role="alert" className="p-6 bg-brand-danger-50 dark:bg-brand-danger-950/30 rounded-2xl border border-brand-danger-200 dark:border-brand-danger-900/60 text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-brand-danger-500">error</span>
          <p className="text-sm font-bold text-brand-danger-800 dark:text-brand-danger-300">{error}</p>
          <button
            onClick={() => setRevision((x) => x + 1)}
            className="px-4 py-2 bg-brand-sage-700 hover:bg-brand-sage-900 text-white rounded-xl text-xs font-bold shadow-md transition-all"
          >
            {isEn ? 'Retry' : 'Thử lại'}
          </button>
        </div>
      ) : (
        <MembersTable
          busy={busy}
          copiedCode={copiedCode}
          copyMemberCode={copyMemberCode}
          data={data}
          filter={filter}
          filteredAndSortedItems={filteredAndSortedItems}
          handleResetSearch={handleResetSearch}
          isEn={isEn}
          loading={loading}
          openDetail={openDetail}
          openEdit={openEdit}
          openStatusConfirm={openStatusConfirm}
          openSubscriptions={openSubscriptions}
          setFilter={setFilter}
          statusFilter={statusFilter}
          totalPages={totalPages}
        />
      )}

      {/* 5. Modal: Edit / Add Member */}
      <MemberFormModal
        busy={busy}
        form={form}
        handleFormChange={handleFormChange}
        handleSaveMember={handleSaveMember}
        isEn={isEn}
        modal={modal}
        setModal={setModal}
      />

      {/* 6. Modal: View member details */}
      <MemberDetailModal
        isEn={isEn}
        modal={modal}
        openEdit={openEdit}
        openSubscriptions={openSubscriptions}
        setModal={setModal}
      />

      {/* 7. Modal: Subscription history */}
      <SubscriptionHistoryModal
        busy={busy}
        isEn={isEn}
        loadingSubs={loadingSubs}
        modal={modal}
        openSubscriptions={openSubscriptions}
        setModal={setModal}
        subscriptionError={subscriptionError}
        subscriptions={subscriptions}
      />

      {/* 8. Modal: Lock / Unlock account */}
      <MemberStatusModal
        busy={busy}
        handleToggleAccountStatus={handleToggleAccountStatus}
        isEn={isEn}
        modal={modal}
        setModal={setModal}
      />
    </div>
  );
}
