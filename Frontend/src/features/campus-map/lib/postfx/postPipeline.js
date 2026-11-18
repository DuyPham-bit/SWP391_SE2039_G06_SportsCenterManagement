import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const ArchvizPostShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTint: { value: new THREE.Vector3(1, 1, 1) },
    uTiltShift: { value: 0.0 },
    uVignette: { value: 0.14 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec3 uTint;
    uniform float uTiltShift;
    uniform float uVignette;
    varying vec2 vUv;
    void main() {
      vec4 base = texture2D(tDiffuse, vUv);
      vec3 col = base.rgb;
      if (uTiltShift > 0.001) {
        float blurAmt = smoothstep(0.18, 0.48, abs(vUv.y - 0.52)) * uTiltShift * 0.003;
        vec3 acc = col * 0.36;
        acc += texture2D(tDiffuse, vUv + vec2(blurAmt, 0.0)).rgb * 0.16;
        acc += texture2D(tDiffuse, vUv - vec2(blurAmt, 0.0)).rgb * 0.16;
        acc += texture2D(tDiffuse, vUv + vec2(0.0, blurAmt)).rgb * 0.16;
        acc += texture2D(tDiffuse, vUv - vec2(0.0, blurAmt)).rgb * 0.16;
        col = acc;
      }
      col *= uTint;
      float d = distance(vUv, vec2(0.5, 0.5));
      col *= 1.0 - smoothstep(0.42, 0.86, d) * uVignette;
      gl_FragColor = vec4(col, base.a);
    }
  `
};

/**
 * Post-processing pipeline: Render -> SSAO (desktop adaptive) -> Selective Bloom
 * -> Preset LUT/TiltShift/Vignette -> SMAA -> OutputPass (ACESFilmic/sRGB).
 */
export function createPostPipeline(renderer, scene, camera, { enableAO = true, enableSMAA = true } = {}) {
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  let ssaoPass = null;
  if (enableAO) {
    ssaoPass = new SSAOPass(scene, camera, 512, 512);
    ssaoPass.kernelRadius = 2.4;
    ssaoPass.minDistance = 0.0025;
    ssaoPass.maxDistance = 0.16;
    composer.addPass(ssaoPass);
  }

  // Threshold 0.96 so only emissive LEDs, headlights, signs, and bright specular peaks bloom
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.12, 0.28, 0.96);
  const archvizPass = new ShaderPass(ArchvizPostShader);
  composer.addPass(bloomPass);
  composer.addPass(archvizPass);

  let smaaPass = null;
  if (enableSMAA) {
    smaaPass = new SMAAPass(512, 512);
    composer.addPass(smaaPass);
  }

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  return {
    composer,
    ssaoPass,
    bloomPass,
    archvizPass,
    smaaPass,
    setSize(w, h) {
      composer.setSize(w, h);
      if (ssaoPass) ssaoPass.setSize(w, h);
      if (smaaPass) smaaPass.setSize(w, h);
    },
    dispose() {
      ssaoPass?.dispose?.();
      bloomPass?.dispose?.();
      smaaPass?.dispose?.();
      composer.dispose?.();
    }
  };
}
