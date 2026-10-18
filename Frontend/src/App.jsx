import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { ProtectedRoute, RoleGuard } from './components/auth/RoleGuard.js';
import { AppLayout } from './components/layout/AppLayout.js';

// Public & Auth Pages (Lazy Loaded)
const LandingPage = lazy(() => import('./features/landing/LandingPage.js').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./features/auth/LoginPage.js').then(m => ({ default: m.LoginPage })));

// Manager Pages (Lazy Loaded)
const ManagerDashboard = lazy(() => import('./features/manager/ManagerDashboard.js').then(m => ({ default: m.ManagerDashboard })));
const StaffManagement = lazy(() => import('./features/manager/StaffManagement.js').then(m => ({ default: m.StaffManagement })));
const MemberManagement = lazy(() => import('./features/manager/MemberManagement.jsx').then(m => ({ default: m.MemberManagement })));
const PackageManagement = lazy(() => import('./features/manager/PackageManagement.js').then(m => ({ default: m.PackageManagement })));
const ClassesAndRooms = lazy(() => import('./features/manager/ClassesAndRooms.js').then(m => ({ default: m.ClassesAndRooms })));
const CoachAssignment = lazy(() => import('./features/manager/CoachAssignment.js').then(m => ({ default: m.CoachAssignment })));
const ReportsAnalytics = lazy(() => import('./features/manager/ReportsAnalytics.js').then(m => ({ default: m.ReportsAnalytics })));
const RolesPermissions = lazy(() => import('./features/manager/RolesPermissions.js').then(m => ({ default: m.RolesPermissions })));
const AuditLogs = lazy(() => import('./features/manager/AuditLogs.js').then(m => ({ default: m.AuditLogs })));
const HomeContentManagement = lazy(() => import('./features/manager/HomeContentManagement.jsx').then(m => ({ default: m.HomeContentManagement })));

// Receptionist Pages (Lazy Loaded)
const ReceptionistDashboard = lazy(() => import('./features/receptionist/ReceptionistDashboard.js').then(m => ({ default: m.ReceptionistDashboard })));
const MemberLookup = lazy(() => import('./features/receptionist/MemberLookup.js').then(m => ({ default: m.MemberLookup })));
const CounterMembership = lazy(() => import('./features/receptionist/CounterMembership.js').then(m => ({ default: m.CounterMembership })));
const MemberCheckIn = lazy(() => import('./features/receptionist/MemberCheckIn.js').then(m => ({ default: m.MemberCheckIn })));
const CounterBooking = lazy(() => import('./features/receptionist/CounterBooking.jsx').then(m => ({ default: m.CounterBooking })));
const CounterInvoices = lazy(() => import('./features/receptionist/CounterInvoices.jsx').then(m => ({ default: m.CounterInvoices })));
const SupportRequests = lazy(() => import('./features/receptionist/SupportRequests.jsx').then(m => ({ default: m.SupportRequests })));

// Coach Pages (Lazy Loaded)
const CoachDashboard = lazy(() => import('./features/coach/CoachDashboard.js').then(m => ({ default: m.CoachDashboard })));
const TeachingSchedule = lazy(() => import('./features/coach/TeachingSchedule.js').then(m => ({ default: m.TeachingSchedule })));
const ClassMembers = lazy(() => import('./features/coach/ClassMembers.js').then(m => ({ default: m.ClassMembers })));
const Attendance = lazy(() => import('./features/coach/Attendance.js').then(m => ({ default: m.Attendance })));
const TrainingPlan = lazy(() => import('./features/coach/TrainingPlan.js').then(m => ({ default: m.TrainingPlan })));
const WorkoutProgress = lazy(() => import('./features/coach/WorkoutProgress.js').then(m => ({ default: m.WorkoutProgress })));
const CoachNotifications = lazy(() => import('./features/coach/CoachNotifications.js').then(m => ({ default: m.CoachNotifications })));
const AIRecommendation = lazy(() => import('./features/coach/AIRecommendation.js').then(m => ({ default: m.AIRecommendation })));
const CoachSalaryKPI = lazy(() => import('./features/coach/CoachSalaryKPI.jsx').then(m => ({ default: m.CoachSalaryKPI })));
const CoachResources = lazy(() => import('./features/coach/CoachResources.jsx').then(m => ({ default: m.CoachResources })));
const CoachProfessionalHub = lazy(() => import('./features/coach/CoachProfessionalHub.jsx').then(m => ({ default: m.CoachProfessionalHub })));
const ManagerCoachOperations = lazy(() => import('./features/manager/ManagerCoachOperations.jsx').then(m => ({ default: m.ManagerCoachOperations })));

// Member Pages (Lazy Loaded)
const MemberDashboard = lazy(() => import('./features/member/MemberDashboard.js').then(m => ({ default: m.MemberDashboard })));
const MemberPackages = lazy(() => import('./features/member/MemberPackages.js').then(m => ({ default: m.MemberPackages })));
const ClassScheduleView = lazy(() => import('./features/member/ClassScheduleView.js').then(m => ({ default: m.ClassScheduleView })));
const MyBookings = lazy(() => import('./features/member/MyBookings.js').then(m => ({ default: m.MyBookings })));
const MyProgress = lazy(() => import('./features/member/MyProgress.js').then(m => ({ default: m.MyProgress })));
const MyAttendance = lazy(() => import('./features/member/MyAttendance.jsx').then(m => ({ default: m.MyAttendance })));
const MemberNotifications = lazy(() => import('./features/member/MemberNotifications.jsx').then(m => ({ default: m.MemberNotifications })));
const MemberAIAssistant = lazy(() => import('./features/member/MemberAIAssistant.js').then(m => ({ default: m.MemberAIAssistant })));
const PaymentResult = lazy(() => import('./features/member/PaymentResult.js').then(m => ({ default: m.PaymentResult })));
const MemberCoachPortal = lazy(() => import('./features/member/MemberCoachPortal.jsx').then(m => ({ default: m.MemberCoachPortal })));
const MySupportRequests = lazy(() => import('./features/shared/MySupportRequests.jsx').then(m => ({ default: m.MySupportRequests })));

function RouteFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-8">
      <div className="flex items-center gap-2.5 text-slate-500 text-sm font-medium">
        <span className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        <span>Đang tải màn hình...</span>
      </div>
    </div>
  );
}

