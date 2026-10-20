import React from 'react';
import { usePublicCatalog } from '../../hooks/usePublicCatalog.js';
import { catalogFacilities, catalogSports } from '../../services/publicCatalog.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function LandingCatalogEditor({ type, metadata = [], onChange, openMediaPicker }) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const { catalog, loading, error } = usePublicCatalog();
  const records = metadata.length ? metadata : (type === 'sports' ? catalogSports(catalog) : catalogFacilities(catalog));
  const update = (record, values) => {
    const current = metadata.find(item => String(item.id) === String(record.id));
    const updated = { ...record, ...current, id: String(record.id), ...values };
    onChange(records.map(item => String(item.id) === String(record.id) ? updated : item));
  };
  return (
    <section className="space-y-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
        <h2 className="font-bold text-lg text-slate-900 dark:text-white">
          {type === 'sports'
            ? (isEn ? 'Homepage Sports' : 'Bộ môn trên trang chủ')
            : (isEn ? 'Homepage Courts & Facilities' : 'Phòng / sân trên trang chủ')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {isEn
            ? 'Edit images and visibility for the saved homepage content.'
            : 'Chỉnh ảnh và ẩn/hiện danh mục nội dung trang chủ đã lưu.'}
        </p>
        <a className="inline-flex items-center gap-1 text-xs font-semibold text-[#2D6A4F] dark:text-[#81B29A] hover:underline mt-2" href="#/manager/classes-rooms">
          <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          <span>{isEn ? 'Manage sports, classes, courts & rooms' : 'Quản lý bộ môn, lớp và phòng / sân'}</span>
        </a>
      </div>
      {loading && !metadata.length && <p role="status" className="text-xs text-slate-500 dark:text-slate-400">{isEn ? 'Loading catalog...' : 'Đang tải danh mục...'}</p>}
      {error && !metadata.length && <p role="alert" className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {!loading && !error && records.length === 0 && (
        <p role="status" className="text-xs text-slate-500 dark:text-slate-400">
          {isEn ? 'No active records available.' : 'Chưa có bản ghi đang hoạt động.'}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {records.map(record => {
          const item = metadata.find(entry => String(entry.id) === String(record.id));
          return (
            <article key={record.id} className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 space-y-3 hover-lift transition-all">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{record.name}</h3>
                {Number.isFinite(record.capacity) && (
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {isEn ? `Capacity: ${record.capacity}` : `Sức chứa: ${record.capacity} người`}
                  </span>
                )}
              </div>
              {item?.image ? (
                <div className="h-40 w-full rounded-lg overflow-hidden bg-slate-900">
                  <img src={item.image} alt={record.name} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="py-10 text-center bg-white dark:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 text-xs">
                  <span className="material-symbols-outlined text-[28px] mb-1">image_not_supported</span>
                  <div>{isEn ? 'No image set' : 'Chưa có ảnh'}</div>
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  className="rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] px-3.5 py-1.5 text-xs font-bold text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  onClick={() => openMediaPicker(isEn ? `Image: ${record.name}` : `Ảnh: ${record.name}`, item?.image || '', url => update(record, { image: url }))}
                >
                  <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                  <span>{isEn ? 'Upload/Change Image' : 'Tải/Đổi Ảnh'}</span>
                </button>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item?.isVisible !== false}
                    onChange={event => update(record, { isVisible: event.target.checked })}
                    className="rounded text-[#2D6A4F] focus:ring-[#2D6A4F] accent-[#2D6A4F] cursor-pointer"
                  />
                  <span>{isEn ? 'Show on Homepage' : 'Hiển thị trên trang chủ'}</span>
                </label>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

