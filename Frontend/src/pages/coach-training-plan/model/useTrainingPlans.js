import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../entities/session/index.js';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { coachDate, coachApi } from '../../../entities/coach/index.js';
import { getResolvedExercises } from '../lib/planPresets.js';

export function useTrainingPlans() {
  const { currentUser } = useAuth();
  const { showSuccess, showError, confirm } = useToast();
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
    const ok = await confirm({
      title: isEn ? 'Delete Training Plan' : 'Xác nhận xóa giáo án',
      message: isEn ? `Are you sure you want to delete "${planTitle}"?` : `Bạn có chắc chắn muốn xóa giáo án "${planTitle}"?`,
      detail: isEn ? 'This lesson plan and all associated exercises will be permanently removed.' : 'Giáo án này và toàn bộ danh sách bài tập kèm theo sẽ bị xóa khỏi hệ thống.',
      confirmText: isEn ? 'Delete Plan' : 'Xóa giáo án',
      cancelText: isEn ? 'Cancel' : 'Hủy bỏ',
      type: 'danger'
    });
    if (!ok) return;

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

  return {
    activeModalClass, classFilterList, coachClasses, editingMemberName, editingPlanId, endDate,
    error, exercises, filteredPlans, goal, handleAddExercise, handleClassChange, handleDeletePlan,
    handleExerciseChange, handleOpenCreateModal, handleOpenEditModal, handleRemoveExercise,
    handleSavePlan, isEditingCustom, isEn, loadData, loading, modalOpen, plans, saving, searchQuery,
    selectedClassId, selectedFilterClass, selectedPlanDetail, setEndDate, setGoal, setModalOpen,
    setSearchQuery, setSelectedFilterClass, setSelectedPlanDetail, setStartDate, setTitle,
    setTypeFilter, startDate, stats, title, typeFilter
  };
}
