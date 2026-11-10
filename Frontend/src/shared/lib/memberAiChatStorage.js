// Session-scoped storage keys for the member AI chat; cleared on logout by the session model.
export const getMemberAIChatStorageKey = (centerId, userId) =>
  `SCMS_MEMBER_AI_CHAT_${centerId ?? 'default'}_${userId ?? 'guest'}`;

export function clearMemberAIChatStorage() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && (k.startsWith('SCMS_MEMBER_AI_CHAT') || k.startsWith('SCMS_MEMBER_AI_CONV'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => sessionStorage.removeItem(k));
  } catch (e) {}
}
