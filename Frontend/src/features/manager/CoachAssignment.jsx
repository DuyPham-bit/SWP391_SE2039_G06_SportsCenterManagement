import React, { useState, useEffect, useMemo } from 'react';
import { classApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { BusinessAlert } from '../../components/common/BusinessAlert.jsx';
import {
  coachWorkload,
  filterAndSortAssignmentClasses,
  isCoachCompatible
} from './coachAssignmentView.js';

// Visual Sport Theme Mapping
const SPORT_THEMES = {
  SWIMMING: {
    match: ['bơi', 'swim', 'hồ bơi', 'bể bơi'],
    icon: 'pool',
    badgeClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    barGrad: 'from-sky-500 to-blue-600',
    accentColor: '#0284c7'
  },
  BOXING: {
    match: ['boxing', 'võ', 'kickfit', 'mma', 'quyền anh', 'muay'],
    icon: 'sports_mma',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    barGrad: 'from-rose-500 to-red-600',
    accentColor: '#e11d48'
  },
  BADMINTON: {
    match: ['cầu lông', 'badminton', 'tennis', 'vợt', 'pickleball'],
    icon: 'sports_tennis',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    barGrad: 'from-amber-500 to-yellow-600',
    accentColor: '#d97706'
  },
  GYM: {
    match: ['gym', 'thể hình', 'fitness', 'tạ', 'hypertrophy', 'cardio'],
    icon: 'fitness_center',
    badgeClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    barGrad: 'from-purple-500 to-indigo-600',
    accentColor: '#7c3aed'
  },
  YOGA: {
    match: ['yoga', 'pilates', 'dẻo dai', 'thiền', 'reformer', 'trị liệu'],
    icon: 'self_improvement',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    barGrad: 'from-emerald-500 to-teal-600',
    accentColor: '#059669'
  }
};

function getSportTheme(sportName = '') {
  const lower = (sportName || '').toLowerCase();
  for (const key of Object.keys(SPORT_THEMES)) {
    const theme = SPORT_THEMES[key];
    if (theme.match.some((m) => lower.includes(m))) {
      return theme;
    }
  }
  return {
    icon: 'sports_score',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    barGrad: 'from-[#1E2235] to-[#2B2D42]',
    accentColor: '#475569'
  };
}

const AVATAR_GRADIENTS = [
  'from-[#2D6A4F] to-[#1B4332]',
  'from-[#1E2235] to-[#2B2D42]',
  'from-teal-600 to-emerald-800',
  'from-amber-600 to-amber-700',
  'from-indigo-600 to-slate-800',
  'from-cyan-600 to-blue-700',
  'from-rose-600 to-rose-800'
];

function getAvatarGradient(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function getInitials(name = '') {
  if (!name) return 'HLV';
  const parts = name.trim().split(/\s+/);
  if (!parts.length || !parts[0]) return 'HLV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CoachAssignment() {
  const { showSuccess, showError } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [classes, setClasses] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSportFilter, setSelectedSportFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL'); // 'ALL' | 'ASSIGNED' | 'UNASSIGNED' | 'MISMATCH'
  const [publicationTab, setPublicationTab] = useState('PUBLISHED'); // 'PUBLISHED' | 'PENDING'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  // Assignment Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState(null);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [classList, staffList] = await Promise.all([
        classApi.getManagementClasses(),
        classApi.getCoaches()
      ]);
      setClasses(filterAndSortAssignmentClasses(classList || []));
      setCoaches(coachWorkload(staffList || [], classList || []));
      if (isManualRefresh) {
        showSuccess(isEn ? 'Coach assignment data refreshed!' : 'Dữ liệu phân công HLV đã được làm mới!');
      }
    } catch (e) {
      setError(e.message || (isEn ? 'Error loading coach assignment data.' : 'Lỗi tải dữ liệu phân công HLV.'));
      showError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAssignModal = (cls) => {
    const compatible = coaches.filter((coach) => isCoachCompatible(coach, cls));
    const currentIsCompatible = compatible.some((coach) => String(coach.id) === String(cls.coachId));
    setSelectedClass(cls);
    setSelectedCoachId(currentIsCompatible ? String(cls.coachId) : String(compatible[0]?.id || ''));
    setAssignError(null);
    setModalOpen(true);
  };

  const handleConfirmAssign = async (event) => {
    event.preventDefault();
    if (
      !selectedCoachId ||
      !isCoachCompatible(
        coaches.find((coach) => String(coach.id) === String(selectedCoachId)),
        selectedClass
      )
    ) {
      setAssignError({ message: isEn ? 'Please select a coach matching class discipline.' : 'Vui lòng chọn HLV có chuyên môn phù hợp với lớp.' });
      return;
    }
    if (String(selectedCoachId) === String(selectedClass.coachId)) {
      setAssignError({ message: isEn ? 'This coach is already assigned to this class. Select another coach to reassign.' : 'HLV này đang phụ trách lớp. Hãy chọn một HLV khác để thay đổi.' });
      return;
    }
    setAssigning(true);
    setAssignError(null);
    try {
      await classApi.assignCoach(selectedClass.id, selectedCoachId);
      const assignedCoach = coaches.find((c) => String(c.id) === String(selectedCoachId));
      showSuccess(
        isEn
          ? `Assigned coach [${assignedCoach?.fullName || 'Coach'}] to class "${selectedClass.name}" successfully!`
          : `Đã phân công HLV [${assignedCoach?.fullName || 'HLV'}] cho lớp "${selectedClass.name}" thành công!`
      );
      setModalOpen(false);
      await loadData();
    } catch (err) {
      setAssignError(err);
      showError(err.message || (isEn ? 'Error assigning coach' : 'Lỗi khi phân công HLV'));
    } finally {
      setAssigning(false);
    }
  };

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const totalClasses = classes.length;
    const assignedClasses = classes.filter((c) => Boolean(c.coachId)).length;
    const unassignedClasses = totalClasses - assignedClasses;
    const coverageRatio = totalClasses > 0 ? Math.round((assignedClasses / totalClasses) * 100) : 0;

    let mismatchCount = 0;
    classes.forEach((cls) => {
      if (cls.coachId) {
        const coach = coaches.find((c) => String(c.id) === String(cls.coachId));
        if (coach?.specialization && cls.sportName) {
          const isMatch = isCoachCompatible(coach, cls);
          if (isMatch === false) mismatchCount++;
        }
      }
    });

    return {
      totalClasses,
      assignedClasses,
      unassignedClasses,
      totalCoaches: coaches.length,
      coverageRatio,
      mismatchCount
    };
  }, [classes, coaches]);

  // Unique Sports List for Filter Dropdown
  const uniqueSports = useMemo(() => {
    const set = new Set();
    classes.forEach((c) => {
      if (c.sportName) set.add(c.sportName);
    });
    return Array.from(set).sort();
  }, [classes]);

  // Filtered Classes List
  const filteredClasses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return classes.filter((cls) => {
      const isPublished = String(cls.status || '').toUpperCase() === 'PUBLISHED';
      const matchesPublication = publicationTab === 'PUBLISHED' ? isPublished : !isPublished;
      const matchesQuery =
        !query ||
        (cls.name && cls.name.toLowerCase().includes(query)) ||
        (cls.sportName && cls.sportName.toLowerCase().includes(query)) ||
        (cls.coachName && cls.coachName.toLowerCase().includes(query)) ||
        (cls.roomName && cls.roomName.toLowerCase().includes(query)) ||
        (cls.level && cls.level.toLowerCase().includes(query));

      const matchesSport = !selectedSportFilter || cls.sportName === selectedSportFilter;

      let matchesStatus = true;
      if (selectedStatusFilter === 'ASSIGNED') {
        matchesStatus = Boolean(cls.coachId);
      } else if (selectedStatusFilter === 'UNASSIGNED') {
        matchesStatus = !cls.coachId;
      } else if (selectedStatusFilter === 'MISMATCH') {
        if (!cls.coachId) return false;
        const coach = coaches.find((c) => String(c.id) === String(cls.coachId));
        const isMatch = coach ? isCoachCompatible(coach, cls) : true;
        matchesStatus = isMatch === false;
      }

      return matchesPublication && matchesQuery && matchesSport && matchesStatus;
    });
  }, [classes, coaches, searchQuery, selectedSportFilter, selectedStatusFilter, publicationTab]);

  if (loading) {
    return (
      <div className="min-h-[480px] flex items-center justify-center p-8">
        <LoadingSpinner text={isEn ? 'Synchronizing classes and coach roster...' : 'Đang đồng bộ dữ liệu lớp học và đội ngũ huấn luyện viên...'} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-8 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-3xl shadow-sm text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <span className="material-symbols-outlined text-[32px]">error_outline</span>
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          {isEn ? 'Cannot load coach assignment data' : 'Không thể tải dữ liệu phân công HLV'}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm">{error}</p>
        <button
          onClick={() => loadData(false)}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-medium rounded-xl transition shadow-md shadow-[#2D6A4F]/20"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          {isEn ? 'Retry Connection' : 'Thử kết nối lại'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-slide-up">
      {/* 1. Header Hero Banner (Olympic Multi-stop Gradient matching Image 1) */}
      <section
        className="relative overflow-hidden rounded-3xl text-white p-6 sm:p-8 shadow-xl shadow-[#24828F]/25 border border-white/30"
        style={{
          background: 'linear-gradient(108deg, #2F7B5D 0%, #24828F 25%, #3FAEB8 48%, #76B386 70%, #DEAC46 88%, #E5A33C 100%)'
        }}
      >
        {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
        <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-[#F2CC8F]/50 via-[#E5A33C]/35 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-gradient-to-tr from-[#81B29A]/45 via-[#2F7B5D]/30 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-[#A8DADC]/35 rounded-full blur-3xl" />

        {/* Subtle decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
          <circle cx="890" cy="110" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
        </svg>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/95 text-[#1B4332] text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/80 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>{isEn ? 'Coach Dispatch & Syllabus · SCMS PRO' : 'Điều phối Huấn luyện viên & Giáo án · SCMS PRO'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-chivo tracking-tight text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
              {isEn ? 'Coach Assignment to Classes' : 'Phân Công Huấn Luyện Viên Cho Lớp Học'}
            </h1>
            <p className="text-xs sm:text-sm text-white/95 leading-relaxed font-medium drop-shadow-xs">
              {isEn
                ? 'Coordinate coaching expertise, detect discipline mismatches automatically, prevent timetable overlaps, and inspect Olympic coach capacity.'
                : 'Điều phối chuyên môn giảng dạy, tự động phát hiện lệch chuyên môn thể thao, ngăn chặn xung đột trùng ca dạy và đối soát năng lực HLV chuẩn Olympic.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing || assigning}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/40 transition-all hover-lift cursor-pointer disabled:opacity-50 shadow-xs"
              title={isEn ? 'Refresh' : 'Làm mới'}
            >
              <span className={`material-symbols-outlined text-[16px] text-amber-200 ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
              <span>{isEn ? 'Refresh' : 'Làm mới'}</span>
            </button>

            <a
              href="#/manager/classes-rooms"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/40 transition-all hover-lift cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px] text-amber-200">calendar_month</span>
              <span>{isEn ? 'Class Timetables' : 'Quản lý lịch học'}</span>
            </a>

            <a
              href="#/manager/staff"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 hover:bg-white text-[#1B4332] text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all hover-lift cursor-pointer border border-white/80"
            >
              <span className="material-symbols-outlined text-[18px] text-[#2D6A4F]">badge</span>
              <span>{isEn ? 'Coaches Directory' : 'Danh sách HLV'}</span>
            </a>
          </div>
        </div>
      </section>

      {/* 2. Bento KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Classes */}
        <div
          onClick={() => setSelectedStatusFilter('ALL')}
          className={`cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-5 border transition-all shadow-sm hover-lift ${
            selectedStatusFilter === 'ALL'
              ? 'border-[#2D6A4F] ring-2 ring-[#2D6A4F]/20 dark:border-[#81B29A]'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEn ? 'Total Classes' : 'Tổng lớp đào tạo'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">school</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{metrics.totalClasses}</span>
            <span className="text-xs font-medium text-slate-400">{isEn ? 'classes' : 'lớp thể thao'}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {metrics.assignedClasses} {isEn ? 'assigned' : 'đã có HLV'}
            </span>
            <span>·</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {metrics.unassignedClasses} {isEn ? 'pending' : 'chờ phân công'}
            </span>
          </div>
        </div>

        {/* Card 2: Coaches Available */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover-lift transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEn ? 'Center Coach Roster' : 'Đội ngũ HLV trung tâm'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">sports</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{metrics.totalCoaches}</span>
            <span className="text-xs font-medium text-slate-400">{isEn ? 'active coaches' : 'HLV cơ hữu'}</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-amber-500">verified_user</span>
            <span>{isEn ? 'Olympic standard credentials certified' : 'Đã kiểm định chứng chỉ chuẩn Olympic'}</span>
          </div>
        </div>

        {/* Card 3: Coverage Rate */}
        <div
          onClick={() => setSelectedStatusFilter('ASSIGNED')}
          className={`cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-5 border transition-all shadow-sm hover-lift ${
            selectedStatusFilter === 'ASSIGNED'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 dark:border-emerald-400'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEn ? 'Coach Coverage Rate' : 'Tỷ lệ phủ sóng HLV'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{metrics.coverageRatio}%</span>
            <span className="text-xs font-medium text-slate-400">{isEn ? 'covered' : 'hoàn tất'}</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <span className="material-symbols-outlined text-[16px] text-emerald-500">check_circle</span>
            <span>
              {metrics.assignedClasses} / {metrics.totalClasses} {isEn ? 'classes staffed' : 'lớp đã có giáo viên'}
            </span>
          </div>
        </div>

        {/* Card 4: Needs Attention / Mismatches */}
        <div
          onClick={() => setSelectedStatusFilter(metrics.mismatchCount > 0 ? 'MISMATCH' : 'UNASSIGNED')}
          className={`cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-5 border transition-all shadow-sm hover-lift ${
            selectedStatusFilter === 'MISMATCH' || selectedStatusFilter === 'UNASSIGNED'
              ? 'border-amber-500 ring-2 ring-amber-500/20 dark:border-amber-400'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEn ? 'Attention Needed' : 'Lưu ý chuyên môn'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">warning</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {metrics.unassignedClasses + metrics.mismatchCount}
            </span>
            <span className="text-xs font-medium text-slate-400">{isEn ? 'to review' : 'cần rà soát'}</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-amber-600 dark:text-amber-400">{metrics.unassignedClasses}</span> {isEn ? 'unassigned' : 'chưa phân công'}
            <span>·</span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">{metrics.mismatchCount}</span> {isEn ? 'mismatches' : 'lệch môn'}
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 p-1.5" role="tablist" aria-label={isEn ? 'Class publication status' : 'Trạng thái công bố lớp'}>
          {[
            { id: 'PUBLISHED', label: isEn ? 'Published classes' : 'Lớp đã công bố', icon: 'public', count: classes.filter(c => String(c.status).toUpperCase() === 'PUBLISHED').length },
            { id: 'PENDING', label: isEn ? 'Pending publication' : 'Lớp chờ công bố', icon: 'pending_actions', count: classes.filter(c => String(c.status).toUpperCase() !== 'PUBLISHED').length }
          ].map(item => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={publicationTab === item.id}
              onClick={() => setPublicationTab(item.id)}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs sm:text-sm font-bold transition-all ${publicationTab === item.id
                ? 'bg-white dark:bg-slate-900 text-[#2D6A4F] dark:text-[#81B29A] shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              <span>{item.label}</span>
              <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[11px]">{item.count}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          {/* Status Filter Buttons */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-full overflow-x-auto">
            <button
              onClick={() => setSelectedStatusFilter('ALL')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                selectedStatusFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>{isEn ? 'All' : 'Tất cả'}</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-full font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {metrics.totalClasses}
              </span>
            </button>

            <button
              onClick={() => setSelectedStatusFilter('ASSIGNED')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                selectedStatusFilter === 'ASSIGNED'
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{isEn ? 'Assigned' : 'Đã có HLV'}</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                {metrics.assignedClasses}
              </span>
            </button>

            <button
              onClick={() => setSelectedStatusFilter('UNASSIGNED')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                selectedStatusFilter === 'UNASSIGNED'
                  ? 'bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{isEn ? 'Unassigned' : 'Chưa phân công'}</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-full font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                {metrics.unassignedClasses}
              </span>
            </button>

            {metrics.mismatchCount > 0 && (
              <button
                onClick={() => setSelectedStatusFilter('MISMATCH')}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                  selectedStatusFilter === 'MISMATCH'
                    ? 'bg-white dark:bg-slate-900 text-rose-800 dark:text-rose-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>{isEn ? 'Discipline Mismatch' : 'Lệch chuyên môn'}</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">
                  {metrics.mismatchCount}
                </span>
              </button>
            )}
          </div>

          {/* View Mode Toggle: Grid Cards vs List Table */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setViewMode('cards')}
              title={isEn ? 'Card view' : 'Chế độ thẻ trực quan'}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'cards' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              title={isEn ? 'Table view' : 'Chế độ bảng dữ liệu'}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">view_list</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isEn ? 'Search by class name, sport, coach, court...' : 'Tìm theo tên lớp, bộ môn, tên HLV phụ trách, phòng tập...'}
              className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A] transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Sport Filter */}
          <div className="w-full md:w-56">
            <select
              value={selectedSportFilter}
              onChange={(e) => setSelectedSportFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A]"
            >
              <option value="">{isEn ? `All disciplines (${uniqueSports.length})` : `Tất cả bộ môn (${uniqueSports.length})`}</option>
              {uniqueSports.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {(searchQuery || selectedSportFilter || selectedStatusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSportFilter('');
                setSelectedStatusFilter('ALL');
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-xl transition shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
              {isEn ? 'Clear filters' : 'Xóa bộ lọc'}
            </button>
          )}
        </div>
      </div>

      {/* 4. Main Class Cards Grid vs Table View */}
      {filteredClasses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[36px]">search_off</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">{isEn ? 'No classes found' : 'Không tìm thấy lớp học phù hợp'}</h3>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {isEn ? 'No classes match your current search criteria or assignment status filters.' : 'Không có lớp nào khớp với tiêu chí tìm kiếm hoặc bộ lọc trạng thái phân công hiện tại.'}
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedSportFilter('');
              setSelectedStatusFilter('ALL');
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E2235] hover:bg-[#2B2D42] text-white text-xs md:text-sm font-semibold rounded-xl transition shadow"
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            <span>{isEn ? 'Reset all filters' : 'Đặt lại toàn bộ bộ lọc'}</span>
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => {
            const currentCoach = coaches.find((c) => String(c.id) === String(cls.coachId));
            const theme = getSportTheme(cls.sportName);
            const isAssigned = Boolean(cls.coachId);
            const isMatch = currentCoach ? isCoachCompatible(currentCoach, cls) : null;
            const isMismatch = isMatch === false;
            const enrollmentPercent =
              cls.capacity > 0 ? Math.min(100, Math.round(((cls.enrolledCount || 0) / cls.capacity) * 100)) : 0;
            const coachAvatarGrad = getAvatarGradient(cls.coachName || 'HLV');

            return (
              <div
                key={cls.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm hover-lift flex flex-col justify-between overflow-hidden group"
              >
                <div className={`h-1.5 w-full bg-gradient-to-r ${theme.barGrad}`} />

                <div className="p-5 space-y-4 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${theme.badgeClass}`}>
                        <span className="material-symbols-outlined text-[16px]">{theme.icon}</span>
                        {cls.sportName || (isEn ? 'Sport' : 'Thể thao')}
                      </span>
                      {cls.level && (
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-[11px] font-medium border border-slate-200 dark:border-slate-700">
                          {cls.level}
                        </span>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        cls.status === 'Published'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : cls.status === 'Draft'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          cls.status === 'Published'
                            ? 'bg-emerald-500 animate-pulse'
                            : cls.status === 'Draft'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`}
                      />
                      {cls.status === 'Published' ? (isEn ? 'Published' : 'Đang mở') : cls.status === 'Draft' ? (isEn ? 'Draft' : 'Bản nháp') : isEn ? 'Cancelled' : 'Đã hủy'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base group-hover:text-[#2D6A4F] dark:group-hover:text-[#81B29A] transition line-clamp-1">
                      {cls.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="material-symbols-outlined text-[15px] text-slate-400">schedule</span>
                      <span>{cls.durationMinutes || 60} {isEn ? 'mins / session' : 'phút/buổi'}</span>
                      <span>·</span>
                      <span className="material-symbols-outlined text-[15px] text-slate-400">meeting_room</span>
                      <span className="truncate">{cls.roomName || (isEn ? 'No court assigned' : 'Chưa xếp phòng')}</span>
                    </div>
                  </div>

                  {/* Coach Card */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      !isAssigned
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                        : isMismatch
                        ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-slate-900 dark:text-slate-100'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">person</span>
                        {isEn ? 'Assigned Coach' : 'Huấn luyện viên phụ trách'}
                      </span>

                      {isAssigned ? (
                        isMismatch ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                            <span className="material-symbols-outlined text-[12px]">warning</span>
                            {isEn ? 'Mismatch' : 'Lệch môn'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            <span className="material-symbols-outlined text-[12px]">check_circle</span>
                            {isEn ? 'Matched' : 'Đúng môn'}
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                          {isEn ? 'Unassigned' : 'Chưa có HLV'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-full bg-gradient-to-tr ${coachAvatarGrad} text-white font-extrabold flex items-center justify-center text-xs shadow-sm shrink-0 border-2 border-white dark:border-slate-800`}
                      >
                        {getInitials(cls.coachName || 'HLV')}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {cls.coachName || (
                            <span className="text-amber-700 dark:text-amber-300 italic font-semibold">
                              {isEn ? 'No coach assigned yet' : 'Chưa phân công huấn luyện viên'}
                            </span>
                          )}
                        </h4>
                        {currentCoach?.specialization && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                            {isEn ? 'Specialty:' : 'Chuyên môn:'}{' '}
                            <strong className="text-slate-800 dark:text-slate-200">{currentCoach.specialization}</strong>
                          </p>
                        )}
                        {currentCoach?.certification && (
                          <p className="text-[10px] text-[#2D6A4F] dark:text-[#81B29A] font-semibold truncate">
                            {currentCoach.certification}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Enrollment Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[15px] text-slate-400">group</span>
                        {isEn ? 'Enrollment:' : 'Sĩ số ghi danh:'}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {cls.enrolledCount || 0} / {cls.capacity} {isEn ? 'students' : 'học viên'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          enrollmentPercent >= 90
                            ? 'bg-rose-500'
                            : enrollmentPercent >= 75
                            ? 'bg-amber-500'
                            : 'bg-[#2D6A4F]'
                        }`}
                        style={{ width: `${enrollmentPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Action Button */}
                <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {isEn ? 'Class ID:' : 'Mã lớp:'} <strong>#{cls.id}</strong>
                  </span>

                  <button
                    onClick={() => openAssignModal(cls)}
                    disabled={['Cancelled', 'Completed'].includes(cls.status) || !coaches.length}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition active:scale-95 disabled:opacity-50 hover-lift"
                  >
                    <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                    <span>{isAssigned ? (isEn ? 'Change Coach' : 'Đổi HLV') : isEn ? 'Assign Now' : 'Phân công ngay'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">{isEn ? 'Training Class' : 'Lớp đào tạo'}</th>
                  <th className="py-3.5 px-4">{isEn ? 'Discipline & Court' : 'Bộ môn & Sân'}</th>
                  <th className="py-3.5 px-4">{isEn ? 'Current Coach' : 'HLV phụ trách hiện tại'}</th>
                  <th className="py-3.5 px-4">{isEn ? 'Specialty & Credentials' : 'Chuyên môn & Chứng chỉ'}</th>
                  <th className="py-3.5 px-4">{isEn ? 'Enrollment' : 'Sĩ số'}</th>
                  <th className="py-3.5 px-4 text-right">{isEn ? 'Actions' : 'Thao tác'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredClasses.map((cls) => {
                  const currentCoach = coaches.find((c) => String(c.id) === String(cls.coachId));
                  const theme = getSportTheme(cls.sportName);
                  const isAssigned = Boolean(cls.coachId);
                  const isMatch = currentCoach ? isCoachCompatible(currentCoach, cls) : null;
                  const isMismatch = isMatch === false;
                  const coachAvatarGrad = getAvatarGradient(cls.coachName || 'HLV');

                  return (
                    <tr key={cls.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{cls.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[13px] text-slate-400">schedule</span>
                          {cls.durationMinutes || 60} {isEn ? 'mins / session' : 'phút/buổi'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${theme.badgeClass}`}>
                            <span className="material-symbols-outlined text-[13px]">{theme.icon}</span>
                            {cls.sportName}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {cls.roomName || (isEn ? 'Unassigned Court' : 'Chưa chọn phòng')}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {isAssigned ? (
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-full bg-gradient-to-tr ${coachAvatarGrad} text-white font-extrabold flex items-center justify-center text-[10px] shrink-0`}
                            >
                              {getInitials(cls.coachName || 'HLV')}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{cls.coachName}</div>
                              {isMismatch ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                  <span className="material-symbols-outlined text-[11px]">warning</span> {isEn ? 'Mismatch' : 'Lệch môn'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  <span className="material-symbols-outlined text-[11px]">check_circle</span> {isEn ? 'Matched' : 'Đúng môn'}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            {isEn ? 'Unassigned' : 'Chưa phân công'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-medium text-slate-700 dark:text-slate-300">{currentCoach?.specialization || '-'}</div>
                        <div className="text-[11px] text-[#2D6A4F] dark:text-[#81B29A] font-semibold">{currentCoach?.certification || ''}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {cls.enrolledCount || 0} / {cls.capacity}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openAssignModal(cls)}
                          disabled={['Cancelled', 'Completed'].includes(cls.status) || !coaches.length}
                          className="px-3 py-1.5 bg-[#2D6A4F]/10 hover:bg-[#2D6A4F]/20 text-[#2D6A4F] dark:text-[#81B29A] rounded-lg text-xs font-bold uppercase tracking-wider transition active:scale-95"
                        >
                          {isAssigned ? (isEn ? 'Change' : 'Đổi HLV') : isEn ? 'Assign' : 'Phân công'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Assignment Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !assigning && setModalOpen(false)}
        title={isEn ? 'Assign Coach to Training Class' : 'Phân Công Huấn Luyện Viên Cho Lớp Học'}
      >
        {selectedClass && (
          <form onSubmit={handleConfirmAssign} className="space-y-4">
            {/* Class Info Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#2D6A4F]/10 text-[#2D6A4F] dark:text-[#81B29A] border border-[#2D6A4F]/20">
                  <span className="material-symbols-outlined text-[14px]">school</span>
                  {selectedClass.sportName}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {isEn ? 'Class ID:' : 'Mã lớp:'} #{selectedClass.id}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{selectedClass.name}</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-slate-700">
                <div>
                  {isEn ? 'Court:' : 'Phòng tập:'} <strong>{selectedClass.roomName || (isEn ? 'Not selected' : 'Chưa chọn')}</strong>
                </div>
                <div>
                  {isEn ? 'Duration:' : 'Thời lượng:'} <strong>{selectedClass.durationMinutes || 60} {isEn ? 'mins' : 'phút'}</strong>
                </div>
                <div>
                  {isEn ? 'Capacity:' : 'Sức chứa:'} <strong>{selectedClass.capacity} {isEn ? 'students' : 'học viên'}</strong>
                </div>
                <div>
                  {isEn ? 'Enrolled:' : 'Hiện có:'} <strong>{selectedClass.enrolledCount || 0} {isEn ? 'registered' : 'đăng ký'}</strong>
                </div>
              </div>
            </div>

            {/* Coach Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                {isEn ? 'Select Lead Coach *' : 'Chọn Huấn luyện viên phụ trách'} <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedCoachId}
                onChange={(e) => {
                  setSelectedCoachId(e.target.value);
                  setAssignError(null);
                }}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A] bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {coaches.map((c) => (
                  <option key={c.id} value={c.id} disabled={!isCoachCompatible(c, selectedClass)}>
                    {c.fullName}

                  </option>
                ))}
              </select>
            </div>

            {/* Match / Mismatch Assessment */}
            {(() => {
              const candidate = coaches.find((c) => String(c.id) === String(selectedCoachId));
              if (!candidate) return null;
              const isMatch = isCoachCompatible(candidate, selectedClass);

              if (isMatch) {
                return (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[20px] text-emerald-600 dark:text-emerald-400 shrink-0">verified</span>
                    <div>
                      <strong>{isEn ? 'Specialty perfectly matched!' : 'Chuyên môn hoàn toàn phù hợp!'}</strong>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {isEn
                          ? `Coach ${candidate.fullName} has discipline "${candidate.specialization}" matching "${selectedClass.sportName}".`
                          : `HLV ${candidate.fullName} có chuyên môn "${candidate.specialization}" khớp với bộ môn "${selectedClass.sportName}".`}
                      </p>
                    </div>
                  </div>
                );
              }

              if (isMatch === false) {
                return (
                  <BusinessAlert
                    type="warning"
                    title={isEn ? 'Discipline Mismatch Warning' : 'Cảnh báo lệch chuyên môn huấn luyện'}
                    message={
                      isEn
                        ? `Coach ${candidate.fullName} specializes in "${candidate.specialization}", which differs from "${selectedClass.sportName}".`
                        : `HLV ${candidate.fullName} có chuyên môn chính là "${candidate.specialization}", khác với bộ môn "${selectedClass.sportName}" của lớp học này.`
                    }
                    proposedHandling={
                      isEn
                        ? 'Manager must cross-reference subsidiary certifications to guarantee Olympic standard training quality.'
                        : 'Quản lý cần đối chiếu chứng chỉ phụ hoặc năng lực thực tế của HLV trước khi phê duyệt để đảm bảo chất lượng đào tạo đạt chuẩn Olympic.'
                    }
                  />
                );
              }

              return null;
            })()}

            {/* Error / Conflict Alert */}
            {assignError && (
              <BusinessAlert
                type="error"
                title={isEn ? 'Coach Assignment Error' : 'Lỗi phân công huấn luyện viên'}
                code={assignError.code || 'COACH-ASSIGN-ERR'}
                message={assignError.message || String(assignError)}
                proposedHandling={
                  assignError.proposedHandling ||
                  (isEn
                    ? 'System detected a schedule conflict with another class; please reassign or adjust timetable.'
                    : 'Hệ thống phát hiện trùng lịch dạy của HLV ở lớp khác; vui lòng đổi HLV hoặc điều chỉnh lịch học.')
                }
              />
            )}

            {/* Anti-Conflict Notice */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-[#2D6A4F] dark:text-[#81B29A] shrink-0 mt-0.5">verified_user</span>
              <span>
                {isEn
                  ? 'SCMS automatically verifies coach teaching schedules. Any detected conflict blocks the assignment and issues an alert.'
                  : 'Hệ thống SCMS tự động đối soát lịch giảng dạy của HLV. Nếu phát hiện trùng ca dạy ở lớp khác, hệ thống sẽ phát tín hiệu cảnh báo xung đột và ngăn chặn phân công.'}
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={assigning}
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              >
                {isEn ? 'Cancel' : 'Hủy'}
              </button>
              <button
                type="submit"
                disabled={assigning || !selectedCoachId || String(selectedCoachId) === String(selectedClass?.coachId)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white shadow-md shadow-[#2D6A4F]/20 transition active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                <span>{assigning ? (isEn ? 'Verifying...' : 'Đang xác thực...') : isEn ? 'Confirm Assignment' : 'Xác Nhận Phân Công'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
