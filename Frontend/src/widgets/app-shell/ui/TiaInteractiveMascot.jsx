import React, { useEffect, useId, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform
} from 'motion/react';
import './tiaInteractiveMascot.css';

const IDLE_EMBERS = [
  { id: 0, startX: 26, startY: 96, driftX: -8, endY: 6, r: 2.3, color: '#F59E0B', dur: 3.1, delay: 0.0 },
  { id: 1, startX: 96, startY: 90, driftX: 9, endY: 10, r: 2.0, color: '#4ADE80', dur: 3.4, delay: 0.4 },
  { id: 2, startX: 40, startY: 42, driftX: -7, endY: -10, r: 1.8, color: '#FDE047', dur: 2.8, delay: 0.8 },
  { id: 3, startX: 84, startY: 44, driftX: 8, endY: -8, r: 2.2, color: '#F59E0B', dur: 3.2, delay: 1.2 },
  { id: 4, startX: 20, startY: 66, driftX: -6, endY: 14, r: 1.7, color: '#4ADE80', dur: 3.7, delay: 1.6 },
  { id: 5, startX: 102, startY: 64, driftX: 6, endY: 12, r: 1.9, color: '#FBBF24', dur: 3.5, delay: 2.0 },
  { id: 6, startX: 54, startY: 26, driftX: -5, endY: -14, r: 1.6, color: '#FEF08A', dur: 2.5, delay: 0.5 },
  { id: 7, startX: 70, startY: 28, driftX: 6, endY: -12, r: 1.7, color: '#86EFAC', dur: 2.7, delay: 1.4 },
  { id: 8, startX: 30, startY: 112, driftX: -5, endY: 32, r: 1.5, color: '#FBBF24', dur: 3.6, delay: 2.2 },
  { id: 9, startX: 92, startY: 110, driftX: 5, endY: 34, r: 1.5, color: '#4ADE80', dur: 3.9, delay: 0.9 }
];

const BUFF_BURST_STARS = [
  { id: 0, angle: -140, dist: 46, color: '#4ADE80' },
  { id: 1, angle: -105, dist: 54, color: '#FACC15' },
  { id: 2, angle: -70, dist: 56, color: '#F59E0B' },
  { id: 3, angle: -35, dist: 48, color: '#4ADE80' },
  { id: 4, angle: 15, dist: 42, color: '#FDE047' },
  { id: 5, angle: 165, dist: 42, color: '#F59E0B' }
];

const ULTIMATE_RUNES = [
  { id: 0, angle: 0, color: '#22D3EE', symbol: '◆' },
  { id: 1, angle: 60, color: '#FACC15', symbol: '✦' },
  { id: 2, angle: 120, color: '#4ADE80', symbol: '◇' },
  { id: 3, angle: 180, color: '#22D3EE', symbol: '✦' },
  { id: 4, angle: 240, color: '#FACC15', symbol: '◆' },
  { id: 5, angle: 300, color: '#4ADE80', symbol: '✦' }
];

/**
 * Interactive Borderless "Tia" Flame Mascot with 3D SVG Lighting,
 * Trigonometric Cursor Eye Tracking, Secondary Spring Lag, and Skill Casting VFX.
 *
 * @param {object} props
 * @param {number|string} [props.size] Responsive default if omitted; pass px number or CSS width token.
 * @param {'idle'|'hover'|'skill_buff'|'skill_ultimate'|null} [props.activeSkill]
 * @param {(skill: string) => void} [props.onSkillComplete]
 * @param {boolean} [props.enableMouseTracking=true]
 * @param {boolean} [props.hovered=false]
 * @param {string} [props.className]
 */
