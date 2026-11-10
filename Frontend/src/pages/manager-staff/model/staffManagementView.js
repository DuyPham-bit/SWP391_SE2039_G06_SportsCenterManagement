export const COACH_CLASS_FILTER = Object.freeze({
  ALL: 'ALL',
  UNASSIGNED: 'UNASSIGNED',
  ASSIGNED: 'ASSIGNED'
});

export function matchesCoachClassFilter(staff, filter) {
  if (filter === COACH_CLASS_FILTER.ALL) return true;
  if (staff?.role !== 'COACH' || staff.activeClassCount == null) return false;
  const count = Number(staff.activeClassCount);
  if (!Number.isFinite(count)) return false;
  return filter === COACH_CLASS_FILTER.UNASSIGNED ? count === 0 : count > 0;
}
