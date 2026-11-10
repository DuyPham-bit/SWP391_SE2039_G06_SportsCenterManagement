// Color palette gradients for member initials
export const AVATAR_GRADIENTS = [
  'from-brand-sage-700 to-brand-sage-900',
  'from-brand-navy-900 to-brand-navy-800',
  'from-brand-teal-600 to-brand-sage-800',
  'from-brand-sand-600 to-brand-sand-700',
  'from-brand-navy-700 to-brand-navy-800',
  'from-brand-teal-600 to-brand-teal-700',
  'from-brand-danger-600 to-brand-danger-800'
];

export function getAvatarGradient(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}
