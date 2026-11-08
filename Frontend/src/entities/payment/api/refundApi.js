import { apiRequest } from '../../../shared/api/http.js';

export const refundApi = {
  getEligiblePayments: () => apiRequest('payments/refund-requests/me/eligible-payments'),
  getMine: () => apiRequest('payments/refund-requests/me'),
  submit: (paymentId, body, idempotencyKey) => apiRequest(`payments/${Number(paymentId)}/refund-requests`, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: {
      amount: Number(body.amount),
      reason: body.reason.trim(),
      bankName: body.bankName.trim(),
      bankAccountNumber: body.bankAccountNumber.trim(),
      bankAccountName: body.bankAccountName.trim()
    }
  }),
  getForManager: (status = '') => apiRequest(`refund-requests${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  review: (id, body) => apiRequest(`refund-requests/${Number(id)}`, { method: 'PATCH', body })
};
