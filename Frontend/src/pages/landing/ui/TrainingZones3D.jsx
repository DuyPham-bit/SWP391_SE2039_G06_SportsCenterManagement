import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const ZONE_DATA = {
  outdoor: {
    id: 'outdoor',
    name: 'Khu Sân Ngoài Trời: Bóng Đá & Pickleball',
    nameEn: 'Outdoor Complex: Soccer & Pickleball',
    badge: 'Cánh Đông • 5.200 m²',
    area: '5.200 m²',
    color: '#10b981',
    camPos: [36, 32, 42],
    camTarget: [34, 0, -2],
    markerPos: [34, 6, -2],
    description: 'Tổ hợp sân thể thao ngoài trời hiện đại gồm 1 sân bóng đá 7 người cỏ nhân tạo, 1 sân 5 người và 4 cụm sân Pickleball tiêu chuẩn thi đấu, trang bị dàn đèn pha LED 500 Lux.',
    descriptionEn: 'Modern outdoor complex with 1 7-a-side pitch, 1 5-a-side pitch and 4 tournament pickleball courts equipped with 500 Lux anti-glare LED illumination.',
    floors: [
      {
        num: 1,
        title: 'Cụm Sân Thi Đấu Ngoài Trời',
        titleEn: 'Outdoor Tournament Courts',
        items: [
          '⚽ 1 Sân bóng đá 7 người cỏ nhân tạo đạt chuẩn FIFA Quality',
          '⚽ 1 Sân bóng đá 5 người mặt cỏ êm, chống chấn thương',
          '🎾 4 Sân Pickleball chuyên nghiệp mặt sơn Acrylic chống trơn trượt',
          '💡 Dàn đèn pha LED 500 Lux chiếu sáng ban đêm sắc nét'
        ]
      }
    ]
  },
  khuA: {
    id: 'khuA',
    name: 'Khu A: Bơi Lội, Gym & Fitness',
    nameEn: 'Zone A: Swimming, Gym & Fitness',
    badge: 'Cánh Tây (Bắc) • 2.200 m²',
    area: '2.200 m²',
    color: '#38bdf8',
    camPos: [-36, 28, -12],
    camTarget: [-34, 6, -34],
    markerPos: [-34, 16, -34],
    description: 'Tòa nhà thể thao 3 tầng liên hợp với cụm hồ bơi nước ấm bốn mùa, phòng tập thể hình chuẩn quốc tế cùng hệ thống phòng thay đồ cao cấp.',
    descriptionEn: '3-story complex with a four-season indoor heated pool, international-standard fitness gym, and luxury locker/shower suites.',
    floors: [
      {
        num: 1,
        title: 'Tầng 1: Bể Bơi Bốn Mùa 25m',
        titleEn: 'Floor 1: Heated Swimming Pool 25m',
        items: [
          '🏊 Hồ bơi 25m trong nhà, 6 làn bơi tiêu chuẩn thi đấu',
          '🌡️ Hệ thống gia nhiệt nước ấm bốn mùa 28-30°C tự động',
          '💧 Công nghệ lọc nước điện phân muối khoáng không dùng Clo'
        ]
      },
      {
        num: 2,
        title: 'Tầng 2: Phòng Tập Gym & Fitness',
        titleEn: 'Floor 2: Fitness & Strength Gym',
        items: [
          '🏋️ Máy tập kháng lực & dàn tạ tự do Impulse / Technogym',
          '🏃 Dàn máy Cardio, máy chạy bộ góc nhìn toàn cảnh',
          '📊 Trạm phân tích chỉ số cơ thể InBody 770 chuyên sâu'
        ]
      },
      {
        num: 3,
        title: 'Tầng 3: Khu Thay Đồ & Tắm Tráng',
        titleEn: 'Floor 3: Locker & Shower Facilities',
        items: [
          '🚿 40 buồng tắm tráng nóng lạnh riêng biệt sạch sẽ',
          '🔐 Hệ thống tủ locker khóa từ RFID bảo mật',
          '🧖 Phòng xông hơi khô Sauna & xông ướt Steambath'
        ]
      }
    ]
  },
  khuB: {
    id: 'khuB',
    name: 'Khu B: Bóng Rổ, Cầu Lông & Bóng Bàn',
    nameEn: 'Zone B: Basketball, Badminton & Table Tennis',
    badge: 'Cánh Tây (Giữa) • 1.800 m²',
    area: '1.800 m²',
    color: '#f59e0b',
    camPos: [-36, 28, 24],
    camTarget: [-34, 6, 2],
    markerPos: [-34, 16, 2],
    description: 'Nhà thi đấu bóng và cầu lông chuyên nghiệp với mặt sàn gỗ thông Maple Bắc Mỹ giảm chấn và cụm thảm cao su chuyên dụng thi đấu quốc tế.',
    descriptionEn: 'Professional ball sports hall with Canadian Maple hardwood court and international competition rubber mats.',
    floors: [
      {
        num: 1,
        title: 'Tầng 1: Sân Bóng Rổ Tiêu Chuẩn',
        titleEn: 'Floor 1: Championship Basketball Court',
        items: [
          '🏀 Mặt sàn gỗ tự nhiên giảm chấn đạt chuẩn FIBA',
          '🎯 2 trụ bóng rổ thủy lực di động chuẩn thi đấu',
          '🪑 Khán đài di động sức chứa 150 chỗ ngồi'
        ]
      },
      {
        num: 2,
        title: 'Tầng 2: Cụm 4 Sân Cầu Lông',
        titleEn: 'Floor 2: 4-Court Badminton Arena',
        items: [
          '🏸 4 sân thảm cao su PVC vân cát chống trượt BWF',
          '💡 Đèn LED hắt gián tiếp chống lóa mắt cho vận động viên',
          '🌬️ Hệ thống thông gió tươi lọc khí mát mẻ'
        ]
      },
      {
        num: 3,
        title: 'Tầng 3: Khu Bóng Bàn Trong Nhà',
        titleEn: 'Floor 3: Indoor Table Tennis Club',
        items: [
          '🏓 4 bàn bóng bàn tiêu chuẩn thi đấu ITTF mặt bàn 25mm',
          '🤖 Máy bắn bóng bàn tự động hỗ trợ tập luyện phản xạ',
          '🛡️ Rào chắn bóng bọc xốp ngăn cách từng bàn'
        ]
      }
    ]
  },
  khuC: {
    id: 'khuC',
    name: 'Khu C: Võ Thuật, Boxing, Yoga & Pilates',
    nameEn: 'Zone C: Martial Arts, Boxing, Yoga & Pilates',
    badge: 'Cánh Tây (Nam) • 1.200 m²',
    area: '1.200 m²',
    color: '#f43f5e',
    camPos: [-36, 28, 60],
    camTarget: [-34, 6, 38],
    markerPos: [-34, 16, 38],
    description: 'Trung tâm đào tạo thể lực đối kháng và phục hồi tinh thần với sàn đài boxing tiêu chuẩn, thảm võ thuật tatami và studio Yoga tĩnh lặng.',
    descriptionEn: 'Martial arts combat and wellness center with boxing ring, tatami mats, and serene Yoga/Pilates studio.',
    floors: [
      {
        num: 1,
        title: 'Tầng 1: Phòng Võ Thuật & Boxing',
        titleEn: 'Floor 1: Martial Arts & Boxing Arena',
        items: [
          '🥊 Sàn đài Boxing & Muay Thái có đệm giảm chấn',
          '🥋 Thảm võ thuật Tatami tiêu chuẩn Taekwondo / Vovinam',
          '🧱 Dàn bao cát đấm bốc hạng nặng chuyên nghiệp'
        ]
      },
      {
        num: 2,
        title: 'Tầng 2: Tủ Đồ Cá Nhân & Thay Đồ',
        titleEn: 'Floor 2: Member Changing & Locker Area',
        items: [
          '🔒 Dãy tủ cá nhân khóa mật mã an toàn',
          '🪞 Gương trang điểm, máy sấy tóc tiện nghi',
          '👕 Phòng thay đồ riêng tư thoáng mát'
        ]
      },
      {
        num: 3,
        title: 'Tầng 3: Studio Yoga & Pilates Reformer',
        titleEn: 'Floor 3: Yoga & Pilates Reformer Studio',
        items: [
          '🧘 Phòng sàn gỗ ấm cúng với thảm tập cao su Manduka',
          '⚙️ 6 máy tập Pilates Reformer cao cấp',
          '🌿 Không gian tràn ngập ánh sáng tự nhiên và hương tinh dầu'
        ]
      }
    ]
  },
  lobby: {
    id: 'lobby',
    name: 'Sảnh Lễ Tân, Căn-Tin & Y Tế',
    nameEn: 'Central Lobby, Café & First Aid',
    badge: 'Trục Trung Tâm • 1.850 m²',
    area: '1.850 m²',
    color: '#c084fc',
    camPos: [-4, 26, 28],
    camTarget: [-4, 3, 2],
    markerPos: [-4, 10, 2],
    description: 'Khu vực đón tiếp hội viên hiện đại, tích hợp quầy lễ tân check-in thông minh, căn-tin nước giải khát dinh dưỡng và trạm sơ cấp cứu y tế.',
    descriptionEn: 'Central hub featuring smart check-in reception, healthy beverage café, and fully equipped sports medical clinic.',
    floors: [
      {
        num: 1,
        title: 'Sảnh Tiếp Đón & Dịch Vụ',
        titleEn: 'Reception & Member Services',
        items: [
          '🛎️ Quầy lễ tân đón tiếp và quầy check-in thông minh qua QR',
          '☕ Căn-tin nước giải khát, protein shake và cà phê thể thao',
          '🩺 Trạm y tế & tủ thuốc sơ cứu ban đầu luôn sẵn sàng 24/7'
        ]
      }
    ]
  },
  parking: {
    id: 'parking',
    name: 'Khu Bãi Đỗ Xe Ô Tô Tập Trung',
    nameEn: 'Central Car Parking (20 bays)',
    badge: 'Cổng Phía Nam • 750 m²',
    area: '750 m²',
    color: '#22d3ee',
    camPos: [0, 22, 66],
    camTarget: [0, 0, 48],
    markerPos: [0, 6, 48],
    description: 'Bãi đỗ xe ô tô và xe máy rộng rãi với 20 ô đỗ xe ô tô tiêu chuẩn, lối ra vào 2 chiều thông thoáng và camera an ninh giám sát 24/7.',
    descriptionEn: 'Spacious car and motorcycle parking with 20 marked bays, 2-way access, and 24/7 security cameras.',
    floors: [
      {
        num: 1,
        title: 'Khu Vực Bãi Đỗ Xe',
        titleEn: 'Parking Facilities',
        items: [
          '🚗 20 ô đỗ xe ô tô có vạch kẻ sơn phản quang rõ nét',
          '🛵 Khu vực đỗ xe máy riêng biệt có mái che',
          '📹 Hệ thống kiểm soát biển số tự động và camera an ninh'
        ]
      }
    ]
  }
};

