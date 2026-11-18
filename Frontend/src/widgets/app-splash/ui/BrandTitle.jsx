import React from 'react';
import { BRAND_NAME, TAGLINES } from '../model/splashCopy.js';

const LETTERS = BRAND_NAME.split('');

/** Letter-by-letter brand reveal with a travelling gold glint, then the bilingual tagline. */
export function BrandTitle() {
  return (
    <>
      <p className="osa-splash__title" aria-label="Olympic Sports Arena">
        {LETTERS.map((ch, i) => (
          <span key={i} className="osa-splash__ch" style={{ '--i': i }} data-ch={ch} aria-hidden="true">
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </p>
      <p className="osa-splash__tagline" aria-hidden="true">
        <span>{TAGLINES[0]}</span>
        <span>{TAGLINES[1]}</span>
      </p>
    </>
  );
}
