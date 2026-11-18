import React, { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../lib/motion.js';

/**
 * Parses the number inside a display string so it can be counted up and re-formatted the same way:
 * "1.250.000 ₫" (thousands groups), "12,5%" (decimal comma), "2.5K+", "09" (zero-padded), "+18".
 * Returns null when the text has no single countable number (dates, ranges, "—").
 */
export function parseCountable(text) {
  const match = /^(\D*?)(\d[\d.,]*)(.*)$/s.exec(String(text ?? ''));
  if (!match) return null;
  const [, prefix, raw, suffix] = match;
  // A second number ("10/20", "3 - 5", "12 tháng 3") is not a single countable value.
  if (/\d/.test(suffix)) return null;
  if (/^\d{1,3}([.,])\d{3}(\1\d{3})*$/.test(raw)) {
    const sep = raw.match(/[.,]/)[0];
    return { prefix, suffix, value: Number(raw.split(sep).join('')), decimals: 0, sep, dec: null, pad: 0 };
  }
  if (/^\d+([.,]\d+)?$/.test(raw)) {
    const dec = raw.match(/[.,]/)?.[0] || null;
    const decimals = dec ? raw.split(dec)[1].length : 0;
    return { prefix, suffix, value: Number(raw.replace(',', '.')), decimals, sep: null, dec, pad: raw.startsWith('0') && !dec ? raw.length : 0 };
  }
  return null;
}

function format(spec, n) {
  let body;
  if (spec.sep) {
    body = Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, spec.sep);
  } else {
    body = n.toFixed(spec.decimals);
    if (spec.dec === ',') body = body.replace('.', ',');
    if (spec.pad) body = body.padStart(spec.pad, '0');
  }
  return `${spec.prefix}${body}${spec.suffix}`;
}

/**
 * Counts a stat up from zero when it first scrolls into view (once per value).
 * Non-numeric values and React nodes render unchanged; reduced motion shows the final value.
 */
export function CountUp({ value, duration = 1100, delay = 0, className = '' }) {
  const ref = useRef(null);
  const spec = typeof value === 'string' || typeof value === 'number' ? parseCountable(value) : null;
  const [shown, setShown] = useState(null);

  useEffect(() => {
    if (!spec || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') { setShown(null); return undefined; }
    let raf = 0;
    let started = false;
    setShown(format(spec, 0));
    const run = () => {
      const start = performance.now() + delay;
      const tick = now => {
        const t = Math.min(1, Math.max(0, (now - start) / duration));
        setShown(format(spec, spec.value * (1 - Math.pow(1 - t, 3))));
        if (t < 1) raf = requestAnimationFrame(tick); else setShown(null);
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(entries => {
      if (started || !entries.some(e => e.isIntersecting)) return;
      started = true;
      io.disconnect();
      run();
    });
    if (ref.current) io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [String(value)]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!spec) return <>{value}</>;
  return <span ref={ref} className={`scms-count ${className}`}>{shown ?? value}</span>;
}

export default CountUp;
