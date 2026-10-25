import React, { useEffect, useMemo, useState } from 'react';
import { coachProfessionalApi } from '../../services/api.js';
import { uploadMediaFileToCloud } from '../../services/cloudMediaStorage.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { LoadingSpinner } from '../../components/common/Table.jsx';
import { CoachError } from './CoachShared.jsx';
import { translateRoomName } from '../../services/i18nHelper.js';

const inputClass = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-750 px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-[#81B29A] dark:focus:border-[#81B29A] focus:ring-2 focus:ring-[#81B29A]/20 dark:focus:ring-[#81B29A]/30 outline-none transition-all shadow-2xs';
const selectClass = `${inputClass} cursor-pointer`;
const buttonPrimary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E2235] hover:bg-[#2B2D42] text-[#F2CC8F] hover:text-white px-4 py-2.5 text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

function SectionCard({ title, icon, action, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-4 sm:p-5 shadow-xs transition-colors ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-[#81B29A]/15 dark:bg-[#81B29A]/20 text-[#2D6A4F] dark:text-[#81B29A] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[19px]">{icon}</span>
            </div>
          )}
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ icon = 'inbox', children, isEn = false }) {
  const content = children || (isEn ? 'No data available.' : 'Chưa có dữ liệu.');
  return (
    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 p-6 text-center">
      <span className="material-symbols-outlined text-[32px] text-slate-300 dark:text-slate-600 mb-1.5 block">
        {icon}
      </span>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{content}</p>
    </div>
  );
}

