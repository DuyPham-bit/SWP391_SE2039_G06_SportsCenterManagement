import { apiRequest } from './http.js';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function validateR2Image(file, maxMb = 5) {
  if (!(file instanceof File) || file.size === 0) throw new Error('Vui lòng chọn ảnh.');
  if (!ALLOWED_TYPES.has(file.type) || !/\.(jpe?g|png|webp)$/i.test(file.name)) {
    throw new Error('Chỉ hỗ trợ ảnh JPG, JPEG, PNG hoặc WEBP.');
  }
  if (file.size > maxMb * 1024 * 1024) throw new Error(`Ảnh không được vượt quá ${maxMb}MB.`);
}

export async function uploadR2Image(file, category, maxMb) {
  validateR2Image(file, maxMb);

  const body = new FormData();
  body.append('file', file);
  const payload = await apiRequest(`r2-images/${category}`, { method: 'POST', body });
  if (!payload?.key || !payload?.publicUrl) throw new Error('R2 không trả về thông tin ảnh hợp lệ.');
  return payload;
}

export const uploadDashboardImage = file => uploadR2Image(file, 'dashboard', 5);
export const uploadAvatar = file => uploadR2Image(file, 'avatar', 5);

export async function listDashboardImages() {
  const files = await apiRequest('media/files?folder=dashboard&limit=200');
  return files.map(file => ({ id: file.id, key: file.fileId, publicUrl: file.url, fileName: file.fileName }));
}

export async function deleteDashboardImage(key) {
  if (key) await apiRequest(`r2-images/dashboard?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
}

export async function deleteUploadedAvatar(key) {
  if (key) await apiRequest(`r2-images/avatar?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
}
