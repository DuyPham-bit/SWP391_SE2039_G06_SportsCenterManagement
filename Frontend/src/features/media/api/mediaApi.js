import { apiRequest, getApiSession, getApiUrl } from '../../../services/http.js';

export async function fetchMediaFiles() {
  const data = await apiRequest('media/files');
  return Array.isArray(data) ? data : [];
}

export function fetchMediaStorageStatus() {
  return apiRequest('media/status');
}

export async function uploadMediaFileToCloud(file) {
  if (!file) throw new Error('Chưa chọn tệp');

  const isImage = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'].includes(file.type) &&
    /\.(png|jpe?g|webp|gif|avif)$/i.test(file.name);
  const isVideo = ['video/mp4', 'video/webm'].includes(file.type) && /\.(mp4|webm)$/i.test(file.name);
  if (!isImage && !isVideo)
    throw new Error('Chỉ hỗ trợ ảnh PNG/JPG/WEBP/GIF/AVIF và video MP4/WEBM.');
  if (file.size > 50 * 1024 * 1024)
    throw new Error('Kích thước media tối đa là 50 MB.');

  const formData = new FormData();
  formData.append('file', file);
  const session = getApiSession();
  const headers = session ? { 'X-SCMS-Session': session } : {};
  const response = await fetch(getApiUrl('media/upload'), {
    method: 'POST', headers, credentials: 'include', body: formData
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || `Không thể tải media lên R2 (HTTP ${response.status}).`);
  }
  const data = await response.json();
  return {
    url: data.url,
    fileId: data.fileId,
    id: data.id,
    name: data.fileName || file.name,
    size: data.fileSize ? `${Math.round(data.fileSize / 1024)} KB` : `${Math.round(file.size / 1024)} KB`,
    dimensions: 'Cloudflare R2',
    type: data.mimeType || file.type,
    uploadedAt: data.createdAt || null
  };
}
