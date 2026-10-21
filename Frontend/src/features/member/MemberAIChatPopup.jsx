import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { aiApi } from '../../services/api.js';

// Global helper to trigger opening the AI chat popup from anywhere in the app
export function openMemberAIChat(prompt = '') {
  window.dispatchEvent(new CustomEvent('SCMS_OPEN_AI_POPUP', { detail: { prompt } }));
}

// Helper to detect if a string contains corrupted characters / Mojibake from previous encodings
function hasCorruptedEncoding(str) {
  if (!str || typeof str !== 'string') return false;
  return /[├│─┼┬┴└┘┐┌┤ßã¼½µ¶§©®ªº]/i.test(str);
}

// Helper to render inline markdown (bold, italic, inline code)
function renderInlineMarkdown(text = '') {
  const tokens = text.split(/(\*\*[^*]+?\*\*|`[^`]+?`|\*[^*]+?\*)/g);
  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={i} className="font-bold text-slate-900 font-sans">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded-md bg-[#81B29A]/15 text-[#2D6A4F] font-mono text-[11px] font-semibold border border-[#81B29A]/30"
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
        <ul key={`${keyPrefix}-list-${elements.length}`} className="my-1.5 space-y-1.5 pl-0.5">
          {currentList.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-[#81B29A] mt-1.5 shrink-0" />
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
        <div key={`num-${lineIndex}`} className="flex items-start gap-2 my-1.5 pl-0.5 text-xs text-slate-700 leading-relaxed font-sans">
          <span className="w-4 h-4 rounded-full bg-[#81B29A]/20 text-[#2D6A4F] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
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
        <h4 key={`h3-${lineIndex}`} className="text-xs font-bold text-[#1E2235] mt-2 mb-1 flex items-center gap-1.5 font-sans">
          <span className="material-symbols-outlined text-[15px] text-[#81B29A]">sports_score</span>
          <span>{trimmed.replace(/^###\s+/, '')}</span>
        </h4>
      );
      return;
    }

    // Headings: ## or #
    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      elements.push(
        <h3 key={`h2-${lineIndex}`} className="text-xs sm:text-sm font-bold text-[#1E2235] mt-2.5 mb-1 border-b border-slate-100 pb-0.5 font-sans">
          {trimmed.replace(/^#+\s+/, '')}
        </h3>
      );
      return;
    }

    // Blockquote: >
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote key={`quote-${lineIndex}`} className="p-2.5 my-1.5 bg-[#FAF8F5] border-l-3 border-[#81B29A] rounded-r-xl text-xs text-slate-700 italic font-sans">
          {renderInlineMarkdown(trimmed.replace(/^>\s+/, ''))}
        </blockquote>
      );
      return;
    }

    // Standard paragraph
    elements.push(
      <p key={`p-${lineIndex}`} className="my-1 text-xs text-slate-800 leading-relaxed font-sans">
        {renderInlineMarkdown(line)}
      </p>
    );
  });

  flushList('final');
  return elements;
}

const QUICK_SUGGESTIONS_VI = [
  { label: '🏊‍♂️ Lịch bơi & ca hôm nay', query: 'Hôm nay có các lớp học hay ca bơi nào đang mở?' },
  { label: '💳 Giá các gói tập', query: 'Trung tâm hiện có những gói tập nào và biểu phí ra sao?' },
  { label: '🏋️‍♂️ Gợi ý lịch tập tăng cơ', query: 'Gợi ý cho tôi kế hoạch tập thể thao 3 buổi/tuần chuẩn nâng cao sức khỏe' },
  { label: '⏱️ Giờ mở cửa trung tâm', query: 'Trung tâm SCMS mở cửa từ mấy giờ đến mấy giờ?' },
  { label: '🔄 Quy định đổi / hủy lịch', query: 'Quy định hủy hoặc đổi lịch ca học thể thao trước bao lâu?' },
  { label: '🥗 Dinh dưỡng sau giờ tập', query: 'Nên ăn uống bổ sung gì sau buổi tập thể thao để phục hồi tốt nhất?' }
];

const QUICK_SUGGESTIONS_EN = [
  { label: "🏊‍♂️ Today's Classes & Pool", query: 'What classes or swimming sessions are available today?' },
  { label: '💳 Membership Pricing', query: 'What membership packages are currently available and what are the fees?' },
  { label: '🏋️‍♂️ Muscle Building Plan', query: 'Recommend a 3 sessions/week training plan for strength and wellness' },
  { label: '⏱️ Opening Hours', query: 'What are the operating hours of SCMS Sports Center?' },
  { label: '🔄 Reschedule Policy', query: 'How far in advance can I cancel or reschedule a session?' },
  { label: '🥗 Post-workout Nutrition', query: 'What should I eat after a workout for optimal recovery?' }
];

const STORAGE_KEY_MSGS = 'SCMS_MEMBER_AI_CHAT_MSGS_V5';
const STORAGE_KEY_CONV = 'SCMS_MEMBER_AI_CONV_ID_V5';

export function MemberAIChatPopup() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const getInitialMessage = (en = isEn) => ({
    id: 'welcome',
    sender: 'ai',
    text: en
      ? `Hello **${currentUser?.fullName || 'there'}**! I am your Olympic-standard **SCMS AI Sports Assistant**. I am always ready to help you:
* **Look up class & swimming schedules** today and throughout the week.
* **Consult membership packages** & member privileges.
* **Suggest workout & nutrition plans** tailored to your fitness goals.
* **Guide QR card check-in, scheduling & support**.

What would you like to explore today?`
      : `Xin chào **${currentUser?.fullName || 'bạn'}**! Tôi là **Trợ lý Thể thao AI SCMS** chuẩn Olympic. Tôi luôn sẵn sàng hỗ trợ bạn ngay trong popup này:
* **Tra cứu lịch lớp & ca bơi** hôm nay hoặc trong tuần.
* **Tư vấn giá gói tập** & quyền lợi hội viên.
* **Gợi ý bài tập & chế độ dinh dưỡng** theo thể trạng.
* **Hướng dẫn check-in mã thẻ, đổi lịch & hỗ trợ**.

Bạn muốn tìm hiểu thông tin nào hôm nay?`,
    time: new Date().toLocaleTimeString(en ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      // Clear all legacy corrupted cache keys
      ['SCMS_MEMBER_AI_CHAT_MSGS', 'SCMS_MEMBER_AI_CONV_ID', 'SCMS_MEMBER_AI_CHAT_MSGS_V2', 'SCMS_MEMBER_AI_CHAT_MSGS_V3', 'SCMS_MEMBER_AI_CHAT_MSGS_V4'].forEach(k => {
        sessionStorage.removeItem(k);
      });

      const saved = sessionStorage.getItem(STORAGE_KEY_MSGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const isCorrupted = parsed.some(m => hasCorruptedEncoding(m.text));
          if (!isCorrupted) return parsed;
        }
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

  // Draggable positions
  const [bubblePos, setBubblePos] = useState(() => {
    try {
      const saved = localStorage.getItem('scms_chat_bubble_pos');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [windowPos, setWindowPos] = useState(() => {
    try {
      const saved = localStorage.getItem('scms_chat_window_pos');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [isBubbleMoving, setIsBubbleMoving] = useState(false);
  const [isWindowMoving, setIsWindowMoving] = useState(false);
  const isDraggingBubbleRef = useRef(false);
  const dragStartBubbleRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0, hasMoved: false });
  const isDraggingWindowRef = useRef(false);
  const dragStartWindowRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0, hasMoved: false });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize bubble position if null
  useEffect(() => {
    if (!bubblePos && typeof window !== 'undefined') {
      const defaultX = Math.max(16, window.innerWidth - 76);
      const defaultY = Math.max(16, window.innerHeight - 86);
      setBubblePos({ x: defaultX, y: defaultY });
    }
  }, []);

  // Clamping positions on window resize
  useEffect(() => {
    const handleResize = () => {
      setBubblePos(prev => {
        if (!prev) return prev;
        const x = Math.min(Math.max(12, prev.x), window.innerWidth - 68);
        const y = Math.min(Math.max(12, prev.y), window.innerHeight - 68);
        return { x, y };
      });
      setWindowPos(prev => {
        if (!prev) return prev;
        const width = Math.min(420, window.innerWidth - 32);
        const height = Math.min(600, window.innerHeight - 80);
        const x = Math.min(Math.max(8, prev.x), window.innerWidth - width - 8);
        const y = Math.min(Math.max(8, prev.y), window.innerHeight - height - 8);
        return { x, y };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drag handler for floating bubble / minimized bar
  const handleBubblePointerDown = (e) => {
    if (e.target.closest('.no-bubble-drag')) return;
    if (e.button !== undefined && e.button !== 0) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX === undefined || clientY === undefined) return;

    const currentX = bubblePos?.x ?? (window.innerWidth - 76);
    const currentY = bubblePos?.y ?? (window.innerHeight - 86);

    dragStartBubbleRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      startX: currentX,
      startY: currentY,
      hasMoved: false
    };
    isDraggingBubbleRef.current = false;

    const onPointerMove = (moveEvent) => {
      const curX = moveEvent.clientX ?? moveEvent.touches?.[0]?.clientX;
      const curY = moveEvent.clientY ?? moveEvent.touches?.[0]?.clientY;
      if (curX === undefined || curY === undefined) return;

      const dx = curX - dragStartBubbleRef.current.mouseX;
      const dy = curY - dragStartBubbleRef.current.mouseY;

      if (!dragStartBubbleRef.current.hasMoved && Math.hypot(dx, dy) > 4) {
        dragStartBubbleRef.current.hasMoved = true;
        isDraggingBubbleRef.current = true;
        setIsBubbleMoving(true);
      }

      if (dragStartBubbleRef.current.hasMoved) {
        if (moveEvent.cancelable) moveEvent.preventDefault();
        const nextX = Math.min(Math.max(12, dragStartBubbleRef.current.startX + dx), window.innerWidth - 68);
        const nextY = Math.min(Math.max(12, dragStartBubbleRef.current.startY + dy), window.innerHeight - 68);
        setBubblePos({ x: nextX, y: nextY });
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      setIsBubbleMoving(false);

      if (dragStartBubbleRef.current.hasMoved) {
        setBubblePos(latest => {
          if (latest) {
            try {
              localStorage.setItem('scms_chat_bubble_pos', JSON.stringify(latest));
            } catch {}
          }
          return latest;
        });
        setTimeout(() => {
          isDraggingBubbleRef.current = false;
        }, 120);
      } else {
        isDraggingBubbleRef.current = false;
      }
    };

    window.addEventListener('mousemove', onPointerMove, { passive: false });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
  };

  // Drag handler for full popup window header
  const handleWindowHeaderPointerDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    if (e.button !== undefined && e.button !== 0) return;

    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX === undefined || clientY === undefined) return;

    const winWidth = Math.min(420, window.innerWidth - 32);
    const winHeight = Math.min(600, window.innerHeight - 80);
    const currentX = windowPos?.x ?? Math.max(12, window.innerWidth - winWidth - 24);
    const currentY = windowPos?.y ?? Math.max(12, window.innerHeight - winHeight - 24);

    dragStartWindowRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      startX: currentX,
      startY: currentY,
      hasMoved: false
    };

    const onPointerMove = (moveEvent) => {
      const curX = moveEvent.clientX ?? moveEvent.touches?.[0]?.clientX;
      const curY = moveEvent.clientY ?? moveEvent.touches?.[0]?.clientY;
      if (curX === undefined || curY === undefined) return;

      const dx = curX - dragStartWindowRef.current.mouseX;
      const dy = curY - dragStartWindowRef.current.mouseY;

      if (!dragStartWindowRef.current.hasMoved && Math.hypot(dx, dy) > 4) {
        dragStartWindowRef.current.hasMoved = true;
        isDraggingWindowRef.current = true;
        setIsWindowMoving(true);
      }

      if (dragStartWindowRef.current.hasMoved) {
        if (moveEvent.cancelable) moveEvent.preventDefault();
        const nextX = Math.min(Math.max(8, dragStartWindowRef.current.startX + dx), window.innerWidth - winWidth - 8);
        const nextY = Math.min(Math.max(8, dragStartWindowRef.current.startY + dy), window.innerHeight - winHeight - 8);
        setWindowPos({ x: nextX, y: nextY });
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      setIsWindowMoving(false);

      if (dragStartWindowRef.current.hasMoved) {
        setWindowPos(latest => {
          if (latest) {
            try {
              localStorage.setItem('scms_chat_window_pos', JSON.stringify(latest));
            } catch {}
          }
          return latest;
        });
        setTimeout(() => {
          isDraggingWindowRef.current = false;
        }, 120);
      } else {
        isDraggingWindowRef.current = false;
      }
    };

    window.addEventListener('mousemove', onPointerMove, { passive: false });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
  };

  const handleResetPosition = (e) => {
    e.stopPropagation();
    try {
      localStorage.removeItem('scms_chat_bubble_pos');
      localStorage.removeItem('scms_chat_window_pos');
    } catch {}
    setBubblePos({ x: Math.max(16, window.innerWidth - 76), y: Math.max(16, window.innerHeight - 86) });
    setWindowPos(null);
  };

  // Proactive cleanup of legacy corrupted storage
  useEffect(() => {
    try {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith('SCMS_MEMBER_AI_CHAT_MSGS') && k !== STORAGE_KEY_MSGS) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => sessionStorage.removeItem(k));
    } catch (e) {
      // ignore
    }
  }, []);

  // Update welcome message if user toggles language before starting conversation
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [getInitialMessage(isEn)];
      }
      return prev;
    });
  }, [isEn]);

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
          time: new Date().toLocaleTimeString(isEn ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      if (isMinimized) {
        setUnreadCount((c) => c + 1);
      }
    } catch (err) {
      const errorText = err.proposedHandling
        ? `${err.message || (isEn ? 'AI Assistant connection error' : 'Lỗi kết nối Trợ lý AI')}\n\n💡 ${isEn ? 'Suggested solution' : 'Hướng dẫn xử lý'}: ${err.proposedHandling}`
        : `${err.message || (isEn ? 'Cannot connect to center AI service. Please try again later.' : 'Lỗi kết nối tới dịch vụ AI của trung tâm. Vui lòng thử lại sau.')}`;

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
      showError(err.message || (isEn ? 'Unable to receive AI response' : 'Không thể nhận phản hồi từ AI'));
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
    showSuccess(isEn ? 'Chat conversation reset!' : 'Đã làm mới cuộc trò chuyện!');
  };

  const copyMessage = (msg) => {
    if (!msg?.text) return;
    navigator.clipboard?.writeText(msg.text);
    setCopiedId(msg.id);
    showSuccess(isEn ? 'Content copied to clipboard!' : 'Đã sao chép nội dung!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSpeak = (msg) => {
    if (!('speechSynthesis' in window)) {
      showError(isEn ? 'Your browser does not support speech synthesis.' : 'Trình duyệt chưa hỗ trợ tính năng phát âm.');
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
    showSuccess(
      type === 'like'
        ? (isEn ? 'Thank you for liking this response!' : 'Cảm ơn bạn đã thích phản hồi này!')
        : (isEn ? 'Thank you for your feedback! SCMS will improve.' : 'Cảm ơn góp ý! SCMS sẽ cải thiện tốt hơn.')
    );
  };

  return (
    <>
      {/* 1. Floating Launch Bubble (When Closed) - Draggable FAB */}
      {!isOpen && (
        <div
          style={
            bubblePos
              ? { left: `${bubblePos.x}px`, top: `${bubblePos.y}px` }
              : { bottom: '24px', right: '24px' }
          }
          onPointerDown={handleBubblePointerDown}
          className={`fixed z-40 touch-none select-none ${
            isBubbleMoving ? 'cursor-grabbing scale-105 transition-none' : 'cursor-grab animate-in fade-in zoom-in-95 duration-200'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              if (isDraggingBubbleRef.current) return;
              setIsOpen(true);
              setIsMinimized(false);
              setUnreadCount(0);
            }}
            aria-label={isEn ? "Open SCMS AI Sports Assistant (Drag to reposition)" : "Mở Trợ lý Thể thao AI SCMS (Kéo để di chuyển)"}
            className={`group relative flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#1E2235] text-white border border-[#81B29A]/60 shadow-xl hover:shadow-2xl hover:border-[#81B29A] hover:scale-105 active:scale-95 transition-all duration-200 font-sans ${
              isBubbleMoving ? 'ring-4 ring-[#81B29A]/50 shadow-2xl' : ''
            }`}
          >
            {/* Outer pulsating glow ring */}
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-[#81B29A] via-[#F2CC8F] to-[#81B29A] opacity-30 blur-sm group-hover:opacity-75 transition duration-300 animate-pulse pointer-events-none" />

            {/* Inner Icon */}
            <div className="relative z-10 w-full h-full rounded-full flex items-center justify-center text-[#81B29A] group-hover:text-[#F2CC8F] transition-colors pointer-events-none">
              <span className="material-symbols-outlined text-[24px] sm:text-[26px] group-hover:rotate-12 transition-transform duration-300">
                smart_toy
              </span>
            </div>

            {/* Drag Grip Indicator Dots on Hover */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#1E2235] px-1.5 py-0.2 rounded-full border border-[#81B29A]/40 text-[9px] text-[#F2CC8F] pointer-events-none z-30">
              <span className="material-symbols-outlined text-[11px]">drag_indicator</span>
            </div>

            {/* Online Green Pulse Indicator */}
            <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-[#81B29A] border-2 border-[#1E2235] shadow-sm flex items-center justify-center z-20 pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </span>

            {/* Unread Message Pill Badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 min-w-[20px] h-5 rounded-full bg-[#E07A5F] text-white text-[10px] font-bold shadow-md flex items-center justify-center animate-bounce z-20 pointer-events-none">
                {unreadCount}
              </span>
            )}

            {/* Sleek Tooltip on hover (appears to the left) */}
            <div className="hidden sm:flex absolute right-full mr-3 items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1E2235]/95 backdrop-blur-md border border-[#81B29A]/40 text-white text-xs font-semibold whitespace-nowrap shadow-xl opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-[#81B29A]">drag_pan</span>
                <span>{isEn ? "SCMS AI Assistant (Drag anywhere)" : "Trợ Lý AI SCMS (Kéo để di chuyển)"}</span>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#F2CC8F] text-[#1E2235] text-[9px] font-black uppercase tracking-wider">
                PRO
              </span>
            </div>
          </button>
        </div>
      )}

      {/* 2. Minimized Bar State */}
      {isOpen && isMinimized && (
        <div
          style={
            bubblePos
              ? { left: `${bubblePos.x}px`, top: `${bubblePos.y}px` }
              : { bottom: '24px', right: '24px' }
          }
          onPointerDown={handleBubblePointerDown}
          className={`fixed z-50 touch-none select-none ${
            isBubbleMoving ? 'cursor-grabbing scale-105 transition-none' : 'cursor-grab animate-in fade-in zoom-in-95 duration-200'
          }`}
        >
          <div className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-[#1E2235] text-white border border-[#81B29A]/50 shadow-2xl font-sans">
            <span className="material-symbols-outlined text-[13px] text-slate-400">drag_indicator</span>
            <button
              type="button"
              onClick={() => {
                if (isDraggingBubbleRef.current) return;
                setIsMinimized(false);
              }}
              className="no-bubble-drag flex items-center gap-2 text-left cursor-pointer hover:opacity-90 transition"
              title={isEn ? "Click to open AI Assistant" : "Nhấn để mở lại Trợ lý AI"}
            >
              <div className="w-7 h-7 rounded-full bg-[#3D405B] flex items-center justify-center text-[#81B29A] shrink-0 border border-[#81B29A]/40">
                <span className="material-symbols-outlined text-[16px]">smart_toy</span>
              </div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                AI SCMS
                <span className="w-1.5 h-1.5 rounded-full bg-[#81B29A] animate-pulse" />
              </span>
            </button>

            <div className="flex items-center gap-0.5 border-l border-slate-700/80 pl-1.5">
              <button
                type="button"
                onClick={() => setIsMinimized(false)}
                title={isEn ? "Expand" : "Mở rộng"}
                className="no-bubble-drag w-7 h-7 rounded-full flex items-center justify-center text-slate-300 hover:text-[#F2CC8F] hover:bg-white/10 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_full</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMinimized(false);
                  setIsOpen(false);
                }}
                title={isEn ? "Close" : "Đóng"}
                className="no-bubble-drag w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-[#E07A5F] hover:bg-white/10 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Full Popup Window */}
      {isOpen && !isMinimized && (
        <div
          style={
            windowPos
              ? { left: `${windowPos.x}px`, top: `${windowPos.y}px` }
              : { bottom: '24px', right: '24px' }
          }
          className={`fixed z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100dvh-5.5rem)] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden font-sans ${
            isWindowMoving ? 'shadow-3xl ring-2 ring-[#81B29A]/50 transition-none' : 'animate-in fade-in slide-in-from-bottom-5 duration-300'
          }`}
        >
          {/* Header Bar - Draggable */}
          <div
            onPointerDown={handleWindowHeaderPointerDown}
            className={`relative px-4 py-3.5 bg-[#1E2235] text-white flex items-center justify-between border-b border-slate-800 shrink-0 select-none ${
              isWindowMoving ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            title={isEn ? "Drag header to move chat window" : "Kéo thanh tiêu đề để di chuyển cửa sổ chat"}
          >
            {/* Ambient Glow */}
            <div className="absolute top-0 right-1/4 w-32 h-16 bg-[#81B29A]/15 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center gap-2.5 pointer-events-none">
              <span className="material-symbols-outlined text-[16px] text-slate-400 hover:text-white transition" title={isEn ? "Drag handle" : "Tay cầm kéo thả"}>
                drag_indicator
              </span>

              <div className="relative">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#81B29A] to-[#F2CC8F] p-0.5 shadow-md flex items-center justify-center">
                  <div className="w-full h-full rounded-[14px] bg-[#1E2235] flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-[18px] text-[#81B29A]">smart_toy</span>
                  </div>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#81B29A] border-2 border-[#1E2235] shadow" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-bold tracking-tight text-white font-sans">
                    {isEn ? 'SCMS AI Sports Assistant' : 'Trợ Lý Thể Thao SCMS AI'}
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-full bg-[#F2CC8F] text-[#1E2235] text-[9px] font-black uppercase tracking-wider">
                    PRO
                  </span>
                </div>
                <p className="text-[10px] text-[#A8DADC] font-medium flex items-center gap-1">
                  <span>{isEn ? 'Olympic Standard · 24/7' : 'Chuẩn Olympic · 24/7'}</span>
                  <span>•</span>
                  <span className="text-[#F2CC8F]/80">{isEn ? 'Drag to move' : 'Kéo để di chuyển'}</span>
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="relative z-10 flex items-center gap-1">
              {/* Reset Position Button */}
              {(windowPos || bubblePos) && (
                <button
                  type="button"
                  onClick={handleResetPosition}
                  title={isEn ? "Snap back to corner position" : "Đưa về góc dưới phải mặc định"}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#81B29A] hover:bg-white/10 transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleResetChat}
                title={isEn ? "Reset conversation" : "Làm mới cuộc trò chuyện"}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#F2CC8F] hover:bg-white/10 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">restart_alt</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                title={isEn ? "Minimize" : "Thu nhỏ xuống góc màn hình"}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title={isEn ? "Close window" : "Đóng cửa sổ"}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#E07A5F] hover:bg-white/10 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {/* Messages Stream Container */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-4 bg-[#FAF8F5]/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-7 h-7 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-[#1E2235] text-[#F2CC8F] border border-[#3D405B]'
                      : 'bg-[#1E2235] text-[#81B29A] border border-[#3D405B]'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <span className="material-symbols-outlined text-[15px]">person</span>
                  ) : (
                    <span className="material-symbols-outlined text-[15px] text-[#81B29A]">smart_toy</span>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-xs transition-all font-sans ${
                    msg.sender === 'user'
                      ? 'bg-[#1E2235] text-[#FAF8F5] rounded-tr-none border border-[#3D405B]'
                      : msg.isError
                      ? 'bg-rose-50 text-rose-950 border border-rose-200 rounded-tl-none'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                  }`}
                >
                  {/* Error Tag */}
                  {msg.isError && msg.code && (
                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-200 text-rose-900 mb-1.5 border border-rose-300">
                      {isEn ? 'CODE' : 'MÃ'}: {msg.code}
                    </span>
                  )}

                  {/* Formatted Text Content */}
                  <div className="leading-relaxed font-sans">
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
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition inline-flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">refresh</span>
                        <span>{isEn ? 'Retry this question' : 'Thử lại câu hỏi này'}</span>
                      </button>
                    </div>
                  )}

                  {/* Bottom Message Toolbar */}
                  <div
                    className={`flex items-center justify-between gap-2 pt-2 mt-2 border-t text-[10px] font-mono ${
                      msg.sender === 'user'
                        ? 'border-white/20 text-[#A8DADC]'
                        : 'border-slate-100 text-slate-400'
                    }`}
                  >
                    <span>{msg.time}</span>

                    {msg.sender === 'ai' && !msg.isError && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => copyMessage(msg)}
                          title={isEn ? "Copy content" : "Sao chép nội dung"}
                          className="p-1 hover:text-[#2D6A4F] rounded hover:bg-slate-100 transition cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {copiedId === msg.id ? 'check' : 'content_copy'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleSpeak(msg)}
                          title={speakingId === msg.id ? (isEn ? 'Stop reading' : 'Dừng đọc') : (isEn ? 'Read response' : 'Đọc câu trả lời')}
                          className={`p-1 rounded transition cursor-pointer ${
                            speakingId === msg.id
                              ? 'text-[#81B29A] bg-[#81B29A]/15'
                              : 'hover:text-[#2D6A4F] hover:bg-slate-100 text-slate-500'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {speakingId === msg.id ? 'stop_circle' : 'volume_up'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReaction(msg.id, 'like')}
                          title={isEn ? "Helpful" : "Hữu ích"}
                          className={`p-1 rounded transition cursor-pointer ${
                            reactions[msg.id] === 'like'
                              ? 'text-emerald-600 bg-emerald-50'
                              : 'hover:text-slate-800 hover:bg-slate-100 text-slate-400'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">thumb_up</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReaction(msg.id, 'dislike')}
                          title={isEn ? "Not satisfied" : "Chưa hài lòng"}
                          className={`p-1 rounded transition cursor-pointer ${
                            reactions[msg.id] === 'dislike'
                              ? 'text-rose-600 bg-rose-50'
                              : 'hover:text-slate-800 hover:bg-slate-100 text-slate-400'
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
                <div className="w-7 h-7 rounded-xl bg-[#1E2235] text-[#81B29A] flex items-center justify-center border border-[#3D405B] shadow-xs">
                  <span className="material-symbols-outlined text-[15px] text-[#81B29A]">smart_toy</span>
                </div>
                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200/90 shadow-xs flex items-center gap-2.5 text-xs text-slate-600 font-sans">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#81B29A] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#81B29A] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#81B29A] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">
                    {isEn ? 'AI Assistant is thinking...' : 'Trợ lý AI đang soạn câu trả lời...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Form */}
          <div className="p-3 bg-white border-t border-slate-200/90 shrink-0 space-y-1.5">
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
                  placeholder={isEn ? 'Ask a question... (e.g. What classes are open today?)' : 'Nhập câu hỏi... (VD: Hôm nay có lớp gì?)'}
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  disabled={isAsking}
                  className="w-full pl-3.5 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#81B29A]/30 focus:border-[#81B29A] transition shadow-inner font-sans text-slate-800"
                />
                {inputQuestion && (
                  <button
                    type="button"
                    onClick={() => setInputQuestion('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">close</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isAsking || !inputQuestion.trim()}
                className="px-5 py-2.5 bg-[#1E2235] hover:bg-[#2B2D42] text-[#F2CC8F] hover:text-white disabled:opacity-40 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer font-sans"
              >
                <span>{isEn ? 'Send' : 'Gửi'}</span>
                <span className="material-symbols-outlined text-[15px]">send</span>
              </button>
            </form>

            <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1 font-sans">
              <span className="material-symbols-outlined text-[12px] text-[#F2CC8F]">info</span>
              <span>
                {isEn
                  ? 'Workout & nutrition tips should be verified by a coach before training.'
                  : 'Gợi ý bài tập & dinh dưỡng cần HLV thẩm định trước khi tập.'}
              </span>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
