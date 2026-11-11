import { apiRequest } from '../../../shared/api/http.js';

function planRequest(plan) {
  return {
    classId: Number(plan.classId), memberId: plan.memberId ? Number(plan.memberId) : null,
    title: plan.title, goal: plan.goal || null, startDate: plan.startDate,
    endDate: plan.endDate || null, fitnessCondition: plan.fitnessCondition || null,
    exercises: plan.exercises.map(ex => ({
      name: ex.name,
      sets: String(ex.sets || ''),
      reps: String(ex.reps || ''),
      note: ex.note || null,
      weekNumber: ex.weekNumber ? Number(ex.weekNumber) : null,
      dayOfWeek: ex.dayOfWeek || null
    }))
  };
}

export const coachApi = {
  getClassMembers: sessionId => apiRequest('coaches/me/sessions/'+sessionId+'/members'),
  getMembersForClass: classId => apiRequest('coaches/me/classes/'+classId+'/members'),
  getAIContext: (classId, memberId) => apiRequest(`coaches/me/classes/${classId}/members/${memberId}/ai-context`),
  updateMemberBiometrics: (classId, memberId, data) => apiRequest(`coaches/me/classes/${classId}/members/${memberId}/biometrics`, {
    method: 'PUT', body: {
      heightCm: data.heightCm === '' || data.heightCm == null ? null : Number(data.heightCm),
      weightKg: data.weightKg === '' || data.weightKg == null ? null : Number(data.weightKg),
      medicalNote: data.medicalNote?.trim() || null
    }
  }),
  getCoachClassesAndMembers: () => apiRequest('coaches/me/classes'),
  getTrainingPlans: () => apiRequest('coaches/me/training-plans'),
  createTrainingPlan: plan => apiRequest('coaches/me/training-plans', { method: 'POST', body: planRequest({ ...plan, memberId: null }) }),
  savePersonalTrainingPlan: plan => apiRequest('coaches/me/personal-training-plans', { method: 'PUT', body: planRequest(plan) }),
  async deletePersonalTrainingPlan(classId, memberId) {
    const plans = await this.getTrainingPlans();
    const plan = plans.find(p => Number(p.classId) === Number(classId) && Number(p.memberId) === Number(memberId) && p.isCustom);
    if (!plan) throw new Error('Không tìm thấy giáo án riêng. Vui lòng tải lại dữ liệu.');
    return this.deleteTrainingPlan(plan.id);
  },
  deleteTrainingPlan: id => apiRequest('coaches/me/training-plans/'+id, { method: 'DELETE' }),
  getProgress: () => apiRequest('coaches/me/progress'),
  recordWorkoutProgress: data => apiRequest('coaches/me/progress', {
    method: 'POST', body: {
      classId: Number(data.classId), memberId: Number(data.memberId),
      weight: data.weight ?? null, bodyFat: data.bodyFat ?? null, muscleMass: data.muscleMass ?? null,
      workoutResult: data.workoutResult, coachFeedback: data.coachFeedback || null, date: data.date || null,
      sessionId: data.sessionId ? Number(data.sessionId) : null,
      notifyMember: data.notifyMember !== false
    }
  }),
  takeAttendance: (sessionId, _className, _coachId, _coachName, records) =>
    apiRequest('coaches/me/sessions/'+sessionId+'/attendance', { method: 'PUT', body: records }),
  getNotifications: () => apiRequest('coaches/me/notifications'),
  sendNotification: data => apiRequest('coaches/me/notifications', {
    method: 'POST', body: {
      classId: data.classId ? Number(data.classId) : null,
      memberId: data.memberId ? Number(data.memberId) : null,
      classIds: Array.isArray(data.classIds) ? data.classIds.map(Number) : null,
      title: data.title,
      content: data.content
    }
  }),
  getAIRecommendation: data => apiRequest('ai/recommendations', {
    method: 'POST', body: {
      classId: Number(data.classId), memberId: Number(data.memberId),
      fitnessGoal: data.fitnessGoal, currentLevel: data.currentLevel, notes: data.notes || null,
      subjectiveTags: Array.isArray(data.subjectiveTags) ? data.subjectiveTags : []
    }
  })
};
