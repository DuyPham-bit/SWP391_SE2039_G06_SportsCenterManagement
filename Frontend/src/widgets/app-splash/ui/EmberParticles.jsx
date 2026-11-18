import React, { useEffect, useRef, useState } from 'react';

// Palette only: sand-300, sand-500 and teal-500 (see splash.css header).
const COLORS = ['242,204,143', '229,163,60', '63,174,184'];
const MAX_EMBERS = 26;
const MOBILE_EMBERS = 14;
// Mouse parallax (fine pointers only): the largest embers shift up to this many px, small ones less.
const PARALLAX_PX = 28;
const PARALLAX_LERP = 0.06;

function spawn(width, height, anywhere) {
  return {
    x: width / 2 + (Math.random() - 0.5) * Math.min(width, 960),
    y: anywhere ? Math.random() * height : height + 8,
    r: 0.6 + Math.random() * 1.5,
    vy: 12 + Math.random() * 20,
    sway: 4 + Math.random() * 8,
    phase: Math.random() * Math.PI * 2,
    alpha: 0.25 + Math.random() * 0.45,
    color: COLORS[(Math.random() * COLORS.length) | 0],
  };
}

/** Torch embers drifting upwards on a canvas: capped count, DPR ≤ 2, paused while the tab is hidden. */
export function EmberParticles({ phase = 'loading' }) {
  const canvasRef = useRef(null);
  const phaseRef = useRef(phase);
  const burstRef = useRef(0);
  if (phase === 'exit' && phaseRef.current !== 'exit') {
    burstRef.current = 1;
  }
  phaseRef.current = phase;
  const [on, setOn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return undefined;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const count = width < 640 ? MOBILE_EMBERS : MAX_EMBERS;
    const embers = Array.from({ length: count }, () => spawn(width, height, true));
    let raf = 0;
    let last = performance.now();

    // Pointer target (-1..1) and its smoothed value; touch devices never get a listener.
    const finePointer = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
    let tx = 0;
    let ty = 0;
    let px = 0;
    let py = 0;
    const onMove = (ev) => {
      tx = (ev.clientX / window.innerWidth) * 2 - 1;
      ty = (ev.clientY / window.innerHeight) * 2 - 1;
    };
    if (finePointer) window.addEventListener('pointermove', onMove, { passive: true });

    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) { last = now; return; }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const burst = burstRef.current;
      if (burst > 0.005) burstRef.current *= Math.exp(-dt * 3.4);
      else burstRef.current = 0;
      px += (tx - px) * PARALLAX_LERP;
      py += (ty - py) * PARALLAX_LERP;
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      for (let i = 0; i < embers.length; i += 1) {
        let e = embers[i];
        e.y -= e.vy * dt;
        e.x += Math.sin(t * 0.7 + e.phase) * e.sway * dt;
        if (burst > 0.01) {
          const rx = e.x - cx;
          const ry = e.y - cy;
          const dist = Math.hypot(rx, ry) || 1;
          const kick = (420 + (i % 5) * 90) * burst * dt;
          e.x += (rx / dist) * kick;
          e.y += (ry / dist) * kick;
        }
        if (e.y < -10) e = embers[i] = spawn(width, height, false);
        // Fade in near the bottom, die out over the upper third, twinkle a little.
        const rise = Math.min(1, (height - e.y) / 140);
        const fall = Math.min(1, e.y / (height * 0.35));
        const a = Math.min(1, e.alpha * rise * fall * (0.75 + 0.25 * Math.sin(t * 3 + e.phase)) * (1 + burst * 0.85));
        if (a <= 0.01) continue;
        // Bigger embers read as closer, so they move further against the cursor.
        const depth = e.r / 2.1;
        const dx = e.x - px * PARALLAX_PX * depth;
        const dy = e.y - py * PARALLAX_PX * depth;
        ctx.fillStyle = `rgba(${e.color},${(a * 0.18).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(dx, dy, e.r * 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${e.color},${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(dx, dy, e.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(frame);
    setOn(true);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return <canvas ref={canvasRef} className={`osa-splash__embers${on ? ' is-on' : ''}`} aria-hidden="true" />;
}
