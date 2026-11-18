import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { courtMarkings, MARKING_COLOR, SURFACES } from '../model/courtMarkings.js';
import { FEATURE_LEGEND, statusLabel } from '../model/campusModel.js';

const ICONS = Object.fromEntries(FEATURE_LEGEND.map((f) => [f.type, f]));
const SPACE_COLORS = { locker_m: '#93C5FD', locker_f: '#F9A8D4', wc: '#A5B4FC', reception: '#FDE68A', cafe: '#FDBA74', medical: '#FBCFE8', kiosk: '#CBD5E1' };
const SPACE_ICON = { locker_m: 'man', locker_f: 'woman', wc: 'wc', reception: 'concierge', cafe: 'local_cafe', medical: 'medical_services', kiosk: 'checkroom' };

function Markings({ room }) {
  const shapes = useMemo(() => courtMarkings(room.kind, room.width, room.depth), [room.kind, room.width, room.depth]);
  const fill = room.kind?.startsWith('football') ? 'url(#cm-turf)' : room.kind === 'basketball' ? 'url(#cm-wood)' : (SURFACES[room.kind] || '#8A8F98');
  return (
    <g transform={`translate(${room.x} ${room.z}) rotate(${room.rotation || 0})`}>
      <rect x={-room.width / 2} y={-room.depth / 2} width={room.width} height={room.depth} fill={fill} />
      {shapes.map((s, i) => {
        const stroke = s.stroke || MARKING_COLOR;
        if (s.t === 'rect') return <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} fill={s.fill || 'none'} stroke={stroke} strokeWidth={0.08} />;
        if (s.t === 'line') return <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={stroke} strokeWidth={0.08} />;
        if (s.t === 'circle') return <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.fill || 'none'} stroke={s.fill ? 'none' : stroke} strokeWidth={0.08} />;
        if (s.t === 'poly') return <polyline key={i} points={s.points.map((p) => p.join(',')).join(' ')} fill="none" stroke={stroke} strokeWidth={0.08} />;
        return null;
      })}
    </g>
  );
}

function Icon({ x, y, type, size = 2.6, title }) {
  const meta = ICONS[type];
  if (!meta) return null;
  return (
    <g transform={`translate(${x} ${y})`} pointerEvents="none">
      {title && <title>{title}</title>}
      <circle r={size * 0.62} fill="#0B1020" stroke={meta.color} strokeWidth={0.25} />
      <text className="material-symbols-outlined" style={{ fontSize: size * 0.8 }} fill={meta.color} textAnchor="middle" dominantBaseline="central">{meta.icon}</text>
    </g>
  );
}

