import React, { useState, useEffect, useMemo } from 'react';
import { CoachError, useTeachingSessions, coachInput } from './CoachShared.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

// --- TIỆN ÍCH NGÀY THÁNG VÀ LỊCH CHUẨN OLYMPIC ---

function parseIsoDate(dateStr) {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

function formatIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff, 12, 0, 0);
}

function getWeekDays(startDate) {
  const monday = getMonday(startDate);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    days.push(nextDay);
  }
  return days;
}

function getMonthCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1, 12, 0, 0);
  const monday = getMonday(firstDay);
  const grid = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    grid.push(d);
  }
  return grid;
}

// Bảng màu nhận diện thể thao 15 bộ môn Olympic (hỗ trợ song ngữ VI / EN)
function getSportTheme(sportName = '', isEn = false) {
  const s = String(sportName).toLowerCase();
  if (s.includes('bơi') || s.includes('swim')) {
    return {
      bg: 'bg-cyan-50/90 hover:bg-cyan-100/90',
      border: 'border-cyan-300',
      text: 'text-cyan-900',
      badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      dot: 'bg-cyan-500',
      tag: isEn ? 'SWIMMING' : 'BƠI LỘI'
    };
  }
  if (s.includes('yoga') || s.includes('pilates')) {
    return {
      bg: 'bg-purple-50/90 hover:bg-purple-100/90',
      border: 'border-purple-300',
      text: 'text-purple-900',
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
      dot: 'bg-purple-500',
      tag: 'YOGA & PILATES'
    };
  }
  if (s.includes('cầu lông') || s.includes('badminton')) {
    return {
      bg: 'bg-emerald-50/90 hover:bg-emerald-100/90',
      border: 'border-emerald-300',
      text: 'text-emerald-900',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
      tag: isEn ? 'BADMINTON' : 'CẦU LÔNG'
    };
  }
  if (s.includes('gym') || s.includes('fitness')) {
    return {
      bg: 'bg-amber-50/90 hover:bg-amber-100/90',
      border: 'border-amber-300',
      text: 'text-amber-900',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
      tag: 'GYM & FITNESS'
    };
  }
  if (s.includes('boxing') || s.includes('võ') || s.includes('kickfit') || s.includes('martial')) {
    return {
      bg: 'bg-rose-50/90 hover:bg-rose-100/90',
      border: 'border-rose-300',
      text: 'text-rose-900',
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      dot: 'bg-rose-500',
      tag: isEn ? 'BOXING & MARTIAL ARTS' : 'BOXING & VÕ THUẬT'
    };
  }
  if (s.includes('bóng rổ') || s.includes('bóng đá') || s.includes('bóng chuyền') || s.includes('basketball') || s.includes('football')) {
    return {
      bg: 'bg-blue-50/90 hover:bg-blue-100/90',
      border: 'border-blue-300',
      text: 'text-blue-900',
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      dot: 'bg-blue-500',
      tag: isEn ? 'BALL & TEAM SPORTS' : 'BÓNG & ĐỒNG ĐỘI'
    };
  }
  if (s.includes('tennis') || s.includes('bóng bàn') || s.includes('table tennis') || s.includes('pickleball')) {
    return {
      bg: 'bg-lime-50/90 hover:bg-lime-100/90',
      border: 'border-lime-300',
      text: 'text-lime-900',
      badge: 'bg-lime-100 text-lime-800 border-lime-200',
      dot: 'bg-lime-500',
      tag: isEn ? 'RACKET SPORTS' : 'VỢT & BÓNG NHỎ'
    };
  }
  return {
    bg: 'bg-indigo-50/90 hover:bg-indigo-100/90',
    border: 'border-indigo-300',
    text: 'text-indigo-900',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    dot: 'bg-indigo-500',
    tag: isEn ? 'OLYMPIC SPORTS' : 'THỂ THAO OLYMPIC'
  };
}

