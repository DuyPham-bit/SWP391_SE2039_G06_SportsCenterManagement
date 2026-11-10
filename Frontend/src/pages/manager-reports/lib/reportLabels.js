export const getStatusName = (status, isEn) => {
  const mapEn = {
    Confirmed: 'Confirmed',
    Cancelled: 'Cancelled',
    Waiting: 'Waiting',
    Promoted: 'Promoted',
    Booked: 'Booked',
    Attended: 'Attended'
  };
  const mapVi = {
    Confirmed: 'Đã xác nhận',
    Cancelled: 'Đã hủy',
    Waiting: 'Đang chờ',
    Promoted: 'Đã chuyển vào lớp',
    Booked: 'Đã đặt chỗ',
    Attended: 'Đã tham gia'
  };
  return (isEn ? mapEn[status] : mapVi[status]) || status;
};

export const sportBadgeStyles = {
  'Bơi lội': { bg: 'bg-brand-teal-50 dark:bg-brand-teal-950/40 text-brand-teal-700 dark:text-brand-teal-300 border-brand-teal-200 dark:border-brand-teal-800', icon: 'pool', bar: 'bg-brand-teal-500' },
  'Gym & Fitness': { bg: 'bg-brand-danger-50 dark:bg-brand-danger-950/40 text-brand-danger-700 dark:text-brand-danger-300 border-brand-danger-200 dark:border-brand-danger-800', icon: 'fitness_center', bar: 'bg-brand-danger-500' },
  'Yoga & Pilates': { bg: 'bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-300 border-brand-sage-200 dark:border-brand-sage-800', icon: 'self_improvement', bar: 'bg-brand-sage-500' },
  'Cầu lông': { bg: 'bg-brand-sand-50 dark:bg-brand-sand-950/40 text-brand-sand-700 dark:text-brand-sand-300 border-brand-sand-200 dark:border-brand-sand-800', icon: 'sports_tennis', bar: 'bg-brand-sand-500' },
  'Boxing & Võ thuật': { bg: 'bg-brand-navy-50 dark:bg-brand-navy-950/40 text-brand-navy-800 dark:text-brand-navy-300 border-brand-navy-200 dark:border-brand-navy-800', icon: 'sports_mma', bar: 'bg-brand-navy-700' }
};

export const getSportStyle = (name) => sportBadgeStyles[name] || { bg: 'bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300 border-brand-navy-200 dark:border-brand-navy-700', icon: 'sports', bar: 'bg-brand-navy-600' };
