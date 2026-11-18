import React, { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../../../shared/lib/motion.js';

const mq = query => typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false;
const finePointer = () => mq('(hover: hover) and (pointer: fine)');

function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * True only where the Three.js hero is worth its cost: desktop width, a mouse, motion allowed,
 * at least 4 cores / 4 GB, and WebGL. Re-evaluated when the viewport crosses the desktop breakpoint.
 */
export function useCan3D() {
  const evaluate = () => {
    if (typeof window === 'undefined') return false;
    const cores = navigator.hardwareConcurrency || 8;
    const memory = navigator.deviceMemory || 8;
    return mq('(min-width: 1024px)') && finePointer() && !prefersReducedMotion() && cores >= 4 && memory >= 4 && hasWebGL();
  };
  const [can, setCan] = useState(false);
  useEffect(() => {
    setCan(evaluate());
    const desktop = window.matchMedia('(min-width: 1024px)');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setCan(evaluate());
    desktop.addEventListener('change', update);
    motion.addEventListener('change', update);
    return () => { desktop.removeEventListener('change', update); motion.removeEventListener('change', update); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return can;
}

/** Word-by-word reveal (slide up, blur → sharp). Screen readers get the plain sentence once. */
export function SplitWords({ text, start = 0, step = 70, className = '' }) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <React.Fragment key={`${word}-${i}`}>
            <span className="lp-word" style={{ '--wd': `${start + i * step}ms` }}>{word}</span>
            {i < words.length - 1 ? ' ' : null}
          </React.Fragment>
        ))}
      </span>
    </span>
  );
}

/**
 * Pointer-driven 3D tilt: writes --rx/--ry (degrees) and --cx/--cy (spotlight px) once per frame.
 * Mouse only and motion-allowed only; resets smoothly on leave.
 */
export function useTilt(max = 10) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let frame = 0;
    let last = null;
    const paint = () => {
      frame = 0;
      if (!last) return;
      const box = el.getBoundingClientRect();
      const px = (last.clientX - box.left) / box.width;
      const py = (last.clientY - box.top) / box.height;
      // Typing in the form: keep the card almost still so the caret never swims.
      const damp = el.matches(':focus-within') ? 0.35 : 1;
      el.style.setProperty('--rx', `${((0.5 - py) * max * 2 * damp).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${((px - 0.5) * max * 2 * damp).toFixed(2)}deg`);
      el.style.setProperty('--cx', `${(px * box.width).toFixed(0)}px`);
      el.style.setProperty('--cy', `${(py * box.height).toFixed(0)}px`);
      el.style.setProperty('--sx', `${((0.5 - px) * 2).toFixed(3)}`);
      el.style.setProperty('--sy', `${((0.5 - py) * 2).toFixed(3)}`);
    };
    const move = event => {
      if (event.pointerType !== 'mouse' || prefersReducedMotion() || !finePointer()) return;
      last = event;
      el.dataset.tilting = '';
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const leave = () => {
      last = null;
      delete el.dataset.tilting;
      ['--rx', '--ry', '--sx', '--sy'].forEach(name => el.style.removeProperty(name));
    };
    el.addEventListener('pointermove', move, { passive: true });
    el.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, [max]);
  return ref;
}

export function TiltCard({ as: Tag = 'div', max = 10, className = '', children, ...rest }) {
  const ref = useTilt(max);
  return <Tag ref={ref} className={`lp-tilt ${className}`} {...rest}>{children}</Tag>;
}

/** A link that leans toward the cursor (max ~10px) and springs back on leave. */
export function MagneticLink({ className = '', children, strength = 0.32, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let frame = 0;
    const move = event => {
      if (event.pointerType !== 'mouse' || prefersReducedMotion()) return;
      const { clientX, clientY } = event;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const box = el.getBoundingClientRect();
        const dx = Math.max(-10, Math.min(10, (clientX - (box.left + box.width / 2)) * strength));
        const dy = Math.max(-8, Math.min(8, (clientY - (box.top + box.height / 2)) * strength));
        el.style.setProperty('--mgx', `${dx.toFixed(1)}px`);
        el.style.setProperty('--mgy', `${dy.toFixed(1)}px`);
      });
    };
    const leave = () => { el.style.setProperty('--mgx', '0px'); el.style.setProperty('--mgy', '0px'); };
    el.addEventListener('pointermove', move, { passive: true });
    el.addEventListener('pointerleave', leave);
    return () => { cancelAnimationFrame(frame); el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, [strength]);
  return <a ref={ref} className={`lp-magnetic ${className}`} {...rest}>{children}</a>;
}

/** Native checkbox kept for semantics/tests (transparent, on top); the box and tick are drawn in SVG. */
export function AnimatedCheckbox({ id, checked, className = '', ...inputProps }) {
  return (
    <span className={`lp-check relative inline-flex h-[18px] w-[18px] shrink-0 ${className}`}>
      <input id={id} type="checkbox" checked={checked} className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0" {...inputProps} />
      <span aria-hidden="true" className="lp-check-box pointer-events-none absolute inset-0 rounded-[6px] border-[1.5px] border-brand-navy-300 bg-white transition-[background-color,border-color,box-shadow] duration-200 peer-checked:border-brand-sage-700 peer-checked:bg-brand-sage-700 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-sage-700 peer-focus-visible:ring-offset-2 peer-hover:border-brand-sage-700 dark:border-white/30 dark:bg-white/5" />
      <svg aria-hidden="true" viewBox="0 0 16 16" className="lp-check-tick pointer-events-none absolute inset-0 m-auto h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.2 8.4l3 3 6.6-6.8" pathLength="1" />
      </svg>
    </span>
  );
}
