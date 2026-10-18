import React, { useState, useEffect, useMemo } from 'react';
import { bookingApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/StatCard.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { Modal } from '../../components/common/Modal.js';
import { BusinessAlert } from '../../components/common/BusinessAlert.jsx';
import {
  BOOKING_LABELS,
  formatMemberDate,
  formatMemberDateTime,
  isUpcomingBooking,
  bookingStart,
  getSportTheme,
  DAY_LABELS,
  parseIsoDate,
  formatIsoDate,
  getMonday,
  getWeekDays
} from './memberOverview.js';

export function MyBookings() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [bookings, setBookings] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Bộ lọc & Chế độ xem
  // activeTab: 'ALL' | 'UPCOMING' | 'WAITLIST' | 'COMPLETED' | 'CANCELLED'
  const [activeTab, setActiveTab] = useState('ALL');
  // viewMode: 'week' (Lịch Tuần) | 'grid' (Dạng thẻ) | 'table' (Dạng bảng)
  const [viewMode, setViewMode] = useState('week');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => formatIsoDate(new Date()));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('');

  // Booking Detail Modal
  const [selectedBookingDetail, setSelectedBookingDetail] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Cancel Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  // Leave waitlist state
  const [leavingWaitlistId, setLeavingWaitlistId] = useState(null);

  const loadBookings = async () => {
    if (!currentUser) return;
    setError('');
    try {
      const [data, waiting] = await Promise.all([
        bookingApi.getMemberBookings(currentUser.id),
        bookingApi.getWaitlist()
      ]);
      setBookings(data || []);
      setWaitlist(waiting || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách đặt chỗ.');
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [currentUser]);

  const openCancelModal = (booking) => {
    setBookingToCancel(booking);
    setCancelError(null);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel || !currentUser) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const result = await bookingApi.cancelBooking(bookingToCancel.id, currentUser.id);
      showSuccess(result.message || 'Đã hủy ca đặt chỗ thành công.');
      setCancelModalOpen(false);
      await loadBookings();
    } catch (err) {
      setCancelError(err);
      showError(err);
    } finally {
      setCancelling(false);
    }
  };

  const handleLeaveWaitlist = async (waitlistId, className) => {
    setLeavingWaitlistId(waitlistId);
    try {
      await bookingApi.leaveWaitlist(waitlistId);
      showSuccess(`Đã rời khỏi danh sách chờ của lớp "${className || ''}".`);
      await loadBookings();
    } catch (err) {
      showError(err.message || 'Không thể rời danh sách chờ.');
    } finally {
      setLeavingWaitlistId(null);
    }
  };

  // Thống kê nhanh KPI
  const stats = useMemo(() => {
    const total = bookings.length;
    const now = Date.now();
    const upcoming = bookings.filter(b => isUpcomingBooking(b)).length;
    const completed = bookings.filter(b =>
      b.status === 'COMPLETED' ||
      (b.status === 'CONFIRMED' && bookingStart(b) <= now && b.sessionStatus !== 'CANCELLED')
    ).length;
    const cancelled = bookings.filter(b =>
      b.status === 'CANCELLED' || b.status === 'CANCELLEDLATE' || b.sessionStatus === 'CANCELLED'
    ).length;
    const inWaitlist = waitlist.length;

    return { total, upcoming, completed, cancelled, inWaitlist };
  }, [bookings, waitlist]);

  // Bộ môn có trong danh sách đặt chỗ của hội viên
  const availableSports = useMemo(() => {
    const set = new Set();
    bookings.forEach(b => {
      const theme = getSportTheme(b.sportName, b.className);
      set.add(theme.tag);
    });
    return Array.from(set);
  }, [bookings]);

  // Lọc danh sách đặt chỗ
  const filteredBookings = useMemo(() => {
    const now = Date.now();
    return bookings.filter(b => {
      const isUpcoming = isUpcomingBooking(b);
      const isCompleted = b.status === 'COMPLETED' || (b.status === 'CONFIRMED' && bookingStart(b) <= now && b.sessionStatus !== 'CANCELLED');
      const isCancelled = b.status === 'CANCELLED' || b.status === 'CANCELLEDLATE' || b.sessionStatus === 'CANCELLED';

      // 1. Lọc theo Tab
      if (activeTab === 'UPCOMING' && !isUpcoming) return false;
      if (activeTab === 'COMPLETED' && !isCompleted) return false;
      if (activeTab === 'CANCELLED' && !isCancelled) return false;

      // 2. Tìm kiếm từ khóa
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = b.className?.toLowerCase().includes(q);
        const matchCoach = b.coachName?.toLowerCase().includes(q);
        const matchRoom = b.roomName?.toLowerCase().includes(q);
        const matchId = String(b.id).includes(q);
        if (!matchName && !matchCoach && !matchRoom && !matchId) return false;
      }

      // 3. Lọc theo môn thể thao
      if (selectedSport !== 'ALL') {
        const theme = getSportTheme(b.sportName, b.className);
        if (theme.tag !== selectedSport) return false;
      }

      // 4. Lọc theo ngày
      if (selectedDate && b.bookingDate !== selectedDate) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Sắp xếp: ca sắp tới xếp trước, ca cũ xếp sau
      const startA = bookingStart(a) || 0;
      const startB = bookingStart(b) || 0;
      return startB - startA;
    });
  }, [bookings, activeTab, searchQuery, selectedSport, selectedDate]);

  // Tiện ích lịch tuần chuẩn Olympic
  const todayStr = useMemo(() => formatIsoDate(new Date()), []);
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const periodTitle = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    return `Tuần: ${start.getDate()} Th${start.getMonth() + 1} - ${end.getDate()} Th${end.getMonth() + 1}, ${end.getFullYear()}`;
  }, [weekDays]);

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

  const handleOpenBookingDetail = (booking) => {
    setSelectedBookingDetail(booking);
    setDetailModalOpen(true);
  };

  // Gom nhóm danh sách đặt chỗ theo ngày YYYY-MM-DD
  const bookingsByDate = useMemo(() => {
    const map = new Map();
    filteredBookings.forEach(b => {
      const d = String(b.bookingDate || b.sessionDate || '').slice(0, 10);
      if (!d) return;
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(b);
    });
    map.forEach(list => {
      list.sort((a, b) => (bookingStart(a) || 0) - (bookingStart(b) || 0));
    });
    return map;
  }, [filteredBookings]);

  if (loading) {
    return <LoadingSpinner text="Đang đồng bộ vé đặt & danh sách chờ Olympic..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & Title (Đồng bộ chuẩn Olympic Schedule) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-chivo text-xs font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              OLYMPIC BOOKING MANAGEMENT
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              {stats.upcoming} ca sắp diễn ra
            </span>
          </div>
          <h1 className="font-chivo text-2xl lg:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Lớp Đã Đặt & Lịch Hủy Chỗ
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Theo dõi tất cả ca rèn luyện đã đặt chỗ, danh sách chờ (Waitlist) và quản lý lịch học linh hoạt. Chủ động hủy chỗ trước 2 giờ để bảo lưu lượt tập và nhường chỗ cho hội viên khác.
          </p>
        </div>

        {/* Action Buttons: Đặt Thêm Lớp & Tải Lại */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadBookings}
            className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors flex items-center justify-center shrink-0 shadow-xs"
            title="Tải lại dữ liệu vé"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
          <a
            href="#/member/schedule"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm shrink-0"
          >
            <span className="material-symbols-outlined text-[18px] text-red-400">calendar_month</span>
            <span>Lịch Mở Lớp Rèn Luyện</span>
          </a>
        </div>
      </div>

      {/* 2. KPI Summary Strip (Tương tác bấm lọc đồng bộ với ClassScheduleView) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Tổng vé đã đặt */}
        <div
          onClick={() => setActiveTab('ALL')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
            activeTab === 'ALL'
              ? 'bg-red-50 border-red-400 shadow-sm ring-2 ring-red-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">confirmation_number</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Tổng vé đặt</span>
            <span className="font-chivo text-lg font-black text-slate-900">{stats.total}</span>
          </div>
        </div>

        {/* Card 2: Ca sắp diễn ra */}
        <div
          onClick={() => setActiveTab('UPCOMING')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
            activeTab === 'UPCOMING'
              ? 'bg-emerald-50 border-emerald-400 shadow-sm ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">event_upcoming</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Sắp diễn ra</span>
            <span className="font-chivo text-lg font-black text-emerald-800">{stats.upcoming}</span>
          </div>
        </div>

        {/* Card 3: Danh sách chờ */}
        <div
          onClick={() => setActiveTab('WAITLIST')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
            activeTab === 'WAITLIST'
              ? 'bg-amber-50 border-amber-400 shadow-sm ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">hourglass_top</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Danh sách chờ</span>
            <span className="font-chivo text-lg font-black text-amber-800">{stats.inWaitlist}</span>
          </div>
        </div>

        {/* Card 4: Đã hoàn thành / Lịch sử */}
        <div
          onClick={() => setActiveTab('COMPLETED')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
            activeTab === 'COMPLETED'
              ? 'bg-blue-50 border-blue-400 shadow-sm ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">history</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Đã hoàn thành</span>
            <span className="font-chivo text-lg font-black text-blue-900">{stats.completed}</span>
          </div>
        </div>
      </div>

      {/* 3. Control Bar & Filter Toolbar (Đồng bộ chuẩn ClassScheduleView) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Row 1: Segmented Tabs & View Mode Switcher */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0 overflow-x-auto">
            {[
              { id: 'ALL', label: 'Tất Cả', icon: 'list', count: stats.total },
              { id: 'UPCOMING', label: 'Sắp Tới', icon: 'event_available', count: stats.upcoming },
              { id: 'WAITLIST', label: 'Hàng Chờ', icon: 'hourglass_top', count: stats.inWaitlist },
              { id: 'COMPLETED', label: 'Đã Tập', icon: 'task_alt', count: stats.completed },
              { id: 'CANCELLED', label: 'Đã Hủy', icon: 'cancel', count: stats.cancelled }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Segmented Control View Mode: Lịch Tuần | Dạng Thẻ | Dạng Bảng */}
          {activeTab !== 'WAITLIST' && (
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo flex items-center gap-1.5 transition-all ${
                  viewMode === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">calendar_view_week</span>
                <span>Lịch Tuần</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo flex items-center gap-1.5 transition-all ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">grid_view</span>
                <span>Dạng Thẻ</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo flex items-center gap-1.5 transition-all ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">table_rows</span>
                <span>Dạng Bảng</span>
              </button>
            </div>
          )}
        </div>

        {/* Row 2: Thanh điều hướng tuần khi ở chế độ Lịch Tuần */}
        {activeTab !== 'WAITLIST' && viewMode === 'week' && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-1 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToday}
                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-2xs"
              >
                Hôm Nay
              </button>
              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                <button
                  type="button"
                  onClick={handlePrevWeek}
                  title="Lùi tuần trước"
                  className="p-1.5 hover:bg-slate-100 text-slate-700 transition-colors border-r border-slate-200"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextWeek}
                  title="Tiến tuần sau"
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
              Nhấp vào ca học bất kỳ trên lịch tuần để xem thông tin hoặc quản lý hủy vé
            </span>
          </div>
        )}

        {/* Row 3: Bộ lọc nâng cao (Tìm kiếm, Môn thể thao, Chọn ngày) */}
        {activeTab !== 'WAITLIST' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
            {/* Search Input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Tìm tên lớp, HLV, phòng tập, mã vé..."
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
                <option value="ALL">🏅 Tất cả bộ môn thể thao</option>
                {availableSports.map(sport => (
                  <option key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={e => {
                  setSelectedDate(e.target.value);
                  if (e.target.value) {
                    setCurrentDate(parseIsoDate(e.target.value));
                    setSelectedCalendarDate(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 bg-white font-medium"
              />
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  title="Xóa lọc ngày"
                  className="px-2.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Alert nếu có lỗi tải danh sách */}
      {error && (
        <div role="alert" className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center justify-between border border-red-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600">error</span>
            <span className="text-xs font-bold">{error}</span>
          </div>
          <button type="button" onClick={loadBookings} className="text-xs font-black underline uppercase">
            Thử lại
          </button>
        </div>
      )}

      {/* 4. PHẦN DANH SÁCH CHỜ (WAITLIST) NẾU TAB = WAITLIST HOẶC CÓ VÉ ĐANG CHỜ */}
      {(activeTab === 'WAITLIST' || (activeTab === 'ALL' && waitlist.length > 0)) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <h2 className="font-chivo text-base font-black text-slate-900 tracking-tight">
                Danh Sách Chờ Đang Kích Hoạt ({waitlist.length})
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 italic">
              * Hệ thống tự động nâng lên thành vé chính thức khi có hội viên khác hủy chỗ trước giờ học.
            </span>
          </div>

          {waitlist.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <span className="material-symbols-outlined text-4xl text-slate-300">hourglass_disabled</span>
              <h3 className="font-chivo text-sm font-bold text-slate-800 mt-2">
                Bạn Hiện Không Có Ca Học Nào Trong Hàng Chờ
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Khi một ca học đã kín chỗ, bạn có thể ghi danh vào hàng chờ tại Lịch Lớp Thể Thao.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {waitlist.map(w => {
                const sportTheme = getSportTheme('', w.className);
                const isLeaving = leavingWaitlistId === w.id;

                return (
                  <div
                    key={w.id}
                    className="bg-white rounded-2xl border-2 border-amber-200/80 p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400"></div>

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${sportTheme.badge}`}>
                            {sportTheme.tag}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">hourglass_top</span>
                            <span>ĐANG CHỜ DUYỆT</span>
                          </span>
                        </div>
                        <h3 className="font-chivo text-base font-black text-slate-900">
                          {w.className}
                        </h3>
                      </div>

                      <button
                        type="button"
                        disabled={isLeaving}
                        onClick={() => handleLeaveWaitlist(w.id, w.className)}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold font-chivo uppercase tracking-wider transition-colors flex items-center gap-1 disabled:opacity-50 shrink-0"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                        <span>{isLeaving ? 'Đang rời...' : 'Rời Hàng Chờ'}</span>
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 bg-amber-50/60 p-3 rounded-xl border border-amber-100">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-amber-600 text-[18px]">calendar_month</span>
                        <span className="font-bold">{formatMemberDate(w.sessionDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-amber-600 text-[18px]">schedule</span>
                        <span>{String(w.startTime || '').slice(0, 5)} - {String(w.endTime || '').slice(0, 5)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. DANH SÁCH VÉ TẬP (CHẾ ĐỘ THẺ HOẶC BẢNG) */}
      {activeTab !== 'WAITLIST' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-chivo text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Danh Sách Lớp Đặt Chỗ</span>
              <span className="text-xs font-bold text-slate-400">({filteredBookings.length} ca)</span>
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
                  const dayBookings = bookingsByDate.get(dayStr) || [];

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
                      {dayBookings.length > 0 ? (
                        <span className="inline-block mt-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700">
                          {dayBookings.length} ca
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
                  const dayBookings = bookingsByDate.get(dayStr) || [];
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
                        <span className="text-slate-500">{dayBookings.length} ca</span>
                      </div>

                      {dayBookings.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          <span className="material-symbols-outlined text-2xl text-slate-300 block mb-1">
                            event_busy
                          </span>
                          <span>Không có ca</span>
                        </div>
                      ) : (
                        dayBookings.map(b => {
                          const theme = getSportTheme(b.sportName, b.className);
                          const isUpcoming = isUpcomingBooking(b);
                          const isCancelled = b.status === 'CANCELLED' || b.status === 'CANCELLEDLATE' || b.sessionStatus === 'CANCELLED';
                          const isCompleted = b.status === 'COMPLETED' || (!isUpcoming && !isCancelled);

                          return (
                            <div
                              key={b.id}
                              onClick={() => handleOpenBookingDetail(b)}
                              className={`p-3 rounded-xl border text-xs cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 space-y-2 ${
                                !isCancelled && isUpcoming
                                  ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                                  : `${theme.bg} ${theme.border} shadow-xs`
                              }`}
                            >
                              {/* Time & Sport Tag */}
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-[11px] text-slate-900 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px] text-red-600">schedule</span>
                                  <span>{b.timeSlot}</span>
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${theme.badge}`}>
                                  {theme.tag || b.sportName}
                                </span>
                              </div>

                              {/* Class Name */}
                              <h4 className="font-chivo font-black text-slate-900 leading-snug line-clamp-2">
                                {b.className}
                              </h4>

                              {/* Coach & Room Info */}
                              <div className="text-[11px] text-slate-600 space-y-0.5">
                                <div className="truncate">HLV: <strong>{b.coachName}</strong></div>
                                <div className="truncate text-slate-500">{b.roomName}</div>
                              </div>

                              {/* Capacity / Booking ID & Action Status Footer */}
                              <div className="pt-1.5 border-t border-black/5 flex items-center justify-between">
                                <div className="text-[10px] font-mono font-bold text-slate-500">
                                  #{b.id}
                                </div>

                                {isCancelled ? (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-black uppercase text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200">
                                    <span className="material-symbols-outlined text-[12px]">cancel</span>
                                    <span>ĐÃ HỦY</span>
                                  </span>
                                ) : isCompleted ? (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-black uppercase text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">
                                    <span className="material-symbols-outlined text-[12px]">task_alt</span>
                                    <span>ĐÃ TẬP</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                                    <span className="material-symbols-outlined text-[12px]">verified</span>
                                    <span>ĐÃ ĐẶT</span>
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
          ) : filteredBookings.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 max-w-xl mx-auto space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">event_busy</span>
              </div>
              <h3 className="font-chivo text-base font-bold text-slate-900">
                {searchQuery || selectedSport !== 'ALL' || selectedDate
                  ? 'Không Tìm Thấy Ca Đặt Chỗ Phù Hợp Bộ Lọc'
                  : 'Bạn Chưa Có Lịch Đặt Chỗ Nào'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || selectedSport !== 'ALL' || selectedDate
                  ? 'Vui lòng thử điều chỉnh hoặc xóa các tiêu chí tìm kiếm để hiển thị toàn bộ vé tập.'
                  : 'Khám phá ngay lịch mở lớp thể thao chuẩn Olympic và chọn ca tập yêu thích cùng HLV chuyên nghiệp.'}
              </p>
              <div>
                {searchQuery || selectedSport !== 'ALL' || selectedDate ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedSport('ALL');
                      setSelectedDate('');
                    }}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
                  >
                    Xóa Tất Cả Bộ Lọc
                  </button>
                ) : (
                  <a
                    href="#/member/schedule"
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-colors inline-block"
                  >
                    Xem Lịch & Đặt Chỗ Ngay
                  </a>
                )}
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* DẠNG THẺ (GRID VIEW) - Chuẩn màu sắc nhận diện Olympic & getSportTheme */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBookings.map(b => {
                const sportTheme = getSportTheme(b.sportName, b.className);
                const isUpcoming = isUpcomingBooking(b);
                const startMs = bookingStart(b);
                const hoursUntil = startMs ? (startMs - Date.now()) / (1000 * 60 * 60) : null;
                const isTooLateToCancel = hoursUntil !== null && hoursUntil < 2 && isUpcoming;

                return (
                  <div
                    key={b.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden ${
                      isUpcoming ? 'border-slate-300' : 'border-slate-200 opacity-90'
                    }`}
                  >
                    {/* Dải màu nhận diện trên đầu thẻ theo bộ môn */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${sportTheme.dot}`}></div>

                    <div>
                      {/* Top Meta: Sport Tag, Booking Code & Status Badge */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${sportTheme.badge}`}>
                            {sportTheme.tag}
                          </span>
                          <span className="font-mono text-xs text-slate-400 font-bold">
                            #{b.id}
                          </span>
                        </div>
                        <Badge variant={b.status}>
                          {b.sessionStatus === 'CANCELLED'
                            ? 'Buổi học bị hủy'
                            : BOOKING_LABELS[b.status] || b.status}
                        </Badge>
                      </div>

                      {/* Class Name */}
                      <h3 className="font-chivo text-lg font-black text-slate-900 leading-snug">
                        {b.className}
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
                              {formatMemberDate(b.bookingDate)}
                            </span>
                            <span className="text-slate-600 font-semibold">({b.timeSlot})</span>
                          </div>

                          {isUpcoming && hoursUntil !== null && hoursUntil >= 0 && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                              {hoursUntil < 24
                                ? `Còn ${Math.ceil(hoursUntil)}h nữa`
                                : `Còn ${Math.ceil(hoursUntil / 24)} ngày`}
                            </span>
                          )}
                        </div>

                        {/* Sân / Phòng tập */}
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-slate-400 text-[18px]">
                            stadium
                          </span>
                          <span className="font-medium text-slate-700">{b.roomName}</span>
                        </div>

                        {/* Huấn luyện viên */}
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-slate-400 text-[18px]">
                            sports
                          </span>
                          <div>
                            <span className="font-medium">HLV: </span>
                            <strong className="text-slate-900">{b.coachName}</strong>
                            {b.coachSpecialization && (
                              <span className="block text-[11px] text-slate-500">
                                Chuyên môn: {b.coachSpecialization}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Điểm danh nếu đã có */}
                        {b.attendanceStatus && (
                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">Điểm danh:</span>
                            <span className="font-bold text-slate-800">
                              {b.attendanceStatus === 'PRESENT' && '✅ Có mặt'}
                              {b.attendanceStatus === 'LATE' && '⏰ Đi muộn'}
                              {b.attendanceStatus === 'ABSENT' && '❌ Vắng mặt'}
                              {b.attendanceStatus === 'EXCUSED' && '📝 Vắng có phép'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Policy Reminder for Upcoming Classes */}
                      {isUpcoming && (
                        <div className="mt-2.5 px-2 py-1.5 rounded-lg bg-slate-100/70 text-[11px] text-slate-500 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px] text-slate-400">info</span>
                          <span>
                            {isTooLateToCancel
                              ? 'Ca học dưới 2 tiếng: Cần liên hệ trực tiếp lễ tân để xử lý hủy khẩn cấp.'
                              : 'Chính sách hủy: Hủy trước 2 tiếng để hoàn lại lượt và mở chỗ cho hội viên khác.'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-slate-400 text-[11px]">
                        Đăng ký: {formatMemberDateTime(b.createdAt)}
                      </span>

                      {/* Action Hủy Chỗ */}
                      {currentUser?.capabilities?.includes('cancel_booking') && isUpcoming && (
                        <button
                          type="button"
                          onClick={() => openCancelModal(b)}
                          className="px-3.5 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold font-chivo uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-2xs"
                        >
                          <span className="material-symbols-outlined text-[16px]">cancel</span>
                          <span>Hủy Chỗ</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* DẠNG BẢNG (TABLE VIEW) - Tối ưu cho hội viên quản lý danh sách dài */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-chivo font-black uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">Mã Vé</th>
                      <th className="py-3.5 px-4">Lớp Học & Môn</th>
                      <th className="py-3.5 px-4">Ngày Tập</th>
                      <th className="py-3.5 px-4">Khung Giờ</th>
                      <th className="py-3.5 px-4">Phòng Tập</th>
                      <th className="py-3.5 px-4">Huấn Luyện Viên</th>
                      <th className="py-3.5 px-4">Trạng Thái</th>
                      <th className="py-3.5 px-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredBookings.map(b => {
                      const sportTheme = getSportTheme(b.sportName, b.className);
                      const isUpcoming = isUpcomingBooking(b);

                      return (
                        <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                            #{b.id}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 font-chivo">{b.className}</div>
                            <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wide border mt-0.5 ${sportTheme.badge}`}>
                              {sportTheme.tag}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            {formatMemberDate(b.bookingDate)}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                            {b.timeSlot}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {b.roomName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-800 font-medium">
                            {b.coachName}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant={b.status}>
                              {b.sessionStatus === 'CANCELLED'
                                ? 'Buổi học bị hủy'
                                : BOOKING_LABELS[b.status] || b.status}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {currentUser?.capabilities?.includes('cancel_booking') && isUpcoming && (
                              <button
                                type="button"
                                onClick={() => openCancelModal(b)}
                                className="px-3 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold uppercase transition-colors inline-flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[14px]">cancel</span>
                                <span>Hủy</span>
                              </button>
                            )}
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
      )}

      {/* 6. Cancel Confirmation Modal (Chuẩn BusinessAlert & Modal Olympic) */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Xác Nhận Hủy Đặt Chỗ Rèn Luyện"
      >
        {bookingToCancel && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-950 space-y-2">
              <span className="font-bold text-sm block text-red-900">
                Bạn có chắc chắn muốn hủy ca học này?
              </span>
              <div className="bg-white/80 p-2.5 rounded-lg border border-red-100 space-y-1">
                <div>Lớp: <strong className="text-slate-900">{bookingToCancel.className}</strong></div>
                <div>Thời gian: <strong className="text-slate-900">{formatMemberDate(bookingToCancel.bookingDate)} ({bookingToCancel.timeSlot})</strong></div>
                <div>Phòng tập: <strong className="text-slate-900">{bookingToCancel.roomName}</strong></div>
              </div>
              <p className="pt-1 text-red-800 leading-relaxed">
                [ME-06] Áp dụng chính sách hủy của Trung tâm: Hủy trước thời hạn quy định (ít nhất 2 giờ trước khi buổi học bắt đầu) sẽ giải phóng chỗ và hoàn lại lượt rèn luyện. Hủy muộn hoặc sau giờ bắt đầu sẽ tính là đã tham gia.
              </p>
              <p className="text-[11px] text-amber-800 italic pt-1 border-t border-red-200/60">
                * Nếu cần hỗ trợ ngoại lệ khẩn cấp do sức khỏe hoặc chấn thương, vui lòng liên hệ trực tiếp quầy lễ tân.
              </p>
            </div>

            {/* Cancel Error Feedback */}
            {cancelError && (
              <BusinessAlert
                type="error"
                title="Không thể hoàn tất hủy đặt chỗ"
                code={cancelError.code || 'ME-06'}
                message={cancelError.message || String(cancelError)}
                proposedHandling={
                  cancelError.proposedHandling ||
                  'Ca học đã sát giờ bắt đầu (dưới 2 tiếng). Vui lòng liên hệ trực tiếp quầy lễ tân để được kiểm tra và hỗ trợ giải quyết ngoại lệ.'
                }
              />
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              >
                Giữ Lại Ca Học
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {cancelling ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Đang Hủy...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    <span>Đồng Ý Hủy Chỗ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 7. Modal Xem Chi Tiết Vé Đặt Chỗ Rèn Luyện */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Chi Tiết Đặt Chỗ Rèn Luyện"
      >
        {selectedBookingDetail && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-400 font-bold">
                  Mã vé: #{selectedBookingDetail.id}
                </span>
                <Badge variant={selectedBookingDetail.status}>
                  {selectedBookingDetail.sessionStatus === 'CANCELLED'
                    ? 'Buổi học bị hủy'
                    : BOOKING_LABELS[selectedBookingDetail.status] || selectedBookingDetail.status}
                </Badge>
              </div>
              <h3 className="font-chivo text-lg font-black text-slate-900">
                {selectedBookingDetail.className}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block font-medium">Bộ môn</span>
                <span className="font-bold text-slate-900">
                  {selectedBookingDetail.sportName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Ngày rèn luyện</span>
                <span className="font-bold text-slate-900">
                  {formatMemberDate(selectedBookingDetail.bookingDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Khung giờ</span>
                <span className="font-bold text-slate-900">{selectedBookingDetail.timeSlot}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Phòng / Sân tập</span>
                <span className="font-bold text-slate-900">{selectedBookingDetail.roomName}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-100">
                <span className="text-slate-400 block font-medium">Huấn luyện viên phụ trách</span>
                <span className="font-bold text-slate-900">{selectedBookingDetail.coachName}</span>
                {selectedBookingDetail.coachSpecialization && (
                  <span className="block text-[11px] text-slate-500">
                    Chuyên môn: {selectedBookingDetail.coachSpecialization}
                  </span>
                )}
              </div>
            </div>

            {selectedBookingDetail.attendanceStatus && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <span className="text-slate-600 font-medium">Điểm danh:</span>
                <span className="font-bold text-slate-900">
                  {selectedBookingDetail.attendanceStatus === 'PRESENT' ? 'Đã có mặt' :
                   selectedBookingDetail.attendanceStatus === 'LATE' ? 'Đi muộn' :
                   selectedBookingDetail.attendanceStatus === 'ABSENT' ? 'Vắng mặt' :
                   selectedBookingDetail.attendanceStatus === 'EXCUSED' ? 'Vắng có phép' :
                   'Chưa ghi nhận'}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center gap-3 pt-3 border-t border-slate-100">
              {currentUser?.capabilities?.includes('cancel_booking') &&
                isUpcomingBooking(selectedBookingDetail) &&
                selectedBookingDetail.status === 'CONFIRMED' && (
                  <button
                    type="button"
                    onClick={() => {
                      setDetailModalOpen(false);
                      openCancelModal(selectedBookingDetail);
                    }}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    <span>Hủy Đặt Chỗ Này</span>
                  </button>
              )}
              <div className="ml-auto">
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
