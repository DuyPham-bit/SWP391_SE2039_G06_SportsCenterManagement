import React, { useEffect, useMemo, useRef } from 'react';

/**
 * Calibrated North axis offset (in degrees) for the 3D scene coordinate system:
 * World North = -Z, East = +X, South = +Z, West = -X -> NORTH_OFFSET = 0.
 */
export const NORTH_OFFSET = 0;

const DIRECTIONS_8 = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export function normalizeDeg(deg) {
  return ((deg % 360) + 360) % 360;
}

export function shortestAngleDelta(fromDeg, toDeg) {
  return ((toDeg - fromDeg + 540) % 360) - 180;
}

export function computeHeadingDeg(azimuthRad) {
  return normalizeDeg((-azimuthRad * 180) / Math.PI + NORTH_OFFSET);
}

export function headingToCardinal(headingDeg) {
  const idx = Math.round(normalizeDeg(headingDeg) / 45) % 8;
  return DIRECTIONS_8[idx];
}

/**
 * Google Earth-inspired 5-layer inline SVG Navigation Compass:
 * 1. Outer Metallic Bezel
 * 2. 360° Rotating Degree Scale (5° / 15° / 45° ticks + upright 30° labels)
 * 3. Eight-Point Compass Rose (cardinals N/E/S/W + intercardinals NE/SE/SW/NW, upright text)
 * 4. Central Diamond Compass Needle (red North / silver South + center pivot)
 * 5. Fixed Top Heading Indicator (orange-yellow triangle) + digital degree readout
 */
