/**
 * Campus map model: the single place that turns the /api/campus-map payload into what the
 * 3D scene, the 2D plan, the zone navigation and the detail panel render. Pure functions only.
 */

export const LIGHTING_MODES = ['day', 'sunset', 'night'];

/** Simulated clock per lighting mode; 20:30 shows evening LED ambiance while keeping every zone open cleanly. */
export const LIGHTING_TIME = { day: '10:00', sunset: '18:30', night: '20:30' };

export const STRINGS = {
  vi: {
    title: 'Sơ đồ các khu vực tập luyện',
    badge: 'Mặt bằng khuôn viên',
    summary: (n, area) => `${n} khu chức năng • ${area} m²`,
    view3d: 'Mô hình 3D', view2d: 'Mặt bằng 2D',
    overview: 'Toàn cảnh', overviewHint: 'Đưa camera về toàn cảnh',
    lighting: 'Ánh sáng', day: 'Ban ngày', sunset: 'Hoàng hôn', night: 'Đèn LED đêm',
    zones: 'Các khu', legend: 'Chú thích', collapse: 'Thu gọn', expand: 'Mở rộng',
    area: 'Diện tích', floors: 'Số tầng', floor: 'Tầng', outdoor: 'Ngoài trời', hours: 'Giờ mở cửa', allDay: 'Cả ngày',
    rooms: 'Sân & phòng', amenities: 'Tiện ích', status: 'Trạng thái', capacity: 'Sức chứa', people: 'người',
    book: 'Đặt sân', directions: 'Chỉ đường tới đây', close: 'Đóng',
    wayfinding: 'Chỉ đường', from: 'Từ', to: 'Đến', chooseDestination: 'Chọn điểm đến', clearRoute: 'Xóa đường đi',
    routeResult: (m, min) => `${m} m • khoảng ${min} phút đi bộ`, noRoute: 'Không tìm được đường đi.',
    loading: 'Đang tải sơ đồ khuôn viên…', loading3d: 'Đang dựng mô hình 3D…',
    error: 'Không tải được sơ đồ khuôn viên.', retry: 'Thử lại',
    noWebgl: 'Thiết bị không hỗ trợ WebGL, đang hiển thị mặt bằng 2D.',
    webglLost: 'Mô hình 3D bị gián đoạn, đã chuyển sang mặt bằng 2D.',
    total: 'Tổng khuôn viên', north: 'Bắc', scale: 'Tỷ lệ', updated: 'Cập nhật',
    simulated: (t) => `Mô phỏng lúc ${t}`, controlsHint: 'Kéo để xoay • Cuộn để thu phóng • Bấm vào khu để xem chi tiết',
    mapLabel: 'Sơ đồ khuôn viên, bấm vào khu để xem chi tiết', zoneNav: 'Điều hướng các khu', selectFloor: 'Chọn tầng',
    allFloors: 'Tất cả', openPanel: 'Mở danh sách khu', bookHint: 'Mở trang ghi danh với sân/phòng này'
  },
  en: {
    title: 'Training Areas Map',
    badge: 'Campus site plan',
    summary: (n, area) => `${n} functional zones • ${area} m²`,
    view3d: '3D model', view2d: '2D plan',
    overview: 'Overview', overviewHint: 'Reset camera to the full site',
    lighting: 'Lighting', day: 'Daylight', sunset: 'Sunset', night: 'LED night',
    zones: 'Zones', legend: 'Legend', collapse: 'Collapse', expand: 'Expand',
    area: 'Area', floors: 'Floors', floor: 'Floor', outdoor: 'Outdoor', hours: 'Opening hours', allDay: 'All day',
    rooms: 'Courts & rooms', amenities: 'Amenities', status: 'Status', capacity: 'Capacity', people: 'people',
    book: 'Book', directions: 'Directions here', close: 'Close',
    wayfinding: 'Directions', from: 'From', to: 'To', chooseDestination: 'Choose a destination', clearRoute: 'Clear route',
    routeResult: (m, min) => `${m} m • about ${min} min walk`, noRoute: 'No route found.',
    loading: 'Loading campus map…', loading3d: 'Building the 3D model…',
    error: 'Could not load the campus map.', retry: 'Retry',
    noWebgl: 'WebGL is not available on this device, showing the 2D plan.',
    webglLost: 'The 3D view was interrupted, switched to the 2D plan.',
    total: 'Total site', north: 'N', scale: 'Scale', updated: 'Updated',
    simulated: (t) => `Simulated at ${t}`, controlsHint: 'Drag to orbit • Scroll to zoom • Click a zone for details',
    mapLabel: 'Campus map, click a zone for details', zoneNav: 'Zone navigation', selectFloor: 'Select floor',
    allFloors: 'All', openPanel: 'Open zone list', bookHint: 'Open class enrollment for this venue'
  }
};

