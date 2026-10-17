function cell(value) {
  const text = String(value ?? '');
  // Spreadsheet programs must treat database labels as text, never as formulas.
  const safe = /^[=+@\-\t\r]/.test(text) ? "'" + text : text;
  return '"' + safe.replaceAll('"', '""') + '"';
}

const moneyFormat = value => `${Number(value || 0).toLocaleString('vi-VN')} đ`;

export function createReportCsv(metrics, period) {
  const rows = [
    ['=== BÁO CÁO DOANH THU & VẬN HÀNH TRUNG TÂM THỂ THAO ==='],
    ['Thời điểm xuất báo cáo', new Date().toLocaleString('vi-VN')],
    ['Phạm vi dữ liệu', `${metrics.from} đến ${metrics.to}`],
    ['Kỳ báo cáo', period],
    [],
    ['=== 1. CHỈ SỐ DOANH THU & KPI QUẢN TRỊ ==='],
    ['Chỉ tiêu', 'Giá trị', 'Đơn vị tính'],
    ['Doanh thu gộp (Gross)', Number(metrics.grossRevenue || 0), 'VND'],
    ['Tổng tiền hoàn (Refunds)', Number(metrics.refundedRevenue || 0), 'VND'],
    ['Doanh thu thuần (Net)', Number(metrics.netRevenue ?? metrics.monthlyRevenue ?? 0), 'VND'],
    ['Tổng số học viên / hội viên', metrics.totalMembers || 0, 'Người'],
    ['Học viên có gói tập hiệu lực', metrics.activeMembers || 0, 'Người'],
    ['Học viên đã hết hạn gói', metrics.expiredMembers || 0, 'Người'],
    ['Học viên chưa mua gói tập', metrics.inactiveMembers || 0, 'Người'],
    ['Học viên mới đăng ký trong kỳ', metrics.newMembers || 0, 'Người'],
    ['Tổng số nhân sự trung tâm', metrics.totalStaff || 0, 'Nhân sự'],
    ['Nhân sự đang hoạt động', metrics.activeStaff || 0, 'Nhân sự'],
    ['Huấn luyện viên (Coach)', metrics.coachCount || 0, 'Nhân sự'],
    ['Lễ tân (Receptionist)', metrics.receptionistCount || 0, 'Nhân sự'],
    ['Quản lý (Manager)', metrics.managerCount || 0, 'Nhân sự'],
    ['Tổng số ca học đã tổ chức', metrics.totalClasses || 0, 'Ca học'],
    ['Lượt đặt chỗ học viên', metrics.bookedSeats || metrics.totalBookings || 0, 'Lượt'],
    ['Tổng sức chứa mở bán', metrics.capacitySeats || 0, 'Chỗ'],
    ['Tỷ lệ lấp đầy trung bình', `${metrics.occupancyRate || 0}%`, 'Phần trăm'],
    ['Lượt check-in hôm nay', metrics.todayCheckins || 0, 'Lượt'],
    [],
    ['=== 2. ĐỐI SOÁT DOANH THU THEO KỲ ==='],
    ['Kỳ (Thời gian)', 'Doanh thu gộp (VND)', 'Hoàn tiền (VND)', 'Doanh thu thuần (VND)'],
    ...(metrics.revenuePeriods || []).map(item => [item.periodStart, item.gross, item.refunds, item.net]),
    [],
    ['=== 3. DOANH THU THEO BỘ MÔN THỂ THAO ==='],
    ['Bộ môn', 'Doanh thu gộp (VND)', 'Hoàn tiền (VND)', 'Doanh thu thuần (VND)', 'Tỷ trọng đóng góp (%)', 'Trạng thái phân bổ'],
    ...(metrics.revenueBySport || []).map(item => [
      item.sportName,
      item.gross,
      item.refunds,
      item.net,
      item.share,
      item.sportId == null ? 'Chưa đủ dữ liệu sử dụng để phân bổ' : 'Đã phân bổ'
    ]),
    [],
    ['=== 4. THỐNG KÊ GÓI HỘI VIÊN & DOANH SỐ ==='],
    ['Tên gói tập', 'Giá niêm yết (VND)', 'Thời hạn (ngày)', 'Hội viên đang dùng', 'Số gói bán trong kỳ', 'Doanh thu trong kỳ (VND)'],
    ...(metrics.membershipPackages || []).map(p => [
      p.name,
      p.price,
      p.durationDays,
      p.activeSubscribers,
      p.soldInPeriod,
      p.revenueInPeriod
    ]),
    [],
    ['=== 5. NĂNG SUẤT & TẢI CÔNG VIỆC HUẤN LUYỆN VIÊN ==='],
    ['Họ tên Huấn luyện viên', 'Mã HLV', 'Chuyên môn', 'Trạng thái', 'Số lớp phụ trách', 'Số ca dạy trong kỳ', 'Lượt học viên tiếp nhận', 'Tổng sức chứa', 'Tỷ lệ lấp đầy (%)'],
    ...(metrics.topCoaches || []).map(c => [
      c.fullName,
      c.coachCode,
      c.specialization,
      c.status,
      c.classesCount,
      c.sessionsCount,
      c.booked,
      c.capacity,
      `${c.occupancyRate}%`
    ]),
    [],
    ['=== 6. XẾP HẠNG HIỆU SUẤT LỚP HỌC ==='],
    ['Tên lớp học', 'Bộ môn', 'Huấn luyện viên', 'Sân / Phòng tập', 'Số buổi', 'Lượt đặt', 'Tổng chỗ', 'Tỷ lệ lấp đầy (%)'],
    ...(metrics.topClasses || []).map(c => [
      c.name,
      c.sportName,
      c.coachName,
      c.roomName,
      c.sessionsCount,
      c.booked,
      c.capacity,
      `${c.occupancyRate}%`
    ]),
    [],
    ['=== 7. HIỆU SUẤT KHAI THÁC SÂN BÃI & PHÒNG TẬP ==='],
    ['Tên sân / Phòng', 'Loại hình', 'Vị trí khu vực', 'Số buổi diễn ra', 'Lượt khách tiếp nhận', 'Tổng sức chứa', 'Tỷ lệ khai thác (%)'],
    ...(metrics.topRooms || []).map(r => [
      r.name,
      r.type,
      r.location,
      r.sessionsCount,
      r.booked,
      r.capacity,
      `${r.occupancyRate}%`
    ]),
    [],
    ['=== 8. THÀNH VIÊN MỚI THEO KỲ ==='],
    ['Kỳ', 'Hội viên mới đăng ký'],
    ...(metrics.membershipPeriods || []).map(item => [item.periodStart, item.newMembers]),
    [],
    ['=== 9. TRẠNG THÁI ĐĂNG KÝ HIỆN TẠI ==='],
    ['Trạng thái đăng ký hiện tại', 'Số lượng'],
    ...Object.entries(metrics.classStatusCounts || {}),
    [],
    ['=== 10. SỰ KIỆN ĐĂNG KÝ LỚP THEO KỲ ==='],
    ['Kỳ', 'Trạng thái', 'Số lượng'],
    ...(metrics.classPeriods || []).flatMap(item => Object.entries(item.statusCounts || {}).map(([status, count]) => [item.periodStart, status, count]))
  ];
  return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n');
}

