export const CLASS_STATUS = Object.freeze({
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed'
});

export const WEEK_DAYS = Object.freeze([
  'Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'
]);

const normalize = value => String(value || '').trim().toLocaleLowerCase('vi-VN');

export function splitAndSortClasses(classes = []) {
  const byName = (left, right) => String(left.name || '').localeCompare(String(right.name || ''), 'vi-VN');
  return {
    active: classes.filter(item => item.status !== CLASS_STATUS.CANCELLED).slice().sort(byName),
    cancelled: classes.filter(item => item.status === CLASS_STATUS.CANCELLED).slice().sort(byName)
  };
}

export function filterClasses(classes = [], query = '') {
  const needle = normalize(query);
  if (!needle) return classes;
  return classes.filter(item => [item.name, item.sportName, item.coachName, item.roomName, item.level]
    .some(value => normalize(value).includes(needle)));
}

export function groupSchedulesByDay(schedules = []) {
  return WEEK_DAYS.map((label, dayOfWeek) => ({
    label,
    dayOfWeek,
    items: schedules
      .filter(item => Number(item.dayOfWeek) === dayOfWeek)
      .slice()
      .sort((left, right) => String(left.startTime).localeCompare(String(right.startTime)))
  }));
}

export function effectiveScheduleRoom(schedule, classRow, rooms = []) {
  const roomId = schedule.roomId || classRow.roomId;
  return rooms.find(room => Number(room.id) === Number(roomId))?.name || 'Chưa chọn phòng';
}

export function validateClassForm(form) {
  if (!String(form.name || '').trim()) return 'Vui lòng nhập tên lớp.';
  if (!(Number(form.sportId) > 0)) return 'Vui lòng chọn bộ môn.';
  if (!Number.isInteger(Number(form.capacity)) || Number(form.capacity) < 1) return 'Sức chứa phải là số nguyên dương.';
  if (!Number.isInteger(Number(form.durationMinutes)) || Number(form.durationMinutes) < 1) return 'Thời lượng phải là số phút nguyên dương.';
  return '';
}

export function validateScheduleForm(form) {
  if (!form.startDate || !form.endDate) return 'Vui lòng chọn đầy đủ khoảng ngày.';
  if (form.endDate < form.startDate) return 'Ngày kết thúc không được trước ngày bắt đầu.';
  if (!form.startTime || !form.endTime || form.endTime <= form.startTime) return 'Giờ kết thúc phải sau giờ bắt đầu.';
  return '';
}
