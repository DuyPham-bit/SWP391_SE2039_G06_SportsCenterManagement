import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CAMPUS_MAP_CHANGE_EVENT, fetchCampusMap } from '../../../entities/campus-map/index.js';
import { buildCampus } from './campusModel.js';

const POLL_MS = 60_000;

/** Loads the campus map once, refreshes live status every minute while the tab is visible, and on admin edits. */
export function useCampusMap(lang, { centerId } = {}) {
  const [dto, setDto] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const controllerRef = useRef(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    if (!silent) { setLoading(true); setError(null); }
    try {
      const data = await fetchCampusMap({ centerId, signal: controller.signal });
      if (!controller.signal.aborted) { setDto(data); setError(null); }
    } catch (e) {
      if (controller.signal.aborted || e?.name === 'AbortError') return;
      if (!silent) setError(e);
    } finally {
      if (!controller.signal.aborted && !silent) setLoading(false);
    }
  }, [centerId]);

  useEffect(() => {
    load();
    const refresh = () => load({ silent: true });
    const timer = setInterval(() => { if (!document.hidden) refresh(); }, POLL_MS);
    const onVisible = () => { if (!document.hidden) refresh(); };
    window.addEventListener(CAMPUS_MAP_CHANGE_EVENT, refresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      window.removeEventListener(CAMPUS_MAP_CHANGE_EVENT, refresh);
      document.removeEventListener('visibilitychange', onVisible);
      controllerRef.current?.abort();
    };
  }, [load]);

  const campus = useMemo(() => (dto ? buildCampus(dto, lang) : null), [dto, lang]);
  return { campus, loading: loading && !dto, error: dto ? null : error, reload: load };
}
