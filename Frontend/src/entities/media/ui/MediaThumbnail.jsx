import React from 'react';
import { getMediaThumbnailUrl, isImageMedia } from '../index.js';

export function MediaThumbnail({
  media,
  alt = 'Hình ảnh',
  className = '',
  size = 'md'
}) {
  const url = getMediaThumbnailUrl(media);
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  }[size] || 'w-16 h-16';

  if (!url) {
    return (
      <div className={`${sizeClasses} rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 ${className}`}>
        <span className="material-symbols-outlined text-[20px]">image_not_supported</span>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses} rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shrink-0 ${className}`}>
      <img
        src={url}
        alt={alt}
        className="w-full h-full object-cover"
        onError={e => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
}

export default MediaThumbnail;

