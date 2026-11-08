import React from 'react';
import { LoadingSpinner } from '../../../shared/ui/Table.jsx';
import { useStaffManagement } from '../model/useStaffManagement.js';
import { StaffHeroBanner } from './StaffHeroBanner.jsx';
import { StaffMetrics } from './StaffMetrics.jsx';
import { StaffFilters } from './StaffFilters.jsx';
import { StaffTable } from './StaffTable.jsx';
import { CreateStaffModal } from './CreateStaffModal.jsx';
import { EditStaffModal } from './EditStaffModal.jsx';
import { StaffDetailModal } from './StaffDetailModal.jsx';
import { StaffStatusModal } from './StaffStatusModal.jsx';

export function StaffManagement() {
  const {
    addingSpecialty, coachClassFilter, copiedId, copyId, createModalOpen, createMode,
    detailModalStaff, displayedStaff, dropdownRef, editingStaff, existingStaffUserIds,
    filteredMembers, form, handleAddSpecialty, handleFormChange, handleResetFilters,
    handleRoleFilterChange, handleSaveStaff, handleToggleStatus, isDropdownOpen, isEn, loadSports,
    loadStaff, loading, memberSearchQuery, newSpecialtyName, openCreateModal, openDetailModal,
    openEditModal, openStatusConfirmModal, roleConfig, roleFilter, saving, searchQuery,
    searchingMembers, selectedMember, setCoachClassFilter, setCreateModalOpen, setCreateMode,
    setDetailModalStaff, setEditingStaff, setForm, setIsDropdownOpen, setMemberSearchQuery,
    setNewSpecialtyName, setSearchQuery, setSelectedMember, setSortBy, setStatusConfirmStaff,
    setStatusFilter, sortBy, sports, sportsError, staffList, stats, statusConfirmStaff, statusFilter
  } = useStaffManagement();

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* 1. Header Banner (Olympic Multi-stop Gradient matching Image 1) */}
      <StaffHeroBanner
        isEn={isEn}
        loadStaff={loadStaff}
        loading={loading}
        openCreateModal={openCreateModal}
      />

      {/* 2. Bento KPI Metric Cards */}
      <StaffMetrics isEn={isEn} stats={stats} />

      {/* 3. Search & Filter Bar */}
      <StaffFilters
        coachClassFilter={coachClassFilter}
        displayedStaff={displayedStaff}
        handleResetFilters={handleResetFilters}
        handleRoleFilterChange={handleRoleFilterChange}
        isEn={isEn}
        roleFilter={roleFilter}
        searchQuery={searchQuery}
        setCoachClassFilter={setCoachClassFilter}
        setSearchQuery={setSearchQuery}
        setSortBy={setSortBy}
        setStatusFilter={setStatusFilter}
        sortBy={sortBy}
        staffList={staffList}
        stats={stats}
        statusFilter={statusFilter}
      />

      {/* 4. Table & Loading/Empty states */}
      {loading ? (
        <div className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 p-12">
          <LoadingSpinner text={isEn ? 'Loading staff directory...' : 'Đang tải danh sách nhân sự...'} />
        </div>
      ) : (
        <StaffTable
          coachClassFilter={coachClassFilter}
          copiedId={copiedId}
          copyId={copyId}
          displayedStaff={displayedStaff}
          handleResetFilters={handleResetFilters}
          isEn={isEn}
          openDetailModal={openDetailModal}
          openEditModal={openEditModal}
          openStatusConfirmModal={openStatusConfirmModal}
          roleConfig={roleConfig}
          roleFilter={roleFilter}
          searchQuery={searchQuery}
          staffList={staffList}
          statusFilter={statusFilter}
        />
      )}

      {/* 5. Modal: Add New Staff (Direct or Appoint) */}
      <CreateStaffModal
        addingSpecialty={addingSpecialty}
        createModalOpen={createModalOpen}
        createMode={createMode}
        dropdownRef={dropdownRef}
        existingStaffUserIds={existingStaffUserIds}
        filteredMembers={filteredMembers}
        form={form}
        handleAddSpecialty={handleAddSpecialty}
        handleFormChange={handleFormChange}
        handleSaveStaff={handleSaveStaff}
        isDropdownOpen={isDropdownOpen}
        isEn={isEn}
        loadSports={loadSports}
        memberSearchQuery={memberSearchQuery}
        newSpecialtyName={newSpecialtyName}
        roleConfig={roleConfig}
        saving={saving}
        searchingMembers={searchingMembers}
        selectedMember={selectedMember}
        setCreateModalOpen={setCreateModalOpen}
        setCreateMode={setCreateMode}
        setForm={setForm}
        setIsDropdownOpen={setIsDropdownOpen}
        setMemberSearchQuery={setMemberSearchQuery}
        setNewSpecialtyName={setNewSpecialtyName}
        setSelectedMember={setSelectedMember}
        sports={sports}
        sportsError={sportsError}
      />

      {/* 6. Modal: Edit Staff */}
      <EditStaffModal
        addingSpecialty={addingSpecialty}
        editingStaff={editingStaff}
        form={form}
        handleAddSpecialty={handleAddSpecialty}
        handleFormChange={handleFormChange}
        handleSaveStaff={handleSaveStaff}
        isEn={isEn}
        loadSports={loadSports}
        newSpecialtyName={newSpecialtyName}
        saving={saving}
        setEditingStaff={setEditingStaff}
        setForm={setForm}
        setNewSpecialtyName={setNewSpecialtyName}
        sports={sports}
        sportsError={sportsError}
      />

      {/* 7. Modal: View Staff Details */}
      <StaffDetailModal
        detailModalStaff={detailModalStaff}
        isEn={isEn}
        openEditModal={openEditModal}
        roleConfig={roleConfig}
        setDetailModalStaff={setDetailModalStaff}
      />

      {/* 8. Modal: Lock / Unlock Staff */}
      <StaffStatusModal
        handleToggleStatus={handleToggleStatus}
        isEn={isEn}
        saving={saving}
        setStatusConfirmStaff={setStatusConfirmStaff}
        statusConfirmStaff={statusConfirmStaff}
      />
    </div>
  );
}
