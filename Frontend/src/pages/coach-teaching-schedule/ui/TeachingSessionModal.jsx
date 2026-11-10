import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { getSportTheme } from '../lib/calendarView.js';
import { translateClassName, translateRoomName } from '../../../shared/i18n/i18nHelper.js';

export function TeachingSessionModal({ STATUS_CONFIG, activeSession, detailModalOpen, formatDayOfWeek, isEn, setDetailModalOpen }) {
  return (
    <Modal
      isOpen={detailModalOpen}
      onClose={() => setDetailModalOpen(false)}
      title={isEn ? 'Teaching Session Details' : 'Chi tiết ca giảng dạy'}
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {/* Modal Header Badge */}
        <div className="p-4 rounded-xl border border-brand-navy-200 bg-brand-navy-50/70 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className={`px-2.5 py-1 rounded text-xs font-extrabold uppercase border ${getSportTheme(activeSession.sportName, isEn).badge}`}>
              {getSportTheme(activeSession.sportName, isEn).tag}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_CONFIG[activeSession.status]?.badgeClass}`}>
              {STATUS_CONFIG[activeSession.status]?.label}
            </span>
          </div>
          <h3 className="font-chivo font-black text-lg text-brand-navy-900">
            {translateClassName(activeSession.name, isEn)}
          </h3>
        </div>

        {/* Session Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-brand-navy-200 bg-white space-y-1">
            <span className="text-brand-navy-400 uppercase font-bold text-[10px] block">
              {isEn ? 'Session Date' : 'Ngày giảng dạy'}
            </span>
            <strong className="text-brand-navy-900 text-sm">
              {formatDayOfWeek(activeSession.sessionDate, activeSession.dayOfWeek)}
            </strong>
            <p className="text-brand-navy-600 font-mono">{activeSession.sessionDate}</p>
          </div>

          <div className="p-3 rounded-xl border border-brand-navy-200 bg-white space-y-1">
            <span className="text-brand-navy-400 uppercase font-bold text-[10px] block">
              {isEn ? 'Time Slot' : 'Khung giờ'}
            </span>
            <strong className="text-brand-navy-900 text-sm">{activeSession.timeSlot}</strong>
            <p className="text-brand-navy-600">{isEn ? 'Standard Slot' : 'Ca tiêu chuẩn'}</p>
          </div>

          <div className="p-3 rounded-xl border border-brand-navy-200 bg-white space-y-1">
            <span className="text-brand-navy-400 uppercase font-bold text-[10px] block">
              {isEn ? 'Court / Room' : 'Phòng / Sân bãi'}
            </span>
            <strong className="text-brand-navy-900 text-sm">{translateRoomName(activeSession.roomName, isEn)}</strong>
            <p className="text-brand-navy-600">{isEn ? 'Confirmed Schedule' : 'Đã chốt lịch'}</p>
          </div>

          <div className="p-3 rounded-xl border border-brand-navy-200 bg-white space-y-1">
            <span className="text-brand-navy-400 uppercase font-bold text-[10px] block">
              {isEn ? 'Student Enrollment' : 'Sĩ số học viên'}
            </span>
            <strong className="text-brand-navy-900 text-sm">
              {activeSession.enrolledCount} / {activeSession.capacity} {isEn ? 'Students' : 'HV'}
            </strong>
            <p className="text-brand-navy-600 font-semibold">
              {activeSession.capacity > 0 ? Math.round((activeSession.enrolledCount / activeSession.capacity) * 100) : 0}% {isEn ? 'filled' : 'lấp đầy'}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-brand-navy-600">
            <span>{isEn ? 'Enrollment Capacity' : 'Tỷ lệ học viên đăng ký'}</span>
            <span>{activeSession.enrolledCount}/{activeSession.capacity} {isEn ? 'spots' : 'chỗ'}</span>
          </div>
          <div className="w-full bg-brand-navy-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-brand-danger-600 rounded-full"
              style={{
                width: `${activeSession.capacity > 0 ? Math.min(100, (activeSession.enrolledCount / activeSession.capacity) * 100) : 0}%`
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-brand-navy-200 flex flex-wrap items-center justify-end gap-2.5">
          <a
            href={`#/coach/members?classId=${activeSession.classId}`}
            className="px-4 py-2.5 rounded-xl border border-brand-navy-300 hover:bg-brand-navy-100 text-brand-navy-800 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">group</span>
            <span>{isEn ? 'View Student List' : 'Xem danh sách học viên'}</span>
          </a>

          <a
            href={`#/coach/attendance?sessionId=${activeSession.id}&date=${activeSession.sessionDate}`}
            className="px-4 py-2.5 rounded-xl bg-brand-sand-300 hover:bg-brand-terra-500 text-brand-navy-900 hover:text-white text-xs font-bold transition-all shadow-md shadow-brand-sand-300/20 flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
            <span>{isEn ? 'Take Attendance for Session' : 'Điểm danh ca dạy này'}</span>
          </a>
        </div>
      </div>
    </Modal>
  );
}
