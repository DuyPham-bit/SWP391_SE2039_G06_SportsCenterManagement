import React, { useState, useEffect } from 'react';
import { systemApi } from '../../services/api.js';
import { Table, LoadingSpinner } from '../../components/common/Table.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

function formatTimestamp(isoString) {
  if (!isoString) return { date: '—', time: '—' };
  try {
    const value = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(isoString) ? isoString : isoString + 'Z';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return { date: isoString, time: '' };
    const date = d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = d.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return { date, time };
  } catch {
    return { date: isoString, time: '' };
  }
}

const getActionMetaMap = isEn => ({
  'CLASS_COACH.ASSIGNED': { label: isEn ? 'Assign Coach' : 'Phân công HLV', color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', icon: 'assignment_ind' },
  'CLASS_COACH.UNASSIGNED': { label: isEn ? 'Unassign Coach' : 'Gỡ phân công HLV', color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', icon: 'person_remove' },
  'SPORT.CREATED': { label: isEn ? 'Create Sport' : 'Tạo bộ môn', color: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800', icon: 'sports' },
  'SPORT.UPDATED': { label: isEn ? 'Update Sport' : 'Cập nhật bộ môn', color: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800', icon: 'edit' },
  'MEMBER.CREATED': { label: isEn ? 'Member Registered' : 'Đăng Ký Hội Viên', color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', icon: 'person_add' },
  'MEMBER.ACCOUNT_STATUS.UPDATED': { label: isEn ? 'Member Status Change' : 'Đổi Trạng Thái Hội Viên', color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', icon: 'manage_accounts' },
  'STAFF.CREATED': { label: isEn ? 'Appoint Staff' : 'Bổ Nhiệm Nhân Sự', color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', icon: 'badge' },
  'STAFF.UPDATED': { label: isEn ? 'Update Staff' : 'Cập Nhật Nhân Sự', color: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700', icon: 'edit' },
  'MEMBERSHIP_PACKAGE.CREATED': { label: isEn ? 'Create Package' : 'Tạo Gói Tập', color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800', icon: 'card_membership' },
  'MEMBERSHIP_PACKAGE.UPDATED': { label: isEn ? 'Edit Package' : 'Sửa Gói Tập', color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800', icon: 'edit' },
  'MEMBERSHIP_PACKAGE.STATUS_UPDATED': { label: isEn ? 'Package Status Change' : 'Đổi Trạng Thái Gói', color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', icon: 'toggle_on' },
  'CLASS.CREATED': { label: isEn ? 'Create Class' : 'Tạo Lớp Học', color: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800', icon: 'fitness_center' },
  'CLASS.PUBLISHED': { label: isEn ? 'Publish Class' : 'Mở Đăng Ký Lớp', color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', icon: 'publish' },
  'CLASS.UPDATED': { label: isEn ? 'Update Class' : 'Cập Nhật Lớp', color: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800', icon: 'edit' },
  'CLASS.CANCELLED': { label: isEn ? 'Cancel Class' : 'Hủy Lớp Học', color: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800', icon: 'cancel' },
  'CLASS_SCHEDULE.CREATED': { label: isEn ? 'Add Schedule' : 'Thêm Lịch Hoạt Động', color: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800', icon: 'calendar_add_on' },
  'CLASS_SCHEDULE.UPDATED': { label: isEn ? 'Edit Schedule' : 'Sửa Lịch Hoạt Động', color: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800', icon: 'edit_calendar' },
  'CLASS_SCHEDULE.CANCELLED': { label: isEn ? 'Cancel Schedule' : 'Hủy Lịch Hoạt Động', color: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800', icon: 'event_busy' },
  'BOOK_SESSION': { label: isEn ? 'Book Session' : 'Đặt Chỗ Buổi Tập', color: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800', icon: 'bookmark_added' },
  'CANCEL_SESSION_BOOKING': { label: isEn ? 'Cancel Booking' : 'Hủy Đặt Chỗ', color: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800', icon: 'bookmark_remove' },
  'JOIN_SESSION_WAITLIST': { label: isEn ? 'Join Waitlist' : 'Vào Hàng Chờ Lớp', color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', icon: 'hourglass_empty' },
  'PAYMENT.CASH.RECORDED': { label: isEn ? 'Counter Cash Payment' : 'Thu Tiền Mặt Tại Quầy', color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', icon: 'payments' },
  'ROLE.PERMISSIONS.REPLACED': { label: isEn ? 'Role Permissions Updated' : 'Phân Quyền Vai Trò', color: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800', icon: 'security' },
});

function getActionMeta(actionCode = '', isEn = false) {
  const code = String(actionCode).toUpperCase();
  const metaMap = getActionMetaMap(isEn);
  if (metaMap[code]) return metaMap[code];
  for (const [key, meta] of Object.entries(metaMap)) {
    if (code.includes(key) || key.includes(code)) return meta;
  }
  return {
    label: actionCode.replace(/[._]/g, ' '),
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
    icon: 'history'
  };
}

const FIELD_DICT = {
  // Account & Profile
  UserId: { vi: 'Mã người dùng', en: 'User ID' },
  MemberCode: { vi: 'Mã thẻ hội viên', en: 'Member Card Code' },
  RegistrationSource: { vi: 'Kênh đăng ký', en: 'Registration Channel' },
  FullName: { vi: 'Họ và tên', en: 'Full Name' },
  Name: { vi: 'Tên đối tượng', en: 'Name' },
  Email: { vi: 'Email', en: 'Email' },
  Phone: { vi: 'Số điện thoại', en: 'Phone Number' },
  PhoneNumber: { vi: 'Số điện thoại', en: 'Phone Number' },
  Role: { vi: 'Vai trò / Chức vụ', en: 'Role' },
  RoleName: { vi: 'Vai trò / Chức vụ', en: 'Role' },
  AccountStatus: { vi: 'Trạng thái tài khoản', en: 'Account Status' },

  // Packages
  PackageId: { vi: 'Mã gói tập', en: 'Package ID' },
  PackageName: { vi: 'Tên gói tập', en: 'Package Name' },
  Price: { vi: 'Giá gói tập', en: 'Package Price' },
  DurationDays: { vi: 'Thời hạn (ngày)', en: 'Duration (Days)' },
  DurationMonths: { vi: 'Thời hạn (tháng)', en: 'Duration (Months)' },
  MaxBookingPerDay: { vi: 'Lượt đặt tối đa/ngày', en: 'Max Bookings/Day' },
  Description: { vi: 'Mô tả', en: 'Description' },

  // Classes & Schedules
  ClassId: { vi: 'Mã lớp học', en: 'Class ID' },
  ClassName: { vi: 'Tên lớp học', en: 'Class Name' },
  Capacity: { vi: 'Sức chứa tối đa', en: 'Max Capacity' },
  MaxCapacity: { vi: 'Sức chứa tối đa', en: 'Max Capacity' },
  UnitCapacity: { vi: 'Sức chứa / ca', en: 'Unit Capacity' },
  SessionsCount: { vi: 'Số buổi / Số ca', en: 'Sessions Count' },
  TotalSessions: { vi: 'Tổng số ca học', en: 'Total Sessions' },
  SportId: { vi: 'Mã bộ môn', en: 'Sport ID' },
  SportName: { vi: 'Bộ môn thể thao', en: 'Sport Discipline' },
  RoomId: { vi: 'Mã sân / phòng', en: 'Room ID' },
  RoomName: { vi: 'Sân / Phòng tập', en: 'Court / Studio' },
  CoachId: { vi: 'Mã HLV', en: 'Coach ID' },
  CoachName: { vi: 'Huấn luyện viên', en: 'Coach' },
  ScheduleId: { vi: 'Mã lịch hoạt động', en: 'Schedule ID' },
  Date: { vi: 'Ngày tập', en: 'Session Date' },
  SessionDate: { vi: 'Ngày tập', en: 'Session Date' },
  StartTime: { vi: 'Giờ bắt đầu', en: 'Start Time' },
  EndTime: { vi: 'Giờ kết thúc', en: 'End Time' },

  // Facility & Rooms
  Type: { vi: 'Loại hình', en: 'Type' },
  Location: { vi: 'Vị trí', en: 'Location' },
  CenterId: { vi: 'Mã cơ sở', en: 'Center ID' },
  CenterName: { vi: 'Tên cơ sở', en: 'Campus Name' },

  // Booking & Session
  SessionId: { vi: 'Mã ca tập', en: 'Session ID' },
  BookingId: { vi: 'Mã đặt chỗ', en: 'Booking ID' },
  MemberId: { vi: 'Mã hội viên', en: 'Member ID' },
  Slot: { vi: 'Ca tập', en: 'Slot' },

  // Financial
  InvoiceId: { vi: 'Mã hóa đơn', en: 'Invoice ID' },
  Amount: { vi: 'Số tiền thanh toán', en: 'Payment Amount' },
  PaymentMethod: { vi: 'Phương thức thanh toán', en: 'Payment Method' },
  Method: { vi: 'Hình thức', en: 'Method' },
  PaidAt: { vi: 'Thời điểm thanh toán', en: 'Paid At' },

  // Permissions & Roles
  Permissions: { vi: 'Danh sách quyền hạn', en: 'Permissions' },

  // General Status
  Status: { vi: 'Trạng thái', en: 'Status' },
  OldStatus: { vi: 'Trạng thái cũ', en: 'Previous Status' },
  NewStatus: { vi: 'Trạng thái mới', en: 'New Status' },
  IsActive: { vi: 'Kích hoạt', en: 'Active Status' },
  Reason: { vi: 'Lý do thao tác', en: 'Reason' },
  Notes: { vi: 'Ghi chú', en: 'Notes' },
  Timestamp: { vi: 'Thời gian ghi nhận', en: 'Timestamp' }
};

function formatFriendlyValue(key, value, isEn) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-400 italic">{isEn ? 'None / Empty' : '— Không có —'}</span>;
  }

  // Boolean
  if (typeof value === 'boolean') {
    return value ? (
      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
        <span>✅</span>
        <span>{isEn ? 'Yes / Enabled' : 'Có / Đang bật'}</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
        <span>⚪</span>
        <span>{isEn ? 'No / Disabled' : 'Không / Đang tắt'}</span>
      </span>
    );
  }

  // Money / Currency
  if (/^(Price|Amount|Fee|RefundAmount)$/i.test(key) && !Number.isNaN(Number(value))) {
    return (
      <span className="font-bold text-[#2D6A4F] dark:text-[#81B29A] font-chivo">
        {Number(value).toLocaleString('vi-VN')} đ
      </span>
    );
  }

  // Registration source
  if (key === 'RegistrationSource') {
    const valStr = String(value).toLowerCase();
    if (valStr === 'self') return <span className="font-bold text-emerald-700 dark:text-emerald-300">🌐 {isEn ? 'Online Web Self-Registration' : 'Khách tự đăng ký trực tuyến (Website)'}</span>;
    if (valStr === 'counter') return <span className="font-bold text-blue-700 dark:text-blue-300">🏢 {isEn ? 'Counter Front-Desk Registration' : 'Lễ tân đăng ký tại quầy'}</span>;
    if (valStr === 'admin') return <span className="font-bold text-purple-700 dark:text-purple-300">👤 {isEn ? 'Created by Administrator' : 'Quản trị viên tạo trực tiếp'}</span>;
  }

  // Payment Method
  if (/^(Method|PaymentMethod)$/i.test(key)) {
    const valStr = String(value).toLowerCase();
    if (valStr === 'cash') return <span className="font-bold text-emerald-700 dark:text-emerald-300">💵 {isEn ? 'Cash Payment' : 'Tiền mặt tại quầy'}</span>;
    if (valStr === 'vnpay') return <span className="font-bold text-blue-700 dark:text-blue-300">💳 {isEn ? 'VNPay Gateway' : 'Cổng thanh toán VNPay'}</span>;
    if (valStr === 'bank_transfer') return <span className="font-bold text-indigo-700 dark:text-indigo-300">🏦 {isEn ? 'Bank Transfer' : 'Chuyển khoản ngân hàng'}</span>;
  }

  // Status mapping
  if (/Status/i.test(key)) {
    const valStr = String(value);
    const statusMap = {
      Active: { label: isEn ? 'Active' : 'Đang hoạt động', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800', icon: 'check_circle' },
      Inactive: { label: isEn ? 'Inactive' : 'Ngừng hoạt động', color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700', icon: 'pause_circle' },
      Suspended: { label: isEn ? 'Suspended' : 'Đang tạm khóa', color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800', icon: 'block' },
      Published: { label: isEn ? 'Published' : 'Đã mở đăng ký', color: 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800', icon: 'publish' },
      Cancelled: { label: isEn ? 'Cancelled' : 'Đã hủy bỏ', color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800', icon: 'cancel' },
      Confirmed: { label: isEn ? 'Confirmed' : 'Đã xác nhận', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800', icon: 'check' },
      Waiting: { label: isEn ? 'Waiting' : 'Đang trong hàng chờ', color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800', icon: 'hourglass_empty' },
      Draft: { label: isEn ? 'Draft' : 'Bản nháp', color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700', icon: 'edit_note' },
      Booked: { label: isEn ? 'Booked' : 'Đã đặt chỗ', color: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800', icon: 'event_seat' },
      Attended: { label: isEn ? 'Attended' : 'Đã tham gia (Check-in)', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800', icon: 'fact_check' }
    };
    if (statusMap[valStr]) {
      const sm = statusMap[valStr];
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${sm.color}`}>
          <span className="material-symbols-outlined text-[13px]">{sm.icon}</span>
          <span>{sm.label}</span>
        </span>
      );
    }
  }

  // Array of permissions or items
  if (Array.isArray(value)) {
    if (!value.length) return <span className="text-slate-400 italic">{isEn ? 'None' : 'Không có'}</span>;
    return (
      <div className="flex flex-wrap gap-1 max-w-md">
        {value.map((item, idx) => (
          <span key={idx} className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {typeof item === 'object' ? JSON.stringify(item) : String(item)}
          </span>
        ))}
      </div>
    );
  }

  // Object
  if (typeof value === 'object') {
    return (
      <div className="space-y-1">
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className="text-[11px]">
            <span className="font-semibold text-slate-600 dark:text-slate-400">{FIELD_DICT[k]?.[isEn ? 'en' : 'vi'] || k}: </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{String(v)}</span>
          </div>
        ))}
      </div>
    );
  }

  // IDs with #
  if (/^(UserId|MemberId|CoachId|ClassId|PackageId|RoomId|SportId|InvoiceId|ScheduleId)$/i.test(key) && !Number.isNaN(Number(value))) {
    return <span className="font-bold font-mono text-slate-800 dark:text-slate-200">#{value}</span>;
  }

  // MemberCode / Code
  if (/Code$/i.test(key)) {
    return (
      <span className="font-bold font-mono text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
        {String(value)}
      </span>
    );
  }

  return <span className="font-medium text-slate-800 dark:text-slate-200">{String(value)}</span>;
}

function parseValues(val) {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try {
    const parsed = JSON.parse(val);
    return typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Hiển thị dữ liệu so sánh trước / sau một cách thân thiện với nhà quản lý (không hiển thị JSON code thô)
 */
function AuditDiffViewer({ oldRaw, newRaw, isEn }) {
  const [showRawJson, setShowRawJson] = useState(false);
  const oldObj = parseValues(oldRaw);
  const newObj = parseValues(newRaw);

  const hasOld = oldObj && Object.keys(oldObj).length > 0;
  const hasNew = newObj && Object.keys(newObj).length > 0;

  if (!hasOld && !hasNew) {
    if (!oldRaw && !newRaw) return null;
    return (
      <div className="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
        {oldRaw && <div><span className="font-bold text-slate-500">{isEn ? 'Before:' : 'Trước:'}</span> {oldRaw}</div>}
        {newRaw && <div><span className="font-bold text-slate-500">{isEn ? 'After:' : 'Sau:'}</span> {newRaw}</div>}
      </div>
    );
  }

  // 1. Trường hợp TẠO MỚI (Tất cả thuộc tính nằm trong newObj, oldObj rỗng)
  if (!hasOld && hasNew) {
    return (
      <div className="mt-2.5 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-200/80 dark:border-emerald-800/50 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>{isEn ? 'Newly Initialized System Data' : 'Thông tin được thiết lập mới trên hệ thống'}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowRawJson(!showRawJson)}
            className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline cursor-pointer"
          >
            {showRawJson ? (isEn ? 'Hide Code' : 'Ẩn mã JSON') : (isEn ? 'Raw JSON' : 'Xem mã JSON')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
          {Object.entries(newObj).map(([key, val]) => {
            const label = FIELD_DICT[key]?.[isEn ? 'en' : 'vi'] || key;
            return (
              <div key={key} className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-emerald-100 dark:border-slate-800 shadow-2xs">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">{label}:</span>
                <div>{formatFriendlyValue(key, val, isEn)}</div>
              </div>
            );
          })}
        </div>

        {showRawJson && (
          <pre className="text-[10px] font-mono p-2.5 rounded-lg bg-slate-900 text-slate-200 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(newObj, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  // 2. Trường hợp XÓA / HỦY (Chỉ có oldObj, newObj rỗng)
  if (hasOld && !hasNew) {
    return (
      <div className="mt-2.5 p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/25 border border-rose-200/80 dark:border-rose-800/50 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
            <span>{isEn ? 'Data Removed / Cancelled from System' : 'Dữ liệu đã bị xóa hoặc hủy khỏi hệ thống'}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowRawJson(!showRawJson)}
            className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline cursor-pointer"
          >
            {showRawJson ? (isEn ? 'Hide Code' : 'Ẩn mã JSON') : (isEn ? 'Raw JSON' : 'Xem mã JSON')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
          {Object.entries(oldObj).map(([key, val]) => {
            const label = FIELD_DICT[key]?.[isEn ? 'en' : 'vi'] || key;
            return (
              <div key={key} className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-rose-100 dark:border-slate-800 shadow-2xs">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5 font-medium">{label}:</span>
                <div>{formatFriendlyValue(key, val, isEn)}</div>
              </div>
            );
          })}
        </div>

        {showRawJson && (
          <pre className="text-[10px] font-mono p-2.5 rounded-lg bg-slate-900 text-slate-200 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(oldObj, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  // 3. Trường hợp CẬP NHẬT / SỬA ĐỔI (Có cả oldObj và newObj)
  const allKeys = Array.from(new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]));

  return (
    <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
          <span className="material-symbols-outlined text-[16px] text-blue-600 dark:text-blue-400">compare_arrows</span>
          <span>{isEn ? 'Detailed Attribute Comparison (Before vs. After)' : 'Bảng đối soát chi tiết trước và sau khi thay đổi'}</span>
        </div>
        <button
          type="button"
          onClick={() => setShowRawJson(!showRawJson)}
          className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline cursor-pointer"
        >
          {showRawJson ? (isEn ? 'Hide Code' : 'Ẩn mã JSON') : (isEn ? 'Raw JSON' : 'Xem mã JSON')}
        </button>
      </div>

      <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
              <th className="py-2 px-3 w-1/3">{isEn ? 'Information Field' : 'Thông tin dữ liệu'}</th>
              <th className="py-2 px-3 w-1/3">{isEn ? 'Before Modification' : 'Trước khi đổi (Cũ)'}</th>
              <th className="py-2 px-3 w-1/3">{isEn ? 'After Modification' : 'Sau khi đổi (Mới)'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {allKeys.map(key => {
              const label = FIELD_DICT[key]?.[isEn ? 'en' : 'vi'] || key;
              const oldVal = oldObj[key];
              const newVal = newObj[key];
              const isDifferent = JSON.stringify(oldVal) !== JSON.stringify(newVal);

              return (
                <tr key={key} className={isDifferent ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}>
                  <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      {isDifferent ? (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title={isEn ? 'Modified' : 'Đã thay đổi'} />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                      )}
                      <span>{label}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                    {formatFriendlyValue(key, oldVal, isEn)}
                  </td>
                  <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-1.5">
                      {isDifferent && <span className="text-emerald-600 dark:text-emerald-400 font-black">➔</span>}
                      {formatFriendlyValue(key, newVal, isEn)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showRawJson && (
        <pre className="text-[10px] font-mono p-2.5 rounded-lg bg-slate-900 text-slate-200 overflow-x-auto whitespace-pre-wrap">
          {`${isEn ? 'Before' : 'Trước'}: ${JSON.stringify(oldObj, null, 2)}\n${isEn ? 'After' : 'Sau'}: ${JSON.stringify(newObj, null, 2)}`}
        </pre>
      )}
    </div>
  );
}

function renderAuditDetails(row, isEn) {
  const raw = row.newValues || row.oldValues || row.details;
  if (!raw) return <span className="text-slate-400 italic text-xs">{isEn ? 'No details' : 'Không có chi tiết'}</span>;

  let parsed = null;
  if (typeof raw === 'object') {
    parsed = raw;
  } else if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{raw}</span>;
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{String(raw)}</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-0.5">
      {parsed.MemberCode && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-[#81B29A]/15 text-[#2D6A4F] dark:text-[#81B29A] border border-[#81B29A]/30">
          <span className="text-[10px] uppercase font-sans font-medium text-slate-500 dark:text-slate-400">{isEn ? 'Card:' : 'Mã thẻ:'}</span>
          {parsed.MemberCode}
        </span>
      )}
      {parsed.UserId && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] text-slate-400 font-medium">User:</span>
          #{parsed.UserId}
        </span>
      )}
      {parsed.RegistrationSource && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Channel:' : 'Kênh:'}</span>
          <span className="font-semibold">{parsed.RegistrationSource === 'self' ? (isEn ? 'Web Self-signup' : 'Tự đăng ký Web') : parsed.RegistrationSource}</span>
        </span>
      )}
      {parsed.Email && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          {parsed.Email}
        </span>
      )}
      {parsed.FullName && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          {parsed.FullName}
        </span>
      )}
      {parsed.RoleName && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
          {isEn ? 'Role' : 'Vai trò'}: {parsed.RoleName}
        </span>
      )}
      {parsed.PackageName && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
          {isEn ? 'Package' : 'Gói'}: {parsed.PackageName}
        </span>
      )}
      {parsed.ClassName && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800">
          {isEn ? 'Class' : 'Lớp'}: {parsed.ClassName}
        </span>
      )}
      {parsed.Amount && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 font-chivo">
          {Number(parsed.Amount).toLocaleString('vi-VN')} đ
        </span>
      )}
      {parsed.Status && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          {isEn ? 'Status' : 'Trạng thái'}: {parsed.Status}
        </span>
      )}
      {parsed.Reason && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 italic">
          "{parsed.Reason}"
        </span>
      )}

      {/* Other fields */}
      {Object.entries(parsed)
        .filter(([k]) => !['MemberCode', 'UserId', 'RegistrationSource', 'Email', 'FullName', 'RoleName', 'PackageName', 'ClassName', 'Amount', 'Status', 'Reason', 'EmailPresent', 'PhonePresent'].includes(k))
        .map(([k, v]) => {
          const label = FIELD_DICT[k]?.[isEn ? 'en' : 'vi'] || k;
          return (
            <span key={k} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 font-medium">{label}:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
            </span>
          );
        })}
    </div>
  );
}


export function AuditLogs() {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [logs, setLogs] = useState([]);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    systemApi
      .getAuditPage(page)
      .then(data => {
        if (active) {
          setLogs(data.items);
          setTotalCount(data.totalCount);
        }
      })
      .catch(e => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, revision]);

  const filteredLogs =
    actionFilter === 'ALL'
      ? logs
      : logs.filter(l => (l.action || '').toUpperCase().includes(actionFilter));

  const columns = [
    {
      header: isEn ? 'Timestamp (Local)' : 'Thời Gian (Việt Nam)',
      render: row => {
        const { date, time } = formatTimestamp(row.timestamp);
        return (
          <div className="flex flex-col py-0.5">
            <span className="font-chivo text-xs text-slate-900 dark:text-white font-bold tracking-tight">{time}</span>
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[12px]">calendar_today</span>
              <span>{date}</span>
            </span>
          </div>
        );
      }
    },
    {
      header: isEn ? 'Actor / User' : 'Người Thực Hiện',
      render: row => {
        const isSystem = !row.userId;
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
              <span className="material-symbols-outlined text-[17px]">
                {isSystem ? 'dns' : 'person'}
              </span>
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                {row.userName}
              </div>
              {row.role && row.role !== '—' && (
                <span className="inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  {row.role}
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: isEn ? 'System Action' : 'Hành Động Hệ Thống',
      render: row => {
        const meta = getActionMeta(row.action, isEn);
        return (
          <div className="flex flex-col gap-1 py-0.5">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border shadow-2xs w-fit ${meta.color}`}>
              <span className="material-symbols-outlined text-[15px]">{meta.icon}</span>
              <span>{meta.label}</span>
            </span>
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wide">
              {row.action}
            </span>
          </div>
        );
      }
    },
    {
      header: isEn ? 'Audit Details' : 'Chi Tiết Thao Tác',
      render: row => {
        const hasDiff = Boolean(row.oldValues || row.newValues);
        const isCreate = !row.oldValues && Boolean(row.newValues);
        const isDelete = Boolean(row.oldValues) && !row.newValues;

        const summaryLabel = isCreate
          ? (isEn ? '✨ View Initialized Data Details' : '📋 Xem chi tiết dữ liệu khởi tạo')
          : isDelete
          ? (isEn ? '🗑️ View Removed Record Details' : '🗑️ Xem thông tin dữ liệu đã hủy/xóa')
          : (isEn ? '🔄 Compare Changes (Before vs. After)' : '🔄 So sánh chi tiết trước & sau thay đổi');

        return (
          <div className="space-y-1.5 py-1">
            {/* Quick summary badges */}
            {renderAuditDetails(row, isEn)}

            {/* Non-technical human friendly diff details */}
            {hasDiff && (
              <details className="group text-xs mt-1">
                <summary className="cursor-pointer inline-flex items-center gap-1 font-bold text-[#2D6A4F] dark:text-[#81B29A] hover:text-[#1E4D38] dark:hover:text-[#A7D7C5] transition-colors py-0.5 select-none">
                  <span className="material-symbols-outlined text-[15px] transition-transform duration-200 group-open:rotate-90">
                    arrow_right
                  </span>
                  <span>{summaryLabel}</span>
                </summary>
                <AuditDiffViewer oldRaw={row.oldValues} newRaw={row.newValues} isEn={isEn} />
              </details>
            )}
          </div>
        );
      }
    },
    {
      header: isEn ? 'Status' : 'Ghi nhận',
      render: () => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <span className="material-symbols-outlined text-[14px]">check_circle</span>
          <span>{isEn ? 'Logged' : 'Đã lưu'}</span>
        </span>
      )
    }
  ];

  const filterTabs = [
    { id: 'ALL', label: isEn ? 'All' : 'Tất cả' },
    { id: 'MEMBER', label: isEn ? 'Members' : 'Hội viên' },
    { id: 'STAFF', label: isEn ? 'Staff' : 'Nhân sự' },
    { id: 'PACKAGE', label: isEn ? 'Packages' : 'Gói tập' },
    { id: 'CLASS', label: isEn ? 'Classes' : 'Lớp học' },
    { id: 'SPORT', label: isEn ? 'Sports' : 'Bộ môn' },
    { id: 'ROOM', label: isEn ? 'Rooms' : 'Phòng tập' },
    { id: 'SESSION', label: isEn ? 'Bookings' : 'Đặt chỗ' },
    { id: 'PAYMENT', label: isEn ? 'Payments' : 'Thanh toán' },
    { id: 'ROLE', label: isEn ? 'Permissions' : 'Phân quyền' }
  ];

  if (loading) return <LoadingSpinner text={isEn ? 'Loading system audit logs...' : 'Đang tải nhật ký kiểm toán hệ thống...'} />;

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Top Banner Header (Olympic Multi-stop Gradient matching Image 1) */}
      <section
        className="relative overflow-hidden rounded-3xl text-white p-6 sm:p-8 shadow-xl shadow-[#24828F]/25 border border-white/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        style={{
          background: 'linear-gradient(108deg, #2F7B5D 0%, #24828F 25%, #3FAEB8 48%, #76B386 70%, #DEAC46 88%, #E5A33C 100%)'
        }}
      >
        {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
        <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-[#F2CC8F]/50 via-[#E5A33C]/35 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-gradient-to-tr from-[#81B29A]/45 via-[#2F7B5D]/30 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-[#A8DADC]/35 rounded-full blur-3xl" />

        {/* Subtle decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
          <circle cx="890" cy="110" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
        </svg>

        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/95 text-[#1B4332] text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/80 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>{isEn ? 'SYSTEM AUDIT & SECURITY TRAIL' : 'NHẬT KÝ KIỂM TOÁN & BẢO MẬT HỆ THỐNG'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-chivo tracking-tight text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            {isEn ? 'System Audit Trails (Audit Logs)' : 'Nhật Ký Kiểm Toán Hệ Thống (Audit Logs)'}
          </h1>
          <p className="text-xs sm:text-sm text-white/95 leading-relaxed font-medium drop-shadow-xs">
            {isEn
              ? 'Trace all critical activities: membership registrations, staff appointments, class openings, payments, and permission changes.'
              : 'Theo dõi truy vết toàn bộ hoạt động đăng ký, đăng nhập, giao dịch, mở lớp, phân công và kiểm tra tại quầy.'}
          </p>
        </div>

        <button
          onClick={() => setRevision(x => x + 1)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/40 transition-all hover-lift cursor-pointer shadow-xs shrink-0 relative z-10"
        >
          <span className="material-symbols-outlined text-[16px] text-amber-200">refresh</span>
          <span>{isEn ? 'Refresh Logs' : 'Làm Mới'}</span>
        </button>
      </section>

      {/* Action Filters */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3">
          {isEn ? 'Filter in page:' : 'Lọc trong trang:'}
        </span>
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActionFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all hover-lift cursor-pointer ${
              actionFilter === tab.id
                ? 'bg-[#1E2235] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Audit Log Table */}
      {error ? (
        <div role="alert" className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover-lift transition-all">
          <Table
            key={`${page}:${actionFilter}:${revision}`}
            columns={columns}
            data={filteredLogs}
            searchKey="searchIndex"
            searchPlaceholder={isEn ? 'Filter rows in current page...' : 'Tìm trong trang hiện tại...'}
            emptyMessage={isEn ? 'No audit records match the current filter' : 'Không có nhật ký nào phù hợp với bộ lọc'}
            pageSize={50}
          />
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-wrap justify-between items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-600 dark:text-slate-400 shadow-xs">
        <button
          className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold uppercase tracking-wider disabled:opacity-40 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          disabled={page <= 1}
          onClick={() => setPage(p => p - 1)}
        >
          {isEn ? 'Previous Page' : 'Trang trước'}
        </button>
        <span className="font-medium">
          {isEn ? 'Page' : 'Trang'} <strong>{page}</strong> / {Math.max(1, Math.ceil(totalCount / 50))} · {totalCount} {isEn ? 'audit logs' : 'thao tác'}
        </span>
        <button
          className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold uppercase tracking-wider disabled:opacity-40 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          disabled={page * 50 >= totalCount || Boolean(error)}
          onClick={() => setPage(p => p + 1)}
        >
          {isEn ? 'Next Page' : 'Trang sau'}
        </button>
      </div>
    </div>
  );
}
