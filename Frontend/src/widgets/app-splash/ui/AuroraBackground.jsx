import React from 'react';
import { EmberParticles } from './EmberParticles.jsx';

/** Cream base, three drifting aurora blobs, the breathing sage glow, grain and (unless calm) embers. */
export function AuroraBackground({ calm }) {
  return (
    <div className="osa-splash__bg" aria-hidden="true">
      <div className="osa-splash__blob osa-splash__blob--a" />
      <div className="osa-splash__blob osa-splash__blob--b" />
      <div className="osa-splash__blob osa-splash__blob--c" />
      <div className="osa-splash__glow" />
      {!calm && <EmberParticles />}
      <div className="osa-splash__grain" />
    </div>
  );
}