const DAY_LABELS_VI = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const DAY_LABELS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SHORT_DAY_LABELS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const SHORT_DAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TeachingSchedule() {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const DAY_LABELS = isEn ? DAY_LABELS_EN : DAY_LABELS_VI;
  const SHORT_DAY_LABELS = isEn ? SHORT_DAY_LABELS_EN : SHORT_DAY_LABELS_VI;

  const STATUS_CONFIG = useMemo(() => ({
    SCHEDULED: {
      label: isEn ? 'Scheduled' : 'Đã lên lịch',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
      dotClass: 'bg-sky-500',
      icon: 'schedule'
    },
    COMPLETED: {
      label: isEn ? 'Completed' : 'Đã kết thúc',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotClass: 'bg-emerald-500',
      icon: 'task_alt'
    },
    CANCELLED: {
      label: isEn ? 'Cancelled' : 'Đã hủy',
      badgeClass: 'bg-red-50 text-red-700 border-red-200',
      dotClass: 'bg-red-500',
      icon: 'cancel'
    }
  }), [isEn]);

  const schedule = useTeachingSessions(60);

  // Chế độ xem: 'week' (Mặc định - Lịch tuần) | 'month' (Lịch tháng) | 'agenda' (Lịch biểu) | 'grid' (Lưới thẻ)
  const [viewMode, setViewMode] = useState('week');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => formatIsoDate(new Date()));

  // Bộ lọc
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('ALL'); // ALL | MORNING | AFTERNOON | EVENING
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // ALL | SCHEDULED | COMPLETED | CANCELLED
  const [searchQuery, setSearchQuery] = useState('');
  const [showPeriodConfig, setShowPeriodConfig] = useState(false);

  // Modal chi tiết ca dạy
  const [activeSession, setActiveSession] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const todayStr = useMemo(() => formatIsoDate(new Date()), []);

  // Tự động căn chỉnh tuần xem vào ngày có lớp nếu tuần hiện tại chưa có dữ liệu
  useEffect(() => {
    if (schedule.sessions && schedule.sessions.length > 0) {
      const today = formatIsoDate(new Date());
      const hasToday = schedule.sessions.some(s => s.sessionDate === today);
      if (!hasToday && schedule.sessions[0]?.sessionDate) {
        setCurrentDate(parseIsoDate(schedule.sessions[0].sessionDate));
        setSelectedCalendarDate(schedule.sessions[0].sessionDate);
      }
    }
  }, [schedule.sessions]);

  // Điều hướng lịch
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else {
      d.setDate(d.getDate() - 7);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setDate(d.getDate() + 7);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedCalendarDate(formatIsoDate(now));
  };

  // Mở modal chi tiết
  const handleOpenDetail = (session) => {
    setActiveSession(session);
    setDetailModalOpen(true);
  };

  // Format tên thứ của buổi dạy
  const formatDayOfWeek = (sessionDate, fallbackDay) => {
    if (sessionDate) {
      const d = parseIsoDate(sessionDate);
      return DAY_LABELS[d.getDay()];
    }
    return fallbackDay || '';
  };

  // Lọc danh sách ca dạy
  const filteredSessions = useMemo(() => {
    return schedule.sessions.filter(s => {
      // 1. Môn thể thao
      if (selectedSport !== 'ALL' && !s.sportName?.toLowerCase().includes(selectedSport.toLowerCase())) {
        return false;
      }

      // 2. Khung giờ
      if (selectedTimeSlot !== 'ALL') {
        const startHour = parseInt(s.startTime?.split(':')[0] || s.timeSlot?.split(':')[0] || '0', 10);
        if (selectedTimeSlot === 'MORNING' && startHour >= 12) return false;
        if (selectedTimeSlot === 'AFTERNOON' && (startHour < 12 || startHour >= 17)) return false;
        if (selectedTimeSlot === 'EVENING' && startHour < 17) return false;
      }

      // 3. Trạng thái
      if (selectedStatus !== 'ALL') {
        const norm = String(s.status || '').toUpperCase();
        if (norm !== selectedStatus) return false;
      }

      // 4. Tìm kiếm từ khóa
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.name?.toLowerCase().includes(q);
        const matchRoom = s.roomName?.toLowerCase().includes(q);
        const matchSport = s.sportName?.toLowerCase().includes(q);
        if (!matchName && !matchRoom && !matchSport) return false;
      }

      return true;
    });
  }, [schedule.sessions, selectedSport, selectedTimeSlot, selectedStatus, searchQuery]);

  // Gom nhóm ca dạy theo ngày YYYY-MM-DD
  const sessionsByDate = useMemo(() => {
    const map = new Map();
    filteredSessions.forEach(s => {
      const d = s.sessionDate;
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(s);
    });
    map.forEach(list => {
      list.sort((a, b) => (a.startTime || a.timeSlot || '').localeCompare(b.startTime || b.timeSlot || ''));
    });
    return map;
  }, [filteredSessions]);

  // Danh sách các ngày trong tuần
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  // Tiêu đề khoảng thời gian hiển thị
  const periodTitle = useMemo(() => {
    if (viewMode === 'month') {
      return isEn
        ? currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })
        : `Tháng ${currentDate.getMonth() + 1}, ${currentDate.getFullYear()}`;
    }
    const start = weekDays[0];
    const end = weekDays[6];
    if (isEn) {
      const startMonth = start.toLocaleString('en-US', { month: 'short' });
      const endMonth = end.toLocaleString('en-US', { month: 'short' });
      return `Week: ${start.getDate()} ${startMonth} - ${end.getDate()} ${endMonth}, ${end.getFullYear()}`;
    }
    return `Tuần: ${start.getDate()} Th${start.getMonth() + 1} - ${end.getDate()} Th${end.getMonth() + 1}, ${end.getFullYear()}`;
  }, [viewMode, currentDate, weekDays, isEn]);

  // Danh sách các bộ môn có ca dạy kèm số lượng
  const availableSports = useMemo(() => {
    const map = new Map();
    schedule.sessions.forEach(s => {
      const sp = s.sportName || (isEn ? 'Unclassified' : 'Chưa phân loại');
      map.set(sp, (map.get(sp) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [schedule.sessions, isEn]);

  // Thống kê nhanh KPI
  const stats = useMemo(() => {
    const total = filteredSessions.length;
    const scheduled = filteredSessions.filter(s => s.status === 'SCHEDULED').length;
    const completed = filteredSessions.filter(s => s.status === 'COMPLETED').length;
    const totalEnrolled = filteredSessions.reduce((acc, s) => acc + (s.enrolledCount || 0), 0);
    return { total, scheduled, completed, totalEnrolled };
  }, [filteredSessions]);

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER BANNER */}
      <div className="rounded-[24px] bg-gradient-to-br from-[#32354D] via-[#2B2D42] to-[#1E2235] text-white p-6 sm:p-8 relative overflow-hidden border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#81B29A]/15 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 -bottom-16 w-56 h-56 rounded-full bg-[#F2CC8F]/15 blur-3xl" />

        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[rgba(242,204,143,0.15)] text-[#F2CC8F] text-[11px] font-bold uppercase tracking-widest border border-[rgba(242,204,143,0.3)] mb-2">
            <span className="w-2 h-2 rounded-full bg-[#F2CC8F] animate-pulse" />
            {isEn ? 'Professional Teaching Schedule' : 'Lịch giảng dạy chuyên môn'}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[28px] text-[#F2CC8F]">calendar_month</span>
            {isEn ? 'Coach Teaching Schedule' : 'Lịch Giảng Dạy Của Huấn Luyện Viên'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {isEn
              ? 'Track assigned teaching sessions, student enrollment, and take attendance according to Olympic sports standards.'
              : 'Theo dõi các ca dạy, sĩ số học viên và thực hiện điểm danh lớp học được phân công theo chuẩn thể thao Olympic.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <button
            type="button"
            onClick={() => setShowPeriodConfig(!showPeriodConfig)}
            className="px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
          >
            <span className="material-symbols-outlined text-[16px] text-[#F2CC8F]">date_range</span>
            <span>
              {isEn ? `Date Range (${schedule.from} → ${schedule.to})` : `Khoảng ngày (${schedule.from} → ${schedule.to})`}
            </span>
            <span className="material-symbols-outlined text-[16px]">
              {showPeriodConfig ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>
      </div>

      {/* Tùy chỉnh khoảng ngày API (Collapsible) */}
      {showPeriodConfig && (
        <form
          onSubmit={e => {
            e.preventDefault();
            schedule.reload();
          }}
          className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-wrap items-end gap-3 text-xs animate-fadeIn"
        >
          <label className="font-semibold text-slate-700 space-y-1">
            <span>{isEn ? 'From Date:' : 'Từ ngày:'}</span>
            <input
              type="date"
              required
              className={coachInput}
              value={schedule.from}
              onChange={e => schedule.setFrom(e.target.value)}
            />
          </label>
          <label className="font-semibold text-slate-700 space-y-1">
            <span>{isEn ? 'To Date:' : 'Đến ngày:'}</span>
            <input
              type="date"
              required
              className={coachInput}
              value={schedule.to}
              onChange={e => schedule.setTo(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={schedule.loading}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {schedule.loading ? (isEn ? 'Loading...' : 'Đang tải...') : (isEn ? 'Apply Date Range' : 'Áp dụng khoảng ngày')}
          </button>
          <span className="text-slate-500 self-center">
            {isEn ? 'Maximum 92 days per request.' : 'Tối đa 92 ngày cho mỗi lần tải dữ liệu.'}
          </span>
        </form>
      )}

      {/* 2. KPI QUICK STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>{isEn ? 'Total Sessions' : 'Tổng ca dạy'}</span>
            <span className="material-symbols-outlined text-[18px] text-slate-400">fitness_center</span>
          </div>
          <div className="font-chivo text-2xl font-black text-slate-900 mt-2">
            {stats.total}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/60 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-sky-800">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
              {isEn ? 'Scheduled' : 'Đã lên lịch'}
            </span>
            <span className="material-symbols-outlined text-[18px] text-sky-600">schedule</span>
          </div>
          <div className="font-chivo text-2xl font-black text-sky-900 mt-2">
            {stats.scheduled}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-800">
            <span>{isEn ? 'Completed' : 'Đã kết thúc'}</span>
            <span className="material-symbols-outlined text-[18px] text-emerald-600">task_alt</span>
          </div>
          <div className="font-chivo text-2xl font-black text-emerald-900 mt-2">
            {stats.completed}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#F2CC8F]/60 bg-[#FFFDF9] shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#92400E]">
            <span>{isEn ? 'Student Enrollments' : 'Lượt học viên'}</span>
            <span className="material-symbols-outlined text-[18px] text-[#D97706]">group</span>
          </div>
          <div className="font-chivo text-2xl font-black text-[#1E2235] mt-2">
            {stats.totalEnrolled}
          </div>
        </div>
      </div>

      <CoachError message={schedule.error} retry={schedule.reload} />

      {/* 3. CALENDAR CONTROLS & MULTI-FILTER BAR */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        {/* Row 1: Calendar Navigation & View Mode Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          {/* Navigation buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrev}
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-colors shadow-xs cursor-pointer"
              title={isEn ? 'Previous' : 'Khoảng trước'}
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              {isEn ? 'Today' : 'Hôm nay'}
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-colors shadow-xs cursor-pointer"
              title={isEn ? 'Next' : 'Khoảng sau'}
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>

            <h2 className="font-chivo font-black text-slate-900 text-sm sm:text-base ml-2">
              {periodTitle}
            </h2>
          </div>

          {/* View mode switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">view_week</span>
              <span>{isEn ? 'Week View' : 'Lịch Tuần'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              <span>{isEn ? 'Month View' : 'Lịch Tháng'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'agenda' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">view_agenda</span>
              <span>{isEn ? 'Agenda' : 'Lịch Biểu'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
              <span>{isEn ? 'Grid View' : 'Lưới Thẻ'}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Search, Time Slot & Status Dropdowns, Quick Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search Input */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isEn ? 'Search class, room, sport...' : 'Tìm tên lớp, phòng, bộ môn...'}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white font-medium"
            />
          </div>

          {/* Time Slot Filter */}
          <div>
            <select
              value={selectedTimeSlot}
              onChange={e => setSelectedTimeSlot(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white font-medium cursor-pointer"
            >
              <option value="ALL">{isEn ? '⏰ All Time Slots' : '⏰ Tất cả khung giờ'}</option>
              <option value="MORNING">{isEn ? '🌅 Morning (< 12:00)' : '🌅 Ca Sáng (< 12:00)'}</option>
              <option value="AFTERNOON">{isEn ? '☀️ Afternoon (12:00 - 17:00)' : '☀️ Ca Chiều (12:00 - 17:00)'}</option>
              <option value="EVENING">{isEn ? '🌙 Evening (> 17:00)' : '🌙 Ca Tối (> 17:00)'}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white font-medium cursor-pointer"
            >
              <option value="ALL">{isEn ? '🎯 All Statuses' : '🎯 Tất cả trạng thái'}</option>
              <option value="SCHEDULED">{isEn ? '🔵 Scheduled' : '🔵 Đã lên lịch'}</option>
              <option value="COMPLETED">{isEn ? '🟢 Completed' : '🟢 Đã kết thúc'}</option>
              <option value="CANCELLED">{isEn ? '🔴 Cancelled' : '🔴 Đã hủy'}</option>
            </select>
          </div>

          {/* Quick Date Picker */}
          <div>
            <input
              type="date"
              value={formatIsoDate(currentDate)}
              onChange={e => {
                if (e.target.value) {
                  const d = parseIsoDate(e.target.value);
                  setCurrentDate(d);
                  setSelectedCalendarDate(e.target.value);
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white font-medium"
            />
          </div>
        </div>

        {/* Row 3: Sport Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            {isEn ? 'Sport:' : 'Bộ môn:'}
          </span>
          <button
            type="button"
            onClick={() => setSelectedSport('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold font-chivo transition-all cursor-pointer ${
              selectedSport === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isEn ? `All (${schedule.sessions.length})` : `Tất cả (${schedule.sessions.length})`}
          </button>
          {availableSports.map(s => {
            const theme = getSportTheme(s.name, isEn);
            const isSelected = selectedSport === s.name;
            return (
              <button
                type="button"
                key={s.name}
                onClick={() => setSelectedSport(s.name)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-[#3D405B] text-[#F2CC8F] border-[#3D405B] shadow-xs'
                    : `bg-white ${theme.text} ${theme.border} hover:bg-slate-50`
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#F2CC8F]' : theme.dot}`} />
                <span>{s.name}</span>
                <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-[#F2CC8F] text-[#1E2235]' : 'bg-slate-100 text-slate-600'}`}>
                  {s.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading feedback */}
      {schedule.loading && (
        <div role="status" className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <span className="material-symbols-outlined text-[#81B29A] text-[32px] animate-spin">
            progress_activity
          </span>
          <p className="text-sm font-semibold text-slate-700">
            {isEn ? 'Loading coach teaching schedule...' : 'Đang tải lịch giảng dạy của huấn luyện viên...'}
          </p>
        </div>
      )}

      {/* 4. MAIN CALENDAR BODY BY VIEW MODE */}
      {!schedule.loading && (
        <>
          {/* --- A. CHẾ ĐỘ LỊCH TUẦN (WEEK TIMETABLE VIEW - 7 CỘT THỨ 2 ĐẾN CN) --- */}
          {viewMode === 'week' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Weekday Header Columns */}
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 divide-x divide-slate-200 text-center">
                {weekDays.map(day => {
                  const dayStr = formatIsoDate(day);
                  const isToday = dayStr === todayStr;
                  const isSelected = dayStr === selectedCalendarDate;
                  const daySessionsCount = (sessionsByDate.get(dayStr) || []).length;

                  return (
                    <div
                      key={dayStr}
                      onClick={() => setSelectedCalendarDate(dayStr)}
                      className={`py-3 px-1 transition-colors cursor-pointer ${
                        isSelected ? 'bg-red-50/60' : 'hover:bg-slate-100/60'
                      }`}
                    >
                      <span className="text-[11px] font-bold uppercase text-slate-500 block truncate">
                        {DAY_LABELS[day.getDay()]}
                      </span>
                      <div className="mt-1 flex items-center justify-center gap-1">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                            isToday
                              ? 'bg-[#3D405B] text-[#F2CC8F] shadow-xs'
                              : 'text-slate-900'
                          }`}
                        >
                          {day.getDate()}
                        </span>
                      </div>
                      {daySessionsCount > 0 ? (
                        <span className="inline-block mt-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700">
                          {daySessionsCount} {isEn ? (daySessionsCount === 1 ? 'session' : 'sessions') : 'ca'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 block mt-1">{isEn ? 'Free' : 'Trống'}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 7 Cột Ca Học Trong Tuần */}
              <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-200 min-h-[480px] bg-slate-50/30">
                {weekDays.map(day => {
                  const dayStr = formatIsoDate(day);
                  const daySessions = sessionsByDate.get(dayStr) || [];
                  const isToday = dayStr === todayStr;

                  return (
                    <div
                      key={dayStr}
                      className={`p-2.5 space-y-2.5 transition-colors ${
                        isToday ? 'bg-[#81B29A]/10' : ''
                      }`}
                    >
                      {/* Tiêu đề ngày trên mobile nhỏ */}
                      <div className="md:hidden pb-1 border-b border-slate-200 flex justify-between items-center text-xs font-bold">
                        <span>{DAY_LABELS[day.getDay()]} ({dayStr})</span>
                        <span className="text-slate-500">
                          {daySessions.length} {isEn ? (daySessions.length === 1 ? 'session' : 'sessions') : 'ca dạy'}
                        </span>
                      </div>

                      {daySessions.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          <span className="material-symbols-outlined text-2xl text-slate-300 block mb-1">
                            event_busy
                          </span>
                          <span>{isEn ? 'No sessions' : 'Không có ca'}</span>
                        </div>
                      ) : (
                        daySessions.map(s => {
                          const theme = getSportTheme(s.sportName, isEn);
                          const statusInfo = STATUS_CONFIG[s.status] || STATUS_CONFIG.SCHEDULED;
                          const percent = s.capacity > 0 ? Math.min(100, Math.round((s.enrolledCount / s.capacity) * 100)) : 0;

                          return (
                            <div
                              key={s.id}
                              onClick={() => handleOpenDetail(s)}
                              className={`p-3 rounded-xl border text-xs cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 space-y-2 ${theme.bg} ${theme.border} shadow-xs`}
                            >
                              {/* Time & Sport Tag */}
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-[11px] text-slate-900 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px] text-[#F2CC8F]">schedule</span>
                                  <span>{s.timeSlot}</span>
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${theme.badge}`}>
                                  {theme.tag}
                                </span>
                              </div>

                              {/* Class Name */}
                              <h4 className="font-chivo font-black text-slate-900 leading-snug line-clamp-2">
                                {s.name}
                              </h4>

                              {/* Room & Status */}
                              <div className="text-[11px] text-slate-600 space-y-1">
                                <div className="truncate flex items-center gap-1 text-slate-600">
                                  <span className="material-symbols-outlined text-[13px] text-slate-400">meeting_room</span>
                                  <span>{s.roomName}</span>
                                </div>

                                <div className="flex items-center justify-between gap-1 pt-1 border-t border-black/5">
                                  <span className="font-bold text-slate-700">
                                    {s.enrolledCount}/{s.capacity} {isEn ? 'Students' : 'HV'}
                                  </span>
                                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${statusInfo.badgeClass}`}>
                                    {statusInfo.label}
                                  </span>
                                </div>

                                {/* Progress bar */}
                                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${percent >= 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>

                              {/* Action Links */}
                              <div className="pt-2 border-t border-black/5 flex items-center justify-between text-[11px] font-bold">
                                <a
                                  href={`#/coach/members?classId=${s.classId}`}
                                  onClick={e => e.stopPropagation()}
                                  className="text-slate-700 hover:text-slate-900 flex items-center gap-0.5 hover:underline"
                                >
                                  <span className="material-symbols-outlined text-[13px]">group</span>
                                  <span>{isEn ? 'Students' : 'Học viên'}</span>
                                </a>
                                <a
                                  href={`#/coach/attendance?sessionId=${s.id}&date=${s.sessionDate}`}
                                  onClick={e => e.stopPropagation()}
                                  className="text-[#3D405B] hover:text-[#E07A5F] flex items-center gap-0.5 hover:underline font-semibold"
                                >
                                  <span className="material-symbols-outlined text-[13px]">how_to_reg</span>
                                  <span>{isEn ? 'Attendance' : 'Điểm danh'}</span>
                                </a>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* --- B. CHẾ ĐỘ LỊCH THÁNG (MONTH CALENDAR VIEW - 42 Ô LƯỚI) --- */}
          {viewMode === 'month' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header 7 Ngày trong tuần */}
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 divide-x divide-slate-200 text-center py-2 text-xs font-bold text-slate-600">
                  {SHORT_DAY_LABELS.map(lbl => (
                    <div key={lbl} className="uppercase tracking-wider">{lbl}</div>
                  ))}
                </div>

                {/* Grid 42 Ngày của Tháng */}
                <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-50/20">
                  {getMonthCalendarGrid(currentDate.getFullYear(), currentDate.getMonth()).map((d, index) => {
                    const dateStr = formatIsoDate(d);
                    const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                    const isToday = dateStr === todayStr;
                    const isSelected = dateStr === selectedCalendarDate;
                    const daySessions = sessionsByDate.get(dateStr) || [];

                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedCalendarDate(dateStr)}
                        className={`min-h-[90px] p-1.5 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-red-50/70 ring-2 ring-red-500/30'
                            : isToday
                            ? 'bg-red-50/20 hover:bg-slate-100/60'
                            : isCurrentMonth
                            ? 'bg-white hover:bg-slate-50'
                            : 'bg-slate-50/60 text-slate-400 hover:bg-slate-100/40'
                        }`}
                      >
                        {/* Header ngày */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isToday
                                ? 'bg-[#3D405B] text-[#F2CC8F] font-black'
                                : isCurrentMonth
                                ? 'text-slate-900'
                                : 'text-slate-400'
                            }`}
                          >
                            {d.getDate()}
                          </span>
                          {daySessions.length > 0 && (
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1 rounded-full">
                              {daySessions.length} {isEn ? 'sess.' : 'ca'}
                            </span>
                          )}
                        </div>

                        {/* Session Chips */}
                        <div className="space-y-1 my-1">
                          {daySessions.slice(0, 2).map(s => {
                            const theme = getSportTheme(s.sportName, isEn);
                            return (
                              <div
                                key={s.id}
                                onClick={e => {
                                  e.stopPropagation();
                                  handleOpenDetail(s);
                                }}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold truncate flex items-center gap-1 border ${theme.bg} ${theme.text} ${theme.border}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.dot}`} />
                                <span className="truncate">{s.timeSlot.slice(0, 5)} {s.name}</span>
                              </div>
                            );
                          })}
                          {daySessions.length > 2 && (
                            <span className="text-[9px] font-bold text-slate-500 block text-right">
                              {isEn ? `+${daySessions.length - 2} more` : `+${daySessions.length - 2} ca nữa`}
                            </span>
                          )}
                        </div>

                        <div className="h-1" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chi tiết ca dạy của ngày được chọn trong Tháng */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
                  <h3 className="font-chivo font-black text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#F2CC8F] text-[18px]">event</span>
                    <span>
                      {isEn
                        ? `Sessions on: ${selectedCalendarDate} (${(sessionsByDate.get(selectedCalendarDate) || []).length} sessions)`
                        : `Ca dạy ngày: ${selectedCalendarDate} (${(sessionsByDate.get(selectedCalendarDate) || []).length} ca)`}
                    </span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    {isEn ? 'Click on a session to view details or record attendance' : 'Nhấp vào ca dạy để xem thông tin hoặc điểm danh'}
                  </span>
                </div>

                {(sessionsByDate.get(selectedCalendarDate) || []).length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">
                    {isEn
                      ? 'No teaching sessions assigned for this date. Please pick another date on the calendar.'
                      : 'Không có ca dạy nào được phân công trong ngày này. Vui lòng chọn ngày khác trên lịch.'}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(sessionsByDate.get(selectedCalendarDate) || []).map(s => {
                      const theme = getSportTheme(s.sportName, isEn);
                      const statusInfo = STATUS_CONFIG[s.status] || STATUS_CONFIG.SCHEDULED;

                      return (
                        <div
                          key={s.id}
                          onClick={() => handleOpenDetail(s)}
                          className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all hover:shadow-md flex flex-col justify-between ${theme.bg} ${theme.border}`}
                        >
                          <div>
                            <div className="flex justify-between items-center mb-1.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${theme.badge}`}>
                                {theme.tag}
                              </span>
                              <span className="font-bold text-slate-700">{s.timeSlot}</span>
                            </div>
                            <h4 className="font-chivo font-black text-sm text-slate-900 leading-snug">
                              {s.name}
                            </h4>
                            <p className="text-[11px] text-slate-600 mt-1">
                              {isEn ? 'Court / Room:' : 'Địa điểm:'} <strong>{s.roomName}</strong> · {isEn ? 'Enrolled:' : 'Sĩ số:'} <strong>{s.enrolledCount}/{s.capacity}</strong>
                            </p>
                          </div>

                          <div className="pt-2 mt-2 border-t border-black/5 flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeClass}`}>
                              {statusInfo.label}
                            </span>
                            <div className="flex items-center gap-2 font-bold">
                              <a
                                href={`#/coach/attendance?sessionId=${s.id}&date=${s.sessionDate}`}
                                onClick={e => e.stopPropagation()}
                                className="text-[#3D405B] hover:text-[#E07A5F] hover:underline"
                              >
                                {isEn ? 'Attendance →' : 'Điểm danh →'}
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- C. CHẾ ĐỘ LỊCH BIỂU (TIMELINE AGENDA - THEO DÒNG THỜI GIAN) --- */}
          {viewMode === 'agenda' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
              {Array.from(sessionsByDate.entries()).length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">event_busy</span>
                  <p>{isEn ? 'No teaching sessions found matching the current filters.' : 'Không có ca dạy nào phù hợp với bộ lọc hiện tại.'}</p>
                </div>
              ) : (
                Array.from(sessionsByDate.entries()).map(([dateStr, daySessions]) => {
                  const d = parseIsoDate(dateStr);
                  const isToday = dateStr === todayStr;

                  return (
                    <div key={dateStr} className="p-4 sm:p-5 space-y-3">
                      {/* Date Heading */}
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                            isToday
                              ? 'bg-[#3D405B] text-[#F2CC8F] shadow-xs'
                              : 'bg-slate-900 text-white'
                          }`}
                        >
                          {DAY_LABELS[d.getDay()]} · {dateStr}
                        </span>
                        <span className="text-xs text-slate-500 font-bold">
                          {daySessions.length} {isEn ? (daySessions.length === 1 ? 'assigned session' : 'assigned sessions') : 'ca dạy phân công'}
                        </span>
                      </div>

                      {/* Sessions Rows */}
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/20">
                        {daySessions.map(s => {
                          const theme = getSportTheme(s.sportName, isEn);
                          const statusInfo = STATUS_CONFIG[s.status] || STATUS_CONFIG.SCHEDULED;

                          return (
                            <div
                              key={s.id}
                              onClick={() => handleOpenDetail(s)}
                              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs cursor-pointer transition-colors bg-white hover:bg-slate-50"
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="w-24 shrink-0 font-mono font-bold text-slate-900 text-sm">
                                  {s.timeSlot}
                                </div>

                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${theme.badge}`}>
                                      {theme.tag}
                                    </span>
                                    <h4 className="font-chivo font-black text-slate-900 text-sm truncate">
                                      {s.name}
                                    </h4>
                                  </div>
                                  <p className="text-slate-500 text-[11px]">
                                    {isEn ? 'Room:' : 'Phòng:'} <strong className="text-slate-800">{s.roomName}</strong> · {isEn ? 'Status:' : 'Trạng thái:'} <strong className="text-slate-800">{statusInfo.label}</strong>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 uppercase font-bold block">{isEn ? 'Enrollment' : 'Sĩ số'}</span>
                                  <span className="font-chivo font-bold text-slate-900">
                                    {s.enrolledCount}/{s.capacity} {isEn ? 'Students' : 'HV'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <a
                                    href={`#/coach/members?classId=${s.classId}`}
                                    onClick={e => e.stopPropagation()}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition-colors"
                                  >
                                    {isEn ? 'Students' : 'Học viên'}
                                  </a>
                                  <a
                                    href={`#/coach/attendance?sessionId=${s.id}&date=${s.sessionDate}`}
                                    onClick={e => e.stopPropagation()}
                                    className="px-3.5 py-1.5 rounded-lg bg-[#F2CC8F] hover:bg-[#E07A5F] text-[#1E2235] hover:text-white font-bold transition-colors shadow-xs"
                                  >
                                    {isEn ? 'Attendance' : 'Điểm danh'}
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* --- D. CHẾ ĐỘ LƯỚI THẺ (RESPONSIVE CARDS GRID) --- */}
          {viewMode === 'grid' && (
            <div className="space-y-4">
              {filteredSessions.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                  <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">event_busy</span>
                  <p>{isEn ? 'No teaching sessions found matching the current filters.' : 'Không có ca dạy nào phù hợp với bộ lọc hiện tại.'}</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSessions.map(s => {
                    const theme = getSportTheme(s.sportName, isEn);
                    const statusInfo = STATUS_CONFIG[s.status] || STATUS_CONFIG.SCHEDULED;
                    const percent = s.capacity > 0 ? Math.min(100, Math.round((s.enrolledCount / s.capacity) * 100)) : 0;
                    const dayLabel = formatDayOfWeek(s.sessionDate, s.dayOfWeek);

                    return (
                      <article
                        key={s.id}
                        onClick={() => handleOpenDetail(s)}
                        className="bg-white p-5 border border-slate-200 rounded-2xl space-y-3.5 shadow-xs hover:shadow-md transition-all cursor-pointer relative flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${theme.badge}`}>
                              {theme.tag}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeClass}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                              {statusInfo.label}
                            </span>
                          </div>

                          <h2 className="font-chivo font-black text-slate-900 text-base leading-snug">
                            {s.name}
                          </h2>

                          <div className="space-y-1.5 text-xs text-slate-600">
                            <p className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px] text-[#81B29A]">calendar_today</span>
                              <strong>{dayLabel} · {s.sessionDate}</strong>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
                              <span>{s.timeSlot}</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px] text-slate-400">meeting_room</span>
                              <span>{s.roomName}</span>
                            </p>
                          </div>

                          {/* Enrollment bar */}
                          <div className="space-y-1 pt-1 border-t border-slate-100">
                            <div className="flex justify-between text-xs font-bold text-slate-700">
                              <span>
                                {isEn
                                  ? `Bookings: ${s.enrolledCount}/${s.capacity} students`
                                  : `Đặt chỗ: ${s.enrolledCount}/${s.capacity} học viên`}
                              </span>
                              <span className="text-slate-500">{percent}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${percent >= 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Card actions */}
                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs font-bold">
                          <a
                            href={`#/coach/members?classId=${s.classId}`}
                            onClick={e => e.stopPropagation()}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[15px]">group</span>
                            <span>{isEn ? 'Students' : 'Học viên'}</span>
                          </a>
                          <a
                            href={`#/coach/attendance?sessionId=${s.id}&date=${s.sessionDate}`}
                            onClick={e => e.stopPropagation()}
                            className="px-3.5 py-1.5 rounded-xl bg-[#F2CC8F] hover:bg-[#E07A5F] text-[#1E2235] hover:text-white transition-colors flex items-center gap-1 shadow-xs font-bold"
                          >
                            <span className="material-symbols-outlined text-[15px]">how_to_reg</span>
                            <span>{isEn ? 'Attendance' : 'Điểm danh'}</span>
                          </a>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* 5. MODAL XEM CHI TIẾT CA DẠY */}
      {activeSession && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={isEn ? 'Teaching Session Details' : 'Chi tiết ca giảng dạy'}
          maxWidth="max-w-lg"
        >
          <div className="space-y-5">
            {/* Modal Header Badge */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className={`px-2.5 py-1 rounded text-xs font-extrabold uppercase border ${getSportTheme(activeSession.sportName, isEn).badge}`}>
                  {getSportTheme(activeSession.sportName, isEn).tag}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_CONFIG[activeSession.status]?.badgeClass}`}>
                  {STATUS_CONFIG[activeSession.status]?.label}
                </span>
              </div>
              <h3 className="font-chivo font-black text-lg text-slate-900">
                {activeSession.name}
              </h3>
            </div>

            {/* Session Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                <span className="text-slate-400 uppercase font-bold text-[10px] block">
                  {isEn ? 'Session Date' : 'Ngày giảng dạy'}
                </span>
                <strong className="text-slate-900 text-sm">
                  {formatDayOfWeek(activeSession.sessionDate, activeSession.dayOfWeek)}
                </strong>
                <p className="text-slate-600 font-mono">{activeSession.sessionDate}</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                <span className="text-slate-400 uppercase font-bold text-[10px] block">
                  {isEn ? 'Time Slot' : 'Khung giờ'}
                </span>
                <strong className="text-slate-900 text-sm">{activeSession.timeSlot}</strong>
                <p className="text-slate-600">{isEn ? 'Standard Slot' : 'Ca tiêu chuẩn'}</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                <span className="text-slate-400 uppercase font-bold text-[10px] block">
                  {isEn ? 'Court / Room' : 'Phòng / Sân bãi'}
                </span>
                <strong className="text-slate-900 text-sm">{activeSession.roomName}</strong>
                <p className="text-slate-600">{isEn ? 'Confirmed Schedule' : 'Đã chốt lịch'}</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                <span className="text-slate-400 uppercase font-bold text-[10px] block">
                  {isEn ? 'Student Enrollment' : 'Sĩ số học viên'}
                </span>
                <strong className="text-slate-900 text-sm">
                  {activeSession.enrolledCount} / {activeSession.capacity} {isEn ? 'Students' : 'HV'}
                </strong>
                <p className="text-slate-600 font-semibold">
                  {activeSession.capacity > 0 ? Math.round((activeSession.enrolledCount / activeSession.capacity) * 100) : 0}% {isEn ? 'filled' : 'lấp đầy'}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>{isEn ? 'Enrollment Capacity' : 'Tỷ lệ học viên đăng ký'}</span>
                <span>{activeSession.enrolledCount}/{activeSession.capacity} {isEn ? 'spots' : 'chỗ'}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-red-600 rounded-full"
                  style={{
                    width: `${activeSession.capacity > 0 ? Math.min(100, (activeSession.enrolledCount / activeSession.capacity) * 100) : 0}%`
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2.5">
              <a
                href={`#/coach/members?classId=${activeSession.classId}`}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">group</span>
                <span>{isEn ? 'View Student List' : 'Xem danh sách học viên'}</span>
              </a>

              <a
                href={`#/coach/attendance?sessionId=${activeSession.id}&date=${activeSession.sessionDate}`}
                className="px-4 py-2.5 rounded-xl bg-[#F2CC8F] hover:bg-[#E07A5F] text-[#1E2235] hover:text-white text-xs font-bold transition-all shadow-md shadow-[#F2CC8F]/20 flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                <span>{isEn ? 'Take Attendance for Session' : 'Điểm danh ca dạy này'}</span>
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
