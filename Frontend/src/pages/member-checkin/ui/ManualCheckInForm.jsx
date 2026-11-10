import React from 'react';

export function ManualCheckInForm({ handleExecuteCheckIn, identifier, isEn, processing, setCheckInError, setIdentifier }) {
  return (
    <form
      noValidate
      onSubmit={(e) => { e.preventDefault(); handleExecuteCheckIn(); }}
      className="space-y-3 animate-fade-slide-up"
    >
      <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300">
        {isEn ? 'Member Card ID / Phone / Email' : 'Mã thẻ hội viên / Số điện thoại / Email'}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-3 text-brand-navy-400">
            barcode_scanner
          </span>
          <input
            type="text"
            placeholder={isEn ? 'Scan card or enter ID (e.g. MEM-00002)...' : 'Quét mã thẻ (ví dụ: MEM-00002)...'}
            value={identifier}
            onChange={e => { setIdentifier(e.target.value); setCheckInError(null); }}
            className="w-full pl-11 pr-4 py-2.5 text-base font-chivo font-bold rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 focus:outline-none focus:ring-2 focus:ring-brand-sage-500/40 focus:border-brand-sage-500 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={processing}
          className="px-6 py-2.5 bg-gradient-to-r from-brand-sage-900 to-brand-sage-800 hover:brightness-110 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all hover-lift shrink-0 cursor-pointer disabled:opacity-50"
        >
          {processing ? (isEn ? 'Validating...' : 'Đang kiểm tra...') : (isEn ? 'VALIDATE' : 'XÁC THỰC')}
        </button>
      </div>
      <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400">
        {isEn
          ? '💡 Hardware USB/Bluetooth barcode wedge scanners will automatically submit when pressing Enter.'
          : '💡 Đầu đọc thẻ RFID/Barcode cổng USB sẽ tự động quét và nhấn Enter xác thực vào sân.'}
      </p>
    </form>
  );
}
