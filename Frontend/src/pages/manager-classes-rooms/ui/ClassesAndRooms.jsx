import React from 'react';
import { LoadingSpinner } from '../../../shared/ui/Table.jsx';
import { useClassesAndRooms } from '../model/useClassesAndRooms.js';
import { ClassesHeroBanner } from './ClassesHeroBanner.jsx';
import { ClassesMetrics } from './ClassesMetrics.jsx';
import { ClassesToolbar } from './ClassesToolbar.jsx';
import { CancelledClassList } from './CancelledClassList.jsx';
import { ClassesCardsView } from './ClassesCardsView.jsx';
import { ClassesTableView } from './ClassesTableView.jsx';
import { CancelClassModal } from './CancelClassModal.jsx';
import { RestoreClassModal } from './RestoreClassModal.jsx';
import { ScheduleModal } from './ScheduleModal.jsx';
import { ClassFormModal } from './ClassFormModal.jsx';
import { RoomFormModal } from './RoomFormModal.jsx';
import { SportFormModal } from './SportFormModal.jsx';

export function ClassesAndRooms() {
  const {
    availableClassCoaches, error, loading, availableClassRooms, busy, classGroups, data, editingScheduleId,
    executeAction, fieldErrors, filteredItems, form, formError, handleBlur, handleConfirmCancelClass,
    handleFormChange, handlePublishClass, handleSaveModal, isEn, loadData, loadingSchedules, metrics,
    modal, openClassModal, openRoomModal, openScheduleModal, openSportModal, refreshing, schedules,
    searchQuery, selectedSportFilter, selectedStatusFilter, setEditingScheduleId, setForm, setModal,
    setSchedules, setSearchQuery, setSelectedSportFilter, setSelectedStatusFilter, setTab,
    setViewMode, tab, viewMode
  } = useClassesAndRooms();

  if (loading) {
    return (
      <div className="min-h-[480px] flex items-center justify-center p-8">
        <LoadingSpinner text={isEn ? 'Synchronizing classes, courts and sports...' : 'Đang đồng bộ danh mục đào tạo, phòng tập và bộ môn...'} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-8 bg-brand-danger-50 dark:bg-brand-danger-950/30 border border-brand-danger-200 dark:border-brand-danger-900/60 rounded-3xl shadow-sm text-center space-y-4">
        <div className="w-16 h-16 bg-brand-danger-100 dark:bg-brand-danger-900/40 text-brand-danger-600 dark:text-brand-danger-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <span className="material-symbols-outlined text-[32px]">error_outline</span>
        </div>
        <h3 className="text-xl font-bold text-brand-navy-800 dark:text-brand-navy-200">{isEn ? 'Cannot load management data' : 'Không thể tải dữ liệu quản lý'}</h3>
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
      <ClassesHeroBanner
        busy={busy}
        isEn={isEn}
        loadData={loadData}
        openClassModal={openClassModal}
        openRoomModal={openRoomModal}
        openSportModal={openSportModal}
        refreshing={refreshing}
        tab={tab}
      />

      {/* 2. Bento KPI Metric Cards */}
      <ClassesMetrics isEn={isEn} metrics={metrics} setTab={setTab} tab={tab} />

      {/* 3. Segmented Navigation Tabs & Smart Filter Toolbar */}
      <ClassesToolbar
        classGroups={classGroups}
        data={data}
        isEn={isEn}
        searchQuery={searchQuery}
        selectedSportFilter={selectedSportFilter}
        selectedStatusFilter={selectedStatusFilter}
        setSearchQuery={setSearchQuery}
        setSelectedSportFilter={setSelectedSportFilter}
        setSelectedStatusFilter={setSelectedStatusFilter}
        setTab={setTab}
        setViewMode={setViewMode}
        tab={tab}
        viewMode={viewMode}
      />

      {/* Info notice for Sports tab */}
      {tab === 'sports' && (
        <div className="flex items-center gap-3 p-4 bg-brand-teal-50 dark:bg-brand-teal-950/40 border border-brand-teal-200 dark:border-brand-teal-800/60 rounded-2xl text-brand-teal-800 dark:text-brand-teal-300 text-xs md:text-sm">
          <span className="material-symbols-outlined text-brand-teal-700 dark:text-brand-teal-400 text-[20px] shrink-0">info</span>
          <p>
            <strong>{isEn ? 'Management Note:' : 'Lưu ý quản trị:'}</strong>{' '}
            {isEn
              ? 'Disciplines labeled "Global Standard" are configured centrally and protected. Center-specific disciplines can be customized when no active classes are linked.'
              : 'Các bộ môn có nhãn "Dùng chung toàn hệ thống" là quy chuẩn chung do SCMS thiết lập và được bảo vệ. Bạn chỉ có thể sửa hoặc thay đổi trạng thái của các bộ môn riêng thuộc trung tâm khi không còn lớp học đang vận hành.'}
          </p>
        </div>
      )}

      {/* 4. Main Content: Grid Cards View vs Table View */}
      {tab === 'cancelled' ? (
        <CancelledClassList
          busy={busy}
          filteredItems={filteredItems}
          isEn={isEn}
          openScheduleModal={openScheduleModal}
          setModal={setModal}
        />
      ) : filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-brand-navy-900 rounded-3xl border border-brand-navy-200/80 dark:border-brand-navy-800 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-400 rounded-2xl flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[36px]">search_off</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-brand-navy-800 dark:text-brand-navy-200">{isEn ? 'No matching records found' : 'Không tìm thấy kết quả phù hợp'}</h3>
            <p className="text-xs md:text-sm text-brand-navy-500 dark:text-brand-navy-400 max-w-md mx-auto">
              {isEn
                ? 'No items match your active search terms or filters. Try adjusting your filters or create a new entry.'
                : 'Không có mục nào khớp với từ khóa tìm kiếm hoặc điều kiện lọc hiện tại. Hãy thử thay đổi bộ lọc hoặc thêm mục mới.'}
            </p>
          </div>
          <button
            onClick={() => {
              if (tab === 'classes') openClassModal(null);
              else if (tab === 'rooms') openRoomModal(null);
              else openSportModal(null);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-navy-900 hover:bg-brand-navy-800 text-white text-xs md:text-sm font-semibold rounded-xl transition shadow"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>{isEn ? 'Add New Item' : 'Thêm mới ngay'}</span>
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* CARD VIEW */
        <ClassesCardsView
          busy={busy}
          filteredItems={filteredItems}
          handlePublishClass={handlePublishClass}
          isEn={isEn}
          openClassModal={openClassModal}
          openRoomModal={openRoomModal}
          openScheduleModal={openScheduleModal}
          openSportModal={openSportModal}
          setModal={setModal}
          tab={tab}
        />
      ) : (
        /* TABLE VIEW */
        <ClassesTableView
          filteredItems={filteredItems}
          handlePublishClass={handlePublishClass}
          isEn={isEn}
          openClassModal={openClassModal}
          openRoomModal={openRoomModal}
          openScheduleModal={openScheduleModal}
          openSportModal={openSportModal}
          tab={tab}
        />
      )}

      {/* 5. MODALS SYSTEM */}

      {/* Modal: Cancel Class Confirmation */}
      <CancelClassModal
        busy={busy}
        handleConfirmCancelClass={handleConfirmCancelClass}
        isEn={isEn}
        modal={modal}
        setModal={setModal}
      />

      <RestoreClassModal
        busy={busy}
        executeAction={executeAction}
        isEn={isEn}
        modal={modal}
        setModal={setModal}
      />

      <ScheduleModal
        busy={busy}
        data={data}
        editingScheduleId={editingScheduleId}
        executeAction={executeAction}
        form={form}
        formError={formError}
        handleFormChange={handleFormChange}
        handleSaveModal={handleSaveModal}
        isEn={isEn}
        loadingSchedules={loadingSchedules}
        modal={modal}
        schedules={schedules}
        setEditingScheduleId={setEditingScheduleId}
        setForm={setForm}
        setModal={setModal}
        setSchedules={setSchedules}
      />

      {/* Modal: Create / Edit Class */}
      <ClassFormModal
        availableClassCoaches={availableClassCoaches}
        availableClassRooms={availableClassRooms}
        busy={busy}
        data={data}
        fieldErrors={fieldErrors}
        form={form}
        formError={formError}
        handleBlur={handleBlur}
        handleFormChange={handleFormChange}
        handleSaveModal={handleSaveModal}
        isEn={isEn}
        modal={modal}
        setModal={setModal}
      />

      {/* Modal: Create / Edit Room */}
      <RoomFormModal
        busy={busy}
        fieldErrors={fieldErrors}
        form={form}
        handleBlur={handleBlur}
        handleFormChange={handleFormChange}
        handleSaveModal={handleSaveModal}
        isEn={isEn}
        modal={modal}
        setModal={setModal}
      />

      {/* Modal: Create / Edit Sport */}
      <SportFormModal
        busy={busy}
        fieldErrors={fieldErrors}
        form={form}
        handleBlur={handleBlur}
        handleFormChange={handleFormChange}
        handleSaveModal={handleSaveModal}
        isEn={isEn}
        modal={modal}
        setModal={setModal}
      />
    </div>
  );
}

