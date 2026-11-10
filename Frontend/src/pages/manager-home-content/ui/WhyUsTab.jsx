import React from 'react';
import { TabSaveFooter } from './TabSaveFooter.jsx';

export function WhyUsTab({
  content, handleDiscardChanges, handleSaveAll, handleTabChange, isDirty, isEn, isSaving,
  openMediaPicker, updateContentField
}) {
  return (
    <div className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="border-b border-brand-navy-100 dark:border-brand-navy-800 pb-4">
        <h2 className="text-lg font-black text-brand-navy-900 dark:text-white uppercase tracking-wide">
          {isEn ? 'Section 2: Why Choose SCMS' : 'Khu Vực 2: Tại Sao Nên Chọn SCMS'}
        </h2>
        <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-1">
          {isEn
            ? 'Update headline, 3 competitive advantages, and 4 highlight stat cards.'
            : 'Cập nhật tiêu đề, 3 ưu thế vượt trội và 4 thẻ thống kê số liệu bên phải.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
              {isEn ? 'Badge:' : 'Huy hiệu (Badge):'}
            </label>
            <input
              type="text"
              value={content.whyUs.badge}
              onChange={(e) => updateContentField('whyUs', 'badge', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
              {isEn ? 'Section Title:' : 'Tiêu đề phần Giới thiệu:'}
            </label>
            <input
              type="text"
              value={content.whyUs.title}
              onChange={(e) => updateContentField('whyUs', 'title', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-sm font-extrabold text-brand-navy-900 dark:text-white focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
              {isEn ? 'Detailed Description:' : 'Mô tả chi tiết:'}
            </label>
            <textarea
              rows={3}
              value={content.whyUs.description}
              onChange={(e) => updateContentField('whyUs', 'description', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
            />
          </div>

          {/* 3 Advantages */}
          <div className="space-y-2">
            <button type="button" className="rounded-xl bg-[#2D6A4F] px-4 py-2 text-xs font-bold text-white"
              onClick={() => openMediaPicker(isEn ? 'About image' : 'Ảnh giới thiệu',
                content.whyUs.imageUrl || '', url => updateContentField('whyUs', 'imageUrl', url))}>
              {isEn ? 'Upload / change about image' : 'Tải / đổi ảnh giới thiệu'}
            </button>
            {content.whyUs.imageUrl && <img src={content.whyUs.imageUrl} alt=""
              className="h-36 w-full rounded-xl object-contain" />}
            <input type="text" value={content.whyUs.imageAlt || ''}
              aria-label={isEn ? 'Image description' : 'Mô tả ảnh'}
              onChange={e => updateContentField('whyUs', 'imageAlt', e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-xs" />
          </div>
          <div className="space-y-3 pt-2">
            <span className="block text-xs font-bold text-brand-navy-800 dark:text-brand-navy-200 uppercase">
              {isEn ? '3 Competitive Highlights:' : '3 Điểm Nổi Bật Vượt Trội:'}
            </span>
            {content.whyUs.features.map((feat, idx) => (
              <div key={feat.id || idx} className="p-3.5 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-800/50 border border-brand-navy-200 dark:border-brand-navy-800 space-y-2 hover-lift transition-all">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-brand-sage-700 text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">{feat.icon}</span>
                  </span>
                  <input
                    type="text"
                    value={feat.title}
                    onChange={(e) => {
                      const updated = [...content.whyUs.features];
                      updated[idx] = { ...updated[idx], title: e.target.value };
                      updateContentField('whyUs', 'features', updated);
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
                  />
                </div>
                <textarea
                  rows={2}
                  value={feat.description}
                  onChange={(e) => {
                    const updated = [...content.whyUs.features];
                    updated[idx] = { ...updated[idx], description: e.target.value };
                    updateContentField('whyUs', 'features', updated);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-[11px] leading-relaxed focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="space-y-4">
          {/* Quick Jump to Tab 7 for Login Stats */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-brand-sage-500/10 via-brand-teal-500/10 to-brand-teal-500/10 border border-brand-sage-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-brand-sage-700 dark:text-brand-sage-400 text-[22px] shrink-0">info</span>
              <div className="text-xs">
                <span className="font-bold text-brand-navy-900 dark:text-white">
                  {isEn ? 'Looking to change stats on Login / Register page?' : 'Bạn muốn đổi 3 số liệu hiển thị trên trang Đăng nhập & Đăng ký?'}
                </span>
                <p className="text-brand-navy-600 dark:text-brand-navy-400 text-[11px] mt-0.5">
                  {isEn
                    ? 'The 4 cards below appear on the Homepage "Why Choose SCMS". To edit the 3 stats on Login page (10 Sports, 10 Courts, 2.5K+ Members), jump to Tab 7.'
                    : '4 thẻ dưới đây hiển thị ở mục "Tại sao chọn SCMS" trên Trang chủ. Để đổi 3 số liệu trên trang Đăng nhập (10 Bộ môn, 10 Khu tập luyện, 2.5K+ Hội viên), hãy chuyển sang Tab 7.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleTabChange('authShowcase')}
              className="px-3.5 py-1.5 rounded-lg bg-brand-sage-700 hover:bg-brand-sage-900 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm hover-lift"
            >
              <span>{isEn ? 'Go to Tab 7' : 'Sang Tab 7: Banner Đăng Nhập'}</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          </div>

          <span className="block text-xs font-bold text-brand-navy-800 dark:text-brand-navy-200 uppercase">
            {isEn ? '4 Highlight Statistics Cards (Homepage "Why Choose SCMS"):' : '4 Thẻ Thống Kê Số Liệu Nổi Bật (Mục "Tại sao chọn SCMS" trên Trang chủ):'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {content.whyUs.stats.map((st, idx) => (
              <div key={st.id || idx} className="p-4 rounded-xl bg-gradient-to-br from-brand-navy-900 to-brand-navy-800 text-white space-y-2 shadow-md hover-lift transition-all border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-[24px] text-brand-sage-700 dark:text-brand-sage-400">{st.icon}</span>
                  <span className="text-[10px] font-bold uppercase bg-white/10 px-2 py-0.5 rounded text-brand-navy-300">
                    {isEn ? `Card ${idx + 1}` : `Thẻ ${idx + 1}`}
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={st.number}
                    onChange={(e) => {
                      const updated = [...content.whyUs.stats];
                      updated[idx] = { ...updated[idx], number: Number(e.target.value) };
                      updateContentField('whyUs', 'stats', updated);
                    }}
                    className="w-2/3 px-2 py-1 rounded-lg bg-white/15 text-white font-black text-lg text-center border border-white/20 focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
                  />
                  <input
                    type="text"
                    value={st.suffix || ''}
                    placeholder={isEn ? 'Suffix' : 'Hậu tố'}
                    onChange={(e) => {
                      const updated = [...content.whyUs.stats];
                      updated[idx] = { ...updated[idx], suffix: e.target.value };
                      updateContentField('whyUs', 'stats', updated);
                    }}
                    className="w-1/3 px-2 py-1 rounded-lg bg-white/15 text-white font-bold text-xs text-center border border-white/20 focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
                  />
                </div>
                <input
                  type="text"
                  value={st.title}
                  onChange={(e) => {
                    const updated = [...content.whyUs.stats];
                    updated[idx] = { ...updated[idx], title: e.target.value };
                    updateContentField('whyUs', 'stats', updated);
                  }}
                  className="w-full px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-extrabold uppercase focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
                />
                <input
                  type="text"
                  value={st.subtitle}
                  onChange={(e) => {
                    const updated = [...content.whyUs.stats];
                    updated[idx] = { ...updated[idx], subtitle: e.target.value };
                    updateContentField('whyUs', 'stats', updated);
                  }}
                  className="w-full px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/90 text-[11px] focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
                />
              </div>
            ))}
          </div>

          {/* Trust Strip */}
          <div className="p-4 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-800/50 border border-brand-navy-200 dark:border-brand-navy-800 space-y-2 mt-4 hover-lift transition-all">
            <span className="block text-[11px] font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase">
              {isEn ? 'Quality Trust Strip:' : 'Dải Cam Kết Chất Lượng (Trust Strip):'}
            </span>
            <input
              type="text"
              value={content.whyUs.trustBanner.title}
              onChange={(e) => {
                const updated = { ...content.whyUs.trustBanner, title: e.target.value };
                updateContentField('whyUs', 'trustBanner', updated);
              }}
              className="w-full px-3 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
            />
            <input
              type="text"
              value={content.whyUs.trustBanner.description}
              onChange={(e) => {
                const updated = { ...content.whyUs.trustBanner, description: e.target.value };
                updateContentField('whyUs', 'trustBanner', updated);
              }}
              className="w-full px-3 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <TabSaveFooter handleDiscardChanges={handleDiscardChanges} handleSaveAll={handleSaveAll} isDirty={isDirty} isEn={isEn} isSaving={isSaving} />
    </div>
  );
}
