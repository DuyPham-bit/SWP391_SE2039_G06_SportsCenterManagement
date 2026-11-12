import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const OTP_LENGTH = 6;
const BOX_STEP = 52; // box width + gap (px), dùng để gom 6 ô về giữa

// Bảng màu theo mẫu "Verifikasi Email" (dark).
const C = {
  surface: '#121826',
  surface2: '#171F30',
  border: '#232C40',
  text: '#E9ECF3',
  muted: '#8B90A3',
  violet: '#7C5CFC',
  cyan: '#45E0DD',
  danger: '#FF6B6B',
  success: '#3DDC97'
};

/** Chờ promise nhưng kéo dài tối thiểu `ms` để kịp thấy animation xác thực (kể cả khi lỗi). */
export async function withMinDuration(promise, ms = 1400) {
  const wait = new Promise(resolve => setTimeout(resolve, ms));
  try {
    const result = await promise;
    await wait;
    return result;
  } catch (error) {
    await wait;
    throw error;
  }
}

export const OTP_CARD_CLASS =
  'relative w-full max-w-[400px] overflow-hidden rounded-[24px] border border-[#232C40] bg-[#0D1220] px-6 pt-6 pb-6 sm:px-7 text-center text-[#E9ECF3] shadow-[0_30px_80px_-24px_rgba(0,0,0,0.8)] animate-scaleUp focus:outline-none';

const LIGHT_BOX = {
  success: 'bg-brand-sage-50 border-brand-sage-500 text-brand-sage-700',
  error: 'bg-brand-danger-50 border-brand-danger-500 text-brand-danger-600',
  current: 'bg-white border-brand-navy-700 ring-4 ring-brand-navy-700/15 text-brand-navy-900',
  filled: 'bg-white border-brand-navy-200 text-brand-navy-900',
  empty: 'bg-brand-navy-50 border-brand-navy-50 text-brand-navy-900'
};
const DARK_BOX = {
  success: 'bg-[#3DDC97]/10 border-[#3DDC97] text-[#3DDC97]',
  error: 'bg-[#FF6B6B]/[0.06] border-[#FF6B6B] text-[#FF6B6B]',
  current: 'bg-[#121826] border-[#7C5CFC] text-[#E9ECF3] shadow-[0_0_0_4px_rgba(124,92,252,0.2),0_0_18px_rgba(124,92,252,0.45)]',
  filled: 'bg-[#171F30] border-[#2E3850] text-[#E9ECF3]',
  empty: 'bg-[#121826] border-[#232C40] text-[#E9ECF3]'
};

/**
 * 6 ô nhập OTP (6 input thật). status: 'idle' | 'verifying' | 'error' | 'success'.
 * morph (dark): khi kiểm tra, 6 ô xoay & gom thành khối gradient; đúng → ô xanh ✓;
 * sai → ô đỏ ✕, rồi 6 ô trống viền đỏ hiện lại và gọi onErrorReset để nhập lại.
 */
