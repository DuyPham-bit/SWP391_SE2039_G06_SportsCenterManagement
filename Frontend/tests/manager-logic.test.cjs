const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { transformSync } = require('esbuild');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const read = (relPath) => fs.readFileSync(path.join(__dirname, '../../', relPath), 'utf8');

test('ReportsController handles uppercase ADMIN role claim consistently', () => {
  const src = read('Backend/SportsCenterManagement.API/Controllers/ReportsController.cs');
  assert.match(src, /User\.IsInRole\("ADMIN"\)/);
});

test('ManagerDashboard and ManagerOverviewCharts compute court availability and member stats without fake fallbacks', () => {
  const dashboard = read('Frontend/src/pages/manager-dashboard/ui/ManagerDashboard.jsx');
  const charts = read('Frontend/src/pages/manager-dashboard/ui/ManagerOverviewCharts.jsx');

  assert.doesNotMatch(dashboard, /vacantRooms = Math\.max\(0, totalRooms - activeRooms\)/);
  assert.match(dashboard, /inUseRooms/);
  assert.match(dashboard, /shortcuts\.length/);

  assert.doesNotMatch(charts, /100% Khả dụng/);
  assert.doesNotMatch(charts, /\/10 sân mở lớp/);
  assert.doesNotMatch(charts, /Sẵn sàng 100%/);
  assert.doesNotMatch(charts, /totalBookings \|\| 199/);
  assert.doesNotMatch(charts, /totalClasses \|\| 87/);
  assert.doesNotMatch(charts, /totalMembers = 7/);
  assert.doesNotMatch(charts, /totalMembers \|\| 7/);
  assert.doesNotMatch(charts, /Giữ chân 100%/);
});

test('manager-reports UI and charts do not render hardcoded deltas, sine waves, or placeholder names', () => {
  const kpi = read('Frontend/src/pages/manager-reports/ui/ExecutiveKpiCards.jsx');
  const gauges = read('Frontend/src/pages/manager-reports/ui/PerformanceGaugesRow.jsx');
  const salesRow = read('Frontend/src/pages/manager-reports/ui/SalesOverviewRow.jsx');
  const activity = read('Frontend/src/pages/manager-reports/ui/ClassesActivityRow.jsx');
  const activeUsers = read('Frontend/src/pages/manager-reports/ui/charts/VisionActiveUsersChart.jsx');
  const salesOverview = read('Frontend/src/pages/manager-reports/ui/charts/VisionSalesOverviewChart.jsx');
  const insights = read('Frontend/src/pages/manager-reports/ui/OperationalInsights.jsx');

  assert.doesNotMatch(kpi, />(\+12%|\+5%)</);
  assert.doesNotMatch(kpi, /Today's Money|Today's Users|Total Sales/);
  assert.doesNotMatch(gauges, /8\.5 \+/);
  assert.doesNotMatch(salesRow, /classStatusCounts\?\.Confirmed/);
  assert.doesNotMatch(activity, /\+30%/);
  assert.doesNotMatch(activity, /Lớp bơi K01 hoạt động|Bể bơi Olympic/);
  assert.doesNotMatch(activeUsers, /\(\+23%\)/);
  assert.doesNotMatch(salesOverview, /Math\.sin/);
  assert.doesNotMatch(salesOverview, /\(\+12%\)/);
  assert.doesNotMatch(insights, /topClass\?\.name \|\| 'Top 1'/);
});

test('MembersMetrics uses pageCount denominator when paginated and reports 0% when empty', () => {
  const source = read('Frontend/src/pages/manager-members/ui/MembersMetrics.jsx');
  const module = { exports: {} };
  const context = vm.createContext({
    module,
    Math,
    Number,
    require: (id) => {
      if (id === 'react') return React;
      throw new Error(`Unexpected dependency: ${id}`);
    }
  });
  vm.runInContext(transformSync(source, { loader: 'jsx', format: 'cjs' }).code, context);
  const { MembersMetrics } = module.exports;

  const emptyHtml = renderToStaticMarkup(React.createElement(MembersMetrics, {
    isEn: false,
    stats: { total: 0, pageCount: 0, active: 0, hasPackage: 0, disabled: 0 }
  }));
  assert.match(emptyHtml, />0%</);

  const pagedHtml = renderToStaticMarkup(React.createElement(MembersMetrics, {
    isEn: false,
    stats: { total: 50, pageCount: 20, active: 20, hasPackage: 10, disabled: 0 }
  }));
  assert.match(pagedHtml, />100%</);
  assert.match(pagedHtml, /trang hiện tại/);
});

test('manage_roles capability maps to admin roles-permissions route and ADMIN defaultRole', () => {
  const src = read('Frontend/src/entities/permission/model/permissions.js');
  assert.match(src, /id: 'manage_roles'[\s\S]*?path: '#\/admin\/roles-permissions'[\s\S]*?defaultRole: 'ADMIN'/);
});
