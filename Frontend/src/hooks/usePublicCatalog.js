import { useEffect, useState } from 'react';
import { getPublicCatalog } from '../services/publicCatalog.js';

export function usePublicCatalog() {
  const [state, setState] = useState({ catalog: null, loading: true, error: '' });
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const catalog = await getPublicCatalog({ signal: controller.signal });
        if (active) setState({ catalog, loading: false, error: '' });
      } catch (error) {
        if (active && error.name !== 'AbortError') setState({ catalog: null, loading: false, error: error.message });
      }
    };
    refresh();
    window.addEventListener('focus', refresh);
    return () => { active = false; controller.abort(); window.removeEventListener('focus', refresh); };
  }, []);
  return state;
}
