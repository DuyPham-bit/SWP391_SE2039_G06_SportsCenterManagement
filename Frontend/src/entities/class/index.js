/**
 * Entity: Class
 * Helper và model cho thực thể Lớp học (Class).
 */
export function formatClassTitle(cls) {
  if (!cls) return '';
  return cls.name || cls.className || 'Lớp học';
}

export function isClassFull(cls) {
  if (!cls) return false;
  const current = cls.enrolledCount || cls.currentMembers || 0;
  const max = cls.maxCapacity || cls.capacity || 0;
  return max > 0 && current >= max;
}

export { ClassStatusBadge } from './ui/ClassStatusBadge.jsx';
