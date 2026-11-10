import { useRef, useMemo, useState, useEffect } from 'react';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { getAttendanceStatuses, getAttendanceRestrictionInfo, getSessionStatusInfo } from '../lib/attendanceStatus.js';
import { DAY_NAMES_EN, DAY_NAMES_VI, DAY_FULL_LABELS_EN, DAY_FULL_LABELS_VI, getMondayOfDate, getWeekDays, toIsoDate, formatFullDate } from '../lib/attendanceCalendar.js';
import { parseCalendarDate } from '../../../shared/lib/dateTime.js';
import { useTeachingSessions } from '../../../features/coach-workspace/index.js';
import { coachApi, canAttendSession, sessionTime } from '../../../entities/coach/index.js';

export function useAttendance() {
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
  // Attendance is an operational screen: cancelled classes/sessions must not
  // remain selectable even though other coach reports may include history.
  const schedule = useTeachingSessions(60, null, false);

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

  return {
    ATTENDANCE_STATUSES, DAY_FULL_LABELS, activeAttendanceRestriction, activeSession,
    activeSessionStatusInfo, availableSports, canAttend, filterRosterStatus, filteredMembers,
    filteredSessions, handleMarkAllPresent, handleNextWeek, handleNoteChange, handlePrevWeek,
    handleResetRecords, handleSaveAttendance, handleSelectSession, handleStatusChange,
    handleThisWeek, handleToggleLateNote, isEn, loadingMembers, memberError, members,
    readinessFilter, records, saving, schedule, searchMember, selectedDateIso, selectedDayInfo,
    selectedSport, sessionsByDate, setFilterRosterStatus, setReadinessFilter, setSearchMember,
    setSelectedDateIso, setSelectedSport, setShowCustomPeriod, setVersion, setViewMode,
    showCustomPeriod, stats, todayIso, viewMode, weekDays, weekStats, workbenchRef
  };
}
