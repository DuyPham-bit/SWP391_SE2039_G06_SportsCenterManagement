import { vietnamDateTimeInput } from './dateTime.js';

// Time-based polite greeting
export function getTimeGreeting(isEn = false) {
  const hour = Number(vietnamDateTimeInput().slice(11, 13));
  if (hour >= 5 && hour < 12) return isEn ? 'Good morning' : 'Chào buổi sáng';
  if (hour >= 12 && hour < 18) return isEn ? 'Good afternoon' : 'Chào buổi chiều';
  return isEn ? 'Good evening' : 'Chào buổi tối';
}
