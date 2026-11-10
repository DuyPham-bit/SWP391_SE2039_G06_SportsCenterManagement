import React, { useId } from 'react';

/**
 * "Tia" — the Olympic Sports Arena mascot: a little torch flame wearing a sage sweatband,
 * standing in a gold torch cup. Purely decorative (aria-hidden); the surrounding control
 * carries the accessible name. Motion lives in theme.css (.arena-mascot*) and switches off
 * under prefers-reduced-motion.
 *
 * @param {number}  size    Rendered width/height in px.
 * @param {boolean} active  Burns brighter and faster, e.g. while the assistant is replying.
 */
export function ArenaMascot({ size = 40, active = false, className = '' }) {
  const uid = useId().replace(/:/g, '');
  const flame = `amFlame${uid}`;
  const core = `amCore${uid}`;
  const cup = `amCup${uid}`;

  return (
    <svg
      viewBox="7 2 50 59"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={`arena-mascot ${active ? 'arena-mascot--active' : ''} ${className}`}
    >
      <defs>
        <linearGradient id={flame} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE3A3" />
          <stop offset="38%" stopColor="#F2CC8F" />
          <stop offset="72%" stopColor="#E07A5F" />
          <stop offset="100%" stopColor="#C4543A" />
        </linearGradient>
        <radialGradient id={core} cx="50%" cy="62%" r="55%">
          <stop offset="0%" stopColor="#FFF6DD" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FFF6DD" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={cup} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F7DCA8" />
          <stop offset="55%" stopColor="#D9AE62" />
          <stop offset="100%" stopColor="#A87C38" />
        </linearGradient>
      </defs>

      {/* Sparks drifting up */}
      <circle className="arena-mascot__spark arena-mascot__spark--a" cx="15" cy="22" r="1.6" fill="#F2CC8F" />
      <circle className="arena-mascot__spark arena-mascot__spark--b" cx="50" cy="18" r="1.3" fill="#E07A5F" />
      <circle className="arena-mascot__spark arena-mascot__spark--c" cx="46" cy="30" r="1" fill="#FFE3A3" />

      <g className="arena-mascot__body">
        {/* Torch cup */}
        <path d="M21 49.5h22l-4.2 8.6a3.2 3.2 0 0 1-2.9 1.9h-7.8a3.2 3.2 0 0 1-2.9-1.9z" fill={`url(#${cup})`} />
        <rect x="19.5" y="47.6" width="25" height="3.4" rx="1.7" fill="#F7DCA8" />
        <path d="M27 53.5h10" stroke="#A87C38" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />

        {/* Flame */}
        <g className="arena-mascot__flame">
          <path
            className="arena-mascot__tip"
            d="M37.5 7.5c1.8 3.4 1.2 6.4-1 8.6-.6-2.6-1.8-4.2-3.4-5.4 2-.6 3.6-1.6 4.4-3.2z"
            fill="#F2CC8F"
          />
          <path
            d="M32 4.5c3 7 9.4 10.4 12.6 16.4 2.8 5.2 3.4 9.4 2.9 13.4C46.4 43.4 40 49.5 32 49.5S17.6 43.4 16.6 34.3c-.6-5 1-9.6 4.2-13.2 1.4 3 3.2 4.2 5.2 4.6C25.2 18 28 11 32 4.5z"
            fill={`url(#${flame})`}
          />
          <ellipse cx="32" cy="37" rx="11" ry="10.5" fill={`url(#${core})`} />
        </g>

        {/* Sweatband with fluttering tails */}
        <path d="M17.6 26.8Q32 22.6 46.4 26.8l.3 4.2Q32 26.8 17.3 31z" fill="#81B29A" />
        <path d="M17.6 26.8Q32 22.6 46.4 26.8" stroke="#A8D1BC" strokeWidth="0.9" fill="none" strokeLinecap="round" />
        <g className="arena-mascot__tails">
          <path d="M46.2 28.4c2.6-.6 4.6.2 6 1.8-2.2.2-3.8-.2-5.6-.4z" fill="#81B29A" />
          <path d="M46.3 29.6c2.2.8 3.6 2.4 4 4.6-1.8-.8-3-1.8-4.2-3.2z" fill="#6A9C84" />
        </g>
        <circle cx="32" cy="26.4" r="1.4" fill="#F2CC8F" />

        {/* Face */}
        <g className="arena-mascot__eyes">
          <ellipse cx="27" cy="35.4" rx="3.1" ry="3.7" fill="#fff" />
          <ellipse cx="37" cy="35.4" rx="3.1" ry="3.7" fill="#fff" />
          <circle cx="27.6" cy="36" r="2" fill="#1E2235" />
          <circle cx="37.6" cy="36" r="2" fill="#1E2235" />
          <circle cx="28.3" cy="35.1" r="0.75" fill="#fff" />
          <circle cx="38.3" cy="35.1" r="0.75" fill="#fff" />
        </g>
        <ellipse cx="22.8" cy="40.6" rx="2.2" ry="1.3" fill="#FF8F7A" opacity="0.75" />
        <ellipse cx="41.2" cy="40.6" rx="2.2" ry="1.3" fill="#FF8F7A" opacity="0.75" />
        <path d="M29.4 41q2.6 3.2 5.2 0" stroke="#1E2235" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export default ArenaMascot;
