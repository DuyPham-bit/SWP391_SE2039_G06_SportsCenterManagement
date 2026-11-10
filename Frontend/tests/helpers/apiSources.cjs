// Test helper for the API layer, which is split across entities/<x>/api modules.
// apiSource(): every API module concatenated in dependency order, with import lines and
//   export keywords removed, so tests can evaluate it in a vm context with stubbed
//   http/authState functions or match its text.
// apiEntry(): ESM source that re-exports every API object, for esbuild `stdin` bundles.
const fs = require('node:fs');
const path = require('node:path');

const SRC = path.resolve(__dirname, '../../src');

// Order matters: helpers must be declared before the objects that use them at call time.
const API_MODULES = [
  'shared/api/apiUtils.js',
  'shared/lib/avatarHelper.js',
  'entities/member/api/mapMember.js',
  'entities/class/api/classApi.js',
  'entities/session/api/authApi.js',
  'entities/membership/api/packageApi.js',
  'entities/booking/api/bookingApi.js',
  'entities/staff/api/staffApi.js',
  'entities/facility/api/roomApi.js',
  'entities/member/api/receptionApi.js',
  'entities/member/api/memberApi.js',
  'entities/report/api/reportApi.js',
  'entities/permission/api/systemApi.js',
  'entities/center/api/adminApi.js',
  'entities/coach/api/coachApi.js',
  'entities/coach/api/coachProfessionalApi.js',
  'entities/coach/api/memberCoachApi.js',
  'entities/coach/api/managerCoachApi.js',
  'entities/notification/api/notificationApi.js',
  'entities/support-request/api/supportApi.js',
  'entities/payment/api/refundApi.js',
  'entities/payment/api/paymentReturnApi.js',
  'entities/payroll/api/payrollApi.js',
  'entities/ai-chat/api/aiApi.js'
];

const API_OBJECTS = {
  'entities/session/api/authApi.js': ['authApi'],
  'entities/membership/api/packageApi.js': ['packageApi'],
  'entities/class/api/classApi.js': ['classApi'],
  'entities/booking/api/bookingApi.js': ['bookingApi'],
  'entities/staff/api/staffApi.js': ['staffApi'],
  'entities/facility/api/roomApi.js': ['roomApi'],
  'entities/member/api/receptionApi.js': ['receptionApi'],
  'entities/member/api/memberApi.js': ['memberApi'],
  'entities/report/api/reportApi.js': ['reportApi'],
  'entities/permission/api/systemApi.js': ['systemApi'],
  'entities/center/api/adminApi.js': ['adminApi'],
  'entities/coach/api/coachApi.js': ['coachApi'],
  'entities/coach/api/coachProfessionalApi.js': ['coachProfessionalApi'],
  'entities/coach/api/memberCoachApi.js': ['memberCoachApi'],
  'entities/coach/api/managerCoachApi.js': ['managerCoachApi'],
  'entities/notification/api/notificationApi.js': ['notificationApi'],
  'entities/support-request/api/supportApi.js': ['supportApi'],
  'entities/payment/api/refundApi.js': ['refundApi'],
  'entities/payment/api/paymentReturnApi.js': ['paymentReturnApi'],
  'entities/payroll/api/payrollApi.js': ['payrollApi'],
  'entities/ai-chat/api/aiApi.js': ['aiApi']
};

function apiSource() {
  return API_MODULES
    .map(file => fs.readFileSync(path.join(SRC, file), 'utf8')
      .replace(/^import .*;\r?\n/gm, '')
      .replace(/^export \{[^}]*\}( from '[^']*')?;?\r?\n/gm, '')
      .replace(/^export (?=(async )?(function|const|let|class) )/gm, ''))
    .join('\n');
}

function apiEntry() {
  return Object.entries(API_OBJECTS)
    .map(([file, names]) => `export { ${names.join(', ')} } from './${file}';`)
    .join('\n');
}

module.exports = { SRC, apiSource, apiEntry };
