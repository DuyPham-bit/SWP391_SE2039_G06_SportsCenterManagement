import React, { useState, useEffect, useMemo, useRef } from 'react';
import { coachApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { CoachError, CoachPeriod, coachInput, useTeachingSessions } from './CoachShared.js';
import { attendanceRestriction, canAttendSession, coachDate, sessionTime } from './coachOverview.js';

const ATTENDANCE_STATUSES = {
  PRESENT: {
    label: 'Có mặt',
    icon: 'check_circle',
    activeClass: 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30 font-bold',
    inactiveClass: 'bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border-slate-200',
    statClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500'
  },
  ABSENT: {
    label: 'Vắng mặt',
    icon: 'cancel',
    activeClass: 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-500/30 font-bold',
    inactiveClass: 'bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-700 border-slate-200',
    statClass: 'bg-rose-50 text-rose-800 border-rose-200',
    dotClass: 'bg-rose-500'
  },
  EXCUSED: {
    label: 'Vắng có phép',
    icon: 'event_available',
    activeClass: 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-500/30 font-bold',
    inactiveClass: 'bg-white hover:bg-sky-50 hover:text-sky-700 text-slate-700 border-slate-200',
    statClass: 'bg-sky-50 text-sky-800 border-sky-200',
    dotClass: 'bg-sky-500'
  }
};

const DAY_NAMES = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
const DAY_FULL_LABELS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

function getMondayOfDate(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getWeekDays(monday) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toIsoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDayMonth(d) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatFullDate(d) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function getSessionStatusInfo(session) {
  if (!session) return { label: 'Không xác định', color: 'slate' };
  if (session.status === 'CANCELLED') {
    return { label: 'Đã hủy', badge: 'bg-rose-100 text-rose-800 border-rose-300', dot: 'bg-rose-500', isCancelled: true };
  }
  const now = Date.now();
  const start = sessionTime(session, false);
  const end = sessionTime(session, true);

  if (now < start) {
    return { label: 'Chưa tới giờ', badge: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500', isUpcoming: true };
  }
  if (now >= start && now <= end) {
    return { label: 'Đang diễn ra', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500 animate-pulse', isHappening: true };
  }
  return { label: 'Đã kết thúc', badge: 'bg-slate-100 text-slate-800 border-slate-300', dot: 'bg-slate-400', isEnded: true };
}

function getAttendanceRestrictionInfo(session) {
  const restriction = attendanceRestriction(session);
  if (restriction === 'PAST_DATE') {
    return {
      title: 'Buổi học đã qua ngày nên không thể sửa điểm danh.',
      description: 'Kết quả điểm danh chỉ được cập nhật trong đúng ngày diễn ra buổi học.'
    };
  }
  if (restriction === 'CANCELLED') {
    return {
      title: 'Buổi học này đã bị hủy. Hệ thống không cho phép thực hiện điểm danh.',
      description: 'Vui lòng liên hệ bộ phận quản lý nếu cần khôi phục buổi học.'
    };
  }
  return {
    title: 'Buổi học chưa đến giờ bắt đầu.',
    description: `Buổi học diễn ra lúc ${session?.timeSlot || ''} ngày ${session?.sessionDate || ''}. Huấn luyện viên có thể xem trước danh sách học viên; chức năng lưu điểm danh sẽ mở khi ca học bắt đầu.`
  };
}

export function Attendance() {
  const { showSuccess, showError } = useToast();
  const workbenchRef = useRef(null);

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
  const initialDate = initialParams.date ? new Date(initialParams.date + 'T12:00:00') : new Date();

  // Schedule data hook: generous window (60 days) to allow smooth week navigation
  const schedule = useTeachingSessions(60);

  // Navigation states
  const [currentMonday, setCurrentMonday] = useState(() => getMondayOfDate(initialDate));
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' | 'daily' | 'list'
  const [selectedDayTab, setSelectedDayTab] = useState('ALL'); // 'ALL' or 'Thứ 2', etc.
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
  const todayIso = toIsoDate(new Date());

  // Determine the active session
  const activeSession = useMemo(() => {
    if (!schedule.sessions.length) return null;
    if (selectedId) {
      const found = schedule.sessions.find(s => s.id === Number(selectedId));
      if (found) return found;
    }
    // Default to the first session happening today or the first upcoming session
    const todaySession = schedule.sessions.find(s => s.sessionDate === todayIso);
    return todaySession || schedule.sessions[0];
  }, [schedule.sessions, selectedId, todayIso]);

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
      next.setDate(next.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setCurrentMonday(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };

  const handleThisWeek = () => {
    const monday = getMondayOfDate(new Date());
    setCurrentMonday(monday);
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
    showSuccess(`Đã đánh dấu tất cả ${members.length} học viên Có mặt. Vui lòng kiểm tra lại trước khi lưu.`);
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
      showError(getAttendanceRestrictionInfo(activeSession).title);
      return;
    }
    if (saving) return;

    const payload = Object.values(records);
    if (!payload.length) {
      showError('Buổi học chưa có học viên đăng ký.');
      return;
    }

    const unmarked = payload.filter(r => !r.status);
    if (unmarked.length > 0) {
      showError(`Còn ${unmarked.length} học viên chưa được chọn trạng thái. Vui lòng chọn trạng thái cho tất cả học viên trước khi lưu.`);
      return;
    }

    setSaving(true);
    try {
      await coachApi.takeAttendance(activeSession.id, null, null, null, payload);
      showSuccess(`Đã lưu kết quả điểm danh cho lớp ${activeSession.name} (${activeSession.timeSlot})!`);
      setVersion(v => v + 1);
    } catch (e) {
      showError(e.message || 'Lỗi khi lưu điểm danh.');
    } finally {
      setSaving(false);
    }
  };

  // Filtered sessions for the schedule
  const availableSports = useMemo(() => {
    const set = new Set(schedule.sessions.map(s => s.sportName).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [schedule.sessions]);

  const filteredSessions = useMemo(() => {
    return schedule.sessions.filter(s => {
      if (selectedSport !== 'ALL' && s.sportName !== selectedSport) return false;
      if (selectedDayTab !== 'ALL' && s.dayOfWeek !== selectedDayTab) return false;

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
  }, [schedule.sessions, selectedSport, selectedDayTab, readinessFilter]);

  // Group sessions by ISO date string for quick weekly calendar lookup
  const sessionsByDate = useMemo(() => {
    const map = {};
    weekDays.forEach(d => {
      map[toIsoDate(d)] = [];
    });
    filteredSessions.forEach(s => {
      if (map[s.sessionDate]) {
        map[s.sessionDate].push(s);
      }
    });
    // Sort each day's sessions by start time
    Object.keys(map).forEach(key => {
      map[key].sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
    });
    return map;
  }, [filteredSessions, weekDays]);

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
  const activeSessionStatusInfo = activeSession ? getSessionStatusInfo(activeSession) : null;
  const activeAttendanceRestriction = activeSession && !canAttend
    ? getAttendanceRestrictionInfo(activeSession)
    : null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600 text-2xl">event_available</span>
            <span className="text-xs font-bold uppercase tracking-wider text-red-600">
              COACH TEACHING SCHEDULE & ATTENDANCE
            </span>
          </div>
          <h1 className="font-chivo text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            Lịch Dạy & Điểm Danh Lớp Học
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Theo dõi thời khóa biểu ca dạy theo tuần, chọn buổi học để kiểm diện học viên và lưu kết quả chuyên cần.
          </p>
        </div>

        {/* Action button to toggle custom date range */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCustomPeriod(!showCustomPeriod)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-base">date_range</span>
            <span>{showCustomPeriod ? 'Ẩn bộ lọc ngày' : 'Tùy chỉnh khoảng ngày'}</span>
          </button>
          <button
            type="button"
            onClick={() => schedule.reload()}
            disabled={schedule.loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-base ${schedule.loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>Làm mới lịch</span>
          </button>
        </div>
      </div>

      {/* Optional custom period form */}
      {showCustomPeriod && (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <p className="text-xs font-bold text-slate-700 mb-2">Chọn khoảng thời gian tải dữ liệu lịch giảng dạy:</p>
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
                title="Tuần trước"
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
                <span>Tuần này</span>
              </button>
              <button
                type="button"
                onClick={handleNextWeek}
                title="Tuần sau"
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
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'weekly'
                    ? 'bg-white text-red-600 shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-sm">calendar_view_week</span>
                <span>Lịch tuần</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('daily')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'daily'
                    ? 'bg-white text-red-600 shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-sm">view_day</span>
                <span>Theo ngày</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-red-600 shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-sm">format_list_bulleted</span>
                <span>Danh sách ca</span>
              </button>
            </div>

            {/* Sport Filter */}
            {availableSports.length > 2 && (
              <select
                aria-label="Lọc theo môn"
                value={selectedSport}
                onChange={e => setSelectedSport(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-red-600 focus:outline-none"
              >
                <option value="ALL">Tất cả môn</option>
                {availableSports.filter(s => s !== 'ALL').map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            )}

            {/* Readiness Filter */}
            <select
              aria-label="Lọc theo trạng thái điểm danh"
              value={readinessFilter}
              onChange={e => setReadinessFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-red-600 focus:outline-none"
            >
              <option value="ALL">Tất cả ca</option>
              <option value="READY">⚡ Sẵn sàng điểm danh</option>
              <option value="UPCOMING">⏳ Sắp diễn ra</option>
              <option value="CANCELLED">✕ Đã hủy</option>
            </select>
          </div>
        </div>

        {/* Day Tabs (For Daily view or quick day filter) */}
        {viewMode === 'daily' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => setSelectedDayTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedDayTab === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Tất cả các ngày
            </button>
            {weekDays.map((d, index) => {
              const dayName = DAY_NAMES[index];
              const iso = toIsoDate(d);
              const isToday = iso === todayIso;
              const count = (sessionsByDate[iso] || []).length;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelectedDayTab(dayName)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                    selectedDayTab === dayName
                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                      : isToday
                        ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{DAY_FULL_LABELS[index]}</span>
                  <span className="opacity-75 font-normal">({formatDayMonth(d)})</span>
                  {count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      selectedDayTab === dayName ? 'bg-white text-red-600' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {count}
                    </span>
                  )}
                  {isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
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
            <p className="text-sm font-bold text-slate-700">Đang tải thời khóa biểu ca dạy...</p>
            <p className="text-xs text-slate-400 mt-1">Vui lòng chờ trong giây lát</p>
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
                            Hôm nay
                          </span>
                        )}
                        <span className={isToday ? 'text-white/80' : 'text-slate-500 font-semibold'}>
                          {daySessions.length} ca dạy
                        </span>
                      </div>
                    </div>

                    {/* Day Sessions List */}
                    <div className="p-2 space-y-2 flex-1 min-h-[160px]">
                      {daySessions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-6 text-center">
                          <span className="material-symbols-outlined text-2xl text-slate-300">event_busy</span>
                          <span className="text-[11px] mt-1">Không có ca</span>
                        </div>
                      ) : (
                        daySessions.map(s => {
                          const isSelected = activeSession?.id === s.id;
                          const statusInfo = getSessionStatusInfo(s);
                          const attendable = canAttendSession(s);

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
                                  : 'bg-white border-slate-200 hover:border-red-300 hover:shadow-sm'
                              }`}
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
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                  {s.sportName}
                                </span>
                                {attendable && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Điểm danh
                                  </span>
                                )}
                              </div>

                              {/* Class Name */}
                              <h2 className="text-xs font-black text-slate-900 leading-snug line-clamp-2">
                                {s.name}
                              </h2>

                              {/* Room & Capacity */}
                              <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 space-y-0.5">
                                <div className="flex items-center gap-1 truncate">
                                  <span className="material-symbols-outlined text-[13px] text-slate-400">stadium</span>
                                  <span className="truncate">{s.roomName}</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600 font-semibold">
                                  <span>Đã đặt:</span>
                                  <span className="text-slate-900 font-bold">{s.enrolledCount}/{s.capacity}</span>
                                </div>
                              </div>

                              {/* Action prompt */}
                              <div className={`mt-2 text-center py-1 rounded text-[10px] font-bold transition-colors ${
                                isSelected
                                  ? 'bg-red-600 text-white'
                                  : 'bg-slate-50 text-slate-600 group-hover:bg-red-50 group-hover:text-red-700'
                              }`}>
                                {isSelected ? 'Đang chọn điểm danh' : 'Chọn ca này'}
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

        {/* VIEW 2: DAILY / CARDS VIEW */}
        {!schedule.loading && (viewMode === 'daily' || viewMode === 'list') && (
          <div>
            {filteredSessions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                <span className="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
                <p className="text-sm font-bold text-slate-700 mt-2">Không tìm thấy ca dạy phù hợp bộ lọc.</p>
                <p className="text-xs text-slate-500 mt-1">Thử thay đổi bộ môn hoặc chọn tuần khác.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSessions.map(s => {
                  const isSelected = activeSession?.id === s.id;
                  const statusInfo = getSessionStatusInfo(s);
                  const attendable = canAttendSession(s);

                  return (
                    <article
                      key={s.id}
                      onClick={() => handleSelectSession(s)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-white border-red-600 ring-2 ring-red-600/30 shadow-md'
                          : 'bg-white border-slate-200 hover:border-red-300 hover:shadow-sm'
                      }`}
                    >
                      <div>
                        {/* Header Badges */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                            {s.sportName}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${statusInfo.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                            {statusInfo.label}
                          </span>
                        </div>

                        {/* Class Name */}
                        <h2 className="font-chivo text-base font-black text-slate-900 leading-tight">
                          {s.name}
                        </h2>

                        {/* Session Date & Time */}
                        <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-700">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-base text-red-600">calendar_month</span>
                            <span className="font-bold">{s.dayOfWeek}, {formatFullDate(new Date(s.sessionDate + 'T12:00:00'))}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-base text-slate-400">schedule</span>
                            <span className="font-bold">{s.timeSlot}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-base text-slate-400">stadium</span>
                            <span>{s.roomName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Sĩ số ca</span>
                          <span className="font-chivo text-sm font-extrabold text-slate-900">
                            {s.enrolledCount}/{s.capacity} học viên
                          </span>
                        </div>

                        <button
                          type="button"
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-red-600 text-white shadow-sm'
                              : 'bg-slate-900 hover:bg-red-600 text-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">fact_check</span>
                          <span>{isSelected ? 'Đang điểm danh' : 'Điểm danh ca này'}</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
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
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 md:p-6 rounded-2xl relative overflow-hidden shadow-md">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center flex-wrap gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">
                    {activeSession.sportName}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
                    Phòng: {activeSession.roomName}
                  </span>
                  {activeSessionStatusInfo && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${activeSessionStatusInfo.dot}`}></span>
                      {activeSessionStatusInfo.label}
                    </span>
                  )}
                </div>

                <h2 className="font-chivo text-xl md:text-2xl font-black tracking-tight text-white">
                  {activeSession.name}
                </h2>

                <p className="text-slate-300 text-xs md:text-sm mt-1 flex items-center flex-wrap gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-red-400">calendar_month</span>
                    <strong>{activeSession.dayOfWeek}, {formatFullDate(new Date(activeSession.sessionDate + 'T12:00:00'))}</strong>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-red-400">schedule</span>
                    <strong>{activeSession.timeSlot}</strong>
                  </span>
                  <span>·</span>
                  <span>Sĩ số đăng ký: <strong>{activeSession.enrolledCount}/{activeSession.capacity} học viên</strong></span>
                </p>
              </div>

              {/* Quick Session Switcher Dropdown */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-[260px]">
                <div className="bg-white/10 p-2.5 rounded-xl border border-white/15 text-xs text-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Đổi ca dạy khác:</span>
                  <select
                    aria-label="Đổi ca dạy nhanh"
                    value={activeSession.id}
                    onChange={e => {
                      const found = schedule.sessions.find(s => s.id === Number(e.target.value));
                      if (found) handleSelectSession(found, false);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    {schedule.sessions.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {s.sessionDate} · {s.timeSlot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
            Chưa có ca dạy nào được chọn. Vui lòng chọn một ca từ lịch thời khóa biểu ở trên.
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
                <span className="text-[11px] font-bold text-slate-500 block">Tổng học viên</span>
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
                <span className="text-[11px] font-bold block">Chưa đánh dấu</span>
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
                  placeholder="Tìm học viên theo tên, mã HV, SĐT..."
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
                  title="Đánh dấu tất cả học viên thành Có mặt"
                >
                  <span className="material-symbols-outlined text-base">done_all</span>
                  <span>Tất cả Có mặt</span>
                </button>

                <button
                  type="button"
                  disabled={!canAttend || saving || members.length === 0}
                  onClick={handleResetRecords}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">restart_alt</span>
                  <span>Đặt lại</span>
                </button>
              </div>
            </div>

            {/* Status Filter Tabs for Roster */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
              <span className="text-slate-400 text-[11px] uppercase tracking-wider mr-1">Lọc:</span>
              <button
                type="button"
                onClick={() => setFilterRosterStatus('ALL')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterRosterStatus === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({members.length})
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
                Có mặt ({stats.present})
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
                Vắng ({stats.absent})
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
                Có phép ({stats.excused})
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
                Chưa đánh dấu ({stats.unmarked})
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
            <p className="text-sm font-bold text-slate-700">Đang tải danh sách học viên điểm danh...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loadingMembers && !memberError && activeSession && members.length === 0 && (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <span className="material-symbols-outlined text-4xl text-slate-300">group_off</span>
            <p className="text-sm font-bold text-slate-700 mt-2">Chưa có học viên đặt chỗ cho buổi học này.</p>
            <p className="text-xs text-slate-500 mt-1">Khi học viên đặt chỗ tham gia lớp, danh sách sẽ hiển thị tại đây.</p>
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
                          {m.phone || 'Chưa có SĐT'} {m.email ? `· ${m.email}` : ''}
                        </p>
                        {(m.fitnessGoal || m.fitnessLevel) && (
                          <p className="text-[11px] text-red-600 font-semibold mt-0.5">
                            Mục tiêu: {m.fitnessGoal || m.fitnessLevel}
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
                          placeholder="Ghi chú (VD: Đến muộn 5 phút, tập tốt...)"
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
                          title="Đánh dấu Có mặt và ghi chú Đến muộn"
                        >
                          <span className="material-symbols-outlined text-[13px]">schedule</span>
                          <span>+ Muộn</span>
                        </button>
                      </div>

                      {/* Quick late minute chips if note has Đến muộn */}
                      {currentRecord.note?.includes('Đến muộn') && (
                        <div className="flex items-center gap-1 text-[10px] pl-1 animate-fadeIn">
                          <span className="text-slate-400 font-semibold">Thời gian:</span>
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
                <span className="font-bold">Tiến độ điểm danh:</span>
                <span className="font-extrabold text-slate-900">
                  {stats.total - stats.unmarked}/{stats.total} học viên
                </span>
                {stats.unmarked === 0 ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Hoàn tất
                  </span>
                ) : (
                  <span className="text-amber-600 font-bold">
                    (Còn {stats.unmarked} chưa chọn)
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
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">save</span>
                    <span>Lưu Kết Quả Điểm Danh</span>
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
