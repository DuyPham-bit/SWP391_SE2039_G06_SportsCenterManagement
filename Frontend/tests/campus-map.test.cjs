const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { test } = require('node:test');
const { buildSync } = require('esbuild');

function load(entry) {
  const out = buildSync({ entryPoints: [path.join(__dirname, '..', entry)], bundle: true, format: 'cjs', platform: 'node', write: false });
  const module = { exports: {} };
  new Function('module', 'exports', 'require', out.outputFiles[0].text)(module, module.exports, require);
  return module.exports;
}

const model = load('src/features/campus-map/model/campusModel.js');
const { courtMarkings } = load('src/features/campus-map/model/courtMarkings.js');

// Shape of GET /api/campus-map (subset of the seeded layout).
const dto = {
  centerId: 15, centerName: 'SCMS', siteWidth: 100, siteDepth: 50, siteAreaM2: 5000, zonesAreaM2: 5000,
  zones: [
    { id: 1, code: 'A', kind: 'building', nameVi: 'Khu A – Bơi', nameEn: 'Zone A – Pool', color: '#0EA5E9', x: -25, z: 0, width: 50, depth: 50,
      areaM2: 2500, buildingWidth: 40, buildingDepth: 30, floors: 2, openTime: '05:30', closeTime: '21:30', configuredStatus: 'Open', status: 'Open',
      amenities: ['locker'], features: [], rooms: [
        { id: 11, name: 'Bể bơi 25m (6 làn)', nameEn: '25 m Pool', kind: 'pool25', floor: 1, x: -25, z: 0, width: 25, depth: 12.5, rotation: 0, capacity: 30, bookable: true, status: 'Available' }
      ] },
    { id: 2, code: 'G', kind: 'landscape', nameVi: 'Trục cảnh quan', nameEn: 'Green spine', color: '#84CC16', x: 25, z: 0, width: 50, depth: 50,
      areaM2: 2500, buildingWidth: 0, buildingDepth: 0, floors: 0, openTime: null, closeTime: null, configuredStatus: 'Open', status: 'Open',
      amenities: [], rooms: [], features: [
        { type: 'gate', x: 25, z: 25, w: 10, variant: 'main' },
        { type: 'path', canopy: true, points: [[25, 25], [25, -20]] },
        { type: 'path', canopy: false, points: [[25, 0], [-4, 0]] }, // T-junction in the middle of the first path
        { type: 'space', variant: 'wc', x: 30, z: 10, w: 4, d: 4, floor: 0, labelVi: 'WC', labelEn: 'Restroom' }
      ] }
  ]
};

test('buildCampus derives counts and areas from data, localized', () => {
  const vi = model.buildCampus(dto, 'vi');
  assert.equal(vi.functionalCount, 1); // landscape is not counted as a functional zone
  assert.equal(vi.zonesArea, 5000);
  assert.equal(vi.areaMatchesSite, true);
  assert.equal(vi.zones[0].name, 'Khu A – Bơi');
  assert.equal(vi.zones[0].shortName, 'Khu A');
  assert.deepEqual(vi.zones[0].floorsList, [1, 2]);

  const en = model.buildCampus(dto, 'en');
  assert.equal(en.zones[0].name, 'Zone A – Pool');
  assert.equal(en.rooms[0].name, '25 m Pool');
  assert.equal(en.rooms[0].baseName, 'Bể bơi 25m (6 làn)', 'booking link keeps the DB name');
  assert.equal(en.features.find((f) => f.type === 'space').label, 'Restroom');

  const broken = model.buildCampus({ ...dto, siteAreaM2: 13000 }, 'vi');
  assert.equal(broken.areaMatchesSite, false);
});

test('zoneStatusAt applies opening hours and configured status', () => {
  const zone = model.buildCampus(dto, 'vi').zones[0];
  assert.equal(model.zoneStatusAt(zone, '10:00'), 'Open');
  assert.equal(model.zoneStatusAt(zone, '21:45'), 'Closed');
  assert.equal(model.zoneStatusAt({ ...zone, configuredStatus: 'Maintenance' }, '10:00'), 'Maintenance');
  const landscape = model.buildCampus(dto, 'vi').zones[1];
  assert.equal(model.zoneStatusAt(landscape, '23:00'), 'Open');
});

