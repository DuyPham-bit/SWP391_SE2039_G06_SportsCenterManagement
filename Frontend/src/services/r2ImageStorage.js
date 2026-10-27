import { apiRequest, getApiToken, getApiUrl } from './http.js';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function uploadR2Image(file, category, maxMb) {
  if (!(file instanceof File) || file.size === 0) throw new Error('Vui lòng chọn ảnh.');
  if (!ALLOWED_TYPES.has(file.type) || !/\.(jpe?g|png|webp)$/i.test(file.name)) {
    throw new Error('Chỉ hỗ trợ ảnh JPG, JPEG, PNG hoặc WEBP.');
  }
  if (file.size > maxMb * 1024 * 1024) throw new Error(`Ảnh không được vượt quá ${maxMb}MB.`);

  const body = new FormData();
  body.append('file', file);
  const token = getApiToken();
  const response = await fetch(getApiUrl(`r2-images/${category}`), {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.detail || payload?.message || `Không thể upload ảnh (HTTP ${response.status}).`);
  if (!payload?.key || !payload?.publicUrl) throw new Error('R2 không trả về thông tin ảnh hợp lệ.');
  return payload;
}

export const uploadDashboardImage = file => uploadR2Image(file, 'dashboard', 10);
export const uploadAvatar = file => uploadR2Image(file, 'avatar', 5);

export async function deleteDashboardImage(key) {
  if (key) await apiRequest(`r2-images/dashboard?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
}

export async function deleteUploadedAvatar(key) {
  if (key) await apiRequest(`r2-images/avatar?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
}
