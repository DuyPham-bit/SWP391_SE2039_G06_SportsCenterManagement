import React from 'react';
import { secondaryButton, primaryButton } from './formStyles.js';

export function CancelledClassList({ busy, filteredItems, isEn, openScheduleModal, setModal }) {
  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-brand-sand-200 dark:border-brand-sand-800 bg-brand-sand-50 dark:bg-brand-sand-950/40 p-4 text-sm text-brand-sand-900 dark:text-brand-sand-200">
        {isEn
          ? 'Restoring a class returns it to draft status. Cancelled schedules and member reservations remain archived for auditing.'
          : 'Mở lại lớp sẽ đưa lớp về bản nháp. Lịch và lượt đặt chỗ đã hủy được giữ nguyên để bảo toàn lịch sử.'}
      </p>
      {filteredItems.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredItems.map((cls) => (
            <article
              key={cls.id}
              className="rounded-2xl border border-brand-danger-100 dark:border-brand-danger-900/60 bg-white dark:bg-brand-navy-900 p-5 space-y-3 hover-lift shadow-sm"
            >
              <h2 className="font-bold text-brand-navy-900 dark:text-brand-navy-100">{cls.name}</h2>
              <p className="text-sm text-brand-navy-500 dark:text-brand-navy-400">
                {cls.sportName} · {cls.roomName || (isEn ? 'Unassigned Court' : 'Chưa có phòng')}
              </p>
              <div className="flex flex-wrap gap-2">
                <button className={secondaryButton} disabled={busy} onClick={() => openScheduleModal(cls)}>
                  {isEn ? 'View Schedule History' : 'Xem lịch sử lịch'}
                </button>
                <button className={primaryButton} disabled={busy} onClick={() => setModal({ type: 'restore', row: cls })}>
                  {isEn ? 'Restore Class' : 'Mở lại lớp'}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="p-8 text-center text-brand-navy-500 dark:text-brand-navy-400">
          {isEn ? 'No cancelled classes match filter.' : 'Chưa có lớp đã hủy phù hợp.'}
        </p>
      )}
    </div>
  );
}
