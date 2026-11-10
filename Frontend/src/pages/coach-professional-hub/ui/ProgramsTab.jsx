import React, { useEffect, useState } from 'react';
import { coachApi, coachProfessionalApi, tdeeEstimate } from '../../../entities/coach/index.js';
import { uploadMediaFileToCloud } from '../../../shared/api/mediaApi.js';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { SectionCard, EmptyState } from '../../../features/coach-workspace/index.js';
import { inputClass, selectClass, buttonPrimary, FormField, dateInput } from './formControls.jsx';

// ─────────────────────────────────────────────────────────────
// TAB 3: PROGRAMS & NUTRITION (GIÁO ÁN & DINH DƯỠNG)
// ─────────────────────────────────────────────────────────────
export function ProgramsTab({ data, act, working, isEn }) {
  const { showError } = useToast();
  const [media, setMedia] = useState({ imageUrl: '', videoUrl: '' });
  const [uploading, setUploading] = useState(false);
  const [nutritionMember, setNutritionMember] = useState(data.clients[0]?.id || '');
  const [planMember, setPlanMember] = useState(data.clients[0]?.id || '');
  const [planClass, setPlanClass] = useState('');
  const [coachClasses, setCoachClasses] = useState([]);
  const [plans, setPlans] = useState([]);
  const [planExercises, setPlanExercises] = useState([]);

  const selectedClient = data.clients.find(x => Number(x.id) === Number(nutritionMember));
  const age = selectedClient?.dateOfBirth ? Math.floor((Date.now() - new Date(selectedClient.dateOfBirth).getTime()) / 31557600000) : 28;
  const tdee = tdeeEstimate({ gender: selectedClient?.gender, weightKg: selectedClient?.weightKg, heightCm: selectedClient?.heightCm, age, activity: 1.55 });

  const availableClasses = coachClasses.filter(cls =>
    cls.members?.some(member => Number(member.memberId ?? member.id) === Number(planMember))
  );
  const memberPlans = plans.filter(plan => Number(plan.memberId) === Number(planMember));
  const weekdays = [
    ['Monday', isEn ? 'Monday' : 'Thứ 2'],
    ['Tuesday', isEn ? 'Tuesday' : 'Thứ 3'],
    ['Wednesday', isEn ? 'Wednesday' : 'Thứ 4'],
    ['Thursday', isEn ? 'Thursday' : 'Thứ 5'],
    ['Friday', isEn ? 'Friday' : 'Thứ 6'],
    ['Saturday', isEn ? 'Saturday' : 'Thứ 7'],
    ['Sunday', isEn ? 'Sunday' : 'Chủ nhật']
  ];

  useEffect(() => {
    Promise.all([coachApi.getCoachClassesAndMembers(), coachApi.getTrainingPlans()])
      .then(([classes, currentPlans]) => {
        setCoachClasses(classes);
        setPlans(currentPlans);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!availableClasses.some(x => Number(x.id) === Number(planClass))) {
      setPlanClass(availableClasses[0]?.id || '');
    }
  }, [planMember, coachClasses]);

  const upload = async (file, field) => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadMediaFileToCloud(file);
      setMedia(x => ({ ...x, [field]: result.url }));
    } catch (e) {
      showError(e.message || (isEn ? 'Upload failed' : 'Tải tệp thất bại'));
    } finally {
      setUploading(false);
    }
  };

  const submitExercise = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    return act(
      () =>
        coachProfessionalApi.saveExercise({
          sportId: null,
          name: f.get('name'),
          description: f.get('description') || null,
          muscleGroup: f.get('muscleGroup') || null,
          difficultyLevel: f.get('difficultyLevel'),
          instructions: f.get('instructions') || null,
          imageUrl: media.imageUrl || null,
          videoUrl: media.videoUrl || null
        }),
      isEn ? 'Exercise added to library.' : 'Đã thêm bài tập vào thư viện chuẩn.'
    ).then((ok) => {
      if (ok) {
        e.target.reset();
        setMedia({ imageUrl: '', videoUrl: '' });
      }
    });
  };

  const submitHomework = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    return act(
      () =>
        coachProfessionalApi.saveHomework({
          classId: null,
          memberId: Number(f.get('memberId')),
          title: f.get('title'),
          description: f.get('description'),
          dueDate: f.get('dueDate') || null
        }),
      isEn ? 'Homework assigned and notification sent.' : 'Đã giao bài tập về nhà và kích hoạt thông báo.'
    ).then((ok) => ok && e.target.reset());
  };

  const submitNutrition = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    return act(
      () =>
        coachProfessionalApi.saveNutrition({
          memberId: Number(f.get('memberId')),
          title: f.get('title'),
          startDate: f.get('startDate'),
          endDate: f.get('endDate') || null,
          dailyCalories: Number(f.get('dailyCalories')),
          proteinGrams: Number(f.get('proteinGrams')),
          carbGrams: Number(f.get('carbGrams')),
          fatGrams: Number(f.get('fatGrams')),
          mealPlanJson: JSON.stringify({ menu: f.get('menu') }),
          notes: f.get('notes') || null
        }),
      isEn ? 'Nutrition plan assigned to student.' : 'Đã thiết lập và giao kế hoạch dinh dưỡng cho học viên.'
    ).then((ok) => ok && e.target.reset());
  };

  const addExerciseToPlan = (item) => {
    setPlanExercises(current => [
      ...current,
      {
        key: `${item.id}-${Date.now()}-${current.length}`,
        name: item.name,
        sets: '3',
        reps: '10',
        note: '',
        weekNumber: 1,
        dayOfWeek: 'Monday'
      }
    ]);
  };

  const savePlan = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (!planClass || !planExercises.length) return;

    const ok = await act(
      () =>
        coachApi.savePersonalTrainingPlan({
          classId: Number(planClass),
          memberId: Number(planMember),
          title: form.get('title'),
          goal: form.get('goal'),
          startDate: form.get('startDate'),
          endDate: form.get('endDate') || null,
          fitnessCondition: form.get('fitnessCondition') || null,
          exercises: planExercises
        }),
      isEn ? 'Personalized workout plan saved.' : 'Đã lưu giáo án tập luyện cá nhân hóa theo tuần/tháng.'
    );

    if (ok) {
      setPlans(await coachApi.getTrainingPlans());
      setPlanExercises([]);
      formElement.reset();
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Add Exercise and Homework */}
      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title={isEn ? 'Exercise Library Management' : 'Đóng góp bài tập vào thư viện'} icon="fitness_center">
          <form onSubmit={submitExercise} className="grid gap-3 sm:grid-cols-2">
            <FormField title={isEn ? 'Exercise Name' : 'Tên bài tập'} required>
              <input name="name" required placeholder={isEn ? 'E.g., Barbell Squat' : 'VD: Barbell Squat'} className={inputClass} />
            </FormField>
            <FormField title={isEn ? 'Target Muscle Group' : 'Nhóm cơ mục tiêu'}>
              <input name="muscleGroup" placeholder={isEn ? 'E.g., Quads & Glutes' : 'VD: Cơ đùi trước & Mông'} className={inputClass} />
            </FormField>
            <FormField title={isEn ? 'Difficulty Level' : 'Độ khó'}>
              <select name="difficultyLevel" className={selectClass}>
                <option value="Beginner">{isEn ? 'Beginner' : 'Beginner (Cơ bản)'}</option>
                <option value="Intermediate">{isEn ? 'Intermediate' : 'Intermediate (Trung cấp)'}</option>
                <option value="Advanced">{isEn ? 'Advanced' : 'Advanced (Nâng cao)'}</option>
              </select>
            </FormField>
            <FormField title={isEn ? 'Technique Description' : 'Mô tả kỹ thuật'}>
              <input name="description" placeholder={isEn ? 'E.g., Keep spine neutral, lower hips parallel' : 'VD: Giữ lưng thẳng, hạ hông song song'} className={inputClass} />
            </FormField>
            <FormField title={isEn ? 'Demonstration Image' : 'Hình ảnh minh họa'}>
              <input
                type="file"
                accept="image/*"
                onChange={e => upload(e.target.files?.[0], 'imageUrl')}
                className={inputClass}
              />
            </FormField>
            <FormField title={isEn ? 'Instructional Video' : 'Video hướng dẫn'}>
              <input
                type="file"
                accept="video/*"
                onChange={e => upload(e.target.files?.[0], 'videoUrl')}
                className={inputClass}
              />
            </FormField>
            <div className="sm:col-span-2">
              <FormField title={isEn ? 'Step-by-step Instructions' : 'Hướng dẫn từng bước (Step-by-step)'}>
                <textarea name="instructions" rows="2" placeholder={isEn ? 'Step 1: Stance setup... Step 2: Hinge at hips...' : 'Bước 1: Chuẩn bị... Bước 2: Hạ trọng tâm...'} className={inputClass} />
              </FormField>
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button disabled={working || uploading} className={buttonPrimary}>
                <span>{uploading ? (isEn ? 'Uploading media...' : 'Đang tải media...') : (isEn ? 'Save Exercise to Library' : 'Lưu bài tập vào thư viện')}</span>
              </button>
            </div>
          </form>
        </SectionCard>

        <SectionCard title={isEn ? 'Assign Homework' : 'Giao bài tập tự rèn luyện về nhà'} icon="task_alt">
          <form onSubmit={submitHomework} className="space-y-3">
            <FormField title={isEn ? 'Student' : 'Học viên nhận bài'} required>
              <select name="memberId" required className={selectClass}>
                {data.clients.map(x => (
                  <option key={x.id} value={x.id}>{x.fullName}</option>
                ))}
              </select>
            </FormField>
            <FormField title={isEn ? 'Assignment Title' : 'Tiêu đề bài tập'} required>
              <input name="title" required placeholder={isEn ? 'E.g., 30-min Home Cardio & Mobility' : 'VD: 30 phút Cardio & Giãn cơ tại nhà'} className={inputClass} />
            </FormField>
            <FormField title={isEn ? 'Detailed Workout Instructions' : 'Nội dung bài tập chi tiết'} required>
              <textarea name="description" required rows="3" placeholder={isEn ? 'E.g., 3km light jog, hamstring and hip flexor stretches...' : 'Chạy bộ 3km tốc độ nhẹ, kéo giãn cơ hông và đùi sau...'} className={inputClass} />
            </FormField>
            <FormField title={isEn ? 'Check-in Deadline' : 'Hạn chót check-in'}>
              <input name="dueDate" type="datetime-local" className={inputClass} />
            </FormField>
            <button disabled={working} className={`${buttonPrimary} w-full`}>
              <span>{isEn ? 'Assign Homework & Send Notice' : 'Giao bài tập & Gửi thông báo'}</span>
            </button>
          </form>
        </SectionCard>
      </div>

      {/* 2. Structured Workout Builder */}
      <SectionCard title={isEn ? 'Personalized Workout Builder' : 'Xây dựng giáo án cá nhân hóa theo tuần / tháng'} icon="tune">
        <form onSubmit={savePlan} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FormField title={isEn ? 'Target Student' : 'Học viên áp dụng'}>
              <select value={planMember} onChange={e => setPlanMember(e.target.value)} className={selectClass}>
                {data.clients.map(x => (
                  <option key={x.id} value={x.id}>{x.fullName}</option>
                ))}
              </select>
            </FormField>
            <FormField title={isEn ? 'Class / Package' : 'Lớp / Gói áp dụng'} required>
              <select value={planClass} onChange={e => setPlanClass(e.target.value)} required className={selectClass}>
                <option value="">{isEn ? '-- Select Class --' : '-- Chọn lớp --'}</option>
                {availableClasses.map(x => (
                  <option key={x.id} value={x.id}>{x.name}</option>
                ))}
              </select>
            </FormField>
            <FormField title={isEn ? 'Plan Title' : 'Tên giáo án'} required>
              <input name="title" required placeholder={isEn ? 'E.g., 4-Week Hypertrophy & Fat Loss' : 'VD: Tăng cơ giảm mỡ chu kỳ 4 tuần'} className={inputClass} />
            </FormField>
            <FormField title={isEn ? 'Plan Goal' : 'Mục tiêu giáo án'} required>
              <input name="goal" required placeholder={isEn ? 'E.g., Drop 2kg fat, build endurance' : 'VD: Giảm 2kg mỡ, tăng sức bền'} className={inputClass} />
            </FormField>
            <FormField title={isEn ? 'Start Date' : 'Ngày bắt đầu'} required>
              <input name="startDate" type="date" defaultValue={dateInput()} required className={inputClass} />
            </FormField>
            <FormField title={isEn ? 'End Date' : 'Ngày kết thúc'}>
              <input name="endDate" type="date" defaultValue={dateInput(28)} className={inputClass} />
            </FormField>
            <div className="sm:col-span-2">
              <FormField title={isEn ? 'Current Physical Condition' : 'Tình trạng thể lực hiện tại'}>
                <input name="fitnessCondition" placeholder={isEn ? 'E.g., Knee joint precaution, avoid high impacts' : 'VD: Khớp gối cần hạn chế bật nhảy cao'} className={inputClass} />
              </FormField>
            </div>
          </div>

          {/* Exercise Selection Grid */}
          <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr] pt-2 border-t border-brand-navy-100 dark:border-brand-navy-700">
            {/* Library list */}
            <div>
              <p className="text-xs font-bold uppercase text-brand-navy-500 mb-2">
                {isEn ? `Select from Library (${data.exercises.length})` : `Chọn bài tập từ thư viện (${data.exercises.length})`}
              </p>
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {data.exercises.map(x => (
                  <div key={x.id} className="p-2.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-brand-navy-50 dark:bg-brand-navy-800 flex items-center justify-between text-xs">
                    <div>
                      <strong className="block text-brand-navy-900 dark:text-white">{x.name}</strong>
                      <span className="text-[11px] text-brand-navy-500">{x.muscleGroup || (isEn ? 'Full Body' : 'Toàn thân')} · {x.difficultyLevel}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => addExerciseToPlan(x)}
                      className="px-2.5 py-1 rounded-lg bg-brand-navy-900 text-brand-sand-300 hover:bg-brand-navy-800 font-bold text-xs cursor-pointer"
                    >
                      {isEn ? '+ Add' : '+ Thêm'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Added exercises list */}
            <div className="p-3.5 rounded-2xl border-2 border-dashed border-brand-sage-500/30 dark:border-brand-sage-500/30 bg-brand-sage-500/5 dark:bg-brand-sage-500/10 min-h-64">
              <p className="text-xs font-bold uppercase text-brand-sage-700 dark:text-brand-sage-500 mb-3">
                {isEn ? `Curated Exercise Schedule (${planExercises.length} items)` : `Lộ trình bài tập đã thêm (${planExercises.length} bài)`}
              </p>
              {!planExercises.length ? (
                <EmptyState icon="add_task" isEn={isEn}>{isEn ? "Click '+ Add' from the library on the left to build the syllabus." : "Nhấp '+ Thêm' từ thư viện bên trái để xây dựng bài tập vào lộ trình."}</EmptyState>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {planExercises.map((item, index) => (
                    <div key={item.key} className="p-3 rounded-xl bg-white dark:bg-brand-navy-800 border border-brand-navy-200 dark:border-brand-navy-700 shadow-2xs text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-brand-navy-900 dark:text-white">
                          #{index + 1}. {item.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPlanExercises(c => c.filter((_, i) => i !== index))}
                          className="text-brand-danger-600 hover:text-brand-danger-700 font-bold cursor-pointer"
                        >
                          {isEn ? '✕ Remove' : '✕ Xóa'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <select
                          value={item.weekNumber}
                          onChange={e => setPlanExercises(c => c.map((it, i) => i === index ? { ...it, weekNumber: Number(e.target.value) } : it))}
                          className={selectClass}
                        >
                          {Array.from({ length: 8 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{isEn ? `Week ${i + 1}` : `Tuần ${i + 1}`}</option>
                          ))}
                        </select>
                        <select
                          value={item.dayOfWeek}
                          onChange={e => setPlanExercises(c => c.map((it, i) => i === index ? { ...it, dayOfWeek: e.target.value } : it))}
                          className={selectClass}
                        >
                          {weekdays.map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                        <input
                          value={item.sets}
                          onChange={e => setPlanExercises(c => c.map((it, i) => i === index ? { ...it, sets: e.target.value } : it))}
                          placeholder={isEn ? 'Sets' : 'Số hiệp'}
                          className={inputClass}
                        />
                        <input
                          value={item.reps}
                          onChange={e => setPlanExercises(c => c.map((it, i) => i === index ? { ...it, reps: e.target.value } : it))}
                          placeholder={isEn ? 'Reps' : 'Số lần / Reps'}
                          className={inputClass}
                        />
                        <input
                          value={item.note}
                          onChange={e => setPlanExercises(c => c.map((it, i) => i === index ? { ...it, note: e.target.value } : it))}
                          placeholder={isEn ? 'RPE / Rest' : 'RPE / Nghỉ'}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex justify-end">
                <button
                  disabled={working || !planClass || !planExercises.length}
                  className={buttonPrimary}
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>{isEn ? 'Save & Issue Workout Plan' : 'Lưu & Ban hành giáo án'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </SectionCard>

      {/* 3. Nutrition Planning with TDEE Calculator */}
      <SectionCard
        title={isEn ? `Nutrition Planning · Suggested TDEE: ${tdee ? `${tdee} kcal/day` : 'insufficient metrics'}` : `Thiết kế dinh dưỡng · TDEE gợi ý: ${tdee ? `${tdee} kcal/ngày` : 'chưa đủ chỉ số'}`}
        icon="nutrition"
      >
        <form onSubmit={submitNutrition} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField title={isEn ? 'Target Student' : 'Học viên áp dụng'}>
            <select name="memberId" value={nutritionMember} onChange={e => setNutritionMember(e.target.value)} className={selectClass}>
              {data.clients.map(x => (
                <option key={x.id} value={x.id}>{x.fullName}</option>
              ))}
            </select>
          </FormField>
          <FormField title={isEn ? 'Meal Plan Title' : 'Tên thực đơn'} required>
            <input name="title" required placeholder={isEn ? 'E.g., Eat Clean 1800kcal Protocol' : 'VD: Thực đơn Eat Clean 1800kcal'} className={inputClass} />
          </FormField>
          <FormField title={isEn ? 'Start Date' : 'Từ ngày'} required>
            <input name="startDate" type="date" defaultValue={dateInput()} required className={inputClass} />
          </FormField>
          <FormField title={isEn ? 'End Date' : 'Đến ngày'}>
            <input name="endDate" type="date" className={inputClass} />
          </FormField>
          <FormField title={isEn ? 'Target Calories (kcal)' : 'Calories mục tiêu (kcal)'} required>
            <input name="dailyCalories" type="number" min="800" defaultValue={tdee || 2000} required className={inputClass} />
          </FormField>
          <FormField title={isEn ? 'Protein (g)' : 'Protein (g)'} required>
            <input name="proteinGrams" type="number" min="0" defaultValue="140" required className={inputClass} />
          </FormField>
          <FormField title={isEn ? 'Carbs (g)' : 'Carbs (g)'} required>
            <input name="carbGrams" type="number" min="0" defaultValue="220" required className={inputClass} />
          </FormField>
          <FormField title={isEn ? 'Fat (g)' : 'Fat (g)'} required>
            <input name="fatGrams" type="number" min="0" defaultValue="60" required className={inputClass} />
          </FormField>
          <div className="sm:col-span-2">
            <FormField title={isEn ? 'Daily Menu Details (Breakfast - Lunch - Dinner)' : 'Thực đơn chi tiết (Sáng - Trưa - Tối)'}>
              <textarea name="menu" rows="3" placeholder={isEn ? 'Breakfast: Oatmeal + Eggs... Lunch: Chicken breast + Sweet potato... Dinner: Salmon + Salad...' : 'Sáng: Yến mạch + Trứng... Trưa: Ức gà + Khoai lang... Tối: Cá hồi + Salad...'} className={inputClass} />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField title={isEn ? 'Nutritional Notes / Food Allergies' : 'Lưu ý dinh dưỡng / Dị ứng thực phẩm'}>
              <textarea name="notes" rows="3" placeholder={isEn ? 'Avoid seafood, drink at least 2.5L water daily...' : 'Tránh hải sản, uống tối thiểu 2.5L nước mỗi ngày...'} className={inputClass} />
            </FormField>
          </div>
          <div className="sm:col-span-4 flex justify-end">
            <button disabled={working} className={buttonPrimary}>
              <span>{isEn ? 'Assign Nutrition Plan' : 'Giao kế hoạch dinh dưỡng'}</span>
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
