import React from 'react';
import { CampusMapExplorer } from '../../../features/campus-map/index.js';

/** Full-viewport campus map served at /3d-campus.html (same module and data as the landing section). */
export function CampusMapPage() {
  return <CampusMapExplorer page />;
}
