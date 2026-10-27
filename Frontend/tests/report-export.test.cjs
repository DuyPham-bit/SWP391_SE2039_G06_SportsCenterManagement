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

function loadReportFileData() {
  const source = fs.readFileSync(path.join(__dirname, '../src/services/reportFileData.js'), 'utf8')
    .replaceAll('export function ', 'function ')
    .replace('export const reportLabel', 'const reportLabel');
  const context = vm.createContext({ Math, Number });
  vm.runInContext(`${source}\nglobalThis.reportData = { reportSummary, reportSections };`, context);
  return context.reportData;
}

test('CSV export includes auditable revenue totals and sport allocation', () => {
  const csv = loadCreateReportCsv()({
    from: '2026-10-01', to: '2026-10-15', groupBy: 'day', grossRevenue: 1200000,
    refundedRevenue: 200000, netRevenue: 1000000, totalMembers: 3, activeMembers: 2,
    membersWithPackage: 2, membersWithoutPackage: 1, expiredMembers: 1,
    newMembers: 1, totalBookings: 2, todayCheckins: 1,
    revenuePeriods: [{ periodStart: '2026-10-01', gross: 1200000, refunds: 200000, net: 1000000 }],
    revenueBySport: [{ sportId: 1, sportName: 'Bơi lội', gross: 1200000, refunds: 200000, net: 1000000, share: 100 }],
    coaches: [{ fullName: 'HLV Minh', specialization: 'Bơi lội', classesCount: 1, sessionsCount: 3, booked: 8, capacity: 10, occupancyRate: 80 }]
  }, 'MONTH');
  assert.match(csv, /BÁO CÁO DOANH THU/);
  assert.match(csv, /DOANH THU THEO BỘ MÔN/);
  assert.match(csv, /Bơi lội/);
  assert.match(csv, /1200000/);
  assert.match(csv, /200000/);
  assert.match(csv, /Hội viên có gói hiệu lực","2/);
  assert.match(csv, /Hội viên chưa có gói hiệu lực","1/);
  assert.match(csv, /HIỆU SUẤT HUẤN LUYỆN VIÊN/);
  assert.match(csv, /HLV Minh/);
});

test('CSV export neutralizes spreadsheet formulas from labels', () => {
  const csv = loadCreateReportCsv()({
    from: '2026-10-15', to: '2026-10-15', groupBy: 'day', totalMembers: 0,
    activeMembers: 0, newMembers: 0, totalBookings: 0, todayCheckins: 0,
    revenueBySport: [{ sportId: 1, sportName: '=HYPERLINK("bad")', gross: 1, refunds: 0, net: 1, share: 100 }]
  }, 'DAY');
  assert.match(csv, /"'=HYPERLINK/);
});

test('PDF and Excel report data includes package distribution and coach performance', () => {
  const { reportSummary, reportSections } = loadReportFileData();
  const metrics = {
    from: '2026-10-01', to: '2026-10-15', totalMembers: 5, activeMembers: 3,
    membersWithPackage: 3, membersWithoutPackage: 2,
    coaches: [{ fullName: 'HLV Minh', coachCode: 'C01', specialization: 'Bơi lội', status: 'Active', classesCount: 1, sessionsCount: 3, booked: 8, capacity: 10, occupancyRate: 80 }]
  };
  const summary = Array.from(reportSummary(metrics)).map(row => Array.from(row));
  assert.deepEqual(summary.find(row => row[0] === 'Hội viên có gói hiệu lực').slice(0, 2), ['Hội viên có gói hiệu lực', 3]);
  assert.deepEqual(summary.find(row => row[0] === 'Hội viên chưa có gói hiệu lực').slice(0, 2), ['Hội viên chưa có gói hiệu lực', 2]);
  const coachSection = Array.from(reportSections(metrics)).find(section => section.name === 'Hiệu suất huấn luyện viên');
  assert.ok(coachSection);
  assert.deepEqual(Array.from(coachSection.rows[0]), ['HLV Minh', 'C01', 'Bơi lội', 'Active', 1, 3, 8, 10, 80]);
});
