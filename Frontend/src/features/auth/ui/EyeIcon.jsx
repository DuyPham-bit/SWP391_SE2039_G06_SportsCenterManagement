import React from 'react';

/** Eye that opens/closes: the lid squashes and a slash draws across when the password is visible (auth-field.css). */
export function EyeIcon({ open }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`lp-eye h-[19px] w-[19px] ${open ? 'is-open' : 'is-closed'}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <g className="lp-eye-lid">
        <path d="M2.2 12s3.6-6.5 9.8-6.5S21.8 12 21.8 12s-3.6 6.5-9.8 6.5S2.2 12 2.2 12z" />
        <circle className="lp-eye-pupil" cx="12" cy="12" r="3" />
      </g>
      <path className="lp-eye-slash" d="M4 4l16 16" pathLength="1" />
    </svg>
  );
}
