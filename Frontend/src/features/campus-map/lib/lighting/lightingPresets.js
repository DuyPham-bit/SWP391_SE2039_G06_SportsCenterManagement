import * as THREE from 'three';

/**
 * Physically calibrated Day / Sunset / Night lighting configurations,
 * HDRI procedural equirectangular PMREM reflections, and smooth 1.5s interpolation.
 */
export const LIGHTING_PRESETS = {
  day: {
    sky: '#7EC8F8',
    fog: '#D8ECFB',
    fogDensity: 0.00055,
    ground: '#5A7844',
    hemiSky: '#DCEEFF',
    hemiGround: '#3E5230',
    hemi: 0.34,
    sun: 3.1,
    sunColor: '#FFF8E8',
    // ~55 deg elevation above campus
    sunPos: [76, 128, 52],
    rim: 0.25,
    rimColor: '#93C5FD',
    exposure: 0.96,
    bloom: 0.05,
    aoIntensity: 0.52,
    lutTint: [1.0, 1.0, 1.0],
    envIntensity: 1.15
  },
  sunset: {
    sky: '#CF6541',
    fog: '#DF8E66',
    fogDensity: 0.00085,
    ground: '#4C5236',
    hemiSky: '#FDBA74',
    hemiGround: '#2A2018',
    hemi: 0.28,
    sun: 2.6,
    sunColor: '#FF8638',
    // ~8.5 deg low-angle golden hour sunlight -> long dramatic shadows
    sunPos: [-168, 25, 58],
    rim: 0.55,
    rimColor: '#93C5FD',
    exposure: 0.92,
    bloom: 0.14,
    aoIntensity: 0.45,
    lutTint: [1.06, 0.95, 0.88],
    envIntensity: 1.2
  },
  night: {
    sky: '#040814',
    fog: '#070E1F',
    fogDensity: 0.00095,
    ground: '#121C12',
    hemiSky: '#1E3A8A',
    hemiGround: '#05080F',
    hemi: 0.14,
    sun: 0.28,
    sunColor: '#6D92F8',
    sunPos: [-52, 96, -70],
    rim: 0.18,
    rimColor: '#38BDF8',
    exposure: 0.95,
    bloom: 0.26,
    aoIntensity: 0.35,
    lutTint: [0.92, 0.96, 1.08],
    envIntensity: 0.38
  }
};

function makeSkyCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Builds procedural equirectangular HDRI sky dome + PMREM environment map per preset. */
export function createEnvironmentLibrary(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envs = {};

  const presets = {
    day: {
      zenith: '#1D4ED8',
      mid: '#60A5FA',
      horizon: '#DBEAFE',
      ground: '#3F5630',
      sunU: 0.62,
      sunV: 0.21,
      sunCol: '#FFFBEB',
      sunGlow: 'rgba(255,248,220,0.96)',
      clouds: 'rgba(255,255,255,0.34)'
    },
    sunset: {
      zenith: '#1B1842',
      mid: '#93314A',
      horizon: '#FDBA74',
      ground: '#2E251E',
      sunU: 0.17,
      sunV: 0.46,
      sunCol: '#FFEDD5',
      sunGlow: 'rgba(251,146,60,0.96)',
      clouds: 'rgba(253,186,116,0.32)'
    },
    night: {
      zenith: '#02050D',
      mid: '#091224',
      horizon: '#14223C',
      ground: '#070A10',
      sunU: 0.32,
      sunV: 0.24,
      sunCol: '#DBEAFE',
      sunGlow: 'rgba(147,197,253,0.42)',
      clouds: 'rgba(30,58,138,0.16)'
    }
  };

  for (const [key, cfg] of Object.entries(presets)) {
    const w = 1024;
    const h = 512;
    const canvas = makeSkyCanvas(w, h);
    const ctx = canvas.getContext('2d');

    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.54);
    skyGrad.addColorStop(0, cfg.zenith);
    skyGrad.addColorStop(0.55, cfg.mid);
    skyGrad.addColorStop(1, cfg.horizon);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.54);

    const gndGrad = ctx.createLinearGradient(0, h * 0.52, 0, h);
    gndGrad.addColorStop(0, cfg.horizon);
    gndGrad.addColorStop(0.16, cfg.ground);
    gndGrad.addColorStop(1, '#070A10');
    ctx.fillStyle = gndGrad;
    ctx.fillRect(0, h * 0.52, w, h * 0.48);

    // Multi-layered volumetric-looking cumulus cloud wisps
    for (let i = 0; i < 34; i += 1) {
      const cx = (i * 113 + (i % 3) * 29) % w;
      const cy = h * (0.18 + (i % 7) * 0.042);
      const rx = 46 + (i % 5) * 24;
      const ry = 9 + (i % 4) * 6;
      const cg = ctx.createRadialGradient(cx, cy, 2, cx, cy, rx);
      cg.addColorStop(0, cfg.clouds);
      cg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (key === 'night') {
      ctx.fillStyle = 'rgba(226,232,240,0.8)';
      for (let s = 0; s < 260; s += 1) {
        const sx = (s * 137) % w;
        const sy = (s * 73) % Math.round(h * 0.45);
        const r = s % 7 === 0 ? 1.8 : 1.0;
        ctx.fillRect(sx, sy, r, r);
      }
    }

    const sx = cfg.sunU * w;
    const sy = cfg.sunV * h;
    const r = key === 'sunset' ? 88 : key === 'day' ? 68 : 42;
    const sg = ctx.createRadialGradient(sx, sy, 2, sx, sy, r);
    sg.addColorStop(0, cfg.sunCol);
    sg.addColorStop(0.24, cfg.sunGlow);
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();

    const equirect = new THREE.CanvasTexture(canvas);
    equirect.mapping = THREE.EquirectangularReflectionMapping;
    equirect.colorSpace = THREE.SRGBColorSpace;
    const rt = pmrem.fromEquirectangular(equirect);
    envs[key] = { envMap: rt.texture, skyTexture: equirect, rt };
  }

  return {
    envs,
    dispose() {
      pmrem.dispose();
      for (const e of Object.values(envs)) {
        e.skyTexture.dispose();
        e.rt.dispose();
      }
    }
  };
}

