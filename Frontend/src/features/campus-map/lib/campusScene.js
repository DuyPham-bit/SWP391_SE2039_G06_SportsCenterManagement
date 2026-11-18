import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createSurfaceLibrary } from './campusMaterials.js';
import {
  LIGHTING_PRESETS,
  createEnvironmentLibrary,
  applyLightingState
} from './lighting/lightingPresets.js';
import { createVolumetricBeamMaterial, createLightPoolFactory } from './lighting/volumetricLights.js';
import { createPostPipeline } from './postfx/postPipeline.js';
import { createLabelManager } from './labels/labelManager.js';
import { buildArchitecturalBuilding, getFloorY, getBuildingTotalHeight } from './campusBuildings.js';
import {
  createPropDefinitions,
  buildSurroundingContext,
  buildPickleballCourtDetails,
  buildFootballPitchDetails
} from './campusProps.js';

export const FLOOR_HEIGHT = 5.4;
const DETAIL_DISTANCE = 155;
const COMPACT_LABEL_DISTANCE = 195;
const HOME = { target: new THREE.Vector3(0, 2, 2), position: new THREE.Vector3(68, 92, 118) };

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function makeRouteArrowTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#D97706';
  ctx.fillRect(0, 0, 128, 64);
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.moveTo(22, 10); ctx.lineTo(62, 32); ctx.lineTo(22, 54); ctx.lineTo(38, 32);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(74, 10); ctx.lineTo(114, 32); ctx.lineTo(74, 54); ctx.lineTo(90, 32);
  ctx.closePath();
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function makeGateTitleTexture(titleText, accentHex) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 160;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, 1024, 160);
  ctx.fillStyle = accentHex;
  ctx.fillRect(0, 0, 1024, 10);
  ctx.fillRect(0, 150, 1024, 10);
  ctx.fillStyle = '#F8FAFC';
  ctx.font = '900 50px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(titleText, 512, 82);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Collects instance transforms per prop type with optional zone/floor filtering. */
class InstanceBatch {
  constructor() { this.items = new Map(); }

  add(type, x, y, z, sx = 1, sy = 1, sz = 1, rotY = 0, color = null, zoneId = null, floor = 0) {
    if (!this.items.has(type)) this.items.set(type, []);
    this.items.get(type).push({ x, y, z, sx, sy, sz, rotY, color, zoneId, floor });
  }

