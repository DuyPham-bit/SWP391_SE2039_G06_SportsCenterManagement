// Role badge styles
export const ROLE_BADGES = {
  COACH: {
    labelVi: 'HLV',
    labelEn: 'Coach',
    badge: 'bg-brand-sage-50 text-brand-sage-700 border-brand-sage-200 dark:bg-brand-sage-950/40 dark:text-brand-sage-300 dark:border-brand-sage-800'
  },
  RECEPTIONIST: {
    labelVi: 'Lễ tân',
    labelEn: 'Receptionist',
    badge: 'bg-brand-teal-50 text-brand-teal-700 border-brand-teal-200 dark:bg-brand-teal-950/40 dark:text-brand-teal-300 dark:border-brand-teal-800'
  },
  MANAGER: {
    labelVi: 'Quản lý',
    labelEn: 'Manager',
    badge: 'bg-brand-navy-50 text-brand-navy-800 border-brand-navy-200 dark:bg-brand-navy-950/40 dark:text-brand-navy-300 dark:border-brand-navy-800'
  },
  ADMIN: {
    labelVi: 'Quản trị viên',
    labelEn: 'Admin',
    badge: 'bg-brand-danger-50 text-brand-danger-700 border-brand-danger-200 dark:bg-brand-danger-950/40 dark:text-brand-danger-300 dark:border-brand-danger-800'
  }
};

// Avatar Initials
export const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const getAvatarGradient = (name = '') => {
  const gradients = [
    'from-brand-sage-500 to-brand-teal-700',
    'from-brand-teal-500 to-brand-navy-800',
    'from-brand-sand-500 to-brand-terra-700',
    'from-brand-navy-700 to-brand-navy-800',
    'from-brand-danger-500 to-brand-danger-700',
    'from-brand-teal-500 to-brand-teal-700'
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return gradients[sum % gradients.length];
};
