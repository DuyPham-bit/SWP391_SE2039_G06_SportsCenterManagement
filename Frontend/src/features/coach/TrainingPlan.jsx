import React, { useState, useEffect, useMemo } from 'react';
import { coachApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.jsx';
import { LoadingSpinner } from '../../components/common/Table.js';
import { Modal } from '../../components/common/Modal.jsx';
import { CoachError } from './CoachShared.jsx';
import { coachDate } from './coachOverview.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import {
  translateClassName,
  translateSportName,
  translateCoachName,
  translatePlanTitle,
  translatePlanGoal,
  translateExerciseName,
  translateExerciseNote,
  translateReps
} from '../../services/i18nHelper.js';

export function getSportBadgeTheme(sportName = '', isEn = false) {
  const s = String(sportName).toLowerCase();
  if (s.includes('bơi') || s.includes('swim')) {
    return {
      bg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      tagBg: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      dot: 'bg-cyan-500',
      icon: 'pool',
      accent: 'border-l-cyan-500',
      textAccent: 'text-cyan-700',
      label: isEn ? 'Swimming' : 'Bơi lội'
    };
  }
  if (s.includes('yoga') || s.includes('pilates')) {
    return {
      bg: 'bg-purple-50 text-purple-800 border-purple-200',
      tagBg: 'bg-purple-100 text-purple-800 border-purple-300',
      dot: 'bg-purple-500',
      icon: 'self_improvement',
      accent: 'border-l-purple-500',
      textAccent: 'text-purple-700',
      label: 'Yoga & Pilates'
    };
  }
  if (s.includes('cầu lông') || s.includes('badminton')) {
    return {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      tagBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      dot: 'bg-emerald-500',
      icon: 'sports_tennis',
      accent: 'border-l-emerald-500',
      textAccent: 'text-emerald-700',
      label: isEn ? 'Badminton' : 'Cầu lông'
    };
  }
  if (s.includes('gym') || s.includes('fitness')) {
    return {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      tagBg: 'bg-amber-100 text-amber-800 border-amber-300',
      dot: 'bg-amber-500',
      icon: 'fitness_center',
      accent: 'border-l-amber-500',
      textAccent: 'text-amber-700',
      label: 'Gym & Fitness'
    };
  }
  if (s.includes('boxing') || s.includes('võ') || s.includes('kickfit') || s.includes('martial')) {
    return {
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      tagBg: 'bg-rose-100 text-rose-800 border-rose-300',
      dot: 'bg-rose-500',
      icon: 'sports_mma',
      accent: 'border-l-rose-500',
      textAccent: 'text-rose-700',
      label: isEn ? 'Boxing & Martial Arts' : 'Boxing & Võ thuật'
    };
  }
  return {
    bg: 'bg-blue-50 text-blue-800 border-blue-200',
    tagBg: 'bg-blue-100 text-blue-800 border-blue-300',
    dot: 'bg-blue-500',
    icon: 'sports_basketball',
    accent: 'border-l-blue-500',
    textAccent: 'text-blue-700',
    label: translateSportName(sportName, isEn) || (isEn ? 'Sports' : 'Thể thao')
  };
}

