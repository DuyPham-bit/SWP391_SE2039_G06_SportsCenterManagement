export const reportLabel = (language, vi, en) => language === 'en' ? en : vi;

export function reportDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
  return match ? `${match[3]}/${match[2]}/${match[1]}` : String(value || '');
}

export function validateReport(metrics) {
  if (!metrics || !/^\d{4}-\d{2}-\d{2}$/.test(metrics.from || '') || !/^\d{4}-\d{2}-\d{2}$/.test(metrics.to || '')) {
    throw new Error('Chưa có dữ liệu báo cáo hợp lệ để xuất.');
  }
}

export function reportFilename(metrics, extension) {
  validateReport(metrics);
  return `SCMS-BaoCao-${metrics.from}_${metrics.to}.${extension}`;
}

export function reportSummary(metrics, language = 'vi') {
  const t = (vi, en) => reportLabel(language, vi, en);
  return [
    [t('Doanh thu gộp', 'Gross revenue'), metrics.grossRevenue, 'money'],
    [t('Hoàn tiền', 'Refunds'), metrics.refundedRevenue, 'money'],
    [t('Doanh thu thuần', 'Net revenue'), metrics.netRevenue ?? metrics.monthlyRevenue, 'money'],
    [t('Hội viên mới trong kỳ', 'New members in period'), metrics.newMembers, 'number'],
    [t('Hội viên hiện tại', 'Current members'), metrics.totalMembers, 'number'],
    [t('Hội viên có gói hiệu lực', 'Members with an active package'), metrics.membersWithPackage ?? metrics.activeMembers, 'number'],
    [t('Hội viên chưa có gói hiệu lực', 'Members without an active package'), metrics.membersWithoutPackage ?? Math.max(0, Number(metrics.totalMembers || 0) - Number(metrics.activeMembers || 0)), 'number'],
    [t('Đăng ký lớp hiện tại', 'Current class bookings'), metrics.totalBookings, 'number'],
    [t('Check-in hôm nay', "Today's check-ins"), metrics.todayCheckins, 'number'],
    [t('Tỷ lệ lấp đầy trong kỳ', 'Occupancy in period'), metrics.occupancyRate, 'percent']
  ];
}

