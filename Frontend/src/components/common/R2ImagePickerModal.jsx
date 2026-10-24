import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { deleteDashboardImage, uploadDashboardImage } from '../../services/r2ImageStorage.js';

export function R2ImagePickerModal({ isOpen, onClose, onSelectImage, currentImage = '', title = 'Chọn ảnh' }) {
  const [preview, setPreview] = useState(currentImage);
  const [uploaded, setUploaded] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setPreview(currentImage || '');
    setUploaded(null);
    setError('');
  }, [isOpen, currentImage]);

  if (!isOpen) return null;

  const close = async () => {
    if (uploaded?.key) {
      try { await deleteDashboardImage(uploaded.key); } catch { /* Best-effort cleanup. */ }
    }
    onClose?.();
  };

  const chooseFile = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const next = await uploadDashboardImage(file);
      if (uploaded?.key) {
        try { await deleteDashboardImage(uploaded.key); } catch { /* Superseded temporary upload. */ }
      }
      setUploaded(next);
      setPreview(next.publicUrl);
    } catch (uploadError) {
      setError(uploadError.message || 'Không thể upload ảnh lên R2.');
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  };

  const confirm = () => {
    if (!uploaded) return;
    onSelectImage(uploaded);
    setUploaded(null);
    onClose?.();
  };

  const node = <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
    <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
      <div className="flex items-center justify-between"><h3 className="font-chivo text-lg font-black">{title}</h3><button type="button" onClick={close} className="material-symbols-outlined">close</button></div>
      <div className="mt-4 overflow-hidden rounded-xl border bg-slate-100 aspect-video">
        {preview ? <img src={preview} alt="Preview" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-slate-500">Chưa chọn ảnh</div>}
      </div>
      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}
      <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-400 p-5 text-sm font-bold text-emerald-700 hover:bg-emerald-50">
        <span className="material-symbols-outlined">cloud_upload</span>
        <span>{busy ? 'Đang tải lên Cloudflare R2...' : 'Chọn ảnh JPG, PNG hoặc WEBP (tối đa 10MB)'}</span>
        <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={busy} onChange={chooseFile} />
      </label>
      <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={close} className="rounded-xl border px-4 py-2 text-xs font-bold">Hủy</button><button type="button" onClick={confirm} disabled={!uploaded || busy} className="rounded-xl bg-[#2D6A4F] px-5 py-2 text-xs font-bold text-white disabled:opacity-40">Dùng ảnh này</button></div>
    </div>
  </div>;
  return typeof document === 'undefined' ? node : createPortal(node, document.body);
}