export const STATUS_META = {
  Open: { vi: 'Đang mở', en: 'Open', tone: 'success' },
  Full: { vi: 'Đã kín chỗ', en: 'Full', tone: 'warning' },
  Maintenance: { vi: 'Bảo trì', en: 'Maintenance', tone: 'danger' },
  Closed: { vi: 'Đã đóng cửa', en: 'Closed', tone: 'danger' },
  Available: { vi: 'Còn trống', en: 'Available', tone: 'success' },
  InUse: { vi: 'Đang có lớp', en: 'In use', tone: 'warning' },
  Inactive: { vi: 'Ngừng hoạt động', en: 'Inactive', tone: 'muted' }
};

export const ROOM_KIND_LABELS = {
  pool25: { vi: 'Bể bơi 25 m', en: '25 m pool' },
  basketball: { vi: 'Sân bóng rổ', en: 'Basketball court' },
  badminton: { vi: 'Sân cầu lông', en: 'Badminton court' },
  pickleball: { vi: 'Sân pickleball', en: 'Pickleball court' },
  football5: { vi: 'Sân bóng đá 5 người', en: '5-a-side pitch' },
  football7: { vi: 'Sân bóng đá 7 người', en: '7-a-side pitch' },
  table_tennis: { vi: 'Bóng bàn', en: 'Table tennis' },
  gym: { vi: 'Phòng gym', en: 'Gym' },
  combat: { vi: 'Võ đài', en: 'Combat ring' },
  studio: { vi: 'Phòng studio', en: 'Studio' },
  golf_sim: { vi: 'Golf mô phỏng', en: 'Golf simulator' }
};

/** Amenity codes → Material Symbols icon + labels. */
export const AMENITIES = {
  locker: { icon: 'lock', vi: 'Tủ đồ có khóa', en: 'Lockers' },
  shower: { icon: 'shower', vi: 'Tắm nóng lạnh', en: 'Hot showers' },
  wc: { icon: 'wc', vi: 'WC nam/nữ', en: 'Restrooms' },
  wc_accessible: { icon: 'accessible', vi: 'WC người khuyết tật', en: 'Accessible WC' },
  first_aid: { icon: 'medical_services', vi: 'Sơ cứu / y tế', en: 'First aid' },
  extinguisher: { icon: 'fire_extinguisher', vi: 'Bình chữa cháy', en: 'Fire extinguishers' },
  water: { icon: 'water_drop', vi: 'Nước uống', en: 'Drinking water' },
  reception: { icon: 'concierge', vi: 'Lễ tân', en: 'Reception' },
  cafe: { icon: 'local_cafe', vi: 'Căn-tin', en: 'Café' },
  wifi: { icon: 'wifi', vi: 'Wi-Fi', en: 'Wi-Fi' },
  floodlight: { icon: 'highlight', vi: 'Đèn pha LED', en: 'LED floodlights' },
  stand: { icon: 'stadium', vi: 'Khán đài', en: 'Spectator stand' },
  parking: { icon: 'local_parking', vi: 'Ô tô', en: 'Car parking' },
  moto: { icon: 'two_wheeler', vi: 'Xe máy', en: 'Motorbikes' },
  ev: { icon: 'ev_station', vi: 'Sạc xe điện', en: 'EV charging' },
  accessible_parking: { icon: 'accessible_forward', vi: 'Ô đỗ người khuyết tật', en: 'Accessible bays' },
  security: { icon: 'shield_person', vi: 'Bảo vệ 24/7', en: '24/7 security' },
  shade: { icon: 'roofing', vi: 'Lối đi có mái che', en: 'Covered walkway' },
  sign: { icon: 'signpost', vi: 'Biển chỉ dẫn', en: 'Wayfinding signs' }
};

