import * as THREE from 'three';

const CANDIDATE_OFFSETS = [
  [0, -24], [-64, -28], [64, -28], [0, -58], [-94, -14], [94, -14], [0, 30], [-72, 26], [72, 26]
];

/**
 * Spatial label & leader-line manager:
 * - Hides occluded labels behind buildings using ~190 ms throttled raycasting
 * - Resolves 2D screen-space collisions closest-first with colored leader lines
 * - Collapses tightly clustered secondary labels to compact badge markers
 */
export function createLabelManager({ labelLayer, onSelect, getBuildingTotalHeight, compactDistance = 195 }) {
  const leaderSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  leaderSvg.setAttribute('class', 'cm-leaders');
  leaderSvg.setAttribute('aria-hidden', 'true');
  leaderSvg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;';
  labelLayer.appendChild(leaderSvg);

  let labels = new Map();
  let lastOcclusionAt = 0;
  let cachedBuildings = null;
  const projected = new THREE.Vector3();
  const ray = new THREE.Ray();
  const hitPoint = new THREE.Vector3();
  const dirVec = new THREE.Vector3();

  function clear() {
    for (const { el, lineEl, dotEl } of labels.values()) {
      el.remove();
      lineEl.remove();
      dotEl.remove();
    }
    labels = new Map();
    cachedBuildings = null;
  }

  function build(campus) {
    clear();
    leaderSvg.innerHTML = '';
    for (const zone of campus.zones) {
      if (zone.kind === 'landscape') continue;
      const el = document.createElement('div');
      el.className = 'cm-label';
      el.setAttribute('aria-hidden', 'true');
      el.style.setProperty('--zone', zone.color);
      el.innerHTML = '<span class="cm-label__code"></span><span class="cm-label__text"><b></b><small></small></span>';
      el.querySelector('.cm-label__code').textContent = zone.code;
      el.querySelector('b').textContent = zone.name;
      el.addEventListener('click', (event) => {
        event.stopPropagation();
        onSelect?.({ zoneId: zone.id });
      });
      labelLayer.appendChild(el);

      const lineEl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      lineEl.setAttribute('stroke', zone.color);
      lineEl.setAttribute('stroke-width', '1.6');
      lineEl.setAttribute('stroke-dasharray', '3 2');
      const dotEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dotEl.setAttribute('r', '3.5');
      dotEl.setAttribute('fill', zone.color);
      dotEl.setAttribute('stroke', '#0B1020');
      dotEl.setAttribute('stroke-width', '1.5');
      leaderSvg.appendChild(lineEl);
      leaderSvg.appendChild(dotEl);

      const topH = zone.floors > 0 ? getBuildingTotalHeight(zone) + 2.4 : 4.8;
      labels.set(zone.id, {
        el,
        lineEl,
        dotEl,
        anchor: new THREE.Vector3(zone.x, topH, zone.z),
        zone,
        occluded: false,
        screenBox: null
      });
    }
  }

  function refreshOcclusion(built, camera, selectedZoneId, now) {
    if (now - lastOcclusionAt < 190 || !built) return;
    lastOcclusionAt = now;
    if (!cachedBuildings) {
      cachedBuildings = [];
      for (const entry of built.zones.values()) {
        if (entry.zone.floors > 0) {
          const z = entry.zone;
          const h = getBuildingTotalHeight(z);
          cachedBuildings.push({
            id: z.id,
            box: new THREE.Box3(
              new THREE.Vector3(z.x - z.buildingWidth / 2, 0, z.z - z.buildingDepth / 2),
              new THREE.Vector3(z.x + z.buildingWidth / 2, h, z.z + z.buildingDepth / 2)
            )
          });
        }
      }
    }
    for (const label of labels.values()) {
      if (label.zone.id === selectedZoneId) {
        label.occluded = false;
        continue;
      }
      dirVec.copy(label.anchor).sub(camera.position);
      const maxDist = dirVec.length();
      ray.set(camera.position, dirVec.normalize());
      let occluded = false;
      for (const b of cachedBuildings) {
        if (b.id !== label.zone.id && ray.intersectBox(b.box, hitPoint)) {
          if (camera.position.distanceTo(hitPoint) < maxDist - 2.2) {
            occluded = true;
            break;
          }
        }
      }
      label.occluded = occluded;
    }
  }

  function layout({ renderer, camera, controls, built, selectedZoneId, now = performance.now() }) {
    const rect = renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    refreshOcclusion(built, camera, selectedZoneId, now);

    const distance = camera.position.distanceTo(controls.target);
    const farCompact = distance > compactDistance;
    const placed = [];

    const ordered = [...labels.values()].sort((a, b) => {
      const selDiff = (b.zone.id === selectedZoneId) - (a.zone.id === selectedZoneId);
      if (selDiff) return selDiff;
      return camera.position.distanceToSquared(a.anchor) - camera.position.distanceToSquared(b.anchor);
    });

    for (const label of ordered) {
      projected.copy(label.anchor).project(camera);
      const inFrustum = projected.z > 0 && projected.z < 1 && Math.abs(projected.x) < 1.04 && Math.abs(projected.y) < 1.04;
      const isSelected = label.zone.id === selectedZoneId;

      // Completely hide off-screen or occluded labels so they never ghost over foreground buildings
      if (!inFrustum || (label.occluded && !isSelected)) {
        label.el.style.opacity = '0';
        label.el.style.pointerEvents = 'none';
        label.lineEl.setAttribute('opacity', '0');
        label.dotEl.setAttribute('opacity', '0');
        label.screenBox = null;
        continue;
      }

      const ax = (projected.x * 0.5 + 0.5) * rect.width;
      const ay = (-projected.y * 0.5 + 0.5) * rect.height;
      label.el.classList.toggle('is-selected', isSelected);
      label.el.classList.toggle('is-dimmed', selectedZoneId != null && !isSelected);

      let useCompact = farCompact && !isSelected;
      label.el.classList.toggle('is-compact', useCompact);
      let w = useCompact ? 32 : (label.el.offsetWidth || 168);
      let h = useCompact ? 32 : (label.el.offsetHeight || 38);

      let chosen = null;
      for (const [ox, oy] of CANDIDATE_OFFSETS) {
        const lx = THREE.MathUtils.clamp(ax + ox, w / 2 + 12, rect.width - w / 2 - 12);
        const ly = THREE.MathUtils.clamp(ay + oy, h + 14, rect.height - 18);
        const box = { l: lx - w / 2 - 4, r: lx + w / 2 + 4, t: ly - h - 4, b: ly + 4, lx, ly };
        if (!placed.some((p) => box.l < p.r && box.r > p.l && box.t < p.b && box.b > p.t)) {
          chosen = box;
          break;
        }
      }

      if (!chosen && !isSelected) {
        label.el.classList.add('is-compact');
        w = 30;
        h = 30;
        for (const [ox, oy] of CANDIDATE_OFFSETS) {
          const lx = THREE.MathUtils.clamp(ax + ox * 0.75, 22, rect.width - 22);
          const ly = THREE.MathUtils.clamp(ay + oy * 0.75, 40, rect.height - 16);
          const box = { l: lx - 17, r: lx + 17, t: ly - 32, b: ly + 2, lx, ly };
          if (!placed.some((p) => box.l < p.r && box.r > p.l && box.t < p.b && box.b > p.t)) {
            chosen = box;
            break;
          }
        }
      }
      if (!chosen) {
        chosen = { l: ax - w / 2, r: ax + w / 2, t: ay - h - 18, b: ay - 18, lx: ax, ly: ay - 18 };
      }

      placed.push(chosen);
      label.screenBox = chosen;
      label.el.style.transform = `translate(-50%, -100%) translate(${chosen.lx.toFixed(1)}px, ${chosen.ly.toFixed(1)}px)`;
      label.el.style.opacity = '1';
      label.el.style.pointerEvents = 'auto';

      label.dotEl.setAttribute('cx', ax.toFixed(1));
      label.dotEl.setAttribute('cy', ay.toFixed(1));
      label.dotEl.setAttribute('opacity', '1');
      label.lineEl.setAttribute('x1', ax.toFixed(1));
      label.lineEl.setAttribute('y1', ay.toFixed(1));
      label.lineEl.setAttribute('x2', chosen.lx.toFixed(1));
      label.lineEl.setAttribute('y2', (chosen.ly - 2).toFixed(1));
      label.lineEl.setAttribute('opacity', '1');
    }
  }

  function updateNamesAndSubs(campus, labelSubs) {
    for (const zone of campus.zones) {
      const label = labels.get(zone.id);
      if (label) {
        label.zone = zone;
        label.el.querySelector('b').textContent = zone.name;
        const sub = labelSubs?.[zone.id] || '';
        const small = label.el.querySelector('small');
        if (small.textContent !== sub) small.textContent = sub;
      }
    }
  }

  return {
    build,
    clear,
    layout,
    updateNamesAndSubs,
    getPlacedBoxes: () => [...labels.values()].map((l) => l.screenBox).filter(Boolean),
    hasLabels: () => labels.size > 0
  };
}
