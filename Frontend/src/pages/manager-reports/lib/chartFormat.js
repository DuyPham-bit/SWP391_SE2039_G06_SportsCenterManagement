// Format currency
export const formatVnd = (num) => `${Number(num || 0).toLocaleString('vi-VN')}đ`;
export const formatShortVnd = (num) => {
  const n = Number(num || 0);
  if (n >= 1000000000) return `${(n / 1000000000).toFixed(1)}B`;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return `${n}đ`;
};

// Rich visual identity & colors for sports
export const sportVisuals = {
  'Gym & Fitness': {
    stroke: '#CD493A',
    fill: '#FEE5E1',
    text: 'text-brand-danger-700 dark:text-brand-danger-400',
    bg: 'bg-brand-danger-50 text-brand-danger-700 dark:bg-brand-danger-950/50 dark:text-brand-danger-300 border-brand-danger-200 dark:border-brand-danger-800',
    barGrad: 'from-rose-500 to-red-600',
    barHex: '#CD493A',
    icon: 'fitness_center'
  },
  'Bơi lội': {
    stroke: '#24828F',
    fill: '#E6F2F3',
    text: 'text-brand-teal-700 dark:text-brand-teal-400',
    bg: 'bg-brand-teal-50 text-brand-teal-700 dark:bg-brand-teal-950/50 dark:text-brand-teal-300 border-brand-teal-200 dark:border-brand-teal-800',
    barGrad: 'from-cyan-400 to-teal-600',
    barHex: '#24828F',
    icon: 'pool'
  },
  'Boxing & Võ thuật': {
    stroke: '#B54E34',
    fill: '#FEE5E1',
    text: 'text-brand-danger-800 dark:text-brand-danger-300',
    bg: 'bg-brand-danger-50 text-brand-danger-700 dark:bg-brand-danger-950/50 dark:text-brand-danger-300 border-brand-danger-200 dark:border-brand-danger-800',
    barGrad: 'from-amber-600 to-rose-700',
    barHex: '#B54E34',
    icon: 'sports_mma'
  },
  'Yoga & Pilates': {
    stroke: '#2D6A4F',
    fill: '#E6F2EC',
    text: 'text-brand-sage-700 dark:text-brand-sage-400',
    bg: 'bg-brand-sage-50 text-brand-sage-700 dark:bg-brand-sage-950/50 dark:text-brand-sage-300 border-brand-sage-200 dark:border-brand-sage-800',
    barGrad: 'from-teal-600 to-emerald-700',
    barHex: '#2D6A4F',
    icon: 'self_improvement'
  },
  'Cầu lông': {
    stroke: '#BF8832',
    fill: '#F4F1DE',
    text: 'text-brand-sand-700 dark:text-brand-sand-400',
    bg: 'bg-brand-sand-50 text-brand-sand-700 dark:bg-brand-sand-950/50 dark:text-brand-sand-300 border-brand-sand-200 dark:border-brand-sand-800',
    barGrad: 'from-amber-400 to-yellow-600',
    barHex: '#BF8832',
    icon: 'sports_tennis'
  },
  'Bóng bàn': {
    stroke: '#3FAEB8',
    fill: '#E6F2F3',
    text: 'text-brand-teal-700 dark:text-brand-teal-400',
    bg: 'bg-brand-teal-50 text-brand-teal-700 dark:bg-brand-teal-950/50 dark:text-brand-teal-300 border-brand-teal-200 dark:border-brand-teal-800',
    barGrad: 'from-emerald-400 to-teal-700',
    barHex: '#3FAEB8',
    icon: 'sports_tennis'
  },
  'Golf': {
    stroke: '#1B4332',
    fill: '#E6F2EC',
    text: 'text-brand-sage-800 dark:text-brand-sage-300',
    bg: 'bg-brand-sage-50 text-brand-sage-700 dark:bg-brand-sage-950/50 dark:text-brand-sage-300 border-brand-sage-200 dark:border-brand-sage-800',
    barGrad: 'from-emerald-600 to-green-800',
    barHex: '#1B4332',
    icon: 'sports_golf'
  },
  'Bóng rổ': {
    stroke: '#E07A5F',
    fill: '#FED3C8',
    text: 'text-brand-terra-700 dark:text-brand-terra-400',
    bg: 'bg-brand-terra-50 text-brand-terra-700 dark:bg-brand-terra-950/50 dark:text-brand-terra-300 border-brand-terra-200 dark:border-brand-terra-800',
    barGrad: 'from-amber-500 to-orange-600',
    barHex: '#E07A5F',
    icon: 'sports_basketball'
  },
  'Pickleball': {
    stroke: '#24828F',
    fill: '#E6F2F3',
    text: 'text-brand-teal-700 dark:text-brand-teal-400',
    bg: 'bg-brand-teal-50 text-brand-teal-700 dark:bg-brand-teal-950/50 dark:text-brand-teal-300 border-brand-teal-200 dark:border-brand-teal-800',
    barGrad: 'from-sky-400 to-teal-600',
    barHex: '#24828F',
    icon: 'sports_tennis'
  },
  'Bóng đá': {
    stroke: '#2A5C46',
    fill: '#E6F2EC',
    text: 'text-brand-sage-700 dark:text-brand-sage-400',
    bg: 'bg-brand-sage-50 text-brand-sage-700 dark:bg-brand-sage-950/50 dark:text-brand-sage-300 border-brand-sage-200 dark:border-brand-sage-800',
    barGrad: 'from-green-500 to-emerald-700',
    barHex: '#2A5C46',
    icon: 'sports_soccer'
  }
};

export const getSportVisual = (name) => {
  const n = String(name || '').toLowerCase();
  for (const [key, visual] of Object.entries(sportVisuals)) {
    if (n.includes(key.toLowerCase()) || key.toLowerCase().includes(n)) return visual;
  }
  return {
    stroke: '#505363',
    fill: '#F4F4F5',
    text: 'text-brand-navy-700 dark:text-brand-navy-300',
    bg: 'bg-brand-navy-50 text-brand-navy-700 dark:bg-brand-navy-800 dark:text-brand-navy-300 border-brand-navy-200 dark:border-brand-navy-700',
    barGrad: 'from-slate-400 to-slate-600',
    barHex: '#505363',
    icon: 'sports'
  };
};

export const getSportColor = (name) => getSportVisual(name);
export const sportColors = sportVisuals;
