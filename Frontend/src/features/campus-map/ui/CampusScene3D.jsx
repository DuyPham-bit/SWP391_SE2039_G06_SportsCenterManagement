import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { createCampusScene } from '../lib/campusScene.js';

/**
 * React shell around the imperative Three.js scene. Loaded lazily (own chunk with three.js),
 * created once per mount and fully disposed on unmount (view switch, route change).
 */
const CampusScene3D = forwardRef(function CampusScene3D(
  { campus, lighting, statusAt, labelSubs, selectedZoneId, floor, route, onHover, onSelect, onCameraChange, onContextLost, onReady, onProgress },
  ref
) {
  const containerRef = useRef(null);
  const labelsRef = useRef(null);
  const sceneRef = useRef(null);
  const callbacks = useRef({});
  callbacks.current = { onHover, onSelect, onCameraChange, onContextLost, onProgress };

  useEffect(() => {
    const scene = createCampusScene({
      container: containerRef.current,
      labelLayer: labelsRef.current,
      onHover: (hit) => callbacks.current.onHover?.(hit),
      onSelect: (hit) => callbacks.current.onSelect?.(hit),
      onCameraChange: (info) => callbacks.current.onCameraChange?.(info),
      onContextLost: () => callbacks.current.onContextLost?.(),
      onProgress: (pct) => callbacks.current.onProgress?.(pct)
    });
    sceneRef.current = scene;
    onReady?.();
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    sceneRef.current?.sync({ campus, lighting, statusAt, labelSubs, selectedZoneId, floor, route });
  }, [campus, lighting, statusAt, labelSubs, selectedZoneId, floor, route]);

  useImperativeHandle(ref, () => ({
    focusZone: (id) => sceneRef.current?.focusZone(id),
    resetView: (tour = false) => sceneRef.current?.resetView(tour),
    faceNorth: () => sceneRef.current?.faceNorth(),
    zoomBy: (f) => sceneRef.current?.zoomBy(f),
    rotateBy: (r) => sceneRef.current?.rotateBy(r)
  }), []);

  return (
    <>
      <div ref={containerRef} className="cm-canvas cm-view-fade" />
      <div ref={labelsRef} className="cm-labels" />
    </>
  );
});

export default CampusScene3D;
