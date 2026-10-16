import { packageApi, memberApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { openPaymentCheckout } from '../../services/paymentCheckout.js';
import { formatMemberDate } from './memberOverview.js';

const { useState, useEffect, useRef } = React;

export function MemberPackages() {
  const { currentUser, refreshUser } = useAuth();
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
      showError(error.message || 'Không thể tải danh mục gói tập.');
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
      showSuccess(`Đã hủy hóa đơn ${invoiceNumber} thành công. Bạn có thể chọn gói mới.`);
      setConflictModalOpen(false);
      setConflictData(null);
      await loadData();
    } catch (err) {
      showError(err.message || 'Không thể hủy hóa đơn.');
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
        if (cancelled) showWarning('Đã hủy thanh toán. Bạn có thể tiếp tục chọn gói tập hoặc thanh toán hóa đơn chờ.');
        else if (failed) showWarning('Chưa thể xác nhận thanh toán. Vui lòng kiểm tra trạng thái hóa đơn trước khi thử lại.');
        else if (closed) showInfo('Đã đóng cửa sổ thanh toán. Đang cập nhật trạng thái hóa đơn.');
        else showInfo('Đã quay lại trang gói tập. Trạng thái thanh toán được cập nhật từ hệ thống.');
        loadData();
        refreshUser().catch(error => showError(error.message || 'Không thể cập nhật thông tin gói tập.'));
      });
      checkoutRef.current = checkout;
      const res = await memberApi.subscribeOnline({
        memberId: currentUser.id,
        packageId: selectedPkg.id,
        paymentMethod,
        invoiceNumber: activeInvoiceNumber || undefined
      });
      if (checkoutRef.current !== checkout) return;
      if (!res.paymentUrl) throw new Error('Backend không trả về địa chỉ thanh toán.');
      if (checkout.navigate(res.paymentUrl)) setModalOpen(false);
    } catch (err) {
      // An earlier API response must not close a checkout opened after it.
      if (checkout && checkoutRef.current !== checkout) return;
      checkoutRef.current?.dispose();
      checkoutRef.current = null;
      const errMsg = err.message || 'Lỗi thanh toán';
      const match = errMsg.match(/\((SC-[^\)]+)\)/);
      if (match || errMsg.includes('hóa đơn chờ thanh toán')) {
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

  if (loading) return <LoadingSpinner text="Đang tải danh mục gói tập..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
          SUBSCRIBE / RENEW PACKAGE
        </span>
        <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
          Đăng Ký & Gia Hạn Gói Tập Trực Tuyến
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Lựa chọn gói rèn luyện phù hợp với mục tiêu thể lực của bạn. Kích hoạt trực tuyến tức thì.
        </p>
      </div>

      {/* Pending Invoices Warning Banner */}
      {pendingInvoices.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600 text-[22px]">pending_actions</span>
            <span className="font-chivo font-black text-sm uppercase tracking-wide">
              Bạn có hóa đơn chờ thanh toán
            </span>
          </div>
          <p className="text-xs text-amber-800">
            Nếu bạn đã lỡ bấm đăng ký mà chưa thanh toán, bạn có thể tiếp tục thanh toán hoặc hủy hóa đơn để chọn gói tập khác.
          </p>
          <div className="space-y-2">
            {pendingInvoices.map(inv => {
              const matchedPkg = packages.find(p => p.id === inv.packageId);
              return (
                <div key={inv.invoiceNumber} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-amber-200">
                  <div className="text-xs">
                    <span className="font-bold text-slate-800">Gói: {inv.packageName}</span>
                    <span className="text-slate-400 mx-1.5">•</span>
                    <span className="font-black text-red-600 font-chivo">{inv.amount?.toLocaleString()} VNĐ</span>
                    <span className="text-slate-400 mx-1.5">•</span>
                    <span className="text-slate-500 font-mono">Mã: {inv.invoiceNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCancelPending(inv.invoiceNumber)}
                      disabled={cancelling}
                      className="px-3 py-1.5 text-xs font-bold font-chivo uppercase rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition"
                    >
                      {cancelling ? 'Đang hủy...' : 'Hủy Hóa Đơn Này'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenCheckout(matchedPkg || { id: inv.packageId, name: inv.packageName, price: inv.amount, durationDays: inv.durationDays }, inv.invoiceNumber)}
                      className="px-3.5 py-1.5 text-xs font-bold font-chivo uppercase rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow transition"
                    >
                      Tiếp Tục Thanh Toán
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Package Reminder */}
      <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-red-400">Gói tập hiện tại của bạn:</span>
          <div className="font-chivo text-lg font-black">{currentUser?.packageName || 'Chưa đăng ký gói'}</div>
        </div>
        <div className="text-xs text-slate-300">
          Hạn sử dụng: <strong className="text-white">{currentUser?.packageExpiry || 'Hết hạn'}</strong>
        </div>
      </div>

      {currentUser?.scheduledSubscriptions?.length > 0 && <section aria-label="Gói đã thanh toán chờ hiệu lực" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
        <h2 className="font-bold text-sm text-emerald-900">Gói đã thanh toán, chờ ngày bắt đầu</h2>
        <p className="text-sm text-emerald-800">Gói mới được xếp nối tiếp sau gói hiện tại. Bạn chưa cần thanh toán lại.</p>
        {currentUser.scheduledSubscriptions.map(subscription => <p key={subscription.subscriptionId} className="text-sm text-emerald-900">
          <strong>{subscription.packageName}</strong> · {formatMemberDate(subscription.startDate)} – {formatMemberDate(subscription.endDate)}
        </p>)}
      </section>}

      {/* Package Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.map(pkg => {
          const isCurrent = currentUser?.packageId === pkg.id && currentUser?.packageStatus === 'ACTIVE';
          const pendingInv = pendingInvoices.find(p => p.packageId === pkg.id);
          return (
            <div
              key={pkg.id}
              className={`bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all relative ${
                pendingInv
                  ? 'border-amber-400 ring-2 ring-amber-400/20'
                  : pkg.badge === 'VIP OLYMPIC'
                  ? 'border-red-500 ring-2 ring-red-500/20'
                  : 'border-slate-200'
              }`}
            >
              {pendingInv ? (
                <span className="absolute top-4 right-4 px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-chivo text-[10px] font-black uppercase tracking-wider border border-amber-300">
                  Chờ Thanh Toán
                </span>
              ) : pkg.badge ? (
                <span className="absolute top-4 right-4 px-2 py-0.5 rounded bg-red-50 text-red-600 font-chivo text-[10px] font-black uppercase tracking-wider border border-red-200">
                  {pkg.badge}
                </span>
              ) : null}

              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {pkg.durationDays} Ngày rèn luyện
                </div>
                <h3 className="font-chivo text-lg font-black text-slate-900 leading-tight mt-1">
                  {pkg.name}
                </h3>

                <div className="mt-4 mb-4">
                  <span className="font-chivo text-3xl font-black text-red-600">
                    {pkg.price.toLocaleString()}đ
                  </span>
                  <span className="text-xs text-slate-500 font-medium ml-1">/ gói</span>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 text-xs text-slate-700 font-semibold mb-3 border border-slate-100">
                  Môn áp dụng: {pkg.allowedSports === 15 ? 'Toàn quyền 15 môn' : `${pkg.allowedSports} môn tự chọn`}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {pkg.description}
                </p>

                {pkg.features && (
                  <ul className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100 mb-6">
                    {pkg.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-emerald-600 text-[16px] shrink-0 mt-0.5">check_circle</span>
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
                    Tiếp Tục Thanh Toán
                  </button>
                  <button
                    onClick={() => handleCancelPending(pendingInv.invoiceNumber)}
                    disabled={cancelling}
                    className="w-full py-1.5 rounded-xl font-chivo text-[11px] font-bold uppercase tracking-wider border border-red-200 text-red-600 hover:bg-red-50 transition-all"
                  >
                    {cancelling ? 'Đang hủy...' : 'Hủy Hóa Đơn Này'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleOpenCheckout(pkg)}
                  className={`w-full py-2.5 rounded-xl font-chivo text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
                    isCurrent
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isCurrent ? 'Gia Hạn Thêm Chu Kỳ' : 'Đăng Ký Gói Này'}
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
        title={activeInvoiceNumber ? "Tiếp Tục Thanh Toán Hóa Đơn Chờ" : "Thanh Toán Trực Tuyến Gói Tập"}
      >
        {selectedPkg && (
          <div className="space-y-4">
            {activeInvoiceNumber && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                <span>Mã hóa đơn: <strong className="font-mono">{activeInvoiceNumber}</strong></span>
                <button
                  type="button"
                  onClick={() => handleCancelPending(activeInvoiceNumber)}
                  disabled={cancelling}
                  className="text-red-600 font-bold hover:underline"
                >
                  {cancelling ? 'Đang hủy...' : 'Hủy hóa đơn này'}
                </button>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Gói đăng ký:</span>
                <span className="font-bold text-slate-900">{selectedPkg.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời hạn sử dụng:</span>
                <span className="font-bold text-slate-900">{selectedPkg.durationDays} ngày</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black">
                <span>Số tiền thanh toán:</span>
                <span className="text-red-600 font-chivo">{selectedPkg.price?.toLocaleString()} VNĐ</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Chọn cổng thanh toán *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['VNPAY', 'MOMO'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`p-3 rounded-xl border text-xs font-chivo font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === m
                        ? 'bg-red-600 text-white border-red-600 shadow-md'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
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

            <div className="p-3 rounded-xl bg-blue-50 text-blue-900 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">verified</span>
              <span>Thanh toán mở trong cửa sổ riêng. Khi hủy hoặc hoàn tất, bạn quay lại trang gói tập đang đăng nhập. Thẻ tập được kích hoạt sau khi hệ thống xác nhận giao dịch.</span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleConfirmSubscribe}
                disabled={processing}
                className="px-6 py-2.5 text-xs font-bold font-chivo uppercase tracking-wider rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors"
              >
                {processing ? 'Đang kết nối cổng...' : 'Xác Nhận Thanh Toán'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Conflict Resolution Modal */}
      <Modal
        isOpen={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        title="Đã Có Hóa Đơn Chờ Cho Gói Này"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
            <p className="font-semibold text-slate-800">
              Bạn đang có một hóa đơn chờ thanh toán cho gói <strong>{conflictData?.package?.name}</strong>.
            </p>
            {conflictData?.invoiceNumber && (
              <p className="text-slate-600">
                Mã hóa đơn: <strong className="font-mono text-slate-900">{conflictData.invoiceNumber}</strong>
              </p>
            )}
            <p className="text-slate-500 mt-1">
              Bạn có thể tiếp tục thanh toán hóa đơn này hoặc hủy đi để thao tác lại từ đầu.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setConflictModalOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              Để Sau
            </button>
            {conflictData?.invoiceNumber && (
              <button
                type="button"
                onClick={() => handleCancelPending(conflictData.invoiceNumber)}
                disabled={cancelling}
                className="px-4 py-2 text-xs font-bold font-chivo uppercase tracking-wider rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition"
              >
                {cancelling ? 'Đang hủy...' : 'Hủy Hóa Đơn Chờ Này'}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setConflictModalOpen(false);
                handleOpenCheckout(conflictData?.package, conflictData?.invoiceNumber);
              }}
              className="px-5 py-2.5 text-xs font-bold font-chivo uppercase tracking-wider rounded-lg bg-red-600 hover:bg-red-700 text-white shadow transition"
            >
              Tiếp Tục Thanh Toán
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
