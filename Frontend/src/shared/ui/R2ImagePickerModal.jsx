import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { deleteDashboardImage, listDashboardImages, uploadDashboardImage } from '../api/r2ImageStorage.js';

export function R2ImagePickerModal({ isOpen, onClose, onSelectImage, currentImage = '', title = 'Chọn ảnh' }) {
  const [selected, setSelected] = useState(null);
  const [temporary, setTemporary] = useState(null);
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setSelected(null);
    setTemporary(null);
    setError('');
    listDashboardImages().then(files => { if (active) setImages(files); })
      .catch(err => { if (active) setError(err.message || 'Không thể tải thư viện ảnh.'); });
    return () => { active = false; };
  }, [isOpen, currentImage]);

  if (!isOpen) return null;

  const close = async () => {
    if (busy) return;
    if (temporary?.key) {
      try { await deleteDashboardImage(temporary.key); } catch { /* Retry from the media library if cleanup fails. */ }
    }
    onClose?.();
  };

  const chooseFile = async event => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const next = await uploadDashboardImage(file);
      if (temporary?.key) {
        try { await deleteDashboardImage(temporary.key); } catch { /* Retained in the library for retry. */ }
      }
      setTemporary(next);
      setSelected(next);
    } catch (err) {
      setError(err.message || 'Không thể tải ảnh lên.');
    } finally {
      setBusy(false);
      input.value = '';
    }
  };

  const confirm = () => {
    if (!selected || busy) return;
    onSelectImage({ ...selected, isNew: temporary?.key === selected.key });
    setTemporary(null);
    onClose?.();
  };

  const selectExisting = async image => {
    setBusy(true);
    try {
      if (temporary?.key) await deleteDashboardImage(temporary.key);
      setTemporary(null);
      setSelected(image);
    } catch (err) {
      setError(err.message || 'Không thể dọn ảnh vừa tải lên.');
    } finally { setBusy(false); }
  };

  const node = <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h3 className="font-chivo text-lg font-black">{title}</h3>
        <button type="button" disabled={busy} onClick={close} aria-label="Đóng" className="material-symbols-outlined">close</button>
      </div>
      <div className="mt-4 aspect-video overflow-hidden rounded-xl border bg-slate-100">
        {(selected?.publicUrl || currentImage)
          ? <img src={selected?.publicUrl || currentImage} alt="Xem trước" className="h-full w-full object-cover" />
          : <div className="grid h-full place-items-center text-sm text-slate-500">Chưa chọn ảnh</div>}
      </div>
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}
      <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-400 p-4 text-sm font-bold text-emerald-700">
        <span>{busy ? 'Đang tải ảnh lên...' : 'Tải ảnh JPG, PNG hoặc WEBP (tối đa 5MB)'}</span>
        <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={busy} onChange={chooseFile} />
      </label>
      <h4 className="mt-5 text-sm font-bold">Thư viện ảnh ({images.length})</h4>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map(image => <button key={image.id} type="button" disabled={busy}
          aria-label={`Chọn ảnh #${image.id}`} aria-pressed={selected?.id === image.id}
          className={`overflow-hidden rounded-xl border-2 ${selected?.id === image.id ? 'border-emerald-600' : 'border-transparent'}`}
          onClick={() => selectExisting(image)}>
          <img src={image.publicUrl} alt={`Ảnh #${image.id}`} loading="lazy" className="aspect-video w-full object-cover" />
          <span className="block p-1 text-xs">Ảnh #{image.id}</span>
        </button>)}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" disabled={busy} onClick={close} className="rounded-xl border px-4 py-2 text-xs font-bold">Hủy</button>
        <button type="button" onClick={confirm} disabled={!selected || busy}
          className="rounded-xl bg-[#2D6A4F] px-5 py-2 text-xs font-bold text-white disabled:opacity-40">Dùng ảnh này</button>
      </div>
    </div>
  </div>;
  return typeof document === 'undefined' ? node : createPortal(node, document.body);
}