const CampusPlan2D = forwardRef(function CampusPlan2D(
  { campus, lang, statusAt, selectedZoneId, selectedRoomId, floor, route, onHover, onSelect, onScaleChange, labels },
  ref
) {
  const svgRef = useRef(null);
  const bounds = useMemo(() => {
    const zs = campus.zones;
    const minX = Math.min(...zs.map((z) => z.x - z.width / 2));
    const maxX = Math.max(...zs.map((z) => z.x + z.width / 2));
    const minZ = Math.min(...zs.map((z) => z.z - z.depth / 2));
    const maxZ = Math.max(...zs.map((z) => z.z + z.depth / 2));
    return { x: minX - 6, y: minZ - 6, w: maxX - minX + 12, h: maxZ - minZ + 18 };
  }, [campus]);
  const [view, setView] = useState(bounds);
  const drag = useRef(null);

  useEffect(() => { setView(bounds); }, [bounds]);

  // meters per screen pixel for the scale bar (preserveAspectRatio = meet)
  const reportScale = useCallback(() => {
    const el = svgRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    if (!width || !height) return;
    onScaleChange?.({ azimuth: 0, metersPerPixel: Math.max(view.w / width, view.h / height) });
  }, [view, onScaleChange]);
  useEffect(() => {
    reportScale();
    const observer = new ResizeObserver(reportScale);
    if (svgRef.current) observer.observe(svgRef.current);
    return () => observer.disconnect();
  }, [reportScale]);

  const zoomAt = useCallback((factor, cx, cy) => {
    setView((v) => {
      const w = Math.min(bounds.w * 1.5, Math.max(12, v.w * factor));
      const h = w * (v.h / v.w);
      const px = cx ?? v.x + v.w / 2;
      const py = cy ?? v.y + v.h / 2;
      return { x: px - ((px - v.x) * w) / v.w, y: py - ((py - v.y) * h) / v.h, w, h };
    });
  }, [bounds]);

  const toWorld = (clientX, clientY) => {
    const el = svgRef.current;
    const point = el.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const p = point.matrixTransform(el.getScreenCTM().inverse());
    return [p.x, p.y];
  };

  useImperativeHandle(ref, () => ({
    focusZone(id) {
      const z = campus.zones.find((zone) => zone.id === id);
      if (!z) return;
      const pad = Math.max(z.width, z.depth) * 0.25;
      const w = z.width + pad * 2;
      const h = z.depth + pad * 2;
      const ratio = bounds.h / bounds.w;
      const vw = Math.max(w, h / ratio);
      const vh = vw * ratio;
      setView({ x: z.x - vw / 2, y: z.z - vh / 2, w: vw, h: vh });
    },
    resetView: () => setView(bounds),
    zoomBy: (f) => zoomAt(f),
    rotateBy: () => {}
  }), [campus, bounds, zoomAt]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return undefined;
    const onWheel = (event) => {
      event.preventDefault();
      const [x, y] = toWorld(event.clientX, event.clientY);
      zoomAt(event.deltaY > 0 ? 1.15 : 1 / 1.15, x, y);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const onPointerDown = (event) => {
    drag.current = { x: event.clientX, y: event.clientY, view, moved: false };
  };
  const onPointerMove = (event) => {
    if (!drag.current) return;
    const el = svgRef.current.getBoundingClientRect();
    const scale = Math.max(drag.current.view.w / el.width, drag.current.view.h / el.height);
    const dx = (event.clientX - drag.current.x) * scale;
    const dy = (event.clientY - drag.current.y) * scale;
    if (Math.abs(dx) + Math.abs(dy) > scale * 4) drag.current.moved = true;
    if (drag.current.moved) setView({ ...drag.current.view, x: drag.current.view.x - dx, y: drag.current.view.y - dy });
  };
  const onPointerUp = () => { setTimeout(() => { drag.current = null; }, 0); };
  const wasDrag = () => drag.current?.moved;

  const hoverAt = (event, zoneId, roomId = null) => {
    const rect = svgRef.current.getBoundingClientRect();
    onHover?.({ zoneId, roomId, x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

  const shownFloor = (zone) => (zone.floors > 0 ? (zone.id === selectedZoneId && floor ? floor : 1) : 0);
  const keySelect = (event, payload) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect?.(payload); }
  };

  const features = campus.features;
  return (
    <svg
      ref={svgRef}
      className="cm-canvas cm-view-fade"
      viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
      preserveAspectRatio="xMidYMid meet"
      role="group"
      aria-label={labels.mapLabel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => onHover?.(null)}
      onClick={(event) => { if (event.target === svgRef.current && !wasDrag()) onSelect?.(null); }}
      style={{ cursor: 'grab', background: '#1B2A1F' }}
    >
      <defs>
        <pattern id="cm-hatch" width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="2" height="2" fill="rgba(15,23,42,0.55)" />
          <line x1="0" y1="0" x2="0" y2="2" stroke="rgba(148,163,184,0.5)" strokeWidth="0.5" />
        </pattern>
        <pattern id="cm-turf" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="3" height="6" fill="#2D632E" />
          <rect x="3" width="3" height="6" fill="#397538" />
        </pattern>
        <pattern id="cm-wood" width="4" height="1.2" patternUnits="userSpaceOnUse">
          <rect width="4" height="1.2" fill="#C98A4B" />
          <line x1="0" y1="0" x2="4" y2="0" stroke="rgba(90,50,15,0.28)" strokeWidth="0.12" />
        </pattern>
      </defs>
      {/* street */}
      <rect x={bounds.x - 20} y={bounds.y + bounds.h - 12} width={bounds.w + 40} height={12} fill="#3F4450" />

      {/* parcels (keyboard focusable zone targets) */}
      {campus.zones.map((zone) => {
        const status = statusAt[zone.id] || zone.status;
        const selected = zone.id === selectedZoneId;
        const dim = selectedZoneId != null && !selected;
        return (
          <g
            key={zone.id}
            role="button"
            tabIndex={0}
            aria-pressed={selected}
            aria-label={`${zone.name}, ${statusLabel(status, lang)}`}
            onClick={(event) => { event.stopPropagation(); if (!wasDrag()) onSelect?.({ zoneId: zone.id }); }}
            onKeyDown={(event) => keySelect(event, { zoneId: zone.id })}
            onMouseMove={(event) => hoverAt(event, zone.id)}
            opacity={dim ? 0.38 : 1}
            style={{ cursor: 'pointer', outline: 'none' }}
          >
            <rect
              x={zone.x - zone.width / 2 + 0.2} y={zone.z - zone.depth / 2 + 0.2} width={zone.width - 0.4} height={zone.depth - 0.4}
              fill={zone.kind === 'landscape' ? '#6E9A59' : zone.color} fillOpacity={zone.kind === 'landscape' ? 0.85 : 0.2}
              stroke={zone.color} strokeWidth={selected ? 0.9 : 0.4}
            />
            {zone.buildingWidth > 0 && (
              <rect x={zone.x - zone.buildingWidth / 2} y={zone.z - zone.buildingDepth / 2} width={zone.buildingWidth} height={zone.buildingDepth}
                fill="#D9D6D0" stroke={zone.color} strokeWidth={0.6} rx={0.4} />
            )}
          </g>
        );
      })}

      {/* walkways (canopy = dashed edge) */}
      {features.filter((f) => f.type === 'path').map((f, i) => (
        <g key={`p${i}`} pointerEvents="none">
          <polyline points={f.points.map((p) => p.join(',')).join(' ')} fill="none" stroke="#E5E1D8" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
          {f.canopy && <polyline points={f.points.map((p) => p.join(',')).join(' ')} fill="none" stroke="#94A3B8" strokeWidth={3.4} strokeDasharray="1 1" strokeOpacity={0.6} strokeLinejoin="round" />}
        </g>
      ))}

      {/* rooms & courts (shown floor) */}
      {campus.zones.flatMap((zone) => zone.rooms
        .filter((room) => (zone.floors > 0 ? (room.floor || 1) === shownFloor(zone) : true))
        .map((room) => (
          <g
            key={`r${room.id}`}
            role="button"
            tabIndex={0}
            aria-label={`${room.name}, ${statusLabel(room.status, lang)}`}
            onClick={(event) => { event.stopPropagation(); if (!wasDrag()) onSelect?.({ zoneId: zone.id, roomId: room.id }); }}
            onKeyDown={(event) => keySelect(event, { zoneId: zone.id, roomId: room.id })}
            onMouseMove={(event) => { event.stopPropagation(); hoverAt(event, zone.id, room.id); }}
            opacity={selectedZoneId != null && zone.id !== selectedZoneId ? 0.4 : 1}
            style={{ cursor: 'pointer' }}
          >
            {room.kind === 'pickleball' && <rect x={room.x - (room.width + 3) / 2} y={room.z - (room.depth + 4.9) / 2} width={room.width + 3} height={room.depth + 4.9} fill="#3D5A80" stroke="#1E293B" strokeWidth={0.2} />}
            {room.kind?.startsWith('football') && <rect x={room.x - room.width / 2 - 1.5} y={room.z - room.depth / 2 - 1.5} width={room.width + 3} height={room.depth + 3} fill="#2F6B33" />}
            <Markings room={room} />
            {room.id === selectedRoomId && <rect x={room.x - room.width / 2 - 0.5} y={room.z - room.depth / 2 - 0.5} width={room.width + 1} height={room.depth + 1} fill="none" stroke="#FBBF24" strokeWidth={0.5} />}
          </g>
        )))}

      {/* spaces, stands, parking, trees, point features */}
      {campus.zones.flatMap((zone) => zone.features.map((f, i) => {
        const key = `f${zone.id}-${i}`;
        const level = f.floor && zone.floors > 0 ? f.floor : 0;
        if (level && level !== shownFloor(zone)) return null;
        switch (f.type) {
          case 'space':
            return (
              <g key={key} pointerEvents="none">
                <rect x={f.x - f.w / 2} y={f.z - f.d / 2} width={f.w} height={f.d} fill={SPACE_COLORS[f.variant] || '#E2E8F0'} stroke="#334155" strokeWidth={0.15} />
                <text className="material-symbols-outlined" x={f.x} y={f.z} style={{ fontSize: Math.min(3, Math.min(f.w, f.d) * 0.6) }} fill="#0F172A" textAnchor="middle" dominantBaseline="central">{SPACE_ICON[f.variant] || 'room'}</text>
                <title>{f.label}</title>
              </g>
            );
          case 'stand':
            return <rect key={key} x={f.x - f.w / 2} y={f.z - f.d / 2} width={f.w} height={f.d} fill="#9CA3AF" stroke="#475569" strokeWidth={0.15} pointerEvents="none" />;
          case 'tree_row': {
            const [fx, fz] = f.from;
            const [tx, tz] = f.to;
            const count = Math.max(1, Math.floor(Math.hypot(tx - fx, tz - fz) / (f.spacing || 6)) + 1);
            return (
              <g key={key} pointerEvents="none">
                {Array.from({ length: count }, (_, k) => {
                  const t = count === 1 ? 0 : k / (count - 1);
                  return <circle key={k} cx={fx + (tx - fx) * t} cy={fz + (tz - fz) * t} r={1.9} fill="#3F7D3A" stroke="#2B5A28" strokeWidth={0.2} />;
                })}
              </g>
            );
          }
          case 'parking_car': {
            const perRow = Math.ceil(f.count / 2);
            const bay = f.w / perRow;
            return (
              <g key={key} pointerEvents="none">
                <rect x={f.x - f.w / 2} y={f.z - f.d / 2} width={f.w} height={f.d} fill="#3B3F46" />
                {Array.from({ length: f.count }, (_, k) => {
                  const row = k < perRow ? 0 : 1;
                  const col = k % perRow;
                  const fill = k < (f.accessible || 0) ? '#2563EB' : k >= f.count - (f.ev || 0) ? '#15803D' : 'none';
                  return <rect key={k} x={f.x - f.w / 2 + col * bay} y={row === 0 ? f.z - f.d / 2 : f.z + f.d / 2 - 5} width={bay} height={5} fill={fill} stroke="#F8FAFC" strokeWidth={0.12} />;
                })}
                <text x={f.x} y={f.z} fontSize={2.2} fill="#F8FAFC" textAnchor="middle" dominantBaseline="central" fontWeight="700">P · {f.count}</text>
              </g>
            );
          }
          case 'parking_moto':
            return (
              <g key={key} pointerEvents="none">
                <rect x={f.x - f.w / 2} y={f.z - f.d / 2} width={f.w} height={f.d} fill="#4B5563" stroke="#CBD5E1" strokeWidth={0.2} strokeDasharray="0.6 0.4" />
                <text className="material-symbols-outlined" x={f.x} y={f.z - 1.5} style={{ fontSize: 4 }} fill="#E2E8F0" textAnchor="middle" dominantBaseline="central">two_wheeler</text>
                <text x={f.x} y={f.z + 2.5} fontSize={2} fill="#F8FAFC" textAnchor="middle" fontWeight="700">{f.count}</text>
              </g>
            );
          case 'gate':
            return (
              <g key={key} pointerEvents="none">
                <rect x={f.x - (f.w || 8) / 2} y={f.z - 0.6} width={f.w || 8} height={1.2} fill={f.variant === 'main' ? '#E5D9B6' : '#94A3B8'} />
                <Icon x={f.x} y={f.z + 3.4} type="gate" />
              </g>
            );
          case 'light': return <circle key={key} cx={f.x} cy={f.z} r={0.7} fill="#FACC15" stroke="#0B1020" strokeWidth={0.2} pointerEvents="none" />;
          case 'hydrant': case 'extinguisher': case 'exit': case 'sign': case 'ramp':
            return <Icon key={key} x={f.x} y={f.z} type={f.type} size={f.type === 'extinguisher' ? 2 : 2.6} />;
          default: return null;
        }
      }))}

      {/* closed / maintenance overlay at the simulated time */}
      {campus.zones.map((zone) => {
        const status = statusAt[zone.id] || zone.status;
        if (status !== 'Closed' && status !== 'Maintenance') return null;
        return <rect key={`c${zone.id}`} x={zone.x - zone.width / 2} y={zone.z - zone.depth / 2} width={zone.width} height={zone.depth} fill="url(#cm-hatch)" pointerEvents="none" />;
      })}

      {/* route */}
      {route?.points?.length > 1 && (
        <g pointerEvents="none">
          <polyline points={route.points.map((p) => p.join(',')).join(' ')} fill="none" stroke="#0B1020" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <polyline points={route.points.map((p) => p.join(',')).join(' ')} fill="none" stroke="#F59E0B" strokeWidth={1.1} strokeLinejoin="round" strokeLinecap="round" strokeDasharray="2.2 1.2">
            <animate attributeName="stroke-dashoffset" from="6.8" to="0" dur="1s" repeatCount="indefinite" />
          </polyline>
          <circle cx={route.points[0][0]} cy={route.points[0][1]} r={1.6} fill="#22C55E" stroke="#0B1020" strokeWidth={0.4} />
          <circle cx={route.points[route.points.length - 1][0]} cy={route.points[route.points.length - 1][1]} r={1.6} fill="#EF4444" stroke="#0B1020" strokeWidth={0.4} />
        </g>
      )}

      {/* zone code badges */}
      {campus.zones.filter((z) => z.kind !== 'landscape').map((zone) => {
        const bx = zone.x - zone.width / 2 + 4;
        const by = zone.z - zone.depth / 2 + 4;
        return (
          <g key={`b${zone.id}`} pointerEvents="none" opacity={selectedZoneId != null && zone.id !== selectedZoneId ? 0.5 : 1}>
            <circle cx={bx} cy={by} r={2.6} fill={zone.color} stroke="#0B1020" strokeWidth={0.3} />
            <text x={bx} y={by} fontSize={2.6} fontWeight="900" fill="#0B1020" textAnchor="middle" dominantBaseline="central">{zone.code}</text>
          </g>
        );
      })}
    </svg>
  );
});

export default CampusPlan2D;
