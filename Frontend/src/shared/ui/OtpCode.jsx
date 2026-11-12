import React from 'react';

const OTP_LENGTH = 6;

export const OTP_CARD_CLASS =
  'relative w-full max-w-[400px] bg-white rounded-[28px] shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)] px-6 pt-5 pb-6 sm:px-7 text-center animate-scaleUp focus:outline-none';

const BOX_CLASS = {
  success: 'bg-brand-sage-50 border-brand-sage-500 text-brand-sage-700',
  error: 'bg-brand-danger-50 border-brand-danger-500 text-brand-danger-600',
  current: 'bg-white border-brand-navy-700 ring-4 ring-brand-navy-700/15 text-brand-navy-900',
  filled: 'bg-white border-brand-navy-200 text-brand-navy-900',
  empty: 'bg-brand-navy-50 border-brand-navy-50 text-brand-navy-900'
};

/**
 * 6 ô nhập mã OTP. status: 'idle' | 'verifying' | 'error' | 'success'
 * Đúng → ô xanh, sai → ô đỏ; đang đỏ mà gõ tiếp thì nhập lại từ đầu.
 */
export function OtpCodeInput({ id, value, onChange, status = 'idle', autoFocus = true, describedBy }) {
  const locked = status === 'verifying' || status === 'success';
  return (
    <div className="relative mx-auto w-fit">
      <input
        id={id}
        name={id}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={OTP_LENGTH}
        pattern="[0-9]{6}"
        aria-label="Mã xác thực 6 chữ số"
        required
        autoFocus={autoFocus}
        readOnly={locked}
        value={value}
        aria-invalid={status === 'error'}
        aria-describedby={describedBy}
        onChange={(event) => {
          let next = event.target.value.replace(/[^0-9]/g, '');
          if (status === 'error' && next.length > value.length) next = next.slice(value.length);
          onChange(next.slice(0, OTP_LENGTH));
        }}
        className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-text caret-transparent"
      />
      <div className="flex items-center gap-2 sm:gap-2.5" aria-hidden="true">
        {Array.from({ length: OTP_LENGTH }, (_, index) => {
          const digit = value[index] || '';
          const isCurrent = status === 'idle' && value.length === index;
          const tone = status === 'success' || status === 'error'
            ? status
            : isCurrent ? 'current' : digit ? 'filled' : 'empty';
          return (
            <div
              key={index}
              style={{ transitionDelay: status === 'success' ? `${index * 40}ms` : '0ms' }}
              className={`w-11 h-12 sm:w-12 sm:h-13 rounded-xl border-[1.5px] flex items-center justify-center text-xl font-bold transition-colors duration-200 ${BOX_CLASS[tone]}`}
            >
              {digit || (isCurrent && <span className="w-[1.5px] h-5 bg-brand-navy-700 rounded-full animate-pulse" />)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IconButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-8 h-8 shrink-0 rounded-full bg-brand-navy-50 hover:bg-brand-navy-100 text-brand-navy-500 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy-700"
    >
      {children}
    </button>
  );
}

const DEFAULT_LABELS = {
  title: 'Nhập mã xác thực',
  sentTo: 'Chúng tôi đã gửi mã đến',
  verifying: 'Đang kiểm tra mã…',
  success: 'Mã chính xác!',
  resendIn: (s) => <>Nếu chưa nhận được mã,<br />yêu cầu mã mới sau {s} giây</>,
  resendHint: <>Chưa nhận được mã? Kiểm tra cả thư rác<br />hoặc yêu cầu mã mới.</>,
  resend: 'Nhận mã mới',
  back: 'Quay lại',
  close: 'Đóng bảng xác thực'
};

/** Nội dung dialog OTP (đặt trong card có class OTP_CARD_CLASS). */
export function OtpDialogContent({
  titleId,
  inputId,
  email,
  code,
  onCodeChange,
  status = 'idle',
  errorText,
  resendSeconds = 0,
  onResend,
  onBack,
  backText,
  onClose,
  labels: labelOverrides
}) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const busy = status === 'verifying' || status === 'success';
  const statusId = `${inputId}-status`;
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        {onBack ? (
          <IconButton label={labels.back} onClick={onBack} disabled={busy}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </IconButton>
        ) : <span className="w-8" />}
        <h3 id={titleId} className="text-xl sm:text-[22px] font-bold text-brand-navy-900 tracking-tight">{labels.title}</h3>
        <IconButton label={labels.close} onClick={onClose} disabled={status === 'verifying'}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </IconButton>
      </div>

      <p className="mt-1.5 text-[13px] text-brand-navy-500">
        {labels.sentTo} <strong className="font-semibold text-brand-navy-900 break-all">{email}</strong>
      </p>

      <div className="mt-7">
        <OtpCodeInput id={inputId} value={code} onChange={onCodeChange} status={status} describedBy={statusId} />
      </div>

      <div id={statusId} role={status === 'error' ? 'alert' : 'status'} aria-live="polite" className="min-h-[20px] mt-4 text-[13px] font-medium flex items-center justify-center">
        {status === 'success' ? (
          <span className="inline-flex items-center gap-1.5 text-brand-sage-700">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            {labels.success}
          </span>
        ) : status === 'error' ? (
          <span className="text-brand-danger-600">{errorText}</span>
        ) : status === 'verifying' ? (
          <span className="inline-flex items-center gap-2 text-brand-navy-500">
            <span className="w-3.5 h-3.5 border-2 border-brand-navy-200 border-t-brand-navy-700 rounded-full animate-spin" />
            {labels.verifying}
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-brand-navy-400" aria-live="polite">
        {resendSeconds > 0 ? labels.resendIn(resendSeconds) : labels.resendHint}
      </p>
      <button
        type="button"
        disabled={busy || resendSeconds > 0}
        onClick={onResend}
        className="mt-4 w-full h-11 rounded-full text-sm font-semibold transition-colors bg-brand-navy-700 text-white hover:bg-brand-navy-800 cursor-pointer disabled:bg-brand-navy-50 disabled:text-brand-navy-300 disabled:cursor-not-allowed"
      >
        {labels.resend}
      </button>
      {onBack && backText && (
        <button type="button" disabled={busy} onClick={onBack} className="mt-3 text-sm font-semibold text-brand-navy-900 hover:underline cursor-pointer disabled:opacity-50">
          {backText}
        </button>
      )}
    </>
  );
}
