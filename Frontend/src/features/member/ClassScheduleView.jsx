import { parseCalendarDate } from '../../utils/dateTime.js';
import React, { useState, useEffect, useMemo } from 'react';
import { classApi, bookingApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Modal } from '../../components/common/Modal.js';
import { Badge } from '../../components/common/StatCard.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { BusinessAlert } from '../../components/common/BusinessAlert.jsx';
import { translateClassName, translateSportName, translateCoachName, translateRoomName, translateDayOfWeek } from '../../services/i18nHelper.js';

// --- HÀM TIỆN ÍCH NGÀY THÁNG VÀ LỊCH TRÌNH CHUẨN OLYMPIC ---

function parseIsoDate(dateStr) {
  if (!dateStr) return parseCalendarDate();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

function formatIsoDate(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff, 12));
}

function getWeekDays(startDate) {
  const monday = getMonday(startDate);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setUTCDate(monday.getUTCDate() + i);
    days.push(nextDay);
  }
  return days;
}

function getMonthCalendarGrid(year, month) {
  const firstDay = new Date(Date.UTC(year, month, 1, 12));
  const monday = getMonday(firstDay);
  const grid = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    grid.push(d);
  }
  return grid;
}

// Bảng màu nhận diện chuyên nghiệp theo 15 bộ môn thể thao
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
      tag: isEn ? 'YOGA & PILATES' : 'YOGA & PILATES'
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
      tag: isEn ? 'GYM & FITNESS' : 'GYM & FITNESS'
    };
  }
  if (s.includes('boxing') || s.includes('võ') || s.includes('kickfit')) {
    return {
      bg: 'bg-rose-50/90 hover:bg-rose-100/90',
      border: 'border-rose-300',
      text: 'text-rose-900',
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      dot: 'bg-rose-500',
      tag: isEn ? 'BOXING & MARTIAL ARTS' : 'BOXING & VÕ THUẬT'
    };
  }
  if (s.includes('bóng rổ') || s.includes('bóng đá') || s.includes('bóng chuyền')) {
    return {
      bg: 'bg-blue-50/90 hover:bg-blue-100/90',
      border: 'border-blue-300',
      text: 'text-blue-900',
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      dot: 'bg-blue-500',
      tag: isEn ? 'TEAM SPORTS' : 'BÓNG & ĐỒNG ĐỘI'
    };
  }
  if (s.includes('tennis') || s.includes('bóng bàn') || s.includes('pickleball')) {
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

export function ClassScheduleView() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const DAY_LABELS = isEn ? DAY_LABELS_EN : DAY_LABELS_VI;
  const SHORT_DAY_LABELS = isEn ? SHORT_DAY_LABELS_EN : SHORT_DAY_LABELS_VI;

  const [classes, setClasses] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [bookedSessionIds, setBookedSessionIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // --- QUẢN LÝ LỊCH VÀ CHẾ ĐỘ XEM (CALENDAR MODES) ---
  // viewMode: 'week' (Mặc định - Lịch tuần) | 'month' (Lịch tháng) | 'agenda' (Lịch biểu)
  const [viewMode, setViewMode] = useState('week');
  const [currentDate, setCurrentDate] = useState(() => parseCalendarDate());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => formatIsoDate(parseCalendarDate()));

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

      // Tự động căn chỉnh lịch vào tuần có lớp học nếu ngày hiện tại chưa có dữ liệu (khi không có ?date=)
      const currentHash = window.location.hash || '';
      if (!currentHash.includes('?date=') && !currentHash.includes('&date=')) {
        if (classList && classList.length > 0) {
          const todayStr = formatIsoDate(parseCalendarDate());
          const hasToday = classList.some(c => c.sessionDate === todayStr);
          if (!hasToday && classList[0]?.sessionDate) {
            setCurrentDate(parseIsoDate(classList[0].sessionDate));
            setSelectedCalendarDate(classList[0].sessionDate);
          }
        }
      }
    } catch (error) {
      showError(error.message || (isEn ? 'Unable to load class schedule.' : 'Không thể tải lịch lớp học. Vui lòng thử lại sau.'));
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
      d.setUTCMonth(d.getUTCMonth() - 1);
    } else {
      d.setUTCDate(d.getUTCDate() - 7);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setUTCMonth(d.getUTCMonth() + 1);
    } else {
      d.setUTCDate(d.getUTCDate() + 7);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    const now = parseCalendarDate();
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
        message: isEn ? 'This class has reached maximum capacity (no spots left).' : 'Lớp học đã đủ sĩ số tối đa (hết chỗ trống).',
        code: 'BOOK-SLOT-FULL',
        proposedHandling: isEn ? 'Please choose another session or contact the front desk to join the waitlist.' : 'Vui lòng chọn ca tập khác hoặc liên hệ nhân viên lễ tân quầy để vào danh sách chờ.'
      });
      return;
    }

    setBookingLoading(true);
    setBookingError(null);
    try {
      const result = await bookingApi.bookClass(currentUser.id, target.sessionId || target.id);
      showSuccess(result.message || (isEn ? `Successfully booked session "${translateClassName(target.name, isEn)}"!` : `Đã giữ chỗ thành công ca tập "${target.name}"!`));
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
      return isEn
        ? `Month ${currentDate.getUTCMonth() + 1}, ${currentDate.getUTCFullYear()}`
        : `Tháng ${currentDate.getUTCMonth() + 1}, ${currentDate.getUTCFullYear()}`;
    }
    const start = weekDays[0];
    const end = weekDays[6];
    return isEn
      ? `Week: ${start.getUTCDate()} M${start.getUTCMonth() + 1} - ${end.getUTCDate()} M${end.getUTCMonth() + 1}, ${end.getUTCFullYear()}`
      : `Tuần: ${start.getUTCDate()} Th${start.getUTCMonth() + 1} - ${end.getUTCDate()} Th${end.getUTCMonth() + 1}, ${end.getUTCFullYear()}`;
  }, [viewMode, currentDate, weekDays, isEn]);

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

  if (loading) return <LoadingSpinner text={isEn ? 'Syncing class schedule & spot availability...' : 'Đang đồng bộ lịch mở lớp & trạng thái vé tập...'} />;

  const todayStr = formatIsoDate(parseCalendarDate());

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* 1. Olympic Schedule Masterpiece Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#2F7B5D] via-[#24828F] via-[#3FAEB8] to-[#E5A33C] dark:from-[#184534] dark:via-[#144850] dark:via-[#1B5760] dark:to-[#5E4014] text-white p-6 sm:p-7 border border-white/30 dark:border-white/10 shadow-xl shadow-[#24828F]/20 overflow-hidden">
        {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-[#F2CC8F]/45 via-[#E5A33C]/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-[#81B29A]/40 via-[#2F7B5D]/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-[#A8DADC]/30 rounded-full blur-3xl pointer-events-none" />
        {/* Subtle decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
          <circle cx="890" cy="110" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
        </svg>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[#1B4332] dark:text-emerald-300 border border-white/80 dark:border-white/20 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <span className="material-symbols-outlined text-[13px] text-amber-500">calendar_month</span>
                OLYMPIC SCHEDULE CALENDAR
              </span>
              <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-800 dark:text-slate-200 border border-white/80 dark:border-white/20 text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {stats.total} {isEn ? 'open sessions' : 'ca học mở'}
              </span>
            </div>

            <h1 className="font-chivo text-2xl lg:text-3xl font-black text-white tracking-tight mt-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
              {isEn ? 'Class Schedule & Training Bookings' : 'Lịch Mở Lớp & Đặt Chỗ Rèn Luyện'}
            </h1>
            <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-2xl font-medium leading-relaxed drop-shadow-xs">
              {isEn
                ? 'Olympic-standard multi-mode interactive schedule: Track weekly timetable, monthly overview, select sessions and secure your spot with expert coaches.'
                : 'Lịch tương tác đa chế độ theo chuẩn Olympic: Theo dõi lịch tuần, tổng quan tháng, chọn ca tập và bảo đảm suất rèn luyện cùng HLV chuyên môn.'}
            </p>
          </div>

          {/* Nút Xem Vé Đã Đặt Nhanh */}
          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href="#/member/bookings"
              className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg hover:shadow-xl shrink-0 border border-white/20 active:scale-95 cursor-pointer backdrop-blur-md"
            >
              <span className="material-symbols-outlined text-[18px] text-[#F2CC8F]">confirmation_number</span>
              <span>{isEn ? 'My Bookings' : 'Vé Đã Đặt'} ({bookedSessionIds.size})</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. KPI Summary Strip (Gọn gàng & Đậm chất Olympic) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover-lift flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#81B29A]/20 text-[#2D6A4F] dark:text-[#81B29A] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">calendar_month</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">{isEn ? 'Total Sessions' : 'Tổng ca tập'}</span>
            <span className="font-chivo text-lg font-black text-slate-900 dark:text-white">{stats.total}</span>
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
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">{isEn ? 'My Booked' : 'Ca tôi đã đặt'}</span>
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
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">{isEn ? 'Available Spots' : 'Ca còn chỗ'}</span>
            <span className="font-chivo text-lg font-black text-cyan-800">{stats.available}</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">sports</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">{isEn ? 'Open Sports' : 'Bộ môn mở'}</span>
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
              {isEn ? 'Today' : 'Hôm Nay'}
            </button>
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
              <button
                onClick={handlePrev}
                title={isEn ? 'Previous Period' : 'Lùi kỳ trước'}
                className="p-1.5 hover:bg-slate-100 text-slate-700 transition-colors border-r border-slate-200"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <button
                onClick={handleNext}
                title={isEn ? 'Next Period' : 'Tiến kỳ sau'}
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
              { id: 'week', label: isEn ? 'Week (Timetable)' : 'Tuần (Timetable)', icon: 'view_week' },
              { id: 'month', label: isEn ? 'Month' : 'Tháng', icon: 'calendar_view_month' },
              { id: 'agenda', label: isEn ? 'Agenda' : 'Lịch Biểu', icon: 'view_agenda' }
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
              placeholder={isEn ? 'Search class, coach, venue...' : 'Tìm lớp, HLV, sân tập...'}
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
              <option value="ALL">{isEn ? '🕒 All Time Slots' : '🕒 Tất cả khung giờ'}</option>
              <option value="MORNING">{isEn ? '🌅 Morning (Before 12:00)' : '🌅 Ca Sáng (Trước 12:00)'}</option>
              <option value="AFTERNOON">{isEn ? '☀️ Afternoon (12:00 - 17:00)' : '☀️ Ca Chiều (12:00 - 17:00)'}</option>
              <option value="EVENING">{isEn ? '🌙 Evening (After 17:00)' : '🌙 Ca Tối (Sau 17:00)'}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 bg-white font-medium"
            >
              <option value="ALL">{isEn ? '🎯 All Class Statuses' : '🎯 Tất cả trạng thái lớp'}</option>
              <option value="AVAILABLE_ONLY">{isEn ? '🟢 Available Spots Only' : '🟢 Chỉ lớp còn chỗ trống'}</option>
              <option value="BOOKED_ONLY">{isEn ? '✅ My Booked Classes Only' : '✅ Chỉ lớp tôi đã đặt chỗ'}</option>
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
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">{isEn ? 'Sports:' : 'Bộ môn:'}</span>
          <button
            onClick={() => setSelectedSport('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold font-chivo transition-all ${
              selectedSport === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isEn ? 'All' : 'Tất cả'} ({classes.length})
          </button>
          {availableSports.map(s => {
            const theme = getSportTheme(s.name, isEn);
            const isSelected = selectedSport === s.name;
            const displayName = translateSportName(s.name, isEn);
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
                <span>{displayName}</span>
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
                    {DAY_LABELS[day.getUTCDay()]}
                  </span>
                  <div className="mt-1 flex items-center justify-center gap-1">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-chivo text-sm font-black transition-all ${
                        isToday
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'text-slate-900'
                      }`}
                    >
                      {day.getUTCDate()}
                    </span>
                  </div>
                  {dayClassesCount > 0 ? (
                    <span className="inline-block mt-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700">
                      {dayClassesCount} {isEn ? 'sess' : 'ca'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 block mt-1">{isEn ? 'Empty' : 'Trống'}</span>
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
                    <span>{DAY_LABELS[day.getUTCDay()]} ({dayStr})</span>
                    <span className="text-slate-500">{dayClasses.length} {isEn ? 'sessions' : 'ca học'}</span>
                  </div>

                  {dayClasses.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      <span className="material-symbols-outlined text-2xl text-slate-300 block mb-1">
                        event_busy
                      </span>
                      <span>{isEn ? 'No sessions' : 'Không có ca'}</span>
                    </div>
                  ) : (
                    dayClasses.map(cls => {
                      const theme = getSportTheme(cls.sportName, isEn);
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
                              {translateSportName(cls.sportName, isEn)}
                            </span>
                          </div>

                          {/* Class Name */}
                          <h4 className="font-chivo font-black text-slate-900 leading-snug line-clamp-2">
                            {translateClassName(cls.name, isEn)}
                          </h4>

                          {/* Coach & Room Info */}
                          <div className="text-[11px] text-slate-600 space-y-0.5">
                            <div className="truncate">{isEn ? 'Coach' : 'HLV'}: <strong>{translateCoachName(cls.coachName, isEn)}</strong></div>
                            <div className="truncate text-slate-500">{translateRoomName(cls.roomName, isEn)}</div>
                          </div>

                          {/* Capacity & Action Status Footer */}
                          <div className="pt-1.5 border-t border-black/5 flex items-center justify-between">
                            <div className="text-[10px] font-bold">
                              <span className="text-slate-600">{cls.enrolledCount}/{cls.capacity} {isEn ? 'spots' : 'chỗ'}</span>
                            </div>

                            {isBooked ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                                <span className="material-symbols-outlined text-[12px]">verified</span>
                                <span>{isEn ? 'BOOKED' : 'ĐÃ ĐẶT'}</span>
                              </span>
                            ) : isFull ? (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                                {isEn ? 'FULL' : 'HẾT CHỖ'}
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
                                {isEn ? 'BOOK NOW' : 'ĐẶT CHỖ'}
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
              {getMonthCalendarGrid(currentDate.getUTCFullYear(), currentDate.getUTCMonth()).map(d => {
                const dayStr = formatIsoDate(d);
                const isCurrentMonth = d.getUTCMonth() === currentDate.getUTCMonth();
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
                        {d.getUTCDate()}
                      </span>
                      <div className="flex items-center gap-1">
                        {hasBooked && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" title={isEn ? 'Has booked session' : 'Có lớp đã đặt vé'} />
                        )}
                        {dayClasses.length > 0 && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1 rounded">
                            {dayClasses.length} {isEn ? 'sess' : 'ca'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Danh sách các pill lớp thu nhỏ */}
                    <div className="space-y-1 my-1">
                      {dayClasses.slice(0, 2).map(c => {
                        const theme = getSportTheme(c.sportName, isEn);
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
                            <span className="truncate">{c.timeSlot.slice(0, 5)} {translateClassName(c.name, isEn)}</span>
                          </div>
                        );
                      })}
                      {dayClasses.length > 2 && (
                        <span className="text-[9px] font-bold text-slate-500 block text-right">
                          +{dayClasses.length - 2} {isEn ? 'more' : 'ca nữa'}
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
                <span>{isEn ? 'Sessions on' : 'Ca học ngày'}: {selectedCalendarDate} ({(classesByDate.get(selectedCalendarDate) || []).length} {isEn ? 'sessions' : 'ca'})</span>
              </h3>
              <span className="text-xs text-slate-400">{isEn ? 'Click on a session to view details or book' : 'Nhấn vào ca tập để xem chi tiết hoặc đặt chỗ'}</span>
            </div>

            {(classesByDate.get(selectedCalendarDate) || []).length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                {isEn ? 'No workout sessions scheduled on this day. Please select another date from the calendar.' : 'Không có ca tập nào mở trong ngày này. Vui lòng chọn ngày khác trên lưới lịch.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(classesByDate.get(selectedCalendarDate) || []).map(cls => {
                  const theme = getSportTheme(cls.sportName, isEn);
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
                            {translateSportName(cls.sportName, isEn)}
                          </span>
                          <span className="font-bold text-slate-700">{cls.timeSlot}</span>
                        </div>
                        <h4 className="font-chivo font-black text-sm text-slate-900 leading-snug">
                          {translateClassName(cls.name, isEn)}
                        </h4>
                        <p className="text-[11px] text-slate-600 mt-1">
                          {isEn ? 'Coach' : 'HLV'}: <strong>{translateCoachName(cls.coachName, isEn)}</strong> · {translateRoomName(cls.roomName, isEn)}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-black/5 flex justify-between items-center">
                        <span className="font-bold text-[11px] text-slate-700">
                          {cls.enrolledCount}/{cls.capacity} {isEn ? 'spots' : 'chỗ'} ({cls.capacity - cls.enrolledCount} {isEn ? 'left' : 'trống'})
                        </span>
                        {isBooked ? (
                          <span className="text-[10px] font-black text-emerald-800 uppercase">{isEn ? '✓ BOOKED' : '✓ ĐÃ ĐẶT CHỖ'}</span>
                        ) : isFull ? (
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{isEn ? 'FULL' : 'HẾT CHỖ'}</span>
                        ) : (
                          <span className="text-[10px] font-black text-red-600 uppercase hover:underline">{isEn ? 'BOOK NOW →' : 'ĐẶT CHỖ →'}</span>
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
              <p>{isEn ? 'No classes match the current filter.' : 'Không có ca học nào phù hợp với bộ lọc hiện tại.'}</p>
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
                      {DAY_LABELS[d.getUTCDay()]} · {dateStr}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">
                      {dayClasses.length} {isEn ? 'training sessions' : 'ca tập rèn luyện'}
                    </span>
                  </div>

                  {/* Table Rows of Sessions */}
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/20">
                    {dayClasses.map(cls => {
                      const theme = getSportTheme(cls.sportName, isEn);
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
                                  {translateSportName(cls.sportName, isEn)}
                                </span>
                                <h4 className="font-chivo font-black text-slate-900 text-sm truncate">
                                  {translateClassName(cls.name, isEn)}
                                </h4>
                              </div>
                              <p className="text-slate-500 text-[11px]">
                                {isEn ? 'Coach' : 'HLV'}: <strong className="text-slate-800">{translateCoachName(cls.coachName, isEn)}</strong> · {isEn ? 'Venue' : 'Địa điểm'}: <strong className="text-slate-800">{translateRoomName(cls.roomName, isEn)}</strong>
                              </p>
                            </div>
                          </div>

                          {/* Capacity & Action Buttons */}
                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">{isEn ? 'Capacity' : 'Sức chứa'}</span>
                              <span className="font-chivo font-bold text-slate-900">
                                {cls.enrolledCount}/{cls.capacity} ({cls.capacity - cls.enrolledCount} {isEn ? 'left' : 'trống'})
                              </span>
                            </div>

                            {isBooked ? (
                              <button
                                type="button"
                                disabled
                                className="px-3.5 py-1.5 rounded-lg font-chivo text-xs font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 cursor-default"
                              >
                                <span className="material-symbols-outlined text-[14px]">verified</span>
                                <span>{isEn ? 'BOOKED' : 'ĐÃ ĐẶT CHỖ'}</span>
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
                                {isFull ? (isEn ? 'Full' : 'Hết chỗ') : (isEn ? 'Book Now' : 'Đặt Chỗ')}
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

      {/* 5. MODAL XÁC NHẬN ĐẶT CHỖ & XEM CHI TIẾT CA TẬP */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={isEn ? 'Session Details & Booking Confirmation' : 'Chi Tiết Ca Tập & Xác Nhận Giữ Chỗ'}
        size="md"
      >
        {activeSession && (() => {
          const isBooked = bookedSessionIds.has(activeSession.sessionId) || bookedSessionIds.has(activeSession.id);
          const isFull = activeSession.enrolledCount >= activeSession.capacity;
          const remainingSlots = Math.max(0, activeSession.capacity - activeSession.enrolledCount);
          const theme = getSportTheme(activeSession.sportName, isEn);

          return (
            <div className="space-y-4">
              {/* Session Overview Card */}
              <div className={`p-4 rounded-xl border text-xs space-y-2.5 ${theme.bg} ${theme.border}`}>
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase border ${theme.badge}`}>
                    {translateSportName(activeSession.sportName, isEn)}
                  </span>
                  <span className="font-bold text-slate-600">{translateDayOfWeek(activeSession.dayOfWeek, isEn)} · {activeSession.sessionDate}</span>
                </div>

                <h3 className="font-chivo font-black text-slate-900 text-base leading-tight">
                  {translateClassName(activeSession.name, isEn)}
                </h3>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-black/5 text-slate-700">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{isEn ? 'Time' : 'Thời gian'}</span>
                    <strong className="text-red-600">{activeSession.timeSlot}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{isEn ? 'Venue / Room' : 'Sân tập / Phòng'}</span>
                    <strong>{translateRoomName(activeSession.roomName, isEn)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{isEn ? 'Coach' : 'Huấn luyện viên'}</span>
                    <strong>{translateCoachName(activeSession.coachName, isEn)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{isEn ? 'Available Spots' : 'Số chỗ còn trống'}</span>
                    <strong className={remainingSlots <= 3 ? 'text-red-600' : 'text-slate-900'}>
                      {remainingSlots}/{activeSession.capacity} {isEn ? 'spots' : 'suất'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Cảnh báo xung đột lịch nếu học viên đã có lớp khác cùng giờ */}
              {conflictingBooking && (
                <BusinessAlert
                  type="warning"
                  title={isEn ? 'Schedule Conflict Warning' : 'Cảnh báo trùng khung giờ tập luyện'}
                  code="BOOK-CONFLICT"
                  message={isEn
                    ? `You already have a class scheduled for "${translateClassName(conflictingBooking.className, isEn)}" at ${conflictingBooking.timeSlot} on ${conflictingBooking.bookingDate}.`
                    : `Bạn đã có lịch tập lớp "${conflictingBooking.className}" vào cùng khung giờ ${conflictingBooking.timeSlot} ngày ${conflictingBooking.bookingDate}.`}
                  proposedHandling={isEn
                    ? 'A member should not register for two overlapping classes. Please consider cancelling your earlier booking before booking this session.'
                    : 'Một hội viên không nên đăng ký hai buổi học trùng giờ nhau. Vui lòng cân nhắc hủy lớp cũ trước khi đặt lớp mới.'}
                />
              )}

              {/* Thông báo trạng thái vé */}
              {isBooked ? (
                <BusinessAlert
                  type="success"
                  title={isEn ? 'You have booked this session!' : 'Bạn đã đặt chỗ ca học này!'}
                  message={isEn
                    ? 'Your ticket is confirmed. Please arrive 10 minutes prior to class start for check-in at the facility.'
                    : 'Vé tập của bạn đã được xác nhận. Vui lòng có mặt trước giờ học 10 phút để điểm danh tại phòng tập.'}
                  actionText={isEn ? 'View My Bookings' : 'Xem danh sách vé tập'}
                  onAction={() => {
                    setDetailModalOpen(false);
                    window.location.hash = '#/member/bookings';
                  }}
                />
              ) : isFull ? (
                <BusinessAlert
                  type="warning"
                  title={isEn ? 'Class has reached maximum capacity' : 'Lớp học đã đủ sĩ số tối đa'}
                  code="SLOT-FULL"
                  message={isEn
                    ? 'All workout spots in this session have been reserved by members.'
                    : 'Tất cả các vị trí tập luyện trong ca học này đã có hội viên đăng ký giữ chỗ.'}
                  proposedHandling={isEn
                    ? 'Please choose another session or contact the front desk to join the waitlist.'
                    : 'Vui lòng chọn ca tập khác hoặc liên hệ quầy lễ tân để ghi danh vào danh sách chờ.'}
                />
              ) : remainingSlots <= 3 ? (
                <BusinessAlert
                  type="info"
                  title={isEn ? 'Spots running out!' : 'Chỗ trống sắp hết!'}
                  message={isEn
                    ? `Only ${remainingSlots} spots left for this session. Confirm soon to secure your spot.`
                    : `Chỉ còn ${remainingSlots} suất cuối cùng cho buổi học này. Hãy xác nhận sớm để bảo đảm chỗ rèn luyện.`}
                />
              ) : null}

              {/* Lỗi phát sinh trong quá trình đặt vé */}
              {bookingError && (
                <BusinessAlert
                  type="error"
                  title={isEn ? 'Unable to complete booking' : 'Không thể hoàn tất giữ chỗ'}
                  code={bookingError.code || 'BOOKING-ERROR'}
                  message={bookingError.message || String(bookingError)}
                  proposedHandling={bookingError.proposedHandling || (isEn ? 'Check your package validity, allowed sports, or network connection.' : 'Kiểm tra lại thời hạn gói tập, bộ môn được cấp phép, hoặc kiểm tra kết nối mạng.')}
                />
              )}

              {/* Policy note */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-red-600">verified_user</span>
                  <span>{isEn ? 'Booking & Cancellation Policy:' : 'Chính sách đặt & hủy chỗ:'}</span>
                </div>
                <p>
                  {isEn
                    ? '• Cancel at least 2 hours prior to class start to have your session credit refunded.'
                    : '• Hủy ca học trước tối thiểu 2 giờ sẽ được hoàn lại lượt tập vào gói hội viên.'}
                </p>
                <p>
                  {isEn
                    ? '• Late cancellation or unauthorized absence will be counted as attended under center regulations.'
                    : '• Hủy muộn hoặc vắng mặt không phép sẽ tính là đã tham gia buổi học theo quy định trung tâm.'}
                </p>
              </div>

              {/* Action Buttons Footer */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700"
                >
                  {isEn ? 'Close' : 'Đóng'}
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
                        <span>{isEn ? 'Booking...' : 'Đang giữ chỗ...'}</span>
                      </>
                    ) : (
                      <span>{isEn ? 'Confirm Booking' : 'Xác Nhận Giữ Chỗ'}</span>
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
