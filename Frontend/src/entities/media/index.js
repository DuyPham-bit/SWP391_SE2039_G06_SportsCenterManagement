/**
 * Entity: Media
 * Helper và model cho thực thể Đa phương tiện / Ảnh / Video (Media).
 */
export function getMediaThumbnailUrl(media) {
  if (!media) return '';
  return typeof media === 'string' ? media : (media.url || media.publicUrl || '');
}

export function isImageMedia(typeOrFilename) {
  if (!typeOrFilename) return false;
  return /\.(png|jpe?g|webp|gif|avif)$/i.test(typeOrFilename) || typeOrFilename.startsWith('image/');
}

export { MediaThumbnail } from './ui/MediaThumbnail.jsx';
