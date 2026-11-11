import { catalogFacilities, catalogSports } from '../api/publicCatalog.js';

export const BADMINTON_IMAGE = 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop';
const INVALID_BADMINTON_IMAGE_ID = 'photo-1613918108466-292b78a8ef95';

export function sanitizeFacilityImages(fac) {
  if (!fac) return fac;
  let updated = fac;
  const isBadminton = fac.id === 'room-03' || /cầu lông|badminton/i.test(fac.name || '');
  const hasInvalidMain = typeof fac.image === 'string' && fac.image.includes(INVALID_BADMINTON_IMAGE_ID);
  const hasInvalidSec = typeof fac.secondaryImage === 'string' && fac.secondaryImage.includes(INVALID_BADMINTON_IMAGE_ID);
  if (isBadminton && (hasInvalidMain || hasInvalidSec || !fac.image)) {
    updated = {
      ...updated,
      image: hasInvalidMain || !fac.image ? BADMINTON_IMAGE : fac.image,
      secondaryImage: hasInvalidSec ? BADMINTON_IMAGE : fac.secondaryImage
    };
  }
  if (fac.priceRate && /(?:giá thuê|\/giờ|\/sân|\/bàn|\/lượt|\/buổi|thuê sàn|thuê sân)/i.test(fac.priceRate)) {
    updated = {
      ...updated,
      priceRate: 'Bao gồm trong gói tập'
    };
  }
  return updated;
}

const ZONE_STYLES = [
  { icon: 'fitness_center', color: '#F87171' },
  { icon: 'sports_tennis', color: '#60A5FA' },
  { icon: 'sports_soccer', color: '#34D399' },
  { icon: 'pool', color: '#FBBF24' },
  { icon: 'sports_mma', color: '#A78BFA' },
  { icon: 'stadium', color: '#F472B6' }
];
const UNASSIGNED_ZONE = 'Khu vực khác';
const segments = value => String(value || '').split(/\s*[•|]\s*/).map(part => part.trim()).filter(Boolean);

const capacityOf = value => {
  const match = String(value ?? '').match(/\d+/);
  return match ? Number(match[0]) : null;
};
const gridIndex = (value, max) => {
  const number = Number.parseInt(String(value ?? ''), 10);
  return Number.isInteger(number) && number >= 1 && number <= max ? number : null;
};
export const ZONE_MAP_COLUMNS = 3;
export const ZONE_MAP_ROWS = 4;
export const ZONE_ICONS = ['fitness_center', 'sports_tennis', 'sports_soccer', 'pool', 'sports_mma', 'stadium',
  'sports_basketball', 'self_improvement', 'sports_golf', 'directions_run', 'park', 'spa'];
export const ZONE_COLORS = ZONE_STYLES.map(style => style.color);

/**
 * Builds the "Khu vực tập luyện" map from the facility cards the page actually shows, so it follows
 * the same source as the facilities section: SQL rooms by default, the manager's curated list when
 * one is saved (an intentionally emptied list shows no zones) and never a hidden card.
 * Locations look like "<zone> • <floor>"; rooms are grouped by zone and listed with the floor.
 */
export function facilityZones(facilities = []) {
  const groups = new Map();
  for (const facility of facilities) {
    if (!facility?.name || facility.isVisible === false) continue;
    const zone = segments(facility.zone || facility.location)[0] || UNASSIGNED_ZONE;
    const location = segments(facility.location);
    const detail = (location[0] === zone ? location.slice(1) : location).join(' • ');
    if (!groups.has(zone)) groups.set(zone, []);
    groups.get(zone).push({ id: String(facility.id ?? ''), name: facility.name, detail, capacity: capacityOf(facility.capacity), facility });
  }
  const names = [...groups.keys()].filter(name => name !== UNASSIGNED_ZONE)
    .sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
  if (groups.has(UNASSIGNED_ZONE)) names.push(UNASSIGNED_ZONE);
  return names.map((name, index) => {
    const rooms = groups.get(name);
    return {
      id: `facility-zone-${index + 1}`,
      key: name,
      name,
      ...ZONE_STYLES[index % ZONE_STYLES.length],
      description: '',
      col: null,
      row: null,
      isVisible: true,
      rooms,
      capacityTotal: rooms.reduce((total, room) => total + (room.capacity || 0), 0),
      items: rooms.map(room => (room.detail ? `${room.name} · ${room.detail}` : room.name))
    };
  });
}

