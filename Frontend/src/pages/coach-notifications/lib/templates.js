// Bảng gợi ý mẫu thông báo & bài tập theo lớp (1-click template pills)
export const QUICK_TEMPLATES = [
  {
    label: '🏋️ Bài tập tại nhà',
    title: '[Bài tập] Tự rèn luyện thể lực bổ trợ trước ca học',
    content: 'Chào các bạn học viên,\n\nĐể chuẩn bị tốt nhất cho buổi tập tiếp theo, các bạn vui lòng thực hiện bài tập bổ trợ tại nhà:\n1. Khởi động khớp cổ tay, cổ chân, vai: 5 phút\n2. Hít đất / Plank: 3 hiệp x 30-45 giây\n3. Squat bật nhảy nhẹ: 3 hiệp x 15 lần\n\nNghỉ giữa hiệp 60 giây và uống đủ 500ml nước nhé!'
  },
  {
    label: '⏰ Nhắc lịch tập',
    title: '[Nhắc lịch] Nhắc nhở ca học ngày mai & chuẩn bị đồ tập',
    content: 'Chào các bạn,\n\nNhắc nhở lớp học có ca tập vào ngày mai. Các bạn lưu ý:\n- Có mặt sớm 10 phút trước giờ học để khởi động.\n- Mang theo bình nước cá nhân, khăn lau mồ hôi và trang phục thể thao phù hợp.\n- Nếu có việc bận đột xuất, vui lòng báo trước cho HLV.'
  },
  {
    label: '📢 Thay đổi lịch',
    title: '[Thông báo] Cập nhật điều chỉnh thời gian ca dạy',
    content: 'Chào toàn thể lớp học,\n\nDo trung tâm có lịch bảo trì sân bãi / sự kiện thể thao, ca học sắp tới sẽ được dời sang khung giờ mới.\nChi tiết ca học đã được cập nhật trên hệ thống SCMS. Các bạn kiểm tra lại lịch trên ứng dụng nhé!'
  },
  {
    label: '🥗 Dinh dưỡng',
    title: '[Dinh dưỡng] Hướng dẫn bổ sung năng lượng phục hồi sau buổi tập',
    content: 'Chào các bạn,\n\nSau buổi tập cường độ cao hôm nay, các bạn nhớ bổ sung dinh dưỡng hợp lý:\n- Uống đủ nước bù điện giải trong vòng 30 phút sau tập.\n- Nạp bữa ăn giàu protein (ức gà, trứng, sữa) và tinh bột chậm.\n- Ngủ đủ giấc 7-8 tiếng để cơ bắp phục hồi tối đa.'
  }
];

// Tự động phân loại thẻ dựa trên nội dung bài tập / thông báo lớp học
export function detectType(title = '', content = '', isEn = false) {
  const text = (title + ' ' + content).toLowerCase();
  if (text.includes('bài tập') || text.includes('rèn luyện') || text.includes('hiệp') || text.includes('reps') || text.includes('tập tại nhà') || text.includes('plank') || text.includes('squat') || text.includes('homework') || text.includes('workout')) {
    return {
      type: 'HOMEWORK',
      label: isEn ? 'Homework & Workout' : 'Bài tập về nhà',
      icon: 'fitness_center',
      badgeClass: 'bg-brand-sand-50 text-brand-sand-800 border-brand-sand-200 dark:bg-brand-sand-950/40 dark:text-brand-sand-300 dark:border-brand-sand-800',
      iconBg: 'bg-brand-sand-100 text-brand-sand-700 dark:bg-brand-sand-900/60 dark:text-brand-sand-300',
      stripe: 'border-l-brand-sand-500'
    };
  }
  if (text.includes('nhắc') || text.includes('lịch') || text.includes('chuẩn bị') || text.includes('đúng giờ') || text.includes('mang') || text.includes('reminder')) {
    return {
      type: 'REMINDER',
      label: isEn ? 'Class Reminder' : 'Nhắc lịch học',
      icon: 'schedule',
      badgeClass: 'bg-brand-teal-50 text-brand-teal-800 border-brand-teal-200 dark:bg-brand-teal-950/40 dark:text-brand-teal-300 dark:border-brand-teal-800',
      iconBg: 'bg-brand-teal-100 text-brand-teal-700 dark:bg-brand-teal-900/60 dark:text-brand-teal-300',
      stripe: 'border-l-brand-teal-500'
    };
  }
  if (text.includes('nghỉ') || text.includes('thay đổi') || text.includes('hoãn') || text.includes('bù') || text.includes('hủy') || text.includes('dời') || text.includes('reschedule') || text.includes('change')) {
    return {
      type: 'SCHEDULE_CHANGE',
      label: isEn ? 'Schedule Update' : 'Thay đổi ca dạy',
      icon: 'campaign',
      badgeClass: 'bg-brand-danger-50 text-brand-danger-800 border-brand-danger-200 dark:bg-brand-danger-950/40 dark:text-brand-danger-300 dark:border-brand-danger-800',
      iconBg: 'bg-brand-danger-100 text-brand-danger-700 dark:bg-brand-danger-900/60 dark:text-brand-danger-300',
      stripe: 'border-l-brand-danger-500'
    };
  }
  if (text.includes('dinh dưỡng') || text.includes('ăn') || text.includes('uống') || text.includes('protein') || text.includes('nước') || text.includes('phục hồi') || text.includes('nutrition')) {
    return {
      type: 'NUTRITION',
      label: isEn ? 'Nutrition & Recovery' : 'Dinh dưỡng & Phục hồi',
      icon: 'restaurant',
      badgeClass: 'bg-brand-sage-50 text-brand-sage-800 border-brand-sage-200 dark:bg-brand-sage-950/40 dark:text-brand-sage-300 dark:border-brand-sage-800',
      iconBg: 'bg-brand-sage-100 text-brand-sage-700 dark:bg-brand-sage-900/60 dark:text-brand-sage-300',
      stripe: 'border-l-brand-sage-500'
    };
  }
  return {
    type: 'ANNOUNCEMENT',
    label: isEn ? 'Class Announcement' : 'Thông báo lớp học',
    icon: 'volume_up',
    badgeClass: 'bg-brand-teal-50 text-brand-teal-800 border-brand-teal-200 dark:bg-brand-teal-950/40 dark:text-brand-teal-300 dark:border-brand-teal-800',
    iconBg: 'bg-brand-teal-100 text-brand-teal-700 dark:bg-brand-teal-900/60 dark:text-brand-teal-300',
    stripe: 'border-l-brand-teal-500'
  };
}
