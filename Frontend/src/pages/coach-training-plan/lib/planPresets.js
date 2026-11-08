import { translateSportName } from '../../../shared/i18n/i18nHelper.js';

export function getSportBadgeTheme(sportName = '', isEn = false) {
  const s = String(sportName).toLowerCase();
  if (s.includes('bơi') || s.includes('swim')) {
    return {
      bg: 'bg-brand-teal-50 text-brand-teal-800 border-brand-teal-200',
      tagBg: 'bg-brand-teal-100 text-brand-teal-800 border-brand-teal-300',
      dot: 'bg-brand-teal-500',
      icon: 'pool',
      accent: 'border-l-brand-teal-500',
      textAccent: 'text-brand-teal-700 dark:text-brand-teal-400',
      label: isEn ? 'Swimming' : 'Bơi lội'
    };
  }
  if (s.includes('yoga') || s.includes('pilates')) {
    return {
      bg: 'bg-brand-navy-50 text-brand-navy-800 border-brand-navy-200',
      tagBg: 'bg-brand-navy-100 text-brand-navy-800 border-brand-navy-300',
      dot: 'bg-brand-navy-700',
      icon: 'self_improvement',
      accent: 'border-l-brand-navy-700',
      textAccent: 'text-brand-navy-800',
      label: 'Yoga & Pilates'
    };
  }
  if (s.includes('cầu lông') || s.includes('badminton')) {
    return {
      bg: 'bg-brand-sage-50 text-brand-sage-800 border-brand-sage-200',
      tagBg: 'bg-brand-sage-100 text-brand-sage-800 border-brand-sage-300',
      dot: 'bg-brand-sage-500',
      icon: 'sports_tennis',
      accent: 'border-l-brand-sage-500',
      textAccent: 'text-brand-sage-700 dark:text-brand-sage-400',
      label: isEn ? 'Badminton' : 'Cầu lông'
    };
  }
  if (s.includes('gym') || s.includes('fitness')) {
    return {
      bg: 'bg-brand-sand-50 text-brand-sand-800 border-brand-sand-200',
      tagBg: 'bg-brand-sand-100 text-brand-sand-800 border-brand-sand-300',
      dot: 'bg-brand-sand-500',
      icon: 'fitness_center',
      accent: 'border-l-brand-sand-500',
      textAccent: 'text-brand-sand-700 dark:text-brand-sand-400',
      label: 'Gym & Fitness'
    };
  }
  if (s.includes('boxing') || s.includes('võ') || s.includes('kickfit') || s.includes('martial')) {
    return {
      bg: 'bg-brand-danger-50 text-brand-danger-800 border-brand-danger-200',
      tagBg: 'bg-brand-danger-100 text-brand-danger-800 border-brand-danger-300',
      dot: 'bg-brand-danger-500',
      icon: 'sports_mma',
      accent: 'border-l-brand-danger-500',
      textAccent: 'text-brand-danger-700 dark:text-brand-danger-400',
      label: isEn ? 'Boxing & Martial Arts' : 'Boxing & Võ thuật'
    };
  }
  return {
    bg: 'bg-brand-teal-50 text-brand-teal-800 border-brand-teal-200',
    tagBg: 'bg-brand-teal-100 text-brand-teal-800 border-brand-teal-300',
    dot: 'bg-brand-teal-500',
    icon: 'sports_basketball',
    accent: 'border-l-brand-teal-500',
    textAccent: 'text-brand-teal-700 dark:text-brand-teal-400',
    label: translateSportName(sportName, isEn) || (isEn ? 'Sports' : 'Thể thao')
  };
}

