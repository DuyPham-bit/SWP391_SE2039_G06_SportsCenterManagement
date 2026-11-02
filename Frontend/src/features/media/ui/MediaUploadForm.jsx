import React, { useRef, useState } from 'react';
import { useMediaLibrary } from '../model/useMediaLibrary.js';

export function MediaUploadForm({ onUploaded, acceptedTypes = 'image/png,image/jpeg,image/webp,image/gif,image/avif,video/mp4,video/webm' }) {
  const fileInputRef = useRef(null);
  const { uploadFile, uploading, error } = useMediaLibrary(false);
  const [localMessage, setLocalMessage] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLocalMessage('Đang tải tệp lên...');
      const uploaded = await uploadFile(file);
      setLocalMessage(`Tải lên thành công: ${uploaded.name}`);
      if (onUploaded) onUploaded(uploaded);
    } catch (err) {
      setLocalMessage(err?.message || 'Tải tệp lên thất bại.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-center">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={acceptedTypes}
        className="hidden"
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-lg shadow transition disabled:opacity-50"
      >
        {uploading ? 'Đang tải lên...' : 'Chọn tệp tải lên Cloud'}
      </button>
      {(localMessage || error) && (
        <p className={`mt-2 text-xs ${error ? 'text-red-500' : 'text-slate-500'}`}>
          {error || localMessage}
        </p>
      )}
    </div>
  );
}

export default MediaUploadForm;

