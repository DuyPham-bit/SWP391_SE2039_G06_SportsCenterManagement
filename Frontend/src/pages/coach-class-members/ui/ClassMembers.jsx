import React, { useState, useEffect } from 'react';
import { coachApi, coachDate } from '../../../entities/coach/index.js';
import { useAuth } from '../../../entities/session/index.js';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { Table, LoadingSpinner } from '../../../shared/ui/Table.jsx';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { CoachError, coachInput } from '../../../features/coach-workspace/index.js';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { translateClassName, translateSportName } from '../../../shared/i18n/i18nHelper.js';

export function ClassMembers() {
  const { currentUser } = useAuth();
  const { showSuccess, showError, confirm } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';

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
      setPlanTitle(existing.title || (isEn ? `Personal Plan: ${memberRow.memberName}` : `Giáo án cá nhân: ${memberRow.memberName}`));
      setFitnessCondition(existing.fitnessCondition || '');
      setPlanGoal(existing.goal || '');
      setStartDate(existing.startDate || coachDate());
      setEndDate(existing.endDate || '');
      setExercises((existing.exercises || []).map(ex => ({ ...ex })));
    } else {
      setExistingPlanId(null);
      setPlanTitle(isEn ? `Custom Plan: ${memberRow.memberName}` : `Giáo án riêng biệt: ${memberRow.memberName}`);
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
      showError(isEn ? 'Please enter a plan title and specific fitness goal!' : 'Vui lòng nhập tên giáo án và mục tiêu riêng!');
      return;
    }

    if (!startDate || !startDate.trim()) {
      showError(isEn ? 'Please choose an effective start date!' : 'Vui lòng chọn ngày bắt đầu áp dụng giáo án!');
      return;
    }

    if (!exercises.length || exercises.some(ex => !ex.name.trim()) || (endDate && endDate < startDate)) {
      showError(isEn ? 'Please add at least one valid exercise and a valid date range.' : 'Nhập ít nhất một bài tập có tên và khoảng ngày hợp lệ.');
      return;
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
        coachName: currentUser?.fullName || (isEn ? 'Coach' : 'Huấn luyện viên'),
        title: planTitle.trim(),
        fitnessCondition: fitnessCondition.trim(),
        goal: planGoal.trim(),
        startDate,
        endDate: endDate || null,
        exercises
      });

      showSuccess(isEn ? `Custom plan saved for ${activeMember.memberName}! Star indicator active ⭐` : `Đã lưu giáo án riêng cho ${activeMember.memberName}! Ngôi sao đánh dấu đã phát sáng ⭐`);
      setModalOpen(false);
      loadData();
    } catch (err) {
      showError(err.message || (isEn ? 'Error saving custom plan' : 'Lỗi khi lưu giáo án riêng'));
    } finally {
      setSaving(false);
    }
  };

  // Delete / Remove personal plan -> Star becomes hollow
  const handleDeletePersonalPlan = async () => {
    const ok = await confirm({
      title: isEn ? 'Remove Custom Syllabus' : 'Xác nhận hủy giáo án riêng',
      message: isEn
        ? `Are you sure you want to remove the custom plan for ${activeMember?.memberName}?`
        : `Bạn có chắc muốn hủy giáo án riêng của ${activeMember?.memberName}?`,
      detail: isEn
        ? 'The student will revert to the standard class syllabus.'
        : 'Học viên sẽ quay về áp dụng giáo án chung của lớp.',
      confirmText: isEn ? 'Remove Plan' : 'Hủy giáo án',
      cancelText: isEn ? 'Keep Plan' : 'Giữ lại',
      type: 'danger'
    });
    if (!ok) {
      return;
    }

    setDeleting(true);
    try {
      await coachApi.deletePersonalTrainingPlan(selectedClassId, activeMember.memberId, currentUser?.fullName);
      showSuccess(isEn ? `Removed custom plan for ${activeMember.memberName}.` : `Đã huỷ giáo án riêng cho ${activeMember.memberName}. Ngôi sao đã trở về rỗng.`);
      setModalOpen(false);
      loadData();
    } catch (err) {
      showError(isEn ? 'Failed to remove custom plan' : 'Không thể xóa giáo án riêng');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      header: isEn ? 'Goal' : 'Mục tiêu',
      render: row => row.fitnessGoal?.trim() ? (
        <span className="font-medium text-brand-navy-800">{row.fitnessGoal}</span>
      ) : (
        <span className="text-brand-navy-400 italic text-xs">{isEn ? 'Not updated' : 'Chưa cập nhật'}</span>
      )
    },
    {
      header: isEn ? 'Level' : 'Trình độ',
      render: row => row.fitnessLevel?.trim() ? (
        <span className="font-semibold text-brand-teal-700 bg-brand-teal-50 px-2 py-0.5 rounded-md text-xs">{row.fitnessLevel}</span>
      ) : (
        <span className="text-brand-navy-400 italic text-xs">{isEn ? 'Not evaluated' : 'Chưa đánh giá'}</span>
      )
    },
    {
      header: isEn ? 'Student' : 'Học Viên',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
            onError={e => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';
            }}
            alt={row.memberName || 'Student'}
            className="w-9 h-9 rounded-full object-cover border border-brand-navy-200 shrink-0"
          />
          <div>
            <div className="font-bold text-brand-navy-900 flex items-center gap-1.5">
              <span>{row.memberName}</span>
              {getPersonalPlanForMember(row.memberId) && (
                <span className="material-symbols-outlined text-[15px] text-brand-sand-700 dark:text-brand-sand-400 fill-brand-sand-500" title={isEn ? "Personal custom plan active" : "Đã có giáo án riêng biệt"}>
                  star
                </span>
              )}
            </div>
            <div className="text-xs text-brand-navy-500">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      header: isEn ? 'Card / Code' : 'Mã Thẻ',
      className: 'whitespace-nowrap min-w-[130px]',
      render: (row) => (
        <span className="font-bold font-mono text-brand-navy-900 bg-brand-sage-500/15 px-2.5 py-1 rounded-md border border-brand-sage-500/30 text-xs whitespace-nowrap inline-block">
          {row.memberCode}
        </span>
      )
    },
    {
      header: isEn ? 'Phone Number' : 'Số Điện Thoại',
      accessor: 'phone',
      className: 'whitespace-nowrap min-w-[130px]'
    },
    {
      header: isEn ? 'Profile' : 'Hồ sơ',
      className: 'whitespace-nowrap min-w-[90px]',
      render: row => (
        <button onClick={() => setProfile(row)} className="text-brand-navy-700 hover:text-brand-terra-500 font-semibold text-xs underline transition-colors cursor-pointer whitespace-nowrap">
          {isEn ? 'View Profile' : 'Xem hồ sơ'}
        </button>
      )
    },
    {
      header: isEn ? 'Personal Plan (⭐)' : 'Giáo Án Riêng (⭐)',
      className: 'whitespace-nowrap min-w-[180px]',
      render: (row) => {
        const hasCustomPlan = !!getPersonalPlanForMember(row.memberId);
        return (
          <button
            type="button"
            onClick={() => handleOpenPersonalPlanModal(row)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-semibold whitespace-nowrap ${
              hasCustomPlan
                ? 'bg-brand-sand-50 border-brand-sand-300 text-brand-sand-900 shadow-xs hover:bg-brand-sand-100 ring-2 ring-brand-sand-400/30'
                : 'bg-white border-brand-navy-200 text-brand-navy-500 hover:text-brand-sand-700 hover:border-brand-sand-300 hover:bg-brand-sand-50/50'
            }`}
            title={
              hasCustomPlan
                ? (isEn ? 'Student has a customized training plan. Click to view / edit / delete' : 'Học viên có thể chất đặc biệt đã được thiết lập giáo án riêng. Bấm để xem / chỉnh sửa / huỷ')
                : (isEn ? 'Different conditioning needs? Click to set up a custom plan' : 'Học viên có thể trạng khác biệt? Bấm để thiết lập giáo án riêng (tăng/giảm khối lượng)')
            }
          >
            {hasCustomPlan ? (
              <>
                <span className="material-symbols-outlined text-[20px] text-brand-sand-700 dark:text-brand-sand-400 drop-shadow-xs">
                  star
                </span>
                <span className="font-chivo font-black uppercase text-[11px] tracking-wide text-brand-sand-700 dark:text-brand-sand-400">
                  {isEn ? 'Custom Plan Active' : 'Có giáo án riêng'}
                </span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px] text-brand-navy-400 group-hover:text-brand-sand-700 transition-colors">
                  star_outline
                </span>
                <span className="text-[11px] font-medium">{isEn ? 'Custom Plan' : 'Soạn giáo án riêng'}</span>
              </>
            )}
          </button>
        );
      }
    },
    {
      header: isEn ? 'Actions' : 'Thao Tác Chuyên Môn',
      className: 'whitespace-nowrap min-w-[140px]',
      render: () => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <a
            href="#/coach/progress"
            className="px-3 py-1.5 rounded-lg bg-brand-sage-500/15 hover:bg-brand-sage-500/25 text-brand-sage-700 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">monitor_heart</span>
            <span>{isEn ? 'Log Vitals' : 'Ghi Chỉ Số'}</span>
          </a>
        </div>
      )
    }
  ];

  if (loading) return <LoadingSpinner text={isEn ? "Loading student roster..." : "Đang tải danh sách học viên..."} />;

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER BANNER */}
      <div className="scms-hero rounded-3xl bg-gradient-to-r from-brand-sage-700 via-brand-teal-600 via-brand-teal-500 to-brand-sand-500 dark:from-brand-sage-900 dark:via-brand-teal-900 dark:via-brand-teal-800 dark:to-brand-sand-900 text-white p-6 sm:p-8 relative overflow-hidden border border-white/30 dark:border-white/10 shadow-xl shadow-brand-teal-600/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
        <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-brand-sand-300/45 via-brand-sand-500/30 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-gradient-to-tr from-brand-sage-500/40 via-brand-sage-700/30 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-brand-teal-300/30 rounded-full blur-3xl" />

        {/* Subtle decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
        </svg>

        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-brand-navy-900/90 text-brand-sage-900 dark:text-brand-sage-300 text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/80 dark:border-white/20 mb-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse" />
            <span>{isEn ? 'Student Management' : 'Quản lý học viên'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-chivo font-black tracking-tight text-white flex items-center gap-2.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            <span className="material-symbols-outlined text-[28px] text-brand-sand-300">groups</span>
            <span>{isEn ? 'Enrolled Students by Class' : 'Danh Sách Học Viên Theo Lớp Học'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-white/95 max-w-2xl font-medium leading-relaxed drop-shadow-xs">
            {isEn
              ? 'Track student profiles in assigned classes and customize personal training plans (⭐) for special conditioning.'
              : 'Theo dõi hồ sơ học viên theo từng lớp bạn đảm nhiệm và thiết lập giáo án riêng (⭐) cho học viên có thể chất đặc biệt.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <a
            href="#/coach/progress"
            className="px-4 py-2.5 rounded-xl border border-white/30 bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md shadow-xs hover-lift"
          >
            <span className="material-symbols-outlined text-[16px] text-brand-sand-300">monitor_heart</span>
            <span>{isEn ? 'Log Vitals' : 'Ghi Chỉ Số'}</span>
          </a>
        </div>
      </div>

      {/* Class Selector Bar */}
      <CoachError message={error} retry={loadData} />
      <CoachError message={membersError} retry={() => setMemberVersion(v => v + 1)} />
      <div className="bg-white p-4 rounded-2xl border border-brand-navy-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-navy-500 shrink-0">
            {isEn ? 'Select Class:' : 'Chọn lớp học:'}
          </span>
          {classes.length === 0 ? (
            <span className="text-xs font-semibold text-brand-sand-700 bg-brand-sand-50 px-3 py-1.5 rounded-lg border border-brand-sand-200">
              {isEn ? 'No assigned classes yet.' : 'Bạn chưa có lớp học nào được phân công.'}
            </span>
          ) : (
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(Number(e.target.value))}
              className="w-full sm:w-auto min-w-0 px-3.5 py-2 text-sm rounded-lg border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-sage-500 focus:border-brand-sage-500 bg-white font-semibold text-brand-navy-900"
            >
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {translateClassName(cls.name, isEn)} ({translateSportName(cls.sportName, isEn)})
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedClass && (
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <span className="text-brand-navy-500">
              {isEn ? 'Enrollment:' : 'Sĩ số:'} <strong className="text-brand-navy-900 font-bold">{members.length} / {selectedClass.capacity}</strong>
            </span>
            <span className="text-brand-navy-300">|</span>
            <span className="text-brand-sand-700 dark:text-brand-sand-400 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-brand-sand-700 dark:text-brand-sand-400 fill-brand-sand-500">star</span>
              <span><strong>{members.filter(m => getPersonalPlanForMember(m.memberId)).length}</strong> {isEn ? 'custom plans' : 'giáo án riêng'}</span>
            </span>
          </div>
        )}
      </div>

      {/* Guide Banner */}
      <div className="bg-gradient-to-r from-brand-sand-50 to-brand-terra-50 p-3.5 rounded-xl border border-brand-sand-200 text-xs flex items-center justify-between gap-3 text-brand-sand-900 dark:text-brand-sand-400">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-brand-sand-700 dark:text-brand-sand-400 text-[22px] shrink-0">stars</span>
          <div>
            <span className="font-bold">{isEn ? 'Custom plan rule:' : 'Quy tắc giáo án riêng:'}</span>{' '}
            {isEn
              ? 'All enrolled students follow the shared class syllabus by default. For members needing special conditioning or rehab, click the star icon (⭐) to configure a custom plan. The star lights up gold when activated!'
              : 'Mọi học viên trong lớp mặc định áp dụng giáo án chung của lớp. Đối với học viên có thể chất khác biệt (cần tăng cường độ hoặc giảm tải), bạn bấm vào biểu tượng ngôi sao (⭐) để tạo giáo án riêng. Sau khi lưu, ngôi sao sẽ phát sáng vàng để nhận biết!'}
          </div>
        </div>
      </div>

      {/* Table */}
      {membersLoading ? (
        <LoadingSpinner text={isEn ? "Loading class members..." : "Đang tải học viên của lớp..."} />
      ) : !membersError && !error && (
        <Table
          columns={columns}
          data={members}
          searchKey="memberName"
          searchPlaceholder={isEn ? "Search by student name..." : "Tìm theo tên học viên..."}
          emptyMessage={isEn ? "No students have enrolled in this class yet" : "Chưa có học viên nào đặt chỗ cho lớp này"}
        />
      )}

      <Modal isOpen={Boolean(profile)} onClose={() => setProfile(null)} title={isEn ? `Student Profile: ${profile?.memberName || ''}` : `Hồ sơ học viên: ${profile?.memberName || ''}`}>
        {profile && (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm break-words">
            {[
              [isEn ? 'Member Code' : 'Mã thẻ', profile.memberCode],
              [isEn ? 'Email' : 'Email', profile.email],
              [isEn ? 'Phone' : 'Điện thoại', profile.phone],
              [isEn ? 'Date of Birth' : 'Ngày sinh', profile.dateOfBirth],
              [isEn ? 'Gender' : 'Giới tính', profile.gender],
              [isEn ? 'Height (cm)' : 'Chiều cao (cm)', profile.heightCm],
              [isEn ? 'Weight (kg)' : 'Cân nặng hồ sơ (kg)', profile.weightKg],
              [isEn ? 'Fitness Goal' : 'Mục tiêu tập luyện', profile.fitnessGoal],
              [isEn ? 'Fitness Level' : 'Trình độ', profile.fitnessLevel],
              [isEn ? 'Health Notes' : 'Lưu ý thể trạng', profile.medicalNote]
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-brand-navy-500 text-xs">{label}</dt>
                <dd className="font-semibold whitespace-pre-wrap mt-1">{(value && String(value).trim()) ? value : (isEn ? 'Not updated' : 'Chưa cập nhật')}</dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>

      {/* Modal: Soạn giáo án riêng cho học viên */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          existingPlanId
            ? (isEn ? `Update Custom Plan: ${activeMember?.memberName}` : `Cập Nhật Giáo Án Riêng: ${activeMember?.memberName}`)
            : (isEn ? `Create Custom Plan: ${activeMember?.memberName}` : `Soạn Giáo Án Riêng Cho Học Viên: ${activeMember?.memberName}`)
        }
        maxWidth="max-w-2xl"
      >
        {activeMember && (
          <form onSubmit={handleSavePersonalPlan} className="space-y-4">
            {/* Header info about the member & class */}
            <div className="p-3.5 rounded-xl bg-brand-sand-50/70 border border-brand-sand-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={activeMember.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                  onError={e => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';
                  }}
                  alt={activeMember.memberName || 'Student'}
                  className="w-11 h-11 rounded-full object-cover border-2 border-brand-sand-400 shrink-0"
                />
                <div>
                  <div className="font-bold text-brand-navy-900 text-sm flex items-center gap-1.5">
                    <span>{activeMember.memberName}</span>
                    <span className="text-xs font-bold text-brand-sage-700 dark:text-brand-sage-400">({activeMember.memberCode})</span>
                    {existingPlanId && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-sand-200 text-brand-sand-900 flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px] text-brand-sand-700 dark:text-brand-sand-400">star</span>
                        {isEn ? 'Custom plan active' : 'Đang áp dụng giáo án riêng'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-brand-navy-600 mt-0.5">
                    {isEn ? 'Class:' : 'Lớp:'} <strong>{selectedClass?.name}</strong> • {isEn ? 'Phone:' : 'SĐT:'} <strong>{activeMember.phone || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] font-bold text-brand-sand-800 dark:text-brand-sand-400 uppercase tracking-wider block">
                  {isEn ? 'PERSONALIZED MODE' : 'CHẾ ĐỘ CÁ NHÂN HÓA'}
                </span>
                <span className="text-[10px] text-brand-navy-500">
                  {isEn ? 'Overrides shared syllabus' : 'Ưu tiên hơn giáo án lớp'}
                </span>
              </div>
            </div>

            {/* Row 1: Tên giáo án riêng */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 mb-1">
                {isEn ? 'Custom Plan Title *' : 'Tên giáo án riêng *'}
              </label>
              <input
                type="text"
                required
                placeholder={isEn ? "e.g. Stroke Endurance Rehab or Lower Limb Recovery" : "VD: Phác đồ tăng cường sức bền sải bơi hoặc Giảm tải phục hồi cổ chân"}
                value={planTitle}
                onChange={e => setPlanTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-sand-500 focus:border-brand-sand-500 bg-white"
              />
            </div>

            {/* Row 2: Thể trạng khác biệt & Lý do điều chỉnh */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 mb-1">
                {isEn ? 'Physical Condition & Special Notes' : 'Tình trạng thể chất & Lý do điều chỉnh riêng'}
              </label>
              <input
                type="text"
                placeholder={isEn ? "e.g. Previous knee ligament issue, reduce plyometrics by 30%" : "VD: Học viên có tiền sử giãn dây chằng gối, giảm 30% bài tập plyometric; hoặc Nền tảng thể lực tốt, tăng 2 hiệp"}
                value={fitnessCondition}
                onChange={e => setFitnessCondition(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-sand-500 focus:border-brand-sand-500 bg-white"
              />
            </div>

            {/* Row 3: Mục tiêu riêng & Thời hạn */}
            <label className="block text-xs font-bold">
              {isEn ? 'Start Date' : 'Ngày bắt đầu'}
              <input aria-label={isEn ? "Start Date" : "Ngày bắt đầu giáo án cá nhân"} type="date" required className={coachInput} value={startDate} onChange={e => setStartDate(e.target.value)} />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 mb-1">
                  {isEn ? 'Personalized Goal *' : 'Mục tiêu cá nhân hóa *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isEn ? "e.g. 100% mobility restoration, increase VO2 max" : "VD: Phục hồi chức năng vận động 100%, nâng VO2 max"}
                  value={planGoal}
                  onChange={e => setPlanGoal(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-sand-500 focus:border-brand-sand-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 mb-1">
                  {isEn ? 'End Date (Optional)' : 'Ngày kết thúc'}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-sand-500 focus:border-brand-sand-500 bg-white"
                />
              </div>
            </div>

            {/* Danh sách bài tập riêng */}
            <div className="space-y-3 pt-2 border-t border-brand-navy-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-brand-navy-700">
                    {isEn ? `Custom Exercises (${exercises.length})` : `Bài tập điều chỉnh riêng cho học viên (${exercises.length})`}
                  </label>
                  <p className="text-[11px] text-brand-navy-500">
                    {isEn ? 'Customize sets, repetitions, and technical tips for this student.' : 'Tùy biến số hiệp, số lần lặp và ghi chú kỹ thuật cho học viên này.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddExercise}
                  className="text-xs font-bold text-brand-sand-700 hover:text-brand-sand-800 bg-brand-sand-50 hover:bg-brand-sand-100 px-2.5 py-1 rounded-lg border border-brand-sand-200 flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>{isEn ? 'Add Exercise' : 'Thêm bài tập'}</span>
                </button>
              </div>

              {exercises.map((ex, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-brand-navy-50 border border-brand-navy-200 grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder={isEn ? "Exercise Name" : "Tên bài tập"}
                      value={ex.name}
                      onChange={e => handleExerciseChange(idx, 'name', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-brand-navy-300 bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder={isEn ? "Sets" : "Số hiệp"}
                      value={ex.sets}
                      onChange={e => handleExerciseChange(idx, 'sets', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded border border-brand-navy-300 bg-white text-center"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder={isEn ? "Reps" : "Lặp lại"}
                      value={ex.reps}
                      onChange={e => handleExerciseChange(idx, 'reps', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded border border-brand-navy-300 bg-white text-center"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder={isEn ? "Notes" : "Lưu ý riêng"}
                      value={ex.note}
                      onChange={e => handleExerciseChange(idx, 'note', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded border border-brand-navy-300 bg-white"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(idx)}
                      className="text-brand-navy-400 hover:text-brand-danger-600 p-1"
                      title={isEn ? "Remove exercise" : "Xóa bài tập này"}
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-brand-navy-100">
              {existingPlanId ? (
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeletePersonalPlan}
                  className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg text-brand-terra-700 dark:text-brand-terra-400 hover:bg-brand-terra-500/10 border border-brand-terra-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">star_border</span>
                  <span>{deleting ? (isEn ? 'Deleting...' : 'Đang huỷ...') : (isEn ? 'Delete Custom Plan' : 'Huỷ giáo án riêng (Về sao rỗng)')}</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-brand-navy-200 hover:bg-brand-navy-50 text-brand-navy-600 cursor-pointer"
                >
                  {isEn ? 'Close' : 'Đóng'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl text-brand-navy-900 hover:text-white bg-brand-sand-300 hover:bg-brand-terra-500 shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      <span>{isEn ? 'Saving...' : 'Đang lưu...'}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">star</span>
                      <span>{isEn ? 'Save & Activate Custom Plan' : 'Lưu & Kích Hoạt Giáo Án Riêng'}</span>
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
