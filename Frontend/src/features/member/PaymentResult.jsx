import { useEffect, useState } from 'react';
import { apiRequest } from '../../services/http.js';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { notifyPaymentReturn } from '../../services/paymentCheckout.js';

export function PaymentResult() {
  const { isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [state, setState] = useState({ loading: true, result: null, error: '' });

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const search = window.location.search;
    const hasVnPayResponse = query.has('vnp_ResponseCode');
    const hasMomoResponse = query.has('resultCode') || query.has('transId');

    if (!hasVnPayResponse && !hasMomoResponse) {
      setState({ loading: false, result: null, error: '' });
      return;
    }

    const endpoint = hasVnPayResponse ? 'payments/vnpay-callback' : 'payments/momo-callback';
    apiRequest(`${endpoint}${search}`, { token: null })
      .then(result => setState({ loading: false, result, error: '' }))
      .catch(error => setState({ loading: false, result: null, error: error.message || (isEn ? 'Cannot confirm transaction.' : 'Không thể xác nhận giao dịch.') }));
  }, [isEn]);

  const query = new URLSearchParams(window.location.search);
  const isPayOsReturn = query.has('orderCode');
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
    window.location.href = `${window.location.origin}/#/${isAuthenticated ? 'member/packages' : 'login'}`;
  };

  const orderCode = query.get('orderCode');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const handleManualSync = async () => {
    if (!orderCode) return;
    setSyncing(true);
    setSyncMessage('');
    try {
      const syncRes = await apiRequest(`payments/vietqr/${orderCode}/sync`, { method: 'POST' });
      if (syncRes?.success) {
        setState({ loading: false, result: syncRes, error: '' });
      } else {
        setSyncMessage(syncRes?.message || (isEn ? 'Sync failed or payment not yet completed.' : 'Đồng bộ thất bại hoặc giao dịch chưa hoàn tất.'));
      }
    } catch (err) {
      setSyncMessage(err.message || (isEn ? 'Cannot sync transaction with bank gateway.' : 'Không thể đồng bộ giao dịch với cổng ngân hàng.'));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="font-chivo text-2xl font-black text-slate-900">{isEn ? 'Payment Result' : 'Kết quả thanh toán'}</h1>
        {state.loading && <p className="mt-3 text-sm text-slate-600">{isEn ? 'Confirming transaction...' : 'Đang kiểm tra và xác nhận giao dịch...'}</p>}
        {!state.loading && state.error && <p role="alert" className="mt-3 text-sm text-red-700">{state.error}</p>}
        {!state.loading && state.result && (
          <div className={`mt-4 rounded-xl p-4 text-sm ${state.result.success ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>
            <p className="font-bold">{state.result.success ? (isEn ? 'Payment successful' : 'Thanh toán thành công') : (isEn ? 'Transaction not yet successfully confirmed' : 'Giao dịch chưa được xác nhận thành công')}</p>
            <p className="mt-1">{state.result.message}</p>
            {state.result.invoiceNumber && <p className="mt-2">{isEn ? 'Invoice Code:' : 'Mã hóa đơn:'} <strong>{state.result.invoiceNumber}</strong></p>}
          </div>
        )}
        {!state.loading && !state.error && !state.result && (
          <p className="mt-3 text-sm text-slate-600">
            {cancelled
              ? (isEn ? 'Transaction was cancelled.' : 'Giao dịch đã bị hủy.')
              : isPayOsReturn
                ? (isEn ? 'Waiting for backend confirmation via webhook. Please check back in a few moments.' : 'Đang chờ backend xác nhận giao dịch qua webhook. Bạn có thể bấm nút đồng bộ bên dưới để kiểm tra.')
                : (isEn ? 'No payment response data to verify.' : 'Không có dữ liệu phản hồi thanh toán để xác nhận.')}
          </p>
        )}

        {/* Sync message if any */}
        {syncMessage && (
          <div className="mt-3 p-3 rounded-xl bg-amber-50 text-amber-900 text-xs border border-amber-200">
            {syncMessage}
          </div>
        )}

        {/* Reassurance banner for pending payments */}
        {(!state.result?.success || isPayOsReturn) && !cancelled && (
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 text-left space-y-1">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-amber-600">verified_user</span>
              {isEn ? 'Financial Protection Guarantee' : 'Bảo vệ quyền lợi tài chính'}
            </p>
            <p>
              {isEn
                ? 'If money has been deducted from your bank account, your invoice is securely reserved in the system. You will not lose funds.'
                : 'Nếu tài khoản ngân hàng của bạn đã bị trừ tiền, hóa đơn của bạn vẫn được bảo lưu an toàn trên hệ thống. Bạn hoàn toàn không bị mất tiền.'}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {isPayOsReturn && orderCode && (!state.result || !state.result.success) && (
            <button
              type="button"
              onClick={handleManualSync}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-indigo-700 hover:bg-indigo-100 transition-all cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[16px] ${syncing ? 'animate-spin' : ''}`}>sync</span>
              <span>{syncing ? (isEn ? 'Syncing...' : 'Đang đồng bộ...') : (isEn ? 'Sync VietQR' : 'Đồng bộ VietQR')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleBackToPackages}
            disabled={state.loading}
            className="inline-flex rounded-lg bg-red-600 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-700 shadow-md transition-all cursor-pointer"
          >
            {isAuthenticated || window.opener ? (isEn ? 'Return to packages' : 'Quay lại gói tập') : (isEn ? 'Close payment window' : 'Đóng cửa sổ thanh toán')}
          </button>
        </div>

        {!isAuthenticated && !window.opener && (
          <p className="mt-3 text-xs text-slate-500">{isEn ? 'Return to the open packages tab. If you closed it, please log in again to view your invoice.' : 'Quay lại tab gói tập đang mở. Nếu đã đóng tab đó, bạn cần đăng nhập lại để xem hóa đơn.'}</p>
        )}
      </section>
    </main>
  );
}
