import { coachApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { Modal } from '../../components/common/Modal.js';
import { CoachError } from './CoachShared.js';
import { coachDate } from './coachOverview.js';

const { useState, useEffect } = React;

export function TrainingPlan() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [coachClasses, setCoachClasses] = useState([]);
  const [selectedFilterClass, setSelectedFilterClass] = useState('ALL');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState(coachDate());
  const [endDate, setEndDate] = useState('');
  const [exercises, setExercises] = useState([
    { name: 'Khởi động xoay khớp & chạy nhẹ', sets: '2', reps: '5 phút', note: 'Làm nóng toàn thân' },
    { name: 'Bài tập chính chuyên sâu', sets: '4', reps: '10 - 12', note: 'RPE 8.0, nghỉ 60s' }
  ]);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true); setError('');
    try {
      const isManager = currentUser?.role === 'MANAGER';
      const classesData = await coachApi.getCoachClassesAndMembers(
        currentUser?.id,
        currentUser?.fullName,
        isManager
      );
      setCoachClasses(classesData);

      setPlans(await coachApi.getTrainingPlans());

      // Default selection for modal
      if (classesData.length > 0 && !selectedClassId) {
        setSelectedClassId(classesData[0].id);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id]);

  const handleClassChange = (classId) => {
    setSelectedClassId(Number(classId));
  };

  const handleOpenCreateModal = () => {
    setTitle('');
    setGoal('');
    setStartDate(coachDate());
    setEndDate('');
    setExercises([
      { name: 'Khởi động xoay khớp & chạy nhẹ', sets: '2', reps: '5 phút', note: 'Làm nóng toàn thân' },
      { name: 'Bài tập chính chuyên sâu', sets: '4', reps: '10 - 12', note: 'RPE 8.0, nghỉ 60s' }
    ]);

    // Pre-select currently filtered class if specific, else first class
    const initialClass = (selectedFilterClass !== 'ALL' && coachClasses.find(c => c.id === selectedFilterClass)) || coachClasses[0];
    if (initialClass) {
      setSelectedClassId(initialClass.id);
    }
    setModalOpen(true);
  };

  const handleAddExercise = () => {
    setExercises([...exercises, { name: '', sets: '3', reps: '10', note: '' }]);
  };

  const handleRemoveExercise = (idx) => {
    setExercises(exercises.filter((_, i) => i !== idx));
  };

  const handleExerciseChange = (idx, field, val) => {
    const next = [...exercises];
    next[idx] = { ...next[idx], [field]: val };
    setExercises(next);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!selectedClassId) {
      showError('Vui lòng chọn lớp học bạn đang đảm nhiệm!');
      return;
    }
    if (!title.trim() || !goal.trim()) {
      showError('Vui lòng nhập tên giáo án và mục tiêu!');
      return;
    }

    if (!exercises.length || exercises.some(ex => !ex.name.trim()) || (endDate && endDate < startDate)) {
      showError('Nhập ít nhất một bài tập có tên và khoảng ngày hợp lệ.'); return;
    }
    const currentClass = coachClasses.find(c => c.id === selectedClassId);

    setSaving(true);
    try {
      await coachApi.createTrainingPlan({
        classId: currentClass?.id,
        className: currentClass?.name,
        sportName: currentClass?.sportName,
        isCustom: false,
        targetType: 'CLASS',
        memberId: null,
        memberName: 'Tất cả học viên trong lớp',
        coachId: currentUser?.id,
        coachName: currentUser?.fullName || 'Huấn luyện viên',
        title: title.trim(),
        goal: goal.trim(),
        startDate,
        endDate: endDate || null,
        exercises
      });
      showSuccess(`Thiết lập giáo án chung cho lớp ${currentClass?.name} thành công!`);
      setModalOpen(false);
      loadData();
    } catch (err) {
      showError(err.message || 'Lỗi lưu giáo án');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (planId, planTitle) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa giáo án "${planTitle}" không?`)) return;
    try {
      await coachApi.deleteTrainingPlan(planId, currentUser?.fullName);
      showSuccess('Đã xóa giáo án thành công!');
      loadData();
    } catch (err) {
      showError(err.message || 'Không thể xóa giáo án');
    }
  };

  const activeModalClass = coachClasses.find(c => c.id === selectedClassId) || coachClasses[0];
  const activeClassMembers = activeModalClass?.members || [];

  const filteredPlans = plans.filter(p => {
    if (selectedFilterClass === 'ALL') return true;
    return p.classId === selectedFilterClass;
  });

  if (loading) return <LoadingSpinner text="Đang tải danh sách lớp học và giáo án..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
            CREATE TRAINING PLAN
          </span>
          <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
            Thiết Lập Giáo Án Huấn Luyện Thể Lực
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Xây dựng phác đồ rèn luyện cá nhân hóa theo từng lớp học và học viên do bạn trực tiếp giảng dạy.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add_task</span>
          <span>Soạn Giáo Án Mới</span>
        </button>
      </div>

      {/* Class Filter Chips */}
      <CoachError message={error} retry={loadData} />
      {coachClasses.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Lọc theo lớp học:</span>
          <button
            onClick={() => setSelectedFilterClass('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo uppercase tracking-wider transition-all ${
              selectedFilterClass === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tất cả lớp ({plans.length})
          </button>
          {coachClasses.map(c => {
            const count = plans.filter(p => p.classId === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedFilterClass(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo tracking-wider transition-all ${
                  selectedFilterClass === c.id
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Existing Plans Cards */}
      {filteredPlans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 space-y-2">
          <span className="material-symbols-outlined text-4xl text-slate-300">assignment_late</span>
          <div className="font-bold text-slate-700 text-sm">Chưa có giáo án nào được tạo cho lớp học này</div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Bấm nút "Soạn Giáo Án Mới" để thiết lập giáo án rèn luyện cho các học viên trong lớp của bạn.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPlans.map(plan => (
            <div key={plan.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {plan.isCustom ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 font-chivo">
                        <span className="material-symbols-outlined text-[13px] text-amber-500">star</span>
                        GIÁO ÁN RIÊNG CÁ NHÂN HÓA
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 font-chivo">
                        <span className="material-symbols-outlined text-[13px]">groups</span>
                        GIÁO ÁN CHUNG CHO LỚP HỌC
                      </span>
                    )}
                    {plan.className && (
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        Lớp: {plan.className}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                      {plan.sportName || 'Thể thao'}
                    </span>
                  </div>
                  <h3 className="font-chivo text-lg font-black text-slate-900 leading-tight">
                    {plan.title}
                  </h3>
                  <div className="text-xs text-slate-500 mt-1">
                    Đối tượng: <strong className="text-slate-900">{plan.isCustom ? `${plan.memberName} (Học viên riêng)` : `Toàn bộ học viên lớp ${plan.className || ''}`}</strong> • HLV: <strong>{plan.coachName}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-bold text-xs uppercase border border-emerald-200">
                    ACTIVE
                  </span>
                  <button
                    onClick={() => handleDeletePlan(plan.id, plan.title)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Xóa giáo án này"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="font-bold text-slate-700 block mb-0.5">Mục tiêu huấn luyện:</span>
                <p className="text-slate-600 italic">"{plan.goal}"</p>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Các bài tập trong giáo án ({plan.exercises?.length || 0}):
                </span>
                <div className="space-y-2">
                  {plan.exercises?.map((ex, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-slate-100 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{idx + 1}. {ex.name}</div>
                        <div className="text-[11px] text-slate-500">{ex.note}</div>
                      </div>
                      <div className="text-right font-chivo font-bold text-slate-800 text-[11px] shrink-0">
                        {ex.sets} hiệp x {ex.reps}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                <span>Thời hạn: {plan.startDate || 'Bắt đầu'} ➜ {plan.endDate || 'Dài hạn'}</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  {plan.isCustom ? 'Áp dụng cho học viên đặc biệt' : 'Áp dụng chung cho cả lớp'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Plan Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Soạn Thảo Giáo Án Chung Cho Lớp Học"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSavePlan} className="space-y-4">
          {/* Chọn Lớp học đảm nhiệm */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Chọn Lớp Học Đảm Nhiệm Áp Dụng Giáo Án *
            </label>
            {coachClasses.length === 0 ? (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                Bạn chưa có lớp học nào được phân công.
              </div>
            ) : (
              <select
                value={selectedClassId}
                onChange={e => handleClassChange(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white font-semibold text-slate-900"
              >
                {coachClasses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.sportName} • Sĩ số: {c.members?.length || 0} học viên)
                  </option>
                ))}
              </select>
            )}
            {activeModalClass && (
              <div className="text-xs text-slate-600 mt-2 flex flex-wrap items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">group</span>
                  <span>Giáo án sẽ áp dụng đồng loạt cho học viên trong lớp</span>
                </span>
              </div>
            )}
          </div>

          {/* Row 2: Tên giáo án & Mục tiêu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Tên giáo án *
              </label>
              <input
                type="text"
                required
                placeholder="VD: Tối ưu sải bơi 50m & Tăng cơ"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Mục tiêu rèn luyện cụ thể *
              </label>
              <input
                type="text"
                required
                placeholder="VD: Cải thiện sức bền, tăng 1kg cơ bắp"
                value={goal}
                onChange={e => setGoal(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
              />
            </div>
          </div>

          {/* Row 3: Thời gian áp dụng */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Ngày kết thúc
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
              />
            </div>
          </div>

          {/* Exercise items builder */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Danh sách bài tập chi tiết
              </label>
              <button
                type="button"
                onClick={handleAddExercise}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Thêm bài tập</span>
              </button>
            </div>

            {exercises.map((ex, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <input
                    type="text"
                    placeholder="Tên bài tập"
                    value={ex.name}
                    onChange={e => handleExerciseChange(idx, 'name', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Số hiệp"
                    value={ex.sets}
                    onChange={e => handleExerciseChange(idx, 'sets', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 bg-white text-center"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Lặp lại"
                    value={ex.reps}
                    onChange={e => handleExerciseChange(idx, 'reps', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 bg-white text-center"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Lưu ý kỹ thuật"
                    value={ex.note}
                    onChange={e => handleExerciseChange(idx, 'note', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 bg-white"
                  />
                </div>
                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(idx)}
                    className="text-slate-400 hover:text-red-600 p-1"
                    title="Xóa bài tập"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || !selectedClassId}
              className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg text-white shadow-md transition-colors flex items-center gap-1.5 ${
                saving || !selectedClassId
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>Lưu &amp; Giao Giáo Án</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
