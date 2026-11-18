import React from 'react';

const BURST_SPARKS = Array.from({ length: 16 }, (_, i) => ({
  angle: `${(i * 360 / 16).toFixed(1)}deg`,
  reach: (i % 4 === 0 ? 1.24 : i % 2 === 0 ? 1.04 : 0.84).toFixed(2),
}));

/**
 * Two counter-rotating comet rings (gold out, green in) plus the real progress hairline.
 * `progressRef` points at the bar circle; the splash writes stroke-dashoffset to it every frame.
 */
export function ProgressRings({ progressRef }) {
  return (
    <div className="osa-splash__rings">
      <span className="osa-splash__track osa-splash__track--outer" />
      <span className="osa-splash__track osa-splash__track--inner" />
      <LaneRing />
      <span className="osa-splash__orbit osa-splash__orbit--outer">
        <span className="osa-splash__comet" />
        <span className="osa-splash__head" />
      </span>
      <span className="osa-splash__orbit osa-splash__orbit--inner">
        <span className="osa-splash__comet" />
        <span className="osa-splash__head" />
      </span>
      <svg className="osa-splash__progress" viewBox="0 0 100 100" focusable="false">
        <circle className="osa-splash__progress-track" cx="50" cy="50" r="49" />
        <circle ref={progressRef} className="osa-splash__progress-bar" cx="50" cy="50" r="49" pathLength="1" />
      </svg>
      <span className="osa-splash__pulse" />
    </div>
  );
}

/**
 * Full-bleed exit burst rendered independently of .osa-splash__rings scale so the shockwave rings
 * and radial sparks stay calibrated to viewport vmax coordinates as the reveal portal opens.
 */
export function PortalBurst() {
  return (
    <div className="osa-splash__burst" aria-hidden="true">
      <span className="osa-splash__flare" />
      <span className="osa-splash__portal-ring" />
      <span className="osa-splash__portal-ring osa-splash__portal-ring--teal" />
      <span className="osa-splash__portal-ring osa-splash__portal-ring--gold" />
      <span className="osa-splash__sparks">
        {BURST_SPARKS.map((s, i) => (
          <i key={i} style={{ '--a': s.angle, '--r': s.reach }} />
        ))}
      </span>
    </div>
  );
}

/**
 * Teal track ring tilted in 3D. Render the back copy under the logo (inside ProgressRings) and the
 * `front` copy after the logo: CSS keeps only its near half, so the comet orbits through the logo.
 */
export function LaneRing({ front = false }) {
  return (
    <span className={`osa-splash__lane osa-splash__lane--${front ? 'front' : 'back'}`}>
      <span className="osa-splash__orbit osa-splash__orbit--lane">
        <span className="osa-splash__comet" />
        <span className="osa-splash__head" />
      </span>
    </span>
  );
}
