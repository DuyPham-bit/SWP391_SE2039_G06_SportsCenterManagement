/**
 * Home page content (landing + login showcase). The backend is the only source of content:
 * - public:  GET /home-content?lang=vi|en   → one language (falls back to vi) + DB-counted stats
 * - admin:   GET/PUT /admin/home-content     → both languages; text fields are { vi, en }
 * No default content lives here: when the API fails the caller shows an error, never stale copy.
 */
import { apiRequest } from '../../../shared/api/index.js';

export const CONTENT_LANGUAGES = ['vi', 'en'];
export const HOME_CONTENT_SECTIONS = ['heroBanner', 'whyUs', 'coursesSection', 'facilitiesSection', 'zonesLayout', 'ctaAndFooter', 'authShowcase'];
export const LANDING_CONTENT_CHANGE_EVENT = 'SCMS_LANDING_CONTENT_CHANGED';
const UPDATE_STORAGE_KEY = 'SCMS_LANDING_CONTENT_UPDATED';
const PREVIEW_STORAGE_KEY = 'SCMS_LANDING_PREVIEW_V2';

export const normalizeLanguage = lang => (lang === 'en' ? 'en' : 'vi');

function centerId() {
  const id = Number(import.meta.env?.VITE_SPORTS_CENTER_ID);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function withCenter(route, separator) {
  const id = centerId();
  return id ? `${route}${separator}centerId=${id}` : route;
}

// ---------- bilingual values ----------

export function isLocalized(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every(key => CONTENT_LANGUAGES.includes(key) && typeof value[key] === 'string');
}

/** Any stored text as { vi, en } (plain strings are Vietnamese). */
export const toLocalized = value => (isLocalized(value)
  ? { vi: value.vi ?? '', en: value.en ?? '' }
  : { vi: typeof value === 'string' ? value : '', en: '' });

export const readText = (value, lang) => toLocalized(value)[normalizeLanguage(lang)];
export const writeText = (value, lang, text) => ({ ...toLocalized(value), [normalizeLanguage(lang)]: text });

/** Same rule as the server: the requested language, else Vietnamese. */
export function localizeContent(node, lang) {
  if (isLocalized(node)) return (lang === 'en' && node.en?.trim()) ? node.en : (node.vi ?? '');
  if (Array.isArray(node)) return node.map(item => localizeContent(item, lang));
  if (node && typeof node === 'object') {
    return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, localizeContent(value, lang)]));
  }
  return node;
}

/** Fields whose Vietnamese and English differ in presence: { vi: true } = Vietnamese missing. */
export function missingLanguages(node) {
  const missing = { vi: false, en: false };
  const walk = value => {
    if (isLocalized(value)) {
      const vi = (value.vi ?? '').trim();
      const en = (value.en ?? '').trim();
      if (vi && !en) missing.en = true;
      if (en && !vi) missing.vi = true;
    } else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  walk(node);
  return missing;
}

/** Replaces {{sportCount}} / {{facilityCount}} with the visible counts from the database. */
export function fillCounts(node, stats) {
  const counts = { sportCount: stats?.sports?.visible, facilityCount: stats?.facilities?.visible };
  const fill = value => {
    if (typeof value === 'string') {
      return value.replace(/\{\{(sportCount|facilityCount)\}\}/g, (match, key) => (counts[key] ?? match));
    }
    if (Array.isArray(value)) return value.map(fill);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fill(v)]));
    return value;
  };
  return fill(node);
}

// ---------- public (landing / login) ----------

const publicCache = new Map();

export const getCachedHomeContent = lang => publicCache.get(normalizeLanguage(lang)) ?? null;

export async function fetchHomeContent(lang, { signal } = {}) {
  const language = normalizeLanguage(lang);
  const response = await apiRequest(withCenter(`home-content?lang=${language}`, '&'), { signal, session: null });
  const result = {
    content: response?.content ? fillCounts(response.content, response.stats) : null,
    stats: response?.stats ?? null,
    updatedAt: response?.updatedAt ?? null,
    lang: language
  };
  publicCache.set(language, result);
  return result;
}

// ---------- admin ----------

export const fetchAdminHomeContent = ({ signal } = {}) =>
  apiRequest(withCenter('admin/home-content', '?'), { signal });

