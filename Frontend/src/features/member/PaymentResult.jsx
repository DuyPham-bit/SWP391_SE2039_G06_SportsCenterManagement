import { useEffect, useState } from 'react';
import { apiRequest } from '../../services/http.js';

export function PaymentResult() {
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
      .catch(error => setState({ loading: false, result: null, error: error.message || 'Không thể xác nhận giao dịch.' }));
  }, []);

  const isPayOsReturn = new URLSearchParams(window.location.search).has('orderCode');
  const cancelled = new URLSearchParams(window.location.search).get('cancel') === 'true';

  const handleBackToPackages = () => {
    const origin = window.location.port === '54162' ? 'http://localhost:3004' : window.location.origin;
    window.location.assign(`${origin}/#/member/packages`);
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="font-chivo text-2xl font-black text-slate-900">Kết quả thanh toán</h1>
        {state.loading && <p className="mt-3 text-sm text-slate-600">Đang xác nhận giao dịch với backend...</p>}
        {!state.loading && state.error && <p role="alert" className="mt-3 text-sm text-red-700">{state.error}</p>}
        {!state.loading && state.result && (
          <div className={`mt-4 rounded-xl p-4 text-sm ${state.result.success ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>
            <p className="font-bold">{state.result.success ? 'Thanh toán thành công' : 'Giao dịch chưa được xác nhận thành công'}</p>
            <p className="mt-1">{state.result.message}</p>
            {state.result.invoiceNumber && <p className="mt-2">Mã hóa đơn: {state.result.invoiceNumber}</p>}
          </div>
        )}
        {!state.loading && !state.error && !state.result && (
          <p className="mt-3 text-sm text-slate-600">
            {cancelled
              ? 'Giao dịch đã bị hủy.'
              : isPayOsReturn
                ? 'Đang chờ backend xác nhận giao dịch qua webhook PayOS. Kiểm tra lại hóa đơn sau ít phút.'
                : 'Không có dữ liệu phản hồi thanh toán để xác nhận.'}
          </p>
        )}
        <button
          type="button"
          onClick={handleBackToPackages}
          className="mt-6 inline-flex rounded-lg bg-red-600 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-700 shadow-md transition-all cursor-pointer"
        >
          Quay lại gói tập
        </button>
      </section>
    </main>
  );
}