export function reportSections(metrics, language = 'vi') {
  const t = (vi, en) => reportLabel(language, vi, en);
  const col = (vi, en, type = 'text', width = 18) => ({ label: t(vi, en), type, width });
  const date = col('Kỳ', 'Period', 'date', 17);
  const gross = col('Doanh thu gộp', 'Gross revenue', 'money', 22);
  const refunds = col('Hoàn tiền', 'Refunds', 'money', 20);
  const net = col('Doanh thu thuần', 'Net revenue', 'money', 22);
  const booked = col('Lượt đặt', 'Bookings', 'number', 13);
  const capacity = col('Tổng chỗ', 'Capacity', 'number', 13);
  const sessions = col('Số buổi', 'Sessions', 'number', 12);
  const occupancy = col('Lấp đầy (%)', 'Occupancy (%)', 'percent', 16);
  const statusNames = {
    Confirmed: t('Đã xác nhận', 'Confirmed'), Cancelled: t('Đã hủy', 'Cancelled'),
    Waiting: t('Đang chờ', 'Waiting'), Promoted: t('Đã chuyển vào lớp', 'Promoted'),
    Booked: t('Đã đặt chỗ', 'Booked'), Attended: t('Đã tham gia', 'Attended')
  };
  const status = value => statusNames[value] || value;
  return [
    { name: t('Doanh thu theo kỳ', 'Revenue by period'), sheet: t('Doanh thu', 'Revenue'), columns: [date, gross, refunds, net],
      rows: (metrics.revenuePeriods || []).map(x => [x.periodStart, x.gross, x.refunds, x.net]) },
    { name: t('Doanh thu theo bộ môn', 'Revenue by sport'), sheet: t('Doanh thu bộ môn', 'Sport revenue'),
      columns: [col('Bộ môn', 'Sport', 'text', 30), gross, refunds, net, col('Tỷ trọng (%)', 'Share (%)', 'percent', 16), col('Phân bổ', 'Allocation', 'text', 38)],
      rows: (metrics.revenueBySport || []).map(x => [x.sportName, x.gross, x.refunds, x.net, x.share,
        x.sportId == null ? t('Chưa đủ dữ liệu để phân bổ', 'Insufficient usage data to allocate') : t('Đã phân bổ', 'Allocated')]) },
    { name: t('Xếp hạng lớp học', 'Class performance'), sheet: t('Lớp học', 'Classes'),
      columns: [col('Lớp học', 'Class', 'text', 38), col('Bộ môn', 'Sport', 'text', 25), col('Huấn luyện viên', 'Coach', 'text', 28), col('Sân / Phòng', 'Room / court', 'text', 30), sessions, booked, capacity, occupancy],
      rows: (metrics.topClasses || []).map(x => [x.name, x.sportName, x.coachName, x.roomName, x.sessionsCount, x.booked, x.capacity, x.occupancyRate]) },
    { name: t('Hiệu suất bộ môn', 'Sport utilization'), sheet: t('Hiệu suất bộ môn', 'Sport utilization'),
      columns: [col('Bộ môn', 'Sport', 'text', 30), booked, capacity, sessions, col('Số lớp', 'Classes', 'number', 12), occupancy, col('Thị phần (%)', 'Booking share (%)', 'percent', 18)],
      rows: (metrics.topSports || metrics.utilizationBySport || []).map(x => [x.name, x.booked, x.capacity, x.sessionsCount, x.classesCount, x.percentage, x.share]) },
    { name: t('Hiệu suất sân và phòng tập', 'Room and court utilization'), sheet: t('Sân phòng', 'Rooms'),
      columns: [col('Sân / Phòng', 'Room / court', 'text', 38), col('Loại', 'Type', 'text', 23), col('Vị trí', 'Location', 'text', 32), sessions, booked, capacity, occupancy],
      rows: (metrics.topRooms || []).map(x => [x.name, x.type, x.location, x.sessionsCount, x.booked, x.capacity, x.occupancyRate]) },
    { name: t('Hội viên mới theo kỳ', 'New members by period'), sheet: t('Hội viên', 'Members'),
      columns: [date, col('Hội viên mới', 'New members', 'number', 22)],
      rows: (metrics.membershipPeriods || []).map(x => [x.periodStart, x.newMembers]) },
    { name: t('Hiệu suất huấn luyện viên', 'Coach performance'), sheet: t('Huấn luyện viên', 'Coaches'),
      columns: [col('Huấn luyện viên', 'Coach', 'text', 32), col('Mã HLV', 'Coach code', 'text', 18), col('Chuyên môn', 'Specialization', 'text', 25), col('Trạng thái', 'Status', 'text', 18), col('Số lớp', 'Classes', 'number', 12), sessions, booked, capacity, occupancy],
      rows: (metrics.coaches || []).map(x => [x.fullName, x.coachCode || '', x.specialization || '', x.status, x.classesCount, x.sessionsCount, x.booked, x.capacity, x.occupancyRate]) },
    { name: t('Trạng thái đăng ký hiện tại', 'Current booking status'), sheet: t('Trạng thái', 'Status'),
      columns: [col('Trạng thái', 'Status', 'text', 30), col('Số lượng', 'Count', 'number', 18)],
      rows: Object.entries(metrics.classStatusCounts || {}).map(([key, count]) => [status(key), count]) },
    { name: t('Trạng thái đăng ký theo kỳ', 'Booking status by period'), sheet: t('Trạng thái', 'Status'),
      columns: [date, col('Trạng thái', 'Status', 'text', 30), col('Số lượng', 'Count', 'number', 18)],
      rows: (metrics.classPeriods || []).flatMap(x => Object.entries(x.statusCounts || {}).map(([key, count]) => [x.periodStart, status(key), count])) }
  ];
}
