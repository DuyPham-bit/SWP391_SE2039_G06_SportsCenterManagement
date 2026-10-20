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
      <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#40916C] text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-emerald-700/30 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-300/15 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-[#F2CC8F]/15 blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <span className="font-chivo text-xs uppercase tracking-widest text-[#F2CC8F] font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#81B29A] animate-pulse" />
            {isEn ? 'RECEPTION DESK & GUEST SERVICES' : 'QUẦY LỄ TÂN & ĐÓN TIẾP KHÁCH'}
          </span>
          <h1 className="font-chivo text-2xl md:text-3xl font-black mt-1 text-white tracking-tight">
            {isEn ? 'Reception Shift Overview (Front Desk)' : 'Tổng Quan Ca Trực Lễ Tân (Reception Desk)'}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            {isEn
              ? 'Fast member lookup, on-counter package renewal, automated receipt issuing, and gate access check-in.'
              : 'Tra cứu hội viên nhanh, đăng ký gia hạn gói tập tại quầy và kiểm soát check-in vào sân.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 relative z-10 shrink-0">
          <a
            href="#/receptionist/check-in"
            className="px-4 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all shadow-md hover-lift flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
            <span>{isEn ? 'Court Check-in' : 'Check-in Vào Sân'}</span>
          </a>
          <a
            href="#/receptionist/counter-register"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all border border-white/15 hover-lift flex items-center gap-2 backdrop-blur-sm"
          >
            <span className="material-symbols-outlined text-[18px] text-[#F2CC8F]">point_of_sale</span>
            <span>{isEn ? 'Cashier / Renewal' : 'Thu Ngân / Gia Hạn'}</span>
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={isEn ? 'Today Check-ins' : 'Lượt Check-in Hôm Nay'}
          value={history.length}
          subtitle={isEn ? 'Successful member scans' : 'Hội viên quét thẻ thành công'}
          icon="fact_check"
          color="green"
        />
        <StatCard
          title={isEn ? 'Desk Status' : 'Trạng Thái Quầy'}
          value={isEn ? 'ACTIVE' : 'HOẠT ĐỘNG'}
          subtitle={isEn ? 'Turnstile gate open' : 'Cổng kiểm soát mở liên tục'}
          icon="check_circle"
          color="green"
        />
        <StatCard
          title={isEn ? 'Validity Rate' : 'Tỷ Lệ Hợp Lệ'}
          value="100%"
          subtitle={isEn ? 'No unauthorized access' : 'Không có vi phạm thẻ giả mạo'}
          icon="verified"
          color="slate"
        />
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
                  ? 'Collect cash or open VNPay Sandbox checkout, then track the verified invoice status.'
                  : 'Thu tiền mặt hoặc mở VNPay Sandbox, sau đó theo dõi trạng thái hóa đơn đã xác minh.'}
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
