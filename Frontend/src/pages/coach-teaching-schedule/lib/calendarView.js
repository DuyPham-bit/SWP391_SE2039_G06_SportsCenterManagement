import { getMonday } from '../../../shared/lib/calendar.js';

export function getMonthCalendarGrid(year, month) {
  const firstDay = new Date(Date.UTC(year, month, 1, 12));
  const monday = getMonday(firstDay);
  const grid = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    grid.push(d);
  }
  return grid;
}

// Bảng màu nhận diện thể thao 15 bộ môn Olympic (hỗ trợ song ngữ VI / EN)
export function getSportTheme(sportName = '', isEn = false) {
  const s = String(sportName).toLowerCase();
  if (s.includes('bơi') || s.includes('swim')) {
    return {
      bg: 'bg-brand-teal-50/90 hover:bg-brand-teal-100/90 dark:bg-brand-teal-950/40 dark:hover:bg-brand-teal-900/40',
      border: 'border-brand-teal-300 dark:border-brand-teal-800',
      text: 'text-brand-teal-900 dark:text-brand-teal-200',
      badge: 'bg-brand-teal-100 text-brand-teal-800 border-brand-teal-200 dark:bg-brand-teal-900/50 dark:text-brand-teal-200 dark:border-brand-teal-800',
      dot: 'bg-brand-teal-500',
      tag: isEn ? 'SWIMMING' : 'BƠI LỘI'
    };
  }
  if (s.includes('yoga') || s.includes('pilates')) {
    return {
      bg: 'bg-brand-navy-50/90 hover:bg-brand-navy-100/90 dark:bg-brand-navy-950/40 dark:hover:bg-brand-navy-900/40',
      border: 'border-brand-navy-300 dark:border-brand-navy-800',
      text: 'text-brand-navy-900 dark:text-brand-navy-200',
      badge: 'bg-brand-navy-100 text-brand-navy-800 border-brand-navy-200 dark:bg-brand-navy-900/50 dark:text-brand-navy-200 dark:border-brand-navy-800',
      dot: 'bg-brand-navy-700',
      tag: 'YOGA & PILATES'
    };
  }
  if (s.includes('cầu lông') || s.includes('badminton')) {
    return {
      bg: 'bg-brand-sage-50/90 hover:bg-brand-sage-100/90 dark:bg-brand-sage-950/40 dark:hover:bg-brand-sage-900/40',
      border: 'border-brand-sage-300 dark:border-brand-sage-800',
      text: 'text-brand-sage-900 dark:text-brand-sage-200',
      badge: 'bg-brand-sage-100 text-brand-sage-800 border-brand-sage-200 dark:bg-brand-sage-900/50 dark:text-brand-sage-200 dark:border-brand-sage-800',
      dot: 'bg-brand-sage-500',
      tag: isEn ? 'BADMINTON' : 'CẦU LÔNG'
    };
  }
  if (s.includes('gym') || s.includes('fitness')) {
    return {
      bg: 'bg-brand-sand-50/90 hover:bg-brand-sand-100/90 dark:bg-brand-sand-950/40 dark:hover:bg-brand-sand-900/40',
      border: 'border-brand-sand-300 dark:border-brand-sand-800',
      text: 'text-brand-sand-900 dark:text-brand-sand-200',
      badge: 'bg-brand-sand-100 text-brand-sand-800 border-brand-sand-200 dark:bg-brand-sand-900/50 dark:text-brand-sand-200 dark:border-brand-sand-800',
      dot: 'bg-brand-sand-500',
      tag: 'GYM & FITNESS'
    };
  }
  if (s.includes('boxing') || s.includes('võ') || s.includes('kickfit') || s.includes('martial')) {
    return {
      bg: 'bg-brand-danger-50/90 hover:bg-brand-danger-100/90 dark:bg-brand-danger-950/40 dark:hover:bg-brand-danger-900/40',
      border: 'border-brand-danger-300 dark:border-brand-danger-800',
      text: 'text-brand-danger-900 dark:text-brand-danger-200',
      badge: 'bg-brand-danger-100 text-brand-danger-800 border-brand-danger-200 dark:bg-brand-danger-900/50 dark:text-brand-danger-200 dark:border-brand-danger-800',
      dot: 'bg-brand-danger-500',
      tag: isEn ? 'BOXING & MARTIAL ARTS' : 'BOXING & VÕ THUẬT'
    };
  }
  if (s.includes('bóng rổ') || s.includes('bóng đá') || s.includes('bóng chuyền') || s.includes('basketball') || s.includes('football')) {
    return {
      bg: 'bg-brand-teal-50/90 hover:bg-brand-teal-100/90 dark:bg-brand-teal-950/40 dark:hover:bg-brand-teal-900/40',
      border: 'border-brand-teal-300 dark:border-brand-teal-800',
      text: 'text-brand-teal-900 dark:text-brand-teal-200',
      badge: 'bg-brand-teal-100 text-brand-teal-800 border-brand-teal-200 dark:bg-brand-teal-900/50 dark:text-brand-teal-200 dark:border-brand-teal-800',
      dot: 'bg-brand-teal-500',
      tag: isEn ? 'BALL & TEAM SPORTS' : 'BÓNG & ĐỒNG ĐỘI'
    };
  }
  if (s.includes('tennis') || s.includes('bóng bàn') || s.includes('table tennis') || s.includes('pickleball')) {
    return {
      bg: 'bg-brand-sage-50/90 hover:bg-brand-sage-100/90 dark:bg-brand-sage-950/40 dark:hover:bg-brand-sage-900/40',
      border: 'border-brand-sage-300 dark:border-brand-sage-800',
      text: 'text-brand-sage-900 dark:text-brand-sage-200',
      badge: 'bg-brand-sage-100 text-brand-sage-800 border-brand-sage-200 dark:bg-brand-sage-900/50 dark:text-brand-sage-200 dark:border-brand-sage-800',
      dot: 'bg-brand-sage-500',
      tag: isEn ? 'RACKET SPORTS' : 'VỢT & BÓNG NHỎ'
    };
  }
  return {
    bg: 'bg-brand-navy-50/90 hover:bg-brand-navy-100/90 dark:bg-brand-navy-950/40 dark:hover:bg-brand-navy-900/40',
    border: 'border-brand-navy-300 dark:border-brand-navy-800',
    text: 'text-brand-navy-900 dark:text-brand-navy-200',
    badge: 'bg-brand-navy-100 text-brand-navy-800 border-brand-navy-200 dark:bg-brand-navy-900/50 dark:text-brand-navy-200 dark:border-brand-navy-800',
    dot: 'bg-brand-navy-700',
    tag: isEn ? 'OLYMPIC SPORTS' : 'THỂ THAO OLYMPIC'
  };
}