export function TiaInteractiveMascot({
  size,
  activeSkill = null,
  onSkillComplete,
  enableMouseTracking = true,
  hovered = false,
  className = ''
}) {
  const uid = useId().replace(/:/g, '');
  const stageRef = useRef(null);
  const prefersReduced = useReducedMotion();

  const [isBlinking, setIsBlinking] = useState(false);
  const [internalSkill, setInternalSkill] = useState(null);
  const [isHoverLocal, setIsHoverLocal] = useState(false);

  const effectiveSkill =
    activeSkill === 'skill_buff' || activeSkill === 'skill_ultimate'
      ? activeSkill
      : internalSkill;
  const isHovered = hovered || isHoverLocal || activeSkill === 'hover';
  const isBuff = effectiveSkill === 'skill_buff';
  const isUltimate = effectiveSkill === 'skill_ultimate';
  const isExcited = isHovered || isBuff || isUltimate;

  // Completion timer when activeSkill is driven externally or internally
  const completeCbRef = useRef(onSkillComplete);
  completeCbRef.current = onSkillComplete;

  useEffect(() => {
    if (!effectiveSkill) return undefined;
    const duration = effectiveSkill === 'skill_ultimate' ? 2500 : 850;
    const timer = window.setTimeout(() => {
      const done = effectiveSkill;
      if (!activeSkill || activeSkill === 'idle' || activeSkill === 'hover') {
        setInternalSkill(null);
      }
      completeCbRef.current?.(done);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [effectiveSkill, activeSkill]);

  // Randomized single & double blinking every 3–6 seconds
  useEffect(() => {
    if (prefersReduced) return undefined;
    let mainTimer = null;
    let subTimers = [];

    const clearAll = () => {
      if (mainTimer) window.clearTimeout(mainTimer);
      subTimers.forEach((t) => window.clearTimeout(t));
      subTimers = [];
    };

    const scheduleBlink = () => {
      const waitMs = 3000 + Math.random() * 3000;
      mainTimer = window.setTimeout(() => {
        setIsBlinking(true);
        const isDouble = Math.random() < 0.28;
        subTimers.push(window.setTimeout(() => setIsBlinking(false), 130));
        if (isDouble) {
          subTimers.push(window.setTimeout(() => setIsBlinking(true), 230));
          subTimers.push(window.setTimeout(() => setIsBlinking(false), 360));
        }
        scheduleBlink();
      }, waitMs);
    };

    scheduleBlink();
    return clearAll;
  }, [prefersReduced]);

  // Global viewport mousemove tracking with spring physics
  const rawNormX = useMotionValue(0);
  const rawNormY = useMotionValue(0);
  const rawEyeX = useMotionValue(0);
  const rawEyeY = useMotionValue(0);

  // Requested spring physics: stiffness 150, damping 15 for head/body 3D parallax
  const headSpringX = useSpring(rawNormX, { stiffness: 150, damping: 15 });
  const headSpringY = useSpring(rawNormY, { stiffness: 150, damping: 15 });

  // Slower follow-through lag springs for crown flame tip & headband ribbons
  const lagSpringX = useSpring(rawNormX, { stiffness: 80, damping: 10 });
  const lagSpringY = useSpring(rawNormY, { stiffness: 80, damping: 10 });

  // Crisp eye socket pupil tracking springs
  const pupilX = useSpring(rawEyeX, { stiffness: 260, damping: 24 });
  const pupilY = useSpring(rawEyeY, { stiffness: 260, damping: 24 });

  const tiltRotateY = useTransform(headSpringX, [-1, 1], [-16, 16]);
  const tiltRotateX = useTransform(headSpringY, [-1, 1], [12, -12]);
  const parallaxX = useTransform(headSpringX, [-1, 1], [-7, 7]);
  const parallaxY = useTransform(headSpringY, [-1, 1], [-5, 5]);

  const flameLagX = useTransform(lagSpringX, [-1, 1], [-4.5, 4.5]);
  const flameLagRotate = useTransform(lagSpringX, [-1, 1], [-9, 9]);
  const ribbonLagRotate = useTransform(lagSpringX, [-1, 1], [10, -12]);
  const ribbonLagY = useTransform(lagSpringY, [-1, 1], [-2.5, 3]);

  useEffect(() => {
    if (!enableMouseTracking || prefersReduced) {
      rawNormX.set(0);
      rawNormY.set(0);
      rawEyeX.set(0);
      rawEyeY.set(0);
      return undefined;
    }

    const handleMouseMove = (e) => {
      const el = stageRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const cx = rect.left + rect.width * 0.5;
      const cy = rect.top + rect.height * 0.45;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      // Head tilt normalized [-1..1]
      const nx = Math.max(-1, Math.min(1, dx / 420));
      const ny = Math.max(-1, Math.min(1, dy / 340));
      rawNormX.set(nx);
      rawNormY.set(ny);

      // Trigonometric angle + radial clamping inside eye socket (max 2.8 SVG units)
      const angle = Math.atan2(dy, dx);
      const distRatio = Math.min(1, Math.hypot(dx, dy) / 220);
      const maxEyeRadius = 2.8;
      rawEyeX.set(Math.cos(angle) * distRatio * maxEyeRadius);
      rawEyeY.set(Math.sin(angle) * distRatio * (maxEyeRadius * 0.85));
    };

    const handleMouseLeave = () => {
      rawNormX.set(0);
      rawNormY.set(0);
      rawEyeX.set(0);
      rawEyeY.set(0);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('blur', handleMouseLeave);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('blur', handleMouseLeave);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enableMouseTracking, prefersReduced, rawNormX, rawNormY, rawEyeX, rawEyeY]);

  const inlineStyle = size
    ? {
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${Math.round(size * 1.22)}px` : undefined
      }
    : undefined;

  const ids = {
    bodyGrad: `tiaBody${uid}`,
    faceRim: `tiaRim${uid}`,
    flameGrad: `tiaFlame${uid}`,
    flameCoreGrad: `tiaFlameCore${uid}`,
    flameUltGrad: `tiaFlameUlt${uid}`,
    bandGrad: `tiaBand${uid}`,
    goldGrad: `tiaGold${uid}`,
    cupSpec: `tiaCupSpec${uid}`,
    auraFilter: `tiaBlur${uid}`,
    neonGlow: `tiaNeon${uid}`,
    eyeClip: `tiaEyeClip${uid}`
  };

  return (
    <div
      ref={stageRef}
      style={inlineStyle}
      onPointerEnter={() => setIsHoverLocal(true)}
      onPointerLeave={() => setIsHoverLocal(false)}
      className={`tia-hero-stage ${className}`}
    >
      {/* Soft borderless ambient aura glowing amber/gold & sage behind character */}
      <div
        className={`tia-hero-aura ${isHovered ? 'tia-hero-aura--hover' : ''} ${
          isUltimate ? 'tia-hero-aura--ultimate' : ''
        }`}
        aria-hidden="true"
      />

      <div className="tia-hero-perspective">
        <motion.div
          style={
            prefersReduced
              ? undefined
              : {
                  rotateX: tiltRotateX,
                  rotateY: tiltRotateY,
                  x: parallaxX,
                  y: parallaxY
                }
          }
        animate={
          prefersReduced
            ? undefined
            : isUltimate
              ? {
                  scale: [1, 0.88, 1.14, 1.12, 1],
                  rotateY: [0, 0, 360, 360, 0],
                  y: [0, 8, -14, -10, 0],
                  transition: { duration: 1.5, times: [0, 0.14, 0.55, 0.82, 1], ease: 'easeInOut' }
                }
              : isBuff
                ? {
                    scaleX: [1, 1.14, 0.9, 1.04, 1],
                    scaleY: [1, 0.86, 1.16, 0.97, 1],
                    y: [0, 7, -15, -2, 0],
                    transition: { duration: 0.62, ease: [0.22, 1.28, 0.36, 1] }
                  }
                : isHovered
                  ? { scale: 1.05, transition: { type: 'spring', stiffness: 260, damping: 18 } }
                  : { scale: 1, transition: { type: 'spring', stiffness: 220, damping: 20 } }
        }
        className="w-full h-full"
      >
        <svg
          viewBox="-14 -16 148 182"
          className="tia-hero-svg"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            {/* 3D Spherical Body Gradient: creamy yellow top -> toasted orange-brown bottom */}
            <radialGradient id={ids.bodyGrad} cx="46%" cy="32%" r="65%" fx="42%" fy="26%">
              <stop offset="0%" stopColor="#FFF0BA" />
              <stop offset="28%" stopColor="#F8C882" />
              <stop offset="68%" stopColor="#DE734B" />
              <stop offset="100%" stopColor="#9C3C22" />
            </radialGradient>

            {/* Warm Bounce Rim Light underneath sphere */}
            <radialGradient id={ids.faceRim} cx="50%" cy="92%" r="55%">
              <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
            </radialGradient>

            {/* 3-Pointed Soft Flame Crown Gradients */}
            <linearGradient id={ids.flameGrad} x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#FFF9DB" />
              <stop offset="35%" stopColor="#FFE08A" />
              <stop offset="75%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>

            <radialGradient id={ids.flameCoreGrad} cx="50%" cy="62%" r="52%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#FEF08A" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>

            {/* Skill 2 Ultimate Golden-Cyan Plasma Crown Gradient */}
            <linearGradient id={ids.flameUltGrad} x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#F0FDFA" />
              <stop offset="32%" stopColor="#22D3EE" />
              <stop offset="70%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>

            {/* Sage Green Headband Gradient */}
            <linearGradient id={ids.bandGrad} x1="0" y1="0" x2="1" y2="0.3">
              <stop offset="0%" stopColor="#61967D" />
              <stop offset="45%" stopColor="#86BA9F" />
              <stop offset="78%" stopColor="#6D9F87" />
              <stop offset="100%" stopColor="#4B7B65" />
            </linearGradient>

            {/* Metallic Gold Torch Pedestal Gradient */}
            <linearGradient id={ids.goldGrad} x1="0.1" y1="0" x2="0.9" y2="1">
              <stop offset="0%" stopColor="#FFF0BE" />
              <stop offset="32%" stopColor="#F2C86E" />
              <stop offset="68%" stopColor="#C89134" />
              <stop offset="100%" stopColor="#7C5313" />
            </linearGradient>

            {/* Real SVG Lighting Filter (feGaussianBlur + feSpecularLighting) for Metallic Pedestal */}
            <filter id={ids.cupSpec} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.4" result="blur" />
              <feSpecularLighting
                in="blur"
                surfaceScale="3.5"
                specularConstant="0.85"
                specularExponent="26"
                lightingColor="#FFF6D8"
                result="specOut"
              >
                <fePointLight x="46" y="102" z="38" />
              </feSpecularLighting>
              <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specClip" />
              <feMerge>
                <feMergeNode in="SourceGraphic" />
                <feMergeNode in="specClip" />
              </feMerge>
            </filter>

            <filter id={ids.auraFilter} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" />
            </filter>

            <filter id={ids.neonGlow} x="-35%" y="-35%" width="170%" height="170%">
              <feGaussianBlur stdDeviation="2.5" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <clipPath id={ids.eyeClip}>
              <ellipse cx="0" cy="0" rx="6.5" ry="7.8" />
            </clipPath>
          </defs>

          {/* Ground Contact Shadow under Floating Pedestal Base */}
          <motion.ellipse
            cx="60"
            cy="149"
            rx="27"
            ry="5.5"
            fill="rgba(20, 29, 41, 0.24)"
            filter={`url(#${ids.auraFilter})`}
            animate={
              prefersReduced
                ? undefined
                : {
                    scaleX: [1, 0.84, 1],
                    opacity: [0.3, 0.16, 0.3],
                    transition: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' }
                  }
            }
          />

          {/* Hover Energy Ripple */}
          <g transform="translate(60, 72)">
            <AnimatePresence>
              {isHovered && !prefersReduced && (
                <motion.circle
                  key="hover-ripple"
                  cx="0"
                  cy="0"
                  r="46"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                  filter={`url(#${ids.auraFilter})`}
                  initial={{ scale: 0.88, opacity: 0.55 }}
                  animate={{ scale: 1.56, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.35, repeat: Infinity, ease: 'easeOut' }}
                  style={{ transformOrigin: '0px 0px' }}
                />
              )}
            </AnimatePresence>
          </g>

          {/* Skill 1 Shockwave Ring + Burst Particles */}
          <g transform="translate(60, 76)">
            <AnimatePresence>
              {isBuff && !prefersReduced && (
                <g key="buff-vfx">
                  <motion.circle
                    cx="0"
                    cy="0"
                    r="36"
                    fill="none"
                    stroke="#4ADE80"
                    strokeWidth="3.2"
                    filter={`url(#${ids.neonGlow})`}
                    initial={{ scale: 0.55, opacity: 0.95 }}
                    animate={{ scale: 2.05, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.72, ease: 'easeOut' }}
                    style={{ transformOrigin: '0px 0px' }}
                  />
                  <motion.circle
                    cx="0"
                    cy="0"
                    r="32"
                    fill="none"
                    stroke="#FACC15"
                    strokeWidth="2.2"
                    initial={{ scale: 0.5, opacity: 0.9 }}
                    animate={{ scale: 1.75, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.58, delay: 0.08, ease: 'easeOut' }}
                    style={{ transformOrigin: '0px 0px' }}
                  />
                  {BUFF_BURST_STARS.map((star) => {
                    const rad = (star.angle * Math.PI) / 180;
                    const tx = Math.cos(rad) * star.dist;
                    const ty = Math.sin(rad) * star.dist;
                    return (
                      <motion.path
                        key={star.id}
                        d="M0 -5 L1.8 -1.8 L5 0 L1.8 1.8 L0 5 L-1.8 1.8 L-5 0 L-1.8 -1.8 Z"
                        fill={star.color}
                        initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
                        animate={{ x: tx, y: ty, scale: [0.6, 1.35, 0], opacity: [1, 1, 0], rotate: 120 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.75, ease: 'easeOut' }}
                        style={{ transformOrigin: '0px 0px' }}
                      />
                    );
                  })}
                </g>
              )}
            </AnimatePresence>
          </g>

          {/* Idle Floating Ember Spirit Particles (10 golden-amber & mint orbs rising cleanly) */}
          {!prefersReduced && (
            <g>
              {IDLE_EMBERS.map((e) => (
                <motion.circle
                  key={e.id}
                  cx={e.startX}
                  cy={e.startY}
                  r={e.r}
                  fill={isUltimate ? '#22D3EE' : e.color}
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
                  animate={{
                    opacity: [0, isExcited ? 0.95 : 0.72, 0],
                    x: [0, e.driftX, e.driftX * 0.4],
                    y: [0, (e.endY - e.startY) * 0.55, e.endY - e.startY],
                    scale: [0.5, isExcited ? 1.25 : 1.0, 0.3]
                  }}
                  transition={{
                    duration: isHovered || isUltimate ? e.dur * 0.72 : e.dur,
                    delay: e.delay,
                    repeat: Infinity,
                    ease: 'easeOut'
                  }}
                />
              ))}
            </g>
          )}

          {/* Golden Torch Pedestal Base with Floating Gap & Orbiting Ultimate Runes */}
          <motion.g
            animate={
              prefersReduced
                ? undefined
                : {
                    y: [0, -3.5, 0],
                    transition: { duration: 3.4, delay: 0.2, repeat: Infinity, ease: 'easeInOut' }
                  }
            }
          >
            {/* Orbiting Runes & Cyan-Gold Sparks around Pedestal during Skill 2 Ultimate */}
            <g transform="translate(60, 124)">
              <AnimatePresence>
                {isUltimate && !prefersReduced && (
                  <motion.g
                    key="ult-runes"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1, rotate: 360 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{
                      rotate: { duration: 1.15, repeat: Infinity, ease: 'linear' },
                      opacity: { duration: 0.25 },
                      scale: { duration: 0.3 }
                    }}
                    style={{ transformOrigin: '0px 0px' }}
                  >
                    <ellipse
                      cx="0"
                      cy="0"
                      rx="46"
                      ry="13"
                      fill="none"
                      stroke="#22D3EE"
                      strokeWidth="1.8"
                      strokeDasharray="6 4"
                      filter={`url(#${ids.neonGlow})`}
                    />
                    {ULTIMATE_RUNES.map((rune) => {
                      const rad = (rune.angle * Math.PI) / 180;
                      const rx = Math.cos(rad) * 46;
                      const ry = Math.sin(rad) * 13;
                      return (
                        <text
                          key={rune.id}
                          x={rx}
                          y={ry + 3}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="bold"
                          fill={rune.color}
                        >
                          {rune.symbol}
                        </text>
                      );
                    })}
                  </motion.g>
                )}
              </AnimatePresence>
            </g>

            {/* Tapered Gold Cup Body */}
            <g filter={`url(#${ids.cupSpec})`}>
              <path
                d="M36 118.5 H84 L75.6 135.8 A5.2 5.2 0 0 1 70.8 139 H49.2 A5.2 5.2 0 0 1 44.4 135.8 Z"
                fill={`url(#${ids.goldGrad})`}
              />
              {/* Rounded Golden Brim Lip */}
              <rect x="32.5" y="114.2" width="55" height="7.4" rx="3.7" fill={`url(#${ids.goldGrad})`} />
              {/* Recessed Warm Cup Interior Pool reflecting levitating body glow */}
              <ellipse
                cx="60"
                cy="115.6"
                rx="22"
                ry="2.2"
                fill={isUltimate ? '#22D3EE' : '#FDE047'}
                opacity={isExcited ? 0.72 : 0.45}
              />
              {/* Decorative Engraved Center Bronze Groove */}
              <path
                d="M49 128.5 H71"
                stroke="#855814"
                strokeWidth="2.1"
                strokeLinecap="round"
                opacity="0.58"
              />
            </g>
          </motion.g>

          {/* Levitating Character Body Group (with Breathing & Gap above Pedestal) */}
          <motion.g
            animate={
              prefersReduced
                ? undefined
                : {
                    y: [0, -7, 0],
                    transition: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' }
                  }
            }
          >
            {/* 1. Living 3-Pointed Soft Flame Crown Hair (Behind Headband) */}
            <g transform="translate(60, 56)">
              <motion.g
                style={
                  prefersReduced
                    ? { transformOrigin: '0px 0px' }
                    : { x: flameLagX, rotate: flameLagRotate, transformOrigin: '0px 0px' }
                }
              >
                {/* Left Flame Point */}
                <g transform="translate(-18, -4)">
                  <motion.path
                    d="M0 2 C-9 -8 -13 -21 -7 -32 C-5 -23 0 -19 5 -16 Z"
                    fill={isUltimate ? `url(#${ids.flameUltGrad})` : `url(#${ids.flameGrad})`}
                    animate={
                      prefersReduced
                        ? undefined
                        : {
                            rotate: [-3, 5, -2, -3],
                            scaleY: isHovered || isUltimate ? [1, 1.14, 0.98, 1] : [1, 1.06, 0.98, 1],
                            transition: {
                              duration: isHovered || isUltimate ? 1.0 : 1.75,
                              repeat: Infinity,
                              ease: 'easeInOut'
                            }
                          }
                    }
                    style={{ transformOrigin: '0px 0px' }}
                  />
                </g>

                {/* Right Flame Point */}
                <g transform="translate(18, -4)">
                  <motion.path
                    d="M0 2 C9 -9 12 -22 6 -31 C4 -23 -1 -19 -6 -15 Z"
                    fill={isUltimate ? `url(#${ids.flameUltGrad})` : `url(#${ids.flameGrad})`}
                    animate={
                      prefersReduced
                        ? undefined
                        : {
                            rotate: [3, -5, 2, 3],
                            scaleY: isHovered || isUltimate ? [1, 1.16, 0.96, 1] : [1, 1.07, 0.97, 1],
                            transition: {
                              duration: isHovered || isUltimate ? 0.95 : 1.9,
                              delay: 0.25,
                              repeat: Infinity,
                              ease: 'easeInOut'
                            }
                          }
                    }
                    style={{ transformOrigin: '0px 0px' }}
                  />
                </g>

                {/* Tall Central Living Flame Peak */}
                <motion.path
                  d="M-24 2 C-26 -16 -14 -35 0 -54 C12 -36 24 -19 24 2 Z"
                  fill={isUltimate ? `url(#${ids.flameUltGrad})` : `url(#${ids.flameGrad})`}
                  animate={
                    prefersReduced
                      ? undefined
                      : {
                          scaleY: isHovered || isUltimate ? [1, 1.14, 0.97, 1.08, 1] : [1, 1.06, 0.98, 1.03, 1],
                          skewX: [-2, 3, -1.5, 2, -2],
                          transition: {
                            duration: isHovered || isUltimate ? 0.85 : 1.55,
                            repeat: Infinity,
                            ease: 'easeInOut'
                          }
                        }
                  }
                  style={{ transformOrigin: '0px 0px' }}
                />

                {/* Luminous Inner Flame Core Highlight */}
                <ellipse
                  cx="0"
                  cy="-14"
                  rx="14"
                  ry="16"
                  fill={`url(#${ids.flameCoreGrad})`}
                  opacity={isHovered || isUltimate ? 0.95 : 0.72}
                />
              </motion.g>
            </g>

            {/* 2. Spherical Warm Face & Body (Creamy Top -> Toasted Orange-Brown Bottom) */}
            <g>
              <ellipse cx="60" cy="79" rx="30.5" ry="29.5" fill={`url(#${ids.bodyGrad})`} />
              <ellipse cx="60" cy="79" rx="30.5" ry="29.5" fill={`url(#${ids.faceRim})`} />
              {/* Soft Top-Left Spherical Highlight */}
              <ellipse
                cx="47"
                cy="66"
                rx="11"
                ry="6"
                transform="rotate(-24 47 66)"
                fill="#FFFFFF"
                opacity="0.16"
              />
            </g>

            {/* 3. Sage Green Headband + Gold Center Stud + Secondary-Lag Ribbon Tails */}
            <g filter={isBuff ? `url(#${ids.neonGlow})` : undefined}>
              {/* Fluttering Side Ribbons Glued to Right Edge of Headband */}
              <g transform="translate(88.5, 59)">
                <motion.g
                  style={
                    prefersReduced
                      ? { transformOrigin: '0px 0px' }
                      : { y: ribbonLagY, rotate: ribbonLagRotate, transformOrigin: '0px 0px' }
                  }
                >
                  <motion.path
                    d="M-0.5 -2.5 C7.5 -5 14.5 -4 20.5 1 C13.5 2.5 6.5 1 -0.5 0.5 Z"
                    fill={isBuff ? '#4ADE80' : '#81B29A'}
                    animate={
                      prefersReduced
                        ? undefined
                        : {
                            rotate: [-4, 6, -4],
                            transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
                          }
                    }
                    style={{ transformOrigin: '0px 0px' }}
                  />
                  <motion.path
                    d="M-0.5 0.5 C6.5 3 12.5 7.5 15.5 14 C9.5 11.5 4 8 -1 3 Z"
                    fill={isBuff ? '#22C55E' : '#5E9279'}
                    animate={
                      prefersReduced
                        ? undefined
                        : {
                            rotate: [5, -6, 5],
                            transition: { duration: 1.85, delay: 0.15, repeat: Infinity, ease: 'easeInOut' }
                          }
                    }
                    style={{ transformOrigin: '0px 1px' }}
                  />
                </motion.g>
              </g>

              {/* Main Horizontal Curved Headband Strap */}
              <path
                d="M29.4 56.2 Q60 47.4 90.6 56.2 L90.8 64.2 Q60 55.8 29.2 64.2 Z"
                fill={isBuff ? '#4ADE80' : `url(#${ids.bandGrad})`}
              />
              {/* Top Bevel Edge Highlight */}
              <path
                d="M30.5 56.2 Q60 47.8 89.5 56.2"
                stroke={isBuff ? '#BBF7D0' : '#BCE3CE'}
                strokeWidth="1.4"
                fill="none"
                strokeLinecap="round"
              />
              {/* Golden Center Stud / Emblem */}
              <circle
                cx="60"
                cy="55.6"
                r="3.4"
                fill={isBuff || isUltimate ? '#FACC15' : `url(#${ids.goldGrad})`}
                stroke="#8A5E17"
                strokeWidth="0.6"
              />
              <circle cx="59" cy="54.5" r="1.0" fill="#FFFBEB" />
            </g>

            {/* 4. Facial Features: Cursor-Tracking Glossy Eyes, Starry Highlights, Cheeks & Smile */}
            <g>
              {/* Rosy Pink Cheeks */}
              <ellipse cx="38.5" cy="88.5" rx="5.2" ry="3.1" fill="#FF8F7A" opacity="0.78" />
              <ellipse cx="81.5" cy="88.5" rx="5.2" ry="3.1" fill="#FF8F7A" opacity="0.78" />

              {/* Left Eye & Right Eye (Centered Local Pivot so Blinking Never Drops Eyeballs) */}
              {[49, 71].map((eyeCx, idx) => (
                <g key={eyeCx} transform={`translate(${eyeCx}, 75.5)`}>
                  {isBlinking ? (
                    /* Cute closed happy eyelid arc cleanly centered in eye socket */
                    <path
                      d="M-5.4 0.5 Q0 -3.4 5.4 0.5"
                      stroke="#182235"
                      strokeWidth="2.4"
                      fill="none"
                      strokeLinecap="round"
                    />
                  ) : (
                    <motion.g
                      animate={{
                        scaleY: isExcited ? 1.07 : 1,
                        scaleX: isExcited ? 1.05 : 1
                      }}
                      transition={{ duration: 0.18 }}
                      style={{ transformOrigin: '0px 0px' }}
                    >
                      <ellipse cx="0" cy="0" rx="6.5" ry="7.8" fill="#FFFFFF" />
                      <ellipse
                        cx="0"
                        cy="0"
                        rx="6.5"
                        ry="7.8"
                        fill="none"
                        stroke="rgba(122, 52, 26, 0.28)"
                        strokeWidth="0.8"
                      />

                      {/* Pupil + Specular Highlights Clipped Safely Inside Eye Socket */}
                      <g clipPath={`url(#${ids.eyeClip})`}>
                        <motion.g
                          style={prefersReduced ? undefined : { x: pupilX, y: pupilY }}
                        >
                          <circle
                            cx={idx === 0 ? 0.4 : -0.4}
                            cy="0.7"
                            r={isExcited ? 4.6 : 4.2}
                            fill={isUltimate ? '#0E7490' : '#182235'}
                          />
                          {isUltimate && (
                            <circle cx={idx === 0 ? 0.4 : -0.4} cy="0.7" r="2.1" fill="#67E8F9" />
                          )}
                          <circle cx="1.8" cy="-1.4" r="1.55" fill="#FFFFFF" />
                          <circle cx="-1.3" cy="2.6" r="0.75" fill="#FFFFFF" opacity="0.85" />

                          {isExcited && (
                            <path
                              d="M1.6 -3.6 L2.2 -1.9 L3.9 -1.3 L2.2 -0.7 L1.6 1.0 L1.0 -0.7 L-0.7 -1.3 L1.0 -1.9 Z"
                              fill="#FEF08A"
                            />
                          )}
                        </motion.g>
                      </g>
                    </motion.g>
                  )}
                </g>
              ))}

              {/* Cheerful Curved Smile (opens happily during Skill Buff / Ultimate) */}
              {isBuff || isUltimate ? (
                <path
                  d="M53.5 88.2 Q60 96.5 66.5 88.2 Z"
                  fill="#182235"
                  stroke="#182235"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              ) : (
                <path
                  d="M53.5 88.8 Q60 95.8 66.5 88.8"
                  stroke="#182235"
                  strokeWidth="2.8"
                  fill="none"
                  strokeLinecap="round"
                />
              )}
            </g>
          </motion.g>
        </svg>
      </motion.div>
      </div>
    </div>
  );
}

export default TiaInteractiveMascot;