export function OtpCodeInput({
  id, value, onChange, status = 'idle', autoFocus = true, describedBy, dark = false, morph = false, onErrorReset
}) {
  const refs = useRef([]);
  // errorPhase: 'blob' (khối đỏ ✕) → 'boxes' (6 ô trống viền đỏ) → 'done'
  const [errorPhase, setErrorPhase] = useState('done');
  const onErrorResetRef = useRef(onErrorReset);
  onErrorResetRef.current = onErrorReset;

  useEffect(() => {
    if (status !== 'error') { setErrorPhase('done'); return undefined; }
    if (!morph) {
      setErrorPhase('boxes');
      const t = setTimeout(() => { setErrorPhase('done'); onErrorResetRef.current?.(); }, 900);
      return () => clearTimeout(t);
    }
    setErrorPhase('blob');
    const t1 = setTimeout(() => setErrorPhase('boxes'), 1100);
    const t2 = setTimeout(() => { setErrorPhase('done'); onErrorResetRef.current?.(); }, 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [status, morph]);

  useEffect(() => {
    if (status === 'error' && errorPhase === 'done') refs.current[0]?.focus();
  }, [status, errorPhase]);

  const blobKind = status === 'verifying' ? 'verifying'
    : status === 'success' ? 'success'
      : status === 'error' && errorPhase === 'blob' ? 'error' : null;
  const collapsed = morph && blobKind !== null;
  const showRedBoxes = status === 'error' && errorPhase === 'boxes';
  const locked = status === 'verifying' || status === 'success' || (status === 'error' && errorPhase !== 'done');
  // Khi đang báo lỗi thì ẩn số cũ: ô trống viền đỏ
  const shown = status === 'error' && errorPhase !== 'done' && morph ? '' : value;
  const palette = dark ? DARK_BOX : LIGHT_BOX;
  const activeIndex = Math.min(value.length, OTP_LENGTH - 1);

  const focusActive = () => refs.current[activeIndex]?.focus();

  // Con trỏ luôn nằm ở ô kế tiếp cần nhập
  useEffect(() => {
    if (refs.current.includes(document.activeElement) && document.activeElement !== refs.current[activeIndex]) {
      refs.current[activeIndex]?.focus();
    }
  }, [activeIndex]);
  const commit = (next) => onChange(next.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH));

  return (
    <motion.div
      initial={false}
      animate={showRedBoxes ? { x: [0, -7, 7, -5, 5, -2, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className="relative mx-auto w-fit"
    >
      <div className="flex items-center gap-2" role="group" aria-label="Mã xác thực 6 chữ số">
        {Array.from({ length: OTP_LENGTH }, (_, index) => {
          const digit = shown[index] || '';
          const isCurrent = !locked && index === activeIndex && value.length < OTP_LENGTH;
          const tone = showRedBoxes || (status === 'error' && !morph) ? 'error'
            : status === 'success' && !morph ? 'success'
              : isCurrent ? 'current' : digit ? 'filled' : 'empty';
          const side = index < 2.5 ? -1 : 1;
          return (
            <motion.div
              key={index}
              initial={false}
              animate={collapsed
                ? { x: (2.5 - index) * BOX_STEP, rotate: side * -35, scale: 0.55, opacity: 0 }
                : { x: 0, rotate: 0, scale: 1, opacity: 1 }}
              transition={collapsed
                ? { duration: 0.45, ease: [0.55, 0, 0.75, 0.2], delay: index * 0.07 }
                : { type: 'spring', stiffness: 320, damping: 24, delay: index * 0.04 }}
              className="relative"
            >
              <input
                ref={el => { refs.current[index] = el; }}
                id={index === 0 ? id : `${id}-${index}`}
                name={index === 0 ? id : undefined}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                aria-label={`Chữ số ${index + 1}`}
                aria-invalid={status === 'error'}
                aria-describedby={describedBy}
                autoFocus={autoFocus && index === 0}
                readOnly={locked}
                tabIndex={index === activeIndex ? 0 : -1}
                value={digit}
                onFocus={(event) => {
                  if (index !== activeIndex) { event.preventDefault(); focusActive(); }
                }}
                onMouseDown={(event) => { event.preventDefault(); focusActive(); }}
                onPaste={(event) => {
                  event.preventDefault();
                  if (locked) return;
                  commit(event.clipboardData.getData('text'));
                }}
                onChange={(event) => {
                  if (locked) return;
                  const raw = event.target.value.replace(/[^0-9]/g, '');
                  // Bỏ số cũ trong ô, chỉ lấy phần vừa gõ
                  const fresh = digit ? raw.replace(digit, '') : raw;
                  if (!fresh) return;
                  // Autofill đủ 6 số → thay toàn bộ; còn lại → nối vào cuối
                  commit(fresh.length >= OTP_LENGTH ? fresh : value + fresh);
                }}
                onKeyDown={(event) => {
                  if (locked) return;
                  if (event.key === 'Backspace') {
                    event.preventDefault();
                    commit(value.slice(0, -1));
                  }
                }}
                className={`w-11 h-[54px] rounded-xl border-[1.5px] text-center text-xl font-semibold caret-transparent outline-none transition-[background-color,border-color,box-shadow,color] duration-200 select-none ${palette[tone]}`}
              />
              {isCurrent && (
                <span className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1.5px] h-5 rounded-full animate-pulse ${dark ? 'bg-[#E9ECF3]' : 'bg-brand-navy-700'}`} />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Khối gradient khi kiểm tra → xanh ✓ (đúng) / đỏ ✕ (sai) */}
      <AnimatePresence>
        {morph && blobKind && (
          <motion.div
            key="blob"
            initial={{ scale: 0, opacity: 0, rotate: -30 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.4, opacity: 0, transition: { duration: 0.25 } }}
            transition={{ type: 'spring', stiffness: 170, damping: 15, delay: 0.5 }}
            className="pointer-events-none absolute inset-0 m-auto h-[62px] w-[62px]"
          >
            <OtpBlob kind={blobKind} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function OtpBlob({ kind }) {
  const resolved = kind === 'success' || kind === 'error';
  const color = kind === 'success' ? C.success : C.danger;
  return (
    <motion.div
      className="relative h-full w-full"
      initial={false}
      animate={resolved
        ? { scale: [1, 0.18, 1.12, 1], rotate: [-12, 0, 0, 0], y: 0 }
        : { rotate: [-14, 10, -14], y: [0, -5, 0], scale: [1, 1.04, 1] }}
      transition={resolved
        ? { duration: 0.85, times: [0, 0.35, 0.75, 1], ease: 'easeInOut' }
        : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Lớp gradient (đang kiểm tra) */}
      <motion.div
        className="absolute inset-0 rounded-[18px]"
        style={{
          background: `linear-gradient(135deg, ${C.violet} 0%, #6E8BFF 50%, ${C.cyan} 100%)`,
          boxShadow: '0 0 36px rgba(124,92,252,0.55), 0 0 60px rgba(69,224,221,0.25)'
        }}
        initial={false}
        animate={{ opacity: resolved ? [1, 1, 0, 0] : 1, borderRadius: resolved ? ['18px', '50%', '18px', '18px'] : '18px' }}
        transition={{ duration: 0.85, times: [0, 0.35, 0.5, 1] }}
      />
      {/* Lớp kết quả (xanh/đỏ) */}
      {resolved && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center rounded-[18px]"
          style={{ background: color, boxShadow: `0 0 36px ${color}80` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 1, 1] }}
          transition={{ duration: 0.85, times: [0, 0.35, 0.5, 1] }}
        >
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="#0A0E16" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            {kind === 'success' ? (
              <motion.polyline points="20 6 9 17 4 12" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.6 }} />
            ) : (
              <>
                <motion.path d="M7 7l10 10" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.2, delay: 0.6 }} />
                <motion.path d="M17 7L7 17" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.2, delay: 0.75 }} />
              </>
            )}
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
}

function maskEmail(email = '') {
  const [local, domain] = String(email).split('@');
  if (!domain) return email;
  return `${local.slice(0, 1)}***@${domain}`;
}

const DEFAULT_LABELS = {
  title: 'Xác thực email của bạn',
  sentTo: 'Mã 6 chữ số đã được gửi tới',
  sentToSuffix: '. Nhập mã vào bên dưới.',
  verifying: 'Đang xác thực mã…',
  success: 'Email đã được xác thực!',
  submit: 'Xác thực',
  submitting: 'Xác thực',
  continue: 'Tiếp tục',
  noCode: 'Không nhận được mã?',
  resend: 'Gửi lại',
  back: 'Đổi địa chỉ email',
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
  notice,
  resendSeconds = 0,
  onResend,
  onSubmit,
  onContinue,
  onBack,
  onClose,
  onErrorReset,
  labels: labelOverrides
}) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const busy = status === 'verifying' || status === 'success';
  const statusId = `${inputId}-status`;
  return (
    <>
      <div className="pointer-events-none absolute -top-28 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-[#7C5CFC]/20 blur-3xl" aria-hidden="true" />

      <button
        type="button"
        onClick={onClose}
        disabled={status === 'verifying'}
        aria-label={labels.close}
        className="absolute top-4 right-4 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/5 text-[#8B90A3] transition-colors hover:bg-white/10 hover:text-[#E9ECF3] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C5CFC]"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>

      <div className="relative">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#232C40] bg-[#171F30] text-[#7C5CFC]">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2.5" />
            <path d="M3.5 7l8.5 6 8.5-6" />
          </svg>
        </div>

        <h3 id={titleId} className="mt-4 text-[21px] font-semibold tracking-tight text-[#E9ECF3]">{labels.title}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#8B90A3]">
          {labels.sentTo} <strong className="font-semibold text-[#E9ECF3] break-all">{maskEmail(email)}</strong>{labels.sentToSuffix}
        </p>

        <div className="mt-6 flex h-[62px] items-center justify-center">
          <OtpCodeInput
            id={inputId} value={code} onChange={onCodeChange} status={status}
            describedBy={statusId} dark morph onErrorReset={onErrorReset}
          />
        </div>

        <div id={statusId} role={status === 'error' ? 'alert' : 'status'} aria-live="polite" className="mt-4 min-h-[20px] text-[13px]">
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.span key="ok" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-[#3DDC97]">{labels.success}</motion.span>
            ) : status === 'error' ? (
              <motion.span key="err" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-[#FF6B6B]">{errorText}</motion.span>
            ) : status === 'verifying' ? (
              <motion.span key="ver" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-[#8B90A3]">{labels.verifying}</motion.span>
            ) : notice ? (
              <motion.span key="notice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#A996FF]">{notice}</motion.span>
            ) : null}
          </AnimatePresence>
        </div>

        <button
          type="button"
          disabled={status === 'verifying' || (status === 'success' ? !onContinue : code.length !== 6 || status === 'error')}
          onClick={status === 'success' ? onContinue : onSubmit}
          className="mt-4 h-12 w-full cursor-pointer rounded-[14px] bg-[#7C5CFC] text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(124,92,252,0.9)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-[#2B2563] disabled:text-white/50 disabled:shadow-none"
        >
          {status === 'success' ? labels.continue : status === 'verifying' ? labels.submitting : labels.submit}
        </button>

        <p className="mt-4 text-[13px] text-[#8B90A3]" aria-live="polite">
          {labels.noCode}{' '}
          <button
            type="button"
            disabled={busy || resendSeconds > 0}
            onClick={onResend}
            className="cursor-pointer font-medium text-[#A996FF] hover:underline disabled:cursor-default disabled:text-[#7C5CFC]/80 disabled:no-underline"
          >
            {labels.resend}{resendSeconds > 0 ? ` (${resendSeconds}s)` : ''}
          </button>
        </p>
        {onBack && (
          <button type="button" disabled={busy} onClick={onBack} className="mt-2 cursor-pointer text-[13px] text-[#8B90A3] hover:text-[#E9ECF3] disabled:opacity-50">
            {labels.back}
          </button>
        )}
      </div>
    </>
  );
}
