/**
 * Court/room drawing primitives in meters, local to the room center (x → width, y → depth).
 * Shared by the SVG plan and the 3D canvas textures so both views show identical, to-scale markings.
 * Primitive shapes: { t:'rect', x, y, w, h, fill?, stroke? } | { t:'line', x1, y1, x2, y2 } |
 * { t:'circle', cx, cy, r, fill? } | { t:'poly', points:[[x,y],...] }
 */

export const SURFACES = {
  pool25: '#2B8FC9',
  basketball: '#C98A4B',
  badminton: '#2F7D5B',
  pickleball: '#2E6DA4',
  football5: '#3E8E41',
  football7: '#3E8E41',
  table_tennis: '#6B5B95',
  gym: '#4A4E5C',
  combat: '#5B3A44',
  studio: '#B79E7E',
  golf_sim: '#3C6E47'
};

const LINE = '#F8FAFC';

/** Runs `fn` in a frame where the long axis is horizontal (x), then rotates results back if needed. */
function oriented(w, d, fn) {
  const horizontal = w >= d;
  const L = horizontal ? w : d;
  const S = horizontal ? d : w;
  const shapes = fn(L, S);
  if (horizontal) return shapes;
  // rotate 90°: (x, y) -> (y, x) keeps the drawing symmetric for these courts
  return shapes.map(s => {
    switch (s.t) {
      case 'rect': return { ...s, x: s.y, y: s.x, w: s.h, h: s.w };
      case 'line': return { ...s, x1: s.y1, y1: s.x1, x2: s.y2, y2: s.x2 };
      case 'circle': return { ...s, cx: s.cy, cy: s.cx };
      case 'poly': return { ...s, points: s.points.map(([x, y]) => [y, x]) };
      default: return s;
    }
  });
}

const rect = (x, y, w, h, extra = {}) => ({ t: 'rect', x, y, w, h, ...extra });
const line = (x1, y1, x2, y2) => ({ t: 'line', x1, y1, x2, y2 });
const circle = (cx, cy, r, extra = {}) => ({ t: 'circle', cx, cy, r, ...extra });

function arc(cx, cy, r, from, to, steps = 18) {
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const a = from + ((to - from) * i) / steps;
    points.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return { t: 'poly', points };
}

function basketball(L, S) {
  const hx = L / 2;
  const hy = S / 2;
  const out = [rect(-hx, -hy, L, S), line(0, -hy, 0, hy), circle(0, 0, 1.8)];
  for (const side of [-1, 1]) {
    const basket = side * (hx - 1.575);
    out.push(rect(side < 0 ? -hx : hx - 5.8, -2.45, 5.8, 4.9));
    out.push(circle(side * (hx - 5.8), 0, 1.8));
    out.push(circle(basket, 0, 0.23, { stroke: '#F97316' }));
    // 3-point line: straight 0.9 m from sidelines, then 6.75 m arc around the basket
    const yEdge = hy - 0.9;
    const dx = Math.sqrt(Math.max(0, 6.75 ** 2 - yEdge ** 2));
    out.push(line(side * hx, -yEdge, basket - side * dx, -yEdge));
    out.push(line(side * hx, yEdge, basket - side * dx, yEdge));
    const start = Math.atan2(-yEdge, -side * dx);
    const end = Math.atan2(yEdge, -side * dx);
    out.push(side < 0 ? arc(basket, 0, 6.75, start, end) : arc(basket, 0, 6.75, start, end - 2 * Math.PI));
  }
  return out;
}

function badminton(L, S) {
  const hx = L / 2;
  const hy = S / 2;
  return [
    rect(-hx, -hy, L, S),
    line(0, -hy - 0.3, 0, hy + 0.3), // net
    line(-1.98, -hy, -1.98, hy), line(1.98, -hy, 1.98, hy), // short service
    line(-hx + 0.76, -hy, -hx + 0.76, hy), line(hx - 0.76, -hy, hx - 0.76, hy), // long service (doubles)
    line(-hx, -hy + 0.46, hx, -hy + 0.46), line(-hx, hy - 0.46, hx, hy - 0.46), // singles sidelines
    line(-hx, 0, -1.98, 0), line(1.98, 0, hx, 0) // centre line
  ];
}

function pickleball(L, S) {
  const hx = L / 2;
  const hy = S / 2;
  return [
    rect(-hx, -hy, L, S),
    rect(-2.13, -hy, 4.26, S, { fill: 'rgba(255,255,255,0.12)' }), // non-volley zone ("kitchen")
    line(0, -hy - 0.3, 0, hy + 0.3),
    line(-2.13, -hy, -2.13, hy), line(2.13, -hy, 2.13, hy),
    line(-hx, 0, -2.13, 0), line(2.13, 0, hx, 0)
  ];
}

