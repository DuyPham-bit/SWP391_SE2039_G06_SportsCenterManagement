import { parseCalendarDate } from '../../utils/dateTime.js';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { coachApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { CoachError, CoachPeriod, coachInput, useTeachingSessions } from './CoachShared.js';
import { attendanceRestriction, canAttendSession, coachDate, sessionTime } from './coachOverview.js';
import { translateClassName, translateRoomName, translateSportName } from '../../services/i18nHelper.js';

const getAttendanceStatuses = (isEn) => ({
  PRESENT: {
    label: isEn ? 'Present' : 'Có mặt',
    icon: 'check_circle',
    activeClass: 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30 font-bold',
    inactiveClass: 'bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border-slate-200',
    statClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500'
  },
  ABSENT: {
    label: isEn ? 'Absent' : 'Vắng mặt',
    icon: 'cancel',
    activeClass: 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-500/30 font-bold',
    inactiveClass: 'bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-700 border-slate-200',
    statClass: 'bg-rose-50 text-rose-800 border-rose-200',
    dotClass: 'bg-rose-500'
  },
  EXCUSED: {
    label: isEn ? 'Excused' : 'Vắng có phép',
    icon: 'event_available',
    activeClass: 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-500/30 font-bold',
    inactiveClass: 'bg-white hover:bg-sky-50 hover:text-sky-700 text-slate-700 border-slate-200',
    statClass: 'bg-sky-50 text-sky-800 border-sky-200',
    dotClass: 'bg-sky-500'
  }
});

const DAY_NAMES_VI = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
const DAY_NAMES_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL_LABELS_VI = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
const DAY_FULL_LABELS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getMondayOfDate(d) {
  const date = new Date(d);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function getWeekDays(monday) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    return d;
  });
}

