/**
 * SCMS Avatar Helper Service
 * Xử lý tải ảnh đại diện từ máy tính hoặc điện thoại:
 * - Hỗ trợ chụp từ camera hoặc chọn file từ thư viện ảnh
 * - Tự động crop vuông tâm (center-crop)
 * - Tối ưu hoá kích thước (360x360 px, WebP/JPEG ~30KB) để hiển thị sắc nét chuẩn Retina và lưu trữ nhanh chóng
 * - Đồng bộ hóa lưu trữ theo User ID và phát sự kiện cập nhật tức thời
 */

export const AVATAR_STORAGE_PREFIX = 'scms_avatar_';

export function getAvatarStorageKey(userId) {
  return `${AVATAR_STORAGE_PREFIX}${userId}`;
}

export function getStoredAvatar(userId) {
  if (!userId || typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(getAvatarStorageKey(userId)) || null;
  } catch (e) {
    console.warn('Lỗi khi đọc avatar từ localStorage:', e);
    return null;
  }
}

export function setStoredAvatar(userId, dataUrl) {
  if (!userId || typeof localStorage === 'undefined') return;
  try {
    const key = getAvatarStorageKey(userId);
    if (dataUrl) {
      localStorage.setItem(key, dataUrl);
    } else {
      localStorage.removeItem(key);
    }
    // Phát sự kiện toàn cục để các thành phần (Header, Sidebar, ProfileModal, v.v.) cập nhật ngay lập tức
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('scms:avatar-changed', {
        detail: { userId, avatar: dataUrl || null }
      }));
    }
  } catch (e) {
    console.warn('Lỗi khi lưu avatar vào localStorage:', e);
  }
}

export function removeStoredAvatar(userId) {
  setStoredAvatar(userId, null);
}

/**
 * Trích xuất 2 ký tự đầu viết tắt cho Avatar (Ví dụ: "Nguyễn Văn An" -> "NA")
 */
export function getInitials(name = '') {
  const clean = String(name || '').trim();
  if (!clean) return 'SC';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Xử lý file ảnh được chọn từ máy tính hoặc chụp từ điện thoại:
 * - Đọc qua FileReader
 * - Tự động căn crop vuông tâm (center-crop)
 * - Nén sang JPEG kích thước 360x360 với chất lượng 0.88
 * @param {File|Blob} file
 * @param {number} [maxSize=360]
 * @param {number} [quality=0.88]
 * @returns {Promise<{ dataUrl: string, file: File, sizeKb: number, width: number, height: number }>}
 */
export function processAvatarFile(file, maxSize = 360, quality = 0.88) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Vui lòng chọn tệp hình ảnh.'));
      return;
    }

    // Kiểm tra định dạng ảnh cơ bản
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/bmp', 'image/heic'];
    if (file.type && !file.type.startsWith('image/') && !validTypes.includes(file.type.toLowerCase())) {
      reject(new Error('Định dạng tệp không hợp lệ. Vui lòng chọn ảnh PNG, JPG hoặc WEBP.'));
      return;
    }

    // Giới hạn file tải lên ban đầu tối đa 25MB
    if (file.size > 25 * 1024 * 1024) {
      reject(new Error('Dung lượng tệp ảnh gốc không được vượt quá 25MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh từ thiết bị của bạn.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Tệp được chọn không phải là hình ảnh hợp lệ hoặc bị lỗi.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = maxSize;
          canvas.height = maxSize;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Không thể khởi tạo bộ xử lý đồ họa của trình duyệt.'));
            return;
          }

          // Cải thiện chất lượng render làm mượt
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Center-crop tính toán tỉ lệ vuông chuẩn
          const minDim = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
          const sx = ((img.naturalWidth || img.width) - minDim) / 2;
          const sy = ((img.naturalHeight || img.height) - minDim) / 2;

          ctx.drawImage(
            img,
            sx,
            sy,
            minDim,
            minDim,
            0,
            0,
            maxSize,
            maxSize
          );

          // Nén sang JPEG. Trả thêm File để có thể upload lên object storage,
          // thay vì chỉ giữ data URL trong localStorage của một trình duyệt.
          canvas.toBlob(blob => {
            if (!blob) {
              reject(new Error('Không thể nén ảnh đã chọn.'));
              return;
            }

            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve({
              dataUrl,
              file: new File([blob], 'avatar.jpg', { type: 'image/jpeg', lastModified: Date.now() }),
              sizeKb: Math.round(blob.size / 1024),
              width: maxSize,
              height: maxSize
            });
          }, 'image/jpeg', quality);
        } catch (err) {
          reject(new Error('Lỗi khi nén và xử lý hình ảnh: ' + (err.message || '')));
        }
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
}
