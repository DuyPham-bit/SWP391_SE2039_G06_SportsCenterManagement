import React, { useEffect, useMemo, useState } from 'react';
import { refundApi } from '../../services/api.js';
import { createIdempotencyKey } from '../../services/http.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { LoadingSpinner } from '../../components/common/Table.jsx';

const money = value => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
const statusStyle = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200'
};

export function MemberRefundRequests() {
  const { language } = useLanguage();
  const { showSuccess, showError } = useToast();
  const isEn = language === 'en';
  const [payments, setPayments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [paymentId, setPaymentId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [eligible, mine] = await Promise.all([refundApi.getEligiblePayments(), refundApi.getMine()]);
      const eligiblePayments = eligible || [];
      setPayments(eligiblePayments);
      setRequests(mine || []);
      setPaymentId(current => eligiblePayments.some(item => String(item.paymentId) === current)
        ? current
        : String(eligiblePayments[0]?.paymentId || ''));
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  const selectedPayment = useMemo(() => payments.find(item => String(item.paymentId) === paymentId), [payments, paymentId]);

  const submit = async event => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true);
    try {
      await refundApi.submit(paymentId, Object.fromEntries(form), createIdempotencyKey());
      showSuccess(isEn ? 'Refund request submitted for manager review.' : 'Đã gửi yêu cầu hoàn tiền để quản lý duyệt.');
      formElement.reset();
      await load();
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  };

  if (loading && !requests.length) return <LoadingSpinner text={isEn ? 'Loading refund requests...' : 'Đang tải yêu cầu hoàn tiền...'} />;

  return <div className="space-y-6 animate-fade-slide-up">
    <header className="rounded-3xl bg-gradient-to-r from-[#2F7B5D] via-[#24828F] to-[#E5A33C] p-6 text-white shadow-xl">
      <p className="text-xs font-black uppercase tracking-widest text-amber-100">{isEn ? 'Manual bank refund' : 'Hoàn tiền chuyển khoản thủ công'}</p>
      <h1 className="mt-1 font-chivo text-2xl font-black">{isEn ? 'My Refund Requests' : 'Yêu cầu hoàn tiền của tôi'}</h1>
      <p className="mt-2 max-w-2xl text-sm text-white/90">{isEn ? 'Submit your receiving bank account. A manager will verify the payment and upload transfer proof when approved.' : 'Cung cấp tài khoản nhận tiền. Quản lý sẽ kiểm tra giao dịch và tải ảnh chuyển khoản khi duyệt.'}</p>
      <p className="mt-2 max-w-2xl text-xs font-semibold text-white/85">
        {isEn
          ? 'Successful payments with a remaining refundable balance remain eligible regardless of payment date, including packages purchased in advance.'
          : 'Giao dịch thành công còn số dư hoàn được phép gửi yêu cầu không phụ thuộc ngày thanh toán, kể cả gói mua trước thời hạn sử dụng.'}
      </p>
    </header>

    <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-chivo text-lg font-black">{isEn ? 'Create request' : 'Gửi yêu cầu mới'}</h2>
        {!payments.length ? <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{isEn ? 'No refundable successful payment is available.' : 'Hiện không có giao dịch thành công nào còn số dư có thể hoàn.'}</p> :
          <form onSubmit={submit} className="mt-4 space-y-4">
            <label className="block text-xs font-bold">{isEn ? 'Payment / Invoice' : 'Giao dịch / Hóa đơn'}
              <select value={paymentId} onChange={e => setPaymentId(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm" required>
                {payments.map(item => <option key={item.paymentId} value={item.paymentId}>{item.invoiceNumber} · {money(item.refundableAmount)} · {item.paymentMethod}</option>)}
              </select>
            </label>
            <label className="block text-xs font-bold">{isEn ? 'Refund amount' : 'Số tiền yêu cầu hoàn'}
              <input name="amount" type="number" min="1" max={selectedPayment?.refundableAmount || undefined} defaultValue={selectedPayment?.refundableAmount || ''} key={paymentId} required className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold">{isEn ? 'Bank' : 'Ngân hàng'}<input name="bankName" minLength="2" maxLength="100" required placeholder="VD: Vietcombank" className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm" /></label>
              <label className="block text-xs font-bold">{isEn ? 'Account number' : 'Số tài khoản'}<input name="bankAccountNumber" inputMode="numeric" pattern="[0-9]{6,30}" required className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm" /></label>
            </div>
            <label className="block text-xs font-bold">{isEn ? 'Account holder name' : 'Tên chủ tài khoản'}<input name="bankAccountName" minLength="2" maxLength="150" required placeholder="NGUYEN VAN A" className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm uppercase" /></label>
            <label className="block text-xs font-bold">{isEn ? 'Refund reason' : 'Lý do hoàn tiền'}<textarea name="reason" minLength="5" maxLength="500" rows="3" required className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm" /></label>
            <button disabled={busy} className="w-full rounded-xl bg-[#1E2235] px-4 py-3 text-sm font-black text-[#F2CC8F] disabled:opacity-50">{busy ? (isEn ? 'Submitting...' : 'Đang gửi...') : (isEn ? 'Submit for review' : 'Gửi quản lý duyệt')}</button>
          </form>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between"><h2 className="font-chivo text-lg font-black">{isEn ? 'Request history' : 'Lịch sử yêu cầu'}</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{requests.length}</span></div>
        <div className="mt-4 space-y-3">
          {!requests.length && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{isEn ? 'No refund request yet.' : 'Bạn chưa gửi yêu cầu hoàn tiền.'}</p>}
          {requests.map(item => <article key={item.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><strong>{item.invoiceNumber}</strong><p className="text-xs text-slate-500">{new Date(item.requestedAtUtc).toLocaleString(isEn ? 'en-US' : 'vi-VN')}</p></div><span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyle[item.status] || statusStyle.Pending}`}>{item.status}</span></div>
            <p className="mt-3 text-xl font-black text-[#2D6A4F]">{money(item.amount)}</p>
            <p className="mt-1 text-sm text-slate-600">{item.bankName} · {item.bankAccountNumber} · {item.bankAccountName}</p>
            <p className="mt-2 text-sm">{item.reason}</p>
            {item.reviewNote && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600"><strong>{isEn ? 'Manager note:' : 'Ghi chú quản lý:'}</strong> {item.reviewNote}</p>}
            {item.transferProofUrl && <a href={item.transferProofUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 underline"><span className="material-symbols-outlined text-[16px]">receipt_long</span>{isEn ? 'View transfer proof' : 'Xem ảnh chuyển khoản'}</a>}
          </article>)}
        </div>
      </section>
    </div>
  </div>;
}

export default MemberRefundRequests;
