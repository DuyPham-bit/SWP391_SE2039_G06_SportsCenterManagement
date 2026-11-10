import React, { useEffect, useState, useMemo } from 'react';
import { bookingApi } from '../../../entities/booking/index.js';
import { useAuth } from '../../../entities/session/index.js';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { LoadingSpinner } from '../../../shared/ui/Table.jsx';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { bookingStart, formatMemberDate, formatMemberDateTime, getSportTheme } from '../../../entities/member/index.js';
import {
  translateClassName,
  translateSportName,
  translateCoachName,
  translateRoomName
} from '../../../shared/i18n/i18nHelper.js';

export function MyAttendance() {
  const { currentUser } = useAuth();
  const { showError } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  // Bộ lọc nhật ký chuyên cần
  // statusFilter: 'ALL' | 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED' | 'PENDING'
  const [statusFilter, setStatusFilter] = useState('ALL');
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

  // Render Badge trạng thái chuyên cần với màu sắc nhận diện cao
  const renderAttendanceBadge = (status) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-brand-sage-100 text-brand-sage-800 border border-brand-sage-200">
            <span className="material-symbols-outlined text-[15px]">check_circle</span>
            <span>{isEn ? 'Present' : 'Có mặt'}</span>
          </span>
        );
      case 'LATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-brand-sand-100 text-brand-sand-800 border border-brand-sand-200">
            <span className="material-symbols-outlined text-[15px]">schedule</span>
            <span>{isEn ? 'Late' : 'Đi muộn'}</span>
          </span>
        );
      case 'ABSENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-brand-danger-100 text-brand-danger-800 border border-brand-danger-200">
            <span className="material-symbols-outlined text-[15px]">cancel</span>
            <span>{isEn ? 'Absent' : 'Vắng mặt'}</span>
          </span>
        );
      case 'EXCUSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-brand-teal-100 text-brand-teal-800 border border-brand-teal-200">
            <span className="material-symbols-outlined text-[15px]">event_available</span>
            <span>{isEn ? 'Excused' : 'Vắng có phép'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black uppercase bg-brand-navy-100 text-brand-navy-700 border border-brand-navy-200">
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
      {/* 1. Olympic Discipline Masterpiece Banner */}
      <div className="scms-hero relative rounded-3xl bg-gradient-to-r from-brand-sage-700 via-brand-teal-600 via-brand-teal-500 to-brand-sand-500 dark:from-brand-sage-900 dark:via-brand-teal-900 dark:via-brand-teal-800 dark:to-brand-sand-900 text-white p-6 sm:p-7 border border-white/30 dark:border-white/10 shadow-xl shadow-brand-teal-600/20 overflow-hidden">
        {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-brand-sand-300/45 via-brand-sand-500/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-brand-sage-500/40 via-brand-sage-700/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-brand-teal-300/30 rounded-full blur-3xl pointer-events-none" />
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
              <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-brand-navy-900/90 backdrop-blur-md text-brand-sage-900 dark:text-brand-sage-300 border border-white/80 dark:border-white/20 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <span className="material-symbols-outlined text-[13px] text-brand-sand-700 dark:text-brand-sand-400">fact_check</span>
                OLYMPIC DISCIPLINE RECORD
              </span>
              <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-brand-navy-900/80 backdrop-blur-md text-brand-sage-800 dark:text-brand-sage-300 border border-white/80 dark:border-white/20 text-[11px] font-black uppercase tracking-wide flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse" />
                {isEn ? `Discipline: ${stats.disciplineRate}%` : `Chuyên cần: ${stats.disciplineRate}%`}
              </span>
            </div>

            <h1 className="font-chivo text-2xl lg:text-3xl font-black text-white tracking-tight mt-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
              {isEn ? 'Attendance History & Discipline' : 'Lịch Sử Điểm Danh & Chuyên Cần'}
            </h1>
            <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-2xl font-medium leading-relaxed drop-shadow-xs">
              {isEn
                ? 'Track class session logs, actual check-in timestamps, coach notes, and technique assessments from the assigned coach.'
                : 'Theo dõi nhật ký tham gia từng ca học, thời gian check-in thực tế, ghi chú chuyên môn và đánh giá kỹ thuật rèn luyện từ Huấn luyện viên phụ trách.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setReload(val => val + 1)}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white hover:bg-white/95 text-brand-navy-800 hover:text-brand-teal-600 border border-white transition active:rotate-180 duration-300 shadow-md cursor-pointer disabled:opacity-50"
              title={isEn ? "Reload attendance logs" : "Tải lại nhật ký điểm danh"}
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            </button>

            <a
              href="#/member/progress"
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-white/95 text-brand-navy-900 border border-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95 cursor-pointer backdrop-blur-md"
            >
              <span className="material-symbols-outlined text-[18px] text-brand-teal-600">trending_up</span>
              <span>{isEn ? 'Progress & Coach Feedback' : 'Tiến Trình & Nhận Xét HLV'}</span>
            </a>

            <a
              href="#/member/schedule"
              className="px-4 py-2.5 bg-brand-navy-950 hover:bg-brand-navy-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg hover:shadow-xl shrink-0 border border-white/20 active:scale-95 cursor-pointer backdrop-blur-md"
            >
              <span className="material-symbols-outlined text-[18px] text-brand-sand-300">calendar_month</span>
              <span>{isEn ? 'Class Schedule' : 'Lịch Mở Lớp'}</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. KPI Summary Strip (Đồng bộ chuẩn 4 thẻ tương tác) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Có mặt */}
        <div
          onClick={() => setStatusFilter(f => (f === 'PRESENT' ? 'ALL' : 'PRESENT'))}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
            statusFilter === 'PRESENT'
              ? 'bg-brand-sage-50 border-brand-sage-400 shadow-sm ring-2 ring-brand-sage-500/20'
              : 'bg-white border-brand-navy-200 hover:border-brand-sage-300'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-brand-sage-100 text-brand-sage-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">check_circle</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-brand-navy-400 block tracking-wider">{isEn ? 'On Time' : 'Có mặt đúng giờ'}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-chivo text-lg font-black text-brand-sage-800 dark:text-brand-sage-400">{stats.present}</span>
              <span className="text-[10px] font-bold text-brand-navy-400">{isEn ? 'sess' : 'ca'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Đi muộn */}
        <div
          onClick={() => setStatusFilter(f => (f === 'LATE' ? 'ALL' : 'LATE'))}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
            statusFilter === 'LATE'
              ? 'bg-brand-sand-50 border-brand-sand-400 shadow-sm ring-2 ring-brand-sand-500/20'
              : 'bg-white border-brand-navy-200 hover:border-brand-sand-300'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-brand-sand-100 text-brand-sand-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">schedule</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-brand-navy-400 block tracking-wider">{isEn ? 'Late' : 'Đi muộn'}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-chivo text-lg font-black text-brand-sand-800 dark:text-brand-sand-400">{stats.late}</span>
              <span className="text-[10px] font-bold text-brand-navy-400">{isEn ? 'sess' : 'ca'}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Vắng mặt */}
        <div
          onClick={() => setStatusFilter(f => (f === 'ABSENT' ? 'ALL' : 'ABSENT'))}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
            statusFilter === 'ABSENT'
              ? 'bg-brand-danger-50 border-brand-danger-400 shadow-sm ring-2 ring-brand-danger-500/20'
              : 'bg-white border-brand-navy-200 hover:border-brand-danger-300'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-brand-danger-100 text-brand-danger-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">cancel</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-brand-navy-400 block tracking-wider">{isEn ? 'Absent' : 'Vắng mặt'}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-chivo text-lg font-black text-brand-danger-800 dark:text-brand-danger-400">{stats.absent}</span>
              <span className="text-[10px] font-bold text-brand-navy-400">{isEn ? 'sess' : 'ca'}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Vắng có phép */}
        <div
          onClick={() => setStatusFilter(f => (f === 'EXCUSED' ? 'ALL' : 'EXCUSED'))}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
            statusFilter === 'EXCUSED'
              ? 'bg-brand-teal-50 border-brand-teal-400 shadow-sm ring-2 ring-brand-teal-500/20'
              : 'bg-white border-brand-navy-200 hover:border-brand-teal-300'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-brand-teal-100 text-brand-teal-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">event_available</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-brand-navy-400 block tracking-wider">{isEn ? 'Excused' : 'Vắng có phép'}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-chivo text-lg font-black text-brand-teal-900 dark:text-brand-teal-400">{stats.excused}</span>
              <span className="text-[10px] font-bold text-brand-navy-400">{isEn ? 'sess' : 'ca'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Control Bar & Filter Toolbar (Đồng bộ chuẩn ClassScheduleView) */}
      <div className="bg-white p-4 rounded-2xl border border-brand-navy-200 shadow-sm space-y-4">
        {/* Row 1: Segmented Tabs Trạng Thái & View Mode Switcher */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="inline-flex p-1 bg-brand-navy-100 rounded-xl border border-brand-navy-200/80 shrink-0 overflow-x-auto">
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
                    ? 'bg-white text-brand-navy-900 shadow-xs'
                    : 'text-brand-navy-500 hover:text-brand-navy-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    statusFilter === tab.id
                      ? 'bg-brand-navy-900 text-white'
                      : 'bg-brand-navy-200 text-brand-navy-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Bộ lọc nâng cao (Tìm kiếm, Môn thể thao, Từ ngày - Đến ngày) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-brand-navy-100 text-xs">
          {/* Search Input */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-brand-navy-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder={isEn ? "Search class, coach, court, note..." : "Tìm lớp, HLV, sân, ghi chú..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-danger-600 focus:border-brand-danger-600 bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-brand-navy-400 hover:text-brand-navy-700"
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
              className="w-full px-3 py-2 rounded-lg border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-danger-600 bg-white font-medium"
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
              }}
              className="w-full px-3 py-2 rounded-lg border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-danger-600 bg-white font-medium"
            />
          </div>

          {/* To Date & Clear */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              placeholder={isEn ? "To date" : "Đến ngày"}
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-danger-600 bg-white font-medium"
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
                className="px-2.5 py-2 rounded-lg border border-brand-navy-300 hover:bg-brand-navy-100 text-brand-navy-600 font-bold shrink-0"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Cảnh báo dải ngày không hợp lệ */}
        {invalidRange && (
          <div role="alert" className="p-2.5 rounded-lg bg-brand-danger-50 text-brand-danger-700 text-xs font-bold border border-brand-danger-200 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">warning</span>
            <span>{isEn ? 'Start date ("From date") must be before or equal to End date ("To date").' : 'Ngày bắt đầu ("Từ ngày") phải trước hoặc bằng ngày kết thúc ("Đến ngày").'}</span>
          </div>
        )}
      </div>

      {/* Error Alert nếu có lỗi tải */}
      {error && (
        <div role="alert" className="p-4 bg-brand-danger-50 text-brand-danger-700 rounded-xl flex items-center justify-between border border-brand-danger-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-danger-600">error</span>
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
          <h2 className="font-chivo text-base font-black text-brand-navy-900 tracking-tight flex items-center gap-2">
            <span>{isEn ? 'Session Attendance Records' : 'Nhật Ký Điểm Danh Từng Ca'}</span>
            <span className="text-xs font-bold text-brand-navy-400">({filteredRecords.length} {isEn ? 'sessions' : 'ca tập'})</span>
          </h2>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-brand-navy-200 max-w-xl mx-auto space-y-3">
            <div className="w-16 h-16 rounded-full bg-brand-navy-100 text-brand-navy-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">fact_check</span>
            </div>
            <h3 className="font-chivo text-base font-bold text-brand-navy-900">
              {searchQuery || selectedSport !== 'ALL' || fromDate || toDate
                ? (isEn ? 'No Records Match Your Filters' : 'Không Tìm Thấy Bản Ghi Phù Hợp Bộ Lọc')
                : (isEn ? 'No Attendance Records Yet' : 'Chưa Có Bản Ghi Điểm Danh Nào')}
            </h3>
            <p className="text-xs text-brand-navy-500 max-w-sm mx-auto">
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
                  className="px-4 py-2 bg-brand-navy-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-navy-800 transition-colors"
                >
                  {isEn ? 'Clear All Filters' : 'Xóa Tất Cả Bộ Lọc'}
                </button>
              ) : (
                <a
                  href="#/member/schedule"
                  className="px-5 py-2.5 bg-brand-danger-600 hover:bg-brand-danger-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-colors inline-block"
                >
                  {isEn ? 'View Schedule & Book Class' : 'Xem Lịch & Đặt Ca Tập Mới'}
                </a>
              )}
            </div>
          </div>

        ) : (
          /* DẠNG BẢNG (TABLE VIEW) - Tối ưu cho hội viên tra cứu và đối soát */
          <div className="bg-white rounded-2xl border border-brand-navy-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-brand-navy-50 border-b border-brand-navy-200 text-brand-navy-500 font-chivo font-black uppercase tracking-wider text-[11px]">
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
                <tbody className="divide-y divide-brand-navy-100 text-brand-navy-700">
                  {filteredRecords.map(b => {
                    const sportTheme = getSportTheme(b.sportName, b.className, isEn);
                    const attendanceStatus = b.attendanceStatus || 'PENDING';

                    return (
                      <tr key={b.id} className="hover:bg-brand-navy-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-brand-navy-900 font-chivo">{translateClassName(b.className, isEn)}</div>
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wide border mt-0.5 ${sportTheme.badge}`}>
                            {sportTheme.tag}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-brand-navy-900">
                          {formatMemberDate(b.bookingDate, isEn)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-brand-navy-600">
                          {b.timeSlot}
                        </td>
                        <td className="py-3.5 px-4 text-brand-navy-600">{translateRoomName(b.roomName, isEn)}</td>
                        <td className="py-3.5 px-4 text-brand-navy-800 font-medium">{translateCoachName(b.coachName, isEn)}</td>
                        <td className="py-3.5 px-4">{renderAttendanceBadge(attendanceStatus)}</td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-brand-navy-600">
                          {b.checkInTime ? formatMemberDateTime(b.checkInTime, isEn) : '—'}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-brand-navy-600 italic">
                          {b.attendanceNote || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecord(b);
                              setDetailModalOpen(true);
                            }}
                            className="p-1 rounded-lg border border-brand-navy-200 hover:bg-brand-navy-100 text-brand-navy-600"
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
            <div className="p-4 rounded-xl bg-brand-navy-50 border border-brand-navy-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-brand-navy-400 font-bold">
                  {isEn ? 'Ticket ID: ' : 'Mã vé: '}#{selectedRecord.id}
                </span>
                {renderAttendanceBadge(selectedRecord.attendanceStatus || 'PENDING')}
              </div>
              <h3 className="font-chivo text-lg font-black text-brand-navy-900">
                {translateClassName(selectedRecord.className, isEn)}
              </h3>
            </div>

            {/* Chi tiết ca học */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-xl border border-brand-navy-200">
              <div>
                <span className="text-brand-navy-400 block font-medium">{isEn ? 'Session Date' : 'Ngày rèn luyện'}</span>
                <span className="font-bold text-brand-navy-900">
                  {formatMemberDate(selectedRecord.bookingDate, isEn)}
                </span>
              </div>
              <div>
                <span className="text-brand-navy-400 block font-medium">{isEn ? 'Time Slot' : 'Khung giờ'}</span>
                <span className="font-bold text-brand-navy-900">{selectedRecord.timeSlot}</span>
              </div>
              <div>
                <span className="text-brand-navy-400 block font-medium">{isEn ? 'Room / Court' : 'Phòng / Sân tập'}</span>
                <span className="font-bold text-brand-navy-900">{translateRoomName(selectedRecord.roomName, isEn)}</span>
              </div>
              <div>
                <span className="text-brand-navy-400 block font-medium">{isEn ? 'Coach' : 'Huấn luyện viên'}</span>
                <span className="font-bold text-brand-navy-900">{translateCoachName(selectedRecord.coachName, isEn)}</span>
              </div>
              {selectedRecord.checkInTime && (
                <div className="col-span-2 pt-2 border-t border-brand-navy-100">
                  <span className="text-brand-navy-400 block font-medium">{isEn ? 'Check-in scan timestamp' : 'Thời gian quét thẻ check-in'}</span>
                  <span className="font-mono font-bold text-brand-sage-800 dark:text-brand-sage-400">
                    {formatMemberDateTime(selectedRecord.checkInTime, isEn)}
                  </span>
                </div>
              )}
            </div>

            {/* Đánh giá và nhận xét của HLV */}
            <div className="p-4 rounded-xl bg-brand-sand-50 border border-brand-sand-200 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-brand-sand-900 dark:text-brand-sand-400 uppercase tracking-wide">
                <span className="material-symbols-outlined text-[18px] text-brand-sand-700 dark:text-brand-sand-400">psychology</span>
                <span>{isEn ? 'Coach Technical Assessment & Feedback:' : 'Nhận xét chuyên môn từ Huấn Luyện Viên:'}</span>
              </div>
              <p className="text-brand-navy-800 italic leading-relaxed whitespace-pre-wrap break-words pl-6">
                {selectedRecord.attendanceNote
                  ? `"${selectedRecord.attendanceNote}"`
                  : (isEn ? 'The coach has not recorded specific technical feedback for this session.' : 'Huấn luyện viên chưa ghi nhận thêm nhận xét kỹ thuật cho ca học này.')}
              </p>
            </div>

            {/* Nút đóng */}
            <div className="flex justify-end pt-3 border-t border-brand-navy-100">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-brand-navy-900 hover:bg-brand-navy-800 text-white shadow-xs transition-colors"
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
