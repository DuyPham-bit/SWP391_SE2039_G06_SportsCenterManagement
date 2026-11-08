import React from 'react';

export function ScanModeTabs({ activeScanMode, handleTabChange, isEn }) {
  return (
    <div className="grid grid-cols-3 gap-1.5 p-1 bg-brand-navy-100 dark:bg-brand-navy-800/70 rounded-xl text-xs font-bold font-chivo">
      <button
        type="button"
        onClick={() => handleTabChange('camera')}
        className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeScanMode === 'camera'
                  ? 'bg-gradient-to-r from-brand-sage-900 to-brand-sage-800 text-white shadow-sm'
                  : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-white'
              }`}
      >
        <span className="material-symbols-outlined text-[17px]">photo_camera</span>
        <span className="truncate">{isEn ? 'Live Camera' : 'Quét Camera'}</span>
      </button>

      <button
        type="button"
        onClick={() => handleTabChange('file')}
        className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeScanMode === 'file'
                  ? 'bg-gradient-to-r from-brand-sage-900 to-brand-sage-800 text-white shadow-sm'
                  : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-white'
              }`}
      >
        <span className="material-symbols-outlined text-[17px]">upload_file</span>
        <span className="truncate">{isEn ? 'Scan Image' : 'Tải Ảnh QR'}</span>
      </button>

      <button
        type="button"
        onClick={() => handleTabChange('manual')}
        className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeScanMode === 'manual'
                  ? 'bg-gradient-to-r from-brand-sage-900 to-brand-sage-800 text-white shadow-sm'
                  : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-white'
              }`}
      >
        <span className="material-symbols-outlined text-[17px]">keyboard</span>
        <span className="truncate">{isEn ? 'RFID / Key-in' : 'Đầu Đọc Thẻ'}</span>
      </button>
    </div>
  );
}
