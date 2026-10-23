import { catalogFacilities, catalogSports } from './publicCatalog.js';

export function getLandingPresentation(content, catalog) {
  // Published CMS entries have their own IDs and relationships. Replacing them
  // with operational IDs drops saved images, details and whole disciplines.
  const sports = content.coursesSection?.sportsList || [];
  const facilities = content.facilitiesSection?.facilitiesList || [];
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
      facilitiesList: facilities.length || content.facilitiesSection?.catalogSource === 'custom' ? facilities : catalogFacilities(catalog)
    }
  };
}
