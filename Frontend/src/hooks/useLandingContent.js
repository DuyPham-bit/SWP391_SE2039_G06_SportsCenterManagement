import { useEffect, useState } from 'react';
import {
  getLandingContent,
  getLandingPreviewContent,
  loadLandingContent,
  LANDING_CONTENT_CHANGE_EVENT,
  subscribeLandingContentRefresh
} from '../services/landingContentService.js';

export function useLandingContent() {
  const [content, setContent] = useState(() => getLandingPreviewContent() || getLandingContent());
  useEffect(() => {
    if (getLandingPreviewContent()) return undefined;
    let active = true;
    let loading = false;
    const controller = new AbortController();
    const refresh = async () => {
      if (loading || document.visibilityState === 'hidden') return;
      loading = true;
      try {
        const result = await loadLandingContent({ signal: controller.signal });
        if (active) setContent(result.content);
      } catch { /* Keep the last published content/defaults and retry on focus or polling. */ }
      finally { loading = false; }
    };
    const onChange = event => { if (event.detail) setContent(event.detail); };
    window.addEventListener(LANDING_CONTENT_CHANGE_EVENT, onChange);
    const unsubscribe = subscribeLandingContentRefresh(refresh);
    const interval = window.setInterval(refresh, 15000);
    refresh();
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener(LANDING_CONTENT_CHANGE_EVENT, onChange);
      unsubscribe();
    };
  }, []);
  return content;
}
