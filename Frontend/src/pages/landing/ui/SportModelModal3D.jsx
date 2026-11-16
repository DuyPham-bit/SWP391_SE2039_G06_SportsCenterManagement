import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Sport Court/Equipment 3D Specs & Builders
const SPORT_3D_SPECS = {
  basketball: {
    title: 'Sân Bóng Rổ Tiêu Chuẩn FIBA',
    titleEn: 'FIBA Standard Basketball Court',
    specs: 'Kích thước: 28m × 15m • Sàn gỗ phong Bắc Mỹ chống trượt • Trụ rổ kính cường lực 10mm chịu lực dunk',
    specsEn: '28m × 15m • Hard Maple Wood Flooring • 10mm Tempered Glass Backboard with Pro Spring Rim',
    camera: { x: 0, y: 7, z: 12 },
    target: { x: 0, y: 1.5, z: 0 },
  },
  swimming: {
    title: 'Hồ Bơi Bốn Mùa Chuẩn Olympic',
    titleEn: 'Olympic Heated 4-Season Pool',
    specs: 'Chiều dài: 25m × 12.5m (5 làn) • Hệ thống lọc cát thủy tinh ion bạc • Gia nhiệt ổn định 28-30°C quanh năm',
    specsEn: '25m × 12.5m (5 Lanes) • Silver-Ion Glass Sand Filtration • Controlled 28-30°C Year-Round',
    camera: { x: 0, y: 8, z: 14 },
    target: { x: 0, y: 0.5, z: 0 },
  },
  pickleball: {
    title: 'Cụm Sân Pickleball Pro',
    titleEn: 'Championship Pickleball Court',
    specs: 'Kích thước: 13.4m × 6.1m • Sơn phủ Acrylic 8 lớp chống chói • Lưới thi đấu USAPA đạt chuẩn quốc tế',
    specsEn: '13.4m × 6.1m • 8-Layer Anti-Glare Acrylic Coating • USAPA Standard Tournament Net',
    camera: { x: 0, y: 6, z: 10 },
    target: { x: 0, y: 1, z: 0 },
  },
  badminton: {
    title: 'Sàn Cầu Lông Thảm Vinyl BWF',
    titleEn: 'BWF Certified Badminton Court',
    specs: 'Kích thước: 13.4m × 6.1m • Thảm PVC dày 4.5mm chống trơn trượt • Đèn chiếu sáng chống lóa 500 Lux',
    specsEn: '13.4m × 6.1m • 4.5mm Shock-Absorbing PVC Vinyl • 500 Lux Anti-Glare LED System',
    camera: { x: 0, y: 6, z: 10 },
    target: { x: 0, y: 1, z: 0 },
  },
  gym: {
    title: 'Khu Gym & Tạ Khối Chuyên Nghiệp',
    titleEn: 'Commercial Strength & Fitness Floor',
    specs: 'Trang thiết bị LifeFitness & Hammer Strength • Giàn Power Rack tạ Olympic • Sàn cao su EPDM giảm chấn 25mm',
    specsEn: 'LifeFitness & Hammer Strength Machines • Olympic Heavy Power Racks • 25mm Shock-Absorbing Rubber EPDM',
    camera: { x: 0, y: 5, z: 9 },
    target: { x: 0, y: 1.2, z: 0 },
  },
  boxing: {
    title: 'Đài Đấu Boxing & Võ Thuật Tiêu Chuẩn',
    titleEn: 'Pro Boxing Ring & Combat Arena',
    specs: 'Kích thước: 6m × 6m sàn đài nâng cao 1m • Đệm canvas giảm xóc 4 lớp • Khung giàn bao cát treo hạng nặng 80kg',
    specsEn: '6m × 6m Elevated 1m Ring • 4-Layer High-Density Canvas Padding • 80kg Heavy Bag Rigging',
    camera: { x: 0, y: 6, z: 11 },
    target: { x: 0, y: 1.2, z: 0 },
  },
  yoga: {
    title: 'Phòng Yoga & Pilates Reformer',
    titleEn: 'Boutique Pilates Reformer & Yoga Studio',
    specs: 'Máy Pilates Reformer khung gỗ sồi lò xo chuyên dụng • Thảm tập Manduka Pro • Hệ thống điều hòa ion thanh lọc khí',
    specsEn: 'Oak Wood Pilates Reformers with Balanced Springs • Manduka Pro Mats • Ion Air Purifying System',
    camera: { x: 0, y: 5, z: 9 },
    target: { x: 0, y: 1, z: 0 },
  },
  football: {
    title: 'Sân Bóng Đá Mini Cỏ Nhân Tạo',
    titleEn: 'Synthetic Turf Mini Football Pitch',
    specs: 'Kích thước: 20m × 12m • Cỏ sợi kim cương 50mm chèn hạt cao su đàn hồi • Đèn pha LED 600W ban đêm',
    specsEn: '20m × 12m • 50mm Diamond Synthetic Turf with Elastic Rubber Infill • 600W Stadium LED Floodlights',
    camera: { x: 0, y: 7, z: 13 },
    target: { x: 0, y: 0.8, z: 0 },
  },
};

