/**
 * SCMS Cloud & Object Media Storage Service
 * Kỹ thuật Quản lý Lưu trữ Đa Phương Tiện Đám Mây (Cloud/Object Storage)
 * Hỗ trợ tải tệp ảnh từ máy, thư viện ảnh đám mây thể thao chất lượng cao, và CDN link.
 */

import { apiRequest, getApiToken, getApiUrl } from './http.js';

// Media is listed and persisted by the backend.
export async function fetchDriveFiles() {
  try {
    const data = await apiRequest('media/drive-files');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('Lỗi lấy danh sách ảnh Google Drive:', error);
    throw error;
  }
}

/**
 * Lấy trạng thái kết nối Google Drive API
 */
export async function fetchGoogleDriveStatus() {
  try {
    return await apiRequest('media/status');
  } catch (error) {
    console.warn('Lỗi kiểm tra Google Drive status:', error);
    throw error;
  }
}

/**
 * Xử lý tải ảnh từ File máy tính lên Google Drive qua Backend API (ASP.NET Core & EF Core Code-First)
 * Tự động lưu thông tin file vào Database và trả về link Googleusercontent lh3 trực tiếp.
 */
export async function uploadMediaFileToCloud(file) {
  if (!file) {
    throw new Error('Chưa chọn tệp');
  }

  const isImage = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'].includes(file.type) && /\.(png|jpe?g|webp|gif|avif)$/i.test(file.name);
  const isVideo = ['video/mp4', 'video/webm'].includes(file.type) && /\.(mp4|webm)$/i.test(file.name);
  if (!isImage && !isVideo) {
    throw new Error('Vui lòng chọn ảnh PNG/JPG/WEBP/GIF/AVIF hoặc video MP4/WEBM.');
  }

  if (file.size > 50 * 1024 * 1024) {
    throw new Error('Kích thước media tối đa là 50MB');
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const token = getApiToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(getApiUrl('media/upload'), {
      method: 'POST',
      headers,
      body: formData
    });

    if (response.ok) {
      const data = await response.json();
      return {
        url: data.url, // https://lh3.googleusercontent.com/d/{fileId}
        fileId: data.fileId,
        id: data.id,
        name: data.fileName || file.name,
        size: data.fileSize ? `${Math.round(data.fileSize / 1024)} KB` : `${Math.round(file.size / 1024)} KB`,
        dimensions: data.fileId?.startsWith('local_') ? 'Thư viện máy chủ' : 'Google Drive Cloud',
        type: data.mimeType || file.type,
        uploadedAt: data.createdAt || null
      };
    }

    const errPayload = await response.json().catch(() => null);
    const errorMsg = errPayload?.message || `Lỗi tải ảnh lên Google Drive (HTTP ${response.status})`;
    throw new Error(errorMsg);
  } catch (backendError) {
    console.error('Backend Google Drive upload failed:', backendError);
    throw backendError;
  }
}
