function cell(value) {
  const text = String(value ?? '');
  // Spreadsheet programs must treat database labels as text, never as formulas.
  const safe = /^[=+@\-\t\r]/.test(text) ? "'" + text : text;
  return '"' + safe.replaceAll('"', '""') + '"';
}

export function createReportCsv(metrics, period) {
  const rows = [
    ['BÁO CÁO DOANH THU & VẬN HÀNH TRUNG TÂM'],
    ['Thời điểm xuất', new Date().toLocaleString('vi-VN')],
    ['Phạm vi dữ liệu', `${metrics.from} đến ${metrics.to}`],
    [],
    ['Chỉ tiêu', 'Giá trị', 'Kỳ'],
    ['Từ ngày', metrics.from, ''],
    ['Đến ngày', metrics.to, ''],
    ['Nhóm theo', metrics.groupBy, ''],
    ['Doanh thu gộp', metrics.grossRevenue, period],
    ['Hoàn tiền', metrics.refundedRevenue, period],
    ['Doanh thu thuần', metrics.netRevenue ?? metrics.monthlyRevenue, period],
    ['Tổng hội viên', metrics.totalMembers, period],
    ['Hội viên hoạt động', metrics.activeMembers, period],
    ['Hội viên mới trong kỳ', metrics.newMembers, period],
    ['Đăng ký lớp hiện tại', metrics.totalBookings, 'CURRENT'],
    ['Check-in hôm nay', metrics.todayCheckins, 'TODAY'],
    [], ['ĐỐI SOÁT DOANH THU THEO KỲ'],
    ['Kỳ', 'Doanh thu gộp', 'Hoàn tiền', 'Doanh thu thuần'],
    ...(metrics.revenuePeriods || []).map(item => [item.periodStart, item.gross, item.refunds, item.net]),
    [], ['DOANH THU THEO BỘ MÔN'],
    ['Bộ môn', 'Doanh thu gộp', 'Hoàn tiền', 'Doanh thu thuần', 'Tỷ trọng (%)', 'Trạng thái phân bổ'],
    ...(metrics.revenueBySport || []).map(item => [item.sportName, item.gross, item.refunds, item.net, item.share,
      item.sportId == null ? 'Chưa đủ dữ liệu sử dụng để phân bổ' : 'Đã phân bổ']),
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
