import { asArray, centerId } from '../../../shared/api/apiUtils.js';
import { apiRequest, createIdempotencyKey } from '../../../shared/api/http.js';
import { dataUrlToFile } from '../../../shared/lib/avatarHelper.js';
import { mapMember } from './mapMember.js';

export const memberApi = {
  /** Counter staff set a member's photo: stored in R2, key saved to users.avatar_key. Returns the updated member. */
  async uploadMemberAvatar(memberId, dataUrl) {
    const formData = new FormData();
    formData.append('file', dataUrlToFile(dataUrl, `member-${memberId}`));
    return mapMember(await apiRequest(`centers/${centerId()}/members/${Number(memberId)}/avatar`, { method: 'POST', body: formData }));
  },

  async removeMemberAvatar(memberId) {
    return mapMember(await apiRequest(`centers/${centerId()}/members/${Number(memberId)}/avatar`, { method: 'DELETE' }));
  },

  async getCenterMembers(query = '', page = 1) {
    const params = new URLSearchParams({ query: query.trim(), page: String(page), pageSize: '20' });
    return apiRequest(`centers/${centerId()}/members?${params}`);
  },

  async updateAtCenter(id, body) {
    return apiRequest(`centers/${centerId()}/members/${id}`, { method: 'PATCH', body });
  },

  async setAccountStatus(id, status) {
    return apiRequest(`centers/${centerId()}/members/${id}/status`, { method: 'PATCH', body: { status } });
  },

  async subscribeOnline({ packageId, paymentMethod = 'VNPAY', invoiceNumber, cancelPendingIfAny }) {
    const provider = {
      VNPAY: 'create-vnpay-url',
      MOMO: 'create-momo-url'
    }[paymentMethod];
    if (!provider) throw new Error('Cổng thanh toán không được hỗ trợ.');
    return apiRequest(`payments/${provider}`, {
      method: 'POST',
      headers: { 'Idempotency-Key': createIdempotencyKey() },
      body: {
        packageId: Number(packageId),
        invoiceNumber: invoiceNumber || null,
        cancelPendingIfAny: !!cancelPendingIfAny
      }
    });
  },

  async getMyPendingInvoices() {
    return apiRequest('payments/my-pending-invoices');
  },

  async cancelPendingInvoice(invoiceNumber) {
    return apiRequest(`payments/pending-invoice/${encodeURIComponent(invoiceNumber)}`, {
      method: 'DELETE'
    });
  },

  async cancelPendingPackage(packageId) {
    return apiRequest(`payments/pending-package/${packageId}`, {
      method: 'DELETE'
    });
  },

  async getMyProgress() {
    return asArray(await apiRequest('members/me/progress'));
  },

  async getMyPlans() {
    return asArray(await apiRequest('members/me/training-plans'));
  }
};
