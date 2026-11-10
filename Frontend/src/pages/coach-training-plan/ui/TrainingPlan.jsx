import React from 'react';
import { LoadingSpinner } from '../../../shared/ui/Table.jsx';
import { CoachError } from '../../../features/coach-workspace/index.js';
import { useTrainingPlans } from '../model/useTrainingPlans.js';
import { TrainingPlanHeader } from './TrainingPlanHeader.jsx';
import { TrainingPlanStats } from './TrainingPlanStats.jsx';
import { TrainingPlanFilters } from './TrainingPlanFilters.jsx';
import { TrainingPlanEmptyState } from './TrainingPlanEmptyState.jsx';
import { TrainingPlanList } from './TrainingPlanList.jsx';
import { TrainingPlanDetailModal } from './TrainingPlanDetailModal.jsx';
import { TrainingPlanFormModal } from './TrainingPlanFormModal.jsx';

export function TrainingPlan() {
  const {
    activeModalClass, classFilterList, coachClasses, editingMemberName, editingPlanId, endDate,
    error, exercises, filteredPlans, goal, handleAddExercise, handleClassChange, handleDeletePlan,
    handleExerciseChange, handleOpenCreateModal, handleOpenEditModal, handleRemoveExercise,
    handleSavePlan, isEditingCustom, isEn, loadData, loading, modalOpen, plans, saving, searchQuery,
    selectedClassId, selectedFilterClass, selectedPlanDetail, setEndDate, setGoal, setModalOpen,
    setSearchQuery, setSelectedFilterClass, setSelectedPlanDetail, setStartDate, setTitle,
    setTypeFilter, startDate, stats, title, typeFilter
  } = useTrainingPlans();

  if (loading) return <LoadingSpinner text={isEn ? "Loading lesson plans..." : "Đang tải danh sách giáo án..."} />;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <TrainingPlanHeader handleOpenCreateModal={handleOpenCreateModal} isEn={isEn} />

      <CoachError message={error} retry={loadData} />

      {/* KPI Stats Strip */}
      <TrainingPlanStats isEn={isEn} stats={stats} />

      {/* Filter & Search Bar */}
      <TrainingPlanFilters
        classFilterList={classFilterList}
        isEn={isEn}
        plans={plans}
        searchQuery={searchQuery}
        selectedFilterClass={selectedFilterClass}
        setSearchQuery={setSearchQuery}
        setSelectedFilterClass={setSelectedFilterClass}
        setTypeFilter={setTypeFilter}
        stats={stats}
        typeFilter={typeFilter}
      />

      {/* Existing Plans Cards Grid */}
      {filteredPlans.length === 0 ? (
        <TrainingPlanEmptyState handleOpenCreateModal={handleOpenCreateModal} isEn={isEn} />
      ) : (
        <TrainingPlanList
          filteredPlans={filteredPlans}
          handleDeletePlan={handleDeletePlan}
          handleOpenEditModal={handleOpenEditModal}
          isEn={isEn}
          setSelectedPlanDetail={setSelectedPlanDetail}
        />
      )}

      {/* Plan Details Modal */}
      {selectedPlanDetail && (
        <TrainingPlanDetailModal
          handleOpenEditModal={handleOpenEditModal}
          isEn={isEn}
          selectedPlanDetail={selectedPlanDetail}
          setSelectedPlanDetail={setSelectedPlanDetail}
        />
      )}

      {/* Create / Edit Plan Modal */}
      <TrainingPlanFormModal
        activeModalClass={activeModalClass}
        coachClasses={coachClasses}
        editingMemberName={editingMemberName}
        editingPlanId={editingPlanId}
        endDate={endDate}
        exercises={exercises}
        goal={goal}
        handleAddExercise={handleAddExercise}
        handleClassChange={handleClassChange}
        handleExerciseChange={handleExerciseChange}
        handleRemoveExercise={handleRemoveExercise}
        handleSavePlan={handleSavePlan}
        isEditingCustom={isEditingCustom}
        isEn={isEn}
        modalOpen={modalOpen}
        saving={saving}
        selectedClassId={selectedClassId}
        setEndDate={setEndDate}
        setGoal={setGoal}
        setModalOpen={setModalOpen}
        setStartDate={setStartDate}
        setTitle={setTitle}
        startDate={startDate}
        title={title}
      />
    </div>
  );
}
