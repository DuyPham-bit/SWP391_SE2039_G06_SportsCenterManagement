import React, { useState, useEffect, useMemo } from 'react';
import { classApi, roomApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner } from '../../components/common/Table.js';

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

const DAYS_OF_WEEK = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

const TIME_PRESETS = [
  { label: 'Sáng sớm (06:00 - 07:30)', start: '06:00', end: '07:30' },
  { label: 'Sáng (08:00 - 09:30)', start: '08:00', end: '09:30' },
  { label: 'Trưa (11:30 - 13:00)', start: '11:30', end: '13:00' },
  { label: 'Chiều (16:00 - 17:30)', start: '16:00', end: '17:30' },
  { label: 'Tối (18:00 - 19:30)', start: '18:00', end: '19:30' },
  { label: 'Tối muộn (19:30 - 21:00)', start: '19:30', end: '21:00' }
];

const todayDate = () => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
const futureDate = (days = 90) => {
  const d = new Date(Date.now() + (7 * 3600 + days * 86400) * 1000);
  return d.toISOString().slice(0, 10);
};

export function ClassesAndRooms() {
  const { showSuccess, showError } = useToast();
  const [tab, setTab] = useState('classes'); // 'classes' | 'rooms' | 'sports'
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
  const [modal, setModal] = useState(null); // { type: 'class'|'room'|'sport'|'schedule'|'cancel', row }
  const [form, setForm] = useState({});
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
        showSuccess('Dữ liệu đã được làm mới từ máy chủ!');
      }
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu lớp và cơ sở vật chất.');
      showError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Form Change Handler
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Safe Action Wrapper
  const executeAction = async (fn, successMsg = 'Thao tác thành công!') => {
    setBusy(true);
    try {
      await fn();
      showSuccess(successMsg);
      await loadData();
    } catch (err) {
      showError(err.message || 'Có lỗi xảy ra trong quá trình thực hiện.');
    } finally {
      setBusy(false);
    }
  };

  // Open Modal Handlers
  const openClassModal = (row = null) => {
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
        type: 'Phòng đa năng',
        capacity: 30,
        location: 'Tầng 1 - Khu liên hợp'
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
      setEditingScheduleId(null);
      setModal({ type: 'schedule', row: classRow });
      const fetchedSchedules = await classApi.getSchedules(classRow.id);
      setSchedules(fetchedSchedules || []);
      setForm({
        roomId: classRow.roomId || '',
        dayOfWeek: 1, // Thứ 2
        startTime: '08:00',
        endTime: '09:30',
        startDate: todayDate(),
        endDate: futureDate(90)
      });
    } catch (err) {
      showError(err.message || 'Không thể tải lịch học của lớp này.');
    } finally {
      setLoadingSchedules(false);
    }
  };

  // Submit Modal Form
  const handleSaveModal = async (e) => {
    e.preventDefault();
    await executeAction(async () => {
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

        // If coach is chosen, assign coach
        if (savedClassId && form.coachId) {
          try {
            await classApi.assignCoach(savedClassId, form.coachId);
          } catch (err) {
            console.warn('Lỗi phân công HLV:', err.message);
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
        // Reload schedules inside modal
        const refreshed = await classApi.getSchedules(modal.row.id);
        setSchedules(refreshed || []);
        setEditingScheduleId(null);
        setForm((prev) => ({
          ...prev,
          dayOfWeek: 1,
          startTime: '08:00',
          endTime: '09:30'
        }));
        return; // Keep modal open for schedule additions
      }
      setModal(null);
    }, modal.type === 'schedule' ? 'Lưu lịch học thành công!' : 'Đã lưu thay đổi thành công!');
  };

  // Publish Class
  const handlePublishClass = async (cls) => {
    await executeAction(async () => {
      await classApi.publish(cls.id);
    }, `Đã công bố lớp "${cls.name}" thành công!`);
  };

  // Cancel Class
  const handleConfirmCancelClass = async () => {
    if (!modal?.row) return;
    await executeAction(async () => {
      await classApi.cancel(modal.row.id);
      setModal(null);
    }, `Đã hủy lớp học "${modal.row.name}".`);
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

    if (tab === 'classes') {
      return data.classes.filter((cls) => {
        const matchesQuery =
          !query ||
          (cls.name && cls.name.toLowerCase().includes(query)) ||
          (cls.sportName && cls.sportName.toLowerCase().includes(query)) ||
          (cls.coachName && cls.coachName.toLowerCase().includes(query)) ||
          (cls.roomName && cls.roomName.toLowerCase().includes(query)) ||
          (cls.level && cls.level.toLowerCase().includes(query));

        const matchesSport =
          !selectedSportFilter || String(cls.sportId) === String(selectedSportFilter);

        const matchesStatus =
          !selectedStatusFilter || String(cls.status).toLowerCase() === selectedStatusFilter.toLowerCase();

        return matchesQuery && matchesSport && matchesStatus;
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
  }, [data, tab, searchQuery, selectedSportFilter, selectedStatusFilter]);

  if (loading) {
    return (
      <div className="min-h-[480px] flex items-center justify-center p-8">
        <LoadingSpinner text="Đang đồng bộ danh mục đào tạo, phòng tập và bộ môn..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-8 bg-rose-50 border border-rose-200 rounded-3xl shadow-sm text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <span className="material-symbols-outlined text-[32px]">error_outline</span>
        </div>
        <h3 className="text-xl font-bold text-slate-800">Không thể tải dữ liệu quản lý</h3>
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
        <div className="absolute right-40 -bottom-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              QUẢN TRỊ ĐÀO TẠO & CƠ SỞ VẬT CHẤT · SCMS PRO
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Quản lý Lớp học, Bộ môn & Phòng tập
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Điều phối vận hành các lớp huấn luyện thể thao, giám sát sức chứa phòng tập và tối ưu lịch biểu chuẩn hóa theo tiêu chuẩn Olympic.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing || busy}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-sm font-medium rounded-xl transition duration-150 backdrop-blur-sm hover:border-slate-600 active:scale-95 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin text-red-400' : 'text-slate-400'}`}>
                refresh
              </span>
              <span>Làm mới</span>
            </button>

            <button
              onClick={() => {
                if (tab === 'classes') openClassModal(null);
                else if (tab === 'rooms') openRoomModal(null);
                else openSportModal(null);
              }}
              disabled={busy}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-red-600/30 transition duration-150 active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span>
                {tab === 'classes' && 'Mở lớp đào tạo mới'}
                {tab === 'rooms' && 'Thêm phòng / Sân mới'}
                {tab === 'sports' && 'Thêm bộ môn thể thao'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Bento KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Classes */}
        <div
          onClick={() => setTab('classes')}
          className={`cursor-pointer bg-white rounded-2xl p-5 border transition-all duration-200 shadow-sm hover:shadow-md ${
            tab === 'classes' ? 'border-red-500 ring-2 ring-red-500/10' : 'border-slate-200 hover:border-slate-300'
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
            <span className="text-xs font-medium text-slate-500">lớp hoạt động</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {metrics.publishedClasses} đang mở
            </span>
            <span>·</span>
            <span className="text-amber-600 font-medium">{metrics.draftClasses} bản nháp</span>
          </div>
        </div>

        {/* Card 2: Rooms */}
        <div
          onClick={() => setTab('rooms')}
          className={`cursor-pointer bg-white rounded-2xl p-5 border transition-all duration-200 shadow-sm hover:shadow-md ${
            tab === 'rooms' ? 'border-cyan-500 ring-2 ring-cyan-500/10' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Phòng tập & Sân bãi</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">meeting_room</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{metrics.totalRooms}</span>
            <span className="text-xs font-medium text-slate-500">khu vực</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-cyan-500">group</span>
            <span>Tổng sức chứa: <strong>{metrics.totalRoomCapacity}</strong> chỗ / ca</span>
          </div>
        </div>

        {/* Card 3: Sports */}
        <div
          onClick={() => setTab('sports')}
          className={`cursor-pointer bg-white rounded-2xl p-5 border transition-all duration-200 shadow-sm hover:shadow-md ${
            tab === 'sports' ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Bộ môn thể thao</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">fitness_center</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{metrics.totalSports}</span>
            <span className="text-xs font-medium text-slate-500">bộ môn</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">{metrics.sharedSportsCount}</span> dùng chung
            <span>·</span>
            <span className="font-semibold text-amber-600">{metrics.customSportsCount}</span> riêng trung tâm
          </div>
        </div>

        {/* Card 4: Enrollment Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tỷ lệ công bố & Học viên</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">{metrics.publishedRatio}%</span>
            <span className="text-xs font-medium text-slate-500">đạt chuẩn</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
            <span className="material-symbols-outlined text-[16px] text-emerald-500">how_to_reg</span>
            <span>Tổng <strong>{metrics.totalEnrolled}</strong> học viên đã ghi danh</span>
          </div>
        </div>
      </div>

      {/* 3. Segmented Navigation Tabs & Smart Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          {/* Segmented Tab Buttons */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl max-w-full overflow-x-auto">
            <button
              onClick={() => {
                setTab('classes');
                setSelectedSportFilter('');
                setSelectedStatusFilter('');
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                tab === 'classes'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">school</span>
              <span>Lớp đào tạo</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                tab === 'classes' ? 'bg-red-50 text-red-600' : 'bg-slate-200 text-slate-600'
              }`}>
                {data.classes.length}
              </span>
            </button>

            <button
              onClick={() => {
                setTab('rooms');
                setSelectedSportFilter('');
                setSelectedStatusFilter('');
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                tab === 'rooms'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">meeting_room</span>
              <span>Phòng tập & Sân bãi</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                tab === 'rooms' ? 'bg-cyan-50 text-cyan-700' : 'bg-slate-200 text-slate-600'
              }`}>
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
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">fitness_center</span>
              <span>Bộ môn thể thao</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                tab === 'sports' ? 'bg-amber-50 text-amber-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {data.sports.length}
              </span>
            </button>
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
              placeholder={
                tab === 'classes'
                  ? 'Tìm theo tên lớp, bộ môn, HLV phụ trách, phòng tập...'
                  : tab === 'rooms'
                  ? 'Tìm theo tên phòng, loại phòng, vị trí sân bãi...'
                  : 'Tìm theo tên bộ môn, mô tả quy chuẩn...'
              }
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

          {/* Sport Filter (for classes tab) */}
          {tab === 'classes' && (
            <div className="w-full md:w-56">
              <select
                value={selectedSportFilter}
                onChange={(e) => setSelectedSportFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-700"
              >
                <option value="">Tất cả bộ môn</option>
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
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-700"
            >
              <option value="">Tất cả trạng thái</option>
              {tab === 'classes' ? (
                <>
                  <option value="Published">Đang mở (Published)</option>
                  <option value="Draft">Bản nháp (Draft)</option>
                  <option value="Cancelled">Đã hủy (Cancelled)</option>
                </>
              ) : (
                <>
                  <option value="Active">Đang sử dụng (Active)</option>
                  <option value="Inactive">Ngừng sử dụng (Inactive)</option>
                </>
              )}
            </select>
          </div>

          {/* Clear Filters Button */}
          {(searchQuery || selectedSportFilter || selectedStatusFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSportFilter('');
                setSelectedStatusFilter('');
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Info notice for Sports tab */}
      {tab === 'sports' && (
        <div className="flex items-center gap-3 p-4 bg-sky-50 border border-sky-200 rounded-2xl text-sky-800 text-xs md:text-sm">
          <span className="material-symbols-outlined text-sky-600 text-[20px] shrink-0">info</span>
          <p>
            <strong>Lưu ý quản trị:</strong> Các bộ môn có nhãn <strong>Dùng chung toàn hệ thống</strong> là quy chuẩn chung do SCMS thiết lập và được bảo vệ. Bạn chỉ có thể sửa hoặc thay đổi trạng thái của các bộ môn riêng thuộc trung tâm khi không còn lớp học đang vận hành.
          </p>
        </div>
      )}

      {/* 4. Main Content: Grid Cards View vs Table View */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[36px]">search_off</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">Không tìm thấy kết quả phù hợp</h3>
            <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto">
              Không có mục nào khớp với từ khóa tìm kiếm hoặc điều kiện lọc hiện tại. Hãy thử thay đổi bộ lọc hoặc thêm mục mới.
            </p>
          </div>
          <button
            onClick={() => {
              if (tab === 'classes') openClassModal(null);
              else if (tab === 'rooms') openRoomModal(null);
              else openSportModal(null);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs md:text-sm font-semibold rounded-xl transition shadow"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Thêm mới ngay</span>
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* ================= CARD VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tab === 'classes' &&
            filteredItems.map((cls) => {
              const theme = getSportTheme(cls.sportName);
              const isPublished = cls.status === 'Published';
              const isDraft = cls.status === 'Draft';
              const isCancelled = cls.status === 'Cancelled';
              const enrollmentPercent = cls.capacity > 0 ? Math.min(100, Math.round(((cls.enrolledCount || 0) / cls.capacity) * 100)) : 0;

              return (
                <div
                  key={cls.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all duration-200 shadow-sm hover:shadow-lg flex flex-col justify-between overflow-hidden group"
                >
                  {/* Top Colored Accent Stripe */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${theme.barGrad}`} />

                  <div className="p-5 space-y-4 flex-1">
                    {/* Header: Sport Tag & Status Badge */}
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

                      {/* Status */}
                      {isPublished ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Đang mở
                        </span>
                      ) : isDraft ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Bản nháp
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                          Đã hủy
                        </span>
                      )}
                    </div>

                    {/* Class Name & Description */}
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-red-600 transition line-clamp-1">
                        {cls.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">
                        {cls.description || 'Chưa cập nhật giáo trình và mô tả chi tiết cho lớp học này.'}
                      </p>
                    </div>

                    {/* Key Attributes */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                      {/* Coach info */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
                          HLV phụ trách:
                        </span>
                        <span className="font-semibold text-slate-800">
                          {cls.coachName || (
                            <span className="text-amber-600 italic">Chưa phân công</span>
                          )}
                        </span>
                      </div>

                      {/* Room & Location */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-slate-400">meeting_room</span>
                          Phòng tập:
                        </span>
                        <span className="font-medium text-slate-700">
                          {cls.roomName || <span className="text-slate-400">Chưa chỉ định</span>}
                        </span>
                      </div>

                      {/* Duration */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
                          Thời lượng:
                        </span>
                        <span className="font-medium text-slate-700">{cls.durationMinutes || 60} phút/buổi</span>
                      </div>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                          <span className="material-symbols-outlined text-[16px] text-slate-400">people</span>
                          Sĩ số ghi danh:
                        </span>
                        <span className="font-bold text-slate-800">
                          {cls.enrolledCount || 0} / {cls.capacity} học viên
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
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
                      {cls.allowWaitlist && (
                        <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          Hỗ trợ danh sách chờ khi kín chỗ
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => openScheduleModal(cls)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                      <span>Lịch học</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {isDraft && (
                        <button
                          onClick={() => handlePublishClass(cls)}
                          disabled={busy}
                          title="Công bố lớp học ra ngoài để hội viên đăng ký"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                          <span className="hidden sm:inline">Công bố</span>
                        </button>
                      )}

                      <button
                        onClick={() => openClassModal(cls)}
                        disabled={busy}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium transition active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        <span>Sửa</span>
                      </button>

                      {!isCancelled && (
                        <button
                          onClick={() => setModal({ type: 'cancel', row: cls })}
                          disabled={busy}
                          title="Hủy lớp học"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
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
            filteredItems.map((room) => {
              return (
                <div
                  key={room.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all duration-200 shadow-sm hover:shadow-lg flex flex-col justify-between overflow-hidden"
                >
                  <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 to-teal-600" />
                  <div className="p-5 space-y-4 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
                        <span className="material-symbols-outlined text-[16px]">meeting_room</span>
                        {room.type || 'Phòng tập thể thao'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {room.status === 'Active' ? 'Sẵn sàng sử dụng' : room.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-lg">{room.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">location_on</span>
                        <span>{room.location || 'Chưa cập nhật thông tin vị trí'}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-cyan-600">group</span>
                        Sức chứa tối đa:
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {room.capacity} người / ca
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => openRoomModal(room)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition active:scale-95 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      <span>Chỉnh sửa thông tin phòng</span>
                    </button>
                  </div>
                </div>
              );
            })}

          {tab === 'sports' &&
            filteredItems.map((sport) => {
              const theme = getSportTheme(sport.name);
              return (
                <div
                  key={sport.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all duration-200 shadow-sm hover:shadow-lg flex flex-col justify-between overflow-hidden"
                >
                  <div className={`h-1.5 w-full bg-gradient-to-r ${theme.barGrad}`} />
                  <div className="p-5 space-y-4 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${theme.badgeClass}`}>
                        <span className="material-symbols-outlined text-[16px]">{theme.icon}</span>
                        {sport.isShared ? 'Bộ môn hệ thống' : 'Bộ môn riêng cơ sở'}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          sport.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            sport.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {sport.status === 'Active' ? 'Đang sử dụng' : 'Ngừng sử dụng'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                        {sport.name}
                        {sport.isShared && (
                          <span
                            title="Bộ môn dùng chung toàn hệ thống"
                            className="material-symbols-outlined text-slate-400 text-[18px]"
                          >
                            lock
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-3">
                        {sport.description || 'Chưa có mô tả quy chuẩn cho bộ môn này.'}
                      </p>
                    </div>

                    <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {sport.isShared ? (
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <span className="material-symbols-outlined text-[14px] text-blue-500">public</span>
                          Đồng bộ toàn bộ các trung tâm thể thao SCMS.
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                          <span className="material-symbols-outlined text-[14px] text-amber-500">storefront</span>
                          Bộ môn độc quyền thiết lập tại trung tâm này.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2">
                    {!sport.isShared ? (
                      <button
                        onClick={() => openSportModal(sport)}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition active:scale-95 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        <span>Sửa bộ môn</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic flex items-center gap-1 py-1">
                        <span className="material-symbols-outlined text-[14px]">lock</span>
                        Quy chuẩn hệ thống (Chỉ xem)
                      </span>
                    )}
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
                  <th className="py-3.5 px-4">Tên & Chi tiết</th>
                  <th className="py-3.5 px-4">Bộ môn / Phân loại</th>
                  <th className="py-3.5 px-4">Địa điểm / Phòng</th>
                  <th className="py-3.5 px-4">Sức chứa / Học viên</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tab === 'classes' &&
                  filteredItems.map((cls) => {
                    const theme = getSportTheme(cls.sportName);
                    return (
                      <tr key={cls.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{cls.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[14px] text-slate-400">person</span>
                            HLV: {cls.coachName || 'Chưa phân công'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${theme.badgeClass}`}>
                            <span className="material-symbols-outlined text-[14px]">{theme.icon}</span>
                            {cls.sportName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {cls.roomName || <span className="text-slate-400">Chưa xếp</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">
                            {cls.enrolledCount || 0} / {cls.capacity} học viên
                          </div>
                          <div className="text-xs text-slate-500">{cls.durationMinutes || 60} phút/buổi</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {cls.status === 'Published' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ● Đang mở
                            </span>
                          ) : cls.status === 'Draft' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Bản nháp
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                              Đã hủy
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openScheduleModal(cls)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition"
                            >
                              Lịch học
                            </button>
                            {cls.status === 'Draft' && (
                              <button
                                onClick={() => handlePublishClass(cls)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition"
                              >
                                Công bố
                              </button>
                            )}
                            <button
                              onClick={() => openClassModal(cls)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
                            >
                              Sửa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {tab === 'rooms' &&
                  filteredItems.map((room) => (
                    <tr key={room.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{room.name}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{room.type || 'Phòng đa năng'}</td>
                      <td className="py-3.5 px-4 text-slate-600">{room.location || 'Khu liên hợp'}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{room.capacity} người / ca</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ● {room.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openRoomModal(room)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
                        >
                          Sửa
                        </button>
                      </td>
                    </tr>
                  ))}

                {tab === 'sports' &&
                  filteredItems.map((sport) => (
                    <tr key={sport.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{sport.name}</div>
                        <div className="text-xs text-slate-500 line-clamp-1">{sport.description}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {sport.isShared ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            Dùng chung
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Riêng cơ sở
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">-</td>
                      <td className="py-3.5 px-4 text-slate-500">-</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            sport.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {sport.status === 'Active' ? '● Đang dùng' : 'Ngừng dùng'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!sport.isShared ? (
                          <button
                            onClick={() => openSportModal(sport)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
                          >
                            Sửa
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Khóa</span>
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
        title="Xác nhận Hủy Lớp Học"
      >
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
            <span className="material-symbols-outlined text-rose-600 text-[26px] shrink-0">warning</span>
            <div className="space-y-1 text-sm text-rose-900">
              <p className="font-bold">
                Bạn có chắc chắn muốn hủy lớp "{modal?.row?.name}"?
              </p>
              <p className="text-rose-700 text-xs">
                Hành động này sẽ hủy tất cả các buổi học sắp tới trong lịch biểu của lớp và thông báo đến học viên đã ghi danh.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setModal(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
            >
              Quay lại
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleConfirmCancelClass}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition shadow shadow-rose-600/20 disabled:opacity-50"
            >
              {busy ? 'Đang xử lý...' : 'Xác nhận hủy lớp'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Schedule Manager */}
      <Modal
        isOpen={modal?.type === 'schedule'}
        onClose={() => !busy && setModal(null)}
        title={`Quản lý Lịch Học: ${modal?.row?.name || ''}`}
      >
        <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
          {/* Header info badge */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs text-slate-600">
            <div>
              <span className="text-slate-400">Bộ môn:</span>{' '}
              <strong className="text-slate-800">{modal?.row?.sportName}</strong>
            </div>
            <div>
              <span className="text-slate-400">Phòng mặc định:</span>{' '}
              <strong className="text-slate-800">{modal?.row?.roomName || 'Chưa chọn'}</strong>
            </div>
            <div>
              <span className="text-slate-400">Sức chứa:</span>{' '}
              <strong className="text-slate-800">{modal?.row?.capacity} học viên</strong>
            </div>
          </div>

          {/* List of existing schedules */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-blue-600">event_note</span>
              <span>Lịch học định kỳ đang thiết lập ({schedules.length})</span>
            </h4>

            {loadingSchedules ? (
              <div className="py-6 flex justify-center">
                <LoadingSpinner text="Đang tải danh sách lịch học..." />
              </div>
            ) : schedules.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center text-xs text-slate-500">
                Lớp này chưa có lịch học nào. Điền form bên dưới để thêm ca học định kỳ đầu tiên.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {schedules.map((sch) => {
                  const dayName = DAYS_OF_WEEK[sch.dayOfWeek] || `Thứ ${sch.dayOfWeek}`;
                  const isCurrentEditing = editingScheduleId === sch.id;
                  const isActive = sch.status === 'Active';

                  return (
                    <div
                      key={sch.id}
                      className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCurrentEditing
                          ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/10'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md text-xs font-bold">
                            {dayName}
                          </span>
                          <span className="text-sm font-extrabold text-blue-700">
                            {sch.startTime?.slice(0, 5)} - {sch.endTime?.slice(0, 5)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isActive ? 'Đang áp dụng' : 'Đã hủy'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Áp dụng từ: <strong>{sch.startDate}</strong> đến <strong>{sch.endDate}</strong>
                          {sch.roomName && (
                            <span> · Phòng: <strong>{sch.roomName}</strong></span>
                          )}
                        </p>
                      </div>

                      {isActive && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setEditingScheduleId(sch.id);
                              setForm({
                                roomId: sch.roomId || modal.row.roomId || '',
                                dayOfWeek: sch.dayOfWeek,
                                startTime: sch.startTime.slice(0, 5),
                                endTime: sch.endTime.slice(0, 5),
                                startDate: sch.startDate || todayDate(),
                                endDate: sch.endDate || futureDate(90)
                              });
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                          >
                            Sửa ca
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              executeAction(async () => {
                                await classApi.cancelSchedule(modal.row.id, sch.id);
                                const refreshed = await classApi.getSchedules(modal.row.id);
                                setSchedules(refreshed || []);
                                if (editingScheduleId === sch.id) setEditingScheduleId(null);
                              }, 'Đã hủy ca học định kỳ thành công.')
                            }
                            className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition"
                          >
                            Hủy ca
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form to Add or Edit Schedule */}
          <form onSubmit={handleSaveModal} className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-red-600">
                  {editingScheduleId ? 'edit_calendar' : 'add_circle'}
                </span>
                <span>{editingScheduleId ? 'Chỉnh sửa ca học đã chọn' : 'Thêm ca học định kỳ mới & Tạo các buổi học'}</span>
              </h4>

              {editingScheduleId && (
                <button
                  type="button"
                  onClick={() => {
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
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Hủy sửa, thêm mới
                </button>
              )}
            </div>

            {/* Quick Time Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Khung giờ mẫu nhanh:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TIME_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, startTime: preset.start, endTime: preset.end }));
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 rounded-lg text-[11px] font-medium transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thứ trong tuần <span className="text-rose-500">*</span>
                </label>
                <select
                  name="dayOfWeek"
                  value={form.dayOfWeek ?? 1}
                  onChange={handleFormChange}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs md:text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                >
                  {DAYS_OF_WEEK.map((d, i) => (
                    <option key={i} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phòng tập áp dụng cho ca này
                </label>
                <select
                  name="roomId"
                  value={form.roomId || ''}
                  onChange={handleFormChange}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                >
                  <option value="">Theo phòng mặc định của lớp</option>
                  {data.rooms
                    .filter((r) => r.status === 'Active')
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} (Sức chứa: {r.capacity})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Giờ bắt đầu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  name="startTime"
                  required
                  value={form.startTime || '08:00'}
                  onChange={handleFormChange}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Giờ kết thúc <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  name="endTime"
                  required
                  value={form.endTime || '09:30'}
                  onChange={handleFormChange}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Áp dụng từ ngày <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  required
                  value={form.startDate || todayDate()}
                  onChange={handleFormChange}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Đến ngày <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  required
                  value={form.endDate || futureDate(90)}
                  onChange={handleFormChange}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs md:text-sm font-semibold rounded-xl transition shadow active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>{busy ? 'Đang lưu...' : editingScheduleId ? 'Lưu cập nhật ca học' : 'Thêm ca học & Sinh lịch buổi'}</span>
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Create / Edit Class */}
      <Modal
        isOpen={modal?.type === 'class'}
        onClose={() => !busy && setModal(null)}
        title={modal?.row ? `Chỉnh sửa lớp: ${modal.row.name}` : 'Mở Lớp Đào Tạo Mới'}
      >
        <form onSubmit={handleSaveModal} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Tên lớp đào tạo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              maxLength={100}
              placeholder="VD: Bơi sải Kỹ thuật Olympic K02"
              value={form.name || ''}
              onChange={handleFormChange}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bộ môn thể thao <span className="text-rose-500">*</span>
              </label>
              <select
                name="sportId"
                required
                value={form.sportId || ''}
                onChange={handleFormChange}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              >
                <option value="">Chọn bộ môn thể thao</option>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cấp độ đào tạo
              </label>
              <select
                name="level"
                value={form.level || 'Cơ bản'}
                onChange={handleFormChange}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              >
                <option value="Cơ bản">Cơ bản (Người mới bắt đầu)</option>
                <option value="Trung cấp">Trung cấp</option>
                <option value="Nâng cao">Nâng cao (Chuyên sâu)</option>
                <option value="Mọi cấp độ">Mọi cấp độ (All Levels)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phòng tập mặc định
              </label>
              <select
                name="roomId"
                value={form.roomId || ''}
                onChange={handleFormChange}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              >
                <option value="">Chọn phòng tập / Sân bãi</option>
                {data.rooms
                  .filter((r) => r.status === 'Active')
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.type || 'Sức chứa'}: {r.capacity})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Huấn luyện viên phụ trách
              </label>
              <select
                name="coachId"
                value={form.coachId || ''}
                onChange={handleFormChange}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              >
                <option value="">Chưa phân công HLV ngay</option>
                {data.coaches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} {c.specialization ? `(${c.specialization})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sức chứa tối đa (Học viên) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="capacity"
                min="1"
                max="500"
                required
                value={form.capacity || 20}
                onChange={handleFormChange}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Thời lượng ca học (Phút) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="durationMinutes"
                min="15"
                max="300"
                required
                value={form.durationMinutes || 60}
                onChange={handleFormChange}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mô tả chi tiết & Giáo trình khóa học
            </label>
            <textarea
              name="description"
              rows="3"
              maxLength={500}
              placeholder="Nhập mục tiêu khóa học, kỹ năng đạt được, trang bị cần chuẩn bị..."
              value={form.description || ''}
              onChange={handleFormChange}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                name="allowWaitlist"
                checked={form.allowWaitlist !== false}
                onChange={handleFormChange}
                className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
              />
              <span>Cho phép hội viên đăng ký hàng chờ (Waitlist) khi lớp đầy chỗ</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={busy}
              onClick={() => setModal(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition shadow shadow-red-600/20 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>{busy ? 'Đang lưu...' : modal?.row ? 'Lưu thay đổi lớp' : 'Tạo lớp đào tạo'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create / Edit Room */}
      <Modal
        isOpen={modal?.type === 'room'}
        onClose={() => !busy && setModal(null)}
        title={modal?.row ? `Chỉnh sửa phòng: ${modal.row.name}` : 'Thêm Phòng Tập / Sân Bãi'}
      >
        <form onSubmit={handleSaveModal} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên phòng / Khu vực <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              maxLength={100}
              placeholder="VD: Bể bơi Olympic 50m, Sân Cầu lông #01"
              value={form.name || ''}
              onChange={handleFormChange}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Loại phòng / Sân bãi
              </label>
              <input
                type="text"
                name="type"
                maxLength={100}
                placeholder="VD: Bể bơi, Sân trong nhà, Võ đài"
                value={form.type || ''}
                onChange={handleFormChange}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sức chứa tối đa (Người) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="capacity"
                min="1"
                required
                value={form.capacity || 30}
                onChange={handleFormChange}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Vị trí / Tầng / Chỉ dẫn
            </label>
            <input
              type="text"
              name="location"
              maxLength={255}
              placeholder="VD: Tầng 1 - Khu thể thao dưới nước, Tòa A"
              value={form.location || ''}
              onChange={handleFormChange}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={busy}
              onClick={() => setModal(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-xl transition shadow shadow-cyan-600/20 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>{busy ? 'Đang lưu...' : modal?.row ? 'Lưu thay đổi' : 'Tạo phòng tập'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create / Edit Sport */}
      <Modal
        isOpen={modal?.type === 'sport'}
        onClose={() => !busy && setModal(null)}
        title={modal?.row ? `Chỉnh sửa bộ môn: ${modal.row.name}` : 'Thêm Bộ Môn Thể Thao Mới'}
      >
        <form onSubmit={handleSaveModal} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên bộ môn thể thao <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              maxLength={100}
              placeholder="VD: Pickleball Đỉnh Cao, Bắn Cung Thể Thao"
              value={form.name || ''}
              onChange={handleFormChange}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mô tả bộ môn & Quy chuẩn
            </label>
            <textarea
              name="description"
              rows="3"
              maxLength={500}
              placeholder="Nhập mô tả bộ môn, yêu cầu thể lực, trang thiết bị..."
              value={form.description || ''}
              onChange={handleFormChange}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Trạng thái sử dụng
            </label>
            <select
              name="status"
              value={form.status || 'Active'}
              onChange={handleFormChange}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              <option value="Active">Đang sử dụng (Active)</option>
              <option value="Inactive">Ngừng sử dụng (Inactive)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={busy}
              onClick={() => setModal(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition shadow shadow-amber-600/20 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>{busy ? 'Đang lưu...' : modal?.row ? 'Lưu thay đổi' : 'Tạo bộ môn'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
