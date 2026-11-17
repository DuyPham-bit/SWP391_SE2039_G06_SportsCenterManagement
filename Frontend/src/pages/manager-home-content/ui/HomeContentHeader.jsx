import React from 'react';
import {
  SCMS_HERO_BADGE_CLASS,
  SCMS_HERO_BTN_DARK,
  SCMS_HERO_BTN_GLASS,
  SCMS_HERO_SECTION_CLASS,
  ScmsHeroDecor
} from '../../../shared/ui/ScmsHeroBanner.jsx';

export function HomeContentHeader({
  handleDiscardChanges, handlePreview, handleSaveAll, isDirty, isEn, isSaving, totalFacilities,
  totalSports, visibleFacilities, visibleSports
}) {
  return (
    <section className={`${SCMS_HERO_SECTION_CLASS} sm:p-8`}>
      <ScmsHeroDecor />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className={`${SCMS_HERO_BADGE_CLASS} mb-2`}>
            <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse shrink-0" />
            <span>DYNAMIC CONTENT MANAGEMENT &amp; CLOUD STORAGE</span>
          </div>
          <h1 className="font-chivo text-2xl sm:text-3xl font-black text-white uppercase tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            {isEn ? 'Homepage Content & Media Management' : 'Quản Lý Nội Dung Trang Chủ & Đa Phương Tiện'}
          </h1>
          <p className="text-xs sm:text-sm text-white/95 mt-1 max-w-2xl leading-relaxed font-medium drop-shadow-xs">
            {isEn
              ? 'Customize public landing page content: edit headlines, upload cloud media, and toggle visibility of sports and court facilities.'
              : 'Tùy biến toàn bộ nội dung hiển thị ở Landing Page: chỉnh sửa văn bản, cập nhật ảnh đám mây, chủ động ẩn hoặc hiển thị các thẻ môn học và cụm sân thi đấu.'}
          </p>

          {/* Metrics Chips */}
          <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-semibold">
            <div className="px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-[16px] text-brand-sand-200">sports_score</span>
              <span>
                {isEn ? 'Sports:' : 'Môn thể thao:'} <strong>{visibleSports}/{totalSports}</strong> {isEn ? 'visible' : 'đang hiển thị'}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-[16px] text-brand-sand-300">stadium</span>
              <span>
                {isEn ? 'Facilities:' : 'Cụm sân bãi:'} <strong>{visibleFacilities}/{totalFacilities}</strong> {isEn ? 'visible' : 'đang hiển thị'}
              </span>
            </div>

            {isDirty && (
              <div className="px-3 py-1.5 rounded-xl bg-brand-navy-950/75 border border-brand-sand-300/60 text-brand-sand-200 flex items-center gap-1.5 animate-pulse">
                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                <span>{isEn ? 'Unsaved changes' : 'Có thay đổi chưa lưu (Bấm Lưu để áp dụng)'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={handlePreview}
            className={SCMS_HERO_BTN_GLASS}
            title={isEn ? 'Open homepage preview in new tab' : 'Mở xem trang chủ trong tab mới'}
          >
            <span className="material-symbols-outlined text-[17px] text-brand-sand-200">visibility</span>
            <span>{isEn ? 'Preview Homepage' : 'Xem Trước Trang Chủ'}</span>
          </button>

          <button
            type="button"
            onClick={handleDiscardChanges}
            disabled={!isDirty || isSaving}
            className={SCMS_HERO_BTN_GLASS}
            title={isEn ? 'Restore content from the last successful save' : 'Trở về nội dung ở lần lưu thành công gần nhất'}
          >
            <span className="material-symbols-outlined text-[17px]">undo</span>
            <span>{isEn ? 'Discard Changes' : 'Hủy thay đổi'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving || !isDirty}
            className={
              isDirty
                ? `${SCMS_HERO_BTN_DARK} ring-2 ring-white/50`
                : 'px-5 py-2.5 sm:py-3 rounded-xl bg-white/10 text-white/60 border border-white/20 text-xs font-bold font-chivo uppercase tracking-wider flex items-center gap-2 cursor-not-allowed opacity-65'
            }
          >
            <span className={`material-symbols-outlined text-[18px] ${isDirty ? 'text-brand-sand-300' : ''} ${isSaving ? 'animate-spin' : ''}`}>
              {isSaving ? 'sync' : 'save'}
            </span>
            <span>
              {isSaving
                ? (isEn ? 'Saving...' : 'Đang lưu...')
                : (isEn ? 'Save All Changes' : 'Lưu Toàn Bộ Thay Đổi')}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