export const PRESET_PLAN_EXERCISES = {
  smash: [
    { name: 'Bộ chân di chuyển bóng sao 6 góc sân', sets: '4', reps: '1 phút', note: 'Tăng tốc độ hồi sân trọng tâm thấp' },
    { name: 'Tập cổ tay với vợt nặng Training Racket', sets: '3', reps: '20 lần', note: 'Tăng lực phát bóng và độ dẻo cổ tay' },
    { name: 'Đập cầu dốc góc lưới Smash', sets: '4', reps: '15 lần', note: 'Tiếp xúc cầu điểm cao nhất, gập cổ tay dứt khoát' },
    { name: 'Thực chiến phản xạ giao cầu và gài lưới', sets: '3', reps: '10 lần', note: 'Rèn phản xạ gài cầu sát mép lưới' }
  ],
  yoga: [
    { name: 'Thở Pranayama hít sâu bụng 4 nhịp', sets: '1', reps: '5 phút', note: 'Điều hòa hơi thở, làm dịu hệ thần kinh' },
    { name: 'Chuỗi Cat-Cow uốn cột sống', sets: '3', reps: '10 nhịp', note: 'Kéo giãn từng đốt sống, giải tỏa vùng thắt lưng' },
    { name: 'Tư thế chim bồ câu Pigeon Pose', sets: '3', reps: '45 giây/bên', note: 'Mở khớp hông sâu, giải phóng căng thẳng cơ mông' },
    { name: 'Tư thế rắn hổ mang Cobra Pose', sets: '3', reps: '30 giây', note: 'Mở rộng lồng ngực, tăng cường sức mạnh cột sống' }
  ],
  hypertrophy: [
    { name: 'Khởi động động lực học xoay vai & foam roller', sets: '2', reps: '5 phút', note: 'Làm nóng khớp xoay vai và giãn mạc cơ' },
    { name: 'Barbell Bench Press (Đẩy ngực đòn ngang)', sets: '4', reps: '8 - 10', note: 'RPE 8.0, nghỉ 90s, tempo 3-0-1' },
    { name: 'Incline Dumbbell Press (Đẩy tạ đơn ngực trên)', sets: '3', reps: '10 - 12', note: 'Ép cơ ngực trên ở đỉnh chuyển động' },
    { name: 'Lat Pulldown (Kéo xô máy rộng tay)', sets: '4', reps: '10 - 12', note: 'Kéo sát ngực trên, siết chặt cơ xô ở đáy' }
  ],
  swim: [
    { name: 'Khởi động xoay khớp vai & gân gối trên cạn', sets: '2', reps: '5 phút', note: 'Tăng biên độ vận động khớp trước khi xuống nước' },
    { name: 'Đạp chân sải với phao tim Kickboard', sets: '4', reps: '50m', note: 'Đập chân từ hông, mũi chân duỗi thẳng, giữ hông nổi' },
    { name: 'Quạt tay sải kẹp phao Pullbuoy', sets: '4', reps: '100m', note: 'Tối ưu góc cùi chỏ cao High-Elbow Catch dưới nước' },
    { name: 'Bơi phối hợp biến tốc Interval', sets: '3', reps: '100m', note: 'Nhịp thở 2 bên (3 nhịp quạt 1 nhịp thở), nghỉ 30s giữa hiệp' }
  ],
  boxing: [
    { name: 'Nhảy dây tăng tốc Footwork', sets: '3', reps: '3 phút', note: 'Nhẹ gót chân, giữ nhịp thở đều đặn' },
    { name: 'Đấm gió Shadow Boxing', sets: '3', reps: '3 phút', note: 'Tập trung vào tư thế phòng thủ và hồi tay nhanh' },
    { name: 'Đánh Pad tổ hợp đòn Jab-Cross-Hook', sets: '4', reps: '12 tổ hợp', note: 'Xoay hông và dồn trọng tâm khi ra đòn Hook' },
    { name: 'Bài tập né đòn Slip và Roll', sets: '3', reps: '15 lần', note: 'Hạ thấp trọng tâm bằng gối, mắt không rời đối thủ' }
  ]
};

export function getResolvedExercises(plan) {
  if (Array.isArray(plan?.exercises) && plan.exercises.length > 0) {
    return plan.exercises;
  }
  const text = `${plan?.title || ''} ${plan?.sportName || ''} ${plan?.goal || ''}`.toLowerCase();
  if (text.includes('smash') || text.includes('cầu lông') || text.includes('badminton') || text.includes('bộ chân')) {
    return PRESET_PLAN_EXERCISES.smash;
  }
  if (text.includes('yoga') || text.includes('cột sống') || text.includes('khớp hông') || text.includes('pilates')) {
    return PRESET_PLAN_EXERCISES.yoga;
  }
  if (text.includes('hypertrophy') || text.includes('tăng cơ') || text.includes('gym') || text.includes('thân trên') || text.includes('bench press')) {
    return PRESET_PLAN_EXERCISES.hypertrophy;
  }
  if (text.includes('bơi') || text.includes('swim') || text.includes('olympic') || text.includes('sải')) {
    return PRESET_PLAN_EXERCISES.swim;
  }
  if (text.includes('boxing') || text.includes('kickfit') || text.includes('đấm') || text.includes('võ')) {
    return PRESET_PLAN_EXERCISES.boxing;
  }
  return [];
}
