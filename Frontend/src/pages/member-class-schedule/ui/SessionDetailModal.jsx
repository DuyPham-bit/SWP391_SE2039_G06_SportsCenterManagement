import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { getSportTheme } from '../lib/calendarView.js';
import { translateSportName, translateDayOfWeek, translateClassName, translateRoomName, translateCoachName } from '../../../shared/i18n/i18nHelper.js';
import { BusinessAlert } from '../../../shared/ui/BusinessAlert.jsx';

export function SessionDetailModal({
  activeSession, bookedSessionIds, bookingError, bookingLoading, conflictingBooking, detailModalOpen,
  handleExecuteBooking, isEn, setDetailModalOpen
}) {
  return (
    <Modal
      isOpen={detailModalOpen}
      onClose={() => setDetailModalOpen(false)}
      title={isEn ? 'Session Details & Booking Confirmation' : 'Chi Tiết Ca Tập & Xác Nhận Giữ Chỗ'}
    >
      {activeSession && (() => {
        const isBooked = bookedSessionIds.has(activeSession.sessionId) || bookedSessionIds.has(activeSession.id);
        const isFull = activeSession.enrolledCount >= activeSession.capacity;
        const remainingSlots = Math.max(0, activeSession.capacity - activeSession.enrolledCount);
        const theme = getSportTheme(activeSession.sportName, isEn);

        return (
          <div className="space-y-4">
            {/* Session Overview Card */}
            <div className={`p-4 rounded-xl border text-xs space-y-2.5 ${theme.bg} ${theme.border}`}>
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase border ${theme.badge}`}>
                  {translateSportName(activeSession.sportName, isEn)}
                </span>
                <span className="font-bold text-brand-navy-600">{translateDayOfWeek(activeSession.dayOfWeek, isEn)} · {activeSession.sessionDate}</span>
              </div>

              <h3 className="font-chivo font-black text-brand-navy-900 text-base leading-tight">
                {translateClassName(activeSession.name, isEn)}
              </h3>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-black/5 text-brand-navy-700">
                <div>
                  <span className="text-[10px] uppercase font-bold text-brand-navy-400 block">{isEn ? 'Time' : 'Thời gian'}</span>
                  <strong className="text-brand-danger-600">{activeSession.timeSlot}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-brand-navy-400 block">{isEn ? 'Venue / Room' : 'Sân tập / Phòng'}</span>
                  <strong>{translateRoomName(activeSession.roomName, isEn)}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-brand-navy-400 block">{isEn ? 'Coach' : 'Huấn luyện viên'}</span>
                  <strong>{translateCoachName(activeSession.coachName, isEn)}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-brand-navy-400 block">{isEn ? 'Available Spots' : 'Số chỗ còn trống'}</span>
                  <strong className={remainingSlots <= 3 ? 'text-brand-danger-600' : 'text-brand-navy-900'}>
                    {remainingSlots}/{activeSession.capacity} {isEn ? 'spots' : 'suất'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Cảnh báo xung đột lịch nếu học viên đã có lớp khác cùng giờ */}
            {conflictingBooking && (
              <BusinessAlert
                type="warning"
                title={isEn ? 'Schedule Conflict Warning' : 'Cảnh báo trùng khung giờ tập luyện'}
                code="BOOK-CONFLICT"
                message={isEn
                  ? `You already have a class scheduled for "${translateClassName(conflictingBooking.className, isEn)}" at ${conflictingBooking.timeSlot} on ${conflictingBooking.bookingDate}.`
                  : `Bạn đã có lịch tập lớp "${conflictingBooking.className}" vào cùng khung giờ ${conflictingBooking.timeSlot} ngày ${conflictingBooking.bookingDate}.`}
                proposedHandling={isEn
                  ? 'A member should not register for two overlapping classes. Please consider cancelling your earlier booking before booking this session.'
                  : 'Một hội viên không nên đăng ký hai buổi học trùng giờ nhau. Vui lòng cân nhắc hủy lớp cũ trước khi đặt lớp mới.'}
              />
            )}

            {/* Thông báo trạng thái vé */}
            {isBooked ? (
              <BusinessAlert
                type="success"
                title={isEn ? 'You have booked this session!' : 'Bạn đã đặt chỗ ca học này!'}
                message={isEn
                  ? 'Your ticket is confirmed. Please arrive 10 minutes prior to class start for check-in at the facility.'
                  : 'Vé tập của bạn đã được xác nhận. Vui lòng có mặt trước giờ học 10 phút để điểm danh tại phòng tập.'}
                actionText={isEn ? 'View My Bookings' : 'Xem danh sách vé tập'}
                onAction={() => {
                  setDetailModalOpen(false);
                  window.location.hash = '#/member/bookings';
                }}
              />
            ) : isFull ? (
              <BusinessAlert
                type="warning"
                title={isEn ? 'Class has reached maximum capacity' : 'Lớp học đã đủ sĩ số tối đa'}
                code="SLOT-FULL"
                message={isEn
                  ? 'All workout spots in this session have been reserved by members.'
                  : 'Tất cả các vị trí tập luyện trong ca học này đã có hội viên đăng ký giữ chỗ.'}
                proposedHandling={activeSession.allowWaitlist
                  ? (isEn
                    ? 'Use the confirmation button below to join the waitlist. You will be notified when a spot becomes available.'
                    : 'Nhấn nút xác nhận bên dưới để vào danh sách chờ. Hệ thống sẽ thông báo khi có chỗ trống.')
                  : (isEn
                    ? 'Please choose another session.'
                    : 'Vui lòng chọn ca tập khác.')}
              />
            ) : remainingSlots <= 3 ? (
              <BusinessAlert
                type="info"
                title={isEn ? 'Spots running out!' : 'Chỗ trống sắp hết!'}
                message={isEn
                  ? `Only ${remainingSlots} spots left for this session. Confirm soon to secure your spot.`
                  : `Chỉ còn ${remainingSlots} suất cuối cùng cho buổi học này. Hãy xác nhận sớm để bảo đảm chỗ rèn luyện.`}
              />
            ) : null}

            {/* Lỗi phát sinh trong quá trình đặt vé */}
            {bookingError && (
              <BusinessAlert
                type="error"
                title={isEn ? 'Unable to complete booking' : 'Không thể hoàn tất giữ chỗ'}
                code={bookingError.code || 'BOOKING-ERROR'}
                message={bookingError.message || String(bookingError)}
                proposedHandling={bookingError.proposedHandling || (isEn ? 'Check your package validity, allowed sports, or network connection.' : 'Kiểm tra lại thời hạn gói tập, bộ môn được cấp phép, hoặc kiểm tra kết nối mạng.')}
              />
            )}

            {/* Policy note */}
            <div className="p-3 rounded-lg bg-brand-navy-50 border border-brand-navy-200 text-[11px] text-brand-navy-600 leading-relaxed space-y-1">
              <div className="font-bold text-brand-navy-800 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-brand-danger-600">verified_user</span>
                <span>{isEn ? 'Booking & Cancellation Policy:' : 'Chính sách đặt & hủy chỗ:'}</span>
              </div>
              <p>
                {isEn
                  ? '• Cancel at least 2 hours prior to class start to have your session credit refunded.'
                  : '• Hủy ca học trước tối thiểu 2 giờ sẽ được hoàn lại lượt tập vào gói hội viên.'}
              </p>
              <p>
                {isEn
                  ? '• Late cancellation or unauthorized absence will be counted as attended under center regulations.'
                  : '• Hủy muộn hoặc vắng mặt không phép sẽ tính là đã tham gia buổi học theo quy định trung tâm.'}
              </p>
            </div>

            {/* Action Buttons Footer */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-brand-navy-100">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-brand-navy-300 hover:bg-brand-navy-50 text-brand-navy-700"
              >
                {isEn ? 'Close' : 'Đóng'}
              </button>

              {!isBooked && (
                <button
                  type="button"
                  onClick={() => handleExecuteBooking()}
                  disabled={bookingLoading || (isFull && !activeSession.allowWaitlist) || !activeSession.isBookable}
                  className="px-6 py-2 text-xs font-bold font-chivo uppercase tracking-wider rounded-lg bg-brand-danger-600 hover:bg-brand-danger-700 text-white shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {bookingLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{isEn ? 'Booking...' : 'Đang giữ chỗ...'}</span>
                    </>
                  ) : (
                    <span>{isFull && activeSession.allowWaitlist
                      ? (isEn ? 'Join Waitlist' : 'Vào Danh Sách Chờ')
                      : (isEn ? 'Confirm Booking' : 'Xác Nhận Giữ Chỗ')}</span>
                  )}
                </button>
              )}
            </div>
          </div>
        );
      })()}
    </Modal>
  );
}
