import { receptionApi, packageApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { Badge } from '../../components/common/StatCard.js';
import { createIdempotencyKey } from '../../services/http.js';

const { useState, useEffect } = React;

export function CounterMembership() {
  const { showSuccess, showError } = useToast();

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
  const [posApprovalCode, setPosApprovalCode] = useState('');
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
        showError(e.message || 'Không thể tải hội viên hoặc gói tập từ backend.');
        setLoadError(e.message || 'Không thể tải dữ liệu thu ngân.');
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);
  useEffect(() => { setAmountReceived(String(selectedPackage?.price || '')); }, [selectedPackage?.id]);

  const handleSearchMembers = async event => {
    event.preventDefault();
    if (memberSearchQuery.trim().length < 2) {
      showError('Nhập ít nhất 2 ký tự để tìm hội viên.');
      return;
    }
    setMemberSearchLoading(true);
    setMembers([]); setSelectedMember(null);
    try {
      const results = await receptionApi.lookupMember(memberSearchQuery);
      setMembers(results);
      setSelectedMember(results.length === 1 ? results[0] : null);
      if (results.length === 0) showError('Không tìm thấy hội viên phù hợp.');
    } catch (error) {
      showError(error.message || 'Không thể tìm hội viên.');
    } finally {
      setMemberSearchLoading(false);
    }
  };

  const handleProcessPayment = async (overrideCancelPending = false) => {
    if (!selectedMember || !selectedPackage) return;
    const received = paymentMethod === 'THẺ POS' ? selectedPackage.price : Number(amountReceived);
    if (!Number.isFinite(received) || received <= 0) { showError('Nhập số tiền thực nhận lớn hơn 0.'); return; }
    const fingerprint = [selectedMember.id, selectedPackage.id, paymentMethod, received, posApprovalCode.trim(), overrideCancelPending === true].join(':');
    const idempotencyKey = checkoutAttempt.fingerprint === fingerprint && checkoutAttempt.key
      ? checkoutAttempt.key
      : createIdempotencyKey();
    setCheckoutAttempt({ fingerprint, key: idempotencyKey });
    setProcessing(true);
    try {
      const result = await receptionApi.registerCounterPackage({
        memberId: selectedMember.id,
        packageId: selectedPackage.id,
        paymentMethod,
        amountReceived: received,
        posApprovalCode,
        idempotencyKey,
        cancelPendingIfAny: overrideCancelPending === true
      });
      setReceiptData(result);
      setPendingInvoice(null);
      setCheckoutAttempt({ fingerprint: '', key: '' });
      showSuccess(result.message || 'Đã ghi nhận thanh toán tại quầy.');
      setStep(4);
    } catch (err) {
      const match = err.message && err.message.match(/SC-[A-Za-z0-9-]+/);
      if (match) {
        setPendingInvoice(match[0]);
      }
      showError(err.message || 'Lỗi thanh toán tại quầy!');
    } finally {
      setProcessing(false);
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
      showError(err.message || 'Lỗi khi hủy hóa đơn chờ!');
      setProcessing(false);
    }
  };

  if (loading) return <LoadingSpinner text="Đang chuẩn bị màn hình thu ngân..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
          REGISTER / RENEW PACKAGE AT COUNTER
        </span>
        <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
          Đăng Ký & Gia Hạn Gói Tập Tại Quầy
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Chọn thành viên và gói tập, ghi nhận tiền mặt hoặc mã chuẩn chi POS, rồi xem biên lai.
        </p>
      </div>

      {/* Step Progress Tracker */}
      {loadError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{loadError}<button onClick={() => window.location.reload()} className="ml-3 underline font-bold">Thử lại</button></div>}
      {!loadError && packages.length === 0 && <p className="text-sm text-amber-800">Trung tâm chưa có gói tập đang mở bán.</p>}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-2xl border border-slate-200">
        {[
          { num: 1, label: '1. Chọn Hội Viên' },
          { num: 2, label: '2. Chọn Gói Tập' },
          { num: 3, label: '3. Thanh Toán' },
          { num: 4, label: '4. Hóa Đơn & Kích Hoạt' }
        ].map(s => (
          <div
            key={s.num}
            className={`p-2.5 rounded-xl text-center text-xs font-chivo font-bold uppercase transition-all ${step === s.num
                ? 'bg-red-600 text-white shadow-sm'
                : step > s.num
                  ? 'bg-slate-100 text-slate-800'
                  : 'text-slate-400'
              }`}
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* STEP 1: SELECT MEMBER */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-chivo text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black">1</span>
            Chọn Hội Viên Cần Đăng Ký / Gia Hạn
          </h2>

          <form onSubmit={handleSearchMembers} className="flex gap-2">
            <input
              value={memberSearchQuery}
              onChange={event => setMemberSearchQuery(event.target.value)}
              placeholder="Tìm theo tên, email, SĐT hoặc mã hội viên"
              className="min-w-0 flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
            <button type="submit" disabled={memberSearchLoading} className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
              {memberSearchLoading ? 'Đang tìm...' : 'Tìm hội viên'}
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {members.map(m => (
              <div
                key={m.id}
                onClick={() => setSelectedMember(m)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedMember?.id === m.id
                    ? 'bg-red-50 border-red-500 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={m.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-900 truncate">{m.fullName}</div>
                    <div className="text-xs text-red-600 font-semibold">{m.memberCode}</div>
                    <div className="text-[11px] text-slate-500 truncate">{m.phone}</div>
                  </div>
                  <Badge variant={m.packageStatus} size="sm">{m.packageStatus}</Badge>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
                  <span>Gói hiện tại:</span>
                  <span className="font-semibold text-slate-800">{m.packageName || 'Chưa có'}</span>
                </div>
              </div>
            ))}
          </div>
          {members.length === 0 && <p className="text-xs text-slate-500">Nhập từ khóa để tìm hội viên từ backend.</p>}

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              disabled={!selectedMember}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-colors flex items-center gap-2"
            >
              <span>Tiếp Tục: Chọn Gói Tập</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT PACKAGE */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-chivo text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black">2</span>
              Lựa Chọn Gói Tập Cho {selectedMember?.fullName}
            </h2>
            <button onClick={() => setStep(1)} className="text-xs text-slate-500 hover:text-slate-800 underline">
              Đổi hội viên
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {packages.map(pkg => (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${selectedPackage?.id === pkg.id
                    ? 'bg-red-50/50 border-red-600 shadow-md ring-2 ring-red-600/20'
                    : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                <div>
                  <div className="text-[10px] font-black uppercase text-red-600 mb-1">{pkg.badge || 'GÓI TẬP'}</div>
                  <h3 className="font-chivo text-base font-black text-slate-900 leading-tight">{pkg.name}</h3>
                  <div className="text-2xl font-black text-red-600 font-chivo mt-3">
                    {pkg.price.toLocaleString()}đ
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Thời hạn: {pkg.durationDays} ngày</div>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">{pkg.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">Môn rèn luyện:</span>
                  <span className="text-slate-900">{pkg.allowedSports === 15 ? 'Toàn bộ 15 môn' : `${pkg.allowedSports} môn`}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Quay lại
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!selectedPackage}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-colors flex items-center gap-2"
            >
              <span>Tiếp Tục: Thanh Toán</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PAYMENT CONFIRMATION */}
      {step === 3 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-2xl mx-auto">
          <h2 className="font-chivo text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black">3</span>
            Xác Nhận & Thu Ngân Tại Bàn
          </h2>

          {/* Invoice Summary Box */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex justify-between text-xs pb-2 border-b border-slate-200">
              <span className="text-slate-500">Hội viên đăng ký:</span>
              <span className="font-bold text-slate-900">{selectedMember?.fullName} ({selectedMember?.memberCode})</span>
            </div>
            <div className="flex justify-between text-xs pb-2 border-b border-slate-200">
              <span className="text-slate-500">Gói tập lựa chọn:</span>
              <span className="font-bold text-slate-900">{selectedPackage?.name} ({selectedPackage?.durationDays} ngày)</span>
            </div>
            <div className="flex justify-between text-xs pb-2 border-b border-slate-200">
              <span className="text-slate-500">Phí dịch vụ:</span>
              <span className="font-bold text-slate-900">{selectedPackage?.price.toLocaleString()}đ</span>
            </div>
            <div className="flex justify-between items-center pt-1 text-sm font-black text-slate-900">
              <span>TỔNG TIỀN PHẢI THU:</span>
              <span className="text-2xl font-chivo text-red-600">{selectedPackage?.price.toLocaleString()} VNĐ</span>
            </div>

            {selectedMember?.packageStatus === 'ACTIVE' && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  <span>[RE-03] Dự kiến gia hạn nối tiếp gói tập</span>
                </div>
                <p>Hội viên đang có gói hiệu lực đến <strong>{selectedMember.packageExpiry}</strong>. Gói mới sẽ bắt đầu tiếp nối từ ngày kế tiếp và không làm mất số ngày còn lại.</p>
                <p className="text-[11px] text-amber-700 italic">* Bản nháp đề xuất: Cách tính ngày gia hạn cần được xác nhận thêm từ Ban Quản Lý.</p>
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Hình thức thu tiền *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['TIỀN MẶT', 'THẺ POS'].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`p-3 rounded-xl border text-xs font-chivo font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 ${paymentMethod === m
                      ? 'bg-red-600 text-white border-red-600 shadow-md'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {m === 'TIỀN MẶT' ? 'payments' : m.includes('QR') ? 'qr_code_2' : 'credit_card'}
                  </span>
                  <span>{m}</span>
                </button>
              ))}
            </div>
            {paymentMethod === 'TIỀN MẶT' && <label className="block mt-3 text-sm font-semibold">Số tiền thực nhận (VNĐ)
              <input aria-label="Số tiền thực nhận" type="number" min="0.01" max="1000000000" step="0.01" value={amountReceived} disabled={processing} onChange={e => setAmountReceived(e.target.value)} className="mt-1 w-full rounded-lg border p-3" />
              <span className="block mt-1 text-xs text-slate-500">Thu một phần: gói chờ thu đủ. Tiền dư sẽ được ghi là tiền trả lại.</span>
            </label>}
            {paymentMethod === 'THẺ POS' && (
              <label className="block mt-3 text-xs font-bold text-slate-700">
                Mã chuẩn chi POS *
                <input
                  required
                  value={posApprovalCode}
                  onChange={event => setPosApprovalCode(event.target.value)}
                  maxLength={100}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-normal"
                  placeholder="Nhập mã chuẩn chi từ máy POS"
                />
              </label>
            )}
          </div>

          {/* Pending Invoice Warning & Cancel Option */}
          {pendingInvoice && (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600 text-[24px] mt-0.5 shrink-0">
                  pending_actions
                </span>
                <div className="flex-1 text-xs space-y-1">
                  <div className="font-chivo font-black text-amber-900 uppercase tracking-wide">
                    Hóa Đơn Chờ Thanh Toán Đã Tồn Tại
                  </div>
                  <p className="text-amber-800">
                    Hội viên đã có hóa đơn chờ: <span className="font-mono font-bold text-amber-950 bg-amber-100 px-1.5 py-0.5 rounded">{pendingInvoice}</span>
                  </p>
                  <p className="text-[11px] text-amber-700">
                    Bạn có thể bấm nút bên dưới để hủy đơn chờ này và kích hoạt thanh toán mới ngay tại bàn.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleCancelPendingAndRetry(pendingInvoice)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-chivo text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  <span>Hủy Hóa Đơn Chờ & Kích Hoạt Ngay</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPendingInvoice(null)}
                  className="px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  Đóng cảnh báo
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Quay lại
            </button>
            <button
              onClick={() => handleProcessPayment()}
              disabled={processing}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-black uppercase tracking-wider rounded-xl shadow-lg hover:shadow-red-600/30 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span>{processing ? 'Đang ghi nhận...' : 'Xác nhận khoản thu'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: RECEIPT & TRANSACTION REF */}
      {step === 4 && receiptData && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6 max-w-xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[36px]">receipt_long</span>
          </div>

          <div>
            <span className="font-chivo text-xs font-black uppercase tracking-widest text-emerald-600">
              ĐÃ GHI NHẬN KHOẢN THU
            </span>
            <h2 className="font-chivo text-2xl font-black text-slate-900 mt-1">
              Biên Lai Đăng Ký Thẻ Hội Viên SCMS
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {receiptData.outstandingBalance > 0 ? 'Đã thu một phần. Gói sẽ được kích hoạt khi thu đủ.' : 'Đã thu đủ. Ngày hiệu lực được tính theo các gói hiện có của thành viên.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200 font-semibold">
              <span className="text-slate-500">Mã Giao Dịch (TransactionRef):</span>
              <span className="font-chivo font-black text-red-600 text-sm">{receiptData.transactionRef}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Hội viên:</span>
              <span className="font-bold text-slate-900">{receiptData.member.fullName} ({receiptData.member.memberCode})</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Gói tập đăng ký:</span>
              <span className="font-bold text-slate-900">{receiptData.package.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Thời hạn sử dụng mới:</span>
              <span className="font-bold text-emerald-600">{receiptData.member.packageExpiry || 'Chờ thanh toán đủ'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Phương thức:</span>
              <span className="font-bold text-slate-900">{receiptData.paymentMethod}</span>
            </div>
            <div className="flex justify-between py-1 text-sm font-black text-slate-900 pt-2">
              <span>Số tiền đã thanh toán:</span>
              <span className="text-red-600 font-chivo">{Number(receiptData.amountPaid).toLocaleString('vi-VN')} VNĐ</span>
            </div>
            <div className="flex justify-between"><span>Tiền thực nhận:</span><strong>{Number(receiptData.amountReceived).toLocaleString('vi-VN')} VNĐ</strong></div>
            <div className="flex justify-between"><span>Trả lại:</span><strong>{Number(receiptData.changeDue).toLocaleString('vi-VN')} VNĐ</strong></div>
            <div className="flex justify-between"><span>Còn phải thu:</span><strong>{Number(receiptData.outstandingBalance).toLocaleString('vi-VN')} VNĐ</strong></div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <a href={`#/receptionist/invoices?query=${encodeURIComponent(receiptData.invoiceNumber)}`} className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white">Xem / In hóa đơn</a>
            <button
              onClick={() => { setStep(1); setReceiptData(null); }}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow transition-colors"
            >
              Thực Hiện Giao Dịch Mới
            </button>
            <a
              href={`#/receptionist/lookup?query=${encodeURIComponent(receiptData.member.memberCode)}`}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">person_search</span>
              <span>Kiểm Tra Thẻ Đã Gia Hạn</span>
            </a>
            <a
              href={`#/receptionist/check-in?query=${encodeURIComponent(receiptData.member.memberCode)}`}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
              <span>Đi Đến Cổng Check-in</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
