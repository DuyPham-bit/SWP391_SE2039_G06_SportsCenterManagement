import { apiRequest } from '../../../shared/api/http.js';

/** Fired after a zone is saved so every mounted map (2D, 3D, panels) refetches the single source. */
export const CAMPUS_MAP_CHANGE_EVENT = 'scms:campus-map-changed';

/** GET /api/campus-map – public. Returns { centerId, centerName, siteWidth, siteDepth, siteAreaM2, zonesAreaM2, zones[] }. */
export function fetchCampusMap({ centerId, signal } = {}) {
  const query = centerId ? `?centerId=${encodeURIComponent(centerId)}` : '';
  return apiRequest(`campus-map${query}`, { signal });
}

/**
 * PUT /api/campus-map/zones/{id} – ADMIN/MANAGER.
 * body: { nameVi, nameEn, descriptionVi, descriptionEn, colorHex, openTime, closeTime, status, imageUrl, amenities[] }
 * status: Open | Maintenance | Full | Closed. Times "HH:mm" (both or neither).
 */
export async function updateCampusZone(zoneId, body) {
  const zone = await apiRequest(`campus-map/zones/${encodeURIComponent(zoneId)}`, { method: 'PUT', body });
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(CAMPUS_MAP_CHANGE_EVENT, { detail: zone }));
  return zone;
}

export const CAMPUS_ZONE_STATUSES = ['Open', 'Maintenance', 'Full', 'Closed'];
