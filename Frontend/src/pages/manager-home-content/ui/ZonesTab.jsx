import React, { useRef, useState } from 'react';
import { TabSaveFooter } from './TabSaveFooter.jsx';
import { uploadCampus3dHtml } from '../../../entities/landing-content/index.js';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { safeHref } from '../../../shared/lib/safeUrl.js';

const DEFAULT_MODEL_3D_URL = '/3d-campus.html';

export function ZonesTab({ content, handleDiscardChanges, handleSaveAll, isDirty, isEn, isSaving, updateContentField }) {
  const fileInputRef = useRef(null);
  const [uploadingHtml, setUploadingHtml] = useState(false);
  const { showSuccess, showError } = useToast();

  const currentModelUrl = content.zonesLayout.model3dUrl || DEFAULT_MODEL_3D_URL;
  const safePreviewHref = safeHref(currentModelUrl);
  const previewHref = safePreviewHref && !safePreviewHref.startsWith('#') ? safePreviewHref : DEFAULT_MODEL_3D_URL;

  const handleUploadHtml = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!/\.html?$/i.test(file.name)) {
      showError(isEn ? 'Please select an .html or .htm file.' : 'Vui lòng chọn tệp có đuôi .html hoặc .htm.');
      return;
    }
    setUploadingHtml(true);
    try {
      const uploaded = await uploadCampus3dHtml(file);
      if (uploaded?.publicUrl) {
        updateContentField('zonesLayout', 'model3dUrl', uploaded.publicUrl);
        showSuccess(isEn ? `Uploaded 3D file "${file.name}". Click Save to publish.` : `Đã tải tệp 3D "${file.name}". Bấm Lưu để áp dụng ra trang chủ.`);
      }
    } catch (error) {
      showError(error?.message || (isEn ? 'Failed to upload 3D HTML file.' : 'Không thể tải lên tệp 3D .html.'));
    } finally {
      setUploadingHtml(false);
    }
  };
  return (
    <div className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="border-b border-brand-navy-100 dark:border-brand-navy-800 pb-4">
        <h2 className="text-lg font-black text-brand-navy-900 dark:text-white uppercase tracking-wide">
          {isEn ? 'Section 5: Training Zones & Service Amenities' : 'Khu Vực 5: Sơ Đồ Các Khu Vực Tập Luyện'}
        </h2>
        <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-1">
          {isEn
            ? 'Update 4 service amenities and layout of Zones A, B, C and Outdoor.'
            : 'Cập nhật 4 tiện ích dịch vụ bên trái và bố trí các phân khu Khu A, B, C và Ngoài trời.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
              {isEn ? 'Layout Section Title:' : 'Tiêu đề Section Sơ Đồ:'}
            </label>
            <input
              type="text"
              value={content.zonesLayout.title}
              onChange={(e) => updateContentField('zonesLayout', 'title', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-sm font-extrabold uppercase focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
              {isEn ? 'General Description:' : 'Mô tả tổng quát:'}
            </label>
            <textarea
              rows={3}
              value={content.zonesLayout.description}
              onChange={(e) => updateContentField('zonesLayout', 'description', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
            />
          </div>

          {/* 3D Campus HTML File Card */}
          <div className="p-3.5 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-800/50 border border-brand-navy-200 dark:border-brand-navy-700 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="zones-model3d-url" className="text-xs font-bold text-brand-navy-800 dark:text-brand-navy-200 uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-brand-sage-700 dark:text-brand-sage-400">view_in_ar</span>
                <span>{isEn ? '3D Model File (.html):' : 'Thẻ / Tệp Mô Hình 3D (.html):'}</span>
              </label>
              <div className="flex items-center gap-2">
                {currentModelUrl !== DEFAULT_MODEL_3D_URL && (
                  <button
                    type="button"
                    onClick={() => updateContentField('zonesLayout', 'model3dUrl', DEFAULT_MODEL_3D_URL)}
                    className="text-[11px] font-bold text-brand-navy-600 dark:text-brand-navy-300 hover:underline cursor-pointer"
                  >
                    {isEn ? 'Reset default' : 'Khôi phục mặc định'}
                  </button>
                )}
                <a
                  href={previewHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-sage-700 dark:text-brand-sage-400 hover:underline"
                >
                  <span>{isEn ? 'Open 3D' : 'Xem thử 3D'}</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="zones-model3d-url"
                type="text"
                value={content.zonesLayout.model3dUrl ?? DEFAULT_MODEL_3D_URL}
                onChange={(e) => updateContentField('zonesLayout', 'model3dUrl', e.target.value)}
                placeholder={DEFAULT_MODEL_3D_URL}
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.htm,text/html"
                onChange={handleUploadHtml}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploadingHtml}
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-brand-sage-700 hover:bg-brand-sage-900 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-all hover-lift"
              >
                <span className="material-symbols-outlined text-[16px]">{uploadingHtml ? 'hourglass_top' : 'upload_file'}</span>
                <span>{uploadingHtml ? (isEn ? 'Uploading...' : 'Đang tải...') : (isEn ? 'Upload .html' : 'Thay file .html')}</span>
              </button>
            </div>
            <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 leading-relaxed">
              {isEn
                ? 'Upload a new .html 3D file (<= 5MB) or paste a .html URL/path so the center can swap its 3D map anytime.'
                : 'Tải lên file .html mới (≤ 5MB) hoặc dán đường dẫn/URL file .html khi trung tâm đổi sơ đồ 3D mới.'}
            </p>
          </div>

          {/* 4 Amenities */}
          <div className="space-y-2 pt-2">
            <span className="block text-xs font-bold text-brand-navy-800 dark:text-brand-navy-200 uppercase">
              {isEn ? '4 Attached Service Amenities:' : '4 Tiện Ích Dịch Vụ Đi Kèm:'}
            </span>
            {content.zonesLayout.serviceAmenities.map((sa, idx) => (
              <div key={sa.id || idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-800/50 border border-brand-navy-200 dark:border-brand-navy-800 hover-lift transition-all">
                <span className="w-8 h-8 rounded-lg bg-brand-sage-700/15 text-brand-sage-700 dark:text-brand-sage-500 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">{sa.icon}</span>
                </span>
                <input
                  type="text"
                  value={sa.text}
                  onChange={(e) => {
                    const updated = [...content.zonesLayout.serviceAmenities];
                    updated[idx] = { ...updated[idx], text: e.target.value };
                    updateContentField('zonesLayout', 'serviceAmenities', updated);
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 4 Zones */}
        <div className="space-y-3">
          <span className="block text-xs font-bold text-brand-navy-800 dark:text-brand-navy-200 uppercase">
            {isEn ? '4 Facility Zone Blocks:' : '4 Khối Phân Bố Khu Vực:'}
          </span>
          {content.zonesLayout.zones.map((zn, idx) => (
            <div key={zn.id || idx} className="p-4 rounded-xl bg-brand-navy-900 text-white space-y-2 border border-white/10 hover-lift transition-all">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-brand-sage-700 dark:text-brand-sage-400">{zn.icon}</span>
                <input
                  type="text"
                  value={zn.name}
                  onChange={(e) => {
                    const updated = [...content.zonesLayout.zones];
                    updated[idx] = { ...updated[idx], name: e.target.value };
                    updateContentField('zonesLayout', 'zones', updated);
                  }}
                  className="flex-1 px-3 py-1 bg-white/10 rounded-lg border border-white/20 text-xs font-bold text-white uppercase focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
                />
              </div>
              <div className="space-y-1.5 pl-6">
                {zn.items.map((it, itIdx) => (
                  <input
                    key={itIdx}
                    type="text"
                    value={it}
                    onChange={(e) => {
                      const updated = [...content.zonesLayout.zones];
                      updated[idx] = { ...updated[idx], items: updated[idx].items.map((item, index) => index === itIdx ? e.target.value : item) };
                      updateContentField('zonesLayout', 'zones', updated);
                    }}
                    className="w-full px-2.5 py-1 bg-white/5 rounded-lg border border-white/10 text-[11px] text-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <TabSaveFooter handleDiscardChanges={handleDiscardChanges} handleSaveAll={handleSaveAll} isDirty={isDirty} isEn={isEn} isSaving={isSaving} />
    </div>
  );
}
