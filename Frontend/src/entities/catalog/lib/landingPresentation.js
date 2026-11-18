import { catalogFacilities, catalogSports } from '../api/publicCatalog.js';

const INVALID_IMAGE_IDS = ['photo-1613918108466-292b78a8ef95'];
const HOURLY_RENTAL = /(?:giá thuê|\/giờ|\/sân|\/bàn|\/lượt|\/buổi|thuê sàn|thuê sân|\/hour|per hour)/i;

const isInvalidImage = url => typeof url === 'string' && INVALID_IMAGE_IDS.some(id => url.includes(id));

/**
 * Drops known-broken image URLs (the card then shows its no-image state) and replaces hourly rental rates,
 * which are not sold on the public page, with `includedLabel` (an i18n label from the caller).
 */
export function sanitizeFacilityImages(fac, includedLabel) {
  if (!fac) return fac;
  let updated = fac;
  if (isInvalidImage(fac.image) || isInvalidImage(fac.secondaryImage)) {
    updated = {
      ...updated,
      image: isInvalidImage(fac.image) ? '' : fac.image,
      secondaryImage: isInvalidImage(fac.secondaryImage) ? '' : fac.secondaryImage
    };
  }
  if (includedLabel && typeof fac.priceRate === 'string' && HOURLY_RENTAL.test(fac.priceRate)) {
    updated = { ...updated, priceRate: includedLabel };
  }
  return updated;
}

export function getLandingPresentation(content, catalog, includedLabel) {
  // Published CMS entries have their own IDs and relationships. Replacing them
  // with operational IDs drops saved images, details and whole disciplines.
  const safeContent = content || {};
  const sports = safeContent.coursesSection?.sportsList || [];
  const sanitize = facility => sanitizeFacilityImages(facility, includedLabel);
  const facilities = (safeContent.facilitiesSection?.facilitiesList || []).map(sanitize);
  return {
    ...safeContent,
    heroBanner: {
      ...safeContent.heroBanner,
      title: safeContent.heroBanner?.title || catalog?.center?.name || '',
      description: safeContent.heroBanner?.description || catalog?.center?.description || ''
    },
    coursesSection: {
      ...safeContent.coursesSection,
      sportsList: sports.length || safeContent.coursesSection?.catalogSource === 'custom' ? sports : catalogSports(catalog)
    },
    facilitiesSection: {
      ...safeContent.facilitiesSection,
      facilitiesList: (facilities.length || safeContent.facilitiesSection?.catalogSource === 'custom' ? facilities : catalogFacilities(catalog)).map(sanitize)
    }
  };
}