const PRESET_PLAN_EXERCISES = {
  smash: [
    { name: 'Bộ chân di chuyển bóng sao 6 góc sân', sets: '4', reps: '1 phút', note: 'Tăng tốc độ hồi sân trọng tâm thấp' },
    { name: 'Tập cổ tay với vợt nặng Training Racket', sets: '3', reps: '20 lần', note: 'Tăng lực phát bóng và độ dẻo cổ tay' },
    { name: 'Đập cầu dốc góc lưới Smash', sets: '4', reps: '15 lần', note: 'Tiếp xúc cầu điểm cao nhất, gập cổ tay dứt khoát' },
    { name: 'Thực chiến phản xạ giao cầu và gài lưới', sets: '3', reps: '10 lần', note: 'Rèn phản xạ gài cầu sát mép lưới' }
  ],
  yoga: [
    { name: 'Thở Pranayama hít sâu bụng 4 nhịp', sets: '1', reps: '5 phút', note: 'Điều hòa hơi thở, làm dịu hệ thần kinh' },
    { name: 'Chuỗi Cat-Cow uốn cột sống', sets: '3', reps: '10 nhịp', note: 'Kéo giãn từng đốt sống, giải tỏa vùng thắt lưng' },
    { name: 'Tư thế chim bồ câu Pigeon Pose', sets: '3', reps: '45 giây/bên', note: 'Mở khớp hông sâu, giải phóng căng thẳng cơ mông' },
    { name: 'Tư thế rắn hổ mang Cobra Pose', sets: '3', reps: '30 giây', note: 'Mở rộng lồng ngực, tăng cường sức mạnh cột sống' }
  ],
  hypertrophy: [
    { name: 'Khởi động động lực học xoay vai & foam roller', sets: '2', reps: '5 phút', note: 'Làm nóng khớp xoay vai và giãn mạc cơ' },
    { name: 'Barbell Bench Press (Đẩy ngực đòn ngang)', sets: '4', reps: '8 - 10', note: 'RPE 8.0, nghỉ 90s, tempo 3-0-1' },
    { name: 'Incline Dumbbell Press (Đẩy tạ đơn ngực trên)', sets: '3', reps: '10 - 12', note: 'Ép cơ ngực trên ở đỉnh chuyển động' },
    { name: 'Lat Pulldown (Kéo xô máy rộng tay)', sets: '4', reps: '10 - 12', note: 'Kéo sát ngực trên, siết chặt cơ xô ở đáy' }
  ],
  swim: [
    { name: 'Khởi động xoay khớp vai & gân gối trên cạn', sets: '2', reps: '5 phút', note: 'Tăng biên độ vận động khớp trước khi xuống nước' },
    { name: 'Đạp chân sải với phao tim Kickboard', sets: '4', reps: '50m', note: 'Đập chân từ hông, mũi chân duỗi thẳng, giữ hông nổi' },
    { name: 'Quạt tay sải kẹp phao Pullbuoy', sets: '4', reps: '100m', note: 'Tối ưu góc cùi chỏ cao High-Elbow Catch dưới nước' },
    { name: 'Bơi phối hợp biến tốc Interval', sets: '3', reps: '100m', note: 'Nhịp thở 2 bên (3 nhịp quạt 1 nhịp thở), nghỉ 30s giữa hiệp' }
  ],
  boxing: [
    { name: 'Nhảy dây tăng tốc Footwork', sets: '3', reps: '3 phút', note: 'Nhẹ gót chân, giữ nhịp thở đều đặn' },
    { name: 'Đấm gió Shadow Boxing', sets: '3', reps: '3 phút', note: 'Tập trung vào tư thế phòng thủ và hồi tay nhanh' },
    { name: 'Đánh Pad tổ hợp đòn Jab-Cross-Hook', sets: '4', reps: '12 tổ hợp', note: 'Xoay hông và dồn trọng tâm khi ra đòn Hook' },
    { name: 'Bài tập né đòn Slip và Roll', sets: '3', reps: '15 lần', note: 'Hạ thấp trọng tâm bằng gối, mắt không rời đối thủ' }
  ]
};

export function getResolvedExercises(plan) {
  if (Array.isArray(plan?.exercises) && plan.exercises.length > 0) {
    return plan.exercises;
  }
  const text = `${plan?.title || ''} ${plan?.sportName || ''} ${plan?.goal || ''}`.toLowerCase();
  if (text.includes('smash') || text.includes('cầu lông') || text.includes('badminton') || text.includes('bộ chân')) {
    return PRESET_PLAN_EXERCISES.smash;
  }
  if (text.includes('yoga') || text.includes('cột sống') || text.includes('khớp hông') || text.includes('pilates')) {
    return PRESET_PLAN_EXERCISES.yoga;
  }
  if (text.includes('hypertrophy') || text.includes('tăng cơ') || text.includes('gym') || text.includes('thân trên') || text.includes('bench press')) {
    return PRESET_PLAN_EXERCISES.hypertrophy;
  }
  if (text.includes('bơi') || text.includes('swim') || text.includes('olympic') || text.includes('sải')) {
    return PRESET_PLAN_EXERCISES.swim;
  }
  if (text.includes('boxing') || text.includes('kickfit') || text.includes('đấm') || text.includes('võ')) {
    return PRESET_PLAN_EXERCISES.boxing;
  }
  return [];
}

