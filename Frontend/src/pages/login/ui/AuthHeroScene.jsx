import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Palette pinned 100% to tokens.css (forest / sage / teal / sand-gold / cream); no new hues.
const C = {
  forestDeep: 0x071812,
  forest: 0x1b4332,
  sage: 0x2d6a4f,
  sageLight: 0x81b29a,
  teal: 0x3faeb8,
  gold: 0xf2cc8f,
  goldDeep: 0xe5a33c,
  cream: 0xf4f1de,
};

/**
 * Architectural athletic stage + smooth PBR gold sphere:
 * - Soft recessed stadium track rings dissolving into forest fog (no hard polygon cones or seam streaks)
 * - Sculptural high-segment PBR gold sphere (metalness 0.62, roughness 0.28) with emerald rim light
 *   positioned cleanly in the empty lower-right zone of the left panel with soft contact shadow
 * - Subtle ascending gold particles
 */
function buildScene(width, height) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(C.forestDeep, 0.072);

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 80);
  camera.position.set(0, 3.3, 9.6);
  camera.lookAt(0, 0.45, 0);

  // Key, fill, and emerald rim lights so the gold sphere has rich architectural volume
  scene.add(new THREE.HemisphereLight(C.sageLight, C.forestDeep, 0.55));
  const keyLight = new THREE.DirectionalLight(C.gold, 1.45);
  keyLight.position.set(-5.5, 8.5, 4.5);
  scene.add(keyLight);

  const emeraldRim = new THREE.DirectionalLight(C.sageLight, 1.5);
  emeraldRim.position.set(6.5, 3.2, -4.5);
  scene.add(emeraldRim);

  const tealFill = new THREE.PointLight(C.teal, 9, 12, 1.8);
  tealFill.position.set(4.8, 1.4, 3.0);
  scene.add(tealFill);

  const disposables = [];
  const keep = (...items) => { disposables.push(...items); return items[0]; };

  // Recessed infield disc melting softly into fog
  const fieldGeo = keep(new THREE.CircleGeometry(7.0, 64));
  fieldGeo.scale(1.6, 1, 1);
  const field = new THREE.Mesh(
    fieldGeo,
    keep(new THREE.MeshStandardMaterial({ color: C.forest, roughness: 0.96, metalness: 0.04 }))
  );
  field.rotation.x = -Math.PI / 2;
  field.position.set(0, -0.32, -1.6);
  scene.add(field);

  // Subtle concentric running-track lane lines in the lower stage (kept low-opacity so text stays clean)
  const addRing = (inner, outer, color, opacity, y) => {
    const geo = keep(new THREE.RingGeometry(inner, outer, 72, 1));
    geo.scale(1.6, 1, 1);
    const mat = keep(new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
    }));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, y, -1.6);
    scene.add(mesh);
    return mesh;
  };
  addRing(7.0, 9.6, C.sage, 0.38, -0.31);
  for (let i = 0; i <= 4; i += 1) {
    addRing(7.0 + i * 0.62, 7.0 + i * 0.62 + 0.025, C.cream, i === 0 || i === 4 ? 0.2 : 0.09, -0.30);
  }

  // Slow subtle gold pace arc along the outer lane
  const sweepGeo = keep(new THREE.RingGeometry(7.0, 9.5, 64, 1, 0, Math.PI / 8));
  sweepGeo.scale(1.6, 1, 1);
  const sweep = new THREE.Mesh(
    sweepGeo,
    keep(new THREE.MeshBasicMaterial({
      color: C.gold,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }))
  );
  sweep.rotation.x = -Math.PI / 2;
  sweep.position.set(0, -0.29, -1.6);
  scene.add(sweep);

  // Soft radial glow sprite texture (shared by atmospheric flood halos, sphere halo & gold dust)
  const glowTex = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.28, 'rgba(255,255,255,0.42)');
    g.addColorStop(0.7, 'rgba(255,255,255,0.08)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return keep(new THREE.CanvasTexture(canvas));
  })();

  // Distant atmospheric floodlight halos (no sharp diagonal polygons)
  const haloMat = keep(new THREE.SpriteMaterial({
    map: glowTex,
    color: C.gold,
    transparent: true,
    opacity: 0.42,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  const flood = [];
  [[-10.5, 4.8, -7.5], [10.5, 4.8, -7.5], [-6.2, 5.2, -10.5], [6.2, 5.2, -10.5]].forEach(([x, y, z]) => {
    const halo = new THREE.Sprite(haloMat);
    halo.position.set(x, y, z);
    halo.scale.set(3.4, 3.4, 1);
    scene.add(halo);
    flood.push(halo);
  });

  // Smooth PBR Gold Sphere in the open lower-right area of the showcase stage
  const ballGroup = new THREE.Group();
  const sphereGeo = keep(new THREE.SphereGeometry(0.92, 48, 48));
  const sphereMat = keep(new THREE.MeshStandardMaterial({
    color: C.gold,
    metalness: 0.62,
    roughness: 0.28,
    emissive: C.goldDeep,
    emissiveIntensity: 0.08,
  }));
  ballGroup.add(new THREE.Mesh(sphereGeo, sphereMat));

  // Precision athletic seam bands wrapped smoothly around the sphere
  const seamMat = keep(new THREE.MeshStandardMaterial({
    color: C.forest,
    metalness: 0.35,
    roughness: 0.4,
    transparent: true,
    opacity: 0.36,
  }));
  const seamGeo = keep(new THREE.TorusGeometry(0.923, 0.012, 10, 72));
  const seamA = new THREE.Mesh(seamGeo, seamMat);
  seamA.rotation.x = Math.PI / 2.2;
  seamA.rotation.y = Math.PI / 6;
  const seamB = new THREE.Mesh(seamGeo, seamMat);
  seamB.rotation.y = Math.PI / 2;
  seamB.rotation.z = -Math.PI / 5;
  ballGroup.add(seamA, seamB);

  const ballHalo = new THREE.Sprite(keep(new THREE.SpriteMaterial({
    map: glowTex,
    color: C.gold,
    transparent: true,
    opacity: 0.24,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })));
  ballHalo.scale.set(3.2, 3.2, 1);
  ballGroup.add(ballHalo);

  // Lower-right stage placement (updated dynamically on resize to stay inside frustum & away from copy)
  const basePos = { x: 2.0, y: 0.16, z: 1.4 };
  ballGroup.position.set(basePos.x, basePos.y, basePos.z);
  ballGroup.scale.setScalar(0.52);
  scene.add(ballGroup);

  const shadowTex = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    g.addColorStop(0, 'rgba(7, 24, 18, 0.72)');
    g.addColorStop(0.55, 'rgba(7, 24, 18, 0.28)');
    g.addColorStop(1, 'rgba(7, 24, 18, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return keep(new THREE.CanvasTexture(canvas));
  })();
  const ballShadow = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(1.5, 1.5)),
    keep(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }))
  );
  ballShadow.rotation.x = -Math.PI / 2;
  ballShadow.position.set(basePos.x, -0.28, basePos.z);
  scene.add(ballShadow);

  // Fine ascending gold particles (220 points — subtle, crisp, low CPU/GPU cost)
  const COUNT = 220;
  const pos = new Float32Array(COUNT * 3);
  const speed = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i += 1) {
    pos[i * 3] = (Math.random() - 0.5) * 24;
    pos[i * 3 + 1] = Math.random() * 8.5;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 14 - 2;
    speed[i] = 0.09 + Math.random() * 0.24;
  }
  const dustGeo = keep(new THREE.BufferGeometry());
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(
    dustGeo,
    keep(new THREE.PointsMaterial({
      map: glowTex,
      color: C.gold,
      size: 0.13,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    }))
  );
  scene.add(dust);

  return { scene, camera, ballGroup, ballShadow, basePos, sweep, flood, dust, dustPos: pos, dustSpeed: speed, COUNT, disposables };
}

