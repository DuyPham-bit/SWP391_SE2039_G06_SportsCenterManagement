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
    [], ['Môn thể thao', 'Đã đặt', 'Sức chứa', 'Tỷ lệ (%)'],
    ...(metrics.utilizationBySport || []).map(item => [item.name, item.booked, item.capacity, item.percentage]),
    [], ['Kỳ', 'Hội viên mới'],
    ...(metrics.membershipPeriods || []).map(item => [item.periodStart, item.newMembers]),
    [], ['Trạng thái đăng ký hiện tại', 'Số lượng'],
    ...Object.entries(metrics.classStatusCounts || {}),
    [], ['Kỳ', 'Trạng thái đăng ký', 'Số lượng'],
    ...(metrics.classPeriods || []).flatMap(item => Object.entries(item.statusCounts || {}).map(([status, count]) => [item.periodStart, status, count]))
  ];
  return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n');
}
