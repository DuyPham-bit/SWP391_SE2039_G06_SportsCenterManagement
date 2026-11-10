import { translateSportName } from '../../../shared/i18n/i18nHelper.js';

export function getSportBadgeTheme(sportName = '', isEn = false) {
  const s = String(sportName).toLowerCase();
  if (s.includes('bơi') || s.includes('swim')) {
    return {
      bg: 'bg-brand-teal-50 text-brand-teal-800 border-brand-teal-200',
      tagBg: 'bg-brand-teal-100 text-brand-teal-800 border-brand-teal-200',
      dot: 'bg-brand-teal-500',
      icon: 'pool',
      accent: 'border-l-brand-teal-500',
      label: isEn ? 'Swimming' : 'Bơi lội'
    };
  }
  if (s.includes('yoga') || s.includes('pilates')) {
    return {
      bg: 'bg-brand-navy-50 text-brand-navy-800 border-brand-navy-200',
      tagBg: 'bg-brand-navy-100 text-brand-navy-800 border-brand-navy-200',
      dot: 'bg-brand-navy-700',
      icon: 'self_improvement',
      accent: 'border-l-brand-navy-700',
      label: 'Yoga & Pilates'
    };
  }
  if (s.includes('cầu lông') || s.includes('badminton')) {
    return {
      bg: 'bg-brand-sage-50 text-brand-sage-800 border-brand-sage-200',
      tagBg: 'bg-brand-sage-100 text-brand-sage-800 border-brand-sage-200',
      dot: 'bg-brand-sage-500',
      icon: 'sports_tennis',
      accent: 'border-l-brand-sage-500',
      label: isEn ? 'Badminton' : 'Cầu lông'
    };
  }
  if (s.includes('gym') || s.includes('fitness')) {
    return {
      bg: 'bg-brand-sand-50 text-brand-sand-800 border-brand-sand-200',
      tagBg: 'bg-brand-sand-100 text-brand-sand-800 border-brand-sand-200',
      dot: 'bg-brand-sand-500',
      icon: 'fitness_center',
      accent: 'border-l-brand-sand-500',
      label: 'Gym & Fitness'
    };
  }
  if (s.includes('boxing') || s.includes('võ') || s.includes('kickfit') || s.includes('martial')) {
    return {
      bg: 'bg-brand-danger-50 text-brand-danger-800 border-brand-danger-200',
      tagBg: 'bg-brand-danger-100 text-brand-danger-800 border-brand-danger-200',
      dot: 'bg-brand-danger-500',
      icon: 'sports_mma',
      accent: 'border-l-brand-danger-500',
      label: isEn ? 'Boxing & Martial Arts' : 'Boxing & Võ thuật'
    };
  }
  if (s.includes('bóng rổ') || s.includes('bóng đá') || s.includes('basketball') || s.includes('football')) {
    return {
      bg: 'bg-brand-teal-50 text-brand-teal-800 border-brand-teal-200',
      tagBg: 'bg-brand-teal-100 text-brand-teal-800 border-brand-teal-200',
      dot: 'bg-brand-teal-500',
      icon: 'sports_basketball',
      accent: 'border-l-brand-teal-500',
      label: isEn ? 'Team Sports' : 'Thể thao đồng đội'
    };
  }
  if (s.includes('tennis') || s.includes('bóng bàn') || s.includes('table tennis') || s.includes('pickleball')) {
    return {
      bg: 'bg-brand-sage-50 text-brand-sage-800 border-brand-sage-200',
      tagBg: 'bg-brand-sage-100 text-brand-sage-800 border-brand-sage-200',
      dot: 'bg-brand-sage-500',
      icon: 'sports_tennis',
      accent: 'border-l-brand-sage-500',
      label: isEn ? 'Racket Sports' : 'Vợt & Bóng nhỏ'
    };
  }
  return {
    bg: 'bg-brand-navy-50 text-brand-navy-800 border-brand-navy-200',
    tagBg: 'bg-brand-navy-100 text-brand-navy-800 border-brand-navy-200',
    dot: 'bg-brand-navy-700',
    icon: 'sports',
    accent: 'border-l-brand-navy-700',
    label: translateSportName(sportName, isEn)
  };
}

export function getTimeOfDayBadge(timeSlot = '', isEn = false) {
  const match = timeSlot.match(/(\d{1,2}):/);
  const hour = match ? parseInt(match[1], 10) : 12;
  if (hour < 12) {
    return {
      label: isEn ? 'Morning' : 'Ca Sáng',
      badge: 'bg-brand-sand-50 text-brand-sand-800 border-brand-sand-200',
      icon: 'wb_twilight'
    };
  }
  if (hour < 17) {
    return {
      label: isEn ? 'Afternoon' : 'Ca Chiều',
      badge: 'bg-brand-terra-50 text-brand-terra-800 border-brand-terra-200',
      icon: 'light_mode'
    };
  }
  return {
    label: isEn ? 'Evening' : 'Ca Tối',
    badge: 'bg-brand-navy-50 text-brand-navy-800 border-brand-navy-200',
    icon: 'dark_mode'
  };
}
