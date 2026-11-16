import { useEffect, useState } from 'react';
import {
  getLandingContent,
  getLandingPreviewContent,
  hasPublishedLandingContent,
  loadLandingContent,
  LANDING_CONTENT_CHANGE_EVENT,
  subscribeLandingContentRefresh
} from '../api/landingContentService.js';

export function useLandingContentState() {
  const [content, setContent] = useState(() => getLandingPreviewContent() || getLandingContent());
  const [loaded, setLoaded] = useState(() => Boolean(getLandingPreviewContent() || hasPublishedLandingContent()));

  useEffect(() => {
    if (getLandingPreviewContent()) {
      setLoaded(true);
      return undefined;
    }
    let active = true;
    let loading = false;
    const controller = new AbortController();
    const refresh = async (forceInitial = false) => {
      if (loading || (!forceInitial && document.visibilityState === 'hidden')) return;
      loading = true;
      try {
        const result = await loadLandingContent({ signal: controller.signal });
        if (active) {
          setContent(result.content);
          setLoaded(true);
        }
      } catch (error) {
        if (active && error.name !== 'AbortError') {
          setContent(previous => ({ ...previous, _loadError: error.message }));
          setLoaded(true);
        }
      } finally {
        loading = false;
      }
    };
    const onChange = event => {
      if (event.detail) {
        setContent(event.detail);
        setLoaded(true);
      }
    };
    window.addEventListener(LANDING_CONTENT_CHANGE_EVENT, onChange);
    const unsubscribe = subscribeLandingContentRefresh(() => refresh(false));
    const interval = window.setInterval(() => refresh(false), 15000);
    refresh(true);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener(LANDING_CONTENT_CHANGE_EVENT, onChange);
      unsubscribe();
    };
  }, []);

  return { content, loaded };
}

export function useLandingContent() {
  return useLandingContentState().content;
}
