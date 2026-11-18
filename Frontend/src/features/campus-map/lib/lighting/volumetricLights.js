import * as THREE from 'three';

/**
 * Night Illumination & Volumetric Light Simulation:
 * - Replaces solid beige cones with open-ended custom ShaderMaterial Fresnel cones
 * - Radial + longitudinal falloff, animated dust motes, additive blending, depthWrite = false
 * - Optimized ground light pools for secondary poles and crimson aviation beacons on high masts
 */
export function createVolumetricBeamMaterial(colorHex = '#FFE9B8') {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(colorHex) },
      uOpacity: { value: 0.0 },
      uTime: { value: 0.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mvPosition.xyz;
        vNormalView = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        if (uOpacity <= 0.002) discard;
        vec3 viewDir = normalize(vViewPos);
        // Fresnel soft edge fade so cone silhouette never reads as hard triangle geometry
        float ndotv = abs(dot(normalize(vNormalView), viewDir));
        float fresnel = pow(ndotv, 1.65);

        // Longitudinal attenuation from fixture head (vUv.y = 1) toward grass surface (vUv.y = 0)
        float distFade = pow(clamp(vUv.y, 0.0, 1.0), 1.45) * smoothstep(0.0, 0.24, vUv.y);
        float topPinch = smoothstep(1.0, 0.88, vUv.y) * 0.55 + 0.45;

        // Subtle drifting atmospheric dust motes inside the beam
        float dust = 0.85 + 0.15 * sin(vUv.y * 28.0 - uTime * 1.1 + vUv.x * 18.0);
        float alpha = uOpacity * fresnel * distFade * topPinch * dust;
        gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 0.15));
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
}

function makeLightPoolTexture() {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255, 240, 200, 0.72)');
  g.addColorStop(0.42, 'rgba(255, 224, 155, 0.26)');
  g.addColorStop(1, 'rgba(255, 224, 155, 0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Shared additive decal mesh casting an illumination pool onto turf/roads at dusk/night. */
export function createLightPoolFactory() {
  const poolTex = makeLightPoolTexture();
  const baseGeo = new THREE.PlaneGeometry(1, 1);
  baseGeo.rotateX(-Math.PI / 2);
  const pools = [];

  return {
    addPool(group, x, z, radius = 12, colorHex = '#FFE6A8', zoneId = null) {
      const mat = new THREE.MeshBasicMaterial({
        map: poolTex,
        color: colorHex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      mat.userData.zoneId = zoneId;
      const mesh = new THREE.Mesh(baseGeo, mat);
      mesh.position.set(x, 0.075, z);
      mesh.scale.set(radius * 2, 1, radius * 2);
      group.add(mesh);
      pools.push(mat);
      return mat;
    },
    pools
  };
}