/**
 * Applies the manager's per-zone settings (saved in zonesLayout.zones, keyed by the DB zone name) on top of
 * the zones derived from the rooms. Rooms always come from the data; settings only change the label, icon,
 * colour, description, map cell, order and visibility. Settings for zones no longer in the data are ignored.
 */
export function buildZoneMap(facilities = [], settings = [], { includeHidden = false } = {}) {
  const auto = facilityZones(facilities);
  const byKey = new Map((settings || []).filter(item => item?.key).map((item, index) => [String(item.key), { ...item, order: index }]));
  const merged = auto.map((zone, index) => {
    const setting = byKey.get(zone.key);
    if (!setting) return { ...zone, order: Number.MAX_SAFE_INTEGER, autoOrder: index };
    return {
      ...zone,
      id: setting.id || zone.id,
      name: String(setting.name || '').trim() || zone.name,
      icon: ZONE_ICONS.includes(setting.icon) ? setting.icon : zone.icon,
      color: /^#[0-9a-f]{6}$/i.test(setting.color || '') ? setting.color : zone.color,
      description: String(setting.description || '').trim(),
      col: gridIndex(setting.col, ZONE_MAP_COLUMNS),
      row: gridIndex(setting.row, ZONE_MAP_ROWS),
      isVisible: setting.isVisible !== false,
      order: setting.order,
      autoOrder: index
    };
  }).sort((a, b) => a.order - b.order || a.autoOrder - b.autoOrder)
    .map(({ order, autoOrder, ...zone }) => zone);
  return includeHidden ? merged : merged.filter(zone => zone.isVisible);
}

/**
 * Rooms placed on the zone map: always the DB rooms (they carry location, floor and capacity; curated
 * homepage cards do not). Only an intentionally emptied facilities section hides them on the map too.
 */
export function zoneRoomSource(content, catalog) {
  const section = content?.facilitiesSection;
  if (section?.catalogSource === 'custom' && !(section.facilitiesList || []).length) return [];
  return catalogFacilities(catalog).map(sanitizeFacilityImages);
}

/** Older saves stored hand-written zones ({ name, items }) instead of per-zone settings; keep showing them as-is. */
export const isLegacyZoneList = (entries = []) =>
  entries.some(entry => entry && !entry.key && Array.isArray(entry.items) && entry.items.length);

export function getLandingPresentation(content, catalog) {
  // Published CMS entries have their own IDs and relationships. Replacing them
  // with operational IDs drops saved images, details and whole disciplines.
  // Linked sport cards (sportId) already carry the sports-table description from the API.
  const sports = content.coursesSection?.sportsList || [];
  const facilities = (content.facilitiesSection?.facilitiesList || []).map(sanitizeFacilityImages);
  const facilitiesList = (facilities.length || content.facilitiesSection?.catalogSource === 'custom' ? facilities : catalogFacilities(catalog)).map(sanitizeFacilityImages);
  // Zones are built from the DB rooms (see zoneRoomSource); zonesLayout.zones holds the
  // manager's per-zone display settings. Older hand-written zone lists are still shown unchanged.
  const zoneEntries = content.zonesLayout?.zones || [];
  const legacyZones = isLegacyZoneList(zoneEntries);
  const zones = legacyZones ? zoneEntries : buildZoneMap(zoneRoomSource(content, catalog), zoneEntries);
  const zonedCount = zones.reduce((total, zone) => total + (zone.rooms?.length ?? zone.items?.length ?? 0), 0);
  const zonesDescription = content.zonesLayout?.description
    || (!legacyZones && zones.length
      ? `${zonedCount} phòng/sân tập được bố trí tại ${zones.length} khu vực trong trung tâm.`
      : '');
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
      facilitiesList
    },
    ...(content.zonesLayout ? {
      zonesLayout: {
        ...content.zonesLayout,
        description: zonesDescription,
        zones
      }
    } : {})
  };
}
