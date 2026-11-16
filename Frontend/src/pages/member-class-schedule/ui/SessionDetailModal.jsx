import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { getSportTheme } from '../lib/calendarView.js';
import { translateSportName, translateDayOfWeek, translateClassName, translateRoomName, translateCoachName } from '../../../shared/i18n/i18nHelper.js';
import { BusinessAlert } from '../../../shared/ui/BusinessAlert.jsx';
import { PACKAGES_ROUTE, getSessionAction } from '../lib/sessionAction.js';

export function SessionDetailModal({
  activeSession, bookedSessionIds, bookingError, bookingLoading, conflictingBooking, detailModalOpen,
  handleExecuteBooking, handleCancelBooking, handleLeaveWaitlist, cancelLoading, entitlements, isEn, setDetailModalOpen
}) {
  return (
    <Modal
      isOpen={detailModalOpen}
      onClose={() => setDetailModalOpen(false)}
      title={isEn ? 'Session Details & Booking Confirmation' : 'Chi Tiết Ca Tập & Xác Nhận Giữ Chỗ'}
    >
      {activeSession && (() => {
        const action = getSessionAction(activeSession, bookedSessionIds, isEn);
        const isBooked = action.state === 'ALREADY_BOOKED';
        const isWaitlisted = action.state === 'WAITLISTED';
        const queueLength = activeSession.waitlistCount || 0;
        const isFull = activeSession.enrolledCount >= activeSession.capacity;
        const needsPackage = action.action === 'packages';
        const cancelHours = entitlements?.cancelBeforeHours || 0;
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
                  <span className="text-[10px] uppercase font-bold text-brand-navy-400 block">{isEn ? 'Available Spots' : 'Số chỗ còn trống'}</span>
                  <strong className={remainingSlots <= 3 ? 'text-brand-danger-600' : 'text-brand-navy-900'}>
                    {remainingSlots}/{activeSession.capacity} {isEn ? 'spots' : 'suất'}
                  </strong>
                </div>
              </div>
            </div>

            {/* HLV phụ trách ca tập — người hội viên sẽ theo học */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-brand-teal-200 bg-white">
              <div aria-hidden="true" className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-brand-teal-500 to-brand-sage-600 text-white font-chivo font-black flex items-center justify-center">
                {String(activeSession.coachName || '?').trim().split(/\s+/).slice(-2).map(p => p[0]).join('').toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-brand-navy-400 block">{isEn ? 'Your coach for this session' : 'HLV bạn sẽ theo học'}</span>
                <strong className="font-chivo text-sm text-brand-navy-900 truncate block">
                  {activeSession.coachName ? translateCoachName(activeSession.coachName, isEn) : (isEn ? 'To be assigned' : 'Đang phân công')}
                </strong>
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
            ) : isWaitlisted ? (
              <BusinessAlert
                type="info"
                title={isEn
                  ? `You are #${activeSession.waitlistPosition || '?'} on the waitlist`
                  : `Bạn đang ở vị trí #${activeSession.waitlistPosition || '?'} trong danh sách chờ`}
                code="WAITLISTED"
                message={isEn
                  ? `${queueLength} member(s) are waiting for this session. When a spot opens, the first eligible member is booked automatically and notified.`
                  : `Có ${queueLength} hội viên đang chờ buổi này. Khi có chỗ trống, hội viên đầu hàng đủ điều kiện sẽ được tự động xác nhận chỗ và nhận thông báo.`}
                actionText={isEn ? 'View My Bookings' : 'Xem danh sách vé tập'}
                onAction={() => {
                  setDetailModalOpen(false);
                  window.location.hash = '#/member/bookings';
                }}
              />
            ) : needsPackage ? (
              <BusinessAlert
                type="warning"
                title={action.state === 'SPORT_NOT_INCLUDED'
                  ? (isEn ? 'This sport is not in your package' : 'Bộ môn này không nằm trong gói tập của bạn')
                  : (isEn ? 'No valid package on this date' : 'Gói tập không còn hiệu lực vào ngày diễn ra lớp')}
                code={action.state}
                message={action.state === 'SPORT_NOT_INCLUDED'
                  ? (isEn ? 'Upgrade to a package that includes this sport to book it.' : 'Nâng cấp lên gói có bộ môn này để đặt chỗ.')
                  : (isEn ? 'Renew or buy a package that covers this date.' : 'Gia hạn hoặc mua gói có hiệu lực tới ngày này để đặt chỗ.')}
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
                    ? `Use the confirmation button below to join the waitlist (${queueLength} waiting). You will be booked automatically when a spot becomes available.`
                    : `Nhấn nút xác nhận bên dưới để vào danh sách chờ (đang có ${queueLength} người chờ). Hệ thống sẽ tự động xác nhận chỗ khi có người hủy.`)
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
                {cancelHours > 0
                  ? (isEn
                    ? `• Your package requires cancelling at least ${cancelHours} hours before class; later cancellations are blocked.`
                    : `• Gói của bạn yêu cầu hủy lịch trước ít nhất ${cancelHours} giờ; sau mốc này không thể hủy.`)
                  : (isEn
                    ? '• Cancel at least 2 hours prior to class start to have your session credit refunded.'
                    : '• Hủy ca học trước tối thiểu 2 giờ sẽ được hoàn lại lượt tập vào gói hội viên.')}
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

              {isBooked && activeSession.bookingId && (
                <button
                  type="button"
                  onClick={() => handleCancelBooking(activeSession.bookingId)}
                  disabled={cancelLoading}
                  className="px-6 py-2 text-xs font-bold font-chivo uppercase tracking-wider rounded-lg border border-brand-danger-600 text-brand-danger-700 hover:bg-brand-danger-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelLoading ? (isEn ? 'Cancelling...' : 'Đang hủy...') : (isEn ? 'Cancel spot' : 'Hủy chỗ')}
                </button>
              )}

              {isWaitlisted && activeSession.waitlistId && (
                <button
                  type="button"
                  onClick={() => handleLeaveWaitlist?.(activeSession.waitlistId)}
                  disabled={cancelLoading}
                  className="px-6 py-2 text-xs font-bold font-chivo uppercase tracking-wider rounded-lg border border-brand-danger-600 text-brand-danger-700 hover:bg-brand-danger-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelLoading ? (isEn ? 'Leaving...' : 'Đang rời...') : (isEn ? 'Leave waitlist' : 'Rời hàng chờ')}
                </button>
              )}

              {needsPackage && (
                <button
                  type="button"
                  onClick={() => { setDetailModalOpen(false); window.location.hash = PACKAGES_ROUTE; }}
                  className="px-6 py-2 text-xs font-bold font-chivo uppercase tracking-wider rounded-lg bg-brand-sand-500 hover:bg-brand-sand-600 text-brand-navy-900 shadow-md transition-colors"
                >
                  {action.label}
                </button>
              )}

              {!isBooked && !isWaitlisted && !needsPackage && (
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
