const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function loadCreateReportCsv() {
  const source = fs.readFileSync(path.join(__dirname, '../src/services/reportExport.js'), 'utf8')
    .replace('export function createReportCsv', 'function createReportCsv');
  const context = vm.createContext({ Date });
  vm.runInContext(`${source}\nglobalThis.createReportCsv = createReportCsv;`, context);
  return context.createReportCsv;
}

test('CSV export includes auditable revenue totals and sport allocation', () => {
  const csv = loadCreateReportCsv()({
    from: '2026-10-01', to: '2026-10-15', groupBy: 'day', grossRevenue: 1200000,
    refundedRevenue: 200000, netRevenue: 1000000, totalMembers: 3, activeMembers: 2,
    newMembers: 1, totalBookings: 2, todayCheckins: 1,
    revenuePeriods: [{ periodStart: '2026-10-01', gross: 1200000, refunds: 200000, net: 1000000 }],
    revenueBySport: [{ sportId: 1, sportName: 'Bơi lội', gross: 1200000, refunds: 200000, net: 1000000, share: 100 }]
  }, 'MONTH');
  assert.match(csv, /BÁO CÁO DOANH THU/);
  assert.match(csv, /DOANH THU THEO BỘ MÔN/);
  assert.match(csv, /Bơi lội/);
  assert.match(csv, /1200000/);
  assert.match(csv, /200000/);
});

test('CSV export neutralizes spreadsheet formulas from labels', () => {
  const csv = loadCreateReportCsv()({
    from: '2026-10-15', to: '2026-10-15', groupBy: 'day', totalMembers: 0,
    activeMembers: 0, newMembers: 0, totalBookings: 0, todayCheckins: 0,
    revenueBySport: [{ sportId: 1, sportName: '=HYPERLINK("bad")', gross: 1, refunds: 0, net: 1, share: 100 }]
  }, 'DAY');
  assert.match(csv, /"'=HYPERLINK/);
});