export function TrainingPlan() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [coachClasses, setCoachClasses] = useState([]);
  const [selectedFilterClass, setSelectedFilterClass] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'CUSTOM' | 'CLASS'
  const [searchQuery, setSearchQuery] = useState('');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Detail Modal State
  const [selectedPlanDetail, setSelectedPlanDetail] = useState(null);

  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editingMemberName, setEditingMemberName] = useState('');
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
    setEditingPlanId(null);
    setIsEditingCustom(false);
    setEditingMemberId(null);
    setEditingMemberName('');
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

  const handleOpenEditModal = (plan) => {
    setEditingPlanId(plan.id);
    setIsEditingCustom(Boolean(plan.isCustom));
    setEditingMemberId(plan.memberId || null);
    setEditingMemberName(plan.memberName || '');
    setSelectedClassId(plan.classId);
    setTitle(plan.title || '');
    setGoal(plan.goal || '');
    setStartDate(plan.startDate || coachDate());
    setEndDate(plan.endDate || '');

    const resolved = getResolvedExercises(plan);
    setExercises(resolved.length > 0 ? resolved.map(e => ({ ...e })) : [
      { name: '', sets: '3', reps: '10', note: '' }
    ]);
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
      if (isEditingCustom && editingMemberId) {
        await coachApi.savePersonalTrainingPlan({
          classId: currentClass?.id,
          className: currentClass?.name,
          sportName: currentClass?.sportName,
          memberId: editingMemberId,
          memberName: editingMemberName,
          coachId: currentUser?.id,
          coachName: currentUser?.fullName || (isEn ? 'Coach' : 'Huấn luyện viên'),
          title: title.trim(),
          goal: goal.trim(),
          startDate,
          endDate: endDate || null,
          exercises
        });
        showSuccess(isEn ? 'Personal training plan updated successfully!' : 'Đã cập nhật giáo án riêng cá nhân hóa thành công!');
      } else {
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
      }

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
      if (selectedPlanDetail?.id === planId) {
        setSelectedPlanDetail(null);
      }
      loadData();
    } catch (err) {
      showError(err.message || (isEn ? 'Failed to delete plan' : 'Không thể xóa giáo án'));
    }
  };

  // Deduplicated class list with plan counts and disambiguated names
  const classFilterList = useMemo(() => {
    const nameCounts = {};
    coachClasses.forEach(c => {
      nameCounts[c.name] = (nameCounts[c.name] || 0) + 1;
    });

    return coachClasses.map(c => {
      const isDupe = nameCounts[c.name] > 1;
      const count = plans.filter(p => p.classId === c.id).length;
      const displayName = isDupe ? `${c.name} (${c.sportName || `ID #${c.id}`})` : c.name;
      return {
        id: c.id,
        name: c.name,
        displayName,
        sportName: c.sportName,
        count
      };
    }).sort((a, b) => {
      if (a.count > 0 && b.count === 0) return -1;
      if (a.count === 0 && b.count > 0) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [coachClasses, plans]);

  // KPI Statistics
  const stats = useMemo(() => {
    const total = plans.length;
    const custom = plans.filter(p => p.isCustom).length;
    const classCount = plans.filter(p => !p.isCustom).length;
    const sports = new Set(plans.map(p => p.sportName).filter(Boolean)).size;
    return { total, custom, classCount, sports };
  }, [plans]);

  // Filtered plans based on Class, Type, and Search query
  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      if (selectedFilterClass !== 'ALL' && p.classId !== selectedFilterClass) return false;
      if (typeFilter === 'CUSTOM' && !p.isCustom) return false;
      if (typeFilter === 'CLASS' && p.isCustom) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (p.title || '').toLowerCase().includes(q);
        const matchGoal = (p.goal || '').toLowerCase().includes(q);
        const matchStudent = (p.memberName || '').toLowerCase().includes(q);
        const matchClass = (p.className || '').toLowerCase().includes(q);
        const matchSport = (p.sportName || '').toLowerCase().includes(q);
        if (!matchTitle && !matchGoal && !matchStudent && !matchClass && !matchSport) return false;
      }
      return true;
    });
  }, [plans, selectedFilterClass, typeFilter, searchQuery]);

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
            {isEn ? 'Olympic Training Programs' : 'Giáo Án Rèn Luyện Olympic'}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[28px] text-[#F2CC8F]">assignment</span>
            {isEn ? 'Class Lesson Plans & Training Programs' : 'Giáo Án Giảng Dạy & Kế Hoạch Rèn Luyện'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {isEn
              ? 'Establish standardized athletic curriculums, customized progression pathways, and targeted exercise routines.'
              : 'Thiết lập giáo án rèn luyện thể thao chuẩn Olympic đồng loạt cho cả lớp học hoặc phân tách phác đồ riêng cho từng học viên.'}
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

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">assignment</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isEn ? 'Total Plans' : 'Tổng giáo án'}
            </div>
            <div className="text-xl font-black text-slate-900 font-chivo">
              {stats.total} <span className="text-xs font-normal text-slate-500">{isEn ? 'curriculums' : 'bản'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">star</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isEn ? 'Personal Plans' : 'Phác đồ cá nhân'}
            </div>
            <div className="text-xl font-black text-amber-700 font-chivo">
              {stats.custom} <span className="text-xs font-normal text-slate-500">{isEn ? 'members' : 'học viên'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">groups</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isEn ? 'Class Syllabi' : 'Giáo án toàn lớp'}
            </div>
            <div className="text-xl font-black text-emerald-700 font-chivo">
              {stats.classCount} <span className="text-xs font-normal text-slate-500">{isEn ? 'classes' : 'lớp'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">sports</span>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isEn ? 'Sports Covered' : 'Bộ môn áp dụng'}
            </div>
            <div className="text-xl font-black text-purple-700 font-chivo">
              {stats.sports} <span className="text-xs font-normal text-slate-500">{isEn ? 'sports' : 'môn'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isEn ? "Search by plan title, student name, goal, or sport..." : "Tìm kiếm theo tên giáo án, học viên, mục tiêu hoặc bộ môn..."}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#81B29A] focus:border-[#81B29A] bg-slate-50/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isEn ? `All (${plans.length})` : `Tất cả (${plans.length})`}
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('CUSTOM')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                typeFilter === 'CUSTOM'
                  ? 'bg-amber-100 text-amber-900 shadow-xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">star</span>
              <span>{isEn ? `Custom (${stats.custom})` : `Cá nhân (${stats.custom})`}</span>
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('CLASS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                typeFilter === 'CLASS'
                  ? 'bg-blue-100 text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">groups</span>
              <span>{isEn ? `Class (${stats.classCount})` : `Cả lớp (${stats.classCount})`}</span>
            </button>
          </div>
        </div>

        {/* Class Filter Tabs */}
        {classFilterList.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setSelectedFilterClass('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider transition-all cursor-pointer shrink-0 ${
                selectedFilterClass === 'ALL'
                  ? 'bg-[#3D405B] text-[#F2CC8F] shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isEn ? `All Classes (${plans.length})` : `Tất cả lớp (${plans.length})`}
            </button>
            {classFilterList.map(c => {
              const sportTheme = getSportBadgeTheme(c.sportName, isEn);
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedFilterClass(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    selectedFilterClass === c.id
                      ? 'bg-[#3D405B] text-[#F2CC8F] shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[15px] ${selectedFilterClass === c.id ? 'text-[#F2CC8F]' : 'text-slate-400'}`}>
                    {sportTheme.icon}
                  </span>
                  <span>{translateClassName(c.displayName, isEn)}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    c.count > 0
                      ? (selectedFilterClass === c.id ? 'bg-[#F2CC8F]/20 text-[#F2CC8F]' : 'bg-slate-100 text-slate-700')
                      : 'text-slate-400'
                  }`}>
                    {c.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Existing Plans Cards Grid */}
      {filteredPlans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 space-y-3">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <span className="material-symbols-outlined text-3xl">assignment_late</span>
          </div>
          <div className="font-bold text-slate-800 text-base">
            {isEn ? 'No lesson plans found' : 'Không tìm thấy giáo án nào phù hợp'}
          </div>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {isEn
              ? 'Try adjusting your search criteria or class filter, or click "Create New Plan" to design a new program.'
              : 'Hãy thử thay đổi điều kiện tìm kiếm hoặc bấm nút "Soạn Giáo Án Mới" để thiết lập chương trình rèn luyện.'}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F2CC8F] hover:bg-[#E07A5F] text-[#1E2235] hover:text-white font-bold text-xs uppercase transition-all shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>{isEn ? 'Create Plan Now' : 'Soạn Giáo Án Ngay'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPlans.map(plan => {
            const sportTheme = getSportBadgeTheme(plan.sportName, isEn);
            const resolvedExercises = getResolvedExercises(plan);

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between border-l-[6px] ${sportTheme.accent}`}
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Top Badges Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Sport Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${sportTheme.tagBg}`}>
                        <span className="material-symbols-outlined text-[15px]">{sportTheme.icon}</span>
                        <span>{sportTheme.label}</span>
                      </span>

                      {/* Type Badge */}
                      {plan.isCustom ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-amber-500">star</span>
                          <span>{isEn ? 'Custom Personal Plan' : 'Giáo án riêng cá nhân'}</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-blue-500">groups</span>
                          <span>{isEn ? 'Class Syllabus' : 'Giáo án toàn lớp'}</span>
                        </span>
                      )}

                      {/* Class Badge */}
                      {plan.className && (
                        <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-slate-400">school</span>
                          <span>{translateClassName(plan.className, isEn)}</span>
                        </span>
                      )}
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] uppercase border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>ACTIVE</span>
                      </span>
                    </div>
                  </div>

                  {/* Plan Title */}
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                      {translatePlanTitle(plan.title, isEn)}
                    </h3>
                  </div>

                  {/* Audience & Coach Details Card */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-[18px] ${plan.isCustom ? 'text-amber-500' : 'text-blue-500'}`}>
                        {plan.isCustom ? 'person' : 'groups'}
                      </span>
                      <div>
                        <span className="text-slate-500">{isEn ? 'Audience: ' : 'Đối tượng: '}</span>
                        <strong className="text-slate-900">
                          {plan.isCustom
                            ? (isEn ? `${plan.memberName} (Personal)` : `${plan.memberName} (Học viên riêng)`)
                            : (isEn ? `All students in ${translateClassName(plan.className, isEn)}` : `Toàn bộ học viên lớp`)}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] shrink-0">
                      <span className="material-symbols-outlined text-[15px] text-slate-400">sports</span>
                      <span>{isEn ? 'Coach: ' : 'HLV: '}</span>
                      <strong className="text-slate-700">{translateCoachName(plan.coachName, isEn)}</strong>
                    </div>
                  </div>

                  {/* Coaching Goal Block */}
                  <div className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-100/80 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px] uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[15px] text-amber-600">flag</span>
                      <span>{isEn ? 'Coaching Goal' : 'Mục tiêu huấn luyện'}</span>
                    </div>
                    <p className="text-slate-700 italic pl-5 leading-relaxed font-medium">
                      "{translatePlanGoal(plan.goal, isEn)}"
                    </p>
                  </div>

                  {/* Exercises List Section */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">fitness_center</span>
                        <span>{isEn ? `Exercises in plan (${resolvedExercises.length})` : `Các bài tập trong giáo án (${resolvedExercises.length}):`}</span>
                      </span>
                    </div>

                    {resolvedExercises.length > 0 ? (
                      <div className="space-y-2">
                        {resolvedExercises.slice(0, 4).map((ex, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate">
                                  {translateExerciseName(ex.name, isEn)}
                                </div>
                                {ex.note && (
                                  <div className="text-[11px] text-slate-500 italic truncate">
                                    {translateExerciseNote(ex.note, isEn)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right font-chivo font-black text-slate-800 text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 shrink-0 border border-slate-200">
                              {ex.sets} {isEn ? 'sets ×' : 'hiệp ×'} {translateReps(ex.reps, isEn)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500 space-y-1.5">
                        <span className="material-symbols-outlined text-[24px] text-slate-300">fitness_center</span>
                        <div>{isEn ? 'No exercises added yet' : 'Chưa cập nhật chi tiết bài tập'}</div>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(plan)}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          + {isEn ? 'Add exercises now' : 'Bổ sung bài tập ngay'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer with Duration & Action Buttons */}
                <div className="px-5 py-3.5 bg-slate-50/90 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-slate-400">calendar_month</span>
                    <span>
                      {isEn ? 'Period: ' : 'Thời hạn: '}
                      <strong className="text-slate-700">{plan.startDate || '2026-10-01'}</strong> ➜ <strong className="text-slate-700">{plan.endDate || (isEn ? 'Ongoing' : 'Dài hạn')}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {/* View Details Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedPlanDetail(plan)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                      title={isEn ? "View complete details" : "Xem toàn bộ giáo án"}
                    >
                      <span className="material-symbols-outlined text-[15px] text-slate-500">visibility</span>
                      <span>{isEn ? 'Details' : 'Chi tiết'}</span>
                    </button>

                    {/* Edit / Add Exercises Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(plan)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#1E2235] hover:border-slate-300 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                      title={isEn ? "Edit plan and exercises" : "Chỉnh sửa bài tập và mục tiêu"}
                    >
                      <span className="material-symbols-outlined text-[15px] text-slate-500">edit</span>
                      <span>{isEn ? 'Edit' : 'Sửa'}</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDeletePlan(plan.id, plan.title)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title={isEn ? "Delete this plan" : "Xóa giáo án này"}
                    >
                      <span className="material-symbols-outlined text-[17px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plan Details Modal */}
      {selectedPlanDetail && (
        <Modal
          isOpen={Boolean(selectedPlanDetail)}
          onClose={() => setSelectedPlanDetail(null)}
          title={isEn ? "Detailed Olympic Lesson Plan" : "Chi Tiết Giáo Án Huấn Luyện Chuẩn Olympic"}
          maxWidth="max-w-3xl"
        >
          {(() => {
            const plan = selectedPlanDetail;
            const sportTheme = getSportBadgeTheme(plan.sportName, isEn);
            const resolvedExercises = getResolvedExercises(plan);

            return (
              <div className="space-y-5">
                {/* Modal Header Strip */}
                <div className={`p-4 rounded-2xl border ${sportTheme.bg} flex flex-wrap items-center justify-between gap-3`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${sportTheme.tagBg} flex items-center gap-1`}>
                        <span className="material-symbols-outlined text-[15px]">{sportTheme.icon}</span>
                        <span>{sportTheme.label}</span>
                      </span>
                      {plan.isCustom ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          {isEn ? 'Custom Personal' : 'Phác đồ cá nhân'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          {isEn ? 'Class Syllabus' : 'Giáo án toàn lớp'}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-black text-slate-900">
                      {translatePlanTitle(plan.title, isEn)}
                    </h2>
                  </div>

                  <div className="text-right text-xs text-slate-600">
                    <div>{isEn ? 'Status: ' : 'Trạng thái: '}<strong className="text-emerald-700 font-black">ACTIVE</strong></div>
                    <div className="text-[11px] text-slate-500">{isEn ? 'Coach: ' : 'HLV: '}{translateCoachName(plan.coachName, isEn)}</div>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-slate-500 font-bold mb-1 uppercase tracking-wider text-[10px]">
                      {isEn ? 'Target Audience' : 'Đối tượng áp dụng'}
                    </div>
                    <div className="font-bold text-slate-900">
                      {plan.isCustom ? plan.memberName : (translateClassName(plan.className, isEn) || (isEn ? 'Whole Class' : 'Cả lớp'))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-slate-500 font-bold mb-1 uppercase tracking-wider text-[10px]">
                      {isEn ? 'Enrolled Class' : 'Lớp học'}
                    </div>
                    <div className="font-bold text-slate-900">
                      {translateClassName(plan.className, isEn) || 'Olympic Course'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-slate-500 font-bold mb-1 uppercase tracking-wider text-[10px]">
                      {isEn ? 'Effective Period' : 'Thời gian hiệu lực'}
                    </div>
                    <div className="font-bold text-slate-900">
                      {plan.startDate || '2026-10-01'} ➜ {plan.endDate || (isEn ? 'Ongoing' : 'Dài hạn')}
                    </div>
                  </div>
                </div>

                {/* Goal Quote */}
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 text-xs space-y-1">
                  <div className="font-bold uppercase tracking-wider text-amber-900 text-[11px] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-amber-600">flag</span>
                    <span>{isEn ? 'Primary Coaching Goal' : 'Mục tiêu huấn luyện trọng điểm'}</span>
                  </div>
                  <p className="text-slate-800 italic pl-5 leading-relaxed font-semibold">
                    "{translatePlanGoal(plan.goal, isEn)}"
                  </p>
                </div>

                {/* Full Exercises Table */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-slate-500">list_alt</span>
                    <span>{isEn ? `Comprehensive Exercise Routine (${resolvedExercises.length} drills)` : `Danh mục bài tập rèn luyện chi tiết (${resolvedExercises.length} bài)`}</span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">#</th>
                          <th className="py-2.5 px-3">{isEn ? 'Exercise Drill' : 'Tên bài tập'}</th>
                          <th className="py-2.5 px-3 w-28 text-center">{isEn ? 'Sets x Reps' : 'Khối lượng'}</th>
                          <th className="py-2.5 px-3">{isEn ? 'Technical Notes' : 'Hướng dẫn kỹ thuật'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {resolvedExercises.map((ex, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{translateExerciseName(ex.name, isEn)}</td>
                            <td className="py-2.5 px-3 text-center font-chivo font-black text-slate-800 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                                {ex.sets} {isEn ? 'sets x' : 'hiệp x'} {translateReps(ex.reps, isEn)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 italic">{translateExerciseNote(ex.note, isEn) || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">print</span>
                    <span>{isEn ? 'Print Plan' : 'In Giáo Án'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlanDetail(null);
                        handleOpenEditModal(plan);
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      <span>{isEn ? 'Edit Plan' : 'Chỉnh Sửa'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPlanDetail(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs cursor-pointer"
                    >
                      {isEn ? 'Close' : 'Đóng'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Create / Edit Plan Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingPlanId
            ? (isEn ? "Edit Lesson Plan & Exercises" : "Chỉnh Sửa Giáo Án & Bài Tập")
            : (isEn ? "Create Class Lesson Plan" : "Soạn Thảo Giáo Án Chung Cho Lớp Học")
        }
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
                disabled={Boolean(editingPlanId)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#81B29A] focus:border-[#81B29A] bg-white font-semibold text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
              >
                {coachClasses.map(c => (
                  <option key={c.id} value={c.id}>
                    {translateClassName(c.name, isEn)} ({translateSportName(c.sportName, isEn)} • {isEn ? 'Enrolled:' : 'Sĩ số:'} {c.members?.length || 0} {isEn ? 'students' : 'học viên'})
                  </option>
                ))}
              </select>
            )}
            {activeModalClass && (
              <div className="text-xs text-slate-600 mt-2 flex flex-wrap items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">group</span>
                  <span>
                    {isEditingCustom && editingMemberName
                      ? (isEn ? `Applied specifically to member: ${editingMemberName}` : `Áp dụng riêng cho học viên: ${editingMemberName}`)
                      : (isEn ? 'Plan will be assigned to all students in the class' : 'Giáo án sẽ áp dụng đồng loạt cho học viên trong lớp')}
                  </span>
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
                  <span>{editingPlanId ? (isEn ? 'Update Plan' : 'Cập Nhật Giáo Án') : (isEn ? 'Save & Assign Plan' : 'Lưu & Giao Giáo Án')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
