import React, { useEffect, useState, useMemo } from 'react';
import { bookingApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useToast } from '../../context/ToastContext.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { Modal } from '../../components/common/Modal.js';
import {
  ATTENDANCE_LABELS,
  bookingStart,
  formatMemberDate,
  formatMemberDateTime,
  getSportTheme,
  DAY_LABELS,
  DAY_LABELS_EN,
  parseIsoDate,
  formatIsoDate,
  getMonday,
  getWeekDays
} from './memberOverview.js';
import {
  translateClassName,
  translateSportName,
  translateCoachName,
  translateRoomName
} from '../../services/i18nHelper.js';

export function MyAttendance() {
  const { currentUser } = useAuth();
  const { showError } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const DAY_LABELS_ACTIVE = isEn ? DAY_LABELS_EN : DAY_LABELS;

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  // Bộ lọc & Chế độ xem
  // statusFilter: 'ALL' | 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED' | 'PENDING'
  const [statusFilter, setStatusFilter] = useState('ALL');
  // viewMode: 'week' (Lịch Tuần) | 'grid' (Dạng thẻ) | 'table' (Dạng bảng)
  const [viewMode, setViewMode] = useState('week');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => formatIsoDate(new Date()));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Modal xem chi tiết buổi học & nhận xét HLV
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    bookingApi
      .getMemberBookings()
      .then(data => {
        if (active) setBookings(data || []);
      })
      .catch(err => {
        if (active) {
          setError(err.message || (isEn ? 'Failed to load attendance history.' : 'Không thể tải lịch sử điểm danh.'));
          showError(err);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentUser?.id, reload, isEn]);

  // Lọc tất cả các buổi đã diễn ra hoặc đã có trạng thái điểm danh
  const history = useMemo(() => {
    const now = Date.now();
    return (bookings || [])
      .filter(b => {
        const hasAttendance = Boolean(b.attendanceStatus);
        const isPastConfirmed =
          b.status === 'CONFIRMED' &&
          b.sessionStatus !== 'CANCELLED' &&
          bookingStart(b) <= now;
        return hasAttendance || isPastConfirmed;
      })
      .sort((a, b) => (bookingStart(b) || 0) - (bookingStart(a) || 0));
  }, [bookings]);

  // Thống kê nhanh KPI
  const stats = useMemo(() => {
    const total = history.length;
    const present = history.filter(b => b.attendanceStatus === 'PRESENT').length;
    const late = history.filter(b => b.attendanceStatus === 'LATE').length;
    const absent = history.filter(b => b.attendanceStatus === 'ABSENT').length;
    const excused = history.filter(b => b.attendanceStatus === 'EXCUSED').length;
    const pending = history.filter(b => !b.attendanceStatus || b.attendanceStatus === 'PENDING').length;

    // Tỷ lệ chuyên cần Olympic = (Có mặt + Đi muộn) / Tổng số ca đã ghi nhận điểm danh
    const evaluatedTotal = present + late + absent;
    const disciplineRate =
      evaluatedTotal > 0 ? Math.round(((present + late) / evaluatedTotal) * 100) : 100;

    return { total, present, late, absent, excused, pending, disciplineRate };
  }, [history]);

  // Danh mục môn thể thao duy nhất trong lịch sử
  const availableSports = useMemo(() => {
    const set = new Set();
    history.forEach(b => {
      const theme = getSportTheme(b.sportName, b.className, isEn);
      set.add(theme.tag);
    });
    return Array.from(set);
  }, [history, isEn]);

  // Kiểm tra dải ngày hợp lệ
  const invalidRange = fromDate && toDate && fromDate > toDate;

  // Lọc dữ liệu hiển thị
  const filteredRecords = useMemo(() => {
    if (invalidRange) return [];

    return history.filter(b => {
      const currentStatus = b.attendanceStatus || 'PENDING';

      // 1. Lọc theo trạng thái
      if (statusFilter !== 'ALL' && currentStatus !== statusFilter) {
        return false;
      }

      // 2. Lọc dải ngày
      if (fromDate && b.bookingDate < fromDate) return false;
      if (toDate && b.bookingDate > toDate) return false;

      // 3. Lọc theo môn thể thao
      if (selectedSport !== 'ALL') {
        const theme = getSportTheme(b.sportName, b.className, isEn);
        if (theme.tag !== selectedSport) return false;
      }

      // 4. Tìm kiếm từ khóa
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = b.className?.toLowerCase().includes(q) || translateClassName(b.className, isEn).toLowerCase().includes(q);
        const matchCoach = b.coachName?.toLowerCase().includes(q) || translateCoachName(b.coachName, isEn).toLowerCase().includes(q);
        const matchRoom = b.roomName?.toLowerCase().includes(q) || translateRoomName(b.roomName, isEn).toLowerCase().includes(q);
        const matchNote = b.attendanceNote?.toLowerCase().includes(q);
        if (!matchName && !matchCoach && !matchRoom && !matchNote) return false;
      }

      return true;
    });
  }, [history, statusFilter, fromDate, toDate, selectedSport, searchQuery, invalidRange, isEn]);

  // Tiện ích lịch tuần chuẩn Olympic
  const todayStr = useMemo(() => formatIsoDate(new Date()), []);
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const periodTitle = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    return isEn
      ? `Week: ${start.getDate()} M${start.getMonth() + 1} - ${end.getDate()} M${end.getMonth() + 1}, ${end.getFullYear()}`
      : `Tuần: ${start.getDate()} Th${start.getMonth() + 1} - ${end.getDate()} Th${end.getMonth() + 1}, ${end.getFullYear()}`;
  }, [weekDays, isEn]);

  const handlePrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedCalendarDate(formatIsoDate(now));
  };

  // Gom nhóm nhật ký điểm danh theo ngày YYYY-MM-DD
  const recordsByDate = useMemo(() => {
    const map = new Map();
    filteredRecords.forEach(b => {
      const d = String(b.bookingDate || b.sessionDate || '').slice(0, 10);
      if (!d) return;
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(b);
    });
    map.forEach(list => {
      list.sort((a, b) => (bookingStart(a) || 0) - (bookingStart(b) || 0));
    });
    return map;
  }, [filteredRecords]);

  // Render Badge trạng thái chuyên cần với màu sắc nhận diện cao
  const renderAttendanceBadge = (status) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="material-symbols-outlined text-[15px]">check_circle</span>
            <span>{isEn ? 'Present' : 'Có mặt'}</span>
          </span>
        );
      case 'LATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-amber-100 text-amber-800 border border-amber-200">
            <span className="material-symbols-outlined text-[15px]">schedule</span>
            <span>{isEn ? 'Late' : 'Đi muộn'}</span>
          </span>
        );
      case 'ABSENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-rose-100 text-rose-800 border border-rose-200">
            <span className="material-symbols-outlined text-[15px]">cancel</span>
            <span>{isEn ? 'Absent' : 'Vắng mặt'}</span>
          </span>
        );
      case 'EXCUSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-blue-100 text-blue-800 border border-blue-200">
            <span className="material-symbols-outlined text-[15px]">event_available</span>
            <span>{isEn ? 'Excused' : 'Vắng có phép'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-slate-100 text-slate-700 border border-slate-200">
            <span className="material-symbols-outlined text-[15px]">pending</span>
            <span>{isEn ? 'Pending' : 'Chưa điểm danh'}</span>
          </span>
        );
    }
  };

  if (loading) {
    return <LoadingSpinner text={isEn ? "Syncing Olympic attendance records & discipline rate..." : "Đang đồng bộ hồ sơ điểm danh & đánh giá chuyên cần Olympic..."} />;
  }

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* 1. Header & Title (Đồng bộ chuẩn Olympic Schedule) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-chivo text-xs font-black uppercase tracking-widest text-[#2D6A4F] dark:text-[#81B29A] bg-[#81B29A]/15 px-2.5 py-0.5 rounded-md border border-[#81B29A]/30">
              OLYMPIC DISCIPLINE RECORD
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-wide">
              {isEn ? `Discipline: ${stats.disciplineRate}%` : `Chuyên cần: ${stats.disciplineRate}%`}
            </span>
          </div>
          <h1 className="font-chivo text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {isEn ? 'Attendance History & Discipline' : 'Lịch Sử Điểm Danh & Chuyên Cần'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl">
            {isEn
              ? 'Track class session logs, actual check-in timestamps, coach notes, and technique assessments from the assigned coach.'
              : 'Theo dõi nhật ký tham gia từng ca học, thời gian check-in thực tế, ghi chú chuyên môn và đánh giá kỹ thuật rèn luyện từ Huấn luyện viên phụ trách.'}
          </p>
        </div>

        {/* Action Buttons: Tải lại, Xem tiến trình, Đặt thêm lớp */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setReload(val => val + 1)}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center shrink-0 shadow-xs disabled:opacity-50"
            title={isEn ? "Reload attendance logs" : "Tải lại nhật ký điểm danh"}
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>

          <a
            href="#/member/progress"
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-xs shrink-0"
          >
            <span className="material-symbols-outlined text-[18px] text-[#81B29A]">trending_up</span>
            <span>{isEn ? 'Progress & Coach Feedback' : 'Tiến Trình & Nhận Xét HLV'}</span>
          </a>

          <a
            href="#/member/schedule"
            className="px-4 py-2.5 bg-[#1E2235] hover:bg-[#2B2D42] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm hover-lift shrink-0"
          >
            <span className="material-symbols-outlined text-[18px] text-[#F2CC8F]">calendar_month</span>
            <span>{isEn ? 'Class Schedule' : 'Lịch Mở Lớp'}</span>
          </a>
        </div>
      </div>

      {/* 2. KPI Summary Strip (Đồng bộ chuẩn 4 thẻ tương tác) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Có mặt */}
        <div
          onClick={() => setStatusFilter(f => (f === 'PRESENT' ? 'ALL' : 'PRESENT'))}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
            statusFilter === 'PRESENT'
              ? 'bg-emerald-50 border-emerald-400 shadow-sm ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">check_circle</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">{isEn ? 'On Time' : 'Có mặt đúng giờ'}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-chivo text-lg font-black text-emerald-800">{stats.present}</span>
              <span className="text-[10px] font-bold text-slate-400">{isEn ? 'sess' : 'ca'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Đi muộn */}
        <div
          onClick={() => setStatusFilter(f => (f === 'LATE' ? 'ALL' : 'LATE'))}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
            statusFilter === 'LATE'
              ? 'bg-amber-50 border-amber-400 shadow-sm ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">schedule</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">{isEn ? 'Late' : 'Đi muộn'}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-chivo text-lg font-black text-amber-800">{stats.late}</span>
              <span className="text-[10px] font-bold text-slate-400">{isEn ? 'sess' : 'ca'}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Vắng mặt */}
        <div
          onClick={() => setStatusFilter(f => (f === 'ABSENT' ? 'ALL' : 'ABSENT'))}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
            statusFilter === 'ABSENT'
              ? 'bg-rose-50 border-rose-400 shadow-sm ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">cancel</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">{isEn ? 'Absent' : 'Vắng mặt'}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-chivo text-lg font-black text-rose-800">{stats.absent}</span>
              <span className="text-[10px] font-bold text-slate-400">{isEn ? 'sess' : 'ca'}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Vắng có phép */}
        <div
          onClick={() => setStatusFilter(f => (f === 'EXCUSED' ? 'ALL' : 'EXCUSED'))}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
            statusFilter === 'EXCUSED'
              ? 'bg-blue-50 border-blue-400 shadow-sm ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">event_available</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">{isEn ? 'Excused' : 'Vắng có phép'}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-chivo text-lg font-black text-blue-900">{stats.excused}</span>
              <span className="text-[10px] font-bold text-slate-400">{isEn ? 'sess' : 'ca'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Control Bar & Filter Toolbar (Đồng bộ chuẩn ClassScheduleView) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Row 1: Segmented Tabs Trạng Thái & View Mode Switcher */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0 overflow-x-auto">
            {[
              { id: 'ALL', label: isEn ? 'All' : 'Tất Cả', icon: 'list', count: stats.total },
              { id: 'PRESENT', label: isEn ? 'Present' : 'Có Mặt', icon: 'check_circle', count: stats.present },
              { id: 'LATE', label: isEn ? 'Late' : 'Đi Muộn', icon: 'schedule', count: stats.late },
              { id: 'ABSENT', label: isEn ? 'Absent' : 'Vắng Mặt', icon: 'cancel', count: stats.absent },
              { id: 'EXCUSED', label: isEn ? 'Excused' : 'Có Phép', icon: 'event_available', count: stats.excused }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    statusFilter === tab.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Segmented Control View Mode: Lịch Tuần | Dạng Thẻ | Dạng Bảng */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo flex items-center gap-1.5 transition-all ${
                viewMode === 'week'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">calendar_view_week</span>
              <span>{isEn ? 'Week Timetable' : 'Lịch Tuần'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
              <span>{isEn ? 'Cards' : 'Dạng Thẻ'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">table_rows</span>
              <span>{isEn ? 'Table' : 'Dạng Bảng'}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Thanh điều hướng tuần khi ở chế độ Lịch Tuần */}
        {viewMode === 'week' && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-1 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToday}
                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-2xs"
              >
                {isEn ? 'Today' : 'Hôm Nay'}
              </button>
              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                <button
                  type="button"
                  onClick={handlePrevWeek}
                  title={isEn ? "Previous week" : "Lùi tuần trước"}
                  className="p-1.5 hover:bg-slate-100 text-slate-700 transition-colors border-r border-slate-200"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextWeek}
                  title={isEn ? "Next week" : "Tiến tuần sau"}
                  className="p-1.5 hover:bg-slate-100 text-slate-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
              <span className="font-chivo text-sm md:text-base font-black text-slate-900 pl-1 tracking-tight">
                {periodTitle}
              </span>
            </div>

            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              {isEn
                ? 'Click on any class session to view coach feedback and check-in details'
                : 'Nhấp vào từng ca học trên lịch để xem nhận xét HLV và chi tiết quét thẻ'}
            </span>
          </div>
        )}

        {/* Row 3: Bộ lọc nâng cao (Tìm kiếm, Môn thể thao, Từ ngày - Đến ngày) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Search Input */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder={isEn ? "Search class, coach, court, note..." : "Tìm lớp, HLV, sân, ghi chú..."}
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

          {/* Sport Filter */}
          <div>
            <select
              value={selectedSport}
              onChange={e => setSelectedSport(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 bg-white font-medium"
            >
              <option value="ALL">{isEn ? '🏅 All Sports' : '🏅 Tất cả bộ môn thể thao'}</option>
              {availableSports.map(sport => (
                <option key={sport} value={sport}>
                  {translateSportName(sport, isEn)}
                </option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div>
            <input
              type="date"
              placeholder={isEn ? "From date" : "Từ ngày"}
              value={fromDate}
              onChange={e => {
                setFromDate(e.target.value);
                if (e.target.value) {
                  setCurrentDate(parseIsoDate(e.target.value));
                  setSelectedCalendarDate(e.target.value);
                }
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 bg-white font-medium"
            />
          </div>

          {/* To Date & Clear */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              placeholder={isEn ? "To date" : "Đến ngày"}
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 bg-white font-medium"
            />
            {(fromDate || toDate || searchQuery || selectedSport !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                  setSearchQuery('');
                  setSelectedSport('ALL');
                }}
                title={isEn ? "Clear filters" : "Xóa bộ lọc"}
                className="px-2.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 font-bold shrink-0"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Cảnh báo dải ngày không hợp lệ */}
        {invalidRange && (
          <div role="alert" className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-bold border border-red-200 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">warning</span>
            <span>{isEn ? 'Start date ("From date") must be before or equal to End date ("To date").' : 'Ngày bắt đầu ("Từ ngày") phải trước hoặc bằng ngày kết thúc ("Đến ngày").'}</span>
          </div>
        )}
      </div>

      {/* Error Alert nếu có lỗi tải */}
      {error && (
        <div role="alert" className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center justify-between border border-red-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600">error</span>
            <span className="text-xs font-bold">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setReload(v => v + 1)}
            className="text-xs font-black underline uppercase"
          >
            {isEn ? 'Retry' : 'Thử lại'}
          </button>
        </div>
      )}

      {/* 4. DANH SÁCH BẢN GHI ĐIỂM DANH */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-chivo text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>{isEn ? 'Session Attendance Records' : 'Nhật Ký Điểm Danh Từng Ca'}</span>
            <span className="text-xs font-bold text-slate-400">({filteredRecords.length} {isEn ? 'sessions' : 'ca tập'})</span>
          </h2>
        </div>

        {viewMode === 'week' ? (
          /* DẠNG LỊCH TUẦN (WEEK TIMETABLE VIEW - Chuẩn Olympic theo ảnh mẫu) */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Cột tiêu đề các ngày trong tuần */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 divide-x divide-slate-200 text-center">
              {weekDays.map(day => {
                const dayStr = formatIsoDate(day);
                const isToday = dayStr === todayStr;
                const isSelected = dayStr === selectedCalendarDate;
                const dayRecords = recordsByDate.get(dayStr) || [];

                return (
                  <div
                    key={dayStr}
                    onClick={() => setSelectedCalendarDate(dayStr)}
                    className={`py-3 px-1 transition-colors cursor-pointer ${
                      isSelected ? 'bg-red-50/60' : 'hover:bg-slate-100/60'
                    }`}
                  >
                    <span className="text-[11px] font-bold uppercase text-slate-500 block">
                      {DAY_LABELS_ACTIVE[day.getDay()]}
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
                    {dayRecords.length > 0 ? (
                      <span className="inline-block mt-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700">
                        {dayRecords.length} {isEn ? 'sess' : 'ca'}
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
                const dayRecords = recordsByDate.get(dayStr) || [];
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
                      <span>{DAY_LABELS_ACTIVE[day.getDay()]} ({dayStr})</span>
                      <span className="text-slate-500">{dayRecords.length} {isEn ? 'sess' : 'ca'}</span>
                    </div>

                    {dayRecords.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        <span className="material-symbols-outlined text-2xl text-slate-300 block mb-1">
                          event_busy
                        </span>
                        <span>{isEn ? 'No sessions' : 'Không có ca'}</span>
                      </div>
                    ) : (
                      dayRecords.map(b => {
                        const theme = getSportTheme(b.sportName, b.className, isEn);
                        const attendanceStatus = b.attendanceStatus || 'PENDING';

                        return (
                          <div
                            key={b.id}
                            onClick={() => {
                              setSelectedRecord(b);
                              setDetailModalOpen(true);
                            }}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 space-y-2 ${theme.bg} ${theme.border} shadow-xs`}
                          >
                            {/* Time & Sport Tag */}
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-[11px] text-slate-900 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px] text-red-600">schedule</span>
                                <span>{b.timeSlot}</span>
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${theme.badge}`}>
                                {theme.tag || translateSportName(b.sportName, isEn)}
                              </span>
                            </div>

                            {/* Class Name */}
                            <h4 className="font-chivo font-black text-slate-900 leading-snug line-clamp-2">
                              {translateClassName(b.className, isEn)}
                            </h4>

                            {/* Coach & Room Info */}
                            <div className="text-[11px] text-slate-600 space-y-0.5">
                              <div className="truncate">{isEn ? 'Coach' : 'HLV'}: <strong>{translateCoachName(b.coachName, isEn)}</strong></div>
                              <div className="truncate text-slate-500">{translateRoomName(b.roomName, isEn)}</div>
                            </div>

                            {/* Footer: Mã vé & Attendance Status Badge */}
                            <div className="pt-1.5 border-t border-black/5 flex items-center justify-between">
                              <div className="text-[10px] font-mono font-bold text-slate-500">
                                #{b.id}
                              </div>

                              {attendanceStatus === 'PRESENT' ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                                  <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                  <span>{isEn ? 'PRESENT' : 'CÓ MẶT'}</span>
                                </span>
                              ) : attendanceStatus === 'LATE' ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                                  <span className="material-symbols-outlined text-[12px]">schedule</span>
                                  <span>{isEn ? 'LATE' : 'ĐI MUỘN'}</span>
                                </span>
                              ) : attendanceStatus === 'ABSENT' ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-black uppercase text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300">
                                  <span className="material-symbols-outlined text-[12px]">cancel</span>
                                  <span>{isEn ? 'ABSENT' : 'VẮNG MẶT'}</span>
                                </span>
                              ) : attendanceStatus === 'EXCUSED' ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-black uppercase text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-300">
                                  <span className="material-symbols-outlined text-[12px]">event_available</span>
                                  <span>{isEn ? 'EXCUSED' : 'CÓ PHÉP'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-black uppercase text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300">
                                  <span className="material-symbols-outlined text-[12px]">pending</span>
                                  <span>{isEn ? 'PENDING' : 'CHỜ ĐIỂM DANH'}</span>
                                </span>
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
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 max-w-xl mx-auto space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">fact_check</span>
            </div>
            <h3 className="font-chivo text-base font-bold text-slate-900">
              {searchQuery || selectedSport !== 'ALL' || fromDate || toDate
                ? (isEn ? 'No Records Match Your Filters' : 'Không Tìm Thấy Bản Ghi Phù Hợp Bộ Lọc')
                : (isEn ? 'No Attendance Records Yet' : 'Chưa Có Bản Ghi Điểm Danh Nào')}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || selectedSport !== 'ALL' || fromDate || toDate
                ? (isEn ? 'Please adjust or clear filters to view full history.' : 'Vui lòng thử điều chỉnh hoặc xóa các tiêu chí bộ lọc để xem lại đầy đủ lịch sử.')
                : (isEn ? 'Session logs will automatically appear here once attended and checked by your coach.' : 'Các ca tập sau khi diễn ra và được Huấn luyện viên điểm danh sẽ tự động lưu lại chi tiết tại đây.')}
            </p>
            <div>
              {searchQuery || selectedSport !== 'ALL' || fromDate || toDate ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSport('ALL');
                    setFromDate('');
                    setToDate('');
                    setStatusFilter('ALL');
                  }}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
                >
                  {isEn ? 'Clear All Filters' : 'Xóa Tất Cả Bộ Lọc'}
                </button>
              ) : (
                <a
                  href="#/member/schedule"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-colors inline-block"
                >
                  {isEn ? 'View Schedule & Book Class' : 'Xem Lịch & Đặt Ca Tập Mới'}
                </a>
              )}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* DẠNG THẺ (GRID VIEW) - Chuẩn màu sắc nhận diện Olympic & getSportTheme */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRecords.map(b => {
              const sportTheme = getSportTheme(b.sportName, b.className, isEn);
              const attendanceStatus = b.attendanceStatus || 'PENDING';

              return (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  {/* Dải màu nhận diện trên đầu thẻ theo bộ môn */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${sportTheme.dot}`}></div>

                  <div>
                    {/* Top Meta: Sport Tag, Booking Code & Attendance Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${sportTheme.badge}`}>
                          {sportTheme.tag}
                        </span>
                        <span className="font-mono text-xs text-slate-400 font-bold">
                          #{b.id}
                        </span>
                      </div>
                      {renderAttendanceBadge(attendanceStatus)}
                    </div>

                    {/* Class Name */}
                    <h3 className="font-chivo text-lg font-black text-slate-900 leading-snug">
                      {translateClassName(b.className, isEn)}
                    </h3>

                    {/* Info Details Box */}
                    <div className="mt-3 p-3.5 rounded-xl bg-slate-50/90 border border-slate-100 space-y-2 text-xs text-slate-700">
                      {/* Ngày & Giờ tập */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-red-600 text-[18px]">
                            calendar_month
                          </span>
                          <span className="font-bold text-slate-900">
                            {formatMemberDate(b.bookingDate, isEn)}
                          </span>
                          <span className="text-slate-600 font-semibold">({b.timeSlot})</span>
                        </div>
                      </div>

                      {/* Sân / Phòng tập */}
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-[18px]">
                          stadium
                        </span>
                        <span className="font-medium text-slate-700">{translateRoomName(b.roomName, isEn)}</span>
                      </div>

                      {/* Huấn luyện viên */}
                      <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-[18px]">
                          sports
                        </span>
                        <div>
                          <span className="font-medium">{isEn ? 'Coach: ' : 'HLV: '}</span>
                          <strong className="text-slate-900">{translateCoachName(b.coachName, isEn)}</strong>
                          {b.coachSpecialization && (
                            <span className="block text-[11px] text-slate-500">
                              {isEn ? 'Specialization' : 'Chuyên môn'}: {b.coachSpecialization}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Giờ Check-in thực tế */}
                      {b.checkInTime && (
                        <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2 text-[11px] text-emerald-800 font-bold">
                          <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                          <span>{isEn ? 'Check-in scan timestamp: ' : 'Giờ quét thẻ check-in: '}{formatMemberDateTime(b.checkInTime, isEn)}</span>
                        </div>
                      )}
                    </div>

                    {/* Nhận xét của Huấn Luyện Viên */}
                    <div className="mt-3 p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs">
                      <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px] uppercase tracking-wide mb-1">
                        <span className="material-symbols-outlined text-[15px] text-amber-700">chat</span>
                        <span>{isEn ? 'Assessment from coach:' : 'Đánh giá từ HLV phụ trách:'}</span>
                      </div>
                      <p className="text-slate-700 italic leading-relaxed whitespace-pre-wrap break-words pl-5">
                        {b.attendanceNote ? `"${b.attendanceNote}"` : (isEn ? 'No specific note for this session.' : 'Chưa có ghi chú riêng cho buổi này.')}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer: Xem chi tiết */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      {isEn ? 'Session: ' : 'Buổi học: '}{b.bookingDate}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecord(b);
                        setDetailModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold font-chivo uppercase tracking-wider transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[15px]">visibility</span>
                      <span>{isEn ? 'Details' : 'Chi Tiết'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* DẠNG BẢNG (TABLE VIEW) - Tối ưu cho hội viên tra cứu và đối soát */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-chivo font-black uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">{isEn ? 'Class Name' : 'Lớp Rèn Luyện'}</th>
                    <th className="py-3.5 px-4">{isEn ? 'Session Date' : 'Ngày Học'}</th>
                    <th className="py-3.5 px-4">{isEn ? 'Time Slot' : 'Khung Giờ'}</th>
                    <th className="py-3.5 px-4">{isEn ? 'Room / Court' : 'Phòng Tập'}</th>
                    <th className="py-3.5 px-4">{isEn ? 'Coach' : 'Huấn Luyện Viên'}</th>
                    <th className="py-3.5 px-4">{isEn ? 'Status' : 'Trạng Thái'}</th>
                    <th className="py-3.5 px-4">{isEn ? 'Check-in Time' : 'Giờ Quét Thẻ'}</th>
                    <th className="py-3.5 px-4">{isEn ? 'Coach Note' : 'Ghi Chú HLV'}</th>
                    <th className="py-3.5 px-4 text-right">{isEn ? 'View' : 'Xem'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRecords.map(b => {
                    const sportTheme = getSportTheme(b.sportName, b.className, isEn);
                    const attendanceStatus = b.attendanceStatus || 'PENDING';

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 font-chivo">{translateClassName(b.className, isEn)}</div>
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wide border mt-0.5 ${sportTheme.badge}`}>
                            {sportTheme.tag}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {formatMemberDate(b.bookingDate, isEn)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                          {b.timeSlot}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{translateRoomName(b.roomName, isEn)}</td>
                        <td className="py-3.5 px-4 text-slate-800 font-medium">{translateCoachName(b.coachName, isEn)}</td>
                        <td className="py-3.5 px-4">{renderAttendanceBadge(attendanceStatus)}</td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                          {b.checkInTime ? formatMemberDateTime(b.checkInTime, isEn) : '—'}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 italic">
                          {b.attendanceNote || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecord(b);
                              setDetailModalOpen(true);
                            }}
                            className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                            title={isEn ? "View details" : "Xem chi tiết"}
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 5. Modal Xem Chi Tiết Bản Ghi Điểm Danh */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={isEn ? "Attendance Details & Coach Assessment" : "Chi Tiết Điểm Danh & Nhận Xét Chuyên Môn"}
      >
        {selectedRecord && (
          <div className="space-y-4">
            {/* Header thông tin lớp */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-400 font-bold">
                  {isEn ? 'Ticket ID: ' : 'Mã vé: '}#{selectedRecord.id}
                </span>
                {renderAttendanceBadge(selectedRecord.attendanceStatus || 'PENDING')}
              </div>
              <h3 className="font-chivo text-lg font-black text-slate-900">
                {translateClassName(selectedRecord.className, isEn)}
              </h3>
            </div>

            {/* Chi tiết ca học */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block font-medium">{isEn ? 'Session Date' : 'Ngày rèn luyện'}</span>
                <span className="font-bold text-slate-900">
                  {formatMemberDate(selectedRecord.bookingDate, isEn)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">{isEn ? 'Time Slot' : 'Khung giờ'}</span>
                <span className="font-bold text-slate-900">{selectedRecord.timeSlot}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">{isEn ? 'Room / Court' : 'Phòng / Sân tập'}</span>
                <span className="font-bold text-slate-900">{translateRoomName(selectedRecord.roomName, isEn)}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">{isEn ? 'Coach' : 'Huấn luyện viên'}</span>
                <span className="font-bold text-slate-900">{translateCoachName(selectedRecord.coachName, isEn)}</span>
              </div>
              {selectedRecord.checkInTime && (
                <div className="col-span-2 pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block font-medium">{isEn ? 'Check-in scan timestamp' : 'Thời gian quét thẻ check-in'}</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {formatMemberDateTime(selectedRecord.checkInTime, isEn)}
                  </span>
                </div>
              )}
            </div>

            {/* Đánh giá và nhận xét của HLV */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 uppercase tracking-wide">
                <span className="material-symbols-outlined text-[18px] text-amber-700">psychology</span>
                <span>{isEn ? 'Coach Technical Assessment & Feedback:' : 'Nhận xét chuyên môn từ Huấn Luyện Viên:'}</span>
              </div>
              <p className="text-slate-800 italic leading-relaxed whitespace-pre-wrap break-words pl-6">
                {selectedRecord.attendanceNote
                  ? `"${selectedRecord.attendanceNote}"`
                  : (isEn ? 'The coach has not recorded specific technical feedback for this session.' : 'Huấn luyện viên chưa ghi nhận thêm nhận xét kỹ thuật cho ca học này.')}
              </p>
            </div>

            {/* Nút đóng */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
              >
                {isEn ? 'Close' : 'Đóng'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
