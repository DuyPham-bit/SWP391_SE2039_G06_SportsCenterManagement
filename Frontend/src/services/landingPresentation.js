import { catalogFacilities, catalogSports } from './publicCatalog.js';

export const BADMINTON_IMAGE = 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop';
const INVALID_BADMINTON_IMAGE_ID = 'photo-1613918108466-292b78a8ef95';

export function sanitizeFacilityImages(fac) {
  if (!fac) return fac;
  const isBadminton = fac.id === 'room-03' || /cầu lông|badminton/i.test(fac.name || '');
  const hasInvalidMain = typeof fac.image === 'string' && fac.image.includes(INVALID_BADMINTON_IMAGE_ID);
  const hasInvalidSec = typeof fac.secondaryImage === 'string' && fac.secondaryImage.includes(INVALID_BADMINTON_IMAGE_ID);
  if (isBadminton && (hasInvalidMain || hasInvalidSec || !fac.image)) {
    return {
      ...fac,
      image: hasInvalidMain || !fac.image ? BADMINTON_IMAGE : fac.image,
      secondaryImage: hasInvalidSec ? BADMINTON_IMAGE : fac.secondaryImage
    };
  }
  return fac;
}

export function getLandingPresentation(content, catalog) {
  // Published CMS entries have their own IDs and relationships. Replacing them
  // with operational IDs drops saved images, details and whole disciplines.
  const sports = content.coursesSection?.sportsList || [];
  const facilities = (content.facilitiesSection?.facilitiesList || []).map(sanitizeFacilityImages);
  return {
    ...content,
    heroBanner: {
      ...content.heroBanner,
      title: content.heroBanner?.title || catalog?.center.name || '',
      description: content.heroBanner?.description || catalog?.center.description || ''
    },
    coursesSection: {
      ...content.coursesSection,
      sportsList: sports.length || content.coursesSection?.catalogSource === 'custom' ? sports : catalogSports(catalog)
    },
    facilitiesSection: {
      ...content.facilitiesSection,
      facilitiesList: (facilities.length || content.facilitiesSection?.catalogSource === 'custom' ? facilities : catalogFacilities(catalog)).map(sanitizeFacilityImages)
    }
  };
}
