import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../../../shared/i18n/index.js';
import {
  fetchHomeContent,
  getCachedHomeContent,
  getLandingPreviewContent,
  normalizeLanguage,
  subscribeLandingContentRefresh
} from '../api/homeContentService.js';

const REFRESH_INTERVAL_MS = 15000;

function initialState(lang) {
  const preview = getLandingPreviewContent(lang);
  if (preview) return { ...preview, loaded: true, error: '' };
  const cached = getCachedHomeContent(lang);
  return cached ? { content: cached.content, stats: cached.stats, loaded: true, error: '' } : { content: null, stats: null, loaded: false, error: '' };
}

/**
 * Published home content in the selected UI language. Switching language refetches (or reads the
 * per-language cache) without reloading the page. On failure `content` stays null and `error` is set.
 */
export function useLandingContentState() {
  const { language } = useLanguage();
  const lang = normalizeLanguage(language);
  const [state, setState] = useState(() => initialState(lang));
  const [reloadKey, setReloadKey] = useState(0);
  const retry = useCallback(() => setReloadKey(key => key + 1), []);

  useEffect(() => {
    const preview = getLandingPreviewContent(lang);
    if (preview) {
      setState({ ...preview, loaded: true, error: '' });
      return undefined;
    }
    setState(initialState(lang));
    let active = true;
    let loading = false;
    const controller = new AbortController();
    const refresh = async (force = false) => {
      if (loading || (!force && document.visibilityState === 'hidden')) return;
      loading = true;
      try {
        const result = await fetchHomeContent(lang, { signal: controller.signal });
        if (active) setState({ content: result.content, stats: result.stats, loaded: true, error: '' });
      } catch (error) {
        if (active && error.name !== 'AbortError') {
          // Keep content already shown for this language; only a first load ends with no content.
          setState(previous => ({ ...previous, loaded: true, error: error.message || 'error' }));
        }
      } finally {
        loading = false;
      }
    };
    const unsubscribe = subscribeLandingContentRefresh(() => refresh(false));
    const interval = window.setInterval(() => refresh(false), REFRESH_INTERVAL_MS);
    refresh(true);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(interval);
      unsubscribe();
    };
  }, [lang, reloadKey]);

  return { ...state, lang, retry };
}

export function useLandingContent() {
  return useLandingContentState().content;
}
