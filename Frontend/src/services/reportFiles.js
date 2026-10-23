import { reportDate, reportFilename, reportLabel, reportSections, reportSummary, validateReport } from './reportFileData.js';

const NAVY = '1E2235', GREEN = '2D6A4F', PALE = 'EDF5F1', INK = '253247';
const moneyFormat = '#,##0.## "VND";[Red](#,##0.##) "VND"';
const generatedTime = date => date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

/**
 * Finds SVG elements tagged with data-chart-id in the live DOM, renders each
 * onto an offscreen Canvas and returns a map of { chartId → dataURL }.
 * Safe to call in any browser environment; returns {} in non-browser contexts.
 */
export async function captureChartsAsImages({ scale = 2 } = {}) {
  if (typeof document === 'undefined') return {};
  const svgs = Array.from(document.querySelectorAll('svg[data-chart-id]'));
  const result = {};
  await Promise.all(svgs.map(svg => new Promise(resolve => {
    try {
      const id = svg.getAttribute('data-chart-id');
      const bbox = svg.getBoundingClientRect();
      const vb = svg.getAttribute('viewBox');
      let vbW, vbH;
      if (vb) { const parts = vb.split(/[\s,]+/); vbW = Number(parts[2]); vbH = Number(parts[3]); }
      const srcW = vbW || bbox.width || 640;
      const srcH = vbH || bbox.height || 220;

      // Serialize SVG with namespace and explicit dimensions
      const clone = svg.cloneNode(true);
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('width', String(srcW));
      clone.setAttribute('height', String(srcH));
      // Inline font-family so text renders in canvas
      clone.style.fontFamily = 'Arial, sans-serif';
      const serialized = new XMLSerializer().serializeToString(clone);
      const blob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(srcW * scale);
        canvas.height = Math.round(srcH * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, srcW, srcH);
        URL.revokeObjectURL(url);
        result[id] = canvas.toDataURL('image/png');
        resolve();
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
      img.src = url;
    } catch { resolve(); }
  })));
  return result;
}

function display(value, type) {
  if (value == null || value === '') return '—';
  if (type === 'date') return reportDate(value);
  if (type === 'text') return String(value);
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  const formatted = numeric.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  return type === 'money' ? `${formatted} VND` : type === 'percent' ? `${formatted}%` : formatted;
}

