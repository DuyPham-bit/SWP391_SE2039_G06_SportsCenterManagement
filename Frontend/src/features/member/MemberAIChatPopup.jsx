import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { aiApi } from '../../services/api.js';

// Global helper to trigger opening the AI chat popup from anywhere in the app
export function openMemberAIChat(prompt = '') {
  window.dispatchEvent(new CustomEvent('SCMS_OPEN_AI_POPUP', { detail: { prompt } }));
}

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
        <ul key={`${keyPrefix}-list-${elements.length}`} className="my-1.5 space-y-1 pl-0.5">
          {currentList.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
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

    // Bullet items
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      const itemText = trimmed.replace(/^[\*\-•]\s+/, '');
      currentList.push(itemText);
      return;
    }

    // Numbered lists
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      flushList(`line-${lineIndex}`);
      elements.push(
        <div key={`num-${lineIndex}`} className="flex items-start gap-2 my-1 pl-0.5 text-xs text-slate-700 leading-relaxed">
          <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
            {numMatch[1]}
          </span>
          <div className="flex-1">{renderInlineMarkdown(numMatch[2])}</div>
        </div>
      );
      return;
    }

    flushList(`line-${lineIndex}`);

    if (!trimmed) {
      elements.push(<div key={`empty-${lineIndex}`} className="h-1" />);
      return;
    }

    // Headings: ###
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={`h3-${lineIndex}`} className="text-xs font-bold text-slate-900 mt-2 mb-1 flex items-center gap-1.5 text-red-700">
          <span className="material-symbols-outlined text-[15px]">sports_score</span>
          <span>{trimmed.replace(/^###\s+/, '')}</span>
        </h4>
      );
      return;
    }

    // Headings: ## or #
    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      elements.push(
        <h3 key={`h2-${lineIndex}`} className="text-xs sm:text-sm font-extrabold text-slate-900 mt-2.5 mb-1 border-b border-slate-100 pb-0.5">
          {trimmed.replace(/^#+\s+/, '')}
        </h3>
      );
      return;
    }

    // Blockquote: >
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote key={`quote-${lineIndex}`} className="p-2 my-1.5 bg-slate-50 border-l-4 border-red-500 rounded-r-lg text-xs text-slate-700 italic">
          {renderInlineMarkdown(trimmed.replace(/^>\s+/, ''))}
        </blockquote>
      );
      return;
    }

    // Standard paragraph
    elements.push(
      <p key={`p-${lineIndex}`} className="my-1 text-xs text-slate-800 leading-relaxed">
        {renderInlineMarkdown(line)}
      </p>
    );
  });

  flushList('final');
  return elements;
}

const QUICK_SUGGESTIONS = [
  { label: '🏊‍♂️ Lịch bơi & ca hôm nay', query: 'Hôm nay có các lớp học hay ca bơi nào đang mở?' },
  { label: '💳 Giá các gói tập', query: 'Trung tâm hiện có những gói tập nào và biểu phí ra sao?' },
  { label: '🏋️‍♂️ Gợi ý lịch tập tăng cơ', query: 'Gợi ý cho tôi kế hoạch tập thể thao 3 buổi/tuần chuẩn nâng cao sức khỏe' },
  { label: '⏱️ Giờ mở cửa trung tâm', query: 'Trung tâm SCMS mở cửa từ mấy giờ đến mấy giờ?' },
  { label: '🔄 Quy định đổi / hủy lịch', query: 'Quy định hủy hoặc đổi lịch ca học thể thao trước bao lâu?' },
  { label: '🥗 Dinh dưỡng sau giờ tập', query: 'Nên ăn uống bổ sung gì sau buổi tập thể thao để phục hồi tốt nhất?' }
];

const STORAGE_KEY_MSGS = 'SCMS_MEMBER_AI_CHAT_MSGS';
const STORAGE_KEY_CONV = 'SCMS_MEMBER_AI_CONV_ID';

