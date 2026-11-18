import * as THREE from 'three';
import { createPoolWaterMaterial } from './campusMaterials.js';

/**
 * Architectural building generator (Structure + Facade + Functional Interiors + Rooftop MEP + Utilities).
 * Note: Strictly zero human characters per project specification.
 */

export function getFloorHeight(zone, level) {
  if (zone.code === 'L') return 5.8;
  if (zone.code === 'A') return level === 1 ? 7.6 : 4.2;
  if (zone.code === 'B') return level === 1 ? 8.2 : 4.4;
  return level === 1 ? 5.2 : 4.2;
}

export function getFloorY(zone, level) {
  let y = 0;
  for (let i = 1; i < level; i += 1) y += getFloorHeight(zone, i);
  return y;
}

export function getBuildingTotalHeight(zone) {
  let total = 0;
  for (let i = 1; i <= zone.floors; i += 1) total += getFloorHeight(zone, i);
  return total;
}

/* ---------------- Procedural Signage & Display Textures ---------------- */

function makeSignTexture(code, title, accentHex) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = accentHex;
  ctx.fillRect(0, 0, 124, 128);
  ctx.fillStyle = '#0B1020';
  ctx.font = '900 72px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(code, 62, 66);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = '800 32px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText((title || code).toUpperCase().slice(0, 22), 146, 52);

  ctx.fillStyle = accentHex;
  ctx.font = '700 18px system-ui, sans-serif';
  ctx.fillText('OLYMPIC SPORTS ARENA', 146, 88);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeScoreboardTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#090D16';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 248, 120);
  ctx.fillStyle = '#FACC15';
  ctx.font = '900 38px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('84 : 79', 128, 54);
  ctx.fillStyle = '#38BDF8';
  ctx.font = '700 18px sans-serif';
  ctx.fillText('OLYMPIC ARENA LIVE', 128, 96);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeGolfScreenTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 160;
  const ctx = c.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, 90);
  sky.addColorStop(0, '#38BDF8');
  sky.addColorStop(1, '#BAE6FD');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 256, 90);
  ctx.fillStyle = '#22C55E';
  ctx.fillRect(0, 90, 256, 70);
  ctx.fillStyle = '#15803D';
  ctx.beginPath();
  ctx.ellipse(128, 130, 75, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(128, 126); ctx.lineTo(128, 86); ctx.stroke();
  ctx.fillStyle = '#EF4444';
  ctx.beginPath(); ctx.moveTo(128, 86); ctx.lineTo(148, 93); ctx.lineTo(128, 100); ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeSwimClockTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 96;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#070B12';
  ctx.fillRect(0, 0, 256, 96);
  ctx.strokeStyle = '#0EA5E9';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 248, 88);
  ctx.fillStyle = '#22D3EE';
  ctx.font = '900 38px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('00:54.32', 128, 56);
  ctx.fillStyle = '#94A3B8';
  ctx.font = '700 13px sans-serif';
  ctx.fillText('LANE TIMES • 26.8°C', 128, 80);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---------------- Main Building & Facade Builder ---------------- */

