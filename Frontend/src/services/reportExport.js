function cell(value) {
  const text = String(value ?? '');
  // Spreadsheet programs must treat database labels as text, never as formulas.
  const safe = /^[=+@\-\t\r]/.test(text) ? "'" + text : text;
  return '"' + safe.replaceAll('"', '""') + '"';
}

export function createReportCsv(metrics, period) {
  const rows = [
    ['Chỉ tiêu', 'Giá trị', 'Kỳ'],
    ['Từ ngày', metrics.from, ''],
    ['Đến ngày', metrics.to, ''],
    ['Nhóm theo', metrics.groupBy, ''],
    ['Doanh thu thuần', metrics.monthlyRevenue, period],
    ['Tổng hội viên', metrics.totalMembers, period],
    ['Hội viên hoạt động', metrics.activeMembers, period],
    ['Hội viên mới trong kỳ', metrics.newMembers, period],
    ['Đăng ký lớp hiện tại', metrics.totalBookings, 'CURRENT'],
    ['Check-in hôm nay', metrics.todayCheckins, 'TODAY'],
    [], ['Kỳ', 'Doanh thu thuần'],
    ...(metrics.revenuePeriods || []).map(item => [item.periodStart, item.net]),
    [], ['XẾP HẠNG LỚP HỌC', 'Bộ môn', 'Huấn luyện viên', 'Sân / Phòng', 'Số buổi', 'Đã đặt', 'Tổng chỗ', 'Tỷ lệ lấp đầy (%)'],
    ...(metrics.topClasses || []).map(c => [c.name, c.sportName, c.coachName, c.roomName, c.sessionsCount, c.booked, c.capacity, `${c.occupancyRate}%`]),
    [], ['XẾP HẠNG BỘ MÔN', 'Đã đặt', 'Sức chứa', 'Số buổi', 'Số lớp', 'Tỷ lệ lấp đầy (%)', 'Thị phần đặt chỗ (%)'],
    ...(metrics.topSports || metrics.utilizationBySport || []).map(s => [s.name, s.booked, s.capacity, s.sessionsCount || '', s.classesCount || '', `${s.percentage}%`, s.share != null ? `${s.share}%` : '']),
    [], ['HIỆU SUẤT SÂN & PHÒNG TẬP', 'Loại sân', 'Vị trí', 'Số buổi diễn ra', 'Lượt đặt', 'Tổng sức chứa', 'Tỷ lệ lấp đầy (%)'],
    ...(metrics.topRooms || []).map(r => [r.name, r.type, r.location, r.sessionsCount, r.booked, r.capacity, `${r.occupancyRate}%`]),
    [], ['Kỳ', 'Hội viên mới'],
    ...(metrics.membershipPeriods || []).map(item => [item.periodStart, item.newMembers]),
    [], ['Trạng thái đăng ký hiện tại', 'Số lượng'],
    ...Object.entries(metrics.classStatusCounts || {}),
    [], ['Kỳ', 'Trạng thái đăng ký', 'Số lượng'],
    ...(metrics.classPeriods || []).flatMap(item => Object.entries(item.statusCounts || {}).map(([status, count]) => [item.periodStart, status, count]))
  ];
  return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n');
}
