export function getVietnameseGivenName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  return parts.at(-1) || '';
}

function compareText(left, right) {
  return String(left || '').localeCompare(String(right || ''), 'vi', { sensitivity: 'base' });
}

function compareNames(left, right, direction) {
  const leftGivenName = getVietnameseGivenName(left.fullName);
  const rightGivenName = getVietnameseGivenName(right.fullName);
  if (!leftGivenName && rightGivenName) return 1;
  if (leftGivenName && !rightGivenName) return -1;

  const multiplier = direction === 'desc' ? -1 : 1;
  return multiplier * (
    compareText(leftGivenName, rightGivenName)
    || compareText(left.fullName, right.fullName)
  );
}

export function sortStaffForManagement(staff, sortBy = 'DEFAULT') {
  return (Array.isArray(staff) ? staff : [])
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const statusOrder = (String(left.item.status || '').toUpperCase() === 'ACTIVE' ? 0 : 1)
        - (String(right.item.status || '').toUpperCase() === 'ACTIVE' ? 0 : 1);
      if (statusOrder) return statusOrder;

      if (sortBy === 'NAME_ASC') {
        return compareNames(left.item, right.item, 'asc') || left.index - right.index;
      }
      if (sortBy === 'NAME_DESC') {
        return compareNames(left.item, right.item, 'desc') || left.index - right.index;
      }
      if (sortBy === 'ROLE') {
        return compareText(left.item.role, right.item.role)
          || compareNames(left.item, right.item, 'asc')
          || left.index - right.index;
      }
      return left.index - right.index;
    })
    .map(({ item }) => item);
}
