import React, { useState, useEffect, useRef } from 'react';
import { receptionApi } from '../../../entities/member/index.js';
import { LoadingSpinner } from '../../../shared/ui/Table.jsx';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { useAuth } from '../../../entities/session/index.js';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { getTimeGreeting } from '../../../shared/lib/greeting.js';
import { playScannerBeep } from '../lib/scannerBeep.js';

export function ReceptionistDashboard() {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const { currentUser } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Instant front desk search / scan bar
  const [quickInput, setQuickInput] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [lastCheckInResult, setLastCheckInResult] = useState(null);
  const quickInputRef = useRef(null);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await receptionApi.getCheckInHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      if (!silent) showError(isEn ? 'Failed to fetch check-in history.' : 'Không thể tải lịch sử check-in.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData(true);
    showInfo(isEn ? 'Front desk feed refreshed.' : 'Đã làm mới dữ liệu ca trực lễ tân.');
  };

  const handleQuickCheckIn = async (e) => {
    e.preventDefault();
    const term = quickInput.trim();
    if (!term) return;

    setCheckingIn(true);
    setLastCheckInResult(null);

    try {
      const result = await receptionApi.checkInMember(term);
      playScannerBeep(true);
      showSuccess(result?.message || (isEn ? `Checked in: ${result?.member?.fullName || term}` : `Check-in thành công: ${result?.member?.fullName || term}`));
      setLastCheckInResult({
        success: true,
        message: result?.message || (isEn ? 'Check-in confirmed. Turnstile gate opened.' : 'Xác thực thành công. Cổng kiểm soát đã mở.'),
        member: result?.member,
        time: new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
      setQuickInput('');
      await loadData(true);
    } catch (err) {
      playScannerBeep(false);
      const errMsg = err?.message || (isEn ? 'Check-in failed. Please verify member pass.' : 'Check-in thất bại. Vui lòng kiểm tra lại thẻ.');
      showError(errMsg);
      setLastCheckInResult({
        success: false,
        message: errMsg,
        time: new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
    } finally {
      setCheckingIn(false);
      if (quickInputRef.current) {
        quickInputRef.current.focus();
      }
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <LoadingSpinner text={isEn ? 'Connecting to SCMS Front Desk Console...' : 'Đang kết nối bàn điều khiển Lễ tân SCMS Olympic...'} />
      </div>
    );
  }

  const greeting = getTimeGreeting(isEn);
  const staffName = currentUser?.fullName || currentUser?.name || (isEn ? 'Front Desk Officer' : 'Nhân viên Lễ tân');
  const staffCode = currentUser?.staffCode || 'DEV-RECEPTION';

  return (
    <div className="w-full space-y-6 pb-16 font-lexend max-w-[1600px] mx-auto animate-fade-slide-up transition-colors">
      {/* ─────────────────────────────────────────────────────────────
          1. OLYMPIC FRONT DESK COMMAND BANNER
      ───────────────────────────────────────────────────────────── */}
      <section
        aria-label={isEn ? 'Front Desk Shift Overview' : 'Tổng quan ca trực lễ tân'}
        className="relative rounded-3xl bg-gradient-to-r from-brand-sage-700 via-brand-teal-600 via-brand-teal-500 to-brand-sand-500 dark:from-brand-sage-900 dark:via-brand-teal-900 dark:via-brand-teal-800 dark:to-brand-sand-900 text-white p-6 sm:p-8 border border-white/30 dark:border-white/10 shadow-xl shadow-brand-teal-600/20 overflow-hidden scms-hero-static"
      >
        {/* Ambient glow (same palette as the member lookup banner); the dashboard motion layer makes it float */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-brand-sand-300/45 via-brand-sand-500/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-brand-sage-500/40 via-brand-sage-700/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-brand-teal-300/30 rounded-full blur-3xl pointer-events-none" />

        {/* Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 240">
          <path d="M-50,180 C250,50 500,220 800,90 C950,30 1050,140 1100,110" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,210 C280,80 520,250 820,120 C970,60 1060,160 1120,130" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="860" cy="60" r="110" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
        </svg>

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          {/* Shift Details & Receptionist Identity */}
          <div className="flex items-start sm:items-center gap-5 min-w-0">
            {/* VIP Desk Icon Badge with Pulse */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/95 dark:bg-brand-navy-900/90 text-brand-sage-700 dark:text-brand-sage-300 flex items-center justify-center font-black text-2xl sm:text-3xl shadow-xl border-2 border-white/80 dark:border-white/20 select-none transition-transform duration-300 hover:scale-105 hover:-rotate-3 animate-float">
                <span className="material-symbols-outlined text-[34px] sm:text-[42px]">
                  countertops
                </span>
              </div>
              <span
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-brand-sage-400 border-2 border-white dark:border-brand-navy-900 flex items-center justify-center shadow-md animate-pulse"
                title={isEn ? 'Desk Online' : 'Ca trực đang hoạt động'}
              >
                <span className="material-symbols-outlined text-[12px] text-white font-bold">check</span>
              </span>
            </div>

            {/* Shift Title & Metadata */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-brand-navy-900/90 backdrop-blur-md text-brand-sage-900 dark:text-brand-sage-300 border border-white/80 dark:border-white/20 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse" />
                  {isEn ? 'FRONT DESK CONSOLE • SHIFT 01' : 'QUẦY LỄ TÂN & ĐÓN TIẾP KHÁCH • CA 01'}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/20 text-white border border-white/40 backdrop-blur-md text-xs font-bold flex items-center gap-1.5 shadow-xs">
                  <span className="material-symbols-outlined text-[14px] text-brand-sand-200">location_on</span>
                  <span>{isEn ? 'Olympic Center HCM' : 'Cơ sở TP.HCM (Olympic Arena)'}</span>
                </span>
              </div>

              <h1 className="font-chivo text-2xl md:text-3xl font-black text-white mt-2 tracking-tight leading-tight break-words drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
                {greeting}, {staffName}!
              </h1>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs mt-2.5">
                {/* Staff Code Pill */}
                <span className="flex items-center gap-1.5 bg-white/90 dark:bg-brand-navy-900/90 px-3 py-1 rounded-xl border border-white/80 dark:border-white/20 text-brand-navy-800 dark:text-brand-navy-100 font-mono shadow-xs backdrop-blur-md">
                  <span className="material-symbols-outlined text-[15px] text-brand-teal-700 dark:text-brand-teal-400">badge</span>
                  <span>{isEn ? 'Staff ID' : 'Mã NV'}: <strong className="text-brand-navy-950 dark:text-white font-black">{staffCode}</strong></span>
                </span>

                {/* Turnstile Status */}
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/90 dark:bg-brand-navy-900/90 backdrop-blur-md text-brand-teal-700 dark:text-brand-teal-300 font-bold border border-white/80 dark:border-white/20 shadow-xs">
                  <span className="material-symbols-outlined text-[15px] text-brand-sage-700 dark:text-brand-sage-400">door_sensor</span>
                  <span>{isEn ? 'Turnstile Gate: Online' : 'Cửa xoay Barrier: Sẵn sàng'}</span>
                </span>

                {/* Today's Date */}
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 dark:bg-brand-navy-900/80 backdrop-blur-md text-brand-navy-800 dark:text-brand-navy-200 shadow-xs font-medium border border-white/70 dark:border-white/20">
                  <span className="material-symbols-outlined text-[15px] text-brand-navy-500">today</span>
                  <span>{new Date().toLocaleDateString(isEn ? 'en-US' : 'vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Top Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 xl:pt-0">
            {/* Primary Action: Launch Camera Scanner (dark button, as on the member lookup banner) */}
            <a
              href="#/receptionist/check-in"
              className="scms-shine px-5 py-3 rounded-xl bg-brand-navy-950 hover:bg-brand-navy-900 text-white font-chivo font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 active:scale-95 cursor-pointer group"
            >
              <span className="material-symbols-outlined text-[18px] text-brand-sand-300 group-hover:rotate-12 transition-transform">qr_code_scanner</span>
              <span>{isEn ? 'Gate Scanner Mode' : 'Check-in Vào Sân'}</span>
            </a>

            {/* Counter Register / Cashier CTA */}
            <a
              href="#/receptionist/counter-register"
              className="scms-shine px-5 py-3 rounded-xl bg-white/90 hover:bg-white text-brand-navy-950 font-chivo font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 active:scale-95 cursor-pointer group"
            >
              <span className="material-symbols-outlined text-[18px] text-brand-sage-700 group-hover:scale-110 transition-transform">point_of_sale</span>
              <span>{isEn ? 'Counter Cashier' : 'Thu Ngân / Gia Hạn'}</span>
            </a>

            {/* Sync & Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label={isEn ? 'Refresh Desk Data' : 'Làm mới ca trực'}
              className={`p-3 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/30 transition shadow-md cursor-pointer ${
                isRefreshing ? 'animate-spin' : 'hover:rotate-90 active:scale-95'
              }`}
              title={isEn ? 'Refresh Desk Data' : 'Làm mới ca trực'}
            >
              <span className="material-symbols-outlined text-[18px]">sync</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. CORE BENTO TELEMETRY CARDS (4 Operational Cards)
      ───────────────────────────────────────────────────────────── */}
      <section aria-label={isEn ? 'Front Desk Metrics' : 'Chỉ số ca trực'} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Check-in Count */}
        <div className="animate-fade-slide-up stagger-1 bg-white dark:bg-brand-navy-900 rounded-3xl p-5 border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-xs hover:border-brand-sage-500/50 dark:hover:border-brand-sage-500/40 transition hover-lift flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-sage-700 dark:text-brand-sage-400">
                {isEn ? 'Check-ins Today' : 'Lượt Check-in Hôm Nay'}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-brand-sage-50 dark:bg-brand-sage-950/50 text-brand-sage-700 dark:text-brand-sage-400 border border-brand-sage-100 dark:border-brand-sage-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">fact_check</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-3xl font-black text-brand-navy-900 dark:text-white tabular-nums">
                {history.length}
              </span>
              <span className="text-xs font-semibold text-brand-navy-500 dark:text-brand-navy-400">
                {isEn ? 'members admitted' : 'lượt quét thành công'}
              </span>
            </div>
            <p className="mt-1.5 text-[11.5px] text-brand-sage-700 dark:text-brand-sage-400 flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-sage-500 animate-pulse" />
              <span>{isEn ? 'Live verification active' : 'Đang xác thực liên tục'}</span>
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-brand-navy-100 dark:border-brand-navy-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-brand-navy-400">
              {isEn ? 'Turnstile scanner' : 'Cổng kiểm soát'}
            </span>
            <a href="#/receptionist/check-in" className="text-brand-sage-700 dark:text-brand-sage-400 font-extrabold hover:underline flex items-center gap-0.5">
              <span>{isEn ? 'Launch' : 'Mở máy quét'}</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </a>
          </div>
        </div>

        {/* Card 2: Desk Turnstile Status */}
        <div className="animate-fade-slide-up stagger-2 bg-white dark:bg-brand-navy-900 rounded-3xl p-5 border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-xs hover:border-brand-teal-500/50 dark:hover:border-brand-teal-500/40 transition hover-lift flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-teal-700 dark:text-brand-teal-400">
                {isEn ? 'Gate Turnstile' : 'Trạng Thái Cổng'}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-brand-teal-50 dark:bg-brand-teal-950/50 text-brand-teal-700 dark:text-brand-teal-400 border border-brand-teal-100 dark:border-brand-teal-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">door_sliding</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-xl 2xl:text-2xl font-black text-brand-navy-900 dark:text-white tracking-tight whitespace-nowrap">
                {isEn ? 'ACTIVE' : 'HOẠT ĐỘNG'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-brand-sage-50 dark:bg-brand-sage-950/50 text-brand-sage-700 dark:text-brand-sage-300 border border-brand-sage-300 dark:border-brand-sage-700 text-[10px] font-black uppercase tracking-wider">
                ONLINE
              </span>
            </div>
            <p className="mt-1.5 text-[11.5px] text-brand-navy-600 dark:text-brand-navy-400 truncate">
              {isEn ? 'Optical barrier ready for passes' : 'Cổng xoay barrier quang học sẵn sàng'}
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-brand-navy-100 dark:border-brand-navy-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-brand-navy-400">
              {isEn ? 'Validity Rate' : 'Tỷ lệ hợp lệ: 100%'}
            </span>
            <a href="#/receptionist/check-in" className="text-brand-teal-700 dark:text-brand-teal-400 font-extrabold hover:underline flex items-center gap-0.5">
              <span>{isEn ? 'Gate details' : 'Chi tiết cổng'}</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </a>
          </div>
        </div>

        {/* Card 3: Counter Cashier & Billing */}
        <div className="animate-fade-slide-up stagger-3 bg-white dark:bg-brand-navy-900 rounded-3xl p-5 border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-xs hover:border-brand-sand-500/50 dark:hover:border-brand-sand-500/40 transition hover-lift flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-sand-700 dark:text-brand-sand-400">
                {isEn ? 'Cashier & POS' : 'Quầy Thu Ngân'}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-brand-sand-50 dark:bg-brand-sand-950/50 text-brand-sand-700 dark:text-brand-sand-400 border border-brand-sand-100 dark:border-brand-sand-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">point_of_sale</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-xl 2xl:text-2xl font-black text-brand-navy-900 dark:text-white tracking-tight whitespace-nowrap">
                {isEn ? 'SẴN SÀNG' : 'SẴN SÀNG'}
              </span>
              <span className="text-xs font-semibold text-brand-navy-500 dark:text-brand-navy-400">
                {isEn ? 'VNPay / POS / Cash' : 'Tiền mặt & VNPay'}
              </span>
            </div>
            <p className="mt-1.5 text-[11.5px] text-brand-navy-600 dark:text-brand-navy-400 truncate">
              {isEn ? 'Issue on-spot packages & invoices' : 'Gia hạn gói & phát hành hóa đơn tại quầy'}
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-brand-navy-100 dark:border-brand-navy-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-brand-navy-400">
              {isEn ? 'Billing Desk' : 'Quản lý hóa đơn'}
            </span>
            <a href="#/receptionist/invoices" className="text-brand-sand-700 dark:text-brand-sand-400 font-extrabold hover:underline flex items-center gap-0.5">
              <span>{isEn ? 'Invoices' : 'Xem hóa đơn'}</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </a>
          </div>
        </div>

        {/* Card 4: Support & Member Inquiries */}
        <div className="animate-fade-slide-up stagger-4 bg-white dark:bg-brand-navy-900 rounded-3xl p-5 border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-xs hover:border-brand-navy-700/50 dark:hover:border-brand-navy-500/40 transition hover-lift flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-navy-800 dark:text-brand-navy-400">
                {isEn ? 'Guest Inquiries' : 'Tiếp Nhận Hỗ Trợ'}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-brand-navy-50 dark:bg-brand-navy-950/50 text-brand-navy-700 dark:text-brand-navy-400 border border-brand-navy-100 dark:border-brand-navy-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">support_agent</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-xl 2xl:text-2xl font-black text-brand-navy-900 dark:text-white tracking-tight whitespace-nowrap">
                {isEn ? 'DESK READY' : 'BÀN TIẾP ĐÓN'}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-navy-50 dark:bg-brand-navy-950/50 text-brand-navy-800 dark:text-brand-navy-300 border border-brand-navy-200/80 dark:border-brand-navy-800/50">
                24/7
              </span>
            </div>
            <p className="mt-1.5 text-[11.5px] text-brand-navy-600 dark:text-brand-navy-400 truncate">
              {isEn ? 'Process tickets & guest requests' : 'Hỗ trợ thành viên & xử lý đơn từ'}
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-brand-navy-100 dark:border-brand-navy-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-brand-navy-400">
              {isEn ? 'Support Desk' : 'Bàn dịch vụ khách hàng'}
            </span>
            <a href="#/receptionist/support" className="text-brand-navy-800 dark:text-brand-navy-400 font-extrabold hover:underline flex items-center gap-0.5">
              <span>{isEn ? 'Support' : 'Tiếp nhận đơn'}</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </a>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN ASYMMETRICAL WORKSPACE (5 Cols Actions / 7 Cols Live Monitor)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ═════════════════════════════════════════════════════════════
            LEFT STREAM (5 COLS): 5 HIGH-VALUE DESK OPERATIONS
        ═════════════════════════════════════════════════════════════ */}
        <div className="animate-fade-slide-up stagger-5 lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-brand-teal-700 dark:text-brand-teal-400">tune</span>
              {isEn ? 'Front Desk Operations' : 'Nghiệp vụ quầy lễ tân'}
            </h2>
            <span className="text-[11px] text-brand-navy-400 font-medium">
              5 {isEn ? 'action centers' : 'nghiệp vụ chính'}
            </span>
          </div>

          {/* Action 1: Check-in Turnstile Scanner */}
          <a
            href="#/receptionist/check-in"
            className="p-5 rounded-3xl bg-white dark:bg-brand-navy-900 border border-brand-navy-200/80 dark:border-brand-navy-800 hover:border-brand-sage-500/50 dark:hover:border-brand-sage-500/40 hover:shadow-md hover-lift transition-all flex items-start gap-4 block group"
          >
            <div className="w-12 h-12 rounded-2xl bg-brand-sage-50 dark:bg-brand-sage-950/50 text-brand-teal-700 dark:text-brand-sage-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-brand-teal-700 group-hover:text-white transition-all shadow-xs border border-brand-sage-200/60 dark:border-brand-sage-800/40">
              <span className="material-symbols-outlined text-[26px]">qr_code_scanner</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-chivo text-sm font-extrabold text-brand-navy-900 dark:text-white group-hover:text-brand-teal-700 dark:group-hover:text-brand-sage-400 transition-colors">
                  {isEn ? 'Gate Check-in Scanner' : 'Check-in Cổng Quét Thẻ'}
                </h3>
                <span className="material-symbols-outlined text-[16px] text-brand-navy-400 group-hover:text-brand-teal-700 dark:group-hover:text-brand-sage-400 group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </div>
              <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-1 leading-relaxed">
                {isEn
                  ? 'Scan member QR, RFID card, validate active subscriptions, and trigger automatic gate opening.'
                  : 'Xác thực QR trên điện thoại, thẻ từ RFID, cảnh báo thẻ hết hạn và mở cổng kiểm soát tự động.'}
              </p>
            </div>
          </a>

          {/* Action 2: Member Lookup */}
          <a
            href="#/receptionist/lookup"
            className="p-5 rounded-3xl bg-white dark:bg-brand-navy-900 border border-brand-navy-200/80 dark:border-brand-navy-800 hover:border-brand-navy-700/50 dark:hover:border-brand-navy-500/40 hover:shadow-md hover-lift transition-all flex items-start gap-4 block group"
          >
            <div className="w-12 h-12 rounded-2xl bg-brand-navy-50 dark:bg-brand-navy-950/50 text-brand-navy-700 dark:text-brand-navy-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-brand-navy-700 group-hover:text-white transition-all shadow-xs border border-brand-navy-200/60 dark:border-brand-navy-800/40">
              <span className="material-symbols-outlined text-[26px]">person_search</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-chivo text-sm font-extrabold text-brand-navy-900 dark:text-white group-hover:text-brand-navy-700 dark:group-hover:text-brand-navy-400 transition-colors">
                  {isEn ? 'Member Profile Lookup' : 'Tra Cứu Hồ Sơ Hội Viên'}
                </h3>
                <span className="material-symbols-outlined text-[16px] text-brand-navy-400 group-hover:text-brand-navy-700 dark:group-hover:text-brand-navy-400 group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </div>
              <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-1 leading-relaxed">
                {isEn
                  ? 'Quickly look up by phone number, member code, email, check current package validity and history.'
                  : 'Tra cứu nhanh số điện thoại, mã thẻ, email, thời hạn gói tập và lịch sử tham gia lớp học.'}
              </p>
            </div>
          </a>

          {/* Action 3: Package Registration & Renewal */}
          <a
            href="#/receptionist/counter-register"
            className="p-5 rounded-3xl bg-white dark:bg-brand-navy-900 border border-brand-navy-200/80 dark:border-brand-navy-800 hover:border-brand-sand-500/50 dark:hover:border-brand-sand-500/40 hover:shadow-md hover-lift transition-all flex items-start gap-4 block group"
          >
            <div className="w-12 h-12 rounded-2xl bg-brand-sand-50 dark:bg-brand-sand-950/50 text-brand-sand-700 dark:text-brand-sand-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-brand-sand-500 group-hover:text-brand-navy-950 transition-all shadow-xs border border-brand-sand-200/60 dark:border-brand-sand-800/40">
              <span className="material-symbols-outlined text-[26px]">point_of_sale</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-chivo text-sm font-extrabold text-brand-navy-900 dark:text-white group-hover:text-brand-sand-700 dark:group-hover:text-brand-sand-400 transition-colors">
                  {isEn ? 'Counter Package Renewal' : 'Gia Hạn & Đăng Ký Gói Tại Quầy'}
                </h3>
                <span className="material-symbols-outlined text-[16px] text-brand-navy-400 group-hover:text-brand-sand-700 dark:group-hover:text-brand-sand-400 group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </div>
              <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-1 leading-relaxed">
                {isEn
                  ? 'Sign up new memberships, renew expired passes, accept cash or trigger on-screen VNPay QR.'
                  : 'Đăng ký gói tập mới, gia hạn thẻ, thu tiền mặt, quẹt POS hoặc tạo mã thanh toán VNPay tại quầy.'}
              </p>
            </div>
          </a>

          {/* Action 4: Counter Booking & Class Management */}
          <a
            href="#/receptionist/bookings"
            className="p-5 rounded-3xl bg-white dark:bg-brand-navy-900 border border-brand-navy-200/80 dark:border-brand-navy-800 hover:border-brand-teal-500/50 dark:hover:border-brand-teal-500/40 hover:shadow-md hover-lift transition-all flex items-start gap-4 block group"
          >
            <div className="w-12 h-12 rounded-2xl bg-brand-teal-50 dark:bg-brand-teal-950/50 text-brand-teal-700 dark:text-brand-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-brand-teal-600 group-hover:text-white transition-all shadow-xs border border-brand-teal-200/60 dark:border-brand-teal-800/40">
              <span className="material-symbols-outlined text-[26px]">calendar_month</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-chivo text-sm font-extrabold text-brand-navy-900 dark:text-white group-hover:text-brand-teal-700 dark:group-hover:text-brand-teal-400 transition-colors">
                  {isEn ? 'Counter Booking & Changes' : 'Đặt Chỗ & Hủy Ca Tại Quầy'}
                </h3>
                <span className="material-symbols-outlined text-[16px] text-brand-navy-400 group-hover:text-brand-teal-700 dark:group-hover:text-brand-teal-400 group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </div>
              <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-1 leading-relaxed">
                {isEn
                  ? 'Assist walk-in members to book workout sessions, reschedule classes, or handle cancellations.'
                  : 'Hỗ trợ khách hàng đặt lịch lớp học bộ môn, xếp chỗ vào ca tập hoặc hủy lịch trực tiếp.'}
              </p>
            </div>
          </a>

          {/* Action 5: Support Requests */}
          <a
            href="#/receptionist/support"
            className="p-5 rounded-3xl bg-white dark:bg-brand-navy-900 border border-brand-navy-200/80 dark:border-brand-navy-800 hover:border-brand-teal-500/50 dark:hover:border-brand-teal-500/40 hover:shadow-md hover-lift transition-all flex items-start gap-4 block group"
          >
            <div className="w-12 h-12 rounded-2xl bg-brand-teal-50 dark:bg-brand-teal-950/50 text-brand-teal-700 dark:text-brand-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-brand-teal-600 group-hover:text-white transition-all shadow-xs border border-brand-teal-200/60 dark:border-brand-teal-800/40">
              <span className="material-symbols-outlined text-[26px]">support_agent</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-chivo text-sm font-extrabold text-brand-navy-900 dark:text-white group-hover:text-brand-teal-700 dark:group-hover:text-brand-teal-400 transition-colors">
                  {isEn ? 'Guest Inquiries & Support' : 'Tiếp Nhận Đơn Từ & Hỗ Trợ'}
                </h3>
                <span className="material-symbols-outlined text-[16px] text-brand-navy-400 group-hover:text-brand-teal-700 dark:group-hover:text-brand-teal-400 group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </div>
              <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-1 leading-relaxed">
                {isEn
                  ? 'Receive member complaints, feedback, locker issues, or general front desk support tickets.'
                  : 'Tiếp nhận phản ánh dịch vụ, sự cố tủ đồ cá nhân và xử lý phiếu hỗ trợ hội viên.'}
              </p>
            </div>
          </a>
        </div>

        {/* ═════════════════════════════════════════════════════════════
            RIGHT STREAM (7 COLS): LIVE TURNSTILE MONITOR & QUICK SCAN
        ═════════════════════════════════════════════════════════════ */}
        <div className="animate-fade-slide-up stagger-6 lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-brand-navy-900 p-6 rounded-3xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-xs space-y-5 hover-lift transition-all">
            {/* Monitor Header */}
            <div className="flex items-center justify-between pb-4 border-b border-brand-navy-100 dark:border-brand-navy-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-sage-50 dark:bg-brand-sage-950/60 text-brand-teal-700 dark:text-brand-sage-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">sensors</span>
                </div>
                <div>
                  <h2 className="font-chivo text-sm font-extrabold text-brand-navy-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-sage-500 animate-pulse" />
                    {isEn ? 'Live Gate Turnstile Monitor' : 'Màn Hình Giám Sát Cổng Vào Thời Gian Thực'}
                  </h2>
                  <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400">
                    {isEn ? 'Automatic check-in events & quick barcode verification' : 'Sự kiện vào sân tự động & xác thực thẻ trực tiếp tại bàn'}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300 font-mono text-xs font-bold">
                {history.length} {isEn ? 'scans' : 'lượt'}
              </span>
            </div>

            {/* Instant Front Desk Fast-CheckIn Bar */}
            <form onSubmit={handleQuickCheckIn} className="space-y-2">
              <label htmlFor="front-desk-quick-checkin" className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300">
                {isEn ? '⚡ Instant Counter Verification (Barcode / ID / Phone)' : '⚡ Xác Thực Nhanh Tại Bàn (Quét mã vạch / Mã thẻ / SĐT)'}
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-navy-400 text-[20px]">
                    barcode_scanner
                  </span>
                  <input
                    id="front-desk-quick-checkin"
                    ref={quickInputRef}
                    type="text"
                    value={quickInput}
                    onChange={(e) => setQuickInput(e.target.value)}
                    placeholder={isEn ? 'Enter card code (MEM-00001), phone or scan barcode...' : 'Nhập mã thẻ (MEM-00001), số điện thoại hoặc dùng máy quét barcode...'}
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-brand-navy-300 dark:border-brand-navy-700 bg-brand-navy-50/70 dark:bg-brand-navy-800/80 text-brand-navy-900 dark:text-white placeholder-brand-navy-400 focus:outline-none focus:ring-2 focus:ring-brand-sage-500 focus:border-transparent transition"
                  />
                  {quickInput && (
                    <button
                      type="button"
                      onClick={() => setQuickInput('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-navy-400 hover:text-brand-navy-600 dark:hover:text-brand-navy-200"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={checkingIn || !quickInput.trim()}
                  className="px-4.5 py-2.5 rounded-2xl bg-brand-teal-700 hover:bg-brand-teal-600 disabled:opacity-50 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                >
                  {checkingIn ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{isEn ? 'Checking...' : 'Đang xử lý...'}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[17px]">how_to_reg</span>
                      <span>{isEn ? 'Verify Entry' : 'Xác Thực'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Instant Feedback Callout if verified */}
            {lastCheckInResult && (
              <div
                className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 animate-fade-slide-up ${
                  lastCheckInResult.success
                    ? 'bg-brand-sage-50 dark:bg-brand-sage-950/40 border-brand-sage-200 dark:border-brand-sage-800 text-brand-sage-900 dark:text-brand-sage-200'
                    : 'bg-brand-danger-50 dark:bg-brand-danger-950/40 border-brand-danger-200 dark:border-brand-danger-800 text-brand-danger-900 dark:text-brand-danger-200'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">
                  {lastCheckInResult.success ? 'check_circle' : 'error'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-extrabold text-sm">
                      {lastCheckInResult.success
                        ? (isEn ? 'Admitted Successfully' : 'Đã Xác Thực Vào Sân Thành Công')
                        : (isEn ? 'Admission Rejected' : 'Từ Chối Vào Cổng')}
                    </p>
                    <span className="text-[11px] font-mono opacity-80">{lastCheckInResult.time}</span>
                  </div>
                  <p className="mt-0.5 text-xs opacity-95">{lastCheckInResult.message}</p>
                  {lastCheckInResult.member && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-[11px]">
                      <span>{lastCheckInResult.member.fullName}</span>
                      <span>•</span>
                      <span>{lastCheckInResult.member.memberCode}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Feed List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-brand-navy-400 font-bold uppercase tracking-wider px-1">
                <span>{isEn ? 'Recent Turnstile Events' : 'Danh sách lượt vào gần nhất'}</span>
                <span>{isEn ? 'Admit Status' : 'Trạng thái'}</span>
              </div>

              {history.length === 0 ? (
                /* High-End Empty State */
                <div className="text-center py-10 px-4 bg-brand-navy-50 dark:bg-brand-navy-800/40 rounded-3xl border border-dashed border-brand-navy-200 dark:border-brand-navy-700/80 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-brand-teal-50 dark:bg-brand-teal-950/50 text-brand-teal-700 dark:text-brand-teal-400 mx-auto flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-3xl">sensor_door</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-brand-navy-800 dark:text-brand-navy-200">
                      {isEn ? 'No check-ins recorded in this shift yet' : 'Chưa có lượt quét thẻ nào trong ca trực hôm nay'}
                    </h3>
                    <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 max-w-sm mx-auto mt-1">
                      {isEn
                        ? 'Scan member cards using the instant box above or launch fullscreen turnstile camera mode.'
                        : 'Sử dụng thanh quét nhanh phía trên hoặc mở giao diện quét camera toàn màn hình khi đón tiếp hội viên.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-brand-navy-100 dark:divide-brand-navy-800 max-h-[360px] overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-4 group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-brand-sage-50 dark:bg-brand-sage-950/50 text-brand-sage-700 dark:text-brand-sage-400 flex items-center justify-center shrink-0 font-chivo font-black text-xs border border-brand-sage-200 dark:border-brand-sage-800 shadow-2xs group-hover:scale-105 transition-transform">
                          OK
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs sm:text-sm text-brand-navy-900 dark:text-white truncate">
                            {item.memberName}
                          </h4>
                          <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 truncate mt-0.5">
                            {isEn ? 'Card' : 'Mã thẻ'}: <strong className="font-mono text-brand-navy-800 dark:text-brand-navy-200">{item.memberCode}</strong> • {item.packageName}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-brand-navy-700 dark:text-brand-navy-300 block">{item.checkInTime}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-brand-sage-700 dark:text-brand-sage-300 font-extrabold uppercase px-2 py-0.5 rounded-full bg-brand-sage-50 dark:bg-brand-sage-950/50 border border-brand-sage-200 dark:border-brand-sage-800/40 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-sage-500" />
                          {item.note === 'Hợp lệ' ? (isEn ? 'Valid' : 'Hợp lệ') : item.note}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Launch Fullscreen Mode CTA */}
            <div className="pt-2">
              <a
                href="#/receptionist/check-in"
                className="w-full py-3 bg-brand-navy-100 hover:bg-brand-navy-200 dark:bg-brand-navy-800 dark:hover:bg-brand-navy-700 text-brand-navy-800 dark:text-brand-navy-100 font-chivo text-xs font-black uppercase tracking-wider rounded-2xl text-center transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs hover-lift"
              >
                <span className="material-symbols-outlined text-[18px]">fullscreen</span>
                <span>{isEn ? 'Open Fullscreen Turnstile Scanner Console' : 'Mở Giao Diện Quét Thẻ Toàn Màn Hình'}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