export function buildArchitecturalBuilding({ zone, entry, group, pickables, batch, surfaces, waterMaterials, beaconMats }) {
  const bw = zone.buildingWidth;
  const bd = zone.buildingDepth;
  const totalH = getBuildingTotalHeight(zone);

  // Calibrated materials — zero dead-black aluminum or missing UV backfaces
  const concreteMat = surfaces.concreteMaterial('#D8D4CC', [3, 2]);
  const darkMetalMat = surfaces.metalCladdingMaterial('#3F4A5C', [3, 2]);
  const alumMat = new THREE.MeshStandardMaterial({ color: '#CBD5E1', roughness: 0.28, metalness: 0.72, envMapIntensity: 1.3 });
  const steelFrameMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.36, metalness: 0.65, envMapIntensity: 1.1 });
  const woodLouverMat = new THREE.MeshStandardMaterial({ color: '#A37046', roughness: 0.52, metalness: 0.08 });
  const safetyYellowMat = new THREE.MeshStandardMaterial({ color: '#EAB308', roughness: 0.42, metalness: 0.25 });
  const handrailMat = new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.16, metalness: 0.88, envMapIntensity: 1.5 });

  const ledMat = new THREE.MeshStandardMaterial({
    color: zone.color,
    emissive: zone.color,
    emissiveIntensity: 0.85,
    roughness: 0.25
  });
  entry.ledMats.push(ledMat);

  const ceilLightMat = new THREE.MeshStandardMaterial({
    color: '#FFFBEB',
    emissive: '#FFE4B5',
    emissiveIntensity: 0.55,
    roughness: 0.2
  });
  entry.interiorLightMats.push(ceilLightMat);

  // Interior warm point light per building (shines through physical glass at dusk/night)
  const interiorLight = new THREE.PointLight('#FFDFAA', 0, Math.max(bw, bd) * 1.45, 1.4);
  interiorLight.position.set(zone.x, totalH * 0.55, zone.z);
  group.add(interiorLight);
  entry.interiorLights.push(interiorLight);

  for (let level = 1; level <= zone.floors; level += 1) {
    const floorH = getFloorHeight(zone, level);
    const y = getFloorY(zone, level);
    const floorGroup = new THREE.Group();
    floorGroup.userData.level = level;

    // 1. Structural Floor Slab (0.5 m thick, 0.4 m architectural overhang fascia + zone LED ribbon)
    const slab = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.3, 0.48, bd + 0.3), concreteMat);
    slab.position.set(zone.x, y + 0.24, zone.z);
    slab.castShadow = true;
    slab.receiveShadow = true;
    slab.userData = { zoneId: zone.id, pick: true };
    floorGroup.add(slab);
    pickables.push(slab);

    const fasciaY = y + floorH - 0.24;
    for (const [w, d, dx, dz] of [
      [bw + 0.8, 0.34, 0, -bd / 2 - 0.18],
      [bw + 0.8, 0.34, 0, bd / 2 + 0.18],
      [0.34, bd + 0.8, -bw / 2 - 0.18, 0],
      [0.34, bd + 0.8, bw / 2 + 0.18, 0]
    ]) {
      const fascia = new THREE.Mesh(new THREE.BoxGeometry(w, 0.48, d), darkMetalMat);
      fascia.position.set(zone.x + dx, fasciaY, zone.z + dz);
      fascia.castShadow = true;
      fascia.receiveShadow = true;
      floorGroup.add(fascia);

      const led = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.1, d + 0.06), ledMat);
      led.position.set(zone.x + dx, fasciaY + 0.17, zone.z + dz);
      floorGroup.add(led);
    }

    // 2. Exposed Perimeter Reinforced-Concrete Columns (0.6x0.6 m on ~8.5 m structural grid)
    const colSpacingX = Math.max(7.2, bw / Math.max(2, Math.round(bw / 8.5)));
    const colSpacingZ = Math.max(7.2, bd / Math.max(2, Math.round(bd / 8.5)));
    const wallH = floorH - 0.5;
    const colGeo = new THREE.BoxGeometry(0.6, wallH, 0.6);
    for (let cx = -bw / 2; cx <= bw / 2 + 0.01; cx += colSpacingX) {
      for (const cz of [-bd / 2, bd / 2]) {
        const col = new THREE.Mesh(colGeo, concreteMat);
        col.position.set(zone.x + cx, y + 0.48 + wallH / 2, zone.z + cz);
        col.castShadow = true;
        col.receiveShadow = true;
        floorGroup.add(col);
      }
    }
    for (let cz = -bd / 2 + colSpacingZ; cz < bd / 2 - 0.5; cz += colSpacingZ) {
      for (const cx of [-bw / 2, bw / 2]) {
        const col = new THREE.Mesh(colGeo, concreteMat);
        col.position.set(zone.x + cx, y + 0.48 + wallH / 2, zone.z + cz);
        col.castShadow = true;
        col.receiveShadow = true;
        floorGroup.add(col);
      }
    }

    // 3. Elevator & Staircase Core Shaft + Internal Stairs
    const coreW = Math.min(5.2, bw * 0.16);
    const coreD = Math.min(6.4, bd * 0.32);
    const coreX = zone.x - bw / 2 + coreW / 2 + 0.5;
    const coreZ = zone.z - bd / 2 + coreD / 2 + 0.5;
    const coreShaft = new THREE.Mesh(new THREE.BoxGeometry(coreW, wallH, coreD), concreteMat);
    coreShaft.position.set(coreX, y + 0.48 + wallH / 2, coreZ);
    coreShaft.castShadow = true;
    coreShaft.receiveShadow = true;
    floorGroup.add(coreShaft);

    for (let s = 0; s < 10; s += 1) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 0.42), alumMat);
      step.position.set(coreX + coreW / 2 + 1.1, y + 0.52 + (s / 10) * (wallH - 0.3), coreZ - coreD / 2 + 0.4 + s * 0.48);
      floorGroup.add(step);
    }

    // 4. Ceiling Emissive LED Light Panels
    const innerGroup = new THREE.Group();
    innerGroup.userData.interiorDetail = true;
    const stripCols = Math.max(2, Math.floor((bw - 8) / 8));
    const stripRows = Math.max(2, Math.floor((bd - 6) / 7));
    for (let sc = 0; sc < stripCols; sc += 1) {
      for (let sr = 0; sr < stripRows; sr += 1) {
        const lx = zone.x - (bw - 10) / 2 + (sc / Math.max(1, stripCols - 1)) * (bw - 10);
        const lz = zone.z - (bd - 8) / 2 + (sr / Math.max(1, stripRows - 1)) * (bd - 8);
        const lightPanel = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 0.55), ceilLightMat);
        lightPanel.position.set(lx, y + floorH - 0.52, lz);
        floorGroup.add(lightPanel);
      }
    }

    // 5. Functional Rooms & Interiors on this Floor (Zero Humans)
    for (const room of zone.rooms.filter((r) => (r.floor || 1) === level)) {
      const courtMat = surfaces.courtMaterial(room.kind, room.width, room.depth);
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(room.width, room.depth), courtMat);
      plane.rotation.x = -Math.PI / 2;
      plane.position.set(room.x, y + 0.49, room.z);
      plane.receiveShadow = true;
      plane.userData = { zoneId: zone.id, roomId: room.id, pick: true };
      floorGroup.add(plane);
      pickables.push(plane);

      buildRoomInterior({
        zone, room, level, y: y + 0.49, floorH, innerGroup, batch, surfaces, waterMaterials,
        alumMat, darkMetalMat, safetyYellowMat, handrailMat, ledMat
      });
    }

    if (zone.code === 'L' && level === 1) {
      buildLobbyInterior({ zone, y: y + 0.49, floorH, innerGroup, batch, alumMat, darkMetalMat, ledMat });
    }

    floorGroup.add(innerGroup);
    entry.interiorGroups.push(innerGroup);

    // 6. Physically Layered Curtain Wall Facade (recessed 0.25 m glass, 0.15 m deep mullions, ~35% solid cladding, sun louvers)
    const isGround = level === 1;
    const glassMat = surfaces.createArchitecturalGlassMaterial(zone.color, isGround, zone.id * 13 + level);
    entry.windowMats.push(glassMat);

    const sides = [
      { dir: 'north', w: bw, d: 0.1, dx: 0, dz: -bd / 2 + 0.25, nx: 0, nz: -1 },
      { dir: 'south', w: bw, d: 0.1, dx: 0, dz: bd / 2 - 0.25, nx: 0, nz: 1 },
      { dir: 'west', w: 0.1, d: bd, dx: -bw / 2 + 0.25, dz: 0, nx: -1, nz: 0 },
      { dir: 'east', w: 0.1, d: bd, dx: bw / 2 - 0.25, dz: 0, nx: 1, nz: 0 }
    ];

    for (const s of sides) {
      const sideGroup = new THREE.Group();
      sideGroup.userData = { wallSide: s.dir, nx: s.nx, nz: s.nz };
      const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(s.w, wallH, s.d), glassMat);
      wallMesh.position.set(zone.x + s.dx, y + 0.48 + wallH / 2, zone.z + s.dz);
      wallMesh.userData = { zoneId: zone.id, pick: true, wall: true };
      sideGroup.add(wallMesh);
      pickables.push(wallMesh);

      // Solid 32–36% corner/flank precast & metal cladding panels with real depth (zero dead black)
      const span = Math.max(s.w, s.d);
      const isHoriz = s.w > s.d;
      const solidFraction = zone.code === 'C' && level >= 2 ? 0.2 : 0.17;
      const solidLen = span * solidFraction;
      const panelMat = zone.code === 'B' ? darkMetalMat : zone.code === 'C' ? woodLouverMat : concreteMat;
      for (const end of [-1, 1]) {
        const offset = end * (span / 2 - solidLen / 2);
        const pw = isHoriz ? solidLen : 0.34;
        const pd = isHoriz ? 0.34 : solidLen;
        const solidPanel = new THREE.Mesh(new THREE.BoxGeometry(pw, wallH, pd), panelMat);
        solidPanel.position.set(
          zone.x + s.dx + s.nx * 0.18 + (isHoriz ? offset : 0),
          y + 0.48 + wallH / 2,
          zone.z + s.dz + s.nz * 0.18 + (isHoriz ? 0 : offset)
        );
        solidPanel.castShadow = true;
        solidPanel.receiveShadow = true;
        sideGroup.add(solidPanel);
      }

      // 0.15 m deep glazing mullions (~1.8 m spacing)
      const midSpan = Math.max(3, span * (1 - solidFraction * 2));
      const mullionCount = Math.max(3, Math.floor(midSpan / 1.85));
      for (let m = 0; m <= mullionCount; m += 1) {
        const pos = -midSpan / 2 + (m / mullionCount) * midSpan;
        const mullion = new THREE.Mesh(
          new THREE.BoxGeometry(isHoriz ? 0.08 : 0.18, wallH, isHoriz ? 0.18 : 0.08),
          zone.code === 'C' ? woodLouverMat : alumMat
        );
        mullion.position.set(
          zone.x + s.dx + (isHoriz ? pos : s.nx * 0.14),
          y + 0.48 + wallH / 2,
          zone.z + s.dz + (isHoriz ? s.nz * 0.14 : pos)
        );
        mullion.castShadow = true;
        sideGroup.add(mullion);
      }

      // Horizontal transoms & Western solar shading aluminum fins (0.1x0.4 m @ ~0.8 m)
      if (!isGround && s.dir === 'west' && zone.code !== 'L') {
        const finCount = Math.max(4, Math.floor(midSpan / 0.85));
        for (let fn = 0; fn <= finCount; fn += 1) {
          const fPos = -midSpan / 2 + (fn / finCount) * midSpan;
          const fin = new THREE.Mesh(new THREE.BoxGeometry(0.4, wallH, 0.1), zone.code === 'C' ? woodLouverMat : alumMat);
          fin.position.set(zone.x + s.dx - 0.34, y + 0.48 + wallH / 2, zone.z + s.dz + fPos);
          fin.castShadow = true;
          sideGroup.add(fin);
        }
      } else if (!isGround && (zone.code === 'A' || zone.code === 'B')) {
        for (let lr = 1; lr <= 3; lr += 1) {
          const ly = y + 0.48 + (lr / 4) * wallH;
          const blade = new THREE.Mesh(
            new THREE.BoxGeometry(isHoriz ? midSpan : 0.32, 0.07, isHoriz ? 0.32 : midSpan),
            alumMat
          );
          blade.position.set(zone.x + s.dx + s.nx * 0.22, ly, zone.z + s.dz + s.nz * 0.22);
          sideGroup.add(blade);
        }
      }

      floorGroup.add(sideGroup);
      entry.facadeSides.push(sideGroup);
    }

    // 7. Ground-Floor Entrance Canopy (4.6 m overhang), Recessed Lights, Sliding Doors, 3 Steps, 1:12 Ramp, Utility Fixtures
    if (isGround) {
      const entryOnSouth = zone.code === 'L';
      const ex = entryOnSouth ? zone.x : zone.x + bw / 2;
      const ez = entryOnSouth ? zone.z + bd / 2 : zone.z;
      const portalGroup = new THREE.Group();

      const canopyProj = 4.6;
      const canopyW = entryOnSouth ? 8.2 : canopyProj;
      const canopyD = entryOnSouth ? canopyProj : 8.2;
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(canopyW, 0.28, canopyD), darkMetalMat);
      canopy.position.set(ex + (entryOnSouth ? 0 : canopyProj * 0.48), y + 3.9, ez + (entryOnSouth ? canopyProj * 0.48 : 0));
      canopy.castShadow = true;
      portalGroup.add(canopy);

      // Recessed soffit downlights under entrance canopy
      for (const dl of [-2.4, 0, 2.4]) {
        const downlight = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 10), ceilLightMat);
        downlight.position.set(
          ex + (entryOnSouth ? dl : canopyProj * 0.48),
          y + 3.74,
          ez + (entryOnSouth ? canopyProj * 0.48 : dl)
        );
        portalGroup.add(downlight);
      }

      const canopyLed = new THREE.Mesh(new THREE.BoxGeometry(canopyW + 0.1, 0.09, canopyD + 0.1), ledMat);
      canopyLed.position.set(canopy.position.x, y + 4.04, canopy.position.z);
      portalGroup.add(canopyLed);

      // Illuminated raised building name signboard above canopy
      const signTex = makeSignTexture(zone.code, zone.shortName || zone.code, zone.color);
      const signMat = new THREE.MeshStandardMaterial({
        map: signTex,
        emissive: '#FFFFFF',
        emissiveMap: signTex,
        emissiveIntensity: 0.78,
        roughness: 0.25
      });
      const signBoard = new THREE.Mesh(
        new THREE.BoxGeometry(entryOnSouth ? 5.6 : 0.2, 1.35, entryOnSouth ? 0.2 : 5.6),
        signMat
      );
      signBoard.position.set(ex + (entryOnSouth ? 0 : 0.42), y + 4.82, ez + (entryOnSouth ? 0.42 : 0));
      portalGroup.add(signBoard);

      // Three tiered entrance steps + dark entrance floor mat
      for (let st = 0; st < 3; st += 1) {
        const stepH = 0.14;
        const step = new THREE.Mesh(
          new THREE.BoxGeometry(entryOnSouth ? 6.8 : 0.75 + st * 0.55, stepH, entryOnSouth ? 0.75 + st * 0.55 : 6.8),
          concreteMat
        );
        step.position.set(ex + (entryOnSouth ? 0 : 0.5 + (2 - st) * 0.22), 0.07 + st * stepH, ez + (entryOnSouth ? 0.5 + (2 - st) * 0.22 : 0));
        step.receiveShadow = true;
        portalGroup.add(step);
      }
      const matMesh = new THREE.Mesh(
        new THREE.BoxGeometry(entryOnSouth ? 3.8 : 1.1, 0.03, entryOnSouth ? 1.1 : 3.8),
        new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.92 })
      );
      matMesh.position.set(ex + (entryOnSouth ? 0 : 0.35), 0.46, ez + (entryOnSouth ? 0.35 : 0));
      portalGroup.add(matMesh);

      // Accessible 1:12 ramp + stainless tubular handrails + planter boxes
      for (const side of [-1, 1]) {
        const px = ex + (entryOnSouth ? side * 4.5 : 1.3);
        const pz = ez + (entryOnSouth ? 1.3 : side * 4.5);
        batch.add('planterBox', px, 0, pz, 1, 1, 1, entryOnSouth ? 0 : Math.PI / 2);
        batch.add('shrub', px, 0.55, pz, 1.1, 0.9, 1.1, side);

        // Stainless handrails flanking steps
        const railPost1 = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.95, 8), handrailMat);
        railPost1.position.set(ex + (entryOnSouth ? side * 3.1 : 0.4), 0.72, ez + (entryOnSouth ? 0.4 : side * 3.1));
        const railPost2 = railPost1.clone();
        railPost2.position.set(ex + (entryOnSouth ? side * 3.1 : 1.7), 0.52, ez + (entryOnSouth ? 1.7 : side * 3.1));
        portalGroup.add(railPost1, railPost2);
      }

      // Exterior MEP utilities: Rainwater downpipes, CCTV cameras, AC condensers on West wall, electrical cabinet
      for (const side of [-1, 1]) {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, totalH, 8), alumMat);
        pipe.position.set(zone.x - bw / 2 - 0.14, totalH / 2, zone.z + side * (bd / 2 - 1.2));
        pipe.userData.detail = true;
        portalGroup.add(pipe);

        batch.add('securityCam', zone.x + (bw / 2 + 0.25) * side, totalH > 8 ? 4.4 : 3.6, zone.z + bd / 2 + 0.25, 1, 1, 1, side > 0 ? 0.4 : -0.4);
      }
      for (let ac = 0; ac < 3; ac += 1) {
        batch.add('acUnit', zone.x - bw / 2 - 0.45, 2.2, zone.z - bd * 0.28 + ac * 2.2, 1, 1, 1, -Math.PI / 2);
      }
      batch.add('elecCabinet', zone.x - bw / 2 - 0.35, 0, zone.z + bd * 0.32, 1, 1, 1, -Math.PI / 2);

      floorGroup.add(portalGroup);
    }

    group.add(floorGroup);
    entry.floors.push(floorGroup);
  }

  // External Steel Emergency Escape Staircase on Building B (North-West rear flank)
  if (zone.code === 'B' && zone.floors >= 2) {
    const stairX = zone.x - bw / 2 - 1.35;
    const stairZ = zone.z - bd * 0.2;
    for (let level = 1; level < zone.floors; level += 1) {
      const y0 = getFloorY(zone, level);
      const y1 = getFloorY(zone, level + 1);
      const landing = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.16, 3.2), steelFrameMat);
      landing.position.set(stairX, y1, stairZ);
      landing.castShadow = true;
      group.add(landing);
      for (let st = 0; st < 8; st += 1) {
        const tread = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.32), alumMat);
        tread.position.set(stairX, y0 + 0.3 + ((st + 0.5) / 8) * (y1 - y0), stairZ - 1.3 + st * 0.36);
        group.add(tread);
      }
    }
  }

  // 8. Detailed Rooftop (1.1 m Parapet + Coping, Skylight, Maintenance Walkways, Tilted Solar, HVAC Chillers, Water Tank, Lightning Rod + Red Beacon)
  const roofY = totalH;
  const roof = new THREE.Group();
  const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.5, 0.48, bd + 0.5), concreteMat);
  roofSlab.position.set(zone.x, roofY + 0.24, zone.z);
  roofSlab.castShadow = true;
  roofSlab.receiveShadow = true;
  roofSlab.userData = { zoneId: zone.id, pick: true };
  pickables.push(roofSlab);
  roof.add(roofSlab);

  // 1.1 m high parapets + brushed metal coping + LED crown strip
  for (const [w, d, dx, dz] of [
    [bw + 0.6, 0.32, 0, -bd / 2],
    [bw + 0.6, 0.32, 0, bd / 2],
    [0.32, bd + 0.6, -bw / 2, 0],
    [0.32, bd + 0.6, bw / 2, 0]
  ]) {
    const parapet = new THREE.Mesh(new THREE.BoxGeometry(w, 1.1, d), concreteMat);
    parapet.position.set(zone.x + dx, roofY + 0.95, zone.z + dz);
    parapet.castShadow = true;
    parapet.receiveShadow = true;
    roof.add(parapet);

    const coping = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, 0.1, d + 0.08), handrailMat);
    coping.position.set(zone.x + dx, roofY + 1.54, zone.z + dz);
    roof.add(coping);

    const crownLed = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.12, d + 0.1), ledMat);
    crownLed.position.set(zone.x + dx, roofY + 1.34, zone.z + dz);
    roof.add(crownLed);
  }

  // Steel roof access hatch & maintenance walkway catwalk
  const hatch = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.75, 1.8), steelFrameMat);
  hatch.position.set(zone.x - bw / 2 + 2.2, roofY + 0.85, zone.z + bd / 2 - 2.6);
  hatch.castShadow = true;
  roof.add(hatch);

  const walkway = new THREE.Mesh(new THREE.BoxGeometry(bw - 6, 0.08, 1.1), steelFrameMat);
  walkway.position.set(zone.x, roofY + 0.54, zone.z - bd / 2 + 6.2);
  roof.add(walkway);

  // Rooftop MEP: HVAC chillers with fans, galvanized ducts, stainless water tanks, antenna & lightning rod with red beacon
  const mepX = zone.x - bw / 2 + 4.8;
  const mepZ = zone.z - bd / 2 + 3.6;
  for (let h = 0; h < (zone.code === 'L' ? 1 : 2); h += 1) {
    const hvac = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.55, 1.9), alumMat);
    hvac.position.set(mepX + h * 3.6, roofY + 1.25, mepZ);
    hvac.castShadow = true;
    roof.add(hvac);
    const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.16, 12), darkMetalMat);
    fan.position.set(mepX + h * 3.6, roofY + 2.06, mepZ);
    roof.add(fan);
  }
  const duct = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.45, 0.48, 0.65), alumMat);
  duct.position.set(zone.x, roofY + 0.72, mepZ + 1.4);
  roof.add(duct);

  if (zone.floors >= 2) {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 2.5, 16), handrailMat);
    tank.rotation.z = Math.PI / 2;
    tank.position.set(mepX + 8.0, roofY + 1.8, mepZ);
    tank.castShadow = true;
    roof.add(tank);
  }

  // Skylight lantern above Pool A / Lobby L
  if (zone.code === 'A' || zone.code === 'L') {
    const skyW = zone.code === 'A' ? 12 : 6;
    const skyD = zone.code === 'A' ? 5 : 4;
    const skylight = new THREE.Mesh(
      new THREE.BoxGeometry(skyW, 0.45, skyD),
      surfaces.polycarbonateMaterial('#DCEEFF')
    );
    skylight.position.set(zone.x, roofY + 0.65, zone.z + 2.5);
    roof.add(skylight);
  }

  // Lightning rod + Crimson Night Aviation Beacon on highest corner
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 3.6, 6), handrailMat);
  rod.position.set(zone.x + bw / 2 - 1.2, roofY + 2.2, zone.z - bd / 2 + 1.2);
  const beaconMat = new THREE.MeshStandardMaterial({ color: '#EF4444', emissive: '#EF4444', emissiveIntensity: 0.4 });
  if (beaconMats) beaconMats.push(beaconMat);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), beaconMat);
  beacon.position.set(rod.position.x, roofY + 4.05, rod.position.z);
  roof.add(rod, beacon);

  // Tilted Solar Panel Array (~12 deg)
  const solarStartX = zone.x - bw / 2 + (zone.floors >= 2 ? 12 : 3.2);
  const solarEndX = zone.x + bw / 2 - 2.8;
  const cols = Math.max(0, Math.floor((solarEndX - solarStartX) / 2.35));
  const rows = Math.max(0, Math.floor((bd - 8.5) / 3.2));
  if (cols > 0 && rows > 0) {
    const solarGeo = new THREE.BoxGeometry(2.05, 0.08, 2.6);
    solarGeo.rotateX(0.21);
    const solar = new THREE.InstancedMesh(solarGeo, surfaces.solarMaterial(), cols * rows);
    const m = new THREE.Matrix4();
    let i = 0;
    for (let c = 0; c < cols; c += 1) {
      for (let r = 0; r < rows; r += 1) {
        m.makeTranslation(solarStartX + c * 2.35, roofY + 0.98, zone.z - bd / 2 + 7.2 + r * 3.2);
        solar.setMatrixAt(i, m);
        i += 1;
      }
    }
    solar.instanceMatrix.needsUpdate = true;
    solar.castShadow = true;
    solar.receiveShadow = true;
    roof.add(solar);
  }

  group.add(roof);
  entry.roof = roof;
}

