import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { LoadingSpinner } from '../../../shared/ui/Table.jsx';
import { ScheduleManager } from './ScheduleManager.jsx';
import { scheduleEndTime } from '../model/classManagementView.js';
import { todayDate, futureDate } from '../lib/scheduleTime.js';
import { classApi } from '../../../entities/class/index.js';

export function ScheduleModal({
  busy, data, editingScheduleId, executeAction, form, formError, handleFormChange, handleSaveModal,
  isEn, loadingSchedules, modal, schedules, setEditingScheduleId, setForm, setModal, setSchedules
}) {
  return (
    <Modal
      isOpen={modal?.type === 'schedule'}
      onClose={() => !busy && setModal(null)}
      title={isEn ? `Timetable: ${modal?.row?.name || ''}` : `Lịch học: ${modal?.row?.name || ''}`}
      maxWidth="max-w-7xl"
    >
      {modal?.type === 'schedule' &&
        (loadingSchedules ? (
          <LoadingSpinner text={isEn ? 'Loading class timetable...' : 'Đang tải lịch học...'} />
        ) : (
          <form noValidate onSubmit={handleSaveModal} className="space-y-4">
            {formError && <p role="alert" className="rounded-xl bg-brand-danger-50 dark:bg-brand-danger-950/40 p-3 text-sm text-brand-danger-700 dark:text-brand-danger-300">{formError}</p>}
            <ScheduleManager
              row={modal.row}
              schedules={schedules}
              rooms={data.rooms}
              centerHours={data.centerHours}
              sports={data.sports}
              form={form}
              change={handleFormChange}
              busy={busy}
              isEn={isEn}
              editingScheduleId={editingScheduleId}
              setEditingScheduleId={setEditingScheduleId}
              setForm={setForm}
              onReset={() => {
                setEditingScheduleId(null);
                const dur = Number(modal.row?.durationMinutes || 60);
                setForm({
                  roomId: '',
                  dayOfWeek: 1,
                  selectedDays: [1, 3, 5],
                  startTime: '08:00',
                  endTime: scheduleEndTime('08:00', dur),
                  startDate: todayDate(),
                  endDate: futureDate(90)
                });
              }}
              onCancelSchedule={(id) =>
                executeAction(async () => {
                  await classApi.cancelSchedule(modal.row.id, id);
                  setSchedules(await classApi.getSchedules(modal.row.id));
                  setEditingScheduleId(null);
                }, isEn ? 'Class schedule cancelled.' : 'Đã hủy lịch học.')
              }
            />
          </form>
        ))}
    </Modal>
  );
}
