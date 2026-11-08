import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { translatePackageName } from '../../../shared/i18n/i18nHelper.js';

export function CheckInQrModal({
  copiedCode, currentUser, handleCopyMemberCode, isEn, memberCode, qrDataUrl, qrModalOpen,
  setQrModalOpen
}) {
  return (
    <Modal
      isOpen={qrModalOpen}
      onClose={() => setQrModalOpen(false)}
      title={isEn ? 'Digital Access Card & Gate QR' : 'Mã Số Thẻ Check-in Điện Tử Qua Cổng'}
    >
      <div className="p-6 text-center space-y-5">
        <div className="space-y-1">
          <span className="text-xs font-extrabold uppercase tracking-widest text-brand-sage-700 dark:text-brand-sage-400">
            SCMS OLYMPIC SMART ACCESS
          </span>
          <h3 className="text-lg font-black text-brand-navy-900 dark:text-white">
            {currentUser?.fullName}
          </h3>
          <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 font-mono">
            {isEn ? 'Card' : 'Mã thẻ'}: <strong className="text-brand-navy-800 dark:text-brand-navy-200">{currentUser?.memberCode || 'MEM-00000'}</strong> · {translatePackageName(currentUser?.packageName, isEn)}
          </p>
        </div>

        {/* Genuine Scannable QR Code with Target Corners & Scan Beam */}
        <div className="relative mx-auto w-64 h-64 p-3 bg-white dark:bg-brand-navy-900 rounded-3xl border-2 border-brand-navy-900 dark:border-brand-navy-700 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
          {/* Corner decorations */}
          <div className="absolute top-2.5 left-2.5 w-5 h-5 border-t-4 border-l-4 border-brand-sage-500 rounded-tl-lg pointer-events-none" />
          <div className="absolute top-2.5 right-2.5 w-5 h-5 border-t-4 border-r-4 border-brand-sage-500 rounded-tr-lg pointer-events-none" />
          <div className="absolute bottom-2.5 left-2.5 w-5 h-5 border-b-4 border-l-4 border-brand-sage-500 rounded-bl-lg pointer-events-none" />
          <div className="absolute bottom-2.5 right-2.5 w-5 h-5 border-b-4 border-r-4 border-brand-sage-500 rounded-br-lg pointer-events-none" />

          {/* Laser scanning sweep line */}
          <div className="absolute inset-x-3 h-1 bg-gradient-to-r from-transparent via-brand-sage-400 to-transparent shadow-[0_0_14px_#81B29A] animate-scanner-beam pointer-events-none z-10" />

          {qrDataUrl ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={qrDataUrl}
                alt={`QR Check-in: ${memberCode}`}
                className="w-56 h-56 object-contain rounded-2xl select-none"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-xl bg-brand-navy-900 text-brand-sand-300 font-black text-xs flex items-center justify-center shadow-lg border-2 border-white tracking-wider">
                  SCMS
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-xs text-brand-navy-400">
              <span className="material-symbols-outlined text-3xl animate-spin text-brand-sage-700 dark:text-brand-sage-400 mb-2">progress_activity</span>
              <span>{isEn ? 'Generating QR Code...' : 'Đang tạo mã QR...'}</span>
            </div>
          )}
        </div>

        {/* Quick Actions Under QR */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopyMemberCode}
            className="px-3.5 py-2 rounded-xl bg-brand-navy-100 dark:bg-brand-navy-800 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[15px]">content_copy</span>
            <span>{copiedCode ? (isEn ? 'Copied!' : 'Đã sao chép!') : (isEn ? 'Copy Code' : 'Chép mã thẻ')}</span>
          </button>
          {qrDataUrl && (
            <a
              href={qrDataUrl}
              download={`SCMS-QR-${memberCode}.png`}
              className="px-3.5 py-2 rounded-xl bg-brand-sage-500/15 hover:bg-brand-sage-500/25 text-brand-sage-700 dark:text-brand-sage-300 text-xs font-bold flex items-center gap-1.5 transition border border-brand-sage-500/30 active:scale-95"
            >
              <span className="material-symbols-outlined text-[15px]">download</span>
              <span>{isEn ? 'Download QR' : 'Tải ảnh QR'}</span>
            </a>
          )}
        </div>

        <div className="p-3.5 bg-brand-sand-50 dark:bg-brand-sand-950/30 rounded-2xl border border-brand-sand-200 dark:border-brand-sand-900/50 text-xs text-brand-sand-900 dark:text-brand-sand-300 space-y-1">
          <p className="font-bold flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-brand-sand-700 dark:text-brand-sand-400">info</span>
            {isEn ? 'Automated Check-in Guide' : 'Hướng dẫn check-in tự động'}
          </p>
          <p className="text-[11px] text-brand-navy-600 dark:text-brand-navy-400">
            {isEn
              ? 'Present this QR code in front of the scanner camera at the gate turnstile or front desk to log gym entry.'
              : 'Đưa màn hình mã QR này vào trước camera máy quét tại cửa xoay hoặc quầy lễ tân để ghi nhận lượt tập.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setQrModalOpen(false)}
          className="w-full py-2.5 rounded-xl bg-brand-navy-900 hover:bg-brand-navy-800 text-white text-xs font-bold transition-colors cursor-pointer active:scale-98"
        >
          {isEn ? 'Close Window' : 'Đóng cửa sổ'}
        </button>
      </div>
    </Modal>
  );
}
