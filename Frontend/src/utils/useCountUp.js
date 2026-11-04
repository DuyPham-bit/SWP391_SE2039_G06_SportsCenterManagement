import { useState, useEffect, useRef } from 'react';

/**
 * useCountUp - Animates a number counting up from 0 to target value on mount/change.
 * Uses cubic ease-out for a smooth, natural deceleration curve.
 * Respects prefers-reduced-motion for WCAG AAA accessibility.
 *
 * @param {number} targetValue - The target numerical value
 * @param {number} duration - Animation duration in milliseconds (default 1200ms)
 * @param {number} decimals - Number of decimal places to preserve (default 0)
 * @returns {number} The current animated value
 */
export function useCountUp(targetValue, duration = 1200, decimals = 0) {
  const [value, setValue] = useState(0);
  const prevTargetRef = useRef(0);

  useEffect(() => {
    const end = Number(targetValue || 0);
    if (isNaN(end)) {
      setValue(0);
      return;
    }

    // Accessibility check: Skip animation if user prefers reduced motion
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(end);
      prevTargetRef.current = end;
      return;
    }

    const start = 0;
    const diff = end - start;
    if (diff === 0) {
      setValue(0);
      prevTargetRef.current = 0;
      return;
    }

    let startTimestamp = null;
    let reqId = null;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth easeOutCubic: 1 - (1 - progress)^3
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * ease;

      setValue(decimals > 0 ? Number(current.toFixed(decimals)) : Math.round(current));

      if (progress < 1) {
        reqId = requestAnimationFrame(step);
      } else {
        setValue(end);
        prevTargetRef.current = end;
      }
    };

    reqId = requestAnimationFrame(step);

    return () => {
      if (reqId) cancelAnimationFrame(reqId);
    };
  }, [targetValue, duration, decimals]);

  return value;
}
