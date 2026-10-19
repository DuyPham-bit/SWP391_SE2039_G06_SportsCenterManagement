import React, { useState, useEffect } from 'react';
import { coachApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.jsx';
import { LoadingSpinner } from '../../components/common/Table.js';
import { Modal } from '../../components/common/Modal.jsx';
import { CoachError } from './CoachShared.jsx';
import { coachDate } from './coachOverview.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function TrainingPlan() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';

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
    { name: isEn ? 'Joint mobility & light jog warmup' : 'Khởi động xoay khớp & chạy nhẹ', sets: '2', reps: isEn ? '5 mins' : '5 phút', note: isEn ? 'Full body warmup' : 'Làm nóng toàn thân' },
    { name: isEn ? 'Core focus movement sets' : 'Bài tập chính chuyên sâu', sets: '4', reps: '10 - 12', note: isEn ? 'RPE 8.0, 60s rest' : 'RPE 8.0, nghỉ 60s' }
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
      { name: isEn ? 'Joint mobility & light jog warmup' : 'Khởi động xoay khớp & chạy nhẹ', sets: '2', reps: isEn ? '5 mins' : '5 phút', note: isEn ? 'Full body warmup' : 'Làm nóng toàn thân' },
      { name: isEn ? 'Core focus movement sets' : 'Bài tập chính chuyên sâu', sets: '4', reps: '10 - 12', note: isEn ? 'RPE 8.0, 60s rest' : 'RPE 8.0, nghỉ 60s' }
    ]);

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
      showError(isEn ? 'Please select an assigned class!' : 'Vui lòng chọn lớp học bạn đang đảm nhiệm!');
      return;
    }
    if (!title.trim() || !goal.trim()) {
      showError(isEn ? 'Please enter a plan title and goal!' : 'Vui lòng nhập tên giáo án và mục tiêu!');
      return;
    }

    if (!startDate || !startDate.trim()) {
      showError(isEn ? 'Please select an effective start date!' : 'Vui lòng chọn ngày bắt đầu áp dụng giáo án!');
      return;
    }

    if (!exercises || !exercises.length || exercises.some(ex => !ex.name || !ex.name.trim())) {
      showError(isEn ? 'Please add at least one exercise with a valid name!' : 'Vui lòng thêm ít nhất một bài tập có tên cụ thể!');
      return;
    }

    if (endDate && endDate < startDate) {
      showError(isEn ? 'End date cannot be earlier than start date.' : 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu.');
      return;
    }
    const currentClass = coachClasses.find(c => c.id === selectedClassId);

    setSaving(true);
    try {
      await coachApi.createTrainingPlan({
        classId: currentClass?.id,
        className: currentClass?.name,
        sportName: currentClass?.sportName,
        isCustom: false,
        memberId: null,
        memberName: null,
        coachId: currentUser?.id,
        coachName: currentUser?.fullName || (isEn ? 'Coach' : 'Huấn luyện viên'),
        title: title.trim(),
        goal: goal.trim(),
        startDate,
        endDate: endDate || null,
        exercises
      });

      showSuccess(isEn ? 'Training plan saved and published to the class!' : 'Đã tạo và ban hành giáo án cho lớp học thành công!');
      setModalOpen(false);
      loadData();
    } catch (err) {
      showError(err.message || (isEn ? 'Failed to save training plan' : 'Lỗi khi lưu giáo án'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (planId, planTitle) => {
    if (!window.confirm(isEn ? `Are you sure you want to delete "${planTitle}"?` : `Bạn có chắc muốn xóa giáo án "${planTitle}"?`)) {
      return;
    }

    try {
      await coachApi.deleteTrainingPlan(planId);
      showSuccess(isEn ? 'Lesson plan removed successfully.' : 'Đã xóa giáo án thành công.');
      loadData();
    } catch (err) {
      showError(err.message || (isEn ? 'Failed to delete plan' : 'Không thể xóa giáo án'));
    }
  };

  const filteredPlans = plans.filter(p => {
    if (selectedFilterClass === 'ALL') return true;
    return p.classId === selectedFilterClass;
  });

  const activeModalClass = coachClasses.find(c => c.id === selectedClassId);

  if (loading) return <LoadingSpinner text={isEn ? "Loading lesson plans..." : "Đang tải danh sách giáo án..."} />;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-[24px] bg-gradient-to-br from-[#32354D] via-[#2B2D42] to-[#1E2235] text-white p-6 sm:p-8 relative overflow-hidden border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#81B29A]/15 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 -bottom-16 w-56 h-56 rounded-full bg-[#F2CC8F]/15 blur-3xl" />

        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[rgba(242,204,143,0.15)] text-[#F2CC8F] text-[11px] font-bold uppercase tracking-widest border border-[rgba(242,204,143,0.3)] mb-2">
            <span className="w-2 h-2 rounded-full bg-[#F2CC8F] animate-pulse" />
            {isEn ? 'Lesson Plans' : 'Giáo án huấn luyện'}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[28px] text-[#F2CC8F]">assignment</span>
            {isEn ? 'Class Lesson Plans & Training Programs' : 'Giáo Án Giảng Dạy & Kế Hoạch Rèn Luyện'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {isEn
              ? 'Create shared class programs and customized personal training plans according to Olympic standards.'
              : 'Thiết lập giáo án rèn luyện thể thao chuẩn Olympic đồng loạt cho cả lớp học hoặc phân tách phác đồ riêng.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="px-5 py-3 rounded-xl bg-[#F2CC8F] hover:bg-[#E07A5F] text-[#1E2235] hover:text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center gap-2 shrink-0 relative z-10 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>{isEn ? 'Create New Plan' : 'Soạn Giáo Án Mới'}</span>
        </button>
      </div>

      <CoachError message={error} retry={loadData} />

      {/* Class Filter Tabs */}
      {coachClasses.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedFilterClass('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all cursor-pointer ${
              selectedFilterClass === 'ALL'
                ? 'bg-[#3D405B] text-[#F2CC8F] shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isEn ? `All Classes (${plans.length})` : `Tất cả lớp (${plans.length})`}
          </button>
          {coachClasses.map(c => {
            const count = plans.filter(p => p.classId === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedFilterClass(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all cursor-pointer ${
                  selectedFilterClass === c.id
                    ? 'bg-[#3D405B] text-[#F2CC8F] shadow-xs'
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
          <div className="font-bold text-slate-700 text-sm">
            {isEn ? 'No lesson plans created for this class yet' : 'Chưa có giáo án nào được tạo cho lớp học này'}
          </div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isEn
              ? 'Click "Create New Plan" to set up a workout program for students in your class.'
              : 'Bấm nút "Soạn Giáo Án Mới" để thiết lập giáo án rèn luyện cho các học viên trong lớp của bạn.'}
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
                        {isEn ? 'CUSTOM PERSONAL PLAN' : 'GIÁO ÁN RIÊNG CÁ NHÂN HÓA'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 font-chivo">
                        <span className="material-symbols-outlined text-[13px]">groups</span>
                        {isEn ? 'SHARED CLASS SYLLABUS' : 'GIÁO ÁN CHUNG CHO LỚP HỌC'}
                      </span>
                    )}
                    {plan.className && (
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {isEn ? `Class: ${plan.className}` : `Lớp: ${plan.className}`}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-[#2D6A4F] bg-[#81B29A]/15 px-2 py-0.5 rounded border border-[#81B29A]/30">
                      {plan.sportName || (isEn ? 'Sports' : 'Thể thao')}
                    </span>
                  </div>
                  <h3 className="font-chivo text-lg font-black text-slate-900 leading-tight">
                    {plan.title}
                  </h3>
                  <div className="text-xs text-slate-500 mt-1">
                    {isEn ? 'Audience: ' : 'Đối tượng: '}
                    <strong className="text-slate-900">
                      {plan.isCustom
                        ? (isEn ? `${plan.memberName} (Personal custom)` : `${plan.memberName} (Học viên riêng)`)
                        : (isEn ? `All enrolled students in ${plan.className || ''}` : `Toàn bộ học viên lớp ${plan.className || ''}`)}
                    </strong> • {isEn ? 'Coach: ' : 'HLV: '}<strong>{plan.coachName}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-bold text-xs uppercase border border-emerald-200">
                    ACTIVE
                  </span>
                  <button
                    onClick={() => handleDeletePlan(plan.id, plan.title)}
                    className="p-1.5 text-slate-400 hover:text-[#E07A5F] rounded-lg hover:bg-[#E07A5F]/10 transition-colors cursor-pointer"
                    title={isEn ? "Delete this plan" : "Xóa giáo án này"}
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="font-bold text-slate-700 block mb-0.5">
                  {isEn ? 'Coaching Goal:' : 'Mục tiêu huấn luyện:'}
                </span>
                <p className="text-slate-600 italic">"{plan.goal}"</p>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  {isEn ? `Exercises in plan (${plan.exercises?.length || 0}):` : `Các bài tập trong giáo án (${plan.exercises?.length || 0}):`}
                </span>
                <div className="space-y-2">
                  {plan.exercises?.map((ex, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-slate-100 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{idx + 1}. {ex.name}</div>
                        <div className="text-[11px] text-slate-500">{ex.note}</div>
                      </div>
                      <div className="text-right font-chivo font-bold text-slate-800 text-[11px] shrink-0">
                        {ex.sets} {isEn ? 'sets x' : 'hiệp x'} {ex.reps}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                <span>
                  {isEn ? 'Duration:' : 'Thời hạn:'} {plan.startDate || (isEn ? 'Start' : 'Bắt đầu')} ➜ {plan.endDate || (isEn ? 'Ongoing' : 'Dài hạn')}
                </span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  {plan.isCustom
                    ? (isEn ? 'Customized for individual student' : 'Áp dụng cho học viên đặc biệt')
                    : (isEn ? 'Applied to whole class' : 'Áp dụng chung cho cả lớp')}
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
        title={isEn ? "Create Class Lesson Plan" : "Soạn Thảo Giáo Án Chung Cho Lớp Học"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSavePlan} className="space-y-4">
          {/* Chọn Lớp học đảm nhiệm */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              {isEn ? 'Select Assigned Class for Plan *' : 'Chọn Lớp Học Đảm Nhiệm Áp Dụng Giáo Án *'}
            </label>
            {coachClasses.length === 0 ? (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                {isEn ? 'You do not have any assigned classes yet.' : 'Bạn chưa có lớp học nào được phân công.'}
              </div>
            ) : (
              <select
                value={selectedClassId}
                onChange={e => handleClassChange(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#81B29A] focus:border-[#81B29A] bg-white font-semibold text-slate-900"
              >
                {coachClasses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.sportName} • {isEn ? 'Enrolled:' : 'Sĩ số:'} {c.members?.length || 0} {isEn ? 'students' : 'học viên'})
                  </option>
                ))}
              </select>
            )}
            {activeModalClass && (
              <div className="text-xs text-slate-600 mt-2 flex flex-wrap items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">group</span>
                  <span>{isEn ? 'Plan will be assigned to all students in the class' : 'Giáo án sẽ áp dụng đồng loạt cho học viên trong lớp'}</span>
                </span>
              </div>
            )}
          </div>

          {/* Row 2: Tên giáo án & Mục tiêu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {isEn ? 'Plan Title *' : 'Tên giáo án *'}
              </label>
              <input
                type="text"
                required
                placeholder={isEn ? "e.g. 50m Stroke Optimization & Strength" : "VD: Tối ưu sải bơi 50m & Tăng cơ"}
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#81B29A] focus:border-[#81B29A] bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {isEn ? 'Specific Training Goal *' : 'Mục tiêu rèn luyện cụ thể *'}
              </label>
              <input
                type="text"
                required
                placeholder={isEn ? "e.g. Improve endurance, gain 1kg lean mass" : "VD: Cải thiện sức bền, tăng 1kg cơ bắp"}
                value={goal}
                onChange={e => setGoal(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#81B29A] focus:border-[#81B29A] bg-white"
              />
            </div>
          </div>

          {/* Row 3: Thời gian áp dụng */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {isEn ? 'Start Date' : 'Ngày bắt đầu'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#81B29A] focus:border-[#81B29A] bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {isEn ? 'End Date' : 'Ngày kết thúc'}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#81B29A] focus:border-[#81B29A] bg-white"
              />
            </div>
          </div>

          {/* Exercise items builder */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {isEn ? 'Detailed Exercise List' : 'Danh sách bài tập chi tiết'}
              </label>
              <button
                type="button"
                onClick={handleAddExercise}
                className="text-xs font-bold text-[#2D6A4F] hover:text-[#1E2235] flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>{isEn ? 'Add Exercise' : 'Thêm bài tập'}</span>
              </button>
            </div>

            {exercises.map((ex, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <input
                    type="text"
                    placeholder={isEn ? "Exercise Name" : "Tên bài tập"}
                    value={ex.name}
                    onChange={e => handleExerciseChange(idx, 'name', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder={isEn ? "Sets" : "Số hiệp"}
                    value={ex.sets}
                    onChange={e => handleExerciseChange(idx, 'sets', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 bg-white text-center"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder={isEn ? "Reps" : "Lặp lại"}
                    value={ex.reps}
                    onChange={e => handleExerciseChange(idx, 'reps', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 bg-white text-center"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder={isEn ? "Technical Notes" : "Lưu ý kỹ thuật"}
                    value={ex.note}
                    onChange={e => handleExerciseChange(idx, 'note', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 bg-white"
                  />
                </div>
                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(idx)}
                    className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                    title={isEn ? "Remove exercise" : "Xóa bài tập"}
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
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
            >
              {isEn ? 'Cancel' : 'Hủy'}
            </button>
            <button
              type="submit"
              disabled={saving || !selectedClassId}
              className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl text-[#1E2235] hover:text-white shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
                saving || !selectedClassId
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-[#F2CC8F] hover:bg-[#E07A5F]'
              }`}
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  <span>{isEn ? 'Saving...' : 'Đang lưu...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>{isEn ? 'Save & Assign Plan' : 'Lưu & Giao Giáo Án'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
