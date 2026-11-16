import React, { useState, useEffect } from 'react';
import { bookingApi } from '../../../entities/booking/index.js';
import { classApi } from '../../../entities/class/index.js';
import { receptionApi } from '../../../entities/member/index.js';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { Badge } from '../../../shared/ui/StatCard.jsx';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';

export function CounterBooking() {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const { showError, showSuccess } = useToast();
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [busy, setBusy] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const hash = window.location.hash || '';
    const match = hash.match(/[?&]query=([^&]+)/);
    if (match && match[1]) {
      const q = decodeURIComponent(match[1]);
      setQuery(q);
      executeSearch(q);
    }
  }, []);

  const executeSearch = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) return;
    setSearching(true);
    try {
      const results = await receptionApi.lookupMember(searchTerm.trim());
      setMembers(results || []);
      if (results?.length === 1) {
        setSelected(results[0]);
        await refresh(results[0]);
      }
    } catch (e) {
      showError(e.message || (isEn ? 'Failed to search members' : 'Không thể tìm kiếm hội viên'));
    } finally {
      setSearching(false);
    }
  };

  const run = async fn => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      showError(e.message || (isEn ? 'Operation failed' : 'Thao tác thất bại'));
    } finally {
      setBusy(false);
    }
  };

  const refresh = async member => {
    if (!member?.id) return;
    const [s, b, w] = await Promise.all([
      classApi.getAll(),
      bookingApi.getForMember(member.id),
      bookingApi.getWaitlistForMember(member.id).catch(() => [])
    ]);
    setSessions(s || []);
    setBookings(b || []);
    setWaitlist(w || []);
  };

  const waitlistBySession = new Map(waitlist.map(w => [w.sessionId, w]));
  const bookedSessionIds = new Set(bookings.filter(b => b.status === 'CONFIRMED').map(b => b.sessionId));

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Top Banner */}
      <div className="scms-hero relative rounded-3xl bg-gradient-to-r from-brand-sage-700 via-brand-teal-600 via-brand-teal-500 to-brand-sand-500 dark:from-brand-sage-900 dark:via-brand-teal-900 dark:via-brand-teal-800 dark:to-brand-sand-900 text-white p-6 sm:p-7 border border-white/30 dark:border-white/10 shadow-xl shadow-brand-teal-600/20 overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-brand-sand-300/45 via-brand-sand-500/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-brand-sage-500/40 via-brand-sage-700/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-brand-teal-300/30 rounded-full blur-3xl pointer-events-none" />

        {/* Subtle decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
        </svg>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-brand-navy-900/90 backdrop-blur-md text-brand-sage-900 dark:text-brand-sage-300 border border-white/80 dark:border-white/20 text-xs font-black uppercase tracking-wider shadow-xs">
            <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse" />
            <span>{isEn ? 'COUNTER CLASS SCHEDULING' : 'ĐẶT CHỖ & HỦY LỚP TẠI QUẦY'}</span>
          </div>
          <h1 className="font-chivo text-2xl md:text-3xl font-black mt-2 text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            {isEn ? 'Counter Class Booking & Cancellation' : 'Đặt / Hủy Lớp Cho Hội Viên Tại Quầy'}
          </h1>
          <p className="text-xs sm:text-sm text-white/95 mt-1 max-w-xl font-medium leading-relaxed drop-shadow-xs">
            {isEn
              ? 'Assist walk-in members to enroll into sport classes, manage reservations, or handle cancellations.'
              : 'Hỗ trợ hội viên đăng ký buổi tập, đặt chỗ lớp thể thao và xử lý hủy ca trực tiếp tại quầy.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 relative z-10 shrink-0">
          <a
            href="#/receptionist/lookup"
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all border border-white/30 hover-lift flex items-center gap-2 backdrop-blur-md shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px] text-white">person_search</span>
            <span>{isEn ? 'Member Lookup' : 'Tra Cứu'}</span>
          </a>
          <a
            href="#/receptionist/check-in"
            className="px-4 py-2.5 bg-brand-navy-950 hover:bg-brand-navy-900 text-white rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all shadow-md hover:shadow-lg hover-lift flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px] text-brand-sage-400">how_to_reg</span>
            <span>{isEn ? 'Gate Check-in' : 'Check-in'}</span>
          </a>
        </div>
      </div>

      {/* Search Bar */}
      <form
        className="max-w-2xl bg-white dark:bg-brand-navy-900 p-2.5 rounded-2xl shadow-sm border border-brand-navy-200 dark:border-brand-navy-800 flex items-center gap-2 hover-lift transition-all"
        onSubmit={e => {
          e.preventDefault();
          executeSearch(query);
        }}
      >
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-3 text-brand-navy-400">
            search
          </span>
          <input
            required
            minLength={2}
            className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-sage-500/40 text-brand-navy-900 dark:text-white bg-transparent font-medium"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={isEn ? 'Name, email, phone, or member card ID...' : 'Tên, email, điện thoại hoặc mã hội viên'}
          />
        </div>
        <button
          className="px-6 py-2.5 bg-brand-sage-700 hover:bg-brand-sage-900 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all hover-lift shrink-0 cursor-pointer disabled:opacity-50"
          disabled={busy || searching}
        >
          {searching ? (isEn ? 'Searching...' : 'Đang tìm...') : (isEn ? 'Search' : 'Tìm kiếm')}
        </button>
      </form>

      {/* Member Results List */}
      {members.length > 0 && !selected && (
        <div className="bg-white dark:bg-brand-navy-900 p-5 rounded-2xl border border-brand-navy-200 dark:border-brand-navy-800 shadow-sm space-y-3">
          <span className="text-xs font-bold text-brand-navy-500 dark:text-brand-navy-400 uppercase tracking-wider block">
            {isEn ? `Select Member (${members.length})` : `Chọn hội viên (${members.length})`}
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {members.map(m => (
              <button
                key={m.id}
                type="button"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    setSelected(m);
                    await refresh(m);
                  })
                }
                className="p-4 rounded-xl border border-brand-navy-200 dark:border-brand-navy-800 bg-white dark:bg-brand-navy-800/60 hover:border-brand-sage-500 text-left transition-all hover-lift flex items-center gap-3 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-brand-navy-900 text-brand-sand-300 font-bold text-xs flex items-center justify-center shrink-0">
                  {m.fullName?.charAt(0) || 'M'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-brand-navy-900 dark:text-white truncate">{m.fullName}</div>
                  <div className="text-[11px] text-brand-sage-700 dark:text-brand-sage-500 font-mono">{m.memberCode}</div>
                </div>
                <Badge variant={m.packageStatus} size="sm">{m.packageStatus}</Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="space-y-6">
          {/* Selected Member Header Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-brand-navy-900 border border-brand-navy-200 dark:border-brand-navy-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover-lift transition-all">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-brand-navy-900 text-brand-sand-300 font-black font-chivo text-base flex items-center justify-center border-2 border-brand-sage-500">
                {selected.fullName?.charAt(0) || 'M'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-chivo text-lg font-black text-brand-navy-900 dark:text-white">{selected.fullName}</h2>
                  <span className="font-mono text-xs font-bold text-brand-sage-700 dark:text-brand-sage-500">({selected.memberCode})</span>
                </div>
                <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-0.5">
                  {isEn
                    ? 'Booking window: 30 minutes to 7 days ahead. Cancellations within 2 hours will consume class credit.'
                    : 'Đặt trước 30 phút đến 7 ngày. Hủy dưới 2 giờ vẫn tính sử dụng buổi tập.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="px-4 py-2 border border-brand-navy-200 dark:border-brand-navy-700 rounded-xl text-xs font-bold text-brand-navy-600 dark:text-brand-navy-400 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 cursor-pointer self-start sm:self-auto"
            >
              {isEn ? 'Change Member' : 'Đổi hội viên'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Current Active Bookings (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-brand-navy-900 p-6 rounded-2xl border border-brand-navy-200 dark:border-brand-navy-800 shadow-sm space-y-4 hover-lift transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-brand-navy-100 dark:border-brand-navy-800">
                <h3 className="font-chivo text-sm font-bold text-brand-navy-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-brand-sage-700 dark:text-brand-sage-500">event_available</span>
                  <span>{isEn ? `Active Bookings (${bookings.length})` : `Lượt Đặt Hiện Tại (${bookings.length})`}</span>
                </h3>
              </div>

              {bookings.length === 0 ? (
                <div className="py-8 text-center text-xs text-brand-navy-400 dark:text-brand-navy-500">
                  {isEn ? 'No current bookings for this member.' : 'Hội viên chưa có lượt đặt lớp nào.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map(b => (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl border border-brand-navy-200 dark:border-brand-navy-800 bg-brand-navy-50/50 dark:bg-brand-navy-800/40 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-chivo font-bold text-sm text-brand-navy-900 dark:text-white">{b.className}</span>
                          <Badge variant={b.status} size="sm">{b.status}</Badge>
                        </div>
                        <div className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-1 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[15px]">calendar_today</span>
                          <span>{b.bookingDate}</span>
                          <span>•</span>
                          <span className="material-symbols-outlined text-[15px]">schedule</span>
                          <span>{b.timeSlot}</span>
                        </div>
                      </div>

                      {b.status === 'CONFIRMED' && (
                        <div className="flex justify-end pt-2 border-t border-brand-navy-200/60 dark:border-brand-navy-700/60">
                          <button
                            type="button"
                            className="px-3.5 py-1.5 bg-brand-terra-500/15 hover:bg-brand-terra-500/25 text-brand-terra-700 border border-brand-terra-500/30 rounded-lg text-xs font-bold font-chivo uppercase tracking-wider transition-all hover-lift cursor-pointer disabled:opacity-50"
                            disabled={busy}
                            onClick={() =>
                              run(async () => {
                                const r = await bookingApi.cancelForMember(selected.id, b.id);
                                showSuccess(r.message || (isEn ? 'Booking cancelled' : 'Đã hủy chỗ'));
                                await refresh(selected);
                              })
                            }
                          >
                            {isEn ? 'Cancel Reservation' : 'Hủy Chỗ'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Hàng chờ của hội viên: vị trí FIFO + lễ tân có thể rút khỏi hàng */}
              <div className="pt-4 border-t border-brand-navy-100 dark:border-brand-navy-800 space-y-3">
                <h3 className="font-chivo text-sm font-bold text-brand-navy-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-brand-sand-500">hourglass_top</span>
                  <span>{isEn ? `Waitlist (${waitlist.length})` : `Hàng Chờ (${waitlist.length})`}</span>
                </h3>
                {waitlist.length === 0 ? (
                  <div className="py-3 text-center text-xs text-brand-navy-400 dark:text-brand-navy-500">
                    {isEn ? 'This member is not waiting for any session.' : 'Hội viên không có trong hàng chờ buổi nào.'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {waitlist.map(w => (
                      <div
                        key={w.id}
                        className="p-3 rounded-xl border border-brand-sand-300/60 bg-brand-sand-50/60 dark:bg-brand-navy-800/40 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="font-chivo font-bold text-sm text-brand-navy-900 dark:text-white truncate">{w.className}</div>
                          <div className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
                            {w.sessionDate} • {String(w.startTime || '').slice(0, 5)} - {String(w.endTime || '').slice(0, 5)}
                            {' • '}
                            <strong className="text-brand-sand-800 dark:text-brand-sand-300">
                              {isEn ? `Position #${w.position}` : `Vị trí #${w.position}`}
                            </strong>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            run(async () => {
                              try {
                                await bookingApi.leaveWaitlistForMember(selected.id, w.id);
                                showSuccess(isEn ? 'Removed from waitlist' : 'Đã rút hội viên khỏi hàng chờ');
                              } finally {
                                await refresh(selected);
                              }
                            })
                          }
                          className="px-3 py-1.5 bg-brand-terra-500/15 hover:bg-brand-terra-500/25 text-brand-terra-700 border border-brand-terra-500/30 rounded-lg text-xs font-bold font-chivo uppercase tracking-wider shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          {isEn ? 'Remove' : 'Rút khỏi hàng'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Available Classes (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-brand-navy-900 p-6 rounded-2xl border border-brand-navy-200 dark:border-brand-navy-800 shadow-sm space-y-4 hover-lift transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-brand-navy-100 dark:border-brand-navy-800">
                <h3 className="font-chivo text-sm font-bold text-brand-navy-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-brand-sand-300">sports_gymnastics</span>
                  <span>{isEn ? `Available Classes & Sessions (${sessions.length})` : `Lịch Lớp Thể Thao Mở (${sessions.length})`}</span>
                </h3>
              </div>

              {sessions.length === 0 ? (
                <div className="py-8 text-center text-xs text-brand-navy-400 dark:text-brand-navy-500">
                  {isEn ? 'No open class sessions available right now.' : 'Hiện chưa có lịch lớp nào mở.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map(s => {
                    const isFull = s.enrolledCount >= s.capacity;
                    const queued = waitlistBySession.get(s.sessionId || s.id);
                    const isBooked = bookedSessionIds.has(s.sessionId || s.id);
                    const blockedFull = isFull && !s.allowWaitlist;
                    return (
                      <div
                        key={s.id}
                        className="p-4 rounded-xl border border-brand-navy-200 dark:border-brand-navy-800 bg-white dark:bg-brand-navy-800/40 hover:border-brand-navy-300 dark:hover:border-brand-navy-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-chivo font-bold text-sm text-brand-navy-900 dark:text-white">{s.name}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300">
                              {s.sport || 'Sports'}
                            </span>
                          </div>
                          <div className="text-xs text-brand-navy-500 dark:text-brand-navy-400 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                              {s.sessionDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              {s.timeSlot}
                            </span>
                          </div>
                          <div className="text-[11px] font-medium text-brand-navy-600 dark:text-brand-navy-400">
                            {isEn ? 'Capacity' : 'Sức chứa'}:{' '}
                            <strong className={isFull ? 'text-brand-terra-700 dark:text-brand-terra-400' : 'text-brand-sage-700 dark:text-brand-sage-500'}>
                              {s.enrolledCount}/{s.capacity}
                            </strong>
                            {s.waitlistCount > 0 && (
                              <span className="ml-2 text-brand-sand-800 dark:text-brand-sand-300">
                                • {isEn ? `${s.waitlistCount} waiting` : `${s.waitlistCount} người đang chờ`}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={busy || !s.isBookable || isBooked || Boolean(queued) || blockedFull}
                          onClick={() =>
                            run(async () => {
                              const r = await bookingApi.bookForMember(selected.id, s.id);
                              showSuccess(r.message || (isEn ? 'Class booked successfully' : 'Đặt chỗ thành công'));
                              await refresh(selected);
                            })
                          }
                          className={`px-4 py-2 rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all hover-lift shrink-0 cursor-pointer disabled:opacity-50 ${
                            isFull
                              ? 'bg-brand-sand-300/20 hover:bg-brand-sand-300/30 text-brand-sand-800 dark:text-brand-sand-300 border border-brand-sand-300/40'
                              : 'bg-brand-sage-700 hover:bg-brand-sage-900 text-white shadow-md'
                          }`}
                        >
                          {isBooked
                            ? (isEn ? 'Booked' : 'Đã đặt')
                            : queued
                              ? (isEn ? `Waiting #${queued.position}` : `Đang chờ #${queued.position}`)
                              : blockedFull
                                ? (isEn ? 'Full' : 'Hết chỗ')
                                : isFull
                                  ? (isEn ? 'Join Waitlist' : 'Vào danh sách chờ')
                                  : (isEn ? 'Book Slot' : 'Đặt chỗ')}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
