import React from 'react';
import { saveDraft } from '../model/draft.js';
import { TabSaveFooter } from './TabSaveFooter.jsx';

export function AuthShowcaseTab({
  addToast, content, handleDiscardChanges, handleSaveAll, isDirty, isEn, isSaving, openMediaPicker,
  setContent, setIsDirty, updateContentField
}) {
  return (
    <div className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="border-b border-brand-navy-100 dark:border-brand-navy-800 pb-4">
        <h2 className="text-lg font-black text-brand-navy-900 dark:text-white uppercase tracking-wide">
          {isEn ? 'Section 7: Login & Register Showcase Banner' : 'Khu Vực 7: Banner Giới Thiệu Đăng Nhập & Đăng Ký'}
        </h2>
        <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-1">
          {isEn
            ? 'Customize the athletic showcase banner, headline, frosted cards, and live metrics on Login and Register pages.'
            : 'Chỉnh sửa cột giới thiệu thể thao Olympic, tiêu đề truyền cảm hứng, thẻ nổi và 3 chỉ số thống kê trên màn hình Đăng nhập và Đăng ký.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
                {isEn ? 'Badge Pill:' : 'Huy hiệu mở cửa (Badge):'}
              </label>
              <input
                type="text"
                value={content.authShowcase?.badge || ''}
                onChange={(e) => updateContentField('authShowcase', 'badge', e.target.value)}
                placeholder="Sân tập mở cửa 24/7"
                className="w-full px-4 py-2.5 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
                {isEn ? 'Tagline / Category:' : 'Dòng phụ (Tagline):'}
              </label>
              <input
                type="text"
                value={content.authShowcase?.tagline || ''}
                onChange={(e) => updateContentField('authShowcase', 'tagline', e.target.value)}
                placeholder="Khởi đầu bứt phá"
                className="w-full px-4 py-2.5 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
              {isEn ? 'Login Page Headline:' : 'Tiêu đề trang Đăng nhập:'}
            </label>
            <textarea
              rows={2}
              value={content.authShowcase?.loginTitle || ''}
              onChange={(e) => updateContentField('authShowcase', 'loginTitle', e.target.value)}
              placeholder={"Tập luyện hôm nay, \nbứt phá mỗi ngày."}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-sm font-bold text-brand-navy-900 dark:text-white focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
            />
            <span className="text-[11px] text-brand-navy-400 dark:text-brand-navy-500">
              {isEn ? 'Tip: Enter a new line to apply the multi-color highlight effect to the second line.' : 'Mẹo: Xuống dòng để áp dụng hiệu ứng chuyển màu rực rỡ cho dòng thứ hai.'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
              {isEn ? 'Register Page Headline:' : 'Tiêu đề trang Đăng ký:'}
            </label>
            <textarea
              rows={2}
              value={content.authShowcase?.registerTitle || ''}
              onChange={(e) => updateContentField('authShowcase', 'registerTitle', e.target.value)}
              placeholder={"Hành trình mới, \nphiên bản khỏe hơn."}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-sm font-bold text-brand-navy-900 dark:text-white focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
              {isEn ? 'Showcase Description:' : 'Đoạn văn mô tả giới thiệu:'}
            </label>
            <textarea
              rows={3}
              value={content.authShowcase?.description || ''}
              onChange={(e) => updateContentField('authShowcase', 'description', e.target.value)}
              placeholder="Hệ sinh thái thể thao đa năng với 9 cụm sân thi đấu..."
              className="w-full px-4 py-2.5 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          {/* Media background preview */}
          <div>
            <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
              {isEn ? 'Showcase Background Image / Poster (Cloud):' : 'Ảnh nền Cột Đăng nhập / Poster Đám mây:'}
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={content.authShowcase?.posterUrl || ''}
                onChange={(e) => updateContentField('authShowcase', 'posterUrl', e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs truncate focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => openMediaPicker(
                  isEn ? 'Select Showcase Background Image' : 'Chọn Ảnh Nền Cột Đăng Nhập',
                  content.authShowcase?.posterUrl || '',
                  (url) => updateContentField('authShowcase', 'posterUrl', url)
                )}
                className="px-3.5 py-2 bg-brand-sage-700 hover:bg-brand-sage-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all hover-lift shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                <span>{isEn ? 'Upload/Change' : 'Tải/Đổi Ảnh'}</span>
              </button>
            </div>

            {/* Live Preview Box like Login left column */}
            <div className="h-64 rounded-2xl overflow-hidden bg-brand-navy-800 relative border border-brand-navy-700 p-5 flex flex-col justify-between text-white shadow-inner">
              {content.authShowcase?.posterUrl && (
                <img
                  src={content.authShowcase.posterUrl}
                  alt="Showcase preview"
                  className="absolute inset-0 w-full h-full object-cover opacity-35"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-800 via-brand-navy-700/80 to-transparent pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-navy-300 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                  {content.authShowcase?.badge || 'Sân tập mở cửa 24/7'}
                </span>
                <span className="text-[10px] bg-black/50 text-white/70 px-2 py-0.5 rounded font-mono">
                  {isEn ? 'Preview' : 'Xem trước'}
                </span>
              </div>

              <div className="relative z-10 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-brand-sand-300">
                  {content.authShowcase?.tagline || 'Khởi đầu bứt phá'}
                </div>
                <div className="text-sm font-black text-white leading-tight line-clamp-2">
                  {content.authShowcase?.loginTitle || 'Tập luyện hôm nay, bứt phá mỗi ngày.'}
                </div>
              </div>

              <div className="relative z-10 flex gap-4 pt-2 border-t border-white/10 text-xs">
                <div>
                  <span className="font-bold text-white">{content.authShowcase?.stat1Value || '09'}</span>
                  <span className="text-[10px] text-brand-navy-300 block">{content.authShowcase?.stat1Label || 'Bộ môn'}</span>
                </div>
                <div>
                  <span className="font-bold text-white">{content.authShowcase?.stat2Value || '09'}</span>
                  <span className="text-[10px] text-brand-navy-300 block">{content.authShowcase?.stat2Label || 'Khu tập'}</span>
                </div>
                <div>
                  <span className="font-bold text-white">{content.authShowcase?.stat3Value || '2.5K+'}</span>
                  <span className="text-[10px] text-brand-navy-300 block">{content.authShowcase?.stat3Label || 'Hội viên'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2 Feature Cards */}
      <div className="border-t border-brand-navy-100 dark:border-brand-navy-800 pt-6">
        <h3 className="text-xs font-black text-brand-navy-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-brand-sage-700 dark:text-brand-sage-400">featured_play_list</span>
          <span>{isEn ? '2 Frosted Showcase Feature Cards' : '2 Thẻ Kính Nổi Bật (Feature Cards)'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1 */}
          <div className="p-4 rounded-xl border border-brand-navy-200 dark:border-brand-navy-800 bg-brand-navy-50/50 dark:bg-brand-navy-800/40 space-y-3">
            <span className="text-[11px] font-bold text-brand-navy-500 uppercase tracking-wide">
              {isEn ? 'Feature Card 1' : 'Thẻ tính năng 1'}
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-brand-navy-600 dark:text-brand-navy-400 uppercase mb-1">
                  {isEn ? 'Icon (Material):' : 'Biểu tượng:'}
                </label>
                <input
                  type="text"
                  value={content.authShowcase?.feature1Icon || ''}
                  onChange={(e) => updateContentField('authShowcase', 'feature1Icon', e.target.value)}
                  placeholder="bolt"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-brand-navy-600 dark:text-brand-navy-400 uppercase mb-1">
                  {isEn ? 'Title:' : 'Tiêu đề:'}
                </label>
                <input
                  type="text"
                  value={content.authShowcase?.feature1Title || ''}
                  onChange={(e) => updateContentField('authShowcase', 'feature1Title', e.target.value)}
                  placeholder="Đặt chỗ trong 30s"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand-navy-600 dark:text-brand-navy-400 uppercase mb-1">
                {isEn ? 'Description:' : 'Mô tả ngắn:'}
              </label>
              <input
                type="text"
                value={content.authShowcase?.feature1Desc || ''}
                onChange={(e) => updateContentField('authShowcase', 'feature1Desc', e.target.value)}
                placeholder="Giữ sân & lớp học 7 ngày"
                className="w-full px-2.5 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-4 rounded-xl border border-brand-navy-200 dark:border-brand-navy-800 bg-brand-navy-50/50 dark:bg-brand-navy-800/40 space-y-3">
            <span className="text-[11px] font-bold text-brand-navy-500 uppercase tracking-wide">
              {isEn ? 'Feature Card 2' : 'Thẻ tính năng 2'}
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-brand-navy-600 dark:text-brand-navy-400 uppercase mb-1">
                  {isEn ? 'Icon (Material):' : 'Biểu tượng:'}
                </label>
                <input
                  type="text"
                  value={content.authShowcase?.feature2Icon || ''}
                  onChange={(e) => updateContentField('authShowcase', 'feature2Icon', e.target.value)}
                  placeholder="verified"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-brand-navy-600 dark:text-brand-navy-400 uppercase mb-1">
                  {isEn ? 'Title:' : 'Tiêu đề:'}
                </label>
                <input
                  type="text"
                  value={content.authShowcase?.feature2Title || ''}
                  onChange={(e) => updateContentField('authShowcase', 'feature2Title', e.target.value)}
                  placeholder="Chuẩn Olympic 5★"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand-navy-600 dark:text-brand-navy-400 uppercase mb-1">
                {isEn ? 'Description:' : 'Mô tả ngắn:'}
              </label>
              <input
                type="text"
                value={content.authShowcase?.feature2Desc || ''}
                onChange={(e) => updateContentField('authShowcase', 'feature2Desc', e.target.value)}
                placeholder="Hệ thống sân bãi cao cấp"
                className="w-full px-2.5 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3 Stats Metrics */}
      <div className="border-t border-brand-navy-100 dark:border-brand-navy-800 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xs font-black text-brand-navy-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-brand-sage-700 dark:text-brand-sage-400">analytics</span>
              <span>{isEn ? '3 Quick Stat Numbers on Login Page' : '3 Số Liệu Thống Kê Chân Trang Đăng Nhập & Đăng Ký'}</span>
            </h3>
            <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 mt-0.5">
              {isEn ? 'Directly controls the numbers displayed at the bottom of the Login & Register hero column.' : 'Chính là 3 số liệu hiển thị tại chân trang cột giới thiệu của màn hình Đăng nhập và Đăng ký.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const s1 = content.whyUs?.stats?.[1]?.number || content.coursesSection?.sportsList?.length || 0;
              const s2 = content.whyUs?.stats?.[0]?.number || content.facilitiesSection?.facilitiesList?.length || 0;
              const s3 = content.whyUs?.stats?.[2] ? `${content.whyUs.stats[2].number}${content.whyUs.stats[2].suffix || ''}` : '0';
              setContent(prev => {
                const updated = {
                  ...prev,
                  authShowcase: {
                    ...(prev.authShowcase || {}),
                    stat1Value: String(s1),
                    stat2Value: String(s2),
                    stat3Value: String(s3)
                  }
                };
                saveDraft(updated);
                return updated;
              });
              setIsDirty(true);
              addToast(
                isEn
                  ? 'Synchronized 3 stats from "Why Choose SCMS" (Tab 2)!'
                  : 'Đã sao chép nhanh số liệu từ Tab 2 (Tại sao chọn SCMS) sang đây!',
                'success'
              );
            }}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-brand-navy-800 border border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-200 text-xs font-bold hover:bg-brand-navy-100 dark:hover:bg-brand-navy-700 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer hover-lift shrink-0"
          >
            <span className="material-symbols-outlined text-[16px] text-brand-sage-700 dark:text-brand-sage-400">sync_alt</span>
            <span>{isEn ? 'Sync numbers from Tab 2' : 'Sao chép số liệu từ Tab 2 sang'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Stat 1 */}
          <div className="p-3.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-800 bg-brand-navy-50/50 dark:bg-brand-navy-800/40 space-y-2">
            <span className="text-[10px] font-bold text-brand-navy-500 uppercase">{isEn ? 'Stat #1 (Sports)' : 'Chỉ số 1 (Bộ môn)'}</span>
            <div>
              <label className="block text-[10px] font-bold text-brand-navy-600 dark:text-brand-navy-400 uppercase mb-1">
                {isEn ? 'Value:' : 'Con số:'}
              </label>
              <input
                type="text"
                value={content.authShowcase?.stat1Value || ''}
                onChange={(e) => updateContentField('authShowcase', 'stat1Value', e.target.value)}
                placeholder="10"
                className="w-full px-2.5 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs font-black focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand-navy-600 dark:text-brand-navy-400 uppercase mb-1">
                {isEn ? 'Label:' : 'Nhãn mô tả:'}
              </label>
              <input
                type="text"
                value={content.authShowcase?.stat1Label || ''}
                onChange={(e) => updateContentField('authShowcase', 'stat1Label', e.target.value)}
                placeholder="Bộ môn thi đấu"
                className="w-full px-2.5 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Stat 2 */}
          <div className="p-3.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-800 bg-brand-navy-50/50 dark:bg-brand-navy-800/40 space-y-2">
            <span className="text-[10px] font-bold text-brand-navy-500 uppercase">{isEn ? 'Stat #2 (Courts/Zones)' : 'Chỉ số 2 (Khu tập/Sân)'}</span>
            <div>
              <label className="block text-[10px] font-bold text-brand-navy-600 dark:text-brand-navy-400 uppercase mb-1">
                {isEn ? 'Value:' : 'Con số:'}
              </label>
              <input
                type="text"
                value={content.authShowcase?.stat2Value || ''}
                onChange={(e) => updateContentField('authShowcase', 'stat2Value', e.target.value)}
                placeholder="10"
                className="w-full px-2.5 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs font-black focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand-navy-600 dark:text-brand-navy-400 uppercase mb-1">
                {isEn ? 'Label:' : 'Nhãn mô tả:'}
              </label>
              <input
                type="text"
                value={content.authShowcase?.stat2Label || ''}
                onChange={(e) => updateContentField('authShowcase', 'stat2Label', e.target.value)}
                placeholder="Khu tập luyện"
                className="w-full px-2.5 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Stat 3 */}
          <div className="p-3.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-800 bg-brand-navy-50/50 dark:bg-brand-navy-800/40 space-y-2">
            <span className="text-[10px] font-bold text-brand-navy-500 uppercase">{isEn ? 'Stat #3 (Members)' : 'Chỉ số 3 (Hội viên)'}</span>
            <div>
              <label className="block text-[10px] font-bold text-brand-navy-600 dark:text-brand-navy-400 uppercase mb-1">
                {isEn ? 'Value:' : 'Con số:'}
              </label>
              <input
                type="text"
                value={content.authShowcase?.stat3Value || ''}
                onChange={(e) => updateContentField('authShowcase', 'stat3Value', e.target.value)}
                placeholder="2.5K+"
                className="w-full px-2.5 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs font-black focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand-navy-600 dark:text-brand-navy-400 uppercase mb-1">
                {isEn ? 'Label:' : 'Nhãn mô tả:'}
              </label>
              <input
                type="text"
                value={content.authShowcase?.stat3Label || ''}
                onChange={(e) => updateContentField('authShowcase', 'stat3Label', e.target.value)}
                placeholder="Hội viên active"
                className="w-full px-2.5 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Live Preview Box as seen on Login screen */}
        <div className="mt-5 p-4 rounded-2xl bg-brand-navy-800 text-white border border-white/10 shadow-inner flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase font-bold text-brand-navy-400 tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-sage-400 animate-pulse" />
              <span>{isEn ? 'Live Preview as displayed on Login & Register screen' : 'Xem trước trực tiếp hiển thị tại chân trang Đăng Nhập / Đăng Ký'}</span>
            </div>
            <div className="flex items-center gap-8 sm:gap-12 mt-2.5">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{content.authShowcase?.stat1Value || '09'}</div>
                <div className="text-[11px] text-brand-navy-400 font-medium mt-0.5">{content.authShowcase?.stat1Label || 'Bộ môn thi đấu'}</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{content.authShowcase?.stat2Value || '09'}</div>
                <div className="text-[11px] text-brand-navy-400 font-medium mt-0.5">{content.authShowcase?.stat2Label || 'Khu tập luyện'}</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-brand-sand-300 tracking-tight">{content.authShowcase?.stat3Value || '2.5K+'}</div>
                <div className="text-[11px] text-brand-navy-400 font-medium mt-0.5">{content.authShowcase?.stat3Label || 'Hội viên active'}</div>
              </div>
            </div>
          </div>
          <a
            href="#/login"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover-lift"
          >
            <span>{isEn ? 'Open Login Page in New Tab' : 'Mở xem Trang Đăng Nhập'}</span>
            <span className="material-symbols-outlined text-[15px]">open_in_new</span>
          </a>
        </div>
      </div>

      <TabSaveFooter handleDiscardChanges={handleDiscardChanges} handleSaveAll={handleSaveAll} isDirty={isDirty} isEn={isEn} isSaving={isSaving} />
    </div>
  );
}
