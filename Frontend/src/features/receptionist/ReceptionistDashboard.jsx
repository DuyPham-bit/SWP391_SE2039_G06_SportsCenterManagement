import React, { useState, useEffect } from 'react';
import { receptionApi } from '../../services/api.js';
import { StatCard } from '../../components/common/StatCard.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function ReceptionistDashboard() {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await receptionApi.getCheckInHistory();
        setHistory(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <LoadingSpinner text={isEn ? 'Loading front desk data...' : 'Đang tải dữ liệu quầy lễ tân...'} />;

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Top Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#2F7B5D] via-[#24828F] via-[#3FAEB8] to-[#E5A33C] dark:from-[#184534] dark:via-[#144850] dark:via-[#1B5760] dark:to-[#5E4014] text-white p-6 sm:p-7 border border-white/30 dark:border-white/10 shadow-xl shadow-[#24828F]/20 overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-[#F2CC8F]/45 via-[#E5A33C]/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-[#81B29A]/40 via-[#2F7B5D]/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-[#A8DADC]/30 rounded-full blur-3xl pointer-events-none" />

        {/* Subtle decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
          <circle cx="890" cy="110" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
        </svg>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[#1B4332] dark:text-emerald-300 border border-white/80 dark:border-white/20 text-xs font-black uppercase tracking-wider shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isEn ? 'RECEPTION DESK & GUEST SERVICES' : 'QUẦY LỄ TÂN & ĐÓN TIẾP KHÁCH'}</span>
          </div>
          <h1 className="font-chivo text-2xl md:text-3xl font-black mt-2 text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            {isEn ? 'Reception Shift Overview (Front Desk)' : 'Tổng Quan Ca Trực Lễ Tân (Reception Desk)'}
          </h1>
          <p className="text-xs sm:text-sm text-white/95 mt-1 max-w-xl font-medium leading-relaxed drop-shadow-xs">
            {isEn
              ? 'Fast member lookup, on-counter package renewal, automated receipt issuing, and gate access check-in.'
              : 'Tra cứu hội viên nhanh, đăng ký gia hạn gói tập tại quầy và kiểm soát check-in vào sân.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 relative z-10 shrink-0">
          <a
            href="#/receptionist/check-in"
            className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all shadow-md hover:shadow-lg hover-lift flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px] text-emerald-400">qr_code_scanner</span>
            <span>{isEn ? 'Court Check-in' : 'Check-in Vào Sân'}</span>
          </a>
          <a
            href="#/receptionist/counter-register"
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all border border-white/30 hover-lift flex items-center gap-2 backdrop-blur-md shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px] text-amber-300">point_of_sale</span>
            <span>{isEn ? 'Cashier / Renewal' : 'Thu Ngân / Gia Hạn'}</span>
          </a>
        </div>
      </div>

      {/* KPI Cards (Olympic Brand Tints) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Check-ins (Mint Green) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/60 dark:from-emerald-950/20 dark:via-slate-900 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-800/40 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold text-emerald-900 dark:text-emerald-300">
              {isEn ? 'Today Check-ins' : 'Lượt Check-in Hôm Nay'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#2F7B5D] text-white flex items-center justify-center shadow-md shadow-[#2F7B5D]/25">
              <span className="material-symbols-outlined text-[20px]">fact_check</span>
            </div>
          </div>
          <div className="text-3xl font-black font-chivo text-slate-900 dark:text-white mt-2.5">
            {history.length}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isEn ? 'Successful member scans' : 'Hội viên quét thẻ thành công'}</span>
          </div>
        </div>

        {/* Card 2: Desk Status (Honey Gold) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-orange-50/60 dark:from-amber-950/20 dark:via-slate-900 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/40 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold text-amber-900 dark:text-amber-300">
              {isEn ? 'Desk Status' : 'Trạng Thái Quầy'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#E5A33C] text-white flex items-center justify-center shadow-md shadow-[#E5A33C]/25">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2.5">
            <span className="text-2xl sm:text-3xl font-black font-chivo text-slate-900 dark:text-white">
              {isEn ? 'ACTIVE' : 'HOẠT ĐỘNG'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-300 dark:border-emerald-700">
              ONLINE
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
            <span>{isEn ? 'Turnstile gate open' : 'Cổng kiểm soát mở liên tục'}</span>
          </div>
        </div>

        {/* Card 3: Validity Rate (Cyan Ocean) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-50/80 via-white to-teal-50/60 dark:from-cyan-950/20 dark:via-slate-900 dark:to-teal-950/20 border border-cyan-200/80 dark:border-cyan-800/40 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold text-cyan-900 dark:text-cyan-300">
              {isEn ? 'Validity Rate' : 'Tỷ Lệ Hợp Lệ'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#24828F] text-white flex items-center justify-center shadow-md shadow-[#24828F]/25">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
          </div>
          <div className="text-3xl font-black font-chivo text-slate-900 dark:text-white mt-2.5">
            100%
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-cyan-700 dark:text-cyan-400">
            <span>{isEn ? 'No unauthorized access' : 'Không có vi phạm thẻ giả mạo'}</span>
          </div>
        </div>
      </div>

      {/* Quick Action Cards & Live Check-in Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation Action Buttons */}
        <div className="space-y-4">
          <h2 className="font-chivo text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
            {isEn ? 'Desk Operations' : 'Thao Tác Nghiệp Vụ Tại Bàn'}
          </h2>

          <a
            href="#/receptionist/lookup"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#81B29A] hover:shadow-md hover-lift transition-all flex items-start gap-4 block group"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:bg-[#1E2235] group-hover:text-[#F2CC8F] transition-colors shadow-2xs">
              <span className="material-symbols-outlined text-[26px]">person_search</span>
            </div>
            <div>
              <h3 className="font-chivo text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#2D6A4F] dark:group-hover:text-[#81B29A] transition-colors">
                {isEn ? 'Member Profile Lookup' : 'Tra Cứu Hồ Sơ Hội Viên'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {isEn
                  ? 'Quickly search phone, email, card expiry date, and enrolled class history.'
                  : 'Tra cứu nhanh số điện thoại, email, hạn sử dụng thẻ và lịch sử tham gia lớp học.'}
              </p>
            </div>
          </a>

          <a
            href="#/receptionist/counter-register"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#F2CC8F] hover:shadow-md hover-lift transition-all flex items-start gap-4 block group"
          >
            <div className="w-12 h-12 rounded-xl bg-[#F2CC8F]/20 dark:bg-[#F2CC8F]/10 text-[#92400E] dark:text-[#F2CC8F] flex items-center justify-center shrink-0 group-hover:bg-[#1E2235] group-hover:text-[#F2CC8F] transition-colors shadow-2xs">
              <span className="material-symbols-outlined text-[26px]">point_of_sale</span>
            </div>
            <div>
              <h3 className="font-chivo text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#92400E] dark:group-hover:text-[#F2CC8F] transition-colors">
                {isEn ? 'Counter Package Renewal' : 'Gia Hạn Gói Tại Quầy'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {isEn
                  ? 'Collect cash or open VNPay checkout, then track the verified invoice status.'
                  : 'Thu tiền mặt hoặc mở VNPay, sau đó theo dõi trạng thái hóa đơn đã xác minh.'}
              </p>
            </div>
          </a>

          <a
            href="#/receptionist/check-in"
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#81B29A] hover:shadow-md hover-lift transition-all flex items-start gap-4 block group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#2D6A4F] dark:text-[#81B29A] flex items-center justify-center shrink-0 group-hover:bg-[#2D6A4F] group-hover:text-white transition-colors shadow-2xs">
              <span className="material-symbols-outlined text-[26px]">how_to_reg</span>
            </div>
            <div>
              <h3 className="font-chivo text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#2D6A4F] dark:group-hover:text-[#81B29A] transition-colors">
                {isEn ? 'Gate Check-in Scanner' : 'Check-in Cổng Quét Thẻ'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {isEn
                  ? 'Validate active passes, warn expired cards, and log gate entry events.'
                  : 'Xác thực gói tập hợp lệ, cảnh báo thẻ hết hạn và lưu vết lịch sử vào sân.'}
              </p>
            </div>
          </a>
        </div>

        {/* Live Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover-lift flex flex-col justify-between transition-all">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-chivo text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                {isEn ? 'Real-Time Gate Check-in Feed' : 'Lịch Sử Quét Thẻ Vào Sân Thời Gian Thực'}
              </h2>
              <span className="text-xs font-bold text-slate-400">{isEn ? 'Today' : 'Hôm nay'}</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  {isEn ? 'No check-ins recorded today.' : 'Chưa có lượt quét thẻ nào hôm nay.'}
                </div>
              ) : (
                history.map(item => (
                  <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-chivo font-black text-xs border border-emerald-200 dark:border-emerald-800">
                        OK
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 dark:text-white truncate">{item.memberName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {isEn ? 'Card' : 'Mã thẻ'}: <strong className="font-mono text-slate-800 dark:text-slate-200">{item.memberCode}</strong> • {item.packageName}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">{item.checkInTime}</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                        {item.note === 'Hợp lệ' ? (isEn ? 'Valid' : 'Hợp lệ') : item.note}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <a
            href="#/receptionist/check-in"
            className="mt-4 w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-chivo text-xs font-bold uppercase tracking-wider rounded-xl text-center transition-colors block cursor-pointer shadow-xs hover-lift"
          >
            {isEn ? 'Open Fullscreen Scanner Mode' : 'Mở Giao Diện Quét Thẻ Toàn Màn Hình'}
          </a>
        </div>
      </div>
    </div>
  );
}