// Procedural Canvas Texture Generators
function createSoccerTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  // Striped turf
  const stripes = 8;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#236940' : '#2d7d4c';
    ctx.fillRect(0, (i * 512) / stripes, 512, 512 / stripes);
  }
  // Boundary & Field lines
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.strokeRect(18, 18, 476, 476);
  // Halfway line
  ctx.beginPath();
  ctx.moveTo(18, 256);
  ctx.lineTo(494, 256);
  ctx.stroke();
  // Center circle
  ctx.beginPath();
  ctx.arc(256, 256, 50, 0, Math.PI * 2);
  ctx.stroke();
  // Penalty boxes
  ctx.strokeRect(156, 18, 200, 70);
  ctx.strokeRect(156, 424, 200, 70);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

function createPickleballTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  // Outer apron
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(0, 0, 512, 512);
  // Main court
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(40, 20, 432, 472);
  // Non-volley zone (kitchen) in lime/amber
  ctx.fillStyle = '#65a30d';
  ctx.fillRect(40, 196, 432, 120);
  // White lines
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.strokeRect(40, 20, 432, 472);
  ctx.strokeRect(40, 196, 432, 120);
  // Center service line
  ctx.beginPath();
  ctx.moveTo(256, 20);
  ctx.lineTo(256, 196);
  ctx.moveTo(256, 316);
  ctx.lineTo(256, 492);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

function createBasketballTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  // Maple wood floor
  ctx.fillStyle = '#b45309';
  ctx.fillRect(0, 0, 512, 512);
  // Planks pattern
  ctx.fillStyle = '#d97706';
  for (let i = 0; i < 512; i += 16) {
    if ((i / 16) % 2 === 0) ctx.fillRect(0, i, 512, 8);
  }
  // Court markings
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 20, 452, 472);
  // Center line & circle
  ctx.beginPath();
  ctx.moveTo(30, 256);
  ctx.lineTo(482, 256);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(256, 256, 50, 0, Math.PI * 2);
  ctx.stroke();
  // 3-point arcs
  ctx.beginPath();
  ctx.arc(256, 50, 120, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(256, 462, 120, Math.PI, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

function createPoolTileTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(0, 0, 256, 512);
  // 6 swimming lanes with black dividers
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 4;
  for (let l = 1; l <= 5; l++) {
    const x = (l * 256) / 6;
    ctx.beginPath();
    ctx.setLineDash([12, 12]);
    ctx.moveTo(x, 20);
    ctx.lineTo(x, 492);
    ctx.stroke();
    // Lane T markers at end
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x - 8, 40);
    ctx.lineTo(x + 8, 40);
    ctx.moveTo(x - 8, 472);
    ctx.lineTo(x + 8, 472);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

export function TrainingZones3D({ isEn = false, onBookingClick }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const animFrameIdRef = useRef(null);

  // Groups and objects for interactive manipulation
  const zoneGroupsRef = useRef({});
  const floodlightsRef = useRef([]);
  const dirLightRef = useRef(null);
  const hemiLightRef = useRef(null);
  const ambientLightRef = useRef(null);

  // State
  const [selectedZoneKey, setSelectedZoneKey] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(0); // 0: all, 1, 2, 3
  const [lightingMode, setLightingMode] = useState('day'); // 'day', 'sunset', 'night'
  const [cameraMode, setCameraMode] = useState('flycam'); // 'flycam', 'walk', 'plan2d'
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [markerPositions, setMarkerPositions] = useState({});

  // Smooth Camera Animation Lerp
  const targetCamPosRef = useRef(new THREE.Vector3(0, 78, 102));
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0, 0));
  const isTransitioningRef = useRef(false);

  // Set Camera Target
  const animateCameraTo = useCallback((posArray, targetArray) => {
    targetCamPosRef.current.set(posArray[0], posArray[1], posArray[2]);
    targetLookAtRef.current.set(targetArray[0], targetArray[1], targetArray[2]);
    isTransitioningRef.current = true;
  }, []);

  // Zone focus handler
  const focusZone = useCallback((zoneKey, targetFloor = 0) => {
    const zone = ZONE_DATA[zoneKey];
    if (!zone) return;
    setSelectedZoneKey(zoneKey);
    setSelectedFloor(targetFloor);
    animateCameraTo(zone.camPos, zone.camTarget);
  }, [animateCameraTo]);

  // Reset to master view
  const resetMasterView = useCallback(() => {
    setSelectedZoneKey(null);
    setSelectedFloor(0);
    setCameraMode('flycam');
    animateCameraTo([0, 78, 102], [0, 0, 0]);
  }, [animateCameraTo]);

  // Set 2D Plan View
  const setPlan2DView = useCallback(() => {
    setCameraMode('plan2d');
    animateCameraTo([0, 115, 0.01], [0, 0, 0]);
  }, [animateCameraTo]);

  // Toggle Walk Mode vs Flycam
  const toggleWalkMode = useCallback(() => {
    if (cameraMode === 'walk') {
      setCameraMode('flycam');
      animateCameraTo([0, 78, 102], [0, 0, 0]);
    } else {
      setCameraMode('walk');
      animateCameraTo([0, 3.5, 55], [0, 2, 0]);
    }
  }, [cameraMode, animateCameraTo]);

  // Lighting Mode update
  const applyLightingMode = useCallback((mode) => {
    setLightingMode(mode);
    if (!dirLightRef.current || !hemiLightRef.current || !ambientLightRef.current) return;

    if (mode === 'day') {
      dirLightRef.current.color.setHex(0xfffaed);
      dirLightRef.current.intensity = 1.6;
      dirLightRef.current.position.set(50, 70, 40);
      hemiLightRef.current.color.setHex(0xcce8ff);
      hemiLightRef.current.groundColor.setHex(0x28303e);
      hemiLightRef.current.intensity = 0.9;
      ambientLightRef.current.color.setHex(0x334155);
      ambientLightRef.current.intensity = 0.7;
      if (sceneRef.current) sceneRef.current.background = new THREE.Color(0x141829);
      floodlightsRef.current.forEach(l => { l.intensity = 0; });
    } else if (mode === 'sunset') {
      dirLightRef.current.color.setHex(0xf97316);
      dirLightRef.current.intensity = 1.8;
      dirLightRef.current.position.set(70, 30, -50);
      hemiLightRef.current.color.setHex(0xfb923c);
      hemiLightRef.current.groundColor.setHex(0x1e1b4b);
      hemiLightRef.current.intensity = 0.8;
      ambientLightRef.current.color.setHex(0x7c2d12);
      ambientLightRef.current.intensity = 0.6;
      if (sceneRef.current) sceneRef.current.background = new THREE.Color(0x261423);
      floodlightsRef.current.forEach(l => { l.intensity = 0.5; });
    } else if (mode === 'night') {
      dirLightRef.current.color.setHex(0x38bdf8);
      dirLightRef.current.intensity = 0.35;
      dirLightRef.current.position.set(20, 60, 20);
      hemiLightRef.current.color.setHex(0x0f172a);
      hemiLightRef.current.groundColor.setHex(0x020617);
      hemiLightRef.current.intensity = 0.4;
      ambientLightRef.current.color.setHex(0x0b1329);
      ambientLightRef.current.intensity = 0.45;
      if (sceneRef.current) sceneRef.current.background = new THREE.Color(0x080b14);
      floodlightsRef.current.forEach(l => { l.intensity = 2.4; });
    }
  }, []);

  // Floor Slicer logic
  useEffect(() => {
    Object.entries(zoneGroupsRef.current).forEach(([zKey, group]) => {
      if (!group || !group.userData.floors) return;
      const { floor1, floor2, floor3, roof } = group.userData.floors;

      if (selectedZoneKey && selectedZoneKey !== zKey) {
        // Return non-selected zones to normal
        if (floor1) { floor1.position.y = 0; floor1.visible = true; }
        if (floor2) { floor2.position.y = 0; floor2.visible = true; }
        if (floor3) { floor3.position.y = 0; floor3.visible = true; }
        if (roof) { roof.position.y = 0; roof.visible = true; }
        return;
      }

      if (selectedFloor === 0) {
        // All floors
        if (floor1) { floor1.position.y = 0; floor1.visible = true; }
        if (floor2) { floor2.position.y = 0; floor2.visible = true; }
        if (floor3) { floor3.position.y = 0; floor3.visible = true; }
        if (roof) { roof.position.y = 0; roof.visible = true; }
      } else if (selectedFloor === 1) {
        // Floor 1 cutaway
        if (floor1) { floor1.position.y = 0; floor1.visible = true; }
        if (floor2) { floor2.position.y = 16; floor2.visible = false; }
        if (floor3) { floor3.position.y = 26; floor3.visible = false; }
        if (roof) { roof.position.y = 36; roof.visible = false; }
      } else if (selectedFloor === 2) {
        // Floor 2 cutaway
        if (floor1) { floor1.position.y = 0; floor1.visible = true; }
        if (floor2) { floor2.position.y = 0; floor2.visible = true; }
        if (floor3) { floor3.position.y = 20; floor3.visible = false; }
        if (roof) { roof.position.y = 30; roof.visible = false; }
      } else if (selectedFloor === 3) {
        // Floor 3 cutaway
        if (floor1) { floor1.position.y = 0; floor1.visible = true; }
        if (floor2) { floor2.position.y = 0; floor2.visible = true; }
        if (floor3) { floor3.position.y = 0; floor3.visible = true; }
        if (roof) { roof.position.y = 18; roof.visible = false; }
      }
    });
  }, [selectedFloor, selectedZoneKey]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x141829);
    scene.fog = new THREE.FogExp2(0x141829, 0.0035);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 800);
    camera.position.set(0, 78, 102);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.03; // Prevent diving under floor
    controls.minDistance = 8;
    controls.maxDistance = 180;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0x334155, 0.7);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const hemiLight = new THREE.HemisphereLight(0xcce8ff, 0x28303e, 0.9);
    hemiLight.position.set(0, 80, 0);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.6);
    dirLight.position.set(50, 70, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 240;
    dirLight.shadow.camera.left = -80;
    dirLight.shadow.camera.right = 80;
    dirLight.shadow.camera.top = 80;
    dirLight.shadow.camera.bottom = -80;
    dirLight.shadow.bias = -0.0004;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // 6. Ground Base (130m x 100m Master Site)
    const baseGroup = new THREE.Group();
    scene.add(baseGroup);

    // Site boundary asphalt/pavement
    const siteGeo = new THREE.PlaneGeometry(130, 100);
    const siteMat = new THREE.MeshStandardMaterial({ color: 0x1e2230, roughness: 0.88, metalness: 0.08 });
    const siteMesh = new THREE.Mesh(siteGeo, siteMat);
    siteMesh.rotation.x = -Math.PI / 2;
    siteMesh.receiveShadow = true;
    baseGroup.add(siteMesh);

    // Surrounding buffer terrain
    const outerTerrainGeo = new THREE.PlaneGeometry(320, 260);
    const outerTerrainMat = new THREE.MeshStandardMaterial({ color: 0x0f131f, roughness: 0.95 });
    const outerTerrain = new THREE.Mesh(outerTerrainGeo, outerTerrainMat);
    outerTerrain.rotation.x = -Math.PI / 2;
    outerTerrain.position.y = -0.15;
    outerTerrain.receiveShadow = true;
    baseGroup.add(outerTerrain);

    // Central Boulevard & Walkways
    const walkwayGeo = new THREE.PlaneGeometry(12, 94);
    const walkwayMat = new THREE.MeshStandardMaterial({ color: 0x333b4e, roughness: 0.8 });
    const mainWalkway = new THREE.Mesh(walkwayGeo, walkwayMat);
    mainWalkway.rotation.x = -Math.PI / 2;
    mainWalkway.position.set(4, 0.02, 0);
    mainWalkway.receiveShadow = true;
    baseGroup.add(mainWalkway);

    // Cross Walkways connecting East and West wings
    const crossWalkway1 = new THREE.Mesh(new THREE.PlaneGeometry(70, 6), walkwayMat);
    crossWalkway1.rotation.x = -Math.PI / 2;
    crossWalkway1.position.set(0, 0.02, -18);
    crossWalkway1.receiveShadow = true;
    baseGroup.add(crossWalkway1);

    const crossWalkway2 = new THREE.Mesh(new THREE.PlaneGeometry(70, 6), walkwayMat);
    crossWalkway2.rotation.x = -Math.PI / 2;
    crossWalkway2.position.set(0, 0.02, 22);
    crossWalkway2.receiveShadow = true;
    baseGroup.add(crossWalkway2);

    // ─────────────────────────────────────────────────────────────
    // 7. BUILDINGS & ZONES
    // ─────────────────────────────────────────────────────────────
    const zoneGroups = {};

    // --- ZONE 1: OUTDOOR COMPLEX (East Wing: x: ~34, z: ~-2) ---
    const outdoorGroup = new THREE.Group();
    outdoorGroup.position.set(36, 0, -2);
    outdoorGroup.userData = { id: 'outdoor' };
    scene.add(outdoorGroup);
    zoneGroups.outdoor = outdoorGroup;

    // Soccer Field (7-a-side)
    const soccerTex = createSoccerTexture();
    const soccerGeo = new THREE.PlaneGeometry(36, 52);
    const soccerMat = new THREE.MeshStandardMaterial({ map: soccerTex, roughness: 0.7 });
    const soccerPitch = new THREE.Mesh(soccerGeo, soccerMat);
    soccerPitch.rotation.x = -Math.PI / 2;
    soccerPitch.position.set(-6, 0.05, -12);
    soccerPitch.receiveShadow = true;
    outdoorGroup.add(soccerPitch);

    // Goalposts for Soccer Field
    const goalMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const goal1 = new THREE.Mesh(new THREE.BoxGeometry(6, 2.5, 1.5), goalMat);
    goal1.position.set(-6, 1.25, -37);
    goal1.castShadow = true;
    outdoorGroup.add(goal1);
    const goal2 = new THREE.Mesh(new THREE.BoxGeometry(6, 2.5, 1.5), goalMat);
    goal2.position.set(-6, 1.25, 13);
    goal2.castShadow = true;
    outdoorGroup.add(goal2);

    // 4 Pickleball Courts
    const pbTex = createPickleballTexture();
    const pbMat = new THREE.MeshStandardMaterial({ map: pbTex, roughness: 0.6 });
    for (let p = 0; p < 4; p++) {
      const pbMesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 18), pbMat);
      pbMesh.rotation.x = -Math.PI / 2;
      const pCol = p % 2;
      const pRow = Math.floor(p / 2);
      pbMesh.position.set(16 + pCol * 12, 0.05, -20 + pRow * 22);
      pbMesh.receiveShadow = true;
      outdoorGroup.add(pbMesh);

      // Pickleball Net
      const netMesh = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.9, 0.1), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 }));
      netMesh.position.set(16 + pCol * 12, 0.45, -20 + pRow * 22);
      netMesh.castShadow = true;
      outdoorGroup.add(netMesh);
    }

    // Floodlight Poles & Night Spotlights
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
    const floodlightSpots = [];
    const lightPositions = [
      [-26, 0, -38], [14, 0, -38],
      [-26, 0, 14], [14, 0, 14],
      [28, 0, 4]
    ];
    lightPositions.forEach(([lx, ly, lz]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 14, 8), poleMat);
      pole.position.set(lx, 7, lz);
      pole.castShadow = true;
      outdoorGroup.add(pole);

      const lampHead = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 1), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2 }));
      lampHead.position.set(lx, 14, lz);
      outdoorGroup.add(lampHead);

      const spot = new THREE.SpotLight(0xffffff, 0, 60, Math.PI / 3, 0.5, 1);
      spot.position.set(lx + 36, 14, lz - 2);
      spot.target.position.set(36, 0, -2);
      scene.add(spot);
      scene.add(spot.target);
      floodlightSpots.push(spot);
    });
    floodlightsRef.current = floodlightSpots;

    // Helper to build 3-floor building with interior & removable roof
    const create3FloorBuilding = (bWidth, bDepth, wallColor, createF1, createF2, createF3) => {
      const bGroup = new THREE.Group();
      const floorHeight = 4.6;

      // Common building materials
      const concreteMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.65, metalness: 0.1 });
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x94a3b8,
        metalness: 0.15,
        roughness: 0.1,
        transmission: 0.8,
        transparent: true,
        opacity: 0.45
      });
      const columnMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.5 });

      // Floor 1 (Ground)
      const f1Group = new THREE.Group();
      bGroup.add(f1Group);
      const slab1 = new THREE.Mesh(new THREE.BoxGeometry(bWidth, 0.3, bDepth), concreteMat);
      slab1.position.y = 0.15;
      slab1.receiveShadow = true;
      f1Group.add(slab1);
      // Perimeter Glass & Columns
      const glassF1 = new THREE.Mesh(new THREE.BoxGeometry(bWidth - 0.2, floorHeight - 0.4, bDepth - 0.2), glassMat);
      glassF1.position.y = floorHeight / 2;
      f1Group.add(glassF1);
      if (createF1) createF1(f1Group, bWidth, bDepth);

      // Floor 2
      const f2Group = new THREE.Group();
      bGroup.add(f2Group);
      const slab2 = new THREE.Mesh(new THREE.BoxGeometry(bWidth, 0.4, bDepth), concreteMat);
      slab2.position.y = floorHeight;
      slab2.receiveShadow = true;
      f2Group.add(slab2);
      const glassF2 = new THREE.Mesh(new THREE.BoxGeometry(bWidth - 0.2, floorHeight - 0.4, bDepth - 0.2), glassMat);
      glassF2.position.y = floorHeight + floorHeight / 2;
      f2Group.add(glassF2);
      if (createF2) createF2(f2Group, bWidth, bDepth, floorHeight);

      // Floor 3
      const f3Group = new THREE.Group();
      bGroup.add(f3Group);
      const slab3 = new THREE.Mesh(new THREE.BoxGeometry(bWidth, 0.4, bDepth), concreteMat);
      slab3.position.y = floorHeight * 2;
      slab3.receiveShadow = true;
      f3Group.add(slab3);
      const glassF3 = new THREE.Mesh(new THREE.BoxGeometry(bWidth - 0.2, floorHeight - 0.4, bDepth - 0.2), glassMat);
      glassF3.position.y = floorHeight * 2 + floorHeight / 2;
      f3Group.add(glassF3);
      if (createF3) createF3(f3Group, bWidth, bDepth, floorHeight * 2);

      // Roof
      const roofGroup = new THREE.Group();
      bGroup.add(roofGroup);
      const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(bWidth + 0.6, 0.5, bDepth + 0.6), concreteMat);
      roofSlab.position.y = floorHeight * 3 + 0.25;
      roofSlab.castShadow = true;
      roofGroup.add(roofSlab);

      // Skylight / AC Units on roof
      const acUnit = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 2), columnMat);
      acUnit.position.set(2, floorHeight * 3 + 1, 0);
      roofGroup.add(acUnit);

      bGroup.userData.floors = { floor1: f1Group, floor2: f2Group, floor3: f3Group, roof: roofGroup };
      return bGroup;
    };

    // --- ZONE 2: KHU A (West Wing North: x: -34, z: -34) ---
    const poolTex = createPoolTileTexture();
    const khuAGroup = create3FloorBuilding(28, 22, 0x1e3a5f,
      (f1) => {
        // Floor 1: 25m Swimming Pool
        const poolWater = new THREE.Mesh(
          new THREE.PlaneGeometry(22, 14),
          new THREE.MeshPhysicalMaterial({
            color: 0x06b6d4,
            transmission: 0.85,
            roughness: 0.08,
            transparent: true,
            opacity: 0.75
          })
        );
        poolWater.rotation.x = -Math.PI / 2;
        poolWater.position.set(0, 0.4, 0);
        f1.add(poolWater);

        const poolBed = new THREE.Mesh(new THREE.PlaneGeometry(22, 14), new THREE.MeshStandardMaterial({ map: poolTex }));
        poolBed.rotation.x = -Math.PI / 2;
        poolBed.position.set(0, 0.18, 0);
        f1.add(poolBed);
      },
      (f2, bw, bd, baseY) => {
        // Floor 2: Gym & Treadmills
        const gymFloor = new THREE.Mesh(new THREE.PlaneGeometry(26, 20), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 }));
        gymFloor.rotation.x = -Math.PI / 2;
        gymFloor.position.set(0, baseY + 0.22, 0);
        f2.add(gymFloor);
        // Dumbbell racks & cardio blocks
        for (let i = -8; i <= 8; i += 4) {
          const m = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 1), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
          m.position.set(i, baseY + 0.8, -6);
          f2.add(m);
        }
      },
      (f3, bw, bd, baseY) => {
        // Floor 3: Locker rows
        for (let l = -6; l <= 6; l += 4) {
          const locker = new THREE.Mesh(new THREE.BoxGeometry(1, 2.2, 5), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
          locker.position.set(l, baseY + 1.2, 0);
          f3.add(locker);
        }
      }
    );
    khuAGroup.position.set(-34, 0, -34);
    khuAGroup.userData.id = 'khuA';
    scene.add(khuAGroup);
    zoneGroups.khuA = khuAGroup;

    // --- ZONE 3: KHU B (West Wing Center: x: -34, z: 2) ---
    const bballTex = createBasketballTexture();
    const khuBGroup = create3FloorBuilding(28, 22, 0x475569,
      (f1) => {
        // Floor 1: Basketball Court
        const bCourt = new THREE.Mesh(new THREE.PlaneGeometry(24, 18), new THREE.MeshStandardMaterial({ map: bballTex, roughness: 0.5 }));
        bCourt.rotation.x = -Math.PI / 2;
        bCourt.position.set(0, 0.22, 0);
        f1.add(bCourt);
        // Basketball Hoops
        const hoopMat = new THREE.MeshStandardMaterial({ color: 0xf97316 });
        const hoop1 = new THREE.Mesh(new THREE.BoxGeometry(2, 3.2, 0.2), hoopMat);
        hoop1.position.set(-11, 2, 0);
        f1.add(hoop1);
        const hoop2 = new THREE.Mesh(new THREE.BoxGeometry(2, 3.2, 0.2), hoopMat);
        hoop2.position.set(11, 2, 0);
        f1.add(hoop2);
      },
      (f2, bw, bd, baseY) => {
        // Floor 2: 4 Badminton Courts
        const badFloor = new THREE.Mesh(new THREE.PlaneGeometry(26, 20), new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 }));
        badFloor.rotation.x = -Math.PI / 2;
        badFloor.position.set(0, baseY + 0.22, 0);
        f2.add(badFloor);
      },
      (f3, bw, bd, baseY) => {
        // Floor 3: Table tennis tables
        const ttMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8 });
        for (let t = -6; t <= 6; t += 4) {
          const table = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 1.4), ttMat);
          table.position.set(t, baseY + 0.6, 0);
          f3.add(table);
        }
      }
    );
    khuBGroup.position.set(-34, 0, 2);
    khuBGroup.userData.id = 'khuB';
    scene.add(khuBGroup);
    zoneGroups.khuB = khuBGroup;

    // --- ZONE 4: KHU C (West Wing South: x: -34, z: 38) ---
    const khuCGroup = create3FloorBuilding(26, 20, 0x4c1d95,
      (f1) => {
        // Floor 1: Boxing Ring & Tatami
        const ring = new THREE.Mesh(new THREE.BoxGeometry(8, 1, 8), new THREE.MeshStandardMaterial({ color: 0xbe123c }));
        ring.position.set(0, 0.5, 0);
        f1.add(ring);
        // Heavy Punching Bags
        const bagMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
        for (let b = -7; b <= 7; b += 3.5) {
          const bag = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.8, 8), bagMat);
          bag.position.set(b, 2.2, -6);
          f1.add(bag);
        }
      },
      (f2, bw, bd, baseY) => {
        // Floor 2: Lockers & Changing
        const lMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
        for (let r = -5; r <= 5; r += 3.5) {
          const m = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 4), lMat);
          m.position.set(r, baseY + 1.2, 0);
          f2.add(m);
        }
      },
      (f3, bw, bd, baseY) => {
        // Floor 3: Yoga & Pilates
        const yogaFloor = new THREE.Mesh(new THREE.PlaneGeometry(24, 18), new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.5 }));
        yogaFloor.rotation.x = -Math.PI / 2;
        yogaFloor.position.set(0, baseY + 0.22, 0);
        f3.add(yogaFloor);
        // Yoga mats
        const matColors = [0xec4899, 0xa855f7, 0x3b82f6, 0x10b981];
        for (let m = -6; m <= 6; m += 4) {
          const yMat = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.5), new THREE.MeshStandardMaterial({ color: matColors[Math.abs(m) % 4] }));
          yMat.rotation.x = -Math.PI / 2;
          yMat.position.set(m, baseY + 0.25, 0);
          f3.add(yMat);
        }
      }
    );
    khuCGroup.position.set(-34, 0, 38);
    khuCGroup.userData.id = 'khuC';
    scene.add(khuCGroup);
    zoneGroups.khuC = khuCGroup;

    // --- ZONE 5: CENTRAL LOBBY (Center Axis: x: -4, z: 2) ---
    const lobbyGroup = new THREE.Group();
    lobbyGroup.position.set(-4, 0, 2);
    lobbyGroup.userData = { id: 'lobby' };
    scene.add(lobbyGroup);
    zoneGroups.lobby = lobbyGroup;

    // Curved Pavilion Lobby
    const lobbyBase = new THREE.Mesh(new THREE.BoxGeometry(20, 0.4, 20), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    lobbyBase.position.y = 0.2;
    lobbyGroup.add(lobbyBase);

    const lobbyGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 9, 6.5, 24),
      new THREE.MeshPhysicalMaterial({ color: 0xe2e8f0, roughness: 0.1, transmission: 0.75, transparent: true, opacity: 0.55 })
    );
    lobbyGlass.position.y = 3.65;
    lobbyGroup.add(lobbyGlass);

    const lobbyRoof = new THREE.Mesh(new THREE.CylinderGeometry(10, 8.5, 0.6, 24), new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6 }));
    lobbyRoof.position.y = 7.2;
    lobbyRoof.castShadow = true;
    lobbyGroup.add(lobbyRoof);

    // Reception desk
    const recepDesk = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 1.2, 16, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
    recepDesk.position.set(0, 1, 0);
    lobbyGroup.add(recepDesk);

    // --- ZONE 6: PARKING LOT (South: x: 0, z: 48) ---
    const parkingGroup = new THREE.Group();
    parkingGroup.position.set(0, 0, 48);
    parkingGroup.userData = { id: 'parking' };
    scene.add(parkingGroup);
    zoneGroups.parking = parkingGroup;

    // Asphalt bay with painted lines
    const parkAsphalt = new THREE.Mesh(new THREE.PlaneGeometry(38, 16), new THREE.MeshStandardMaterial({ color: 0x181e29, roughness: 0.9 }));
    parkAsphalt.rotation.x = -Math.PI / 2;
    parkAsphalt.position.y = 0.04;
    parkAsphalt.receiveShadow = true;
    parkingGroup.add(parkAsphalt);

    // 20 parking stalls with stylized colorful cars
    const carColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0xffffff, 0x64748b, 0x14b8a6];
    for (let c = 0; c < 20; c++) {
      const col = c % 10;
      const row = Math.floor(c / 10);
      const cx = -16 + col * 3.5;
      const cz = -4 + row * 8;

      // Stall white lines
      const lineMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 5), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      lineMesh.rotation.x = -Math.PI / 2;
      lineMesh.position.set(cx + 1.6, 0.06, cz);
      parkingGroup.add(lineMesh);

      // Parked car (70% probability)
      if ((c * 7) % 10 < 7) {
        const car = new THREE.Mesh(new THREE.BoxGeometry(2, 1.2, 4), new THREE.MeshStandardMaterial({ color: carColors[c % carColors.length], roughness: 0.3, metalness: 0.4 }));
        car.position.set(cx, 0.65, cz);
        car.castShadow = true;
        parkingGroup.add(car);
      }
    }

    // Landscaping: Trees & Greenery along perimeter
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const treeFoliageMat1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    const treeFoliageMat2 = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 });

    const treePositions = [
      // West perimeter
      [-54, -40], [-54, -20], [-54, 0], [-54, 20], [-54, 40],
      // East perimeter
      [56, -40], [56, -20], [56, 0], [56, 20], [56, 40],
      // North & South
      [-20, -45], [0, -45], [20, -45],
      [-25, 45], [25, 45]
    ];
    treePositions.forEach(([tx, tz], idx) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 3, 6), treeTrunkMat);
      trunk.position.set(tx, 1.5, tz);
      trunk.castShadow = true;
      scene.add(trunk);

      const fol = new THREE.Mesh(new THREE.ConeGeometry(2.2, 5, 7), idx % 2 === 0 ? treeFoliageMat1 : treeFoliageMat2);
      fol.position.set(tx, 5, tz);
      fol.castShadow = true;
      scene.add(fol);
    });

    zoneGroupsRef.current = zoneGroups;

    // 8. Animation & Render Loop
    let lastTime = performance.now();
    const animate = (currentTime) => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      // Camera Position Smooth Lerp
      if (isTransitioningRef.current) {
        camera.position.lerp(targetCamPosRef.current, 0.08);
        controls.target.lerp(targetLookAtRef.current, 0.08);
        if (
          camera.position.distanceTo(targetCamPosRef.current) < 0.15 &&
          controls.target.distanceTo(targetLookAtRef.current) < 0.15
        ) {
          camera.position.copy(targetCamPosRef.current);
          controls.target.copy(targetLookAtRef.current);
          isTransitioningRef.current = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      // Project 3D Marker positions to 2D Screen space
      const newMarkerPositions = {};
      Object.entries(ZONE_DATA).forEach(([zKey, zData]) => {
        const v = new THREE.Vector3(...zData.markerPos);
        v.project(camera);
        // Only show if in front of camera
        if (v.z < 1) {
          const x = ((v.x + 1) * width) / 2;
          const y = ((-v.y + 1) * height) / 2;
          newMarkerPositions[zKey] = { x, y, visible: true };
        } else {
          newMarkerPositions[zKey] = { visible: false };
        }
      });
      setMarkerPositions(newMarkerPositions);
    };

    animate(performance.now());

    // 9. Resize Handling
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 10. Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  const selectedZone = selectedZoneKey ? ZONE_DATA[selectedZoneKey] : null;

  return (
    <div className={`relative w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-[#141622] h-screen' : 'h-[680px] md:h-[780px] rounded-3xl overflow-hidden shadow-2xl border border-white/10'}`}>
      {/* 3D Canvas Mounting Point */}
      <div ref={mountRef} className="w-full h-full relative cursor-grab active:cursor-grabbing outline-none" />

      {/* Floating 3D HTML Markers Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {Object.entries(ZONE_DATA).map(([zKey, zData]) => {
          const marker = markerPositions[zKey];
          if (!marker || !marker.visible) return null;
          const isActive = selectedZoneKey === zKey;
          return (
            <div
              key={zKey}
              style={{
                left: `${marker.x}px`,
                top: `${marker.y}px`,
                transform: 'translate(-50%, -100%)'
              }}
              className={`absolute pointer-events-auto cursor-pointer transition-transform duration-200 hover:scale-110 ${isActive ? 'z-30' : 'z-20'}`}
              onClick={() => focusZone(zKey)}
            >
              <div
                style={{
                  background: isActive ? zData.color : 'rgba(15, 23, 42, 0.88)',
                  color: isActive ? '#0f172a' : '#f8fafc',
                  borderColor: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.2)'
                }}
                className="px-3 py-1.5 rounded-full border shadow-xl flex items-center gap-1.5 backdrop-blur-md text-[11px] font-bold whitespace-nowrap"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: zData.color }} />
                <span>{isEn ? zData.nameEn : zData.name.split(':')[0]}</span>
              </div>
              <div className="w-[2px] h-4 mx-auto" style={{ background: `linear-gradient(to bottom, ${zData.color}, transparent)` }} />
              <div className="w-2 h-2 rounded-full mx-auto -mt-1 shadow-md" style={{ backgroundColor: zData.color }} />
            </div>
          );
        })}
      </div>

      {/* TOP HEADER CONTROLS */}
      <header className="absolute top-3 left-3 right-3 md:top-4 md:left-4 md:right-4 z-20 flex flex-wrap items-center justify-between gap-2.5 pointer-events-none">
        {/* Brand Banner */}
        <div className="bg-[#141622]/90 backdrop-blur-md border border-white/15 px-3.5 py-2.5 rounded-2xl pointer-events-auto flex items-center gap-3 shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>explore</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider text-amber-300 font-bold">
                {isEn ? 'Smart Campus Layout' : 'Bố Trí Không Gian Thuận Tiện'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                ArchViz 3D • 13.000 m² (130m × 100m)
              </span>
            </div>
            <h3 className="text-xs md:text-sm font-extrabold text-white tracking-tight leading-tight m-0">
              {isEn ? '3D INTERACTIVE TRAINING ZONES' : 'SƠ ĐỒ 3D CÁC KHU VỰC TẬP LUYỆN'}
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap pointer-events-auto">
          {/* Infographic Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsInfoModalOpen(true)}
            className="bg-[#141622]/90 hover:bg-[#1e2337] border border-white/15 px-3 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg transition"
            title={isEn ? 'Open full campus specs board' : 'Mở bảng sơ đồ & tiện ích'}
          >
            <span className="material-symbols-outlined text-amber-300" style={{ fontSize: '18px' }}>grid_view</span>
            <span className="hidden sm:inline">{isEn ? 'Campus Specs' : 'Bảng Sơ Đồ & Tiện Ích'}</span>
          </button>

          {/* 2D Plan Toggle */}
          <button
            type="button"
            onClick={setPlan2DView}
            className={`border px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg transition ${cameraMode === 'plan2d' ? 'bg-emerald-500 text-slate-900 border-emerald-400 font-bold' : 'bg-[#141622]/90 hover:bg-[#1e2337] text-white border-white/15'}`}
            title="Mặt bằng 2D nhìn thẳng từ trên xuống"
          >
            <span className="material-symbols-outlined text-emerald-400" style={{ fontSize: '18px' }}>map</span>
            <span>{isEn ? '2D Plan' : '📐 Mặt Bằng 2D'}</span>
          </button>

          {/* Flycam vs Eye-Level Walk Toggle */}
          <button
            type="button"
            onClick={toggleWalkMode}
            className={`border px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg transition ${cameraMode === 'walk' ? 'bg-sky-500 text-slate-900 border-sky-400 font-bold' : 'bg-[#141622]/90 hover:bg-[#1e2337] text-white border-white/15'}`}
            title="Chuyển đổi góc nhìn Flycam trên cao và góc nhìn mắt người"
          >
            <span className="material-symbols-outlined text-sky-400" style={{ fontSize: '18px' }}>visibility</span>
            <span>{cameraMode === 'walk' ? (isEn ? 'Walk Mode' : 'Góc Nhìn Thực Tế') : (isEn ? 'Flycam 3D' : 'Flycam 3D')}</span>
          </button>

          {/* Lighting Mode Switcher */}
          <div className="bg-[#141622]/90 border border-white/15 p-1 rounded-xl flex items-center gap-1 shadow-lg">
            <button
              type="button"
              onClick={() => applyLightingMode('day')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${lightingMode === 'day' ? 'bg-amber-400 text-slate-900' : 'text-slate-300 hover:bg-white/10'}`}
              title="Ánh sáng ban ngày"
            >
              ☀️ {isEn ? 'Day' : 'Nắng'}
            </button>
            <button
              type="button"
              onClick={() => applyLightingMode('sunset')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${lightingMode === 'sunset' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-white/10'}`}
              title="Hoàng hôn vàng"
            >
              🌅 {isEn ? 'Sunset' : 'Hoàng Hôn'}
            </button>
            <button
              type="button"
              onClick={() => applyLightingMode('night')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${lightingMode === 'night' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}
              title="Đèn LED thể thao đêm"
            >
              💡 {isEn ? 'Night LED' : 'Đèn Đêm'}
            </button>
          </div>

          {/* Reset Master View */}
          <button
            type="button"
            onClick={resetMasterView}
            className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3 py-2 rounded-xl text-xs font-bold text-amber-300 flex items-center gap-1 shadow-lg transition"
            title="Trở về toàn cảnh trung tâm"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>center_focus_strong</span>
            <span>{isEn ? 'Overview' : 'Toàn Cảnh'}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="bg-[#141622]/90 hover:bg-[#1e2337] border border-white/15 p-2 rounded-xl text-white shadow-lg transition"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
          </button>
        </div>
      </header>

      {/* LEFT MASTERPLAN SIDEBAR (Desktop) */}
      <aside className="absolute left-4 top-24 z-20 w-72 hidden xl:flex flex-col gap-3 pointer-events-none">
        <div className="bg-[#141622]/90 backdrop-blur-md border border-white/15 p-4 rounded-2xl pointer-events-auto shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
              {isEn ? 'Masterplan: 9 Clusters' : 'Quy Hoạch Chuẩn 9 Cụm'}
            </span>
            <span className="text-xs font-extrabold text-emerald-400">13.000 m²</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
            {isEn
              ? 'West Wing blocks (A, B, C), Central Lobby and East Outdoor courts are interconnected by wide internal avenues.'
              : 'Các khối nhà A, B, C (Cánh Tây), Sảnh Lễ Tân (Trục Giữa) và Khu Sân Ngoài Trời (Cánh Đông) được tách biệt hoàn toàn bởi đại lộ nội khu.'}
          </p>
          <div className="space-y-1.5 text-xs">
            {Object.entries(ZONE_DATA).map(([zKey, zData]) => (
              <div
                key={zKey}
                onClick={() => focusZone(zKey)}
                className={`p-2 rounded-xl flex justify-between items-center cursor-pointer border transition ${selectedZoneKey === zKey ? 'bg-white/15 border-amber-400 text-white' : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'}`}
              >
                <span className="font-medium truncate pr-2">{isEn ? zData.nameEn : zData.name}</span>
                <span className="font-bold shrink-0" style={{ color: zData.color }}>{zData.area}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Standard Amenities Pill Box */}
        <div className="bg-[#141622]/90 backdrop-blur-md border border-white/15 p-3.5 rounded-2xl pointer-events-auto space-y-2 shadow-xl">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
            {isEn ? 'Standard Amenities' : 'Tiện Ích Tiêu Chuẩn'}
          </div>
          <div onClick={() => focusZone('khuA', 3)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 cursor-pointer transition">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">vpn_key</span>
            <span className="text-[11px] text-slate-200 leading-tight">
              {isEn ? 'RFID secure lockers for personal belongings' : 'Tủ cất đồ cá nhân có chìa khóa an toàn'}
            </span>
          </div>
          <div onClick={() => focusZone('khuA', 3)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 cursor-pointer transition">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">shower</span>
            <span className="text-[11px] text-slate-200 leading-tight">
              {isEn ? 'Clean hot & cold showers and dressing suites' : 'Phòng thay đồ và khu vực tắm tráng nóng lạnh sạch sẽ'}
            </span>
          </div>
          <div onClick={() => focusZone('lobby')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 cursor-pointer transition">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">local_cafe</span>
            <span className="text-[11px] text-slate-200 leading-tight">
              {isEn ? 'Sports nutrition café and healthy refreshment bar' : 'Quầy căn-tin nước giải khát & dinh dưỡng'}
            </span>
          </div>
          <div onClick={() => focusZone('lobby')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 cursor-pointer transition">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">medical_services</span>
            <span className="text-[11px] text-slate-200 leading-tight">
              {isEn ? '24/7 First aid medical station and athletic ice packs' : 'Tủ thuốc y tế và dụng cụ sơ cứu ban đầu luôn sẵn sàng'}
            </span>
          </div>
        </div>
      </aside>

      {/* RIGHT INSPECTOR DRAWER (Zone detail & 3D Floor Slicer) */}
      <aside
        className={`absolute right-3 md:right-4 top-20 bottom-20 z-30 w-[92vw] sm:w-96 bg-[#141622]/95 backdrop-blur-xl border border-white/15 rounded-3xl p-5 flex flex-col justify-between shadow-2xl transition-all duration-300 overflow-hidden ${selectedZone ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-[120%] opacity-0 pointer-events-none'}`}
      >
        {selectedZone && (
          <>
            <div className="overflow-y-auto pr-1 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {selectedZone.badge}
                  </span>
                  <h4 className="text-base md:text-lg font-extrabold text-white mt-1.5 leading-snug m-0">
                    {isEn ? selectedZone.nameEn : selectedZone.name}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={resetMasterView}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition shrink-0"
                  title="Đóng và về toàn cảnh"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed m-0">
                {isEn ? selectedZone.descriptionEn : selectedZone.description}
              </p>

              {/* 3D Floor Slicer (For Multi-Floor Buildings) */}
              {selectedZone.floors.length > 1 && (
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">layers</span>
                      {isEn ? '3D Floor Slicer' : 'Bóc Tách Mặt Cắt 3D'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isEn ? 'Cutaway roof & floors' : 'Mở mái xem bên trong'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedFloor(0)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition ${selectedFloor === 0 ? 'bg-amber-400 text-slate-950 shadow' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                    >
                      {isEn ? 'All' : 'Cả 3 Tầng'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFloor(1)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition ${selectedFloor === 1 ? 'bg-amber-400 text-slate-950 shadow' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                    >
                      {isEn ? 'Floor 1' : 'Tầng 1'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFloor(2)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition ${selectedFloor === 2 ? 'bg-amber-400 text-slate-950 shadow' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                    >
                      {isEn ? 'Floor 2' : 'Tầng 2'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFloor(3)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition ${selectedFloor === 3 ? 'bg-amber-400 text-slate-950 shadow' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                    >
                      {isEn ? 'Floor 3' : 'Tầng 3'}
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-area floor details */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  {isEn ? 'Facilities & Equipment Breakdown' : 'Chi Tiết Không Gian & Trang Thiết Bị'}
                </div>
                {selectedZone.floors.map(fl => (
                  <div key={fl.num} className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>{isEn ? fl.titleEn : fl.title}</span>
                      <span className="text-[10px] text-amber-300 font-semibold">Tầng {fl.num}</span>
                    </div>
                    <ul className="m-0 p-0 list-none space-y-1">
                      {fl.items.map((item, idx) => (
                        <li key={idx} className="text-[11px] text-slate-300 leading-snug">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-white/10 mt-3 flex items-center justify-between gap-2">
              <div>
                <span className="text-slate-400 block text-[10px]">{isEn ? 'Total Area:' : 'Quy mô diện tích:'}</span>
                <strong className="text-amber-300 text-sm font-extrabold">{selectedZone.area}</strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onBookingClick) onBookingClick(selectedZone);
                  else {
                    const el = document.getElementById('co-so-vat-chat');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-xl transition"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>event_available</span>
                <span>{isEn ? 'Book Court Now' : 'Đặt Sân Ngay'}</span>
              </button>
            </div>
          </>
        )}
      </aside>

      {/* BOTTOM QUICK NAVIGATION DOCK */}
      <nav className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-[#141622]/90 backdrop-blur-md border border-white/15 p-1.5 rounded-2xl flex items-center gap-1.5 max-w-[96vw] overflow-x-auto pointer-events-auto shadow-2xl">
        <button
          type="button"
          onClick={resetMasterView}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${!selectedZoneKey ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-200 hover:bg-white/10'}`}
        >
          <span className="material-symbols-outlined text-[16px]">public</span>
          <span>{isEn ? 'Full Campus (13,000m²)' : 'Toàn Cảnh (13.000m²)'}</span>
        </button>
        {Object.entries(ZONE_DATA).map(([zKey, zData]) => {
          const isActive = selectedZoneKey === zKey;
          return (
            <button
              key={zKey}
              type="button"
              onClick={() => focusZone(zKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${isActive ? 'bg-white/20 text-white border border-amber-400 shadow-md' : 'text-slate-200 hover:bg-white/10'}`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: zData.color }} />
              <span>{isEn ? zData.nameEn : zData.name.split(':')[0]}</span>
            </button>
          );
        })}
      </nav>

      {/* INFOGRAPHIC SPECIFICATIONS MODAL */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1e2337] border border-white/20 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsInfoModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 transition"
              title="Đóng modal"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 space-y-4">
                <div>
                  <div className="text-xs font-bold tracking-widest uppercase text-amber-300 mb-1">
                    {isEn ? 'CAMPUS SMART SPATIAL LAYOUT' : 'BỐ TRÍ KHÔNG GIAN THUẬN TIỆN'}
                  </div>
                  <h3 className="text-xl md:text-3xl font-extrabold text-white tracking-tight leading-tight m-0">
                    {isEn ? '3D SPORTS COMPLEX ARCHVIZ' : 'SƠ ĐỒ CÁC KHU VỰC TẬP LUYỆN'}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-300 mt-3 leading-relaxed">
                    {isEn
                      ? '9 training clusters across 13,000 m² are systematically planned with expansive internal pathways and multilingual signage.'
                      : '9 cụm sân bãi và phòng tập trên diện tích 13.000 m² được quy hoạch gọn gàng, lối đi thông thoáng, biển báo chỉ dẫn rõ ràng.'}
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div onClick={() => { setIsInfoModalOpen(false); focusZone('khuA', 3); }} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-3 cursor-pointer transition">
                    <span className="material-symbols-outlined text-emerald-400">vpn_key</span>
                    <span>{isEn ? 'Secure personal RFID lockers for worry-free workouts' : 'Tủ cất đồ cá nhân có chìa khóa an toàn, thuận tiện sử dụng'}</span>
                  </div>
                  <div onClick={() => { setIsInfoModalOpen(false); focusZone('khuA', 3); }} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-3 cursor-pointer transition">
                    <span className="material-symbols-outlined text-emerald-400">shower</span>
                    <span>{isEn ? 'Spacious hot & cold water shower stalls with fresh towels' : 'Phòng thay đồ và khu vực tắm tráng nóng lạnh sạch sẽ'}</span>
                  </div>
                  <div onClick={() => { setIsInfoModalOpen(false); focusZone('lobby'); }} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-3 cursor-pointer transition">
                    <span className="material-symbols-outlined text-emerald-400">local_cafe</span>
                    <span>{isEn ? 'Beverage and sports nutrition café with rapid service' : 'Quầy căn-tin nước giải khát, nước khoáng phục vụ nhanh'}</span>
                  </div>
                  <div onClick={() => { setIsInfoModalOpen(false); focusZone('lobby'); }} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-3 cursor-pointer transition">
                    <span className="material-symbols-outlined text-emerald-400">medical_services</span>
                    <span>{isEn ? 'First-aid medical station with certified athletic trainers' : 'Tủ thuốc y tế và dụng cụ sơ cứu ban đầu luôn sẵn sàng'}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div onClick={() => { setIsInfoModalOpen(false); focusZone('khuA'); }} className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition space-y-2">
                  <h4 className="text-sm font-extrabold text-white m-0">🏊 KHU A: BƠI LỘI, GYM & FITNESS</h4>
                  <ul className="text-xs text-slate-300 space-y-1 list-none p-0 m-0">
                    <li>• <strong>Tầng 1:</strong> Bể bơi 4 mùa 25m trong nhà nước ấm</li>
                    <li>• <strong>Tầng 2:</strong> Phòng tập Gym & máy kháng lực</li>
                    <li>• <strong>Tầng 3:</strong> Khu thay đồ & tắm tráng nóng lạnh</li>
                  </ul>
                  <div className="pt-2 text-[11px] text-amber-300 font-bold">Bay tới Khu A →</div>
                </div>

                <div onClick={() => { setIsInfoModalOpen(false); focusZone('khuB'); }} className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition space-y-2">
                  <h4 className="text-sm font-extrabold text-white m-0">🏀 KHU B: BÓNG RỔ, CẦU LÔNG & BÓNG BÀN</h4>
                  <ul className="text-xs text-slate-300 space-y-1 list-none p-0 m-0">
                    <li>• <strong>Tầng 1:</strong> Sân bóng rổ sàn gỗ Maple FIBA</li>
                    <li>• <strong>Tầng 2:</strong> Cụm 4 sân cầu lông thảm cao su BWF</li>
                    <li>• <strong>Tầng 3:</strong> Khu bóng bàn trong nhà 4 bàn tập ITTF</li>
                  </ul>
                  <div className="pt-2 text-[11px] text-amber-300 font-bold">Bay tới Khu B →</div>
                </div>

                <div onClick={() => { setIsInfoModalOpen(false); focusZone('khuC'); }} className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition space-y-2">
                  <h4 className="text-sm font-extrabold text-white m-0">🧘 KHU C: VÕ THUẬT, BOXING & YOGA</h4>
                  <ul className="text-xs text-slate-300 space-y-1 list-none p-0 m-0">
                    <li>• <strong>Tầng 1:</strong> Sàn đài Boxing, Muay Thái & thảm võ</li>
                    <li>• <strong>Tầng 2:</strong> Tủ đồ cá nhân và phòng thay đồ học viên</li>
                    <li>• <strong>Tầng 3:</strong> Studio Yoga & 6 máy Pilates Reformer</li>
                  </ul>
                  <div className="pt-2 text-[11px] text-amber-300 font-bold">Bay tới Khu C →</div>
                </div>

                <div onClick={() => { setIsInfoModalOpen(false); focusZone('outdoor'); }} className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition space-y-2">
                  <h4 className="text-sm font-extrabold text-white m-0">🏟️ KHU NGOÀI TRỜI: BÓNG ĐÁ & PICKLEBALL</h4>
                  <ul className="text-xs text-slate-300 space-y-1 list-none p-0 m-0">
                    <li>• Sân bóng đá cỏ nhân tạo (sân 5 và sân 7 chuẩn)</li>
                    <li>• Cụm 4 sân Pickleball sơn Acrylic chống trơn</li>
                    <li>• Dàn đèn pha LED 500 Lux ban đêm chống chói</li>
                  </ul>
                  <div className="pt-2 text-[11px] text-amber-300 font-bold">Bay tới Sân Ngoài Trời →</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
