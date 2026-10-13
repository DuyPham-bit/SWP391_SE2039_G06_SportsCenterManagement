import { receptionApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/StatCard.js';

const { useState, useEffect } = React;

export function MemberCheckIn() {
  const { showSuccess, showError } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [members, setMembers] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [lastCheckIn, setLastCheckIn] = useState(null);
  const [checkInError, setCheckInError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const loadData = async () => {
    try {
      const history = await receptionApi.getCheckInHistory();
      setCheckIns(history || []);
    } catch {
      // Bỏ qua lỗi kết nối ban đầu
    }
  };

  useEffect(() => {
    loadData();
    const hash = window.location.hash || '';
    const match = hash.match(/[?&]query=([^&]+)/);
    if (match && match[1]) {
      setIdentifier(decodeURIComponent(match[1]));
    }
  }, []);

  const handleExecuteCheckIn = async (memberToScan) => {
    const term = (memberToScan?.memberCode || memberToScan?.id || identifier || '').toString().trim();

    if (!term) {
      setCheckInError('Vui lòng quét thẻ hoặc nhập mã hội viên / Số điện thoại / Email.');
      setLastCheckIn(null);
      return;
    }

    setProcessing(true);
    setCheckInError(null);
    try {
      const result = await receptionApi.checkInMember(term);
      setLastCheckIn(result);
      showSuccess(`Check-in thành công: ${result.memberName} (${result.memberCode})`);
      setIdentifier('');
      await loadData();
    } catch (err) {
      setCheckInError(err.message);
      setLastCheckIn(null);
      showError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
          CHECK-IN MEMBER
        </span>
        <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
          Cổng Quét Thẻ & Check-in Hội Viên
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Quét thẻ RFID hoặc nhập mã hội viên để đối soát gói tập và tự động lưu vết vào sân.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Scanner Terminal (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-chivo text-xs font-black uppercase text-slate-900 tracking-wider">
                ĐẦU ĐỌC THẺ THỜI GIAN THỰC (CỔNG SỐ 01)
              </span>
            </div>
            <Badge variant="success" size="sm">HỆ THỐNG TRỰC TUYẾN</Badge>
          </div>

          {/* Scanner Input Box */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleExecuteCheckIn(); }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Mã thẻ hội viên / Số điện thoại / Email *
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400">
                    barcode_scanner
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Quét mã thẻ (ví dụ: MEM-8899)..."
                    value={identifier}
                    onChange={e => { setIdentifier(e.target.value); setCheckInError(null); }}
                    className="w-full pl-11 pr-4 py-2.5 text-base font-chivo font-bold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-colors shrink-0"
                >
                  {processing ? 'Đang kiểm tra...' : 'XÁC THỰC'}
                </button>
              </div>
            </div>
          </form>

          {/* Result Alert: Success Feedback */}
          {lastCheckIn && (
            <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[28px]">check_circle</span>
                </div>
                <div>
                  <span className="font-chivo text-[11px] font-black uppercase tracking-widest text-emerald-700">
                    CỬA TỰ ĐỘNG ĐÃ MỞ (GATE UNLOCKED)
                  </span>
                  <h3 className="font-chivo text-xl font-black text-emerald-900 leading-tight">
                    {lastCheckIn.memberName}
                  </h3>
                  <p className="text-xs text-emerald-800 font-medium">Mã thẻ: <strong>{lastCheckIn.memberCode}</strong></p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/80 border border-emerald-200 text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-emerald-700 block text-[10px] uppercase font-bold">Gói tập</span>
                  <span className="font-bold text-slate-900">{lastCheckIn.packageName}</span>
                </div>
                <div>
                  <span className="text-emerald-700 block text-[10px] uppercase font-bold">Thời gian vào</span>
                  <span className="font-bold text-slate-900">{lastCheckIn.checkInTime}</span>
                </div>
              </div>
            </div>
          )}

          {/* Result Alert: Error / Expired Feedback */}
          {checkInError && (
            <div className="p-6 rounded-2xl bg-red-50 border-2 border-red-500 text-red-950 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[28px]">block</span>
                </div>
                <div>
                  <span className="font-chivo text-[11px] font-black uppercase tracking-widest text-red-700">
                    CẢNH BÁO TỪ CHỐI CHECK-IN (GATE LOCKED)
                  </span>
                  <h3 className="font-chivo text-base font-black text-red-900">
                    Gói tập không hợp lệ hoặc tài khoản bị khóa!
                  </h3>
                </div>
              </div>
              <p className="text-xs text-red-800 pl-15 leading-relaxed font-semibold">
                {checkInError}
              </p>
              <div className="pt-2 pl-15">
                <a
                  href="#/receptionist/counter-register"
                  className="inline-flex items-center gap-1 text-xs font-bold text-red-700 hover:text-red-900 underline"
                >
                  <span className="material-symbols-outlined text-[16px]">point_of_sale</span>
                  <span>Chuyển sang màn hình gia hạn gói tập tại quầy</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Today's Check-in Log (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-chivo text-sm font-bold text-slate-900 uppercase tracking-wide">
              Nhật Ký Quét Thẻ Hôm Nay ({checkIns.length})
            </h2>
            <span className="text-xs font-semibold text-emerald-600">Trực tiếp</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1 space-y-2">
            {checkIns.map(item => (
              <div key={item.id} className="pt-2.5 pb-1 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{item.memberName}</div>
                    <div className="text-[11px] text-slate-500">{item.memberCode} • {item.packageName}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-semibold text-slate-700 block">{item.checkInTime.split(' ')[1] || item.checkInTime}</span>
                  <span className="text-[10px] text-slate-400">Lễ tân: {item.receptionistName?.split(' ')[0]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
