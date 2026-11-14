import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../entities/session/index.js';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { aiApi } from '../../../entities/ai-chat/index.js';
import { clearMemberAIChatStorage } from '../../../shared/lib/memberAiChatStorage.js';
import { parseFormattedMarkdown } from './chatMarkdown.jsx';
import { detectSpeechLang } from '../../../shared/lib/speechLanguage.js';

export function MemberAIAssistant() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const getInitialMessage = () => ({
    id: 'welcome',
    sender: 'ai',
    text: isEn
      ? `Hello **${currentUser?.fullName || 'there'}**! I am your Olympic-standard **SCMS AI Sports Assistant**. I can assist you with:
* **Class schedules and registration** (Swimming, Boxing, Badminton, Gym, Yoga).
* **Workout plans tailored to your fitness goals** (Muscle gain, Fat loss, Recovery).
* **Standardized sports nutrition** before and after workouts.
* **Gym rules, facility check-in, and rescheduling policies**.

*You can ask in any language — I will reply in the language you write in.*

What information would you like to explore today?`
      : `Xin chào **${currentUser?.fullName || 'bạn'}**! Tôi là **Trợ lý Thể thao AI SCMS** chuẩn Olympic. Tôi có thể hỗ trợ bạn tư vấn:
* **Lịch học và đăng ký các lớp thể thao** (Bơi lội, Boxing, Cầu lông, Gym, Yoga).
* **Kế hoạch tập luyện theo mục tiêu** (Tăng cơ, Giảm mỡ, Phục hồi thể lực).
* **Dinh dưỡng thể thao chuẩn hóa** trước và sau giờ tập.
* **Quy định sử dụng phòng tập, check-in và đổi lịch**.

*Bạn có thể hỏi bằng bất kỳ ngôn ngữ nào — tôi sẽ trả lời bằng ngôn ngữ bạn dùng.*

Bạn muốn tìm hiểu thông tin nào hôm nay?`,
    time: new Date().toLocaleTimeString(isEn ? 'en-US' : 'vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })
  });

  const [messages, setMessages] = useState([getInitialMessage()]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [speakingId, setSpeakingId] = useState(null);
  const [reactions, setReactions] = useState({}); // { [msgId]: 'like' | 'dislike' }
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAsking]);

  // Keep page state synced if the popup clears conversations.
  useEffect(() => {
    const handleCleared = (e) => {
      if (e.detail?.source === 'page') return;
      setSpeakingId(null);
      setConversationId(null);
      setMessages([getInitialMessage()]);
      setInputQuestion('');
      setReactions({});
    };
    window.addEventListener('SCMS_AI_CHAT_CLEARED', handleCleared);
    return () => window.removeEventListener('SCMS_AI_CHAT_CLEARED', handleCleared);
  }, [isEn]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSend = async (questionToSend) => {
    const text = (questionToSend || inputQuestion).trim();
    if (!text || isAsking) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString(isEn ? 'en-US' : 'vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsAsking(true);

    try {
      const result = await aiApi.chat(text, conversationId, language);
      const reply = result.reply;
      setConversationId(result.conversationId);

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString(isEn ? 'en-US' : 'vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      const errorText = err.message || (isEn ? 'Connection error to the center AI service. Please try again later.' : 'Lỗi kết nối tới dịch vụ AI của trung tâm. Vui lòng thử lại sau.');

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          isError: true,
          code: err.code || (err.status === 429 ? 'AI-RATE-LIMIT' : 'AI-ERROR'),
          text: errorText,
          failedQuestion: text,
          time: new Date().toLocaleTimeString(isEn ? 'en-US' : 'vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })
        }
      ]);
      showError(err.message || (isEn ? 'Cannot receive AI response' : 'Không thể nhận phản hồi từ AI'));
    } finally {
      setIsAsking(false);
    }
  };

  const handleResetChat = async () => {
    if (isAsking || isResetting) return;
    setIsResetting(true);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    try {
      await aiApi.clearConversations();
      clearMemberAIChatStorage();
      setSpeakingId(null);
      setConversationId(null);
      setMessages([getInitialMessage()]);
      setInputQuestion('');
      setReactions({});
      window.dispatchEvent(new CustomEvent('SCMS_AI_CHAT_CLEARED', { detail: { source: 'page' } }));
      showSuccess(isEn ? 'AI Assistant conversation reloaded!' : 'Đã load lại cuộc hội thoại với Trợ lý AI!');
    } catch (err) {
      showError(err?.message || (isEn ? 'Unable to reload conversation. Please try again.' : 'Không thể load lại cuộc hội thoại. Vui lòng thử lại.'));
    } finally {
      setIsResetting(false);
    }
  };

  const copyMessage = (msg) => {
    if (!msg?.text) return;
    navigator.clipboard?.writeText(msg.text);
    setCopiedId(msg.id);
    showSuccess(isEn ? 'Content copied to clipboard!' : 'Đã sao chép nội dung vào bộ nhớ tạm!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSpeak = (msg) => {
    if (!('speechSynthesis' in window)) {
      showError(isEn ? 'Your browser does not support text-to-speech.' : 'Trình duyệt của bạn không hỗ trợ tính năng phát âm.');
      return;
    }

    if (speakingId === msg.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown asterisks and backticks for clean speech
    const cleanText = msg.text.replace(/[\*`#]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = detectSpeechLang(cleanText, isEn ? 'en-US' : 'vi-VN');
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(msg.id);
    window.speechSynthesis.speak(utterance);
  };

  const handleReaction = (msgId, type) => {
    setReactions((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === type ? null : type
    }));
    showSuccess(type === 'like' ? (isEn ? 'Thank you for your feedback!' : 'Cảm ơn bạn đã đánh giá phản hồi hữu ích!') : (isEn ? 'Thank you! SCMS will improve its responses.' : 'Cảm ơn bạn! SCMS sẽ cải thiện câu trả lời tốt hơn.'));
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Olympic AI Masterpiece Banner */}
      <div className="scms-hero relative rounded-3xl bg-gradient-to-r from-brand-sage-700 via-brand-teal-600 via-brand-teal-500 to-brand-sand-500 dark:from-brand-sage-900 dark:via-brand-teal-900 dark:via-brand-teal-800 dark:to-brand-sand-900 text-white p-6 sm:p-7 border border-white/30 dark:border-white/10 shadow-xl shadow-brand-teal-600/20 overflow-hidden animate-fade-slide-up">
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
          <div className="space-y-2 max-w-2xl min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-brand-navy-900/90 backdrop-blur-md text-brand-sage-900 dark:text-brand-sage-300 border border-white/80 dark:border-white/20 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <span className="material-symbols-outlined text-[13px] text-brand-sand-700 dark:text-brand-sand-400">smart_toy</span>
                SCMS AI FITNESS ASSISTANT · {isEn ? 'OLYMPIC STANDARD' : 'CHUẨN OLYMPIC'}
              </span>
            </div>
            <h1 className="font-chivo text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
              {isEn ? 'Exclusive AI Sports Assistant' : 'Trợ Lý Thể Thao AI Độc Quyền'}
            </h1>
            <p className="text-white/90 text-xs sm:text-sm leading-relaxed drop-shadow-xs font-medium">
              {isEn
                ? 'Inquire class schedules by date, package prices, facilities, opening hours, and contact center 24/7. Exercise suggestions should be reviewed by a coach.'
                : 'Hỏi lịch lớp theo ngày, giá gói tập, sân/phòng, giờ mở cửa và liên hệ trung tâm 24/7. Gợi ý bài tập cần được HLV xem xét trước khi áp dụng.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-white/85 dark:bg-brand-navy-900/85 backdrop-blur-md border border-white/80 dark:border-white/20 text-xs font-bold text-brand-navy-800 dark:text-brand-navy-200 flex items-center gap-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse" />
              <span>{isEn ? 'Connected 24/7' : 'Sẵn sàng kết nối 24/7'}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('SCMS_OPEN_AI_POPUP'));
                showSuccess(isEn ? 'Opened AI Assistant popup at bottom right!' : 'Đã mở Trợ lý AI dạng popup ở góc phải màn hình!');
              }}
              className="px-4 py-2.5 bg-brand-navy-950 hover:bg-brand-navy-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg hover:shadow-xl shrink-0 border border-white/20 active:scale-95 cursor-pointer backdrop-blur-md"
            >
              <span className="material-symbols-outlined text-[18px] text-brand-sand-300">open_in_new</span>
              <span>{isEn ? 'Open Screen Corner Popup' : 'Mở Popup góc màn hình'}</span>
            </button>

            <button
              onClick={handleResetChat}
              disabled={isAsking || isResetting}
              className="px-3.5 py-2.5 rounded-xl bg-white/90 hover:bg-white text-brand-navy-800 border border-white text-xs font-bold flex items-center gap-1.5 transition shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${isResetting ? 'animate-spin' : ''}`}>restart_alt</span>
              <span>{isEn ? 'Reset Chat' : 'Làm mới'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Studio Box */}
      <div className="bg-white rounded-3xl border border-brand-navy-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
        {/* Chat Header Bar */}
        <div className="px-6 py-4 bg-brand-navy-50/80 border-b border-brand-navy-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-navy-900 to-brand-navy-800 text-white flex items-center justify-center shadow-sm border border-brand-navy-700">
              <span className="material-symbols-outlined text-[20px] text-brand-danger-400">smart_toy</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-brand-navy-900 flex items-center gap-2">
                <span>SCMS AI Assistant</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-sage-50 text-brand-sage-700 border border-brand-sage-200">
                  Online
                </span>
              </h3>
              <p className="text-xs text-brand-navy-500">
                {isEn ? 'Chat history is encrypted and private to your account.' : 'Lịch sử cuộc trò chuyện được mã hóa và bảo mật riêng cho tài khoản của bạn.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetChat}
              disabled={isAsking || isResetting}
              title={isEn ? "Reload entire conversation" : "Làm mới toàn bộ hội thoại"}
              className="p-2 text-brand-navy-400 hover:text-brand-navy-700 hover:bg-brand-navy-200/60 rounded-xl transition disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${isResetting ? 'animate-spin' : ''}`}>
                {isResetting ? 'progress_activity' : 'delete_sweep'}
              </span>
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-brand-navy-50/30">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-2xl shrink-0 flex items-center justify-center font-bold text-xs shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-tr from-brand-danger-600 to-brand-danger-600 text-white shadow-brand-danger-600/20'
                    : 'bg-gradient-to-tr from-brand-navy-900 to-brand-navy-800 text-white border border-brand-navy-700'
                }`}
              >
                {msg.sender === 'user' ? (
                  <span className="material-symbols-outlined text-[18px]">person</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px] text-brand-danger-400">smart_toy</span>
                )}
              </div>

              {/* Message Bubble Container */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-5 text-xs sm:text-sm shadow-sm transition-all ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-brand-danger-600 to-brand-danger-600 text-white rounded-tr-none shadow-brand-danger-600/10'
                    : msg.isError
                    ? 'bg-brand-danger-50 text-brand-danger-950 border border-brand-danger-200 rounded-tl-none'
                    : 'bg-white text-brand-navy-800 border border-brand-navy-200/90 rounded-tl-none shadow-brand-navy-100'
                }`}
              >
                {/* Error Code Tag */}
                {msg.isError && msg.code && (
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-danger-200 text-brand-danger-900 mb-2 border border-brand-danger-300">
                    {isEn ? 'ERROR CODE:' : 'MÃ LỖI:'} {msg.code}
                  </span>
                )}

                {/* Formatted Content Body */}
                <div className="leading-relaxed">
                  {msg.sender === 'user' ? (
                    <div className="whitespace-pre-wrap font-medium">{msg.text}</div>
                  ) : (
                    <div>{parseFormattedMarkdown(msg.text)}</div>
                  )}
                </div>

                {/* Failed Question Retry Action */}
                {msg.isError && msg.failedQuestion && (
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => handleSend(msg.failedQuestion)}
                      className="px-3.5 py-1.5 rounded-xl bg-brand-danger-600 hover:bg-brand-danger-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">refresh</span>
                      <span>{isEn ? 'Retry sending this question' : 'Thử gửi lại câu hỏi này'}</span>
                    </button>
                  </div>
                )}

                {/* Footer Controls: Time, Copy, TTS, Feedback */}
                <div
                  className={`flex items-center justify-between gap-3 pt-3 mt-3 border-t text-[11px] font-mono ${
                    msg.sender === 'user'
                      ? 'border-white/20 text-brand-danger-100'
                      : 'border-brand-navy-100 text-brand-navy-400'
                  }`}
                >
                  <span>{msg.time}</span>

                  {msg.sender === 'ai' && !msg.isError && (
                    <div className="flex items-center gap-1">
                      {/* Copy Button */}
                      <button
                        onClick={() => copyMessage(msg)}
                        title={isEn ? "Copy text" : "Sao chép nội dung"}
                        className="p-1 hover:text-brand-navy-800 rounded-lg hover:bg-brand-navy-100 transition"
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {copiedId === msg.id ? 'check' : 'content_copy'}
                        </span>
                      </button>

                      {/* Text-to-Speech Button */}
                      <button
                        onClick={() => toggleSpeak(msg)}
                        title={speakingId === msg.id ? (isEn ? 'Stop reading' : 'Dừng đọc') : (isEn ? 'Read response' : 'Đọc câu trả lời')}
                        className={`p-1 rounded-lg transition ${
                          speakingId === msg.id
                            ? 'text-brand-danger-600 bg-brand-danger-50'
                            : 'hover:text-brand-navy-800 hover:bg-brand-navy-100'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {speakingId === msg.id ? 'stop_circle' : 'volume_up'}
                        </span>
                      </button>

                      {/* Reaction Thumbs Up */}
                      <button
                        onClick={() => handleReaction(msg.id, 'like')}
                        title={isEn ? "Helpful response" : "Phản hồi hữu ích"}
                        className={`p-1 rounded-lg transition ${
                          reactions[msg.id] === 'like'
                            ? 'text-brand-sage-700 bg-brand-sage-50'
                            : 'hover:text-brand-navy-800 hover:bg-brand-navy-100'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[15px]">thumb_up</span>
                      </button>

                      {/* Reaction Thumbs Down */}
                      <button
                        onClick={() => handleReaction(msg.id, 'dislike')}
                        title={isEn ? "Unsatisfied response" : "Phản hồi chưa hài lòng"}
                        className={`p-1 rounded-lg transition ${
                          reactions[msg.id] === 'dislike'
                            ? 'text-brand-danger-600 bg-brand-danger-50'
                            : 'hover:text-brand-navy-800 hover:bg-brand-navy-100'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[15px]">thumb_down</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* AI Thinking Animation */}
          {isAsking && (
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-brand-navy-900 text-white flex items-center justify-center border border-brand-navy-700 shadow-sm">
                <span className="material-symbols-outlined text-[18px] text-brand-danger-400">smart_toy</span>
              </div>
              <div className="bg-white p-4 rounded-3xl rounded-tl-none border border-brand-navy-200 shadow-sm flex items-center gap-3 text-xs text-brand-navy-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-brand-danger-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-brand-danger-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-brand-danger-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="font-medium text-brand-navy-600">{isEn ? 'SCMS AI assistant is analyzing and composing response...' : 'Trợ lý SCMS AI đang phân tích và soạn phản hồi...'}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-brand-navy-200 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2.5"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                aria-label={isEn ? "Question for AI assistant" : "Câu hỏi cho trợ lý AI"}
                placeholder={isEn ? "E.g. What classes are there tomorrow? Package pricing? Center opening hours?..." : "Ví dụ: Ngày mai có lớp gì? Giá gói tập? Trung tâm mở cửa lúc mấy giờ?..."}
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                disabled={isAsking}
                className="w-full pl-4 pr-10 py-3 text-xs sm:text-sm rounded-2xl border border-brand-navy-200 bg-brand-navy-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-danger-500/20 focus:border-brand-danger-500 transition shadow-inner"
              />
              {inputQuestion && (
                <button
                  type="button"
                  onClick={() => setInputQuestion('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-navy-400 hover:text-brand-navy-600"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isAsking || !inputQuestion.trim()}
              className="px-6 py-3 bg-gradient-to-r from-brand-danger-600 to-brand-danger-600 hover:from-brand-danger-500 hover:to-brand-danger-500 disabled:opacity-50 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition shadow-md shadow-brand-danger-600/25 flex items-center gap-1.5 shrink-0 active:scale-95"
            >
              <span>{isEn ? 'Send' : 'Gửi'}</span>
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </form>

          <p className="text-[11px] text-brand-navy-400 text-center flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-brand-sand-700 dark:text-brand-sand-400">info</span>
            <span>{isEn ? 'Safety Notice: Workout and nutrition suggestions must be verified with your coach before practicing.' : 'Khuyến cáo an toàn: Gợi ý bài tập và dinh dưỡng cần được HLV chuyên trách xác nhận trước khi thực hiện.'}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
