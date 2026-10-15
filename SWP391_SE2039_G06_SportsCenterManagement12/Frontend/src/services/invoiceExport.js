const money = value => `${Number(value || 0).toLocaleString('vi-VN')} VNĐ`;
const date = value => value ? new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—';
export const invoiceStatus = status => ({ Paid: 'Đã thu đủ', PartiallyPaid: 'Thu một phần', Issued: 'Chưa thanh toán', Pending: 'Chờ thanh toán', Cancelled: 'Đã hủy', Refunded: 'Đã hoàn tiền' }[status] || status);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cell = value => `"${String(value ?? '').replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""')}"`;

export function invoiceCsv(invoice) {
  const rows = [['Hóa đơn', invoice.invoiceNumber], ['Trung tâm', invoice.centerName], ['Địa chỉ', invoice.centerAddress],
    ['Thành viên', invoice.memberName], ['Mã thành viên', invoice.memberCode], ['Ngày lập (Việt Nam)', date(invoice.issuedAtUtc)],
    ['Trạng thái', invoiceStatus(invoice.status)], ['Tạm tính', invoice.subtotal], ['Giảm giá', invoice.discount], ['Thuế', invoice.tax],
    ['Tổng tiền', invoice.totalAmount], ['Đã thanh toán', invoice.amountPaid], ['Còn phải thu', invoice.outstandingBalance], [],
    ['Dịch vụ', 'Số lượng', 'Đơn giá', 'Thành tiền'], ...invoice.items.map(i => [i.description, i.quantity, i.unitPrice, i.amount]), [],
    ['Giao dịch', 'Phương thức', 'Trạng thái', 'Số tiền', 'Thời gian (Việt Nam)'],
    ...invoice.payments.map(p => [p.transactionCode, p.paymentMethod, p.status, p.amount, date(p.paidAtUtc || p.createdAtUtc)]), [],
    ['Hoàn tiền', 'Giao dịch', 'Trạng thái', 'Số tiền', 'Lý do'],
    ...invoice.payments.flatMap(p => (p.refunds || []).map(r => [r.id, p.transactionCode, r.status, r.amount, r.reason]))];
  return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n');
}

export function invoiceHtml(invoice) {
  const e = escape;
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Hóa đơn ${e(invoice.invoiceNumber)}</title>
  <style>body{font:14px Arial,sans-serif;color:#172033;max-width:850px;margin:32px auto;padding:0 20px}h1{font-size:24px}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{text-align:left;border-bottom:1px solid #ddd;padding:9px;overflow-wrap:anywhere}p{overflow-wrap:anywhere}.totals{margin-left:auto;max-width:330px}small{color:#555}@page{size:A4;margin:16mm}@media print{body{margin:0;padding:0}tr{break-inside:avoid}}</style></head><body>
  <h1>Hóa đơn thu tiền</h1><h2>${e(invoice.centerName)}</h2><p>${e(invoice.centerAddress)}</p>
  <p>Mã hóa đơn: <strong>${e(invoice.invoiceNumber)}</strong></p><p>Ngày lập: ${e(date(invoice.issuedAtUtc))} (giờ Việt Nam)</p>
  <p>Thành viên: ${e(invoice.memberName)} · ${e(invoice.memberCode)}</p><p>Trạng thái: ${e(invoiceStatus(invoice.status))}</p>
  <table><thead><tr><th>Dịch vụ</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>${invoice.items.map(i => `<tr><td>${e(i.description)}</td><td>${e(i.quantity)}</td><td>${e(money(i.unitPrice))}</td><td>${e(money(i.amount))}</td></tr>`).join('')}</tbody></table>
  <div class="totals"><p>Tạm tính: ${e(money(invoice.subtotal))}</p><p>Giảm giá: ${e(money(invoice.discount))}</p><p>Thuế: ${e(money(invoice.tax))}</p><p><strong>Tổng tiền: ${e(money(invoice.totalAmount))}</strong></p><p>Đã thanh toán: ${e(money(invoice.amountPaid))}</p><p><strong>Còn phải thu: ${e(money(invoice.outstandingBalance))}</strong></p></div>
  <h2>Lịch sử thanh toán</h2><table><thead><tr><th>Giao dịch</th><th>Phương thức</th><th>Trạng thái</th><th>Số tiền</th></tr></thead><tbody>${invoice.payments.map(p => `<tr><td>${e(p.transactionCode)}<br><small>${e(date(p.paidAtUtc || p.createdAtUtc))}</small></td><td>${e(p.paymentMethod)}</td><td>${e(p.status)}</td><td>${e(money(p.amount))}</td></tr>`).join('')}</tbody></table>
  ${invoice.payments.flatMap(p => (p.refunds || []).map(r => `<p>Hoàn tiền ${e(r.id)}: ${e(money(r.amount))} · ${e(r.status)} · ${e(r.reason)}</p>`)).join('')}
  <small>Chứng từ thu tiền từ hệ thống SCMS.</small></body></html>`;
}

export function downloadInvoice(invoice) {
  const url = URL.createObjectURL(new Blob([invoiceCsv(invoice)], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `SCMS-invoice-${invoice.invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '')}.csv`;
  document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function printInvoice(invoice) {
  const frame = document.createElement('iframe'); frame.title = `In hóa đơn ${invoice.invoiceNumber}`;
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;left:-9999px';
  frame.onload = () => { frame.contentWindow.onafterprint = () => frame.remove(); frame.contentWindow.focus(); frame.contentWindow.print(); };
  frame.srcdoc = invoiceHtml(invoice); document.body.appendChild(frame);
}
