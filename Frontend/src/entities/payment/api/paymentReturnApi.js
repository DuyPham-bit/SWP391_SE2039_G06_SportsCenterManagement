import { apiRequest } from '../../../shared/api/http.js';

// Confirms the gateway redirect (VNPay/MoMo) with the backend; the query string is forwarded unchanged.
export const paymentReturnApi = {
  confirm: (provider, search) => apiRequest(`payments/${provider === 'vnpay' ? 'vnpay-callback' : 'momo-callback'}${search}`, { session: null })
};