export default function AuthHeroScene({ onReady }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    host.appendChild(canvas);

    const rect = host.getBoundingClientRect();
    const world = buildScene(Math.max(1, rect.width), Math.max(1, rect.height));
    const { scene, camera, basePos } = world;

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      const narrow = camera.aspect < 0.92;
      const compactDesktop = width < 820;
      camera.position.z = narrow ? 10.6 : (compactDesktop ? 10.2 : 9.6);
      const ballZ = 1.4;
      const halfH = (camera.position.z - ballZ) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const halfW = halfH * camera.aspect;
      // Keep sphere comfortably inset from right panel border & clear of feature cards across 1366/1440/1920
      const scale = narrow ? 0.42 : (compactDesktop ? 0.44 : 0.54);
      const safeX = Math.max(1.25, halfW - (narrow ? 0.68 : (compactDesktop ? 0.72 : 0.9)));
      basePos.x = safeX;
      basePos.y = compactDesktop ? 0.08 : 0.16;
      basePos.z = ballZ;
      world.ballGroup.position.x = safeX;
      world.ballGroup.position.z = ballZ;
      world.ballGroup.scale.setScalar(scale);
      world.ballShadow.position.x = safeX;
      world.ballShadow.position.z = ballZ;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onPointer = event => {
      const box = host.getBoundingClientRect();
      pointer.tx = Math.max(-1, Math.min(1, ((event.clientX - box.left) / Math.max(1, box.width) - 0.5) * 2));
      pointer.ty = Math.max(-1, Math.min(1, ((event.clientY - box.top) / Math.max(1, box.height) - 0.5) * 2));
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) loop(); });
    io.observe(host);
    const onVisibility = () => { if (!document.hidden) loop(); };
    document.addEventListener('visibilitychange', onVisibility);

    let raf = 0;
    let last = performance.now();
    let ready = false;
    const clock = { t: 0 };

    function frame(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock.t += dt;
      const t = clock.t;

      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      camera.position.x = pointer.x * 0.55 + Math.sin(t * 0.14) * 0.25;
      camera.position.y = 3.3 - pointer.y * 0.35;
      camera.lookAt(0, 0.45, 0);

      // Smooth sphere rotation + gentle float + pointer parallax offset
      const floatY = Math.sin(t * 1.15) * 0.12;
      world.ballGroup.rotation.y += dt * 0.38;
      world.ballGroup.rotation.x += dt * 0.14;
      world.ballGroup.position.y = basePos.y + floatY - pointer.y * 0.08;
      world.ballShadow.scale.setScalar(1 - floatY * 0.5);

      world.sweep.rotation.z = -t * 0.22;
      world.flood.forEach((halo, i) => {
        const s = 3.2 + Math.sin(t * 1.1 + i) * 0.2;
        halo.scale.set(s, s, 1);
      });

      const p = world.dustPos;
      for (let i = 0; i < world.COUNT; i += 1) {
        p[i * 3 + 1] += world.dustSpeed[i] * dt;
        p[i * 3] += Math.sin(t * 0.45 + i) * dt * 0.04;
        if (p[i * 3 + 1] > 8.5) p[i * 3 + 1] = 0;
      }
      world.dust.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
      if (!ready) { ready = true; onReady?.(); }
      loop();
    }
    function loop() { if (!raf) raf = requestAnimationFrame(frame); }
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      world.disposables.forEach(item => item.dispose?.());
      renderer.dispose();
      renderer.forceContextLoss?.();
      canvas.remove();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={hostRef} className="absolute inset-0" />;
}
