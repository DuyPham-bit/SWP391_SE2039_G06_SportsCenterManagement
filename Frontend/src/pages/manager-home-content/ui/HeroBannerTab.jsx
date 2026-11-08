import React from 'react';
import { TabSaveFooter } from './TabSaveFooter.jsx';

export function HeroBannerTab({
  content, handleDiscardChanges, handleSaveAll, isDirty, isEn, isSaving, openMediaPicker,
  updateContentField
}) {
  return (
    <div className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="border-b border-brand-navy-100 dark:border-brand-navy-800 pb-4">
        <h2 className="text-lg font-black text-brand-navy-900 dark:text-white uppercase tracking-wide">
          {isEn ? 'Section 1: Hero Banner Header' : 'Khu Vực 1: Hero Banner Mở Đầu Trang Chủ'}
        </h2>
        <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-1">
          {isEn
            ? 'Edit badge, headline, subtext, background video/image and 4 quick metrics on first viewport.'
            : 'Chỉnh sửa dòng tiêu đề, phụ đề, đường dẫn video/ảnh nền và 4 chỉ số nhanh xuất hiện ở màn hình đầu tiên.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
              {isEn ? 'Header Badge:' : 'Huy hiệu trên tiêu đề (Badge):'}
            </label>
            <input
              type="text"
              value={content.heroBanner.badge}
              onChange={(e) => updateContentField('heroBanner', 'badge', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
              {isEn ? 'Main Headline:' : 'Tiêu đề chính (Main Heading):'}
            </label>
            <input
              type="text"
              value={content.heroBanner.title}
              onChange={(e) => updateContentField('heroBanner', 'title', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-sm font-black uppercase text-brand-navy-900 dark:text-white focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
              {isEn ? 'Introduction Subtext:' : 'Mô tả giới thiệu (Subtext):'}
            </label>
            <textarea
              rows={3}
              value={content.heroBanner.description}
              onChange={(e) => updateContentField('heroBanner', 'description', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
                {isEn ? 'Primary CTA Button:' : 'Nút hành động chính:'}
              </label>
              <input
                type="text"
                value={content.heroBanner.primaryCtaText}
                onChange={(e) => updateContentField('heroBanner', 'primaryCtaText', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
                {isEn ? 'Primary CTA Link:' : 'Liên kết nút chính:'}
              </label>
              <input
                type="text"
                value={content.heroBanner.primaryCtaLink}
                onChange={(e) => updateContentField('heroBanner', 'primaryCtaLink', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Media background preview */}
          <div>
            <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
              {isEn ? 'Background Image / Poster (Cloud):' : 'Hình ảnh / Poster nền Đám mây:'}
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={content.heroBanner.posterUrl}
                onChange={(e) => updateContentField('heroBanner', 'posterUrl', e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs truncate focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => openMediaPicker(isEn ? 'Select Hero Banner Background' : 'Chọn Ảnh Nền Hero Banner', content.heroBanner.posterUrl, (url) => {
                  updateContentField('heroBanner', 'posterUrl', url);
                })}
                className="px-3.5 py-2 bg-brand-sage-700 hover:bg-brand-sage-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all hover-lift"
              >
                <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                <span>{isEn ? 'Upload/Change' : 'Tải/Đổi Ảnh'}</span>
              </button>
            </div>
            <div className="h-36 rounded-xl overflow-hidden bg-brand-navy-900 relative border border-brand-navy-200 dark:border-brand-navy-800">
              <img
                src={content.heroBanner.posterUrl}
                alt="Hero poster preview"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-950 via-transparent to-transparent flex items-end p-3">
                <span className="text-[11px] text-white font-bold bg-black/60 px-2 py-0.5 rounded">
                  {isEn ? 'Hero Poster Preview' : 'Xem trước Poster Banner'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
              {isEn ? 'Background Video URL (MP4):' : 'Đường dẫn Video Nền (MP4):'}
            </label>
            <input
              type="text"
              value={content.heroBanner.videoUrl}
              onChange={(e) => updateContentField('heroBanner', 'videoUrl', e.target.value)}
              placeholder="./hero-video.mp4"
              className="w-full px-3 py-2 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 4 Quick Metrics */}
      <div className="border-t border-brand-navy-100 dark:border-brand-navy-800 pt-5">
        <h3 className="text-xs font-bold text-brand-navy-800 dark:text-brand-navy-200 uppercase mb-3 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-brand-sage-700 dark:text-brand-sage-500">speed</span>
          <span>{isEn ? '4 Quick Metrics Strip' : '4 Chỉ Số Nhanh Tại Dải Banner (Quick Metrics Strip)'}</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {content.heroBanner.metrics.map((metric, idx) => (
            <div key={metric.id || idx} className="p-3 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-800/50 border border-brand-navy-200 dark:border-brand-navy-800 space-y-1.5 hover-lift transition-all">
              <input
                type="text"
                value={metric.value}
                onChange={(e) => {
                  const updated = [...content.heroBanner.metrics];
                  updated[idx] = { ...updated[idx], value: e.target.value };
                  updateContentField('heroBanner', 'metrics', updated);
                }}
                className="w-full px-2 py-1 bg-white dark:bg-brand-navy-800 border border-brand-navy-300 dark:border-brand-navy-700 rounded-lg text-sm font-black text-brand-sage-700 dark:text-brand-sage-500 text-center focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
              />
              <input
                type="text"
                value={metric.label}
                onChange={(e) => {
                  const updated = [...content.heroBanner.metrics];
                  updated[idx] = { ...updated[idx], label: e.target.value };
                  updateContentField('heroBanner', 'metrics', updated);
                }}
                className="w-full px-2 py-1 bg-white dark:bg-brand-navy-800 border border-brand-navy-300 dark:border-brand-navy-700 rounded-lg text-[11px] font-bold text-brand-navy-700 dark:text-brand-navy-300 text-center uppercase focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      <TabSaveFooter handleDiscardChanges={handleDiscardChanges} handleSaveAll={handleSaveAll} isDirty={isDirty} isEn={isEn} isSaving={isSaving} />
    </div>
  );
}
