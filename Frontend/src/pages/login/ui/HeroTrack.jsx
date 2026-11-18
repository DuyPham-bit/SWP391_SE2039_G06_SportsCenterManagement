import React from 'react';

/**
 * Left-panel hero visual: a four-lane athletics track seen from the stands (CSS 3D tilt), dual
 * gold/teal comets running opposite ways, and a stadium floodlight dome framing SportMorphBall.jsx.
 * Pure CSS (no WebGL); follows the pointer through the --px/--py variables set on .auth-root.
 */
export function HeroTrack() {
  return (
    <div className="lp-track" aria-hidden="true">
      <div className="lp-track-dome" />
      <div className="lp-track-plane">
        <span className="lp-track-lane" style={{ '--lane': 0 }} />
        <span className="lp-track-lane" style={{ '--lane': 1 }} />
        <span className="lp-track-lane" style={{ '--lane': 2 }} />
        <span className="lp-track-lane" style={{ '--lane': 3 }} />
        <span className="lp-track-infield" />
        <span className="lp-track-comet lp-track-comet--gold"><i /></span>
        <span className="lp-track-comet lp-track-comet--teal"><i /></span>
      </div>
    </div>
  );
}

export default HeroTrack;
