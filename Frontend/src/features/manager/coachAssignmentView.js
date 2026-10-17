const CLOSED_CLASS_STATUSES = new Set(['cancelled', 'completed']);

const normalize = value => String(value || '').trim().toLocaleLowerCase('vi-VN');

export function isCoachCompatible(coach, classRow) {
  if (Array.isArray(coach?.sportIds) && coach.sportIds.length > 0 && classRow?.sportId) {
    return coach.sportIds.map(Number).includes(Number(classRow.sportId));
  }
  const specialization = normalize(coach?.specialization);
  const sportName = normalize(classRow?.sportName);
  return Boolean(specialization && sportName && specialization.includes(sportName));
}

export function summarizeCoachAssignments(classes = []) {
  const manageable = classes.filter(item => !CLOSED_CLASS_STATUSES.has(normalize(item.status)));
  return {
    total: manageable.length,
    assigned: manageable.filter(item => item.coachId).length,
    unassigned: manageable.filter(item => !item.coachId).length,
    draft: manageable.filter(item => normalize(item.status) === 'draft').length
  };
}

export function filterAndSortAssignmentClasses(classes = [], query = '', assignment = 'all') {
  const needle = normalize(query);
  return classes
    .filter(item => !CLOSED_CLASS_STATUSES.has(normalize(item.status)))
    .filter(item => assignment === 'all'
      || (assignment === 'assigned' && item.coachId)
      || (assignment === 'unassigned' && !item.coachId))
    .filter(item => !needle || [item.name, item.sportName, item.coachName, item.roomName]
      .some(value => normalize(value).includes(needle)))
    .slice()
    .sort((left, right) => Number(Boolean(left.coachId)) - Number(Boolean(right.coachId))
      || String(left.name || '').localeCompare(String(right.name || ''), 'vi-VN'));
}

export function coachWorkload(coaches = [], classes = []) {
  const active = classes.filter(item => !CLOSED_CLASS_STATUSES.has(normalize(item.status)));
  return coaches.map(coach => ({
    ...coach,
    primaryClassCount: active.filter(item => String(item.coachId) === String(coach.id)).length
  })).sort((left, right) => left.primaryClassCount - right.primaryClassCount
    || String(left.fullName || '').localeCompare(String(right.fullName || ''), 'vi-VN'));
}

const dateRangesOverlap = (left, right) => {
  const leftStart = left?.startDate || '0001-01-01';
  const leftEnd = left?.endDate || '9999-12-31';
  const rightStart = right?.startDate || '0001-01-01';
  const rightEnd = right?.endDate || '9999-12-31';
  return leftStart <= rightEnd && rightStart <= leftEnd;
};

const timesOverlap = (left, right) =>
  String(left?.startTime || '') < String(right?.endTime || '')
  && String(right?.startTime || '') < String(left?.endTime || '');

export function getCoachAvailability(coach, targetSchedules = [], targetClassId) {
  if (!targetSchedules.length) return { status: 'UNKNOWN', conflicts: [] };
  const teachingSlots = Array.isArray(coach?.teachingSlots) ? coach.teachingSlots : [];
  const conflicts = teachingSlots.filter(slot => String(slot.classId) !== String(targetClassId))
    .filter(slot => targetSchedules.some(target => Number(slot.dayOfWeek) === Number(target.dayOfWeek)
      && dateRangesOverlap(slot, target) && timesOverlap(slot, target)));
  return { status: conflicts.length ? 'BUSY' : 'AVAILABLE', conflicts };
}

export function filterCoachCandidates(coaches = [], classRow, targetSchedules = [], query = '', availability = 'ALL') {
  const needle = normalize(query);
  return coaches.map(coach => ({
    ...coach,
    compatible: isCoachCompatible(coach, classRow),
    availability: getCoachAvailability(coach, targetSchedules, classRow?.id)
  })).filter(coach => !needle || [coach.fullName, coach.coachCode, coach.specialization, coach.certification]
    .some(value => normalize(value).includes(needle)))
    .filter(coach => availability === 'ALL' || coach.availability.status === availability)
    .sort((left, right) => Number(right.compatible) - Number(left.compatible)
      || Number(left.availability.status === 'BUSY') - Number(right.availability.status === 'BUSY')
      || Number(left.primaryClassCount || 0) - Number(right.primaryClassCount || 0)
      || String(left.fullName || '').localeCompare(String(right.fullName || ''), 'vi-VN'));
}