/** Map feature legend (2D symbols + 3D objects). */
export const FEATURE_LEGEND = [
  { type: 'gate', icon: 'door_front', color: '#E5D9B6', vi: 'Cổng', en: 'Gate' },
  { type: 'exit', icon: 'emergency_share', color: '#22C55E', vi: 'Lối thoát hiểm', en: 'Emergency exit' },
  { type: 'hydrant', icon: 'fire_hydrant', color: '#EF4444', vi: 'Trụ cứu hỏa', en: 'Fire hydrant' },
  { type: 'extinguisher', icon: 'fire_extinguisher', color: '#F87171', vi: 'Bình chữa cháy', en: 'Extinguisher' },
  { type: 'wc', icon: 'wc', color: '#93C5FD', vi: 'WC nam/nữ/khuyết tật', en: 'WC (men/women/accessible)' },
  { type: 'medical', icon: 'medical_services', color: '#F472B6', vi: 'Trạm y tế', en: 'First-aid clinic' },
  { type: 'ramp', icon: 'accessible_forward', color: '#38BDF8', vi: 'Ramp xe lăn', en: 'Wheelchair ramp' },
  { type: 'sign', icon: 'signpost', color: '#FDE68A', vi: 'Biển chỉ dẫn', en: 'Sign' },
  { type: 'light', icon: 'highlight', color: '#FACC15', vi: 'Cột đèn sân', en: 'Floodlight' },
  { type: 'stand', icon: 'stadium', color: '#94A3B8', vi: 'Khán đài', en: 'Stand' },
  { type: 'path', icon: 'roofing', color: '#E2E8F0', vi: 'Lối đi (có mái che)', en: 'Walkway (covered)' },
  { type: 'tree_row', icon: 'park', color: '#4ADE80', vi: 'Cây xanh', en: 'Trees' }
];

export function strings(lang) {
  return STRINGS[lang === 'en' ? 'en' : 'vi'];
}

export function statusLabel(status, lang) {
  const meta = STATUS_META[status];
  return meta ? meta[lang === 'en' ? 'en' : 'vi'] : status;
}

export function formatArea(m2, lang) {
  return Math.round(m2).toLocaleString(lang === 'en' ? 'en-US' : 'vi-VN');
}

const toMinutes = (hhmm) => {
  if (!hhmm) return null;
  const [h, m] = String(hhmm).split(':').map(Number);
  return Number.isFinite(h) ? h * 60 + (m || 0) : null;
};

/**
 * Status at a simulated time (lighting modes). Mirrors CampusMapService.ZoneStatus on the backend:
 * configured Maintenance/Closed/Full win, then opening hours, then the live status.
 */
export function zoneStatusAt(zone, hhmm) {
  if (!hhmm) return zone.status;
  if (['Maintenance', 'Closed', 'Full'].includes(zone.configuredStatus)) return zone.configuredStatus;
  const open = toMinutes(zone.openTime);
  const close = toMinutes(zone.closeTime);
  const now = toMinutes(hhmm);
  if (open != null && close != null && (now < open || now >= close)) return 'Closed';
  return zone.status === 'Closed' ? 'Open' : zone.status;
}

function parseFeatures(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  }
  return [];
}

/** Localized, derived view of the API payload. Every count/area shown anywhere comes from here. */
export function buildCampus(dto, lang = 'vi') {
  const en = lang === 'en';
  const zones = (dto?.zones || []).map((z) => {
    const rooms = (z.rooms || []).map((r) => ({
      ...r,
      baseName: r.name,
      name: en ? (r.nameEn || r.name) : r.name,
      kindLabel: ROOM_KIND_LABELS[r.kind]?.[en ? 'en' : 'vi'] || '',
      zoneId: z.id
    }));
    const features = parseFeatures(z.features).map((f) => ({
      ...f, zoneId: z.id, label: en ? (f.labelEn || f.labelVi) : (f.labelVi || f.labelEn)
    }));
    return {
      ...z,
      name: en ? z.nameEn : z.nameVi,
      description: en ? (z.descriptionEn || z.descriptionVi) : (z.descriptionVi || z.descriptionEn),
      shortName: `${en ? 'Zone' : 'Khu'} ${z.code}`,
      rooms,
      features,
      floorsList: Array.from({ length: Math.max(0, z.floors || 0) }, (_, i) => i + 1),
      bookableCount: rooms.filter((r) => r.bookable).length
    };
  });
  const functional = zones.filter((z) => z.kind !== 'landscape');
  const zonesArea = zones.reduce((sum, z) => sum + (z.areaM2 || z.width * z.depth), 0);
  return {
    centerId: dto?.centerId,
    centerName: dto?.centerName,
    site: { width: dto?.siteWidth || 0, depth: dto?.siteDepth || 0, area: dto?.siteAreaM2 || 0 },
    zones,
    functionalZones: functional,
    functionalCount: functional.length,
    zonesArea,
    areaMatchesSite: Math.abs(zonesArea - (dto?.siteAreaM2 || 0)) < 0.5,
    rooms: zones.flatMap((z) => z.rooms),
    features: zones.flatMap((z) => z.features),
    generatedAt: dto?.generatedAt
  };
}

/* ---------------------------- Wayfinding ---------------------------- */

