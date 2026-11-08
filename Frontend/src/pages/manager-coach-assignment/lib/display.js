// Visual Sport Theme Mapping
export const SPORT_THEMES = {
  SWIMMING: {
    match: ['bơi', 'swim', 'hồ bơi', 'bể bơi'],
    icon: 'pool',
    badgeClass: 'bg-brand-teal-50 dark:bg-brand-teal-950/40 text-brand-teal-700 dark:text-brand-teal-300 border-brand-teal-200 dark:border-brand-teal-800',
    barGrad: 'from-brand-teal-500 to-brand-teal-600',
    accentColor: '#24828F'
  },
  BOXING: {
    match: ['boxing', 'võ', 'kickfit', 'mma', 'quyền anh', 'muay'],
    icon: 'sports_mma',
    badgeClass: 'bg-brand-danger-50 dark:bg-brand-danger-950/40 text-brand-danger-700 dark:text-brand-danger-300 border-brand-danger-200 dark:border-brand-danger-800',
    barGrad: 'from-brand-danger-500 to-brand-danger-600',
    accentColor: '#CD493A'
  },
  BADMINTON: {
    match: ['cầu lông', 'badminton', 'tennis', 'vợt', 'pickleball'],
    icon: 'sports_tennis',
    badgeClass: 'bg-brand-sand-50 dark:bg-brand-sand-950/40 text-brand-sand-700 dark:text-brand-sand-300 border-brand-sand-200 dark:border-brand-sand-800',
    barGrad: 'from-brand-sand-500 to-brand-sand-600',
    accentColor: '#BF8832'
  },
  GYM: {
    match: ['gym', 'thể hình', 'fitness', 'tạ', 'hypertrophy', 'cardio'],
    icon: 'fitness_center',
    badgeClass: 'bg-brand-navy-50 dark:bg-brand-navy-950/40 text-brand-navy-800 dark:text-brand-navy-300 border-brand-navy-200 dark:border-brand-navy-800',
    barGrad: 'from-brand-navy-700 to-brand-navy-700',
    accentColor: '#3D405B'
  },
  YOGA: {
    match: ['yoga', 'pilates', 'dẻo dai', 'thiền', 'reformer', 'trị liệu'],
    icon: 'self_improvement',
    badgeClass: 'bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-300 border-brand-sage-200 dark:border-brand-sage-800',
    barGrad: 'from-brand-sage-500 to-brand-teal-600',
    accentColor: '#5E987E'
  }
};

export function getSportTheme(sportName = '') {
  const lower = (sportName || '').toLowerCase();
  for (const key of Object.keys(SPORT_THEMES)) {
    const theme = SPORT_THEMES[key];
    if (theme.match.some((m) => lower.includes(m))) {
      return theme;
    }
  }
  return {
    icon: 'sports_score',
    badgeClass: 'bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300 border-brand-navy-200 dark:border-brand-navy-700',
    barGrad: 'from-brand-navy-900 to-brand-navy-800',
    accentColor: '#505363'
  };
}

export function getInitials(name = '') {
  if (!name) return 'HLV';
  const parts = name.trim().split(/\s+/);
  if (!parts.length || !parts[0]) return 'HLV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