  build(definitions, groups) {
    const matrix = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const meshes = {};
    for (const [type, list] of this.items) {
      const def = definitions[type];
      if (!def || !list.length) continue;
      const mesh = new THREE.InstancedMesh(def.geometry(), def.material(), list.length);
      const baseMatrices = [];
      list.forEach((it, i) => {
        q.setFromAxisAngle(up, it.rotY);
        matrix.compose(new THREE.Vector3(it.x, it.y, it.z), q, new THREE.Vector3(it.sx, it.sy, it.sz));
        mesh.setMatrixAt(i, matrix);
        baseMatrices.push(matrix.clone());
        if (it.color) mesh.setColorAt(i, new THREE.Color(it.color));
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.castShadow = !!def.castShadow;
      mesh.receiveShadow = !!def.receiveShadow;
      mesh.userData = { instanced: type, items: list, baseMatrices };
      (def.detail ? groups.detail : groups.props).add(mesh);
      meshes[type] = mesh;
    }
    return meshes;
  }
}

export function createCampusScene({ container, labelLayer, onHover, onSelect, onCameraChange, onContextLost, onProgress }) {
  const capture = typeof location !== 'undefined' && new URLSearchParams(location.search).has('capture');
  const isCompactDevice = typeof window !== 'undefined' && window.innerWidth <= 900;

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: capture });
  const maxDpr = Math.min(window.devicePixelRatio || 1, isCompactDevice ? 1.5 : 2);
  let currentDpr = maxDpr;
  renderer.setPixelRatio(currentDpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const shadowSize = !isCompactDevice && renderer.capabilities.maxTextureSize >= 4096 ? 4096 : 2048;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.8, 1800);
  camera.position.copy(HOME.position);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(HOME.target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.465;
  controls.minDistance = 14;
  controls.maxDistance = 340;
  controls.screenSpacePanning = false;

  const pipeline = createPostPipeline(renderer, scene, camera, {
    enableAO: false, // static + perimeter baked AO stays ultra-fast; enabled dynamically if desktop >= 52 fps
    enableSMAA: !isCompactDevice
  });
  const { composer, ssaoPass, bloomPass, archvizPass } = pipeline;

  const surfaces = createSurfaceLibrary(maxAniso);
  const envLib = createEnvironmentLibrary(renderer);
  const windUniform = { value: 0 };
  const propDefs = createPropDefinitions(windUniform);

  // Sky dome mesh showing HDRI atmospheric gradient + clouds/stars
  const skyDomeMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, depthWrite: false, fog: false });
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(950, 32, 20), skyDomeMat);
  scene.add(skyDome);

  // Calibrated primary sunlight + subtle hemisphere fill
  const hemi = new THREE.HemisphereLight('#DCEEFF', '#3E5230', 0.34);
  const sun = new THREE.DirectionalLight('#FFF8E8', 3.1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(sun.shadow.camera, { left: -88, right: 88, top: 88, bottom: -88, near: 8, far: 360 });
  sun.shadow.bias = -0.00025;
  sun.shadow.normalBias = 0.022;
  // Static shadow casters: update shadow map on lighting transitions / scene rebuild rather than every orbit frame
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  const rimLight = new THREE.DirectionalLight('#93C5FD', 0.25);
  rimLight.position.set(-90, 55, -75);
  scene.add(hemi, sun, sun.target, rimLight);

  const world = new THREE.Group();
  scene.add(world);

  const labelManager = createLabelManager({
    labelLayer,
    onSelect,
    getBuildingTotalHeight,
    compactDistance: COMPACT_LABEL_DISTANCE
  });

  let state = {
    campus: null, signature: '', lighting: 'day', statusAt: {}, selectedZoneId: null, floor: null, route: null
  };
  let built = null;
  let frame = 0;
  let dirty = true;
  let running = true;
  let camAnim = null;
  let flyoverSpline = null;
  let lightAnim = null;
  let activeLightMode = 'day';
  let lastAzimuthSent = NaN;
  let lastMppSent = 0;
  let hoverKey = '';
  let routeTex = null;
  let frameTimes = [];

  const invalidate = () => { dirty = true; };
  controls.addEventListener('change', invalidate);
  controls.addEventListener('start', () => {
    if (flyoverSpline) {
      flyoverSpline = null;
      archvizPass.uniforms.uTiltShift.value = 0;
    }
  });

  function clearWorld() {
    disposeObject(world);
    world.clear();
    labelManager.clear();
    built = null;
  }

  function build(campus) {
    onProgress?.(20);
    clearWorld();
    const groups = {
      base: new THREE.Group(),
      props: new THREE.Group(),
      detail: new THREE.Group(),
      route: new THREE.Group()
    };
    Object.values(groups).forEach((g) => world.add(g));
    const batch = new InstanceBatch();
    const pickables = [];
    const zones = new Map();
    const floodSpots = [];
    const waterMaterials = [];
    const coneMaterials = [];
    const beaconMats = [];
    const flagMaterials = [];
    const trafficCars = [];
    const lightPoolFactory = createLightPoolFactory();

    const { ground, ctxMat } = buildSurroundingContext({
      campus, groups, batch, surfaces, waterMaterials, flagMaterials, trafficCars, windUniform
    });
    onProgress?.(45);

    const paverMat = new THREE.MeshStandardMaterial(surfaces.paverMaps(6, 6, '#DFDBD0'));

    for (const zone of campus.zones) {
      const group = new THREE.Group();
      group.userData.zoneId = zone.id;
      world.add(group);
      const entry = {
        zone,
        group,
        floors: [],
        facadeSides: [],
        interiorGroups: [],
        interiorLights: [],
        interiorLightMats: [],
        ledMats: [],
        roof: null,
        windowMats: [],
        parcel: null,
        outline: null
      };
      zones.set(zone.id, entry);
      const color = new THREE.Color(zone.color);

      // Parcel plinth (natural muted cream/olive blend; zone colors reserved for accents only)
      const parcelMat = zone.kind === 'landscape'
        ? new THREE.MeshStandardMaterial(surfaces.grassMaps(6, 12, '#62854B'))
        : new THREE.MeshStandardMaterial({
            color: color.clone().lerp(new THREE.Color('#EAE7DF'), 0.86),
            roughness: 0.84,
            metalness: 0.03
          });
      const parcel = new THREE.Mesh(new THREE.PlaneGeometry(zone.width - 0.35, zone.depth - 0.35), parcelMat);
      parcel.rotation.x = -Math.PI / 2;
      parcel.position.set(zone.x, 0.02, zone.z);
      parcel.receiveShadow = true;
      parcel.userData = { zoneId: zone.id, pick: true };
      group.add(parcel);
      pickables.push(parcel);
      entry.parcel = parcel;

      const outline = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-zone.width / 2, 0, -zone.depth / 2),
          new THREE.Vector3(zone.width / 2, 0, -zone.depth / 2),
          new THREE.Vector3(zone.width / 2, 0, zone.depth / 2),
          new THREE.Vector3(-zone.width / 2, 0, zone.depth / 2)
        ]),
        new THREE.LineBasicMaterial({ color: zone.color, transparent: true, opacity: 0.9 })
      );
      outline.position.set(zone.x, 0.07, zone.z);
      group.add(outline);
      entry.outline = outline;

      if (zone.buildingWidth > 0 && zone.floors > 0) {
        buildArchitecturalBuilding({
          zone, entry, group, pickables, batch, surfaces, waterMaterials, beaconMats
        });
      }

      for (const room of zone.rooms) {
        if (zone.floors > 0) continue;
        const surround = room.kind === 'pickleball' ? [3, 4.9] : room.kind?.startsWith('football') ? [3.4, 3.4] : [0, 0];
        if (surround[0]) {
          const apron = new THREE.Mesh(
            new THREE.PlaneGeometry(room.width + surround[0], room.depth + surround[1]),
            new THREE.MeshStandardMaterial({
              color: room.kind === 'pickleball' ? '#1E3A5F' : '#254D28',
              roughness: 0.78
            })
          );
          apron.rotation.x = -Math.PI / 2;
          apron.position.set(room.x, 0.04, room.z);
          apron.receiveShadow = true;
          group.add(apron);
        }
        const court = new THREE.Mesh(
          new THREE.PlaneGeometry(room.width, room.depth),
          surfaces.courtMaterial(room.kind, room.width, room.depth)
        );
        court.rotation.x = -Math.PI / 2;
        court.rotation.z = -THREE.MathUtils.degToRad(room.rotation || 0);
        court.position.set(room.x, 0.06, room.z);
        court.receiveShadow = true;
        court.userData = { zoneId: zone.id, roomId: room.id, pick: true };
        group.add(court);
        pickables.push(court);

        if (room.kind === 'pickleball') buildPickleballCourtDetails({ group, zone, room, batch, surfaces });
        if (room.kind?.startsWith('football')) buildFootballPitchDetails({ group, zone, room, batch, surfaces });
      }

      for (const f of zone.features) {
        addFeature({ zone, entry, group, f, batch, floodSpots, surfaces, paverMat, coneMaterials, lightPoolFactory });
      }
    }

    onProgress?.(75);
    const instances = batch.build(propDefs, groups);
    built = {
      zones, groups, pickables, instances, ground, ctxMat, floodSpots,
      floodLights: [], waterMaterials, coneMaterials, beaconMats, flagMaterials,
      trafficCars, lightPools: lightPoolFactory.pools
    };

    // 5 Real Shadow/Volumetric Stadium SpotLights targeting football & pickleball playing surfaces
    for (let i = 0; i < Math.min(5, floodSpots.length); i += 1) {
      const spot = floodSpots[i];
      const light = new THREE.SpotLight('#FFF3D6', 0, 105, Math.PI / 4.6, 0.65, 1.3);
      light.position.set(spot.from[0], 17.5, spot.from[1]);
      light.target.position.set(spot.to[0], 0, spot.to[1]);
      light.castShadow = i < 2;
      if (light.castShadow) {
        light.shadow.mapSize.set(1024, 1024);
        light.shadow.bias = -0.0004;
      }
      light.userData.zoneId = spot.zoneId;
      world.add(light, light.target);
      built.floodLights.push(light);
    }

    labelManager.build(campus);
    applyState(true);
    onProgress?.(100);
  }

  function addFeature({ zone, entry, group, f, batch, floodSpots, surfaces, paverMat, coneMaterials, lightPoolFactory }) {
    const level = f.floor && zone.floors > 0 ? f.floor : 0;
    const y = level ? getFloorY(zone, level) + 0.48 : 0;

    switch (f.type) {
      case 'path': {
        for (let i = 1; i < (f.points?.length || 0); i += 1) {
          const [ax, az] = f.points[i - 1];
          const [bx, bz] = f.points[i];
          const len = Math.hypot(bx - ax, bz - az);
          if (len < 0.01) continue;
          const angle = Math.atan2(bx - ax, bz - az);
          const walk = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, len + 2.4), paverMat);
          walk.position.set((ax + bx) / 2, 0.08, (az + bz) / 2);
          walk.rotation.y = angle;
          walk.receiveShadow = true;
          group.add(walk);

          // 1 m Garden bollard lights along walkway edges
          if (len >= 12) {
            const lampSteps = Math.floor(len / 12);
            for (let ls = 1; ls < lampSteps; ls += 1) {
              const t = ls / lampSteps;
              const lx = ax + (bx - ax) * t + Math.cos(angle) * 1.45;
              const lz = az + (bz - az) * t - Math.sin(angle) * 1.45;
              batch.add('gardenLightPole', lx, 0, lz);
              batch.add('gardenLightHead', lx, 0, lz);
              lightPoolFactory.addPool(group, lx, lz, 4.5, '#FDE68A', zone.id);
            }
          }

          if (f.canopy) {
            // Translucent polycarbonate architectural walkway roof + steel fascia ribs
            const roof = new THREE.Mesh(
              new THREE.BoxGeometry(3.4, 0.1, len + 2.4),
              surfaces.polycarbonateMaterial('#E0F2FE')
            );
            roof.position.set((ax + bx) / 2, 3.08, (az + bz) / 2);
            roof.rotation.y = angle;
            roof.castShadow = true;
            group.add(roof);

            const steps = Math.max(1, Math.floor(len / 6));
            for (let s = 0; s <= steps; s += 1) {
              const t = s / steps;
              const px = ax + (bx - ax) * t;
              const pz = az + (bz - az) * t;
              const nx = Math.cos(angle) * 1.55;
              const nz = -Math.sin(angle) * 1.55;
              batch.add('canopyPost', px + nx, 0, pz + nz);
              batch.add('canopyPost', px - nx, 0, pz - nz);
              if (s % 2 === 0 && len > 10) {
                batch.add('bench', px + nx * 1.35, 0, pz + nz * 1.35, 1, 1, 1, angle + Math.PI / 2);
                batch.add('shrub', px - nx * 1.5, 0, pz - nz * 1.5, 1.1, 1, 1.1, s);
              }
            }
          }
        }
        break;
      }

      case 'space': {
        const colors = {
          locker_m: '#93C5FD', locker_f: '#F9A8D4', wc: '#A5B4FC',
          reception: '#FDE68A', cafe: '#FDBA74', medical: '#FBCFE8', kiosk: '#CBD5E1'
        };
        const floorGroup = level ? entry.floors[level - 1] : null;
        if (level) {
          const pad = new THREE.Mesh(
            new THREE.BoxGeometry(f.w, 0.06, f.d),
            new THREE.MeshStandardMaterial({ color: colors[f.variant] || '#E2E8F0', roughness: 0.55 })
          );
          pad.position.set(f.x, y + 0.03, f.z);
          pad.receiveShadow = true;
          pad.userData = { zoneId: zone.id, pick: true };
          (floorGroup || group).add(pad);

          const partMat = new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.65, transparent: true, opacity: 0.72 });
          const wall = new THREE.Mesh(new THREE.BoxGeometry(f.w, 2.2, 0.14), partMat);
          wall.position.set(f.x, y + 1.1, f.z - f.d / 2);
          (floorGroup || group).add(wall);

          if (f.variant === 'locker_m' || f.variant === 'locker_f') {
            for (let lk = -1; lk <= 1; lk += 2) {
              batch.add('lockerUnit', f.x + lk * (f.w * 0.25), y, f.z, 1, 1, 1, 0, f.variant === 'locker_m' ? '#38BDF8' : '#F472B6', zone.id, level);
            }
          }
        } else {
          // Architectural Outdoor Locker & WC Pavilion (rebuilt: eliminates legacy flat mint-green block completely)
          const pav = new THREE.Group();
          const baseBody = new THREE.Mesh(new THREE.BoxGeometry(f.w, 3.2, f.d), surfaces.concreteMaterial('#DDD8CE', [2, 1]));
          baseBody.position.y = 1.6;
          baseBody.castShadow = true;
          baseBody.receiveShadow = true;

          // Timber louver cladding band + glazed clerestory strip
          const louverBand = new THREE.Mesh(
            new THREE.BoxGeometry(f.w + 0.08, 1.35, f.d + 0.08),
            new THREE.MeshStandardMaterial({ color: '#A37046', roughness: 0.52 })
          );
          louverBand.position.y = 2.05;
          const darkSteelRoof = new THREE.Mesh(
            new THREE.BoxGeometry(f.w + 0.4, 0.22, f.d + 0.4),
            surfaces.metalCladdingMaterial('#3F4A5C', [2, 1])
          );
          darkSteelRoof.position.y = 3.31;
          darkSteelRoof.castShadow = true;

          // Translucent polycarbonate overhanging perimeter awning + delicate zone LED fascia edges (not solid green top!)
          const polyAwning = new THREE.Mesh(
            new THREE.BoxGeometry(f.w + 2.2, 0.09, f.d + 2.2),
            surfaces.polycarbonateMaterial('#E0F2FE')
          );
          polyAwning.position.y = 3.5;
          polyAwning.castShadow = true;

          const ledRimMat = new THREE.MeshStandardMaterial({ color: zone.color, emissive: zone.color, emissiveIntensity: 0.8 });
          entry.ledMats.push(ledRimMat);
          for (const [w, d, dx, dz] of [
            [f.w + 2.24, 0.07, 0, -(f.d + 2.2) / 2],
            [f.w + 2.24, 0.07, 0, (f.d + 2.2) / 2],
            [0.07, f.d + 2.24, -(f.w + 2.2) / 2, 0],
            [0.07, f.d + 2.24, (f.w + 2.2) / 2, 0]
          ]) {
            const strip = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), ledRimMat);
            strip.position.set(dx, 3.51, dz);
            pav.add(strip);
          }

          pav.add(baseBody, louverBand, darkSteelRoof, polyAwning);
          pav.position.set(f.x, 0, f.z);
          pav.userData = { zoneId: zone.id, pick: true };
          group.add(pav);

          batch.add('bikeRack', f.x - f.w / 2 - 1.2, 0, f.z, 1, 1, 1, Math.PI / 2);
          batch.add('bench', f.x - f.w / 2 - 1.1, 0, f.z + 3.2, 1, 1, 1, Math.PI / 2);
        }
        break;
      }

      case 'stand': {
        const horizontal = f.w >= f.d;
        const len = horizontal ? f.w : f.d;
        const depth = horizontal ? f.d : f.w;
        const tiers = 5;
        const standGroup = new THREE.Group();
        const stepMat = surfaces.concreteMaterial('#94A3B8', [3, 1]);
        for (let t = 0; t < tiers; t += 1) {
          const tierDepth = depth / tiers;
          const tierH = 0.42 * (t + 1);
          const tier = new THREE.Mesh(
            horizontal ? new THREE.BoxGeometry(len, tierH, tierDepth) : new THREE.BoxGeometry(tierDepth, tierH, len),
            stepMat
          );
          const offset = -depth / 2 + tierDepth * (t + 0.5);
          tier.position.set(horizontal ? 0 : offset, tierH / 2, horizontal ? offset : 0);
          tier.castShadow = true;
          tier.receiveShadow = true;
          standGroup.add(tier);
          const seats = Math.floor(len / 0.65);
          for (let s = 0; s < seats; s += 2) {
            const along = -len / 2 + 0.35 + s * 0.65;
            const sx = f.x + (horizontal ? along : offset);
            const sz = f.z + (horizontal ? offset : along);
            batch.add('seat', sx, y + tierH, sz, 1, 1, 1, horizontal ? 0 : Math.PI / 2, zone.color, zone.id, level);
          }
        }
        standGroup.position.set(f.x, y, f.z);
        const floorGroup = level ? entry.floors[level - 1] : null;
        (floorGroup || group).add(standGroup);
        break;
      }

      case 'tree_row': {
        const [fx, fz] = f.from;
        const [tx, tz] = f.to;
        const len = Math.hypot(tx - fx, tz - fz);
        const count = Math.max(1, Math.floor(len / (f.spacing || 6)) + 1);
        const species = ['A', 'C', 'A'];
        const canopyTints = ['#4A7C44', '#8B7AA8', '#B5685A'];
        for (let i = 0; i < count; i += 1) {
          const t = count === 1 ? 0 : i / (count - 1);
          const px = fx + (tx - fx) * t;
          const pz = fz + (tz - fz) * t;
          const s = 0.88 + ((i * 37) % 10) / 26;
          const sp = species[i % 3];
          const rot = (i * 1.7) % (Math.PI * 2);
          batch.add(`treeTrunk${sp}`, px, 0, pz, s, s, s, rot);
          batch.add(`treeCrown${sp}`, px, 0, pz, s, s, s, rot, sp === 'C' ? canopyTints[i % 3] : null);
          batch.add('treeGrate', px, 0, pz);
          if (i % 2 === 0) batch.add('shrub', px + 1.1, 0, pz + 0.6, 0.9, 0.85, 0.9, i);
        }
        break;
      }

      case 'light': {
        const rot = Math.atan2(zone.x - f.x, zone.z - f.z);
        batch.add('lightPole', f.x, 0, f.z, 1, 1, 1, rot);
        batch.add('lightHead', f.x, 0, f.z, 1, 1, 1, rot);

        // Open-cone ShaderMaterial volumetric light beam (replaces opaque beige triangles completely)
        const coneMat = createVolumetricBeamMaterial('#FFE9B8');
        coneMat.userData.zoneId = zone.id;
        coneMaterials.push(coneMat);
        const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 5.4, 17.2, 20, 1, true), coneMat);
        cone.position.set(f.x + Math.sin(rot) * 3.1, 8.9, f.z + Math.cos(rot) * 3.1);
        cone.rotation.x = Math.cos(rot) * 0.28;
        cone.rotation.z = -Math.sin(rot) * 0.28;
        group.add(cone);

        // Secondary ground pool overlay directly onto illuminated turf target
        lightPoolFactory.addPool(group, f.x + Math.sin(rot) * 7.2, f.z + Math.cos(rot) * 7.2, 13.5, '#FFE8B0', zone.id);

        const nearest = zone.rooms.reduce((best, r) => {
          const d = Math.hypot(r.x - f.x, r.z - f.z);
          return !best || d < best.d ? { d, r } : best;
        }, null);
        if (nearest && !floodSpots.some((s) => s.roomId === nearest.r.id)) {
          floodSpots.push({ from: [f.x, f.z], to: [nearest.r.x, nearest.r.z], zoneId: zone.id, roomId: nearest.r.id });
        }
        break;
      }

      case 'hydrant': batch.add('hydrant', f.x, 0, f.z); break;
      case 'extinguisher': batch.add('extinguisher', f.x, y, f.z, 1, 1, 1, 0, null, zone.id, level); break;
      case 'sign':
        batch.add('signPost', f.x, 0, f.z);
        batch.add('signPanel', f.x, 0, f.z);
        batch.add('trashBin', f.x + 1.2, 0, f.z + 0.4);
        break;
      case 'exit': batch.add('exitSign', f.x, y, f.z, 1, 1, 1, 0, null, zone.id, level); break;

      case 'ramp': {
        const ramp = new THREE.Mesh(
          new THREE.BoxGeometry(2.2, 0.16, 4.2),
          new THREE.MeshStandardMaterial({ color: '#38BDF8', roughness: 0.55 })
        );
        ramp.position.set(f.x, 0.18, f.z);
        ramp.rotation.x = 0.05;
        ramp.receiveShadow = true;
        group.add(ramp);
        break;
      }

      case 'gate': {
        const gate = new THREE.Group();
        const pillarMat = surfaces.concreteMaterial('#E5D9B6', [1, 2]);
        const w = f.w || 8;
        const h = f.variant === 'main' ? 6.8 : 4.2;
        for (const side of [-1, 1]) {
          const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.2, h, 1.2), pillarMat);
          pillar.position.set(side * (w / 2), h / 2, 0);
          pillar.castShadow = true;
          gate.add(pillar);
        }
        // Automated access barrier boom + guard booth
        const barrier = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, w * 0.42, 8).rotateZ(Math.PI / 2),
          new THREE.MeshStandardMaterial({ color: '#EF4444', roughness: 0.35 })
        );
        barrier.position.set(-w * 0.22, 1.05, 0.4);
        const booth = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.5, 1.8), surfaces.metalCladdingMaterial('#334155', [1, 1]));
        booth.position.set(-w / 2 - 1.7, 1.25, -0.5);
        booth.castShadow = true;
        gate.add(barrier, booth);

        if (f.variant === 'main') {
          const beam = new THREE.Mesh(
            new THREE.BoxGeometry(w + 2.8, 1.45, 1.45),
            surfaces.metalCladdingMaterial('#1E293B', [2, 1])
          );
          beam.position.y = h + 0.5;
          beam.castShadow = true;

          const titleTex = makeGateTitleTexture('TRUNG TÂM THỂ THAO OLYMPIC', zone.color);
          const signFaceMat = new THREE.MeshStandardMaterial({
            map: titleTex,
            emissive: '#FFFFFF',
            emissiveMap: titleTex,
            emissiveIntensity: 0.72,
            roughness: 0.22
          });
          const titleFace = new THREE.Mesh(new THREE.PlaneGeometry(w + 2.4, 1.3), signFaceMat);
          titleFace.position.set(0, h + 0.5, 0.74);
          entry.ledMats.push(signFaceMat);

          const led = new THREE.Mesh(
            new THREE.BoxGeometry(w + 2.9, 0.16, 1.52),
            new THREE.MeshStandardMaterial({ color: zone.color, emissive: zone.color, emissiveIntensity: 0.95 })
          );
          led.position.y = h + 1.22;
          entry.ledMats.push(led.material);
          gate.add(beam, titleFace, led);
        }
        gate.position.set(f.x, 0, f.z);
        group.add(gate);
        break;
      }

      case 'parking_car': {
        const lot = new THREE.Mesh(
          new THREE.PlaneGeometry(f.w, f.d),
          surfaces.parkingLotMaterial(f.w, f.d, f.count, f.accessible || 0, f.ev || 0)
        );
        lot.rotation.x = -Math.PI / 2;
        lot.position.set(f.x, 0.05, f.z);
        lot.receiveShadow = true;
        lot.userData = { zoneId: zone.id, pick: true };
        group.add(lot);

        const perRow = Math.ceil(f.count / 2);
        const bayW = f.w / perRow;
        const palette = ['#F8FAFC', '#1E293B', '#64748B', '#DC2626', '#2563EB', '#475569', '#E2E8F0', '#94A3B8'];
        for (let i = 0; i < f.count; i += 1) {
          const row = i < perRow ? 0 : 1;
          const col = i % perRow;
          const bx = f.x - f.w / 2 + bayW * (col + 0.5);
          const bz = f.z + (row === 0 ? -f.d / 2 + 2.6 : f.d / 2 - 2.6);

          if (i >= f.count - (f.ev || 0)) {
            batch.add('evCharger', bx + bayW * 0.36, 0, bz + (row === 0 ? -2.2 : 2.2), 1, 1, 1, row === 0 ? 0 : Math.PI);
          }
          if ((i * 7) % 10 >= 8) continue; // ~75–80% occupancy
          const jitterX = (((i * 19) % 7) - 3) * 0.04;
          const jitterZ = (((i * 23) % 7) - 3) * 0.05;
          const jitterRot = (row === 0 ? 0 : Math.PI) + (((i * 13) % 9) - 4) * 0.015;
          const scaleY = i % 3 === 0 ? 1.15 : 1.0;
          batch.add('carBody', bx + jitterX, 0, bz + jitterZ, 1, scaleY, 1, jitterRot, palette[i % palette.length]);
          batch.add('carTrim', bx + jitterX, 0, bz + jitterZ, 1, scaleY, 1, jitterRot);
          batch.add('carHeadlight', bx + jitterX, 0, bz + jitterZ, 1, scaleY, 1, jitterRot);
          batch.add('carTaillight', bx + jitterX, 0, bz + jitterZ, 1, scaleY, 1, jitterRot);
        }

        // Solar carport canopy over car bays
        const solarMat = surfaces.solarMaterial();
        const canopyCols = Math.floor(f.w / 2.2);
        const solarMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(2.05, 0.09, 5.2), solarMat, canopyCols * 2);
        const m = new THREE.Matrix4();
        let idx = 0;
        for (const row of [0, 1]) {
          const cz = f.z + (row === 0 ? -f.d / 2 + 2.6 : f.d / 2 - 2.6);
          for (let c = 0; c < canopyCols; c += 1) {
            const cx = f.x - f.w / 2 + 1.1 + c * 2.2;
            m.makeTranslation(cx, 3.45, cz);
            solarMesh.setMatrixAt(idx, m);
            idx += 1;
            if (c % 3 === 0) batch.add('canopyPost', cx, 0, cz + (row === 0 ? -2.1 : 2.1), 1.2, 1.13, 1.2);
          }
        }
        solarMesh.instanceMatrix.needsUpdate = true;
        solarMesh.castShadow = true;
        group.add(solarMesh);

        // Glowing Cyan P totem sign & payment kiosk at entry
        const totem = new THREE.Mesh(
          new THREE.BoxGeometry(1.1, 3.2, 0.28),
          new THREE.MeshStandardMaterial({ color: '#0891B2', emissive: '#06B6D4', emissiveIntensity: 0.8 })
        );
        totem.position.set(f.x - f.w / 2 + 1.2, 1.6, f.z + f.d / 2 + 1.1);
        entry.ledMats.push(totem.material);
        group.add(totem);
        break;
      }

      case 'parking_moto': {
        const lot = new THREE.Mesh(
          new THREE.PlaneGeometry(f.w, f.d),
          new THREE.MeshStandardMaterial(surfaces.asphaltMaps(3, 3))
        );
        lot.rotation.x = -Math.PI / 2;
        lot.position.set(f.x, 0.05, f.z);
        lot.receiveShadow = true;
        lot.userData = { zoneId: zone.id, pick: true };
        group.add(lot);

        // Translucent twin-wall polycarbonate shelter so motorbikes & columns remain clearly visible
        const roof = new THREE.Mesh(
          new THREE.BoxGeometry(f.w, 0.1, f.d * 0.84),
          surfaces.polycarbonateMaterial('#E0F2FE')
        );
        roof.position.set(f.x, 2.88, f.z);
        roof.castShadow = true;
        group.add(roof);
        for (const sx of [-f.w / 2 + 1.2, 0, f.w / 2 - 1.2]) {
          for (const sz of [-f.d * 0.36, f.d * 0.36]) {
            batch.add('canopyPost', f.x + sx, 0, f.z + sz, 0.9, 0.94, 0.9);
          }
        }

        const perRow = Math.floor(f.w / 1.0);
        const rows = Math.min(4, Math.ceil(f.count / perRow));
        const colors = ['#E11D48', '#0F172A', '#F8FAFC', '#2563EB', '#10B981', '#F59E0B'];
        for (let r = 0; r < rows; r += 1) {
          for (let c = 0; c < perRow; c += 1) {
            const i = r * perRow + c;
            if ((i * 3) % 5 >= 3) continue;
            const bx = f.x - f.w / 2 + 0.55 + c * 1.0;
            const bz = f.z - f.d * 0.34 + r * ((f.d * 0.68) / Math.max(1, rows - 1));
            const rotJitter = (((i * 11) % 7) - 3) * 0.035;
            batch.add('bike', bx, 0, bz, 1, 1, 1, rotJitter, colors[i % colors.length]);
          }
        }
        break;
      }

      default:
        break;
    }
  }

  function setDim(object, dim) {
    object.traverse((child) => {
      const materials = child.material ? (Array.isArray(child.material) ? child.material : [child.material]) : [];
      for (const m of materials) {
        if (m.isShaderMaterial) continue;
        if (m.userData.baseOpacity === undefined) {
          m.userData.baseOpacity = m.opacity;
          m.userData.baseTransparent = m.transparent;
        }
        m.transparent = dim ? true : m.userData.baseTransparent;
        m.opacity = dim ? m.userData.baseOpacity * 0.34 : m.userData.baseOpacity;
        m.needsUpdate = true;
      }
    });
  }

  function updateCutawayWallOpacity() {
    if (!built) return;
    for (const [id, entry] of built.zones) {
      const selected = state.selectedZoneId === id;
      for (const sideGroup of entry.facadeSides) {
        const wallMesh = sideGroup.children[0];
        if (!wallMesh?.material) continue;
        if (!selected) {
          wallMesh.material.opacity = wallMesh.material.userData.origOpacity ?? (entry.floors.indexOf(sideGroup.parent) === 0 ? 0.24 : 0.34);
          if (wallMesh.material.userData.origOpacity === undefined) {
            wallMesh.material.userData.origOpacity = wallMesh.material.opacity;
          }
        } else {
          const toCamX = camera.position.x - entry.zone.x;
          const toCamZ = camera.position.z - entry.zone.z;
          const dot = toCamX * sideGroup.userData.nx + toCamZ * sideGroup.userData.nz;
          wallMesh.material.opacity = dot > 0 ? 0.07 : 0.26;
        }
        wallMesh.material.userData.baseOpacity = wallMesh.material.opacity;
      }
    }
  }

  function applyState(immediate = false) {
    if (!built) return;
    const targetMode = state.lighting || 'day';
    const toCfg = LIGHTING_PRESETS[targetMode] || LIGHTING_PRESETS.day;
    const envEntry = envLib.envs[targetMode] || envLib.envs.day;
    scene.environment = envEntry.envMap;
    scene.environmentIntensity = toCfg.envIntensity;
    skyDomeMat.map = envEntry.skyTexture;
    skyDomeMat.needsUpdate = true;

    if (immediate || targetMode === activeLightMode || prefersReducedMotion() || capture) {
      activeLightMode = targetMode;
      lightAnim = null;
      applyLightingState({
        scene, renderer, hemi, sun, rimLight, bloomPass, archvizPass, ssaoPass, built, fromCfg: toCfg, toCfg, t: 1
      });
    } else {
      const fromCfg = LIGHTING_PRESETS[activeLightMode] || LIGHTING_PRESETS.day;
      activeLightMode = targetMode;
      lightAnim = { fromCfg, toCfg, start: performance.now(), duration: 1500 };
    }

    const night = targetMode === 'night';
    const dusk = targetMode === 'sunset';
    sun.castShadow = !night;

    const isZoneOpen = (zoneId) => {
      const z = built.zones.get(zoneId)?.zone;
      if (!z) return true;
      const s = state.statusAt[zoneId] || z.status;
      return s === 'Open' || s === 'Full';
    };

    for (const [id, entry] of built.zones) {
      const open = isZoneOpen(id);
      const glow = night ? (open ? 1.05 : 0) : dusk ? (open ? 0.45 : 0) : 0;
      for (const m of entry.windowMats) m.emissiveIntensity = glow;
      for (const m of entry.ledMats) m.emissiveIntensity = night ? (open ? 1.85 : 0.25) : dusk ? 1.15 : 0.65;
      for (const m of entry.interiorLightMats) m.emissiveIntensity = open ? (night ? 1.9 : dusk ? 1.2 : 0.55) : 0;
      for (const l of entry.interiorLights) l.intensity = open ? (night ? 28 : dusk ? 12 : 3) : 0;

      const selected = state.selectedZoneId === id;
      const floor = selected && state.floor ? state.floor : null;
      entry.floors.forEach((g, index) => { g.visible = floor == null || index + 1 <= floor; });
      if (entry.roof) entry.roof.visible = !selected;
      setDim(entry.group, state.selectedZoneId != null && !selected);
    }
    updateCutawayWallOpacity();

    // Update floor visibility of instanced interior equipment (cutaway dollhouse mode)
    const zeroMat = new THREE.Matrix4().makeScale(0, 0, 0);
    for (const mesh of Object.values(built.instances)) {
      const { items, baseMatrices } = mesh.userData;
      if (!items) continue;
      let changed = false;
      items.forEach((it, idx) => {
        if (!it.zoneId) return;
        const selected = state.selectedZoneId === it.zoneId;
        const hiddenByFloor = selected && state.floor && it.floor > state.floor;
        mesh.setMatrixAt(idx, hiddenByFloor ? zeroMat : baseMatrices[idx]);
        changed = true;
      });
      if (changed) mesh.instanceMatrix.needsUpdate = true;
    }

    // Stadium SpotLights, Volumetric Fresnel Cones, Ground Light Pools, Car Lights & Beacons
    if (built.ctxMat) built.ctxMat.emissiveIntensity = night ? 0.62 : dusk ? 0.22 : 0;
    for (const light of built.floodLights) {
      const open = isZoneOpen(light.userData.zoneId);
      light.intensity = night && open ? 235 : dusk && open ? 72 : 0;
    }
    for (const coneMat of built.coneMaterials) {
      const open = isZoneOpen(coneMat.userData.zoneId);
      coneMat.uniforms.uOpacity.value = night && open ? 0.11 : dusk && open ? 0.038 : 0.0;
    }
    for (const poolMat of built.lightPools) {
      const open = poolMat.userData.zoneId ? isZoneOpen(poolMat.userData.zoneId) : true;
      poolMat.opacity = night && open ? 0.48 : dusk && open ? 0.18 : 0.0;
    }
    for (const bm of built.beaconMats) {
      bm.emissiveIntensity = night ? 2.6 : dusk ? 1.2 : 0.25;
    }
    for (const tc of built.trafficCars) {
      tc.hlMat.emissiveIntensity = night ? 2.4 : dusk ? 1.2 : 0;
      tc.tlMat.emissiveIntensity = night ? 2.1 : dusk ? 1.0 : 0;
    }

    const anyOutdoorOpen = built.floodLights.some((l) => isZoneOpen(l.userData.zoneId));
    if (built.instances.lightHead) built.instances.lightHead.material.emissiveIntensity = night && anyOutdoorOpen ? 2.8 : dusk && anyOutdoorOpen ? 0.9 : 0;
    if (built.instances.streetLampHead) built.instances.streetLampHead.material.emissiveIntensity = night ? 2.3 : dusk ? 0.95 : 0;
    if (built.instances.gardenLightHead) built.instances.gardenLightHead.material.emissiveIntensity = night ? 2.0 : dusk ? 0.85 : 0;
    if (built.instances.carHeadlight) built.instances.carHeadlight.material.emissiveIntensity = night ? 1.8 : dusk ? 0.7 : 0;
    if (built.instances.carTaillight) built.instances.carTaillight.material.emissiveIntensity = night ? 1.6 : dusk ? 0.65 : 0;
    if (built.instances.signPanel) built.instances.signPanel.material.emissiveIntensity = night ? 0.95 : 0.22;

    if (state.campus) labelManager.updateNamesAndSubs(state.campus, state.labelSubs, state.statusAt);

    drawRoute();
    renderer.shadowMap.needsUpdate = true;
    invalidate();
  }

  function drawRoute() {
    const group = built.groups.route;
    disposeObject(group);
    group.clear();
    routeTex = null;
    const points = state.route?.points;
    if (!points || points.length < 2) return;
    const path = new THREE.CurvePath();
    let totalLen = 0;
    for (let i = 1; i < points.length; i += 1) {
      const a = new THREE.Vector3(points[i - 1][0], 0.48, points[i - 1][1]);
      const b = new THREE.Vector3(points[i][0], 0.48, points[i][1]);
      totalLen += a.distanceTo(b);
      path.add(new THREE.LineCurve3(a, b));
    }
    routeTex = makeRouteArrowTexture();
    routeTex.repeat.set(Math.max(4, Math.round(totalLen / 3.2)), 1);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(path, Math.max(24, points.length * 14), 0.48, 8, false),
      new THREE.MeshStandardMaterial({
        map: routeTex,
        emissive: '#F59E0B',
        emissiveMap: routeTex,
        emissiveIntensity: 0.95,
        roughness: 0.25
      })
    );
    group.add(tube);

    const pin = (p, color) => {
      const m = new THREE.Mesh(
        new THREE.ConeGeometry(1.15, 3.1, 16).rotateX(Math.PI),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.75 })
      );
      m.position.set(p[0], 3.1, p[1]);
      group.add(m);
    };
    pin(points[0], '#22C55E');
    pin(points[points.length - 1], '#EF4444');
  }

  function flyTo(target, position, duration = 900) {
    flyoverSpline = null;
    archvizPass.uniforms.uTiltShift.value = 0;
    if (prefersReducedMotion() || capture) {
      controls.target.copy(target);
      camera.position.copy(position);
      camAnim = null;
      invalidate();
      return;
    }
    camAnim = {
      fromT: controls.target.clone(),
      toT: target,
      fromP: camera.position.clone(),
      toP: position,
      start: performance.now(),
      duration
    };
    invalidate();
  }

  function focusZone(zoneId) {
    const entry = built?.zones.get(zoneId);
    if (!entry) return;
    const { zone } = entry;
    const span = Math.max(zone.width, zone.depth);
    const height = zone.floors > 0 ? getFloorY(zone, state.floor || 1) + 2 : 0;
    const target = new THREE.Vector3(zone.x, height, zone.z);
    const distance = Math.max(38, span * 1.18);
    const direction = new THREE.Vector3(0.48, 0.72, 0.74).normalize();
    flyTo(target, target.clone().add(direction.multiplyScalar(distance)));
  }

  function resetView(tour = false) {
    if (tour && !prefersReducedMotion() && !capture) {
      if (flyoverSpline) {
        flyoverSpline = null;
        archvizPass.uniforms.uTiltShift.value = 0;
        flyTo(HOME.target.clone(), HOME.position.clone(), 800);
        return;
      }
      const curve = new THREE.CatmullRomCurve3([
        HOME.position.clone(),
        new THREE.Vector3(-95, 78, 95),
        new THREE.Vector3(-105, 72, -85),
        new THREE.Vector3(85, 80, -95),
        HOME.position.clone()
      ], true);
      flyoverSpline = { curve, start: performance.now(), duration: 20000 };
      archvizPass.uniforms.uTiltShift.value = 1.0;
      invalidate();
      return;
    }
    flyTo(HOME.target.clone(), HOME.position.clone());
  }

  /** Smoothly rotates camera horizontally to face North (-Z) keeping height, zoom & target intact. */
  function faceNorth() {
    const offset = camera.position.clone().sub(controls.target);
    const horizDist = Math.hypot(offset.x, offset.z) || 40;
    const targetPos = new THREE.Vector3(
      controls.target.x,
      camera.position.y,
      controls.target.z + horizDist
    );
    flyTo(controls.target.clone(), targetPos, 620);
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerDown = null;
  let hoverRequest = null;

  function pick(event) {
    if (!built) return null;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(built.pickables.filter((m) => isVisible(m)), false);
    const hit = hits.find((h) => !h.object.userData.wall || state.selectedZoneId !== h.object.userData.zoneId);
    if (!hit) return null;

    const tx = event.clientX - rect.left;
    const ty = event.clientY - rect.top;
    const tipW = 224;
    const tipH = 58;
    const boxL = tx + tipW + 24 > rect.width ? tx - tipW - 14 : tx + 14;
    let boxT = ty + tipH + 24 > rect.height ? ty - tipH - 14 : ty + 14;
    for (const sb of labelManager.getPlacedBoxes()) {
      if (boxL < sb.r && boxL + tipW > sb.l && boxT < sb.b && boxT + tipH > sb.t) {
        boxT = sb.t - tipH - 8;
        if (boxT < 8) boxT = sb.b + 8;
      }
    }
    return {
      zoneId: hit.object.userData.zoneId,
      roomId: hit.object.userData.roomId || null,
      x: Math.max(8, Math.min(rect.width - tipW - 8, boxL)),
      y: Math.max(8, Math.min(rect.height - tipH - 8, boxT))
    };
  }

  function isVisible(object) {
    for (let o = object; o; o = o.parent) if (!o.visible) return false;
    return true;
  }

  function onPointerMove(event) {
    if (event.pointerType === 'touch') return;
    if (hoverRequest) return;
    hoverRequest = requestAnimationFrame(() => {
      hoverRequest = null;
      const hit = pick(event);
      const key = hit ? `${hit.zoneId}:${hit.roomId}` : '';
      renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
      if (key !== hoverKey || hit) onHover?.(hit);
      hoverKey = key;
    });
  }
  function onPointerLeave() { hoverKey = ''; onHover?.(null); }
  function onPointerDown(event) { pointerDown = { x: event.clientX, y: event.clientY }; }
  function onPointerUp(event) {
    if (!pointerDown) return;
    const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
    pointerDown = null;
    if (moved > 6) return;
    const hit = pick(event);
    onSelect?.(hit ? { zoneId: hit.zoneId, roomId: hit.roomId } : null);
  }
  function onContextLostEvent(event) {
    event.preventDefault();
    running = false;
    onContextLost?.();
  }

  const canvas = renderer.domElement;
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('webglcontextlost', onContextLostEvent);

  function resize() {
    const { clientWidth: w, clientHeight: h } = container;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    pipeline.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    invalidate();
    schedule();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  let visible = true;
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) { invalidate(); schedule(); }
  });
  intersection.observe(container);
  const onVisibility = () => { if (!document.hidden) { invalidate(); schedule(); } };
  document.addEventListener('visibilitychange', onVisibility);

  function schedule() {
    if (!frame && running) frame = requestAnimationFrame(tick);
  }

  let lastTick = performance.now();
  function tick(now) {
    frame = 0;
    if (!running || document.hidden || !visible) return;
    const dt = Math.min(0.05, Math.max(0.001, (now - lastTick) / 1000));
    const dtMs = dt * 1000;
    lastTick = now;

    // Adaptive quality / DPR monitor
    frameTimes.push(dtMs);
    if (frameTimes.length > 28) {
      const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      frameTimes = [];
      if (avg > 28 && currentDpr > 1.0) {
        currentDpr = Math.max(1.0, currentDpr - 0.25);
        renderer.setPixelRatio(currentDpr);
      } else if (avg < 14 && currentDpr < maxDpr) {
        currentDpr = Math.min(maxDpr, currentDpr + 0.25);
        renderer.setPixelRatio(currentDpr);
      }
    }

    if (lightAnim) {
      const lt = Math.min(1, (now - lightAnim.start) / lightAnim.duration);
      const ease = lt < 0.5 ? 2 * lt * lt : 1 - Math.pow(-2 * lt + 2, 2) / 2;
      applyLightingState({
        scene, renderer, hemi, sun, rimLight, bloomPass, archvizPass, ssaoPass, built,
        fromCfg: lightAnim.fromCfg, toCfg: lightAnim.toCfg, t: ease
      });
      renderer.shadowMap.needsUpdate = true;
      if (lt >= 1) lightAnim = null;
      dirty = true;
    }

    if (flyoverSpline) {
      const ft = ((now - flyoverSpline.start) % flyoverSpline.duration) / flyoverSpline.duration;
      flyoverSpline.curve.getPointAt(ft, camera.position);
      controls.target.set(0, 2, 2);
      dirty = true;
    } else if (camAnim) {
      const t = Math.min(1, (now - camAnim.start) / camAnim.duration);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      controls.target.lerpVectors(camAnim.fromT, camAnim.toT, e);
      camera.position.lerpVectors(camAnim.fromP, camAnim.toP, e);
      if (t >= 1) camAnim = null;
      dirty = true;
    }

    const hasRoute = Boolean(routeTex && state.route?.points?.length > 1);
    const dist = camera.position.distanceTo(controls.target);
    const animateDynamic = !prefersReducedMotion() && !capture && (hasRoute || dist < 195 || state.selectedZoneId != null);
    if (animateDynamic) {
      const sec = now * 0.001;
      windUniform.value = sec;
      if (built) {
        for (const wm of built.waterMaterials) wm.userData.uTime.value = sec;
        for (const cm of built.coneMaterials) cm.uniforms.uTime.value = sec;
        for (const tc of built.trafficCars) {
          tc.group.position.x += tc.dir * tc.speed * dt;
          if (tc.group.position.x > tc.limit) tc.group.position.x = -tc.limit;
          else if (tc.group.position.x < -tc.limit) tc.group.position.x = tc.limit;
        }
      }
      if (routeTex) routeTex.offset.x = -sec * 1.4;
      dirty = true;
    }

    const moving = controls.update();
    if (dirty || moving) {
      dirty = false;
      if (built) {
        built.groups.detail.visible = dist < DETAIL_DISTANCE || state.selectedZoneId != null;
        const showInterior = dist < 175 || state.selectedZoneId != null;
        for (const entry of built.zones.values()) {
          for (const ig of entry.interiorGroups) ig.visible = showInterior;
        }
        if (state.selectedZoneId != null) updateCutawayWallOpacity();
      }
      composer.render();
      labelManager.layout({ renderer, camera, controls, built, selectedZoneId: state.selectedZoneId, now });

      const az = controls.getAzimuthalAngle();
      const worldHeight = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const mpp = worldHeight / Math.max(1, container.clientHeight);
      if (Math.abs(az - lastAzimuthSent) > 0.0015 || Math.abs(mpp - lastMppSent) > 0.002) {
        lastAzimuthSent = az;
        lastMppSent = mpp;
        onCameraChange?.({ azimuth: az, metersPerPixel: mpp });
      }
    }
    if (camAnim || flyoverSpline || lightAnim || moving || dirty) schedule();
  }

  controls.addEventListener('change', schedule);
  controls.addEventListener('start', schedule);
  const wake = () => { invalidate(); schedule(); };

  function geometrySignature(campus) {
    return JSON.stringify(campus.zones.map((z) => [
      z.id, z.code, z.name, z.color, z.x, z.z, z.width, z.depth, z.floors,
      z.buildingWidth, z.buildingDepth, z.features.length,
      z.rooms.map((r) => [r.id, r.kind, r.x, r.z, r.width, r.depth, r.floor])
    ]));
  }

  resize();

  return {
    sync(next) {
      const campusChanged = next.campus && next.campus !== state.campus;
      state = { ...state, ...next };
      if (campusChanged) {
        const signature = geometrySignature(next.campus);
        if (signature !== state.signature) {
          state.signature = signature;
          build(next.campus);
        } else {
          for (const zone of next.campus.zones) {
            const entry = built?.zones.get(zone.id);
            if (entry) entry.zone = zone;
          }
          labelManager.updateNamesAndSubs(next.campus, state.labelSubs, state.statusAt);
        }
      }
      applyState(false);
      wake();
    },
    focusZone(zoneId) { focusZone(zoneId); wake(); },
    resetView(tour = false) { resetView(tour); wake(); },
    faceNorth() { faceNorth(); wake(); },
    zoomBy(factor) {
      const offset = camera.position.clone().sub(controls.target).multiplyScalar(factor);
      const len = THREE.MathUtils.clamp(offset.length(), controls.minDistance, controls.maxDistance);
      camera.position.copy(controls.target).add(offset.setLength(len));
      wake();
    },
    rotateBy(radians) {
      const offset = camera.position.clone().sub(controls.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), radians);
      camera.position.copy(controls.target).add(offset);
      controls.update();
      wake();
    },
    dispose() {
      running = false;
      cancelAnimationFrame(frame);
      if (hoverRequest) cancelAnimationFrame(hoverRequest);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('webglcontextlost', onContextLostEvent);
      controls.dispose();
      clearWorld();
      envLib.dispose();
      pipeline.dispose();
      disposeObject(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    }
  };
}

export function disposeObject(root) {
  const seen = new Set();
  root.traverse((object) => {
    if (object.geometry && !seen.has(object.geometry)) {
      seen.add(object.geometry);
      object.geometry.dispose();
    }
    const materials = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
    for (const material of materials) {
      if (seen.has(material)) continue;
      seen.add(material);
      for (const value of Object.values(material)) if (value && value.isTexture) value.dispose();
      material.dispose();
    }
    if (object.isInstancedMesh) object.dispose?.();
  });
}
