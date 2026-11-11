import { saveLandingDraft, discardLandingDraft } from '../../../entities/landing-content/index.js';

export const cloneContent = content => JSON.parse(JSON.stringify(content));
/** Local safety copy, only used while the server draft cannot be reached. */
export const MANAGER_DRAFT_KEY = 'SCMS_MANAGER_LANDING_DRAFT_V2';

const AUTOSAVE_DELAY_MS = 1200;
let timer = null;
let pending = null;

function keepLocalCopy(content) {
  try { localStorage.setItem(MANAGER_DRAFT_KEY, JSON.stringify(content)); } catch { /* storage disabled */ }
}

function dropLocalCopy() {
  try { localStorage.removeItem(MANAGER_DRAFT_KEY); } catch { /* storage disabled */ }
}

export function readLocalDraft() {
  try {
    const raw = localStorage.getItem(MANAGER_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Saves the draft to the DB now; on failure keeps a local copy so no edit is lost. */
export async function flushDraft() {
  if (timer) { clearTimeout(timer); timer = null; }
  if (!pending) return;
  const content = pending;
  pending = null;
  try {
    await saveLandingDraft(content);
    dropLocalCopy();
  } catch {
    keepLocalCopy(content);
  }
}

/** Debounced autosave of the editor draft to the DB. */
export const saveDraft = (updatedContent) => {
  pending = updatedContent;
  keepLocalCopy(updatedContent); // covers the debounce window and offline periods
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { void flushDraft(); }, AUTOSAVE_DELAY_MS);
};

/** Discards the draft everywhere (after publishing or an explicit "discard changes"). */
export const clearDraft = () => {
  if (timer) { clearTimeout(timer); timer = null; }
  pending = null;
  dropLocalCopy();
  void discardLandingDraft().catch(() => { /* publishing already removes it server-side */ });
};
