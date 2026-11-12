import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../entities/session/index.js';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { DAY_LABELS_EN, DAY_LABELS_VI, SHORT_DAY_LABELS_EN, SHORT_DAY_LABELS_VI, formatIsoDate, parseIsoDate, getWeekDays } from '../../../shared/lib/calendar.js';
import { parseCalendarDate } from '../../../shared/lib/dateTime.js';
import { classApi } from '../../../entities/class/index.js';
import { bookingApi } from '../../../entities/booking/index.js';
import { translateClassName } from '../../../shared/i18n/i18nHelper.js';
import { filterSessionsByEntitlements } from '../lib/sessionAction.js';

export function useClassSchedule() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const DAY_LABELS = isEn ? DAY_LABELS_EN : DAY_LABELS_VI;
  const SHORT_DAY_LABELS = isEn ? SHORT_DAY_LABELS_EN : SHORT_DAY_LABELS_VI;

  const [classes, setClasses] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [bookedSessionIds, setBookedSessionIds] = useState(new Set());
  const [entitlements, setEntitlements] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- QUẢN LÝ LỊCH VÀ CHẾ ĐỘ XEM (CALENDAR MODES) ---
  // viewMode: 'week' (Mặc định - Lịch tuần) | 'month' (Lịch tháng) | 'agenda' (Lịch biểu)
  const [viewMode, setViewMode] = useState('week');
  const [currentDate, setCurrentDate] = useState(() => parseCalendarDate());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => formatIsoDate(parseCalendarDate()));

  // --- BỘ LỌC ĐA NĂNG ---
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [selectedCoach, setSelectedCoach] = useState('ALL'); // coach name the member wants to train with
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
      const [classList, bookingsList, entitlementData] = await Promise.all([
        classApi.getAll(),
        currentUser ? bookingApi.getMemberBookings(currentUser.id) : [],
        currentUser ? classApi.getMyEntitlements().catch(() => null) : null
      ]);
      setEntitlements(entitlementData);
      // Older payloads have no bookingId on the session; recover it from the member's bookings.
      const bookingIdBySession = new Map((bookingsList || [])
        .filter(b => b.status === 'CONFIRMED' || b.status === 'BOOKED')
        .map(b => [b.sessionId, b.id]));
      const confirmedIds = new Set(
        (bookingsList || [])
          .filter(b => b.status === 'CONFIRMED' || b.status === 'BOOKED')
          .map(b => b.sessionId || b.id)
      );
      setBookedSessionIds(confirmedIds);

      // Only the member's registered sports (plus any already-booked sessions) are shown.
      const hydratedList = (classList || [])
        .map(c => ({ ...c, bookingId: c.bookingId || bookingIdBySession.get(c.sessionId) || null }));
      const scopedList = filterSessionsByEntitlements(hydratedList, entitlementData, confirmedIds);
      setClasses(scopedList);
      setMyBookings(bookingsList || []);

      // Tự động căn chỉnh lịch theo tham số ?date= và ?search= nếu có từ thông báo
      const currentHash = window.location.hash || '';
      const qs = currentHash.includes('?') ? currentHash.split('?')[1] : '';
      const params = qs ? new URLSearchParams(qs) : null;
      const urlDate = params?.get('date');
      const urlSearch = params?.get('search');

      if (urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate)) {
        setCurrentDate(parseIsoDate(urlDate));
        setSelectedCalendarDate(urlDate);
      } else if (!currentHash.includes('?date=') && !currentHash.includes('&date=')) {
        if (scopedList.length > 0) {
          const todayStr = formatIsoDate(parseCalendarDate());
          const hasToday = scopedList.some(c => c.sessionDate === todayStr);
          if (!hasToday && scopedList[0]?.sessionDate) {
            setCurrentDate(parseIsoDate(scopedList[0].sessionDate));
            setSelectedCalendarDate(scopedList[0].sessionDate);
          }
        }
      }

      if (urlSearch) {
        setSearchQuery(decodeURIComponent(urlSearch));
      }

      if (classList && classList.length > 0) {
        openMatchingSession(classList, urlDate, urlSearch);
      }
    } catch (error) {
      showError(error.message || (isEn ? 'Unable to load class schedule.' : 'Không thể tải lịch lớp học. Vui lòng thử lại sau.'));
    } finally {
      setLoading(false);
    }
  };

  // Tự động mở modal chi tiết buổi tập nếu có session khớp với date & search từ thông báo
  const openMatchingSession = (classList, customDate, customSearch, customSessionId) => {
    if (!classList || classList.length === 0) return;
    const hash = window.location.hash || '';
    const qs = hash.includes('?') ? hash.split('?')[1] : '';
    const params = qs ? new URLSearchParams(qs) : null;
    const urlDate = customDate || params?.get('date');
    const urlSearch = customSearch || params?.get('search');
    const urlSessionId = customSessionId || (params ? Number(params.get('sessionId')) : null);

    if (!urlSessionId && !urlDate && !urlSearch) return;

    let matched = null;
    if (urlSessionId) {
      matched = classList.find(s => s.id === urlSessionId || s.sessionId === urlSessionId);
    }
    if (!matched && (urlDate || urlSearch)) {
      const normalizedSearch = urlSearch ? decodeURIComponent(urlSearch).toLowerCase() : '';
      matched = classList.find(s => {
        const dateMatch = !urlDate || s.sessionDate === urlDate;
        const searchMatch = !normalizedSearch ||
          (s.name || '').toLowerCase().includes(normalizedSearch) ||
          (s.sportName || '').toLowerCase().includes(normalizedSearch);
        return dateMatch && searchMatch;
      });
      if (!matched && normalizedSearch) {
        matched = classList.find(s =>
          (s.name || '').toLowerCase().includes(normalizedSearch) ||
          (s.sportName || '').toLowerCase().includes(normalizedSearch)
        );
      }
    }
    if (matched) {
      setActiveSession(matched);
      setBookingError(null);
      setDetailModalOpen(true);
    }
  };

  useEffect(() => {
    loadClasses();
  }, [currentUser?.id]);

  useEffect(() => {
    const handleHashParams = () => {
      const hash = window.location.hash || '';
      const qs = hash.includes('?') ? hash.split('?')[1] : '';
      if (!qs) return;
      const params = new URLSearchParams(qs);
      const urlDate = params.get('date');
      const urlSearch = params.get('search');
      if (urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate)) {
        setCurrentDate(parseIsoDate(urlDate));
        setSelectedCalendarDate(urlDate);
      }
      if (urlSearch) {
        setSearchQuery(decodeURIComponent(urlSearch));
      }
      if (classes.length > 0) {
        openMatchingSession(classes, urlDate, urlSearch);
      }
    };

    const onDirectOpen = (event) => {
      const { isoDate, className } = event.detail || {};
      if (isoDate && /^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
        setCurrentDate(parseIsoDate(isoDate));
        setSelectedCalendarDate(isoDate);
      }
      if (className) {
        setSearchQuery(className);
      }
      if (classes.length > 0) {
        openMatchingSession(classes, isoDate, className);
      }
    };

    window.addEventListener('hashchange', handleHashParams);
    window.addEventListener('scms:open-schedule-target', onDirectOpen);
    return () => {
      window.removeEventListener('hashchange', handleHashParams);
      window.removeEventListener('scms:open-schedule-target', onDirectOpen);
    };
  }, [classes]);

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

    if (target.enrolledCount >= target.capacity && !target.allowWaitlist) {
      setBookingError({
        message: isEn ? 'This class has reached maximum capacity (no spots left).' : 'Lớp học đã đủ sĩ số tối đa (hết chỗ trống).',
        code: 'BOOK-SLOT-FULL',
        proposedHandling: isEn ? 'Please choose another session.' : 'Vui lòng chọn ca tập khác.'
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

  // Hủy vé: backend chặn nếu chưa đủ CancelBeforeHours của gói.
  const handleCancelBooking = async (bookingId) => {
    if (!bookingId) return;
    setCancelLoading(true);
    setBookingError(null);
    try {
      const result = await bookingApi.cancelBooking(bookingId);
      showSuccess(result?.message || (isEn ? 'Booking cancelled.' : 'Đã hủy chỗ.'));
      setDetailModalOpen(false);
      await loadClasses();
    } catch (err) {
      setBookingError(err);
      showError(err);
    } finally {
      setCancelLoading(false);
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

      // 1b. Lọc HLV hội viên muốn theo học
      if (selectedCoach !== 'ALL' && cls.coachName !== selectedCoach) return false;

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
  }, [classes, selectedSport, selectedCoach, selectedTimeSlot, selectedStatusFilter, searchQuery, bookedSessionIds]);

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
    return { total, booked, available, sportsCount: sportSet.size, sportsTotal: entitlements?.activeSportCount || null };
  }, [filteredClasses, bookedSessionIds, entitlements]);

  // Danh mục môn thể thao duy nhất có trong hệ thống
  const availableSports = useMemo(() => {
    const map = new Map();
    classes.forEach(c => {
      const entry = map.get(c.sportName) || { name: c.sportName, sportId: c.sportId, count: 0 };
      entry.count += 1;
      map.set(c.sportName, entry);
    });
    return Array.from(map.values());
  }, [classes]);

  // HLV đang dạy (theo môn đang chọn) kèm số ca, để hội viên chọn HLV mình muốn
  const availableCoaches = useMemo(() => {
    const map = new Map();
    classes
      .filter(c => c.coachName && (selectedSport === 'ALL' || c.sportName?.includes(selectedSport)))
      .forEach(c => {
        const entry = map.get(c.coachName) || { name: c.coachName, count: 0 };
        entry.count += 1;
        map.set(c.coachName, entry);
      });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [classes, selectedSport]);

  // Đổi môn mà HLV đang chọn không dạy môn đó → bỏ lọc HLV
  useEffect(() => {
    if (selectedCoach !== 'ALL' && !availableCoaches.some(c => c.name === selectedCoach)) setSelectedCoach('ALL');
  }, [availableCoaches, selectedCoach]);

  return {
    DAY_LABELS, activeSession, availableCoaches, availableSports, selectedCoach, setSelectedCoach, bookedSessionIds, bookingError, bookingLoading,
    cancelLoading, entitlements, handleCancelBooking,
    classes, classesByDate, conflictingBooking, currentDate, detailModalOpen, handleExecuteBooking,
    handleNext, handleOpenSessionDetail, handlePrev, handleToday, isEn, loading, periodTitle,
    searchQuery, selectedCalendarDate, selectedSport, selectedStatusFilter, selectedTimeSlot,
    setCurrentDate, setDetailModalOpen, setSearchQuery, setSelectedCalendarDate, setSelectedSport,
    setSelectedStatusFilter, setSelectedTimeSlot, setViewMode, stats, viewMode, weekDays
  };
}
