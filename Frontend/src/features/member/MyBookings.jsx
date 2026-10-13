import { bookingApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/StatCard.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { Modal } from '../../components/common/Modal.js';
import { BOOKING_LABELS, formatMemberDate, formatMemberDateTime, isUpcomingBooking } from './memberOverview.js';

const { useState, useEffect } = React;

export function MyBookings() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [bookings, setBookings] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cancel Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const loadBookings = async () => {
    if (!currentUser) return;
    setError('');
    try {
      const [data, waiting] = await Promise.all([bookingApi.getMemberBookings(currentUser.id), bookingApi.getWaitlist()]);
      setBookings(data);
      setWaitlist(waiting);
    } catch (error) {
      setError(error.message || 'Không thể tải danh sách đặt chỗ.');
      showError(error.message || 'Không thể tải danh sách đặt chỗ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [currentUser]);

  const openCancelModal = (booking) => {
    setBookingToCancel(booking);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel || !currentUser) return;
    setCancelling(true);
    try {
      const result = await bookingApi.cancelBooking(bookingToCancel.id, currentUser.id);
      showSuccess(result.message);
      setCancelModalOpen(false);
      loadBookings();
    } catch (err) {
      const hint = err.code === 'ME-06' ? `\n👉 Hướng dẫn: ${err.proposedHandling || 'Liên hệ lễ tân hỗ trợ'}` : '';
      showError((err.message || 'Không thể hủy đặt chỗ.') + hint);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <LoadingSpinner text="Đang tải danh sách lớp đã đặt..." />;
  if (error) return <div role="alert" className="p-4 bg-red-50 text-red-700 rounded-xl space-y-3"><p>{error}</p><button type="button" onClick={loadBookings} className="text-sm font-bold underline">Tải lại lịch học</button></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
          CANCEL CLASS BOOKING
        </span>
        <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
          Lớp Học Đã Đặt Chỗ & Quản Lý Lịch Học
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Xem các ca tập đã đăng ký thành công. Hủy đặt chỗ kịp thời trước giờ học để nhường chỗ cho hội viên khác.
        </p>
      </div>

      <section className="space-y-2"><h2 className="font-bold">Danh sách chờ ({waitlist.length})</h2>{waitlist.map(w => <div key={w.id} className="border rounded-lg p-3 flex justify-between"><span>{w.className} · {w.sessionDate} · {w.startTime}</span><button disabled={cancelling} onClick={async () => { setCancelling(true); try { await bookingApi.leaveWaitlist(w.id); showSuccess('Đã rời danh sách chờ.'); await loadBookings(); } catch(e) { showError(e.message); } finally { setCancelling(false); } }}>Rời danh sách chờ</button></div>)}</section>
      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 max-w-xl mx-auto">
            <span className="material-symbols-outlined text-5xl text-slate-300">event_busy</span>
            <h3 className="font-chivo text-base font-bold text-slate-900 mt-2">
              Bạn Chưa Có Lịch Đặt Chỗ Nào
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Hãy khám phá lịch mở lớp 15 bộ môn và chọn ca rèn luyện yêu thích.
            </p>
            <a
              href="#/member/schedule"
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-colors inline-block"
            >
              Xem Lịch & Đặt Chỗ Ngay
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map(b => (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-slate-400 font-semibold">{b.id}</span>
                    <Badge variant={b.status}>{b.sessionStatus === 'CANCELLED' ? 'Buổi học bị hủy' : BOOKING_LABELS[b.status] || b.status}</Badge>
                  </div>

                  <h3 className="font-chivo text-base font-bold text-slate-900 leading-tight">
                    {b.className}
                  </h3>

                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-red-600 text-[18px]">calendar_month</span>
                      <span className="font-bold">{formatMemberDate(b.bookingDate)}</span>
                      <span>({b.timeSlot})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">stadium</span>
                      <span>{b.roomName}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">sports</span>
                      <span>HLV: <strong>{b.coachName}</strong>{b.coachSpecialization && <span className="block text-slate-500">Chuyên môn: {b.coachSpecialization}</span>}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-400">Đăng ký lúc: {formatMemberDateTime(b.createdAt)}</span>
                  {currentUser?.capabilities?.includes('cancel_booking') && isUpcomingBooking(b) && (
                    <button
                      onClick={() => openCancelModal(b)}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold font-chivo uppercase tracking-wider transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                      <span>Hủy Chỗ</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Xác Nhận Hủy Đặt Chỗ"
      >
        {bookingToCancel && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-950 space-y-1.5">
              <span className="font-bold text-sm block">Bạn có chắc chắn muốn hủy ca học này?</span>
              <div>Lớp: <strong>{bookingToCancel.className}</strong></div>
              <div>Thời gian: <strong>{bookingToCancel.bookingDate} ({bookingToCancel.timeSlot})</strong></div>
              <p className="pt-2 text-red-700 leading-relaxed">
                [ME-06] Áp dụng chính sách hủy: Hủy trước thời hạn quy định (ít nhất 2 giờ) sẽ giải phóng chỗ và hoàn lại lượt tập. Hủy muộn hoặc sau khi buổi học bắt đầu sẽ tính là đã tham gia.
              </p>
              <p className="text-[11px] text-amber-700 italic pt-1 border-t border-red-200/60">
                * Bản nháp đề xuất: Hạn hủy lớp và chính sách trừ lượt tập cần được trung tâm xác nhận chính thức. Nếu không được hủy trên hệ thống, vui lòng liên hệ quầy lễ tân để được hỗ trợ.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                Giữ Lại Ca Học
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors"
              >
                {cancelling ? 'Đang hủy...' : 'Đồng Ý Hủy Đặt Chỗ'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