export function CompassNav({ azimuth = 0, night = false, view = '3d', onFaceNorth, onResetView }) {
  const btnRef = useRef(null);
  const dialRef = useRef(null);
  const counterLabelRefs = useRef([]);
  const readoutRef = useRef(null);

  const initialHeading = computeHeadingDeg(azimuth);
  const animState = useRef({
    currentDial: -initialHeading,
    targetDial: -initialHeading,
    velocity: 0,
    lastHeadingReported: -1,
    raf: 0,
    lastTime: 0
  });

  // Precompute static SVG tick marks, 30° degree numerals, and 8-point compass rose labels
  const { ticks, degLabels, roseLabels } = useMemo(() => {
    const tks = [];
    for (let d = 0; d < 360; d += 5) {
      const rad = ((d - 90) * Math.PI) / 180;
      const isMajor = d % 45 === 0;
      const isMed = !isMajor && d % 15 === 0;
      const rOuter = 44.5;
      const rInner = isMajor ? 39.2 : isMed ? 41.0 : 42.6;
      tks.push({
        d,
        isMajor,
        isMed,
        x1: +(Math.cos(rad) * rInner).toFixed(2),
        y1: +(Math.sin(rad) * rInner).toFixed(2),
        x2: +(Math.cos(rad) * rOuter).toFixed(2),
        y2: +(Math.sin(rad) * rOuter).toFixed(2)
      });
    }

    const dLbls = [];
    for (let d = 0; d < 360; d += 30) {
      const rad = ((d - 90) * Math.PI) / 180;
      dLbls.push({
        text: String(d),
        x: +(Math.cos(rad) * 33.8).toFixed(2),
        y: +(Math.sin(rad) * 33.8).toFixed(2)
      });
    }

    const rLbls = DIRECTIONS_8.map((dir, i) => {
      const deg = i * 45;
      const rad = ((deg - 90) * Math.PI) / 180;
      const cardinal = i % 2 === 0;
      const radius = cardinal ? 22.8 : 25.0;
      return {
        dir,
        cardinal,
        isNorth: dir === 'N',
        x: +(Math.cos(rad) * radius).toFixed(2),
        y: +(Math.sin(rad) * radius).toFixed(2)
      };
    });

    return { ticks: tks, degLabels: dLbls, roseLabels: rLbls };
  }, []);

  const applyDomTransforms = (dialDeg) => {
    if (dialRef.current) {
      dialRef.current.setAttribute('transform', `rotate(${dialDeg.toFixed(2)})`);
    }
    const counterDeg = -dialDeg;
    for (const entry of counterLabelRefs.current) {
      if (entry?.el) {
        entry.el.setAttribute('transform', `rotate(${counterDeg.toFixed(2)} ${entry.x} ${entry.y})`);
      }
    }
    const heading = normalizeDeg(-dialDeg);
    const rounded = Math.round(heading) % 360;
    if (rounded !== animState.current.lastHeadingReported) {
      animState.current.lastHeadingReported = rounded;
      const cardinal = headingToCardinal(heading);
      const label = `${rounded}° ${cardinal}`;
      if (readoutRef.current) readoutRef.current.textContent = label;
      if (btnRef.current) {
        btnRef.current.setAttribute('aria-label', `Compass ${label} (${view.toUpperCase()}). Click to face North.`);
      }
    }
  };

  useEffect(() => {
    const heading = view === '2d' ? 0 : computeHeadingDeg(azimuth);
    const nextTargetDial = -heading;
    const st = animState.current;
    const delta = shortestAngleDelta(normalizeDeg(st.targetDial), normalizeDeg(nextTargetDial));
    if (Math.abs(delta) < 0.1) return undefined;

    st.targetDial += delta;
    if (st.raf) return undefined;

    st.lastTime = performance.now();
    const step = (now) => {
      st.raf = 0;
      const dt = Math.min(0.05, Math.max(0.001, (now - st.lastTime) / 1000));
      st.lastTime = now;

      const diff = st.targetDial - st.currentDial;
      // Underdamped angular spring with sub-stepping for smooth overshoot & quick settle across frame rates
      const steps = dt > 0.025 ? 2 : 1;
      const subDt = dt / steps;
      const stiffness = 240;
      const damping = 24;
      for (let s = 0; s < steps; s += 1) {
        const d = st.targetDial - st.currentDial;
        const accel = d * stiffness - st.velocity * damping;
        st.velocity += accel * subDt;
        st.currentDial += st.velocity * subDt;
      }

      applyDomTransforms(st.currentDial);

      if (Math.abs(diff) > 0.08 || Math.abs(st.velocity) > 0.12) {
        st.raf = requestAnimationFrame(step);
      } else {
        st.currentDial = st.targetDial;
        st.velocity = 0;
        applyDomTransforms(st.currentDial);
      }
    };
    st.raf = requestAnimationFrame(step);
    return undefined;
  }, [azimuth, view]);

  useEffect(() => {
    const st = animState.current;
    applyDomTransforms(st.currentDial);
    return () => {
      if (st.raf) {
        cancelAnimationFrame(st.raf);
        st.raf = 0;
      }
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onFaceNorth?.();
    }
  };

  let labelSlot = 0;
  const registerCounterLabel = (el, x, y) => {
    if (!el) return;
    counterLabelRefs.current[labelSlot] = { el, x, y };
    labelSlot += 1;
  };
  labelSlot = 0;

  return (
    <div className="cm-compass-wrap" data-night={night ? 'true' : 'false'}>
      <button
        ref={btnRef}
        type="button"
        className="cm-card cm-compass"
        title="Click to face North"
        aria-label={`Compass ${Math.round(initialHeading)}° ${headingToCardinal(initialHeading)}. Click to face North.`}
        onClick={() => onFaceNorth?.()}
        onDoubleClick={() => onResetView?.()}
        onKeyDown={handleKeyDown}
      >
        <svg viewBox="-50 -50 100 100" className="cm-compass__svg" aria-hidden="true">
          <defs>
            <radialGradient id="cmBezelGrad" cx="35%" cy="28%" r="75%">
              <stop offset="0%" stopColor="#263248" />
              <stop offset="65%" stopColor="#121A2B" />
              <stop offset="100%" stopColor="#090D18" />
            </radialGradient>
            <radialGradient id="cmFaceGrad" cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#162035" />
              <stop offset="100%" stopColor="#0B1120" />
            </radialGradient>
            <linearGradient id="cmNorthRed" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={night ? '#FF5A5A' : '#EF4444'} />
              <stop offset="50%" stopColor={night ? '#FF5A5A' : '#EF4444'} />
              <stop offset="50%" stopColor={night ? '#E11D48' : '#B91C1C'} />
              <stop offset="100%" stopColor={night ? '#E11D48' : '#B91C1C'} />
            </linearGradient>
            <linearGradient id="cmSouthSilver" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="50%" stopColor="#F8FAFC" />
              <stop offset="50%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
          </defs>

          {/* Layer 1: Metallic Outer Bezel + Inner Shadow Well */}
          <circle cx="0" cy="0" r="48.5" fill="url(#cmBezelGrad)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />
          <circle cx="0" cy="0" r="45.2" fill="url(#cmFaceGrad)" stroke="rgba(242,204,143,0.18)" strokeWidth="0.8" />

          {/* Rotating Dial (Layers 2, 3, 4) */}
          <g ref={dialRef} className="cm-compass__dial">
            {/* Layer 2: 360° Degree Scale & Upright Numerals */}
            {ticks.map((t) => (
              <line
                key={t.d}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={t.isMajor ? '#F8FAFC' : t.isMed ? '#CBD5E1' : '#64748B'}
                strokeWidth={t.isMajor ? '1.35' : t.isMed ? '0.9' : '0.55'}
                strokeOpacity={night ? (t.isMajor ? 0.98 : 0.72) : (t.isMajor ? 0.85 : 0.5)}
              />
            ))}
            {degLabels.map((lbl) => (
              <text
                key={lbl.text}
                ref={(el) => registerCounterLabel(el, lbl.x, lbl.y)}
                x={lbl.x}
                y={lbl.y}
                fontSize="5.2"
                fontWeight="700"
                fill={night ? '#E2E8F0' : '#94A3B8'}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {lbl.text}
              </text>
            ))}

            {/* Layer 3: Eight-Point Compass Rose */}
            {/* Intercardinal bevel star behind cardinal star */}
            {[45, 135, 225, 315].map((ang) => (
              <g key={ang} transform={`rotate(${ang})`}>
                <polygon points="0,-16.5 2.4,-2.4 0,0" fill="#64748B" />
                <polygon points="0,-16.5 -2.4,-2.4 0,0" fill="#334155" />
              </g>
            ))}
            {/* Cardinal 4-point beveled star */}
            {[0, 90, 180, 270].map((ang) => (
              <g key={ang} transform={`rotate(${ang})`}>
                <polygon points="0,-19.5 3.1,-3.1 0,0" fill={ang === 0 ? '#F87171' : '#CBD5E1'} opacity="0.9" />
                <polygon points="0,-19.5 -3.1,-3.1 0,0" fill={ang === 0 ? '#B91C1C' : '#475569'} opacity="0.9" />
              </g>
            ))}
            {roseLabels.map((r) => (
              <text
                key={r.dir}
                ref={(el) => registerCounterLabel(el, r.x, r.y)}
                x={r.x}
                y={r.y}
                fontSize={r.cardinal ? '7.2' : '4.8'}
                fontWeight={r.cardinal ? '900' : '700'}
                fill={r.isNorth ? (night ? '#FF6B6B' : '#EF4444') : r.cardinal ? '#F8FAFC' : '#94A3B8'}
                textAnchor="middle"
                dominantBaseline="central"
                className={r.cardinal && night ? 'cm-compass__glow' : undefined}
              >
                {r.dir}
              </text>
            ))}

            {/* Layer 4: Central Diamond Compass Needle (Red North / Silver South) + Pivot */}
            <polygon points="0,-14.5 3.2,0 -3.2,0" fill="url(#cmNorthRed)" />
            <polygon points="0,14.5 3.2,0 -3.2,0" fill="url(#cmSouthSilver)" />
            <line x1="0" y1="-14.5" x2="0" y2="14.5" stroke="rgba(15,23,42,0.35)" strokeWidth="0.5" />
            <circle cx="0" cy="0" r="2.3" fill="#E2E8F0" stroke="#0F172A" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="0.9" fill="#F59E0B" />
          </g>

          {/* Layer 5: Fixed Top Orange-Yellow Heading Indicator (Never Rotates) */}
          <polygon points="0,-44.2 -3.4,-49.4 3.4,-49.4" fill="#F59E0B" stroke="#0B1020" strokeWidth="0.6" />
        </svg>
      </button>
      <div className="cm-compass__readout" ref={readoutRef} aria-hidden="true">
        {Math.round(initialHeading)}° {headingToCardinal(initialHeading)}
      </div>
    </div>
  );
}