function getRouteHash() {
  const hash = window.location.hash || '';
  if (hash && hash !== '#/' && hash !== '#/payment-result') return hash;
  if (window.location.pathname === '/payment-result') return '#/payment-result';
  return hash || '#/';
}

function AppRouter() {
  const { initializing, initializationError } = useAuth();
  const [currentHash, setCurrentHash] = useState(getRouteHash);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#/';
      setCurrentHash(hash);
      
      const cleanAnchor = hash.replace(/^#\/?/, '').split('?')[0];
      const targetElement = document.getElementById(cleanAnchor);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      } else if (!cleanAnchor.includes('co-so-vat-chat') && !cleanAnchor.includes('khoa-hoc') && !cleanAnchor.includes('ve-chung-toi')) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // A protected route can redirect before this listener is installed on reload.
    setCurrentHash(getRouteHash());
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const path = currentHash.split('?')[0];
  if (initializing) return <div role="status" className="p-8 text-center">Đang xác thực phiên đăng nhập...</div>;
  if (initializationError) return <div role="alert" className="p-8 text-center text-red-700">
    <p>{initializationError}</p>
    <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 rounded border">Thử lại</button>
  </div>;

  // Helper bọc layout & guard cho role Manager & Admin/SystemAdmin
  const renderManagerRoute = (Component, requiredCapability) => (
    <AppLayout currentPath={path}>
      <ProtectedRoute>
        <RoleGuard allowedRoles={['MANAGER', 'ADMIN', 'SYSTEMADMIN']} requiredCapability={requiredCapability}>
          <Component />
        </RoleGuard>
      </ProtectedRoute>
    </AppLayout>
  );

  // Helper bọc layout & guard cho role Receptionist (Manager & Admin cũng có quyền xem)
  const renderReceptionistRoute = (Component, requiredCapability) => (
    <AppLayout currentPath={path}>
      <ProtectedRoute>
        <RoleGuard allowedRoles={['RECEPTIONIST', 'MANAGER', 'ADMIN', 'SYSTEMADMIN']} requiredCapability={requiredCapability}>
          <Component />
        </RoleGuard>
      </ProtectedRoute>
    </AppLayout>
  );

  // Helper bọc layout & guard cho role Coach (Manager & Admin cũng có quyền xem)
  const renderCoachRoute = (Component, requiredCapability) => (
    <AppLayout currentPath={path}>
      <ProtectedRoute>
        <RoleGuard allowedRoles={['COACH', 'MANAGER', 'ADMIN', 'SYSTEMADMIN']} requiredCapability={requiredCapability}>
          <Component />
        </RoleGuard>
      </ProtectedRoute>
    </AppLayout>
  );

  // Helper bọc layout & guard cho role Member (Manager & Admin cũng có quyền xem)
  const renderMemberRoute = (Component, requiredCapability) => (
    <AppLayout currentPath={path}>
      <ProtectedRoute>
        <RoleGuard allowedRoles={['MEMBER', 'MANAGER', 'ADMIN', 'SYSTEMADMIN']} requiredCapability={requiredCapability}>
          <Component />
        </RoleGuard>
      </ProtectedRoute>
    </AppLayout>
  );

  // Check if route is a dashboard or auth route
  const isDashboardOrAuth =
    path.startsWith('#/manager') ||
    path.startsWith('#/receptionist') ||
    path.startsWith('#/coach') ||
    path.startsWith('#/member') ||
    path === '#/login' ||
    path === '#/register' ||
    path === '#/payment-result';

  const renderRouteContent = () => {
    if (!isDashboardOrAuth) {
      return <LandingPage />;
    }

    // Điều hướng chính xác theo hash
    switch (path) {
      // PUBLIC & AUTH ROUTES
      case '#/login':
      case '#/register':
        return <LoginPage />;
      case '#/payment-result':
        return <PaymentResult />;

      // MANAGER ROUTES (8 chức năng)
      case '#/manager/dashboard':
        return renderManagerRoute(ManagerDashboard);
      case '#/manager/members':
        return renderManagerRoute(MemberManagement, 'lookup_member');
      case '#/manager/staff':
        return renderManagerRoute(StaffManagement, 'manage_staff');
      case '#/manager/packages':
        return renderManagerRoute(PackageManagement, 'manage_packages');
      case '#/manager/classes-rooms':
        return renderManagerRoute(ClassesAndRooms, 'manage_classes');
      case '#/manager/coach-assignment':
        return renderManagerRoute(CoachAssignment, 'assign_coach');
      case '#/manager/reports':
        return renderManagerRoute(ReportsAnalytics, 'view_reports');
      case '#/manager/roles-permissions':
        return renderManagerRoute(RolesPermissions, 'manage_roles');
      case '#/manager/audit-logs':
        return renderManagerRoute(AuditLogs, 'view_audit_logs');
      case '#/manager/home-content':
        return renderManagerRoute(HomeContentManagement, 'manage_landing_content');
      case '#/manager/coach-operations':
        return renderManagerRoute(ManagerCoachOperations, 'manage_coach_operations');

      // RECEPTIONIST ROUTES (4 chức năng)
      case '#/receptionist/dashboard':
        return renderReceptionistRoute(ReceptionistDashboard);
      case '#/receptionist/lookup':
        return renderReceptionistRoute(MemberLookup, 'lookup_member');
      case '#/receptionist/counter-register':
        return renderReceptionistRoute(CounterMembership, 'register_counter_package');
      case '#/receptionist/bookings':
        return renderReceptionistRoute(CounterBooking, 'lookup_member');
      case '#/receptionist/check-in':
        return renderReceptionistRoute(MemberCheckIn, 'checkin_member');
      case '#/receptionist/invoices':
        return renderReceptionistRoute(CounterInvoices, 'register_counter_package');
      case '#/receptionist/support':
        return renderReceptionistRoute(SupportRequests, 'lookup_member');
      case '#/member/support':
      case '#/coach/support':
        return <AppLayout currentPath={path}><ProtectedRoute><RoleGuard allowedRoles={['MEMBER', 'COACH']}><MySupportRequests /></RoleGuard></ProtectedRoute></AppLayout>;

      // COACH ROUTES (8 chức năng)
      case '#/coach/dashboard':
        return renderCoachRoute(CoachDashboard);
      case '#/coach/schedule':
        return renderCoachRoute(TeachingSchedule, 'view_teaching_schedule');
      case '#/coach/members':
        return renderCoachRoute(ClassMembers, 'view_teaching_schedule');
      case '#/coach/attendance':
        return renderCoachRoute(Attendance, 'take_attendance');
      case '#/coach/training-plan':
        return renderCoachRoute(TrainingPlan, 'create_training_plan');
      case '#/coach/progress':
        return renderCoachRoute(WorkoutProgress, 'create_training_plan');
      case '#/coach/notifications':
        return renderCoachRoute(CoachNotifications, 'view_teaching_schedule');
      case '#/coach/ai-recommendation':
        return renderCoachRoute(AIRecommendation, 'get_ai_recommendation');
      case '#/coach/salary-kpi':
      case '#/coach/kpi':
        return renderCoachRoute(CoachSalaryKPI, 'manage_coach_workspace');
      case '#/coach/resources':
      case '#/coach/equipment':
        return renderCoachRoute(CoachResources, 'manage_coach_workspace');
      case '#/coach/professional':
        return renderCoachRoute(CoachSalaryKPI, 'manage_coach_workspace');

      // MEMBER ROUTES
      case '#/member/dashboard':
        return renderMemberRoute(MemberDashboard);
      case '#/member/packages':
        return renderMemberRoute(MemberPackages);
      case '#/member/schedule':
        return renderMemberRoute(ClassScheduleView, 'book_class');
      case '#/member/bookings':
        return renderMemberRoute(MyBookings, 'book_class');
      case '#/member/progress':
        return renderMemberRoute(MyProgress, 'view_my_progress');
      case '#/member/attendance':
        return renderMemberRoute(MyAttendance, 'book_class');
      case '#/member/notifications':
        return renderMemberRoute(MemberNotifications);
      case '#/member/ai-assistant':
        return renderMemberRoute(MemberAIAssistant, 'ask_ai_assistant');
      case '#/member/coach-portal':
        return renderMemberRoute(MemberCoachPortal, 'use_coach_portal');

      // 404 NOT FOUND ROUTE
      default:
        return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[36px]">travel_explore</span>
              </div>
              <h1 className="font-chivo text-2xl font-black text-slate-900">404 - KHÔNG TÌM THẤY TRANG</h1>
              <p className="text-xs text-slate-500 mt-2">
                Đường dẫn <code className="bg-slate-100 text-red-600 px-1.5 py-0.5 rounded">{path}</code> không tồn tại trên hệ thống SCMS.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <a
                  href="#/"
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-chivo font-bold text-xs uppercase tracking-wider transition-colors shadow"
                >
                  Về Trang Chủ SCMS
                </a>
                <a
                  href="#/login"
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-chivo font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Đến Trang Đăng Nhập
                </a>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <Suspense fallback={<RouteFallback />}>
      {renderRouteContent()}
    </Suspense>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}
