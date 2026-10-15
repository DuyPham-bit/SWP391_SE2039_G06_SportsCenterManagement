import { coachApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Table, LoadingSpinner } from '../../components/common/Table.js';
import { Badge } from '../../components/common/StatCard.js';
import { Modal } from '../../components/common/Modal.js';
import { CoachError, coachInput } from './CoachShared.js';
import { coachDate } from './coachOverview.js';

const { useState, useEffect } = React;

export function ClassMembers() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(Number(new URLSearchParams(window.location.hash.split('?')[1]).get('classId')) || '');
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState('');
  const [memberVersion, setMemberVersion] = useState(0);
  const [profile, setProfile] = useState(null);

  // Modal State for Personal Training Plan
  const [modalOpen, setModalOpen] = useState(false);
  const [activeMember, setActiveMember] = useState(null);
  const [existingPlanId, setExistingPlanId] = useState(null);
  const [planTitle, setPlanTitle] = useState('');
  const [fitnessCondition, setFitnessCondition] = useState('');
  const [planGoal, setPlanGoal] = useState('');
  const [startDate, setStartDate] = useState(coachDate());
  const [endDate, setEndDate] = useState('');
  const [exercises, setExercises] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load coach classes
  const loadData = async () => {
    setLoading(true); setError('');
    try {
      const isManager = currentUser?.role === 'MANAGER';
      const coachClasses = await coachApi.getCoachClassesAndMembers(
        currentUser?.id,
        currentUser?.fullName,
        isManager
      );
      setClasses(coachClasses);

      if (coachClasses.length > 0 && !selectedClassId) {
        setSelectedClassId(coachClasses[0].id);
      }

      // Load all training plans
      const allPlans = await coachApi.getTrainingPlans();
      setPlans(allPlans);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id]);

  // Load members whenever selectedClassId changes
  useEffect(() => {
    let active = true;
    async function loadMembers() {
      setMembers([]); setMembersError('');
      if (!selectedClassId) {
        setMembers([]);
        return;
      }
      try {
        setMembersLoading(true);
        const list = await coachApi.getMembersForClass(selectedClassId);
        if (active) setMembers(list);
      } catch (e) {
        if (active) setMembersError(e.message);
      } finally {
        if (active) setMembersLoading(false);
      }
    }
    loadMembers();
    return () => { active = false; };
  }, [selectedClassId, memberVersion]);

  const selectedClass = classes.find(c => c.id === selectedClassId) || classes[0];

  // Helper: check if a member has a custom personal plan in this class
  const getPersonalPlanForMember = (memberId) => {
    return plans.find(
      p => p.classId === selectedClassId && p.memberId === memberId && p.isCustom
    );
  };

  // Open Personal Plan Modal for a member
  const handleOpenPersonalPlanModal = (memberRow) => {
    setActiveMember(memberRow);
    const existing = plans.find(
      p => p.classId === selectedClassId && p.memberId === memberRow.memberId && p.isCustom
    );

    if (existing) {
      setExistingPlanId(existing.id);
      setPlanTitle(existing.title || `Giáo án cá nhân: ${memberRow.memberName}`);
      setFitnessCondition(existing.fitnessCondition || '');
      setPlanGoal(existing.goal || '');
      setStartDate(existing.startDate || coachDate());
      setEndDate(existing.endDate || '');
      setExercises((existing.exercises || []).map(ex => ({ ...ex })));
    } else {
      setExistingPlanId(null);
      setPlanTitle(`Giáo án riêng biệt: ${memberRow.memberName}`);
      setFitnessCondition(memberRow.medicalNote || '');
      setPlanGoal(memberRow.fitnessGoal || '');
      setStartDate(coachDate());
      setEndDate('');
      setExercises([{ name: '', sets: '', reps: '', note: '' }]);
    }

    setModalOpen(true);
  };

  // Exercise builder handlers
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

  // Save personal training plan -> Star becomes bright solid gold
  const handleSavePersonalPlan = async (e) => {
    e.preventDefault();
    if (!planTitle.trim() || !planGoal.trim()) {
      showError('Vui lòng nhập tên giáo án và mục tiêu riêng!');
      return;
    }

    if (!exercises.length || exercises.some(ex => !ex.name.trim()) || (endDate && endDate < startDate)) {
      showError('Nhập ít nhất một bài tập có tên và khoảng ngày hợp lệ.'); return;
    }
    setSaving(true);
    try {
      await coachApi.savePersonalTrainingPlan({
        classId: selectedClassId,
        className: selectedClass?.name,
        sportName: selectedClass?.sportName,
        memberId: activeMember.memberId,
        memberName: activeMember.memberName,
        coachId: currentUser?.id,
        coachName: currentUser?.fullName || 'Huấn luyện viên',
        title: planTitle.trim(),
        fitnessCondition: fitnessCondition.trim(),
        goal: planGoal.trim(),
        startDate,
        endDate: endDate || null,
        exercises
      });

      showSuccess(`Đã lưu giáo án riêng cho ${activeMember.memberName}! Ngôi sao đánh dấu đã phát sáng ⭐`);
      setModalOpen(false);
      loadData();
    } catch (err) {
      showError(err.message || 'Lỗi khi lưu giáo án riêng');
    } finally {
      setSaving(false);
    }
  };

  // Delete / Remove personal plan -> Star becomes hollow
  const handleDeletePersonalPlan = async () => {
    if (!window.confirm(`Bạn có chắc muốn huỷ giáo án riêng của ${activeMember?.memberName}? Học viên sẽ quay về áp dụng giáo án chung của lớp.`)) {
      return;
    }

    setDeleting(true);
    try {
      await coachApi.deletePersonalTrainingPlan(selectedClassId, activeMember.memberId, currentUser?.fullName);
      showSuccess(`Đã huỷ giáo án riêng cho ${activeMember.memberName}. Ngôi sao đã trở về rỗng.`);
      setModalOpen(false);
      loadData();
    } catch (err) {
      showError('Không thể xóa giáo án riêng');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { header: 'Mục tiêu', accessor: 'fitnessGoal' },
    { header: 'Trình độ', accessor: 'fitnessLevel' },
    {
      header: 'Học Viên',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
            alt=""
            className="w-9 h-9 rounded-full object-cover border border-slate-200"
          />
          <div>
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>{row.memberName}</span>
              {getPersonalPlanForMember(row.memberId) && (
                <span className="material-symbols-outlined text-[15px] text-amber-500 fill-amber-500" title="Đã có giáo án riêng biệt">
                  star
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Mã Thẻ',
      render: (row) => <span className="font-chivo font-bold text-red-600">{row.memberCode}</span>
    },
    {
      header: 'Số Điện Thoại',
      accessor: 'phone'
    },
    {
      header: 'Hồ sơ',
      render: row => <button onClick={() => setProfile(row)} className="text-red-600 font-semibold text-xs underline">Xem hồ sơ</button>
    },
    {
      header: 'Giáo Án Riêng (⭐)',
      render: (row) => {
        const hasCustomPlan = !!getPersonalPlanForMember(row.memberId);
        return (
          <button
            type="button"
            onClick={() => handleOpenPersonalPlanModal(row)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-semibold ${
              hasCustomPlan
                ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs hover:bg-amber-100 ring-2 ring-amber-400/30'
                : 'bg-white border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50/50'
            }`}
            title={
              hasCustomPlan
                ? 'Học viên có thể chất đặc biệt đã được thiết lập giáo án riêng. Bấm để xem / chỉnh sửa / huỷ'
                : 'Học viên có thể trạng khác biệt? Bấm để thiết lập giáo án riêng (tăng/giảm khối lượng)'
            }
          >
            {hasCustomPlan ? (
              <>
                <span className="material-symbols-outlined text-[20px] text-amber-500 drop-shadow-xs">
                  star
                </span>
                <span className="font-chivo font-black uppercase text-[11px] tracking-wide text-amber-700">
                  Có giáo án riêng
                </span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px] text-slate-400 group-hover:text-amber-500 transition-colors">
                  star_outline
                </span>
                <span className="text-[11px] font-medium">Soạn giáo án riêng</span>
              </>
            )}
          </button>
        );
      }
    },
    {
      header: 'Thao Tác Chuyên Môn',
      render: (row) => (
        <div className="flex items-center gap-2">
          <a
            href="#/coach/progress"
            className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold font-chivo uppercase tracking-wider transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">monitor_heart</span>
            <span>Ghi Chỉ Số</span>
          </a>
        </div>
      )
    }
  ];

  if (loading) return <LoadingSpinner text="Đang tải danh sách học viên..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
          MANAGE CLASS MEMBERS
        </span>
        <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
          Danh Sách Học Viên Theo Lớp Học
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Theo dõi hồ sơ học viên theo từng lớp bạn đảm nhiệm và thiết lập giáo án riêng (⭐) cho học viên có thể chất đặc biệt.
        </p>
      </div>

      {/* Class Selector Bar */}
      <CoachError message={error} retry={loadData} />
      <CoachError message={membersError} retry={() => setMemberVersion(v => v + 1)} />
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">
            Chọn lớp học:
          </span>
          {classes.length === 0 ? (
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              Bạn chưa có lớp học nào được phân công.
            </span>
          ) : (
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(Number(e.target.value))}
              className="px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white font-semibold text-slate-900"
            >
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.sportName})
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedClass && (
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <span className="text-slate-500">Sĩ số: <strong className="text-red-600 font-bold">{members.length} / {selectedClass.capacity}</strong></span>
            <span className="text-slate-300">|</span>
            <span className="text-amber-700 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-amber-500 fill-amber-500">star</span>
              <span><strong>{members.filter(m => getPersonalPlanForMember(m.memberId)).length}</strong> giáo án riêng</span>
            </span>
          </div>
        )}
      </div>

      {/* Guide Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3.5 rounded-xl border border-amber-200 text-xs flex items-center justify-between gap-3 text-amber-900">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-600 text-[22px] shrink-0">stars</span>
          <div>
            <span className="font-bold">Quy tắc giáo án riêng:</span> Mọi học viên trong lớp mặc định áp dụng giáo án chung của lớp. Đối với học viên có thể chất khác biệt (cần tăng cường độ hoặc giảm tải), bạn bấm vào biểu tượng <strong>ngôi sao (⭐)</strong> để tạo giáo án riêng. Sau khi lưu, ngôi sao sẽ phát sáng vàng để nhận biết!
          </div>
        </div>
      </div>

      {/* Table */}
      {membersLoading ? <LoadingSpinner text="Đang tải học viên của lớp..." /> : !membersError && !error && <Table
        columns={columns}
        data={members}
        searchKey="memberName"
        searchPlaceholder="Tìm theo tên học viên..."
        emptyMessage="Chưa có học viên nào đặt chỗ cho lớp này"
      />}

      <Modal isOpen={Boolean(profile)} onClose={() => setProfile(null)} title={`Hồ sơ học viên: ${profile?.memberName || ''}`}>
        {profile && <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm break-words">
          {[
            ['Mã thẻ', profile.memberCode], ['Email', profile.email], ['Điện thoại', profile.phone],
            ['Ngày sinh', profile.dateOfBirth], ['Giới tính', profile.gender],
            ['Chiều cao (cm)', profile.heightCm], ['Cân nặng hồ sơ (kg)', profile.weightKg],
            ['Mục tiêu tập luyện', profile.fitnessGoal], ['Trình độ', profile.fitnessLevel], ['Lưu ý thể trạng', profile.medicalNote]
          ].map(([label, value]) => <div key={label}><dt className="text-slate-500 text-xs">{label}</dt><dd className="font-semibold whitespace-pre-wrap mt-1">{value ?? 'Chưa cập nhật'}</dd></div>)}
        </dl>}
      </Modal>

      {/* Modal: Soạn giáo án riêng cho học viên */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          existingPlanId
            ? `Cập Nhật Giáo Án Riêng: ${activeMember?.memberName}`
            : `Soạn Giáo Án Riêng Cho Học Viên: ${activeMember?.memberName}`
        }
        maxWidth="max-w-2xl"
      >
        {activeMember && (
          <form onSubmit={handleSavePersonalPlan} className="space-y-4">
            {/* Header info about the member & class */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={activeMember.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                  alt=""
                  className="w-11 h-11 rounded-full object-cover border-2 border-amber-400 shrink-0"
                />
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span>{activeMember.memberName}</span>
                    <span className="font-chivo text-xs text-red-600">({activeMember.memberCode})</span>
                    {existingPlanId && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px] text-amber-700">star</span>
                        Đang áp dụng giáo án riêng
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Lớp: <strong>{selectedClass?.name}</strong> • SĐT: <strong>{activeMember.phone || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                  CHẾ ĐỘ CÁ NHÂN HÓA
                </span>
                <span className="text-[10px] text-slate-500">Ưu tiên hơn giáo án lớp</span>
              </div>
            </div>

            {/* Row 1: Tên giáo án riêng */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Tên giáo án riêng *
              </label>
              <input
                type="text"
                required
                placeholder="VD: Phác đồ tăng cường sức bền sải bơi hoặc Giảm tải phục hồi cổ chân"
                value={planTitle}
                onChange={e => setPlanTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
              />
            </div>

            {/* Row 2: Thể trạng khác biệt & Lý do điều chỉnh */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Tình trạng thể chất &amp; Lý do điều chỉnh riêng
              </label>
              <input
                type="text"
                placeholder="VD: Học viên có tiền sử giãn dây chằng gối, giảm 30% bài tập plyometric; hoặc Nền tảng thể lực tốt, tăng 2 hiệp"
                value={fitnessCondition}
                onChange={e => setFitnessCondition(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
              />
            </div>

            {/* Row 3: Mục tiêu riêng & Thời hạn */}
            <label className="block text-xs font-bold">Ngày bắt đầu<input aria-label="Ngày bắt đầu giáo án cá nhân" type="date" required className={coachInput} value={startDate} onChange={e => setStartDate(e.target.value)} /></label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Mục tiêu cá nhân hóa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Phục hồi chức năng vận động 100%, nâng VO2 max"
                  value={planGoal}
                  onChange={e => setPlanGoal(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
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
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                />
              </div>
            </div>

            {/* Danh sách bài tập riêng */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Bài tập điều chỉnh riêng cho học viên ({exercises.length})
                  </label>
                  <p className="text-[11px] text-slate-500">Tùy biến số hiệp, số lần lặp và ghi chú kỹ thuật cho học viên này.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddExercise}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1 transition-colors"
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
                      placeholder="Lưu ý riêng"
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
                      title="Xóa bài tập này"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {existingPlanId ? (
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeletePersonalPlan}
                  className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg text-red-600 hover:bg-red-50 border border-red-200 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">star_border</span>
                  <span>{deleting ? 'Đang huỷ...' : 'Huỷ giáo án riêng (Về sao rỗng)'}</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg text-slate-900 bg-amber-400 hover:bg-amber-500 shadow-md transition-all flex items-center gap-1.5 font-chivo"
                >
                  {saving ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px] text-slate-900">star</span>
                      <span>Lưu &amp; Kích Hoạt Giáo Án Riêng</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
