import React, { useState, useEffect, useRef } from 'react';
import { receptionApi } from '../../../entities/member/index.js';
import { packageApi } from '../../../entities/membership/index.js';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { LoadingSpinner } from '../../../shared/ui/Table.jsx';
import { Badge } from '../../../shared/ui/StatCard.jsx';
import { createIdempotencyKey } from '../../../shared/api/http.js';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { openPaymentCheckout } from '../../../features/payment-checkout/index.js';

export function CounterMembership() {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const checkoutRef = useRef(null);

  const [step, setStep] = useState(1); // 1: Member, 2: Package, 3: Payment, 4: Receipt
  const [members, setMembers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSearchLoading, setMemberSearchLoading] = useState(false);

  // Selections
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('TIỀN MẶT');
  const [amountReceived, setAmountReceived] = useState('');
  const [loadError, setLoadError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [checkoutAttempt, setCheckoutAttempt] = useState({ fingerprint: '', key: '' });
  const [pendingInvoice, setPendingInvoice] = useState(null);

  useEffect(() => {
    async function loadInitial() {
      try {
        const pkgs = await packageApi.getAll();
        setMembers([]);
        const activePackages = pkgs.filter(p => p.status === 'ACTIVE');
        setPackages(activePackages);
        if (activePackages.length > 0) setSelectedPackage(activePackages[0]);

        const hash = window.location.hash || '';
        const match = hash.match(/[?&]query=([^&]+)/);
        if (match && match[1]) {
          const q = decodeURIComponent(match[1]);
          setMemberSearchQuery(q);
          const results = await receptionApi.lookupMember(q);
          setMembers(results);
          if (results.length === 1) setSelectedMember(results[0]);
        }
      } catch (e) {
        console.error(e);
        showError(e.message || (isEn ? 'Failed to load packages or members.' : 'Không thể tải danh sách hội viên hoặc gói tập. Vui lòng thử lại sau.'));
        setLoadError(e.message || (isEn ? 'Failed to load counter cashier data.' : 'Không thể tải dữ liệu thu ngân.'));
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => () => {
    checkoutRef.current?.dispose();
    checkoutRef.current = null;
  }, []);

  useEffect(() => {
    setAmountReceived(String(selectedPackage?.price || ''));
  }, [selectedPackage?.id]);

  const handleSearchMembers = async event => {
    event.preventDefault();
    if (memberSearchQuery.trim().length < 2) {
      showError(isEn ? 'Enter at least 2 characters to search member.' : 'Nhập ít nhất 2 ký tự để tìm hội viên.');
      return;
    }
    setMemberSearchLoading(true);
    setMembers([]);
    setSelectedMember(null);
    try {
      const results = await receptionApi.lookupMember(memberSearchQuery);
      setMembers(results);
      setSelectedMember(results.length === 1 ? results[0] : null);
      if (results.length === 0) showError(isEn ? 'No matching member found.' : 'Không tìm thấy hội viên phù hợp.');
    } catch (error) {
      showError(error.message || (isEn ? 'Failed to search member.' : 'Không thể tìm hội viên.'));
    } finally {
      setMemberSearchLoading(false);
    }
  };

  const handleProcessPayment = async (overrideCancelPending = false) => {
    if (!selectedMember || !selectedPackage || processing || checkoutRef.current) return;
    const isVnPay = paymentMethod === 'VNPAY';
    const received = isVnPay ? selectedPackage.price : Number(amountReceived);
    if (!Number.isFinite(received) || received <= 0) {
      showError(isEn ? 'Please enter a valid received amount greater than 0.' : 'Nhập số tiền thực nhận lớn hơn 0.');
      return;
    }
    const fingerprint = [selectedMember.id, selectedPackage.id, paymentMethod, received, overrideCancelPending === true].join(':');
    const idempotencyKey = checkoutAttempt.fingerprint === fingerprint && checkoutAttempt.key
      ? checkoutAttempt.key
      : createIdempotencyKey();
    setCheckoutAttempt({ fingerprint, key: idempotencyKey });
    setProcessing(true);
    let checkout = null;
    try {
      if (isVnPay) {
        checkout = openPaymentCheckout(({ cancelled, failed, closed }) => {
          checkoutRef.current = null;
          setProcessing(false);
          setCheckoutAttempt({ fingerprint: '', key: '' });
          if (cancelled) showWarning(isEn ? 'VNPay payment was cancelled.' : 'Đã hủy thanh toán VNPay.');
          else if (failed) showWarning(isEn ? 'VNPay has not confirmed this payment. Check the invoice before retrying.' : 'VNPay chưa xác nhận khoản thanh toán. Hãy kiểm tra hóa đơn trước khi thử lại.');
          else if (closed) showInfo(isEn ? 'Payment window closed. Check the invoice for the latest status.' : 'Đã đóng cửa sổ thanh toán. Hãy kiểm tra hóa đơn để xem trạng thái mới nhất.');
          else showSuccess(isEn ? 'VNPay returned the payment result. The invoice status has been updated.' : 'VNPay đã trả kết quả. Trạng thái hóa đơn đã được cập nhật.');
        });
        checkoutRef.current = checkout;
        const result = await receptionApi.createCounterVnPayUrl({
          memberId: selectedMember.id,
          packageId: selectedPackage.id,
          idempotencyKey,
          cancelPendingIfAny: overrideCancelPending === true
        });
        if (checkoutRef.current !== checkout) return;
        if (!result.paymentUrl) throw new Error(isEn ? 'Could not generate VNPay payment link.' : 'Không thể tạo liên kết thanh toán VNPay. Vui lòng thử lại sau.');
        checkout.navigate(result.paymentUrl);
        return;
      }

      const result = await receptionApi.registerCounterPackage({
        memberId: selectedMember.id,
        packageId: selectedPackage.id,
        paymentMethod,
        amountReceived: received,
        idempotencyKey,
        cancelPendingIfAny: overrideCancelPending === true
      });
      setReceiptData(result);
      setPendingInvoice(null);
      setCheckoutAttempt({ fingerprint: '', key: '' });
      showSuccess(result.message || (isEn ? 'Payment recorded successfully at counter.' : 'Đã ghi nhận thanh toán tại quầy.'));
      setStep(4);
    } catch (err) {
      if (checkout && checkoutRef.current !== checkout) return;
      checkoutRef.current?.dispose();
      checkoutRef.current = null;
      const match = err.message && err.message.match(/SC-[A-Za-z0-9-]+/);
      if (match) {
        setPendingInvoice(match[0]);
      }
      showError(err.message || (isEn ? 'Counter payment failed!' : 'Lỗi thanh toán tại quầy!'));
    } finally {
      if (!checkoutRef.current) setProcessing(false);
    }
  };

  const handleCancelPendingAndRetry = async (invNumber) => {
    setProcessing(true);
    try {
      await receptionApi.cancelPendingInvoice({
        invoiceNumber: invNumber,
        memberId: selectedMember?.id,
        packageId: selectedPackage?.id
      });
      setPendingInvoice(null);
      await handleProcessPayment();
    } catch (err) {
      showError(err.message || (isEn ? 'Failed to cancel pending invoice!' : 'Lỗi khi hủy hóa đơn chờ!'));
      setProcessing(false);
    }
  };

  if (loading) return <LoadingSpinner text={isEn ? 'Preparing counter cashier terminal...' : 'Đang chuẩn bị màn hình thu ngân...'} />;

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Top Banner Header */}
      <div className="scms-hero relative rounded-3xl bg-gradient-to-r from-brand-sage-700 via-brand-teal-600 via-brand-teal-500 to-brand-sand-500 dark:from-brand-sage-900 dark:via-brand-teal-900 dark:via-brand-teal-800 dark:to-brand-sand-900 text-white p-6 sm:p-7 border border-white/30 dark:border-white/10 shadow-xl shadow-brand-teal-600/20 overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-brand-sand-300/45 via-brand-sand-500/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-brand-sage-500/40 via-brand-sage-700/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-brand-teal-300/30 rounded-full blur-3xl pointer-events-none" />

        {/* Subtle decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
        </svg>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-brand-navy-900/90 backdrop-blur-md text-brand-sage-900 dark:text-brand-sage-300 border border-white/80 dark:border-white/20 text-xs font-black uppercase tracking-wider shadow-xs">
            <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse" />
            <span>{isEn ? 'COUNTER CASHIER & MEMBERSHIP RENEWAL' : 'THU NGÂN & GIA HẠN GÓI TẬP TẠI QUẦY'}</span>
          </div>
          <h1 className="font-chivo text-2xl md:text-3xl font-black mt-2 text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            {isEn ? 'Counter Package Sign-up & Renewal' : 'Đăng Ký & Gia Hạn Gói Tập Tại Quầy'}
          </h1>
          <p className="text-xs sm:text-sm text-white/95 mt-1 max-w-xl font-medium leading-relaxed drop-shadow-xs">
            {isEn
              ? 'Select a member and package, then collect cash or open the VNPay checkout.'
              : 'Chọn thành viên và gói tập, sau đó thu tiền mặt hoặc mở cổng VNPay.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 relative z-10 shrink-0">
          <a
            href="#/receptionist/invoices"
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all border border-white/30 hover-lift flex items-center gap-2 backdrop-blur-md shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px] text-brand-sand-300">receipt_long</span>
            <span>{isEn ? 'Invoices & Billing' : 'Hóa Đơn & Thu Tiền'}</span>
          </a>
          <a
            href="#/receptionist/check-in"
            className="px-4 py-2.5 bg-brand-navy-950 hover:bg-brand-navy-900 text-white rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all shadow-md hover:shadow-lg hover-lift flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px] text-brand-sage-400">how_to_reg</span>
            <span>{isEn ? 'Gate Check-in' : 'Check-in Vào Sân'}</span>
          </a>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="rounded-xl border border-brand-danger-200 dark:border-brand-danger-800 bg-brand-danger-50 dark:bg-brand-danger-950/30 p-4 text-sm text-brand-danger-800 dark:text-brand-danger-300">
          {loadError}
          <button onClick={() => window.location.reload()} className="ml-3 underline font-bold cursor-pointer">
            {isEn ? 'Retry' : 'Thử lại'}
          </button>
        </div>
      )}

      {!loadError && packages.length === 0 && (
        <p className="text-sm text-brand-sand-800 dark:text-brand-sand-300">{isEn ? 'No packages are currently on sale.' : 'Trung tâm chưa có gói tập đang mở bán.'}</p>
      )}

      {/* Step Progress Tracker */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white dark:bg-brand-navy-900 p-3 rounded-2xl border border-brand-navy-200 dark:border-brand-navy-800 shadow-sm">
        {[
          { num: 1, label: isEn ? '1. Select Member' : '1. Chọn Hội Viên' },
          { num: 2, label: isEn ? '2. Choose Package' : '2. Chọn Gói Tập' },
          { num: 3, label: isEn ? '3. Payment' : '3. Thanh Toán' },
          { num: 4, label: isEn ? '4. Invoice & Pass' : '4. Hóa Đơn & Kích Hoạt' }
        ].map(s => (
          <div
            key={s.num}
            className={`p-3 rounded-xl text-center text-xs font-chivo font-bold uppercase transition-all ${
              step === s.num
                ? 'bg-brand-navy-900 text-white shadow-md'
                : step > s.num
                  ? 'bg-brand-sage-700/15 text-brand-sage-700 dark:text-brand-sage-500'
                  : 'text-brand-navy-400 dark:text-brand-navy-500'
            }`}
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* STEP 1: SELECT MEMBER */}
      {step === 1 && (
        <div className="bg-white dark:bg-brand-navy-900 p-6 rounded-2xl border border-brand-navy-200 dark:border-brand-navy-800 shadow-sm space-y-4 hover-lift transition-all">
          <h2 className="font-chivo text-base font-bold text-brand-navy-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-navy-900 text-white flex items-center justify-center text-xs font-black">1</span>
            {isEn ? 'Select Member for Sign-up / Renewal' : 'Chọn Hội Viên Cần Đăng Ký / Gia Hạn'}
          </h2>

          <form onSubmit={handleSearchMembers} className="flex gap-2">
            <input
              value={memberSearchQuery}
              onChange={event => setMemberSearchQuery(event.target.value)}
              placeholder={isEn ? 'Search by name, email, phone, or member card ID...' : 'Tìm theo tên, email, SĐT hoặc mã hội viên'}
              className="min-w-0 flex-1 px-4 py-2.5 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
            />
            <button
              type="submit"
              disabled={memberSearchLoading}
              className="rounded-xl bg-brand-sage-700 hover:bg-brand-sage-900 px-5 py-2.5 text-xs font-bold text-white uppercase font-chivo tracking-wider disabled:opacity-50 cursor-pointer hover-lift transition-all"
            >
              {memberSearchLoading ? (isEn ? 'Searching...' : 'Đang tìm...') : (isEn ? 'Search' : 'Tìm hội viên')}
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {members.map(m => (
              <div
                key={m.id}
                onClick={() => setSelectedMember(m)}
                className={`p-4 rounded-xl border cursor-pointer transition-all hover-lift ${
                  selectedMember?.id === m.id
                    ? 'bg-brand-sage-500/10 border-brand-sage-500 ring-2 ring-brand-sage-500/20 shadow-sm'
                    : 'bg-white dark:bg-brand-navy-900 border-brand-navy-200 dark:border-brand-navy-800 hover:border-brand-navy-300 dark:hover:border-brand-navy-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={m.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover border border-brand-navy-200 dark:border-brand-navy-700"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-brand-navy-900 dark:text-white truncate">{m.fullName}</div>
                    <div className="text-xs text-brand-sage-700 dark:text-brand-sage-500 font-semibold font-mono">{m.memberCode}</div>
                    <div className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 truncate">{m.phone}</div>
                  </div>
                  <Badge variant={m.packageStatus} size="sm">{m.packageStatus}</Badge>
                </div>

                <div className="mt-2 pt-2 border-t border-brand-navy-100 dark:border-brand-navy-800 text-[11px] text-brand-navy-500 dark:text-brand-navy-400 flex justify-between">
                  <span>{isEn ? 'Current pass:' : 'Gói hiện tại:'}</span>
                  <span className="font-semibold text-brand-navy-800 dark:text-brand-navy-200">{m.packageName || (isEn ? 'None' : 'Chưa có')}</span>
                </div>
              </div>
            ))}
          </div>
          {members.length === 0 && (
            <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
              {isEn ? 'Enter keywords above to find members in the system.' : 'Nhập từ khóa phía trên để tìm kiếm hội viên trong hệ thống.'}
            </p>
          )}

          <div className="flex justify-end pt-4 border-t border-brand-navy-100 dark:border-brand-navy-800">
            <button
              onClick={() => setStep(2)}
              disabled={!selectedMember}
              className="px-6 py-2.5 bg-brand-sage-700 hover:bg-brand-sage-900 disabled:opacity-50 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 hover-lift cursor-pointer"
            >
              <span>{isEn ? 'Next: Choose Package' : 'Tiếp Tục: Chọn Gói Tập'}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT PACKAGE */}
      {step === 2 && (
        <div className="bg-white dark:bg-brand-navy-900 p-6 rounded-2xl border border-brand-navy-200 dark:border-brand-navy-800 shadow-sm space-y-4 hover-lift transition-all">
          <div className="flex items-center justify-between">
            <h2 className="font-chivo text-base font-bold text-brand-navy-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-navy-900 text-white flex items-center justify-center text-xs font-black">2</span>
              {isEn ? `Select Package for ${selectedMember?.fullName}` : `Lựa Chọn Gói Tập Cho ${selectedMember?.fullName}`}
            </h2>
            <button onClick={() => setStep(1)} className="text-xs text-brand-navy-500 hover:text-brand-navy-800 dark:hover:text-brand-navy-200 underline cursor-pointer">
              {isEn ? 'Change member' : 'Đổi hội viên'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {packages.map(pkg => (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between hover-lift ${
                  selectedPackage?.id === pkg.id
                    ? 'bg-brand-sage-500/10 border-brand-sage-500 ring-2 ring-brand-sage-500/20 shadow-md'
                    : 'bg-white dark:bg-brand-navy-900 border-brand-navy-200 dark:border-brand-navy-800 hover:border-brand-navy-300 dark:hover:border-brand-navy-700'
                }`}
              >
                <div>
                  <div className="text-[10px] font-black uppercase text-brand-sage-700 dark:text-brand-sage-500 mb-1">
                    {pkg.badge || (isEn ? 'MEMBERSHIP' : 'GÓI TẬP')}
                  </div>
                  <h3 className="font-chivo text-base font-black text-brand-navy-900 dark:text-white leading-tight">{pkg.name}</h3>
                  <div className="text-2xl font-black text-brand-sage-700 dark:text-brand-sage-500 font-chivo mt-3">
                    {pkg.price.toLocaleString()}đ
                  </div>
                  <div className="text-xs text-brand-navy-500 dark:text-brand-navy-400 font-medium">
                    {isEn ? 'Duration' : 'Thời hạn'}: {pkg.durationDays} {isEn ? 'days' : 'ngày'}
                  </div>
                  <p className="text-xs text-brand-navy-600 dark:text-brand-navy-400 mt-3 leading-relaxed">{pkg.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-brand-navy-200 dark:border-brand-navy-800 flex items-center justify-between text-xs font-bold">
                  <span className="text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Sports included:' : 'Môn rèn luyện:'}</span>
                  <span className="text-brand-navy-900 dark:text-white">
                    {pkg.allowedSports >= 10 ? (isEn ? 'All 10 disciplines (All-Access)' : 'Toàn bộ 10 môn (All-Access)') : `${pkg.allowedSports} ${isEn ? 'disciplines' : 'môn'}`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-brand-navy-100 dark:border-brand-navy-800">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-brand-navy-200 dark:border-brand-navy-700 rounded-xl text-xs font-bold text-brand-navy-600 dark:text-brand-navy-400 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 cursor-pointer"
            >
              {isEn ? 'Back' : 'Quay lại'}
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!selectedPackage}
              className="px-6 py-2.5 bg-brand-sage-700 hover:bg-brand-sage-900 disabled:opacity-50 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 hover-lift cursor-pointer"
            >
              <span>{isEn ? 'Next: Payment' : 'Tiếp Tục: Thanh Toán'}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PAYMENT CONFIRMATION */}
      {step === 3 && (
        <div className="bg-white dark:bg-brand-navy-900 p-6 sm:p-8 rounded-2xl border border-brand-navy-200 dark:border-brand-navy-800 shadow-sm space-y-6 max-w-2xl mx-auto hover-lift transition-all">
          <h2 className="font-chivo text-base font-bold text-brand-navy-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-navy-900 text-white flex items-center justify-center text-xs font-black">3</span>
            {isEn ? 'Counter Payment & VNPay' : 'Xác Nhận & Thanh Toán Tại Quầy'}
          </h2>

          {/* Invoice Summary Box */}
          <div className="p-5 rounded-2xl bg-brand-navy-50 dark:bg-brand-navy-800/60 border border-brand-navy-200 dark:border-brand-navy-700 space-y-3">
            <div className="flex justify-between text-xs pb-2 border-b border-brand-navy-200 dark:border-brand-navy-700">
              <span className="text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Member:' : 'Hội viên đăng ký:'}</span>
              <span className="font-bold text-brand-navy-900 dark:text-white">{selectedMember?.fullName} ({selectedMember?.memberCode})</span>
            </div>
            <div className="flex justify-between text-xs pb-2 border-b border-brand-navy-200 dark:border-brand-navy-700">
              <span className="text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Package:' : 'Gói tập lựa chọn:'}</span>
              <span className="font-bold text-brand-navy-900 dark:text-white">{selectedPackage?.name} ({selectedPackage?.durationDays} {isEn ? 'days' : 'ngày'})</span>
            </div>
            <div className="flex justify-between text-xs pb-2 border-b border-brand-navy-200 dark:border-brand-navy-700">
              <span className="text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Base Fee:' : 'Phí dịch vụ:'}</span>
              <span className="font-bold text-brand-navy-900 dark:text-white">{selectedPackage?.price.toLocaleString()}đ</span>
            </div>
            <div className="flex justify-between items-center pt-1 text-sm font-black text-brand-navy-900 dark:text-white">
              <span>{isEn ? 'TOTAL DUE:' : 'TỔNG TIỀN PHẢI THU:'}</span>
              <span className="text-2xl font-chivo text-brand-sage-700 dark:text-brand-sage-500">{selectedPackage?.price.toLocaleString()} VNĐ</span>
            </div>

            {selectedMember?.packageStatus === 'ACTIVE' && (
              <div className="p-3 bg-brand-sand-50 dark:bg-brand-sand-950/30 rounded-xl border border-brand-sand-200 dark:border-brand-sand-800 text-xs text-brand-sand-900 dark:text-brand-sand-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-brand-sand-800 dark:text-brand-sand-300">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  <span>{isEn ? '[RE-03] Continuous Package Renewal Scheduled' : '[RE-03] Dự kiến gia hạn nối tiếp gói tập'}</span>
                </div>
                <p>
                  {isEn
                    ? `Member has an active pass until ${selectedMember.packageExpiry}. New validity will continue seamlessly from the next day.`
                    : `Hội viên đang có gói hiệu lực đến ${selectedMember.packageExpiry}. Gói mới sẽ bắt đầu tiếp nối từ ngày kế tiếp và không làm mất số ngày còn lại.`}
                </p>
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-2">
              {isEn ? 'Payment Method *' : 'Hình thức thu tiền *'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'TIỀN MẶT', label: isEn ? 'CASH' : 'TIỀN MẶT', icon: 'payments' },
                { id: 'VNPAY', label: 'VNPAY', icon: 'qr_code_2' }
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  aria-pressed={paymentMethod === m.id}
                  className={`p-3.5 rounded-xl border text-xs font-chivo font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer hover-lift ${
                    paymentMethod === m.id
                      ? 'bg-brand-navy-900 text-white border-brand-navy-900 shadow-md ring-2 ring-brand-sage-500/30'
                      : 'border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 bg-white dark:bg-brand-navy-800 hover:bg-brand-navy-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {paymentMethod === 'TIỀN MẶT' && (
              <label className="block mt-3 text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300">
                {isEn ? 'Cash Amount Received (VNĐ)' : 'Số tiền thực nhận (VNĐ)'}
                <input
                  aria-label={isEn ? 'Cash amount received' : 'Số tiền thực nhận'}
                  type="number"
                  min="0.01"
                  max="1000000000"
                  step="0.01"
                  value={amountReceived}
                  disabled={processing}
                  onChange={e => setAmountReceived(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
                />
                <span className="block mt-1 text-[11px] text-brand-navy-500 dark:text-brand-navy-400">
                  {isEn ? 'Partial payment: pass pending until fully paid. Change will be calculated automatically.' : 'Thu một phần: gói chờ thu đủ. Tiền dư sẽ được ghi là tiền trả lại.'}
                </span>
              </label>
            )}

            {paymentMethod === 'VNPAY' && (
              <div className="mt-3 p-3.5 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-950/30 text-brand-teal-900 dark:text-brand-teal-200 text-xs flex items-start gap-2.5 border border-brand-teal-100 dark:border-brand-teal-900/50">
                <span className="material-symbols-outlined text-[20px] text-brand-teal-700 dark:text-brand-teal-400 shrink-0">verified_user</span>
                <p className="leading-relaxed">
                  {isEn
                    ? 'Pay with VNPay in a separate window. Your membership package will activate once payment is successful.'
                    : 'Thanh toán qua VNPay trong cửa sổ riêng. Gói tập sẽ được kích hoạt khi thanh toán thành công.'}
                </p>
              </div>
            )}
          </div>

          {/* Pending Invoice Warning & Cancel Option */}
          {pendingInvoice && (
            <div className="p-4 rounded-2xl bg-brand-sand-50 dark:bg-brand-sand-950/30 border-2 border-brand-sand-300 dark:border-brand-sand-800 text-brand-sand-950 dark:text-brand-sand-200 space-y-3 animate-fade-slide-up">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-brand-sand-700 dark:text-brand-sand-400 text-[24px] mt-0.5 shrink-0">
                  pending_actions
                </span>
                <div className="flex-1 text-xs space-y-1">
                  <div className="font-chivo font-black text-brand-sand-900 dark:text-brand-sand-100 uppercase tracking-wide">
                    {isEn ? 'Pending Invoice Already Exists' : 'Hóa Đơn Chờ Thanh Toán Đã Tồn Tại'}
                  </div>
                  <p className="text-brand-sand-800 dark:text-brand-sand-300">
                    {isEn ? 'Member already has pending invoice:' : 'Hội viên đã có hóa đơn chờ:'}{' '}
                    <span className="font-mono font-bold text-brand-sand-950 dark:text-white bg-brand-sand-100 dark:bg-brand-sand-900/40 px-1.5 py-0.5 rounded">
                      {pendingInvoice}
                    </span>
                  </p>
                  <p className="text-[11px] text-brand-sand-700 dark:text-brand-sand-400">
                    {isEn
                      ? 'You can click below to cancel the pending order and activate the new payment immediately.'
                      : 'Bạn có thể bấm nút bên dưới để hủy đơn chờ này và kích hoạt thanh toán mới ngay tại bàn.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-brand-sand-200 dark:border-brand-sand-800">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleCancelPendingAndRetry(pendingInvoice)}
                  className="px-4 py-2 bg-brand-sand-700 hover:bg-brand-sand-800 text-white font-chivo text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all hover-lift flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  <span>{isEn ? 'Cancel Pending & Activate Now' : 'Hủy Hóa Đơn Chờ & Kích Hoạt Ngay'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPendingInvoice(null)}
                  className="px-3 py-2 text-xs font-bold text-brand-sand-800 dark:text-brand-sand-300 hover:bg-brand-sand-100 dark:hover:bg-brand-sand-900/40 rounded-lg transition-colors cursor-pointer"
                >
                  {isEn ? 'Dismiss' : 'Đóng cảnh báo'}
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-brand-navy-100 dark:border-brand-navy-800">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-brand-navy-200 dark:border-brand-navy-700 rounded-xl text-xs font-bold text-brand-navy-600 dark:text-brand-navy-400 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 cursor-pointer"
            >
              {isEn ? 'Back' : 'Quay lại'}
            </button>
            <button
              onClick={() => handleProcessPayment()}
              disabled={processing}
              className="px-6 py-3 bg-brand-sage-700 hover:bg-brand-sage-900 disabled:opacity-50 text-white font-chivo text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all hover-lift flex items-center gap-2 cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[20px] ${processing ? 'animate-spin' : ''}`} aria-hidden="true">
                {processing ? 'progress_activity' : paymentMethod === 'VNPAY' ? 'open_in_new' : 'check_circle'}
              </span>
              <span>{processing
                ? (paymentMethod === 'VNPAY' ? (isEn ? 'Connecting VNPay...' : 'Đang kết nối VNPay...') : (isEn ? 'Processing...' : 'Đang ghi nhận...'))
                : (paymentMethod === 'VNPAY' ? (isEn ? 'Open VNPay' : 'Mở VNPay') : (isEn ? 'Confirm Payment' : 'Xác nhận khoản thu'))}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: RECEIPT & TRANSACTION REF */}
      {step === 4 && receiptData && (
        <div className="bg-white dark:bg-brand-navy-900 p-8 rounded-2xl border border-brand-navy-200 dark:border-brand-navy-800 shadow-xl space-y-6 max-w-xl mx-auto text-center hover-lift transition-all animate-fade-slide-up">
          <div className="w-16 h-16 rounded-full bg-brand-sage-700/15 text-brand-sage-700 dark:text-brand-sage-500 flex items-center justify-center mx-auto shadow-sm">
            <span className="material-symbols-outlined text-[36px]">receipt_long</span>
          </div>

          <div>
            <span className="font-chivo text-xs font-black uppercase tracking-widest text-brand-sage-700 dark:text-brand-sage-500">
              {isEn ? 'PAYMENT RECORDED SUCCESSFULLY' : 'ĐÃ GHI NHẬN KHOẢN THU'}
            </span>
            <h2 className="font-chivo text-2xl font-black text-brand-navy-900 dark:text-white mt-1">
              {isEn ? 'SCMS Member Receipt & Access Pass' : 'Biên Lai Đăng Ký Thẻ Hội Viên SCMS'}
            </h2>
            <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-1">
              {receiptData.outstandingBalance > 0
                ? (isEn ? 'Partial payment recorded. Pass will activate once full balance is cleared.' : 'Đã thu một phần. Gói sẽ được kích hoạt khi thu đủ.')
                : (isEn ? 'Full payment collected. Pass validity updated according to active schedules.' : 'Đã thu đủ. Ngày hiệu lực được tính theo các gói hiện có của thành viên.')}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-brand-navy-50 dark:bg-brand-navy-800/60 border border-brand-navy-200 dark:border-brand-navy-700 text-left space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-brand-navy-200 dark:border-brand-navy-700 font-semibold">
              <span className="text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Transaction Ref:' : 'Mã Giao Dịch (TransactionRef):'}</span>
              <span className="font-chivo font-black text-brand-sage-700 dark:text-brand-sage-500 text-sm font-mono">{receiptData.transactionRef}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-brand-navy-200 dark:border-brand-navy-700">
              <span className="text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Member:' : 'Hội viên:'}</span>
              <span className="font-bold text-brand-navy-900 dark:text-white">{receiptData.member.fullName} ({receiptData.member.memberCode})</span>
            </div>
            <div className="flex justify-between py-1 border-b border-brand-navy-200 dark:border-brand-navy-700">
              <span className="text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Package:' : 'Gói tập đăng ký:'}</span>
              <span className="font-bold text-brand-navy-900 dark:text-white">{receiptData.package.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-brand-navy-200 dark:border-brand-navy-700">
              <span className="text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'New Expiry Date:' : 'Thời hạn sử dụng mới:'}</span>
              <span className="font-bold text-brand-sage-700 dark:text-brand-sage-500">{receiptData.member.packageExpiry || (isEn ? 'Awaiting full payment' : 'Chờ thanh toán đủ')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-brand-navy-200 dark:border-brand-navy-700">
              <span className="text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Payment Method:' : 'Phương thức:'}</span>
              <span className="font-bold text-brand-navy-900 dark:text-white">{receiptData.paymentMethod}</span>
            </div>
            <div className="flex justify-between py-1 text-sm font-black text-brand-navy-900 dark:text-white pt-2">
              <span>{isEn ? 'Amount Paid:' : 'Số tiền đã thanh toán:'}</span>
              <span className="text-brand-sage-700 dark:text-brand-sage-500 font-chivo">{Number(receiptData.amountPaid).toLocaleString('vi-VN')} VNĐ</span>
            </div>
            <div className="flex justify-between text-brand-navy-600 dark:text-brand-navy-300">
              <span>{isEn ? 'Received:' : 'Tiền thực nhận:'}</span>
              <strong>{Number(receiptData.amountReceived).toLocaleString('vi-VN')} VNĐ</strong>
            </div>
            <div className="flex justify-between text-brand-navy-600 dark:text-brand-navy-300">
              <span>{isEn ? 'Change Due:' : 'Trả lại:'}</span>
              <strong>{Number(receiptData.changeDue).toLocaleString('vi-VN')} VNĐ</strong>
            </div>
            <div className="flex justify-between text-brand-navy-600 dark:text-brand-navy-300">
              <span>{isEn ? 'Remaining Balance:' : 'Còn phải thu:'}</span>
              <strong>{Number(receiptData.outstandingBalance).toLocaleString('vi-VN')} VNĐ</strong>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <a
              href={`#/receptionist/invoices?query=${encodeURIComponent(receiptData.invoiceNumber)}`}
              className="rounded-xl bg-brand-sage-700 hover:bg-brand-sage-900 px-5 py-2.5 text-xs font-bold text-white uppercase font-chivo tracking-wider transition-all hover-lift shadow-sm"
            >
              {isEn ? 'View / Print Invoice' : 'Xem / In hóa đơn'}
            </a>
            <button
              onClick={() => { setStep(1); setReceiptData(null); }}
              className="px-5 py-2.5 bg-brand-navy-100 dark:bg-brand-navy-800 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700 text-brand-navy-800 dark:text-brand-navy-200 font-chivo text-xs font-bold uppercase tracking-wider rounded-xl transition-all hover-lift cursor-pointer"
            >
              {isEn ? 'New Transaction' : 'Thực Hiện Giao Dịch Mới'}
            </button>
            <a
              href={`#/receptionist/lookup?query=${encodeURIComponent(receiptData.member.memberCode)}`}
              className="px-5 py-2.5 bg-brand-sage-500/20 hover:bg-brand-sage-500/30 text-brand-sage-700 dark:text-brand-sage-500 font-chivo text-xs font-bold uppercase tracking-wider rounded-xl border border-brand-sage-500/40 transition-all hover-lift flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">person_search</span>
              <span>{isEn ? 'Verify Profile' : 'Kiểm Tra Thẻ Đã Gia Hạn'}</span>
            </a>
            <a
              href={`#/receptionist/check-in?query=${encodeURIComponent(receiptData.member.memberCode)}`}
              className="px-5 py-2.5 bg-brand-sage-700 hover:bg-brand-sage-900 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all hover-lift flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
              <span>{isEn ? 'Go to Gate Check-in' : 'Đi Đến Cổng Check-in'}</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
