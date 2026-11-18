import React, { useEffect, useRef, useState } from 'react';

/**
 * "42% · Preparing the arena…". The percentage text is written by the splash through `pctRef`
 * (no re-render per frame); a new message slides in while the previous one blurs out above it.
 */
export function StatusTicker({ message, pctRef }) {
  const keyRef = useRef(0);
  const [items, setItems] = useState(() => [{ key: 0, text: message, out: false, first: true }]);

  useEffect(() => {
    setItems((prev) => {
      const current = prev[prev.length - 1];
      if (current.text === message) return prev;
      keyRef.current += 1;
      return [{ ...current, out: true }, { key: keyRef.current, text: message, out: false, first: false }];
    });
  }, [message]);

  return (
    <p className="osa-splash__status" aria-hidden="true">
      <span ref={pctRef} className="osa-splash__pct">0%</span>
      <span className="osa-splash__sep">·</span>
      <span className="osa-splash__ticker">
        {items.map((item) => (
          <span
            key={item.key}
            className={`osa-splash__msg${item.out ? ' is-out' : ''}${item.first ? ' is-first' : ''}`}
          >
            {item.text}
          </span>
        ))}
      </span>
    </p>
  );
}
