export const getStatusConfig = isEn => ({
  Open: {
    label: isEn ? 'New Received' : 'Mới tiếp nhận',
    badgeClass: 'bg-brand-teal-50 dark:bg-brand-teal-950/40 text-brand-teal-700 dark:text-brand-teal-300 border-brand-teal-200 dark:border-brand-teal-800',
    dotClass: 'bg-brand-teal-500',
    icon: 'mark_email_unread',
    borderClass: 'border-l-brand-teal-500'
  },
  InProgress: {
    label: isEn ? 'In Progress' : 'Đang xử lý',
    badgeClass: 'bg-brand-sand-50 dark:bg-brand-sand-950/40 text-brand-sand-800 dark:text-brand-sand-300 border-brand-sand-200 dark:border-brand-sand-800',
    dotClass: 'bg-brand-sand-500',
    icon: 'pending_actions',
    borderClass: 'border-l-brand-sand-500'
  },
  Resolved: {
    label: isEn ? 'Resolved' : 'Đã giải quyết',
    badgeClass: 'bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-800 dark:text-brand-sage-300 border-brand-sage-200 dark:border-brand-sage-800',
    dotClass: 'bg-brand-sage-500',
    icon: 'check_circle',
    borderClass: 'border-l-brand-sage-500'
  }
});

export const getTopicPresets = isEn => [
  { prefix: isEn ? '[Package & Pass] ' : '[Gói tập & Thẻ] ', label: isEn ? '🎫 Package & Pass' : '🎫 Gói tập & Thẻ', hint: isEn ? 'Renewal, package change, pass benefits' : 'Gia hạn, đổi gói, thắc mắc quyền lợi thẻ' },
  { prefix: isEn ? '[Schedule & Booking] ' : '[Lịch học & Đặt chỗ] ', label: isEn ? '📅 Schedule & Booking' : '📅 Lịch học & Đặt chỗ', hint: isEn ? 'Rescheduling, class transfer, session reserve' : 'Đổi ca, chuyển lớp, bảo lưu buổi tập' },
  { prefix: isEn ? '[Facility & Court] ' : '[Cơ sở vật chất] ', label: isEn ? '🏟️ Facilities & Courts' : '🏟️ Thiết bị & Sân bãi', hint: isEn ? 'Lockers, gym machines, AC' : 'Báo lỗi tủ locker, máy tập, điều hòa' },
  { prefix: isEn ? '[Coach & PT] ' : '[HLV & Chuyên môn] ', label: isEn ? '🥊 Coach & Trainer' : '🥊 Huấn luyện viên', hint: isEn ? 'Feedback on coaching or training plans' : 'Phản ánh buổi dạy hoặc giáo án PT' },
  { prefix: isEn ? '[Desk & Cashier] ' : '[Dịch vụ tại quầy] ', label: isEn ? '💬 Desk & Cashier' : '💬 Dịch vụ & Thu ngân', hint: isEn ? 'Invoices, payments, counter check-in' : 'Hóa đơn, thanh toán, thủ tục tại quầy' }
];

export const getQuickNotes = isEn =>
  isEn
    ? [
        'Resolved directly for the member at the counter.',
        'Explained the renewal and payment procedure.',
        'Forwarded to maintenance team to inspect equipment.',
        'Contacted assigned coach to assist the student.',
        'Spoke on phone and member agreed with resolution plan.'
      ]
    : [
        'Đã hỗ trợ giải quyết xong cho thành viên tại quầy.',
        'Đã hướng dẫn quy trình gia hạn và thanh toán gói tập.',
        'Đã chuyển thông tin tới bộ phận kỹ thuật để kiểm tra thiết bị.',
        'Đã liên hệ huấn luyện viên phụ trách ca để hỗ trợ học viên.',
        'Đã gọi điện trao đổi và thành viên đã đồng ý với phương án xử lý.'
      ];

export const extractTopic = (subject = '') => {
  const match = subject.match(/^\[(.*?)\]\s*(.*)$/);
  if (match) {
    return { topic: match[1], cleanSubject: match[2] || match[1] };
  }
  return { topic: null, cleanSubject: subject };
};