function toIsoDate(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDayMonth(d) {
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function formatFullDate(d) {
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
}

function getSessionStatusInfo(session, isEn = false) {
  if (!session) return { label: isEn ? 'Unknown' : 'Không xác định', color: 'slate' };
  if (session.status === 'CANCELLED') {
    return { label: isEn ? 'Cancelled' : 'Đã hủy', badge: 'bg-rose-100 text-rose-800 border-rose-300', dot: 'bg-rose-500', isCancelled: true };
  }
  const now = Date.now();
  const start = sessionTime(session, false);
  const end = sessionTime(session, true);

  if (now < start) {
    return { label: isEn ? 'Upcoming' : 'Chưa tới giờ', badge: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500', isUpcoming: true };
  }
  if (now >= start && now <= end) {
    return { label: isEn ? 'Happening' : 'Đang diễn ra', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500 animate-pulse', isHappening: true };
  }
  return { label: isEn ? 'Ended' : 'Đã kết thúc', badge: 'bg-slate-100 text-slate-800 border-slate-300', dot: 'bg-slate-400', isEnded: true };
}

function getAttendanceRestrictionInfo(session, isEn = false) {
  const restriction = attendanceRestriction(session);
  if (restriction === 'PAST_DATE') {
    return {
      title: isEn ? 'This session has already passed and attendance cannot be edited.' : 'Buổi học đã qua ngày nên không thể sửa điểm danh.',
      description: isEn ? 'Attendance results can only be recorded on the day of the session.' : 'Kết quả điểm danh chỉ được cập nhật trong đúng ngày diễn ra buổi học.'
    };
  }
  if (restriction === 'CANCELLED') {
    return {
      title: isEn ? 'This session has been cancelled. Attendance cannot be taken.' : 'Buổi học này đã bị hủy. Hệ thống không cho phép thực hiện điểm danh.',
      description: isEn ? 'Please contact management if you need to restore this session.' : 'Vui lòng liên hệ bộ phận quản lý nếu cần khôi phục buổi học.'
    };
  }
  return {
    title: isEn ? 'Session has not started yet.' : 'Buổi học chưa đến giờ bắt đầu.',
    description: isEn
      ? `Session scheduled at ${session?.timeSlot || ''} on ${session?.sessionDate || ''}. Coaches can preview the student roster; attendance saving will unlock when the session starts.`
      : `Buổi học diễn ra lúc ${session?.timeSlot || ''} ngày ${session?.sessionDate || ''}. Huấn luyện viên có thể xem trước danh sách học viên; chức năng lưu điểm danh sẽ mở khi ca học bắt đầu.`
  };
}

function getSportBadgeTheme(sportName = '', isEn = false) {
  const s = String(sportName).toLowerCase();
  if (s.includes('bơi') || s.includes('swim')) {
    return {
      bg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      tagBg: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      dot: 'bg-cyan-500',
      icon: 'pool',
      accent: 'border-l-cyan-500',
      label: isEn ? 'Swimming' : 'Bơi lội'
    };
  }
  if (s.includes('yoga') || s.includes('pilates')) {
    return {
      bg: 'bg-purple-50 text-purple-800 border-purple-200',
      tagBg: 'bg-purple-100 text-purple-800 border-purple-200',
      dot: 'bg-purple-500',
      icon: 'self_improvement',
      accent: 'border-l-purple-500',
      label: 'Yoga & Pilates'
    };
  }
  if (s.includes('cầu lông') || s.includes('badminton')) {
    return {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      tagBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
      icon: 'sports_tennis',
      accent: 'border-l-emerald-500',
      label: isEn ? 'Badminton' : 'Cầu lông'
    };
  }
  if (s.includes('gym') || s.includes('fitness')) {
    return {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      tagBg: 'bg-amber-100 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
      icon: 'fitness_center',
      accent: 'border-l-amber-500',
      label: 'Gym & Fitness'
    };
  }
  if (s.includes('boxing') || s.includes('võ') || s.includes('kickfit') || s.includes('martial')) {
    return {
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      tagBg: 'bg-rose-100 text-rose-800 border-rose-200',
      dot: 'bg-rose-500',
      icon: 'sports_mma',
      accent: 'border-l-rose-500',
      label: isEn ? 'Boxing & Martial Arts' : 'Boxing & Võ thuật'
    };
  }
  if (s.includes('bóng rổ') || s.includes('bóng đá') || s.includes('basketball') || s.includes('football')) {
    return {
      bg: 'bg-blue-50 text-blue-800 border-blue-200',
      tagBg: 'bg-blue-100 text-blue-800 border-blue-200',
      dot: 'bg-blue-500',
      icon: 'sports_basketball',
      accent: 'border-l-blue-500',
      label: isEn ? 'Team Sports' : 'Thể thao đồng đội'
    };
  }
  if (s.includes('tennis') || s.includes('bóng bàn') || s.includes('table tennis') || s.includes('pickleball')) {
    return {
      bg: 'bg-lime-50 text-lime-800 border-lime-200',
      tagBg: 'bg-lime-100 text-lime-800 border-lime-200',
      dot: 'bg-lime-500',
      icon: 'sports_tennis',
      accent: 'border-l-lime-500',
      label: isEn ? 'Racket Sports' : 'Vợt & Bóng nhỏ'
    };
  }
  return {
    bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    tagBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    dot: 'bg-indigo-500',
    icon: 'sports',
    accent: 'border-l-indigo-500',
    label: translateSportName(sportName, isEn)
  };
}

function getTimeOfDayBadge(timeSlot = '', isEn = false) {
  const match = timeSlot.match(/(\d{1,2}):/);
  const hour = match ? parseInt(match[1], 10) : 12;
  if (hour < 12) {
    return {
      label: isEn ? 'Morning' : 'Ca Sáng',
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: 'wb_twilight'
    };
  }
  if (hour < 17) {
    return {
      label: isEn ? 'Afternoon' : 'Ca Chiều',
      badge: 'bg-orange-50 text-orange-800 border-orange-200',
      icon: 'light_mode'
    };
  }
  return {
    label: isEn ? 'Evening' : 'Ca Tối',
    badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    icon: 'dark_mode'
  };
}

export function Attendance() {
  const { showSuccess, showError } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const workbenchRef = useRef(null);

  const ATTENDANCE_STATUSES = useMemo(() => getAttendanceStatuses(isEn), [isEn]);
  const DAY_NAMES = isEn ? DAY_NAMES_EN : DAY_NAMES_VI;
  const DAY_FULL_LABELS = isEn ? DAY_FULL_LABELS_EN : DAY_FULL_LABELS_VI;

  // Read URL query params on mount
  const getUrlParams = () => {
    const hash = window.location.hash || '';
    const queryStr = hash.includes('?') ? hash.split('?')[1] : '';
    const params = new URLSearchParams(queryStr);
    return {
      sessionId: Number(params.get('sessionId')) || null,
      date: params.get('date') || null
    };
  };

  const initialParams = getUrlParams();
  const initialDate = initialParams.date ? parseCalendarDate(initialParams.date) : parseCalendarDate();

  // Schedule data hook: generous window (60 days) to allow smooth week navigation
  const schedule = useTeachingSessions(60);

  // Navigation states
  const [currentMonday, setCurrentMonday] = useState(() => getMondayOfDate(initialDate));
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' | 'daily' | 'list'
  const [selectedDateIso, setSelectedDateIso] = useState('ALL'); // 'ALL' or specific ISO date '2026-10-21'
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [readinessFilter, setReadinessFilter] = useState('ALL'); // 'ALL', 'READY', 'UPCOMING', 'CANCELLED'
  const [showCustomPeriod, setShowCustomPeriod] = useState(false);

  // Selected session for attendance
  const [selectedId, setSelectedId] = useState(initialParams.sessionId || null);

  // Attendance roster data
  const [members, setMembers] = useState([]);
  const [records, setRecords] = useState({});
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [version, setVersion] = useState(0);
  const [saving, setSaving] = useState(false);

  // Roster search and filters
  const [searchMember, setSearchMember] = useState('');
  const [filterRosterStatus, setFilterRosterStatus] = useState('ALL'); // 'ALL', 'PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'UNMARKED'

  const weekDays = useMemo(() => getWeekDays(currentMonday), [currentMonday]);
  const todayIso = toIsoDate(parseCalendarDate());

  const weekStartIso = useMemo(() => toIsoDate(weekDays[0]), [weekDays]);
  const weekEndIso = useMemo(() => toIsoDate(weekDays[6]), [weekDays]);

  // Determine the active session
  const activeSession = useMemo(() => {
    if (!schedule.sessions.length) return null;
    if (selectedId) {
      const found = schedule.sessions.find(s => s.id === Number(selectedId));
      if (found) return found;
    }
    // Default to the first session happening today or the first upcoming session in selected week
    const inWeek = schedule.sessions.filter(s => s.sessionDate >= weekStartIso && s.sessionDate <= weekEndIso);
    const todaySession = inWeek.find(s => s.sessionDate === todayIso);
    return todaySession || inWeek[0] || schedule.sessions[0];
  }, [schedule.sessions, selectedId, todayIso, weekStartIso, weekEndIso]);

  // Sync selectedId with activeSession once loaded
  useEffect(() => {
    if (activeSession && (!selectedId || selectedId !== activeSession.id)) {
      setSelectedId(activeSession.id);
    }
  }, [activeSession]);

  // Load roster when activeSession changes
  useEffect(() => {
    let active = true;
    setMembers([]);
    setRecords({});
    setMemberError('');
    if (!activeSession) {
      setLoadingMembers(false);
      return;
    }

    setLoadingMembers(true);
    coachApi.getClassMembers(activeSession.id)
      .then(data => {
        if (!active) return;
        const roster = Array.isArray(data) ? data : [];
        setMembers(roster);
        setRecords(
          Object.fromEntries(
            roster.map(m => {
              let status = m.attendanceStatus || '';
              let note = m.note || '';
              // Nếu dữ liệu cũ có status LATE, chuẩn hóa thành PRESENT và ghi nhận vào note
              if (status === 'LATE') {
                status = 'PRESENT';
                if (!note) {
                  note = 'Đến muộn';
                }
              }
              return [
                m.memberId,
                {
                  memberId: m.memberId,
                  status,
                  note
                }
              ];
            })
          )
        );
      })
      .catch(e => {
        if (active) setMemberError(e.message || 'Không thể tải danh sách học viên.');
      })
      .finally(() => {
        if (active) setLoadingMembers(false);
      });

    return () => { active = false; };
  }, [activeSession?.id, version]);

  // Week navigation handlers
  const handlePrevWeek = () => {
    setCurrentMonday(prev => {
      const next = new Date(prev);
      next.setUTCDate(next.getUTCDate() - 7);
      return next;
    });
    setSelectedDateIso('ALL');
  };

  const handleNextWeek = () => {
    setCurrentMonday(prev => {
      const next = new Date(prev);
      next.setUTCDate(next.getUTCDate() + 7);
      return next;
    });
    setSelectedDateIso('ALL');
  };

  const handleThisWeek = () => {
    const monday = getMondayOfDate(parseCalendarDate());
    setCurrentMonday(monday);
    setSelectedDateIso('ALL');
  };

  const handleSelectSession = (s, scrollToWorkbench = true) => {
    setSelectedId(s.id);
    // Update URL hash without causing full page reload
    const currentHash = window.location.hash || '';
    const baseHash = currentHash.split('?')[0] || '#/coach/attendance';
    window.history.replaceState(null, '', `${baseHash}?sessionId=${s.id}&date=${s.sessionDate}`);

    if (scrollToWorkbench && workbenchRef.current) {
      setTimeout(() => {
        workbenchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  };

  // Record modification
  const handleStatusChange = (memberId, status) => {
    if (!canAttendSession(activeSession)) return;
    setRecords(prev => ({
      ...prev,
      [memberId]: {
        ...(prev[memberId] || { memberId }),
        status,
        note: prev[memberId]?.note || ''
      }
    }));
  };

  const handleNoteChange = (memberId, note) => {
    if (!canAttendSession(activeSession)) return;
    setRecords(prev => ({
      ...prev,
      [memberId]: {
        ...(prev[memberId] || { memberId, status: '' }),
        note
      }
    }));
  };

  // Ghi nhận Đến muộn vào phần ghi chú (Tự động chuyển trạng thái thành Có mặt)
  const handleToggleLateNote = (memberId, minutes = 15) => {
    if (!canAttendSession(activeSession)) return;
    setRecords(prev => {
      const cur = prev[memberId] || { memberId, status: '', note: '' };
      const noteText = cur.note || '';
      let newNote = '';
      if (noteText.includes('Đến muộn')) {
        newNote = noteText.replace(/Đến muộn(\s*\d+\s*(phút|p))?\.?,?\s*/gi, '').trim();
      } else {
        const lateSnippet = minutes ? `Đến muộn ${minutes} phút.` : 'Đến muộn.';
        newNote = noteText ? `${lateSnippet} ${noteText}` : lateSnippet;
      }
      return {
        ...prev,
        [memberId]: {
          ...cur,
          status: cur.status || 'PRESENT',
          note: newNote
        }
      };
    });
  };

  // Quick batch actions
  const handleMarkAllPresent = () => {
    if (!canAttendSession(activeSession)) return;
    setRecords(prev => {
      const updated = { ...prev };
      members.forEach(m => {
        updated[m.memberId] = {
          memberId: m.memberId,
          status: 'PRESENT',
          note: updated[m.memberId]?.note || ''
        };
      });
      return updated;
    });
    showSuccess(
      isEn
        ? `Marked all ${members.length} students as Present. Please review before saving.`
        : `Đã đánh dấu tất cả ${members.length} học viên Có mặt. Vui lòng kiểm tra lại trước khi lưu.`
    );
  };

  const handleResetRecords = () => {
    if (!canAttendSession(activeSession)) return;
    setRecords(prev => {
      const updated = { ...prev };
      members.forEach(m => {
        updated[m.memberId] = {
          memberId: m.memberId,
          status: '',
          note: ''
        };
      });
      return updated;
    });
  };

  // Save attendance
  const handleSaveAttendance = async () => {
    if (!activeSession) return;
    if (!canAttendSession(activeSession)) {
      showError(getAttendanceRestrictionInfo(activeSession, isEn).title);
      return;
    }
    if (saving) return;

    const payload = Object.values(records);
    if (!payload.length) {
      showError(isEn ? 'This session has no enrolled students.' : 'Buổi học chưa có học viên đăng ký.');
      return;
    }

    const unmarked = payload.filter(r => !r.status);
    if (unmarked.length > 0) {
      showError(
        isEn
          ? `${unmarked.length} students still unmarked. Please select a status for all students before saving.`
          : `Còn ${unmarked.length} học viên chưa được chọn trạng thái. Vui lòng chọn trạng thái cho tất cả học viên trước khi lưu.`
      );
      return;
    }

    setSaving(true);
    try {
      await coachApi.takeAttendance(activeSession.id, null, null, null, payload);
      showSuccess(
        isEn
          ? `Attendance saved for class ${activeSession.name} (${activeSession.timeSlot})!`
          : `Đã lưu kết quả điểm danh cho lớp ${activeSession.name} (${activeSession.timeSlot})!`
      );
      setVersion(v => v + 1);
    } catch (e) {
      showError(e.message || (isEn ? 'Error saving attendance records.' : 'Lỗi khi lưu điểm danh.'));
    } finally {
      setSaving(false);
    }
  };

  // Filtered sessions for the schedule
  const availableSports = useMemo(() => {
    const set = new Set(schedule.sessions.map(s => s.sportName).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [schedule.sessions]);

  // Overall metrics for the currently selected week
  const weekStats = useMemo(() => {
    const inWeek = schedule.sessions.filter(s => s.sessionDate >= weekStartIso && s.sessionDate <= weekEndIso);
    const todaySessions = inWeek.filter(s => s.sessionDate === todayIso);
    const readySessions = inWeek.filter(s => canAttendSession(s));
    const endedSessions = inWeek.filter(s => {
      const end = sessionTime(s, true);
      return s.status !== 'CANCELLED' && Date.now() > end;
    });
    return {
      total: inWeek.length,
      today: todaySessions.length,
      ready: readySessions.length,
      ended: endedSessions.length
    };
  }, [schedule.sessions, weekStartIso, weekEndIso, todayIso]);

  const selectedDayInfo = useMemo(() => {
    if (selectedDateIso === 'ALL') return null;
    const idx = weekDays.findIndex(d => toIsoDate(d) === selectedDateIso);
    if (idx !== -1) {
      return {
        date: weekDays[idx],
        iso: selectedDateIso,
        dayName: DAY_NAMES[idx],
        dayFullLabel: DAY_FULL_LABELS[idx]
      };
    }
    const d = parseCalendarDate(selectedDateIso);
    return {
      date: d,
      iso: selectedDateIso,
      dayName: '',
      dayFullLabel: formatFullDate(d)
    };
  }, [selectedDateIso, weekDays, DAY_NAMES, DAY_FULL_LABELS]);

  const filteredSessions = useMemo(() => {
    const list = schedule.sessions.filter(s => {
      // If a specific day is selected, filter strictly by that day's ISO date
      if (selectedDateIso !== 'ALL') {
        if (s.sessionDate !== selectedDateIso) return false;
      } else {
        // Otherwise strictly bound by current week (unless custom period is enabled)
        if (!showCustomPeriod) {
          if (s.sessionDate < weekStartIso || s.sessionDate > weekEndIso) return false;
        }
      }

      if (selectedSport !== 'ALL' && s.sportName !== selectedSport) return false;

      if (readinessFilter === 'READY') {
        return canAttendSession(s);
      } else if (readinessFilter === 'UPCOMING') {
        const start = sessionTime(s, false);
        return s.status !== 'CANCELLED' && Date.now() < start;
      } else if (readinessFilter === 'CANCELLED') {
        return s.status === 'CANCELLED';
      }
      return true;
    });

    return list.sort((a, b) => {
      if (a.sessionDate !== b.sessionDate) {
        return a.sessionDate.localeCompare(b.sessionDate);
      }
      return String(a.startTime).localeCompare(String(b.startTime));
    });
  }, [schedule.sessions, selectedDateIso, showCustomPeriod, weekStartIso, weekEndIso, selectedSport, readinessFilter]);


  // Group sessions by ISO date string for quick weekly calendar lookup and day tab counts
  const sessionsByDate = useMemo(() => {
    const map = {};
    weekDays.forEach(d => {
      map[toIsoDate(d)] = [];
    });
    schedule.sessions.forEach(s => {
      if (s.sessionDate < weekStartIso || s.sessionDate > weekEndIso) return;
      if (selectedSport !== 'ALL' && s.sportName !== selectedSport) return;
      if (readinessFilter === 'READY') {
        if (!canAttendSession(s)) return;
      } else if (readinessFilter === 'UPCOMING') {
        const start = sessionTime(s, false);
        if (s.status === 'CANCELLED' || Date.now() >= start) return;
      } else if (readinessFilter === 'CANCELLED') {
        if (s.status !== 'CANCELLED') return;
      }
      if (map[s.sessionDate]) {
        map[s.sessionDate].push(s);
      }
    });
    // Sort each day's sessions by start time
    Object.keys(map).forEach(key => {
      map[key].sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
    });
    return map;
  }, [schedule.sessions, weekDays, weekStartIso, weekEndIso, selectedSport, readinessFilter]);

  // Attendance metrics calculation
  const stats = useMemo(() => {
    const values = Object.values(records);
    const present = values.filter(r => r.status === 'PRESENT').length;
    const absent = values.filter(r => r.status === 'ABSENT').length;
    const excused = values.filter(r => r.status === 'EXCUSED').length;
    const unmarked = members.length - (present + absent + excused);
    return { present, absent, excused, unmarked: Math.max(0, unmarked), total: members.length };
  }, [records, members]);

  // Filtered members in attendance roster
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const q = searchMember.trim().toLowerCase();
      if (q) {
        const matchName = String(m.memberName || '').toLowerCase().includes(q);
        const matchCode = String(m.memberCode || '').toLowerCase().includes(q);
        const matchPhone = String(m.phone || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchPhone) return false;
      }

      const rec = records[m.memberId];
      const status = rec?.status || '';

      if (filterRosterStatus === 'UNMARKED') {
        return !status;
      } else if (filterRosterStatus !== 'ALL') {
        return status === filterRosterStatus;
      }
      return true;
    });
  }, [members, searchMember, records, filterRosterStatus]);

  const canAttend = activeSession && canAttendSession(activeSession);
  const activeSessionStatusInfo = activeSession ? getSessionStatusInfo(activeSession, isEn) : null;
  const activeAttendanceRestriction = activeSession && !canAttend
    ? getAttendanceRestrictionInfo(activeSession, isEn)
    : null;


  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER BANNER */}
      <div className="rounded-3xl bg-gradient-to-r from-[#2F7B5D] via-[#24828F] via-[#3FAEB8] to-[#E5A33C] dark:from-[#184534] dark:via-[#144850] dark:via-[#1B5760] dark:to-[#5E4014] text-white p-6 sm:p-8 relative overflow-hidden border border-white/30 dark:border-white/10 shadow-xl shadow-[#24828F]/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
        <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-[#F2CC8F]/45 via-[#E5A33C]/30 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-gradient-to-tr from-[#81B29A]/40 via-[#2F7B5D]/30 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-[#A8DADC]/30 rounded-full blur-3xl" />

        {/* Subtle decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
        </svg>

        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 text-[#1B4332] dark:text-emerald-300 text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/80 dark:border-white/20 mb-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isEn ? 'Olympic Teaching & Attendance' : 'Lịch giảng dạy & điểm danh Olympic'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-chivo font-black tracking-tight text-white flex items-center gap-2.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            <span className="material-symbols-outlined text-[28px] text-amber-300">event_available</span>
            <span>{isEn ? 'Teaching Schedule & Class Attendance' : 'Lịch Dạy & Điểm Danh Lớp Học'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-white/95 max-w-2xl font-medium leading-relaxed drop-shadow-xs">
            {isEn
              ? 'Track weekly coaching timetable, choose a session to take student roll-call and record attendance.'
              : 'Theo dõi thời khóa biểu ca dạy theo tuần, chọn buổi học để kiểm diện học viên và lưu kết quả chuyên cần.'}
          </p>
        </div>

        {/* Action button to toggle custom date range */}
        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <button
            type="button"
            onClick={() => setShowCustomPeriod(!showCustomPeriod)}
            className="px-4 py-2.5 rounded-xl border border-white/30 bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md shadow-xs hover-lift"
          >
            <span className="material-symbols-outlined text-[16px] text-amber-300">date_range</span>
            <span>{showCustomPeriod ? (isEn ? 'Hide date filter' : 'Ẩn bộ lọc ngày') : (isEn ? 'Custom date range' : 'Tùy chỉnh khoảng ngày')}</span>
          </button>
          <button
            type="button"
            onClick={() => schedule.reload()}
            disabled={schedule.loading}
            className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50 hover-lift"
          >
            <span className={`material-symbols-outlined text-[16px] ${schedule.loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{isEn ? 'Refresh schedule' : 'Làm mới lịch'}</span>
          </button>
        </div>
      </div>

      {/* Optional custom period form */}
      {showCustomPeriod && (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <p className="text-xs font-bold text-slate-700 mb-2">
            {isEn ? 'Select date range to load schedule data:' : 'Chọn khoảng thời gian tải dữ liệu lịch giảng dạy:'}
          </p>
          <CoachPeriod schedule={schedule} />
        </div>
      )}

      <CoachError message={schedule.error} retry={schedule.reload} />

      {/* SECTION 1: SCHEDULE CONTROLS & TIMETABLE (DẠNG SCHEDULE) */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 space-y-5">
        {/* Schedule Header: Week Navigation + View Mode Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Week Navigation Controls */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={handlePrevWeek}
                title={isEn ? "Previous week" : "Tuần trước"}
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-all flex items-center"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={handleThisWeek}
                className="px-3 py-1 rounded-lg text-xs font-bold text-slate-700 hover:bg-white transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm text-red-600">today</span>
                <span>{isEn ? 'This week' : 'Tuần này'}</span>
              </button>
              <button
                type="button"
                onClick={handleNextWeek}
                title={isEn ? "Next week" : "Tuần sau"}
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-all flex items-center"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>

            <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-slate-500">calendar_month</span>
              <span>
                {formatFullDate(weekDays[0])} – {formatFullDate(weekDays[6])}
              </span>
            </div>
          </div>

          {/* View Mode & Filters */}
          <div className="flex items-center flex-wrap gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('weekly')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'weekly'
                    ? 'bg-white text-red-600 shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-sm">calendar_view_week</span>
                <span>{isEn ? 'Weekly' : 'Lịch tuần'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-red-600 shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-sm">format_list_bulleted</span>
                <span>{isEn ? 'List' : 'Danh sách ca'}</span>
              </button>
            </div>

            {/* Sport Filter */}
            {availableSports.length > 2 && (
              <select
                aria-label={isEn ? "Filter by sport" : "Lọc theo môn"}
                value={selectedSport}
                onChange={e => setSelectedSport(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-red-600 focus:outline-none"
              >
                <option value="ALL">{isEn ? 'All Sports' : 'Tất cả môn'}</option>
                {availableSports.filter(s => s !== 'ALL').map(sport => (
                  <option key={sport} value={sport}>{translateSportName(sport, isEn)}</option>
                ))}
              </select>
            )}

            {/* Readiness Filter */}
            <select
              aria-label={isEn ? "Filter by readiness" : "Lọc theo trạng thái điểm danh"}
              value={readinessFilter}
              onChange={e => setReadinessFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-red-600 focus:outline-none"
            >
              <option value="ALL">{isEn ? 'All Sessions' : 'Tất cả ca'}</option>
              <option value="READY">{isEn ? '⚡ Ready for Attendance' : '⚡ Sẵn sàng điểm danh'}</option>
              <option value="UPCOMING">{isEn ? '⏳ Upcoming' : '⏳ Sắp diễn ra'}</option>
              <option value="CANCELLED">{isEn ? '✕ Cancelled' : '✕ Đã hủy'}</option>
            </select>
          </div>
        </div>

        {/* KPI Quick Overview Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">calendar_today</span>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                {isEn ? 'This Week' : 'Tổng ca tuần này'}
              </div>
              <div className="font-chivo font-black text-lg text-slate-900 leading-tight">
                {weekStats.total} {isEn ? 'sessions' : 'ca'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setViewMode('list');
              setSelectedDateIso(todayIso);
            }}
            className="p-3.5 rounded-xl bg-red-50/60 hover:bg-red-50 border border-red-200 text-left transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-xl">today</span>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1">
                <span className="truncate">{isEn ? 'Today' : 'Ca hôm nay'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0"></span>
              </div>
              <div className="font-chivo font-black text-lg text-red-950 leading-tight">
                {weekStats.today} {isEn ? 'sessions' : 'ca'}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setReadinessFilter(readinessFilter === 'READY' ? 'ALL' : 'READY');
            }}
            className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
              readinessFilter === 'READY'
                ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-500/30'
                : 'bg-emerald-50/60 hover:bg-emerald-50 border-emerald-200'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-xl">fact_check</span>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                <span className="truncate">{isEn ? 'Roll-call Ready' : 'Sẵn sàng điểm danh'}</span>
              </div>
              <div className="font-chivo font-black text-lg text-emerald-950 leading-tight">
                {weekStats.ready} {isEn ? 'sessions' : 'ca'}
              </div>
            </div>
          </button>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">task_alt</span>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                {isEn ? 'Completed' : 'Đã kết thúc'}
              </div>
              <div className="font-chivo font-black text-lg text-slate-900 leading-tight">
                {weekStats.ended} {isEn ? 'sessions' : 'ca'}
              </div>
            </div>
          </div>
        </div>

        {/* Day Tabs (For quick day filter in list view) */}
        {viewMode === 'list' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => setSelectedDateIso('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                selectedDateIso === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{isEn ? 'All Days' : 'Tất cả các ngày'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                selectedDateIso === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {weekStats.total}
              </span>
            </button>
            {weekDays.map((d, index) => {
              const iso = toIsoDate(d);
              const isSelected = selectedDateIso === iso;
              const isToday = iso === todayIso;
              const count = (sessionsByDate[iso] || []).length;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelectedDateIso(iso)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : isToday
                        ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 font-extrabold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{DAY_FULL_LABELS[index]}</span>
                  <span className="opacity-75 font-normal">({formatDayMonth(d)})</span>
                  {count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected ? 'bg-white text-red-600' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {count}
                    </span>
                  )}
                  {isToday && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] uppercase font-black tracking-wider ${
                      isSelected ? 'bg-white/25 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {isEn ? 'Today' : 'Hôm nay'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* LOADING STATE */}
        {schedule.loading && (
          <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <div className="inline-block animate-spin text-red-600 mb-2">
              <span className="material-symbols-outlined text-3xl">progress_activity</span>
            </div>
            <p className="text-sm font-bold text-slate-700">{isEn ? 'Loading teaching timetable...' : 'Đang tải thời khóa biểu ca dạy...'}</p>
            <p className="text-xs text-slate-400 mt-1">{isEn ? 'Please wait a moment' : 'Vui lòng chờ trong giây lát'}</p>
          </div>
        )}

        {/* VIEW 1: WEEKLY TIMETABLE GRID (DẠNG LỊCH THỜI KHÓA BIỂU 7 CỘT) */}
        {!schedule.loading && viewMode === 'weekly' && (
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[840px] grid grid-cols-7 gap-3">
              {weekDays.map((d, index) => {
                const iso = toIsoDate(d);
                const daySessions = sessionsByDate[iso] || [];
                const isToday = iso === todayIso;

                return (
                  <div
                    key={iso}
                    className={`flex flex-col rounded-2xl border transition-all ${
                      isToday
                        ? 'bg-red-50/20 border-red-200 shadow-sm'
                        : 'bg-slate-50/50 border-slate-200'
                    }`}
                  >
                    {/* Day Column Header */}
                    <div className={`p-3 text-center border-b rounded-t-2xl ${
                      isToday
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-slate-800 border-slate-200'
                    }`}>
                      <div className="text-[11px] uppercase tracking-wider font-extrabold">
                        {DAY_FULL_LABELS[index]}
                      </div>
                      <div className="text-base font-black mt-0.5">
                        {formatDayMonth(d)}
                      </div>
                      <div className="flex items-center justify-center gap-1 mt-1 text-[10px]">
                        {isToday && (
                          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-white font-bold">
                            {isEn ? 'Today' : 'Hôm nay'}
                          </span>
                        )}
                        <span className={isToday ? 'text-white/80' : 'text-slate-500 font-semibold'}>
                          {isEn ? `${daySessions.length} sessions` : `${daySessions.length} ca dạy`}
                        </span>
                      </div>
                    </div>

                    {/* Day Sessions List */}
                    <div className="p-2 space-y-2 flex-1 min-h-[160px]">
                      {daySessions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-6 text-center">
                          <span className="material-symbols-outlined text-2xl text-slate-300">event_busy</span>
                          <span className="text-[11px] mt-1">{isEn ? 'No sessions' : 'Không có ca'}</span>
                        </div>
                      ) : (
                        daySessions.map(s => {
                          const isSelected = activeSession?.id === s.id;
                          const statusInfo = getSessionStatusInfo(s, isEn);
                          const attendable = canAttendSession(s);
                          const sportTheme = getSportBadgeTheme(s.sportName, isEn);
                          const fillPercent = s.capacity > 0 ? Math.round((s.enrolledCount / s.capacity) * 100) : 0;

                          return (
                            <div
                              key={s.id}
                              onClick={() => handleSelectSession(s)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={e => e.key === 'Enter' && handleSelectSession(s)}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative group ${
                                isSelected
                                  ? 'bg-white border-red-600 ring-2 ring-red-600/30 shadow-md scale-[1.02]'
                                  : attendable
                                    ? 'bg-white border-emerald-300 hover:border-emerald-500 hover:shadow-sm'
                                    : 'bg-white border-slate-200 hover:border-red-300 hover:shadow-sm'
                              } border-l-4 ${sportTheme.accent}`}
                            >
                              {/* Selected Marker */}
                              {isSelected && (
                                <div className="absolute top-2 right-2">
                                  <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                                  </span>
                                </div>
                              )}

                              {/* Time & Sport */}
                              <div className="flex items-center gap-1 text-[11px] font-extrabold text-slate-900 mb-1">
                                <span className="material-symbols-outlined text-xs text-red-600">schedule</span>
                                <span>{s.timeSlot}</span>
                              </div>

                              <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${sportTheme.tagBg}`}>
                                  <span className="material-symbols-outlined text-[11px]">{sportTheme.icon}</span>
                                  <span className="truncate max-w-[85px]">{translateSportName(s.sportName, isEn)}</span>
                                </span>
                                {attendable && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    {isEn ? 'Roll-call' : 'Điểm danh'}
                                  </span>
                                )}
                              </div>

                              {/* Class Name */}
                              <h2 className="text-xs font-black text-slate-900 leading-snug line-clamp-2">
                                {translateClassName(s.name, isEn)}
                              </h2>

                              {/* Room & Capacity */}
                              <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 space-y-1">
                                <div className="flex items-center gap-1 truncate">
                                  <span className="material-symbols-outlined text-[13px] text-slate-400">stadium</span>
                                  <span className="truncate">{translateRoomName(s.roomName, isEn)}</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600 font-semibold">
                                  <span>{isEn ? 'Enrolled:' : 'Đã đặt:'}</span>
                                  <span className={`font-bold ${fillPercent >= 100 ? 'text-rose-600' : 'text-slate-900'}`}>{s.enrolledCount}/{s.capacity}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${fillPercent >= 100 ? 'bg-rose-500' : fillPercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${Math.min(100, fillPercent)}%` }}
                                  />
                                </div>
                              </div>

                              {/* Action prompt */}
                              <div className={`mt-2 text-center py-1 rounded text-[10px] font-bold transition-colors ${
                                isSelected
                                  ? 'bg-red-600 text-white'
                                  : attendable
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white'
                                    : 'bg-slate-50 text-slate-600 group-hover:bg-red-50 group-hover:text-red-700'
                              }`}>
                                {isSelected
                                  ? (isEn ? 'Selected for Attendance' : 'Đang chọn điểm danh')
                                  : attendable
                                    ? (isEn ? '⚡ Take attendance' : '⚡ Điểm danh ca này')
                                    : (isEn ? 'Select this session' : 'Chọn ca này')}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: LIST VIEW (DANH SÁCH CA BẢNG BIỂU CHUYÊN NGHIỆP) */}
        {!schedule.loading && viewMode === 'list' && (
          <div className="space-y-4">
            {/* Optional Selected Day Focus Banner */}
            {selectedDateIso !== 'ALL' && selectedDayInfo && (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-red-500/10 via-amber-500/5 to-slate-50 border border-red-200 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-black shadow-xs">
                    <span className="material-symbols-outlined text-lg">event</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-chivo font-black text-sm md:text-base text-slate-900">
                        {selectedDayInfo.dayFullLabel}, {formatFullDate(selectedDayInfo.date)}
                      </span>
                      {selectedDateIso === todayIso && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white">
                          {isEn ? 'Today' : 'Hôm nay'}
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                        {filteredSessions.length} {isEn ? 'sessions' : 'ca dạy'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDateIso('ALL')}
                  className="text-xs font-bold text-slate-700 hover:text-red-600 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-sm">view_agenda</span>
                  <span>{isEn ? 'View all days this week' : 'Xem tất cả các ngày trong tuần'}</span>
                </button>
              </div>
            )}

            {filteredSessions.length === 0 ? (
              <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <span className="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
                <p className="text-sm font-bold text-slate-700 mt-2">
                  {isEn ? 'No teaching sessions match your current filter.' : 'Không tìm thấy ca dạy nào phù hợp với bộ lọc.'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {isEn ? 'Try selecting another day, sport, or clearing readiness filters.' : 'Thử chọn ngày khác, môn học khác hoặc xóa bộ lọc trạng thái.'}
                </p>
                {(selectedDateIso !== 'ALL' || selectedSport !== 'ALL' || readinessFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDateIso('ALL');
                      setSelectedSport('ALL');
                      setReadinessFilter('ALL');
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    <span>{isEn ? 'Reset all filters' : 'Xóa tất cả bộ lọc'}</span>
                  </button>
                )}
              </div>
            ) : (
              /* REAL HIGH-DENSITY LIST TABLE VIEW */
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">{isEn ? 'Time Slot' : 'Thời gian'}</th>
                      <th className="py-3 px-4">{isEn ? 'Sport & Class' : 'Môn học & Lớp'}</th>
                      <th className="py-3 px-4">{isEn ? 'Room / Venue' : 'Phòng học'}</th>
                      <th className="py-3 px-4">{isEn ? 'Enrolled' : 'Sĩ số'}</th>
                      <th className="py-3 px-4">{isEn ? 'Status' : 'Trạng thái'}</th>
                      <th className="py-3 px-4 text-right">{isEn ? 'Action' : 'Thao tác'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSessions.map(s => {
                      const isSelected = activeSession?.id === s.id;
                      const statusInfo = getSessionStatusInfo(s, isEn);
                      const attendable = canAttendSession(s);
                      const sportTheme = getSportBadgeTheme(s.sportName, isEn);
                      const timeOfDay = getTimeOfDayBadge(s.timeSlot, isEn);
                      const fillPercent = s.capacity > 0 ? Math.round((s.enrolledCount / s.capacity) * 100) : 0;
                      return (
                        <tr
                          key={s.id}
                          onClick={() => handleSelectSession(s)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-red-50/50 font-medium' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-chivo font-black text-slate-900">{s.timeSlot}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${timeOfDay.badge}`}>
                                {timeOfDay.label}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                              {s.dayOfWeek}, {formatDayMonth(parseCalendarDate(s.sessionDate))}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${sportTheme.tagBg}`}>
                                <span className="material-symbols-outlined text-xs">{sportTheme.icon}</span>
                                <span>{translateSportName(s.sportName, isEn)}</span>
                              </span>
                            </div>
                            <div className="font-chivo font-bold text-slate-900 line-clamp-1">
                              {translateClassName(s.name, isEn)}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-sm text-slate-400">stadium</span>
                              <span>{translateRoomName(s.roomName, isEn)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-bold text-slate-800">
                              {s.enrolledCount}/{s.capacity} <span className="text-[10px] font-normal text-slate-500">({fillPercent}%)</span>
                            </div>
                            <div className="w-24 bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${fillPercent >= 100 ? 'bg-rose-500' : fillPercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, fillPercent)}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {attendable ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 w-fit shadow-xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>{isEn ? '⚡ Ready' : '⚡ Sẵn sàng'}</span>
                              </span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 w-fit ${statusInfo.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                                <span>{statusInfo.label}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs ${
                                isSelected
                                  ? 'bg-red-600 text-white shadow-red-500/20'
                                  : attendable
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                                    : 'bg-slate-900 hover:bg-red-600 text-white'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm">
                                {isSelected ? 'check' : attendable ? 'fact_check' : 'visibility'}
                              </span>
                              <span>
                                {isSelected
                                  ? (isEn ? 'Taking attendance' : 'Đang điểm danh')
                                  : attendable
                                    ? (isEn ? 'Roll-call' : 'Điểm danh ngay')
                                    : (isEn ? 'Select' : 'Chọn ca')}
                              </span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SECTION 2: ATTENDANCE WORKBENCH (KHU VỰC THỰC HIỆN ĐIỂM DANH CHO CA ĐÃ CHỌN) */}
      <section
        id="attendance-workbench"
        ref={workbenchRef}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 space-y-6"
      >
        {/* Selected Session Header Banner */}
        {activeSession ? (
          <div className="bg-gradient-to-r from-[#2F7B5D] via-[#24828F] via-[#3FAEB8] to-[#E5A33C] dark:from-[#184534] dark:via-[#144850] dark:via-[#1B5760] dark:to-[#5E4014] text-white p-5 md:p-6 rounded-2xl relative overflow-hidden shadow-lg border border-white/20">
            {/* Ambient glows */}
            <div className="pointer-events-none absolute -right-12 -top-12 w-64 h-64 rounded-full bg-gradient-to-br from-[#F2CC8F]/35 via-[#E5A33C]/20 to-transparent blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-gradient-to-tr from-[#81B29A]/30 via-[#2F7B5D]/20 to-transparent blur-2xl" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center flex-wrap gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">
                    {translateSportName(activeSession.sportName, isEn)}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
                    {isEn ? `Room: ${translateRoomName(activeSession.roomName, isEn)}` : `Phòng: ${activeSession.roomName}`}
                  </span>
                  {activeSessionStatusInfo && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${activeSessionStatusInfo.dot}`}></span>
                      {activeSessionStatusInfo.label}
                    </span>
                  )}
                </div>

                <h2 className="font-chivo text-xl md:text-2xl font-black tracking-tight text-white">
                  {translateClassName(activeSession.name, isEn)}
                </h2>

                <p className="text-slate-300 text-xs md:text-sm mt-1 flex items-center flex-wrap gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-red-400">calendar_month</span>
                    <strong>{activeSession.dayOfWeek}, {formatFullDate(parseCalendarDate(activeSession.sessionDate))}</strong>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-red-400">schedule</span>
                    <strong>{activeSession.timeSlot}</strong>
                  </span>
                  <span>·</span>
                  <span>{isEn ? 'Enrolled students: ' : 'Sĩ số đăng ký: '}<strong>{activeSession.enrolledCount}/{activeSession.capacity} {isEn ? 'students' : 'học viên'}</strong></span>
                </p>
              </div>

              {/* Quick Session Switcher Dropdown */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-[260px]">
                <div className="bg-white/10 p-2.5 rounded-xl border border-white/15 text-xs text-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    {isEn ? 'Switch session:' : 'Đổi ca dạy khác:'}
                  </span>
                  <select
                    aria-label={isEn ? "Switch session" : "Đổi ca dạy nhanh"}
                    value={activeSession.id}
                    onChange={e => {
                      const found = schedule.sessions.find(s => s.id === Number(e.target.value));
                      if (found) handleSelectSession(found, false);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    {schedule.sessions.map(s => (
                      <option key={s.id} value={s.id}>
                        {translateClassName(s.name, isEn)} · {s.sessionDate} · {s.timeSlot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
            {isEn ? 'No teaching session selected. Please pick a session from the timetable above.' : 'Chưa có ca dạy nào được chọn. Vui lòng chọn một ca từ lịch thời khóa biểu ở trên.'}
          </div>
        )}

        {/* Guardrail Policy Banner */}
        {activeSession && !canAttend && (
          <div role="alert" className="p-4 rounded-xl border bg-amber-50 border-amber-200 text-amber-900 text-xs md:text-sm flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 text-xl flex-shrink-0">info</span>
            <div>
              <p className="font-bold">{activeAttendanceRestriction.title}</p>
              <p className="mt-0.5 text-amber-800">{activeAttendanceRestriction.description}</p>
            </div>
          </div>
        )}

        <CoachError message={memberError} retry={() => setVersion(v => v + 1)} />

        {/* SUMMARY STATS & BATCH ACTIONS */}
        {activeSession && !memberError && (
          <div className="space-y-4">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block">{isEn ? 'Total Students' : 'Tổng học viên'}</span>
                <span className="font-chivo text-2xl font-black text-slate-900 mt-1 block">
                  {stats.total}
                </span>
              </div>

              {Object.entries(ATTENDANCE_STATUSES).map(([key, cfg]) => {
                const count = stats[key.toLowerCase()] || 0;
                return (
                  <div key={key} className={`p-3.5 rounded-xl border ${cfg.statClass}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold block">{cfg.label}</span>
                      <span className={`w-2 h-2 rounded-full ${cfg.dotClass}`}></span>
                    </div>
                    <span className="font-chivo text-2xl font-black mt-1 block">
                      {count}
                    </span>
                  </div>
                );
              })}

              <div className={`p-3.5 rounded-xl border ${
                stats.unmarked > 0 ? 'bg-orange-50 border-orange-200 text-orange-900' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <span className="text-[11px] font-bold block">{isEn ? 'Unmarked' : 'Chưa đánh dấu'}</span>
                <span className="font-chivo text-2xl font-black mt-1 block">
                  {stats.unmarked}
                </span>
              </div>
            </div>

            {/* Quick Actions & Filters Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              {/* Search Member */}
              <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  search
                </span>
                <input
                  type="text"
                  placeholder={isEn ? "Search students by name, code, phone..." : "Tìm học viên theo tên, mã HV, SĐT..."}
                  value={searchMember}
                  onChange={e => setSearchMember(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              {/* Batch Action Buttons */}
              <div className="flex items-center flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!canAttend || saving || members.length === 0}
                  onClick={handleMarkAllPresent}
                  className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  title={isEn ? "Mark all students as Present" : "Đánh dấu tất cả học viên thành Có mặt"}
                >
                  <span className="material-symbols-outlined text-base">done_all</span>
                  <span>{isEn ? 'All Present' : 'Tất cả Có mặt'}</span>
                </button>

                <button
                  type="button"
                  disabled={!canAttend || saving || members.length === 0}
                  onClick={handleResetRecords}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">restart_alt</span>
                  <span>{isEn ? 'Reset' : 'Đặt lại'}</span>
                </button>
              </div>
            </div>

            {/* Status Filter Tabs for Roster */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
              <span className="text-slate-400 text-[11px] uppercase tracking-wider mr-1">{isEn ? 'Filter:' : 'Lọc:'}</span>
              <button
                type="button"
                onClick={() => setFilterRosterStatus('ALL')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterRosterStatus === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isEn ? 'All' : 'Tất cả'} ({members.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterRosterStatus('PRESENT')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterRosterStatus === 'PRESENT'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                {isEn ? 'Present' : 'Có mặt'} ({stats.present})
              </button>
              <button
                type="button"
                onClick={() => setFilterRosterStatus('ABSENT')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterRosterStatus === 'ABSENT'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                }`}
              >
                {isEn ? 'Absent' : 'Vắng'} ({stats.absent})
              </button>
              <button
                type="button"
                onClick={() => setFilterRosterStatus('EXCUSED')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterRosterStatus === 'EXCUSED'
                    ? 'bg-sky-600 text-white'
                    : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
                }`}
              >
                {isEn ? 'Excused' : 'Có phép'} ({stats.excused})
              </button>
              <button
                type="button"
                onClick={() => setFilterRosterStatus('UNMARKED')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterRosterStatus === 'UNMARKED'
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
                }`}
              >
                {isEn ? 'Unmarked' : 'Chưa đánh dấu'} ({stats.unmarked})
              </button>
            </div>
          </div>
        )}

        {/* LOADING ROSTER */}
        {loadingMembers && (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin text-red-600 mb-2">
              <span className="material-symbols-outlined text-3xl">progress_activity</span>
            </div>
            <p className="text-sm font-bold text-slate-700">{isEn ? 'Loading student roster...' : 'Đang tải danh sách học viên điểm danh...'}</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loadingMembers && !memberError && activeSession && members.length === 0 && (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <span className="material-symbols-outlined text-4xl text-slate-300">group_off</span>
            <p className="text-sm font-bold text-slate-700 mt-2">{isEn ? 'No students enrolled for this session yet.' : 'Chưa có học viên đặt chỗ cho buổi học này.'}</p>
            <p className="text-xs text-slate-500 mt-1">{isEn ? 'When students book a spot, the roster will show up here.' : 'Khi học viên đặt chỗ tham gia lớp, danh sách sẽ hiển thị tại đây.'}</p>
          </div>
        )}

        {/* ROSTER MEMBER CARDS */}
        {!loadingMembers && !memberError && filteredMembers.length > 0 && (
          <div className="space-y-3">
            {filteredMembers.map((m, index) => {
              const currentRecord = records[m.memberId] || { memberId: m.memberId, status: '', note: '' };
              const isUnmarked = !currentRecord.status;

              return (
                <article
                  key={m.memberId}
                  className={`p-4 rounded-2xl border transition-all ${
                    isUnmarked
                      ? 'bg-orange-50/20 border-orange-200'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Member Profile Info */}
                    <div className="flex items-center gap-3 min-w-[240px]">
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-black flex items-center justify-center text-sm flex-shrink-0">
                        {String(m.memberName || 'HV').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">{m.memberName}</h3>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                            {m.memberCode || `HV#${m.memberId}`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {m.phone || (isEn ? 'No phone' : 'Chưa có SĐT')} {m.email ? `· ${m.email}` : ''}
                        </p>
                        {(m.fitnessGoal || m.fitnessLevel) && (
                          <p className="text-[11px] text-red-600 font-semibold mt-0.5">
                            {isEn ? 'Goal: ' : 'Mục tiêu: '}{m.fitnessGoal || m.fitnessLevel}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Interactive Status Selector (Segmented Button Group) */}
                    <div className="flex items-center flex-wrap gap-1.5">
                      {Object.entries(ATTENDANCE_STATUSES).map(([key, cfg]) => {
                        const isSelected = currentRecord.status === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            disabled={!canAttend || saving}
                            onClick={() => handleStatusChange(m.memberId, key)}
                            className={`px-3 py-1.5 rounded-xl text-xs transition-all border flex items-center gap-1.5 disabled:opacity-50 ${
                              isSelected ? cfg.activeClass : cfg.inactiveClass
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">{cfg.icon}</span>
                            <span>{cfg.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Note Field & Quick Late Tag */}
                    <div className="lg:w-80 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          maxLength={500}
                          placeholder={isEn ? "Notes (e.g. 5m late, good effort...)" : "Ghi chú (VD: Đến muộn 5 phút, tập tốt...)"}
                          disabled={!canAttend || saving}
                          value={currentRecord.note || ''}
                          onChange={e => handleNoteChange(m.memberId, e.target.value)}
                          className={`${coachInput} text-xs py-1.5 flex-1`}
                        />
                        <button
                          type="button"
                          disabled={!canAttend || saving}
                          onClick={() => handleToggleLateNote(m.memberId, 15)}
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${
                            currentRecord.note?.includes('Đến muộn')
                              ? 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold shadow-2xs'
                              : 'bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-800 border-slate-200'
                          }`}
                          title={isEn ? "Mark Present and add Late note" : "Đánh dấu Có mặt và ghi chú Đến muộn"}
                        >
                          <span className="material-symbols-outlined text-[13px]">schedule</span>
                          <span>{isEn ? '+ Late' : '+ Muộn'}</span>
                        </button>
                      </div>

                      {/* Quick late minute chips if note has Đến muộn */}
                      {currentRecord.note?.includes('Đến muộn') && (
                        <div className="flex items-center gap-1 text-[10px] pl-1 animate-fadeIn">
                          <span className="text-slate-400 font-semibold">{isEn ? 'Time:' : 'Thời gian:'}</span>
                          {[5, 10, 15, 30].map(mins => (
                            <button
                              key={mins}
                              type="button"
                              disabled={!canAttend || saving}
                              onClick={() => {
                                const cleaned = (currentRecord.note || '').replace(/Đến muộn(\s*\d+\s*(phút|p))?\.?,?\s*/gi, '').trim();
                                const note = cleaned ? `Đến muộn ${mins} phút. ${cleaned}` : `Đến muộn ${mins} phút.`;
                                handleNoteChange(m.memberId, note);
                              }}
                              className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                currentRecord.note?.includes(`${mins} phút`)
                                  ? 'bg-amber-200 text-amber-900 border-amber-400 font-bold'
                                  : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {mins}p
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* BOTTOM SAVE BAR */}
        {!loadingMembers && !memberError && members.length > 0 && (
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold">{isEn ? 'Attendance progress:' : 'Tiến độ điểm danh:'}</span>
                <span className="font-extrabold text-slate-900">
                  {stats.total - stats.unmarked}/{stats.total} {isEn ? 'students' : 'học viên'}
                </span>
                {stats.unmarked === 0 ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    {isEn ? 'Complete' : 'Hoàn tất'}
                  </span>
                ) : (
                  <span className="text-amber-600 font-bold">
                    {isEn ? `(${stats.unmarked} unmarked)` : `(Còn ${stats.unmarked} chưa chọn)`}
                  </span>
                )}
              </div>
              <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${stats.total > 0 ? Math.round(((stats.total - stats.unmarked) / stats.total) * 100) : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={!canAttend || saving || stats.unmarked > 0}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-chivo font-black text-sm uppercase tracking-wider transition-all shadow-md shadow-red-600/20 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                    <span>{isEn ? 'Saving...' : 'Đang lưu...'}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">save</span>
                    <span>{isEn ? 'Save Attendance Records' : 'Lưu Kết Quả Điểm Danh'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
