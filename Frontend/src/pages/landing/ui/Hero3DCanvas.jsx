import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function Hero3DCanvas({ isEn = false }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 18);

    // 2. Renderer with transparent background
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(10, 15, 10);
    scene.add(dirLight1);

    const redRimLight = new THREE.PointLight(0xef4444, 4.0, 30);
    redRimLight.position.set(-12, -6, 5);
    scene.add(redRimLight);

    const cyanRimLight = new THREE.PointLight(0x06b6d4, 3.5, 30);
    cyanRimLight.position.set(12, 8, 5);
    scene.add(cyanRimLight);

    // 4. Group for 3D Olympic Floating Elements
    const heroGroup = new THREE.Group();
    scene.add(heroGroup);

    // A. 5 Interlocking 3D Olympic Rings
    const ringsGroup = new THREE.Group();
    const ringGeo = new THREE.TorusGeometry(1.2, 0.11, 24, 64);
    const ringColors = [0x0081C8, 0xFCB131, 0xFFFFFF, 0x00A651, 0xEE334E];
    const ringOffsets = [
      [-2.6, 1.1, 0],
      [-1.3, -0.2, 0.1],
      [0.0, 1.1, 0],
      [1.3, -0.2, 0.1],
      [2.6, 1.1, 0]
    ];

    ringOffsets.forEach((pos, idx) => {
      const ringMat = new THREE.MeshStandardMaterial({
        color: ringColors[idx],
        metalness: 0.75,
        roughness: 0.2,
        emissive: ringColors[idx],
        emissiveIntensity: 0.25,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(pos[0], pos[1], pos[2]);
      ringsGroup.add(ringMesh);
    });
    ringsGroup.scale.set(0.85, 0.85, 0.85);
    ringsGroup.position.set(6.2, 2.5, -2);
    heroGroup.add(ringsGroup);

    // B. Floating 3D Basketball with seam lines
    const ballGroup = new THREE.Group();
    const ballGeo = new THREE.SphereGeometry(1.25, 36, 36);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xeb5e28,
      roughness: 0.65,
      metalness: 0.1,
    });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballGroup.add(ballMesh);

    // Black seam rings for the basketball
    const seamMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
    const seam1 = new THREE.Mesh(new THREE.TorusGeometry(1.26, 0.025, 16, 64), seamMat);
    const seam2 = new THREE.Mesh(new THREE.TorusGeometry(1.26, 0.025, 16, 64), seamMat);
    seam2.rotation.x = Math.PI / 2;
    const seam3 = new THREE.Mesh(new THREE.TorusGeometry(1.26, 0.025, 16, 64), seamMat);
    seam3.rotation.y = Math.PI / 2;
    ballGroup.add(seam1, seam2, seam3);

    ballGroup.position.set(-7.5, 1.5, 0);
    heroGroup.add(ballGroup);

    // C. Floating 3D Tennis / Pickleball ball
    const tennisGroup = new THREE.Group();
    const tennisGeo = new THREE.SphereGeometry(0.8, 32, 32);
    const tennisMat = new THREE.MeshStandardMaterial({
      color: 0xc4e538,
      roughness: 0.7,
      metalness: 0.05,
      emissive: 0x88b04b,
      emissiveIntensity: 0.2,
    });
    const tennisMesh = new THREE.Mesh(tennisGeo, tennisMat);
    tennisGroup.add(tennisMesh);

    const tennisSeam = new THREE.Mesh(new THREE.TorusGeometry(0.81, 0.025, 16, 48), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    tennisSeam.rotation.x = 0.6;
    tennisSeam.rotation.y = 0.6;
    tennisGroup.add(tennisSeam);

    tennisGroup.position.set(-5.5, -4.2, 1.5);
    heroGroup.add(tennisGroup);

    // D. Floating 3D Shuttlecock (Cầu lông)
    const shuttleGroup = new THREE.Group();
    const corkMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xfdfbf7, roughness: 0.5 })
    );
    const skirtMesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.65, 0.9, 16, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.9, roughness: 0.3 })
    );
    skirtMesh.position.y = 0.45;
    skirtMesh.rotation.x = Math.PI;
    shuttleGroup.add(corkMesh, skirtMesh);
    shuttleGroup.position.set(7.5, -3.5, 0.5);
    shuttleGroup.rotation.z = -0.6;
    shuttleGroup.rotation.x = 0.4;
    heroGroup.add(shuttleGroup);

    // E. Athletic Particle Field
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const posArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      posArr[i] = (Math.random() - 0.5) * 32;
      posArr[i + 1] = (Math.random() - 0.5) * 20;
      posArr[i + 2] = (Math.random() - 0.5) * 12;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.12,
      color: 0xef4444,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 5. Interactive Mouse Parallax & Dynamic Float Animation
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseX = normX * 0.8;
      mouseY = normY * 0.8;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 6. Animation Loop
    let animId = null;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth camera parallax following cursor
      camera.position.x += (mouseX - camera.position.x) * 0.04;
      camera.position.y += (mouseY - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      // Rotate and float elements
      ringsGroup.rotation.y = Math.sin(elapsed * 0.5) * 0.35;
      ringsGroup.rotation.x = Math.cos(elapsed * 0.4) * 0.15;
      ringsGroup.position.y = 2.5 + Math.sin(elapsed * 1.2) * 0.3;

      ballGroup.rotation.x += 0.008;
      ballGroup.rotation.y += 0.012;
      ballGroup.position.y = 1.5 + Math.sin(elapsed * 1.5) * 0.4;

      tennisGroup.rotation.y += 0.015;
      tennisGroup.rotation.z += 0.009;
      tennisGroup.position.y = -4.2 + Math.cos(elapsed * 1.6) * 0.35;

      shuttleGroup.rotation.y += 0.01;
      shuttleGroup.position.y = -3.5 + Math.sin(elapsed * 1.3) * 0.3;

      particles.rotation.y = elapsed * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    // 7. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 8. Cleanup
    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      ringGeo.dispose();
      ballGeo.dispose();
      tennisGeo.dispose();
      particleGeo.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
      aria-hidden="true"
      style={{ opacity: 0.92 }}
    />
  );
}

export default Hero3DCanvas;
