import React, { useState, useEffect, useRef } from 'react';

// Counts up to the value the first time it scrolls into view (once per page load).
export function AnimatedNumber({ value, duration = 1400, suffix = '', prefix = '', formatThousands = false }) {
  const [displayValue, setDisplayValue] = useState(0);
  const elementRef = useRef(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Already animated: keep the final value.
    if (hasAnimatedRef.current) {
      setDisplayValue(value);
      return;
    }

    // Fallback for environments without IntersectionObserver.
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setDisplayValue(value);
      hasAnimatedRef.current = true;
      return;
    }

    let animationFrameId = null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Only start the first time it becomes visible.
          if (entry.isIntersecting && !hasAnimatedRef.current) {
            hasAnimatedRef.current = true;
            observer.disconnect(); // Disconnect so scrolling back never restarts the count.

            let startTime = null;

            const animate = (currentTime) => {
              if (!startTime) startTime = currentTime;
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);

              // Ease-out cubic: 1 - (1 - progress)^3 slows down towards the target.
              const easeOut = 1 - Math.pow(1 - progress, 3);
              const currentVal = Math.round(easeOut * value);
              setDisplayValue(currentVal);

              if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
              } else {
                setDisplayValue(value);
              }
            };

            cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(animate);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  const formatted = formatThousands
    ? displayValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    : displayValue;

  return (
    <span ref={elementRef} className="tabular-nums inline-block">
      {prefix}{formatted}{suffix}
    </span>
  );
}
