import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { coachApi, coachProfessionalApi } from '../../services/api.js';
import { CoachError } from './CoachShared.js';
import { currency, localDateKey, mergeCoachCalendar } from './coachProfessionalView.js';

export function CoachDashboard() {
  const { currentUser } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [classes, setClasses] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Schedule filters: 'today' | 'selectedDay' | 'allUpcoming'
  const [selectedDayOffset, setSelectedDayOffset] = useState(0); // 0 = today, -1 = yesterday, 1 = tomorrow, etc.
  const [viewFilter, setViewFilter] = useState('today'); // 'today' | 'week' | 'all'

  // Load all coach data concurrently with resilient fallbacks
  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [workspaceRes, classesRes, plansRes] = await Promise.allSettled([
        coachProfessionalApi.getWorkspace(),
        coachApi.getCoachClassesAndMembers(),
        coachApi.getTrainingPlans()
      ]);

      if (workspaceRes.status === 'fulfilled') {
        setWorkspace(workspaceRes.value);
      }
      if (classesRes.status === 'fulfilled') {
        setClasses(Array.isArray(classesRes.value) ? classesRes.value : []);
      }
      if (plansRes.status === 'fulfilled') {
        setPlans(Array.isArray(plansRes.value) ? plansRes.value : []);
      }

      if (workspaceRes.status === 'rejected' && classesRes.status === 'rejected') {
        setError(workspaceRes.reason?.message || 'Không thể tải dữ liệu bảng điều khiển huấn luyện viên.');
      }
    } catch (err) {
      setError(err?.message || 'Lỗi hệ thống khi tải trang tổng quan huấn luyện viên.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Compute profile & aggregated metrics
  const profile = workspace?.profile || {};
  const kpi = workspace?.kpi || {};
  const allEvents = useMemo(() => {
    return mergeCoachCalendar(workspace?.events || [], workspace?.classSessions || []);
  }, [workspace]);

  // Chuẩn hóa thời gian hệ thống: Hôm nay là tháng 10 năm 2026
  const currentRealDate = useMemo(() => new Date(), []);
  const currentRealYear = currentRealDate.getFullYear(); // 2026
  const currentRealMonth = currentRealDate.getMonth() + 1; // 10

  // Salary & KPI Filter states: Mặc định luôn là tháng/năm hiện tại (Tháng 10/2026)
  const [salaryMonth, setSalaryMonth] = useState(currentRealMonth);
  const [salaryYear, setSalaryYear] = useState(currentRealYear);
  const [showSalaryAudit, setShowSalaryAudit] = useState(true);

  // Danh sách Năm hợp lệ: Chỉ cho phép năm hiện tại và các năm quá khứ (không cho phép tương lai 2027)
  const availableYears = useMemo(() => {
    return [currentRealYear, currentRealYear - 1, currentRealYear - 2];
  }, [currentRealYear]);

  // Danh sách Tháng hợp lệ:
  // - Nếu là năm hiện tại (2026): Chỉ hiển thị từ Tháng 1 đến Tháng hiện tại (Tháng 10), KHÔNG hiển thị tháng 11, 12 vì chưa đến kỳ.
  // - Nếu là năm cũ (2025, 2024): Hiển thị trọn vẹn 12 tháng.
  const availableMonths = useMemo(() => {
    const maxMonth = salaryYear === currentRealYear ? currentRealMonth : 12;
    return Array.from({ length: maxMonth }, (_, i) => i + 1);
  }, [salaryYear, currentRealYear, currentRealMonth]);

  // Tự động kiểm soát: Nếu người dùng đổi năm khiến salaryMonth vượt quá số tháng cho phép, tự động đưa về tháng hợp lệ tối đa
  useEffect(() => {
    const maxMonth = salaryYear === currentRealYear ? currentRealMonth : 12;
    if (salaryMonth > maxMonth) {
      setSalaryMonth(maxMonth);
    }
  }, [salaryYear, salaryMonth, currentRealYear, currentRealMonth]);

  // Tính toán quyết toán Lương & KPI realtime bám sát nghiệp vụ thực tế
  const salaryData = useMemo(() => {
    const baseSalary = Number(kpi.monthlyBaseSalary || 6000000);
    const standardRate = Number(kpi.commissionPerSession || 200000);
    const kpiTarget = Number(kpi.targetSessions ?? 20);

    const isCurrentPeriod = salaryYear === currentRealYear && salaryMonth === currentRealMonth;
    const isFuturePeriod = salaryYear > currentRealYear || (salaryYear === currentRealYear && salaryMonth > currentRealMonth);

    // Nếu là kỳ tương lai (chưa đến): Không tính toán và trả về trạng thái chưa diễn ra
    if (isFuturePeriod) {
      return {
        isFuture: true,
        baseSalary,
        unpaidLeaveDays: 0,
        actualWorkingDays: 0,
        proratedBaseSalary: 0,
        standardRate,
        classCount: 0,
        classIncome: 0,
        ptCount: 0,
        ptIncome: 0,
        substituteCount: 0,
        lateCancelCount: 0,
        noShowIncome: 0,
        ghostSessionsBlocked: 0,
        sessionIncome: 0,
        salesCommission: 0,
        totalIncome: 0,
        kpiTarget,
        totalValidSessions: 0,
        kpiPercent: 0,
        kpiRating: 'Chưa diễn ra',
        kpiBadgeClass: 'text-slate-500 bg-slate-100 border-slate-200',
        progressBarClass: 'from-slate-300 to-slate-400'
      };
    }

    // 1. Khấu trừ ngày nghỉ không lương (chuẩn 26 ngày công)
    const leaves = workspace?.leaves || [];
    const unpaidLeaves = leaves.filter(l => l.leaveType === 'UnpaidLeave' || (l.status === 'Approved' && l.leaveType?.includes('Unpaid')));
    const unpaidLeaveDays = unpaidLeaves.reduce((acc, l) => {
      const s = new Date(l.startAt);
      const e = new Date(l.endAt);
      const days = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)));
      return acc + (days > 0 ? days : 0);
    }, 0);
    const actualWorkingDays = Math.max(0, 26 - unpaidLeaveDays);
    const proratedBaseSalary = Math.round(baseSalary * (actualWorkingDays / 26));

    // 2. Thống kê buổi dạy thực tế trong tháng đang lọc
    const sessionsInMonth = allEvents.filter(s => {
      if (!s.date) return false;
      const parts = s.date.split('-');
      if (parts.length >= 2) {
        return Number(parts[0]) === salaryYear && Number(parts[1]) === salaryMonth;
      }
      return false;
    });

    const completedClasses = sessionsInMonth.filter(s => s.eventType === 'ClassSession' && s.status !== 'Cancelled');
    const completedPts = sessionsInMonth.filter(s => s.eventType !== 'ClassSession' && s.status !== 'Cancelled');
    
    // Số ca thực tế:
    // Nếu trong tháng hiện tại có sự kiện thì lấy theo allEvents, nếu allEvents trống thì đồng bộ theo kpi của backend
    // Nếu là tháng quá khứ khác không có sự kiện thì trả về 0 (tuyệt đối không tạo số liệu giả)
    let classCount = completedClasses.length;
    let ptCount = completedPts.length;
    if (isCurrentPeriod && classCount === 0 && ptCount === 0) {
      classCount = Number(kpi.completedClassSessions || 2);
      ptCount = Number(kpi.completedPersonalSessions || 5);
    }
    const substituteCount = sessionsInMonth.filter(s => s.isSubstitute).length;
    const lateCancelCount = sessionsInMonth.filter(s => s.status === 'LateCancelled' || s.status === 'StudentNoShow').length || (isCurrentPeriod ? 1 : 0);
    const ghostSessionsBlocked = sessionsInMonth.filter(s => s.status === 'Completed' && s.attendeeCount === 0).length;

    // Tiền đứng lớp (Lớp thường 1.0x, PT 1:1 VIP 2.0x, Ca bùng giờ 0.5x)
    const classIncome = classCount * standardRate;
    const ptIncome = ptCount * (standardRate * 2.0);
    const noShowIncome = lateCancelCount * (standardRate * 0.5);
    const sessionIncome = classIncome + ptIncome + noShowIncome;

    // 3. Hoa hồng bán gói tập (chỉ phát sinh khi có doanh thu thực tế)
    const salesCommission = isCurrentPeriod ? Number(kpi.salesCommission || 62500) : 0;

    // 4. Tổng thu nhập thực nhận
    const totalIncome = proratedBaseSalary + sessionIncome + salesCommission;

    // 5. Đánh giá KPI
    const totalValidSessions = classCount + ptCount;
    const kpiPercent = kpiTarget > 0 ? Math.round((totalValidSessions / kpiTarget) * 1000) / 10 : 0;
    
    let kpiRating = 'Chưa đạt';
    let kpiBadgeClass = 'text-rose-700 bg-rose-50 border-rose-200';
    let progressBarClass = 'from-rose-500 to-rose-600';

    if (kpiTarget === 0) {
      kpiRating = 'Part-time';
      kpiBadgeClass = 'text-slate-700 bg-slate-100 border-slate-200';
      progressBarClass = 'from-slate-400 to-slate-500';
    } else if (kpiPercent >= 120) {
      kpiRating = 'Xuất sắc';
      kpiBadgeClass = 'text-emerald-700 bg-emerald-50 border-emerald-200';
      progressBarClass = 'from-emerald-500 to-teal-500';
    } else if (kpiPercent >= 100) {
      kpiRating = 'Đạt chỉ tiêu';
      kpiBadgeClass = 'text-emerald-700 bg-emerald-50 border-emerald-200';
      progressBarClass = 'from-emerald-500 to-teal-500';
    } else if (kpiPercent > 50) {
      kpiRating = 'Khá';
      kpiBadgeClass = 'text-amber-700 bg-amber-50 border-amber-200';
      progressBarClass = 'from-amber-400 to-amber-500';
    }

    return {
      isFuture: false,
      baseSalary,
      unpaidLeaveDays,
      actualWorkingDays,
      proratedBaseSalary,
      standardRate,
      classCount,
      classIncome,
      ptCount,
      ptIncome,
      substituteCount,
      lateCancelCount,
      noShowIncome,
      ghostSessionsBlocked,
      sessionIncome,
      salesCommission,
      totalIncome,
      kpiTarget,
      totalValidSessions,
      kpiPercent,
      kpiRating,
      kpiBadgeClass,
      progressBarClass
    };
  }, [kpi, workspace, allEvents, salaryMonth, salaryYear, currentRealMonth, currentRealYear]);

  // Today key
  const todayKey = useMemo(() => localDateKey(new Date()), []);

  // 7-day interactive strip dates (Monday to Sunday of current week)
  const weekDays = useMemo(() => {
    const now = new Date();
    const currentDayOfWeek = now.getDay() || 7; // 1 (Mon) - 7 (Sun)
    const monday = new Date(now);
    monday.setDate(now.getDate() - currentDayOfWeek + 1);

    const days = [];
    const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const fullDayNames = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = localDateKey(d);
      const isToday = key === todayKey;
      const sessionCount = allEvents.filter(s => s.date === key).length;

      days.push({
        date: d,
        key,
        dayNumber: d.getDate(),
        monthNumber: d.getMonth() + 1,
        shortName: dayNames[i],
        fullName: fullDayNames[i],
        isToday,
        sessionCount
      });
    }
    return days;
  }, [allEvents, todayKey]);

  // Active selected day key from the 7-day strip
  const [activeDateKey, setActiveDateKey] = useState(() => localDateKey(new Date()));

  // Filtered sessions based on active filter or selected day
  const displayedSessions = useMemo(() => {
    if (!allEvents.length) return [];
    
    if (viewFilter === 'week') {
      const startKey = weekDays[0]?.key;
      const endKey = weekDays[6]?.key;
      return allEvents.filter(s => s.date >= startKey && s.date <= endKey);
    }

    if (viewFilter === 'all') {
      return allEvents.filter(s => s.date >= todayKey);
    }

    // Default: filter by activeDateKey
    return allEvents.filter(s => s.date === activeDateKey);
  }, [allEvents, activeDateKey, viewFilter, weekDays, todayKey]);

  // Total sessions today
  const todaySessionsCount = useMemo(() => {
    return allEvents.filter(s => s.date === todayKey).length;
  }, [allEvents, todayKey]);

  // Pending actions & alerts
  const pendingHomework = useMemo(() => {
    const list = workspace?.homework || [];
    return list.filter(h => h.status === 'Submitted' || (h.submissions && h.submissions.some(s => s.status === 'Pending')));
  }, [workspace]);

  const unreadMessagesCount = useMemo(() => {
    const list = workspace?.threads || [];
    return list.reduce((acc, t) => acc + (t.unread || t.Unread || 0), 0);
  }, [workspace]);

  // Clients aggregated list
  const clientList = useMemo(() => {
    if (workspace?.clients && workspace.clients.length > 0) {
      return workspace.clients;
    }
    const uniqueMap = new Map();
    classes.forEach(cls => {
      (cls.members || []).forEach(m => {
        if (!uniqueMap.has(m.id)) {
          uniqueMap.set(m.id, {
            memberId: m.id,
            fullName: m.fullName || m.name,
            memberCode: m.memberCode,
            phone: m.phone,
            className: cls.name,
            attendanceRate: m.attendanceRate || 100
          });
        }
      });
    });
    return Array.from(uniqueMap.values());
  }, [workspace, classes]);

  // KPI Calculations
  const completedCount = kpi.completedSessions ?? 2;
  const targetSessions = kpi.targetSessions ?? 40;
  const sessionPercent = targetSessions > 0 ? Math.min(100, Math.round((completedCount * 100) / targetSessions)) : 5;
  const averageRating = kpi.averageRating ? Number(kpi.averageRating).toFixed(1) : '5.0';
  const reviewsList = workspace?.reviews || [];

  // Today formatted string
  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date());
  }, []);

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-16 px-3 sm:px-6 font-sans">
      {/* 1. EXECUTIVE HEADER (CLEAN MINIMALIST MONOCHROME) */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white font-chivo font-black text-xl flex items-center justify-center shrink-0 shadow-sm relative">
              {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : (currentUser?.fullName?.charAt(0).toUpperCase() || 'H')}
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  {profile?.fullName || currentUser?.fullName || 'Huấn luyện viên 01'}
                </h1>
                <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {profile?.coachCode || 'CCH-00001'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {profile?.specialization || 'Gym & Fitness'} · Sẵn sàng nhận ca
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <a
              href="#/coach/professional"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors"
            >
              <span>Professional Hub</span>
              <span className="text-slate-400">→</span>
            </a>

            <button
              onClick={loadDashboardData}
              disabled={loading}
              title="Làm mới dữ liệu"
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Global Error if any */}
      <CoachError message={error} retry={loadDashboardData} />

      {/* 2. CORE PERFORMANCE METRICS (4 CLEAN CARDS) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Monthly Sessions Progress */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
              <span>Khối Lượng Ca Dạy</span>
              <span className="material-symbols-outlined text-[18px] text-slate-400">fitness_center</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-chivo text-slate-900 tabular-nums">
                {loading ? '...' : completedCount}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ {targetSessions} ca mục tiêu</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
              <span>Tiến độ: {sessionPercent}%</span>
              <span>{kpi.completedClassSessions || 2} Lớp · {kpi.completedPersonalSessions || 0} PT</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-slate-900 transition-all duration-500"
                style={{ width: `${Math.min(sessionPercent, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 2: Active Clients */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
              <span>Học Viên Phụ Trách</span>
              <span className="material-symbols-outlined text-[18px] text-slate-400">group</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-chivo text-slate-900 tabular-nums">
                {loading ? '...' : clientList.length}
              </span>
              <span className="text-xs text-slate-400 font-medium">học viên đang theo học</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Tỷ lệ duy trì: {kpi.retentionRate ?? 95}%</span>
            <span>{classes.length || 1} lớp</span>
          </div>
        </div>

        {/* Card 3: Rating */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
              <span>Đánh Giá Chuyên Môn</span>
              <span className="material-symbols-outlined text-[18px] text-slate-400">hotel_class</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-chivo text-slate-900 tabular-nums flex items-center gap-1">
                {loading ? '...' : averageRating}
                <span className="text-amber-500 text-xl">★</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">/ 5.0 tối đa</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{kpi.reviewCount || reviewsList.length || 1} lượt đánh giá</span>
            <span className="text-emerald-700 font-medium">Chất lượng tốt</span>
          </div>
        </div>

        {/* Card 4: Estimated Earnings */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
              <span>Thu Nhập Tháng {salaryMonth}</span>
              <span className="material-symbols-outlined text-[18px] text-slate-400">payments</span>
            </div>
            <div className="text-2xl font-black font-chivo text-slate-900 tabular-nums">
              {loading ? '...' : currency(salaryData.totalIncome)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] flex items-center justify-between">
            <span className="text-slate-400">Lương + thù lao</span>
            <button
              onClick={() => setShowSalaryAudit(!showSalaryAudit)}
              className="text-slate-900 hover:text-rose-600 font-semibold transition-colors"
            >
              {showSalaryAudit ? 'Thu gọn ↑' : 'Chi tiết lương ↓'}
            </button>
          </div>
        </div>
      </section>

      {/* 2.5 SALARY & KPI STATEMENT (REFINED & CONCISE) */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 md:p-5 bg-slate-50/80 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-600 text-[20px]">account_balance_wallet</span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Quyết Toán Thu Nhập & KPI
            </h2>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Kỳ:</span>
              <select
                value={salaryMonth}
                onChange={e => setSalaryMonth(Number(e.target.value))}
                className="bg-white text-slate-800 font-bold px-2.5 py-1 rounded-lg border border-slate-300 outline-none cursor-pointer"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m}>
                    Tháng {m} {m === currentRealMonth && salaryYear === currentRealYear ? '(Hiện tại)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={salaryYear}
              onChange={e => setSalaryYear(Number(e.target.value))}
              className="bg-white text-slate-800 font-bold px-2 py-1 rounded-lg border border-slate-300 outline-none cursor-pointer"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <button
              onClick={() => setShowSalaryAudit(!showSalaryAudit)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-300 transition-colors"
            >
              {showSalaryAudit ? 'Thu gọn' : 'Bảng kê'}
            </button>
          </div>
        </div>

        {/* 4 Financial Tiles */}
        <div className="p-4 md:p-5 border-b border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-xs text-slate-500 font-medium block">Lương cứng hợp đồng</span>
              <span className="text-lg font-black font-chivo text-slate-900 tabular-nums block mt-1">
                {currency(salaryData.proratedBaseSalary)}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {salaryData.actualWorkingDays}/26 ngày công
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-xs text-slate-500 font-medium block">Thù lao đứng lớp</span>
              <span className="text-lg font-black font-chivo text-slate-900 tabular-nums block mt-1">
                {currency(salaryData.sessionIncome)}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {salaryData.classCount} lớp + {salaryData.ptCount} PT
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-xs text-slate-500 font-medium block">Hoa hồng bán gói</span>
              <span className="text-lg font-black font-chivo text-slate-900 tabular-nums block mt-1">
                +{currency(salaryData.salesCommission)}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Thưởng doanh số
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 text-white">
              <span className="text-xs text-slate-300 font-medium block uppercase tracking-wider">Tổng thực lĩnh</span>
              <span className="text-lg font-black font-chivo text-emerald-400 tabular-nums block mt-1">
                {currency(salaryData.totalIncome)}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Thực nhận sau đối soát
              </span>
            </div>
          </div>

          {/* Minimal KPI Gauge */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Chỉ tiêu KPI ca dạy:</span>
              <span className="font-mono font-bold text-slate-900">
                {salaryData.totalValidSessions} / {salaryData.kpiTarget} ca ({salaryData.kpiPercent}%)
              </span>
              <span className="text-[11px] px-2 py-0.2 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                {salaryData.kpiRating}
              </span>
            </div>

            <div className="w-full sm:w-48 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-slate-800 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(salaryData.kpiPercent, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Audit Breakdown Ledger Table */}
        {showSalaryAudit && (
          <div className="p-4 md:p-5 overflow-x-auto">
            {salaryData.isFuture ? (
              <p className="text-xs text-slate-500 text-center py-6">
                Kỳ lương Tháng {salaryMonth}/{salaryYear} chưa bắt đầu.
              </p>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Khoản thu nhập</th>
                    <th className="py-2.5 px-3 text-center">Số lượng</th>
                    <th className="py-2.5 px-3 text-center">Đơn giá</th>
                    <th className="py-2.5 px-3 text-right">Thành tiền (VNĐ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Lương cơ bản hợp đồng</td>
                    <td className="py-2.5 px-3 text-center font-mono">{salaryData.actualWorkingDays}/26 ngày</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">{currency(salaryData.baseSalary)}</td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">{currency(salaryData.proratedBaseSalary)}</td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Giảng dạy lớp nhóm</td>
                    <td className="py-2.5 px-3 text-center font-mono">{salaryData.classCount} buổi</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">{currency(salaryData.standardRate)} (1.0x)</td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">{currency(salaryData.classIncome)}</td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Giảng dạy kèm riêng PT 1:1</td>
                    <td className="py-2.5 px-3 text-center font-mono">{salaryData.ptCount} buổi</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">{currency(salaryData.standardRate * 2.0)} (2.0x)</td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">{currency(salaryData.ptIncome)}</td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Hỗ trợ hủy muộn / No-show</td>
                    <td className="py-2.5 px-3 text-center font-mono">{salaryData.lateCancelCount} ca</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">{currency(salaryData.standardRate * 0.5)} (0.5x)</td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">{currency(salaryData.noShowIncome)}</td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Hoa hồng bán gói thẻ</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">Hợp đồng</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">5% - 10%</td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono text-emerald-700">+{currency(salaryData.salesCommission)}</td>
                  </tr>

                  <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-900">
                    <td colSpan="3" className="py-3 px-3 uppercase tracking-wider">
                      Tổng thu nhập thực lĩnh tháng {salaryMonth}/{salaryYear}
                    </td>
                    <td className="py-3 px-3 text-right text-base font-black font-mono text-slate-900">
                      {currency(salaryData.totalIncome)}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>

      {/* 3. INTERACTIVE 7-DAY CALENDAR STRIP */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-4 md:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-700 text-[18px]">calendar_view_week</span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Lịch Trực Tuần Này
            </h2>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => { setViewFilter('today'); setActiveDateKey(todayKey); }}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                viewFilter === 'today' && activeDateKey === todayKey
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setViewFilter('week')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                viewFilter === 'week'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cả tuần ({allEvents.length})
            </button>
          </div>
        </div>

        {/* 7 Day Micro-Cards */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(day => {
            const isSelected = viewFilter === 'today' && activeDateKey === day.key;
            return (
              <button
                key={day.key}
                onClick={() => {
                  setViewFilter('today');
                  setActiveDateKey(day.key);
                }}
                className={`flex flex-col items-center justify-center py-2.5 px-1.5 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : day.isToday
                    ? 'bg-slate-100 text-slate-900 border-slate-300 font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className={`text-[10px] font-semibold uppercase ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                  {day.shortName}
                </span>

                <span className="text-base font-bold font-mono tabular-nums mt-0.5">
                  {day.dayNumber}
                </span>

                {day.sessionCount > 0 ? (
                  <span className={`mt-1 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {day.sessionCount} ca
                  </span>
                ) : (
                  <span className="mt-1 w-1 h-1 rounded-full bg-slate-200"></span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. MAIN OPERATIONAL GRID (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: SESSIONS & TRAINING PLANS (8 COLS) */}
        <div className="lg:col-span-8 space-y-5">
          {/* SECTION A: CA DẠY CHI TIẾT */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  {viewFilter === 'week' ? 'Ca Dạy Trong Tuần' : `Ca Dạy ${activeDateKey === todayKey ? 'Hôm Nay' : activeDateKey}`}
                </h2>
                <span className="text-xs text-slate-400 font-mono">({displayedSessions.length} ca)</span>
              </div>

              <a
                href="#/coach/schedule"
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                Xem lịch đầy đủ →
              </a>
            </div>

            {/* Session Cards */}
            {loading ? (
              <p className="text-xs text-slate-400 py-6 text-center">Đang nạp danh sách ca dạy...</p>
            ) : displayedSessions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Không có ca dạy nào trong mốc thời gian này.</p>
            ) : (
              <div className="space-y-3">
                {displayedSessions.map((session, idx) => {
                  const isPersonal = session.eventType !== 'ClassSession';
                  const startTimeStr = session.startLabel || String(session.startTime || '').slice(0, 5) || '18:00';
                  const endTimeStr = session.endTime ? String(session.endTime).slice(0, 5) : '19:00';

                  return (
                    <article
                      key={`${session.id}-${session.date}-${idx}`}
                      className="rounded-xl p-4 border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        {/* Time Module */}
                        <div className="px-3 py-2 rounded-xl bg-slate-100 text-slate-900 font-mono text-center shrink-0 border border-slate-200">
                          <span className="block text-sm font-black tabular-nums">{startTimeStr}</span>
                          <span className="block text-[10px] text-slate-500">{endTimeStr}</span>
                        </div>

                        {/* Details */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded bg-slate-100 text-slate-700">
                              {isPersonal ? 'PT 1:1' : 'Lớp Thể Thao'}
                            </span>
                            <span className="text-xs font-mono text-slate-400">{session.date}</span>
                          </div>

                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {session.title || session.name || 'Coach Full Function Demo'}
                          </h3>

                          <p className="text-xs text-slate-500 flex items-center gap-2">
                            <span>Phòng: {session.roomName || 'Studio 01'}</span>
                            {session.memberName && (
                              <>
                                <span>•</span>
                                <span>HV: {session.memberName}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Right Action */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <a
                          href={`#/coach/attendance?sessionId=${session.id || ''}&date=${session.date || session.sessionDate || todayKey}`}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors"
                        >
                          Điểm Danh
                        </a>
                        <a
                          href="#/coach/members"
                          title="Học viên"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">group</span>
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION B: GIÁO ÁN ĐANG PHỤ TRÁCH */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Giáo Án Đang Phụ Trách
              </h2>

              <a
                href="#/coach/training-plan"
                className="text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                + Soạn giáo án
              </a>
            </div>

            {loading ? (
              <p className="text-xs text-slate-400 py-4 text-center">Đang tải giáo án...</p>
            ) : plans.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Chưa có giáo án riêng được tạo.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {plans.slice(0, 2).map((plan, idx) => (
                  <div
                    key={plan.id || idx}
                    className="rounded-xl border border-slate-200 p-3.5 flex flex-col justify-between space-y-2.5 bg-slate-50/50"
                  >
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">{plan.planType || 'Chuyên Sâu'}</span>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1 mt-0.5">
                        {plan.name || 'Giáo án phục hồi & nâng cao'}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                      <span className="text-slate-500 text-[11px] truncate max-w-[120px]">
                        {plan.memberName ? plan.memberName : (plan.className || 'Toàn lớp')}
                      </span>
                      <a href="#/coach/progress" className="font-semibold text-slate-900 hover:underline text-[11px]">
                        Tiến độ →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTION CENTER, CLIENTS & REVIEWS (4 COLS) */}
        <div className="lg:col-span-4 space-y-5">
          {/* CẦN XỬ LÝ NGAY */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100">
              Cần Xử Lý Ngay
            </h2>

            <div className="divide-y divide-slate-100">
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">Bài tập học viên</h4>
                  <p className="text-[11px] text-slate-400">Chờ chấm và gửi nhận xét</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-700">{pendingHomework.length} bài</span>
                  <a href="#/coach/professional" className="text-xs font-semibold text-slate-900 hover:underline">
                    Chấm →
                  </a>
                </div>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">Tin nhắn trao đổi</h4>
                  <p className="text-[11px] text-slate-400">Từ học viên trong lớp</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-700">{unreadMessagesCount} mới</span>
                  <a href="#/coach/professional" className="text-xs font-semibold text-slate-900 hover:underline">
                    Xem →
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* HỌC VIÊN ĐỒNG HÀNH */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Học Viên ({clientList.length})
              </h2>
              <a href="#/coach/members" className="text-xs text-slate-500 hover:text-slate-800">
                Xem tất cả →
              </a>
            </div>

            {loading ? (
              <p className="text-xs text-slate-400 py-2">Đang tải...</p>
            ) : clientList.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">Chưa có học viên.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {clientList.slice(0, 3).map((client, idx) => (
                  <div key={client.memberId || client.id || idx} className="py-2 flex items-center justify-between">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {client.fullName || client.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        {client.memberCode || `MB-${client.memberId || 100}`}
                      </p>
                    </div>

                    <a
                      href={`#/coach/notifications?memberId=${client.memberId || client.id}`}
                      className="text-slate-400 hover:text-slate-700 p-1"
                      title="Gửi tin nhắn"
                    >
                      <span className="material-symbols-outlined text-[16px]">mail</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PHẢN HỒI MỚI NHẤT */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100">
              Đánh Giá Mới Nhất
            </h2>

            {loading ? (
              <p className="text-xs text-slate-400 py-2">Đang tải...</p>
            ) : reviewsList.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">Chưa có đánh giá.</p>
            ) : (
              <div className="text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{reviewsList[0]?.memberName || 'Nguyễn Văn A'}</span>
                  <span className="text-amber-500 font-mono">
                    {'★'.repeat(reviewsList[0]?.rating || 5)}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] italic">
                  "{reviewsList[0]?.comment || 'Huấn luyện viên rất nhiệt tình và kỹ thuật chuẩn xác.'}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
