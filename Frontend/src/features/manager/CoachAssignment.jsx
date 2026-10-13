import { classApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../../components/common/Modal.js';
import { Badge } from '../../components/common/StatCard.js';
import { LoadingSpinner } from '../../components/common/Table.js';

const { useState, useEffect } = React;

export function CoachAssignment() {
  const { showSuccess, showError } = useToast();
  const [classes, setClasses] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Assign Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const loadData = async () => {
    setError('');
    try {
      const [classList, staffList] = await Promise.all([
        classApi.getManagementClasses(),
        classApi.getCoaches()
      ]);
      setClasses(classList);
      setCoaches(staffList);
    } catch (e) {
      setError(e.message || 'Lỗi tải dữ liệu phân công HLV');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAssignModal = (cls) => {
    setSelectedClass(cls);
    setSelectedCoachId(cls.coachId || coaches[0]?.id || '');
    setModalOpen(true);
  };

  const handleConfirmAssign = async (e) => {
    e.preventDefault();
    if (!selectedCoachId) {
      showError('Vui lòng chọn huấn luyện viên!');
      return;
    }

    setAssigning(true);
    try {
      await classApi.assignCoach(selectedClass.id, selectedCoachId);
      showSuccess(`Phân công HLV cho lớp "${selectedClass.name}" thành công!`);
      setModalOpen(false);
      loadData();
    } catch (err) {
      showError(err.message || 'Lỗi phân công HLV!');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <LoadingSpinner text="Đang tải dữ liệu phân công HLV..." />;
  if (error) return <div role="alert" className="p-5 bg-red-50 rounded-xl space-y-3"><p>{error}</p><button onClick={() => { setLoading(true); loadData(); }}>Thử lại</button></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
          ASSIGN COACH TO CLASS
        </span>
        <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
          Phân Công Huấn Luyện Viên Cho Lớp Học
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Điều phối chuyên môn giảng dạy, tự động phát hiện và cảnh báo xung đột lịch dạy của HLV.
        </p>
      </div>

      {/* Class Cards Grid with Coach Assignment Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(cls => {
          const currentCoach = coaches.find(c => String(c.id) === String(cls.coachId));
          return (
            <div key={cls.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="primary" size="sm">{cls.sportName}</Badge>
                  <span className="text-xs text-slate-500 font-bold">{cls.status}</span>
                </div>

                <h3 className="font-chivo text-base font-bold text-slate-900 leading-tight">
                  {cls.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
                  <span>{cls.durationMinutes} phút/buổi · {cls.roomName || 'Chưa chọn phòng'}</span>
                </p>

                {/* Current Coach Box */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <img
                    src={currentCoach?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                      Huấn luyện viên phụ trách
                    </span>
                    <span className="font-bold text-xs text-slate-900">
                      {cls.coachName || 'Chưa phân công'}
                    </span>
                    {currentCoach?.certification && (
                      <span className="text-[10px] text-red-600 font-semibold block">
                        {currentCoach.certification}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  Học viên: <strong className="text-slate-900">{cls.enrolledCount}/{cls.capacity}</strong>
                </span>

                <button
                  onClick={() => openAssignModal(cls)}
                  disabled={['Cancelled', 'Completed'].includes(cls.status) || !coaches.length}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                  <span>Đổi HLV</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assignment Modal */}
      {!classes.length && <p>Chưa có lớp học để phân công.</p>}
      {!coaches.length && <p>Chưa có huấn luyện viên đang hoạt động trong trung tâm.</p>}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Phân Công Huấn Luyện Viên"
      >
        {selectedClass && (
          <form onSubmit={handleConfirmAssign} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-900 text-sm">{selectedClass.name}</div>
              <div className="text-slate-600">Môn: <strong>{selectedClass.sportName}</strong> • Sân: <strong>{selectedClass.roomName}</strong></div>
              <a href="#/manager/classes-rooms" className="text-red-600 font-bold">Xem lịch học trong quản lý lớp</a>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Chọn Huấn luyện viên thay thế *
              </label>
              <select
                value={selectedCoachId}
                onChange={e => setSelectedCoachId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
              >
                {coaches.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.specialization || 'Chưa có chuyên môn'}{c.certification ? ` · ${c.certification}` : ''})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 text-amber-800 text-xs flex items-start gap-2 border border-amber-200">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">verified_user</span>
              <span>Hệ thống sẽ tự động đối soát lịch giảng dạy của HLV được chọn. Nếu trùng ca dạy ở lớp khác, hệ thống sẽ phát tín hiệu cảnh báo xung đột và ngăn chặn phân công.</span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={assigning}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors"
              >
                {assigning ? 'Đang xác thực...' : 'Xác Nhận Phân Công'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