export function MemberAIChatPopup() {
  const { currentUser, role } = useAuth();
  const { showSuccess, showError } = useToast();

  const getInitialMessage = () => ({
    id: 'welcome',
    sender: 'ai',
    text: `Xin chào **${currentUser?.fullName || 'bạn'}**! 👋 Tôi là **Trợ lý Thể thao AI SCMS** chuẩn Olympic. Tôi luôn sẵn sàng hỗ trợ bạn ngay trong popup này:
* **Tra cứu lịch lớp & ca bơi** hôm nay hoặc trong tuần.
* **Tư vấn giá gói tập** & quyền lợi hội viên.
* **Gợi ý bài tập & chế độ dinh dưỡng** theo thể trạng.
* **Hướng dẫn check-in mã thẻ, đổi lịch & hỗ trợ**.

Bạn muốn tìm hiểu thông tin nào hôm nay?`,
    time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_MSGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return [getInitialMessage()];
  });
  const [inputQuestion, setInputQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [conversationId, setConversationId] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY_CONV) || null;
    } catch (e) {
      return null;
    }
  });
  const [copiedId, setCopiedId] = useState(null);
  const [speakingId, setSpeakingId] = useState(null);
  const [reactions, setReactions] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sync to session storage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY_MSGS, JSON.stringify(messages));
      if (conversationId) {
        sessionStorage.setItem(STORAGE_KEY_CONV, conversationId);
      } else {
        sessionStorage.removeItem(STORAGE_KEY_CONV);
      }
    } catch (e) {
      // ignore
    }
  }, [messages, conversationId]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isAsking, isOpen, isMinimized]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMinimized]);

  // Listen for global open event
  useEffect(() => {
    const handleOpen = (e) => {
      setIsOpen(true);
      setIsMinimized(false);
      setUnreadCount(0);
      if (e.detail?.prompt) {
        handleSend(e.detail.prompt);
      }
    };
    window.addEventListener('SCMS_OPEN_AI_POPUP', handleOpen);
    return () => window.removeEventListener('SCMS_OPEN_AI_POPUP', handleOpen);
  }, [conversationId, isAsking]);

  // Clean up speech synthesis
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
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
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
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      if (isMinimized) {
        setUnreadCount((c) => c + 1);
      }
    } catch (err) {
      const errorText = err.proposedHandling
        ? `${err.message || 'Lỗi kết nối Trợ lý AI'}\n\n💡 Hướng dẫn xử lý: ${err.proposedHandling}`
        : `${err.message || 'Lỗi kết nối tới dịch vụ AI của trung tâm. Vui lòng thử lại sau.'}`;

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          isError: true,
          code: err.code || (err.status === 429 ? 'AI-RATE-LIMIT' : 'AI-ERROR'),
          text: errorText,
          failedQuestion: text,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      showError(err.message || 'Không thể nhận phản hồi từ AI');
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
    const initial = [getInitialMessage()];
    setMessages(initial);
    setInputQuestion('');
    setIsAsking(false);
    setUnreadCount(0);
    try {
      sessionStorage.removeItem(STORAGE_KEY_MSGS);
      sessionStorage.removeItem(STORAGE_KEY_CONV);
    } catch (e) {
      // ignore
    }
    showSuccess('Đã làm mới cuộc trò chuyện!');
  };

  const copyMessage = (msg) => {
    if (!msg?.text) return;
    navigator.clipboard?.writeText(msg.text);
    setCopiedId(msg.id);
    showSuccess('Đã sao chép nội dung!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSpeak = (msg) => {
    if (!('speechSynthesis' in window)) {
      showError('Trình duyệt chưa hỗ trợ tính năng phát âm.');
      return;
    }

    if (speakingId === msg.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = msg.text.replace(/[\*`#]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'vi-VN';
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
    showSuccess(type === 'like' ? 'Cảm ơn bạn đã thích phản hồi này!' : 'Cảm ơn góp ý! SCMS sẽ cải thiện tốt hơn.');
  };

  return (
    <>
      {/* 1. Floating Launch Bubble (When Closed) */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 animate-in fade-in zoom-in-95 duration-300">
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
              setUnreadCount(0);
            }}
            aria-label="Mở Trợ lý Thể thao AI SCMS"
            title="Nhấn để trò chuyện cùng Trợ lý Thể thao AI SCMS 24/7"
            className="group relative flex items-center gap-3 p-2.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-slate-950 via-slate-900 to-zinc-950 text-white border border-red-500/40 shadow-2xl hover:shadow-red-600/30 hover:border-red-400 transition-all duration-300 active:scale-95"
          >
            {/* Outer pulsating glow ring */}
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 opacity-60 blur-sm group-hover:opacity-100 transition duration-300 group-hover:duration-200 animate-pulse pointer-events-none" />

            {/* Inner Content */}
            <div className="relative z-10 flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-red-950/40 shrink-0">
                <span className="material-symbols-outlined text-[20px] sm:text-[22px] group-hover:rotate-12 transition-transform duration-300">
                  smart_toy
                </span>
              </div>

              <div className="hidden sm:flex flex-col text-left">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-chivo font-black text-xs uppercase tracking-wider text-white">
                    Trợ Lý AI SCMS
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-red-600 text-[9px] font-extrabold uppercase">
                    PRO
                  </span>
                </div>
                <span className="text-[10px] text-slate-300 font-medium mt-1 leading-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Hỏi đáp lịch & bài tập 24/7
                </span>
              </div>
            </div>

            {/* Unread Message Pill Badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black shadow-md animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* 2. Minimized Bar State */}
      {isOpen && isMinimized && (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-zinc-950 text-white border border-red-500/40 shadow-2xl">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            </div>
            <div className="flex flex-col text-left cursor-pointer" onClick={() => setIsMinimized(false)}>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                Trợ Lý AI SCMS
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </span>
              <span className="text-[10px] text-slate-400">Cuộc trò chuyện đang mở</span>
            </div>

            <div className="flex items-center gap-1 ml-2">
              <button
                type="button"
                onClick={() => setIsMinimized(false)}
                title="Phóng to cửa sổ"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                <span className="material-symbols-outlined text-[18px]">open_in_full</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMinimized(false);
                  setIsOpen(false);
                }}
                title="Đóng"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Fully Expanded Floating Chat Popup Modal */}
      {isOpen && !isMinimized && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100dvh-5.5rem)] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 font-inter">
          {/* Header Bar */}
          <div className="relative px-4 py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-zinc-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            {/* Ambient Red Glow */}
            <div className="absolute top-0 right-1/4 w-32 h-16 bg-red-600/20 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 p-0.5 shadow-md flex items-center justify-center">
                  <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-[18px] text-red-400">smart_toy</span>
                  </div>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 shadow" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-extrabold tracking-tight text-white">
                    Trợ Lý Thể Thao SCMS AI
                  </h3>
                  <span className="px-1.5 py-0.2 rounded bg-red-600/30 border border-red-500/40 text-red-400 text-[9px] font-extrabold uppercase">
                    PRO
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 font-medium">
                  Chuẩn Olympic · Trực tuyến 24/7
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="relative z-10 flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                title="Làm mới cuộc trò chuyện"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <span className="material-symbols-outlined text-[17px]">restart_alt</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                title="Thu nhỏ xuống góc màn hình"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Đóng cửa sổ"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {/* Quick Prompts Strip */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 pl-1">
              Gợi ý:
            </span>
            {QUICK_SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(item.query)}
                disabled={isAsking}
                className="shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-slate-200 text-slate-700 text-[11px] font-medium transition shadow-xs disabled:opacity-50 active:scale-95"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Messages Stream Container */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-4 bg-slate-50/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-7 h-7 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-tr from-red-600 to-rose-600 text-white shadow-red-600/20'
                      : 'bg-slate-900 text-white border border-slate-700'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <span className="material-symbols-outlined text-[15px]">person</span>
                  ) : (
                    <span className="material-symbols-outlined text-[15px] text-red-400">smart_toy</span>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-xs transition-all ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-tr-none'
                      : msg.isError
                      ? 'bg-rose-50 text-rose-950 border border-rose-200 rounded-tl-none'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                  }`}
                >
                  {/* Error Tag */}
                  {msg.isError && msg.code && (
                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-200 text-rose-900 mb-1.5 border border-rose-300">
                      MÃ: {msg.code}
                    </span>
                  )}

                  {/* Formatted Text Content */}
                  <div className="leading-relaxed">
                    {msg.sender === 'user' ? (
                      <div className="whitespace-pre-wrap font-medium">{msg.text}</div>
                    ) : (
                      <div>{parseFormattedMarkdown(msg.text)}</div>
                    )}
                  </div>

                  {/* Retry button for failed prompt */}
                  {msg.isError && msg.failedQuestion && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleSend(msg.failedQuestion)}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition inline-flex items-center gap-1 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[14px]">refresh</span>
                        <span>Thử lại câu hỏi này</span>
                      </button>
                    </div>
                  )}

                  {/* Bottom Message Toolbar */}
                  <div
                    className={`flex items-center justify-between gap-2 pt-2 mt-2 border-t text-[10px] font-mono ${
                      msg.sender === 'user'
                        ? 'border-white/20 text-red-100'
                        : 'border-slate-100 text-slate-400'
                    }`}
                  >
                    <span>{msg.time}</span>

                    {msg.sender === 'ai' && !msg.isError && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => copyMessage(msg)}
                          title="Sao chép nội dung"
                          className="p-1 hover:text-slate-800 rounded hover:bg-slate-100 transition"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {copiedId === msg.id ? 'check' : 'content_copy'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleSpeak(msg)}
                          title={speakingId === msg.id ? 'Dừng đọc' : 'Đọc câu trả lời'}
                          className={`p-1 rounded transition ${
                            speakingId === msg.id
                              ? 'text-red-600 bg-red-50'
                              : 'hover:text-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {speakingId === msg.id ? 'stop_circle' : 'volume_up'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReaction(msg.id, 'like')}
                          title="Hữu ích"
                          className={`p-1 rounded transition ${
                            reactions[msg.id] === 'like'
                              ? 'text-emerald-600 bg-emerald-50'
                              : 'hover:text-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">thumb_up</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReaction(msg.id, 'dislike')}
                          title="Chưa hài lòng"
                          className={`p-1 rounded transition ${
                            reactions[msg.id] === 'dislike'
                              ? 'text-rose-600 bg-rose-50'
                              : 'hover:text-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">thumb_down</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Thinking / Streaming Indicator */}
            {isAsking && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center border border-slate-700 shadow-xs">
                  <span className="material-symbols-outlined text-[15px] text-red-400">smart_toy</span>
                </div>
                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-xs flex items-center gap-2.5 text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">Trợ lý AI đang soạn câu trả lời...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Form */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0 space-y-1.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Nhập câu hỏi... (VD: Hôm nay có lớp gì?)"
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  disabled={isAsking}
                  className="w-full pl-3.5 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition shadow-inner"
                />
                {inputQuestion && (
                  <button
                    type="button"
                    onClick={() => setInputQuestion('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-symbols-outlined text-[15px]">close</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isAsking || !inputQuestion.trim()}
                className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-sm shadow-red-600/30 flex items-center gap-1 shrink-0 active:scale-95"
              >
                <span>Gửi</span>
                <span className="material-symbols-outlined text-[15px]">send</span>
              </button>
            </form>

            <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[12px] text-amber-500">info</span>
              <span>Gợi ý bài tập & dinh dưỡng cần HLV thẩm định trước khi tập.</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
