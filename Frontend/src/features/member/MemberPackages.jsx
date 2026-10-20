import React, { useState, useEffect, useRef } from 'react';
import { packageApi, memberApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { openPaymentCheckout } from '../../services/paymentCheckout.js';
import { formatMemberDate } from './memberOverview.js';
import { translatePackageName } from '../../services/i18nHelper.js';

export function MemberPackages() {
  const { currentUser, refreshUser } = useAuth();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const checkoutRef = useRef(null);

  const [packages, setPackages] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Checkout Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('VNPAY');
  const [processing, setProcessing] = useState(false);
  const [activeInvoiceNumber, setActiveInvoiceNumber] = useState(null);

  // Conflict / Cancel Modal State
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const loadData = async () => {
    try {
      const [pkgs, pendings] = await Promise.all([
        packageApi.getAll(),
        memberApi.getMyPendingInvoices()
      ]);
      setPackages(pkgs.filter(p => p.status === 'ACTIVE'));
      setPendingInvoices(pendings || []);
    } catch (error) {
      showError(error.message || (isEn ? 'Failed to load membership packages.' : 'Không thể tải danh mục gói tập.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => {
      checkoutRef.current?.dispose();
      checkoutRef.current = null;
    };
  }, []);

  const handleOpenCheckout = (pkg, existingInvoiceNumber = null) => {
    setSelectedPkg(pkg);
    setActiveInvoiceNumber(existingInvoiceNumber);
    setModalOpen(true);
  };

  const handleCancelPending = async (invoiceNumber) => {
    if (!invoiceNumber) return;
    setCancelling(true);
    try {
      await memberApi.cancelPendingInvoice(invoiceNumber);
      showSuccess(isEn ? `Invoice ${invoiceNumber} cancelled successfully. You can now choose a new package.` : `Đã hủy hóa đơn ${invoiceNumber} thành công. Bạn có thể chọn gói mới.`);
      setConflictModalOpen(false);
      setConflictData(null);
      await loadData();
    } catch (err) {
      showError(err.message || (isEn ? 'Cannot cancel invoice.' : 'Không thể hủy hóa đơn.'));
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirmSubscribe = async () => {
    if (!selectedPkg || !currentUser || processing || checkoutRef.current) return;

    setProcessing(true);
    let checkout = null;
    try {
      checkout = openPaymentCheckout(({ cancelled, failed, closed }) => {
        checkoutRef.current = null;
        setProcessing(false);
        if (cancelled) showWarning(isEn ? 'Payment cancelled. You can continue selecting a package or pay pending invoice.' : 'Đã hủy thanh toán. Bạn có thể tiếp tục chọn gói tập hoặc thanh toán hóa đơn chờ.');
        else if (failed) showWarning(isEn ? 'Cannot confirm payment yet. Please verify your invoice status before retrying.' : 'Chưa thể xác nhận thanh toán. Vui lòng kiểm tra trạng thái hóa đơn trước khi thử lại.');
        else if (closed) showInfo(isEn ? 'Payment window closed. Updating invoice status...' : 'Đã đóng cửa sổ thanh toán. Đang cập nhật trạng thái hóa đơn.');
        else showInfo(isEn ? 'Returned to packages page. Payment status is updated from the system.' : 'Đã quay lại trang gói tập. Trạng thái thanh toán được cập nhật từ hệ thống.');
        loadData();
        refreshUser().catch(error => showError(error.message || (isEn ? 'Cannot update package information.' : 'Không thể cập nhật thông tin gói tập.')));
      });
      checkoutRef.current = checkout;
      const res = await memberApi.subscribeOnline({
        memberId: currentUser.id,
        packageId: selectedPkg.id,
        paymentMethod,
        invoiceNumber: activeInvoiceNumber || undefined
      });
      if (checkoutRef.current !== checkout) return;
      if (!res.paymentUrl) throw new Error(isEn ? 'Backend did not return payment URL.' : 'Backend không trả về địa chỉ thanh toán.');
      if (checkout.navigate(res.paymentUrl)) setModalOpen(false);
    } catch (err) {
      // An earlier API response must not close a checkout opened after it.
      if (checkout && checkoutRef.current !== checkout) return;
      checkoutRef.current?.dispose();
      checkoutRef.current = null;
      const errMsg = err.message || (isEn ? 'Payment error' : 'Lỗi thanh toán');
      const match = errMsg.match(/\((SC-[^\)]+)\)/);
      if (match || errMsg.includes('hóa đơn chờ thanh toán') || errMsg.includes('pending invoice')) {
        const invNum = match ? match[1] : (pendingInvoices.find(p => p.packageId === selectedPkg.id)?.invoiceNumber || null);
        setConflictData({
          invoiceNumber: invNum,
          package: selectedPkg
        });
        setModalOpen(false);
        setConflictModalOpen(true);
      } else {
        showError(errMsg);
      }
    } finally {
      if (!checkoutRef.current) setProcessing(false);
    }
  };

  if (loading) return <LoadingSpinner text={isEn ? "Loading membership packages..." : "Đang tải danh mục gói tập..."} />;

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Header */}
      <div>
        <span className="font-chivo text-xs font-bold uppercase tracking-wider text-[#2D6A4F] dark:text-[#81B29A]">
          SUBSCRIBE / RENEW PACKAGE
        </span>
        <h1 className="font-chivo text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
          {isEn ? 'Subscribe & Renew Membership Online' : 'Đăng Ký & Gia Hạn Gói Tập Trực Tuyến'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {isEn ? 'Choose the training package that fits your fitness goals. Instant online activation.' : 'Lựa chọn gói rèn luyện phù hợp với mục tiêu thể lực của bạn. Kích hoạt trực tuyến tức thì.'}
        </p>
      </div>

      {/* Pending Invoices Warning Banner */}
      {pendingInvoices.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[22px]">pending_actions</span>
            <span className="font-chivo font-black text-sm uppercase tracking-wide">
              {isEn ? 'You have pending invoices' : 'Bạn có hóa đơn chờ thanh toán'}
            </span>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300">
            {isEn ? 'If you initiated registration without completing payment, you can continue payment or cancel the invoice to choose another package.' : 'Nếu bạn đã lỡ bấm đăng ký mà chưa thanh toán, bạn có thể tiếp tục thanh toán hoặc hủy hóa đơn để chọn gói tập khác.'}
          </p>
          <div className="space-y-2">
            {pendingInvoices.map(inv => {
              const matchedPkg = packages.find(p => p.id === inv.packageId);
              return (
                <div key={inv.invoiceNumber} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-amber-200 dark:border-amber-800/40">
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 dark:text-white">{isEn ? 'Package:' : 'Gói:'} {translatePackageName(inv.packageName, isEn)}</span>
                    <span className="text-slate-400 mx-1.5">•</span>
                    <span className="font-black text-[#E07A5F] font-chivo">{inv.amount?.toLocaleString()} VNĐ</span>
                    <span className="text-slate-400 mx-1.5">•</span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono">{isEn ? 'Code:' : 'Mã:'} {inv.invoiceNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCancelPending(inv.invoiceNumber)}
                      disabled={cancelling}
                      className="px-3 py-1.5 text-xs font-bold font-chivo uppercase rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                    >
                      {cancelling ? (isEn ? 'Cancelling...' : 'Đang hủy...') : (isEn ? 'Cancel This Invoice' : 'Hủy Hóa Đơn Này')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenCheckout(matchedPkg || { id: inv.packageId, name: inv.packageName, price: inv.amount, durationDays: inv.durationDays }, inv.invoiceNumber)}
                      className="px-3.5 py-1.5 text-xs font-bold font-chivo uppercase rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow transition"
                    >
                      {isEn ? 'Continue Payment' : 'Tiếp Tục Thanh Toán'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Package Reminder */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#1E2235] via-[#242A42] to-[#1E2235] text-white border border-white/10 shadow-lg hover-lift flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden transition-all">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#F2CC8F] tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#81B29A] animate-pulse"></span>
            {isEn ? 'Your current active package:' : 'Gói tập hiện tại của bạn:'}
          </span>
          <div className="font-chivo text-xl font-black mt-0.5">{translatePackageName(currentUser?.packageName, isEn)}</div>
        </div>
        <div className="text-xs text-slate-300 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
          {isEn ? 'Expiry date:' : 'Hạn sử dụng:'} <strong className="text-white ml-1">{formatMemberDate(currentUser?.packageExpiry, isEn)}</strong>
        </div>
      </div>

      {currentUser?.scheduledSubscriptions?.length > 0 && <section aria-label={isEn ? "Paid packages awaiting activation" : "Gói đã thanh toán chờ hiệu lực"} className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-2">
        <h2 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">{isEn ? 'Paid packages, awaiting start date' : 'Gói đã thanh toán, chờ ngày bắt đầu'}</h2>
        <p className="text-sm text-emerald-800 dark:text-emerald-300">{isEn ? 'New package queued sequentially after your current package. No extra payment required.' : 'Gói mới được xếp nối tiếp sau gói hiện tại. Bạn chưa cần thanh toán lại.'}</p>
        {currentUser.scheduledSubscriptions.map(subscription => <p key={subscription.subscriptionId} className="text-sm text-emerald-900 dark:text-emerald-200">
          <strong>{translatePackageName(subscription.packageName, isEn)}</strong> · {formatMemberDate(subscription.startDate, isEn)} – {formatMemberDate(subscription.endDate, isEn)}
        </p>)}
      </section>}

      {/* Package Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.map(pkg => {
          const isCurrent = currentUser?.packageId === pkg.id && currentUser?.packageStatus === 'ACTIVE';
          const pendingInv = pendingInvoices.find(p => p.packageId === pkg.id);
          const isVip = pkg.badge === 'VIP OLYMPIC' || (pkg.name && pkg.name.toLowerCase().includes('vip'));
          return (
            <div
              key={pkg.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-6 flex flex-col justify-between shadow-sm hover:shadow-xl hover-lift transition-all relative ${
                pendingInv
                  ? 'border-amber-400 ring-2 ring-amber-400/20'
                  : isVip
                  ? 'border-[#F2CC8F] ring-2 ring-[#F2CC8F]/25 dark:border-[#F2CC8F]/40'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {pendingInv ? (
                <span className="absolute top-4 right-4 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-chivo text-[10px] font-black uppercase tracking-wider border border-amber-300 dark:border-amber-800">
                  {isEn ? 'Pending Payment' : 'Chờ Thanh Toán'}
                </span>
              ) : pkg.badge ? (
                <span className={`absolute top-4 right-4 px-2.5 py-0.5 rounded font-chivo text-[10px] font-black uppercase tracking-wider ${
                  isVip ? 'athletic-tag-gold' : 'athletic-tag-sage'
                }`}>
                  {pkg.badge}
                </span>
              ) : null}

              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {pkg.durationDays} {isEn ? 'Days of Training' : 'Ngày rèn luyện'}
                </div>
                <h3 className="font-chivo text-lg font-black text-slate-900 dark:text-white leading-tight mt-1">
                  {translatePackageName(pkg.name, isEn)}
                </h3>

                <div className="mt-4 mb-4">
                  <span className="font-chivo text-3xl font-black text-slate-900 dark:text-white">
                    {pkg.price.toLocaleString()}đ
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium ml-1">{isEn ? '/ package' : '/ gói'}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 text-xs text-slate-700 dark:text-slate-300 font-semibold mb-3 border border-slate-100 dark:border-slate-700">
                  {isEn ? 'Applicable sports: ' : 'Môn áp dụng: '}{pkg.allowedSports === 15 ? (isEn ? 'Full access to 15 sports' : 'Toàn quyền 15 môn') : (isEn ? `${pkg.allowedSports} elective sports` : `${pkg.allowedSports} môn tự chọn`)}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  {pkg.description}
                </p>

                {pkg.features && (
                  <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 mb-6">
                    {pkg.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-[#81B29A] text-[16px] shrink-0 mt-0.5">check_circle</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {pendingInv ? (
                <div className="space-y-2">
                  <button
                    onClick={() => handleOpenCheckout(pkg, pendingInv.invoiceNumber)}
                    className="w-full py-2.5 rounded-xl font-chivo text-xs font-bold uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all"
                  >
                    {isEn ? 'Continue Payment' : 'Tiếp Tục Thanh Toán'}
                  </button>
                  <button
                    onClick={() => handleCancelPending(pendingInv.invoiceNumber)}
                    disabled={cancelling}
                    className="w-full py-1.5 rounded-xl font-chivo text-[11px] font-bold uppercase tracking-wider border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                  >
                    {cancelling ? (isEn ? 'Cancelling...' : 'Đang hủy...') : (isEn ? 'Cancel This Invoice' : 'Hủy Hóa Đơn Này')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleOpenCheckout(pkg)}
                  className={`w-full py-2.5 rounded-xl font-chivo text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
                    isCurrent
                      ? 'bg-[#2D6A4F] text-white hover:bg-[#1B4332]'
                      : isVip
                      ? 'bg-gradient-to-r from-[#1E2235] to-[#2B2D42] text-[#F2CC8F] border border-[#F2CC8F]/40 hover:brightness-110'
                      : 'bg-[#1E2235] hover:bg-[#2B2D42] text-white dark:bg-[#81B29A] dark:text-slate-950 dark:hover:bg-[#6FA088]'
                  }`}
                >
                  {isCurrent ? (isEn ? 'Renew Another Cycle' : 'Gia Hạn Thêm Chu Kỳ') : (isEn ? 'Subscribe Now' : 'Đăng Ký Gói Này')}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Checkout Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={activeInvoiceNumber ? (isEn ? "Continue Paying Pending Invoice" : "Tiếp Tục Thanh Toán Hóa Đơn Chờ") : (isEn ? "Online Membership Subscription" : "Thanh Toán Trực Tuyến Gói Tập")}
      >
        {selectedPkg && (
          <div className="space-y-4">
            {activeInvoiceNumber && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                <span>{isEn ? 'Invoice Code:' : 'Mã hóa đơn:'} <strong className="font-mono">{activeInvoiceNumber}</strong></span>
                <button
                  type="button"
                  onClick={() => handleCancelPending(activeInvoiceNumber)}
                  disabled={cancelling}
                  className="text-red-600 font-bold hover:underline"
                >
                  {cancelling ? (isEn ? 'Cancelling...' : 'Đang hủy...') : (isEn ? 'Cancel this invoice' : 'Hủy hóa đơn này')}
                </button>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">{isEn ? 'Selected package:' : 'Gói đăng ký:'}</span>
                <span className="font-bold text-slate-900">{translatePackageName(selectedPkg.name, isEn)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isEn ? 'Duration:' : 'Thời hạn sử dụng:'}</span>
                <span className="font-bold text-slate-900">{selectedPkg.durationDays} {isEn ? 'days' : 'ngày'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm font-black">
                <span>{isEn ? 'Total payment:' : 'Số tiền thanh toán:'}</span>
                <span className="text-[#E07A5F] font-chivo">{selectedPkg.price?.toLocaleString()} VNĐ</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                {isEn ? 'Select payment gateway *' : 'Chọn cổng thanh toán *'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['VNPAY', 'MOMO'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`p-3 rounded-xl border text-xs font-chivo font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === m
                        ? 'bg-[#1E2235] text-white border-[#1E2235] shadow-md ring-2 ring-[#81B29A]/60'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {m === 'MOMO' ? 'account_balance_wallet' : 'credit_card'}
                    </span>
                    <span>{m}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-2 border border-blue-100 dark:border-blue-900/50">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">verified</span>
              <span>{isEn ? 'Payment opens in a separate window. When cancelled or completed, you return to your active packages page. Membership is activated once payment confirmation is received.' : 'Thanh toán mở trong cửa sổ riêng. Khi hủy hoặc hoàn tất, bạn quay lại trang gói tập đang đăng nhập. Thẻ tập được kích hoạt sau khi hệ thống xác nhận giao dịch.'}</span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                {isEn ? 'Close' : 'Đóng'}
              </button>
              <button
                type="button"
                onClick={handleConfirmSubscribe}
                disabled={processing}
                className="px-6 py-2.5 text-xs font-bold font-chivo uppercase tracking-wider rounded-lg bg-[#2D6A4F] hover:bg-[#1B4332] text-white shadow-md transition-colors"
              >
                {processing ? (isEn ? 'Connecting gateway...' : 'Đang kết nối cổng...') : (isEn ? 'Confirm Payment' : 'Xác Nhận Thanh Toán')}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Conflict Resolution Modal */}
      <Modal
        isOpen={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        title={isEn ? "Pending Invoice Exists For This Package" : "Đã Có Hóa Đơn Chờ Cho Gói Này"}
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <p className="font-semibold text-slate-800 dark:text-white">
              {isEn ? 'You have a pending invoice for package' : 'Bạn đang có một hóa đơn chờ thanh toán cho gói'} <strong>{translatePackageName(conflictData?.package?.name, isEn)}</strong>.
            </p>
            {conflictData?.invoiceNumber && (
              <p className="text-slate-600 dark:text-slate-400">
                {isEn ? 'Invoice Code:' : 'Mã hóa đơn:'} <strong className="font-mono text-slate-900 dark:text-white">{conflictData.invoiceNumber}</strong>
              </p>
            )}
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {isEn ? 'You can continue paying this invoice or cancel it to start over.' : 'Bạn có thể tiếp tục thanh toán hóa đơn này hoặc hủy đi để thao tác lại từ đầu.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setConflictModalOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              {isEn ? 'Later' : 'Để Sau'}
            </button>
            {conflictData?.invoiceNumber && (
              <button
                type="button"
                onClick={() => handleCancelPending(conflictData.invoiceNumber)}
                disabled={cancelling}
                className="px-4 py-2 text-xs font-bold font-chivo uppercase tracking-wider rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
              >
                {cancelling ? (isEn ? 'Cancelling...' : 'Đang hủy...') : (isEn ? 'Cancel This Pending Invoice' : 'Hủy Hóa Đơn Chờ Này')}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setConflictModalOpen(false);
                handleOpenCheckout(conflictData?.package, conflictData?.invoiceNumber);
              }}
              className="px-5 py-2.5 text-xs font-bold font-chivo uppercase tracking-wider rounded-lg bg-[#2D6A4F] hover:bg-[#1B4332] text-white shadow transition"
            >
              {isEn ? 'Continue Payment' : 'Tiếp Tục Thanh Toán'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
