import { apiRequest } from '../../../shared/api/index.js';
import { safeHref } from '../../../shared/lib/safeUrl.js';

// Restored from scms-v1.5 (lost in merge 7993cfc).
// Backend returns transferProofUrl as a protected API path ("/api/payments/refunds/{id}/proof").
// A plain <a target="_blank"> cannot send the auth session header and, in production, resolves
// against the frontend origin instead of VITE_API_BASE_URL, so the new tab errors out.
const PROTECTED_PROOF_PATH = /^\/api\/payments\/refunds\/(\d+)\/proof\/?(?:\?.*)?$/i;
const PROOF_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const PROOF_MAX_SIZE = 5 * 1024 * 1024;

function getProtectedProofId(transferProofUrl) {
  const match = typeof transferProofUrl === 'string' ? transferProofUrl.trim().match(PROTECTED_PROOF_PATH) : null;
  return match ? Number(match[1]) : null;
}

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
  review: (id, body) => apiRequest(`refund-requests/${Number(id)}`, { method: 'PATCH', body }),

  /** Private R2 upload for the transfer proof; returns the `refund-bills/...` key the review endpoint expects. */
  async uploadTransferProof(file) {
    if (!(file instanceof File) || file.size === 0) throw new Error('Vui lòng chọn ảnh xác nhận chuyển khoản.');
    if (!PROOF_TYPES.has(file.type) || !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      throw new Error('Chỉ hỗ trợ ảnh JPG, JPEG, PNG hoặc WEBP.');
    }
    if (file.size > PROOF_MAX_SIZE) throw new Error('Ảnh xác nhận chuyển khoản không được vượt quá 5MB.');
    const formData = new FormData();
    formData.append('file', file);
    const payload = await apiRequest('refund-bills', { method: 'POST', body: formData });
    if (!payload?.key) throw new Error('Cloudflare R2 không trả về đường dẫn ảnh hợp lệ.');
    return payload.key;
  },

  /** Best-effort removal of an uploaded proof that was never attached to a refund. */
  async deleteTransferProof(key) {
    if (!key) return;
    await apiRequest(`refund-bills?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
  },

  hasTransferProof: transferProofUrl => getProtectedProofId(transferProofUrl) !== null || Boolean(safeHref(transferProofUrl)),

  async getTransferProofUrl(transferProofUrl) {
    const refundId = getProtectedProofId(transferProofUrl);
    if (refundId === null) return safeHref(transferProofUrl) || null;
    const payload = await apiRequest(`payments/refunds/${refundId}/proof?redirect=false`);
    const url = safeHref(payload?.proofUrl);
    if (!url) throw new Error('Không lấy được đường dẫn ảnh chuyển khoản.');
    return url;
  },

  /**
   * Opens the transfer proof in a new tab. The tab is opened synchronously (inside the click)
   * so popup blockers allow it, then navigated to the short-lived presigned R2 URL.
   */
  async openTransferProof(transferProofUrl) {
    const tab = typeof window !== 'undefined' ? window.open('', '_blank') : null;
    try {
      const url = await this.getTransferProofUrl(transferProofUrl);
      if (!url) throw new Error('Không tìm thấy ảnh chuyển khoản.');
      if (tab) {
        tab.opener = null;
        tab.location.href = url;
      } else {
        window.location.assign(url);
      }
    } catch (error) {
      if (tab) tab.close();
      throw error;
    }
  }
};
