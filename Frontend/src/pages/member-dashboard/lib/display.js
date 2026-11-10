import { parseCalendarDate } from '../../../shared/lib/dateTime.js';

// Helper to determine sport meta, icon, and curated aesthetic color theme
export function getSportMeta(className = '', spec = '', isEn = false) {
  const cName = (className || '').toLowerCase();
  const sSpec = (spec || '').toLowerCase();

  if (cName.includes('golf') || cName.includes('swing') || cName.includes('trackman') || cName.includes('driving range') || sSpec.includes('golf')) {
    return {
      name: isEn ? 'Golf & Precision' : 'Golf & Thể thao đỉnh cao',
      icon: 'sports_golf',
      badgeBg: 'bg-brand-sage-50 text-brand-sage-800 border-brand-sage-200 dark:bg-brand-sage-950/40 dark:text-brand-sage-300 dark:border-brand-sage-800/60',
      pillColor: 'from-brand-sage-600 to-brand-teal-700',
      accentColor: '#5E987E'
    };
  }
  if (cName.includes('cầu lông') || cName.includes('badminton') || sSpec.includes('cầu lông') || sSpec.includes('badminton')) {
    return {
      name: isEn ? 'Badminton' : 'Cầu lông Olympic',
      icon: 'sports_tennis',
      badgeBg: 'bg-brand-teal-50 text-brand-teal-800 border-brand-teal-200 dark:bg-brand-teal-950/40 dark:text-brand-teal-300 dark:border-brand-teal-800/60',
      pillColor: 'from-brand-teal-500 to-brand-sage-600',
      accentColor: '#24828F'
    };
  }
  if (cName.includes('box') || cName.includes('kickfit') || cName.includes('võ') || cName.includes('mma') || cName.includes('muay') || sSpec.includes('box')) {
    return {
      name: isEn ? 'Boxing & Martial Arts' : 'Boxing & Võ thuật',
      icon: 'sports_mma',
      badgeBg: 'bg-brand-sand-50 text-brand-sand-800 border-brand-sand-200 dark:bg-brand-sand-950/40 dark:text-brand-sand-300 dark:border-brand-sand-800/60',
      pillColor: 'from-brand-sand-500 to-brand-terra-600',
      accentColor: '#BF8832'
    };
  }
  if (cName.includes('bơi') || cName.includes('swim') || cName.includes('pool') || sSpec.includes('bơi') || sSpec.includes('swim')) {
    return {
      name: isEn ? 'Swimming & Aquatic' : 'Bơi lội & Thủy sinh',
      icon: 'pool',
      badgeBg: 'bg-brand-teal-50 text-brand-teal-800 border-brand-teal-200 dark:bg-brand-teal-950/40 dark:text-brand-teal-300 dark:border-brand-teal-800/60',
      pillColor: 'from-brand-teal-500 to-brand-teal-600',
      accentColor: '#24828F'
    };
  }
  if (cName.includes('yoga') || cName.includes('pilates') || cName.includes('giãn cơ') || cName.includes('stretch') || sSpec.includes('yoga') || sSpec.includes('pilates')) {
    return {
      name: isEn ? 'Yoga & Pilates' : 'Yoga & Trị liệu',
      icon: 'self_improvement',
      badgeBg: 'bg-brand-navy-50 text-brand-navy-800 border-brand-navy-200 dark:bg-brand-navy-950/40 dark:text-brand-navy-300 dark:border-brand-navy-800/60',
      pillColor: 'from-brand-navy-700 to-brand-navy-700',
      accentColor: '#3D405B'
    };
  }
  if (cName.includes('tennis') || cName.includes('quần vợt') || cName.includes('pickleball') || sSpec.includes('tennis')) {
    return {
      name: isEn ? 'Tennis & Racket' : 'Tennis & Quần vợt',
      icon: 'sports_baseball',
      badgeBg: 'bg-brand-sage-50 text-brand-sage-800 border-brand-sage-200 dark:bg-brand-sage-950/40 dark:text-brand-sage-300 dark:border-brand-sage-800/60',
      pillColor: 'from-brand-sage-500 to-brand-sage-600',
      accentColor: '#5E987E'
    };
  }
  if (cName.includes('bóng rổ') || cName.includes('basketball') || cName.includes('bóng đá') || cName.includes('bóng chuyền')) {
    return {
      name: isEn ? 'Team Sports' : 'Thể thao đồng đội',
      icon: 'sports_basketball',
      badgeBg: 'bg-brand-teal-50 text-brand-teal-800 border-brand-teal-200 dark:bg-brand-teal-950/40 dark:text-brand-teal-300 dark:border-brand-teal-800/60',
      pillColor: 'from-brand-teal-500 to-brand-navy-700',
      accentColor: '#24828F'
    };
  }

  return {
    name: isEn ? 'Gym & Fitness' : 'Gym & Thể hình',
    icon: 'fitness_center',
    badgeBg: 'bg-brand-danger-50 text-brand-danger-800 border-brand-danger-200 dark:bg-brand-danger-950/40 dark:text-brand-danger-300 dark:border-brand-danger-800/60',
    pillColor: 'from-brand-danger-500 to-brand-danger-600',
    accentColor: '#CD493A'
  };
}

// Parse date into structured visual badge parts
export function parseDateParts(dateStr, isEn = false) {
  if (!dateStr) return { day: '--', month: '--', weekday: '--' };
  const d = parseCalendarDate(dateStr);
  if (Number.isNaN(d.getTime())) return { day: '--', month: '--', weekday: '--' };
  const weekdaysVi = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    day: String(d.getUTCDate()).padStart(2, '0'),
    month: isEn ? monthsEn[d.getUTCMonth()] : `Tháng ${d.getUTCMonth() + 1}`,
    weekday: isEn ? weekdaysEn[d.getUTCDay()] : weekdaysVi[d.getUTCDay()]
  };
}
