import { getAuthUser } from './authState.js';

export function centerId() {
  const id = getAuthUser()?.centerId || import.meta.env.VITE_SPORTS_CENTER_ID;
  if (!id || !Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
    throw new Error('Chưa xác định trung tâm. Hãy đăng nhập tài khoản được gán centerId hoặc cấu hình VITE_SPORTS_CENTER_ID.');
  }
  return Number(id);
}

export function asArray(value) {
  if (Array.isArray(value)) return value;
  return Array.isArray(value?.items) ? value.items : [];
}
