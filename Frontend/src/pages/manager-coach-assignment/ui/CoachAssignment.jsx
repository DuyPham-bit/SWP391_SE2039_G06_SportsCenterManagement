import React from 'react';
import { LoadingSpinner } from '../../../shared/ui/Table.jsx';
import { useCoachAssignment } from '../model/useCoachAssignment.js';
import { AssignmentHeroBanner } from './AssignmentHeroBanner.jsx';
import { AssignmentMetrics } from './AssignmentMetrics.jsx';
import { AssignmentFilters } from './AssignmentFilters.jsx';
import { AssignmentEmptyState } from './AssignmentEmptyState.jsx';
import { AssignmentCardsView } from './AssignmentCardsView.jsx';
import { AssignmentTableView } from './AssignmentTableView.jsx';
import { AssignCoachModal } from './AssignCoachModal.jsx';

export function CoachAssignment() {
  const {
    assignError, assigning, classes, coaches, compatibleCoaches, error, filteredClasses,
    handleConfirmAssign, isEn, loadData, loading, metrics, modalOpen, openAssignModal,
    publicationTab, refreshing, searchQuery, selectedClass, selectedCoachId, selectedSportFilter,
    selectedStatusFilter, setAssignError, setModalOpen, setPublicationTab, setSearchQuery,
    setSelectedCoachId, setSelectedSportFilter, setSelectedStatusFilter, setViewMode, uniqueSports,
    viewMode
  } = useCoachAssignment();

  if (loading) {
    return (
      <div className="min-h-[480px] flex items-center justify-center p-8">
        <LoadingSpinner text={isEn ? 'Synchronizing classes and coach roster...' : 'Đang đồng bộ dữ liệu lớp học và đội ngũ huấn luyện viên...'} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-8 bg-brand-danger-50 dark:bg-brand-danger-950/30 border border-brand-danger-200 dark:border-brand-danger-900/60 rounded-3xl shadow-sm text-center space-y-4">
        <div className="w-16 h-16 bg-brand-danger-100 dark:bg-brand-danger-900/40 text-brand-danger-600 dark:text-brand-danger-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <span className="material-symbols-outlined text-[32px]">error_outline</span>
        </div>
        <h3 className="text-xl font-bold text-brand-navy-800 dark:text-brand-navy-200">
          {isEn ? 'Cannot load coach assignment data' : 'Không thể tải dữ liệu phân công HLV'}
        </h3>
        <p className="text-brand-navy-600 dark:text-brand-navy-400 text-sm">{error}</p>
        <button
          onClick={() => loadData(false)}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-sage-700 hover:bg-brand-sage-900 text-white font-medium rounded-xl transition shadow-md shadow-brand-sage-700/20"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          {isEn ? 'Retry Connection' : 'Thử kết nối lại'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-slide-up">
      {/* 1. Header Hero Banner (Olympic Multi-stop Gradient matching Image 1) */}
      <AssignmentHeroBanner
        assigning={assigning}
        isEn={isEn}
        loadData={loadData}
        refreshing={refreshing}
      />

      {/* 2. Bento KPI Metric Cards */}
      <AssignmentMetrics
        isEn={isEn}
        metrics={metrics}
        selectedStatusFilter={selectedStatusFilter}
        setSelectedStatusFilter={setSelectedStatusFilter}
      />

      {/* 3. Search & Filter Bar */}
      <AssignmentFilters
        classes={classes}
        isEn={isEn}
        metrics={metrics}
        publicationTab={publicationTab}
        searchQuery={searchQuery}
        selectedSportFilter={selectedSportFilter}
        selectedStatusFilter={selectedStatusFilter}
        setPublicationTab={setPublicationTab}
        setSearchQuery={setSearchQuery}
        setSelectedSportFilter={setSelectedSportFilter}
        setSelectedStatusFilter={setSelectedStatusFilter}
        setViewMode={setViewMode}
        uniqueSports={uniqueSports}
        viewMode={viewMode}
      />

      {/* 4. Main Class Cards Grid vs Table View */}
      {filteredClasses.length === 0 ? (
        <AssignmentEmptyState
          isEn={isEn}
          setSearchQuery={setSearchQuery}
          setSelectedSportFilter={setSelectedSportFilter}
          setSelectedStatusFilter={setSelectedStatusFilter}
        />
      ) : viewMode === 'cards' ? (
        /* CARD VIEW */
        <AssignmentCardsView
          coaches={coaches}
          filteredClasses={filteredClasses}
          isEn={isEn}
          openAssignModal={openAssignModal}
        />
      ) : (
        /* TABLE VIEW */
        <AssignmentTableView
          coaches={coaches}
          filteredClasses={filteredClasses}
          isEn={isEn}
          openAssignModal={openAssignModal}
        />
      )}

      {/* 5. Assignment Modal */}
      <AssignCoachModal
        assignError={assignError}
        assigning={assigning}
        coaches={coaches}
        compatibleCoaches={compatibleCoaches}
        handleConfirmAssign={handleConfirmAssign}
        isEn={isEn}
        modalOpen={modalOpen}
        selectedClass={selectedClass}
        selectedCoachId={selectedCoachId}
        setAssignError={setAssignError}
        setModalOpen={setModalOpen}
        setSelectedCoachId={setSelectedCoachId}
      />
    </div>
  );
}
