import { classApi, bookingApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../../components/common/Modal.js';
import { Badge } from '../../components/common/StatCard.js';
import { LoadingSpinner } from '../../components/common/Table.js';


const { useState, useEffect } = React;

export function ClassScheduleView() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [classes, setClasses] = useState([]);
  const [bookedClassIds, setBookedClassIds] = useState(new Set());
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Booking Modal
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const loadClasses = async () => {
    try {
      const [classList, myBookings] = await Promise.all([
        classApi.getAll(),
        currentUser ? bookingApi.getMemberBookings(currentUser.id) : []
      ]);
      setClasses(classList);

      const confirmedIds = new Set(
        (myBookings || [])
          .filter(b => b.status === 'CONFIRMED')
          .map(b => b.sessionId)
      );
      setBookedClassIds(confirmedIds);
    } catch (error) {
      showError(error.message || 'Không thể tải lịch lớp từ backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, [currentUser?.id]);

  const openBookingModal = (cls) => {
    if (!cls.isBookable) {
      showError('Buổi học hiện không nhận đặt chỗ. Chỉ đặt trước 30 phút đến 7 ngày.');
      return;
    }
    setBookingDate(cls.sessionDate);
    setSelectedClass(cls);
    setBookingModalOpen(true);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedClass || !currentUser) return;

    setBookingLoading(true);
    try {
      const result = await bookingApi.bookClass(currentUser.id, selectedClass.sessionId);
      showSuccess(result.message);
      setBookingModalOpen(false);
      loadClasses();
    } catch (err) {
      showError(err.message || 'Lỗi đặt chỗ');
    } finally {
      setBookingLoading(false);
    }
  };

  const filtered = selectedSport === 'ALL'
    ? classes
    : classes.filter(c => c.sportName.includes(selectedSport));

  if (loading) return <LoadingSpinner text="Đang tải lịch mở lớp thể thao..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
          VIEW SCHEDULES & BOOK CLASS
        </span>
        <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
          Lịch Mở Lớp Thể Thao & Đặt Chỗ Rèn Luyện
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Khám phá các ca tập đạt chuẩn Olympic thuộc 15 bộ môn và giữ chỗ luyện tập cùng Huấn luyện viên chuyên môn.
        </p>
      </div>

      {/* Sport Category Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Lọc môn:</span>
        <button
          onClick={() => setSelectedSport('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo uppercase tracking-wider transition-all ${selectedSport === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
        >
          Tất cả môn
        </button>
        {[...new Set(classes.map(c => c.sportName))].map(name => ({ id: name, name })).map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedSport(s.name)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo uppercase tracking-wider transition-all ${selectedSport === s.name
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(cls => {
          const isFull = cls.enrolledCount >= cls.capacity;
          const isBooked = bookedClassIds.has(cls.id);

          return (
            <div
              key={cls.id}
              className={`bg-white rounded-2xl border transition-all flex flex-col justify-between ${
                isBooked
                  ? 'border-emerald-400 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/15'
                  : 'border-slate-200 shadow-sm hover:shadow-md'
              } p-6`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="primary" size="sm">{cls.sportName}</Badge>
                    {isBooked && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        ĐÃ THAM GIA
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-bold">{cls.dayOfWeek}</span>
                </div>

                <h3 className="font-chivo text-base font-bold text-slate-900 leading-tight">
                  {cls.name}
                </h3>

                <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="material-symbols-outlined text-[18px] text-red-600">schedule</span>
                      <span className="font-bold">{cls.sessionDate} · {cls.timeSlot}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
                    <span>HLV: <strong className="text-slate-900">{cls.coachName}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">stadium</span>
                    <span>{cls.roomName}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Số chỗ còn lại</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-chivo text-sm font-bold text-slate-900">
                      {cls.enrolledCount}/{cls.capacity}
                    </span>
                    <Badge variant={isFull ? 'FULL' : 'OPEN'} size="sm">
                      {isFull ? 'HẾT CHỖ' : 'CÒN CHỖ'}
                    </Badge>
                  </div>
                </div>

                {isBooked ? (
                  <div className="flex flex-col items-end">
                    <button
                      type="button"
                      disabled
                      className="px-4 py-2 rounded-lg font-chivo text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm flex items-center gap-1.5 cursor-default"
                    >
                      <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
                      <span>ĐÃ ĐẶT CHỖ</span>
                    </button>
                    <a
                      href="#/member/bookings"
                      className="text-[10px] text-emerald-700 hover:text-emerald-900 hover:underline font-bold mt-1 flex items-center gap-0.5"
                    >
                      <span>Xem chi tiết vé tập</span>
                      <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                    </a>
                  </div>
                ) : (
                  <button
                    onClick={() => openBookingModal(cls)}
                    disabled={!cls.isBookable}
                    className={`px-4 py-2 rounded-lg font-chivo text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
                      !cls.isBookable
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {!cls.isBookable ? 'Đã đóng' : isFull && cls.allowWaitlist ? 'Vào danh sách chờ' : 'Đặt Chỗ'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Confirmation Modal */}
      <Modal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        title="Xác Nhận Đặt Chỗ Lớp Học"
      >
        {selectedClass && (
          <form onSubmit={handleConfirmBooking} className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-900 text-sm">{selectedClass.name}</div>
              <div className="text-slate-600">Huấn luyện viên: <strong>{selectedClass.coachName}</strong></div>
              <div className="text-slate-600">Địa điểm: <strong>{selectedClass.roomName}</strong></div>
              <div className="text-red-600 font-bold">Khung giờ: {selectedClass.timeSlot} ({selectedClass.dayOfWeek})</div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Ngày của buổi học
              </label>
              <input
                type="date"
                required
                value={bookingDate}
                readOnly
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white font-medium"
              />
            </div>

            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-900 text-xs flex items-start gap-2 border border-emerald-200">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">verified</span>
              <span>Hệ thống sẽ kiểm tra quyền lợi gói, thời hạn và chỗ trống khi xác nhận. Lớp đầy sẽ chuyển vào danh sách chờ nếu được phép.</span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBookingModalOpen(false)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={bookingLoading}
                className="px-6 py-2.5 text-xs font-bold font-chivo uppercase tracking-wider rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors"
              >
                {bookingLoading ? 'Đang giữ chỗ...' : 'Xác Nhận Giữ Chỗ'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