/* ---------------- Functional Room Interiors (Zero Humans) ---------------- */

function buildRoomInterior({
  zone, room, level, y, floorH, innerGroup, batch, surfaces, waterMaterials,
  alumMat, darkMetalMat, handrailMat, ledMat
}) {
  const rx = room.x;
  const rz = room.z;
  const rw = room.width;
  const rd = room.depth;

  switch (room.kind) {
    case 'pool25': {
      // Animated shader water + overflow gutter + 8-or-6 lane ropes w/ red last-5m markers + starting blocks + backstroke flags + swim clock + stands + ceiling trusses
      const waterMat = createPoolWaterMaterial();
      waterMaterials.push(waterMat);
      const water = new THREE.Mesh(new THREE.PlaneGeometry(rw - 0.35, rd - 0.35, 28, 16), waterMat);
      water.rotation.x = -Math.PI / 2;
      water.position.set(rx, y + 0.14, rz);
      innerGroup.add(water);

      const gutterMat = new THREE.MeshStandardMaterial({ color: '#94A3B8', roughness: 0.45 });
      const gutter = new THREE.Mesh(new THREE.BoxGeometry(rw + 0.5, 0.09, rd + 0.5), gutterMat);
      gutter.position.set(rx, y + 0.04, rz);
      innerGroup.add(gutter);

      const lanes = 6;
      const laneW = rd / lanes;
      for (let i = 1; i < lanes; i += 1) {
        const lz = rz - rd / 2 + i * laneW;
        const ropeMid = new THREE.Mesh(
          new THREE.CylinderGeometry(0.055, 0.055, rw - 10.4, 8).rotateZ(Math.PI / 2),
          new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? '#FACC15' : '#38BDF8', roughness: 0.38 })
        );
        ropeMid.position.set(rx, y + 0.15, lz);
        innerGroup.add(ropeMid);
        for (const end of [-1, 1]) {
          const redEnd = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 4.9, 8).rotateZ(Math.PI / 2),
            new THREE.MeshStandardMaterial({ color: '#EF4444', roughness: 0.38 })
          );
          redEnd.position.set(rx + end * (rw / 2 - 2.6), y + 0.15, lz);
          innerGroup.add(redEnd);
        }
      }

      // Starting blocks & stainless pool ladders
      for (let i = 0; i < lanes; i += 1) {
        const lz = rz - rd / 2 + (i + 0.5) * laneW;
        const block = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.56, 0.55), alumMat);
        block.position.set(rx - rw / 2 - 0.45, y + 0.28, lz);
        block.castShadow = true;
        innerGroup.add(block);
      }
      for (const lx of [rx - rw * 0.35, rx + rw * 0.35]) {
        const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.14), handrailMat);
        ladder.position.set(lx, y + 0.34, rz + rd / 2 + 0.12);
        innerGroup.add(ladder);
      }

      // Backstroke flags (5 m from each wall) + LED swim pace clock + lifeguard chair + kids pool w/ slide
      for (const end of [-1, 1]) {
        const line = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, rd + 1, 6).rotateX(Math.PI / 2), alumMat);
        line.position.set(rx + end * (rw / 2 - 5), y + 2.35, rz);
        innerGroup.add(line);
      }
      const clock = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 1.35, 3.6),
        new THREE.MeshStandardMaterial({ map: makeSwimClockTexture(), emissive: '#FFFFFF', emissiveMap: makeSwimClockTexture(), emissiveIntensity: 0.85 })
      );
      clock.position.set(rx + rw / 2 + 0.8, y + 3.2, rz);
      innerGroup.add(clock);

      const lgChair = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2.1, 0.85), alumMat);
      lgChair.position.set(rx + rw / 2 - 1.5, y + 1.05, rz - rd / 2 - 1.5);
      innerGroup.add(lgChair);

      for (let l = 0; l < 6; l += 1) {
        batch.add('lounger', rx - rw / 2 + 2.5 + l * 3.8, y, rz - rd / 2 - 2.1, 1, 1, 1, 0, '#F8FAFC', zone.id, level);
      }

      const kidsPool = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.2, 4.4), new THREE.MeshStandardMaterial({ color: '#7DD3FC', roughness: 0.14 }));
      kidsPool.position.set(rx - rw / 2 + 4.2, y + 0.1, rz + rd / 2 + 3.4);
      const slide = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 0.75).rotateZ(-0.42), new THREE.MeshStandardMaterial({ color: '#F59E0B', roughness: 0.28 }));
      slide.position.set(rx - rw / 2 + 1.8, y + 0.65, rz + rd / 2 + 3.4);
      innerGroup.add(kidsPool, slide);

      // Space-frame trusses & round ventilation ducts above pool ceiling
      for (let tx = -rw / 2 + 2; tx <= rw / 2 - 2; tx += 6) {
        const truss = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.48, rd + 6), alumMat);
        truss.position.set(rx + tx, y + floorH - 0.8, rz);
        innerGroup.add(truss);
      }
      const roundDuct = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, rw, 12).rotateZ(Math.PI / 2), alumMat);
      roundDuct.position.set(rx, y + floorH - 1.15, rz - 2.5);
      innerGroup.add(roundDuct);
      break;
    }

    case 'gym': {
      // 12 Treadmills facing South windows + 8 exercise bikes + 4 squat racks + dumbbell rack + 6 weight benches + mirror + TVs
      for (let i = 0; i < 12; i += 1) {
        const tx = rx - rw / 2 + 2.5 + i * 2.15;
        const tz = rz + rd / 2 - 2.4;
        batch.add('treadmill', tx, y, tz, 1, 1, 1, 0, '#0EA5E9', zone.id, level);
      }
      for (let i = 0; i < 8; i += 1) {
        batch.add('exerciseBike', rx - rw / 2 + 3.5 + i * 2.1, y, rz + 1.8, 1, 1, 1, 0, '#F59E0B', zone.id, level);
      }
      for (let i = 0; i < 4; i += 1) {
        batch.add('squatRack', rx - rw / 2 + 5.0 + i * 5.2, y, rz - rd / 2 + 3.4, 1, 1, 1, 0, '#EF4444', zone.id, level);
      }
      for (let i = 0; i < 6; i += 1) {
        batch.add('weightBench', rx + 4 + (i % 3) * 3.4, y, rz - 2.5 + Math.floor(i / 3) * 3.6, 1, 1, 1, 0, '#1E293B', zone.id, level);
      }
      const dbRack = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.85, 0.65), darkMetalMat);
      dbRack.position.set(rx + 6, y + 0.42, rz - rd / 2 + 1.2);
      const mirror = new THREE.Mesh(
        new THREE.BoxGeometry(rw * 0.68, 2.6, 0.08),
        new THREE.MeshPhysicalMaterial({ color: '#E2E8F0', roughness: 0.03, metalness: 0.92, envMapIntensity: 1.85 })
      );
      mirror.position.set(rx, y + 1.6, rz - rd / 2 + 0.3);
      innerGroup.add(dbRack, mirror);
      break;
    }

    case 'basketball': {
      const hoopMat = new THREE.MeshStandardMaterial({ color: '#F97316', emissive: '#EA580C', emissiveIntensity: 0.32 });
      const boardMat = new THREE.MeshPhysicalMaterial({ color: '#F8FAFC', transparent: true, opacity: 0.62, roughness: 0.08 });
      for (const side of [-1, 1]) {
        const hx = rx + side * (rw / 2 - 1.2);
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.38, 3.45, 0.38), darkMetalMat);
        post.position.set(hx + side * 0.9, y + 1.72, rz);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.24, 0.24), darkMetalMat);
        arm.position.set(hx + side * 0.4, y + 3.25, rz);
        const board = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.05, 1.8), boardMat);
        board.position.set(hx, y + 3.05, rz);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.03, 8, 16).rotateX(Math.PI / 2), hoopMat);
        rim.position.set(hx - side * 0.28, y + 2.75, rz);
        innerGroup.add(post, arm, board, rim);
      }
      const sbTex = makeScoreboardTexture();
      const sbMat = new THREE.MeshStandardMaterial({ map: sbTex, emissive: '#FFFFFF', emissiveMap: sbTex, emissiveIntensity: 0.95 });
      const jumbotron = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.6, 3.4), sbMat);
      jumbotron.position.set(rx, y + floorH - 1.65, rz);
      innerGroup.add(jumbotron);

      // Perimeter LED advertising strip + scorer's table
      const ledBoard = new THREE.Mesh(new THREE.BoxGeometry(rw * 0.72, 0.82, 0.14), ledMat);
      ledBoard.position.set(rx, y + 0.41, rz - rd / 2 - 0.8);
      innerGroup.add(ledBoard);

      // Steel roof trusses
      for (let tx = -rw / 2 + 2; tx <= rw / 2 - 2; tx += 5.5) {
        const truss = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.48, rd + 4), alumMat);
        truss.position.set(rx + tx, y + floorH - 0.72, rz);
        innerGroup.add(truss);
      }
      break;
    }

    case 'badminton': {
      const horizontal = rw >= rd;
      const netSpan = horizontal ? rd : rw;
      const net = new THREE.Mesh(
        new THREE.BoxGeometry(horizontal ? 0.05 : netSpan, 0.76, horizontal ? netSpan : 0.05),
        new THREE.MeshStandardMaterial({ color: '#F8FAFC', transparent: true, opacity: 0.78, roughness: 0.6 })
      );
      net.position.set(rx, y + 1.15, rz);
      innerGroup.add(net);
      for (const side of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.55, 8), darkMetalMat);
        post.position.set(rx + (horizontal ? 0 : side * (netSpan / 2)), y + 0.78, rz + (horizontal ? side * (netSpan / 2) : 0));
        innerGroup.add(post);
      }
      break;
    }

    case 'table_tennis': {
      for (let c = 0; c < 4; c += 1) {
        for (let r = 0; r < 2; r += 1) {
          const tx = rx - rw * 0.36 + c * (rw * 0.24);
          const tz = rz - rd * 0.22 + r * (rd * 0.44);
          batch.add('pingPongTable', tx, y, tz, 1, 1, 1, 0, '#1E40AF', zone.id, level);
        }
      }
      break;
    }

    case 'combat': {
      // 12x12 m bi-color tatami + 6x6 m elevated boxing ring + 8 heavy punching bags
      const tatami = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.06, 11.5), new THREE.MeshStandardMaterial({ color: '#B91C1C', roughness: 0.72 }));
      tatami.position.set(rx + rw * 0.2, y + 0.03, rz);
      const tatamiCore = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.07, 7.2), new THREE.MeshStandardMaterial({ color: '#15803D', roughness: 0.72 }));
      tatamiCore.position.set(rx + rw * 0.2, y + 0.04, rz);
      innerGroup.add(tatami, tatamiCore);

      const ringX = rx - rw * 0.22;
      const ringZ = rz;
      const platform = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.92, 6.2), new THREE.MeshStandardMaterial({ color: '#1D4ED8', roughness: 0.6 }));
      platform.position.set(ringX, y + 0.46, ringZ);
      platform.castShadow = true;
      innerGroup.add(platform);

      const postColors = ['#EF4444', '#F8FAFC', '#2563EB', '#F8FAFC'];
      const corners = [[-2.9, -2.9], [2.9, -2.9], [2.9, 2.9], [-2.9, 2.9]];
      corners.forEach(([cx, cz], i) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.5, 8), new THREE.MeshStandardMaterial({ color: postColors[i] }));
        post.position.set(ringX + cx, y + 1.62, ringZ + cz);
        innerGroup.add(post);
      });
      for (const rh of [1.15, 1.44, 1.72, 2.02]) {
        const ropeRing = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.04, 5.8), new THREE.MeshStandardMaterial({ color: '#F8FAFC', wireframe: true }));
        ropeRing.position.set(ringX, y + rh, ringZ);
        innerGroup.add(ropeRing);
      }

      for (let b = 0; b < 8; b += 1) {
        const bx = rx + 1.5 + (b % 4) * 2.5;
        const bz = rz - 2.8 + Math.floor(b / 4) * 5.6;
        batch.add('punchingBag', bx, y, bz, 1, 1, 1, 0, b % 2 === 0 ? '#DC2626' : '#1E293B', zone.id, level);
      }
      break;
    }

    case 'golf_sim': {
      // 6 Golf Simulator bays with bright screens + putting green 10x6 m with flags
      const screenTex = makeGolfScreenTexture();
      const screenMat = new THREE.MeshStandardMaterial({
        map: screenTex,
        emissive: '#FFFFFF',
        emissiveMap: screenTex,
        emissiveIntensity: 0.95,
        roughness: 0.2
      });
      const bays = 6;
      const bayW = (rw * 0.66) / bays;
      for (let i = 0; i < bays; i += 1) {
        const bx = rx - rw * 0.46 + (i + 0.5) * bayW;
        const bz = rz - rd / 2 + 1.8;
        const screen = new THREE.Mesh(new THREE.BoxGeometry(bayW - 0.45, 2.8, 0.12), screenMat);
        screen.position.set(bx, y + 1.5, bz - 1.1);
        const divider = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.9, 3.8), darkMetalMat);
        divider.position.set(bx - bayW / 2, y + 1.5, bz + 0.6);
        innerGroup.add(screen, divider);
      }
      const green = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.8, 0.14, 24), new THREE.MeshStandardMaterial({ color: '#16A34A', roughness: 0.72 }));
      green.position.set(rx + rw * 0.31, y + 0.08, rz + 1.0);
      const pinPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6), handrailMat);
      pinPole.position.set(green.position.x + 1.2, y + 0.85, green.position.z);
      innerGroup.add(green, pinPole);
      break;
    }

    case 'studio': {
      // Light wooden Yoga & Pilates studio: 20 mats + indoor palms
      const cols = 5;
      const rows = 4;
      const matCols = ['#8B5CF6', '#14B8A6', '#F59E0B', '#EC4899'];
      for (let c = 0; c < cols; c += 1) {
        for (let r = 0; r < rows; r += 1) {
          const mx = rx - rw * 0.36 + c * (rw * 0.18);
          const mz = rz - rd * 0.32 + r * (rd * 0.21);
          batch.add('yogaMat', mx, y, mz, 1, 1, 1, 0, matCols[(c + r) % matCols.length], zone.id, level);
        }
      }
      for (const px of [rx - rw / 2 + 1.5, rx + rw / 2 - 1.5]) {
        for (const pz of [rz - rd / 2 + 1.5, rz + rd / 2 - 1.5]) {
          batch.add('indoorPlant', px, y, pz, 1, 1, 1, 0, null, zone.id, level);
        }
      }
      break;
    }

    default:
      break;
  }
}

