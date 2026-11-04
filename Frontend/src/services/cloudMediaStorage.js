import { validateR2Image } from './r2ImageStorage.js';
import { getApiToken, getApiUrl } from './http.js';

// Existing coach callers share the same validated R2 image upload.
export async function uploadMediaFileToCloud(file) {
  validateR2Image(file);
  const body = new FormData();
  body.append('file', file);
  const token = getApiToken();
  const response = await fetch(getApiUrl('media/upload'), {
    method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.detail || result?.message || 'Không thể tải ảnh lên.');
  if (!result?.fileId || !result?.url) throw new Error('Thông tin ảnh trả về không hợp lệ.');
  return { url: result.url, key: result.fileId, fileId: result.fileId, id: result.id,
    name: result.fileName, type: result.mimeType };
}
