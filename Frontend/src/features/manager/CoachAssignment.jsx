import React, { useState, useEffect, useMemo } from 'react';
import { classApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { BusinessAlert } from '../../components/common/BusinessAlert.jsx';
import {
  coachWorkload, filterAndSortAssignmentClasses, isCoachCompatible
} from './coachAssignmentView.js';

// Visual Sport Theme Mapping
const SPORT_THEMES = {
  SWIMMING: {
    match: ['bơi', 'swim', 'hồ bơi', 'bể bơi'],
    icon: 'pool',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    barGrad: 'from-sky-500 to-blue-600',
    accentColor: '#0284c7'
  },
  BOXING: {
    match: ['boxing', 'võ', 'kickfit', 'mma', 'quyền anh', 'muay'],
    icon: 'sports_mma',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    barGrad: 'from-rose-500 to-red-600',
    accentColor: '#e11d48'
  },
  BADMINTON: {
    match: ['cầu lông', 'badminton', 'tennis', 'vợt', 'pickleball'],
    icon: 'sports_tennis',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    barGrad: 'from-amber-500 to-yellow-600',
    accentColor: '#d97706'
  },
  GYM: {
    match: ['gym', 'thể hình', 'fitness', 'tạ', 'hypertrophy', 'cardio'],
    icon: 'fitness_center',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    barGrad: 'from-purple-500 to-indigo-600',
    accentColor: '#7c3aed'
  },
  YOGA: {
    match: ['yoga', 'pilates', 'dẻo dai', 'thiền', 'reformer', 'trị liệu'],
    icon: 'self_improvement',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    barGrad: 'from-emerald-500 to-teal-600',
    accentColor: '#059669'
  }
};

function getSportTheme(sportName = '') {
  const lower = (sportName || '').toLowerCase();
  for (const key of Object.keys(SPORT_THEMES)) {
    const theme = SPORT_THEMES[key];
    if (theme.match.some(m => lower.includes(m))) {
      return theme;
    }
  }
  return {
    icon: 'sports_score',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    barGrad: 'from-slate-600 to-slate-800',
    accentColor: '#475569'
  };
}

const AVATAR_GRADIENTS = [
  'from-rose-500 to-red-600',
  'from-blue-600 to-indigo-700',
  'from-emerald-500 to-teal-700',
  'from-amber-500 to-orange-600',
  'from-purple-600 to-violet-700',
  'from-cyan-600 to-blue-600',
  'from-pink-500 to-rose-600'
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
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CoachAssignment() {
  const { showSuccess, showError } = useToast();
  const [classes, setClasses] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSportFilter, setSelectedSportFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL'); // 'ALL' | 'ASSIGNED' | 'UNASSIGNED' | 'MISMATCH'
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
        classApi.getManagementClasses(), classApi.getCoaches()
      ]);
      setClasses(filterAndSortAssignmentClasses(classList || []));
      setCoaches(coachWorkload(staffList || [], classList || []));
      if (isManualRefresh) {
        showSuccess('Dữ liệu phân công HLV đã được làm mới!');
      }
    } catch (e) {
      setError(e.message || 'Lỗi tải dữ liệu phân công HLV.');
      showError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => { loadData(); }, []);

  const openAssignModal = cls => {
    const compatible = coaches.filter(coach => isCoachCompatible(coach, cls));
    const currentIsCompatible = compatible.some(coach => String(coach.id) === String(cls.coachId));
    setSelectedClass(cls);
    setSelectedCoachId(currentIsCompatible ? String(cls.coachId) : String(compatible[0]?.id || ''));
    setAssignError(null);
    setModalOpen(true);
  };

  const handleConfirmAssign = async event => {
    event.preventDefault();
    if (!selectedCoachId || !isCoachCompatible(coaches.find(coach => String(coach.id) === String(selectedCoachId)), selectedClass)) {
      setAssignError({ message: 'Vui lòng chọn HLV có chuyên môn phù hợp với lớp.' }); return;
    }
    if (String(selectedCoachId) === String(selectedClass.coachId)) {
      setAssignError({ message: 'HLV này đang phụ trách lớp. Hãy chọn một HLV khác để thay đổi.' });
      return;
    }
    setAssigning(true); setAssignError(null);
    try {
      await classApi.assignCoach(selectedClass.id, selectedCoachId);
      const assignedCoach = coaches.find(c => String(c.id) === String(selectedCoachId));
      showSuccess(`Đã phân công HLV [${assignedCoach?.fullName || 'HLV'}] cho lớp "${selectedClass.name}" thành công!`);
      setModalOpen(false);
      await loadData();
    } catch (err) {
      setAssignError(err);
      showError(err.message || 'Lỗi khi phân công HLV');
    } finally {
      setAssigning(false);
    }
  };

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const totalClasses = classes.length;
    const assignedClasses = classes.filter(c => Boolean(c.coachId)).length;
    const unassignedClasses = totalClasses - assignedClasses;
    const coverageRatio = totalClasses > 0 ? Math.round((assignedClasses / totalClasses) * 100) : 0;

    let mismatchCount = 0;
    classes.forEach(cls => {
      if (cls.coachId) {
        const coach = coaches.find(c => String(c.id) === String(cls.coachId));
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
    classes.forEach(c => {
      if (c.sportName) set.add(c.sportName);
    });
    return Array.from(set).sort();
  }, [classes]);

  // Filtered Classes List
  const filteredClasses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return classes.filter(cls => {
      // Query search
      const matchesQuery =
        !query ||
        (cls.name && cls.name.toLowerCase().includes(query)) ||
        (cls.sportName && cls.sportName.toLowerCase().includes(query)) ||
        (cls.coachName && cls.coachName.toLowerCase().includes(query)) ||
        (cls.roomName && cls.roomName.toLowerCase().includes(query)) ||
        (cls.level && cls.level.toLowerCase().includes(query));

      // Sport filter
      const matchesSport =
        !selectedSportFilter || cls.sportName === selectedSportFilter;

      // Status filter
      let matchesStatus = true;
      if (selectedStatusFilter === 'ASSIGNED') {
        matchesStatus = Boolean(cls.coachId);
      } else if (selectedStatusFilter === 'UNASSIGNED') {
        matchesStatus = !cls.coachId;
      } else if (selectedStatusFilter === 'MISMATCH') {
        if (!cls.coachId) return false;
        const coach = coaches.find(c => String(c.id) === String(cls.coachId));
        const isMatch = coach ? isCoachCompatible(coach, cls) : true;
        matchesStatus = isMatch === false;
      }

      return matchesQuery && matchesSport && matchesStatus;
    });
  }, [classes, coaches, searchQuery, selectedSportFilter, selectedStatusFilter]);

  if (loading) {
    return (
      <div className="min-h-[480px] flex items-center justify-center p-8">
        <LoadingSpinner text="Đang đồng bộ dữ liệu lớp học và đội ngũ huấn luyện viên..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-8 bg-rose-50 border border-rose-200 rounded-3xl shadow-sm text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <span className="material-symbols-outlined text-[32px]">error_outline</span>
        </div>
        <h3 className="text-xl font-bold text-slate-800">Không thể tải dữ liệu phân công HLV</h3>
        <p className="text-slate-600 text-sm">{error}</p>
        <button
          onClick={() => loadData(false)}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl transition shadow-md shadow-rose-600/20"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Thử kết nối lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Olympic Luxury Dark Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl text-white">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              ĐIỀU PHỐI HUẤN LUYỆN VIÊN & GIÁO ÁN · SCMS PRO
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Phân Công Huấn Luyện Viên Cho Lớp Học
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Điều phối chuyên môn giảng dạy, tự động phát hiện lệch chuyên môn thể thao, ngăn chặn xung đột trùng ca dạy và đối soát năng lực HLV chuẩn Olympic.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing || assigning}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-sm font-medium rounded-xl transition duration-150 backdrop-blur-sm hover:border-slate-600 active:scale-95 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin text-red-400' : 'text-slate-400'}`}>
                refresh
              </span>
              <span>Làm mới</span>
            </button>

            <a
              href="#/manager/classes-rooms"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-sm font-medium rounded-xl transition duration-150 backdrop-blur-sm hover:border-slate-600 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px] text-red-400">calendar_month</span>
              <span>Quản lý lịch học</span>
            </a>

            <a
              href="#/manager/staff"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-red-600/30 transition duration-150 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">badge</span>
              <span>Danh sách HLV</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Bento KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Classes */}
        <div
          onClick={() => setSelectedStatusFilter('ALL')}
          className={`cursor-pointer bg-white rounded-2xl p-5 border transition-all duration-200 shadow-sm hover:shadow-md ${
            selectedStatusFilter === 'ALL' ? 'border-red-500 ring-2 ring-red-500/10' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng lớp đào tạo</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">school</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{metrics.totalClasses}</span>
            <span className="text-xs font-medium text-slate-500">lớp thể thao</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {metrics.assignedClasses} đã có HLV
            </span>
            <span>·</span>
            <span className="text-amber-600 font-medium">{metrics.unassignedClasses} chờ phân công</span>
          </div>
        </div>

        {/* Card 2: Coaches Available */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Đội ngũ HLV trung tâm</span>
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">sports</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{metrics.totalCoaches}</span>
            <span className="text-xs font-medium text-slate-500">HLV cơ hữu</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-orange-500">verified_user</span>
            <span>Đã kiểm định chứng chỉ chuẩn Olympic</span>
          </div>
        </div>

        {/* Card 3: Coverage Rate */}
        <div
          onClick={() => setSelectedStatusFilter('ASSIGNED')}
          className={`cursor-pointer bg-white rounded-2xl p-5 border transition-all duration-200 shadow-sm hover:shadow-md ${
            selectedStatusFilter === 'ASSIGNED' ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tỷ lệ phủ sóng HLV</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">{metrics.coverageRatio}%</span>
            <span className="text-xs font-medium text-slate-500">hoàn tất</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
            <span className="material-symbols-outlined text-[16px] text-emerald-500">check_circle</span>
            <span>{metrics.assignedClasses} / {metrics.totalClasses} lớp đã có giáo viên</span>
          </div>
        </div>

        {/* Card 4: Needs Attention / Mismatches */}
        <div
          onClick={() => setSelectedStatusFilter(metrics.mismatchCount > 0 ? 'MISMATCH' : 'UNASSIGNED')}
          className={`cursor-pointer bg-white rounded-2xl p-5 border transition-all duration-200 shadow-sm hover:shadow-md ${
            selectedStatusFilter === 'MISMATCH' || selectedStatusFilter === 'UNASSIGNED'
              ? 'border-amber-500 ring-2 ring-amber-500/10'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Lưu ý chuyên môn</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">warning</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600">
              {metrics.unassignedClasses + metrics.mismatchCount}
            </span>
            <span className="text-xs font-medium text-slate-500">cần rà soát</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-amber-600">{metrics.unassignedClasses}</span> chưa phân công
            <span>·</span>
            <span className="font-semibold text-rose-600">{metrics.mismatchCount}</span> lệch môn
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          {/* Status Filter Buttons */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl max-w-full overflow-x-auto">
            <button
              onClick={() => setSelectedStatusFilter('ALL')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                selectedStatusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Tất cả</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-full font-bold bg-slate-200 text-slate-700">
                {metrics.totalClasses}
              </span>
            </button>

            <button
              onClick={() => setSelectedStatusFilter('ASSIGNED')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                selectedStatusFilter === 'ASSIGNED'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Đã có HLV</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700">
                {metrics.assignedClasses}
              </span>
            </button>

            <button
              onClick={() => setSelectedStatusFilter('UNASSIGNED')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                selectedStatusFilter === 'UNASSIGNED'
                  ? 'bg-white text-amber-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Chưa phân công</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700">
                {metrics.unassignedClasses}
              </span>
            </button>

            {metrics.mismatchCount > 0 && (
              <button
                onClick={() => setSelectedStatusFilter('MISMATCH')}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                  selectedStatusFilter === 'MISMATCH'
                    ? 'bg-white text-rose-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Lệch chuyên môn</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700">
                  {metrics.mismatchCount}
                </span>
              </button>
            )}
          </div>

          {/* View Mode Toggle: Grid Cards vs List Table */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setViewMode('cards')}
              title="Chế độ thẻ trực quan"
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Chế độ bảng dữ liệu"
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
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
              placeholder="Tìm theo tên lớp, bộ môn, tên HLV phụ trách, phòng tập..."
              className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-700"
            >
              <option value="">Tất cả bộ môn ({uniqueSports.length})</option>
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
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* 4. Main Class Cards Grid vs Table View */}
      {filteredClasses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[36px]">search_off</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">Không tìm thấy lớp học phù hợp</h3>
            <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto">
              Không có lớp nào khớp với tiêu chí tìm kiếm hoặc bộ lọc trạng thái phân công hiện tại.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedSportFilter('');
              setSelectedStatusFilter('ALL');
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs md:text-sm font-semibold rounded-xl transition shadow"
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            <span>Đặt lại toàn bộ bộ lọc</span>
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* ================= CARD VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => {
            const currentCoach = coaches.find((c) => String(c.id) === String(cls.coachId));
            const theme = getSportTheme(cls.sportName);
            const isAssigned = Boolean(cls.coachId);
            const isMatch = currentCoach ? isCoachCompatible(currentCoach, cls) : null;
            const isMismatch = isMatch === false;
            const enrollmentPercent = cls.capacity > 0 ? Math.min(100, Math.round(((cls.enrolledCount || 0) / cls.capacity) * 100)) : 0;
            const coachAvatarGrad = getAvatarGradient(cls.coachName || 'HLV');

            return (
              <div
                key={cls.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all duration-200 shadow-sm hover:shadow-lg flex flex-col justify-between overflow-hidden group"
              >
                {/* Top Colored Accent Stripe */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${theme.barGrad}`} />

                <div className="p-5 space-y-4 flex-1">
                  {/* Header: Sport & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${theme.badgeClass}`}>
                        <span className="material-symbols-outlined text-[16px]">{theme.icon}</span>
                        {cls.sportName || 'Thể thao'}
                      </span>
                      {cls.level && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-medium border border-slate-200">
                          {cls.level}
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        cls.status === 'Published'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : cls.status === 'Draft'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
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
                      {cls.status === 'Published' ? 'Đang mở' : cls.status === 'Draft' ? 'Bản nháp' : 'Đã hủy'}
                    </span>
                  </div>

                  {/* Class Name & Room Info */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-red-600 transition line-clamp-1">
                      {cls.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="material-symbols-outlined text-[15px] text-slate-400">schedule</span>
                      <span>{cls.durationMinutes || 60} phút/buổi</span>
                      <span>·</span>
                      <span className="material-symbols-outlined text-[15px] text-slate-400">meeting_room</span>
                      <span className="truncate">{cls.roomName || 'Chưa xếp phòng'}</span>
                    </div>
                  </div>

                  {/* Current Assigned Coach Card */}
                  <div className={`p-3.5 rounded-xl border transition-all ${
                    !isAssigned
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                      : isMismatch
                      ? 'bg-rose-50/60 border-rose-200 text-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">person</span>
                        Huấn luyện viên phụ trách
                      </span>

                      {/* Coach Assignment Status Badge */}
                      {isAssigned ? (
                        isMismatch ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                            <span className="material-symbols-outlined text-[12px]">warning</span>
                            Lệch môn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <span className="material-symbols-outlined text-[12px]">check_circle</span>
                            Đúng môn
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          Chưa có HLV
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Coach Avatar with Dynamic Gradient / Initials */}
                      <div className={`w-11 h-11 rounded-full bg-gradient-to-tr ${coachAvatarGrad} text-white font-extrabold flex items-center justify-center text-xs shadow-sm shrink-0 border-2 border-white`}>
                        {getInitials(cls.coachName || 'HLV')}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-xs text-slate-900 truncate">
                          {cls.coachName || (
                            <span className="text-amber-700 italic font-semibold">Chưa phân công huấn luyện viên</span>
                          )}
                        </h4>
                        {currentCoach?.specialization && (
                          <p className="text-[11px] text-slate-600 truncate mt-0.5">
                            Chuyên môn: <strong className="text-slate-800">{currentCoach.specialization}</strong>
                          </p>
                        )}
                        {currentCoach?.certification && (
                          <p className="text-[10px] text-red-600 font-semibold truncate">
                            {currentCoach.certification}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Enrollment Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[15px] text-slate-400">group</span>
                        Sĩ số ghi danh:
                      </span>
                      <span className="font-bold text-slate-800">
                        {cls.enrolledCount || 0} / {cls.capacity} học viên
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          enrollmentPercent >= 90
                            ? 'bg-rose-500'
                            : enrollmentPercent >= 75
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${enrollmentPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Action Button */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Mã lớp: <strong>#{cls.id}</strong>
                  </span>

                  <button
                    onClick={() => openAssignModal(cls)}
                    disabled={['Cancelled', 'Completed'].includes(cls.status) || !coaches.length}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition active:scale-95 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                    <span>{isAssigned ? 'Đổi HLV' : 'Phân công ngay'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= TABLE VIEW ================= */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Lớp đào tạo</th>
                  <th className="py-3.5 px-4">Bộ môn & Sân</th>
                  <th className="py-3.5 px-4">HLV phụ trách hiện tại</th>
                  <th className="py-3.5 px-4">Chuyên môn & Chứng chỉ</th>
                  <th className="py-3.5 px-4">Sĩ số</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClasses.map((cls) => {
                  const currentCoach = coaches.find((c) => String(c.id) === String(cls.coachId));
                  const theme = getSportTheme(cls.sportName);
                  const isAssigned = Boolean(cls.coachId);
                  const isMatch = currentCoach ? isCoachCompatible(currentCoach, cls) : null;
                  const isMismatch = isMatch === false;
                  const coachAvatarGrad = getAvatarGradient(cls.coachName || 'HLV');

                  return (
                    <tr key={cls.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{cls.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[13px] text-slate-400">schedule</span>
                          {cls.durationMinutes || 60} phút/buổi
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${theme.badgeClass}`}>
                            <span className="material-symbols-outlined text-[13px]">{theme.icon}</span>
                            {cls.sportName}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {cls.roomName || 'Chưa chọn phòng'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {isAssigned ? (
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${coachAvatarGrad} text-white font-extrabold flex items-center justify-center text-[10px] shrink-0`}>
                              {getInitials(cls.coachName || 'HLV')}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs">{cls.coachName}</div>
                              {isMismatch ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600">
                                  <span className="material-symbols-outlined text-[11px]">warning</span> Lệch môn
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
                                  <span className="material-symbols-outlined text-[11px]">check_circle</span> Đúng môn
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Chưa phân công
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-medium text-slate-700">{currentCoach?.specialization || '-'}</div>
                        <div className="text-[11px] text-red-600 font-semibold">{currentCoach?.certification || ''}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-bold text-slate-800">{cls.enrolledCount || 0} / {cls.capacity}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openAssignModal(cls)}
                          disabled={['Cancelled', 'Completed'].includes(cls.status) || !coaches.length}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold uppercase tracking-wider transition active:scale-95"
                        >
                          {isAssigned ? 'Đổi HLV' : 'Phân công'}
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
        title="Phân Công Huấn Luyện Viên Cho Lớp Học"
      >
        {selectedClass && (
          <form onSubmit={handleConfirmAssign} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {/* Class Info Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                  <span className="material-symbols-outlined text-[14px]">school</span>
                  {selectedClass.sportName}
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  Mã lớp: #{selectedClass.id}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">{selectedClass.name}</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                <div>Phòng tập: <strong>{selectedClass.roomName || 'Chưa chọn'}</strong></div>
                <div>Thời lượng: <strong>{selectedClass.durationMinutes || 60} phút</strong></div>
                <div>Sức chứa: <strong>{selectedClass.capacity} học viên</strong></div>
                <div>Hiện có: <strong>{selectedClass.enrolledCount || 0} đăng ký</strong></div>
              </div>
            </div>

            {/* Coach Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Chọn Huấn luyện viên phụ trách <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedCoachId}
                onChange={(e) => {
                  setSelectedCoachId(e.target.value);
                  setAssignError(null);
                }}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white"
              >
                {coaches.map((c) => (
                  <option key={c.id} value={c.id} disabled={!isCoachCompatible(c, selectedClass)}>
                    {c.fullName} ({c.specialization || 'Chưa cập nhật chuyên môn'}{c.certification ? ` · ${c.certification}` : ''})
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
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[20px] text-emerald-600 shrink-0">verified</span>
                    <div>
                      <strong>Chuyên môn hoàn toàn phù hợp!</strong>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        HLV <strong>{candidate.fullName}</strong> có chuyên môn "{candidate.specialization}" khớp với bộ môn "{selectedClass.sportName}".
                      </p>
                    </div>
                  </div>
                );
              }

              if (isMatch === false) {
                return (
                  <BusinessAlert
                    type="warning"
                    title="Cảnh báo lệch chuyên môn huấn luyện"
                    message={`HLV ${candidate.fullName} có chuyên môn chính là "${candidate.specialization}", khác với bộ môn "${selectedClass.sportName}" của lớp học này.`}
                    proposedHandling="Quản lý cần đối chiếu chứng chỉ phụ hoặc năng lực thực tế của HLV trước khi phê duyệt để đảm bảo chất lượng đào tạo đạt chuẩn Olympic."
                  />
                );
              }

              return null;
            })()}

            {/* Error / Conflict Alert */}
            {assignError && (
              <BusinessAlert
                type="error"
                title="Lỗi phân công huấn luyện viên"
                code={assignError.code || 'COACH-ASSIGN-ERR'}
                message={assignError.message || String(assignError)}
                proposedHandling={assignError.proposedHandling || 'Hệ thống phát hiện trùng lịch dạy của HLV ở lớp khác; vui lòng đổi HLV hoặc điều chỉnh lịch học.'}
              />
            )}

            {/* Anti-Conflict Notice */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-red-500 shrink-0 mt-0.5">verified_user</span>
              <span>
                Hệ thống SCMS tự động đối soát lịch giảng dạy của HLV. Nếu phát hiện trùng ca dạy ở lớp khác, hệ thống sẽ phát tín hiệu cảnh báo xung đột và ngăn chặn phân công.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={assigning}
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={assigning || !selectedCoachId || String(selectedCoachId) === String(selectedClass?.coachId)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-md shadow-red-600/20 transition active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                <span>{assigning ? 'Đang xác thực...' : 'Xác Nhận Phân Công'}</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
