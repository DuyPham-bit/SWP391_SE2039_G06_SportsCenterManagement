import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Architectural & landscape prop library, 4 botanical vegetation families with vertex wind sway,
 * detailed vehicles w/ night head/taillights, football/pickleball infrastructure, utilities & external boulevard.
 * Zero human models anywhere in the scene.
 */

function mergeParts(parts) {
  const geos = parts.map((g) => {
    const nonIndexed = g.index ? g.toNonIndexed() : g.clone();
    nonIndexed.computeVertexNormals();
    return nonIndexed;
  });
  return mergeGeometries(geos, false);
}

function attachWindShader(material, windUniform, amplitude = 0.14) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWindTime = windUniform;
    shader.vertexShader = `uniform float uWindTime;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       float hFactor = clamp((position.y - 1.2) / 5.5, 0.0, 1.0);
       float phase = uWindTime * 1.7 + position.x * 0.65 + position.z * 0.52;
       transformed.x += sin(phase) * ${amplitude.toFixed(3)} * hFactor;
       transformed.z += cos(phase * 0.85) * ${(amplitude * 0.72).toFixed(3)} * hFactor;`
    );
  };
  return material;
}

export function createPropDefinitions(windUniform) {
  const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0.05, ...extra });

  // 1. Broad-canopy Tropical Shade Tree (branching trunk + irregular asymmetric multi-cluster canopy, zero sphere/cone primitives)
  const trunkGeoA = () => mergeParts([
    new THREE.CylinderGeometry(0.18, 0.36, 3.6, 8).translate(0, 1.8, 0),
    new THREE.CylinderGeometry(0.1, 0.17, 2.4, 6).rotateZ(0.54).translate(-0.72, 3.8, 0.18),
    new THREE.CylinderGeometry(0.1, 0.16, 2.3, 6).rotateZ(-0.48).translate(0.68, 3.7, -0.22),
    new THREE.CylinderGeometry(0.09, 0.15, 2.2, 6).rotateX(0.46).translate(0.08, 3.9, 0.64),
    new THREE.CylinderGeometry(0.08, 0.14, 2.0, 6).rotateX(-0.42).translate(-0.14, 4.0, -0.56)
  ]);
  const crownGeoA = () => {
    const parts = [];
    const blobs = [
      [0, 5.8, 0, 1.9, 1.05, 1.85],
      [-1.5, 5.0, 0.45, 1.45, 0.9, 1.4],
      [1.45, 4.9, -0.35, 1.4, 0.88, 1.38],
      [0.35, 5.1, 1.45, 1.32, 0.82, 1.3],
      [-0.45, 5.2, -1.35, 1.28, 0.8, 1.25],
      [0.2, 6.6, 0.1, 1.35, 0.82, 1.3],
      [-0.95, 6.1, -0.45, 1.05, 0.72, 1.05]
    ];
    for (const [x, y, z, sx, sy, sz] of blobs) {
      parts.push(new THREE.IcosahedronGeometry(1.0, 1).scale(sx, sy, sz).translate(x, y, z));
    }
    return mergeParts(parts);
  };

  // 2. Royal Palm Tree (~8 m tall with curved ringed trunk & 8 arching pinnate fronds)
  const trunkGeoP = () => mergeParts([
    new THREE.CylinderGeometry(0.18, 0.3, 3.4, 8).rotateZ(0.04).translate(-0.08, 1.7, 0),
    new THREE.CylinderGeometry(0.14, 0.18, 3.6, 8).rotateZ(-0.03).translate(-0.1, 5.0, 0.04),
    new THREE.CylinderGeometry(0.16, 0.15, 0.7, 8).translate(-0.06, 6.8, 0.04)
  ]);
  const crownGeoP = () => {
    const fronds = [];
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      const droop = i % 2 === 0 ? 0.38 : 0.62;
      const g = new THREE.BoxGeometry(0.32, 0.05, 2.35);
      g.translate(0, 0, 1.15);
      g.rotateX(droop);
      g.rotateY(a);
      g.translate(-0.06, 7.05, 0.04);
      fronds.push(g);
    }
    return mergeParts(fronds);
  };

  // 3. Flowering Boulevard Trees (Flamboyant & Lagerstroemia — layered spreading crown tinted via instance color)
  const trunkGeoC = () => mergeParts([
    new THREE.CylinderGeometry(0.14, 0.28, 2.9, 7).rotateZ(0.12).translate(-0.18, 1.45, 0),
    new THREE.CylinderGeometry(0.1, 0.16, 1.9, 6).rotateZ(-0.36).translate(0.36, 3.1, 0.1),
    new THREE.CylinderGeometry(0.09, 0.15, 1.8, 6).rotateZ(0.38).translate(-0.55, 3.2, -0.1)
  ]);
  const crownGeoC = () => mergeParts([
    new THREE.IcosahedronGeometry(1.35, 1).scale(1.45, 0.56, 1.35).translate(-0.65, 4.35, 0.15),
    new THREE.IcosahedronGeometry(1.25, 1).scale(1.35, 0.54, 1.3).translate(0.75, 4.15, -0.2),
    new THREE.IcosahedronGeometry(1.15, 1).scale(1.3, 0.52, 1.25).translate(0.05, 4.95, 0.12)
  ]);

  // 4. Sculpted Multi-Part Sedan / SUV / Pickup Body + Cabin Glass + Tires + Head/Taillights
  const carBodyGeo = () => mergeParts([
    new THREE.BoxGeometry(1.84, 0.48, 4.42).translate(0, 0.5, 0),
    new THREE.BoxGeometry(1.56, 0.46, 2.18).translate(0, 0.94, -0.16),
    new THREE.BoxGeometry(1.76, 0.16, 0.9).rotateX(0.16).translate(0, 0.72, 1.32),
    // Side mirrors
    new THREE.BoxGeometry(0.14, 0.1, 0.18).translate(-0.94, 0.84, 0.55),
    new THREE.BoxGeometry(0.14, 0.1, 0.18).translate(0.94, 0.84, 0.55)
  ]);
  const carTrimGeo = () => mergeParts([
    new THREE.BoxGeometry(1.6, 0.36, 2.04).translate(0, 0.95, -0.16),
    new THREE.CylinderGeometry(0.32, 0.32, 0.22, 12).rotateZ(Math.PI / 2).translate(-0.89, 0.32, 1.35),
    new THREE.CylinderGeometry(0.32, 0.32, 0.22, 12).rotateZ(Math.PI / 2).translate(0.89, 0.32, 1.35),
    new THREE.CylinderGeometry(0.32, 0.32, 0.22, 12).rotateZ(Math.PI / 2).translate(-0.89, 0.32, -1.35),
    new THREE.CylinderGeometry(0.32, 0.32, 0.22, 12).rotateZ(Math.PI / 2).translate(0.89, 0.32, -1.35)
  ]);
  const carHeadlightGeo = () => mergeParts([
    new THREE.BoxGeometry(0.32, 0.11, 0.08).translate(-0.62, 0.54, 2.22),
    new THREE.BoxGeometry(0.32, 0.11, 0.08).translate(0.62, 0.54, 2.22)
  ]);
  const carTaillightGeo = () => mergeParts([
    new THREE.BoxGeometry(0.34, 0.1, 0.08).translate(-0.62, 0.58, -2.22),
    new THREE.BoxGeometry(0.34, 0.1, 0.08).translate(0.62, 0.58, -2.22)
  ]);

  // Motorbike / Scooter
  const bikeGeo = () => mergeParts([
    new THREE.BoxGeometry(0.36, 0.55, 1.45).translate(0, 0.52, 0),
    new THREE.BoxGeometry(0.28, 0.55, 0.28).rotateX(-0.25).translate(0, 0.85, 0.52),
    new THREE.BoxGeometry(0.68, 0.07, 0.08).translate(0, 1.08, 0.46),
    new THREE.CylinderGeometry(0.24, 0.24, 0.12, 10).rotateZ(Math.PI / 2).translate(0, 0.24, 0.58),
    new THREE.CylinderGeometry(0.24, 0.24, 0.12, 10).rotateZ(Math.PI / 2).translate(0, 0.24, -0.58)
  ]);

  return {
    treeTrunkA: { geometry: trunkGeoA, material: () => std('#5C432B', { roughness: 0.9 }), castShadow: true },
    treeCrownA: { geometry: crownGeoA, material: () => attachWindShader(std('#3B6D38', { roughness: 0.82 }), windUniform, 0.16), castShadow: true },
    treeTrunkP: { geometry: trunkGeoP, material: () => std('#7C6A55', { roughness: 0.86 }), castShadow: true },
    treeCrownP: { geometry: crownGeoP, material: () => attachWindShader(std('#2D6E3E', { roughness: 0.72 }), windUniform, 0.2), castShadow: true },
    treeTrunkC: { geometry: trunkGeoC, material: () => std('#664C34', { roughness: 0.88 }), castShadow: true },
    treeCrownC: { geometry: crownGeoC, material: () => attachWindShader(std('#E2ECE5', { roughness: 0.78 }), windUniform, 0.17), castShadow: true },
    treeGrate: {
      geometry: () => new THREE.BoxGeometry(1.45, 0.05, 1.45).translate(0, 0.06, 0),
      material: () => std('#334155', { roughness: 0.6, metalness: 0.55 })
    },
    shrub: {
      geometry: () => mergeParts([
        new THREE.IcosahedronGeometry(0.55, 1).scale(1.3, 0.72, 1.1).translate(0, 0.38, 0),
        new THREE.IcosahedronGeometry(0.42, 1).scale(1.1, 0.68, 1.1).translate(0.35, 0.32, 0.15)
      ]),
      material: () => attachWindShader(std('#3F743B', { roughness: 0.84 }), windUniform, 0.06),
      castShadow: true
    },
    flowerBed: {
      geometry: () => mergeParts([
        new THREE.BoxGeometry(1.9, 0.28, 0.9).translate(0, 0.14, 0),
        new THREE.BoxGeometry(1.72, 0.18, 0.72).translate(0, 0.32, 0)
      ]),
      material: () => std('#FFFFFF', { roughness: 0.82 }),
      detail: true
    },
    planterBox: {
      geometry: () => new THREE.BoxGeometry(1.6, 0.52, 0.9).translate(0, 0.26, 0),
      material: () => std('#CBD5E1', { roughness: 0.75 }),
      castShadow: true
    },
    indoorPlant: {
      geometry: () => mergeParts([
        new THREE.CylinderGeometry(0.28, 0.22, 0.48, 8).translate(0, 0.24, 0),
        new THREE.IcosahedronGeometry(0.52, 1).scale(1.0, 1.4, 1.0).translate(0, 1.05, 0)
      ]),
      material: () => std('#228B4E', { roughness: 0.75 }),
      detail: true
    },
    canopyPost: {
      geometry: () => new THREE.CylinderGeometry(0.09, 0.11, 3.05, 8).translate(0, 1.52, 0),
      material: () => std('#CBD5E1', { metalness: 0.55, roughness: 0.35 }),
      castShadow: true
    },
    // 18 m floodlight lattice pole + access ladder + maintenance cage platform
    lightPole: {
      geometry: () => mergeParts([
        new THREE.CylinderGeometry(0.14, 0.26, 17.8, 10).translate(0, 8.9, 0),
        new THREE.BoxGeometry(3.1, 0.18, 0.26).translate(0, 17.6, 0),
        new THREE.BoxGeometry(1.6, 0.1, 0.95).translate(0, 16.9, 0), // service platform
        new THREE.BoxGeometry(0.12, 16.6, 0.08).translate(-0.22, 8.4, -0.22), // ladder rail L
        new THREE.BoxGeometry(0.12, 16.6, 0.08).translate(0.22, 8.4, -0.22) // ladder rail R
      ]),
      material: () => std('#94A3B8', { metalness: 0.65, roughness: 0.32 }),
      castShadow: true
    },
    // 4 high-intensity stadium floodlight projectors per mast
    lightHead: {
      geometry: () => mergeParts([
        new THREE.BoxGeometry(0.62, 0.38, 0.45).translate(-1.05, 17.88, 0.12),
        new THREE.BoxGeometry(0.62, 0.38, 0.45).translate(-0.35, 17.88, 0.12),
        new THREE.BoxGeometry(0.62, 0.38, 0.45).translate(0.35, 17.88, 0.12),
        new THREE.BoxGeometry(0.62, 0.38, 0.45).translate(1.05, 17.88, 0.12)
      ]),
      material: () => std('#F8FAFC', { emissive: '#FFF4D6', emissiveIntensity: 0, roughness: 0.18 })
    },
    // 8 m boulevard street lights + 1 m walkway bollard garden lights
    streetLampPole: {
      geometry: () => mergeParts([
        new THREE.CylinderGeometry(0.08, 0.14, 8.0, 8).translate(0, 4.0, 0),
        new THREE.BoxGeometry(0.12, 0.12, 1.55).translate(0, 7.95, 0.65)
      ]),
      material: () => std('#475569', { metalness: 0.6, roughness: 0.35 }),
      castShadow: true
    },
    streetLampHead: {
      geometry: () => new THREE.BoxGeometry(0.42, 0.14, 0.7).translate(0, 7.88, 1.25),
      material: () => std('#FFFBEB', { emissive: '#FFE099', emissiveIntensity: 0 })
    },
    gardenLightPole: {
      geometry: () => new THREE.CylinderGeometry(0.07, 0.08, 0.95, 8).translate(0, 0.48, 0),
      material: () => std('#334155', { metalness: 0.55, roughness: 0.38 }),
      detail: true
    },
    gardenLightHead: {
      geometry: () => new THREE.CylinderGeometry(0.08, 0.08, 0.16, 8).translate(0, 0.98, 0),
      material: () => std('#FEF3C7', { emissive: '#FDE68A', emissiveIntensity: 0 }),
      detail: true
    },
    bollard: {
      geometry: () => new THREE.CylinderGeometry(0.06, 0.07, 0.85, 8).translate(0, 0.42, 0),
      material: () => std('#CBD5E1', { metalness: 0.78, roughness: 0.24 }),
      detail: true
    },
    bench: {
      geometry: () => mergeParts([
        new THREE.BoxGeometry(1.8, 0.08, 0.52).translate(0, 0.46, 0),
        new THREE.BoxGeometry(1.8, 0.45, 0.08).translate(0, 0.72, -0.22),
        new THREE.BoxGeometry(0.1, 0.45, 0.5).translate(-0.75, 0.23, 0),
        new THREE.BoxGeometry(0.1, 0.45, 0.5).translate(0.75, 0.23, 0)
      ]),
      material: () => std('#8B5A2B', { roughness: 0.65 }),
      detail: true,
      castShadow: true
    },
    trashBin: {
      geometry: () => mergeParts([
        new THREE.BoxGeometry(0.45, 0.84, 0.42).translate(-0.24, 0.42, 0),
        new THREE.BoxGeometry(0.45, 0.84, 0.42).translate(0.24, 0.42, 0)
      ]),
      material: () => std('#334155', { metalness: 0.4, roughness: 0.45 }),
      detail: true
    },
    hydrant: {
      geometry: () => mergeParts([
        new THREE.CylinderGeometry(0.2, 0.25, 0.85, 10).translate(0, 0.42, 0),
        new THREE.SphereGeometry(0.21, 10, 8).translate(0, 0.85, 0)
      ]),
      material: () => std('#DC2626', { roughness: 0.4, metalness: 0.25 }),
      detail: true
    },
    extinguisher: {
      geometry: () => new THREE.CylinderGeometry(0.12, 0.12, 0.62, 8).translate(0, 0.31, 0),
      material: () => std('#EF4444', { roughness: 0.35 }),
      detail: true
    },
    securityCam: {
      geometry: () => mergeParts([
        new THREE.BoxGeometry(0.12, 0.12, 0.32).translate(0, 0, 0.14),
        new THREE.CylinderGeometry(0.06, 0.06, 0.22, 8).rotateX(Math.PI / 2).translate(0, 0.02, 0.28)
      ]),
      material: () => std('#E2E8F0', { roughness: 0.3, metalness: 0.5 }),
      detail: true
    },
    acUnit: {
      geometry: () => mergeParts([
        new THREE.BoxGeometry(0.95, 0.68, 0.38).translate(0, 0.34, 0),
        new THREE.CylinderGeometry(0.22, 0.22, 0.05, 10).rotateX(Math.PI / 2).translate(-0.18, 0.34, 0.2)
      ]),
      material: () => std('#CBD5E1', { roughness: 0.45, metalness: 0.3 }),
      detail: true
    },
    elecCabinet: {
      geometry: () => new THREE.BoxGeometry(0.85, 1.45, 0.42).translate(0, 0.72, 0),
      material: () => std('#64748B', { roughness: 0.48, metalness: 0.45 }),
      detail: true
    },
    bikeRack: {
      geometry: () => mergeParts([
        new THREE.CylinderGeometry(0.03, 0.03, 0.75, 6).translate(-0.5, 0.38, 0),
        new THREE.CylinderGeometry(0.03, 0.03, 0.75, 6).translate(0.5, 0.38, 0),
        new THREE.CylinderGeometry(0.03, 0.03, 2.2, 6).rotateZ(Math.PI / 2).translate(0, 0.75, 0)
      ]),
      material: () => std('#CBD5E1', { metalness: 0.75, roughness: 0.25 }),
      detail: true
    },
    signPost: {
      geometry: () => mergeParts([
        new THREE.CylinderGeometry(0.07, 0.08, 2.4, 8).translate(-0.55, 1.2, 0),
        new THREE.CylinderGeometry(0.07, 0.08, 2.4, 8).translate(0.55, 1.2, 0)
      ]),
      material: () => std('#334155', { metalness: 0.5 })
    },
    signPanel: {
      geometry: () => new THREE.BoxGeometry(1.45, 0.95, 0.12).translate(0, 2.15, 0),
      material: () => std('#0F172A', { emissive: '#FDE68A', emissiveIntensity: 0.15, roughness: 0.3 })
    },
    exitSign: {
      geometry: () => new THREE.BoxGeometry(1.25, 0.48, 0.14).translate(0, 2.65, 0),
      material: () => std('#16A34A', { emissive: '#22C55E', emissiveIntensity: 0.75 })
    },
    carBody: {
      geometry: carBodyGeo,
      material: () => std('#FFFFFF', { roughness: 0.2, metalness: 0.58, envMapIntensity: 1.45 }),
      detail: true,
      castShadow: true
    },
    carTrim: {
      geometry: carTrimGeo,
      material: () => std('#111827', { roughness: 0.16, metalness: 0.68 }),
      detail: true
    },
    carHeadlight: {
      geometry: carHeadlightGeo,
      material: () => std('#FFFBEB', { emissive: '#FEF3C7', emissiveIntensity: 0 }),
      detail: true
    },
    carTaillight: {
      geometry: carTaillightGeo,
      material: () => std('#DC2626', { emissive: '#EF4444', emissiveIntensity: 0 }),
      detail: true
    },
    evCharger: {
      geometry: () => new THREE.BoxGeometry(0.38, 1.45, 0.28).translate(0, 0.72, 0),
      material: () => std('#10B981', { emissive: '#22C55E', emissiveIntensity: 0.65, roughness: 0.3 }),
      detail: true
    },
    bike: {
      geometry: bikeGeo,
      material: () => std('#FFFFFF', { roughness: 0.35, metalness: 0.4 }),
      detail: true,
      castShadow: true
    },
    seat: {
      geometry: () => mergeParts([
        new THREE.BoxGeometry(0.44, 0.1, 0.4).translate(0, 0.12, 0),
        new THREE.BoxGeometry(0.44, 0.36, 0.08).translate(0, 0.32, -0.16)
      ]),
      material: () => std('#FFFFFF', { roughness: 0.45 }),
      detail: true
    },
    treadmill: {
      geometry: () => mergeParts([
        new THREE.BoxGeometry(0.85, 0.18, 1.85).translate(0, 0.1, 0),
        new THREE.BoxGeometry(0.82, 1.15, 0.12).rotateX(-0.18).translate(0, 0.68, 0.78),
        new THREE.BoxGeometry(0.76, 0.28, 0.35).translate(0, 1.25, 0.68)
      ]),
      material: () => std('#334155', { roughness: 0.35, metalness: 0.5 }),
      detail: true,
      castShadow: true
    },
    exerciseBike: {
      geometry: () => mergeParts([
        new THREE.BoxGeometry(0.52, 0.65, 1.15).translate(0, 0.42, 0),
        new THREE.BoxGeometry(0.45, 0.95, 0.12).translate(0, 0.85, 0.42)
      ]),
      material: () => std('#475569', { roughness: 0.35, metalness: 0.5 }),
      detail: true
    },
    squatRack: {
      geometry: () => mergeParts([
        new THREE.BoxGeometry(0.12, 2.25, 0.12).translate(-0.62, 1.12, -0.55),
        new THREE.BoxGeometry(0.12, 2.25, 0.12).translate(0.62, 1.12, -0.55),
        new THREE.BoxGeometry(0.12, 2.25, 0.12).translate(-0.62, 1.12, 0.55),
        new THREE.BoxGeometry(0.12, 2.25, 0.12).translate(0.62, 1.12, 0.55),
        new THREE.BoxGeometry(1.36, 0.1, 1.22).translate(0, 2.2, 0),
        new THREE.CylinderGeometry(0.04, 0.04, 2.1, 8).rotateZ(Math.PI / 2).translate(0, 1.35, 0)
      ]),
      material: () => std('#1E293B', { metalness: 0.65, roughness: 0.3 }),
      detail: true
    },
    weightBench: {
      geometry: () => mergeParts([
        new THREE.BoxGeometry(0.42, 0.12, 1.35).translate(0, 0.44, 0),
        new THREE.BoxGeometry(0.32, 0.42, 1.1).translate(0, 0.21, 0)
      ]),
      material: () => std('#1E293B', { roughness: 0.5 }),
      detail: true
    },
    lounger: {
      geometry: () => mergeParts([
        new THREE.BoxGeometry(0.75, 0.14, 1.85).translate(0, 0.26, 0),
        new THREE.BoxGeometry(0.75, 0.45, 0.65).rotateX(0.55).translate(0, 0.48, -0.68)
      ]),
      material: () => std('#F8FAFC', { roughness: 0.45 }),
      detail: true
    },
    pingPongTable: {
      geometry: () => mergeParts([
        new THREE.BoxGeometry(1.525, 0.08, 2.74).translate(0, 0.76, 0),
        new THREE.BoxGeometry(1.65, 0.16, 0.03).translate(0, 0.88, 0),
        new THREE.BoxGeometry(1.2, 0.72, 2.1).translate(0, 0.36, 0)
      ]),
      material: () => std('#1E40AF', { roughness: 0.35 }),
      detail: true
    },
    punchingBag: {
      geometry: () => mergeParts([
        new THREE.CylinderGeometry(0.24, 0.24, 1.35, 10).translate(0, 1.25, 0),
        new THREE.CylinderGeometry(0.03, 0.03, 1.1, 6).translate(0, 2.45, 0)
      ]),
      material: () => std('#DC2626', { roughness: 0.45 }),
      detail: true
    },
    yogaMat: {
      geometry: () => new THREE.BoxGeometry(0.68, 0.03, 1.78).translate(0, 0.02, 0),
      material: () => std('#FFFFFF', { roughness: 0.7 }),
      detail: true
    },
    cafeTable: {
      geometry: () => mergeParts([
        new THREE.CylinderGeometry(0.55, 0.55, 0.06, 12).translate(0, 0.75, 0),
        new THREE.CylinderGeometry(0.06, 0.08, 0.74, 8).translate(0, 0.37, 0)
      ]),
      material: () => std('#F8FAFC', { roughness: 0.35 }),
      detail: true
    },
    cafeChair: {
      geometry: () => mergeParts([
        new THREE.BoxGeometry(0.42, 0.06, 0.42).translate(0, 0.45, 0),
        new THREE.BoxGeometry(0.42, 0.42, 0.06).translate(0, 0.68, -0.18),
        new THREE.BoxGeometry(0.36, 0.44, 0.36).translate(0, 0.22, 0)
      ]),
      material: () => std('#F59E0B', { roughness: 0.45 }),
      detail: true
    },
    lockerUnit: {
      geometry: () => mergeParts([
        new THREE.BoxGeometry(1.8, 1.95, 0.52).translate(0, 0.98, 0),
        new THREE.BoxGeometry(1.6, 0.42, 0.42).translate(0, 0.21, 0.55)
      ]),
      material: () => std('#64748B', { roughness: 0.4, metalness: 0.45 }),
      detail: true,
      castShadow: true
    },
    coneMarker: {
      geometry: () => new THREE.ConeGeometry(0.18, 0.36, 8).translate(0, 0.18, 0),
      material: () => std('#F97316', { roughness: 0.4 }),
      detail: true
    },
    sportBall: {
      geometry: () => new THREE.IcosahedronGeometry(0.14, 1).translate(0, 0.14, 0),
      material: () => std('#F8FAFC', { roughness: 0.45 }),
      detail: true
    }
  };
}

