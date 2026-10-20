import React, { useEffect, useState } from 'react';
import { memberCoachApi } from '../../services/api.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { LoadingSpinner } from '../../components/common/Table.jsx';
import { translateCoachName, translateMealType, translateStatus } from '../../services/i18nHelper.js';

const input = 'w-full rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A] transition';
const button = 'rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] px-4 py-2 text-sm font-bold text-white shadow-xs hover:shadow transition-all active:scale-95 disabled:opacity-50 cursor-pointer';

function Card({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover-lift transition-all">
      <h2 className="mb-4 font-chivo text-base font-black text-slate-900 dark:text-white">{title}</h2>
      {children}
    </section>
  );
}

function Label({ title, children }) {
  return (
    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
      {title}
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

const dt = (x, isEn) => (x ? new Date(x).toLocaleString(isEn ? 'en-US' : 'vi-VN') : '—');
const today = () => {
  const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 10);
};

export function MemberCoachPortal() {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const { showSuccess, showError } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [tab, setTab] = useState('appointments');
  const [coachId, setCoachId] = useState('');
  const [messages, setMessages] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const d = await memberCoachApi.getPortal();
      setData(d);
      setCoachId(x => x || d.coaches?.[0]?.id || '');
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
    try {
      setMessages(await memberCoachApi.getMessages(id, data.member.id));
    } catch (e) {
      showError(e);
    }
  };

  useEffect(() => {
    if (coachId && data) loadMessages(coachId);
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
      <header className="relative rounded-2xl bg-gradient-to-br from-[#121624] via-[#181D2F] to-[#1E2235] p-6 text-white border border-slate-700/60 shadow-xl overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#81B29A]/15 rounded-full blur-2xl pointer-events-none animate-float" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#F2CC8F]/10 rounded-full blur-2xl pointer-events-none animate-float" />
        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-widest text-[#F2CC8F]">Coach Connection</p>
          <h1 className="mt-2 text-2xl font-black">{isEn ? 'Coach Connection & Personal Training' : 'Đồng hành cùng huấn luyện viên'}</h1>
          <p className="mt-1 text-sm text-slate-200">
            {isEn
              ? 'Confirm PT appointments, check in homework, monitor nutrition plans, and message coaches privately.'
              : 'Xác nhận lịch PT, check-in bài tập, theo dõi dinh dưỡng và trao đổi riêng tư.'}
          </p>
        </div>
      </header>

      <nav className="flex gap-2 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xs">
        {navTabs.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-all active:scale-95 cursor-pointer ${
              tab === id
                ? 'bg-[#1E2235] dark:bg-[#81B29A]/20 text-[#F2CC8F] dark:text-[#81B29A] border border-[#F2CC8F]/30 dark:border-[#81B29A]/40 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'appointments' && (
        <Card title={isEn ? "Appointments with Coach" : "Lịch hẹn với HLV"}>
          {!data?.events?.length ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{isEn ? 'No personal appointments yet.' : 'Chưa có lịch hẹn cá nhân.'}</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {data.events.map(x => (
                <article key={x.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 hover:border-[#81B29A]/40 transition hover-lift">
                  <div className="flex justify-between gap-2">
                    <strong className="text-slate-900 dark:text-white">{x.title}</strong>
                    <span className="text-xs font-bold text-[#2D6A4F] dark:text-[#81B29A]">{statusLabel(x.status)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
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
                        className="rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer active:scale-95"
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
            <p className="text-sm text-slate-500 dark:text-slate-400">{isEn ? 'No assignments given yet.' : 'Chưa có bài tập được giao.'}</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {data.assignments.map(x => (
                <article key={x.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 hover:border-[#81B29A]/40 transition hover-lift">
                  <strong className="text-slate-900 dark:text-white">{x.title}</strong>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{isEn ? 'Due ' : 'Hạn '}{dt(x.dueDate, isEn)}</p>
                  <p className="my-2 text-sm text-slate-700 dark:text-slate-300">{x.description}</p>
                  {x.submission ? (
                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-3 text-xs text-emerald-900 dark:text-emerald-200">
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
              <p className="text-sm text-slate-500 dark:text-slate-400">{isEn ? 'No nutrition plan yet.' : 'Chưa có kế hoạch.'}</p>
            ) : (
              data.nutritionPlans.map(x => (
                <article key={x.id} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 p-4">
                  <strong className="text-slate-900 dark:text-white">{x.title}</strong>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {x.startDate} → {x.endDate || (isEn ? 'Ongoing' : 'Không giới hạn')}
                  </p>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                    {[
                      ['Kcal', x.dailyCalories],
                      ['Protein', `${x.proteinGrams}g`],
                      ['Carb', `${x.carbGrams}g`],
                      ['Fat', `${x.fatGrams}g`]
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 text-slate-900 dark:text-white">
                        <strong className="block text-sm">{v}</strong>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">{k}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{x.notes}</p>
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
                <div key={x.id} className="flex justify-between rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 p-2 text-xs text-slate-800 dark:text-slate-200">
                  <span>
                    {x.entryDate} · {translateMealType(x.mealType, isEn)} · {x.foodName}
                  </span>
                  <strong className="text-[#2D6A4F] dark:text-[#81B29A]">{x.calories || 0} kcal</strong>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'chat' && (
        <Card title={isEn ? "Private Chat with Coach" : "Chat riêng với HLV"}>
          <select value={coachId} onChange={e => setCoachId(e.target.value)} className={`${input} mb-3 max-w-sm`}>
            {data?.coaches?.map(x => (
              <option key={x.id} value={x.id}>
                {translateCoachName(x.fullName, isEn)} · {x.specialization}
              </option>
            ))}
          </select>
          <div className="h-96 space-y-2 overflow-y-auto rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200/60 dark:border-slate-700/60">
            {messages.map(x => (
              <div
                key={x.id}
                className={`max-w-[80%] rounded-2xl p-3 text-sm shadow-xs ${
                  Number(x.senderUserId) === Number(data?.member?.userId)
                    ? 'ml-auto bg-[#1E2235] text-white border border-slate-700'
                    : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700'
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
              <div key={x.id} className="mb-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 p-3 text-sm text-slate-800 dark:text-slate-200">
                <strong className="text-amber-500 block mb-1">{'★'.repeat(x.rating)}</strong>
                <p>{x.comment || (isEn ? 'No comments.' : 'Không có nhận xét.')}</p>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
