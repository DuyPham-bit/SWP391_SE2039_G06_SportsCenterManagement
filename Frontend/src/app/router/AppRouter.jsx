import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useAuth } from '../providers/AuthContext.jsx';


import { ProtectedRoute, RoleGuard } from '../../shared/components/auth/RoleGuard.jsx';
import { AppLayout } from '../layout/AppLayout.jsx';

// Public & Auth Pages (Lazy Loaded)
const LandingPage = lazy(() => import('../../pages/landing/LandingPage.jsx').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('../../pages/auth/LoginPage.jsx').then(m => ({ default: m.LoginPage })));
const OtpVerification = lazy(() => import('../../shared/components/common/OtpVerification.jsx'));

// Manager Pages (Lazy Loaded)
const ManagerDashboard = lazy(() => import('../../pages/manager/ManagerDashboardPage.jsx').then(m => ({ default: m.ManagerDashboard })));
const StaffManagement = lazy(() => import('../../pages/manager/StaffManagementPage.jsx').then(m => ({ default: m.StaffManagement })));
const MemberManagement = lazy(() => import('../../pages/manager/MemberManagementPage.jsx').then(m => ({ default: m.MemberManagement })));
const PackageManagement = lazy(() => import('../../pages/manager/PackageManagementPage.jsx').then(m => ({ default: m.PackageManagement })));
const ClassesAndRooms = lazy(() => import('../../pages/manager/ClassesAndRoomsPage.jsx').then(m => ({ default: m.ClassesAndRooms })));
const CoachAssignment = lazy(() => import('../../pages/manager/CoachAssignmentPage.jsx').then(m => ({ default: m.CoachAssignment })));
const ReportsAnalytics = lazy(() => import('../../pages/manager/ReportsAnalyticsPage.jsx').then(m => ({ default: m.ReportsAnalytics })));
const RolesPermissions = lazy(() => import('../../pages/manager/RolesPermissionsPage.jsx').then(m => ({ default: m.RolesPermissions })));
const AuditLogs = lazy(() => import('../../pages/manager/AuditLogsPage.jsx').then(m => ({ default: m.AuditLogs })));
const HomeContentManagement = lazy(() => import('../../pages/manager/HomeContentManagementPage.jsx').then(m => ({ default: m.HomeContentManagement })));
const AdminDashboard = lazy(() => import('../../pages/admin/AdminDashboardPage.jsx').then(m => ({ default: m.AdminDashboard })));

// Receptionist Pages (Lazy Loaded)
const ReceptionistDashboard = lazy(() => import('../../pages/receptionist/ReceptionistDashboardPage.jsx').then(m => ({ default: m.ReceptionistDashboard })));
const MemberLookup = lazy(() => import('../../pages/receptionist/MemberLookupPage.jsx').then(m => ({ default: m.MemberLookup })));
const CounterMembership = lazy(() => import('../../pages/receptionist/CounterMembershipPage.jsx').then(m => ({ default: m.CounterMembership })));
const MemberCheckIn = lazy(() => import('../../pages/receptionist/MemberCheckInPage.jsx').then(m => ({ default: m.MemberCheckIn })));
const CounterBooking = lazy(() => import('../../pages/receptionist/CounterBookingPage.jsx').then(m => ({ default: m.CounterBooking })));
const CounterInvoices = lazy(() => import('../../pages/receptionist/CounterInvoicesPage.jsx').then(m => ({ default: m.CounterInvoices })));
const SupportRequests = lazy(() => import('../../pages/receptionist/SupportRequestsPage.jsx').then(m => ({ default: m.SupportRequests })));

// Coach Pages (Lazy Loaded)
const CoachDashboard = lazy(() => import('../../pages/coach/CoachDashboardPage.jsx').then(m => ({ default: m.CoachDashboard })));
const TeachingSchedule = lazy(() => import('../../pages/coach/TeachingSchedulePage.jsx').then(m => ({ default: m.TeachingSchedule })));
const ClassMembers = lazy(() => import('../../pages/coach/ClassMembersPage.jsx').then(m => ({ default: m.ClassMembers })));
const Attendance = lazy(() => import('../../pages/coach/AttendancePage.jsx').then(m => ({ default: m.Attendance })));
const TrainingPlan = lazy(() => import('../../pages/coach/TrainingPlanPage.jsx').then(m => ({ default: m.TrainingPlan })));
const WorkoutProgress = lazy(() => import('../../pages/coach/WorkoutProgressPage.jsx').then(m => ({ default: m.WorkoutProgress })));
const CoachNotifications = lazy(() => import('../../pages/coach/CoachNotificationsPage.jsx').then(m => ({ default: m.CoachNotifications })));
const AIRecommendation = lazy(() => import('../../pages/coach/AIRecommendationPage.jsx').then(m => ({ default: m.AIRecommendation })));
const PerformanceDashboard = lazy(() => import('../../pages/coach/PerformanceDashboardPage.jsx').then(m => ({ default: m.PerformanceDashboard })));
const CoachSalaryKPI = PerformanceDashboard;
const CoachProfessionalHub = lazy(() => import('../../pages/coach/CoachProfessionalHubPage.jsx').then(m => ({ default: m.CoachProfessionalHub })));
const ManagerCoachOperations = lazy(() => import('../../pages/manager/ManagerCoachOperationsPage.jsx').then(m => ({ default: m.ManagerCoachOperations })));
const ManagerSupportCommunications = lazy(() => import('../../pages/manager/ManagerSupportCommunicationsPage.jsx').then(m => ({ default: m.ManagerSupportCommunications })));