/** Smoothly interpolates scene lighting, sun coordinates, fog, exposure & post-FX over ~1.5 s. */
export function applyLightingState({
  scene, renderer, hemi, sun, rimLight, bloomPass, archvizPass, ssaoPass, built, fromCfg, toCfg, t
}) {
  const cA = new THREE.Color();
  const cB = new THREE.Color();
  const lerpCol = (hexA, hexB) => cA.set(hexA).lerp(cB.set(hexB), t).clone();

  const skyCol = lerpCol(fromCfg.sky, toCfg.sky);
  const fogCol = lerpCol(fromCfg.fog, toCfg.fog);
  const fogDensity = THREE.MathUtils.lerp(fromCfg.fogDensity, toCfg.fogDensity, t);

  scene.background = skyCol;
  if (!scene.fog || !(scene.fog instanceof THREE.FogExp2)) {
    scene.fog = new THREE.FogExp2(fogCol, fogDensity);
  } else {
    scene.fog.color.copy(fogCol);
    scene.fog.density = fogDensity;
  }

  renderer.toneMappingExposure = THREE.MathUtils.lerp(fromCfg.exposure, toCfg.exposure, t);
  scene.environmentIntensity = THREE.MathUtils.lerp(fromCfg.envIntensity, toCfg.envIntensity, t);

  hemi.intensity = THREE.MathUtils.lerp(fromCfg.hemi, toCfg.hemi, t);
  hemi.color.copy(lerpCol(fromCfg.hemiSky, toCfg.hemiSky));
  hemi.groundColor.copy(lerpCol(fromCfg.hemiGround, toCfg.hemiGround));

  sun.intensity = THREE.MathUtils.lerp(fromCfg.sun, toCfg.sun, t);
  sun.color.copy(lerpCol(fromCfg.sunColor, toCfg.sunColor));
  sun.position.set(
    THREE.MathUtils.lerp(fromCfg.sunPos[0], toCfg.sunPos[0], t),
    THREE.MathUtils.lerp(fromCfg.sunPos[1], toCfg.sunPos[1], t),
    THREE.MathUtils.lerp(fromCfg.sunPos[2], toCfg.sunPos[2], t)
  );

  rimLight.intensity = THREE.MathUtils.lerp(fromCfg.rim, toCfg.rim, t);
  rimLight.color.copy(lerpCol(fromCfg.rimColor, toCfg.rimColor));

  if (bloomPass) {
    bloomPass.strength = THREE.MathUtils.lerp(fromCfg.bloom, toCfg.bloom, t);
  }
  if (ssaoPass) {
    ssaoPass.enabled = THREE.MathUtils.lerp(fromCfg.aoIntensity, toCfg.aoIntensity, t) > 0.1;
  }
  if (archvizPass?.uniforms?.uTint) {
    archvizPass.uniforms.uTint.value.set(
      THREE.MathUtils.lerp(fromCfg.lutTint[0], toCfg.lutTint[0], t),
      THREE.MathUtils.lerp(fromCfg.lutTint[1], toCfg.lutTint[1], t),
      THREE.MathUtils.lerp(fromCfg.lutTint[2], toCfg.lutTint[2], t)
    );
  }
  if (built?.ground?.material) {
    built.ground.material.color.copy(lerpCol(fromCfg.ground, toCfg.ground));
  }
}
