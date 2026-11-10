import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { bookingStart, getSportTheme, formatMemberDate } from '../../../entities/member/index.js';
import { translateClassName, translateRoomName } from '../../../shared/i18n/i18nHelper.js';

export function CancelBookingModal({
  bookingToCancel, cancelModalOpen, cancelling, handleConfirmCancelBooking, isEn, setCancelModalOpen
}) {
  return (
    <Modal
      isOpen={cancelModalOpen}
      onClose={() => setCancelModalOpen(false)}
      title={isEn ? 'Cancel Class Booking' : 'Xác nhận hủy đặt chỗ'}
      maxWidth="max-w-md"
    >
      {bookingToCancel && (() => {
        const startTime = bookingStart(bookingToCancel);
        const hasTimeInfo = !Number.isNaN(startTime);
        const isEligibleForRefund = hasTimeInfo ? (startTime - Date.now() >= 2 * 60 * 60 * 1000) : true;
        const sportTheme = getSportTheme(bookingToCancel.sportName, bookingToCancel.className, isEn);

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-danger-50 dark:bg-brand-danger-950/40 text-brand-danger-600 dark:text-brand-danger-400 flex items-center justify-center shrink-0 border border-brand-danger-100 dark:border-brand-danger-900/50">
                <span className="material-symbols-outlined text-[22px]">event_busy</span>
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-brand-navy-900 dark:text-white leading-snug">
                  {isEn ? 'Cancel this class booking?' : 'Bạn muốn hủy lịch ca tập này?'}
                </h4>
                <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
                  {isEn ? 'Please review session info and refund policy below.' : 'Vui lòng kiểm tra thông tin ca tập và quyền lợi hoàn lượt bên dưới.'}
                </p>
              </div>
            </div>

            {/* Class Info Box */}
            <div className="p-4 rounded-2xl bg-brand-navy-50 dark:bg-brand-navy-800/60 border border-brand-navy-200/80 dark:border-brand-navy-700/60 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-sm text-brand-navy-900 dark:text-white">
                  {translateClassName(bookingToCancel.className, isEn)}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${sportTheme.badge}`}>
                  {sportTheme.tag}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-brand-navy-200/60 dark:border-brand-navy-700/60">
                <div className="flex items-center gap-1.5 text-brand-navy-700 dark:text-brand-navy-300">
                  <span className="material-symbols-outlined text-[16px] text-brand-navy-400">calendar_month</span>
                  <span>{formatMemberDate(bookingToCancel.bookingDate, isEn)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-brand-navy-700 dark:text-brand-navy-300">
                  <span className="material-symbols-outlined text-[16px] text-brand-navy-400">schedule</span>
                  <span className="font-mono font-semibold">{bookingToCancel.timeSlot}</span>
                </div>
                <div className="flex items-center gap-1.5 text-brand-navy-700 dark:text-brand-navy-300 sm:col-span-2">
                  <span className="material-symbols-outlined text-[16px] text-brand-navy-400">location_on</span>
                  <span>{translateRoomName(bookingToCancel.roomName, isEn)}</span>
                </div>
              </div>
            </div>

            {/* Refund Policy Callout */}
            {isEligibleForRefund ? (
              <div className="p-3.5 rounded-2xl bg-brand-sage-50 dark:bg-brand-sage-950/30 border border-brand-sage-200 dark:border-brand-sage-800/40 flex items-start gap-2.5 text-xs text-brand-sage-900 dark:text-brand-sage-200">
                <span className="material-symbols-outlined text-[20px] text-brand-sage-700 dark:text-brand-sage-400 shrink-0 mt-0.5">check_circle</span>
                <div className="space-y-0.5">
                  <span className="font-bold block text-brand-sage-800 dark:text-brand-sage-300">
                    {isEn ? '1 Session Credit will be refunded' : 'Được hoàn lại 01 lượt tập'}
                  </span>
                  <p className="text-[11.5px] text-brand-sage-700 dark:text-brand-sage-300/90 leading-relaxed">
                    {isEn
                      ? 'Because you are cancelling more than 2 hours before start time, your session credit will be returned automatically.'
                      : 'Do bạn hủy trước giờ học hơn 2 tiếng, 1 lượt tập sẽ được tự động hoàn lại vào gói của bạn ngay sau khi xác nhận hủy.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-brand-sand-50 dark:bg-brand-sand-950/30 border border-brand-sand-200 dark:border-brand-sand-800/40 flex items-start gap-2.5 text-xs text-brand-sand-900 dark:text-brand-sand-200">
                <span className="material-symbols-outlined text-[20px] text-brand-sand-700 dark:text-brand-sand-400 shrink-0 mt-0.5">warning</span>
                <div className="space-y-0.5">
                  <span className="font-bold block text-brand-sand-800 dark:text-brand-sand-300">
                    {isEn ? 'Session starts in less than 2 hours' : 'Ca học diễn ra trong vòng 2 giờ tới'}
                  </span>
                  <p className="text-[11.5px] text-brand-sand-700 dark:text-brand-sand-300/90 leading-relaxed">
                    {isEn
                      ? 'According to center policy, late cancellations will not refund session credit. For medical emergencies, please visit the front desk.'
                      : 'Theo quy định trung tâm, việc hủy sát giờ sẽ không được hoàn lại lượt tập. Nếu có sự cố sức khỏe khẩn cấp, vui lòng liên hệ trực tiếp quầy lễ tân.'}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-brand-navy-100 dark:border-brand-navy-800">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelling}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300 transition-colors cursor-pointer"
              >
                {isEn ? 'Keep Session' : 'Giữ lại ca học'}
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelBooking}
                disabled={cancelling}
                className="px-4.5 py-2 text-xs font-bold rounded-xl bg-brand-danger-600 hover:bg-brand-danger-700 text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                {cancelling ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isEn ? 'Cancelling...' : 'Đang xử lý...'}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">close</span>
                    <span>{isEn ? 'Confirm Cancellation' : 'Đồng ý hủy chỗ'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })()}
    </Modal>
  );
}
