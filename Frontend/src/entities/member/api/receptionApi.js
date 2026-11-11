import { mapMember } from './mapMember.js';
import { asArray, centerId } from '../../../shared/api/apiUtils.js';
import { apiRequest, createIdempotencyKey } from '../../../shared/api/http.js';

export const receptionApi = {
  async lookupMember(query = '') {
    if (query.trim().length < 2) throw new Error('Nhập ít nhất 2 ký tự để tìm hội viên.');
    const params = new URLSearchParams({ query: query.trim(), page: '1', pageSize: '50' });
    const result = await apiRequest(`centers/${centerId()}/members?${params}`);
    const items = [...asArray(result)];
    const totalPages = Math.ceil((result.totalCount || items.length) / (result.pageSize || 50));
    for (let page = 2; page <= totalPages; page += 1) {
      params.set('page', String(page));
      items.push(...asArray(await apiRequest(`centers/${centerId()}/members?${params}`)));
    }
    return items.map(mapMember);
  },

  async createMember({ username, email, password, fullName, phone, dateOfBirth }) {
    if (typeof password !== 'string' || !password.trim()) {
      throw new Error('Vui lòng nhập mật khẩu khởi tạo cho hội viên.');
    }
    const cid = centerId();
    const result = await apiRequest(`centers/${cid}/members`, {
      method: 'POST',
      body: {
        // Only an explicitly chosen username is sent; otherwise the server generates a unique one.
        username: username?.trim() ? username.trim().toLowerCase() : null,
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone?.trim() || null,
        dateOfBirth: dateOfBirth || null,
        centerId: cid
      }
    });
    return mapMember(result);
  },

  /**
   * Counter quick-create: the backend sets the phone number as the initial password (must change)
   * and emails a 24h verify + set-password link. Returns { member, emailSent, message, resendCooldownSeconds }.
   */
  async quickCreateMember({ fullName, phoneNumber, email, gender, dateOfBirth, address }) {
    const result = await apiRequest('receptionist/members/quick-create', {
      method: 'POST',
      body: {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim().toLowerCase(),
        gender: gender || null,
        dateOfBirth: dateOfBirth || null,
        address: address?.trim() || null
      }
    });
    return { ...result, member: mapMember(result.member) };
  },

  /** Re-sends the activation email. 429 errors carry `retryAfter` (seconds). */
  async resendVerification(memberId) {
    const result = await apiRequest(`receptionist/members/${Number(memberId)}/resend-verification`, { method: 'POST' });
    return { ...result, member: mapMember(result.member) };
  },

  /** Email-verification state for pending members: [{ memberId, fullName, memberCode, isEmailVerified }]. */
  async getVerificationStatus(memberIds, { signal } = {}) {
    const ids = [...new Set(memberIds.map(Number).filter(Number.isSafeInteger))].slice(0, 50);
    if (!ids.length) return [];
    const params = new URLSearchParams();
    ids.forEach(id => params.append('ids', String(id)));
    return asArray(await apiRequest(`receptionist/members/verification-status?${params}`, { signal }));
  },

  async registerCounterPackage({ memberId, packageId, paymentMethod = 'TIỀN MẶT', amountReceived, posApprovalCode, idempotencyKey, cancelPendingIfAny = false }) {
    const normalizedMethod = paymentMethod === 'TIỀN MẶT' ? 'CASH' : paymentMethod === 'THẺ POS' ? 'POS' : null;
    if (!normalizedMethod) throw new Error('Thanh toán tại quầy chỉ hỗ trợ phương thức tiền mặt hoặc quẹt thẻ POS.');
    if (normalizedMethod === 'POS' && !posApprovalCode?.trim()) {
      throw new Error('Nhập mã chuẩn chi POS trước khi thanh toán.');
    }
    const key = idempotencyKey || createIdempotencyKey();
    const result = await apiRequest('payments/counter-checkout', {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: {
        memberId: Number(memberId),
        packageId: Number(packageId),
        paymentMethod: normalizedMethod,
        amountReceived: Number(amountReceived),
        posApprovalCode: posApprovalCode?.trim() || null,
        note: null,
        cancelPendingIfAny: cancelPendingIfAny === true
      }
    });
    return {
      ...result,
      transactionRef: result.transactionRef || result.invoiceNumber,
      registeredAt: result.paidAt,
      paymentMethod: result.paymentMethod,
      member: result.member,
      package: result.package
    };
  },

  async createCounterVnPayUrl({ memberId, packageId, idempotencyKey, cancelPendingIfAny = false }) {
    return apiRequest('payments/counter-vnpay-url', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey || createIdempotencyKey() },
      body: {
        memberId: Number(memberId),
        packageId: Number(packageId),
        cancelPendingIfAny: cancelPendingIfAny === true
      }
    });
  },

  async cancelPendingInvoice({ invoiceNumber, packageId, memberId }) {
    return apiRequest('payments/cancel-pending', {
      method: 'POST',
      body: {
        invoiceNumber: invoiceNumber || null,
        packageId: packageId ? Number(packageId) : null,
        memberId: memberId ? Number(memberId) : null
      }
    });
  },

  async getMemberSubscriptions(memberId) {
    if (!memberId) return [];
    return apiRequest(`members/${memberId}/subscriptions`);
  },

  async checkInMember(identifierOrMemberId) {
    const isNum = typeof identifierOrMemberId === 'number';
    const body = isNum
      ? { memberId: identifierOrMemberId }
      : { identifier: String(identifierOrMemberId) };
    return apiRequest(`centers/${centerId()}/checkins`, {
      method: 'POST',
      body
    });
  },

  async getCheckInHistory() {
    return asArray(await apiRequest(`centers/${centerId()}/checkins/today`));
  },

  async requestCheckInReview(identifier, reason, requestedApprover) {
    const term = String(identifier || '').trim();
    if (!term || !reason?.trim()) throw new Error('Nhập mã hội viên và lý do cần xử lý ngoại lệ.');
    const members = await this.lookupMember(term);
    const normalized = term.toLowerCase();
    const exact = members.filter(member => [member.id, member.memberCode, member.email, member.phone, member.username]
      .some(value => String(value || '').toLowerCase() === normalized));
    const candidates = exact.length ? exact : members;
    if (candidates.length !== 1) throw new Error('Nhập chính xác mã, email hoặc số điện thoại của một hội viên để lưu yêu cầu.');
    return this.createSupportRequest({
      memberId: candidates[0].id,
      subject: `Yêu cầu xử lý ngoại lệ check-in · ${candidates[0].memberCode}`,
      description: `Lý do: ${reason.trim()}\nNgười được đề nghị xử lý: ${requestedApprover?.trim() || 'Quản lý trung tâm'}\nĐây là yêu cầu chờ xử lý; chưa phê duyệt check-in hoặc mở cổng.`
    });
  },

  async getCheckInSummary() {
    return apiRequest(`centers/${centerId()}/checkins/summary`);
  },

  async getInvoices({ query = '', page = 1 } = {}) {
    return apiRequest(`centers/${centerId()}/invoices?${new URLSearchParams({ query: query.trim(), page: String(page), pageSize: '20' })}`);
  },

  async getInvoice(invoiceNumber) {
    return apiRequest(`invoices/${encodeURIComponent(invoiceNumber)}`);
  },

  async recordInvoicePayment(invoiceNumber, { amount, paymentMethod, posApprovalCode, note, idempotencyKey }) {
    if (!idempotencyKey) throw new Error('Thiếu mã chống ghi nhận thanh toán trùng.');
    return apiRequest(`invoices/${encodeURIComponent(invoiceNumber)}/payments`, {
      method: 'POST', headers: { 'Idempotency-Key': idempotencyKey },
      body: { amount: Number(amount), paymentMethod, posApprovalCode: posApprovalCode?.trim() || null, note: note?.trim() || null }
    });
  },

  async reconcilePayment(gatewayReference, { status, providerTransactionId, confirmedAmount, evidenceNote }) {
    return apiRequest(`payments/${encodeURIComponent(gatewayReference)}/reconcile`, {
      method: 'POST',
      body: {
        status,
        providerTransactionId: providerTransactionId?.trim() || null,
        confirmedAmount: confirmedAmount != null && confirmedAmount !== '' ? Number(confirmedAmount) : null,
        evidenceNote: evidenceNote?.trim() || ''
      }
    });
  },

  async voidCounterInvoice(invoiceNumber, reason) {
    return apiRequest(`payments/counter-void/${encodeURIComponent(invoiceNumber)}`, {
      method: 'POST',
      body: { reason: reason?.trim() || '' }
    });
  },

  async getSupportRequests({ query = '', status = '', page = 1 } = {}) {
    return apiRequest(`centers/${centerId()}/support-requests?${new URLSearchParams({ query: query.trim(), status, page: String(page), pageSize: '20' })}`);
  },

  async getSupportRequest(id) {
    return apiRequest(`centers/${centerId()}/support-requests/${Number(id)}`);
  },

  async createSupportRequest({ memberId, subject, description }) {
    return apiRequest(`centers/${centerId()}/support-requests`, {
      method: 'POST', body: { memberId: Number(memberId), subject: subject.trim(), description: description.trim() }
    });
  },

  async updateSupportRequest(id, { status, note }) {
    return apiRequest(`centers/${centerId()}/support-requests/${Number(id)}`, {
      method: 'PATCH', body: { status, note: note?.trim() || null }
    });
  }
};