const keyOf = ([x, z]) => `${Math.round(x * 100) / 100},${Math.round(z * 100) / 100}`;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function onSegment(p, a, b) {
  const len = dist(a, b);
  if (len < 1e-6) return false;
  const cross = Math.abs((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) / len;
  if (cross > 0.05) return false;
  const t = ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / (len * len);
  return t > 1e-4 && t < 1 - 1e-4;
}

/** Walk network from every `path` feature. Vertices lying on another segment split it, so T-junctions connect. */
export function buildWalkGraph(features) {
  const segments = [];
  const nodes = new Map();
  for (const f of features) {
    if (f.type !== 'path' || !Array.isArray(f.points)) continue;
    for (let i = 0; i < f.points.length; i += 1) nodes.set(keyOf(f.points[i]), f.points[i]);
    for (let i = 1; i < f.points.length; i += 1) segments.push({ a: f.points[i - 1], b: f.points[i], canopy: !!f.canopy });
  }
  const points = [...nodes.values()];
  const adjacency = new Map(points.map((p) => [keyOf(p), []]));
  const link = (p, q) => {
    const d = dist(p, q);
    if (d < 1e-6) return;
    adjacency.get(keyOf(p)).push({ to: keyOf(q), d });
    adjacency.get(keyOf(q)).push({ to: keyOf(p), d });
  };
  for (const { a, b } of segments) {
    const inner = points.filter((p) => onSegment(p, a, b)).sort((p, q) => dist(a, p) - dist(a, q));
    const chain = [a, ...inner, b];
    for (let i = 1; i < chain.length; i += 1) link(chain[i - 1], chain[i]);
  }
  return { nodes, adjacency, segments };
}

function nearestNode(graph, point) {
  let best = null;
  let bestD = Infinity;
  for (const [key, p] of graph.nodes) {
    if (!graph.adjacency.get(key)?.length) continue;
    const d = dist(p, point);
    if (d < bestD) { bestD = d; best = key; }
  }
  return best;
}

/** Dijkstra over the walk network. Returns { points: [[x,z]...], meters, minutes } or null. */
export function findRoute(graph, from, to) {
  if (!graph || !from || !to) return null;
  const start = nearestNode(graph, from);
  const goal = nearestNode(graph, to);
  if (!start || !goal) return null;
  const distance = new Map([[start, 0]]);
  const previous = new Map();
  const queue = new Set(graph.adjacency.keys());
  while (queue.size) {
    let current = null;
    let currentD = Infinity;
    for (const k of queue) {
      const d = distance.get(k) ?? Infinity;
      if (d < currentD) { currentD = d; current = k; }
    }
    if (current == null || currentD === Infinity) break;
    queue.delete(current);
    if (current === goal) break;
    for (const { to: next, d } of graph.adjacency.get(current)) {
      const alt = currentD + d;
      if (alt < (distance.get(next) ?? Infinity)) { distance.set(next, alt); previous.set(next, current); }
    }
  }
  if (!distance.has(goal)) return null;
  const keys = [goal];
  while (keys[0] !== start) keys.unshift(previous.get(keys[0]));
  const points = [from, ...keys.map((k) => graph.nodes.get(k)), to]
    .filter((p, i, arr) => i === 0 || dist(p, arr[i - 1]) > 0.01);
  const meters = points.slice(1).reduce((sum, p, i) => sum + dist(points[i], p), 0);
  return { points, meters: Math.round(meters), minutes: Math.max(1, Math.round(meters / 1.3 / 60)) };
}

/** Route origins (gates, parking) and destinations (rooms, zones, services), all from data. */
export function wayfindingPlaces(campus, lang = 'vi') {
  const en = lang === 'en';
  const origins = [];
  const destinations = [];
  for (const zone of campus.zones) {
    for (const f of zone.features) {
      if (f.type === 'gate') {
        origins.push({ id: `gate-${zone.id}-${f.x}`, label: f.variant === 'main' ? (en ? 'Main gate' : 'Cổng chính') : (en ? 'Vehicle gate' : 'Cổng xe'), point: [f.x, f.z] });
      }
      if (f.type === 'parking_car' || f.type === 'parking_moto') {
        origins.push({ id: `${f.type}-${zone.id}`, label: f.type === 'parking_car' ? (en ? 'Car park' : 'Bãi ô tô') : (en ? 'Motorbike park' : 'Bãi xe máy'), point: [f.x, f.z] });
      }
      if (f.type === 'space' && f.label) {
        destinations.push({ id: `space-${zone.id}-${f.x}-${f.z}`, label: `${f.label} (${zone.shortName})`, point: [f.x, f.z], zoneId: zone.id });
      }
    }
    if (zone.kind !== 'landscape' && zone.kind !== 'parking') {
      for (const room of zone.rooms) {
        destinations.push({ id: `room-${room.id}`, label: `${room.name} (${zone.shortName})`, point: [room.x, room.z], zoneId: zone.id, roomId: room.id });
      }
    }
  }
  return { origins, destinations };
}
