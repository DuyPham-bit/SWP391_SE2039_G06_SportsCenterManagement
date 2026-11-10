import React, { useState, useEffect, useMemo } from 'react';
import { bookingApi } from '../../../entities/booking/index.js';
import { useAuth } from '../../../entities/session/index.js';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { Badge } from '../../../shared/ui/StatCard.jsx';
import { LoadingSpinner } from '../../../shared/ui/Table.jsx';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { BusinessAlert } from '../../../shared/ui/BusinessAlert.jsx';
import { getBookingStatusLabel, formatMemberDate, isUpcomingBooking, bookingStart, getSportTheme } from '../../../entities/member/index.js';
import { translateClassName, translateSportName, translateCoachName, translateRoomName } from '../../../shared/i18n/i18nHelper.js';
import { formatGroupHeaderDate } from '../lib/format.js';

export function MyBookings() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [bookings, setBookings] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Bộ lọc danh sách vé đặt
  // activeTab: 'ALL' | 'UPCOMING' | 'WAITLIST' | 'COMPLETED' | 'CANCELLED'
  const [activeTab, setActiveTab] = useState('ALL');
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
      setError(err.message || (isEn ? 'Unable to load bookings.' : 'Không thể tải danh sách đặt chỗ.'));
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
      showSuccess(result.message || (isEn ? 'Booking cancelled successfully.' : 'Đã hủy ca đặt chỗ thành công.'));
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
      showSuccess(isEn ? `Left the waitlist for "${translateClassName(className, isEn)}".` : `Đã rời khỏi danh sách chờ của lớp "${className || ''}".`);
      await loadBookings();
    } catch (err) {
      showError(err.message || (isEn ? 'Unable to leave waitlist.' : 'Không thể rời danh sách chờ.'));
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
      const theme = getSportTheme(b.sportName, b.className, isEn);
      set.add(theme.tag);
    });
    return Array.from(set);
  }, [bookings, isEn]);

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
        const matchName = b.className?.toLowerCase().includes(q) || translateClassName(b.className, isEn).toLowerCase().includes(q);
        const matchCoach = b.coachName?.toLowerCase().includes(q) || translateCoachName(b.coachName, isEn).toLowerCase().includes(q);
        const matchRoom = b.roomName?.toLowerCase().includes(q) || translateRoomName(b.roomName, isEn).toLowerCase().includes(q);
        const matchId = String(b.id).includes(q);
        if (!matchName && !matchCoach && !matchRoom && !matchId) return false;
      }

      // 3. Lọc theo môn thể thao
      if (selectedSport !== 'ALL') {
        const theme = getSportTheme(b.sportName, b.className, isEn);
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
  }, [bookings, activeTab, searchQuery, selectedSport, selectedDate, isEn]);

  // Phân chia danh sách vé đặt theo từng ngày tập hoàn toàn
  const groupedBookings = useMemo(() => {
    const groups = [];
    const dateMap = new Map();

    filteredBookings.forEach(b => {
      const dateKey = String(b.bookingDate || '').slice(0, 10);
      if (!dateMap.has(dateKey)) {
        const group = { date: dateKey, items: [] };
        dateMap.set(dateKey, group);
        groups.push(group);
      }
      dateMap.get(dateKey).items.push(b);
    });

    // Sắp xếp các ca trong cùng ngày theo thứ tự thời gian tăng dần (sáng -> tối)
    groups.forEach(g => {
      g.items.sort((a, b) => {
        const startA = bookingStart(a) || 0;
        const startB = bookingStart(b) || 0;
        return startA - startB;
      });
    });

    return groups;
  }, [filteredBookings]);

  const handleOpenBookingDetail = (booking) => {
    setSelectedBookingDetail(booking);
    setDetailModalOpen(true);
  };

  if (loading) {
    return <LoadingSpinner text={isEn ? "Syncing Olympic bookings & waitlist..." : "Đang đồng bộ vé đặt & danh sách chờ Olympic..."} />;
  }

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* 1. Olympic Booking Masterpiece Banner */}
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
                <span className="material-symbols-outlined text-[13px] text-brand-sand-700 dark:text-brand-sand-400">confirmation_number</span>
                OLYMPIC BOOKING MANAGEMENT
              </span>
              <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-brand-navy-900/80 backdrop-blur-md text-brand-navy-800 dark:text-brand-navy-200 border border-white/80 dark:border-white/20 text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse" />
                {stats.upcoming} {isEn ? 'upcoming sessions' : 'ca sắp diễn ra'}
              </span>
            </div>

            <h1 className="font-chivo text-2xl lg:text-3xl font-black text-white tracking-tight mt-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
              {isEn ? 'Booked Classes & Cancellation' : 'Lớp Đã Đặt & Lịch Hủy Chỗ'}
            </h1>
            <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-2xl font-medium leading-relaxed drop-shadow-xs">
              {isEn
                ? 'Track booked sessions and waitlist status in one place. Cancel at least 2 hours before class to retain your session credit; every released seat is offered to the eligible waitlist in FIFO order.'
                : 'Theo dõi ca đã đặt và danh sách chờ tại một nơi. Hủy trước giờ học ít nhất 2 giờ để bảo lưu lượt tập; mọi chỗ được giải phóng sẽ được chuyển cho hội viên đủ điều kiện theo thứ tự vào hàng chờ.'}
            </p>
          </div>

          {/* Action Buttons: Đặt Thêm Lớp & Tải Lại */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={loadBookings}
              className="p-2.5 rounded-xl bg-white hover:bg-white/95 text-brand-navy-800 hover:text-brand-teal-600 border border-white transition active:rotate-180 duration-300 shadow-md cursor-pointer"
              title={isEn ? "Reload ticket data" : "Tải lại dữ liệu vé"}
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            </button>
            <a
              href="#/member/schedule"
              className="px-4 py-2.5 bg-brand-navy-950 hover:bg-brand-navy-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg hover:shadow-xl shrink-0 border border-white/20 active:scale-95 cursor-pointer backdrop-blur-md"
            >
              <span className="material-symbols-outlined text-[18px] text-brand-sand-300">calendar_month</span>
              <span>{isEn ? 'Olympic Class Schedule' : 'Lịch Mở Lớp Rèn Luyện'}</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. KPI Summary Strip (Tương tác bấm lọc đồng bộ với ClassScheduleView) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Tổng vé đã đặt */}
        <div
          onClick={() => setActiveTab('ALL')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 hover-lift ${
            activeTab === 'ALL'
              ? 'bg-brand-navy-900/5 dark:bg-brand-navy-900/40 border-brand-navy-900 dark:border-brand-sage-500 shadow-sm ring-2 ring-brand-sage-500/30'
              : 'bg-white dark:bg-brand-navy-900 border-brand-navy-200 dark:border-brand-navy-800 hover:border-brand-navy-300'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-brand-sage-500/20 text-brand-sage-700 dark:text-brand-sage-500 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">confirmation_number</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-brand-navy-400 block tracking-wider">{isEn ? 'Total Bookings' : 'Tổng vé đặt'}</span>
            <span className="font-chivo text-lg font-black text-brand-navy-900 dark:text-white">{stats.total}</span>
          </div>
        </div>

        {/* Card 2: Ca sắp diễn ra */}
        <div
          onClick={() => setActiveTab('UPCOMING')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
            activeTab === 'UPCOMING'
              ? 'bg-brand-sage-50 border-brand-sage-400 shadow-sm ring-2 ring-brand-sage-500/20'
              : 'bg-white border-brand-navy-200 hover:border-brand-sage-300'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-brand-sage-100 text-brand-sage-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">event_upcoming</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-brand-navy-400 block tracking-wider">{isEn ? 'Upcoming' : 'Sắp diễn ra'}</span>
            <span className="font-chivo text-lg font-black text-brand-sage-800 dark:text-brand-sage-400">{stats.upcoming}</span>
          </div>
        </div>

        {/* Card 3: Danh sách chờ */}
        <div
          onClick={() => setActiveTab('WAITLIST')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
            activeTab === 'WAITLIST'
              ? 'bg-brand-sand-50 border-brand-sand-400 shadow-sm ring-2 ring-brand-sand-500/20'
              : 'bg-white border-brand-navy-200 hover:border-brand-sand-300'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-brand-sand-100 text-brand-sand-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">hourglass_top</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-brand-navy-400 block tracking-wider">{isEn ? 'Waitlist' : 'Danh sách chờ'}</span>
            <span className="font-chivo text-lg font-black text-brand-sand-800 dark:text-brand-sand-400">{stats.inWaitlist}</span>
          </div>
        </div>

        {/* Card 4: Đã hoàn thành / Lịch sử */}
        <div
          onClick={() => setActiveTab('COMPLETED')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
            activeTab === 'COMPLETED'
              ? 'bg-brand-teal-50 border-brand-teal-400 shadow-sm ring-2 ring-brand-teal-500/20'
              : 'bg-white border-brand-navy-200 hover:border-brand-teal-300'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-brand-teal-100 text-brand-teal-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">history</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-brand-navy-400 block tracking-wider">{isEn ? 'Completed' : 'Đã hoàn thành'}</span>
            <span className="font-chivo text-lg font-black text-brand-teal-900 dark:text-brand-teal-400">{stats.completed}</span>
          </div>
        </div>
      </div>

      {/* 3. Control Bar & Filter Toolbar (Đồng bộ chuẩn ClassScheduleView) */}
      <div className="bg-white p-4 rounded-2xl border border-brand-navy-200 shadow-sm space-y-4">
        {/* Row 1: Segmented Tabs & View Mode Switcher */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="inline-flex p-1 bg-brand-navy-100 rounded-xl border border-brand-navy-200/80 shrink-0 overflow-x-auto">
            {[
              { id: 'ALL', label: isEn ? 'All' : 'Tất Cả', icon: 'list', count: stats.total },
              { id: 'UPCOMING', label: isEn ? 'Upcoming' : 'Sắp Tới', icon: 'event_available', count: stats.upcoming },
              { id: 'WAITLIST', label: isEn ? 'Waitlist' : 'Hàng Chờ', icon: 'hourglass_top', count: stats.inWaitlist },
              { id: 'COMPLETED', label: isEn ? 'Completed' : 'Đã Tập', icon: 'task_alt', count: stats.completed },
              { id: 'CANCELLED', label: isEn ? 'Cancelled' : 'Đã Hủy', icon: 'cancel', count: stats.cancelled }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-brand-navy-900 shadow-xs'
                    : 'text-brand-navy-500 hover:text-brand-navy-900'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === tab.id ? 'bg-brand-navy-900 text-white' : 'bg-brand-navy-200 text-brand-navy-600'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Bộ lọc nâng cao (Tìm kiếm, Môn thể thao, Chọn ngày) */}
        {activeTab !== 'WAITLIST' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 border-t border-brand-navy-100 text-xs">
            {/* Search Input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-brand-navy-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder={isEn ? "Search class, coach, room, ticket ID..." : "Tìm tên lớp, HLV, phòng tập, mã vé..."}
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

            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-danger-600 bg-white font-medium"
              />
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  title={isEn ? "Clear date filter" : "Xóa lọc ngày"}
                  className="px-2.5 py-2 rounded-lg border border-brand-navy-300 hover:bg-brand-navy-100 text-brand-navy-600 font-bold"
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
        <div role="alert" className="p-4 bg-brand-danger-50 text-brand-danger-700 rounded-xl flex items-center justify-between border border-brand-danger-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-danger-600">error</span>
            <span className="text-xs font-bold">{error}</span>
          </div>
          <button type="button" onClick={loadBookings} className="text-xs font-black underline uppercase">
            {isEn ? 'Retry' : 'Thử lại'}
          </button>
        </div>
      )}

      {/* 4. PHẦN DANH SÁCH CHỜ (WAITLIST) NẾU TAB = WAITLIST HOẶC CÓ VÉ ĐANG CHỜ */}
      {(activeTab === 'WAITLIST' || (activeTab === 'ALL' && waitlist.length > 0)) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-sand-500 animate-pulse"></span>
              <h2 className="font-chivo text-base font-black text-brand-navy-900 tracking-tight">
                {isEn ? 'Active Waitlist' : 'Danh Sách Chờ Đang Kích Hoạt'} ({waitlist.length})
              </h2>
            </div>
            <span className="text-[11px] text-brand-navy-500 italic">
              {isEn
                ? '* Automatically upgraded to official ticket when another member cancels before class.'
                : '* Hệ thống tự động nâng lên thành vé chính thức khi có hội viên khác hủy chỗ trước giờ học.'}
            </span>
          </div>

          {waitlist.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-brand-navy-200">
              <span className="material-symbols-outlined text-4xl text-brand-navy-300">hourglass_disabled</span>
              <h3 className="font-chivo text-sm font-bold text-brand-navy-800 mt-2">
                {isEn ? 'You Have No Classes in Waitlist' : 'Bạn Hiện Không Có Ca Học Nào Trong Hàng Chờ'}
              </h3>
              <p className="text-xs text-brand-navy-500 mt-0.5">
                {isEn
                  ? 'When a session is fully booked, you can join the waitlist on the Class Schedule page.'
                  : 'Khi một ca học đã kín chỗ, bạn có thể ghi danh vào hàng chờ tại Lịch Lớp Thể Thao.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {waitlist.map(w => {
                const sportTheme = getSportTheme('', w.className, isEn);
                const isLeaving = leavingWaitlistId === w.id;

                return (
                  <div
                    key={w.id}
                    className="bg-white rounded-2xl border-2 border-brand-sand-200/80 p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-sand-400 to-brand-terra-400"></div>

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${sportTheme.badge}`}>
                            {sportTheme.tag}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-brand-sand-100 text-brand-sand-800 border border-brand-sand-200 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">hourglass_top</span>
                            <span>{isEn ? 'PENDING' : 'ĐANG CHỜ DUYỆT'}</span>
                          </span>
                        </div>
                        <h3 className="font-chivo text-base font-black text-brand-navy-900">
                          {translateClassName(w.className, isEn)}
                        </h3>
                      </div>

                      <button
                        type="button"
                        disabled={isLeaving}
                        onClick={() => handleLeaveWaitlist(w.id, w.className)}
                        className="px-3 py-1.5 rounded-lg border border-brand-danger-200 text-brand-danger-600 hover:bg-brand-danger-50 text-xs font-bold font-chivo uppercase tracking-wider transition-colors flex items-center gap-1 disabled:opacity-50 shrink-0"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                        <span>{isLeaving ? (isEn ? 'Leaving...' : 'Đang rời...') : (isEn ? 'Leave Waitlist' : 'Rời Hàng Chờ')}</span>
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-brand-navy-600 bg-brand-sand-50/60 p-3 rounded-xl border border-brand-sand-100">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-brand-sand-700 dark:text-brand-sand-400 text-[18px]">calendar_month</span>
                        <span className="font-bold">{formatMemberDate(w.sessionDate, isEn)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-brand-sand-700 dark:text-brand-sand-400 text-[18px]">schedule</span>
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
            <h2 className="font-chivo text-base font-black text-brand-navy-900 tracking-tight flex items-center gap-2">
              <span>{isEn ? 'Booked Class List' : 'Danh Sách Lớp Đặt Chỗ'}</span>
              <span className="text-xs font-bold text-brand-navy-400">({filteredBookings.length} {isEn ? 'sessions' : 'ca'})</span>
            </h2>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-brand-navy-200 max-w-xl mx-auto space-y-3">
              <div className="w-16 h-16 rounded-full bg-brand-navy-100 text-brand-navy-400 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">event_busy</span>
              </div>
              <h3 className="font-chivo text-base font-bold text-brand-navy-900">
                {searchQuery || selectedSport !== 'ALL' || selectedDate
                  ? (isEn ? 'No Bookings Match Your Filters' : 'Không Tìm Thấy Ca Đặt Chỗ Phù Hợp Bộ Lọc')
                  : (isEn ? 'You Have No Bookings Yet' : 'Bạn Chưa Có Lịch Đặt Chỗ Nào')}
              </h3>
              <p className="text-xs text-brand-navy-500 max-w-sm mx-auto">
                {searchQuery || selectedSport !== 'ALL' || selectedDate
                  ? (isEn ? 'Please adjust or clear search criteria to display your bookings.' : 'Vui lòng thử điều chỉnh hoặc xóa các tiêu chí tìm kiếm để hiển thị toàn bộ vé tập.')
                  : (isEn ? 'Explore the Olympic sports class schedule and book your favorite session with professional coaches.' : 'Khám phá ngay lịch mở lớp thể thao chuẩn Olympic và chọn ca tập yêu thích cùng HLV chuyên nghiệp.')}
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
                    className="px-4 py-2 bg-brand-navy-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-navy-800 transition-colors"
                  >
                    {isEn ? 'Clear All Filters' : 'Xóa Tất Cả Bộ Lọc'}
                  </button>
                ) : (
                  <a
                    href="#/member/schedule"
                    className="px-5 py-2.5 bg-brand-danger-600 hover:bg-brand-danger-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-colors inline-block"
                  >
                    {isEn ? 'View Schedule & Book Now' : 'Xem Lịch & Đặt Chỗ Ngay'}
                  </a>
                )}
              </div>
            </div>
          ) : (
            /* DẠNG BẢNG (TABLE VIEW) - Tối ưu cho hội viên quản lý danh sách dài */
            <div className="bg-white rounded-2xl border border-brand-navy-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-brand-navy-50 border-b border-brand-navy-200 text-brand-navy-500 font-chivo font-black uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">{isEn ? 'Ticket ID' : 'Mã Vé'}</th>
                      <th className="py-3.5 px-4">{isEn ? 'Class & Sport' : 'Lớp Học & Môn'}</th>
                      <th className="py-3.5 px-4">{isEn ? 'Session Date' : 'Ngày Tập'}</th>
                      <th className="py-3.5 px-4">{isEn ? 'Time Slot' : 'Khung Giờ'}</th>
                      <th className="py-3.5 px-4">{isEn ? 'Room / Court' : 'Phòng Tập'}</th>
                      <th className="py-3.5 px-4">{isEn ? 'Coach' : 'Huấn Luyện Viên'}</th>
                      <th className="py-3.5 px-4">{isEn ? 'Status' : 'Trạng Thái'}</th>
                      <th className="py-3.5 px-4 text-right">{isEn ? 'Action' : 'Thao Tác'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-navy-100 text-brand-navy-700">
                    {groupedBookings.map(group => {
                      const headerInfo = formatGroupHeaderDate(group.date, isEn);

                      return (
                        <React.Fragment key={group.date || 'unknown'}>
                          {/* Thanh Tiêu Đề Ngày Tập */}
                          <tr className="bg-brand-navy-100/90 dark:bg-brand-navy-800/90 border-t-2 border-b border-brand-navy-200 dark:border-brand-navy-700 sticky top-0 z-10">
                            <td colSpan={8} className="py-2.5 px-4 bg-brand-navy-100 dark:bg-brand-navy-800">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <span className="w-6 h-6 rounded-md bg-brand-teal-600/15 text-brand-teal-600 dark:bg-brand-teal-500/20 dark:text-brand-teal-500 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[15px]">calendar_today</span>
                                  </span>
                                  <span className="font-chivo font-black text-brand-navy-900 dark:text-white text-xs uppercase tracking-wide">
                                    {headerInfo.fullDate}
                                  </span>
                                  {headerInfo.relativeLabel && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                      headerInfo.isToday
                                        ? 'bg-brand-sage-100 text-brand-sage-800 dark:bg-brand-sage-950/60 dark:text-brand-sage-300 border border-brand-sage-300'
                                        : 'bg-brand-navy-200 text-brand-navy-700 dark:bg-brand-navy-700 dark:text-brand-navy-200'
                                    }`}>
                                      {headerInfo.relativeLabel}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] font-bold text-brand-navy-500 dark:text-brand-navy-400">
                                  {group.items.length} {isEn ? (group.items.length > 1 ? 'sessions' : 'session') : 'ca tập'}
                                </span>
                              </div>
                            </td>
                          </tr>

                          {/* Danh Sách Các Ca Tập Thuộc Ngày */}
                          {group.items.map(b => {
                            const sportTheme = getSportTheme(b.sportName, b.className, isEn);
                            const isUpcoming = isUpcomingBooking(b);

                            return (
                              <tr key={b.id} className="hover:bg-brand-navy-50/80 transition-colors">
                                <td className="py-3.5 px-4 font-mono font-bold text-brand-navy-400">
                                  #{b.id}
                                </td>
                                <td className="py-3.5 px-4">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenBookingDetail(b)}
                                    className="text-left font-bold text-brand-navy-900 font-chivo hover:text-brand-danger-600 transition-colors block"
                                  >
                                    {translateClassName(b.className, isEn)}
                                  </button>
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
                                <td className="py-3.5 px-4 text-brand-navy-600">
                                  {translateRoomName(b.roomName, isEn)}
                                </td>
                                <td className="py-3.5 px-4 text-brand-navy-800 font-medium">
                                  {translateCoachName(b.coachName, isEn)}
                                </td>
                                <td className="py-3.5 px-4">
                                  <Badge variant={b.status}>
                                    {b.sessionStatus === 'CANCELLED'
                                      ? (isEn ? 'Cancelled' : 'Buổi học bị hủy')
                                      : getBookingStatusLabel(b.status, isEn)}
                                  </Badge>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="inline-flex items-center gap-1.5 justify-end">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenBookingDetail(b)}
                                      title={isEn ? "View ticket details" : "Xem chi tiết vé"}
                                      className="p-1.5 rounded-lg border border-brand-navy-200 text-brand-navy-600 hover:text-brand-navy-900 hover:bg-brand-navy-100 transition-colors"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                                    </button>
                                    {currentUser?.capabilities?.includes('cancel_booking') && isUpcoming && (
                                      <button
                                        type="button"
                                        onClick={() => openCancelModal(b)}
                                        className="px-3 py-1 rounded-lg border border-brand-danger-200 text-brand-danger-600 hover:bg-brand-danger-50 text-[11px] font-bold uppercase transition-colors inline-flex items-center gap-1"
                                      >
                                        <span className="material-symbols-outlined text-[14px]">cancel</span>
                                        <span>{isEn ? 'Cancel' : 'Hủy'}</span>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Cancel Confirmation Modal (User-Centric & Anti-Slop) */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title={isEn ? "Cancel Class Booking" : "Xác nhận hủy đặt chỗ"}
        maxWidth="max-w-md"
      >
        {bookingToCancel && (() => {
          const startTime = bookingStart(bookingToCancel);
          const hasTimeInfo = !Number.isNaN(startTime);
          const isEligibleForRefund = hasTimeInfo ? (startTime - Date.now() >= 2 * 60 * 60 * 1000) : true;
          const sportTheme = getSportTheme(bookingToCancel.sportName, bookingToCancel.className, isEn);

          return (
            <div className="space-y-4">
              {/* Question heading */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-danger-50 dark:bg-brand-danger-950/40 text-brand-danger-600 dark:text-brand-danger-400 flex items-center justify-center shrink-0 border border-brand-danger-100 dark:border-brand-danger-900/50">
                  <span className="material-symbols-outlined text-[22px]">event_busy</span>
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-brand-navy-900 dark:text-white leading-snug">
                    {isEn ? 'Cancel this class session?' : 'Bạn muốn hủy lịch ca tập này?'}
                  </h4>
                  <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
                    {isEn ? 'Please check session details and refund terms below.' : 'Vui lòng kiểm tra thông tin ca tập và quyền lợi hoàn lượt bên dưới.'}
                  </p>
                </div>
              </div>

              {/* Class Info Card */}
              <div className="p-3.5 rounded-2xl bg-brand-navy-50 dark:bg-brand-navy-800/60 border border-brand-navy-200/80 dark:border-brand-navy-700/60 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-sm text-brand-navy-900 dark:text-white">
                    {translateClassName(bookingToCancel.className, isEn)}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${sportTheme.badge}`}>
                    {sportTheme.tag}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1.5 border-t border-brand-navy-200/60 dark:border-brand-navy-700/60">
                  <div className="flex items-center gap-1.5 text-brand-navy-700 dark:text-brand-navy-300">
                    <span className="material-symbols-outlined text-[16px] text-brand-navy-400">calendar_month</span>
                    <span>{formatMemberDate(bookingToCancel.bookingDate, isEn)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-brand-navy-700 dark:text-brand-navy-300">
                    <span className="material-symbols-outlined text-[16px] text-brand-navy-400">schedule</span>
                    <span className="font-mono font-semibold">{bookingToCancel.timeSlot}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-brand-navy-700 dark:text-brand-navy-300 sm:col-span-2">
                    <span className="material-symbols-outlined text-[16px] text-brand-navy-400">location_on</span>
                    <span>{translateRoomName(bookingToCancel.roomName, isEn)}</span>
                  </div>
                  {bookingToCancel.coachName && (
                    <div className="flex items-center gap-1.5 text-brand-navy-700 dark:text-brand-navy-300 sm:col-span-2">
                      <span className="material-symbols-outlined text-[16px] text-brand-navy-400">person</span>
                      <span>{translateCoachName(bookingToCancel.coachName, isEn)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Policy Callout - Clear, Dynamic & No Technical Jargon */}
              {isEligibleForRefund ? (
                <div className="p-3 rounded-2xl bg-brand-sage-50 dark:bg-brand-sage-950/30 border border-brand-sage-200 dark:border-brand-sage-800/40 flex items-start gap-2.5 text-xs text-brand-sage-900 dark:text-brand-sage-200">
                  <span className="material-symbols-outlined text-[20px] text-brand-sage-700 dark:text-brand-sage-400 shrink-0 mt-0.5">check_circle</span>
                  <div className="space-y-0.5">
                    <span className="font-bold block text-brand-sage-800 dark:text-brand-sage-300">
                      {isEn ? '1 Session Credit will be refunded' : 'Được hoàn lại 01 lượt tập'}
                    </span>
                    <p className="text-[11.5px] text-brand-sage-700 dark:text-brand-sage-300/90 leading-relaxed">
                      {isEn
                        ? 'Because you are cancelling more than 2 hours before start time, your session credit will be returned automatically and the released seat will be offered to the waitlist.'
                        : 'Do bạn hủy trước giờ học hơn 2 tiếng, 1 lượt tập sẽ được tự động hoàn lại vào gói và chỗ trống sẽ được chuyển cho danh sách chờ.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-brand-sand-50 dark:bg-brand-sand-950/30 border border-brand-sand-200 dark:border-brand-sand-800/40 flex items-start gap-2.5 text-xs text-brand-sand-900 dark:text-brand-sand-200">
                  <span className="material-symbols-outlined text-[20px] text-brand-sand-700 dark:text-brand-sand-400 shrink-0 mt-0.5">warning</span>
                  <div className="space-y-0.5">
                    <span className="font-bold block text-brand-sand-800 dark:text-brand-sand-300">
                      {isEn ? 'Session starts in less than 2 hours' : 'Ca học diễn ra trong vòng 2 giờ tới'}
                    </span>
                    <p className="text-[11.5px] text-brand-sand-700 dark:text-brand-sand-300/90 leading-relaxed">
                      {isEn
                        ? 'Late cancellation does not refund the session credit. The released seat is still offered to the first eligible waitlisted member. For medical emergencies, please visit the front desk.'
                        : 'Hủy sát giờ sẽ không được hoàn lại lượt tập, nhưng chỗ trống vẫn được chuyển cho hội viên đủ điều kiện đầu tiên trong danh sách chờ. Nếu có sự cố sức khỏe khẩn cấp, vui lòng liên hệ quầy lễ tân.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Emergency Footnote */}
              <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 leading-relaxed px-0.5">
                {isEn
                  ? '* Need emergency assistance or medical exception? Please contact the reception desk directly.'
                  : '* Cần hỗ trợ ngoại lệ khẩn cấp do sức khỏe hoặc chấn thương? Vui lòng liên hệ trực tiếp quầy lễ tân.'}
              </p>

              {/* Cancel Error Feedback */}
              {cancelError && (
                <BusinessAlert
                  type="error"
                  title={isEn ? "Cannot complete cancellation" : "Không thể hoàn tất hủy đặt chỗ"}
                  message={cancelError.message || String(cancelError)}
                  proposedHandling={
                    cancelError.proposedHandling ||
                    (isEn
                      ? "Session starts in less than 2 hours. Please contact reception directly for assistance."
                      : "Ca học đã sát giờ bắt đầu (dưới 2 tiếng). Vui lòng liên hệ trực tiếp quầy lễ tân để được kiểm tra và hỗ trợ giải quyết ngoại lệ.")
                  }
                />
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-brand-navy-100 dark:border-brand-navy-800">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  disabled={cancelling}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300 transition-colors cursor-pointer"
                >
                  {isEn ? 'Keep Session' : 'Giữ lại ca học'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={cancelling}
                  className="px-4.5 py-2 text-xs font-bold rounded-xl bg-brand-danger-600 hover:bg-brand-danger-700 text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  {cancelling ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>{isEn ? 'Cancelling...' : 'Đang xử lý...'}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">close</span>
                      <span>{isEn ? 'Confirm Cancellation' : 'Đồng ý hủy chỗ'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* 7. Modal Xem Chi Tiết Vé Đặt Chỗ Rèn Luyện */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={isEn ? "Booking Session Details" : "Chi Tiết Đặt Chỗ Rèn Luyện"}
      >
        {selectedBookingDetail && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-brand-navy-50 border border-brand-navy-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-brand-navy-400 font-bold">
                  {isEn ? 'Ticket ID: ' : 'Mã vé: '}#{selectedBookingDetail.id}
                </span>
                <Badge variant={selectedBookingDetail.status}>
                  {selectedBookingDetail.sessionStatus === 'CANCELLED'
                    ? (isEn ? 'Cancelled' : 'Buổi học bị hủy')
                    : getBookingStatusLabel(selectedBookingDetail.status, isEn)}
                </Badge>
              </div>
              <h3 className="font-chivo text-lg font-black text-brand-navy-900">
                {translateClassName(selectedBookingDetail.className, isEn)}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-xl border border-brand-navy-200">
              <div>
                <span className="text-brand-navy-400 block font-medium">{isEn ? 'Sport' : 'Bộ môn'}</span>
                <span className="font-bold text-brand-navy-900">
                  {translateSportName(selectedBookingDetail.sportName, isEn)}
                </span>
              </div>
              <div>
                <span className="text-brand-navy-400 block font-medium">{isEn ? 'Session Date' : 'Ngày rèn luyện'}</span>
                <span className="font-bold text-brand-navy-900">
                  {formatMemberDate(selectedBookingDetail.bookingDate, isEn)}
                </span>
              </div>
              <div>
                <span className="text-brand-navy-400 block font-medium">{isEn ? 'Time Slot' : 'Khung giờ'}</span>
                <span className="font-bold text-brand-navy-900">{selectedBookingDetail.timeSlot}</span>
              </div>
              <div>
                <span className="text-brand-navy-400 block font-medium">{isEn ? 'Room / Court' : 'Phòng / Sân tập'}</span>
                <span className="font-bold text-brand-navy-900">{translateRoomName(selectedBookingDetail.roomName, isEn)}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-brand-navy-100">
                <span className="text-brand-navy-400 block font-medium">{isEn ? 'Assigned Coach' : 'Huấn luyện viên phụ trách'}</span>
                <span className="font-bold text-brand-navy-900">{translateCoachName(selectedBookingDetail.coachName, isEn)}</span>
                {selectedBookingDetail.coachSpecialization && (
                  <span className="block text-[11px] text-brand-navy-500">
                    {isEn ? 'Specialization' : 'Chuyên môn'}: {selectedBookingDetail.coachSpecialization}
                  </span>
                )}
              </div>
            </div>

            {selectedBookingDetail.attendanceStatus && (
              <div className="p-3 rounded-xl bg-brand-navy-50 border border-brand-navy-200 text-xs flex items-center justify-between">
                <span className="text-brand-navy-600 font-medium">{isEn ? 'Attendance:' : 'Điểm danh:'}</span>
                <span className="font-bold text-brand-navy-900">
                  {selectedBookingDetail.attendanceStatus === 'PRESENT' ? (isEn ? 'Present' : 'Đã có mặt') :
                   selectedBookingDetail.attendanceStatus === 'LATE' ? (isEn ? 'Late' : 'Đi muộn') :
                   selectedBookingDetail.attendanceStatus === 'ABSENT' ? (isEn ? 'Absent' : 'Vắng mặt') :
                   selectedBookingDetail.attendanceStatus === 'EXCUSED' ? (isEn ? 'Excused' : 'Vắng có phép') :
                   (isEn ? 'Not recorded' : 'Chưa ghi nhận')}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center gap-3 pt-3 border-t border-brand-navy-100">
              {currentUser?.capabilities?.includes('cancel_booking') &&
                isUpcomingBooking(selectedBookingDetail) &&
                selectedBookingDetail.status === 'CONFIRMED' && (
                  <button
                    type="button"
                    onClick={() => {
                      setDetailModalOpen(false);
                      openCancelModal(selectedBookingDetail);
                    }}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-brand-danger-600 hover:bg-brand-danger-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    <span>{isEn ? 'Cancel This Booking' : 'Hủy Đặt Chỗ Này'}</span>
                  </button>
              )}
              <div className="ml-auto">
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-brand-navy-900 hover:bg-brand-navy-800 text-white shadow-xs transition-colors"
                >
                  {isEn ? 'Close' : 'Đóng'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
