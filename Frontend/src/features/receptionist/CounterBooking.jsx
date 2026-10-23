import React, { useState, useEffect } from 'react';
import { bookingApi, classApi, receptionApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/StatCard.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function CounterBooking() {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const { showError, showSuccess } = useToast();
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState([]);
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
    const [s, b] = await Promise.all([classApi.getAll(), bookingApi.getForMember(member.id)]);
    setSessions(s || []);
    setBookings(b || []);
  };

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Top Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#2F7B5D] via-[#24828F] via-[#3FAEB8] to-[#E5A33C] dark:from-[#184534] dark:via-[#144850] dark:via-[#1B5760] dark:to-[#5E4014] text-white p-6 sm:p-7 border border-white/30 dark:border-white/10 shadow-xl shadow-[#24828F]/20 overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-[#F2CC8F]/45 via-[#E5A33C]/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-[#81B29A]/40 via-[#2F7B5D]/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-[#A8DADC]/30 rounded-full blur-3xl pointer-events-none" />

        {/* Subtle decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
        </svg>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[#1B4332] dark:text-emerald-300 border border-white/80 dark:border-white/20 text-xs font-black uppercase tracking-wider shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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
            className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all shadow-md hover:shadow-lg hover-lift flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px] text-emerald-400">how_to_reg</span>
            <span>{isEn ? 'Gate Check-in' : 'Check-in'}</span>
          </a>
        </div>
      </div>

      {/* Search Bar */}
      <form
        className="max-w-2xl bg-white dark:bg-slate-900 p-2.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-2 hover-lift transition-all"
        onSubmit={e => {
          e.preventDefault();
          executeSearch(query);
        }}
      >
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400">
            search
          </span>
          <input
            required
            minLength={2}
            className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#81B29A]/40 text-slate-900 dark:text-white bg-transparent font-medium"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={isEn ? 'Name, email, phone, or member card ID...' : 'Tên, email, điện thoại hoặc mã hội viên'}
          />
        </div>
        <button
          className="px-6 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all hover-lift shrink-0 cursor-pointer disabled:opacity-50"
          disabled={busy || searching}
        >
          {searching ? (isEn ? 'Searching...' : 'Đang tìm...') : (isEn ? 'Search' : 'Tìm kiếm')}
        </button>
      </form>

      {/* Member Results List */}
      {members.length > 0 && !selected && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
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
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-[#81B29A] text-left transition-all hover-lift flex items-center gap-3 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-[#1E2235] text-[#F2CC8F] font-bold text-xs flex items-center justify-center shrink-0">
                  {m.fullName?.charAt(0) || 'M'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-slate-900 dark:text-white truncate">{m.fullName}</div>
                  <div className="text-[11px] text-[#2D6A4F] dark:text-[#81B29A] font-mono">{m.memberCode}</div>
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
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover-lift transition-all">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-[#1E2235] text-[#F2CC8F] font-black font-chivo text-base flex items-center justify-center border-2 border-[#81B29A]">
                {selected.fullName?.charAt(0) || 'M'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-chivo text-lg font-black text-slate-900 dark:text-white">{selected.fullName}</h2>
                  <span className="font-mono text-xs font-bold text-[#2D6A4F] dark:text-[#81B29A]">({selected.memberCode})</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isEn
                    ? 'Booking window: 30 minutes to 7 days ahead. Cancellations within 2 hours will consume class credit.'
                    : 'Đặt trước 30 phút đến 7 ngày. Hủy dưới 2 giờ vẫn tính sử dụng buổi tập.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer self-start sm:self-auto"
            >
              {isEn ? 'Change Member' : 'Đổi hội viên'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Current Active Bookings (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover-lift transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-chivo text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#2D6A4F] dark:text-[#81B29A]">event_available</span>
                  <span>{isEn ? `Active Bookings (${bookings.length})` : `Lượt Đặt Hiện Tại (${bookings.length})`}</span>
                </h3>
              </div>

              {bookings.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  {isEn ? 'No current bookings for this member.' : 'Hội viên chưa có lượt đặt lớp nào.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map(b => (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-chivo font-bold text-sm text-slate-900 dark:text-white">{b.className}</span>
                          <Badge variant={b.status} size="sm">{b.status}</Badge>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[15px]">calendar_today</span>
                          <span>{b.bookingDate}</span>
                          <span>•</span>
                          <span className="material-symbols-outlined text-[15px]">schedule</span>
                          <span>{b.timeSlot}</span>
                        </div>
                      </div>

                      {b.status === 'CONFIRMED' && (
                        <div className="flex justify-end pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                          <button
                            type="button"
                            className="px-3.5 py-1.5 bg-[#E07A5F]/15 hover:bg-[#E07A5F]/25 text-[#E07A5F] border border-[#E07A5F]/30 rounded-lg text-xs font-bold font-chivo uppercase tracking-wider transition-all hover-lift cursor-pointer disabled:opacity-50"
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
            </div>

            {/* Right Column: Available Classes (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover-lift transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-chivo text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#F2CC8F]">sports_gymnastics</span>
                  <span>{isEn ? `Available Classes & Sessions (${sessions.length})` : `Lịch Lớp Thể Thao Mở (${sessions.length})`}</span>
                </h3>
              </div>

              {sessions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  {isEn ? 'No open class sessions available right now.' : 'Hiện chưa có lịch lớp nào mở.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map(s => {
                    const isFull = s.enrolledCount >= s.capacity;
                    return (
                      <div
                        key={s.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-chivo font-bold text-sm text-slate-900 dark:text-white">{s.name}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {s.sport || 'Sports'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                              {s.sessionDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              {s.timeSlot}
                            </span>
                          </div>
                          <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            {isEn ? 'Capacity' : 'Sức chứa'}:{' '}
                            <strong className={isFull ? 'text-[#E07A5F]' : 'text-[#2D6A4F] dark:text-[#81B29A]'}>
                              {s.enrolledCount}/{s.capacity}
                            </strong>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={busy || !s.isBookable}
                          onClick={() =>
                            run(async () => {
                              const r = await bookingApi.bookForMember(selected.id, s.id);
                              showSuccess(r.message || (isEn ? 'Class booked successfully' : 'Đặt chỗ thành công'));
                              await refresh(selected);
                            })
                          }
                          className={`px-4 py-2 rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all hover-lift shrink-0 cursor-pointer disabled:opacity-50 ${
                            isFull
                              ? 'bg-[#F2CC8F]/20 hover:bg-[#F2CC8F]/30 text-[#92400E] dark:text-[#F2CC8F] border border-[#F2CC8F]/40'
                              : 'bg-[#2D6A4F] hover:bg-[#1B4332] text-white shadow-md'
                          }`}
                        >
                          {isFull ? (isEn ? 'Join Waitlist' : 'Danh sách chờ') : (isEn ? 'Book Slot' : 'Đặt chỗ')}
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
