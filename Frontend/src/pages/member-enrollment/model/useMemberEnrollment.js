import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { classApi } from '../../../entities/class/index.js';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { enrollmentErrorMessage, filterVisibleSports, resolveAutoCoach, summarizeSport } from './enrollmentView.js';

/** Steps: 'sport' → 'coach' → 'class'. Selections are kept by id so a reload keeps them in sync. */
export function useMemberEnrollment() {
  const { showSuccess, showError } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [sportId, setSportId] = useState(null);
  const [coachId, setCoachId] = useState(null);
  const [pendingClass, setPendingClass] = useState(null); // class awaiting confirmation
  const [pendingCancel, setPendingCancel] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const initialAutoNavigatedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setOptions(await classApi.getEnrollmentOptions());
    } catch (error) {
      setLoadError(error?.message || (isEn ? 'Could not load sports.' : 'Không tải được danh sách môn.'));
    } finally {
      setLoading(false);
    }
  }, [isEn]);

  useEffect(() => { load(); }, [load]);

  const sports = useMemo(() => {
    return filterVisibleSports(options?.sports);
  }, [options]);
  const sport = useMemo(() => sports.find(s => s.sportId === sportId) || null, [sports, sportId]);
  const coach = useMemo(() => sport?.coaches.find(c => c.coachId === coachId) || null, [sport, coachId]);
  const step = !sport ? 'sport' : !coach ? 'coach' : 'class';

  // If member already has an enrolled sport & coach (or single available sport), auto-navigate straight to class on initial load
  useEffect(() => {
    if (!options || initialAutoNavigatedRef.current) return;
    initialAutoNavigatedRef.current = true;

    const enrolledSport = sports.find(s => summarizeSport(s).isEnrolled);
    if (enrolledSport) {
      const autoCoach = resolveAutoCoach(enrolledSport);
      if (autoCoach) {
        setSportId(enrolledSport.sportId);
        setCoachId(autoCoach.coachId);
      }
    } else if (sports.length === 1) {
      const singleSport = sports[0];
      const autoCoach = resolveAutoCoach(singleSport);
      setSportId(singleSport.sportId);
      if (autoCoach) setCoachId(autoCoach.coachId);
    }
  }, [options, sports]);

  // A refreshed tree may no longer contain the chosen sport/coach; fall back to the nearest valid step.
  useEffect(() => {
    if (!options) return;
    if (sportId != null && !sport) { setSportId(null); setCoachId(null); }
    else if (coachId != null && sport && !coach) setCoachId(null);
  }, [options, sportId, sport, coachId, coach]);

  const chooseSport = useCallback((id) => {
    setSportId(id);
    const selectedSport = sports.find(s => s.sportId === id);
    const autoCoach = resolveAutoCoach(selectedSport);
    setCoachId(autoCoach ? autoCoach.coachId : null);
  }, [sports]);

  const chooseCoach = useCallback((id) => setCoachId(id), []);

  const goToStep = useCallback((target) => {
    if (target === 'sport') { setSportId(null); setCoachId(null); }
    if (target === 'coach') setCoachId(null);
  }, []);

  const confirmEnroll = async () => {
    if (!pendingClass?.eligibleSubscriptionId) return;
    setSubmitting(true);
    try {
      await classApi.enroll(pendingClass.classId, pendingClass.eligibleSubscriptionId);
      showSuccess(isEn
        ? `Enrolled in ${pendingClass.name}. Your sessions now appear in the class schedule.`
        : `Đã đăng ký lớp ${pendingClass.name}. Buổi học sẽ hiển thị trong Lịch lớp.`);
      setPendingClass(null);
      await load();
    } catch (error) {
      showError(enrollmentErrorMessage(error, isEn));
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const confirmCancel = async reason => {
    if (!pendingCancel) return;
    setSubmitting(true);
    try {
      await classApi.cancelEnrollment(pendingCancel.classId, pendingCancel.enrollmentId, reason);
      showSuccess(isEn ? `Cancelled ${pendingCancel.name}.` : `Đã hủy đăng ký lớp ${pendingCancel.name}.`);
      setPendingCancel(null);
      await load();
    } catch (error) {
      showError(enrollmentErrorMessage(error, isEn));
    } finally {
      setSubmitting(false);
    }
  };

  return {
    isEn, loading, loadError, reload: load, options, sports, sport, coach, step,
    chooseSport, chooseCoach, goToStep,
    pendingClass, setPendingClass, confirmEnroll,
    pendingCancel, setPendingCancel, confirmCancel, submitting
  };
}