export function createReportPdfDefinition(metrics, options = {}) {
  validateReport(metrics);
  const t = (vi, en) => reportLabel(options.language, vi, en);
  const period = `${reportDate(metrics.from)} - ${reportDate(metrics.to)}`;
  const generated = generatedTime(options.generatedAt || new Date());
  const content = [
    { text: t('BÁO CÁO DOANH THU & VẬN HÀNH', 'REVENUE & OPERATIONS REPORT'), style: 'title' },
    { text: options.centerLabel || 'SCMS Olympic Sports Arena', style: 'subtitle' },
    { text: `${t('Phạm vi', 'Period')}: ${period}   |   ${t('Nhóm theo', 'Grouped by')}: ${metrics.groupBy === 'month' ? t('tháng', 'month') : t('ngày', 'day')}`, margin: [0, 6, 0, 4] },
    { text: `${t('Xuất lúc', 'Generated')}: ${generated} (GMT+7)   |   ${t('Đơn vị tiền tệ', 'Currency')}: VND`, style: 'muted', margin: [0, 0, 0, 18] },
    { columns: reportSummary(metrics, options.language).slice(0, 3).map(([label, value]) => ({
      stack: [{ text: label, color: `#${GREEN}`, fontSize: 10 }, { text: display(value, 'money'), fontSize: 21, bold: true, margin: [0, 5, 0, 0] }],
      margin: [0, 0, 16, 0]
    })), margin: [0, 0, 0, 18] },
    { table: { widths: ['*', 100], body: reportSummary(metrics, options.language).slice(3).map(([label, value, type]) => [label, { text: display(value, type), alignment: 'right', bold: true }]) }, layout: 'lightHorizontalLines', margin: [0, 0, 0, 10] },
    { text: t('Doanh thu và hội viên mới tính theo khoảng ngày đã chọn. Tổng hội viên, gói hiệu lực và đăng ký hiện tại là số liệu tại thời điểm xuất; check-in là của hôm nay.', 'Revenue and new members use the selected date range. Current members, active memberships and current bookings are snapshots; check-ins are for today.'), style: 'muted' }
  ];

  // Chart images section — inserted between KPI summary and data tables
  const ci = options.chartImages || {};
  const chartLabels = {
    'chart-revenue': t('Biểu đồ Doanh thu thuần theo kỳ', 'Net Revenue Trend'),
    'chart-members': t('Biểu đồ Hội viên mới', 'New Members Growth'),
    'chart-donut':   t('Thị phần Đặt chỗ theo Bộ môn', 'Sport Bookings Market Share'),
  };
  // Per-chart fit [maxW, maxH] — landscape A4 usable width ≈ 769 pt
  // Wide charts (bar/area): 350 × 185 when paired, 700 × 200 when solo
  // Combined donut+legend SVG (460×210 viewBox): fits nicely at 660×300
  const chartFit = {
    'chart-revenue': (solo) => solo ? [700, 200] : [350, 185],
    'chart-members': (solo) => solo ? [700, 200] : [350, 185],
    'chart-donut':   ()     => [660, 302],
  };
  const chartIds = ['chart-revenue', 'chart-members', 'chart-donut'];
  const availableCharts = chartIds.filter(id => ci[id]);
  if (availableCharts.length) {
    content.push(
      { text: t('BIỂU ĐỒ THỐNG KÊ TRỰC QUAN', 'VISUAL ANALYTICS CHARTS'), style: 'heading', headlineLevel: 1, pageBreak: 'before' },
      { text: t('Biểu đồ được chụp từ dashboard tại thời điểm xuất báo cáo.', 'Charts captured from the live dashboard at export time.'), style: 'muted', margin: [0, 0, 0, 14] }
    );
    // Pair charts 2 per row
    for (let i = 0; i < availableCharts.length; i += 2) {
      const pair = availableCharts.slice(i, i + 2);
      const isSolo = pair.length === 1;
      const colDefs = pair.map(id => {
        const [fw, fh] = (chartFit[id] || (() => [350, 185]))(isSolo);
        return {
          stack: [
            { text: chartLabels[id] || id, bold: true, fontSize: 9, color: `#${NAVY}`, margin: [0, 0, 0, 4] },
            { image: ci[id], fit: [fw, fh], alignment: isSolo ? 'center' : 'left' }
          ],
          margin: [0, 0, isSolo ? 0 : 14, 0]
        };
      });
      if (isSolo) {
        // Center solo chart via wrapper column
        content.push({ columns: [{ width: '*', text: '' }, { width: 'auto', stack: colDefs[0].stack }, { width: '*', text: '' }], margin: [0, 0, 0, 18] });
      } else {
        content.push({ columns: colDefs, margin: [0, 0, 0, 18] });
      }
    }
  }

  for (const section of reportSections(metrics, options.language)) {
    content.push({ text: section.name, style: 'heading', headlineLevel: 1 });
    if (!section.rows.length) {
      content.push({ text: t('Không có dữ liệu trong phạm vi này.', 'No data in this range.'), style: 'muted', margin: [0, 0, 0, 10] });
      continue;
    }
    const dense = section.columns.length > 6;
    const widths = section.columns.map(column => column.type === 'text' ? '*' : column.type === 'date' ? 72 : column.type === 'money' ? 98 : 51);
    content.push({
      table: {
        headerRows: 1, dontBreakRows: true, keepWithHeaderRows: 1, widths,
        body: [section.columns.map(column => ({ text: column.label, bold: true, color: '#FFFFFF', fillColor: `#${GREEN}`, alignment: ['number', 'money', 'percent'].includes(column.type) ? 'right' : 'left' })),
          ...section.rows.map(row => row.map((value, index) => ({ text: display(value, section.columns[index].type), alignment: ['number', 'money', 'percent'].includes(section.columns[index].type) ? 'right' : 'left' })))]
      },
      fontSize: dense ? 8.5 : 9,
      layout: {
        fillColor: row => row === 0 ? `#${GREEN}` : row % 2 === 0 ? '#F3F6F8' : '#FFFFFF',
        hLineWidth: () => 0, vLineWidth: () => 0,
        paddingLeft: () => 7, paddingRight: () => 7, paddingTop: () => 7, paddingBottom: () => 7
      }, margin: [0, 0, 0, 8]
    });
  }
  return {
    pageSize: 'A4', pageOrientation: 'landscape', pageMargins: [36, 44, 36, 38],
    info: { title: `SCMS - ${period}`, author: 'SCMS', subject: t('Báo cáo thống kê trung tâm', 'Sports center analytics report') },
    defaultStyle: { font: 'Roboto', fontSize: 10, color: `#${INK}` },
    styles: {
      title: { fontSize: 22, bold: true, color: `#${NAVY}` }, subtitle: { fontSize: 12, color: `#${GREEN}`, margin: [0, 7, 0, 0] },
      heading: { fontSize: 13, bold: true, color: `#${NAVY}`, margin: [0, 18, 0, 8] }, muted: { fontSize: 9, color: '#526176', lineHeight: 1.25 }
    },
    header: { columns: [{ text: 'SCMS  /  OLYMPIC ANALYTICS', bold: true }, { text: period, alignment: 'right' }], fontSize: 8, color: '#526176', margin: [36, 18, 36, 0] },
    footer: (page, pages) => ({ columns: [{ text: options.centerLabel || 'SCMS' }, { text: `${t('Trang', 'Page')} ${page} / ${pages}`, alignment: 'right' }], fontSize: 8, color: '#526176', margin: [36, 12, 36, 0] }),
    pageBreakBefore: (currentNode, followingNodesOnPage) => currentNode.headlineLevel === 1 && followingNodesOnPage.length === 0,
    content
  };
}

