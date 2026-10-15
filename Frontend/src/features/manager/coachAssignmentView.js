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
