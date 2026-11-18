const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');
const { buildSync } = require('esbuild');

const out = buildSync({
  entryPoints: [path.join(__dirname, '..', 'src', 'features', 'campus-map', 'ui', 'CompassNav.jsx')],
  bundle: true,
  external: ['react'],
  format: 'cjs',
  platform: 'node',
  write: false
});
const mod = { exports: {} };
new Function('module', 'exports', 'require', out.outputFiles[0].text)(mod, mod.exports, () => ({
  __esModule: true,
  default: {},
  useEffect: () => {},
  useMemo: (f) => f(),
  useRef: (v) => ({ current: v })
}));
const { normalizeDeg, shortestAngleDelta, computeHeadingDeg, headingToCardinal } = mod.exports;

test('compass heading maps Three.js OrbitControls azimuth accurately across 0/90/180/270 deg', () => {
  // North (-Z): azimuth = 0 -> 0° N
  assert.equal(Math.round(computeHeadingDeg(0)), 0);
  assert.equal(headingToCardinal(computeHeadingDeg(0)), 'N');
  // East (+X): azimuth = -PI/2 -> 90° E
  assert.equal(Math.round(computeHeadingDeg(-Math.PI / 2)), 90);
  assert.equal(headingToCardinal(computeHeadingDeg(-Math.PI / 2)), 'E');
  // South (+Z): azimuth = PI -> 180° S
  assert.equal(Math.round(computeHeadingDeg(Math.PI)), 180);
  assert.equal(headingToCardinal(computeHeadingDeg(Math.PI)), 'S');
  // West (-X): azimuth = +PI/2 -> 270° W
  assert.equal(Math.round(computeHeadingDeg(Math.PI / 2)), 270);
  assert.equal(headingToCardinal(computeHeadingDeg(Math.PI / 2)), 'W');
});

test('shortestAngleDelta wraps cleanly across 359 <-> 0 without spinning backwards', () => {
  assert.equal(shortestAngleDelta(359, 0), 1);
  assert.equal(shortestAngleDelta(0, 359), -1);
  assert.equal(normalizeDeg(-1), 359);
  assert.equal(normalizeDeg(365), 5);
});
