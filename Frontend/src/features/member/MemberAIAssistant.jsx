import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { aiApi } from '../../services/api.js';

const { useState, useRef, useEffect } = React;

export function MemberAIAssistant() {
  const { currentUser } = useAuth();
  const { showSuccess } = useToast();

  const getInitialMessage = () => ({
    id: 'welcome',
    sender: 'ai',
    text: `Xin chào ${currentUser?.fullName || 'bạn'}! Bạn muốn hỏi về lịch tập, bài tập, gói thành viên hay dịch vụ của trung tâm?`,
    time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  });

  const [messages, setMessages] = useState([getInitialMessage()]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAsking]);

  const handleSend = async (questionToSend) => {
    const text = (questionToSend || inputQuestion).trim();
    if (!text || isAsking) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuestion('');
    setIsAsking(true);

    try {
      const result = await aiApi.chat(text, conversationId);
      const reply = result.reply;
      setConversationId(result.conversationId);

      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: `[Lỗi API]: ${err.message}`,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleResetChat = () => {
    if (isAsking) return;
    setConversationId(null);
    setMessages([getInitialMessage()]);
    setInputQuestion('');
    setIsAsking(false);
    showSuccess('Đã làm mới cuộc trò chuyện!');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-700 to-slate-900 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="font-chivo text-xs uppercase tracking-widest text-red-200 font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            SCMS AI FITNESS ASSISTANT
          </span>
          <h1 className="font-chivo text-2xl font-black mt-1">
            Trợ Lý AI Hội Viên
          </h1>
          <p className="text-xs text-red-100 max-w-xl mt-1">
            Hỏi về lịch tập, bài tập và dịch vụ trung tâm. Kiểm tra lịch cá nhân để xác nhận giờ học; gợi ý bài tập cần được HLV xem xét trước khi áp dụng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetChat}
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 border border-white/20 transition-all text-white shadow-sm"
            title="Làm mới cuộc trò chuyện"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            <span>Làm mới hội thoại</span>
          </button>
          <div className="px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold flex items-center gap-2 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sẵn sàng kết nối</span>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[520px] overflow-hidden">
        {/* Messages Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-bold text-xs shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-900 text-white'
                }`}
              >
                {msg.sender === 'user' ? (
                  <span className="material-symbols-outlined text-[18px]">person</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px] text-red-400">smart_toy</span>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-red-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none whitespace-pre-line'
                }`}
              >
                <div className="font-medium">{msg.text}</div>
                <div
                  className={`text-[10px] mt-2 font-mono ${
                    msg.sender === 'user' ? 'text-red-200 text-right' : 'text-slate-400'
                  }`}
                >
                  {msg.time}
                </div>
              </div>
            </div>
          ))}

          {isAsking && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-red-400">smart_toy</span>
              </div>
              <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex items-center gap-2 text-xs text-slate-500">
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                <span>Đang xử lý phản hồi...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            aria-label="Câu hỏi cho trợ lý AI"
            placeholder="Hỏi về lịch tập, bài tập hoặc dịch vụ trung tâm..."
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={isAsking}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-slate-50"
          />
          <button
            type="submit"
            disabled={isAsking || !inputQuestion.trim()}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-xl font-chivo font-bold text-xs uppercase tracking-wider transition-colors shadow flex items-center gap-1.5 shrink-0"
          >
            <span>Gửi</span>
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
