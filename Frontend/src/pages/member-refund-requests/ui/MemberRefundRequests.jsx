import { formatVietnamDateTime } from '../../../shared/lib/dateTime.js';
import React, { useEffect, useMemo, useState } from 'react';
import { refundApi } from '../../../entities/payment/index.js';
import { safeHref } from '../../../shared/lib/safeUrl.js';
import { createIdempotencyKey } from '../../../shared/api/http.js';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { LoadingSpinner } from '../../../shared/ui/Table.jsx';

const money = value => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
const statusStyle = {
  Pending: 'bg-brand-sand-50 text-brand-sand-700 border-brand-sand-200',
  Approved: 'bg-brand-sage-50 text-brand-sage-700 border-brand-sage-200',
  Rejected: 'bg-brand-danger-50 text-brand-danger-700 border-brand-danger-200'
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
    <header className="scms-hero relative rounded-3xl bg-gradient-to-r from-brand-sage-700 via-brand-teal-600 via-brand-teal-500 to-brand-sand-500 dark:from-brand-sage-900 dark:via-brand-teal-900 dark:via-brand-teal-800 dark:to-brand-sand-900 text-white p-6 sm:p-7 border border-white/30 dark:border-white/10 shadow-xl shadow-brand-teal-600/20 overflow-hidden">
      <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-brand-sand-300/45 via-brand-sand-500/30 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-brand-sage-500/40 via-brand-sage-700/30 to-transparent rounded-full blur-3xl pointer-events-none" />
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
        <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
        <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
      </svg>
      <div className="relative z-10">
      <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-brand-navy-900/90 backdrop-blur-md text-brand-sage-900 dark:text-brand-sage-300 border border-white/80 dark:border-white/20 text-xs font-black uppercase tracking-wider shadow-xs"><span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse" />{isEn ? 'Manual bank refund' : 'Hoàn tiền chuyển khoản thủ công'}</p>
      <h1 className="mt-2 font-chivo text-2xl md:text-3xl font-black tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">{isEn ? 'My Refund Requests' : 'Yêu cầu hoàn tiền của tôi'}</h1>
      <p className="mt-2 max-w-2xl text-sm text-white/95 font-medium drop-shadow-xs">{isEn ? 'Submit your receiving bank account. A manager will verify the payment and upload transfer proof when approved.' : 'Cung cấp tài khoản nhận tiền. Quản lý sẽ kiểm tra giao dịch và tải ảnh chuyển khoản khi duyệt.'}</p>
      <p className="mt-2 max-w-2xl text-xs font-semibold text-white/85">
        {isEn
          ? 'Successful payments with a remaining refundable balance remain eligible regardless of payment date, including packages purchased in advance.'
          : 'Giao dịch thành công còn số dư hoàn được phép gửi yêu cầu không phụ thuộc ngày thanh toán, kể cả gói mua trước thời hạn sử dụng.'}
      </p>
      </div>
    </header>

    <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
      <section className="rounded-2xl border border-brand-navy-200 bg-white p-5 shadow-sm dark:border-brand-navy-800 dark:bg-brand-navy-900">
        <h2 className="font-chivo text-lg font-black">{isEn ? 'Create request' : 'Gửi yêu cầu mới'}</h2>
        {!payments.length ? <p className="mt-4 rounded-xl bg-brand-navy-50 p-4 text-sm text-brand-navy-500">{isEn ? 'No refundable successful payment is available.' : 'Hiện không có giao dịch thành công nào còn số dư có thể hoàn.'}</p> :
          <form onSubmit={submit} className="mt-4 space-y-4">
            <label className="block text-xs font-bold">{isEn ? 'Payment / Invoice' : 'Giao dịch / Hóa đơn'}
              <select value={paymentId} onChange={e => setPaymentId(e.target.value)} className="mt-1 w-full rounded-xl border border-brand-navy-300 bg-white p-3 text-sm" required>
                {payments.map(item => <option key={item.paymentId} value={item.paymentId}>{item.invoiceNumber} · {money(item.refundableAmount)} · {item.paymentMethod}</option>)}
              </select>
            </label>
            <label className="block text-xs font-bold">{isEn ? 'Refund amount' : 'Số tiền yêu cầu hoàn'}
              <input name="amount" type="number" min="1" max={selectedPayment?.refundableAmount || undefined} defaultValue={selectedPayment?.refundableAmount || ''} key={paymentId} required className="mt-1 w-full rounded-xl border border-brand-navy-300 p-3 text-sm" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold">{isEn ? 'Bank' : 'Ngân hàng'}<input name="bankName" minLength="2" maxLength="100" required placeholder="VD: Vietcombank" className="mt-1 w-full rounded-xl border border-brand-navy-300 p-3 text-sm" /></label>
              <label className="block text-xs font-bold">{isEn ? 'Account number' : 'Số tài khoản'}<input name="bankAccountNumber" inputMode="numeric" pattern="[0-9]{6,30}" required className="mt-1 w-full rounded-xl border border-brand-navy-300 p-3 text-sm" /></label>
            </div>
            <label className="block text-xs font-bold">{isEn ? 'Account holder name' : 'Tên chủ tài khoản'}<input name="bankAccountName" minLength="2" maxLength="150" required placeholder="NGUYEN VAN A" className="mt-1 w-full rounded-xl border border-brand-navy-300 p-3 text-sm uppercase" /></label>
            <label className="block text-xs font-bold">{isEn ? 'Refund reason' : 'Lý do hoàn tiền'}<textarea name="reason" minLength="5" maxLength="500" rows="3" required className="mt-1 w-full rounded-xl border border-brand-navy-300 p-3 text-sm" /></label>
            <button disabled={busy} className="w-full rounded-xl bg-brand-navy-900 px-4 py-3 text-sm font-black text-brand-sand-300 disabled:opacity-50">{busy ? (isEn ? 'Submitting...' : 'Đang gửi...') : (isEn ? 'Submit for review' : 'Gửi quản lý duyệt')}</button>
          </form>}
      </section>

      <section className="rounded-2xl border border-brand-navy-200 bg-white p-5 shadow-sm dark:border-brand-navy-800 dark:bg-brand-navy-900">
        <div className="flex items-center justify-between"><h2 className="font-chivo text-lg font-black">{isEn ? 'Request history' : 'Lịch sử yêu cầu'}</h2><span className="rounded-full bg-brand-navy-100 px-3 py-1 text-xs font-bold">{requests.length}</span></div>
        <div className="mt-4 space-y-3">
          {!requests.length && <p className="rounded-xl border border-dashed border-brand-navy-300 p-8 text-center text-sm text-brand-navy-500">{isEn ? 'No refund request yet.' : 'Bạn chưa gửi yêu cầu hoàn tiền.'}</p>}
          {requests.map(item => <article key={item.id} className="rounded-xl border border-brand-navy-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><strong>{item.invoiceNumber}</strong><p className="text-xs text-brand-navy-500">{formatVietnamDateTime(item.requestedAtUtc, isEn)}</p></div><span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyle[item.status] || statusStyle.Pending}`}>{item.status}</span></div>
            <p className="mt-3 text-xl font-black text-brand-sage-700 dark:text-brand-sage-400">{money(item.amount)}</p>
            <p className="mt-1 text-sm text-brand-navy-600">{item.bankName} · {item.bankAccountNumber} · {item.bankAccountName}</p>
            <p className="mt-2 text-sm">{item.reason}</p>
            {item.reviewNote && <p className="mt-2 rounded-lg bg-brand-navy-50 p-2 text-xs text-brand-navy-600"><strong>{isEn ? 'Manager note:' : 'Ghi chú quản lý:'}</strong> {item.reviewNote}</p>}
            {safeHref(item.transferProofUrl) && <a href={safeHref(item.transferProofUrl)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-sage-700 dark:text-brand-sage-400 underline"><span className="material-symbols-outlined text-[16px]">receipt_long</span>{isEn ? 'View transfer proof' : 'Xem ảnh chuyển khoản'}</a>}
          </article>)}
        </div>
      </section>
    </div>
  </div>;
}

export default MemberRefundRequests;
