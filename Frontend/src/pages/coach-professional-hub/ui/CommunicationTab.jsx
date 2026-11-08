import React, { useEffect, useRef, useState } from 'react';
import { coachProfessionalApi } from '../../../entities/coach/index.js';
import { CoachError, SectionCard, EmptyState, formatDate } from '../../../features/coach-workspace/index.js';
import { inputClass, selectClass, buttonPrimary, FormField } from './formControls.jsx';

// ─────────────────────────────────────────────────────────────
// TAB 4: COMMUNICATION (TƯƠNG TÁC & CHAT)
// ─────────────────────────────────────────────────────────────
export function CommunicationTab({ data, act, working, isEn }) {
  const requestedMember = () => {
    const sender = new URLSearchParams(window.location.hash.split('?')[1] || '').get('senderUserId');
    return sender ? (data.clients.find(x => String(x.userId) === sender)?.id || '')
      : (data.threads?.find(x => x.unread > 0)?.memberId || data.clients[0]?.id || '');
  };
  const [memberId, setMemberId] = useState(requestedMember);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messageError, setMessageError] = useState('');
  const [sendError, setSendError] = useState('');
  const messageRequest = useRef(0);

  useEffect(() => {
    const handleHash = () => {
      if (new URLSearchParams(window.location.hash.split('?')[1] || '').has('senderUserId')) {
        setMemberId(requestedMember());
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [data.clients]);

  const loadMessages = async (id) => {
    if (!id) return;
    const request = ++messageRequest.current;
    setLoadingMessages(true);
    try {
      const res = await coachProfessionalApi.getMessages(data.profile.id, id);
      if (request === messageRequest.current) {
        setMessages(res);
        setMessageError('');
      }
    } catch (e) {
      if (request === messageRequest.current) setMessageError(e);
    } finally {
      if (request === messageRequest.current) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    setMessages([]);
    setInputMessage('');
    setMessageError('');
    setSendError('');
    setLoadingMessages(false);
    loadMessages(memberId);
    const refresh = () => { if (!document.hidden) loadMessages(memberId); };
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    return () => {
      ++messageRequest.current;
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [memberId, data.profile.id]);

  const send = (e) => {
    e.preventDefault();
    if (working || !memberId || !inputMessage.trim()) return;
    setSendError('');
    return act(
      () =>
        coachProfessionalApi.sendMessage({
          coachId: data.profile.id,
          memberId: Number(memberId),
          content: inputMessage.trim()
        }),
      isEn ? 'Message sent.' : 'Đã gửi tin nhắn.',
      setSendError
    ).then((ok) => {
      if (ok) {
        setInputMessage('');
        loadMessages(memberId);
      }
    });
  };

  const broadcast = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const channels = ['InApp', 'Email'].filter(x => f.get(x));
    return act(
      () =>
        coachProfessionalApi.broadcast({
          classId: null,
          memberIds: null,
          title: f.get('title'),
          content: f.get('content'),
          channels
        }),
      isEn ? 'Broadcast notice sent successfully.' : 'Đã phát thông báo đa kênh thành công.'
    ).then((ok) => ok && e.target.reset());
  };

  const selectedClient = data.clients.find(x => Number(x.id) === Number(memberId));

  const quickPills = isEn ? [
    '💧 Drink at least 2L of water today!',
    '🏃 Warm up thoroughly before today\'s session.',
    '🥗 Have a light healthy snack 60 mins before class.',
    '😴 Ensure 8 hours of quality sleep for recovery!'
  ] : [
    '💧 Nhớ uống đủ 2L nước mỗi ngày nhé!',
    '🏃 Đừng quên khởi động kỹ trước buổi tập.',
    '🥗 Hãy ăn bữa phụ nhẹ trước giờ tập 60 phút.',
    '😴 Ngủ đủ 8 tiếng để cơ bắp phục hồi tối ưu nhé!'
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
      {/* 1-on-1 Secure Chat */}
      <SectionCard
        title={isEn ? 'Direct Student Messaging' : 'Trò chuyện bảo mật với học viên'}
        icon="chat"
        action={
          <select
            aria-label={isEn ? 'Student conversation' : 'Cuộc trò chuyện với học viên'}
            value={memberId}
            onChange={e => {
              setMemberId(e.target.value);
              const client = data.clients.find(x => String(x.id) === e.target.value);
              if (client) window.location.hash = `#/coach/messages?tab=communication&senderUserId=${encodeURIComponent(client.userId)}`;
            }}
            disabled={working}
            className={`${selectClass} max-w-56`}
          >
            {!memberId && <option value="">{isEn ? 'Select an assigned student' : 'Chọn học viên đang phụ trách'}</option>}
            {data.clients.map(x => (
              <option key={x.id} value={x.id}>{x.fullName}</option>
            ))}
          </select>
        }
      >
        <CoachError message={messageError} retry={() => loadMessages(memberId)} />
        <CoachError message={sendError} />
        <div className="h-[400px] space-y-2.5 overflow-y-auto rounded-2xl bg-brand-navy-50 dark:bg-brand-navy-800/50 p-4 border border-brand-navy-100 dark:border-brand-navy-700">
          {loadingMessages ? (
            <p className="text-xs text-brand-navy-400 text-center py-8">{isEn ? 'Loading conversation...' : 'Đang tải đoạn hội thoại...'}</p>
          ) : !messages.length ? (
            <EmptyState icon="forum" isEn={isEn}>
              {!memberId
                ? (isEn ? 'Select an assigned student to view and reply to messages.' : 'Chọn học viên đang phụ trách để xem và trả lời tin nhắn.')
                : (isEn ? `Start conversation with student ${selectedClient?.fullName || ''}.` : `Bắt đầu cuộc trò chuyện với học viên ${selectedClient?.fullName || ''}.`)}
            </EmptyState>
          ) : (
            messages.map(x => {
              const isCoach = Number(x.senderUserId) === Number(data.profile.userId);
              return (
                <div
                  key={x.id}
                  className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                    isCoach
                      ? 'ml-auto bg-brand-navy-900 text-white rounded-br-xs shadow-xs'
                      : 'bg-white dark:bg-brand-navy-800 text-brand-navy-800 dark:text-brand-navy-100 border border-brand-navy-200 dark:border-brand-navy-700 rounded-bl-xs shadow-2xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{x.content}</p>
                  <span className={`text-[10px] block mt-1 ${isCoach ? 'text-brand-sand-300' : 'text-brand-navy-400'}`}>
                    {formatDate(x.createdAt, isEn)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1">
          {quickPills.map((pill, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setInputMessage(pill)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-brand-navy-100 dark:bg-brand-navy-700 text-brand-navy-600 dark:text-brand-navy-300 hover:bg-brand-sage-500/15 dark:hover:bg-brand-sage-500/20 hover:text-brand-sage-700 dark:hover:text-brand-sage-500 shrink-0 transition-colors cursor-pointer"
            >
              {pill}
            </button>
          ))}
        </div>

        <form onSubmit={send} className="mt-2 flex gap-2">
          <input
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            aria-label={isEn ? 'Reply to student' : 'Trả lời học viên'}
            disabled={!memberId || working}
            required
            maxLength="4000"
            placeholder={isEn ? 'Type a supportive message to student...' : 'Nhập tin nhắn hướng dẫn, nhắc nhở học viên...'}
            className={inputClass}
          />
          <button disabled={working || !memberId || !inputMessage.trim()} className={buttonPrimary}>
            <span className="material-symbols-outlined text-[18px]">send</span>
            <span>{isEn ? 'Send' : 'Gửi'}</span>
          </button>
        </form>
      </SectionCard>

      {/* Broadcast Announcement */}
      <SectionCard title={isEn ? 'Broadcast Notice' : 'Phát thông báo tới toàn bộ học viên'} icon="campaign">
        <form onSubmit={broadcast} className="space-y-3">
          <FormField title={isEn ? 'Announcement Title' : 'Tiêu đề thông báo'} required>
            <input name="title" required placeholder={isEn ? 'E.g., Holiday Schedule / Makeup Class Notice' : 'VD: Thông báo nghỉ lễ / Lịch tập bù'} className={inputClass} />
          </FormField>
          <FormField title={isEn ? 'Announcement Content' : 'Nội dung thông báo'} required>
            <textarea name="content" required rows="6" placeholder={isEn ? 'Dear athletes and students under my supervision...' : 'Kính gửi các học viên phụ trách...'} className={inputClass} />
          </FormField>
          <fieldset>
            <legend className="text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 mb-1.5 block">{isEn ? 'Delivery Channels' : 'Kênh gửi tin'}</legend>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {['InApp', 'Email'].map((ch) => (
                <label key={ch} className="flex items-center gap-2 p-2 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-brand-navy-50 dark:bg-brand-navy-800 cursor-pointer">
                  <input name={ch} type="checkbox" defaultChecked className="rounded text-brand-sage-500 focus:ring-brand-sage-500" />
                  <span>{ch}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="text-[11px] text-brand-navy-400">
            {isEn ? 'In-App messages are delivered instantly; Email queued and supervised by the center.' : 'Tin nhắn In-App gửi tức thì; Email vào hàng đợi được giám sát bởi trung tâm.'}
          </p>
          <button disabled={working} className={`${buttonPrimary} w-full`}>
            <span>{isEn ? 'Broadcast Notice' : 'Phát thông báo'}</span>
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