test('walk graph joins T-junctions and routes from the gate', () => {
  const campus = model.buildCampus(dto, 'vi');
  const graph = model.buildWalkGraph(campus.features);
  const route = model.findRoute(graph, [25, 25], [-25, 0]);
  assert.ok(route, 'route exists through the junction at (25,0)');
  assert.deepEqual(route.points, [[25, 25], [25, 0], [-4, 0], [-25, 0]]);
  assert.equal(route.meters, 25 + 29 + 21);
  assert.equal(route.minutes, 1);

  const places = model.wayfindingPlaces(campus, 'vi');
  assert.equal(places.origins[0].label, 'Cổng chính');
  assert.ok(places.destinations.some((d) => d.roomId === 11));
});

test('court markings stay inside the court and follow standard dimensions', () => {
  const inside = (shapes, w, d) => shapes.every((s) => {
    const xs = s.t === 'rect' ? [s.x, s.x + s.w] : s.t === 'line' ? [s.x1, s.x2] : s.t === 'circle' ? [s.cx - s.r, s.cx + s.r] : s.points.map((p) => p[0]);
    const ys = s.t === 'rect' ? [s.y, s.y + s.h] : s.t === 'line' ? [s.y1, s.y2] : s.t === 'circle' ? [s.cy - s.r, s.cy + s.r] : s.points.map((p) => p[1]);
    return xs.every((x) => Math.abs(x) <= w / 2 + 1.01) && ys.every((y) => Math.abs(y) <= d / 2 + 1.01);
  });
  for (const [kind, w, d] of [['basketball', 28, 15], ['badminton', 6.1, 13.4], ['pickleball', 6.1, 13.4], ['football5', 20, 40], ['football7', 28, 45], ['pool25', 25, 12.5]]) {
    const shapes = courtMarkings(kind, w, d);
    assert.ok(shapes.length > 3, kind);
    assert.ok(inside(shapes, w, d), `${kind} markings inside`);
  }
  const lanes = courtMarkings('pool25', 25, 12.5).filter((s) => s.t === 'line' && !s.stroke);
  assert.equal(lanes.length, 5, '6 lanes → 5 lane ropes');
});

test('no hard-coded zone names or areas remain in campus components', () => {
  const root = path.join(__dirname, '..', 'src');
  const files = [
    'features/campus-map/ui/CampusMapExplorer.jsx', 'features/campus-map/ui/CampusPlan2D.jsx',
    'features/campus-map/lib/campusScene.js', 'pages/landing/ui/FacilitiesSection.jsx'
  ];
  const banned = /Khu [A-F]\s*[:•–-]|Zone [A-F]\s*[:•–-]|13[.,]000|9 cụm|2[.,]200 m²|5[.,]200 m²|\(20 ô\)/i;
  for (const file of files) {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    assert.equal(banned.test(text), false, `${file} must read zone names/areas from the API`);
  }
  assert.equal(fs.existsSync(path.join(__dirname, '..', 'public', '3d-campus.html')), false, 'legacy static page removed');
});

test('seeded campus (backend fixture): 13,000 m², 6 functional zones, every destination reachable', () => {
  const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'campus-map.json'), 'utf8'));
  const campus = model.buildCampus(fixture, 'vi');
  assert.equal(campus.site.area, 13000);
  assert.equal(campus.zonesArea, 13000);
  assert.equal(campus.functionalCount, 6);
  const graph = model.buildWalkGraph(campus.features);
  const places = model.wayfindingPlaces(campus, 'vi');
  assert.ok(places.origins.length >= 3, 'gates + parking');
  for (const origin of places.origins) {
    for (const destination of places.destinations) {
      const route = model.findRoute(graph, origin.point, destination.point);
      assert.ok(route, `${origin.label} → ${destination.label}`);
      assert.ok(route.meters < 400, `${origin.label} → ${destination.label} is ${route.meters} m`);
    }
  }
  const gate = places.origins.find((o) => o.label === 'Cổng chính');
  const badminton = places.destinations.find((d) => d.label.startsWith('Sân Cầu lông Tiêu chuẩn #2'));
  const route = model.findRoute(graph, gate.point, badminton.point);
  assert.ok(route.meters > 80 && route.meters < 160, `gate → badminton ${route.meters} m`);
});