/** Builds surrounding 4-lane boulevard, sidewalks, utilities, animated flags, fountain, traffic cars & city towers. */
export function buildSurroundingContext({ campus, groups, batch, surfaces, waterMaterials, flagMaterials, trafficCars, windUniform }) {
  const { width: siteW, depth: siteD } = campus.site;

  // 1. Extended Ground Plane (1600x1600 m dissolving cleanly into boundary distance fog)
  const groundMaps = surfaces.grassMaps(36, 36, '#5B7A45');
  const groundMat = new THREE.MeshStandardMaterial({ ...groundMaps, color: '#FFFFFF' });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.08;
  ground.receiveShadow = true;
  groups.base.add(ground);

  // 2. Campus Interlocking Paver Plinth + Perimeter Architectural Metal Fence w/ stone base walls
  const padMat = new THREE.MeshStandardMaterial(surfaces.paverMaps(22, 16, '#D8D3C6'));
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(siteW + 3.2, siteD + 3.2), padMat);
  pad.rotation.x = -Math.PI / 2;
  pad.position.y = -0.01;
  pad.receiveShadow = true;
  groups.base.add(pad);

  const wallMat = surfaces.concreteMaterial('#CFCAC0', [8, 1]);
  const railMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.65, roughness: 0.35 });
  for (const [len, dx, dz, horiz] of [
    [siteW, 0, -siteD / 2 - 1.0, true],
    [siteD, -siteW / 2 - 1.0, 0, false],
    [siteD, siteW / 2 + 1.0, 0, false]
  ]) {
    const lowWall = new THREE.Mesh(new THREE.BoxGeometry(horiz ? len : 0.28, 0.65, horiz ? 0.28 : len), wallMat);
    lowWall.position.set(dx, 0.32, dz);
    lowWall.castShadow = true;
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(horiz ? len : 0.14, 0.9, horiz ? 0.14 : len), railMat);
    topRail.position.set(dx, 1.1, dz);
    groups.base.add(lowWall, topRail);
  }

  // 3. Four-Lane South Main Boulevard + Perimeter Avenues + Curbs + Tactile Sidewalks
  const southRoadLen = siteW + 340;
  const southRoadW = 15.2;
  const southRoadZ = siteD / 2 + 10.2;
  const roadMat4Lane = new THREE.MeshStandardMaterial({
    map: surfaces.roadTexture(southRoadLen, southRoadW, { crosswalk: true, speedBump: true, lanes: 4 }),
    roughness: 0.85,
    metalness: 0.04
  });
  const southRoad = new THREE.Mesh(new THREE.PlaneGeometry(southRoadLen, southRoadW), roadMat4Lane);
  southRoad.rotation.x = -Math.PI / 2;
  southRoad.position.set(0, -0.02, southRoadZ);
  southRoad.receiveShadow = true;
  groups.base.add(southRoad);

  const roadMat2Lane = new THREE.MeshStandardMaterial({
    map: surfaces.roadTexture(southRoadLen, 9.5, { crosswalk: true, speedBump: false, lanes: 2 }),
    roughness: 0.86,
    metalness: 0.04
  });
  const northRoad = new THREE.Mesh(new THREE.PlaneGeometry(southRoadLen, 9.5), roadMat2Lane);
  northRoad.rotation.x = -Math.PI / 2;
  northRoad.position.set(0, -0.02, -siteD / 2 - 8.0);
  northRoad.receiveShadow = true;
  groups.base.add(northRoad);

  const sideRoadLen = siteD + 260;
  const sideRoadMat = new THREE.MeshStandardMaterial({
    map: surfaces.roadTexture(sideRoadLen, 9.5, { crosswalk: false, speedBump: false, lanes: 2 }),
    roughness: 0.86
  });
  for (const sx of [-siteW / 2 - 8.0, siteW / 2 + 8.0]) {
    const sr = new THREE.Mesh(new THREE.PlaneGeometry(9.5, sideRoadLen), sideRoadMat);
    sr.rotation.x = -Math.PI / 2;
    sr.position.set(sx, -0.025, 0);
    sr.receiveShadow = true;
    groups.base.add(sr);
  }

  // Raised sidewalks (15 cm curbs) + yellow tactile guide strip
  const walkMat = new THREE.MeshStandardMaterial(surfaces.paverMaps(28, 2, '#D3CEC4'));
  const tactileMat = new THREE.MeshStandardMaterial({ color: '#FACC15', roughness: 0.72 });
  for (const sz of [siteD / 2 + 1.4, southRoadZ + southRoadW / 2 + 1.8]) {
    const sw = new THREE.Mesh(new THREE.BoxGeometry(southRoadLen, 0.15, 2.8), walkMat);
    sw.position.set(0, 0.04, sz);
    sw.receiveShadow = true;
    groups.base.add(sw);
    if (sz < southRoadZ) {
      const tact = new THREE.Mesh(new THREE.BoxGeometry(siteW, 0.02, 0.35), tactileMat);
      tact.position.set(0, 0.125, sz + 0.9);
      groups.base.add(tact);
    }
  }

  // Boulevard 8 m streetlamps (every 25 m), 1 m garden lamps, trash bins, flower beds, diverse botanical trees w/ grates
  const flowerColors = ['#F43F5E', '#A855F7', '#F59E0B', '#EC4899'];
  const blossomColors = ['#8B7AA8', '#B5685A', '#4A7C44'];
  let tIdx = 0;
  for (let x = -siteW / 2 - 55; x <= siteW / 2 + 55; x += 24) {
    if (Math.abs(x - -5) > 9 && Math.abs(x - 23) > 7) {
      batch.add('streetLampPole', x, 0, siteD / 2 + 2.1, 1, 1, 1, 0);
      batch.add('streetLampHead', x, 0, siteD / 2 + 2.1, 1, 1, 1, 0);
      batch.add('treeTrunkC', x + 7, 0, siteD / 2 + 2.1, 1.0, 1.05, 1.0, tIdx);
      batch.add('treeCrownC', x + 7, 0, siteD / 2 + 2.1, 1.0, 1.05, 1.0, tIdx, blossomColors[tIdx % blossomColors.length]);
      batch.add('treeGrate', x + 7, 0, siteD / 2 + 2.1);
      if (tIdx % 2 === 0) batch.add('trashBin', x - 3, 0.11, siteD / 2 + 1.6);
    }
    batch.add('treeTrunkA', x + 4, 0, southRoadZ + 11.2, 1.15, 1.15, 1.15, x * 0.7);
    batch.add('treeCrownA', x + 4, 0, southRoadZ + 11.2, 1.15, 1.15, 1.15, x * 0.7);
    tIdx += 1;
  }

  // Royal Palms framing Main Gate & Lobby L plaza + Flower Beds
  for (const px of [-14.5, -10.5, 1.2, 4.8]) {
    batch.add('treeTrunkP', px, 0, siteD / 2 - 4.5, 1.0, 1.05, 1.0, px * 0.6);
    batch.add('treeCrownP', px, 0, siteD / 2 - 4.5, 1.0, 1.05, 1.0, px * 0.6);
    batch.add('treeGrate', px, 0, siteD / 2 - 4.5);
    batch.add('flowerBed', px, 0, siteD / 2 - 7.5, 1, 1, 1, 0, flowerColors[Math.abs(Math.round(px)) % flowerColors.length]);
  }

  // Fountain Plaza in front of Lobby L (with animated water shader & night underwater turquoise light)
  const fx = -5;
  const fz = 44.5;
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 0.45, 24), wallMat);
  basin.position.set(fx, 0.22, fz);
  basin.castShadow = true;
  basin.receiveShadow = true;
  const fountainWaterMat = waterMaterials[0] ? waterMaterials[0] : null;
  const fWaterMat = fountainWaterMat || new THREE.MeshPhysicalMaterial({ color: '#38BDF8', transparent: true, opacity: 0.78, roughness: 0.06, clearcoat: 1 });
  const fWater = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.35, 0.14, 24), fWaterMat);
  fWater.position.set(fx, 0.4, fz);
  const jetCol = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.42, 1.45, 12),
    new THREE.MeshStandardMaterial({ color: '#E0F2FE', emissive: '#38BDF8', emissiveIntensity: 0.35, transparent: true, opacity: 0.72 })
  );
  jetCol.position.set(fx, 1.12, fz);
  groups.base.add(basin, fWater, jetCol);

  // Three Flagpoles with vertex-waving animated flags near Main Entrance (-18, 48.5)
  const flagCols = ['#DC2626', '#2563EB', '#F59E0B'];
  for (let i = 0; i < 3; i += 1) {
    const px = -19.5 + i * 2.2;
    const pz = siteD / 2 - 1.5;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 7.2, 8), new THREE.MeshStandardMaterial({ color: '#E2E8F0', metalness: 0.8, roughness: 0.2 }));
    pole.position.set(px, 3.6, pz);
    const flagMat = new THREE.MeshStandardMaterial({ color: flagCols[i], roughness: 0.55, side: THREE.DoubleSide });
    if (windUniform) {
      flagMat.onBeforeCompile = (shader) => {
        shader.uniforms.uWindTime = windUniform;
        shader.vertexShader = `uniform float uWindTime;\n${shader.vertexShader}`.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           float pin = clamp((position.x + 0.75) / 1.5, 0.0, 1.0);
           transformed.z += sin(uWindTime * 4.2 + position.x * 3.5 + ${i.toFixed(1)}) * 0.14 * pin;`
        );
      };
    }
    if (flagMaterials) flagMaterials.push(flagMat);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.95, 12, 4), flagMat);
    flag.position.set(px + 0.78, 6.65, pz);
    groups.props.add(pole, flag);
  }

  // Campus Technical Utilities Cluster (Transformer, Enclosed Backup Generator, Underground Tank Hatch, Waste Area) on North-West edge
  const utilX = -siteW / 2 + 4.0;
  const utilZ = -siteD / 2 + 3.2;
  const transformer = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.1, 2.0), new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.5, metalness: 0.45 }));
  transformer.position.set(utilX, 1.05, utilZ);
  transformer.castShadow = true;
  const generator = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.9, 1.8), new THREE.MeshStandardMaterial({ color: '#64748B', roughness: 0.45, metalness: 0.5 }));
  generator.position.set(utilX + 3.8, 0.95, utilZ);
  generator.castShadow = true;
  const tankCover = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.12, 16), railMat);
  tankCover.position.set(utilX + 7.2, 0.06, utilZ);
  groups.detail.add(transformer, generator, tankCover);

  // Moving vehicles cruising smoothly along 4-lane South Boulevard (with headlights + taillights at night!)
  const cruiseCols = ['#F8FAFC', '#334155', '#0EA5E9'];
  for (let c = 0; c < 3; c += 1) {
    const carGroup = new THREE.Group();
    const dir = c % 2 === 0 ? 1 : -1;
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.52, 1.82), new THREE.MeshStandardMaterial({ color: cruiseCols[c], roughness: 0.22, metalness: 0.58 }));
    body.position.y = 0.52;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.44, 1.54), new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.18, metalness: 0.7 }));
    cabin.position.set(-0.2, 0.96, 0);
    const hlMat = new THREE.MeshStandardMaterial({ color: '#FFFBEB', emissive: '#FEF3C7', emissiveIntensity: 0 });
    const tlMat = new THREE.MeshStandardMaterial({ color: '#DC2626', emissive: '#EF4444', emissiveIntensity: 0 });
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 1.35), hlMat);
    hl.position.set(2.22, 0.54, 0);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 1.35), tlMat);
    tl.position.set(-2.22, 0.58, 0);
    carGroup.add(body, cabin, hl, tl);
    carGroup.position.set(-60 + c * 55, 0, southRoadZ + (dir > 0 ? 3.8 : -3.8));
    carGroup.rotation.y = dir > 0 ? 0 : Math.PI;
    groups.props.add(carGroup);
    if (trafficCars) {
      trafficCars.push({ group: carGroup, dir, speed: 6.5 + c * 1.6, limit: southRoadLen / 2 - 15, hlMat, tlMat });
    }
  }

  // Simplified Contextual Neighboring Urban Towers fading softly into distance
  const ctxMat = surfaces.neighborBuildingMaterial();
  const ctxGroup = new THREE.Group();
  const neighborBlocks = [
    [-168, -45, 36, 13, 42], [-172, 22, 32, 16, 38],
    [168, -35, 38, 14, 46], [170, 28, 34, 12, 36],
    [-95, -140, 44, 15, 28], [-15, -144, 48, 12, 26], [68, -142, 42, 16, 30],
    [-90, 140, 42, 13, 28], [5, 144, 48, 11, 26], [82, 140, 44, 15, 30]
  ];
  for (const [bx, bz, bw, bh, bd] of neighborBlocks) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), ctxMat);
    b.position.set(bx, bh / 2, bz);
    b.receiveShadow = true;
    const roofCap = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.62, 2.4, bd * 0.62), ctxMat);
    roofCap.position.set(bx, bh + 1.2, bz);
    ctxGroup.add(b, roofCap);
  }
  groups.base.add(ctxGroup);

  return { ground, ctxMat, fountainWater: fWater };
}

/** Pickleball courts with B40 chain-link perimeter fencing, windscreens, sagging net, paddles & balls. */
export function buildPickleballCourtDetails({ group, room, batch, surfaces }) {
  const rx = room.x;
  const rz = room.z;
  const rw = room.width;
  const rd = room.depth;
  const fw = rw + 3;
  const fd = rd + 4.9;
  const fh = 2.8;

  const postMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.68, roughness: 0.34 });
  const fenceMat = surfaces.b40FenceMaterial();
  const fence = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, fd), fenceMat);
  fence.position.set(rx, fh / 2, rz);
  group.add(fence);

  // Perimeter windscreen banner along lower half of baselines
  const screenMat = new THREE.MeshStandardMaterial({ color: '#1B4332', roughness: 0.78, side: THREE.DoubleSide });
  for (const side of [-1, 1]) {
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(fw - 0.2, 1.35), screenMat);
    banner.position.set(rx, 0.85, rz + side * (fd / 2 - 0.04));
    group.add(banner);
  }

  for (const cx of [-fw / 2, 0, fw / 2]) {
    for (const cz of [-fd / 2, 0, fd / 2]) {
      if (cx === 0 && cz === 0) continue;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, fh, 6), postMat);
      post.position.set(rx + cx, fh / 2, rz + cz);
      group.add(post);
    }
  }

  // Sagging center net (0.91 m at posts dipping smoothly to 0.86 m at center)
  const netMat = new THREE.MeshStandardMaterial({ color: '#1E293B', transparent: true, opacity: 0.82, roughness: 0.65 });
  const net = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.86, 0.05), netMat);
  net.position.set(rx, 0.45, rz);
  const tape = new THREE.Mesh(new THREE.BoxGeometry(rw + 0.1, 0.07, 0.07), new THREE.MeshStandardMaterial({ color: '#F8FAFC' }));
  tape.position.set(rx, 0.88, rz);
  group.add(net, tape);

  // Rest bench & scattered pickleballs + training cones beside court
  batch.add('bench', rx - fw / 2 + 0.9, 0.06, rz, 0.85, 1, 0.85, Math.PI / 2);
  batch.add('sportBall', rx - 1.1, 0.06, rz - 2.4, 0.7, 0.7, 0.7, 0, '#A3E635');
  batch.add('sportBall', rx + 1.6, 0.06, rz + 3.2, 0.7, 0.7, 0.7, 0, '#A3E635');
}

/** Football pitches: white steel goals w/ sagging catenary net, anchors, 5m B40 fence, behind-goal nets, corner flags, cones & balls. */
export function buildFootballPitchDetails({ group, zone, room, batch, surfaces }) {
  const horizontal = room.width >= room.depth;
  const half = (horizontal ? room.width : room.depth) / 2;
  const goalW = room.kind === 'football7' ? 5.6 : 3.4;
  const goalH = 2.1;
  const goalD = 1.35;

  const postMat = new THREE.MeshStandardMaterial({ color: '#F8FAFC', roughness: 0.28, metalness: 0.3 });
  const netMat = new THREE.MeshStandardMaterial({
    color: '#E2E8F0',
    transparent: true,
    opacity: 0.44,
    wireframe: true,
    side: THREE.DoubleSide
  });

  // Curved sagging goal net mesh builder
  const saggingGeo = new THREE.PlaneGeometry(goalW, goalD, 12, 6);
  saggingGeo.rotateX(-Math.PI / 2);
  const posAttr = saggingGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i += 1) {
    const px = posAttr.getX(i);
    const pz = posAttr.getZ(i);
    const sag = Math.cos((px / (goalW / 2)) * (Math.PI / 2)) * 0.14;
    const slope = ((pz + goalD / 2) / goalD) * (goalH * 0.22);
    posAttr.setY(i, goalH - sag - slope);
  }
  saggingGeo.computeVertexNormals();

  for (const side of [-1, 1]) {
    const goal = new THREE.Group();
    const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, goalW, 8).rotateZ(Math.PI / 2), postMat);
    crossbar.position.y = goalH;
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, goalH, 8), postMat);
    p1.position.set(-goalW / 2, goalH / 2, 0);
    const p2 = p1.clone();
    p2.position.x = goalW / 2;

    const topSagNet = new THREE.Mesh(saggingGeo, netMat);
    topSagNet.position.set(0, 0, side * (goalD / 2));
    const backNet = new THREE.Mesh(new THREE.PlaneGeometry(goalW, goalH * 0.82, 12, 5), netMat);
    backNet.position.set(0, goalH * 0.41, side * goalD);
    // Steel ground anchor bars
    const anchor = new THREE.Mesh(new THREE.BoxGeometry(goalW, 0.06, goalD), postMat);
    anchor.position.set(0, 0.03, side * (goalD / 2));
    goal.add(crossbar, p1, p2, topSagNet, backNet, anchor);
    goal.position.set(room.x + (horizontal ? side * half : 0), 0.06, room.z + (horizontal ? 0 : side * half));
    if (horizontal) goal.rotation.y = Math.PI / 2;
    goal.userData.detail = true;
    group.add(goal);

    // Covered substitute bench & behind-goal high catch netting
    const behindNet = new THREE.Mesh(new THREE.PlaneGeometry(room.width + 2, 4.8), surfaces.b40FenceMaterial());
    behindNet.position.set(room.x, 2.4, room.z + side * (room.depth / 2 + 1.4));
    group.add(behindNet);
  }

  // 1.5 m Corner flags + training cones + footballs (zero human characters!)
  const flagMat = new THREE.MeshStandardMaterial({ color: '#FACC15', side: THREE.DoubleSide });
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const fx = room.x + sx * (room.width / 2 - 0.25);
      const fz = room.z + sz * (room.depth / 2 - 0.25);
      const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.5, 6), postMat);
      staff.position.set(fx, 0.78, fz);
      const pennant = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.28), flagMat);
      pennant.position.set(fx + 0.22, 1.38, fz);
      group.add(staff, pennant);
    }
  }

  for (let c = 0; c < 4; c += 1) {
    batch.add('coneMarker', room.x - 4 + c * 2.4, 0.06, room.z + (c % 2 === 0 ? -6 : 6), 1, 1, 1, 0, '#F97316', zone.id, 0);
  }
  batch.add('sportBall', room.x + 0.3, 0.06, room.z - 0.4, 1, 1, 1, 0, '#F8FAFC', zone.id, 0);
  batch.add('sportBall', room.x - 3.5, 0.06, room.z + 5.2, 1, 1, 1, 0, '#FACC15', zone.id, 0);

  // Covered substitute bench along touchline
  const subRoof = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.08, 4.6),
    surfaces.polycarbonateMaterial('#E0F2FE')
  );
  subRoof.position.set(room.x - room.width / 2 - 1.1, 2.05, room.z);
  group.add(subRoof);
  batch.add('bench', room.x - room.width / 2 - 1.1, 0.06, room.z - 1.0, 1, 1, 1, Math.PI / 2);
  batch.add('bench', room.x - room.width / 2 - 1.1, 0.06, room.z + 1.0, 1, 1, 1, Math.PI / 2);
}
