import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { aiApi } from '../../services/api.js';

// Helper to render inline markdown (bold, italic, inline code)
function renderInlineMarkdown(text = '') {
  const tokens = text.split(/(\*\*[^*]+?\*\*|`[^`]+?`|\*[^*]+?\*)/g);
  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={i} className="font-extrabold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-slate-100 text-red-600 font-mono text-[11px] font-semibold border border-slate-200"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      return (
        <em key={i} className="italic text-slate-700">
          {token.slice(1, -1)}
        </em>
      );
    }
    return token;
  });
}

// Helper to parse block-level markdown into structured React elements
function parseFormattedMarkdown(content = '') {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let currentList = [];

  const flushList = (keyPrefix) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`${keyPrefix}-list-${elements.length}`} className="my-2 space-y-1.5 pl-0.5">
          {currentList.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
              <div className="flex-1">{renderInlineMarkdown(item)}</div>
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();

    // Bullet items: * or - or •
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      const itemText = trimmed.replace(/^[\*\-•]\s+/, '');
      currentList.push(itemText);
      return;
    }

    // Numbered lists: 1. 2. etc.
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      flushList(`line-${lineIndex}`);
      elements.push(
        <div key={`num-${lineIndex}`} className="flex items-start gap-2.5 my-1.5 pl-0.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
            {numMatch[1]}
          </span>
          <div className="flex-1">{renderInlineMarkdown(numMatch[2])}</div>
        </div>
      );
      return;
    }

    flushList(`line-${lineIndex}`);

    if (!trimmed) {
      elements.push(<div key={`empty-${lineIndex}`} className="h-1.5" />);
      return;
    }

    // Headings: ###
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={`h3-${lineIndex}`} className="text-xs sm:text-sm font-extrabold text-slate-900 mt-3 mb-1 flex items-center gap-1.5 text-red-700">
          <span className="material-symbols-outlined text-[16px]">sports_score</span>
          <span>{trimmed.replace(/^###\s+/, '')}</span>
        </h4>
      );
      return;
    }

    // Headings: ## or #
    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      elements.push(
        <h3 key={`h2-${lineIndex}`} className="text-sm sm:text-base font-extrabold text-slate-900 mt-3 mb-1.5 border-b border-slate-100 pb-1">
          {trimmed.replace(/^#+\s+/, '')}
        </h3>
      );
      return;
    }

    // Blockquote: >
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote key={`quote-${lineIndex}`} className="p-3 my-2 bg-slate-50 border-l-4 border-red-500 rounded-r-xl text-xs text-slate-700 italic">
          {renderInlineMarkdown(trimmed.replace(/^>\s+/, ''))}
        </blockquote>
      );
      return;
    }

    // Standard paragraph
    elements.push(
      <p key={`p-${lineIndex}`} className="my-1 text-xs sm:text-sm text-slate-800 leading-relaxed">
        {renderInlineMarkdown(line)}
      </p>
    );
  });

  flushList('final');
  return elements;
}

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

What information would you like to explore today?`
      : `Xin chào **${currentUser?.fullName || 'bạn'}**! Tôi là **Trợ lý Thể thao AI SCMS** chuẩn Olympic. Tôi có thể hỗ trợ bạn tư vấn:
* **Lịch học và đăng ký các lớp thể thao** (Bơi lội, Boxing, Cầu lông, Gym, Yoga).
* **Kế hoạch tập luyện theo mục tiêu** (Tăng cơ, Giảm mỡ, Phục hồi thể lực).
* **Dinh dưỡng thể thao chuẩn hóa** trước và sau giờ tập.
* **Quy định sử dụng phòng tập, check-in và đổi lịch**.

Bạn muốn tìm hiểu thông tin nào hôm nay?`,
    time: new Date().toLocaleTimeString(isEn ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })
  });

  const [messages, setMessages] = useState([getInitialMessage()]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
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
      time: new Date().toLocaleTimeString(isEn ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsAsking(true);

    try {
      const result = await aiApi.chat(text, conversationId);
      const reply = result.reply;
      setConversationId(result.conversationId);

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString(isEn ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })
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
          time: new Date().toLocaleTimeString(isEn ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      showError(err.message || (isEn ? 'Cannot receive AI response' : 'Không thể nhận phản hồi từ AI'));
    } finally {
      setIsAsking(false);
    }
  };

  const handleResetChat = () => {
    if (isAsking) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingId(null);
    setConversationId(null);
    setMessages([getInitialMessage()]);
    setInputQuestion('');
    setIsAsking(false);
    showSuccess(isEn ? 'AI Assistant conversation reset!' : 'Đã làm mới cuộc hội thoại với Trợ lý AI!');
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
    utterance.lang = isEn ? 'en-US' : 'vi-VN';
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
      <div className="relative rounded-3xl bg-gradient-to-r from-[#2F7B5D] via-[#24828F] via-[#3FAEB8] to-[#E5A33C] dark:from-[#184534] dark:via-[#144850] dark:via-[#1B5760] dark:to-[#5E4014] text-white p-6 sm:p-7 border border-white/30 dark:border-white/10 shadow-xl shadow-[#24828F]/20 overflow-hidden animate-fade-slide-up">
        {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-[#F2CC8F]/45 via-[#E5A33C]/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-[#81B29A]/40 via-[#2F7B5D]/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-[#A8DADC]/30 rounded-full blur-3xl pointer-events-none" />
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
              <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[#1B4332] dark:text-emerald-300 border border-white/80 dark:border-white/20 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <span className="material-symbols-outlined text-[13px] text-amber-500">smart_toy</span>
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
            <div className="px-3.5 py-2 rounded-xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-white/80 dark:border-white/20 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isEn ? 'Connected 24/7' : 'Sẵn sàng kết nối 24/7'}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('SCMS_OPEN_AI_POPUP'));
                showSuccess(isEn ? 'Opened AI Assistant popup at bottom right!' : 'Đã mở Trợ lý AI dạng popup ở góc phải màn hình!');
              }}
              className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg hover:shadow-xl shrink-0 border border-white/20 active:scale-95 cursor-pointer backdrop-blur-md"
            >
              <span className="material-symbols-outlined text-[18px] text-[#F2CC8F]">open_in_new</span>
              <span>{isEn ? 'Open Screen Corner Popup' : 'Mở Popup góc màn hình'}</span>
            </button>

            <button
              onClick={handleResetChat}
              disabled={isAsking}
              className="px-3.5 py-2.5 rounded-xl bg-white/90 hover:bg-white text-slate-800 border border-white text-xs font-bold flex items-center gap-1.5 transition shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              <span>{isEn ? 'Reset Chat' : 'Làm mới'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Studio Box */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
        {/* Chat Header Bar */}
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex items-center justify-center shadow-sm border border-slate-700">
              <span className="material-symbols-outlined text-[20px] text-red-400">smart_toy</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>SCMS AI Assistant</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Online
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {isEn ? 'Chat history is encrypted and private to your account.' : 'Lịch sử cuộc trò chuyện được mã hóa và bảo mật riêng cho tài khoản của bạn.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetChat}
              title={isEn ? "Reset entire conversation" : "Làm mới toàn bộ hội thoại"}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
            >
              <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 bg-slate-50/30">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-2xl shrink-0 flex items-center justify-center font-bold text-xs shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-tr from-red-600 to-rose-600 text-white shadow-red-600/20'
                    : 'bg-gradient-to-tr from-slate-900 to-slate-800 text-white border border-slate-700'
                }`}
              >
                {msg.sender === 'user' ? (
                  <span className="material-symbols-outlined text-[18px]">person</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px] text-red-400">smart_toy</span>
                )}
              </div>

              {/* Message Bubble Container */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-5 text-xs sm:text-sm shadow-sm transition-all ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-tr-none shadow-red-600/10'
                    : msg.isError
                    ? 'bg-rose-50 text-rose-950 border border-rose-200 rounded-tl-none'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none shadow-slate-100'
                }`}
              >
                {/* Error Code Tag */}
                {msg.isError && msg.code && (
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-200 text-rose-900 mb-2 border border-rose-300">
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
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm"
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
                      ? 'border-white/20 text-red-100'
                      : 'border-slate-100 text-slate-400'
                  }`}
                >
                  <span>{msg.time}</span>

                  {msg.sender === 'ai' && !msg.isError && (
                    <div className="flex items-center gap-1">
                      {/* Copy Button */}
                      <button
                        onClick={() => copyMessage(msg)}
                        title={isEn ? "Copy text" : "Sao chép nội dung"}
                        className="p-1 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
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
                            ? 'text-red-600 bg-red-50'
                            : 'hover:text-slate-800 hover:bg-slate-100'
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
                            ? 'text-emerald-600 bg-emerald-50'
                            : 'hover:text-slate-800 hover:bg-slate-100'
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
                            ? 'text-rose-600 bg-rose-50'
                            : 'hover:text-slate-800 hover:bg-slate-100'
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
              <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center border border-slate-700 shadow-sm">
                <span className="material-symbols-outlined text-[18px] text-red-400">smart_toy</span>
              </div>
              <div className="bg-white p-4 rounded-3xl rounded-tl-none border border-slate-200 shadow-sm flex items-center gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-red-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-red-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="font-medium text-slate-600">{isEn ? 'SCMS AI assistant is analyzing and composing response...' : 'Trợ lý SCMS AI đang phân tích và soạn phản hồi...'}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200 space-y-2">
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
                className="w-full pl-4 pr-10 py-3 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-slate-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition shadow-inner"
              />
              {inputQuestion && (
                <button
                  type="button"
                  onClick={() => setInputQuestion('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isAsking || !inputQuestion.trim()}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition shadow-md shadow-red-600/25 flex items-center gap-1.5 shrink-0 active:scale-95"
            >
              <span>{isEn ? 'Send' : 'Gửi'}</span>
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </form>

          <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-amber-500">info</span>
            <span>{isEn ? 'Safety Notice: Workout and nutrition suggestions must be verified with your coach before practicing.' : 'Khuyến cáo an toàn: Gợi ý bài tập và dinh dưỡng cần được HLV chuyên trách xác nhận trước khi thực hiện.'}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
