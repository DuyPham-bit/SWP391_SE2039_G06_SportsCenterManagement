import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { receptionApi } from '../../../entities/member/index.js';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { Badge } from '../../../shared/ui/StatCard.jsx';

export const RESEND_COOLDOWN_SECONDS = 60;

// Cooldowns live outside components so they survive list refreshes and modal closes in this tab.
const cooldownUntil = new Map();
const listeners = new Set();
const emit = () => listeners.forEach(listener => listener());

export function startResendCooldown(memberId, seconds = RESEND_COOLDOWN_SECONDS) {
  if (!memberId || !seconds) return;
  cooldownUntil.set(String(memberId), Date.now() + seconds * 1000);
  emit();
}

function useSecondsLeft(memberId) {
  const until = useSyncExternalStore(
    listener => { listeners.add(listener); return () => listeners.delete(listener); },
    () => cooldownUntil.get(String(memberId)) || 0
  );
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (until <= Date.now()) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [until]);
  return Math.max(0, Math.ceil((until - now) / 1000));
}

/** "Gửi lại mail" with a 60 s cooldown that also honours the server's Retry-After. */
export function ResendVerificationButton({ memberId, size = 'md', onResent }) {
  const { showSuccess, showError, showWarning } = useToast();
  const [sending, setSending] = useState(false);
  const secondsLeft = useSecondsLeft(memberId);
  const disabled = sending || secondsLeft > 0;

  const handleClick = async (event) => {
    event.stopPropagation();
    setSending(true);
    try {
      const result = await receptionApi.resendVerification(memberId);
      startResendCooldown(memberId, result.resendCooldownSeconds || RESEND_COOLDOWN_SECONDS);
      showSuccess(result.message || 'Đã gửi lại email xác nhận.');
      onResent?.(result.member);
    } catch (error) {
      if (error?.status === 429) {
        startResendCooldown(memberId, Number(error.retryAfter || error.payload?.retryAfterSeconds) || RESEND_COOLDOWN_SECONDS);
        showWarning(error.message);
      } else {
        showError(error?.message || 'Không thể gửi lại email xác nhận.');
      }
    } finally {
      setSending(false);
    }
  };

  const sizing = size === 'sm' ? 'min-h-[32px] px-2.5 py-1 text-[11px]' : 'min-h-[40px] px-4 py-2 text-xs';
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-busy={sending}
      title={secondsLeft > 0 ? `Có thể gửi lại sau ${secondsLeft} giây` : 'Gửi lại email xác nhận cho hội viên'}
      className={`${sizing} inline-flex items-center gap-1.5 rounded-lg border border-brand-sand-300 dark:border-brand-sand-700 bg-white dark:bg-brand-navy-800 text-brand-sand-800 dark:text-brand-sand-300 font-bold uppercase tracking-wider transition-colors hover:bg-brand-sand-50 dark:hover:bg-brand-navy-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sand-600`}
    >
      <span className={`material-symbols-outlined text-[15px] ${sending ? 'animate-spin' : ''}`} aria-hidden="true">
        {sending ? 'progress_activity' : 'forward_to_inbox'}
      </span>
      <span>{secondsLeft > 0 ? `Gửi lại (${secondsLeft}s)` : 'Gửi lại mail'}</span>
    </button>
  );
}

/** Account email state badge, reusing the shared Badge palette ("warning" = pending). */
export function EmailVerificationBadge({ verified, size = 'sm' }) {
  if (verified) return null;
  return <Badge variant="warning" size={size}>Chờ xác nhận mail</Badge>;
}
