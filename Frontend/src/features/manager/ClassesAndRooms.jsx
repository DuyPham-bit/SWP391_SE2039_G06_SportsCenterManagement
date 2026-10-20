import React, { useState, useEffect, useMemo } from 'react';
import { classApi, roomApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import {
  CLASS_STATUS,
  WEEK_DAYS,
  effectiveScheduleRoom,
  filterClasses,
  groupSchedulesByDay,
  splitAndSortClasses,
  validateClassForm,
  validateScheduleForm
} from './classManagementView.js';

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

const todayDate = () => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
const futureDate = (days = 90) => {
  const d = new Date(Date.now() + (7 * 3600 + days * 86400) * 1000);
  return d.toISOString().slice(0, 10);
};

export function ClassesAndRooms() {
  const { showSuccess, showError } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [tab, setTab] = useState('classes'); // 'classes' | 'cancelled' | 'rooms' | 'sports'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [data, setData] = useState({ classes: [], rooms: [], sports: [], coaches: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSportFilter, setSelectedSportFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Modals
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [classes, rooms, sports, coaches] = await Promise.all([
        classApi.getManagementClasses(),
        roomApi.getAll(),
        classApi.getManagementSports(),
        classApi.getCoaches()
      ]);
      setData({
        classes: classes || [],
        rooms: rooms || [],
        sports: sports || [],
        coaches: coaches || []
      });
      if (isManualRefresh) {
        showSuccess(isEn ? 'Data refreshed from server!' : 'Dữ liệu đã được làm mới từ máy chủ!');
      }
    } catch (err) {
      setError(err.message || (isEn ? 'Cannot load classes and facilities data.' : 'Không thể tải dữ liệu lớp và cơ sở vật chất.'));
      showError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const classGroups = useMemo(() => splitAndSortClasses(data.classes), [data.classes]);

  // Form Change Handler
  const handleFormChange = (e) => {
    setFormError('');
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Safe Action Wrapper
  const executeAction = async (fn, successMsg = isEn ? 'Operation successful!' : 'Thao tác thành công!') => {
    setBusy(true);
    try {
      await fn();
      showSuccess(successMsg);
      await loadData();
    } catch (err) {
      setFormError(err.message || (isEn ? 'An error occurred during execution.' : 'Có lỗi xảy ra trong quá trình thực hiện.'));
      showError(err.message || (isEn ? 'An error occurred during execution.' : 'Có lỗi xảy ra trong quá trình thực hiện.'));
    } finally {
      setBusy(false);
    }
  };

  // Open Modal Handlers
  const openClassModal = (row = null) => {
    setFormError('');
    if (row) {
      setForm({
        name: row.name || '',
        sportId: row.sportId || '',
        roomId: row.roomId || '',
        coachId: row.coachId || '',
        capacity: row.capacity || 20,
        durationMinutes: row.durationMinutes || 60,
        level: row.level || 'Cơ bản',
        description: row.description || '',
        allowWaitlist: row.allowWaitlist !== false
      });
    } else {
      const firstActiveSport = data.sports.find((s) => s.status === 'Active');
      setForm({
        name: '',
        sportId: firstActiveSport ? firstActiveSport.id : '',
        roomId: '',
        coachId: '',
        capacity: 20,
        durationMinutes: 60,
        level: 'Cơ bản',
        description: '',
        allowWaitlist: true
      });
    }
    setModal({ type: 'class', row });
  };

  const openRoomModal = (row = null) => {
    if (row) {
      setForm({
        name: row.name || '',
        type: row.type || '',
        capacity: row.capacity || 30,
        location: row.location || ''
      });
    } else {
      setForm({
        name: '',
        type: isEn ? 'Multi-purpose Court' : 'Phòng đa năng',
        capacity: 30,
        location: isEn ? 'Floor 1 - Sports Complex' : 'Tầng 1 - Khu liên hợp'
      });
    }
    setModal({ type: 'room', row });
  };

  const openSportModal = (row = null) => {
    if (row) {
      setForm({
        name: row.name || '',
        description: row.description || '',
        status: row.status || 'Active'
      });
    } else {
      setForm({
        name: '',
        description: '',
        status: 'Active'
      });
    }
    setModal({ type: 'sport', row });
  };

  const openScheduleModal = async (classRow) => {
    try {
      setLoadingSchedules(true);
      setFormError('');
      setSchedules([]);
      setEditingScheduleId(null);
      setModal({ type: 'schedule', row: classRow });
      const fetchedSchedules = await classApi.getSchedules(classRow.id);
      setSchedules(fetchedSchedules || []);
      setForm({
        roomId: classRow.roomId || '',
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '09:30',
        startDate: todayDate(),
        endDate: futureDate(90)
      });
    } catch (err) {
      showError(err.message || (isEn ? 'Cannot load schedules for this class.' : 'Không thể tải lịch học của lớp này.'));
    } finally {
      setLoadingSchedules(false);
    }
  };

  // Submit Modal Form
  const handleSaveModal = async (e) => {
    e.preventDefault();
    const validation =
      modal.type === 'class'
        ? validateClassForm(form)
        : modal.type === 'schedule'
        ? validateScheduleForm(form)
        : '';
    if (validation) {
      setFormError(validation);
      return;
    }
    setFormError('');
    await executeAction(
      async () => {
        if (modal.type === 'class') {
          const body = {
            sportId: Number(form.sportId),
            roomId: form.roomId ? Number(form.roomId) : null,
            name: form.name.trim(),
            description: form.description ? form.description.trim() : null,
            level: form.level ? form.level.trim() : null,
            capacity: Number(form.capacity),
            durationMinutes: Number(form.durationMinutes || 60),
            allowWaitlist: form.allowWaitlist !== false
          };

          let savedClassId = modal.row ? modal.row.id : null;
          if (modal.row) {
            await classApi.update(modal.row.id, body);
          } else {
            const res = await classApi.create(body);
            savedClassId = res?.id || res?.classId;
          }

          if (savedClassId && form.coachId && String(form.coachId) !== String(modal.row?.coachId)) {
            try {
              await classApi.assignCoach(savedClassId, form.coachId);
            } catch (err) {
              const savedClass = { id: savedClassId, ...body };
              setModal({ type: 'class', row: savedClass });
              setFormError(
                isEn
                  ? `Saved class but could not assign coach: ${err.message || 'Please retry.'}`
                  : `Đã lưu thông tin lớp nhưng chưa phân công được HLV: ${err.message || 'Vui lòng thử lại.'}`
              );
              await loadData();
              throw new Error(
                isEn
                  ? `Saved class but could not assign coach: ${err.message || 'Please retry.'}`
                  : `Đã lưu lớp nhưng chưa phân công được HLV: ${err.message || 'Vui lòng thử lại.'}`
              );
            }
          }
        } else if (modal.type === 'sport') {
          const body = {
            name: form.name.trim(),
            description: form.description ? form.description.trim() : null,
            status: form.status || 'Active'
          };
          if (modal.row) {
            await classApi.updateSport(modal.row.id, body);
          } else {
            await classApi.createSport(body);
          }
        } else if (modal.type === 'room') {
          const body = {
            name: form.name.trim(),
            type: form.type ? form.type.trim() : null,
            capacity: Number(form.capacity),
            location: form.location ? form.location.trim() : null
          };
          if (modal.row) {
            await roomApi.update(modal.row.id, body);
          } else {
            await roomApi.create(body);
          }
        } else if (modal.type === 'schedule') {
          const body = {
            roomId: form.roomId ? Number(form.roomId) : null,
            dayOfWeek: Number(form.dayOfWeek),
            startTime: form.startTime.length === 5 ? `${form.startTime}:00` : form.startTime,
            endTime: form.endTime.length === 5 ? `${form.endTime}:00` : form.endTime,
            startDate: form.startDate,
            endDate: form.endDate
          };
          if (editingScheduleId) {
            await classApi.updateSchedule(modal.row.id, editingScheduleId, body);
          } else {
            await classApi.createSchedule(modal.row.id, body);
          }
          const refreshed = await classApi.getSchedules(modal.row.id);
          setSchedules(refreshed || []);
          setEditingScheduleId(null);
          setForm((prev) => ({
            ...prev,
            dayOfWeek: 1,
            startTime: '08:00',
            endTime: '09:30'
          }));
          return;
        }
        setModal(null);
      },
      modal.type === 'schedule'
        ? isEn
          ? 'Class schedule saved successfully!'
          : 'Lưu lịch học thành công!'
        : isEn
        ? 'Changes saved successfully!'
        : 'Đã lưu thay đổi thành công!'
    );
  };

  // Publish Class
  const handlePublishClass = async (cls) => {
    await executeAction(async () => {
      await classApi.publish(cls.id);
    }, isEn ? `Published class "${cls.name}" successfully!` : `Đã công bố lớp "${cls.name}" thành công!`);
  };

  // Cancel Class
  const handleConfirmCancelClass = async () => {
    if (!modal?.row) return;
    await executeAction(async () => {
      await classApi.cancel(modal.row.id);
      setModal(null);
    }, isEn ? `Cancelled class "${modal.row.name}".` : `Đã hủy lớp học "${modal.row.name}".`);
  };

  // Metrics Calculations
  const metrics = useMemo(() => {
    const classes = data.classes || [];
    const rooms = data.rooms || [];
    const sports = data.sports || [];

    const publishedClasses = classes.filter((c) => c.status === 'Published').length;
    const draftClasses = classes.filter((c) => c.status === 'Draft').length;
    const totalEnrolled = classes.reduce((sum, c) => sum + (c.enrolledCount || 0), 0);
    const totalRoomCapacity = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
    const sharedSportsCount = sports.filter((s) => s.isShared).length;
    const customSportsCount = sports.length - sharedSportsCount;
    const publishedRatio = classes.length > 0 ? Math.round((publishedClasses / classes.length) * 100) : 0;

    return {
      totalClasses: classes.length,
      publishedClasses,
      draftClasses,
      totalEnrolled,
      totalRooms: rooms.length,
      totalRoomCapacity,
      totalSports: sports.length,
      sharedSportsCount,
      customSportsCount,
      publishedRatio
    };
  }, [data]);

  // Filtered Items for Active Tab
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (tab === 'classes' || tab === 'cancelled') {
      const rows = tab === 'cancelled' ? classGroups.cancelled : classGroups.active;
      return filterClasses(rows, searchQuery).filter((cls) => {
        const matchesSport = !selectedSportFilter || String(cls.sportId) === String(selectedSportFilter);
        const matchesStatus =
          !selectedStatusFilter || String(cls.status).toLowerCase() === selectedStatusFilter.toLowerCase();
        return matchesSport && matchesStatus;
      });
    }

    if (tab === 'rooms') {
      return data.rooms.filter((room) => {
        const matchesQuery =
          !query ||
          (room.name && room.name.toLowerCase().includes(query)) ||
          (room.type && room.type.toLowerCase().includes(query)) ||
          (room.location && room.location.toLowerCase().includes(query));

        const matchesStatus =
          !selectedStatusFilter || String(room.status).toLowerCase() === selectedStatusFilter.toLowerCase();

        return matchesQuery && matchesStatus;
      });
    }

    if (tab === 'sports') {
      return data.sports.filter((sport) => {
        const matchesQuery =
          !query ||
          (sport.name && sport.name.toLowerCase().includes(query)) ||
          (sport.description && sport.description.toLowerCase().includes(query));

        const matchesStatus =
          !selectedStatusFilter || String(sport.status).toLowerCase() === selectedStatusFilter.toLowerCase();

        return matchesQuery && matchesStatus;
      });
    }

    return [];
  }, [data, classGroups, tab, searchQuery, selectedSportFilter, selectedStatusFilter]);

  if (loading) {
    return (
      <div className="min-h-[480px] flex items-center justify-center p-8">
        <LoadingSpinner text={isEn ? 'Synchronizing classes, courts and sports...' : 'Đang đồng bộ danh mục đào tạo, phòng tập và bộ môn...'} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-8 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-3xl shadow-sm text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <span className="material-symbols-outlined text-[32px]">error_outline</span>
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{isEn ? 'Cannot load management data' : 'Không thể tải dữ liệu quản lý'}</h3>
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
      {/* 1. Header Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#40916C] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-emerald-300/15 blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 -mb-16 h-48 w-48 rounded-full bg-[#F2CC8F]/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2CC8F]/20 backdrop-blur-md text-[#F2CC8F] text-xs font-black uppercase tracking-wider">
              <span className="material-symbols-outlined text-[14px]">sports_volleyball</span>
              {isEn ? 'Training & Facilities · SCMS PRO' : 'Quản trị đào tạo & Cơ sở vật chất · SCMS PRO'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-chivo tracking-tight text-white">
              {isEn ? 'Classes, Disciplines & Courts' : 'Quản lý Lớp học, Bộ môn & Phòng tập'}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              {isEn
                ? 'Coordinate sports training sessions, monitor court capacities, and standardize Olympic timetables.'
                : 'Điều phối vận hành các lớp huấn luyện thể thao, giám sát sức chứa phòng tập và tối ưu lịch biểu chuẩn hóa theo tiêu chuẩn Olympic.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing || busy}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/10 transition-all hover-lift disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
              <span>{isEn ? 'Refresh' : 'Làm mới'}</span>
            </button>

            {tab !== 'cancelled' && (
              <button
                onClick={() => {
                  if (tab === 'classes') openClassModal(null);
                  else if (tab === 'rooms') openRoomModal(null);
                  else openSportModal(null);
                }}
                disabled={busy}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-[#2D6A4F]/30 transition-all hover-lift disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>
                  {tab === 'classes' && (isEn ? 'Open New Class' : 'Mở lớp đào tạo mới')}
                  {tab === 'rooms' && (isEn ? 'Add Court / Room' : 'Thêm phòng / Sân mới')}
                  {tab === 'sports' && (isEn ? 'Add Sport Discipline' : 'Thêm bộ môn thể thao')}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Bento KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Classes */}
        <div
          onClick={() => setTab('classes')}
          className={`cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-5 border transition-all shadow-sm hover-lift ${
            tab === 'classes'
              ? 'border-[#2D6A4F] ring-2 ring-[#2D6A4F]/20 dark:border-[#81B29A]'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEn ? 'Total Training Classes' : 'Tổng lớp đào tạo'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">school</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{metrics.totalClasses}</span>
            <span className="text-xs font-medium text-slate-400">{isEn ? 'active classes' : 'lớp hoạt động'}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {metrics.publishedClasses} {isEn ? 'published' : 'đang mở'}
            </span>
            <span>·</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {metrics.draftClasses} {isEn ? 'drafts' : 'bản nháp'}
            </span>
          </div>
        </div>

        {/* Card 2: Rooms */}
        <div
          onClick={() => setTab('rooms')}
          className={`cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-5 border transition-all shadow-sm hover-lift ${
            tab === 'rooms'
              ? 'border-cyan-500 ring-2 ring-cyan-500/20 dark:border-cyan-400'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEn ? 'Courts & Facilities' : 'Phòng tập & Sân bãi'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">meeting_room</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{metrics.totalRooms}</span>
            <span className="text-xs font-medium text-slate-400">{isEn ? 'zones' : 'khu vực'}</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-cyan-500">group</span>
            <span>
              {isEn ? 'Capacity:' : 'Tổng sức chứa:'} <strong>{metrics.totalRoomCapacity}</strong> {isEn ? 'slots/session' : 'chỗ / ca'}
            </span>
          </div>
        </div>

        {/* Card 3: Sports */}
        <div
          onClick={() => setTab('sports')}
          className={`cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-5 border transition-all shadow-sm hover-lift ${
            tab === 'sports'
              ? 'border-amber-500 ring-2 ring-amber-500/20 dark:border-amber-400'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEn ? 'Sport Disciplines' : 'Bộ môn thể thao'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">fitness_center</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{metrics.totalSports}</span>
            <span className="text-xs font-medium text-slate-400">{isEn ? 'sports' : 'bộ môn'}</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{metrics.sharedSportsCount}</span> {isEn ? 'shared' : 'dùng chung'}
            <span>·</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">{metrics.customSportsCount}</span> {isEn ? 'center-specific' : 'riêng trung tâm'}
          </div>
        </div>

        {/* Card 4: Enrollment Rate */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover-lift transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEn ? 'Publish Ratio & Students' : 'Tỷ lệ công bố & Học viên'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{metrics.publishedRatio}%</span>
            <span className="text-xs font-medium text-slate-400">{isEn ? 'active ratio' : 'đạt chuẩn'}</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <span className="material-symbols-outlined text-[16px] text-emerald-500">how_to_reg</span>
            <span>
              {isEn ? 'Total' : 'Tổng'} <strong>{metrics.totalEnrolled}</strong> {isEn ? 'students enrolled' : 'học viên đã ghi danh'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Segmented Navigation Tabs & Smart Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          {/* Segmented Tab Buttons */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-full overflow-x-auto">
            <button
              onClick={() => {
                setTab('classes');
                setSelectedSportFilter('');
                setSelectedStatusFilter('');
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                tab === 'classes'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">school</span>
              <span>{isEn ? 'Active Classes' : 'Lớp đào tạo'}</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  tab === 'classes' ? 'bg-[#2D6A4F]/10 text-[#2D6A4F] dark:text-[#81B29A]' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {classGroups.active.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTab('cancelled');
                setSelectedSportFilter('');
                setSelectedStatusFilter('');
              }}
              className={`flex shrink-0 items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                tab === 'cancelled'
                  ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">event_busy</span>
              <span>{isEn ? 'Cancelled Classes' : 'Lớp đã hủy'}</span>
              <span className="text-[11px]">{classGroups.cancelled.length}</span>
            </button>

            <button
              onClick={() => {
                setTab('rooms');
                setSelectedSportFilter('');
                setSelectedStatusFilter('');
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                tab === 'rooms'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">meeting_room</span>
              <span>{isEn ? 'Courts & Rooms' : 'Phòng tập & Sân bãi'}</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  tab === 'rooms' ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {data.rooms.length}
              </span>
            </button>

            <button
              onClick={() => {
                setTab('sports');
                setSelectedSportFilter('');
                setSelectedStatusFilter('');
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                tab === 'sports'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">fitness_center</span>
              <span>{isEn ? 'Disciplines' : 'Bộ môn thể thao'}</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  tab === 'sports' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {data.sports.length}
              </span>
            </button>
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
              placeholder={
                tab === 'classes'
                  ? isEn
                    ? 'Search by class name, sport, coach, room...'
                    : 'Tìm theo tên lớp, bộ môn, HLV phụ trách, phòng tập...'
                  : tab === 'rooms'
                  ? isEn
                    ? 'Search by room name, type, location...'
                    : 'Tìm theo tên phòng, loại phòng, vị trí sân bãi...'
                  : isEn
                  ? 'Search by discipline name, description...'
                  : 'Tìm theo tên bộ môn, mô tả quy chuẩn...'
              }
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
          {tab === 'classes' && (
            <div className="w-full md:w-56">
              <select
                value={selectedSportFilter}
                onChange={(e) => setSelectedSportFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A]"
              >
                <option value="">{isEn ? 'All disciplines' : 'Tất cả bộ môn'}</option>
                {data.sports.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A]"
            >
              <option value="">{isEn ? 'All statuses' : 'Tất cả trạng thái'}</option>
              {tab === 'classes' ? (
                <>
                  <option value="Published">{isEn ? 'Published' : 'Đang mở (Published)'}</option>
                  <option value="Draft">{isEn ? 'Draft' : 'Bản nháp (Draft)'}</option>
                  <option value="Cancelled">{isEn ? 'Cancelled' : 'Đã hủy (Cancelled)'}</option>
                </>
              ) : (
                <>
                  <option value="Active">{isEn ? 'Active' : 'Đang sử dụng (Active)'}</option>
                  <option value="Inactive">{isEn ? 'Inactive' : 'Ngừng sử dụng (Inactive)'}</option>
                </>
              )}
            </select>
          </div>

          {/* Clear Filters */}
          {(searchQuery || selectedSportFilter || selectedStatusFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSportFilter('');
                setSelectedStatusFilter('');
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-xl transition shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
              {isEn ? 'Clear filters' : 'Xóa bộ lọc'}
            </button>
          )}
        </div>
      </div>

      {/* Info notice for Sports tab */}
      {tab === 'sports' && (
        <div className="flex items-center gap-3 p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 rounded-2xl text-sky-800 dark:text-sky-300 text-xs md:text-sm">
          <span className="material-symbols-outlined text-sky-600 dark:text-sky-400 text-[20px] shrink-0">info</span>
          <p>
            <strong>{isEn ? 'Management Note:' : 'Lưu ý quản trị:'}</strong>{' '}
            {isEn
              ? 'Disciplines labeled "Global Standard" are configured centrally and protected. Center-specific disciplines can be customized when no active classes are linked.'
              : 'Các bộ môn có nhãn "Dùng chung toàn hệ thống" là quy chuẩn chung do SCMS thiết lập và được bảo vệ. Bạn chỉ có thể sửa hoặc thay đổi trạng thái của các bộ môn riêng thuộc trung tâm khi không còn lớp học đang vận hành.'}
          </p>
        </div>
      )}

      {/* 4. Main Content: Grid Cards View vs Table View */}
      {tab === 'cancelled' ? (
        <div className="space-y-4">
          <p className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 text-sm text-amber-900 dark:text-amber-200">
            {isEn
              ? 'Restoring a class returns it to draft status. Cancelled schedules and member reservations remain archived for auditing.'
              : 'Mở lại lớp sẽ đưa lớp về bản nháp. Lịch và lượt đặt chỗ đã hủy được giữ nguyên để bảo toàn lịch sử.'}
          </p>
          {filteredItems.length ? (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredItems.map((cls) => (
                <article
                  key={cls.id}
                  className="rounded-2xl border border-rose-100 dark:border-rose-900/60 bg-white dark:bg-slate-900 p-5 space-y-3 hover-lift shadow-sm"
                >
                  <h2 className="font-bold text-slate-900 dark:text-slate-100">{cls.name}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {cls.sportName} · {cls.roomName || (isEn ? 'Unassigned Court' : 'Chưa có phòng')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button className={secondaryButton} disabled={busy} onClick={() => openScheduleModal(cls)}>
                      {isEn ? 'View Schedule History' : 'Xem lịch sử lịch'}
                    </button>
                    <button className={primaryButton} disabled={busy} onClick={() => setModal({ type: 'restore', row: cls })}>
                      {isEn ? 'Restore Class' : 'Mở lại lớp'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="p-8 text-center text-slate-500 dark:text-slate-400">
              {isEn ? 'No cancelled classes match filter.' : 'Chưa có lớp đã hủy phù hợp.'}
            </p>
          )}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[36px]">search_off</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">{isEn ? 'No matching records found' : 'Không tìm thấy kết quả phù hợp'}</h3>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {isEn
                ? 'No items match your active search terms or filters. Try adjusting your filters or create a new entry.'
                : 'Không có mục nào khớp với từ khóa tìm kiếm hoặc điều kiện lọc hiện tại. Hãy thử thay đổi bộ lọc hoặc thêm mục mới.'}
            </p>
          </div>
          <button
            onClick={() => {
              if (tab === 'classes') openClassModal(null);
              else if (tab === 'rooms') openRoomModal(null);
              else openSportModal(null);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E2235] hover:bg-[#2B2D42] text-white text-xs md:text-sm font-semibold rounded-xl transition shadow"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>{isEn ? 'Add New Item' : 'Thêm mới ngay'}</span>
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tab === 'classes' &&
            filteredItems.map((cls) => {
              const theme = getSportTheme(cls.sportName);
              const isPublished = cls.status === 'Published';
              const isDraft = cls.status === 'Draft';
              const isCancelled = cls.status === 'Cancelled';
              const enrollmentPercent =
                cls.capacity > 0 ? Math.min(100, Math.round(((cls.enrolledCount || 0) / cls.capacity) * 100)) : 0;

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

                      {isPublished ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {isEn ? 'Published' : 'Đang mở'}
                        </span>
                      ) : isDraft ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {isEn ? 'Draft' : 'Bản nháp'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                          {isEn ? 'Cancelled' : 'Đã hủy'}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base group-hover:text-[#2D6A4F] dark:group-hover:text-[#81B29A] transition line-clamp-1">
                        {cls.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[32px]">
                        {cls.description || (isEn ? 'Curriculum details not updated yet.' : 'Chưa cập nhật giáo trình và mô tả chi tiết cho lớp học này.')}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
                          {isEn ? 'Coach:' : 'HLV phụ trách:'}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {cls.coachName || <span className="text-amber-600 dark:text-amber-400 italic">{isEn ? 'Unassigned' : 'Chưa phân công'}</span>}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-slate-400">meeting_room</span>
                          {isEn ? 'Court / Room:' : 'Phòng tập:'}
                        </span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {cls.roomName || <span className="text-slate-400">{isEn ? 'Not assigned' : 'Chưa chỉ định'}</span>}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
                          {isEn ? 'Duration:' : 'Thời lượng:'}
                        </span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {cls.durationMinutes || 60} {isEn ? 'mins / session' : 'phút/buổi'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                          <span className="material-symbols-outlined text-[16px] text-slate-400">people</span>
                          {isEn ? 'Enrolled capacity:' : 'Sĩ số ghi danh:'}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {cls.enrolledCount || 0} / {cls.capacity} {isEn ? 'students' : 'học viên'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
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
                      {cls.allowWaitlist && (
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          {isEn ? 'Waitlist supported when full' : 'Hỗ trợ danh sách chờ khi kín chỗ'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => openScheduleModal(cls)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1E2235] hover:bg-[#2B2D42] text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                      <span>{isEn ? 'Schedule' : 'Lịch học'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {isDraft && (
                        <button
                          onClick={() => handlePublishClass(cls)}
                          disabled={busy}
                          title={isEn ? 'Publish class for member enrollment' : 'Công bố lớp học ra ngoài để hội viên đăng ký'}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                          <span className="hidden sm:inline">{isEn ? 'Publish' : 'Công bố'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => openClassModal(cls)}
                        disabled={busy}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        <span>{isEn ? 'Edit' : 'Sửa'}</span>
                      </button>

                      {!isCancelled && (
                        <button
                          onClick={() => setModal({ type: 'cancel', row: cls })}
                          disabled={busy}
                          title={isEn ? 'Cancel class' : 'Hủy lớp học'}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete_outline</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

          {tab === 'rooms' &&
            filteredItems.map((room) => (
              <div
                key={room.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm hover-lift flex flex-col justify-between overflow-hidden"
              >
                <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 to-teal-600" />
                <div className="p-5 space-y-4 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                      <span className="material-symbols-outlined text-[16px]">meeting_room</span>
                      {room.type || (isEn ? 'Sports Court' : 'Phòng tập thể thao')}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {room.status === 'Active' ? (isEn ? 'Active & Ready' : 'Sẵn sàng sử dụng') : room.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">{room.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">location_on</span>
                      <span>{room.location || (isEn ? 'Location details not updated' : 'Chưa cập nhật thông tin vị trí')}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-cyan-600 dark:text-cyan-400">group</span>
                      {isEn ? 'Maximum Capacity:' : 'Sức chứa tối đa:'}
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      {room.capacity} {isEn ? 'people / session' : 'người / ca'}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openRoomModal(room)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition active:scale-95 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    <span>{isEn ? 'Edit Court Info' : 'Chỉnh sửa thông tin phòng'}</span>
                  </button>
                </div>
              </div>
            ))}

          {tab === 'sports' &&
            filteredItems.map((sport) => {
              const theme = getSportTheme(sport.name);
              return (
                <div
                  key={sport.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm hover-lift flex flex-col justify-between overflow-hidden"
                >
                  <div className={`h-1.5 w-full bg-gradient-to-r ${theme.barGrad}`} />
                  <div className="p-5 space-y-4 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${theme.badgeClass}`}>
                        <span className="material-symbols-outlined text-[16px]">{theme.icon}</span>
                        {sport.isShared ? (isEn ? 'Global Standard' : 'Bộ môn hệ thống') : isEn ? 'Center-Specific' : 'Bộ môn riêng cơ sở'}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          sport.status === 'Active'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            sport.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {sport.status === 'Active' ? (isEn ? 'Active' : 'Đang sử dụng') : isEn ? 'Inactive' : 'Ngừng sử dụng'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
                        {sport.name}
                        {sport.isShared && (
                          <span
                            title={isEn ? 'Global system discipline' : 'Bộ môn dùng chung toàn hệ thống'}
                            className="material-symbols-outlined text-slate-400 text-[18px]"
                          >
                            lock
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3">
                        {sport.description || (isEn ? 'No standard description registered.' : 'Chưa có mô tả quy chuẩn cho bộ môn này.')}
                      </p>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      {sport.isShared ? (
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <span className="material-symbols-outlined text-[14px] text-blue-500">public</span>
                          {isEn ? 'Synchronized across all SCMS sports centers.' : 'Đồng bộ toàn bộ các trung tâm thể thao SCMS.'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-medium">
                          <span className="material-symbols-outlined text-[14px] text-amber-500">storefront</span>
                          {isEn ? 'Exclusive sport established at this facility.' : 'Bộ môn độc quyền thiết lập tại trung tâm này.'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                    {!sport.isShared ? (
                      <button
                        onClick={() => openSportModal(sport)}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition active:scale-95 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        <span>{isEn ? 'Edit Discipline' : 'Sửa bộ môn'}</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic flex items-center gap-1 py-1">
                        <span className="material-symbols-outlined text-[14px]">lock</span>
                        {isEn ? 'System Standard (Read-only)' : 'Quy chuẩn hệ thống (Chỉ xem)'}
                      </span>
                    )}
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
                  <th className="py-3.5 px-4">{isEn ? 'Name & Details' : 'Tên & Chi tiết'}</th>
                  <th className="py-3.5 px-4">{isEn ? 'Discipline / Category' : 'Bộ môn / Phân loại'}</th>
                  <th className="py-3.5 px-4">{isEn ? 'Location / Court' : 'Địa điểm / Phòng'}</th>
                  <th className="py-3.5 px-4">{isEn ? 'Capacity / Students' : 'Sức chứa / Học viên'}</th>
                  <th className="py-3.5 px-4">{isEn ? 'Status' : 'Trạng thái'}</th>
                  <th className="py-3.5 px-4 text-right">{isEn ? 'Actions' : 'Thao tác'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {tab === 'classes' &&
                  filteredItems.map((cls) => {
                    const theme = getSportTheme(cls.sportName);
                    return (
                      <tr key={cls.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{cls.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[14px] text-slate-400">person</span>
                            {isEn ? 'Coach:' : 'HLV:'} {cls.coachName || (isEn ? 'Unassigned' : 'Chưa phân công')}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${theme.badgeClass}`}>
                            <span className="material-symbols-outlined text-[14px]">{theme.icon}</span>
                            {cls.sportName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                          {cls.roomName || <span className="text-slate-400">{isEn ? 'Not assigned' : 'Chưa xếp'}</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {cls.enrolledCount || 0} / {cls.capacity} {isEn ? 'students' : 'học viên'}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {cls.durationMinutes || 60} {isEn ? 'mins / session' : 'phút/buổi'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {cls.status === 'Published' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              ● {isEn ? 'Published' : 'Đang mở'}
                            </span>
                          ) : cls.status === 'Draft' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              {isEn ? 'Draft' : 'Bản nháp'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {isEn ? 'Cancelled' : 'Đã hủy'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openScheduleModal(cls)}
                              className="px-2.5 py-1 bg-[#1E2235] hover:bg-[#2B2D42] text-white rounded-lg text-xs font-semibold transition"
                            >
                              {isEn ? 'Schedule' : 'Lịch học'}
                            </button>
                            {cls.status === 'Draft' && (
                              <button
                                onClick={() => handlePublishClass(cls)}
                                className="px-2.5 py-1 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-lg text-xs font-semibold transition"
                              >
                                {isEn ? 'Publish' : 'Công bố'}
                              </button>
                            )}
                            <button
                              onClick={() => openClassModal(cls)}
                              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition"
                            >
                              {isEn ? 'Edit' : 'Sửa'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {tab === 'rooms' &&
                  filteredItems.map((room) => (
                    <tr key={room.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{room.name}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {room.type || (isEn ? 'Multi-purpose Court' : 'Phòng đa năng')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {room.location || (isEn ? 'Sports Complex' : 'Khu liên hợp')}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {room.capacity} {isEn ? 'people / session' : 'người / ca'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          ● {room.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openRoomModal(room)}
                          className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition"
                        >
                          {isEn ? 'Edit' : 'Sửa'}
                        </button>
                      </td>
                    </tr>
                  ))}

                {tab === 'sports' &&
                  filteredItems.map((sport) => (
                    <tr key={sport.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{sport.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{sport.description}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {sport.isShared ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {isEn ? 'Global' : 'Dùng chung'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            {isEn ? 'Center Exclusive' : 'Riêng cơ sở'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">-</td>
                      <td className="py-3.5 px-4 text-slate-500">-</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            sport.status === 'Active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {sport.status === 'Active' ? (isEn ? '● Active' : '● Đang dùng') : isEn ? 'Inactive' : 'Ngừng dùng'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!sport.isShared ? (
                          <button
                            onClick={() => openSportModal(sport)}
                            className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition"
                          >
                            {isEn ? 'Edit' : 'Sửa'}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">{isEn ? 'Locked' : 'Khóa'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. MODALS SYSTEM */}

      {/* Modal: Cancel Class Confirmation */}
      <Modal
        isOpen={modal?.type === 'cancel'}
        onClose={() => !busy && setModal(null)}
        title={isEn ? 'Confirm Class Cancellation' : 'Xác nhận Hủy Lớp Học'}
      >
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-start gap-3">
            <span className="material-symbols-outlined text-rose-600 dark:text-rose-400 text-[26px] shrink-0">warning</span>
            <div className="space-y-1 text-sm text-rose-900 dark:text-rose-200">
              <p className="font-bold">
                {isEn ? `Are you sure you want to cancel class "${modal?.row?.name}"?` : `Bạn có chắc chắn muốn hủy lớp "${modal?.row?.name}"?`}
              </p>
              <p className="text-rose-700 dark:text-rose-300 text-xs">
                {isEn
                  ? 'This action will cancel all upcoming sessions in this class schedule and notify enrolled members.'
                  : 'Hành động này sẽ hủy tất cả các buổi học sắp tới trong lịch biểu của lớp và thông báo đến học viên đã ghi danh.'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setModal(null)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition"
            >
              {isEn ? 'Back' : 'Quay lại'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleConfirmCancelClass}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition shadow shadow-rose-600/20 disabled:opacity-50"
            >
              {busy ? (isEn ? 'Processing...' : 'Đang xử lý...') : isEn ? 'Confirm Cancellation' : 'Xác nhận hủy lớp'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modal?.type === 'restore'}
        onClose={() => !busy && setModal(null)}
        title={isEn ? 'Restore Cancelled Class' : 'Mở lại lớp đã hủy'}
      >
        {modal?.type === 'restore' && (
          <ConfirmRestore
            row={modal.row}
            busy={busy}
            isEn={isEn}
            onClose={() => setModal(null)}
            onConfirm={() =>
              executeAction(async () => {
                await classApi.restore(modal.row.id);
                setModal(null);
              }, isEn ? 'Class reopened in draft status.' : 'Đã mở lại lớp dưới dạng bản nháp.')
            }
          />
        )}
      </Modal>

      <Modal
        isOpen={modal?.type === 'schedule'}
        onClose={() => !busy && setModal(null)}
        title={isEn ? `Timetable: ${modal?.row?.name || ''}` : `Lịch học: ${modal?.row?.name || ''}`}
        maxWidth="max-w-7xl"
      >
        {modal?.type === 'schedule' &&
          (loadingSchedules ? (
            <LoadingSpinner text={isEn ? 'Loading class timetable...' : 'Đang tải lịch học...'} />
          ) : (
            <form onSubmit={handleSaveModal} className="space-y-4">
              {formError && <p role="alert" className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-sm text-rose-700 dark:text-rose-300">{formError}</p>}
              <ScheduleManager
                row={modal.row}
                schedules={schedules}
                rooms={data.rooms}
                form={form}
                change={handleFormChange}
                busy={busy}
                isEn={isEn}
                editingScheduleId={editingScheduleId}
                setEditingScheduleId={setEditingScheduleId}
                setForm={setForm}
                onReset={() => {
                  setEditingScheduleId(null);
                  setForm({
                    roomId: modal.row.roomId || '',
                    dayOfWeek: 1,
                    startTime: '08:00',
                    endTime: '09:30',
                    startDate: todayDate(),
                    endDate: futureDate(90)
                  });
                }}
                onCancelSchedule={(id) =>
                  executeAction(async () => {
                    await classApi.cancelSchedule(modal.row.id, id);
                    setSchedules(await classApi.getSchedules(modal.row.id));
                    setEditingScheduleId(null);
                  }, isEn ? 'Class schedule cancelled.' : 'Đã hủy lịch học.')
                }
              />
              {modal.row.status !== CLASS_STATUS.CANCELLED && (
                <div className="flex justify-end">
                  <button className={primaryButton} disabled={busy || loadingSchedules} type="submit">
                    {busy
                      ? isEn
                        ? 'Saving...'
                        : 'Đang lưu...'
                      : editingScheduleId
                      ? isEn
                        ? 'Save Schedule'
                        : 'Lưu lịch học'
                      : isEn
                      ? 'Add Session Time'
                      : 'Thêm ca học'}
                  </button>
                </div>
              )}
            </form>
          ))}
      </Modal>

      {/* Modal: Create / Edit Class */}
      <Modal
        isOpen={modal?.type === 'class'}
        onClose={() => !busy && setModal(null)}
        title={
          modal?.row
            ? isEn
              ? `Edit Class: ${modal.row.name}`
              : `Chỉnh sửa lớp: ${modal.row.name}`
            : isEn
            ? 'Open New Training Class'
            : 'Mở Lớp Đào Tạo Mới'
        }
      >
        <form onSubmit={handleSaveModal} className="space-y-4">
          {formError && <p role="alert" className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-sm text-rose-700 dark:text-rose-300">{formError}</p>}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isEn ? 'Class Name *' : 'Tên lớp đào tạo'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              maxLength={100}
              placeholder={isEn ? 'e.g. Olympic Freestyle Swimming K02' : 'VD: Bơi sải Kỹ thuật Olympic K02'}
              value={form.name || ''}
              onChange={handleFormChange}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Sport Discipline *' : 'Bộ môn thể thao'} <span className="text-rose-500">*</span>
              </label>
              <select
                name="sportId"
                required
                value={form.sportId || ''}
                onChange={handleFormChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A]"
              >
                <option value="">{isEn ? 'Select sport discipline' : 'Chọn bộ môn thể thao'}</option>
                {data.sports
                  .filter((s) => s.status === 'Active')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Training Level' : 'Cấp độ đào tạo'}
              </label>
              <select
                name="level"
                value={form.level || 'Cơ bản'}
                onChange={handleFormChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A]"
              >
                <option value="Cơ bản">{isEn ? 'Beginner (Cơ bản)' : 'Cơ bản (Người mới bắt đầu)'}</option>
                <option value="Trung cấp">{isEn ? 'Intermediate (Trung cấp)' : 'Trung cấp'}</option>
                <option value="Nâng cao">{isEn ? 'Advanced (Nâng cao)' : 'Nâng cao (Chuyên sâu)'}</option>
                <option value="Mọi cấp độ">{isEn ? 'All Levels (Mọi cấp độ)' : 'Mọi cấp độ (All Levels)'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Default Court / Room' : 'Phòng tập mặc định'}
              </label>
              <select
                name="roomId"
                value={form.roomId || ''}
                onChange={handleFormChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A]"
              >
                <option value="">{isEn ? 'Select court or room' : 'Chọn phòng tập / Sân bãi'}</option>
                {data.rooms
                  .filter((r) => r.status === 'Active')
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.type || (isEn ? 'Cap' : 'Sức chứa')}: {r.capacity})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Assigned Coach' : 'Huấn luyện viên phụ trách'}
              </label>
              <select
                name="coachId"
                value={form.coachId || ''}
                onChange={handleFormChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A]"
              >
                <option value="">{isEn ? 'Assign later' : 'Chưa phân công HLV ngay'}</option>
                {data.coaches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} {c.specialization ? `(${c.specialization})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Max Capacity (Students) *' : 'Sức chứa tối đa (Học viên)'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="capacity"
                min="1"
                max="500"
                required
                value={form.capacity || 20}
                onChange={handleFormChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Session Duration (Mins) *' : 'Thời lượng ca học (Phút)'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="durationMinutes"
                min="15"
                max="300"
                required
                value={form.durationMinutes || 60}
                onChange={handleFormChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isEn ? 'Description & Syllabus' : 'Mô tả chi tiết & Giáo trình khóa học'}
            </label>
            <textarea
              name="description"
              rows="3"
              maxLength={500}
              placeholder={isEn ? 'Course goals, expected skills, necessary equipment...' : 'Nhập mục tiêu khóa học, kỹ năng đạt được, trang bị cần chuẩn bị...'}
              value={form.description || ''}
              onChange={handleFormChange}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A]"
            />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                name="allowWaitlist"
                checked={form.allowWaitlist !== false}
                onChange={handleFormChange}
                className="w-4 h-4 text-[#2D6A4F] rounded border-slate-300 focus:ring-[#81B29A]"
              />
              <span>{isEn ? 'Allow member waitlist reservations when class is fully booked' : 'Cho phép hội viên đăng ký hàng chờ (Waitlist) khi lớp đầy chỗ'}</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={busy}
              onClick={() => setModal(null)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition"
            >
              {isEn ? 'Cancel' : 'Hủy bỏ'}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-sm font-semibold rounded-xl transition shadow shadow-[#2D6A4F]/20 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>
                {busy
                  ? isEn
                    ? 'Saving...'
                    : 'Đang lưu...'
                  : modal?.row
                  ? isEn
                    ? 'Save Class Changes'
                    : 'Lưu thay đổi lớp'
                  : isEn
                  ? 'Create Class'
                  : 'Tạo lớp đào tạo'}
              </span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create / Edit Room */}
      <Modal
        isOpen={modal?.type === 'room'}
        onClose={() => !busy && setModal(null)}
        title={
          modal?.row
            ? isEn
              ? `Edit Court/Room: ${modal.row.name}`
              : `Chỉnh sửa phòng: ${modal.row.name}`
            : isEn
            ? 'Add Court / Facility Room'
            : 'Thêm Phòng Tập / Sân Bãi'
        }
      >
        <form onSubmit={handleSaveModal} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isEn ? 'Court / Room Name *' : 'Tên phòng / Khu vực'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              maxLength={100}
              placeholder={isEn ? 'e.g. Olympic Pool 50m, Badminton Court #01' : 'VD: Bể bơi Olympic 50m, Sân Cầu lông #01'}
              value={form.name || ''}
              onChange={handleFormChange}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Room / Court Type' : 'Loại phòng / Sân bãi'}
              </label>
              <input
                type="text"
                name="type"
                maxLength={100}
                placeholder={isEn ? 'e.g. Swimming Pool, Indoor Court, Boxing Ring' : 'VD: Bể bơi, Sân trong nhà, Võ đài'}
                value={form.type || ''}
                onChange={handleFormChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Max Capacity (Persons) *' : 'Sức chứa tối đa (Người)'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="capacity"
                min="1"
                required
                value={form.capacity || 30}
                onChange={handleFormChange}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isEn ? 'Location / Floor / Directions' : 'Vị trí / Tầng / Chỉ dẫn'}
            </label>
            <input
              type="text"
              name="location"
              maxLength={255}
              placeholder={isEn ? 'e.g. Floor 1 - Aquatic Sports Center, Building A' : 'VD: Tầng 1 - Khu thể thao dưới nước, Tòa A'}
              value={form.location || ''}
              onChange={handleFormChange}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={busy}
              onClick={() => setModal(null)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition"
            >
              {isEn ? 'Cancel' : 'Hủy bỏ'}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-sm font-semibold rounded-xl transition shadow shadow-[#2D6A4F]/20 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>{busy ? (isEn ? 'Saving...' : 'Đang lưu...') : modal?.row ? (isEn ? 'Save Changes' : 'Lưu thay đổi') : isEn ? 'Create Court' : 'Tạo phòng tập'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create / Edit Sport */}
      <Modal
        isOpen={modal?.type === 'sport'}
        onClose={() => !busy && setModal(null)}
        title={
          modal?.row
            ? isEn
              ? `Edit Discipline: ${modal.row.name}`
              : `Chỉnh sửa bộ môn: ${modal.row.name}`
            : isEn
            ? 'Add New Sport Discipline'
            : 'Thêm Bộ Môn Thể Thao Mới'
        }
      >
        <form onSubmit={handleSaveModal} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isEn ? 'Discipline Name *' : 'Tên bộ môn thể thao'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              maxLength={100}
              placeholder={isEn ? 'e.g. Pickleball Pro, Sport Archery' : 'VD: Pickleball Đỉnh Cao, Bắn Cung Thể Thao'}
              value={form.name || ''}
              onChange={handleFormChange}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isEn ? 'Description & Regulations' : 'Mô tả bộ môn & Quy chuẩn'}
            </label>
            <textarea
              name="description"
              rows="3"
              maxLength={500}
              placeholder={isEn ? 'Discipline overview, physical requirements, gear...' : 'Nhập mô tả bộ môn, yêu cầu thể lực, trang thiết bị...'}
              value={form.description || ''}
              onChange={handleFormChange}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isEn ? 'Operational Status' : 'Trạng thái sử dụng'}
            </label>
            <select
              name="status"
              value={form.status || 'Active'}
              onChange={handleFormChange}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A]"
            >
              <option value="Active">{isEn ? 'Active' : 'Đang sử dụng (Active)'}</option>
              <option value="Inactive">{isEn ? 'Inactive' : 'Ngừng sử dụng (Inactive)'}</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={busy}
              onClick={() => setModal(null)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition"
            >
              {isEn ? 'Cancel' : 'Hủy bỏ'}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-sm font-semibold rounded-xl transition shadow shadow-[#2D6A4F]/20 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>{busy ? (isEn ? 'Saving...' : 'Đang lưu...') : modal?.row ? (isEn ? 'Save Changes' : 'Lưu thay đổi') : isEn ? 'Create Discipline' : 'Tạo bộ môn'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const field =
  'mt-1.5 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 w-full text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A] transition';
const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-sm font-bold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed';
const secondaryButton =
  'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed';
const timeValue = (value) => String(value || '').slice(0, 5);

const getStatusInfo = (isEn) => ({
  Draft: [isEn ? 'Draft' : 'Bản nháp', 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'],
  Published: [isEn ? 'Published' : 'Đang mở', 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'],
  Cancelled: [isEn ? 'Cancelled' : 'Đã hủy', 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'],
  Completed: [isEn ? 'Completed' : 'Đã kết thúc', 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'],
  Active: [isEn ? 'Active' : 'Đang sử dụng', 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'],
  Inactive: [isEn ? 'Inactive' : 'Ngừng sử dụng', 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700']
});

function StatusBadge({ value, isEn }) {
  const statusMap = getStatusInfo(isEn);
  const [label, css] = statusMap[value] || [value || (isEn ? 'Unknown' : 'Chưa rõ'), 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'];
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${css}`}>{label}</span>;
}

function Icon({ children, className = '' }) {
  return (
    <span aria-hidden="true" className={`material-symbols-outlined text-[18px] ${className}`}>
      {children}
    </span>
  );
}

function ScheduleManager({
  row,
  schedules,
  rooms,
  form,
  change,
  busy,
  isEn,
  editingScheduleId,
  setEditingScheduleId,
  setForm,
  onCancelSchedule,
  onReset
}) {
  const groups = groupSchedulesByDay(schedules);
  const readOnly = row.status === CLASS_STATUS.CANCELLED;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-[#1E2235] p-4 text-white">
        <div>
          <p className="font-black">{row.name}</p>
          <p className="text-xs text-slate-300">
            {row.sportName} · {isEn ? 'Default Court:' : 'Phòng mặc định:'} {row.roomName || (isEn ? 'Not selected' : 'Chưa chọn')}
          </p>
        </div>
        <StatusBadge value={row.status} isEn={isEn} />
      </div>

      <section aria-label={isEn ? 'Weekly timetable' : 'Lịch học theo tuần'}>
        <div className="mb-3">
          <h3 className="font-black text-slate-900 dark:text-slate-100">{isEn ? 'Weekly Timetable' : 'Lịch học hàng tuần'}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isEn ? 'Each session shows time, room and date range.' : 'Mỗi ca hiển thị đầy đủ giờ, phòng và khoảng hiệu lực.'}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2">
          {groups.map((group) => (
            <div key={group.dayOfWeek} className="min-h-32 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-2">
              <h4 className="mb-2 rounded-lg bg-white dark:bg-slate-900 px-2 py-1.5 text-center text-xs font-black text-slate-700 dark:text-slate-300 shadow-sm">
                {group.label}
              </h4>
              <div className="space-y-2">
                {group.items.map((schedule) => (
                  <div
                    key={schedule.id}
                    className={`rounded-lg border p-2.5 text-xs ${
                      schedule.status === 'Active'
                        ? 'border-emerald-100 dark:border-emerald-800/60 bg-white dark:bg-slate-900'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <strong className="text-sm text-slate-900 dark:text-slate-100">
                        {timeValue(schedule.startTime)}–{timeValue(schedule.endTime)}
                      </strong>
                      <span
                        className={`h-2 w-2 rounded-full ${schedule.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}
                        title={schedule.status === 'Active' ? (isEn ? 'Active' : 'Đang hoạt động') : isEn ? 'Cancelled' : 'Đã hủy'}
                      />
                    </div>
                    <p className="mt-1 flex items-start gap-1 text-slate-600 dark:text-slate-400">
                      <Icon className="text-[14px]">meeting_room</Icon>
                      {effectiveScheduleRoom(schedule, row, rooms)}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {schedule.startDate || (isEn ? 'Unlimited' : 'Không giới hạn')} → {schedule.endDate || (isEn ? 'Unlimited' : 'Không giới hạn')}
                    </p>
                    {!readOnly && schedule.status === 'Active' && (
                      <div className="mt-2 flex gap-1 border-t border-slate-100 dark:border-slate-800 pt-2">
                        <button
                          type="button"
                          aria-label={`Sửa lịch ${group.label} ${timeValue(schedule.startTime)}`}
                          className="text-[#2D6A4F] dark:text-[#81B29A] hover:underline font-bold"
                          disabled={busy}
                          onClick={() => {
                            setEditingScheduleId(schedule.id);
                            setForm({
                              ...schedule,
                              roomId: schedule.roomId || '',
                              startTime: timeValue(schedule.startTime),
                              endTime: timeValue(schedule.endTime)
                            });
                          }}
                        >
                          {isEn ? 'Edit' : 'Sửa'}
                        </button>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <button
                          type="button"
                          className="text-rose-600 dark:text-rose-400 hover:underline font-bold"
                          disabled={busy}
                          onClick={() => onCancelSchedule(schedule.id)}
                        >
                          {isEn ? 'Cancel' : 'Hủy'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {!group.items.length && <p className="py-5 text-center text-[11px] text-slate-400">{isEn ? 'Empty' : 'Trống'}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {!readOnly && (
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-900 dark:text-slate-100">
                {editingScheduleId ? (isEn ? 'Edit Session' : 'Chỉnh sửa ca học') : isEn ? 'Add Timetable Session' : 'Thêm ca học'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEn ? 'The system verifies court availability and coach conflicts.' : 'Hệ thống sẽ kiểm tra trùng phòng và lịch HLV.'}
              </p>
            </div>
            {editingScheduleId && (
              <button type="button" className={secondaryButton} onClick={onReset}>
                {isEn ? 'Discard Edit' : 'Bỏ chỉnh sửa'}
              </button>
            )}
          </div>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {isEn ? 'Day of Week' : 'Ngày trong tuần'}
              <select className={field} name="dayOfWeek" value={form.dayOfWeek ?? 1} onChange={change}>
                {WEEK_DAYS.map((day, index) => (
                  <option key={day} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {isEn ? 'Court / Room' : 'Phòng'}
              <select className={field} name="roomId" value={form.roomId || ''} onChange={change}>
                <option value="">{isEn ? 'Use default court' : 'Dùng phòng mặc định'}</option>
                {rooms
                  .filter((room) => room.status === 'Active')
                  .map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} · {room.capacity} {isEn ? 'people' : 'người'}
                    </option>
                  ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {isEn ? 'Start Date *' : 'Từ ngày *'}
              <input className={field} required type="date" name="startDate" value={form.startDate || ''} onChange={change} />
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {isEn ? 'End Date *' : 'Đến ngày *'}
              <input
                className={field}
                required
                type="date"
                name="endDate"
                min={form.startDate || undefined}
                value={form.endDate || ''}
                onChange={change}
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {isEn ? 'Start Time *' : 'Giờ bắt đầu *'}
              <input className={field} required type="time" name="startTime" value={form.startTime || ''} onChange={change} />
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {isEn ? 'End Time *' : 'Giờ kết thúc *'}
              <input className={field} required type="time" name="endTime" value={form.endTime || ''} onChange={change} />
            </label>
          </div>
        </section>
      )}
    </>
  );
}

function ConfirmRestore({ row, busy, isEn, onClose, onConfirm }) {
  return (
    <div className="space-y-5">
      <div className="flex gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-emerald-800 dark:text-emerald-300">
        <Icon className="shrink-0">restart_alt</Icon>
        <div>
          <p className="font-black">
            {isEn ? `Restore class "${row.name}"?` : `Mở lại lớp “${row.name}”?`}
          </p>
          <p className="mt-1 text-sm">
            {isEn
              ? 'The class will return to draft status for inspection and schedule re-configuration.'
              : 'Lớp sẽ trở về trạng thái bản nháp để bạn kiểm tra và cấu hình lại.'}
          </p>
        </div>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {isEn
          ? 'For data integrity, past cancelled sessions and bookings remain archived. Please create a new schedule, verify coach assignments, then publish.'
          : 'Vì an toàn dữ liệu, lịch, buổi học, đăng ký và lượt đặt chỗ cũ vẫn giữ trạng thái đã hủy. Hãy tạo lịch mới, kiểm tra HLV rồi công bố lại lớp.'}
      </p>
      <div className="flex justify-end gap-2">
        <button className={secondaryButton} disabled={busy} onClick={onClose}>
          {isEn ? 'Later' : 'Để sau'}
        </button>
        <button className={primaryButton} disabled={busy} onClick={onConfirm}>
          {busy ? (isEn ? 'Restoring...' : 'Đang mở lại...') : isEn ? 'Reopen as Draft' : 'Mở lại thành bản nháp'}
        </button>
      </div>
    </div>
  );
}
