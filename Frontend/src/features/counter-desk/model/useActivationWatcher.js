import { useEffect, useRef } from 'react';
import { receptionApi } from '../../../entities/member/index.js';

const POLL_MS = 10000;

/**
 * Polls the activation state of members still "pending email verification" and calls
 * `onActivated(memberIds, statuses)` once they finish the email link, so the counter screen
 * can flip badges and congratulate without a manual refresh. Pauses while the tab is hidden.
 */
export function useActivationWatcher(pendingIds, onActivated) {
  const callbackRef = useRef(onActivated);
  callbackRef.current = onActivated;
  const key = [...new Set(pendingIds.map(Number))].sort((a, b) => a - b).join(',');

  useEffect(() => {
    if (!key) return undefined;
    const ids = key.split(',').map(Number);
    let controller = null;
    let stopped = false;

    const check = async () => {
      if (document.visibilityState === 'hidden') return;
      controller?.abort();
      controller = new AbortController();
      try {
        const statuses = await receptionApi.getVerificationStatus(ids, { signal: controller.signal });
        const activated = statuses.filter(item => item.isEmailVerified);
        if (!stopped && activated.length) callbackRef.current(activated.map(item => Number(item.memberId)), activated);
      } catch {
        // Transient network/permission errors: keep the current badges and retry on the next tick.
      }
    };

    const timer = window.setInterval(check, POLL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      controller?.abort();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [key]);
}