function FormField({ title, required = false, hint, children }) {
  return (
    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
      <span className="flex items-center justify-between mb-1.5">
        <span>
          {title} {required && <span className="text-rose-500">*</span>}
        </span>
        {hint && <span className="text-[11px] font-normal text-slate-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function toLocalDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str) && !str.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(str)) {
    return new Date(str + 'Z');
  }
  return new Date(str);
}

function formatDate(value, isEn = false) {
  const d = toLocalDate(value);
  return d ? d.toLocaleString(isEn ? 'en-US' : 'vi-VN') : '—';
}

function issueStatusMeta(st, isEn = false) {
  switch (st) {
    case 'Resolved':
    case 'Closed':
      return {
        label: isEn ? 'Resolved' : 'Đã giải quyết',
        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
      };
    case 'OnHold':
      return {
        label: isEn ? 'On Hold (Waiting Parts)' : 'Chờ linh kiện / Tạm hoãn',
        cls: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
      };
    case 'InProgress':
      return {
        label: isEn ? 'In Progress' : 'Đang xử lý',
        cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
      };
    case 'Rejected':
    case 'Cancelled':
      return {
        label: isEn ? 'Rejected / Void' : 'Đã từ chối / Báo sai',
        cls: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
      };
    default:
      return {
        label: isEn ? 'Pending Review' : 'Chờ tiếp nhận',
        cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
      };
  }
}

export function CoachResources() {
  const { showSuccess, showError, confirm } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [bookingStart, setBookingStart] = useState('');
  const [bookingEnd, setBookingEnd] = useState('');
  const [bookingTab, setBookingTab] = useState('active'); // 'all' | 'active' | 'history'
  const [viewCenterSchedule, setViewCenterSchedule] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await coachProfessionalApi.getWorkspace();
      setData(result);
    } catch (e) {
      setError(e);
      showError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const act = async (fn, successMsg) => {
    setWorking(true);
    try {
      await fn();
      showSuccess(successMsg);
      await loadData();
      return true;
    } catch (e) {
      showError(e);
      return false;
    } finally {
      setWorking(false);
    }
  };

  const resources = data?.resources || [];
  const resourceBookings = data?.resourceBookings || [];
  const centerResourceBookings = data?.centerResourceBookings || [];
  const equipmentIssues = data?.equipmentIssues || [];
  const myCoachId = data?.profile?.id;

  // Tổng hợp tất cả các lịch đặt đã xác nhận của tài nguyên đang chọn
  const activeScheduleForSelected = useMemo(() => {
    if (!selectedResourceId) return [];
    const rId = Number(selectedResourceId);
    const now = new Date();
    const map = new Map();

    // Gom từ cả 2 nguồn (lượt đặt của tôi + toàn trung tâm)
    centerResourceBookings.forEach(b => {
      if (b.resourceId === rId && b.status === 'Confirmed') {
        map.set(b.id, b);
      }
    });
    resourceBookings.forEach(b => {
      if (b.resourceId === rId && b.status === 'Confirmed') {
        map.set(b.id, { ...b, coachId: myCoachId, coachName: isEn ? 'You (My booking)' : 'Bạn (Lượt đặt của bạn)' });
      }
    });

    return Array.from(map.values())
      .filter(b => {
        const end = toLocalDate(b.endAt);
        return end && end >= now;
      })
      .sort((a, b) => (toLocalDate(a.startAt)?.getTime() || 0) - (toLocalDate(b.startAt)?.getTime() || 0));
  }, [selectedResourceId, centerResourceBookings, resourceBookings, myCoachId, isEn]);

  // Kiểm tra xung đột thời gian thực
  const conflictInfo = useMemo(() => {
    if (!selectedResourceId || !bookingStart || !bookingEnd) return null;
    const start = new Date(bookingStart);
    const end = new Date(bookingEnd);
    if (isNaN(start) || isNaN(end) || end <= start) return null;

    return activeScheduleForSelected.find(b => {
      const bStart = toLocalDate(b.startAt);
      const bEnd = toLocalDate(b.endAt);
      if (!bStart || !bEnd) return false;
      return bStart < end && bEnd > start;
    }) || null;
  }, [selectedResourceId, bookingStart, bookingEnd, activeScheduleForSelected]);

  const handleBooking = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const startStr = bookingStart || f.get('startAt');
    const endStr = bookingEnd || f.get('endAt');
    const start = new Date(startStr);
    const end = new Date(endStr);
    const now = new Date();

    if (start < new Date(now.getTime() - 5 * 60 * 1000)) {
      showError(isEn ? 'Start time cannot be in the past.' : 'Thời gian bắt đầu không được ở trong quá khứ.');
      return;
    }
    if (end <= start) {
      showError(isEn ? 'End time must be after start time.' : 'Thời gian kết thúc phải diễn ra sau thời gian bắt đầu.');
      return;
    }
    const diffHours = (end - start) / (1000 * 60 * 60);
    if (diffHours > 12) {
      showError(
        isEn
          ? `Resource booking duration cannot exceed 12 hours per session (currently ${Math.round(diffHours)}h).`
          : `Thời gian đặt/mượn tài nguyên tối đa là 12 tiếng mỗi lượt (hiện chọn ${Math.round(diffHours)} tiếng). Vui lòng đặt theo từng ca/buổi tập.`
      );
      return;
    }

    if (conflictInfo) {
      showError(
        isEn
          ? 'Selected time slot conflicts with an existing booking. Please pick another time.'
          : 'Khung giờ này đã có người đặt trước. Vui lòng chọn thời gian khác hoặc kiểm tra lại lịch bên dưới.'
      );
      return;
    }

    return act(
      () =>
        coachProfessionalApi.bookResource({
          resourceId: Number(selectedResourceId || f.get('resourceId')),
          workEventId: null,
          startAt: startStr,
          endAt: endStr,
          purpose: f.get('purpose')
        }),
      isEn ? 'Resource booked; schedule conflict checks passed.' : 'Đã đặt tài nguyên; hệ thống đã kiểm tra xung đột lịch.'
    ).then((ok) => {
      if (ok) {
        e.target.reset();
        setBookingStart('');
        setBookingEnd('');
      }
    });
  };

  const handleIssue = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    return act(
      () =>
        coachProfessionalApi.reportIssue({
          resourceId: f.get('resourceId') ? Number(f.get('resourceId')) : null,
          title: f.get('title'),
          description: f.get('description'),
          severity: f.get('severity'),
          photoUrl: photoUrl || null
        }),
      isEn ? 'Maintenance report submitted to technical team.' : 'Đã gửi báo cáo sự cố đến bộ phận kỹ thuật & quản lý.'
    ).then((ok) => {
      if (ok) {
        e.target.reset();
        setPhotoUrl('');
      }
    });
  };

  const uploadPhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadMediaFileToCloud(file);
      setPhotoUrl(res.url);
    } catch (e) {
      showError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const filteredMyBookings = useMemo(() => {
    const now = new Date();
    if (bookingTab === 'active') {
      return resourceBookings.filter(b => {
        const end = toLocalDate(b.endAt);
        return b.status === 'Confirmed' && end && end >= now;
      });
    }
    if (bookingTab === 'history') {
      return resourceBookings.filter(b => {
        const end = toLocalDate(b.endAt);
        return b.status === 'Cancelled' || (end && end < now);
      });
    }
    return resourceBookings;
  }, [resourceBookings, bookingTab]);

  if (loading && !data) {
    return <LoadingSpinner text={isEn ? 'Loading Resources & Facilities...' : 'Đang tải dữ liệu Tài nguyên & Thiết bị...'} />;
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. Header Banner */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2F7B5D] via-[#24828F] via-[#3FAEB8] to-[#E5A33C] dark:from-[#184534] dark:via-[#144850] dark:via-[#1B5760] dark:to-[#5E4014] text-white p-6 sm:p-7 shadow-xl shadow-[#24828F]/20 border border-white/30 dark:border-white/10">
        <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-[#F2CC8F]/45 via-[#E5A33C]/30 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-[#81B29A]/40 via-[#2F7B5D]/30 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-[#A8DADC]/30 rounded-full blur-3xl" />

        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
        </svg>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 text-[#1B4332] dark:text-emerald-300 text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/80 dark:border-white/20 shadow-xs">
              <span className="material-symbols-outlined text-[15px] text-amber-500">inventory_2</span>
              {isEn ? 'Resources & Facilities Management' : 'Tài nguyên & Thiết bị Huấn luyện viên'}
            </span>

            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 px-3.5 py-1.5 text-xs font-bold text-white transition-all backdrop-blur-md border border-white/30 cursor-pointer shadow-xs hover-lift"
            >
              <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>{isEn ? 'Refresh' : 'Làm mới'}</span>
            </button>
          </div>

          <h1 className="text-xl sm:text-2xl font-chivo font-black tracking-tight text-white mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            {isEn ? 'Resources, Courts & Training Equipment' : 'Tài nguyên, Sân tập & Thiết bị chuyên dụng'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-white/95 max-w-3xl font-medium leading-relaxed drop-shadow-xs">
            {isEn
              ? 'Schedule training courts, request specialized fitness equipment, and promptly report facility damage for immediate technician maintenance.'
              : 'Đăng ký phòng/sân tập phục vụ huấn luyện, mượn trang thiết bị và gửi cảnh báo sự cố kỹ thuật trực tiếp tới ban quản lý.'}
          </p>

          <div className="mt-4 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-[#F2CC8F]/90 block">
                {isEn ? 'Available Equipment & Courts' : 'Tài nguyên & Sân tập'}
              </span>
              <span className="text-lg font-black text-white">
                {resources.length}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-[#F2CC8F]/90 block">
                {isEn ? 'My Active Bookings' : 'Lượt đặt của tôi'}
              </span>
              <span className="text-lg font-black text-emerald-300">
                {resourceBookings.length}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-[#F2CC8F]/90 block">
                {isEn ? 'Reported Issues' : 'Sự cố đã báo cáo'}
              </span>
              <span className="text-lg font-black text-amber-300">
                {equipmentIssues.length}
              </span>
            </div>
          </div>
        </div>
      </header>

      <CoachError message={error} retry={loadData} />

      {/* 2. Actions: Book Court/Equipment + Report Issue */}
      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title={isEn ? 'Book Court / Equipment' : 'Đăng ký khu vực / Thiết bị tập luyện'} icon="stadium">
          <form onSubmit={handleBooking} className="space-y-3.5">
            <FormField title={isEn ? 'Resource / Court / Equipment' : 'Tài nguyên / Sân tập'} required>
              <select
                name="resourceId"
                value={selectedResourceId}
                onChange={e => setSelectedResourceId(e.target.value)}
                required
                className={selectClass}
              >
                <option value="">{isEn ? '-- Select Court or Facility Equipment --' : '-- Chọn sân hoặc trang thiết bị --'}</option>
                {resources.map(x => (
                  <option key={x.id} value={x.id}>{translateRoomName(x.name, isEn)} · ({x.resourceType})</option>
                ))}
              </select>
            </FormField>

            {/* Hiển thị tình trạng lịch đã đặt của tài nguyên đang chọn */}
            {selectedResourceId && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-750/70 p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-amber-500">event_upcoming</span>
                    {isEn ? 'Existing Bookings for this Resource:' : 'Lịch đã đặt của sân/thiết bị này:'}
                  </span>
                  <span className="text-[11px] font-normal text-slate-400">
                    {activeScheduleForSelected.length} {isEn ? 'active slot(s)' : 'lượt đã đăng ký'}
                  </span>
                </div>

                {activeScheduleForSelected.length === 0 ? (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">check_circle</span>
                    {isEn ? 'No conflicting bookings found. This resource is free to reserve.' : 'Chưa có lượt đặt nào trong khung giờ tới. Bạn có thể tự do đặt lịch.'}
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {activeScheduleForSelected.map(b => {
                      const isMine = b.coachId === myCoachId || resourceBookings.some(rb => rb.id === b.id);
                      return (
                        <div
                          key={b.id}
                          className={`p-2 rounded-lg border text-[11px] flex items-center justify-between gap-2 ${
                            isMine
                              ? 'bg-amber-50/80 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/50 text-amber-900 dark:text-amber-200'
                              : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div>
                            <span className="font-bold block">
                              {formatDate(b.startAt, isEn)} — {formatDate(b.endAt, isEn)}
                            </span>
                            <span className="text-[10px] opacity-80">
                              {isMine ? (isEn ? '⭐ Your booking' : '⭐ Lượt đặt của bạn') : (b.coachName || (isEn ? 'Another Coach' : 'HLV khác'))} · {b.purpose}
                            </span>
                          </div>
                          {isMine && (
                            <button
                              type="button"
                              disabled={working}
                              onClick={() => act(() => coachProfessionalApi.cancelResource(b.id), isEn ? 'Booking cancelled.' : 'Đã hủy lượt đặt.')}
                              className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-[10px] cursor-pointer shrink-0"
                            >
                              {isEn ? 'Cancel slot' : 'Hủy lượt'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <FormField title={isEn ? 'Start Time' : 'Bắt đầu'} required>
                <input
                  name="startAt"
                  type="datetime-local"
                  value={bookingStart}
                  onChange={e => setBookingStart(e.target.value)}
                  required
                  className={inputClass}
                />
              </FormField>
              <FormField title={isEn ? 'End Time' : 'Kết thúc'} hint={isEn ? 'Max 12h/session' : 'Tối đa 12h/lượt'} required>
                <input
                  name="endAt"
                  type="datetime-local"
                  value={bookingEnd}
                  onChange={e => setBookingEnd(e.target.value)}
                  required
                  className={inputClass}
                />
              </FormField>
            </div>

            <FormField title={isEn ? 'Purpose of Use' : 'Mục đích sử dụng'} required>
              <input
                name="purpose"
                required
                placeholder={isEn ? 'E.g., Advanced swimming class / 1-on-1 PT' : 'VD: Dạy lớp bơi nâng cao / Huấn luyện PT'}
                className={inputClass}
              />
            </FormField>

            {/* Cảnh báo xung đột thời gian thực */}
            {conflictInfo && (
              <div className="rounded-xl border border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40 p-3 text-xs text-rose-800 dark:text-rose-200 space-y-1 animate-fadeIn">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-[17px] text-rose-600 dark:text-rose-400">warning</span>
                  <span>{isEn ? 'Schedule Conflict Detected!' : 'Xung đột lịch đã được phát hiện!'}</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {isEn
                    ? `This resource is already booked from ${formatDate(conflictInfo.startAt, true)} to ${formatDate(conflictInfo.endAt, true)}.`
                    : `Sân/thiết bị này đã có lịch đặt từ ${formatDate(conflictInfo.startAt, false)} đến ${formatDate(conflictInfo.endAt, false)} (${conflictInfo.purpose}).`}
                  {' '}
                  {conflictInfo.coachId === myCoachId || resourceBookings.some(rb => rb.id === conflictInfo.id) ? (
                    <strong className="underline text-amber-700 dark:text-amber-300 block mt-1">
                      {isEn
                        ? '👉 This is your own active booking. If you want to change hours, please cancel it in "My Resource Bookings" below first.'
                        : '👉 Đây chính là lượt đặt của bạn. Nếu muốn đổi khung giờ, bạn hãy bấm "Hủy" ở danh sách bên dưới rồi đặt lại.'}
                    </strong>
                  ) : (
                    <span>{isEn ? 'Please choose a different time window.' : 'Vui lòng chọn khung giờ khác.'}</span>
                  )}
                </p>
              </div>
            )}

            <button
              disabled={working || !resources.length || Boolean(conflictInfo)}
              className={`${buttonPrimary} w-full ${conflictInfo ? 'opacity-50 cursor-not-allowed bg-slate-600' : ''}`}
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              <span>
                {conflictInfo
                  ? (isEn ? 'Time Slot Unavailable (Conflict)' : 'Khung giờ bị trùng lịch')
                  : (isEn ? 'Check Availability & Book' : 'Kiểm tra & Đặt lịch')}
              </span>
            </button>
          </form>
        </SectionCard>

        <SectionCard title={isEn ? 'Report Maintenance Issue' : 'Báo cáo sự cố thiết bị & An toàn'} icon="report_problem">
          <form onSubmit={handleIssue} className="space-y-3">
            <FormField title={isEn ? 'Affected Facility / Equipment' : 'Thiết bị / Khu vực gặp sự cố'}>
              <select name="resourceId" className={selectClass}>
                <option value="">{isEn ? '-- General Facility / Other --' : '-- Thiết bị chung / Khác --'}</option>
                {resources.map(x => (
                  <option key={x.id} value={x.id}>{translateRoomName(x.name, isEn)}</option>
                ))}
              </select>
            </FormField>
            <FormField title={isEn ? 'Severity Level' : 'Mức độ nghiêm trọng'}>
              <select name="severity" className={selectClass}>
                <option value="Low">{isEn ? 'Low (Low priority - No immediate impact)' : 'Low (Thấp - Không ảnh hưởng ngay)'}</option>
                <option value="Medium">{isEn ? 'Medium (Moderate - Resolve within 24h)' : 'Medium (Trung bình - Cần sửa trong 24h)'}</option>
                <option value="High">{isEn ? 'High (High - Impedes training sessions)' : 'High (Cao - Ảnh hưởng buổi tập)'}</option>
                <option value="Critical">{isEn ? 'Critical (Severe - Safety hazard)' : 'Critical (Nghiêm trọng - Nguy cơ mất an toàn)'}</option>
              </select>
            </FormField>
            <FormField title={isEn ? 'Issue Title' : 'Tiêu đề sự cố'} required>
              <input name="title" required placeholder={isEn ? 'E.g., Pulley cable frayed on multi-gym' : 'VD: Dây cáp tạ đa năng bị xơ'} className={inputClass} />
            </FormField>
            <FormField title={isEn ? 'Scene Description & Safety Hazard' : 'Mô tả hiện trường & Cảnh báo an toàn'} required>
              <textarea name="description" required rows="2" placeholder={isEn ? 'Specify damage details, exact room/zone...' : 'Chi tiết hư hỏng, vị trí chính xác...'} className={inputClass} />
            </FormField>
            <FormField title={isEn ? 'Photo of Issue' : 'Ảnh hiện trường'}>
              <input
                type="file"
                accept="image/*"
                onChange={e => uploadPhoto(e.target.files?.[0])}
                className={inputClass}
              />
            </FormField>
            <button disabled={working || uploading} className={`${buttonPrimary} w-full`}>
              <span className="material-symbols-outlined text-[18px]">build</span>
              <span>{uploading ? (isEn ? 'Uploading photo...' : 'Đang tải ảnh hiện trường...') : (isEn ? 'Submit Incident Report' : 'Gửi báo cáo sự cố')}</span>
            </button>
          </form>
        </SectionCard>
      </div>

      {/* 3. History: Bookings & Issues */}
      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard
          title={isEn ? 'My Resource Bookings' : 'Lượt đặt tài nguyên của tôi'}
          icon="history"
          action={
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setBookingTab('active')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  bookingTab === 'active'
                    ? 'bg-[#1E2235] text-[#F2CC8F] dark:bg-white dark:text-slate-900 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
              >
                {isEn ? 'Active' : 'Đang hoạt động'}
              </button>
              <button
                type="button"
                onClick={() => setBookingTab('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  bookingTab === 'all'
                    ? 'bg-[#1E2235] text-[#F2CC8F] dark:bg-white dark:text-slate-900 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
              >
                {isEn ? 'All' : 'Tất cả'} ({resourceBookings.length})
              </button>
              <button
                type="button"
                onClick={() => setBookingTab('history')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  bookingTab === 'history'
                    ? 'bg-[#1E2235] text-[#F2CC8F] dark:bg-white dark:text-slate-900 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
              >
                {isEn ? 'History' : 'Lịch sử'}
              </button>
            </div>
          }
        >
          {!filteredMyBookings.length ? (
            <EmptyState icon="event_available" isEn={isEn}>
              {isEn ? 'No equipment bookings in this tab.' : 'Không có lượt đặt thiết bị nào trong mục này.'}
            </EmptyState>
          ) : (
            <div className="space-y-2">
              {filteredMyBookings.map(x => {
                const now = new Date();
                const start = toLocalDate(x.startAt);
                const end = toLocalDate(x.endAt);
                const isOngoing = x.status === 'Confirmed' && start && end && now >= start && now <= end;
                const isUpcoming = x.status === 'Confirmed' && start && now < start;
                const isCancelled = x.status === 'Cancelled';

                return (
                  <div
                    key={x.id}
                    className={`p-3 rounded-xl border transition-all text-xs flex items-center justify-between gap-3 ${
                      isOngoing
                        ? 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30'
                        : isCancelled
                        ? 'border-slate-200 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/40 opacity-70'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 dark:text-white font-bold">{x.resourceName}</strong>
                        {isOngoing && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            {isEn ? 'In Use Now' : 'Đang sử dụng'}
                          </span>
                        )}
                        {isUpcoming && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-300">
                            {isEn ? 'Upcoming' : 'Sắp diễn ra'}
                          </span>
                        )}
                        {isCancelled && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                            {isEn ? 'Cancelled' : 'Đã hủy'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                        <span className="text-[#2F7B5D] dark:text-[#81B29A] font-bold">
                          {formatDate(x.startAt, isEn)}
                        </span>
                        {' — '}
                        <span className="text-[#2F7B5D] dark:text-[#81B29A] font-bold">
                          {formatDate(x.endAt, isEn)}
                        </span>
                        {' · '}
                        <span className="italic">{x.purpose}</span>
                      </div>
                    </div>

                    {x.status === 'Confirmed' && end && end >= now && (
                      <button
                        disabled={working}
                        onClick={async () => {
                          const ok = await confirm({
                            title: isEn ? 'Cancel Booking' : 'Xác nhận hủy đặt sân/thiết bị',
                            message: isEn ? 'Are you sure you want to cancel this booking?' : 'Bạn có chắc chắn muốn hủy lượt đặt này?',
                            confirmText: isEn ? 'Cancel Booking' : 'Hủy lượt đặt',
                            cancelText: isEn ? 'Keep' : 'Không hủy',
                            type: 'warning'
                          });
                          if (ok) {
                            act(() => coachProfessionalApi.cancelResource(x.id), isEn ? 'Booking cancelled.' : 'Đã hủy lượt đặt.');
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 font-bold text-xs cursor-pointer shrink-0 transition-colors border border-rose-200 dark:border-rose-800/60"
                      >
                        {isEn ? 'Cancel Booking' : 'Hủy lượt đặt'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard title={isEn ? 'Reported Issues Status' : 'Tiến độ xử lý sự cố đã báo'} icon="assignment_late">
          {!equipmentIssues.length ? (
            <EmptyState icon="check_circle" isEn={isEn}>
              {isEn ? 'All reported issues have been resolved.' : 'Hiện không có sự cố nào chưa được xử lý.'}
            </EmptyState>
          ) : (
            <div className="space-y-2">
              {equipmentIssues.map(x => (
                <div key={x.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-slate-900 dark:text-white">{x.title}</strong>
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-50 text-red-600 border border-red-200">
                        {x.severity}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${issueStatusMeta(x.status, isEn).cls}`}>
                        {issueStatusMeta(x.status, isEn).label}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    {x.resourceName || (isEn ? 'Other Equipment' : 'Thiết bị khác')} · {formatDate(x.reportedAt, isEn)}
                  </span>
                  {x.photoUrl && (
                    <a
                      href={x.photoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1 pt-0.5"
                    >
                      <span className="material-symbols-outlined text-[14px]">image</span>
                      <span>{isEn ? 'View attached photo' : 'Xem ảnh hiện trường'}</span>
                    </a>
                  )}
                  {x.resolutionNote && (
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium pt-1">
                      {isEn ? 'Technician Response: ' : 'Kỹ thuật phản hồi: '}{x.resolutionNote}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* 4. Center-wide Resource Schedule Inspection */}
      {centerResourceBookings.length > 0 && (
        <SectionCard
          title={isEn ? 'Center Court & Equipment Occupancy Schedule' : 'Lịch đặt sân & Thiết bị chung tại trung tâm'}
          icon="calendar_month"
          action={
            <button
              type="button"
              onClick={() => setViewCenterSchedule(!viewCenterSchedule)}
              className="text-xs font-bold text-[#24828F] dark:text-[#81B29A] hover:underline cursor-pointer"
            >
              {viewCenterSchedule ? (isEn ? 'Collapse' : 'Thu gọn') : (isEn ? 'Expand Overview' : 'Xem chi tiết')}
            </button>
          }
        >
          {viewCenterSchedule ? (
            <div className="space-y-2 mt-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                {isEn
                  ? 'All upcoming confirmed bookings by coaches in your sports center:'
                  : 'Danh sách các lượt đặt lịch đang hiệu lực của tất cả Huấn luyện viên tại trung tâm:'}
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {centerResourceBookings.map(b => {
                  const isMine = b.coachId === myCoachId || resourceBookings.some(rb => rb.id === b.id);
                  return (
                    <div
                      key={b.id}
                      className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                        isMine
                          ? 'border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-750/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 dark:text-white font-bold">{b.resourceName}</strong>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isMine ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {isMine ? (isEn ? 'You' : 'Bạn') : b.coachName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                        {formatDate(b.startAt, isEn)} → {formatDate(b.endAt, isEn)}
                      </div>
                      <div className="text-[10px] text-slate-400 italic">
                        {b.purpose}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-500 py-1">
              <span>
                {isEn
                  ? `Currently ${centerResourceBookings.length} court/equipment slots are reserved across the center.`
                  : `Hiện có ${centerResourceBookings.length} lượt đặt sân và thiết bị đang được các HLV đăng ký.`}
              </span>
              <button
                type="button"
                onClick={() => setViewCenterSchedule(true)}
                className="text-xs font-bold text-[#24828F] dark:text-[#81B29A] hover:underline cursor-pointer"
              >
                {isEn ? 'View all' : 'Xem toàn bộ'}
              </button>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
