import { apiRequest } from './http.js';

export async function getPublicCatalog({ signal } = {}) {
  const centerId = Number(import.meta.env.VITE_SPORTS_CENTER_ID);
  if (!Number.isSafeInteger(centerId) || centerId <= 0) {
    throw new Error('Chưa cấu hình VITE_SPORTS_CENTER_ID cho trung tâm đang sử dụng.');
  }
  const result = await apiRequest(`public/centers/${centerId}/catalog`, { signal, token: null });
  if (!result?.center || !Array.isArray(result.sports) || !Array.isArray(result.rooms) || !Array.isArray(result.classes)) {
    throw new Error('Dữ liệu danh mục trung tâm trả về không hợp lệ.');
  }
  return result;
}

export function catalogFacilities(catalog, editorial = []) {
  if (!catalog) return [];
  const hours = catalog.center.openingTime && catalog.center.closingTime
    ? `${catalog.center.openingTime.slice(0, 5)} - ${catalog.center.closingTime.slice(0, 5)}` : '';
  return catalog.rooms.map(room => {
    const media = editorial.find(item => String(item.id) === String(room.id));
    return {
      id: String(room.id), name: room.name, category: room.roomType || '', categoryName: room.roomType || 'Phòng / sân',
      location: room.locationDescription || '', zone: room.locationDescription || '',
      capacity: `${room.capacity} người`, openHours: hours, priceRate: '',
      badge: room.roomType || '', image: media?.image || '', secondaryImage: media?.secondaryImage || '',
      highlights: '', description: '', amenities: [], tags: [],
      specs: [{ label: 'Sức chứa', value: `${room.capacity} người` }, { label: 'Vị trí', value: room.locationDescription || 'Chưa cập nhật' }],
      isVisible: media?.isVisible !== false
    };
  });
}

export function catalogSports(catalog, editorial = []) {
  if (!catalog) return [];
  return catalog.sports.map(sport => {
    const media = editorial.find(item => String(item.id) === String(sport.id));
    const classes = catalog.classes.filter(item => item.sportId === sport.id);
    const room = catalog.rooms.find(item => item.id === classes[0]?.roomId);
    return {
      id: String(sport.id), name: sport.name, icon: 'sports', category: 'Thể thao',
      facilityId: room ? String(room.id) : null, venue: room?.name || '', location: room?.locationDescription || '',
      highlight: sport.description || '', level: [...new Set(classes.map(item => item.level).filter(Boolean))].join(' • '),
      coach: '', schedule: '', price: '', capacity: room ? `${room.capacity} người` : '', badges: [],
      image: media?.image || '', isVisible: media?.isVisible !== false
    };
  });
}
