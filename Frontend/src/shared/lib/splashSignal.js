import { useEffect, useSyncExternalStore } from 'react';

// One-way signal from the router to the launch splash: "the first screen has committed".
// It lives in shared/ so the router, the error boundary and the splash widget can all reach it.
let routeReady = false;
const listeners = new Set();

export function markSplashRouteReady() {
  if (routeReady) return;
  routeReady = true;
  listeners.forEach((listener) => listener());
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => routeReady;

export function useSplashRouteReady() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Render inside the route Suspense boundary: it only mounts once the lazy screen has resolved. */
export function SplashRouteReady() {
  useEffect(() => {
    markSplashRouteReady();
  }, []);
  return null;
}
