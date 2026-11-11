import React from 'react';

export function HomeContentHeader({
  handleDiscardChanges, handlePreview, handleSaveAll, isDirty, isEn, isSaving, totalFacilities,
  totalSports, visibleFacilities, visibleSports
}) {
  return (
    <div
      className="scms-hero text-white rounded-3xl p-6 sm:p-8 border border-white/30 shadow-xl shadow-brand-teal-600/25 relative overflow-hidden"
      style={{
        background: 'linear-gradient(108deg, #2D6A4F 0%, #24828F 25%, #3FAEB8 48%, #81B29A 70%, #E5A33C 88%, #E5A33C 100%)'
      }}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-brand-sand-300/40 via-brand-sand-500/25 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-gradient-to-tr from-brand-sage-500/40 via-brand-sage-700/25 to-transparent blur-3xl" />

      {/* Same motion lanes as the other workspace banners (animated by .scms-hero) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300" aria-hidden="true">
        <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
        <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
        <circle cx="890" cy="110" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
      </svg>

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[11px] font-black uppercase tracking-wider mb-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>DYNAMIC CONTENT MANAGEMENT &amp; CLOUD STORAGE</span>
          </div>
          <h1 className="font-chivo text-2xl sm:text-3xl font-black text-white uppercase tracking-tight drop-shadow-sm">
            {isEn ? 'Homepage Content & Media Management' : 'Quản Lý Nội Dung Trang Chủ & Đa Phương Tiện'}
          </h1>
          <p className="text-xs sm:text-sm text-white/95 mt-1 max-w-2xl leading-relaxed font-medium">
            {isEn
              ? 'Customize public landing page content: edit headlines, upload cloud media, and toggle visibility of sports and court facilities.'
              : 'Tùy biến toàn bộ nội dung hiển thị ở Landing Page: chỉnh sửa văn bản, cập nhật ảnh đám mây, chủ động ẩn hoặc hiển thị các thẻ môn học và cụm sân thi đấu.'}
          </p>

          {/* Metrics Chips */}
          <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-semibold">
            <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-brand-sage-700 dark:text-brand-sage-400">sports_score</span>
              <span>
                {isEn ? 'Sports:' : 'Môn thể thao:'} <strong>{visibleSports}/{totalSports}</strong> {isEn ? 'visible' : 'đang hiển thị'}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-brand-sand-300">stadium</span>
              <span>
                {isEn ? 'Facilities:' : 'Cụm sân bãi:'} <strong>{visibleFacilities}/{totalFacilities}</strong> {isEn ? 'visible' : 'đang hiển thị'}
              </span>
            </div>

            {isDirty && (
              <div className="px-3 py-1.5 rounded-xl bg-brand-sand-500/20 border border-brand-sand-500/40 text-brand-sand-300 flex items-center gap-1.5 animate-pulse">
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
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-brand-navy-200 text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer hover-lift"
            title={isEn ? 'Open homepage preview in new tab' : 'Mở xem trang chủ trong tab mới'}
          >
            <span className="material-symbols-outlined text-[17px]">visibility</span>
            <span>{isEn ? 'Preview Homepage' : 'Xem Trước Trang Chủ'}</span>
          </button>

          <button
            type="button"
            onClick={handleDiscardChanges}
            disabled={!isDirty || isSaving}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/15 text-brand-navy-200 text-xs font-bold uppercase transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            title={isEn ? 'Restore content from the last successful save' : 'Trở về nội dung ở lần lưu thành công gần nhất'}
          >
            <span className="material-symbols-outlined text-[17px]">undo</span>
            <span>{isEn ? 'Discard Changes' : 'Hủy thay đổi'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving || !isDirty}
            className={`px-6 py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 cursor-pointer hover-lift ${
                isDirty
                  ? 'bg-brand-sage-700 hover:bg-brand-sage-900 shadow-brand-sage-700/30 ring-2 ring-brand-sage-400/50'
                  : 'bg-white/10 text-white/50 border border-white/15 cursor-not-allowed opacity-60 shadow-none'
              }`}
          >
            <span className="material-symbols-outlined text-[18px]">
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
    </div>
  );
}