function football(L, S, size) {
  const hx = L / 2;
  const hy = S / 2;
  const boxDepth = size === 7 ? 8 : 6;
  const boxWidth = size === 7 ? 16 : 12;
  const goal = size === 7 ? 5 : 3;
  const out = [rect(-hx, -hy, L, S), line(0, -hy, 0, hy), circle(0, 0, size === 7 ? 6 : 3), circle(0, 0, 0.15, { fill: LINE })];
  for (const side of [-1, 1]) {
    out.push(rect(side < 0 ? -hx : hx - boxDepth, -boxWidth / 2, boxDepth, boxWidth));
    out.push(circle(side * (hx - (size === 7 ? 6 : 5)), 0, 0.15, { fill: LINE }));
    out.push(rect(side < 0 ? -hx - 1 : hx, -goal / 2, 1, goal, { fill: 'rgba(255,255,255,0.5)' }));
  }
  return out;
}

function pool(L, S) {
  const hx = L / 2;
  const hy = S / 2;
  const lanes = 6;
  const laneWidth = S / lanes;
  const out = [rect(-hx, -hy, L, S)];
  for (let i = 1; i < lanes; i += 1) out.push(line(-hx + 0.5, -hy + i * laneWidth, hx - 0.5, -hy + i * laneWidth));
  for (let i = 0; i < lanes; i += 1) {
    const y = -hy + (i + 0.5) * laneWidth;
    out.push({ t: 'line', x1: -hx + 2, y1: y, x2: hx - 2, y2: y, stroke: '#0B3B5C' });
  }
  return out;
}

function grid(L, S, cellW, cellH, item) {
  const cols = Math.max(1, Math.floor(L / cellW));
  const rows = Math.max(1, Math.floor(S / cellH));
  const out = [rect(-L / 2, -S / 2, L, S)];
  for (let c = 0; c < cols; c += 1) {
    for (let r = 0; r < rows; r += 1) {
      const cx = -L / 2 + (L / cols) * (c + 0.5);
      const cy = -S / 2 + (S / rows) * (r + 0.5);
      out.push(...item(cx, cy));
    }
  }
  return out;
}

export function courtMarkings(kind, width, depth) {
  if (!width || !depth) return [];
  switch (kind) {
    case 'basketball': return oriented(width, depth, basketball);
    case 'badminton': return oriented(width, depth, badminton);
    case 'pickleball': return oriented(width, depth, pickleball);
    case 'football5': return oriented(width, depth, (L, S) => football(L, S, 5));
    case 'football7': return oriented(width, depth, (L, S) => football(L, S, 7));
    case 'pool25': return oriented(width, depth, pool);
    case 'table_tennis':
      return oriented(width, depth, (L, S) => grid(L, S, 8, 10, (x, y) => [
        rect(x - 1.37, y - 0.7625, 2.74, 1.525, { fill: '#1E3A8A' }), line(x, y - 0.9, x, y + 0.9)]));
    case 'combat':
      return oriented(width, depth, (L, S) => [rect(-L / 2, -S / 2, L, S), rect(-L / 2 + 2, -3, 6, 6, { fill: '#1D4ED8' }),
        ...[0, 1, 2, 3].map(i => circle(2 + (i % 2) * 3.5, -3 + Math.floor(i / 2) * 6, 0.4, { fill: '#111827' }))]);
    case 'studio':
      return oriented(width, depth, (L, S) => grid(L, S, 3, 3.2, (x, y) => [rect(x - 0.9, y - 0.3, 1.8, 0.6, { fill: '#7C3AED' })]));
    case 'golf_sim':
      return oriented(width, depth, (L, S) => grid(L, S, 7, S, (x) => [rect(x - 3, -S / 2 + 0.5, 6, 0.3, { fill: '#E5E7EB' }),
        circle(x, S / 2 - 3, 0.6, { fill: '#E5E7EB' })]));
    case 'gym':
      return oriented(width, depth, (L, S) => grid(L, S, 4, 4, (x, y) => [rect(x - 0.9, y - 0.45, 1.8, 0.9, { fill: '#9CA3AF' })]));
    default:
      return [rect(-width / 2, -depth / 2, width, depth)];
  }
}

export const MARKING_COLOR = LINE;