export async function createReportPdf(metrics, options = {}) {
  // Capture live SVG charts from the DOM before building the PDF definition
  const chartImages = options.chartImages || (typeof document !== 'undefined' ? await captureChartsAsImages() : {});
  const definition = createReportPdfDefinition(metrics, { ...options, chartImages });
  const [engineModule, fontsModule] = await Promise.all([import('pdfmake/build/pdfmake.js'), import('pdfmake/build/vfs_fonts.js')]);
  const pdfMake = engineModule.default || engineModule;
  pdfMake.addVirtualFileSystem(fontsModule.default || fontsModule);
  return new Promise((resolve, reject) => {
    try { pdfMake.createPdf(definition).getBuffer(buffer => resolve(new Uint8Array(buffer))); }
    catch (error) { reject(error); }
  });
}

export async function createReportWorkbook(metrics, options = {}) {
  validateReport(metrics);
  const excelModule = await import('exceljs');
  const ExcelJS = excelModule.default || excelModule;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SCMS'; workbook.created = options.generatedAt || new Date();
  const t = (vi, en) => reportLabel(options.language, vi, en);
  const period = `${reportDate(metrics.from)} - ${reportDate(metrics.to)}`;
  const prepare = (name, columns) => {
    const sheet = workbook.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 5 }],
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '1:5' } });
    sheet.columns = columns.map(column => ({ width: column.width || 22 }));
    sheet.mergeCells(1, 1, 1, Math.max(2, columns.length));
    sheet.getCell('A1').value = name.toUpperCase();
    sheet.getCell('A1').font = { name: 'Calibri', size: 19, bold: true, color: { argb: NAVY } };
    sheet.getRow(1).height = 34;
    sheet.mergeCells(2, 1, 2, Math.max(2, columns.length));
    sheet.getCell('A2').value = `${options.centerLabel || 'SCMS Olympic Sports Arena'} | ${period}`;
    sheet.getCell('A2').font = { name: 'Calibri', size: 11, color: { argb: GREEN } };
    sheet.getCell('A3').value = `${t('Xuất lúc', 'Generated')}: ${generatedTime(workbook.created)} (GMT+7)`;
    sheet.mergeCells(3, 1, 3, Math.max(2, columns.length));
    sheet.headerFooter.oddFooter = `SCMS | ${period} &R${t('Trang', 'Page')} &P / &N`;
    sheet.properties.defaultRowHeight = 24;
    return sheet;
  };
  const addTable = (sheet, section, headerRow) => {
    const head = sheet.getRow(headerRow);
    head.values = section.columns.map(column => column.label);
    head.height = 30;
    head.eachCell(cell => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
    section.rows.forEach((values, index) => {
      const row = sheet.getRow(headerRow + index + 1);
      row.height = Math.max(26, ...values.map((value, i) => section.columns[i].type === 'text' ? Math.ceil(String(value || '').length / Math.max(10, section.columns[i].width - 3)) * 17 + 8 : 26));
      values.forEach((value, i) => {
        const column = section.columns[i], cell = row.getCell(i + 1);
        const numeric = value != null && value !== '' && Number.isFinite(Number(value));
        cell.value = column.type === 'date' ? (value ? new Date(`${String(value).slice(0, 10)}T00:00:00Z`) : null)
          : ['number', 'money', 'percent'].includes(column.type) && numeric ? (column.type === 'percent' ? Number(value) / 100 : Number(value))
          : value == null ? null : String(value);
        cell.numFmt = column.type === 'money' ? moneyFormat : column.type === 'percent' ? '0.0%' : column.type === 'date' ? 'dd/mm/yyyy' : column.type === 'number' ? '#,##0' : '@';
        cell.font = { name: 'Calibri', size: 11, color: { argb: INK } };
        cell.alignment = { vertical: 'middle', wrapText: true, horizontal: ['number', 'money', 'percent'].includes(column.type) ? 'right' : 'left' };
        if (index % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALE } };
      });
    });
    if (!section.rows.length) sheet.getCell(headerRow + 1, 1).value = t('Không có dữ liệu trong phạm vi này.', 'No data in this range.');
    sheet.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: headerRow + section.rows.length, column: section.columns.length } };
    return headerRow + Math.max(1, section.rows.length) + 1;
  };
  const summaryColumns = [{ label: t('Chỉ tiêu', 'Metric'), type: 'text', width: 48 }, { label: t('Giá trị', 'Value'), type: 'number', width: 26 }];
  const summary = prepare(t('Tổng quan', 'Summary'), summaryColumns);
  const summaryValues = reportSummary(metrics, options.language);
  addTable(summary, { columns: summaryColumns, rows: summaryValues.map(([label, value]) => [label, value]) }, 5);
  summaryValues.forEach(([, , type], index) => { summary.getCell(index + 6, 2).numFmt = type === 'money' ? moneyFormat : type === 'percent' ? '0.0"%"' : '#,##0'; });
  summary.mergeCells('A16:B18');
  summary.getCell('A16').value = t('Doanh thu và hội viên mới: theo kỳ đã chọn. Hội viên, gói hiệu lực và đăng ký hiện tại: tại thời điểm xuất. Check-in: hôm nay. Đơn vị tiền tệ: VND.', 'Revenue and new members: selected period. Current members, active memberships and bookings: export-time snapshots. Check-ins: today. Currency: VND.');
  summary.getCell('A16').alignment = { wrapText: true, vertical: 'middle' };
  const usedSheets = new Map();
  for (const section of reportSections(metrics, options.language)) {
    let current = usedSheets.get(section.sheet);
    if (!current) { current = { sheet: prepare(section.sheet, section.columns), nextRow: 5 }; usedSheets.set(section.sheet, current); }
    else {
      current.nextRow += 2;
      current.sheet.getCell(current.nextRow, 1).value = section.name;
      current.sheet.getCell(current.nextRow, 1).font = { bold: true, size: 13, color: { argb: NAVY } };
      current.nextRow += 1;
      section.columns.forEach((column, index) => { current.sheet.getColumn(index + 1).width = Math.max(current.sheet.getColumn(index + 1).width || 0, column.width); });
    }
    current.nextRow = addTable(current.sheet, section, current.nextRow);
  }
  return workbook;
}

export async function createReportExcel(metrics, options = {}) {
  const workbook = await createReportWorkbook(metrics, options);
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}

export async function downloadReportFile(metrics, options, format) {
  if (!['pdf', 'xlsx'].includes(format)) throw new Error('Định dạng báo cáo không được hỗ trợ.');
  const bytes = format === 'pdf' ? await createReportPdf(metrics, options) : await createReportExcel(metrics, options);
  const type = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = reportFilename(metrics, format);
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
