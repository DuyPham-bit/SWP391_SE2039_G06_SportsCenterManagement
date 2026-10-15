import React, { useState, useEffect, useMemo } from 'react';
import { classApi, bookingApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../../components/common/Modal.js';
import { Badge } from '../../components/common/StatCard.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { BusinessAlert } from '../../components/common/BusinessAlert.jsx';

// --- HÀM TIỆN ÍCH NGÀY THÁNG VÀ LỊCH TRÌNH CHUẨN OLYMPIC ---

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

// Bảng màu nhận diện chuyên nghiệp theo 15 bộ môn thể thao
function getSportTheme(sportName = '') {
  const s = String(sportName).toLowerCase();
  if (s.includes('bơi')) {
    return {
      bg: 'bg-cyan-50/90 hover:bg-cyan-100/90',
      border: 'border-cyan-300',
      text: 'text-cyan-900',
      badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      dot: 'bg-cyan-500',
      tag: 'BƠI LỘI'
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
  if (s.includes('cầu lông')) {
    return {
      bg: 'bg-emerald-50/90 hover:bg-emerald-100/90',
      border: 'border-emerald-300',
      text: 'text-emerald-900',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
      tag: 'CẦU LÔNG'
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
  if (s.includes('boxing') || s.includes('võ') || s.includes('kickfit')) {
    return {
      bg: 'bg-rose-50/90 hover:bg-rose-100/90',
      border: 'border-rose-300',
      text: 'text-rose-900',
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      dot: 'bg-rose-500',
      tag: 'BOXING & VÕ THUẬT'
    };
  }
  if (s.includes('bóng rổ') || s.includes('bóng đá') || s.includes('bóng chuyền')) {
    return {
      bg: 'bg-blue-50/90 hover:bg-blue-100/90',
      border: 'border-blue-300',
      text: 'text-blue-900',
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      dot: 'bg-blue-500',
      tag: 'BÓNG & ĐỒNG ĐỘI'
    };
  }
  if (s.includes('tennis') || s.includes('bóng bàn')) {
    return {
      bg: 'bg-lime-50/90 hover:bg-lime-100/90',
      border: 'border-lime-300',
      text: 'text-lime-900',
      badge: 'bg-lime-100 text-lime-800 border-lime-200',
      dot: 'bg-lime-500',
      tag: 'VỢT & BÓNG NHỎ'
    };
  }
  return {
    bg: 'bg-indigo-50/90 hover:bg-indigo-100/90',
    border: 'border-indigo-300',
    text: 'text-indigo-900',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    dot: 'bg-indigo-500',
    tag: 'THỂ THAO OLYMPIC'
  };
}

const DAY_LABELS = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const SHORT_DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export function ClassScheduleView() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [classes, setClasses] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [bookedSessionIds, setBookedSessionIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // --- QUẢN LÝ LỊCH VÀ CHẾ ĐỘ XEM (CALENDAR MODES) ---
  // viewMode: 'week' (Mặc định - Lịch tuần) | 'month' (Lịch tháng) | 'agenda' (Lịch biểu) | 'grid' (Lưới thẻ)
  const [viewMode, setViewMode] = useState('week');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => formatIsoDate(new Date()));

  // --- BỘ LỌC ĐA NĂNG ---
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('ALL'); // ALL, MORNING (<12h), AFTERNOON (12-17h), EVENING (>17h)
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL'); // ALL, BOOKED_ONLY, AVAILABLE_ONLY
  const [searchQuery, setSearchQuery] = useState('');

  // --- MODAL ĐẶT CHỖ & XEM CHI TIẾT CA TẬP ---
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  const loadClasses = async () => {
    try {
      const [classList, bookingsList] = await Promise.all([
        classApi.getAll(),
        currentUser ? bookingApi.getMemberBookings(currentUser.id) : []
      ]);
      setClasses(classList || []);
      setMyBookings(bookingsList || []);

      const confirmedIds = new Set(
        (bookingsList || [])
          .filter(b => b.status === 'CONFIRMED' || b.status === 'BOOKED')
          .map(b => b.sessionId || b.id)
      );
      setBookedSessionIds(confirmedIds);

      // Tự động căn chỉnh lịch vào tuần có lớp học nếu ngày hiện tại chưa có dữ liệu
      if (classList && classList.length > 0) {
        const todayStr = formatIsoDate(new Date());
        const hasToday = classList.some(c => c.sessionDate === todayStr);
        if (!hasToday && classList[0]?.sessionDate) {
          setCurrentDate(parseIsoDate(classList[0].sessionDate));
          setSelectedCalendarDate(classList[0].sessionDate);
        }
      }
    } catch (error) {
      showError(error.message || 'Không thể tải lịch lớp từ backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, [currentUser?.id]);

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

  // Mở modal đặt chỗ / xem chi tiết
  const handleOpenSessionDetail = (session) => {
    setActiveSession(session);
    setBookingError(null);
    setDetailModalOpen(true);
  };

  // Thực hiện đặt chỗ
  const handleExecuteBooking = async (sessionToBook) => {
    const target = sessionToBook || activeSession;
    if (!target || !currentUser) return;

    if (target.enrolledCount >= target.capacity) {
      setBookingError({
        message: 'Lớp học đã đủ sĩ số tối đa (hết chỗ trống).',
        code: 'BOOK-SLOT-FULL',
        proposedHandling: 'Vui lòng chọn ca tập khác hoặc liên hệ nhân viên lễ tân quầy để vào danh sách chờ.'
      });
      return;
    }

    setBookingLoading(true);
    setBookingError(null);
    try {
      const result = await bookingApi.bookClass(currentUser.id, target.sessionId || target.id);
      showSuccess(result.message || `Đã giữ chỗ thành công ca tập "${target.name}"!`);
      setDetailModalOpen(false);
      await loadClasses();
    } catch (err) {
      setBookingError(err);
      showError(err);
    } finally {
      setBookingLoading(false);
    }
  };

  // Kiểm tra xung đột lịch với các lớp đã đặt khác của học viên
  const conflictingBooking = useMemo(() => {
    if (!activeSession || !myBookings.length) return null;
    return myBookings.find(b => {
      if ((b.sessionId || b.id) === (activeSession.sessionId || activeSession.id)) return false;
      if (b.bookingDate !== activeSession.sessionDate) return false;
      // Trùng ngày và giao thoa khung giờ
      return b.timeSlot === activeSession.timeSlot;
    });
  }, [activeSession, myBookings]);

  // Bộ lọc danh sách lớp học
  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      // 1. Lọc môn thể thao
      if (selectedSport !== 'ALL' && !cls.sportName.includes(selectedSport)) {
        return false;
      }

      // 2. Lọc khung giờ (Morning / Afternoon / Evening)
      if (selectedTimeSlot !== 'ALL') {
        const startHour = parseInt(cls.startTime?.split(':')[0] || cls.timeSlot?.split(':')[0] || '0', 10);
        if (selectedTimeSlot === 'MORNING' && startHour >= 12) return false;
        if (selectedTimeSlot === 'AFTERNOON' && (startHour < 12 || startHour >= 17)) return false;
        if (selectedTimeSlot === 'EVENING' && startHour < 17) return false;
      }

      // 3. Lọc trạng thái vé
      const isBooked = bookedSessionIds.has(cls.sessionId) || bookedSessionIds.has(cls.id);
      const isFull = cls.enrolledCount >= cls.capacity;
      if (selectedStatusFilter === 'BOOKED_ONLY' && !isBooked) return false;
      if (selectedStatusFilter === 'AVAILABLE_ONLY' && isFull) return false;

      // 4. Tìm kiếm từ khóa
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = cls.name?.toLowerCase().includes(q);
        const matchCoach = cls.coachName?.toLowerCase().includes(q);
        const matchRoom = cls.roomName?.toLowerCase().includes(q);
        const matchSport = cls.sportName?.toLowerCase().includes(q);
        if (!matchName && !matchCoach && !matchRoom && !matchSport) return false;
      }

      return true;
    });
  }, [classes, selectedSport, selectedTimeSlot, selectedStatusFilter, searchQuery, bookedSessionIds]);

  // Gom nhóm lớp học theo ngày YYYY-MM-DD
  const classesByDate = useMemo(() => {
    const map = new Map();
    filteredClasses.forEach(cls => {
      const d = cls.sessionDate;
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(cls);
    });
    // Sắp xếp các lớp trong ngày theo giờ bắt đầu
    map.forEach(list => {
      list.sort((a, b) => (a.startTime || a.timeSlot || '').localeCompare(b.startTime || b.timeSlot || ''));
    });
    return map;
  }, [filteredClasses]);

  // Danh sách các ngày trong tuần hiện tại
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  // Tiêu đề khoảng thời gian hiển thị
  const periodTitle = useMemo(() => {
    if (viewMode === 'month') {
      return `Tháng ${currentDate.getMonth() + 1}, ${currentDate.getFullYear()}`;
    }
    const start = weekDays[0];
    const end = weekDays[6];
    return `Tuần: ${start.getDate()} Th${start.getMonth() + 1} - ${end.getDate()} Th${end.getMonth() + 1}, ${end.getFullYear()}`;
  }, [viewMode, currentDate, weekDays]);

  // Thống kê nhanh KPI
  const stats = useMemo(() => {
    const total = filteredClasses.length;
    const booked = filteredClasses.filter(c => bookedSessionIds.has(c.sessionId) || bookedSessionIds.has(c.id)).length;
    const available = filteredClasses.filter(c => c.enrolledCount < c.capacity).length;
    const sportSet = new Set(filteredClasses.map(c => c.sportName));
    return { total, booked, available, sportsCount: sportSet.size };
  }, [filteredClasses, bookedSessionIds]);

  // Danh mục môn thể thao duy nhất có trong hệ thống
  const availableSports = useMemo(() => {
    const map = new Map();
    classes.forEach(c => {
      map.set(c.sportName, (map.get(c.sportName) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [classes]);

  if (loading) return <LoadingSpinner text="Đang đồng bộ lịch mở lớp & trạng thái vé tập..." />;

  const todayStr = formatIsoDate(new Date());

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-chivo text-xs font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              OLYMPIC SCHEDULE CALENDAR
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              {stats.total} ca học mở
            </span>
          </div>
          <h1 className="font-chivo text-2xl lg:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Lịch Mở Lớp & Đặt Chỗ Rèn Luyện
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Lịch tương tác đa chế độ theo chuẩn Olympic: Theo dõi lịch tuần, tổng quan tháng, chọn ca tập và bảo đảm suất rèn luyện cùng HLV chuyên môn.
          </p>
        </div>

        {/* Nút Xem Vé Đã Đặt Nhanh */}
        <div className="flex items-center gap-2.5">
          <a
            href="#/member/bookings"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm shrink-0"
          >
            <span className="material-symbols-outlined text-[18px] text-emerald-400">confirmation_number</span>
            <span>Vé Đã Đặt ({bookedSessionIds.size})</span>
          </a>
        </div>
      </div>

      {/* 2. KPI Summary Strip (Gọn gàng & Đậm chất Olympic) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">calendar_month</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Tổng ca tập</span>
            <span className="font-chivo text-lg font-black text-slate-900">{stats.total}</span>
          </div>
        </div>

        <div
          onClick={() => setSelectedStatusFilter(f => f === 'BOOKED_ONLY' ? 'ALL' : 'BOOKED_ONLY')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
            selectedStatusFilter === 'BOOKED_ONLY'
              ? 'bg-emerald-50 border-emerald-400 shadow-sm ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">check_circle</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Ca tôi đã đặt</span>
            <span className="font-chivo text-lg font-black text-emerald-800">{stats.booked}</span>
          </div>
        </div>

        <div
          onClick={() => setSelectedStatusFilter(f => f === 'AVAILABLE_ONLY' ? 'ALL' : 'AVAILABLE_ONLY')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
            selectedStatusFilter === 'AVAILABLE_ONLY'
              ? 'bg-cyan-50 border-cyan-400 shadow-sm ring-2 ring-cyan-500/20'
              : 'bg-white border-slate-200 hover:border-cyan-300'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">event_available</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Ca còn chỗ</span>
            <span className="font-chivo text-lg font-black text-cyan-800">{stats.available}</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">sports</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Bộ môn mở</span>
            <span className="font-chivo text-lg font-black text-slate-900">{stats.sportsCount} / 15</span>
          </div>
        </div>
      </div>

      {/* 3. Calendar Control Bar & View Mode Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Row 1: Nav Date + Segmented Mode Switcher */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Calendar Navigator */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
            >
              Hôm Nay
            </button>
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
              <button
                onClick={handlePrev}
                title="Lùi kỳ trước"
                className="p-1.5 hover:bg-slate-100 text-slate-700 transition-colors border-r border-slate-200"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <button
                onClick={handleNext}
                title="Tiến kỳ sau"
                className="p-1.5 hover:bg-slate-100 text-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
            <span className="font-chivo text-base font-black text-slate-900 pl-1 tracking-tight">
              {periodTitle}
            </span>
          </div>

          {/* Segmented Control Chế độ xem: Tuần | Tháng | Lịch biểu | Lưới thẻ */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0">
            {[
              { id: 'week', label: 'Tuần (Timetable)', icon: 'view_week' },
              { id: 'month', label: 'Tháng', icon: 'calendar_view_month' },
              { id: 'agenda', label: 'Lịch Biểu', icon: 'view_agenda' },
              { id: 'grid', label: 'Dạng Thẻ', icon: 'grid_view' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo flex items-center gap-1.5 transition-all ${
                  viewMode === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Bộ lọc nâng cao (Khung giờ, Trạng thái, Tìm kiếm) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Search Input */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm lớp, HLV, sân tập..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Time Slot Filter */}
          <div>
            <select
              value={selectedTimeSlot}
              onChange={e => setSelectedTimeSlot(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 bg-white font-medium"
            >
              <option value="ALL">🕒 Tất cả khung giờ</option>
              <option value="MORNING">🌅 Ca Sáng (Trước 12:00)</option>
              <option value="AFTERNOON">☀️ Ca Chiều (12:00 - 17:00)</option>
              <option value="EVENING">🌙 Ca Tối (Sau 17:00)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 bg-white font-medium"
            >
              <option value="ALL">🎯 Tất cả trạng thái lớp</option>
              <option value="AVAILABLE_ONLY">🟢 Chỉ lớp còn chỗ trống</option>
              <option value="BOOKED_ONLY">✅ Chỉ lớp tôi đã đặt chỗ</option>
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
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 bg-white font-medium"
            />
          </div>
        </div>

        {/* Row 3: Sport Filter Chips (Kèm số lượng lớp mở) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Bộ môn:</span>
          <button
            onClick={() => setSelectedSport('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold font-chivo transition-all ${
              selectedSport === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({classes.length})
          </button>
          {availableSports.map(s => {
            const theme = getSportTheme(s.name);
            const isSelected = selectedSport === s.name;
            return (
              <button
                key={s.name}
                onClick={() => setSelectedSport(s.name)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold font-chivo flex items-center gap-1.5 transition-all border ${
                  isSelected
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : `bg-white ${theme.text} ${theme.border} hover:bg-slate-50`
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : theme.dot}`} />
                <span>{s.name}</span>
                <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-red-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {s.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. MAIN CALENDAR BODY THEO CHẾ ĐỘ XEM ĐÃ CHỌN */}

      {/* --- A. CHẾ ĐỘ TUẦN (WEEK TIMETABLE VIEW - GỌN GÀNG, ĐA NĂNG) --- */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Weekday Header Columns */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 divide-x divide-slate-200 text-center">
            {weekDays.map(day => {
              const dayStr = formatIsoDate(day);
              const isToday = dayStr === todayStr;
              const isSelected = dayStr === selectedCalendarDate;
              const dayClassesCount = (classesByDate.get(dayStr) || []).length;

              return (
                <div
                  key={dayStr}
                  onClick={() => setSelectedCalendarDate(dayStr)}
                  className={`py-3 px-1 transition-colors cursor-pointer ${
                    isSelected ? 'bg-red-50/60' : 'hover:bg-slate-100/60'
                  }`}
                >
                  <span className="text-[11px] font-bold uppercase text-slate-500 block">
                    {DAY_LABELS[day.getDay()]}
                  </span>
                  <div className="mt-1 flex items-center justify-center gap-1">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-chivo text-sm font-black transition-all ${
                        isToday
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'text-slate-900'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  </div>
                  {dayClassesCount > 0 ? (
                    <span className="inline-block mt-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700">
                      {dayClassesCount} ca
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 block mt-1">Trống</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 7 Cột Lịch Ca Học Trong Tuần */}
          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-200 min-h-[480px] bg-slate-50/30">
            {weekDays.map(day => {
              const dayStr = formatIsoDate(day);
              const dayClasses = classesByDate.get(dayStr) || [];
              const isToday = dayStr === todayStr;

              return (
                <div
                  key={dayStr}
                  className={`p-2.5 space-y-2.5 transition-colors ${
                    isToday ? 'bg-red-50/20' : ''
                  }`}
                >
                  {/* Tiêu đề ngày trên màn hình mobile nhỏ */}
                  <div className="md:hidden pb-1 border-b border-slate-200 flex justify-between items-center text-xs font-bold">
                    <span>{DAY_LABELS[day.getDay()]} ({dayStr})</span>
                    <span className="text-slate-500">{dayClasses.length} ca học</span>
                  </div>

                  {dayClasses.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      <span className="material-symbols-outlined text-2xl text-slate-300 block mb-1">
                        event_busy
                      </span>
                      <span>Không có ca</span>
                    </div>
                  ) : (
                    dayClasses.map(cls => {
                      const theme = getSportTheme(cls.sportName);
                      const isBooked = bookedSessionIds.has(cls.sessionId) || bookedSessionIds.has(cls.id);
                      const isFull = cls.enrolledCount >= cls.capacity;

                      return (
                        <div
                          key={cls.sessionId || cls.id}
                          onClick={() => handleOpenSessionDetail(cls)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 space-y-2 ${
                            isBooked
                              ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                              : `${theme.bg} ${theme.border} shadow-xs`
                          }`}
                        >
                          {/* Time & Sport Tag */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-[11px] text-slate-900 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px] text-red-600">schedule</span>
                              <span>{cls.timeSlot}</span>
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${theme.badge}`}>
                              {cls.sportName}
                            </span>
                          </div>

                          {/* Class Name */}
                          <h4 className="font-chivo font-black text-slate-900 leading-snug line-clamp-2">
                            {cls.name}
                          </h4>

                          {/* Coach & Room Info */}
                          <div className="text-[11px] text-slate-600 space-y-0.5">
                            <div className="truncate">HLV: <strong>{cls.coachName}</strong></div>
                            <div className="truncate text-slate-500">{cls.roomName}</div>
                          </div>

                          {/* Capacity & Action Status Footer */}
                          <div className="pt-1.5 border-t border-black/5 flex items-center justify-between">
                            <div className="text-[10px] font-bold">
                              <span className="text-slate-600">{cls.enrolledCount}/{cls.capacity} chỗ</span>
                            </div>

                            {isBooked ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                                <span className="material-symbols-outlined text-[12px]">verified</span>
                                <span>ĐÃ ĐẶT</span>
                              </span>
                            ) : isFull ? (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                                HẾT CHỖ
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenSessionDetail(cls);
                                }}
                                className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] uppercase tracking-wide transition-colors"
                              >
                                ĐẶT CHỖ
                              </button>
                            )}
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

      {/* --- B. CHẾ ĐỘ THÁNG (MONTH CALENDAR GRID - TỔNG THỂ, TRỰC QUAN) --- */}
      {viewMode === 'month' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header 7 Thứ */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-2.5 text-xs font-black uppercase text-slate-600 tracking-wider">
              {DAY_LABELS.map(d => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* 42 Ngày của Tháng */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 bg-slate-100/40">
              {getMonthCalendarGrid(currentDate.getFullYear(), currentDate.getMonth()).map(d => {
                const dayStr = formatIsoDate(d);
                const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                const isToday = dayStr === todayStr;
                const isSelected = dayStr === selectedCalendarDate;
                const dayClasses = classesByDate.get(dayStr) || [];
                const hasBooked = dayClasses.some(c => bookedSessionIds.has(c.sessionId) || bookedSessionIds.has(c.id));

                return (
                  <div
                    key={dayStr}
                    onClick={() => setSelectedCalendarDate(dayStr)}
                    className={`min-h-[105px] p-2 transition-all cursor-pointer flex flex-col justify-between ${
                      !isCurrentMonth ? 'bg-slate-50/50 text-slate-400' : 'bg-white'
                    } ${isSelected ? 'ring-2 ring-red-500 bg-red-50/20 z-10' : 'hover:bg-slate-50'}`}
                  >
                    {/* Top Row: Ngày + Badge số lớp */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isToday
                            ? 'bg-red-600 text-white font-black'
                            : isCurrentMonth
                            ? 'text-slate-900'
                            : 'text-slate-400'
                        }`}
                      >
                        {d.getDate()}
                      </span>
                      <div className="flex items-center gap-1">
                        {hasBooked && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Có lớp đã đặt vé" />
                        )}
                        {dayClasses.length > 0 && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1 rounded">
                            {dayClasses.length} ca
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Danh sách các pill lớp thu nhỏ */}
                    <div className="space-y-1 my-1">
                      {dayClasses.slice(0, 2).map(c => {
                        const theme = getSportTheme(c.sportName);
                        const isBooked = bookedSessionIds.has(c.sessionId) || bookedSessionIds.has(c.id);
                        return (
                          <div
                            key={c.sessionId || c.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSessionDetail(c);
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold truncate flex items-center gap-1 border ${
                              isBooked
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : `${theme.bg} ${theme.text} ${theme.border}`
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isBooked ? 'bg-emerald-600' : theme.dot}`} />
                            <span className="truncate">{c.timeSlot.slice(0, 5)} {c.name}</span>
                          </div>
                        );
                      })}
                      {dayClasses.length > 2 && (
                        <span className="text-[9px] font-bold text-slate-500 block text-right">
                          +{dayClasses.length - 2} ca nữa
                        </span>
                      )}
                    </div>

                    <div className="h-1" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chi tiết ca học của ngày được click chọn trong Tháng */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-chivo font-black text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600 text-[18px]">event</span>
                <span>Ca học ngày: {selectedCalendarDate} ({(classesByDate.get(selectedCalendarDate) || []).length} ca)</span>
              </h3>
              <span className="text-xs text-slate-400">Nhấn vào ca tập để xem chi tiết hoặc đặt chỗ</span>
            </div>

            {(classesByDate.get(selectedCalendarDate) || []).length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                Không có ca tập nào mở trong ngày này. Vui lòng chọn ngày khác trên lưới lịch.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(classesByDate.get(selectedCalendarDate) || []).map(cls => {
                  const theme = getSportTheme(cls.sportName);
                  const isBooked = bookedSessionIds.has(cls.sessionId) || bookedSessionIds.has(cls.id);
                  const isFull = cls.enrolledCount >= cls.capacity;

                  return (
                    <div
                      key={cls.sessionId || cls.id}
                      onClick={() => handleOpenSessionDetail(cls)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all hover:shadow-md flex flex-col justify-between ${
                        isBooked
                          ? 'bg-emerald-50 border-emerald-400 shadow-xs'
                          : `${theme.bg} ${theme.border}`
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${theme.badge}`}>
                            {cls.sportName}
                          </span>
                          <span className="font-bold text-slate-700">{cls.timeSlot}</span>
                        </div>
                        <h4 className="font-chivo font-black text-sm text-slate-900 leading-snug">
                          {cls.name}
                        </h4>
                        <p className="text-[11px] text-slate-600 mt-1">
                          HLV: <strong>{cls.coachName}</strong> · {cls.roomName}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-black/5 flex justify-between items-center">
                        <span className="font-bold text-[11px] text-slate-700">
                          {cls.enrolledCount}/{cls.capacity} chỗ ({cls.capacity - cls.enrolledCount} trống)
                        </span>
                        {isBooked ? (
                          <span className="text-[10px] font-black text-emerald-800 uppercase">✓ ĐÃ ĐẶT CHỖ</span>
                        ) : isFull ? (
                          <span className="text-[10px] font-bold text-slate-400 uppercase">HẾT CHỖ</span>
                        ) : (
                          <span className="text-[10px] font-black text-red-600 uppercase hover:underline">ĐẶT CHỖ →</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- C. CHẾ ĐỘ LỊCH BIỂU (TIMELINE AGENDA - CỰC GỌN & TIẾT KIỆM KHÔNG GIAN) --- */}
      {viewMode === 'agenda' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {Array.from(classesByDate.entries()).length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">event_busy</span>
              <p>Không có ca học nào phù hợp với bộ lọc hiện tại.</p>
            </div>
          ) : (
            Array.from(classesByDate.entries()).map(([dateStr, dayClasses]) => {
              const d = parseIsoDate(dateStr);
              const isToday = dateStr === todayStr;

              return (
                <div key={dateStr} className="p-4 sm:p-5 space-y-3">
                  {/* Date Heading */}
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                        isToday
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-slate-900 text-white'
                      }`}
                    >
                      {DAY_LABELS[d.getDay()]} · {dateStr}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">
                      {dayClasses.length} ca tập rèn luyện
                    </span>
                  </div>

                  {/* Table Rows of Sessions */}
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/20">
                    {dayClasses.map(cls => {
                      const theme = getSportTheme(cls.sportName);
                      const isBooked = bookedSessionIds.has(cls.sessionId) || bookedSessionIds.has(cls.id);
                      const isFull = cls.enrolledCount >= cls.capacity;

                      return (
                        <div
                          key={cls.sessionId || cls.id}
                          onClick={() => handleOpenSessionDetail(cls)}
                          className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                            isBooked
                              ? 'bg-emerald-50/70 hover:bg-emerald-100/70'
                              : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            {/* Time Badge */}
                            <div className="w-24 shrink-0 font-mono font-bold text-slate-900 text-sm">
                              {cls.timeSlot}
                            </div>

                            {/* Info */}
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${theme.badge}`}>
                                  {cls.sportName}
                                </span>
                                <h4 className="font-chivo font-black text-slate-900 text-sm truncate">
                                  {cls.name}
                                </h4>
                              </div>
                              <p className="text-slate-500 text-[11px]">
                                HLV: <strong className="text-slate-800">{cls.coachName}</strong> · Địa điểm: <strong className="text-slate-800">{cls.roomName}</strong>
                              </p>
                            </div>
                          </div>

                          {/* Capacity & Action Buttons */}
                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">Sức chứa</span>
                              <span className="font-chivo font-bold text-slate-900">
                                {cls.enrolledCount}/{cls.capacity} ({cls.capacity - cls.enrolledCount} trống)
                              </span>
                            </div>

                            {isBooked ? (
                              <button
                                type="button"
                                disabled
                                className="px-3.5 py-1.5 rounded-lg font-chivo text-xs font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 cursor-default"
                              >
                                <span className="material-symbols-outlined text-[14px]">verified</span>
                                <span>ĐÃ ĐẶT CHỖ</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenSessionDetail(cls);
                                }}
                                disabled={!cls.isBookable || isFull}
                                className={`px-4 py-1.5 rounded-lg font-chivo text-xs font-bold uppercase transition-all shadow-xs ${
                                  !cls.isBookable || isFull
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-700 text-white'
                                }`}
                              >
                                {isFull ? 'Hết chỗ' : 'Đặt Chỗ'}
                              </button>
                            )}
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

      {/* --- D. CHẾ ĐỘ LƯỚI THẺ (TRADITIONAL GRID VIEW) --- */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.length === 0 ? (
            <div className="col-span-3 p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-xs">
              <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">event_busy</span>
              <p>Không có ca học nào phù hợp với bộ lọc hiện tại.</p>
            </div>
          ) : (
            filteredClasses.map(cls => {
              const theme = getSportTheme(cls.sportName);
              const isFull = cls.enrolledCount >= cls.capacity;
              const isBooked = bookedSessionIds.has(cls.sessionId) || bookedSessionIds.has(cls.id);

              return (
                <div
                  key={cls.sessionId || cls.id}
                  className={`bg-white rounded-2xl border transition-all flex flex-col justify-between p-5 ${
                    isBooked
                      ? 'border-emerald-400 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/15'
                      : 'border-slate-200 shadow-xs hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${theme.badge}`}>
                          {cls.sportName}
                        </span>
                        {isBooked && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">check_circle</span>
                            ĐÃ THAM GIA
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 font-bold">{cls.dayOfWeek}</span>
                    </div>

                    <h3 className="font-chivo text-base font-black text-slate-900 leading-tight">
                      {cls.name}
                    </h3>

                    <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 text-slate-700">
                        <span className="material-symbols-outlined text-[18px] text-red-600">schedule</span>
                        <span className="font-bold">{cls.sessionDate} · {cls.timeSlot}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <span className="material-symbols-outlined text-[18px] text-slate-400">person</span>
                        <span>HLV: <strong className="text-slate-900">{cls.coachName}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <span className="material-symbols-outlined text-[18px] text-slate-400">stadium</span>
                        <span>{cls.roomName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Số chỗ còn lại</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-chivo text-sm font-bold text-slate-900">
                          {cls.enrolledCount}/{cls.capacity}
                        </span>
                        <Badge variant={isFull ? 'FULL' : 'OPEN'} size="sm">
                          {isFull ? 'HẾT CHỖ' : 'CÒN CHỖ'}
                        </Badge>
                      </div>
                    </div>

                    {isBooked ? (
                      <div className="flex flex-col items-end">
                        <button
                          type="button"
                          disabled
                          className="px-3.5 py-1.5 rounded-lg font-chivo text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs flex items-center gap-1.5 cursor-default"
                        >
                          <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
                          <span>ĐÃ ĐẶT CHỖ</span>
                        </button>
                        <a
                          href="#/member/bookings"
                          className="text-[10px] text-emerald-700 hover:text-emerald-900 hover:underline font-bold mt-1 flex items-center gap-0.5"
                        >
                          <span>Xem chi tiết vé tập</span>
                          <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                        </a>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenSessionDetail(cls)}
                        disabled={!cls.isBookable}
                        className={`px-4 py-2 rounded-lg font-chivo text-xs font-bold uppercase tracking-wider transition-all shadow-xs ${
                          !cls.isBookable
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        {!cls.isBookable ? 'Đã đóng' : isFull ? 'Vào danh sách chờ' : 'Đặt Chỗ'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 5. MODAL XÁC NHẬN ĐẶT CHỖ & XEM CHI TIẾT CA TẬP */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Chi Tiết Ca Tập & Xác Nhận Giữ Chỗ"
        size="md"
      >
        {activeSession && (() => {
          const isBooked = bookedSessionIds.has(activeSession.sessionId) || bookedSessionIds.has(activeSession.id);
          const isFull = activeSession.enrolledCount >= activeSession.capacity;
          const remainingSlots = Math.max(0, activeSession.capacity - activeSession.enrolledCount);
          const theme = getSportTheme(activeSession.sportName);

          return (
            <div className="space-y-4">
              {/* Session Overview Card */}
              <div className={`p-4 rounded-xl border text-xs space-y-2.5 ${theme.bg} ${theme.border}`}>
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase border ${theme.badge}`}>
                    {activeSession.sportName}
                  </span>
                  <span className="font-bold text-slate-600">{activeSession.dayOfWeek} · {activeSession.sessionDate}</span>
                </div>

                <h3 className="font-chivo font-black text-slate-900 text-base leading-tight">
                  {activeSession.name}
                </h3>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-black/5 text-slate-700">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Thời gian</span>
                    <strong className="text-red-600">{activeSession.timeSlot}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Sân tập / Phòng</span>
                    <strong>{activeSession.roomName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Huấn luyện viên</span>
                    <strong>{activeSession.coachName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Số chỗ còn trống</span>
                    <strong className={remainingSlots <= 3 ? 'text-red-600' : 'text-slate-900'}>
                      {remainingSlots}/{activeSession.capacity} suất
                    </strong>
                  </div>
                </div>
              </div>

              {/* Cảnh báo xung đột lịch nếu học viên đã có lớp khác cùng giờ */}
              {conflictingBooking && (
                <BusinessAlert
                  type="warning"
                  title="Cảnh báo trùng khung giờ tập luyện"
                  code="BOOK-CONFLICT"
                  message={`Bạn đã có lịch tập lớp "${conflictingBooking.className}" vào cùng khung giờ ${conflictingBooking.timeSlot} ngày ${conflictingBooking.bookingDate}.`}
                  proposedHandling="Một hội viên không nên đăng ký hai buổi học trùng giờ nhau. Vui lòng cân nhắc hủy lớp cũ trước khi đặt lớp mới."
                />
              )}

              {/* Thông báo trạng thái vé */}
              {isBooked ? (
                <BusinessAlert
                  type="success"
                  title="Bạn đã đặt chỗ ca học này!"
                  message="Vé tập của bạn đã được xác nhận. Vui lòng có mặt trước giờ học 10 phút để điểm danh tại phòng tập."
                  actionText="Xem danh sách vé tập"
                  onAction={() => {
                    setDetailModalOpen(false);
                    window.location.hash = '#/member/bookings';
                  }}
                />
              ) : isFull ? (
                <BusinessAlert
                  type="warning"
                  title="Lớp học đã đủ sĩ số tối đa"
                  code="SLOT-FULL"
                  message="Tất cả các vị trí tập luyện trong ca học này đã có hội viên đăng ký giữ chỗ."
                  proposedHandling="Vui lòng chọn ca tập khác hoặc liên hệ quầy lễ tân để ghi danh vào danh sách chờ."
                />
              ) : remainingSlots <= 3 ? (
                <BusinessAlert
                  type="info"
                  title="Chỗ trống sắp hết!"
                  message={`Chỉ còn ${remainingSlots} suất cuối cùng cho buổi học này. Hãy xác nhận sớm để bảo đảm chỗ rèn luyện.`}
                />
              ) : null}

              {/* Lỗi phát sinh trong quá trình đặt vé */}
              {bookingError && (
                <BusinessAlert
                  type="error"
                  title="Không thể hoàn tất giữ chỗ"
                  code={bookingError.code || 'BOOKING-ERROR'}
                  message={bookingError.message || String(bookingError)}
                  proposedHandling={bookingError.proposedHandling || 'Kiểm tra lại thời hạn gói tập, bộ môn được cấp phép, hoặc kiểm tra kết nối mạng.'}
                />
              )}

              {/* Policy note */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-red-600">verified_user</span>
                  <span>Chính sách đặt & hủy chỗ [ME-06]:</span>
                </div>
                <p>
                  • Hủy ca học trước tối thiểu 2 giờ sẽ được hoàn lại lượt tập vào gói hội viên.
                </p>
                <p>
                  • Hủy muộn hoặc vắng mặt không phép sẽ tính là đã tham gia buổi học theo quy định trung tâm.
                </p>
              </div>

              {/* Action Buttons Footer */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700"
                >
                  Đóng
                </button>

                {!isBooked && (
                  <button
                    type="button"
                    onClick={() => handleExecuteBooking()}
                    disabled={bookingLoading || isFull || !activeSession.isBookable}
                    className="px-6 py-2 text-xs font-bold font-chivo uppercase tracking-wider rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {bookingLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang giữ chỗ...</span>
                      </>
                    ) : (
                      <span>Xác Nhận Giữ Chỗ</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
