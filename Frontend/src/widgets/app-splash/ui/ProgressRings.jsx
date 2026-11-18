import React from 'react';

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
