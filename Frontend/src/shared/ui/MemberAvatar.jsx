import React, { useEffect, useState } from 'react';
import { getInitials } from '../lib/avatarHelper.js';
import { getAvatarGradient } from '../lib/avatarGradient.js';

/**
 * A person's photo, or their initials when there is none / it fails to load.
 * Never falls back to a stock photo of somebody else (counter staff compare faces with it).
 * `className` carries size, shape and border exactly like the <img> it replaces.
 */
export function MemberAvatar({ src, name, className = 'w-10 h-10 rounded-full', alt, ...rest }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);

  if (src && !failed) {
    return <img src={src} alt={alt ?? name ?? ''} onError={() => setFailed(true)} className={`${className} object-cover`} {...rest} />;
  }
  return (
    <span
      role="img"
      aria-label={alt ?? name ?? ''}
      className={`${className} inline-flex items-center justify-center bg-gradient-to-br ${getAvatarGradient(name || '')} text-white font-bold text-xs select-none`}
      {...rest}
    >
      {getInitials(name)}
    </span>
  );
}
