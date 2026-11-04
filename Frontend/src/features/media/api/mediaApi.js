import { apiRequest } from '../../../services/http.js';

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
  const data = await apiRequest('media/upload', {
    method: 'POST',
    body: formData
  });
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
