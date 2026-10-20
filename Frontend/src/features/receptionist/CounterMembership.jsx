import React, { useState, useEffect, useRef } from 'react';
import { receptionApi, packageApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { Badge } from '../../components/common/StatCard.js';
import { createIdempotencyKey } from '../../services/http.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { openPaymentCheckout } from '../../services/paymentCheckout.js';

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
        showError(e.message || (isEn ? 'Failed to load packages or members.' : 'Không thể tải hội viên hoặc gói tập từ backend.'));
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
        if (!result.paymentUrl) throw new Error(isEn ? 'Backend did not return a VNPay URL.' : 'Backend không trả về địa chỉ VNPay.');
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
      <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#40916C] text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-emerald-700/30 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-300/15 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-[#F2CC8F]/15 blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <span className="font-chivo text-xs uppercase tracking-widest text-[#F2CC8F] font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#81B29A] animate-pulse" />
            {isEn ? 'COUNTER CASHIER & MEMBERSHIP RENEWAL' : 'THU NGÂN & GIA HẠN GÓI TẬP TẠI QUẦY'}
          </span>
          <h1 className="font-chivo text-2xl md:text-3xl font-black mt-1 text-white tracking-tight">
            {isEn ? 'Counter Package Sign-up & Renewal' : 'Đăng Ký & Gia Hạn Gói Tập Tại Quầy'}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            {isEn
              ? 'Select a member and package, then collect cash or open the VNPay Sandbox checkout.'
              : 'Chọn thành viên và gói tập, sau đó thu tiền mặt hoặc mở cổng VNPay Sandbox.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 relative z-10 shrink-0">
          <a
            href="#/receptionist/invoices"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all border border-white/15 hover-lift flex items-center gap-2 backdrop-blur-sm"
          >
            <span className="material-symbols-outlined text-[18px] text-[#F2CC8F]">receipt_long</span>
            <span>{isEn ? 'Invoices & Billing' : 'Hóa Đơn & Thu Tiền'}</span>
          </a>
          <a
            href="#/receptionist/check-in"
            className="px-4 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all shadow-md hover-lift flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
            <span>{isEn ? 'Gate Check-in' : 'Check-in Vào Sân'}</span>
          </a>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-800 dark:text-red-300">
          {loadError}
          <button onClick={() => window.location.reload()} className="ml-3 underline font-bold cursor-pointer">
            {isEn ? 'Retry' : 'Thử lại'}
          </button>
        </div>
      )}

      {!loadError && packages.length === 0 && (
        <p className="text-sm text-amber-800 dark:text-amber-300">{isEn ? 'No packages are currently on sale.' : 'Trung tâm chưa có gói tập đang mở bán.'}</p>
      )}

      {/* Step Progress Tracker */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
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
                ? 'bg-[#1E2235] text-white shadow-md'
                : step > s.num
                  ? 'bg-[#2D6A4F]/15 text-[#2D6A4F] dark:text-[#81B29A]'
                  : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* STEP 1: SELECT MEMBER */}
      {step === 1 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover-lift transition-all">
          <h2 className="font-chivo text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#1E2235] text-white flex items-center justify-center text-xs font-black">1</span>
            {isEn ? 'Select Member for Sign-up / Renewal' : 'Chọn Hội Viên Cần Đăng Ký / Gia Hạn'}
          </h2>

          <form onSubmit={handleSearchMembers} className="flex gap-2">
            <input
              value={memberSearchQuery}
              onChange={event => setMemberSearchQuery(event.target.value)}
              placeholder={isEn ? 'Search by name, email, phone, or member card ID...' : 'Tìm theo tên, email, SĐT hoặc mã hội viên'}
              className="min-w-0 flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
            />
            <button
              type="submit"
              disabled={memberSearchLoading}
              className="rounded-xl bg-[#1E2235] hover:bg-[#2B2D42] px-5 py-2.5 text-xs font-bold text-white uppercase font-chivo tracking-wider disabled:opacity-50 cursor-pointer hover-lift transition-all"
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
                    ? 'bg-[#81B29A]/10 border-[#81B29A] ring-2 ring-[#81B29A]/20 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={m.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-900 dark:text-white truncate">{m.fullName}</div>
                    <div className="text-xs text-[#2D6A4F] dark:text-[#81B29A] font-semibold font-mono">{m.memberCode}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{m.phone}</div>
                  </div>
                  <Badge variant={m.packageStatus} size="sm">{m.packageStatus}</Badge>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
                  <span>{isEn ? 'Current pass:' : 'Gói hiện tại:'}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{m.packageName || (isEn ? 'None' : 'Chưa có')}</span>
                </div>
              </div>
            ))}
          </div>
          {members.length === 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEn ? 'Enter keywords above to find members in the system.' : 'Nhập từ khóa để tìm hội viên từ backend.'}
            </p>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setStep(2)}
              disabled={!selectedMember}
              className="px-6 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-50 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 hover-lift cursor-pointer"
            >
              <span>{isEn ? 'Next: Choose Package' : 'Tiếp Tục: Chọn Gói Tập'}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT PACKAGE */}
      {step === 2 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover-lift transition-all">
          <div className="flex items-center justify-between">
            <h2 className="font-chivo text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#1E2235] text-white flex items-center justify-center text-xs font-black">2</span>
              {isEn ? `Select Package for ${selectedMember?.fullName}` : `Lựa Chọn Gói Tập Cho ${selectedMember?.fullName}`}
            </h2>
            <button onClick={() => setStep(1)} className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer">
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
                    ? 'bg-[#81B29A]/10 border-[#81B29A] ring-2 ring-[#81B29A]/20 shadow-md'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-[10px] font-black uppercase text-[#2D6A4F] dark:text-[#81B29A] mb-1">
                    {pkg.badge || (isEn ? 'MEMBERSHIP' : 'GÓI TẬP')}
                  </div>
                  <h3 className="font-chivo text-base font-black text-slate-900 dark:text-white leading-tight">{pkg.name}</h3>
                  <div className="text-2xl font-black text-[#2D6A4F] dark:text-[#81B29A] font-chivo mt-3">
                    {pkg.price.toLocaleString()}đ
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {isEn ? 'Duration' : 'Thời hạn'}: {pkg.durationDays} {isEn ? 'days' : 'ngày'}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">{pkg.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Sports included:' : 'Môn rèn luyện:'}</span>
                  <span className="text-slate-900 dark:text-white">
                    {pkg.allowedSports === 15 ? (isEn ? 'All 15 disciplines' : 'Toàn bộ 15 môn') : `${pkg.allowedSports} ${isEn ? 'disciplines' : 'môn'}`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              {isEn ? 'Back' : 'Quay lại'}
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!selectedPackage}
              className="px-6 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-50 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 hover-lift cursor-pointer"
            >
              <span>{isEn ? 'Next: Payment' : 'Tiếp Tục: Thanh Toán'}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PAYMENT CONFIRMATION */}
      {step === 3 && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 max-w-2xl mx-auto hover-lift transition-all">
          <h2 className="font-chivo text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#1E2235] text-white flex items-center justify-center text-xs font-black">3</span>
            {isEn ? 'Counter Payment & VNPay Sandbox' : 'Xác Nhận & Thanh Toán Tại Quầy'}
          </h2>

          {/* Invoice Summary Box */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex justify-between text-xs pb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Member:' : 'Hội viên đăng ký:'}</span>
              <span className="font-bold text-slate-900 dark:text-white">{selectedMember?.fullName} ({selectedMember?.memberCode})</span>
            </div>
            <div className="flex justify-between text-xs pb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Package:' : 'Gói tập lựa chọn:'}</span>
              <span className="font-bold text-slate-900 dark:text-white">{selectedPackage?.name} ({selectedPackage?.durationDays} {isEn ? 'days' : 'ngày'})</span>
            </div>
            <div className="flex justify-between text-xs pb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Base Fee:' : 'Phí dịch vụ:'}</span>
              <span className="font-bold text-slate-900 dark:text-white">{selectedPackage?.price.toLocaleString()}đ</span>
            </div>
            <div className="flex justify-between items-center pt-1 text-sm font-black text-slate-900 dark:text-white">
              <span>{isEn ? 'TOTAL DUE:' : 'TỔNG TIỀN PHẢI THU:'}</span>
              <span className="text-2xl font-chivo text-[#2D6A4F] dark:text-[#81B29A]">{selectedPackage?.price.toLocaleString()} VNĐ</span>
            </div>

            {selectedMember?.packageStatus === 'ACTIVE' && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              {isEn ? 'Payment Method *' : 'Hình thức thu tiền *'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'TIỀN MẶT', label: isEn ? 'CASH' : 'TIỀN MẶT', icon: 'payments' },
                { id: 'VNPAY', label: 'VNPAY SANDBOX', icon: 'qr_code_2' }
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  aria-pressed={paymentMethod === m.id}
                  className={`p-3.5 rounded-xl border text-xs font-chivo font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer hover-lift ${
                    paymentMethod === m.id
                      ? 'bg-[#1E2235] text-white border-[#1E2235] shadow-md ring-2 ring-[#81B29A]/30'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {paymentMethod === 'TIỀN MẶT' && (
              <label className="block mt-3 text-xs font-bold text-slate-700 dark:text-slate-300">
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
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
                />
                <span className="block mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {isEn ? 'Partial payment: pass pending until fully paid. Change will be calculated automatically.' : 'Thu một phần: gói chờ thu đủ. Tiền dư sẽ được ghi là tiền trả lại.'}
                </span>
              </label>
            )}

            {paymentMethod === 'VNPAY' && (
              <div className="mt-3 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-2.5 border border-blue-100 dark:border-blue-900/50">
                <span className="material-symbols-outlined text-[20px] text-blue-600 shrink-0">verified_user</span>
                <p className="leading-relaxed">
                  {isEn
                    ? 'VNPay Sandbox opens in a secure payment window. The package activates only after the backend verifies the gateway response.'
                    : 'VNPay Sandbox sẽ mở trong cửa sổ thanh toán riêng. Gói tập chỉ được kích hoạt sau khi backend xác minh phản hồi từ cổng.'}
                </p>
              </div>
            )}
          </div>

          {/* Pending Invoice Warning & Cancel Option */}
          {pendingInvoice && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 space-y-3 animate-fade-slide-up">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[24px] mt-0.5 shrink-0">
                  pending_actions
                </span>
                <div className="flex-1 text-xs space-y-1">
                  <div className="font-chivo font-black text-amber-900 dark:text-amber-100 uppercase tracking-wide">
                    {isEn ? 'Pending Invoice Already Exists' : 'Hóa Đơn Chờ Thanh Toán Đã Tồn Tại'}
                  </div>
                  <p className="text-amber-800 dark:text-amber-300">
                    {isEn ? 'Member already has pending invoice:' : 'Hội viên đã có hóa đơn chờ:'}{' '}
                    <span className="font-mono font-bold text-amber-950 dark:text-white bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
                      {pendingInvoice}
                    </span>
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    {isEn
                      ? 'You can click below to cancel the pending order and activate the new payment immediately.'
                      : 'Bạn có thể bấm nút bên dưới để hủy đơn chờ này và kích hoạt thanh toán mới ngay tại bàn.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200 dark:border-amber-800">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleCancelPendingAndRetry(pendingInvoice)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-chivo text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all hover-lift flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  <span>{isEn ? 'Cancel Pending & Activate Now' : 'Hủy Hóa Đơn Chờ & Kích Hoạt Ngay'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPendingInvoice(null)}
                  className="px-3 py-2 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg transition-colors cursor-pointer"
                >
                  {isEn ? 'Dismiss' : 'Đóng cảnh báo'}
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              {isEn ? 'Back' : 'Quay lại'}
            </button>
            <button
              onClick={() => handleProcessPayment()}
              disabled={processing}
              className="px-6 py-3 bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-50 text-white font-chivo text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all hover-lift flex items-center gap-2 cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[20px] ${processing ? 'animate-spin' : ''}`} aria-hidden="true">
                {processing ? 'progress_activity' : paymentMethod === 'VNPAY' ? 'open_in_new' : 'check_circle'}
              </span>
              <span>{processing
                ? (paymentMethod === 'VNPAY' ? (isEn ? 'Connecting VNPay...' : 'Đang kết nối VNPay...') : (isEn ? 'Processing...' : 'Đang ghi nhận...'))
                : (paymentMethod === 'VNPAY' ? (isEn ? 'Open VNPay Sandbox' : 'Mở VNPay Sandbox') : (isEn ? 'Confirm Payment' : 'Xác nhận khoản thu'))}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: RECEIPT & TRANSACTION REF */}
      {step === 4 && receiptData && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 max-w-xl mx-auto text-center hover-lift transition-all animate-fade-slide-up">
          <div className="w-16 h-16 rounded-full bg-[#2D6A4F]/15 text-[#2D6A4F] dark:text-[#81B29A] flex items-center justify-center mx-auto shadow-sm">
            <span className="material-symbols-outlined text-[36px]">receipt_long</span>
          </div>

          <div>
            <span className="font-chivo text-xs font-black uppercase tracking-widest text-[#2D6A4F] dark:text-[#81B29A]">
              {isEn ? 'PAYMENT RECORDED SUCCESSFULLY' : 'ĐÃ GHI NHẬN KHOẢN THU'}
            </span>
            <h2 className="font-chivo text-2xl font-black text-slate-900 dark:text-white mt-1">
              {isEn ? 'SCMS Member Receipt & Access Pass' : 'Biên Lai Đăng Ký Thẻ Hội Viên SCMS'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {receiptData.outstandingBalance > 0
                ? (isEn ? 'Partial payment recorded. Pass will activate once full balance is cleared.' : 'Đã thu một phần. Gói sẽ được kích hoạt khi thu đủ.')
                : (isEn ? 'Full payment collected. Pass validity updated according to active schedules.' : 'Đã thu đủ. Ngày hiệu lực được tính theo các gói hiện có của thành viên.')}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700 font-semibold">
              <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Transaction Ref:' : 'Mã Giao Dịch (TransactionRef):'}</span>
              <span className="font-chivo font-black text-[#2D6A4F] dark:text-[#81B29A] text-sm font-mono">{receiptData.transactionRef}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Member:' : 'Hội viên:'}</span>
              <span className="font-bold text-slate-900 dark:text-white">{receiptData.member.fullName} ({receiptData.member.memberCode})</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Package:' : 'Gói tập đăng ký:'}</span>
              <span className="font-bold text-slate-900 dark:text-white">{receiptData.package.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">{isEn ? 'New Expiry Date:' : 'Thời hạn sử dụng mới:'}</span>
              <span className="font-bold text-[#2D6A4F] dark:text-[#81B29A]">{receiptData.member.packageExpiry || (isEn ? 'Awaiting full payment' : 'Chờ thanh toán đủ')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Payment Method:' : 'Phương thức:'}</span>
              <span className="font-bold text-slate-900 dark:text-white">{receiptData.paymentMethod}</span>
            </div>
            <div className="flex justify-between py-1 text-sm font-black text-slate-900 dark:text-white pt-2">
              <span>{isEn ? 'Amount Paid:' : 'Số tiền đã thanh toán:'}</span>
              <span className="text-[#2D6A4F] dark:text-[#81B29A] font-chivo">{Number(receiptData.amountPaid).toLocaleString('vi-VN')} VNĐ</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>{isEn ? 'Received:' : 'Tiền thực nhận:'}</span>
              <strong>{Number(receiptData.amountReceived).toLocaleString('vi-VN')} VNĐ</strong>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>{isEn ? 'Change Due:' : 'Trả lại:'}</span>
              <strong>{Number(receiptData.changeDue).toLocaleString('vi-VN')} VNĐ</strong>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>{isEn ? 'Remaining Balance:' : 'Còn phải thu:'}</span>
              <strong>{Number(receiptData.outstandingBalance).toLocaleString('vi-VN')} VNĐ</strong>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <a
              href={`#/receptionist/invoices?query=${encodeURIComponent(receiptData.invoiceNumber)}`}
              className="rounded-xl bg-[#1E2235] hover:bg-[#2B2D42] px-5 py-2.5 text-xs font-bold text-white uppercase font-chivo tracking-wider transition-all hover-lift shadow-sm"
            >
              {isEn ? 'View / Print Invoice' : 'Xem / In hóa đơn'}
            </a>
            <button
              onClick={() => { setStep(1); setReceiptData(null); }}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-chivo text-xs font-bold uppercase tracking-wider rounded-xl transition-all hover-lift cursor-pointer"
            >
              {isEn ? 'New Transaction' : 'Thực Hiện Giao Dịch Mới'}
            </button>
            <a
              href={`#/receptionist/lookup?query=${encodeURIComponent(receiptData.member.memberCode)}`}
              className="px-5 py-2.5 bg-[#81B29A]/20 hover:bg-[#81B29A]/30 text-[#2D6A4F] dark:text-[#81B29A] font-chivo text-xs font-bold uppercase tracking-wider rounded-xl border border-[#81B29A]/40 transition-all hover-lift flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">person_search</span>
              <span>{isEn ? 'Verify Profile' : 'Kiểm Tra Thẻ Đã Gia Hạn'}</span>
            </a>
            <a
              href={`#/receptionist/check-in?query=${encodeURIComponent(receiptData.member.memberCode)}`}
              className="px-5 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all hover-lift flex items-center gap-1.5"
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
