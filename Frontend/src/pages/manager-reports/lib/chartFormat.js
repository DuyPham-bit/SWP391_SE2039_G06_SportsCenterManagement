// Format currency
export const formatVnd = (num) => `${Number(num || 0).toLocaleString('vi-VN')}đ`;
export const formatShortVnd = (num) => {
  const n = Number(num || 0);
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return `${n}đ`;
};

// Colors for sports
export const sportColors = {
  'Bơi lội': { stroke: '#24828F', fill: '#E6F2F3', text: 'text-brand-teal-700 dark:text-brand-teal-400', bg: 'bg-brand-teal-500' },
  'Gym & Fitness': { stroke: '#CD493A', fill: '#FEE5E1', text: 'text-brand-danger-700 dark:text-brand-danger-400', bg: 'bg-brand-danger-500' },
  'Yoga & Pilates': { stroke: '#2D6A4F', fill: '#E6F2EC', text: 'text-brand-sage-700 dark:text-brand-sage-500', bg: 'bg-brand-sage-700' },
  'Cầu lông': { stroke: '#BF8832', fill: '#F4F1DE', text: 'text-brand-sand-700 dark:text-brand-sand-400', bg: 'bg-brand-sand-500' },
  'Boxing & Võ thuật': { stroke: '#3D405B', fill: '#F4F4F5', text: 'text-brand-navy-800 dark:text-brand-navy-400', bg: 'bg-brand-navy-700' }
};

export const getSportColor = (name) => sportColors[name] || { stroke: '#505363', fill: '#F4F4F5', text: 'text-brand-navy-700 dark:text-brand-navy-300', bg: 'bg-brand-navy-500' };
