import { useEffect, useState } from 'react';
import { paymentReturnApi } from '../../../entities/payment/index.js';
import { useAuth } from '../../../entities/session/index.js';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { notifyPaymentReturn } from '../../../features/payment-checkout/index.js';

const AUTO_RETURN_MS = 3000;

// Fixed palette per status: the backdrop stays dark in both themes, like the landing intro.
const TONES = {
  success: { glow: '74 160 120', ring: '#4ade80', chip: 'bg-brand-sage-50 text-brand-sage-800 ring-brand-sage-200' },
  pending: { glow: '214 160 72', ring: '#fbbf24', chip: 'bg-brand-sand-50 text-brand-sand-900 ring-brand-sand-200' },
  failed: { glow: '220 80 70', ring: '#f87171', chip: 'bg-brand-danger-50 text-brand-danger-700 ring-brand-danger-200' },
  loading: { glow: '96 130 200', ring: '#93c5fd', chip: 'bg-brand-navy-50 text-brand-navy-700 ring-brand-navy-200' }
};

function formatVnd(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? `${amount.toLocaleString('vi-VN')} ₫` : null;
}

// vnp_PayDate is yyyyMMddHHmmss in GMT+7.
function formatPayDate(raw, isEn) {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(raw || '');
  const date = m ? new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}+07:00`) : new Date();
  return date.toLocaleString(isEn ? 'en-GB' : 'vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function StatusIcon({ tone }) {
  const color = TONES[tone].ring;
  if (tone === 'loading') {
    return <span className="block h-16 w-16 rounded-full border-[3px] border-white/15 border-t-white animate-spin" aria-hidden="true" />;
  }
  const path = tone === 'success' ? 'M20 33 l9 9 l17 -19' : tone === 'pending' ? 'M32 20 v14 M32 43 v1' : 'M23 23 l18 18 M41 23 l-18 18';
  return (
    <svg viewBox="0 0 64 64" className="h-20 w-20" aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="none" stroke={color} strokeOpacity="0.18" strokeWidth="3" />
      <circle cx="32" cy="32" r="29" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
        className="pr-draw" style={{ strokeDasharray: 183, strokeDashoffset: 183, transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
      <path d={path} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
        className="pr-draw pr-draw-late" style={{ strokeDasharray: 60, strokeDashoffset: 60 }} />
    </svg>
  );
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <dt className="shrink-0 text-ink-muted">{label}</dt>
      <dd className="min-w-0 text-right font-semibold text-ink-strong break-all">{children}</dd>
    </div>
  );
}

export function PaymentResult() {
  const { isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [state, setState] = useState({ loading: true, result: null, error: '' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const search = window.location.search;
    const hasVnPayResponse = query.has('vnp_ResponseCode');
    const hasMomoResponse = query.has('resultCode') || query.has('transId');

    if (!hasVnPayResponse && !hasMomoResponse) {
      setState({ loading: false, result: null, error: '' });
      return;
    }

    paymentReturnApi.confirm(hasVnPayResponse ? 'vnpay' : 'momo', search)
      .then(result => setState({ loading: false, result, error: '' }))
      .catch(error => setState({ loading: false, result: null, error: error.message || (isEn ? 'Cannot confirm transaction.' : 'Không thể xác nhận giao dịch.') }));
  }, [isEn]);

  const query = new URLSearchParams(window.location.search);
  const isVnPay = query.has('vnp_ResponseCode');
  const cancelled = query.get('cancel') === 'true' || query.get('status') === 'CANCELLED' ||
    query.get('vnp_ResponseCode') === '24' || query.get('resultCode') === '1006';

  useEffect(() => {
    if (state.loading) return;
    return notifyPaymentReturn({ cancelled, failed: Boolean(state.error) || state.result?.success === false });
  }, [state.loading, state.error, state.result, cancelled]);

  const handleBackToPackages = () => {
    if (window.opener && !window.opener.closed) {
      window.opener.focus();
      window.close();
      return;
    }
    // replace(): the gateway return URL should not stay in history (Back would re-confirm it).
    window.location.replace(`${window.location.origin}/#/${isAuthenticated ? 'member/packages' : 'login'}`);
  };

  // Successful payment: return to the packages page on its own, no extra click needed.
  const autoReturn = !state.loading && state.result?.success === true;
  useEffect(() => {
    if (!autoReturn) return;
    const timer = setTimeout(handleBackToPackages, AUTO_RETURN_MS);
    return () => clearTimeout(timer);
  }, [autoReturn]);

  const tone = state.loading ? 'loading'
    : state.result?.success ? 'success'
    : state.error || cancelled || state.result?.success === false ? 'failed'
    : 'pending';

  const title = {
    loading: isEn ? 'Confirming payment' : 'Đang xác nhận thanh toán',
    success: isEn ? 'Payment successful' : 'Thanh toán thành công',
    failed: cancelled ? (isEn ? 'Payment cancelled' : 'Đã hủy thanh toán') : (isEn ? 'Payment not completed' : 'Thanh toán chưa hoàn tất'),
    pending: isEn ? 'No payment data' : 'Không có dữ liệu thanh toán'
  }[tone];

  const subtitle = state.loading
    ? (isEn ? 'Verifying the transaction with the payment gateway…' : 'Đang đối soát giao dịch với cổng thanh toán…')
    : tone === 'success'
      ? (isEn ? 'Thank you! Your transaction has been recorded.' : 'Cảm ơn bạn! Giao dịch đã được ghi nhận.')
    : state.error || state.result?.message || (cancelled
      ? (isEn ? 'The transaction was cancelled. No money was charged.' : 'Giao dịch đã bị hủy, bạn chưa bị trừ tiền.')
      : (isEn ? 'No payment response data to verify.' : 'Không có dữ liệu phản hồi thanh toán để xác nhận.'));

  const amount = formatVnd(state.result?.amount)
    || formatVnd(isVnPay ? Number(query.get('vnp_Amount')) / 100 : query.get('amount'));
  const transactionId = state.result?.transactionId || query.get('vnp_TransactionNo') || query.get('transId');
  const showDetails = !state.loading && (state.result || amount);
  const gateway = isVnPay ? 'VNPay' : query.has('resultCode') ? 'MoMo' : null;

  const copyInvoice = async () => {
    try {
      await navigator.clipboard.writeText(state.result.invoiceNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked: the number stays visible to copy by hand */ }
  };

  const buttonLabel = isAuthenticated || window.opener
    ? (isEn ? 'Back to my packages' : 'Về trang gói tập')
    : (isEn ? 'Log in to view invoice' : 'Đăng nhập để xem hóa đơn');

  return (
    <main
      className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-10"
      style={{ background: 'radial-gradient(120% 80% at 50% 0%, #1b2536 0%, #0d131c 55%, #080b11 100%)' }}
    >
      <style>{`
        @keyframes pr-draw { to { stroke-dashoffset: 0; } }
        @keyframes pr-rise { from { opacity: 0; transform: translateY(16px) scale(.98); } to { opacity: 1; transform: none; } }
        @keyframes pr-pulse { 0%,100% { opacity: .55; transform: scale(1); } 50% { opacity: .9; transform: scale(1.08); } }
        @keyframes pr-bar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .pr-draw { animation: pr-draw .7s cubic-bezier(.65,0,.35,1) forwards; }
        .pr-draw-late { animation-delay: .45s; }
        .pr-rise { animation: pr-rise .6s cubic-bezier(.2,.8,.2,1) both; }
        .pr-glow { animation: pr-pulse 4s ease-in-out infinite; }
        .pr-bar { transform-origin: left; animation: pr-bar ${AUTO_RETURN_MS}ms linear forwards; }
        @media (prefers-reduced-motion: reduce) {
          .pr-draw, .pr-rise, .pr-glow, .pr-bar { animation: none !important; stroke-dashoffset: 0 !important; }
        }
      `}</style>

      {/* Ambient glow + court-line grid */}
      <div className="pr-glow pointer-events-none absolute left-1/2 top-[18%] h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, rgb(${TONES[tone].glow} / .35), transparent 65%)`, transition: 'background 600ms' }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '56px 56px', maskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 75%)' }} />

      <div className="relative w-full max-w-md">
        <p className="pr-rise mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.42em] text-white/50">
          Olympic Sports Arena
        </p>

        <section className="pr-rise relative rounded-3xl bg-surface-raised shadow-2xl shadow-black/40 ring-1 ring-white/10" style={{ animationDelay: '80ms' }}>
          {/* Head */}
          <div className="relative overflow-hidden rounded-t-3xl px-6 pb-7 pt-8 text-center sm:px-8"
            style={{ background: 'linear-gradient(160deg, #142033 0%, #0e1621 100%)' }}>
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
              <StatusIcon tone={tone} />
            </div>
            <h1 className="mt-5 font-display text-2xl font-black tracking-tight text-white sm:text-[26px]" role={state.loading ? 'status' : undefined}>
              {title}
            </h1>
            {amount && tone !== 'loading' && (
              <p className="mt-2 font-display text-4xl font-black tracking-tight text-white tabular-nums">{amount}</p>
            )}
            <p className={`mx-auto mt-3 max-w-xs text-sm leading-relaxed ${state.error ? 'text-red-300' : 'text-white/65'}`} role={state.error ? 'alert' : undefined}>
              {subtitle}
            </p>
          </div>

          {/* Ticket perforation */}
          <div className="relative h-0" aria-hidden="true">
            <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full" style={{ background: '#0d131c' }} />
            <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full" style={{ background: '#0d131c' }} />
            <span className="absolute inset-x-5 top-0 border-t-2 border-dashed border-line" />
          </div>

          {/* Body */}
          <div className="px-6 pb-6 pt-5 sm:px-8">
            {showDetails && (
              <dl className="divide-y divide-line">
                {state.result?.invoiceNumber && (
                  <DetailRow label={isEn ? 'Invoice' : 'Mã hóa đơn'}>
                    <button type="button" onClick={copyInvoice} title={isEn ? 'Copy' : 'Sao chép'}
                      className="group inline-flex items-center gap-1.5 text-right hover:text-primary cursor-pointer">
                      <span className="font-mono text-[13px]">{state.result.invoiceNumber}</span>
                      <span className="material-symbols-outlined text-[16px] text-ink-muted group-hover:text-primary">{copied ? 'check' : 'content_copy'}</span>
                    </button>
                  </DetailRow>
                )}
                {transactionId && <DetailRow label={isEn ? 'Transaction ID' : 'Mã giao dịch'}><span className="font-mono text-[13px]">{transactionId}</span></DetailRow>}
                {gateway && <DetailRow label={isEn ? 'Method' : 'Phương thức'}>{gateway}</DetailRow>}
                <DetailRow label={isEn ? 'Time' : 'Thời gian'}>{formatPayDate(query.get('vnp_PayDate'), isEn)}</DetailRow>
                <DetailRow label={isEn ? 'Status' : 'Trạng thái'}>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${TONES[tone].chip}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {tone === 'success' ? (isEn ? 'Paid' : 'Đã thanh toán') : tone === 'failed' ? (isEn ? 'Not paid' : 'Chưa thanh toán') : (isEn ? 'Pending' : 'Đang chờ')}
                  </span>
                </DetailRow>
              </dl>
            )}

            {!state.loading && tone !== 'success' && !cancelled && (
              <div className="mt-4 flex gap-3 rounded-2xl bg-surface-muted p-3.5 text-left text-xs leading-relaxed text-ink-muted">
                <span className="material-symbols-outlined text-[20px] text-brand-sand-700 dark:text-brand-sand-400">verified_user</span>
                <p>
                  <strong className="block text-ink-strong">{isEn ? 'Your money is safe' : 'Quyền lợi của bạn được bảo vệ'}</strong>
                  {isEn
                    ? 'If your bank account was charged, the invoice is reserved in the system and will be reconciled automatically.'
                    : 'Nếu tài khoản đã bị trừ tiền, hóa đơn vẫn được bảo lưu trên hệ thống và sẽ được đối soát tự động.'}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleBackToPackages}
              disabled={state.loading}
              className="group relative mt-6 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-brand-danger-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-danger-600/30 transition hover:bg-brand-danger-700 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {autoReturn && <span className="pr-bar absolute inset-0 bg-white/15" aria-hidden="true" />}
              <span className="relative">{buttonLabel}</span>
              <span className="material-symbols-outlined relative text-[18px] transition-transform group-hover:translate-x-0.5">arrow_forward</span>
            </button>

            {autoReturn && (
              <p role="status" className="mt-3 text-center text-xs text-ink-muted">
                {isEn ? 'Taking you back automatically…' : 'Tự động chuyển về trang gói tập…'}
              </p>
            )}
            {!isAuthenticated && !window.opener && !state.loading && (
              <p className="mt-3 text-center text-xs text-ink-muted">
                {isEn ? 'Your sign-in session is not available in this window. Log in again to check your invoice.' : 'Phiên đăng nhập không có trong cửa sổ này. Vui lòng đăng nhập lại để kiểm tra hóa đơn.'}
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
