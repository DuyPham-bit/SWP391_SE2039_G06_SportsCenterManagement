import React, { useState, useEffect } from 'react';
import { receptionApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/StatCard.js';
import { BusinessAlert } from '../../components/common/BusinessAlert.jsx';
import { Modal } from '../../components/common/Modal.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function MemberCheckIn() {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const { showSuccess, showError, showWarning } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [checkIns, setCheckIns] = useState([]);
  const [lastCheckIn, setLastCheckIn] = useState(null);
  const [checkInError, setCheckInError] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Unhappy Case Override Handling
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideApprover, setOverrideApprover] = useState(isEn ? 'Shift Manager' : 'Quản lý ca trực');
  const [failedIdentifier, setFailedIdentifier] = useState('');
  const [historyError, setHistoryError] = useState('');

  const loadData = async () => {
    try {
      const history = await receptionApi.getCheckInHistory();
      setCheckIns(history || []);
      setHistoryError('');
    } catch (error) {
      setHistoryError(error.message || (isEn ? 'Failed to load check-in log from server.' : 'Không thể tải nhật ký check-in từ hệ thống.'));
    }
  };

  useEffect(() => {
    loadData();
    const hash = window.location.hash || '';
    const match = hash.match(/[?&]query=([^&]+)/);
    if (match && match[1]) {
      setIdentifier(decodeURIComponent(match[1]));
    }
  }, []);

  const handleExecuteCheckIn = async (memberToScan) => {
    const term = (memberToScan?.memberCode || memberToScan?.id || identifier || '').toString().trim();

    if (!term) {
      setCheckInError({
        message: isEn
          ? 'Please scan member card or enter Member ID / Phone number / Email.'
          : 'Vui lòng quét thẻ hoặc nhập mã hội viên / Số điện thoại / Email.',
        code: 'VALIDATION-EMPTY',
        proposedHandling: isEn
          ? 'Use RFID card scanner or type the registered member phone number.'
          : 'Sử dụng đầu đọc RFID hoặc gõ chính xác số điện thoại đăng ký của hội viên.'
      });
      setLastCheckIn(null);
      return;
    }

    setProcessing(true);
    setCheckInError(null);
    setFailedIdentifier(term);
    try {
      const result = await receptionApi.checkInMember(term);
      setLastCheckIn(result);
      showSuccess(
        isEn
          ? `Check-in successful: ${result.memberName} (${result.memberCode})`
          : `Check-in thành công: ${result.memberName} (${result.memberCode})`
      );
      setIdentifier('');
      await loadData();
    } catch (err) {
      setCheckInError(err);
      setLastCheckIn(null);
      showError(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleOverrideCheckIn = async (e) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      showWarning(isEn ? 'Please specify the reason for the check-in exception.' : 'Vui lòng ghi rõ lý do cần xử lý ngoại lệ check-in.');
      return;
    }
    setProcessing(true);
    try {
      const result = await receptionApi.requestCheckInReview(failedIdentifier || identifier, overrideReason, overrideApprover);
      setOverrideModalOpen(false);
      setOverrideReason('');
      showSuccess(
        isEn
          ? `Saved exception request #${result.request.id}. Track under Support Requests.`
          : `Đã lưu yêu cầu #${result.request.id} vào hệ thống. Theo dõi xử lý tại mục Yêu cầu hỗ trợ.`
      );
    } catch (err) {
      showError(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Header Banner */}
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
        </svg>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[#1B4332] dark:text-emerald-300 border border-white/80 dark:border-white/20 text-xs font-black uppercase tracking-wider shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isEn ? 'ACCESS CONTROL & GATE TERMINAL' : 'KIỂM SOÁT VÀO SÂN & CỔNG QUÉT THẺ'}</span>
          </div>
          <h1 className="font-chivo text-2xl md:text-3xl font-black mt-2 text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            {isEn ? 'Gate Scanner & Member Check-in' : 'Cổng Quét Thẻ & Check-in Hội Viên'}
          </h1>
          <p className="text-xs sm:text-sm text-white/95 mt-1 max-w-xl font-medium leading-relaxed drop-shadow-xs">
            {isEn
              ? 'Scan RFID cards or enter member code to verify active passes and automatically record entry logs.'
              : 'Quét thẻ RFID hoặc nhập mã hội viên để đối soát gói tập và tự động lưu vết vào sân.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 relative z-10 shrink-0">
          <a
            href="#/receptionist/counter-register"
            className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all shadow-md hover:shadow-lg hover-lift flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px] text-amber-300">point_of_sale</span>
            <span>{isEn ? 'Counter Renewal' : 'Gia Hạn Tại Quầy'}</span>
          </a>
          <a
            href="#/receptionist/lookup"
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all border border-white/30 hover-lift flex items-center gap-2 backdrop-blur-md shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px] text-white">person_search</span>
            <span>{isEn ? 'Member Lookup' : 'Tra Cứu'}</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Scanner Terminal (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-all hover-lift">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-chivo text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider">
                {isEn ? 'REAL-TIME RFID SCANNER (GATE 01)' : 'ĐẦU ĐỌC THẺ THỜI GIAN THỰC (CỔNG SỐ 01)'}
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-chivo font-black tracking-wider uppercase bg-[#2D6A4F]/10 text-[#2D6A4F] dark:text-[#81B29A] border border-[#2D6A4F]/20">
              {isEn ? 'ONLINE TERMINAL' : 'HỆ THỐNG TRỰC TUYẾN'}
            </span>
          </div>

          {/* Scanner Input Box */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleExecuteCheckIn(); }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                {isEn ? 'Member Card ID / Phone / Email *' : 'Mã thẻ hội viên / Số điện thoại / Email *'}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400">
                    barcode_scanner
                  </span>
                  <input
                    type="text"
                    required
                    placeholder={isEn ? 'Scan card or enter ID (e.g. MEM-8899)...' : 'Quét mã thẻ (ví dụ: MEM-8899)...'}
                    value={identifier}
                    onChange={e => { setIdentifier(e.target.value); setCheckInError(null); }}
                    className="w-full pl-11 pr-4 py-2.5 text-base font-chivo font-bold rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A] bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-6 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all hover-lift shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {processing ? (isEn ? 'Validating...' : 'Đang kiểm tra...') : (isEn ? 'VALIDATE' : 'XÁC THỰC')}
                </button>
              </div>
            </div>
          </form>

          {/* Result Alert: Success Feedback */}
          {lastCheckIn && (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500/70 text-emerald-950 dark:text-emerald-200 space-y-3 animate-fade-slide-up">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center shrink-0 shadow-md">
                  <span className="material-symbols-outlined text-[28px]">check_circle</span>
                </div>
                <div>
                  <span className="font-chivo text-[11px] font-black uppercase tracking-widest text-[#2D6A4F] dark:text-[#81B29A]">
                    {isEn ? 'GATE UNLOCKED (ENTRY APPROVED)' : 'CỬA TỰ ĐỘNG ĐÃ MỞ (GATE UNLOCKED)'}
                  </span>
                  <h3 className="font-chivo text-xl font-black text-emerald-900 dark:text-emerald-100 leading-tight">
                    {lastCheckIn.memberName}
                  </h3>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                    {isEn ? 'Card ID' : 'Mã thẻ'}: <strong className="font-mono text-emerald-950 dark:text-white">{lastCheckIn.memberCode}</strong>
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-emerald-200 dark:border-emerald-800 text-xs grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[#2D6A4F] dark:text-[#81B29A] block text-[10px] uppercase font-bold tracking-wider">
                    {isEn ? 'Package' : 'Gói tập'}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{lastCheckIn.packageName}</span>
                </div>
                <div>
                  <span className="text-[#2D6A4F] dark:text-[#81B29A] block text-[10px] uppercase font-bold tracking-wider">
                    {isEn ? 'Entry Time' : 'Thời gian vào'}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{lastCheckIn.checkInTime}</span>
                </div>
              </div>
            </div>
          )}

          {/* Result Alert: Error / Expired Feedback with BusinessAlert */}
          {checkInError && (
            <div className="space-y-3 animate-fade-slide-up">
              <BusinessAlert
                type="error"
                title={isEn ? 'CHECK-IN DENIED (GATE LOCKED)' : 'CẢNH BÁO TỪ CHỐI CHECK-IN (GATE LOCKED)'}
                code={checkInError.code || (checkInError.status === 400 ? 'RE-05' : 'CHECKIN-ERR')}
                message={checkInError.message || String(checkInError)}
                proposedHandling={
                  checkInError.proposedHandling ||
                  (isEn
                    ? 'Check if member scanned twice within 15 minutes, account is suspended, or pass has expired.'
                    : 'Kiểm tra xem hội viên có bị trùng lượt quẹt trong 15 phút, tài khoản bị tạm khóa, hoặc gói tập đã quá hạn sử dụng.')
                }
              />
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href="#/receptionist/counter-register"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F2CC8F]/20 hover:bg-[#F2CC8F]/30 text-[#92400E] dark:text-[#F2CC8F] text-xs font-bold font-chivo uppercase tracking-wider transition-all border border-[#F2CC8F]/40 hover-lift"
                >
                  <span className="material-symbols-outlined text-[16px]">point_of_sale</span>
                  <span>{isEn ? 'Renew / Register at Counter' : 'Gia hạn / Đăng ký gói tại quầy'}</span>
                </a>
                <button
                  type="button"
                  onClick={() => setOverrideModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold font-chivo uppercase tracking-wider transition-all shadow-sm hover-lift cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#F2CC8F]">verified_user</span>
                  <span>{isEn ? 'Request Exception Review' : 'Gửi yêu cầu xử lý ngoại lệ'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Ghi Đè Ngoại Lệ Check-In */}
        <Modal
          isOpen={overrideModalOpen}
          onClose={() => setOverrideModalOpen(false)}
          title={isEn ? 'Submit Check-in Exception Review' : 'Gửi Yêu Cầu Xử Lý Ngoại Lệ Check-in'}
          size="md"
        >
          <form onSubmit={handleOverrideCheckIn} className="space-y-4">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              {isEn
                ? 'Requests and justifications are saved to the system for audit. Submitting does not automatically approve or unlock the gate; account validity and quota are still audited.'
                : 'Yêu cầu và lý do được lưu vào hệ thống để theo dõi xử lý. Việc gửi yêu cầu chưa phê duyệt check-in hoặc mở cổng; các điều kiện về tài khoản, gói tập và lượt vào vẫn được kiểm tra.'}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Assigned Approver / Reviewer *' : 'Người được đề nghị xử lý *'}
              </label>
              <input
                type="text"
                required
                value={overrideApprover}
                onChange={e => setOverrideApprover(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Justification Reason *' : 'Lý do cần xử lý *'}
              </label>
              <textarea
                required
                rows={3}
                placeholder={
                  isEn
                    ? 'Enter exception reason (e.g., forgot physical card, coach confirmed makeup class)...'
                    : 'Nhập lý do ngoại lệ (ví dụ: Học viên quên thẻ cứng, HLV Nguyễn Văn A xác nhận vào tập buổi bù)...'
                }
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                {isEn ? 'CANCEL' : 'HỦY BỎ'}
              </button>
              <button
                type="submit"
                disabled={processing}
                className="px-5 py-2 text-xs font-bold text-white bg-[#2D6A4F] hover:bg-[#1B4332] rounded-lg shadow-sm hover-lift cursor-pointer disabled:opacity-50"
              >
                {processing ? (isEn ? 'Saving...' : 'Đang lưu...') : (isEn ? 'SUBMIT REQUEST' : 'LƯU YÊU CẦU')}
              </button>
            </div>
          </form>
        </Modal>

        {/* Right Column: Today's Check-in Log (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover-lift transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-chivo text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
              {isEn ? `Today's Entry Scans (${checkIns.length})` : `Nhật Ký Quét Thẻ Hôm Nay (${checkIns.length})`}
            </h2>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {isEn ? 'Live' : 'Trực tiếp'}
            </span>
          </div>

          {historyError && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{historyError}</p>}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto pr-1 space-y-2">
            {checkIns.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                {isEn ? 'No scans recorded today yet.' : 'Chưa có lượt quét thẻ nào hôm nay.'}
              </div>
            ) : (
              checkIns.map(item => (
                <div key={item.id} className="pt-2.5 pb-1 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-300 dark:border-emerald-800">
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{item.memberName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-mono">{item.memberCode}</span> • {item.packageName}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                      {item.checkInTime.split(' ')[1] || item.checkInTime}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isEn ? 'Desk' : 'Lễ tân'}: {item.receptionistName?.split(' ')[0]}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
