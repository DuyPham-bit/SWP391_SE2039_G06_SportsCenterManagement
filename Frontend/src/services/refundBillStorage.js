import { apiRequest, getApiToken, getApiUrl } from './http.js';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function uploadRefundBill(file) {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error('Vui lòng chọn ảnh xác nhận chuyển khoản.');
  }
  if (!ALLOWED_TYPES.has(file.type) || !/\.(jpe?g|png|webp)$/i.test(file.name)) {
    throw new Error('Chỉ hỗ trợ ảnh JPG, JPEG, PNG hoặc WEBP.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Ảnh xác nhận chuyển khoản không được vượt quá 5MB.');
  }

  const formData = new FormData();
  formData.append('file', file);
  const token = getApiToken();
  const response = await fetch(getApiUrl('refund-bills'), {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const validationErrors = payload?.errors && Object.values(payload.errors).flat().join(' ');
    throw new Error(payload?.detail || payload?.message || validationErrors ||
      `Không thể tải ảnh xác nhận lên Cloudflare R2 (HTTP ${response.status}).`);
  }
  if (!payload?.key) {
    throw new Error('Cloudflare R2 không trả về đường dẫn ảnh hợp lệ.');
  }
  return payload.key;
}

export async function deleteRefundBill(key) {
  if (!key) return;
  await apiRequest(`refund-bills?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
}
