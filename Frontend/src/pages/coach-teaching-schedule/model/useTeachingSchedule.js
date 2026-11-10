import { useMemo, useState, useEffect } from 'react';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { DAY_LABELS_EN, DAY_LABELS_VI, SHORT_DAY_LABELS_EN, SHORT_DAY_LABELS_VI, formatIsoDate, parseIsoDate, getWeekDays } from '../../../shared/lib/calendar.js';
import { useTeachingSessions } from '../../../features/coach-workspace/index.js';
import { parseCalendarDate } from '../../../shared/lib/dateTime.js';

export function useTeachingSchedule() {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const DAY_LABELS = isEn ? DAY_LABELS_EN : DAY_LABELS_VI;
  const SHORT_DAY_LABELS = isEn ? SHORT_DAY_LABELS_EN : SHORT_DAY_LABELS_VI;

  const STATUS_CONFIG = useMemo(() => ({
    SCHEDULED: {
      label: isEn ? 'Scheduled' : 'Đã lên lịch',
      badgeClass: 'bg-brand-teal-50 text-brand-teal-700 border-brand-teal-200',
      dotClass: 'bg-brand-teal-500',
      icon: 'schedule'
    },
    COMPLETED: {
      label: isEn ? 'Completed' : 'Đã kết thúc',
      badgeClass: 'bg-brand-sage-50 text-brand-sage-700 border-brand-sage-200',
      dotClass: 'bg-brand-sage-500',
      icon: 'task_alt'
    },
    CANCELLED: {
      label: isEn ? 'Cancelled' : 'Đã hủy',
      badgeClass: 'bg-brand-danger-50 text-brand-danger-700 border-brand-danger-200',
      dotClass: 'bg-brand-danger-500',
      icon: 'cancel'
    }
  }), [isEn]);

  const schedule = useTeachingSessions(60);

  // Chế độ xem: 'week' (Mặc định - Lịch tuần) | 'month' (Lịch tháng) | 'agenda' (Lịch biểu)
  const [viewMode, setViewMode] = useState('week');
  const [currentDate, setCurrentDate] = useState(() => parseCalendarDate());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => formatIsoDate(parseCalendarDate()));

  // Bộ lọc
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('ALL'); // ALL | MORNING | AFTERNOON | EVENING
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // ALL | SCHEDULED | COMPLETED | CANCELLED
  const [searchQuery, setSearchQuery] = useState('');
  const [showPeriodConfig, setShowPeriodConfig] = useState(false);

  // Modal chi tiết ca dạy
  const [activeSession, setActiveSession] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const todayStr = useMemo(() => formatIsoDate(parseCalendarDate()), []);

  // Tự động đọc date và search từ URL hash khi click thông báo
  useEffect(() => {
    const handleHashParams = () => {
      const hash = window.location.hash || '';
      const qs = hash.includes('?') ? hash.split('?')[1] : '';
      if (!qs) return;
      const params = new URLSearchParams(qs);
      const urlDate = params.get('date');
      const urlSearch = params.get('search');
      if (urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate)) {
        const parsed = parseIsoDate(urlDate);
        setCurrentDate(parsed);
        setSelectedCalendarDate(urlDate);
      }
      if (urlSearch) {
        setSearchQuery(decodeURIComponent(urlSearch));
      }
    };
    handleHashParams();
    window.addEventListener('hashchange', handleHashParams);
    return () => window.removeEventListener('hashchange', handleHashParams);
  }, []);

  // Tự động mở modal chi tiết buổi dạy nếu có session khớp với date & search từ thông báo
  useEffect(() => {
    const hash = window.location.hash || '';
    const qs = hash.includes('?') ? hash.split('?')[1] : '';
    if (!qs || !schedule.sessions || schedule.sessions.length === 0) return;
    const params = new URLSearchParams(qs);
    const urlDate = params.get('date');
    const urlSearch = params.get('search');
    const urlSessionId = Number(params.get('sessionId'));

    let matched = null;
    if (urlSessionId) {
      matched = schedule.sessions.find(s => s.id === urlSessionId || s.sessionId === urlSessionId);
    }
    if (!matched && (urlDate || urlSearch)) {
      const normalizedSearch = urlSearch ? decodeURIComponent(urlSearch).toLowerCase() : '';
      matched = schedule.sessions.find(s => {
        const dateMatch = !urlDate || s.sessionDate === urlDate;
        const searchMatch = !normalizedSearch || 
          (s.className || '').toLowerCase().includes(normalizedSearch) || 
          (s.sportName || '').toLowerCase().includes(normalizedSearch);
        return dateMatch && searchMatch;
      });
    }
    if (matched) {
      setActiveSession(matched);
      setDetailModalOpen(true);
    }
  }, [schedule.sessions]);

  // Tự động căn chỉnh tuần xem vào ngày có lớp nếu tuần hiện tại chưa có dữ liệu
  useEffect(() => {
    const hash = window.location.hash || '';
    if (hash.includes('?date=') || hash.includes('&date=')) return;
    if (schedule.sessions && schedule.sessions.length > 0) {
      const today = formatIsoDate(parseCalendarDate());
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

  // Mở modal chi tiết
  const handleOpenDetail = (session) => {
    setActiveSession(session);
    setDetailModalOpen(true);
  };

  // Format tên thứ của buổi dạy
  const formatDayOfWeek = (sessionDate, fallbackDay) => {
    if (sessionDate) {
      const d = parseIsoDate(sessionDate);
      return DAY_LABELS[d.getUTCDay()];
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
        ? currentDate.toLocaleString('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' })
        : `Tháng ${currentDate.getUTCMonth() + 1}, ${currentDate.getUTCFullYear()}`;
    }
    const start = weekDays[0];
    const end = weekDays[6];
    if (isEn) {
      const startMonth = start.toLocaleString('en-US', { timeZone: 'UTC', month: 'short' });
      const endMonth = end.toLocaleString('en-US', { timeZone: 'UTC', month: 'short' });
      return `Week: ${start.getUTCDate()} ${startMonth} - ${end.getUTCDate()} ${endMonth}, ${end.getUTCFullYear()}`;
    }
    return `Tuần: ${start.getUTCDate()} Th${start.getUTCMonth() + 1} - ${end.getUTCDate()} Th${end.getUTCMonth() + 1}, ${end.getUTCFullYear()}`;
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

  return {
    DAY_LABELS, SHORT_DAY_LABELS, STATUS_CONFIG, activeSession, availableSports, currentDate,
    detailModalOpen, formatDayOfWeek, handleNext, handleOpenDetail, handlePrev, handleToday, isEn,
    periodTitle, schedule, searchQuery, selectedCalendarDate, selectedSport, selectedStatus,
    selectedTimeSlot, sessionsByDate, setCurrentDate, setDetailModalOpen, setSearchQuery,
    setSelectedCalendarDate, setSelectedSport, setSelectedStatus, setSelectedTimeSlot,
    setShowPeriodConfig, setViewMode, showPeriodConfig, stats, todayStr, viewMode, weekDays
  };
}
