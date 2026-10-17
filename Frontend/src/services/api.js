import { apiRequest } from './http.js';

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
      sessionId: data.sessionId ? Number(data.sessionId) : null
    }
  }),
  takeAttendance: (sessionId, _className, _coachId, _coachName, records) =>
    apiRequest('coaches/me/sessions/'+sessionId+'/attendance', { method: 'PUT', body: records }),
  getNotifications: () => apiRequest('coaches/me/notifications'),
  sendNotification: data => apiRequest('coaches/me/notifications', {
    method: 'POST', body: {
      classId: data.classId ? Number(data.classId) : null,
      memberId: data.memberId ? Number(data.memberId) : null,
      title: data.title,
      content: data.content
    }
  }),
  getAIRecommendation: data => apiRequest('ai/recommendations', {
    method: 'POST', body: {
      classId: Number(data.classId), memberId: Number(data.memberId),
      fitnessGoal: data.fitnessGoal, currentLevel: data.currentLevel, notes: data.notes || null
    }
  })
};

export const coachProfessionalApi = {
  getWorkspace: ({ from, to } = {}) => {
    const query = new URLSearchParams();
    if (from) query.set('from', from);
    if (to) query.set('to', to);
    return apiRequest(`coaches/me/professional${query.size ? `?${query}` : ''}`);
  },
  getKpi: (year, month) => apiRequest(`coaches/me/kpi?year=${year}&month=${month}`),
  createEvent: body => apiRequest('coaches/me/work-events', { method: 'POST', body }),
  changeEvent: (id, status, reason = null) => apiRequest(`coaches/me/work-events/${id}/status`, { method: 'PATCH', body: { status, reason } }),
  requestLeave: body => apiRequest('coaches/me/leave-requests', { method: 'POST', body }),
  saveHealthRecord: body => apiRequest('coaches/me/member-health-records', { method: 'POST', body }),
  saveExercise: body => apiRequest('coaches/me/exercises', { method: 'POST', body }),
  saveHomework: body => apiRequest('coaches/me/homework', { method: 'POST', body }),
  reviewHomework: (id, body) => apiRequest(`coaches/me/homework-submissions/${id}`, { method: 'PATCH', body }),
  saveNutrition: body => apiRequest('coaches/me/nutrition-plans', { method: 'POST', body }),
  getMessages: (coachId, memberId) => apiRequest(`coaches/me/members/${memberId}/messages?coachId=${coachId}`),
  sendMessage: body => apiRequest('coaches/me/messages', { method: 'POST', body }),
  broadcast: body => apiRequest('coaches/me/broadcasts', { method: 'POST', body }),
  bookResource: body => apiRequest('coaches/me/resource-bookings', { method: 'POST', body }),
  cancelResource: id => apiRequest(`coaches/me/resource-bookings/${id}`, { method: 'DELETE' }),
  reportIssue: body => apiRequest('coaches/me/equipment-issues', { method: 'POST', body })
};

export const memberCoachApi = {
  getPortal: () => apiRequest('members/me/coach-portal'),
  respondEvent: (id, status, reason = null) => apiRequest(`members/me/coach-events/${id}/status`, { method: 'PATCH', body: { status, reason } }),
  submitHomework: (id, content) => apiRequest(`members/me/homework/${id}/submission`, { method: 'POST', body: { content } }),
  addFoodDiary: body => apiRequest('members/me/food-diary', { method: 'POST', body }),
  reviewCoach: body => apiRequest('members/me/coach-reviews', { method: 'POST', body }),
  getMessages: (coachId, memberId) => apiRequest(`members/me/coaches/${coachId}/messages?memberId=${memberId}`),
  sendMessage: body => apiRequest('members/me/coach-messages', { method: 'POST', body })
};

export const managerCoachApi = {
  getWorkspace: () => apiRequest('manager/coach-operations'),
  reviewLeave: (id, body) => apiRequest(`manager/coach-operations/leaves/${id}`, { method: 'PATCH', body }),
  saveCompensation: body => apiRequest('manager/coach-operations/compensation', { method: 'POST', body }),
  saveSalesCredit: body => apiRequest('manager/coach-operations/sales-credits', { method: 'POST', body }),
  createResource: body => apiRequest('manager/coach-operations/resources', { method: 'POST', body }),
  resolveIssue: (id, body) => apiRequest(`manager/coach-operations/equipment-issues/${id}`, { method: 'PATCH', body })
};

export const notificationApi = {
  getMine: () => apiRequest('notifications/me'),
  markRead: id => apiRequest('notifications/'+id+'/read', { method: 'PUT' }),
  markAllRead: () => apiRequest('notifications/me/read-all', { method: 'PUT' })
};

export const supportApi = {
  getMine: ({ status = '', page = 1 } = {}) => {
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (status) params.set('status', status);
    return apiRequest(`support-requests/me?${params.toString()}`);
  },
  get: id => apiRequest(`support-requests/me/${Number(id)}`),
  submit: ({ subject, description, priority }) => apiRequest('support-requests/me', {
    method: 'POST', body: { subject: subject.trim(), description: description.trim(), priority }
  }),
  reply: (id, message) => apiRequest(`support-requests/me/${Number(id)}/messages`, {
    method: 'POST', body: { message: message.trim() }
  })
};

export const aiApi = {
  chat: (message, conversationId = null) => apiRequest('ai/chat', { method: 'POST', body: { message, conversationId } }),
  getMessages: id => apiRequest('ai/conversations/'+id+'/messages')
};

export { roomApi, authApi, packageApi, classApi, bookingApi, receptionApi, memberApi, staffApi, reportApi, systemApi } from './backendApi.js';