export function getExternalContactUrl(value) {
  if (typeof value !== 'string') return '';
  const url = value.trim();
  if (!/^https?:\/\//i.test(url) || /[\u0000-\u001f\u007f\\]/.test(url)) return '';
  try {
    return new URL(url).hostname ? url : '';
  } catch { return ''; }
}

export function normalizeZaloPhone(value) {
  if (typeof value !== 'string') return '';
  const phone = value.replace(/[\s().-]/g, '');
  return /^(0\d{9}|\+84\d{9})$/.test(phone) ? phone.replace(/^\+84/, '0') : '';
}

/** Client-side contact checks; the error carries an i18n key the editor translates. */
function cleanFooter(footer) {
  if (!footer) return footer;
  const zaloValue = footer.contactZaloPhone ?? '';
  const zaloPhone = normalizeZaloPhone(zaloValue);
  if (typeof zaloValue !== 'string' || (zaloValue.trim() && !zaloPhone)) throw Object.assign(new Error('invalid zalo'), { i18nKey: 'homeContent.error.zalo' });
  const facebookValue = footer.contactFacebookUrl ?? '';
  const facebookUrl = getExternalContactUrl(facebookValue);
  if (typeof facebookValue !== 'string' || (facebookValue.trim() && !facebookUrl)) throw Object.assign(new Error('invalid facebook'), { i18nKey: 'homeContent.error.facebook' });
  return { ...footer, contactZaloPhone: zaloPhone, contactFacebookUrl: facebookUrl };
}

function notifyPublished() {
  publicCache.clear();
  window.dispatchEvent(new CustomEvent(LANDING_CONTENT_CHANGE_EVENT, { detail: null }));
  // Only a refresh signal for other tabs; a storage failure cannot undo a successful API save.
  try { localStorage.setItem(UPDATE_STORAGE_KEY, `${Date.now()}-${Math.random()}`); } catch { /* optional */ }
}

export async function publishHomeContent(content) {
  const body = { content: { ...content, ctaAndFooter: cleanFooter(content.ctaAndFooter) } };
  const response = await apiRequest(withCenter('admin/home-content', '?'), { method: 'PUT', body });
  notifyPublished();
  return response;
}

export async function saveHomeContentSection(section, sectionContent) {
  const content = section === 'ctaAndFooter' ? cleanFooter(sectionContent) : sectionContent;
  const response = await apiRequest(withCenter(`admin/home-content/${encodeURIComponent(section)}`, '?'), { method: 'PUT', body: { content } });
  notifyPublished();
  return response;
}

/** Shared editor draft (bilingual), autosaved; `expectedUpdatedAt` makes concurrent edits answer 409. */
export const loadHomeContentDraft = ({ signal } = {}) => apiRequest('admin/home-content/draft', { signal });

export function saveHomeContentDraft(content, expectedUpdatedAt = null) {
  const body = { content };
  if (expectedUpdatedAt) body.expectedUpdatedAt = expectedUpdatedAt;
  return apiRequest('admin/home-content/draft', { method: 'PUT', body });
}

export const discardHomeContentDraft = () => apiRequest('admin/home-content/draft', { method: 'DELETE' });

// ---------- preview & cross-tab refresh ----------

/** Preview of the unsaved bilingual draft, localized like the public API. */
export function getLandingPreviewContent(lang) {
  const query = (window.location.hash || '').split('?')[1] || '';
  if (new URLSearchParams(query).get('preview') !== '1') return null;
  try {
    const raw = sessionStorage.getItem(PREVIEW_STORAGE_KEY);
    if (!raw) return null;
    const { content, stats } = JSON.parse(raw);
    return { content: fillCounts(localizeContent(content, normalizeLanguage(lang)), stats), stats };
  } catch { return null; }
}

export function openLandingPreview(content, stats) {
  const previewWindow = window.open('about:blank', '_blank');
  if (!previewWindow) throw Object.assign(new Error('popup blocked'), { i18nKey: 'homeContent.error.popupBlocked' });
  try {
    previewWindow.opener = null;
    previewWindow.sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify({ content, stats }));
    previewWindow.location.replace(new URL('#/?preview=1', window.location.href).href);
  } catch (error) {
    previewWindow.close();
    throw error;
  }
}

export function subscribeLandingContentRefresh(refresh) {
  const onStorage = event => { if (event.key === UPDATE_STORAGE_KEY) { publicCache.clear(); refresh(); } };
  const onChange = () => refresh();
  window.addEventListener('storage', onStorage);
  window.addEventListener('focus', refresh);
  window.addEventListener(LANDING_CONTENT_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('focus', refresh);
    window.removeEventListener(LANDING_CONTENT_CHANGE_EVENT, onChange);
  };
}