const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

const excelText = value => {
  const text = String(value ?? '');
  return escapeHtml(/^[=+@\-\t\r]/.test(text) ? `'${text}` : text);
};

const money = value => `${Number(value || 0).toLocaleString('vi-VN')} đ`;
const table = (title, headers, rows) => `
  <h2>${escapeHtml(title)}</h2>
  <table>
    <thead><tr>${headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead>
    <tbody>${rows.length ? rows.map(row => `<tr>${row.map(value => `<td>${excelText(value)}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${headers.length}" class="empty">Chưa có dữ liệu</td></tr>`}</tbody>
  </table>`;

export function createReportWorkbook(metrics, period) {
  const summaryRows = [
    ['Doanh thu thuần (Net)', money(metrics.netRevenue ?? metrics.monthlyRevenue)],
    ['Doanh thu gộp (Gross)', money(metrics.grossRevenue)],
    ['Tổng hoàn tiền (Refunds)', money(metrics.refundedRevenue)],
    ['Tổng số học viên', `${metrics.totalMembers || 0} người`],
    ['Học viên có gói tập hiệu lực', `${metrics.activeMembers || 0} người`],
    ['Học viên đã hết hạn gói', `${metrics.expiredMembers || 0} người`],
    ['Học viên chưa mua gói', `${metrics.inactiveMembers || 0} người`],
    ['Học viên mới đăng ký trong kỳ', `${metrics.newMembers || 0} người`],
    ['Tổng số nhân sự trung tâm', `${metrics.totalStaff || 0} nhân sự (${metrics.activeStaff || 0} đang hoạt động)`],
    ['Cơ cấu nhân sự', `HLV: ${metrics.coachCount || 0} | Lễ tân: ${metrics.receptionistCount || 0} | Quản lý: ${metrics.managerCount || 0}`],
    ['Lớp học đang mở / Danh mục lớp', `${metrics.activeClasses || 0} / ${metrics.classCatalogCount || 0} lớp`],
    ['Sân bãi / Phòng đang hoạt động', `${metrics.activeRooms || 0} / ${metrics.totalRooms || 0} phòng`],
    ['Tổng ca học tổ chức trong kỳ', `${metrics.totalClasses || 0} ca`],
    ['Lượt đặt chỗ / Sức chứa tối đa', `${metrics.bookedSeats || 0} / ${metrics.capacitySeats || 0} chỗ`],
    ['Tỷ lệ lấp đầy trung bình toàn trung tâm', `${metrics.occupancyRate || 0}%`],
    ['Lượt check-in hôm nay', `${metrics.todayCheckins || 0} lượt`]
  ];

  const revenueRows = (metrics.revenuePeriods || []).map(item => [
    item.periodStart, money(item.gross), money(item.refunds), money(item.net)
  ]);

  const sportRevenueRows = (metrics.revenueBySport || []).map(item => [
    item.sportName, money(item.gross), money(item.refunds), money(item.net), `${item.share || 0}%`,
    item.sportId == null ? 'Chưa phân bổ' : 'Đã phân bổ'
  ]);

  const packageRows = (metrics.membershipPackages || []).map(item => [
    item.name, money(item.price), `${item.durationDays} ngày`, `${item.activeSubscribers} người`,
    `${item.soldInPeriod} gói`, money(item.revenueInPeriod)
  ]);

  const coachRows = (metrics.topCoaches || []).map(item => [
    item.fullName, item.coachCode, item.specialization, item.status === 'Active' ? 'Hoạt động' : 'Tạm khóa',
    `${item.classesCount} lớp`, `${item.sessionsCount} ca`, `${item.booked} học viên`, `${item.capacity} chỗ`, `${item.occupancyRate}%`
  ]);

  const classRows = (metrics.topClasses || []).map(item => [
    item.name, item.sportName, item.coachName, item.roomName, item.sessionsCount,
    item.booked, item.capacity, `${item.occupancyRate}%`
  ]);

  const roomRows = (metrics.topRooms || []).map(item => [
    item.name, item.type, item.location, item.sessionsCount, item.booked, item.capacity, `${item.occupancyRate}%`
  ]);

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:Segoe UI,Arial,sans-serif;color:#0f172a;margin:28px;background:#ffffff}
    .header-banner{background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:white;padding:24px;border-radius:12px;margin-bottom:24px}
    h1{color:#f87171;margin:0 0 6px 0;font-size:22px;letter-spacing:-0.5px}
    .subtitle{color:#94a3b8;font-size:13px;margin:0}
    h2{margin:24px 0 10px;color:#1e293b;font-size:15px;font-weight:700;border-left:4px solid #dc2626;padding-left:10px}
    .meta{margin-top:12px;color:#cbd5e1;font-size:12px}
    .period{display:inline-block;background:#fee2e2;color:#991b1b;padding:3px 10px;border-radius:6px;font-weight:bold;font-size:11px}
    table{border-collapse:collapse;width:100%;margin-bottom:20px;font-size:12px}
    th{background:#0f172a;color:#ffffff;text-align:left;padding:10px 12px;border:1px solid #334155;font-weight:600}
    td{padding:8px 12px;border:1px solid #e2e8f0}
    tbody tr:nth-child(even){background:#f8fafc}
    tbody tr:hover{background:#f1f5f9}
    .summary td:first-child{font-weight:bold;background:#f8fafc;width:40%;color:#334155}
    .empty{text-align:center;color:#64748b;font-style:italic;padding:16px}
    .footer{margin-top:32px;color:#64748b;font-size:11px;border-top:1px solid #e2e8f0;padding-top:12px}
  </style></head><body>
    <div class="header-banner">
      <h1>BÁO CÁO DOANH THU & VẬN HÀNH TRUNG TÂM THỂ THAO OLYMPIC</h1>
      <p class="subtitle">Báo cáo kiểm soát doanh thu, hiệu suất huấn luyện viên, cơ cấu gói tập và công suất sân bãi.</p>
      <div class="meta">
        <span class="period">KỲ BÁO CÁO: ${escapeHtml(period)}</span> · Phạm vi dữ liệu: <strong>${escapeHtml(metrics.from)} đến ${escapeHtml(metrics.to)}</strong> · Xuất lúc: ${escapeHtml(new Date().toLocaleString('vi-VN'))}
      </div>
    </div>

    <h2>1. Bảng Chỉ Số KPI & Tổng Quan Quản Trị</h2>
    <table class="summary"><tbody>${summaryRows.map(row => `<tr><td>${excelText(row[0])}</td><td><strong>${excelText(row[1])}</strong></td></tr>`).join('')}</tbody></table>

    ${table('2. Đối Soát Doanh Thu Thuần Theo Kỳ', ['Kỳ (Thời gian)', 'Doanh thu gộp', 'Tiền hoàn', 'Doanh thu thuần'], revenueRows)}
    ${table('3. Doanh Thu Thuần Theo Bộ Môn', ['Bộ môn', 'Doanh thu gộp', 'Tiền hoàn', 'Doanh thu thuần', 'Tỷ trọng', 'Trạng thái phân bổ'], sportRevenueRows)}
    ${table('4. Cơ Cấu Gói Tập & Số Lượng Học Viên', ['Tên gói tập', 'Giá niêm yết', 'Thời hạn', 'Hội viên kích hoạt', 'Gói bán trong kỳ', 'Doanh thu gói'], packageRows)}
    ${table('5. Năng Suất & Tải Công Việc Huấn Luyện Viên', ['Họ tên HLV', 'Mã HLV', 'Chuyên môn', 'Trạng thái', 'Số lớp', 'Số ca dạy', 'Lượt học viên', 'Sức chứa', 'Tỷ lệ lấp đầy'], coachRows)}
    ${table('6. Hiệu Suất & Tỷ Lệ Lấp Đầy Lớp Học', ['Lớp học', 'Bộ môn', 'Coach phụ trách', 'Phòng tập', 'Số ca học', 'Đã đặt', 'Tổng chỗ', 'Tỷ lệ lấp đầy'], classRows)}
    ${table('7. Khai Thác Sân Bãi & Cơ Sở Vật Chất', ['Sân / Phòng', 'Loại hình', 'Vị trí', 'Số ca tổ chức', 'Khách tiếp nhận', 'Tổng chỗ', 'Tỷ lệ khai thác'], roomRows)}

    <div class="footer">Nguồn: Hệ thống Quản trị Trung tâm Thể thao SCMS · Báo cáo đối soát doanh thu tài chính và hoạt động vận hành chuẩn hóa.</div>
  </body></html>`;
}
