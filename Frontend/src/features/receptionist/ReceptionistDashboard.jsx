import { vietnamDateTimeInput } from '../../utils/dateTime.js';
import React, { useState, useEffect, useRef } from 'react';
import { receptionApi } from '../../services/api.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

/**
 * Plays a friendly front-desk POS chime using Web Audio API.
 */
function playScannerBeep(isSuccess = true) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (isSuccess) {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    } else {
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.setValueAtTime(240, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // Audio context may be restricted by autoplay policy
  }
}

// Time-based polite greeting
function getTimeGreeting(isEn = false) {
  const hour = Number(vietnamDateTimeInput().slice(11, 13));
  if (hour >= 5 && hour < 12) return isEn ? 'Good morning' : 'Chào buổi sáng';
  if (hour >= 12 && hour < 18) return isEn ? 'Good afternoon' : 'Chào buổi chiều';
  return isEn ? 'Good evening' : 'Chào buổi tối';
}

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
        className="relative rounded-3xl bg-gradient-to-r from-[#164E63] via-[#0D9488] to-[#047857] dark:from-[#0B2530] dark:via-[#093630] dark:to-[#04241B] text-white p-6 sm:p-8 border border-teal-300/30 dark:border-white/10 shadow-xl shadow-teal-950/20 overflow-hidden"
      >
        {/* Ambient energy orbs */}
        <div className="absolute -top-24 -right-24 w-88 h-88 bg-gradient-to-br from-amber-400/20 to-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-88 h-88 bg-gradient-to-tr from-emerald-400/25 to-teal-300/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-40 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 240">
          <path d="M-50,180 C250,50 500,220 800,90 C950,30 1050,140 1100,110" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,210 C280,80 520,250 820,120 C970,60 1060,160 1120,130" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="860" cy="60" r="100" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
        </svg>

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          {/* Shift Details & Receptionist Identity */}
          <div className="flex items-start sm:items-center gap-5 min-w-0">
            {/* VIP Desk Icon Badge with Pulse */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/95 dark:bg-slate-900/90 text-[#0F766E] dark:text-teal-400 flex items-center justify-center font-black text-2xl sm:text-3xl shadow-xl border-2 border-white/80 dark:border-white/20 select-none transition-transform duration-300 hover:scale-105">
                <span className="material-symbols-outlined text-[34px] sm:text-[42px] bg-gradient-to-tr from-[#0F766E] via-[#0D9488] to-[#F59E0B] bg-clip-text text-transparent">
                  countertops
                </span>
              </div>
              <span
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-md animate-pulse"
                title={isEn ? 'Desk Online' : 'Ca trực đang hoạt động'}
              >
                <span className="material-symbols-outlined text-[12px] text-white font-bold">check</span>
              </span>
            </div>

            {/* Shift Title & Metadata */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[#0F766E] dark:text-teal-300 border border-white/80 dark:border-white/20 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {isEn ? 'FRONT DESK CONSOLE • SHIFT 01' : 'QUẦY LỄ TÂN & ĐÓN TIẾP KHÁCH • CA 01'}
                </span>
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 backdrop-blur-md text-[11px] font-bold flex items-center gap-1.5 shadow-xs">
                  <span className="material-symbols-outlined text-[13px] text-amber-300">location_on</span>
                  <span>{isEn ? 'Olympic Center HCM' : 'Cơ sở TP.HCM (Olympic Arena)'}</span>
                </span>
              </div>

              <h1 className="font-chivo text-2xl sm:text-3xl font-black text-white mt-1.5 tracking-tight truncate drop-shadow-sm">
                {greeting}, {staffName}!
              </h1>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs mt-2.5">
                {/* Staff Code Pill */}
                <span className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 px-3 py-1 rounded-xl border border-white/80 dark:border-white/20 text-slate-800 dark:text-slate-100 font-mono shadow-xs backdrop-blur-md">
                  <span className="material-symbols-outlined text-[15px] text-[#0F766E]">badge</span>
                  <span>{isEn ? 'Staff ID' : 'Mã NV'}: <strong className="text-slate-950 dark:text-white font-black">{staffCode}</strong></span>
                </span>

                {/* Turnstile Status */}
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[#0F766E] dark:text-teal-300 font-bold border border-white/80 dark:border-white/20 shadow-xs">
                  <span className="material-symbols-outlined text-[15px] text-emerald-500">door_sensor</span>
                  <span>{isEn ? 'Turnstile Gate: Online' : 'Cửa xoay Barrier: Sẵn sàng'}</span>
                </span>

                {/* Today's Date */}
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-800 dark:text-slate-200 shadow-xs font-medium border border-white/70 dark:border-white/20">
                  <span className="material-symbols-outlined text-[15px] text-slate-500">today</span>
                  <span>{new Date().toLocaleDateString(isEn ? 'en-US' : 'vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Top Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 xl:pt-0">
            {/* Primary Action: Launch Camera Scanner */}
            <a
              href="#/receptionist/check-in"
              className="px-4.5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 active:scale-95 cursor-pointer border border-emerald-300/50 group"
            >
              <div className="w-6 h-6 rounded-lg bg-slate-950 text-emerald-300 flex items-center justify-center group-hover:rotate-6 transition-transform">
                <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
              </div>
              <span>{isEn ? 'Gate Scanner Mode' : 'Check-in Vào Sân'}</span>
            </a>

            {/* Counter Register / Cashier CTA */}
            <a
              href="#/receptionist/counter-register"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-1.5 active:scale-95 cursor-pointer border border-amber-300/40"
            >
              <span className="material-symbols-outlined text-[17px]">point_of_sale</span>
              <span>{isEn ? 'Counter Cashier' : 'Thu Ngân / Gia Hạn'}</span>
            </a>

            {/* Sync & Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition shadow-md cursor-pointer ${
                isRefreshing ? 'animate-spin' : 'hover:scale-105 active:scale-95'
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
      <section aria-label={isEn ? 'Front Desk Metrics' : 'Chỉ số ca trực'} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-slide-up">
        {/* Card 1: Check-in Count */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 dark:hover:border-emerald-500/40 transition hover-lift flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                {isEn ? 'Check-ins Today' : 'Lượt Check-in Hôm Nay'}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">fact_check</span>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                {history.length}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {isEn ? 'members admitted' : 'lượt quét thành công'}
              </span>
            </div>
            <p className="mt-1.5 text-[11.5px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isEn ? 'Live verification active' : 'Đang xác thực liên tục'}</span>
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">
              {isEn ? 'Turnstile scanner' : 'Cổng kiểm soát'}
            </span>
            <a href="#/receptionist/check-in" className="text-emerald-700 dark:text-emerald-400 font-extrabold hover:underline flex items-center gap-0.5">
              <span>{isEn ? 'Launch' : 'Mở máy quét'}</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </a>
          </div>
        </div>

        {/* Card 2: Desk Turnstile Status */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-teal-500/50 dark:hover:border-teal-500/40 transition hover-lift flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                {isEn ? 'Gate Turnstile' : 'Trạng Thái Cổng'}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">door_sliding</span>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isEn ? 'ACTIVE' : 'HOẠT ĐỘNG'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-[10px] font-black uppercase tracking-wider">
                ONLINE
              </span>
            </div>
            <p className="mt-1.5 text-[11.5px] text-slate-600 dark:text-slate-400 truncate">
              {isEn ? 'Optical barrier ready for passes' : 'Cổng xoay barrier quang học sẵn sàng'}
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">
              {isEn ? 'Validity Rate' : 'Tỷ lệ hợp lệ: 100%'}
            </span>
            <a href="#/receptionist/check-in" className="text-teal-700 dark:text-teal-400 font-extrabold hover:underline flex items-center gap-0.5">
              <span>{isEn ? 'Gate details' : 'Chi tiết cổng'}</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </a>
          </div>
        </div>

        {/* Card 3: Counter Cashier & Billing */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-amber-500/50 dark:hover:border-amber-500/40 transition hover-lift flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                {isEn ? 'Cashier & POS' : 'Quầy Thu Ngân'}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">point_of_sale</span>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isEn ? 'SẴN SÀNG' : 'SẴN SÀNG'}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {isEn ? 'VNPay / POS / Cash' : 'Tiền mặt & VNPay'}
              </span>
            </div>
            <p className="mt-1.5 text-[11.5px] text-slate-600 dark:text-slate-400 truncate">
              {isEn ? 'Issue on-spot packages & invoices' : 'Gia hạn gói & phát hành hóa đơn tại quầy'}
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">
              {isEn ? 'Billing Desk' : 'Quản lý hóa đơn'}
            </span>
            <a href="#/receptionist/invoices" className="text-amber-700 dark:text-amber-400 font-extrabold hover:underline flex items-center gap-0.5">
              <span>{isEn ? 'Invoices' : 'Xem hóa đơn'}</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </a>
          </div>
        </div>

        {/* Card 4: Support & Member Inquiries */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-500/50 dark:hover:border-indigo-500/40 transition hover-lift flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                {isEn ? 'Guest Inquiries' : 'Tiếp Nhận Hỗ Trợ'}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">support_agent</span>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isEn ? 'DESK READY' : 'BÀN TIẾP ĐÓN'}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/50">
                24/7
              </span>
            </div>
            <p className="mt-1.5 text-[11.5px] text-slate-600 dark:text-slate-400 truncate">
              {isEn ? 'Process tickets & guest requests' : 'Hỗ trợ thành viên & xử lý đơn từ'}
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">
              {isEn ? 'Support Desk' : 'Bàn dịch vụ khách hàng'}
            </span>
            <a href="#/receptionist/support" className="text-indigo-700 dark:text-indigo-400 font-extrabold hover:underline flex items-center gap-0.5">
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
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#0F766E] dark:text-teal-400">tune</span>
              {isEn ? 'Front Desk Operations' : 'Nghiệp vụ quầy lễ tân'}
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">
              5 {isEn ? 'action centers' : 'nghiệp vụ chính'}
            </span>
          </div>

          {/* Action 1: Check-in Turnstile Scanner */}
          <a
            href="#/receptionist/check-in"
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 hover:shadow-md hover-lift transition-all flex items-start gap-4 block group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#0F766E] dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-[#0F766E] group-hover:text-white transition-all shadow-xs border border-emerald-200/60 dark:border-emerald-800/40">
              <span className="material-symbols-outlined text-[26px]">qr_code_scanner</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-chivo text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-[#0F766E] dark:group-hover:text-emerald-400 transition-colors">
                  {isEn ? 'Gate Check-in Scanner' : 'Check-in Cổng Quét Thẻ'}
                </h3>
                <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-[#0F766E] dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {isEn
                  ? 'Scan member QR, RFID card, validate active subscriptions, and trigger automatic gate opening.'
                  : 'Xác thực QR trên điện thoại, thẻ từ RFID, cảnh báo thẻ hết hạn và mở cổng kiểm soát tự động.'}
              </p>
            </div>
          </a>

          {/* Action 2: Member Lookup */}
          <a
            href="#/receptionist/lookup"
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-purple-500/50 dark:hover:border-purple-500/40 hover:shadow-md hover-lift transition-all flex items-start gap-4 block group"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-xs border border-purple-200/60 dark:border-purple-800/40">
              <span className="material-symbols-outlined text-[26px]">person_search</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-chivo text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {isEn ? 'Member Profile Lookup' : 'Tra Cứu Hồ Sơ Hội Viên'}
                </h3>
                <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {isEn
                  ? 'Quickly look up by phone number, member code, email, check current package validity and history.'
                  : 'Tra cứu nhanh số điện thoại, mã thẻ, email, thời hạn gói tập và lịch sử tham gia lớp học.'}
              </p>
            </div>
          </a>

          {/* Action 3: Package Registration & Renewal */}
          <a
            href="#/receptionist/counter-register"
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50 dark:hover:border-amber-500/40 hover:shadow-md hover-lift transition-all flex items-start gap-4 block group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all shadow-xs border border-amber-200/60 dark:border-amber-800/40">
              <span className="material-symbols-outlined text-[26px]">point_of_sale</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-chivo text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {isEn ? 'Counter Package Renewal' : 'Gia Hạn & Đăng Ký Gói Tại Quầy'}
                </h3>
                <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {isEn
                  ? 'Sign up new memberships, renew expired passes, accept cash or trigger on-screen VNPay QR.'
                  : 'Đăng ký gói tập mới, gia hạn thẻ, thu tiền mặt, quẹt POS hoặc tạo mã thanh toán VNPay tại quầy.'}
              </p>
            </div>
          </a>

          {/* Action 4: Counter Booking & Class Management */}
          <a
            href="#/receptionist/bookings"
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-sky-500/50 dark:hover:border-sky-500/40 hover:shadow-md hover-lift transition-all flex items-start gap-4 block group"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-sky-600 group-hover:text-white transition-all shadow-xs border border-sky-200/60 dark:border-sky-800/40">
              <span className="material-symbols-outlined text-[26px]">calendar_month</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-chivo text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  {isEn ? 'Counter Booking & Changes' : 'Đặt Chỗ & Hủy Ca Tại Quầy'}
                </h3>
                <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {isEn
                  ? 'Assist walk-in members to book workout sessions, reschedule classes, or handle cancellations.'
                  : 'Hỗ trợ khách hàng đặt lịch lớp học bộ môn, xếp chỗ vào ca tập hoặc hủy lịch trực tiếp.'}
              </p>
            </div>
          </a>

          {/* Action 5: Support Requests */}
          <a
            href="#/receptionist/support"
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-teal-500/50 dark:hover:border-teal-500/40 hover:shadow-md hover-lift transition-all flex items-start gap-4 block group"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-teal-600 group-hover:text-white transition-all shadow-xs border border-teal-200/60 dark:border-teal-800/40">
              <span className="material-symbols-outlined text-[26px]">support_agent</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-chivo text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {isEn ? 'Guest Inquiries & Support' : 'Tiếp Nhận Đơn Từ & Hỗ Trợ'}
                </h3>
                <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
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
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5 hover-lift transition-all">
            {/* Monitor Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0F766E] dark:text-emerald-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">sensors</span>
                </div>
                <div>
                  <h2 className="font-chivo text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    {isEn ? 'Live Gate Turnstile Monitor' : 'Màn Hình Giám Sát Cổng Vào Thời Gian Thực'}
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isEn ? 'Automatic check-in events & quick barcode verification' : 'Sự kiện vào sân tự động & xác thực thẻ trực tiếp tại bàn'}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold">
                {history.length} {isEn ? 'scans' : 'lượt'}
              </span>
            </div>

            {/* Instant Front Desk Fast-CheckIn Bar */}
            <form onSubmit={handleQuickCheckIn} className="space-y-2">
              <label htmlFor="front-desk-quick-checkin" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {isEn ? '⚡ Instant Counter Verification (Barcode / ID / Phone)' : '⚡ Xác Thực Nhanh Tại Bàn (Quét mã vạch / Mã thẻ / SĐT)'}
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    barcode_scanner
                  </span>
                  <input
                    id="front-desk-quick-checkin"
                    ref={quickInputRef}
                    type="text"
                    value={quickInput}
                    onChange={(e) => setQuickInput(e.target.value)}
                    placeholder={isEn ? 'Enter card code (MEM-00001), phone or scan barcode...' : 'Nhập mã thẻ (MEM-00001), số điện thoại hoặc dùng máy quét barcode...'}
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                  {quickInput && (
                    <button
                      type="button"
                      onClick={() => setQuickInput('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={checkingIn || !quickInput.trim()}
                  className="px-4.5 py-2.5 rounded-2xl bg-[#0F766E] hover:bg-[#0D9488] disabled:opacity-50 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
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
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
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
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider px-1">
                <span>{isEn ? 'Recent Turnstile Events' : 'Danh sách lượt vào gần nhất'}</span>
                <span>{isEn ? 'Admit Status' : 'Trạng thái'}</span>
              </div>

              {history.length === 0 ? (
                /* High-End Empty State */
                <div className="text-center py-10 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-[#0F766E] dark:text-teal-400 mx-auto flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-3xl">sensor_door</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {isEn ? 'No check-ins recorded in this shift yet' : 'Chưa có lượt quét thẻ nào trong ca trực hôm nay'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                      {isEn
                        ? 'Scan member cards using the instant box above or launch fullscreen turnstile camera mode.'
                        : 'Sử dụng thanh quét nhanh phía trên hoặc mở giao diện quét camera toàn màn hình khi đón tiếp hội viên.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[360px] overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-4 group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 font-chivo font-black text-xs border border-emerald-200 dark:border-emerald-800 shadow-2xs group-hover:scale-105 transition-transform">
                          OK
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {item.memberName}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {isEn ? 'Card' : 'Mã thẻ'}: <strong className="font-mono text-slate-800 dark:text-slate-200">{item.memberCode}</strong> • {item.packageName}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 block">{item.checkInTime}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300 font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
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
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-chivo text-xs font-black uppercase tracking-wider rounded-2xl text-center transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs hover-lift"
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