// Member Pages (Lazy Loaded)
const MemberDashboard = lazy(() => import('../../pages/member/MemberDashboardPage.jsx').then(m => ({ default: m.MemberDashboard })));
const MemberPackages = lazy(() => import('../../pages/member/MemberPackagesPage.jsx').then(m => ({ default: m.MemberPackages })));
const ClassScheduleView = lazy(() => import('../../pages/member/ClassSchedulePage.jsx').then(m => ({ default: m.ClassScheduleView })));
const MyBookings = lazy(() => import('../../pages/member/MyBookingsPage.jsx').then(m => ({ default: m.MyBookings })));
const MyProgress = lazy(() => import('../../pages/member/MyProgressPage.jsx').then(m => ({ default: m.MyProgress })));
const MyAttendance = lazy(() => import('../../pages/member/MyAttendancePage.jsx').then(m => ({ default: m.MyAttendance })));
const MemberNotifications = lazy(() => import('../../pages/member/MemberNotificationsPage.jsx').then(m => ({ default: m.MemberNotifications })));
const MemberAIAssistant = lazy(() => import('../../pages/member/MemberAIAssistantPage.jsx').then(m => ({ default: m.MemberAIAssistant })));
const PaymentResult = lazy(() => import('../../pages/member/PaymentResultPage.jsx').then(m => ({ default: m.PaymentResult })));
const MemberCoachPortal = lazy(() => import('../../pages/member/MemberCoachPortalPage.jsx').then(m => ({ default: m.MemberCoachPortal })));
const MySupportRequests = lazy(() => import('../../pages/member/MySupportRequestsPage.jsx').then(m => ({ default: m.MySupportRequests })));
const MemberRefundRequests = lazy(() => import('../../pages/member/MemberRefundRequestsPage.jsx').then(m => ({ default: m.MemberRefundRequests })));
const PayrollPage = lazy(() => import('../../pages/shared/PayrollPage.jsx').then(m => ({ default: m.PayrollPage })));

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

  // Helper bọc layout & guard cho role Manager & Admin
  const renderManagerRoute = (
    Component,
    requiredCapability,
    allowedRoles = ['MANAGER', 'ADMIN']
  ) => (
    <AppLayout currentPath={path}>
      <ProtectedRoute>
        <RoleGuard allowedRoles={allowedRoles} requiredCapability={requiredCapability}>
          <Component />
        </RoleGuard>
      </ProtectedRoute>
    </AppLayout>
  );

  const renderReceptionistRoute = (Component, requiredCapability) => (
    <AppLayout currentPath={path}>
      <ProtectedRoute>
        <RoleGuard allowedRoles={['RECEPTIONIST']} requiredCapability={requiredCapability}>
          <Component />
        </RoleGuard>
      </ProtectedRoute>
    </AppLayout>
  );

  const renderCoachRoute = (Component, requiredCapability) => (
    <AppLayout currentPath={path}>
      <ProtectedRoute>
        <RoleGuard allowedRoles={['COACH']} requiredCapability={requiredCapability}>
          <Component />
        </RoleGuard>
      </ProtectedRoute>
    </AppLayout>
  );

  const renderMemberRoute = (Component, requiredCapability) => (
    <AppLayout currentPath={path}>
      <ProtectedRoute>
        <RoleGuard allowedRoles={['MEMBER']} requiredCapability={requiredCapability}>
          <Component />
        </RoleGuard>
      </ProtectedRoute>
    </AppLayout>
  );

  const renderAdminRoute = (Component, props = {}) => (
    <AppLayout currentPath={path}>
      <ProtectedRoute>
        <RoleGuard allowedRoles={['ADMIN', 'SYSTEMADMIN']}>
          <Component {...props} />
        </RoleGuard>
      </ProtectedRoute>
    </AppLayout>
  );

  // Check if route is a dashboard or auth route
  const isDashboardOrAuth =
    path.startsWith('#/admin') ||
    path.startsWith('#/manager') ||
    path.startsWith('#/receptionist') ||
    path.startsWith('#/coach') ||
    path.startsWith('#/member') ||
    path === '#/login' ||
    path === '#/register' ||
    path === '#/payment-result' ||
    path === '#/otp-demo' ||
    path === '#/otp';

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
      case '#/otp-demo':
      case '#/otp':
        return <OtpVerification />;
      case '#/payment-result':
        return <PaymentResult />;

      // ADMIN ROUTES: global administration only.
      case '#/admin':
        if (typeof window !== 'undefined' && window.location.hash === '#/admin') {
          window.location.replace('#/admin/dashboard');
        }
        return renderAdminRoute(AdminDashboard);
      case '#/admin/dashboard':
        return renderAdminRoute(AdminDashboard);
      case '#/admin/centers':
        return renderAdminRoute(AdminDashboard, { initialSection: 'centers' });
      case '#/admin/managers':
        return renderAdminRoute(AdminDashboard, { initialSection: 'managers' });
      case '#/admin/accounts':
        return renderAdminRoute(AdminDashboard, { initialSection: 'accounts' });
      case '#/admin/roles-permissions':
        return renderAdminRoute(RolesPermissions);
      case '#/admin/audit-logs':
        return renderAdminRoute(AuditLogs);
      case '#/admin/home-content':
        return renderAdminRoute(HomeContentManagement);
      case '#/admin/payroll':
        return renderAdminRoute(PayrollPage);

      // MANAGER ROUTES: operations of the assigned center only.
      case '#/manager':
      case '#/manager/dashboard':
        return renderManagerRoute(ManagerDashboard);
      case '#/manager/invoices':
        return renderManagerRoute(CounterInvoices, undefined, ['MANAGER', 'ADMIN']);
      case '#/manager/payroll':
        return renderManagerRoute(PayrollPage, undefined, ['MANAGER', 'ADMIN']);
      case '#/manager/members':
        return renderManagerRoute(MemberManagement);
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
      case '#/manager/audit-logs':
        return renderManagerRoute(AuditLogs, 'view_audit_logs');
      case '#/manager/coach-operations':
        return renderManagerRoute(ManagerCoachOperations, 'manage_coach_operations');
      case '#/manager/support-communications':
        return <AppLayout currentPath={path}><ProtectedRoute><RoleGuard allowedRoles={['MANAGER']}><ManagerSupportCommunications /></RoleGuard></ProtectedRoute></AppLayout>;
      case '#/manager/home-content':
        return renderManagerRoute(HomeContentManagement, undefined, ['MANAGER', 'ADMIN']);

      // RECEPTIONIST ROUTES (4 chức năng)
      case '#/receptionist':
        if (typeof window !== 'undefined' && window.location.hash === '#/receptionist') {
          window.location.replace('#/receptionist/dashboard');
        }
        return renderReceptionistRoute(ReceptionistDashboard);
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
      case '#/receptionist/payroll':
        return renderReceptionistRoute(PayrollPage);
      case '#/member/support':
      case '#/coach/support':
        return <AppLayout currentPath={path}><ProtectedRoute><RoleGuard allowedRoles={['MEMBER', 'COACH']}><MySupportRequests /></RoleGuard></ProtectedRoute></AppLayout>;

      // COACH ROUTES (8 chức năng)
      case '#/coach':
        if (typeof window !== 'undefined' && window.location.hash === '#/coach') {
          window.location.replace('#/coach/dashboard');
        }
        return renderCoachRoute(CoachDashboard);
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
      case '#/coach/performance':
      case '#/coach/salary-kpi':
      case '#/coach/kpi':
        return renderCoachRoute(PerformanceDashboard, 'manage_coach_workspace');
      case '#/coach/salary':
        return renderCoachRoute(PayrollPage, 'manage_coach_workspace');
      case '#/coach/professional':
      case '#/coach/messages':
        return renderCoachRoute(CoachProfessionalHub, 'manage_coach_workspace');

      // MEMBER ROUTES
      case '#/member':
        if (typeof window !== 'undefined' && window.location.hash === '#/member') {
          window.location.replace('#/member/dashboard');
        }
        return renderMemberRoute(MemberDashboard);
      case '#/member/dashboard':
        return renderMemberRoute(MemberDashboard);
      case '#/member/packages':
        return renderMemberRoute(MemberPackages);
      case '#/member/refunds':
        return renderMemberRoute(MemberRefundRequests);
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


export default AppRouter;
export { AppRouter };
