import React from 'react';

export function FileScannerPanel({ fileInputRef, handleScanImageFile, isEn }) {
  return (
    <div className="space-y-4 animate-fade-slide-up">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleScanImageFile}
        className="hidden"
      />
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-brand-sage-500/40 hover:border-brand-sage-500 dark:border-brand-sage-600/40 dark:hover:border-brand-sage-500 rounded-2xl p-8 text-center bg-brand-sage-50/20 dark:bg-brand-sage-950/10 cursor-pointer transition-all hover:bg-brand-sage-50/40 group"
      >
        <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-sage-100 dark:bg-brand-sage-900/40 text-brand-sage-700 dark:text-brand-sage-300 flex items-center justify-center group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
        </div>
        <h3 className="font-chivo font-black text-brand-navy-900 dark:text-white text-sm mt-3">
          {isEn ? 'Upload Member QR Code Photo' : 'Tải Lên Ảnh Mã QR Thẻ Hội Viên'}
        </h3>
        <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-1 max-w-sm mx-auto">
          {isEn
            ? 'Click to browse or drop an image screenshot of the member pass QR code (PNG, JPG, WEBP).'
            : 'Nhấn vào đây để chọn ảnh hoặc ảnh chụp màn hình mã QR của hội viên (PNG, JPG, WEBP).'}
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-sage-900 to-brand-sage-800 text-white text-xs font-chivo font-black uppercase tracking-wider shadow-sm">
          <span className="material-symbols-outlined text-[16px] text-brand-sand-300">file_upload</span>
          <span>{isEn ? 'Choose File' : 'Chọn Tệp Ảnh'}</span>
        </div>
      </div>
    </div>
  );
}