function resolveSportKey(sport) {
  if (!sport) return 'basketball';
  const name = (sport.name || sport.id || '').toLowerCase();
  if (name.includes('bóng rổ') || name.includes('basket')) return 'basketball';
  if (name.includes('bơi') || name.includes('swim')) return 'swimming';
  if (name.includes('pickleball')) return 'pickleball';
  if (name.includes('cầu lông') || name.includes('badminton')) return 'badminton';
  if (name.includes('gym') || name.includes('thể hình') || name.includes('fitness')) return 'gym';
  if (name.includes('boxing') || name.includes('võ') || name.includes('quần vợt')) return 'boxing';
  if (name.includes('yoga') || name.includes('pilates')) return 'yoga';
  if (name.includes('bóng đá') || name.includes('football') || name.includes('soccer')) return 'football';
  return 'basketball';
}

export function SportModelModal3D({ sport, isEn = false, onClose, onBookingClick }) {
  const mountRef = useRef(null);
  const [isNightMode, setIsNightMode] = useState(false);
  const sportKey = resolveSportKey(sport);
  const spec = SPORT_3D_SPECS[sportKey] || SPORT_3D_SPECS.basketball;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isNightMode ? 0x0f172a : 0x1e293b);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(spec.camera.x, spec.camera.y, spec.camera.z);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(spec.target.x, spec.target.y, spec.target.z);
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 25;

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, isNightMode ? 0.3 : 0.8);
    scene.add(hemiLight);

    const mainLight = new THREE.DirectionalLight(0xfffbeb, isNightMode ? 0.6 : 1.6);
    mainLight.position.set(10, 16, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    const rimLight = new THREE.PointLight(0xef4444, isNightMode ? 3.0 : 1.5, 20);
    rimLight.position.set(-8, 6, -8);
    scene.add(rimLight);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // Build Specific 3D Model based on Sport
    if (sportKey === 'basketball') {
      // 1. Hardwood Court Floor
      const courtGeo = new THREE.BoxGeometry(16, 0.3, 10);
      const courtMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.35, metalness: 0.1 });
      const courtMesh = new THREE.Mesh(courtGeo, courtMat);
      courtMesh.receiveShadow = true;
      modelGroup.add(courtMesh);

      // Court Lines (Key, 3-point, Center)
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const lineMesh = new THREE.Mesh(new THREE.PlaneGeometry(15.4, 9.4), new THREE.MeshBasicMaterial({ color: 0xb45309 }));
      lineMesh.rotation.x = -Math.PI / 2;
      lineMesh.position.y = 0.16;
      modelGroup.add(lineMesh);

      // Backboard & Hoop
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, 4.2, 16);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(7.2, 2.1, 0);
      pole.castShadow = true;
      modelGroup.add(pole);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.1), poleMat);
      arm.position.set(6.6, 3.8, 0);
      modelGroup.add(arm);

      const boardGeo = new THREE.BoxGeometry(0.08, 1.4, 2.2);
      const boardMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, roughness: 0.1, transmission: 0.8 });
      const board = new THREE.Mesh(boardGeo, boardMat);
      board.position.set(6.0, 3.8, 0);
      modelGroup.add(board);

      const rimGeo = new THREE.TorusGeometry(0.38, 0.03, 16, 32);
      const rimMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.7 });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(5.55, 3.4, 0);
      modelGroup.add(rim);

      // 3D Basketball on Court
      const ballGeo = new THREE.SphereGeometry(0.42, 24, 24);
      const ballMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.6 });
      const ball = new THREE.Mesh(ballGeo, ballMat);
      ball.position.set(1.5, 0.57, 1);
      ball.castShadow = true;
      modelGroup.add(ball);

    } else if (sportKey === 'swimming') {
      // Swimming Pool
      const deckGeo = new THREE.BoxGeometry(16, 0.5, 10);
      const deckMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 });
      const deck = new THREE.Mesh(deckGeo, deckMat);
      modelGroup.add(deck);

      const basinGeo = new THREE.BoxGeometry(13, 0.8, 7.5);
      const basinMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2 });
      const basin = new THREE.Mesh(basinGeo, basinMat);
      basin.position.y = -0.15;
      modelGroup.add(basin);

      const waterGeo = new THREE.PlaneGeometry(12.8, 7.3);
      const waterMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.75,
        roughness: 0.1,
        transmission: 0.6,
        reflectivity: 0.9,
      });
      const water = new THREE.Mesh(waterGeo, waterMat);
      water.rotation.x = -Math.PI / 2;
      water.position.y = 0.22;
      modelGroup.add(water);

      // Starting blocks
      for (let i = -2; i <= 2; i++) {
        const block = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.45, 0.7),
          new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.5 })
        );
        block.position.set(-6.2, 0.48, i * 1.35);
        block.castShadow = true;
        modelGroup.add(block);
      }

    } else if (sportKey === 'pickleball' || sportKey === 'badminton') {
      // Court Surface
      const courtColor = sportKey === 'pickleball' ? 0x0284c7 : 0x16a34a;
      const courtGeo = new THREE.BoxGeometry(14, 0.3, 8.5);
      const courtMat = new THREE.MeshStandardMaterial({ color: courtColor, roughness: 0.4 });
      const court = new THREE.Mesh(courtGeo, courtMat);
      court.receiveShadow = true;
      modelGroup.add(court);

      // White boundary
      const bound = new THREE.Mesh(new THREE.PlaneGeometry(12, 6.5), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }));
      bound.rotation.x = -Math.PI / 2;
      bound.position.y = 0.16;
      modelGroup.add(bound);

      // Net
      const netGeo = new THREE.PlaneGeometry(0.1, 7);
      const netMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
      const net = new THREE.Mesh(netGeo, netMat);
      net.rotation.z = Math.PI / 2;
      net.position.set(0, 0.8, 0);
      modelGroup.add(net);

      // Net posts
      [-3.6, 3.6].forEach(z => {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 1.5, 16),
          new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
        );
        post.position.set(0, 0.75, z);
        post.castShadow = true;
        modelGroup.add(post);
      });

    } else if (sportKey === 'boxing') {
      // Boxing Ring Platform
      const ringBase = new THREE.Mesh(
        new THREE.BoxGeometry(9, 1.2, 9),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 })
      );
      ringBase.position.y = 0.6;
      modelGroup.add(ringBase);

      const canvasMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.7 });
      const canvasMesh = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.1, 8.2), canvasMat);
      canvasMesh.position.y = 1.25;
      modelGroup.add(canvasMesh);

      // 4 Corner Posts & Ropes
      const corners = [[-3.8, -3.8], [3.8, -3.8], [3.8, 3.8], [-3.8, 3.8]];
      corners.forEach(([x, z], idx) => {
        const postColor = idx === 0 ? 0xef4444 : (idx === 1 ? 0x3b82f6 : 0xffffff);
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.12, 2.5, 16),
          new THREE.MeshStandardMaterial({ color: postColor, metalness: 0.8 })
        );
        post.position.set(x, 2.25, z);
        post.castShadow = true;
        modelGroup.add(post);
      });

      // Hanging Heavy Bag
      const bagGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.6, 24);
      const bagMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
      const bag = new THREE.Mesh(bagGeo, bagMat);
      bag.position.set(5.5, 2.2, 0);
      bag.castShadow = true;
      modelGroup.add(bag);

    } else if (sportKey === 'gym') {
      // Gym Rubber Flooring
      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(12, 0.2, 10),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
      );
      floor.receiveShadow = true;
      modelGroup.add(floor);

      // Power Rack Cage
      const rackMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.8, roughness: 0.2 });
      [-1.2, 1.2].forEach(x => {
        [-0.8, 0.8].forEach(z => {
          const col = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.2, 0.12), rackMat);
          col.position.set(x, 1.6, z);
          col.castShadow = true;
          modelGroup.add(col);
        });
      });

      // Barbell & Weights
      const barGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.2, 16);
      const bar = new THREE.Mesh(barGeo, new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 }));
      bar.rotation.z = Math.PI / 2;
      bar.position.set(0, 1.7, 0);
      modelGroup.add(bar);

      // Plates
      [-1.3, 1.3].forEach(x => {
        const plate = new THREE.Mesh(
          new THREE.CylinderGeometry(0.45, 0.45, 0.08, 24),
          new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 })
        );
        plate.rotation.z = Math.PI / 2;
        plate.position.set(x, 1.7, 0);
        modelGroup.add(plate);
      });

      // Dumbbell Rack
      const dbRack = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 1.2, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 })
      );
      dbRack.position.set(-3.8, 0.6, 0);
      modelGroup.add(dbRack);

    } else {
      // Default / Football / General Multi-Court
      const pitch = new THREE.Mesh(
        new THREE.BoxGeometry(15, 0.3, 10),
        new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 })
      );
      pitch.receiveShadow = true;
      modelGroup.add(pitch);

      const lines = new THREE.Mesh(new THREE.PlaneGeometry(13.8, 8.8), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }));
      lines.rotation.x = -Math.PI / 2;
      lines.position.y = 0.16;
      modelGroup.add(lines);

      // Soccer Goal Post
      const goalMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.7 });
      const goalBar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 16), goalMat);
      goalBar.rotation.z = Math.PI / 2;
      goalBar.position.set(6.4, 1.8, 0);
      modelGroup.add(goalBar);
      [-1.5, 1.5].forEach(z => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 16), goalMat);
        post.position.set(6.4, 0.9, z);
        modelGroup.add(post);
      });

      // 3D Ball
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
      );
      ball.position.set(0, 0.55, 0);
      modelGroup.add(ball);
    }

    // Animation Loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [sportKey, isNightMode]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-fadeIn"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-white/20 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center border border-red-500/30">
              <span className="material-symbols-outlined text-[22px]">view_in_ar</span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                  {isEn ? 'Interactive 3D Simulation' : 'Mô phỏng 3D Thực tế'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                {isEn ? spec.titleEn : spec.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Night / Day Lighting Toggle */}
            <button
              type="button"
              onClick={() => setIsNightMode(!isNightMode)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 transition cursor-pointer"
              title="Đổi ánh sáng"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isNightMode ? 'light_mode' : 'dark_mode'}
              </span>
              <span>{isNightMode ? 'Ban Ngày' : 'Đèn LED Đêm'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Đóng mô hình 3D"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* 3D Viewport */}
        <div className="relative w-full h-[420px] sm:h-[480px] bg-slate-950">
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Floating Orbit Help Indicator */}
          <div className="absolute top-4 left-4 pointer-events-none px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-slate-200 flex items-center gap-2 shadow-lg">
            <span className="material-symbols-outlined text-[15px] text-cyan-400 animate-spin">3d_rotation</span>
            <span>{isEn ? 'Drag to rotate 360° • Scroll to zoom' : 'Kéo để xoay 360° • Cuộn chuột để phóng to'}</span>
          </div>
        </div>

        {/* Footer Specification Strip */}
        <div className="p-4 sm:p-5 bg-slate-950/80 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-xl">
            <div className="text-xs text-slate-400 font-medium">
              {isEn ? 'Technical Specifications:' : 'Thông số kỹ thuật tiêu chuẩn:'}
            </div>
            <div className="text-sm text-slate-200 font-medium mt-0.5">
              {isEn ? spec.specsEn : spec.specs}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/20 text-slate-200 hover:bg-white/10 text-xs font-bold transition cursor-pointer"
            >
              {isEn ? 'Close' : 'Đóng'}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onBookingClick) onBookingClick(sport);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-red-600/30 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>{isEn ? 'Book This Sport' : 'Đăng Ký Đặt Sân'}</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SportModelModal3D;
