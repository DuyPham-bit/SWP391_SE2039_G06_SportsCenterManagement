export const cloneContent = content => JSON.parse(JSON.stringify(content));
export const MANAGER_DRAFT_KEY = 'SCMS_MANAGER_LANDING_DRAFT_V2';

export const saveDraft = (updatedContent) => {
  try {
    localStorage.setItem(MANAGER_DRAFT_KEY, JSON.stringify(updatedContent));
  } catch { /* storage quota or private browsing */ }
};

export const clearDraft = () => {
  try {
    localStorage.removeItem(MANAGER_DRAFT_KEY);
  } catch { /* storage disabled */ }
};
