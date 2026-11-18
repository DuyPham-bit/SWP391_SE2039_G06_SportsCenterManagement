import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../../shared/i18n/index.js';
import { useToast } from '../../../shared/ui/toast/index.js';
import {
  fetchAdminHomeContent, loadHomeContentDraft, missingLanguages, openLandingPreview, publishHomeContent,
  saveHomeContentSection
} from '../../../entities/landing-content/index.js';
import { cloneContent, saveDraft, clearDraft, readLocalDraft, flushDraft, setDraftVersion, onDraftConflict } from './draft.js';

/** Editor tab → document section it edits. */
export const TAB_SECTIONS = {
  hero: 'heroBanner', whyUs: 'whyUs', sports: 'coursesSection', facilities: 'facilitiesSection',
  zones: 'zonesLayout', footer: 'ctaAndFooter', authShowcase: 'authShowcase'
};
const TAB_STORAGE_KEY = 'SCMS_MANAGER_ACTIVE_TAB';

function readInitialTab() {
  try {
    const hash = window.location.hash || '';
    const query = hash.includes('?') ? hash.split('?')[1] : '';
    const fromQuery = new URLSearchParams(query).get('tab');
    if (fromQuery && TAB_SECTIONS[fromQuery]) return fromQuery;
    const fromSession = sessionStorage.getItem(TAB_STORAGE_KEY);
    if (fromSession && TAB_SECTIONS[fromSession]) return fromSession;
  } catch { /* storage or URL unavailable */ }
  return 'hero';
}

