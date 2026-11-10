import { vietnamDate, formatVietnamDateTime } from '../../../shared/lib/dateTime.js';
import React, { useEffect, useRef, useState } from 'react';
import { memberCoachApi } from '../../../entities/coach/index.js';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { LoadingSpinner } from '../../../shared/ui/Table.jsx';
import { translateCoachName, translateMealType, translateStatus } from '../../../shared/i18n/i18nHelper.js';

const input = 'w-full rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 dark:bg-brand-navy-800 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-sage-500/40 focus:border-brand-sage-500 transition';
const button = 'rounded-xl bg-brand-sage-700 hover:bg-brand-sage-900 px-4 py-2 text-sm font-bold text-white shadow-xs hover:shadow transition-all active:scale-95 disabled:opacity-50 cursor-pointer';

function Card({ title, children }) {
  return (
    <section className="rounded-2xl border border-brand-navy-200 dark:border-brand-navy-800 bg-white dark:bg-brand-navy-900 p-5 shadow-xs hover-lift transition-all">
      <h2 className="mb-4 font-chivo text-base font-black text-brand-navy-900 dark:text-white">{title}</h2>
      {children}
    </section>
  );
}

function Label({ title, children }) {
  return (
    <label className="block text-xs font-bold text-brand-navy-600 dark:text-brand-navy-300">
      {title}
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

const dt = (x, isEn) => formatVietnamDateTime(x, isEn);
const today = () => vietnamDate();

export function MemberCoachPortal() {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const { showSuccess, showError } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [tab, setTab] = useState(() => new URLSearchParams(window.location.hash.split('?')[1] || '').get('tab') === 'chat' ? 'chat' : 'appointments');
  const [coachId, setCoachId] = useState('');
  const [messages, setMessages] = useState([]);
  const messageRequest = useRef(0);

  const load = async () => {
    setLoading(true);
    try {
      const d = await memberCoachApi.getPortal();
      setData(d);
      const sender = new URLSearchParams(window.location.hash.split('?')[1] || '').get('senderUserId');
      setCoachId(x => x || (sender ? d.coaches?.find(coach => String(coach.userId) === sender)?.id : d.coaches?.[0]?.id) || '');
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const handleHash = () => {
      const query = new URLSearchParams(window.location.hash.split('?')[1] || '');
      if (query.get('tab') === 'chat') {
        setTab('chat');
        const sender = query.get('senderUserId');
        if (sender) setCoachId(data?.coaches?.find(coach => String(coach.userId) === sender)?.id || '');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [data?.coaches]);

  const act = async (fn, msg) => {
    setWorking(true);
    try {
      await fn();
      showSuccess(msg);
      await load();
      return true;
    } catch (e) {
      showError(e);
      return false;
    } finally {
      setWorking(false);
    }
  };

  const loadMessages = async id => {
    if (!id || !data?.member?.id) return;
    const request = ++messageRequest.current;
    try {
      const result = await memberCoachApi.getMessages(id, data.member.id);
      if (request === messageRequest.current) setMessages(result);
    } catch (e) {
      if (request === messageRequest.current) showError(e);
    }
  };

  useEffect(() => {
    setMessages([]);
    if (coachId && data) loadMessages(coachId);
    return () => { ++messageRequest.current; };
  }, [coachId, data?.member?.id]);

  if (loading && !data) return <LoadingSpinner text={isEn ? "Loading coach interaction portal..." : "Đang mở cổng tương tác HLV..."} />;

  const submitDiary = e => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    return act(
      () =>
        memberCoachApi.addFoodDiary({
          entryDate: f.get('entryDate'),
          mealType: f.get('mealType'),
          foodName: f.get('foodName'),
          calories: f.get('calories') ? Number(f.get('calories')) : null,
          proteinGrams: f.get('proteinGrams') ? Number(f.get('proteinGrams')) : null,
          carbGrams: f.get('carbGrams') ? Number(f.get('carbGrams')) : null,
          fatGrams: f.get('fatGrams') ? Number(f.get('fatGrams')) : null,
          notes: f.get('notes') || null
        }),
      isEn ? 'Food diary saved successfully.' : 'Đã lưu nhật ký ăn uống.'
    ).then(ok => ok && e.target.reset());
  };

  const send = e => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    return act(
      () =>
        memberCoachApi.sendMessage({
          coachId: Number(coachId),
          memberId: Number(data.member.id),
          content: f.get('content')
        }),
      isEn ? 'Message sent.' : 'Đã gửi tin nhắn.'
    ).then(ok => {
      if (ok) {
        e.target.reset();
        loadMessages(coachId);
      }
    });
  };

  const review = e => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    return act(
      () =>
        memberCoachApi.reviewCoach({
          coachId: Number(f.get('coachId')),
          workEventId: f.get('workEventId') ? Number(f.get('workEventId')) : null,
          rating: Number(f.get('rating')),
          comment: f.get('comment') || null
        }),
      isEn ? 'Thank you for reviewing your coach.' : 'Cảm ơn bạn đã đánh giá HLV.'
    ).then(ok => ok && e.target.reset());
  };

  const statusLabel = status => {
    const map = {
      PendingMemberConfirmation: isEn ? 'Awaiting Confirmation' : 'Chờ bạn xác nhận',
      Confirmed: isEn ? 'Confirmed' : 'Đã xác nhận',
      Declined: isEn ? 'Declined' : 'Đã từ chối',
      Completed: isEn ? 'Completed' : 'Đã hoàn thành',
      Cancelled: isEn ? 'Cancelled' : 'Đã hủy'
    };
    return map[status] || status;
  };

  const navTabs = [
    ['appointments', isEn ? 'PT Schedule' : 'Lịch PT'],
    ['homework', isEn ? 'Homework' : 'Bài tập'],
    ['nutrition', isEn ? 'Nutrition' : 'Dinh dưỡng'],
    ['chat', isEn ? 'Chat' : 'Chat'],
    ['reviews', isEn ? 'Reviews' : 'Đánh giá']
  ];

  return (
    <div className="space-y-5 animate-fade-slide-up">
      {/* 1. Olympic Coach Portal Masterpiece Banner */}
      <div className="scms-hero relative rounded-3xl bg-gradient-to-r from-brand-sage-700 via-brand-teal-600 via-brand-teal-500 to-brand-sand-500 dark:from-brand-sage-900 dark:via-brand-teal-900 dark:via-brand-teal-800 dark:to-brand-sand-900 text-white p-6 sm:p-7 border border-white/30 dark:border-white/10 shadow-xl shadow-brand-teal-600/20 overflow-hidden">
        {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-brand-sand-300/45 via-brand-sand-500/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-brand-sage-500/40 via-brand-sage-700/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-brand-teal-300/30 rounded-full blur-3xl pointer-events-none" />
        {/* Subtle decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
          <circle cx="890" cy="110" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
        </svg>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-brand-navy-900/90 backdrop-blur-md text-brand-sage-900 dark:text-brand-sage-300 border border-white/80 dark:border-white/20 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <span className="material-symbols-outlined text-[13px] text-brand-sand-700 dark:text-brand-sand-400">sports</span>
                OLYMPIC COACH CONNECTION
              </span>
              <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-brand-navy-900/80 backdrop-blur-md text-brand-navy-800 dark:text-brand-navy-200 border border-white/80 dark:border-white/20 text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse" />
                {isEn ? '1-on-1 PT Support' : 'Đồng hành 1-1 cùng HLV'}
              </span>
            </div>

            <h1 className="font-chivo text-2xl lg:text-3xl font-black text-white tracking-tight mt-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
              {isEn ? 'Coach Connection & Personal Training' : 'Đồng Hành Cùng Huấn Luyện Viên'}
            </h1>
            <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-2xl font-medium leading-relaxed drop-shadow-xs">
              {isEn
                ? 'Confirm PT appointments, check in homework, monitor nutrition plans, and message coaches privately.'
                : 'Xác nhận lịch PT, check-in bài tập, theo dõi dinh dưỡng và trao đổi trực tiếp cùng HLV.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href="#/member/schedule"
              className="px-4 py-2.5 bg-brand-navy-950 hover:bg-brand-navy-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg hover:shadow-xl shrink-0 border border-white/20 active:scale-95 cursor-pointer backdrop-blur-md"
            >
              <span className="material-symbols-outlined text-[18px] text-brand-sand-300">calendar_month</span>
              <span>{isEn ? 'Class Timetable' : 'Thời Khóa Biểu'}</span>
            </a>
          </div>
        </div>
      </div>

      <nav className="flex gap-2 overflow-auto rounded-2xl border border-brand-navy-200 dark:border-brand-navy-800 bg-white dark:bg-brand-navy-900 p-2 shadow-xs">
        {navTabs.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-all active:scale-95 cursor-pointer ${
              tab === id
                ? 'bg-brand-navy-900 dark:bg-brand-sage-500/20 text-brand-sand-300 dark:text-brand-sage-500 border border-brand-sand-300/30 dark:border-brand-sage-500/40 shadow-xs'
                : 'text-brand-navy-600 dark:text-brand-navy-400 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-800 hover:text-brand-navy-900 dark:hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'appointments' && (
        <Card title={isEn ? "Appointments with Coach" : "Lịch hẹn với HLV"}>
          {!data?.events?.length ? (
            <p className="text-sm text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'No personal appointments yet.' : 'Chưa có lịch hẹn cá nhân.'}</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {data.events.map(x => (
                <article key={x.id} className="rounded-xl border border-brand-navy-200 dark:border-brand-navy-800 p-4 bg-white dark:bg-brand-navy-900 hover:border-brand-sage-500/40 transition hover-lift">
                  <div className="flex justify-between gap-2">
                    <strong className="text-brand-navy-900 dark:text-white">{x.title}</strong>
                    <span className="text-xs font-bold text-brand-sage-700 dark:text-brand-sage-500">{statusLabel(x.status)}</span>
                  </div>
                  <p className="mt-1 text-xs text-brand-navy-500 dark:text-brand-navy-400">
                    {isEn ? 'Coach ' : 'HLV '}
                    {translateCoachName(x.coachName, isEn)} · {dt(x.startAt, isEn)} → {dt(x.endAt, isEn)}
                  </p>
                  {x.status === 'PendingMemberConfirmation' && (
                    <div className="mt-3 flex gap-2">
                      <button
                        disabled={working}
                        className={button}
                        onClick={() => act(() => memberCoachApi.respondEvent(x.id, 'Confirmed'), isEn ? 'PT appointment confirmed.' : 'Đã xác nhận lịch PT.')}
                      >
                        {isEn ? 'Confirm' : 'Xác nhận'}
                      </button>
                      <button
                        disabled={working}
                        className="rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-800 px-4 py-2 text-sm font-bold text-brand-navy-700 dark:text-brand-navy-300 cursor-pointer active:scale-95"
                        onClick={() => act(() => memberCoachApi.respondEvent(x.id, 'Declined', isEn ? 'Schedule conflict' : 'Không phù hợp thời gian'), isEn ? 'Appointment declined.' : 'Đã từ chối lịch.')}
                      >
                        {isEn ? 'Decline' : 'Từ chối'}
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'homework' && (
        <Card title={isEn ? "Home Workouts & Completion Check-in" : "Bài tập tại nhà & check-in hoàn thành"}>
          {!data?.assignments?.length ? (
            <p className="text-sm text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'No assignments given yet.' : 'Chưa có bài tập được giao.'}</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {data.assignments.map(x => (
                <article key={x.id} className="rounded-xl border border-brand-navy-200 dark:border-brand-navy-800 p-4 bg-white dark:bg-brand-navy-900 hover:border-brand-sage-500/40 transition hover-lift">
                  <strong className="text-brand-navy-900 dark:text-white">{x.title}</strong>
                  <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-0.5">{isEn ? 'Due ' : 'Hạn '}{dt(x.dueDate, isEn)}</p>
                  <p className="my-2 text-sm text-brand-navy-700 dark:text-brand-navy-300">{x.description}</p>
                  {x.submission ? (
                    <div className="rounded-lg bg-brand-sage-50 dark:bg-brand-sage-950/40 border border-brand-sage-200 dark:border-brand-sage-900/50 p-3 text-xs text-brand-sage-900 dark:text-brand-sage-200">
                      <strong>{translateStatus(x.submission.status, isEn)}</strong>
                      <p className="mt-1">{x.submission.content}</p>
                      {x.submission.coachFeedback && (
                        <p className="mt-1 font-semibold">{isEn ? 'Coach: ' : 'HLV: '}{x.submission.coachFeedback} · {x.submission.score}/100</p>
                      )}
                    </div>
                  ) : (
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        const f = new FormData(e.currentTarget);
                        act(
                          () => memberCoachApi.submitHomework(x.id, f.get('content')),
                          isEn ? 'Homework check-in submitted.' : 'Đã check-in hoàn thành bài tập.'
                        );
                      }}
                      className="flex gap-2"
                    >
                      <input
                        name="content"
                        required
                        placeholder={isEn ? "Results, duration, notes, feeling..." : "Kết quả, thời lượng, cảm nhận..."}
                        className={input}
                      />
                      <button disabled={working} className={button}>
                        Check-in
                      </button>
                    </form>
                  )}
                </article>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'nutrition' && (
        <div className="grid gap-5 xl:grid-cols-2">
          <Card title={isEn ? "Nutrition Plan" : "Kế hoạch dinh dưỡng"}>
            {!data?.nutritionPlans?.length ? (
              <p className="text-sm text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'No nutrition plan yet.' : 'Chưa có kế hoạch.'}</p>
            ) : (
              data.nutritionPlans.map(x => (
                <article key={x.id} className="rounded-xl bg-brand-navy-50 dark:bg-brand-navy-800/60 border border-brand-navy-200/60 dark:border-brand-navy-700/60 p-4">
                  <strong className="text-brand-navy-900 dark:text-white">{x.title}</strong>
                  <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-0.5">
                    {x.startDate} → {x.endDate || (isEn ? 'Ongoing' : 'Không giới hạn')}
                  </p>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                    {[
                      ['Kcal', x.dailyCalories],
                      ['Protein', `${x.proteinGrams}g`],
                      ['Carb', `${x.carbGrams}g`],
                      ['Fat', `${x.fatGrams}g`]
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-lg bg-white dark:bg-brand-navy-900 border border-brand-navy-200 dark:border-brand-navy-700 p-2 text-brand-navy-900 dark:text-white">
                        <strong className="block text-sm">{v}</strong>
                        <span className="text-brand-navy-500 dark:text-brand-navy-400 text-[11px]">{k}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-brand-navy-700 dark:text-brand-navy-300">{x.notes}</p>
                </article>
              ))
            )}
          </Card>
          <Card title={isEn ? "Food Diary" : "Nhật ký ăn uống"}>
            <form onSubmit={submitDiary} className="grid gap-3 sm:grid-cols-2">
              <Label title={isEn ? "Date" : "Ngày"}>
                <input name="entryDate" type="date" max={today()} defaultValue={today()} required className={input} />
              </Label>
              <Label title={isEn ? "Meal" : "Bữa"}>
                <select name="mealType" className={input}>
                  <option value="Bữa sáng">{isEn ? 'Breakfast' : 'Bữa sáng'}</option>
                  <option value="Bữa trưa">{isEn ? 'Lunch' : 'Bữa trưa'}</option>
                  <option value="Bữa tối">{isEn ? 'Dinner' : 'Bữa tối'}</option>
                  <option value="Bữa phụ">{isEn ? 'Snack' : 'Bữa phụ'}</option>
                </select>
              </Label>
              <Label title={isEn ? "Food Name" : "Món ăn"}>
                <input name="foodName" required className={input} />
              </Label>
              <Label title="Calories">
                <input name="calories" type="number" min="0" className={input} />
              </Label>
              <Label title="Protein (g)">
                <input name="proteinGrams" type="number" min="0" step="0.1" className={input} />
              </Label>
              <Label title="Carb (g)">
                <input name="carbGrams" type="number" min="0" step="0.1" className={input} />
              </Label>
              <Label title="Fat (g)">
                <input name="fatGrams" type="number" min="0" step="0.1" className={input} />
              </Label>
              <Label title={isEn ? "Notes" : "Ghi chú"}>
                <input name="notes" className={input} />
              </Label>
              <button disabled={working} className={button}>
                {isEn ? 'Save Diary' : 'Lưu nhật ký'}
              </button>
            </form>
            <div className="mt-4 max-h-56 space-y-2 overflow-auto">
              {data?.foodDiary?.map(x => (
                <div key={x.id} className="flex justify-between rounded-lg bg-brand-navy-50 dark:bg-brand-navy-800/60 border border-brand-navy-200/60 dark:border-brand-navy-700/60 p-2 text-xs text-brand-navy-800 dark:text-brand-navy-200">
                  <span>
                    {x.entryDate} · {translateMealType(x.mealType, isEn)} · {x.foodName}
                  </span>
                  <strong className="text-brand-sage-700 dark:text-brand-sage-500">{x.calories || 0} kcal</strong>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'chat' && (
        <Card title={isEn ? "Private Chat with Coach" : "Chat riêng với HLV"}>
          <select value={coachId} aria-label={isEn ? 'Coach conversation' : 'Cuộc trò chuyện với HLV'} disabled={working} onChange={e => {
            setCoachId(e.target.value);
            const coach = data?.coaches?.find(x => String(x.id) === e.target.value);
            if (coach) window.location.hash = `#/member/coach-portal?tab=chat&senderUserId=${encodeURIComponent(coach.userId)}`;
          }} className={`${input} mb-3 max-w-sm`}>
            {!coachId && <option value="">{isEn ? 'Select your coach' : 'Chọn HLV của bạn'}</option>}
            {data?.coaches?.map(x => (
              <option key={x.id} value={x.id}>
                {translateCoachName(x.fullName, isEn)} · {x.specialization}
              </option>
            ))}
          </select>
          <div className="h-96 space-y-2 overflow-y-auto rounded-xl bg-brand-navy-50 dark:bg-brand-navy-800/60 p-4 border border-brand-navy-200/60 dark:border-brand-navy-700/60">
            {messages.map(x => (
              <div
                key={x.id}
                className={`max-w-[80%] rounded-2xl p-3 text-sm shadow-xs ${
                  Number(x.senderUserId) === Number(data?.member?.userId)
                    ? 'ml-auto bg-brand-navy-900 text-white border border-brand-navy-700'
                    : 'bg-white dark:bg-brand-navy-900 text-brand-navy-900 dark:text-white border border-brand-navy-200 dark:border-brand-navy-700'
                }`}
              >
                <p>{x.content}</p>
                <p className="mt-1 text-[10px] opacity-70">{dt(x.createdAt, isEn)}</p>
              </div>
            ))}
          </div>
          <form onSubmit={send} className="mt-3 flex gap-2">
            <input name="content" required className={input} placeholder={isEn ? "Message coach..." : "Nhắn HLV..."} />
            <button disabled={working || !coachId} className={button}>
              {isEn ? 'Send' : 'Gửi'}
            </button>
          </form>
        </Card>
      )}

      {tab === 'reviews' && (
        <div className="grid gap-5 xl:grid-cols-2">
          <Card title={isEn ? "Review Coach" : "Đánh giá HLV"}>
            <form onSubmit={review} className="space-y-3">
              <Label title={isEn ? "Coach" : "HLV"}>
                <select name="coachId" className={input}>
                  {data?.coaches?.map(x => (
                    <option key={x.id} value={x.id}>
                      {translateCoachName(x.fullName, isEn)}
                    </option>
                  ))}
                </select>
              </Label>
              <Label title={isEn ? "Completed PT Session (Optional)" : "Buổi PT đã hoàn thành (không bắt buộc)"}>
                <select name="workEventId" className={input}>
                  <option value="">{isEn ? "General Review" : "Đánh giá chung"}</option>
                  {data?.events
                    ?.filter(x => x.status === 'Completed')
                    ?.map(x => (
                      <option key={x.id} value={x.id}>
                        {x.title} · {dt(x.startAt, isEn)}
                      </option>
                    ))}
                </select>
              </Label>
              <Label title={isEn ? "Rating" : "Số sao"}>
                <select name="rating" className={input}>
                  {[5, 4, 3, 2, 1].map(x => (
                    <option key={x} value={x}>
                      {x} {isEn ? 'stars' : 'sao'}
                    </option>
                  ))}
                </select>
              </Label>
              <Label title={isEn ? "Comment" : "Nhận xét"}>
                <textarea name="comment" rows="4" className={input} />
              </Label>
              <button disabled={working} className={button}>
                {isEn ? 'Submit Review' : 'Gửi đánh giá'}
              </button>
            </form>
          </Card>
          <Card title={isEn ? "Submitted Reviews" : "Đánh giá đã gửi"}>
            {data?.reviews?.map(x => (
              <div key={x.id} className="mb-2 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-800/60 border border-brand-navy-200/60 dark:border-brand-navy-700/60 p-3 text-sm text-brand-navy-800 dark:text-brand-navy-200">
                <strong className="text-brand-sand-700 dark:text-brand-sand-400 block mb-1">{'★'.repeat(x.rating)}</strong>
                <p>{x.comment || (isEn ? 'No comments.' : 'Không có nhận xét.')}</p>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
