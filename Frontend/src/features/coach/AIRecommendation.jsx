import React, { useState, useEffect, useMemo } from 'react';
import { coachApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { CoachError, coachInput } from './CoachShared.jsx';
import { coachDate } from './coachOverview.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

const MUTUALLY_EXCLUSIVE_TAGS = Object.freeze({
  skinny_gain: ['fit_meso', 'overweight_endo'],
  fit_meso: ['skinny_gain', 'overweight_endo'],
  overweight_endo: ['skinny_gain', 'fit_meso'],
  low_stamina: ['high_endurance'],
  high_endurance: ['low_stamina'],
});

const BODY_COMPOSITION_TAGS = new Set(['skinny_gain', 'fit_meso', 'overweight_endo']);

function isBodyTagCompatible(tagId, bmiValue) {
  if (!BODY_COMPOSITION_TAGS.has(tagId) || !Number.isFinite(bmiValue) || bmiValue <= 0) return true;
  if (bmiValue < 18.5) return tagId === 'skinny_gain';
  if (bmiValue > 25) return tagId === 'overweight_endo';
  return tagId === 'fit_meso';
}

export function AIRecommendation() {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const { showSuccess } = useToast();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [context, setContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState('');
  const [version, setVersion] = useState(0);

  // Form states
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  // Danh mục thể trạng chuẩn hóa từ thể thao & y học vận động
  const CONDITION_GROUPS = useMemo(() => [
    {
      groupTitle: isEn ? 'Body Composition & Somatotype' : 'Thể trạng & Tạng người',
      icon: 'accessibility_new',
      items: [
        { id: 'skinny_gain', label: isEn ? 'Underweight / Hard gainer (Ectomorph)' : 'Gầy / Khó tăng cân (Ectomorph)', text: isEn ? 'Underweight/Ectomorph, high metabolism, needs caloric surplus & limited cardio' : 'Thể trạng gầy/thiếu cân, chuyển hóa nhanh, cần thặng dư calo 400-500 kcal, hạn chế cardio' },
        { id: 'fit_meso', label: isEn ? 'Athletic / Well-proportioned (Mesomorph)' : 'Cân đối / Cơ địa thể thao (Mesomorph)', text: isEn ? 'Athletic build, good muscle response, ready for progressive overload' : 'Tạng người cân đối, khả năng thích ứng cơ bắp tốt, sẵn sàng tăng tải tịnh tiến' },
        { id: 'overweight_endo', label: isEn ? 'Overweight / Easy fat gain (Endomorph)' : 'Thừa cân / Dễ tích mỡ (Endomorph)', text: isEn ? 'Endomorph, prone to fat storage, prioritize metabolic density & caloric deficit' : 'Cơ địa dễ tích mỡ, cần tối ưu tiêu hao calo và cường độ chuyển hóa' },
        { id: 'low_stamina', label: isEn ? 'Low stamina / Beginners' : 'Thể lực yếu / Nhanh hụt hơi', text: isEn ? 'Low base stamina, needs longer rest periods and moderate pacing' : 'Thể lực nền tảng yếu, cần thời gian nghỉ dài hơn giữa các hiệp và nhịp độ vừa phải' },
        { id: 'high_endurance', label: isEn ? 'Good cardiovascular stamina' : 'Sức bền tim mạch tốt', text: isEn ? 'Strong cardiovascular base, can sustain high volume density' : 'Sức bền tốt, chịu được mật độ vận động và thể tích bài tập cao' },
      ]
    },
    {
      groupTitle: isEn ? 'Joint & Injury Cautions' : 'Chấn thương & Lưu ý cơ xương khớp',
      icon: 'medical_services',
      items: [
        { id: 'back_pain', label: isEn ? 'Lower back pain / Herniated disc' : 'Đau lưng dưới / Thoát vị đĩa đệm', text: isEn ? 'Lower back pain/herniated disc caution (AVOID spinal axial loading: No heavy back squat, no heavy deadlift; use chest-supported rows & box goblet squats)' : 'Đau thắt lưng/thoát vị (CẤM nén ép cột sống: Tránh Heavy Back Squat, Deadlift; ưu tiên bài tập có đệm nâng đỡ)' },
        { id: 'knee_pain', label: isEn ? 'Weak knees / Joint pain' : 'Khớp gối yếu / Đau sụn gối', text: isEn ? 'Weak knee joints (AVOID deep squats and high-impact plyometrics; prioritize hip thrusts & seated leg curls)' : 'Khớp gối yếu (Tránh Squat quá sâu, tránh bật nhảy va đập cao; ưu tiên Hip Thrust, RDL nhẹ)' },
        { id: 'shoulder_pain', label: isEn ? 'Shoulder impingement / Rotator cuff' : 'Khớp vai yếu / Đau chóp xoay', text: isEn ? 'Shoulder impingement (AVOID heavy overhead presses and extreme flaring; prioritize neutral-grip and incline dumbell press)' : 'Khớp vai yếu (Tránh đẩy tạ qua đầu Heavy Overhead Press, tránh dang tay quá rộng)' },
        { id: 'wrist_pain', label: isEn ? 'Weak wrists / Carpal tunnel' : 'Cổ tay yếu / Đau cổ tay', text: isEn ? 'Weak wrists (Use neutral dumbbell grip, avoid hyperextending wrist joints)' : 'Cổ tay yếu (Ưu tiên cầm tạ đơn tư thế trung tính Neutral Grip, tránh bẻ gập cổ tay)' },
        { id: 'hypertension', label: isEn ? 'Hypertension / Heart caution' : 'Huyết áp cao / Tim mạch', text: isEn ? 'Hypertension caution (Avoid Valsalva breath holding; keep controlled breathing, HR under 75% max)' : 'Huyết áp cao (Tránh nín thở gồng bụng Valsalva, duy trì nhịp thở điều hòa)' },
        { id: 'kyphosis_posture', label: isEn ? 'Forward shoulders / Kyphosis' : 'Gù lưng / Sai lệch tư thế', text: isEn ? 'Rounded shoulders/kyphosis (Focus on thoracic extension, face pulls, and chest stretching)' : 'Sai lệch tư thế vai gù (Tăng bài kéo cơ lưng trên Face Pulls/Y-T-W, giãn mở cơ ngực)' },
      ]
    },
    {
      groupTitle: isEn ? 'Training Specifics & Preferences' : 'Định hướng giáo án chuyên sâu',
      icon: 'fitness_center',
      items: [
        { id: 'mass_focus', label: isEn ? 'Max Lean Mass Focus' : 'Tập trung tăng khối lượng cơ nạc', text: isEn ? 'Focus on compound lifts, 2-3m rest, hypertrophy range' : 'Mục tiêu tăng khối lượng nạc, thặng dư 400-500 kcal, tập trung bài đa khớp Compound' },
        { id: 'machine_focus', label: isEn ? 'Machines & Resistance Bands' : 'Ưu tiên máy khối & Dây kháng lực', text: isEn ? 'Prioritize guided machines & bands for joint safety and controlled bar paths' : 'Ưu tiên tập với máy tập chuyên dụng và dây kháng lực để kiểm soát quỹ đạo an toàn' },
        { id: 'core_focus', label: isEn ? 'Core Stability & Pelvic Alignment' : 'Tập trung Core & Cơ lõi', text: isEn ? 'Emphasize deep core stability and pelvic control' : 'Tăng cường các bài kích hoạt cơ lõi Core và cơ mông ổn định xương chậu' },
        { id: 'low_impact', label: isEn ? 'Low-Impact Movement' : 'Vận động va đập thấp (Low-impact)', text: isEn ? 'Low-impact, smooth concentric/eccentric tempo' : 'Ưu tiên bài tập êm ái, chuyển động mượt mà không sốc lực' },
      ]
    }
  ], [isEn]);

  // Các mục tiêu tập luyện chuẩn hóa
  const GOAL_PRESETS = useMemo(() => [
    { id: 'mass_gain', label: isEn ? 'Weight Gain (For Skinny/Ectomorph)' : 'Tăng cân & Cải thiện thể trạng gầy', value: isEn ? 'Weight Gain & Muscle Mass' : 'Tăng cân & Xây dựng khối lượng cơ bắp' },
    { id: 'hypertrophy', label: isEn ? 'Muscle Hypertrophy & Strength' : 'Tăng cơ & Phát triển sức mạnh', value: isEn ? 'Hypertrophy & Progressive Strength' : 'Tăng trưởng cơ bắp & Sức mạnh tịnh tiến' },
    { id: 'fat_loss', label: isEn ? 'Fat Loss & Body Toning' : 'Giảm mỡ & Săn chắc vóc dáng', value: isEn ? 'Fat Loss & Lean Muscle Toning' : 'Giảm mỡ & Săn chắc cơ thể' },
    { id: 'rehab', label: isEn ? 'Rehab & Joint Mobility' : 'Phục hồi chức năng & Vận động khớp', value: isEn ? 'Rehabilitation & Mobility Alignment' : 'Phục hồi chức năng & Cải thiện biên độ khớp' },
    { id: 'endurance', label: isEn ? 'Cardio & Stamina' : 'Sức bền & Thể lực tổng quát', value: isEn ? 'Cardiovascular Health & Stamina' : 'Sức bền tim mạch & Thể lực tổng quát' },
  ], [isEn]);

  // Các trình độ chuẩn hóa
  const LEVEL_PRESETS = useMemo(() => [
    { id: 'Beginner', label: isEn ? 'Beginner (0-6 months)' : 'Beginner (Mới bắt đầu · 0-6 tháng)', value: 'Beginner' },
    { id: 'Intermediate', label: isEn ? 'Intermediate (6m-2y)' : 'Intermediate (Trung cấp · 6 tháng - 2 năm)', value: 'Intermediate' },
    { id: 'Advanced', label: isEn ? 'Advanced (2+ years)' : 'Advanced (Nâng cao · Trên 2 năm)', value: 'Advanced' },
    { id: 'Athlete', label: isEn ? 'Athlete (Specialized)' : 'Athlete (Vận động viên chuyên sâu)', value: 'Athlete' },
  ], [isEn]);

  const load = async () => {
    setLoading(true); setLoadError('');
    try { setClasses(await coachApi.getCoachClassesAndMembers()); }
    catch (e) { setLoadError(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  const selectedClass = classes.find(c => c.id === Number(classId)) || classes[0];
  const member = selectedClass?.members?.find(m => m.id === Number(memberId)) || selectedClass?.members?.[0];

  useEffect(() => {
    let active = true;
    setContext(null); setContextError(''); setGoal(''); setLevel(''); setNotes(''); setSelectedTagIds([]); setResult(null); setError(''); setNotice(null);
    if (!selectedClass || !member) { setContextLoading(false); return; }
    setContextLoading(true);
    coachApi.getAIContext(selectedClass.id, member.id).then(data => {
      if (!active) return;
      setContext(data);
      setGoal(data.fitnessGoal || '');
      setLevel(data.fitnessLevel || 'Intermediate');
      setNotes(data.medicalNote || '');
    }).catch(e => { if (active) setContextError(e); }).finally(() => { if (active) setContextLoading(false); });
    return () => { active = false; };
  }, [selectedClass?.id, member?.id, version]);

  useEffect(() => { setResult(null); setError(''); setNotice(null); }, [goal, level, notes]);

  // Toggle tag thể trạng (Tự động loại trừ các thẻ đối lập mâu thuẫn)
  const handleToggleTag = (tag) => {
    if (!isBodyTagCompatible(tag.id, Number(context?.bmi))) return;
    const isSelected = selectedTagIds.includes(tag.id);
    let nextIds;
    if (isSelected) {
      nextIds = selectedTagIds.filter(id => id !== tag.id);
    } else {
      const exclusions = MUTUALLY_EXCLUSIVE_TAGS[tag.id] || [];
      // Tự động loại bỏ thẻ đối lập khi chọn thẻ mới
      nextIds = [...selectedTagIds.filter(id => !exclusions.includes(id)), tag.id];
    }
    setSelectedTagIds(nextIds);

    // Tìm tất cả các tag đang chọn để cập nhật nội dung vào notes
    const allItems = CONDITION_GROUPS.flatMap(g => g.items);
    const selectedTexts = nextIds.map(id => allItems.find(x => x.id === id)?.text).filter(Boolean);

    // Giữ lại ghi chú thủ công ban đầu nếu có (loại trừ dòng do tag cũ sinh ra)
    const manualNotes = notes
      .split('\n')
      .filter(line => !allItems.some(item => line.includes(item.text)))
      .join('\n')
      .trim();

    const combined = [...(manualNotes ? [manualNotes] : []), ...selectedTexts].join('\n• ');
    setNotes(combined ? (combined.startsWith('• ') ? combined : '• ' + combined) : '');
  };

  // Nạp thông minh thể trạng học viên từ API vào biểu mẫu
  const handleAutoFillPhysicalContext = () => {
    if (!context) return;
    const bmiVal = Number(context.bmi) || 0;
    const tagsToSelect = [];

    // Phân tích thể trạng theo BMI
    if (bmiVal && bmiVal < 18.5) {
      tagsToSelect.push('skinny_gain');
      if (bmiVal < 16.0) {
        tagsToSelect.push('low_stamina');
        tagsToSelect.push('machine_focus');
      }
      setGoal(isEn ? 'Weight Gain & Muscle Mass' : 'Tăng cân & Xây dựng khối lượng cơ bắp');
    } else if (bmiVal && bmiVal >= 25.0) {
      tagsToSelect.push('overweight_endo');
      setGoal(isEn ? 'Fat Loss & Lean Muscle Toning' : 'Giảm mỡ & Săn chắc cơ thể');
    } else {
      tagsToSelect.push('fit_meso');
      if (!goal) setGoal(context.fitnessGoal || (isEn ? 'Hypertrophy & Progressive Strength' : 'Tăng trưởng cơ bắp & Sức mạnh tịnh tiến'));
    }

    // Phân tích bệnh lý y tế nếu có
    const medNote = (context.medicalNote || '').toLowerCase();
    if (medNote.includes('lưng') || medNote.includes('cột sống') || medNote.includes('thoát vị')) {
      tagsToSelect.push('back_pain');
    }
    if (medNote.includes('gối') || medNote.includes('khớp gối')) {
      tagsToSelect.push('knee_pain');
    }
    if (medNote.includes('vai') || medNote.includes('chóp xoay')) {
      tagsToSelect.push('shoulder_pain');
    }
    if (medNote.includes('cổ tay')) {
      tagsToSelect.push('wrist_pain');
    }
    if (medNote.includes('gù') || medNote.includes('tư thế')) {
      tagsToSelect.push('kyphosis_posture');
    }
    if (medNote.includes('huyết áp') || medNote.includes('tim')) {
      tagsToSelect.push('hypertension');
    }

    setSelectedTagIds(tagsToSelect);
    const allItems = CONDITION_GROUPS.flatMap(g => g.items);
    const selectedTexts = tagsToSelect.map(id => allItems.find(x => x.id === id)?.text).filter(Boolean);
    const baseNote = context.medicalNote ? `[Hồ sơ y tế]: ${context.medicalNote}` : '';
    const combined = [...(baseNote ? [baseNote] : []), ...selectedTexts].join('\n• ');
    setNotes(combined ? (combined.startsWith('• ') ? combined : '• ' + combined) : '');

    if (context.fitnessLevel) {
      setLevel(context.fitnessLevel);
    }

    showSuccess(isEn ? 'Member physical context synced to form!' : 'Đã nạp ngữ cảnh thể trạng học viên vào biểu mẫu!');
  };

  // Chỉ nhận giáo án đã qua kiểm tra cấu trúc và chính sách an toàn ở backend.
  const generate = async e => {
    e.preventDefault();
    if (!context || !member || busy) return;
    setBusy(true); setResult(null); setError(''); setNotice(null);
    try {
      const parsed = await coachApi.getAIRecommendation({
        classId: selectedClass.id,
        memberId: member.id,
        fitnessGoal: goal.trim(),
        currentLevel: level.trim(),
        notes: notes.trim(),
        subjectiveTags: selectedTagIds
      });
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.exercises)) {
        throw new Error(isEn ? 'AI returned invalid workout structure.' : 'Dữ liệu AI trả về không đúng cấu trúc danh sách bài tập.');
      }
      setResult(parsed);
      setNotice(null);
    } catch (err) {
      setResult(null);
      setNotice(null);
      setError(err);
    }
    finally { setBusy(false); }
  };

  const updateResultField = (field, value) => {
    setResult(current => current ? { ...current, [field]: value } : current);
  };

  const updateExercise = (index, field, value) => {
    setResult(current => current ? {
      ...current,
      exercises: current.exercises.map((exercise, exerciseIndex) =>
        exerciseIndex === index ? { ...exercise, [field]: value } : exercise)
    } : current);
  };

  const apply = async () => {
    if (!result || busy) return;
    setBusy(true); setError('');
    try {
      await coachApi.savePersonalTrainingPlan({
        classId: selectedClass.id,
        memberId: member.id,
        title: result.title,
        goal,
        startDate: coachDate(),
        fitnessCondition: notes,
        exercises: result.exercises
      });
      showSuccess(isEn ? 'Personal training plan saved after coach review.' : 'Đã lưu giáo án cá nhân sau khi HLV xem xét.');
      window.location.hash = '#/coach/training-plan';
    } catch (err) { setError(err); }
    finally { setBusy(false); }
  };

  // Tính BMI Badge Meta
  const bmiBadge = useMemo(() => {
    if (!context?.bmi) return null;
    const v = Number(context.bmi) || 0;
    if (v < 18.5) {
      if (v < 16.0) {
        return {
          label: isEn ? 'Severe Underweight (<16)' : 'Gầy báo động / Suy nhược',
          cls: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 font-black'
        };
      }
      return {
        label: isEn ? 'Underweight (Skinny)' : 'Gầy / Thiếu cân',
        cls: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300'
      };
    }
    if (v < 25.0) {
      return {
        label: isEn ? 'Normal / Healthy' : 'Cân đối / Chuẩn',
        cls: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
      };
    }
    if (v < 30.0) {
      return {
        label: isEn ? 'Overweight' : 'Thừa cân',
        cls: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
      };
    }
    return {
      label: isEn ? 'Obese' : 'Béo phì',
      cls: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300'
    };
  }, [context?.bmi, isEn]);

  const safetyAlertText = useMemo(() => {
    if (!result) return '';
    if (result.aiReasoning && result.aiReasoning.trim()) return result.aiReasoning.trim();
    if (Array.isArray(result.mandatoryAdjustments) && result.mandatoryAdjustments.length > 0) {
      return result.mandatoryAdjustments[0];
    }
    if (Array.isArray(result.conflictWarnings) && result.conflictWarnings.length > 0) {
      return result.conflictWarnings[0];
    }
    if (result.clinicalAssessment) return result.clinicalAssessment;
    return '';
  }, [result]);

  const coachNoteText = useMemo(() => {
    if (!result) return '';
    if (result.coachReviewNote && result.coachReviewNote.trim()) return result.coachReviewNote.trim();
    if (Array.isArray(result.coachNotes) && result.coachNotes.length > 0) {
      return result.coachNotes[0];
    }
    return '';
  }, [result]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header Banner */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#52B788] text-white p-6 sm:p-7 shadow-xl shadow-[#2D6A4F]/20 border border-white/20">
        <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-[#F2CC8F]/30 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-[#81B29A]/30 to-transparent blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 text-[#1B4332] text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-xs">
              <span className="material-symbols-outlined text-[15px] text-amber-500">auto_awesome</span>
              {isEn ? 'AI Physical Plan Engine' : 'Trợ Lý AI Phân Tích Thể Trạng & Đề Xuất Giáo Án'}
            </span>
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 px-3.5 py-1.5 text-xs font-bold text-white transition-all backdrop-blur-md border border-white/30 cursor-pointer shadow-xs"
            >
              <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
              <span>{isEn ? 'Refresh' : 'Làm mới'}</span>
            </button>
          </div>

          <h1 className="text-xl sm:text-2xl font-chivo font-black tracking-tight text-white mt-1 drop-shadow-sm">
            {isEn ? 'Personalized Fitness & Health Condition AI Assistant' : 'Cá nhân hóa giáo án theo Thể trạng & Hồ sơ sinh trắc học'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-white/95 max-w-3xl font-medium leading-relaxed">
            {isEn
              ? 'Select student physical conditions (BMI, joint cautions, somatotype) and training goals to generate high-accuracy sports science protocols.'
              : 'Chọn các thể trạng được xác định trong API (BMI, tạng người gầy/thừa cân, chấn thương xương khớp) để AI thiết kế giáo án an toàn và chính xác nhất cho từng học viên.'}
          </p>
        </div>
      </header>

      <CoachError message={loadError} retry={load} />

      {loading ? (
        <p className="text-sm text-slate-500">{isEn ? 'Loading assigned classes...' : 'Đang tải lớp phụ trách...'}</p>
      ) : !loadError && (
        <div className="grid lg:grid-cols-2 gap-5 items-start">
          {/* CỘT TRÁI: FORM CHỌN HỌC VIÊN & BỘ NGỮ CẢNH THỂ TRẠNG */}
          <form onSubmit={generate} className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-2xl p-5 space-y-4 shadow-xs">
            <fieldset disabled={busy} className="space-y-4">
              {/* Chọn Lớp & Học viên */}
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="block mb-1">{isEn ? 'Assigned Class' : 'Lớp phụ trách'}</span>
                  <select
                    aria-label={isEn ? 'AI class select' : 'Lớp gợi ý AI'}
                    className={coachInput}
                    value={selectedClass?.id || ''}
                    onChange={e => { setClassId(e.target.value); setMemberId(''); }}
                  >
                    {!classes.length && (
                      <option value="">{isEn ? 'No assigned classes' : 'Chưa có lớp được phân công'}</option>
                    )}
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>[{c.sportName}] {c.name}</option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="block mb-1">{isEn ? 'Student' : 'Học viên'}</span>
                  <select
                    aria-label={isEn ? 'AI student select' : 'Học viên gợi ý AI'}
                    className={coachInput}
                    value={member?.id || ''}
                    onChange={e => setMemberId(e.target.value)}
                  >
                    {!selectedClass?.members?.length && (
                      <option value="">{isEn ? 'No students' : 'Chưa có học viên'}</option>
                    )}
                    {selectedClass?.members?.map(m => (
                      <option key={m.id} value={m.id}>{m.fullName} · {m.memberCode}</option>
                    ))}
                  </select>
                </label>
              </div>

              <CoachError message={contextError} retry={() => setVersion(v => v + 1)} />

              {contextLoading && (
                <div className="p-3 bg-slate-50 dark:bg-slate-750 rounded-xl text-center text-xs text-slate-500 animate-pulse">
                  {isEn ? 'Loading biometrics & physical condition context...' : 'Đang tải hồ sơ sinh trắc học và thể trạng học viên...'}
                </div>
              )}

              {/* THẺ TỔNG QUAN THỂ TRẠNG HỌC VIÊN TỪ API */}
              {context && (
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-800/40 pb-2">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[17px] text-emerald-600">monitor_weight</span>
                      {isEn ? 'Student Biometrics & Physical Health (API Context)' : 'Hồ Sơ Sinh Trắc Học & Thể Trạng (Từ API)'}
                    </span>
                    <button
                      type="button"
                      onClick={handleAutoFillPhysicalContext}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer shadow-2xs transition-all flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[13px]">bolt</span>
                      <span>{isEn ? 'Auto-fill Context' : 'Áp dụng vào biểu mẫu'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white/80 dark:bg-slate-800 p-2 rounded-lg border border-emerald-100 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block font-semibold">{isEn ? 'Height / Weight' : 'Chiều cao / Nặng'}</span>
                      <strong className="text-slate-800 dark:text-white">
                        {context.heightCm || member?.heightCm || '—'}cm · {context.weightKg || member?.weightKg || '—'}kg
                      </strong>
                    </div>

                    <div className="bg-white/80 dark:bg-slate-800 p-2 rounded-lg border border-emerald-100 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block font-semibold">{isEn ? 'BMI Index' : 'Chỉ số BMI'}</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <strong className="text-slate-800 dark:text-white">{context.bmi || '—'}</strong>
                        {bmiBadge && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${bmiBadge.cls}`}>
                            {bmiBadge.label}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-white/80 dark:bg-slate-800 p-2 rounded-lg border border-emerald-100 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block font-semibold">{isEn ? 'Gender / Age' : 'Giới tính / Tuổi'}</span>
                      <strong className="text-slate-800 dark:text-white">
                        {context.gender || member?.gender || '—'} · {context.age ? `${context.age}t` : '—'}
                      </strong>
                    </div>

                    <div className="bg-white/80 dark:bg-slate-800 p-2 rounded-lg border border-emerald-100 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block font-semibold">{isEn ? 'Current Level' : 'Trình độ hồ sơ'}</span>
                      <strong className="text-emerald-700 dark:text-emerald-400 font-bold">
                        {context.fitnessLevel || 'Intermediate'}
                      </strong>
                    </div>
                  </div>

                  {/* CẢNH BÁO Y TẾ NẾU BMI < 16.0 (THIẾU CÂN NGHIÊM TRỌNG / SUY NHƯỢC) */}
                  {context.bmi && Number(context.bmi) < 16.0 && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-xl text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-red-700 dark:text-red-300 font-bold">
                        <span className="material-symbols-outlined text-[18px]">warning</span>
                        <span>{isEn ? 'CRITICAL CLINICAL ALERT: Severe Underweight' : 'CẢNH BÁO Y TẾ THỂ THAO: Thiếu cân nghiêm trọng / Suy nhược'}</span>
                      </div>
                      <p className="text-red-700 dark:text-red-300 text-[11px] leading-relaxed">
                        {isEn
                          ? `BMI ${context.bmi} (${context.heightCm}cm - ${context.weightKg}kg) indicates severe nutritional deficiency and muscle atrophy. Axial spinal loading (Barbell Squats/Deadlifts) and heavy free-weight pressing are STRICTLY CONTRAINDICATED. The engine automatically enforces joint-protective and postural corrective exercises.`
                          : `Chỉ số BMI ${context.bmi} (${context.heightCm}cm - ${context.weightKg}kg) ở mức báo động suy nhược cơ thể. TUYỆT ĐỐI KHÔNG chỉ định tạ đòn nặng (Barbell Squat, Deadlift, Bench Press) do nguy cơ chấn thương cột sống và khớp. Hệ thống tự động kích hoạt phác đồ bảo vệ xương khớp và nắn chỉnh tư thế.`}
                      </p>
                    </div>
                  )}

                  {/* Lưu ý y tế đã lưu */}
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-800/80 p-2 rounded-lg border border-emerald-100 dark:border-slate-700">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{isEn ? 'Medical notes: ' : 'Lưu ý sức khỏe / Bệnh lý: '}</span>
                    <span className={context.medicalNote ? 'text-amber-800 dark:text-amber-300 font-medium' : 'text-slate-400 italic'}>
                      {context.medicalNote || (isEn ? 'No known conditions' : 'Chưa ghi nhận bệnh lý trong hồ sơ')}
                    </span>
                  </div>

                  {/* Lịch sử tập gần nhất */}
                  {context.recentHistory?.length > 0 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer font-bold text-emerald-800 dark:text-emerald-300 hover:underline">
                        {isEn ? `View ${context.recentHistory.length} recent workout logs` : `Xem ${context.recentHistory.length} kết quả tập gần nhất`}
                      </summary>
                      <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {context.recentHistory.map((h, i) => (
                          <div key={i} className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 text-[11px]">
                            <div className="flex justify-between font-bold text-slate-700 dark:text-slate-200">
                              <span>{h.date}</span>
                              <span className="text-slate-500 font-normal">
                                {h.weight ? `${h.weight}kg` : ''} {h.bodyFat ? `· ${h.bodyFat}% mỡ` : ''} {h.muscleMass ? `· ${h.muscleMass}kg cơ` : ''}
                              </span>
                            </div>
                            {h.workoutResult && <p className="text-slate-600 dark:text-slate-300 mt-0.5">{h.workoutResult}</p>}
                            {h.coachFeedback && <p className="text-emerald-600 font-medium mt-0.5">HLV: {h.coachFeedback}</p>}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}

              {/* CHẾ ĐỘ NHẬP LIỆU TỰ DO THÔNG MINH (SMART FREE-TEXT NLP MODE) */}
              <div className="space-y-4 pt-1">
                {/* Hướng dẫn trợ lý AI */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200/70 dark:border-emerald-800/60 text-xs flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600 mt-0.5 shrink-0">psychology</span>
                  <div className="space-y-0.5">
                    <p className="font-bold text-emerald-900 dark:text-emerald-200">
                      {isEn ? 'Smart Free-text NLP Assistant' : 'Nhập liệu tự do & Trợ lý Bóc tách Ngữ nghĩa (NLP)'}
                    </p>
                    <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
                      {isEn
                        ? 'Type freely about member goals and physical conditions. Gemini AI automatically identifies injuries, resolves conflicting objectives, and enforces medical safety postures.'
                        : 'Nhập tự nhiên tình trạng, chấn thương và mục tiêu. Hệ thống AI sẽ tự động phân tích ngữ nghĩa, bóc tách thực thể và thiết kế bài tập an toàn.'}
                    </p>
                  </div>
                </div>

                {/* Ô 1 - MỤC TIÊU MONG MUỐN (TEXT TỰ GÕ) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-blue-600">flag</span>
                      <span>{isEn ? 'Desired Training Goal *' : 'Mục tiêu mong muốn *'}</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">{isEn ? 'Free-text' : 'Gõ tự do'}</span>
                  </div>
                  <input
                    aria-label={isEn ? 'Fitness Goal' : 'Mục tiêu AI'}
                    required
                    maxLength={500}
                    className={`${coachInput} text-xs font-medium`}
                    value={goal}
                    onChange={e => setGoal(e.target.value)}
                    placeholder={isEn
                      ? 'E.g., Increase smash power and wrist mobility (or Fat loss, Rehabilitation...)'
                      : 'VD: Tăng sức mạnh đập cầu và độ linh hoạt cổ tay; hoặc Giảm mỡ săn chắc vóc dáng...'}
                  />
                </div>

                {/* Ô 2 - MÔ TẢ THỂ TRẠNG & LƯU Ý SỨC KHỎE (TEXTAREA TỰ GÕ) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-amber-500">health_and_safety</span>
                      <span>{isEn ? 'Physical Condition & Health Constraints *' : 'Mô tả thể trạng & Lưu ý sức khỏe *'}</span>
                    </label>
                    {notes && (
                      <button
                        type="button"
                        onClick={() => { setNotes(''); setSelectedTagIds([]); }}
                        className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                      >
                        {isEn ? 'Clear note' : 'Xóa ghi chú'}
                      </button>
                    )}
                  </div>
                  <textarea
                    aria-label={isEn ? 'Health notes' : 'Lưu ý AI'}
                    required
                    maxLength={1000}
                    rows={4}
                    className={`${coachInput} text-xs leading-relaxed`}
                    placeholder={isEn
                      ? 'E.g., Advanced badminton player with mild ankle sprain, low stamina, easily breathless. Focus on upper body and seated wrist work in place; or Leg cast, weak endurance, 100% seated exercises...'
                      : 'VD: Học viên lớp Cầu lông nâng cao nhưng mới bị trật cổ chân nhẹ, thể lực yếu hay hụt hơi. Muốn tập duy trì sức mạnh thân trên và cổ tay tại chỗ... (hoặc: Đang gãy chân bó bột, thể lực yếu, cần tập ngồi hoàn toàn)'}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                    {isEn
                      ? '💡 Tip: Mention any injuries (broken leg, torn ligament, back pain) or stamina cautions. AI will auto-adjust volume and posture.'
                      : '💡 Mẹo: Nhập chi tiết chấn thương (gãy chân, đau lưng, khớp gối) hoặc thể trạng (thể lực yếu, hụt hơi). AI sẽ tự động cô lập vùng tổn thương.'}
                  </p>
                </div>

                {/* TÙY CHỌN NÂNG CAO (BỘ LỌC TAG THỦ CÔNG & KIỂM TRA MẪU THUẪN) */}
                <details className="text-xs pt-1 group">
                  <summary className="cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-semibold py-1 flex items-center gap-1 select-none">
                    <span className="material-symbols-outlined text-[15px] text-slate-400 group-open:rotate-90 transition-transform">chevron_right</span>
                    <span>{isEn ? 'Optional: Manual Tag Filter & Verification' : 'Tùy chọn kiểm thử: Bộ lọc Tag thủ công & Đánh giá'}</span>
                  </summary>
                  <div className="mt-2 space-y-3 p-3 bg-slate-50/70 dark:bg-slate-750/40 rounded-xl border border-slate-200/80 dark:border-slate-700">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        {isEn ? 'Current Fitness Level' : 'Trình độ đánh giá'}
                      </label>
                      <input
                        aria-label={isEn ? 'Fitness Level' : 'Trình độ AI'}
                        maxLength={50}
                        className={coachInput}
                        placeholder={isEn ? 'Enter evaluated fitness level' : 'Nhập trình độ đã đánh giá'}
                        value={level}
                        onChange={e => setLevel(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        {isEn ? 'Physical Condition Tags:' : 'Gắn tag thể trạng thủ công:'}
                      </span>
                      {CONDITION_GROUPS.map((grp, gIdx) => (
                        <div key={gIdx} className="space-y-1">
                          <div className="text-[10px] font-semibold text-slate-500">{grp.groupTitle}</div>
                          <div className="flex flex-wrap gap-1">
                            {grp.items.map(item => {
                              const active = selectedTagIds.includes(item.id);
                              const incompatibleWithBmi = !isBodyTagCompatible(item.id, Number(context?.bmi));
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  disabled={incompatibleWithBmi}
                                  title={incompatibleWithBmi
                                    ? (isEn ? 'This tag conflicts with the calculated BMI.' : 'Thẻ này mâu thuẫn với chỉ số BMI đã tính.')
                                    : undefined}
                                  onClick={() => handleToggleTag(item)}
                                  className={`px-2 py-0.5 rounded text-[11px] transition-all cursor-pointer border ${
                                    incompatibleWithBmi
                                      ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed dark:bg-slate-800'
                                      : active
                                      ? 'bg-[#1E2235] text-[#F2CC8F] border-[#1E2235] font-bold shadow-2xs'
                                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  {item.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              </div>

              <button
                disabled={!member || !context || contextLoading || busy}
                className="w-full px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px] text-amber-300">auto_awesome</span>
                <span>{busy ? (isEn ? 'Processing with AI...' : 'Đang phân tích thể trạng...') : (isEn ? 'Generate AI Fitness Plan' : 'Tạo Gợi Ý Giáo Án Thể Lực')}</span>
              </button>
            </fieldset>
          </form>

          {/* CỘT PHẢI: KẾT QUẢ GỢI Ý GIÁO ÁN */}
          <section className="bg-white dark:bg-slate-800 p-5 sm:p-6 border border-slate-200/90 dark:border-slate-700 rounded-2xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h2 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">assignment_turned_in</span>
                <span>{isEn ? 'AI Plan for Coach Review' : 'Gợi ý để HLV xem xét'}</span>
              </h2>
              {result && (
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                  notice?.type === 'ai'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {notice?.type === 'ai' ? 'auto_awesome' : 'fitness_center'}
                  </span>
                  <span>{notice?.type === 'ai' ? 'Gemini AI' : 'SCMS Engine'}</span>
                </span>
              )}
            </div>

            <CoachError message={error} />

            {notice && (
              <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 transition-all ${
                notice.type === 'ai'
                  ? 'bg-purple-50/90 border-purple-200 text-purple-900 dark:bg-purple-950/40 dark:text-purple-200'
                  : 'bg-blue-50/90 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200'
              }`}>
                <span className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${
                  notice.type === 'ai' ? 'text-purple-600' : 'text-blue-600'
                }`}>
                  {notice.type === 'ai' ? 'auto_awesome' : 'info'}
                </span>
                <div className="space-y-0.5">
                  <p className="font-bold">{notice.title}</p>
                  <p className="text-[11px] leading-relaxed opacity-90">{notice.message}</p>
                </div>
              </div>
            )}

            {!result && !busy && (
              <div className="p-8 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                <span className="material-symbols-outlined text-4xl block text-slate-300">psychology</span>
                <p className="text-xs sm:text-sm">
                  {isEn
                    ? 'Select a student, choose physical condition tags, and click Generate to produce a personalized plan.'
                    : 'Chọn học viên, nhấp chọn các thể trạng phù hợp và bấm Tạo gợi ý AI để hệ thống thiết kế giáo án.'}
                </p>
              </div>
            )}

            {busy && (
              <div className="py-12 text-center text-sm text-slate-500 space-y-3">
                <span className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="font-medium">{isEn ? 'AI is analyzing student physical biometrics and generating optimal workout protocol...' : 'AI đang phân tích thể trạng và tính toán phác đồ rèn luyện tối ưu...'}</p>
              </div>
            )}

            {result && (
              <div className="space-y-4 animate-fadeIn">
                {/* 1. TIÊU ĐỀ PHÁC ĐỒ & BADGES CỐT LÕI (TAGS + BMI) */}
                <div className="space-y-2 border-b border-slate-100 dark:border-slate-700 pb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider shrink-0">
                      {isEn ? 'Protocol:' : 'Phác đồ:'}
                    </span>
                    <input
                      aria-label={isEn ? 'Editable AI plan title' : 'Tiêu đề giáo án AI có thể chỉnh sửa'}
                      maxLength={150}
                      className={`${coachInput} font-extrabold text-base sm:text-lg text-slate-900 dark:text-white`}
                      value={result.title || ''}
                      onChange={event => updateResultField('title', event.target.value)}
                    />
                  </div>

                  {/* Chips: Extracted Tags + BMI */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {Array.isArray(result.extractedTags) && result.extractedTags.map((tag, idx) => (
                      <span
                        key={`tag-${idx}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 shadow-2xs"
                      >
                        <span>🏷️</span>
                        <span>{tag}</span>
                      </span>
                    ))}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                      <span>📏</span>
                      <span>BMI {context?.bmi || '22.9'} ({bmiBadge?.label || (isEn ? 'Normal' : 'Bình thường')})</span>
                    </span>
                  </div>
                </div>

                {/* 2. CẢNH BÁO ĐIỀU CHỈNH TỰ ĐỘNG DUY NHẤT (GỘP REASONING + Y TẾ + XUNG ĐỘT) */}
                {safetyAlertText && (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 rounded-xl text-xs flex items-start gap-2.5 shadow-2xs">
                    <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[20px] shrink-0 mt-0.5">warning</span>
                    <div className="space-y-0.5">
                      <strong className="text-amber-900 dark:text-amber-200 block font-bold">
                        {isEn ? 'Automatic safety adjustment:' : 'Lưu ý điều chỉnh tự động:'}
                      </strong>
                      <p className="text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
                        {safetyAlertText}
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. THÔNG SỐ KHỐI LƯỢNG, NHỊP TIM & DINH DƯỠNG */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-750/70 border border-slate-200/90 dark:border-slate-700 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-slate-700 dark:text-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-blue-500">fitness_center</span>
                      <strong>{isEn ? 'Volume:' : 'Khối lượng:'}</strong>
                      <span className="font-semibold">{result.weeklyVolume || result.recommendedVolume}</span>
                    </div>
                    <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-rose-500">favorite</span>
                      <strong>{isEn ? 'Heart rate:' : 'Nhịp tim:'}</strong>
                      <span className="font-semibold">{result.heartRateZone}</span>
                    </div>
                  </div>
                  {result.nutritionGuidance && (
                    <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-emerald-500 shrink-0 mt-0.5">restaurant</span>
                      <div>
                        <strong>{isEn ? 'Nutrition:' : 'Dinh dưỡng:'}</strong>{' '}
                        <span className="text-slate-600 dark:text-slate-300 font-medium">{result.nutritionGuidance}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. DANH MỤC BÀI TẬP (100% CỤ THỂ, AN TOÀN) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-blue-600">format_list_numbered</span>
                      {isEn ? 'Recommended Exercise Routine:' : 'Danh mục bài tập khuyến nghị:'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {result?.exercises?.length || 0} {isEn ? 'exercises' : 'bài tập'}
                    </span>
                  </div>

                  {Array.isArray(result?.exercises) && result.exercises.length > 0 ? (
                    result.exercises.map((ex, i) => (
                      <article key={i} className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs break-words bg-slate-50/50 dark:bg-slate-750 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors">
                        <div className="grid sm:grid-cols-[1fr_90px_110px] gap-2 items-end">
                          <label className="space-y-1">
                            <span className="font-bold text-slate-700 dark:text-slate-200">{i + 1}. {isEn ? 'Exercise' : 'Bài tập'}</span>
                            <input
                              aria-label={`${isEn ? 'Exercise name' : 'Tên bài tập'} ${i + 1}`}
                              maxLength={150}
                              className={coachInput}
                              value={ex?.name || ''}
                              onChange={event => updateExercise(i, 'name', event.target.value)}
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-500">SETS</span>
                            <input
                              aria-label={`Sets ${i + 1}`}
                              maxLength={30}
                              className={coachInput}
                              value={ex?.sets || ''}
                              onChange={event => updateExercise(i, 'sets', event.target.value)}
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-500">REPS</span>
                            <input
                              aria-label={`Reps ${i + 1}`}
                              maxLength={50}
                              className={coachInput}
                              value={ex?.reps || ''}
                              onChange={event => updateExercise(i, 'reps', event.target.value)}
                            />
                          </label>
                        </div>
                        <textarea
                          aria-label={`${isEn ? 'Safety note' : 'Ghi chú an toàn'} ${i + 1}`}
                          maxLength={500}
                          rows={2}
                          className={`${coachInput} mt-2 text-slate-600 dark:text-slate-300`}
                          value={ex?.note || ''}
                          onChange={event => updateExercise(i, 'note', event.target.value)}
                        />
                      </article>
                    ))
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl border text-center text-xs text-slate-500">
                      {isEn ? 'No exercise details available.' : 'Chưa có danh sách bài tập chi tiết.'}
                    </div>
                  )}
                </div>

                {/* 1 GHI CHÚ CHUYÊN MÔN HLV DUY NHẤT */}
                {coachNoteText && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-2">
                    <span className="material-symbols-outlined text-[16px] text-slate-500 shrink-0 mt-0.5">verified_user</span>
                    <p className="leading-relaxed">
                      <strong>{isEn ? 'Coach Note:' : 'Lưu ý chuyên môn HLV:'}</strong> {coachNoteText}
                    </p>
                  </div>
                )}

                {/* CTA BUTTON */}
                <button
                  disabled={busy}
                  onClick={apply}
                  className="w-full p-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
                  <span>{isEn ? 'Reviewed — Save as Personal Training Plan' : 'Đã xem xét — Lưu thành giáo án cá nhân cho học viên'}</span>
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