const sameJson = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export function useHomeContentEditor() {
  const { language, t } = useLanguage();
  const isEn = language === 'en';
  const { showToast: addToast } = useToast();
  const [activeTab, setActiveTab] = useState(readInitialTab);
  const [content, setContent] = useState(null);
  const [savedContent, setSavedContent] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [discardKey, setDiscardKey] = useState(0);
  // { state: 'idle' | 'saving' | 'saved' | 'error', at?: Date, message?: string }
  const [saveStatus, setSaveStatus] = useState({ state: 'idle' });
  // Content language being edited, per tab (UI language is separate).
  const [editLangs, setEditLangs] = useState({});
  const latestContentRef = useRef(null);
  const [mediaPickerConfig, setMediaPickerConfig] = useState({ isOpen: false, title: '', currentUrl: '', callback: null });

  useEffect(() => { latestContentRef.current = content; }, [content]);

  const errorText = error => (error?.i18nKey ? t(error.i18nKey) : (error?.message || t('homeContent.status.saveFailed')));

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError('');
    Promise.all([
      fetchAdminHomeContent({ signal: controller.signal }),
      // The draft lives in the DB; a failed lookup only means "no draft to restore".
      loadHomeContentDraft({ signal: controller.signal }).catch(() => null)
    ]).then(([published, serverDraft]) => {
      if (!active) return;
      if (!published?.content) {
        setLoadError(t('homeContent.error.empty'));
        return;
      }
      setStats(published.stats ?? null);
      setDraftVersion(serverDraft?.updatedAt);
      setSavedContent(cloneContent(published.content));
      // Prefer the server draft; a local copy only exists if a previous autosave could not reach the server.
      const localDraft = readLocalDraft();
      const draft = serverDraft?.content && !sameJson(serverDraft.content, published.content) ? serverDraft.content
        : localDraft && !sameJson(localDraft, published.content) ? localDraft
        : null;
      setContent(cloneContent(draft || published.content));
      setSaveStatus({ state: 'idle' });
      if (draft) {
        if (draft === localDraft) saveDraft(localDraft); // push the offline copy to the server
        addToast(t('homeContent.toast.draftRestored'), 'info');
      }
    }).catch(error => {
      if (active && error.name !== 'AbortError') setLoadError(error.message || t('homeContent.error.load'));
    }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [reloadKey]);

  // Save any pending autosave when the editor is left inside the app.
  useEffect(() => () => { void flushDraft(); }, []);

  // Shared draft edited elsewhere: keep this editor's copy locally and tell the user instead of overwriting.
  useEffect(() => {
    onDraftConflict(() => addToast(t('homeContent.toast.draftConflict'), 'warning'));
    return () => onDraftConflict(null);
  }, [language]);

  const dirtySections = useMemo(() => {
    if (!content || !savedContent) return new Set();
    return new Set(Object.values(TAB_SECTIONS).filter(section => !sameJson(content[section], savedContent[section])));
  }, [content, savedContent]);
  const isDirty = dirtySections.size > 0;
  const isSaving = saveStatus.state === 'saving';

  // Prevent accidental loss of edits when hitting F5.
  useEffect(() => {
    const handleBeforeUnload = event => {
      void flushDraft();
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleTabChange = tabId => {
    setActiveTab(tabId);
    try {
      sessionStorage.setItem(TAB_STORAGE_KEY, tabId);
      const [path, queryString] = (window.location.hash || '').split('?');
      const params = new URLSearchParams(queryString || '');
      params.set('tab', tabId);
      window.history.replaceState(null, '', `${path}?${params.toString()}`);
    } catch { /* storage or history unavailable */ }
  };

  const editLang = editLangs[activeTab] || 'vi';
  const setEditLang = lang => setEditLangs(previous => ({ ...previous, [activeTab]: lang }));
  const missingBySection = useMemo(() => Object.fromEntries(
    Object.entries(TAB_SECTIONS).map(([tab, section]) => [tab, missingLanguages(content?.[section])])
  ), [content]);

  const applyEdit = updater => {
    setContent(previous => {
      const updated = updater(previous);
      saveDraft(updated);
      return updated;
    });
    setSaveStatus(previous => (previous.state === 'error' ? previous : { state: 'idle' }));
  };

  const updateContentField = (section, key, value) =>
    applyEdit(previous => ({ ...previous, [section]: { ...(previous[section] || {}), [key]: value } }));

  const updateCatalogCards = (section, key, items) =>
    applyEdit(previous => ({ ...previous, [section]: { ...(previous[section] || {}), [key]: items, catalogSource: 'custom' } }));

  const deleteFacilityCard = (record, items, fallbackSports) => applyEdit(previous => {
    const section = previous.coursesSection;
    const sports = section.sportsList?.length || section.catalogSource === 'custom' ? section.sportsList : fallbackSports;
    const hasLinks = sports.some(sport => String(sport.facilityId) === String(record.id));
    return {
      ...previous,
      facilitiesSection: { ...previous.facilitiesSection, facilitiesList: items, catalogSource: 'custom' },
      coursesSection: hasLinks ? {
        ...section,
        sportsList: sports.map(sport => String(sport.facilityId) === String(record.id) ? { ...sport, facilityId: '' } : sport),
        catalogSource: 'custom'
      } : section
    };
  });

  const finishSave = (response, sections) => {
    const published = response.content;
    setStats(response.stats ?? null);
    setSavedContent(cloneContent(published));
    // Saving one section keeps unsaved edits in the others (the form is disabled while saving).
    const current = latestContentRef.current;
    const next = sections
      ? { ...current, ...Object.fromEntries(sections.map(section => [section, cloneContent(published[section])])) }
      : cloneContent(published);
    latestContentRef.current = next;
    setContent(next);
    return Object.values(TAB_SECTIONS).some(section => !sameJson(next[section], published[section])) ? next : null;
  };

  const runSave = async (save, sections) => {
    if (isSaving) return;
    setSaveStatus({ state: 'saving' });
    try {
      const response = await save();
      const remainingDraft = finishSave(response, sections);
      if (remainingDraft) saveDraft(remainingDraft); else clearDraft();
      setSaveStatus({ state: 'saved', at: new Date() });
      const missing = response.missingTranslations?.length || 0;
      addToast(missing ? t('homeContent.toast.savedMissingEn', { count: missing }) : t('homeContent.toast.saved'), missing ? 'warning' : 'success');
    } catch (error) {
      const message = errorText(error);
      setSaveStatus({ state: 'error', message });
      addToast(message, 'error');
    }
  };

  const handleSaveAll = () => runSave(() => publishHomeContent(latestContentRef.current));

  const handleSaveSection = () => {
    const section = TAB_SECTIONS[activeTab];
    return runSave(() => saveHomeContentSection(section, latestContentRef.current[section]), [section]);
  };

  const handleDiscardChanges = () => {
    if (isSaving || !isDirty || !savedContent) return;
    setContent(cloneContent(savedContent));
    clearDraft();
    setSaveStatus({ state: 'idle' });
    setDiscardKey(previous => previous + 1);
    setMediaPickerConfig(previous => ({ ...previous, isOpen: false, callback: null, onClose: undefined }));
    addToast(t('homeContent.toast.discarded'), 'info');
  };

  const handlePreview = () => {
    try {
      openLandingPreview(content, stats);
    } catch (error) {
      addToast(errorText(error), 'error');
    }
  };

  const openMediaPicker = (title, currentUrl, callback, onClose) =>
    setMediaPickerConfig({ isOpen: true, title, currentUrl, callback, onClose });

  return {
    activeTab, addToast, content, deleteFacilityCard, dirtySections, discardKey, editLang, handleDiscardChanges,
    handlePreview, handleSaveAll, handleSaveSection, handleTabChange, isDirty, isEn, isLoading, isSaving, loadError,
    mediaPickerConfig, missingBySection, openMediaPicker, saveStatus, setEditLang, setMediaPickerConfig,
    setReloadKey, stats, t, updateCatalogCards, updateContentField
  };
}
