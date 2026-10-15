import { memberApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { formatMeasurement, formatMemberDate, getLatestProgress } from './memberOverview.js';

const { useState, useEffect } = React;

export function MyProgress() {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;
      try {
        const [progressData, planData] = await Promise.all([
          memberApi.getMyProgress(),
          memberApi.getMyPlans()
        ]);
        setRecords(Array.isArray(progressData) ? progressData : []);
        setPlans(Array.isArray(planData) ? planData : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser]);

  if (loading) return <LoadingSpinner text="Đang tải dữ liệu tiến độ cá nhân..." />;
  if (error) return <div role="alert" className="p-4 bg-red-50 text-red-700 rounded-xl">{error}</div>;

  const latestRecord = getLatestProgress(records);

  const isPending = records.length === 0 && plans.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
          VIEW PERSONAL PROGRESS & FEEDBACK
        </span>
        <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
          Hồ Sơ Rèn Luyện & Tiến Độ Thể Lực
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Theo dõi các chỉ số sinh trắc học InBody, kết quả hoàn thành bài tập và lời khuyên từ Huấn luyện viên trưởng.
        </p>
      </div>

      {/* Empty State Banner when no data yet */}
      {isPending && (
        <div className="p-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center space-y-3">
          <span className="material-symbols-outlined text-5xl text-slate-300">fitness_center</span>
          <h3 className="font-chivo text-base font-bold text-slate-700">Chưa có dữ liệu tiến độ</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-6">
            Huấn luyện viên sẽ ghi nhận chỉ số thể lực, kết quả tập luyện và kế hoạch cá nhân sau mỗi buổi học.
            Dữ liệu sẽ hiển thị tại đây sau khi HLV cập nhật.
          </p>
        </div>
      )}
      {latestRecord && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cân Nặng Hiện Tại</span>
              <div className="font-chivo text-3xl font-black text-slate-900 mt-1">{formatMeasurement(latestRecord.weight, 'kg')}</div>
              <span className="text-[11px] text-slate-500">Ghi nhận ngày {formatMemberDate(latestRecord.date)}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">monitor_weight</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tỷ Lệ Mỡ Cơ Thể</span>
              <div className="font-chivo text-3xl font-black text-red-600 mt-1">{formatMeasurement(latestRecord.bodyFat, '%')}</div>
              <span className="text-[11px] text-slate-500">Theo đánh giá của HLV</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">vital_signs</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Khối Lượng Cơ Bắp</span>
              <div className="font-chivo text-3xl font-black text-emerald-600 mt-1">{formatMeasurement(latestRecord.muscleMass, 'kg')}</div>
              <span className="text-[11px] text-slate-500">Theo đánh giá của HLV</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">fitness_center</span>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Training Plans from Coach */}
      {plans.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-chivo text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600">fitness_center</span>
              Giáo Án Huấn Luyện Được Chỉ Định
            </h2>
            <span className="text-xs text-slate-500">{plans.length} giáo án</span>
          </div>

          <div className="space-y-4">
            {plans.map(p => (
              <div key={p.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-chivo text-base font-bold text-slate-900">{p.title}</h3>
                  <span className="text-xs text-slate-500 font-semibold">HLV phụ trách: {p.coachName}</span>
                </div>
                <p className="text-xs text-slate-600 italic">Mục tiêu: "{p.goal}"</p>
                <p className="text-xs text-slate-500">Lớp: {p.className || 'Chưa có thông tin'} · Từ {formatMemberDate(p.startDate)}{p.endDate && ` đến ${formatMemberDate(p.endDate)}`}</p>

                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Chi tiết bài rèn luyện:
                  </span>
                  {p.exercises?.map((ex, i) => (
                    <div key={i} className="flex justify-between items-center text-xs p-2 rounded bg-white border border-slate-100">
                      <div>
                        <strong className="text-slate-900">{i + 1}. {ex.name}</strong>
                        <span className="text-slate-400 ml-2">({ex.note})</span>
                      </div>
                      <span className="font-chivo font-black text-red-600">{ex.sets} x {ex.reps}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Timeline & Coach Feedback */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="font-chivo text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <span className="material-symbols-outlined text-red-600">history_edu</span>
          Lịch Sử Đánh Giá & Nhận Xét Của HLV ({records.length})
        </h2>

        <div className="space-y-4">
          {records.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Chưa có bản ghi nào.</p>
          ) : (
            records.map(rec => (
              <div key={rec.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pb-2 border-b border-slate-200">
                  <span className="font-chivo font-bold text-slate-900">Buổi kiểm tra ngày {rec.date}</span>
                  <span className="text-slate-500">Người đánh giá: <strong>{rec.coachName}</strong></span>
                </div>

                <div className="text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold block text-slate-900 mb-0.5">Kết quả bài tập:</span>
                  <p>{rec.workoutResult}</p>
                </div>

                {rec.coachFeedback && (
                  <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100 text-xs">
                    <span className="font-bold text-blue-900 block mb-0.5">Dặn dò của Huấn luyện viên:</span>
                    <p className="text-blue-800 italic">"{rec.coachFeedback}"</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