function buildLobbyInterior({ zone, y, floorH, innerGroup, batch, alumMat, ledMat }) {
  const lx = zone.x;
  const lz = zone.z;

  // 6 m Reception desk + modern atrium chandelier
  const desk = new THREE.Mesh(new THREE.BoxGeometry(6.0, 1.1, 1.4), new THREE.MeshStandardMaterial({ color: '#D4A373', roughness: 0.38 }));
  desk.position.set(lx, y + 0.55, lz + 3.2);
  desk.castShadow = true;
  const deskLed = new THREE.Mesh(new THREE.BoxGeometry(6.1, 0.12, 1.46), ledMat);
  deskLed.position.set(lx, y + 1.08, lz + 3.2);
  const chandelier = new THREE.Mesh(
    new THREE.TorusGeometry(1.4, 0.08, 8, 24).rotateX(Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: '#FEF08A', emissive: '#FDE047', emissiveIntensity: 0.9 })
  );
  chandelier.position.set(lx, y + floorH - 1.2, lz + 1.2);
  innerGroup.add(desk, deskLed, chandelier);

  // Cafeteria bar + refrigerated drink coolers + dining tables
  const cafeBar = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.1, 1.2), new THREE.MeshStandardMaterial({ color: '#9A6B43', roughness: 0.42 }));
  cafeBar.position.set(lx - 4.2, y + 0.55, lz - 2.2);
  const cooler = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 2.1, 0.8),
    new THREE.MeshStandardMaterial({ color: '#38BDF8', emissive: '#38BDF8', emissiveIntensity: 0.65, roughness: 0.2 })
  );
  cooler.position.set(lx - 6.0, y + 1.05, lz - 3.4);
  innerGroup.add(cafeBar, cooler);

  for (let t = 0; t < 4; t += 1) {
    const tx = lx - 5.2 + (t % 2) * 2.6;
    const tz = lz + 0.2 + Math.floor(t / 2) * 2.4;
    batch.add('cafeTable', tx, y, tz, 1, 1, 1, 0, '#F8FAFC', zone.id, 1);
    batch.add('cafeChair', tx - 0.65, y, tz, 1, 1, 1, Math.PI / 2, '#F59E0B', zone.id, 1);
    batch.add('cafeChair', tx + 0.65, y, tz, 1, 1, 1, -Math.PI / 2, '#F59E0B', zone.id, 1);
  }

  // First-aid clinic + Red Cross medical cabinet + wall AED + interactive kiosk screen
  const medCabinet = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.8, 0.5),
    new THREE.MeshStandardMaterial({ color: '#F8FAFC', emissive: '#F43F5E', emissiveIntensity: 0.35 })
  );
  medCabinet.position.set(lx + 1.5, y + 0.9, lz - 3.6);
  const medBed = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.65, 0.9), alumMat);
  medBed.position.set(lx + 1.5, y + 0.33, lz - 1.8);
  const infoScreen = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 1.9, 0.16),
    new THREE.MeshStandardMaterial({ color: '#0F172A', emissive: '#38BDF8', emissiveIntensity: 0.72 })
  );
  infoScreen.position.set(lx + 4.2, y + 0.95, lz + 3.2);
  innerGroup.add(medCabinet, medBed, infoScreen);
}
