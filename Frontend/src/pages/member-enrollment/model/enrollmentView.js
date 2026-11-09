// Pure view helpers for member self-enrollment (sport → coach → class).
// Eligibility is decided by the backend; these helpers only shape it for display.

const DAY_VI = { 1: 'Thứ 2', 2: 'Thứ 3', 3: 'Thứ 4', 4: 'Thứ 5', 5: 'Thứ 6', 6: 'Thứ 7', 7: 'Chủ nhật' };
const DAY_EN = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun' };

const hhmm = value => String(value || '').slice(0, 5);

export function formatSchedules(schedules, isEn) {
  return [...(schedules || [])]
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || hhmm(a.startTime).localeCompare(hhmm(b.startTime)))
    .map(s => `${(isEn ? DAY_EN : DAY_VI)[s.dayOfWeek] || s.dayOfWeek} · ${hhmm(s.startTime)}–${hhmm(s.endTime)}`);
}

export function seatsLeft(cls) {
  return Math.max(0, Number(cls.capacity || 0) - Number(cls.enrolledCount || 0));
}

/** 'enrolled' | 'available' | 'blocked' */
export function classState(cls) {
  if (cls.enrollmentId) return 'enrolled';
  if (cls.eligibleSubscriptionId) return 'available';
  return 'blocked';
}

export function summarizeCoach(coach) {
  const classes = coach.classes || [];
  return {
    availableCount: classes.filter(c => classState(c) === 'available').length,
    isEnrolled: classes.some(c => classState(c) === 'enrolled'),
    ratingLabel: coach.averageRating == null ? null : Number(coach.averageRating).toFixed(1)
  };
}

export function summarizeSport(sport) {
  const classes = (sport.coaches || []).flatMap(c => c.classes || []);
  const blocked = classes.find(c => classState(c) === 'blocked');
  return {
    coachCount: (sport.coaches || []).length,
    availableCount: classes.filter(c => classState(c) === 'available').length,
    isEnrolled: Boolean(sport.isEnrolled) || classes.some(c => classState(c) === 'enrolled'),
    blockedCode: blocked ? blocked.blockedCode : null
  };
}

export function packageUsage(subscriptions) {
  return (subscriptions || []).map(s => ({
    subscriptionId: s.subscriptionId,
    packageName: s.packageName,
    sportsUsed: (s.usedSportIds || []).length,
    sportsAllowed: s.allowedSports,
    classesUsed: s.usedClasses || 0,
    classesAllowed: s.maxClasses ?? null
  }));
}

const BLOCKED_EN = {
  CLASS_FULL: 'This class is full.',
  NO_PACKAGE: 'You need an active package to enroll.',
  SPORT_LIMIT: 'Your package has used all allowed sports. Upgrade to add a new sport.',
  CLASS_LIMIT: 'Your package has used all allowed classes.'
};

/** Backend sends the Vietnamese reason; English UI maps it from the stable code. */
export function blockedMessage(cls, isEn) {
  if (!cls || !cls.blockedCode) return null;
  return isEn ? (BLOCKED_EN[cls.blockedCode] || cls.blockedReason) : (cls.blockedReason || BLOCKED_EN[cls.blockedCode]);
}

const ERROR_MAP = [
  [/class is full/i, 'Lớp đã đủ chỗ, vui lòng chọn lớp hoặc HLV khác.', 'This class is full. Please pick another class or coach.'],
  [/sport allowance/i, 'Gói tập đã dùng hết số môn được phép. Hãy nâng cấp gói để học thêm môn mới.', 'Your package has used all allowed sports. Upgrade to add a new sport.'],
  [/class allowance/i, 'Gói tập đã dùng hết số lớp được phép.', 'Your package has used all allowed classes.'],
  [/active membership is required/i, 'Bạn cần có gói tập còn hiệu lực để đăng ký lớp.', 'You need an active package to enroll.'],
  [/already enrolled/i, 'Bạn đã đăng ký lớp này rồi.', 'You are already enrolled in this class.'],
  [/not open for enrollment/i, 'Lớp chưa mở đăng ký hoặc đã đóng.', 'This class is not open for enrollment.'],
  [/primary coach/i, 'Lớp hiện chưa có HLV phụ trách, vui lòng chọn lớp khác.', 'This class has no active coach right now.']
];

export function enrollmentErrorMessage(error, isEn) {
  const message = (error && error.message) || '';
  const hit = ERROR_MAP.find(([pattern]) => pattern.test(message));
  if (hit) return isEn ? hit[2] : hit[1];
  return message || (isEn ? 'Could not complete the enrollment.' : 'Không thể hoàn tất đăng ký.');
}
