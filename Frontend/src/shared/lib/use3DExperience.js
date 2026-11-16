import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'SCMS_3D_EXPERIENCE_MODE';
const EVENT_NAME = 'scms-3d-toggle';

export function getInitial3DMode() {
  if (typeof window === 'undefined') return true;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved !== null ? saved === 'true' : true; // Default to true for rich 3D showcase
  } catch {
    return true;
  }
}

export function use3DExperience() {
  const [is3DMode, setIs3DMode] = useState(getInitial3DMode);

  useEffect(() => {
    const updateBodyClass = (active) => {
      if (typeof document !== 'undefined') {
        if (active) {
          document.documentElement.classList.add('scms-3d-active');
          document.body.classList.add('scms-3d-active');
        } else {
          document.documentElement.classList.remove('scms-3d-active');
          document.body.classList.remove('scms-3d-active');
        }
      }
    };

    updateBodyClass(is3DMode);

    const handleExternalToggle = (e) => {
      if (typeof e.detail?.is3DMode === 'boolean' && e.detail.is3DMode !== is3DMode) {
        setIs3DMode(e.detail.is3DMode);
      }
    };

    window.addEventListener(EVENT_NAME, handleExternalToggle);
    return () => window.removeEventListener(EVENT_NAME, handleExternalToggle);
  }, [is3DMode]);

  const toggle3DMode = useCallback((forced) => {
    setIs3DMode((prev) => {
      const next = typeof forced === 'boolean' ? forced : !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Local storage might be blocked
      }
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { is3DMode: next } }));
      return next;
    });
  }, []);

  return { is3DMode, toggle3DMode };
}
