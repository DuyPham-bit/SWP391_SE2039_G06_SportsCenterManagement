import React, { useEffect, useState } from 'react';
import { coachProfessionalApi } from '../../services/api.js';
import { uploadMediaFileToCloud } from '../../services/cloudMediaStorage.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { LoadingSpinner } from '../../components/common/Table.jsx';
import { CoachError } from './CoachShared.jsx';

const inputClass = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-750 px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-[#1A3B8B] dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 outline-none transition-all shadow-2xs';
const selectClass = `${inputClass} cursor-pointer`;
const buttonPrimary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#1A3B8B] hover:bg-[#142F70] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

function SectionCard({ title, icon, action, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-4 sm:p-5 shadow-xs transition-colors ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1A3B8B] dark:text-blue-400 flex items-center justify-center shrink-0">
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

function formatDate(value, isEn = false) {
  return value ? new Date(value).toLocaleString(isEn ? 'en-US' : 'vi-VN') : '—';
}

export function CoachResources() {
  const { showSuccess, showError } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);

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

  const handleBooking = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    return act(
      () =>
        coachProfessionalApi.bookResource({
          resourceId: Number(f.get('resourceId')),
          workEventId: null,
          startAt: f.get('startAt'),
          endAt: f.get('endAt'),
          purpose: f.get('purpose')
        }),
      isEn ? 'Resource booked; schedule conflict checks passed.' : 'Đã đặt tài nguyên; hệ thống đã kiểm tra xung đột lịch.'
    ).then((ok) => ok && e.target.reset());
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

  if (loading && !data) {
    return <LoadingSpinner text={isEn ? 'Loading Resources & Facilities...' : 'Đang tải dữ liệu Tài nguyên & Thiết bị...'} />;
  }

  const resources = data?.resources || [];
  const resourceBookings = data?.resourceBookings || [];
  const equipmentIssues = data?.equipmentIssues || [];

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. Header Banner */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1A3B8B] via-[#1E40AF] to-[#2563EB] text-white p-5 sm:p-7 shadow-md">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-bold uppercase tracking-wider backdrop-blur-xs border border-white/20 shadow-2xs">
              <span className="material-symbols-outlined text-[15px]">inventory_2</span>
              {isEn ? 'Resources & Facilities Management' : 'Tài nguyên & Thiết bị Huấn luyện viên'}
            </span>

            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 px-3.5 py-1.5 text-xs font-bold text-white transition-all backdrop-blur-xs border border-white/20 cursor-pointer shadow-2xs"
            >
              <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>{isEn ? 'Refresh' : 'Làm mới'}</span>
            </button>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
            {isEn ? 'Resources, Courts & Training Equipment' : 'Tài nguyên, Sân tập & Thiết bị chuyên dụng'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-blue-100/90 max-w-3xl leading-relaxed">
            {isEn
              ? 'Schedule training courts, request specialized fitness equipment, and promptly report facility damage for immediate technician maintenance.'
              : 'Đăng ký phòng/sân tập phục vụ huấn luyện, mượn trang thiết bị và gửi cảnh báo sự cố kỹ thuật trực tiếp tới ban quản lý.'}
          </p>

          {/* Quick Stats Grid inside Hero Header */}
          <div className="mt-4 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-blue-200 block">
                {isEn ? 'Available Equipment & Courts' : 'Tài nguyên & Sân tập'}
              </span>
              <span className="text-lg font-black text-white">
                {resources.length}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-blue-200 block">
                {isEn ? 'My Active Bookings' : 'Lượt đặt của tôi'}
              </span>
              <span className="text-lg font-black text-emerald-300">
                {resourceBookings.length}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-blue-200 block">
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
          <form onSubmit={handleBooking} className="space-y-3">
            <FormField title={isEn ? 'Resource / Court / Equipment' : 'Tài nguyên / Sân tập'} required>
              <select name="resourceId" required className={selectClass}>
                <option value="">{isEn ? '-- Select Court or Facility Equipment --' : '-- Chọn sân hoặc trang thiết bị --'}</option>
                {resources.map(x => (
                  <option key={x.id} value={x.id}>{x.name} · ({x.resourceType})</option>
                ))}
              </select>
            </FormField>
            <div className="grid grid-cols-2 gap-2">
              <FormField title={isEn ? 'Start Time' : 'Bắt đầu'} required>
                <input name="startAt" type="datetime-local" required className={inputClass} />
              </FormField>
              <FormField title={isEn ? 'End Time' : 'Kết thúc'} required>
                <input name="endAt" type="datetime-local" required className={inputClass} />
              </FormField>
            </div>
            <FormField title={isEn ? 'Purpose of Use' : 'Mục đích sử dụng'} required>
              <input name="purpose" required placeholder={isEn ? 'E.g., Advanced swimming class / 1-on-1 PT' : 'VD: Dạy lớp bơi nâng cao / Huấn luyện PT'} className={inputClass} />
            </FormField>
            <button disabled={working || !resources.length} className={`${buttonPrimary} w-full`}>
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              <span>{isEn ? 'Check Availability & Book' : 'Kiểm tra & Đặt lịch'}</span>
            </button>
          </form>
        </SectionCard>

        <SectionCard title={isEn ? 'Report Maintenance Issue' : 'Báo cáo sự cố thiết bị & An toàn'} icon="report_problem">
          <form onSubmit={handleIssue} className="space-y-3">
            <FormField title={isEn ? 'Affected Facility / Equipment' : 'Thiết bị / Khu vực gặp sự cố'}>
              <select name="resourceId" className={selectClass}>
                <option value="">{isEn ? '-- General Facility / Other --' : '-- Thiết bị chung / Khác --'}</option>
                {resources.map(x => (
                  <option key={x.id} value={x.id}>{x.name}</option>
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
        <SectionCard title={isEn ? 'My Resource Bookings' : 'Lượt đặt tài nguyên của tôi'} icon="history">
          {!resourceBookings.length ? (
            <EmptyState icon="event_available" isEn={isEn}>
              {isEn ? 'No equipment bookings found.' : 'Chưa có lượt đặt thiết bị nào.'}
            </EmptyState>
          ) : (
            <div className="space-y-2">
              {resourceBookings.map(x => (
                <div key={x.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 flex items-center justify-between text-xs">
                  <div>
                    <strong className="block text-slate-900 dark:text-white">{x.resourceName}</strong>
                    <span className="text-[11px] text-slate-500">
                      {formatDate(x.startAt, isEn)} → {formatDate(x.endAt, isEn)} · {x.purpose}
                    </span>
                  </div>
                  {x.status === 'Confirmed' && (
                    <button
                      disabled={working}
                      onClick={() => act(() => coachProfessionalApi.cancelResource(x.id), isEn ? 'Booking cancelled.' : 'Đã hủy lượt đặt.')}
                      className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold cursor-pointer"
                    >
                      {isEn ? 'Cancel' : 'Hủy'}
                    </button>
                  )}
                </div>
              ))}
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
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 dark:text-white">{x.title}</strong>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      {x.severity} · {x.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    {x.resourceName || (isEn ? 'Other Equipment' : 'Thiết bị khác')} · {formatDate(x.reportedAt, isEn)}
                  </span>
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
    </div>
  );
}
