import * as THREE from 'three';
import { courtMarkings, MARKING_COLOR, SURFACES } from '../model/courtMarkings.js';
export { createEnvironmentLibrary } from './lighting/lightingPresets.js';

/**
 * Procedural PBR material & texture library for the 3D campus map.
 * All maps (albedo, normal, roughness, AO, emissive, alpha) are deterministically synthesized
 * with mipmaps, anisotropic filtering, and full disposal support.
 */

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function hash2(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/** Converts a grayscale height canvas into a tangent-space normal map canvas. */
function heightToNormalCanvas(heightCanvas, strength = 2.2) {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const src = heightCanvas.getContext('2d').getImageData(0, 0, w, h).data;
  const outCanvas = makeCanvas(w, h);
  const ctx = outCanvas.getContext('2d');
  const out = ctx.createImageData(w, h);
  const dst = out.data;
  const sample = (x, y) => {
    const ix = ((x % w) + w) % w;
    const iy = ((y % h) + h) % h;
    return src[(iy * w + ix) * 4] / 255;
  };
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const dx = (sample(x + 1, y) - sample(x - 1, y)) * strength;
      const dy = (sample(x, y + 1) - sample(x, y - 1)) * strength;
      const inv = 1 / Math.hypot(dx, dy, 1);
      const idx = (y * w + x) * 4;
      dst[idx] = Math.round((-dx * inv * 0.5 + 0.5) * 255);
      dst[idx + 1] = Math.round((-dy * inv * 0.5 + 0.5) * 255);
      dst[idx + 2] = Math.round((inv * 0.5 + 0.5) * 255);
      dst[idx + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  return outCanvas;
}

function toTexture(canvas, maxAniso, { srgb = true, repeat = [1, 1] } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = maxAniso;
  tex.needsUpdate = true;
  return tex;
}

export function createSurfaceLibrary(maxAniso = 8) {
  const cache = new Map();
  const get = (key, fn) => {
    if (!cache.has(key)) cache.set(key, fn());
    return cache.get(key);
  };

  /** Asphalt PBR (albedo + normal + roughness with aggregate, tire wear & oil stains). */
  function asphaltMaps(repeatX = 6, repeatY = 6) {
    const base = get('asphalt-base', () => {
      const size = 256;
      const alb = makeCanvas(size, size);
      const actx = alb.getContext('2d');
      const hgt = makeCanvas(size, size);
      const hctx = hgt.getContext('2d');
      const rgh = makeCanvas(size, size);
      const rctx = rgh.getContext('2d');

      actx.fillStyle = '#2B3038';
      actx.fillRect(0, 0, size, size);
      hctx.fillStyle = '#808080';
      hctx.fillRect(0, 0, size, size);
      rctx.fillStyle = '#DCDCDC';
      rctx.fillRect(0, 0, size, size);

      for (let i = 0; i < 4200; i += 1) {
        const x = (i * 73) % size;
        const y = (i * 137) % size;
        const v = hash2(x, y);
        const shade = Math.round(35 + v * 28);
        actx.fillStyle = `rgb(${shade},${shade + 2},${shade + 5})`;
        actx.fillRect(x, y, 2, 2);
        const hv = Math.round(85 + v * 145);
        hctx.fillStyle = `rgb(${hv},${hv},${hv})`;
        hctx.fillRect(x, y, 2, 2);
      }
      // Restrained oil drips & repair seams
      for (let i = 0; i < 14; i += 1) {
        const x = (i * 53) % size;
        const y = (i * 97) % size;
        const r = 16 + (i % 5) * 9;
        const grad = actx.createRadialGradient(x, y, 2, x, y, r);
        grad.addColorStop(0, 'rgba(16,18,22,0.22)');
        grad.addColorStop(1, 'rgba(16,18,22,0)');
        actx.fillStyle = grad;
        actx.beginPath(); actx.arc(x, y, r, 0, Math.PI * 2); actx.fill();

        const rgrad = rctx.createRadialGradient(x, y, 2, x, y, r);
        rgrad.addColorStop(0, 'rgba(145,145,145,0.45)');
        rgrad.addColorStop(1, 'rgba(220,220,220,0)');
        rctx.fillStyle = rgrad;
        rctx.beginPath(); rctx.arc(x, y, r, 0, Math.PI * 2); rctx.fill();
      }
      return { alb, nrm: heightToNormalCanvas(hgt, 2.6), rgh };
    });
    return {
      map: toTexture(base.alb, maxAniso, { srgb: true, repeat: [repeatX, repeatY] }),
      normalMap: toTexture(base.nrm, maxAniso, { srgb: false, repeat: [repeatX, repeatY] }),
      roughnessMap: toTexture(base.rgh, maxAniso, { srgb: false, repeat: [repeatX, repeatY] }),
      normalScale: new THREE.Vector2(0.48, 0.48),
      roughness: 0.88,
      metalness: 0.04
    };
  }

  /** Two-tone interlocking sidewalk paver tiles with mortar grooves & subtle mossy edge wear. */
  function paverMaps(repeatX = 8, repeatY = 8, tint = '#DAD5C8') {
    const base = get(`paver-${tint}`, () => {
      const size = 256;
      const alb = makeCanvas(size, size);
      const actx = alb.getContext('2d');
      const hgt = makeCanvas(size, size);
      const hctx = hgt.getContext('2d');
      const rgh = makeCanvas(size, size);
      const rctx = rgh.getContext('2d');

      actx.fillStyle = tint;
      actx.fillRect(0, 0, size, size);
      hctx.fillStyle = '#DFDFDF';
      hctx.fillRect(0, 0, size, size);
      rctx.fillStyle = '#CBCBCB';
      rctx.fillRect(0, 0, size, size);

      const rows = 8;
      const cols = 4;
      const bh = size / rows;
      const bw = size / cols;
      for (let r = 0; r < rows; r += 1) {
        const shift = (r % 2) * (bw * 0.5);
        for (let c = -1; c <= cols; c += 1) {
          const x = c * bw + shift;
          const y = r * bh;
          const v = (hash2(c + 10, r + 20) - 0.5) * 20;
          const twoTone = (r + c) % 3 === 0 ? -0.035 : 0.0;
          const baseCol = new THREE.Color(tint).offsetHSL(0, 0, v / 255 + twoTone);
          actx.fillStyle = `#${baseCol.getHexString()}`;
          actx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
          actx.strokeStyle = 'rgba(65,62,56,0.52)';
          actx.lineWidth = 2.2;
          actx.strokeRect(x + 1, y + 1, bw - 2, bh - 2);

          hctx.strokeStyle = '#383838';
          hctx.lineWidth = 3;
          hctx.strokeRect(x + 1, y + 1, bw - 2, bh - 2);
          const rv = Math.round(175 + hash2(c, r) * 55);
          rctx.fillStyle = `rgb(${rv},${rv},${rv})`;
          rctx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
        }
      }
      return { alb, nrm: heightToNormalCanvas(hgt, 2.8), rgh };
    });
    return {
      map: toTexture(base.alb, maxAniso, { srgb: true, repeat: [repeatX, repeatY] }),
      normalMap: toTexture(base.nrm, maxAniso, { srgb: false, repeat: [repeatX, repeatY] }),
      roughnessMap: toTexture(base.rgh, maxAniso, { srgb: false, repeat: [repeatX, repeatY] }),
      normalScale: new THREE.Vector2(0.55, 0.55),
      roughness: 0.82,
      metalness: 0.03
    };
  }

  /** Natural park grass PBR (olive-emerald variation, clover & organic soil patches, non-neon). */
  function grassMaps(repeatX = 14, repeatY = 14, baseHex = '#5B7A45') {
    const base = get(`grass-${baseHex}`, () => {
      const size = 256;
      const alb = makeCanvas(size, size);
      const actx = alb.getContext('2d');
      const hgt = makeCanvas(size, size);
      const hctx = hgt.getContext('2d');
      actx.fillStyle = baseHex;
      actx.fillRect(0, 0, size, size);
      hctx.fillStyle = '#808080';
      hctx.fillRect(0, 0, size, size);

      for (let i = 0; i < 28; i += 1) {
        const x = (i * 67) % size;
        const y = (i * 109) % size;
        const r = 24 + (i % 4) * 14;
        const g = actx.createRadialGradient(x, y, 2, x, y, r);
        g.addColorStop(0, i % 3 === 0 ? 'rgba(110,92,58,0.18)' : 'rgba(38,62,28,0.2)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        actx.fillStyle = g;
        actx.beginPath(); actx.arc(x, y, r, 0, Math.PI * 2); actx.fill();
      }
      for (let i = 0; i < 4800; i += 1) {
        const x = (i * 59) % size;
        const y = (i * 101) % size;
        const v = hash2(x, y);
        actx.fillStyle = v > 0.5 ? 'rgba(148,178,108,0.18)' : 'rgba(32,52,24,0.18)';
        actx.fillRect(x, y, 2, 3);
        const hv = Math.round(68 + v * 170);
        hctx.fillStyle = `rgb(${hv},${hv},${hv})`;
        hctx.fillRect(x, y, 2, 3);
      }
      return { alb, nrm: heightToNormalCanvas(hgt, 2.2) };
    });
    return {
      map: toTexture(base.alb, maxAniso, { srgb: true, repeat: [repeatX, repeatY] }),
      normalMap: toTexture(base.nrm, maxAniso, { srgb: false, repeat: [repeatX, repeatY] }),
      normalScale: new THREE.Vector2(0.45, 0.45),
      roughness: 0.9,
      metalness: 0.01
    };
  }

  /** Monocrystalline solar cell grid with brushed aluminum frames, cell cuts & silver busbars. */
  function solarMaterial() {
    return get('solar-mat', () => {
      const size = 256;
      const alb = makeCanvas(size, size);
      const ctx = alb.getContext('2d');
      const hgt = makeCanvas(size, size);
      const hctx = hgt.getContext('2d');

      ctx.fillStyle = '#0D1F3C';
      ctx.fillRect(0, 0, size, size);
      hctx.fillStyle = '#909090';
      hctx.fillRect(0, 0, size, size);

      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, size - 10, size - 10);
      hctx.strokeStyle = '#FFFFFF';
      hctx.lineWidth = 10;
      hctx.strokeRect(5, 5, size - 10, size - 10);

      const cols = 6;
      const rows = 10;
      const cw = (size - 20) / cols;
      const ch = (size - 20) / rows;
      for (let c = 0; c < cols; c += 1) {
        for (let r = 0; r < rows; r += 1) {
          const x = 10 + c * cw;
          const y = 10 + r * ch;
          ctx.fillStyle = (c + r) % 2 === 0 ? '#112B54' : '#0E2447';
          ctx.fillRect(x + 1.5, y + 1.5, cw - 3, ch - 3);
          ctx.fillStyle = 'rgba(148,163,184,0.38)';
          ctx.fillRect(x + cw * 0.33, y + 1.5, 0.9, ch - 3);
          ctx.fillRect(x + cw * 0.66, y + 1.5, 0.9, ch - 3);
          hctx.strokeStyle = '#303030';
          hctx.lineWidth = 2;
          hctx.strokeRect(x + 1, y + 1, cw - 2, ch - 2);
        }
      }
      return new THREE.MeshStandardMaterial({
        map: toTexture(alb, maxAniso),
        normalMap: toTexture(heightToNormalCanvas(hgt, 2.2), maxAniso, { srgb: false }),
        normalScale: new THREE.Vector2(0.35, 0.35),
        roughness: 0.14,
        metalness: 0.72,
        envMapIntensity: 1.65
      });
    });
  }

  /** Precast architectural concrete cladding with 1.2x2.4 m joints, rainwater streaks & subtle grime. */
  function concreteMaterial(color = '#D8D4CC', repeat = [4, 2]) {
    const base = get(`concrete-${color}`, () => {
      const size = 256;
      const alb = makeCanvas(size, size);
      const ctx = alb.getContext('2d');
      const hgt = makeCanvas(size, size);
      const hctx = hgt.getContext('2d');
      const ao = makeCanvas(size, size);
      const actx = ao.getContext('2d');

      ctx.fillStyle = color;
      ctx.fillRect(0, 0, size, size);
      hctx.fillStyle = '#808080';
      hctx.fillRect(0, 0, size, size);
      actx.fillStyle = '#FFFFFF';
      actx.fillRect(0, 0, size, size);

      for (let i = 0; i < 2400; i += 1) {
        const x = (i * 83) % size;
        const y = (i * 149) % size;
        const v = hash2(x, y);
        ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(30,32,36,0.06)';
        ctx.fillRect(x, y, 3, 2);
        const hv = Math.round(105 + v * 50);
        hctx.fillStyle = `rgb(${hv},${hv},${hv})`;
        hctx.fillRect(x, y, 3, 2);
      }

      // Subtle vertical rainwater streaks below sill & base dirt at bottom
      for (let s = 0; s < 12; s += 1) {
        const sx = ((s * 41) % (size - 20)) + 10;
        const rg = ctx.createLinearGradient(sx, 0, sx, size * 0.45);
        rg.addColorStop(0, 'rgba(40,45,52,0.12)');
        rg.addColorStop(1, 'rgba(40,45,52,0)');
        ctx.fillStyle = rg;
        ctx.fillRect(sx, 0, 4 + (s % 3) * 2, size * 0.45);
      }
      const botGrad = actx.createLinearGradient(0, size * 0.72, 0, size);
      botGrad.addColorStop(0, 'rgba(255,255,255,0)');
      botGrad.addColorStop(1, 'rgba(170,170,170,0.42)');
      actx.fillStyle = botGrad;
      actx.fillRect(0, size * 0.72, size, size * 0.28);

      // Panel joints (1.2x2.4 m modular proportions)
      ctx.strokeStyle = 'rgba(55,54,50,0.34)';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, size - 2, size / 2 - 2);
      ctx.strokeRect(1, size / 2 + 1, size - 2, size / 2 - 2);
      ctx.beginPath(); ctx.moveTo(size / 2, 0); ctx.lineTo(size / 2, size); ctx.stroke();
      hctx.strokeStyle = '#343434';
      hctx.lineWidth = 2.5;
      hctx.strokeRect(1, 1, size - 2, size / 2 - 2);
      hctx.beginPath(); hctx.moveTo(size / 2, 0); hctx.lineTo(size / 2, size); hctx.stroke();

      return { alb, nrm: heightToNormalCanvas(hgt, 2.0), ao };
    });
    return new THREE.MeshStandardMaterial({
      map: toTexture(base.alb, maxAniso, { srgb: true, repeat }),
      normalMap: toTexture(base.nrm, maxAniso, { srgb: false, repeat }),
      aoMap: toTexture(base.ao, maxAniso, { srgb: false, repeat }),
      aoMapIntensity: 0.5,
      normalScale: new THREE.Vector2(0.32, 0.32),
      roughness: 0.78,
      metalness: 0.05
    });
  }

  /** Architectural metal cladding (calibrated charcoal-titanium so shadow side stays legible, never black). */
  function metalCladdingMaterial(tint = '#3F4A5C', repeat = [4, 2]) {
    const base = get(`metal-clad-${tint}`, () => {
      const size = 256;
      const alb = makeCanvas(size, size);
      const ctx = alb.getContext('2d');
      const hgt = makeCanvas(size, size);
      const hctx = hgt.getContext('2d');
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, size, size);
      hctx.fillStyle = '#909090';
      hctx.fillRect(0, 0, size, size);

      const cols = 4;
      const rows = 2;
      const cw = size / cols;
      const ch = size / rows;
      for (let c = 0; c < cols; c += 1) {
        for (let r = 0; r < rows; r += 1) {
          const delta = (hash2(c + 5, r + 9) - 0.5) * 0.03;
          const col = new THREE.Color(tint).offsetHSL(0, 0, delta);
          ctx.fillStyle = `#${col.getHexString()}`;
          ctx.fillRect(c * cw + 2, r * ch + 2, cw - 4, ch - 4);
          ctx.strokeStyle = 'rgba(15,23,42,0.48)';
          ctx.lineWidth = 2;
          ctx.strokeRect(c * cw + 1, r * ch + 1, cw - 2, ch - 2);
          hctx.strokeStyle = '#383838';
          hctx.lineWidth = 2.5;
          hctx.strokeRect(c * cw + 1, r * ch + 1, cw - 2, ch - 2);
        }
      }
      return { alb, nrm: heightToNormalCanvas(hgt, 2.0) };
    });
    return new THREE.MeshStandardMaterial({
      map: toTexture(base.alb, maxAniso, { srgb: true, repeat }),
      normalMap: toTexture(base.nrm, maxAniso, { srgb: false, repeat }),
      normalScale: new THREE.Vector2(0.35, 0.35),
      roughness: 0.4,
      metalness: 0.45,
      envMapIntensity: 1.25
    });
  }

  /** Architectural glazing with crisp Fresnel reflection, randomized curtains & night window illumination (60% warm 3000K + cool screen accents). */
  function createArchitecturalGlassMaterial(zoneHex, isGround = false, seed = 1) {
    const size = 256;
    const alb = makeCanvas(size, size);
    const ctx = alb.getContext('2d');
    const emi = makeCanvas(size, size);
    const ectx = emi.getContext('2d');

    ctx.fillStyle = '#9EB8CC';
    ctx.fillRect(0, 0, size, size);
    ectx.fillStyle = '#000000';
    ectx.fillRect(0, 0, size, size);

    const cols = 8;
    const rows = 4;
    const cw = size / cols;
    const ch = size / rows;
    for (let c = 0; c < cols; c += 1) {
      for (let r = 0; r < rows; r += 1) {
        const rnd = hash2(c + seed * 11, r + seed * 7);
        // Curtain / roller blind drop on ~45% of upper panes
        if (rnd > 0.55) {
          const drop = ch * (0.3 + (rnd - 0.55) * 1.1);
          ctx.fillStyle = 'rgba(226, 232, 240, 0.32)';
          ctx.fillRect(c * cw + 2, r * ch + 2, cw - 4, Math.min(ch - 4, drop));
        }
        // Frame mullion tint
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.42)';
        ctx.lineWidth = 2;
        ctx.strokeRect(c * cw, r * ch, cw, ch);

        // ~60% windows lit at night (warm 3000K majority, occasional cool blue monitor light)
        if (rnd > 0.38) {
          const isScreen = rnd > 0.91;
          ectx.fillStyle = isScreen ? '#93C5FD' : (rnd > 0.65 ? '#FFD48A' : '#FFE3AF');
          ectx.fillRect(c * cw + 3, r * ch + 3, cw - 6, ch - 6);
        }
      }
    }

    const tint = new THREE.Color(zoneHex).lerp(new THREE.Color('#B4C8D8'), 0.8);
    const map = toTexture(alb, maxAniso, { srgb: true, repeat: [2, 1] });
    const emissiveMap = toTexture(emi, maxAniso, { srgb: true, repeat: [2, 1] });

    return new THREE.MeshPhysicalMaterial({
      color: tint,
      map,
      transparent: true,
      opacity: isGround ? 0.24 : 0.34,
      roughness: 0.05,
      metalness: 0.1,
      ior: 1.52,
      reflectivity: 0.92,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.85,
      emissive: '#FFFFFF',
      emissiveMap,
      emissiveIntensity: 0,
      depthWrite: false
    });
  }

  /** Chain-link B40 steel wire mesh texture (diamond grid with real alpha cutout). */
  function b40FenceMaterial() {
    return get('b40-fence', () => {
      const size = 128;
      const alb = makeCanvas(size, size);
      const ctx = alb.getContext('2d');
      ctx.clearRect(0, 0, size, size);
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 3.2;
      const step = 16;
      ctx.beginPath();
      for (let i = -size; i <= size * 2; i += step) {
        ctx.moveTo(i, 0); ctx.lineTo(i + size, size);
        ctx.moveTo(i, size); ctx.lineTo(i + size, 0);
      }
      ctx.stroke();
      const map = toTexture(alb, maxAniso, { srgb: true, repeat: [12, 3] });
      return new THREE.MeshStandardMaterial({
        map,
        transparent: true,
        alphaTest: 0.15,
        roughness: 0.42,
        metalness: 0.72,
        side: THREE.DoubleSide
      });
    });
  }

  /** Translucent ribbed twin-wall polycarbonate roofing material (no opaque grey slab). */
  function polycarbonateMaterial(tint = '#E0F2FE') {
    return get(`polycarb-${tint}`, () => {
      const size = 128;
      const alb = makeCanvas(size, size);
      const ctx = alb.getContext('2d');
      ctx.fillStyle = tint;
      ctx.fillRect(0, 0, size, size);
      for (let x = 0; x < size; x += 8) {
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.fillRect(x, 0, 3, size);
        ctx.fillStyle = 'rgba(148,163,184,0.22)';
        ctx.fillRect(x + 4, 0, 1, size);
      }
      return new THREE.MeshPhysicalMaterial({
        map: toTexture(alb, maxAniso, { srgb: true, repeat: [6, 4] }),
        transparent: true,
        opacity: 0.58,
        roughness: 0.16,
        metalness: 0.08,
        clearcoat: 0.85,
        envMapIntensity: 1.5,
        side: THREE.DoubleSide
      });
    });
  }

  /** High-resolution court/room PBR texture with realistic grain, stripes & multi-sport markings. */
  function courtMaterial(kind, width, depth) {
    const longest = Math.max(width, depth);
    const scale = Math.min(64, Math.max(32, Math.round(1536 / longest)));
    const w = Math.max(16, Math.round(width * scale));
    const h = Math.max(16, Math.round(depth * scale));
    const canvas = makeCanvas(w, h);
    const ctx = canvas.getContext('2d');
    const hgt = makeCanvas(128, 128);
    const hctx = hgt.getContext('2d');
    hctx.fillStyle = '#808080';
    hctx.fillRect(0, 0, 128, 128);

    const isFootball = kind === 'football5' || kind === 'football7';
    const isWood = kind === 'basketball' || kind === 'studio';
    const isGym = kind === 'gym';
    const isPickle = kind === 'pickleball';
    const isBadminton = kind === 'badminton';

    if (isFootball) {
      ctx.fillStyle = '#2F6831';
      ctx.fillRect(0, 0, w, h);
      const horizontal = width >= depth;
      // Exact ~5 m alternating mowed artificial turf stripes
      const stripes = Math.max(4, Math.round(longest / 5));
      for (let i = 0; i < stripes; i += 1) {
        ctx.fillStyle = i % 2 === 0 ? '#2C622F' : '#3B783B';
        if (horizontal) ctx.fillRect((w / stripes) * i, 0, w / stripes + 1, h);
        else ctx.fillRect(0, (h / stripes) * i, w, h / stripes + 1);
      }
      // Subtle black rubber infill micro-dots + natural wear in penalty boxes & center circle
      for (let i = 0; i < 3200; i += 1) {
        const rx = (i * 79) % w;
        const ry = (i * 131) % h;
        ctx.fillStyle = 'rgba(18,20,22,0.14)';
        ctx.fillRect(rx, ry, 2, 2);
      }
      const wearSpots = horizontal
        ? [[w * 0.5, h * 0.5, w * 0.11], [w * 0.08, h * 0.5, w * 0.09], [w * 0.92, h * 0.5, w * 0.09]]
        : [[w * 0.5, h * 0.5, h * 0.11], [w * 0.5, h * 0.08, h * 0.09], [w * 0.5, h * 0.92, h * 0.09]];
      for (const [wx, wy, wr] of wearSpots) {
        const g = ctx.createRadialGradient(wx, wy, 2, wx, wy, wr);
        g.addColorStop(0, 'rgba(92,76,48,0.22)');
        g.addColorStop(1, 'rgba(92,76,48,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(wx, wy, wr, 0, Math.PI * 2); ctx.fill();
      }
      for (let i = 0; i < 1800; i += 1) {
        const x = (i * 47) % 128;
        const y = (i * 89) % 128;
        const hv = Math.round(65 + hash2(x, y) * 165);
        hctx.fillStyle = `rgb(${hv},${hv},${hv})`;
        hctx.fillRect(x, y, 2, 2);
      }
    } else if (isWood) {
      ctx.fillStyle = kind === 'studio' ? '#D2BA94' : '#C98A4B';
      ctx.fillRect(0, 0, w, h);
      const planks = 40;
      const ph = h / planks;
      for (let r = 0; r < planks; r += 1) {
        for (let c = 0; c < 8; c += 1) {
          const v = (hash2(c, r) - 0.5) * 18;
          ctx.fillStyle = v > 0 ? `rgba(255,245,225,${Math.abs(v) / 140})` : `rgba(60,35,10,${Math.abs(v) / 140})`;
          ctx.fillRect((c * w) / 8, r * ph, w / 8, ph - 0.6);
        }
      }
      if (kind === 'basketball') {
        ctx.strokeStyle = '#1E3A5F';
        ctx.lineWidth = Math.max(4, 0.35 * scale);
        ctx.strokeRect(0, 0, w, h);
        // Subtle center court circular crest
        ctx.fillStyle = 'rgba(242, 204, 143, 0.32)';
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 1.75 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let r = 0; r < 16; r += 1) {
        hctx.strokeStyle = '#606060';
        hctx.lineWidth = 1;
        hctx.beginPath(); hctx.moveTo(0, r * 8); hctx.lineTo(128, r * 8); hctx.stroke();
      }
    } else if (isPickle) {
      ctx.fillStyle = '#1E4E79';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 1400; i += 1) {
        const x = (i * 53) % 128;
        const y = (i * 97) % 128;
        const hv = Math.round(105 + hash2(x, y) * 55);
        hctx.fillStyle = `rgb(${hv},${hv},${hv})`;
        hctx.fillRect(x, y, 2, 2);
      }
    } else if (isBadminton) {
      ctx.fillStyle = '#1B6B50';
      ctx.fillRect(0, 0, w, h);
    } else if (isGym) {
      ctx.fillStyle = '#1E232B';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#255F38';
      ctx.fillRect(w * 0.04, h * 0.78, w * 0.92, h * 0.16);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = Math.max(1.5, 0.05 * scale);
      for (let m = 1; m < 10; m += 1) {
        const lx = w * (0.04 + m * 0.092);
        ctx.beginPath(); ctx.moveTo(lx, h * 0.78); ctx.lineTo(lx, h * 0.94); ctx.stroke();
      }
    } else {
      ctx.fillStyle = SURFACES[kind] || '#8A8F98';
      ctx.fillRect(0, 0, w, h);
    }

    const X = (x) => (x + width / 2) * scale;
    const Y = (y) => (y + depth / 2) * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, (isPickle ? 0.05 : 0.08) * scale);

    for (const s of courtMarkings(kind, width, depth)) {
      ctx.strokeStyle = s.stroke || MARKING_COLOR;
      ctx.beginPath();
      if (s.t === 'rect') {
        const fill = isPickle && s.fill ? 'rgba(47,133,90,0.88)' : s.fill;
        if (fill) { ctx.fillStyle = fill; ctx.fillRect(X(s.x), Y(s.y), s.w * scale, s.h * scale); }
        ctx.strokeRect(X(s.x), Y(s.y), s.w * scale, s.h * scale);
      } else if (s.t === 'line') {
        ctx.moveTo(X(s.x1), Y(s.y1)); ctx.lineTo(X(s.x2), Y(s.y2)); ctx.stroke();
      } else if (s.t === 'circle') {
        ctx.arc(X(s.cx), Y(s.cy), Math.max(1.5, s.r * scale), 0, Math.PI * 2);
        if (s.fill) { ctx.fillStyle = s.fill; ctx.fill(); } else ctx.stroke();
      } else if (s.t === 'poly') {
        s.points.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))));
        ctx.stroke();
      }
    }

    // Layered Volleyball (yellow) & Badminton (light blue) markings on Zone B basketball hall
    if (kind === 'basketball') {
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = Math.max(1.8, 0.055 * scale);
      ctx.strokeRect(X(-9), Y(-4.5), 18 * scale, 9 * scale);
      ctx.beginPath();
      ctx.moveTo(X(-3), Y(-4.5)); ctx.lineTo(X(-3), Y(4.5));
      ctx.moveTo(X(3), Y(-4.5)); ctx.lineTo(X(3), Y(4.5));
      ctx.stroke();

      ctx.strokeStyle = 'rgba(56,189,248,0.78)';
      ctx.lineWidth = Math.max(1.4, 0.04 * scale);
      ctx.strokeRect(X(-6.7), Y(-3.05), 13.4 * scale, 6.1 * scale);
      ctx.beginPath();
      ctx.moveTo(X(-1.98), Y(-3.05)); ctx.lineTo(X(-1.98), Y(3.05));
      ctx.moveTo(X(1.98), Y(-3.05)); ctx.lineTo(X(1.98), Y(3.05));
      ctx.stroke();
    }

    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = maxAniso;
    const normalMap = toTexture(heightToNormalCanvas(hgt, 1.9), maxAniso, { srgb: false, repeat: [Math.round(width / 2), Math.round(depth / 2)] });
    return new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      map,
      normalMap,
      normalScale: new THREE.Vector2(isFootball ? 0.42 : 0.2, isFootball ? 0.42 : 0.2),
      roughness: isWood ? 0.24 : isPickle || isBadminton ? 0.5 : 0.86,
      metalness: isWood ? 0.06 : 0.02,
      envMapIntensity: isWood ? 1.1 : 0.55
    });
  }

  /** Road texture (2-lane or 4-lane boulevard) with median, arrows, crosswalks, drains & repairs. */
  function roadTexture(length, width, { crosswalk = true, speedBump = true, lanes = 2 } = {}) {
    const scale = 16;
    const w = Math.max(64, Math.round(length * scale));
    const h = Math.max(32, Math.round(width * scale));
    const canvas = makeCanvas(w, h);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#2B3037';
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 5200; i += 1) {
      const x = (i * 97) % w;
      const y = (i * 53) % h;
      const s = 34 + ((i * 19) % 24);
      ctx.fillStyle = `rgb(${s},${s + 2},${s + 4})`;
      ctx.fillRect(x, y, 3, 2);
    }
    // Asphalt wear tracks
    ctx.fillStyle = 'rgba(15,18,24,0.22)';
    ctx.fillRect(0, h * 0.2, w, h * 0.14);
    ctx.fillRect(0, h * 0.66, w, h * 0.14);

    // Subtle asphalt repair patches
    ctx.fillStyle = 'rgba(22,25,30,0.45)';
    ctx.fillRect(w * 0.28, h * 0.34, 4.2 * scale, 1.8 * scale);
    ctx.fillRect(w * 0.77, h * 0.55, 3.6 * scale, 1.5 * scale);

    // Edge lines & storm drain grates
    ctx.strokeStyle = 'rgba(248,250,252,0.78)';
    ctx.lineWidth = Math.max(2, 0.15 * scale);
    ctx.beginPath();
    ctx.moveTo(0, 0.55 * scale); ctx.lineTo(w, 0.55 * scale);
    ctx.moveTo(0, h - 0.55 * scale); ctx.lineTo(w, h - 0.55 * scale);
    ctx.stroke();

    ctx.fillStyle = '#1E242C';
    for (let x = 18 * scale; x < w - 18 * scale; x += 26 * scale) {
      ctx.fillRect(x, 0.15 * scale, 0.9 * scale, 0.55 * scale);
      ctx.fillRect(x + 10 * scale, h - 0.7 * scale, 0.9 * scale, 0.55 * scale);
    }

    if (lanes === 4) {
      // Double solid yellow median
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = Math.max(2, 0.13 * scale);
      ctx.beginPath();
      ctx.moveTo(0, h / 2 - 0.16 * scale); ctx.lineTo(w, h / 2 - 0.16 * scale);
      ctx.moveTo(0, h / 2 + 0.16 * scale); ctx.lineTo(w, h / 2 + 0.16 * scale);
      ctx.stroke();
      // Dashed lane dividers for 2 lanes each direction
      ctx.strokeStyle = 'rgba(248,250,252,0.72)';
      ctx.setLineDash([2.8 * scale, 2.6 * scale]);
      ctx.beginPath();
      ctx.moveTo(0, h * 0.25); ctx.lineTo(w, h * 0.25);
      ctx.moveTo(0, h * 0.75); ctx.lineTo(w, h * 0.75);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = Math.max(2, 0.16 * scale);
      ctx.setLineDash([2.8 * scale, 2.2 * scale]);
      ctx.beginPath();
      ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Directional pavement arrows
    ctx.fillStyle = 'rgba(248,250,252,0.72)';
    for (const ax of [w * 0.34, w * 0.58]) {
      ctx.beginPath();
      ctx.moveTo(ax, h * 0.72);
      ctx.lineTo(ax + 1.8 * scale, h * 0.75);
      ctx.lineTo(ax, h * 0.78);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(ax + 1.8 * scale, h * 0.22);
      ctx.lineTo(ax, h * 0.25);
      ctx.lineTo(ax + 1.8 * scale, h * 0.28);
      ctx.fill();
    }

    if (crosswalk) {
      for (const cx of [w * 0.45, w * 0.65]) {
        ctx.fillStyle = 'rgba(248,250,252,0.88)';
        for (let y = 1.0 * scale; y < h - 1.2 * scale; y += 1.05 * scale) {
          ctx.fillRect(cx - 1.6 * scale, y, 3.2 * scale, 0.54 * scale);
        }
      }
    }
    if (speedBump) {
      for (const bx of [w * 0.39, w * 0.71]) {
        for (let y = 0.75 * scale; y < h - 0.75 * scale; y += 0.9 * scale) {
          ctx.fillStyle = Math.floor(y / (0.9 * scale)) % 2 === 0 ? '#F59E0B' : '#1E293B';
          ctx.fillRect(bx - 0.35 * scale, y, 0.7 * scale, 0.9 * scale);
        }
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAniso;
    return tex;
  }

  /** Parking lot texture with painted bay numbers, accessible & EV icons, wheel stop lines & oil marks. */
  function parkingLotMaterial(width, depth, count, accessible, ev) {
    const scale = 28;
    const w = Math.round(width * scale);
    const h = Math.round(depth * scale);
    const canvas = makeCanvas(w, h);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#2E333B';
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 3000; i += 1) {
      const x = (i * 61) % w;
      const y = (i * 103) % h;
      const v = 38 + ((i * 17) % 20);
      ctx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
      ctx.fillRect(x, y, 3, 2);
    }

    const perRow = Math.ceil(count / 2);
    const bayW = width / perRow;
    const bayD = 5.1;
    ctx.lineWidth = 2.2;
    for (let row = 0; row < 2; row += 1) {
      const y0 = row === 0 ? 0.3 : depth - bayD - 0.3;
      for (let i = 0; i < perRow; i += 1) {
        const index = row * perRow + i;
        const x0 = i * bayW;
        if (index < accessible) {
          ctx.fillStyle = 'rgba(37,99,235,0.78)';
          ctx.fillRect((x0 + 0.15) * scale, (y0 + 0.15) * scale, (bayW - 0.3) * scale, (bayD - 0.3) * scale);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold ${Math.round(scale * 0.85)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('♿', (x0 + bayW / 2) * scale, (y0 + bayD * 0.56) * scale);
        } else if (index >= count - ev) {
          ctx.fillStyle = 'rgba(21,128,61,0.75)';
          ctx.fillRect((x0 + 0.15) * scale, (y0 + 0.15) * scale, (bayW - 0.3) * scale, (bayD - 0.3) * scale);
          ctx.fillStyle = '#BBF7D0';
          ctx.font = `bold ${Math.round(scale * 0.68)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('EV⚡', (x0 + bayW / 2) * scale, (y0 + bayD * 0.56) * scale);
        } else {
          const g = ctx.createRadialGradient((x0 + bayW / 2) * scale, (y0 + bayD / 2) * scale, 2, (x0 + bayW / 2) * scale, (y0 + bayD / 2) * scale, scale * 1.1);
          g.addColorStop(0, 'rgba(12,14,18,0.28)');
          g.addColorStop(1, 'rgba(12,14,18,0)');
          ctx.fillStyle = g;
          ctx.fillRect(x0 * scale, y0 * scale, bayW * scale, bayD * scale);
        }
        ctx.strokeStyle = 'rgba(248,250,252,0.88)';
        ctx.strokeRect((x0 + 0.08) * scale, y0 * scale, (bayW - 0.16) * scale, bayD * scale);
        // Painted bay number
        ctx.fillStyle = 'rgba(248,250,252,0.78)';
        ctx.font = `bold ${Math.round(scale * 0.42)}px sans-serif`;
        ctx.textAlign = 'center';
        const numY = row === 0 ? (y0 + bayD - 0.45) * scale : (y0 + 0.65) * scale;
        ctx.fillText(String(index + 1).padStart(2, '0'), (x0 + bayW / 2) * scale, numY);
        // Wheel stop paint highlight
        ctx.fillStyle = '#FACC15';
        const stopY = row === 0 ? (y0 + 0.42) * scale : (y0 + bayD - 0.56) * scale;
        ctx.fillRect((x0 + 0.35) * scale, stopY, (bayW - 0.7) * scale, 0.14 * scale);
      }
    }
    ctx.strokeStyle = 'rgba(250,204,21,0.8)';
    ctx.setLineDash([14, 12]);
    ctx.beginPath(); ctx.moveTo(12, h / 2); ctx.lineTo(w - 12, h / 2); ctx.stroke();

    const asph = asphaltMaps(4, 2);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = maxAniso;
    return new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      map,
      normalMap: asph.normalMap,
      normalScale: new THREE.Vector2(0.35, 0.35),
      roughness: 0.85,
      metalness: 0.04
    });
  }

  /** Context neighbor building facade with crisp glass window grid & warm/cool night glow. */
  function neighborBuildingMaterial() {
    return get('neighbor-bldg', () => {
      const w = 128;
      const h = 128;
      const alb = makeCanvas(w, h);
      const ctx = alb.getContext('2d');
      const emi = makeCanvas(w, h);
      const ectx = emi.getContext('2d');
      ctx.fillStyle = '#8F9BB0';
      ctx.fillRect(0, 0, w, h);
      ectx.fillStyle = '#000000';
      ectx.fillRect(0, 0, w, h);

      const cols = 8;
      const rows = 6;
      const cw = w / cols;
      const ch = h / rows;
      for (let r = 0; r < rows; r += 1) {
        ctx.fillStyle = 'rgba(51,65,85,0.45)';
        ctx.fillRect(0, r * ch, w, 2);
        for (let c = 0; c < cols; c += 1) {
          const wx = c * cw + 3;
          const wy = r * ch + 4;
          ctx.fillStyle = '#475569';
          ctx.fillRect(wx, wy, cw - 6, ch - 7);
          const v = hash2(c + 3, r + 7);
          if (v > 0.42) {
            ectx.fillStyle = v > 0.9 ? '#93C5FD' : '#FDE68A';
            ectx.fillRect(wx + 1, wy + 1, cw - 8, ch - 9);
          }
        }
      }
      return new THREE.MeshStandardMaterial({
        map: toTexture(alb, maxAniso, { repeat: [2, 1] }),
        emissive: '#FFE4A0',
        emissiveMap: toTexture(emi, maxAniso, { repeat: [2, 1] }),
        emissiveIntensity: 0.0,
        roughness: 0.72,
        metalness: 0.16
      });
    });
  }

  return {
    asphaltMaps,
    paverMaps,
    grassMaps,
    solarMaterial,
    concreteMaterial,
    metalCladdingMaterial,
    createArchitecturalGlassMaterial,
    b40FenceMaterial,
    polycarbonateMaterial,
    courtMaterial,
    roadTexture,
    parkingLotMaterial,
    neighborBuildingMaterial
  };
}

/** Custom animated pool water material with ripples, sky reflection, refraction & bottom caustics. */
export function createPoolWaterMaterial() {
  const mat = new THREE.MeshPhysicalMaterial({
    color: '#38BDF8',
    transparent: true,
    opacity: 0.72,
    roughness: 0.05,
    metalness: 0.08,
    ior: 1.333,
    reflectivity: 0.94,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04
  });
  mat.userData.uTime = { value: 0 };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = mat.userData.uTime;
    shader.vertexShader = `uniform float uTime;\nvarying vec2 vWaterUv;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       vWaterUv = uv;
       float wave = sin(position.x * 1.45 + uTime * 2.1) * 0.024 + cos(position.y * 1.85 - uTime * 1.65) * 0.02;
       transformed.z += wave;`
    );
    shader.fragmentShader = `uniform float uTime;\nvarying vec2 vWaterUv;\n${shader.fragmentShader}`.replace(
      '#include <dithering_fragment>',
      `float c1 = sin(vWaterUv.x * 28.0 + uTime * 2.4) * cos(vWaterUv.y * 22.0 - uTime * 1.9);
       float c2 = sin((vWaterUv.x + vWaterUv.y) * 34.0 - uTime * 2.8);
       float caustic = smoothstep(0.35, 0.95, (c1 + c2) * 0.5 + 0.5);
       gl_FragColor.rgb += vec3(0.14, 0.34, 0.44) * caustic * 0.48;
       #include <dithering_fragment>`
    );
  };
  return mat;
}
