import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
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

  const getInitialMessage = () => ({
    id: 'welcome',
    sender: 'ai',
    text: `Xin chào **${currentUser?.fullName || 'bạn'}**! Tôi là **Trợ lý Thể thao AI SCMS** chuẩn Olympic. Tôi có thể hỗ trợ bạn tư vấn:
* **Lịch học và đăng ký các lớp thể thao** (Bơi lội, Boxing, Cầu lông, Gym, Yoga).
* **Kế hoạch tập luyện theo mục tiêu** (Tăng cơ, Giảm mỡ, Phục hồi thể lực).
* **Dinh dưỡng thể thao chuẩn hóa** trước và sau giờ tập.
* **Quy định sử dụng phòng tập, check-in và đổi lịch**.

Bạn muốn tìm hiểu thông tin nào hôm nay?`,
    time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
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
    setMessages([getInitialMessage()]);
    setInputQuestion('');
    setIsAsking(false);
    showSuccess('Đã làm mới cuộc hội thoại với Trợ lý AI!');
  };

  const copyMessage = (msg) => {
    if (!msg?.text) return;
    navigator.clipboard?.writeText(msg.text);
    setCopiedId(msg.id);
    showSuccess('Đã sao chép nội dung vào bộ nhớ tạm!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSpeak = (msg) => {
    if (!('speechSynthesis' in window)) {
      showError('Trình duyệt của bạn không hỗ trợ tính năng phát âm.');
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
    showSuccess(type === 'like' ? 'Cảm ơn bạn đã đánh giá phản hồi hữu ích!' : 'Cảm ơn bạn! SCMS sẽ cải thiện câu trả lời tốt hơn.');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Olympic Luxury Dark Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl text-white">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              SCMS AI FITNESS ASSISTANT · CHUẨN OLYMPIC
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Trợ Lý Thể Thao AI Độc Quyền
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Hỏi lịch lớp theo ngày, giá gói tập, sân/phòng, giờ mở cửa và liên hệ trung tâm 24/7. Gợi ý bài tập cần được HLV xem xét trước khi áp dụng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-medium text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sẵn sàng kết nối 24/7</span>
            </div>

            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('SCMS_OPEN_AI_POPUP'));
                showSuccess('Đã mở Trợ lý AI dạng popup ở góc phải màn hình!');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl transition duration-150 shadow-md shadow-red-950/40 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              <span>Mở Popup góc màn hình</span>
            </button>

            <button
              onClick={handleResetChat}
              disabled={isAsking}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition duration-150 backdrop-blur-sm active:scale-95 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Làm mới hội thoại</span>
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
                Lịch sử cuộc trò chuyện được mã hóa và bảo mật riêng cho tài khoản của bạn.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetChat}
              title="Làm mới toàn bộ hội thoại"
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
                    MÃ LỖI: {msg.code}
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
                      <span>Thử gửi lại câu hỏi này</span>
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
                        title="Sao chép nội dung"
                        className="p-1 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {copiedId === msg.id ? 'check' : 'content_copy'}
                        </span>
                      </button>

                      {/* Text-to-Speech Button */}
                      <button
                        onClick={() => toggleSpeak(msg)}
                        title={speakingId === msg.id ? 'Dừng đọc' : 'Đọc câu trả lời'}
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
                        title="Phản hồi hữu ích"
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
                        title="Phản hồi chưa hài lòng"
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
                <span className="font-medium text-slate-600">Trợ lý SCMS AI đang phân tích và soạn phản hồi...</span>
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
                aria-label="Câu hỏi cho trợ lý AI"
                placeholder="Ví dụ: Ngày mai có lớp gì? Giá gói tập? Trung tâm mở cửa lúc mấy giờ?..."
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
              <span>Gửi</span>
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </form>

          <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-amber-500">info</span>
            <span>Khuyến cáo an toàn: Gợi ý bài tập và dinh dưỡng cần được HLV chuyên trách xác nhận trước khi thực hiện.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
