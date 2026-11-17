const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const SRC = path.join(__dirname, '../src');

const MANAGER_HERO_FILES = [
  'pages/manager-dashboard/ui/ManagerDashboard.jsx',
  'pages/counter-invoices/ui/CounterInvoices.jsx',
  'pages/payroll/ui/PayrollHeader.jsx',
  'pages/manager-members/ui/MembersHeroBanner.jsx',
  'pages/manager-staff/ui/StaffHeroBanner.jsx',
  'pages/manager-packages/ui/PackageManagement.jsx',
  'pages/manager-classes-rooms/ui/ClassesHeroBanner.jsx',
  'pages/manager-classes-rooms/ui/ScheduleManager.jsx',
  'pages/manager-coach-assignment/ui/AssignmentHeroBanner.jsx',
  'pages/manager-reports/ui/ReportsHeroBanner.jsx',
  'pages/manager-reports/ui/PerformanceGaugesRow.jsx',
  'pages/manager-coach-operations/ui/ManagerCoachOperations.jsx',
  'pages/manager-support/ui/ManagerSupportCommunications.jsx',
  'pages/manager-home-content/ui/HomeContentHeader.jsx',
  'pages/audit-logs/ui/AuditLogs.jsx'
];

test('shared ScmsHeroBanner defines scms-hero choreography and sage-teal-sand palette tokens', () => {
  const heroModule = fs.readFileSync(path.join(SRC, 'shared/ui/ScmsHeroBanner.jsx'), 'utf8');
  assert.match(heroModule, /SCMS_HERO_SECTION_CLASS\s*=/);
  assert.match(heroModule, /\bscms-hero\b/);
  assert.match(heroModule, /from-brand-sage-700\s+via-brand-teal-600\s+via-brand-teal-500\s+to-brand-sand-500/);
  assert.match(heroModule, /dark:from-brand-sage-900\s+dark:via-brand-teal-900\s+dark:via-brand-teal-800\s+dark:to-brand-sand-900/);
  assert.match(heroModule, /scms-shine/);
  assert.match(heroModule, /<path[^>]+strokeDasharray/);
});

test('all Manager portal hero banners use shared SCMS_HERO_SECTION_CLASS and ScmsHeroDecor without hardcoded inline gradients', () => {
  for (const relPath of MANAGER_HERO_FILES) {
    const content = fs.readFileSync(path.join(SRC, relPath), 'utf8');
    assert.ok(content.includes('SCMS_HERO_SECTION_CLASS'), `${relPath} must use SCMS_HERO_SECTION_CLASS`);
    assert.ok(content.includes('<ScmsHeroDecor'), `${relPath} must render <ScmsHeroDecor />`);
    assert.doesNotMatch(content, /linear-gradient\(/, `${relPath} must not contain inline CSS linear-gradient`);
    assert.doesNotMatch(content, /from-brand-navy-900\s+via-brand-navy-900/, `${relPath} must not revert to plain navy hero banner`);
  }
});
