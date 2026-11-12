import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useAuth } from '../../entities/session/index.js';
import { useLanguage } from '../../shared/i18n/LanguageContext.jsx';
import { PageErrorBoundary } from '../../shared/ui/PageErrorBoundary.jsx';
import { NotFoundView } from '../../pages/not-found/index.js';
import { normalizeRouteHash, ROUTE_TYPO_MAP, isLandingRoute } from './routeNormalization.js';

import { ProtectedRoute, RoleGuard } from './RoleGuard.jsx';
import { AppLayout } from '../../widgets/app-shell/index.js';

// Public & Auth Pages (Lazy Loaded)
const LandingPage = lazy(() => import('../../pages/landing/index.js').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('../../pages/login/index.js').then(m => ({ default: m.LoginPage })));
const OtpVerification = lazy(() => import('../../pages/otp-verification/index.js').then(m => ({ default: m.OtpVerification })));
const VerifyEmailPage = lazy(() => import('../../pages/verify-email/index.js').then(m => ({ default: m.VerifyEmailPage })));
const InitialPasswordPage = lazy(() => import('../../pages/initial-password/index.js').then(m => ({ default: m.InitialPasswordPage })));

// Manager Pages (Lazy Loaded)
const ManagerDashboard = lazy(() => import('../../pages/manager-dashboard/index.js').then(m => ({ default: m.ManagerDashboard })));
const StaffManagement = lazy(() => import('../../pages/manager-staff/index.js').then(m => ({ default: m.StaffManagement })));
const MemberManagement = lazy(() => import('../../pages/manager-members/index.js').then(m => ({ default: m.MemberManagement })));
const PackageManagement = lazy(() => import('../../pages/manager-packages/index.js').then(m => ({ default: m.PackageManagement })));
const ClassesAndRooms = lazy(() => import('../../pages/manager-classes-rooms/index.js').then(m => ({ default: m.ClassesAndRooms })));
const CoachAssignment = lazy(() => import('../../pages/manager-coach-assignment/index.js').then(m => ({ default: m.CoachAssignment })));
const ReportsAnalytics = lazy(() => import('../../pages/manager-reports/index.js').then(m => ({ default: m.ReportsAnalytics })));
const RolesPermissions = lazy(() => import('../../pages/roles-permissions/index.js').then(m => ({ default: m.RolesPermissions })));
const AuditLogs = lazy(() => import('../../pages/audit-logs/index.js').then(m => ({ default: m.AuditLogs })));
const HomeContentManagement = lazy(() => import('../../pages/manager-home-content/index.js').then(m => ({ default: m.HomeContentManagement })));
const AdminDashboard = lazy(() => import('../../pages/admin-dashboard/index.js').then(m => ({ default: m.AdminDashboard })));

// Receptionist Pages (Lazy Loaded)
const ReceptionistDashboard = lazy(() => import('../../pages/receptionist-dashboard/index.js').then(m => ({ default: m.ReceptionistDashboard })));
const MemberLookup = lazy(() => import('../../pages/member-lookup/index.js').then(m => ({ default: m.MemberLookup })));
const CounterMembership = lazy(() => import('../../pages/counter-membership/index.js').then(m => ({ default: m.CounterMembership })));
const MemberCheckIn = lazy(() => import('../../pages/member-checkin/index.js').then(m => ({ default: m.MemberCheckIn })));
const CounterBooking = lazy(() => import('../../pages/counter-booking/index.js').then(m => ({ default: m.CounterBooking })));
const CounterInvoices = lazy(() => import('../../pages/counter-invoices/index.js').then(m => ({ default: m.CounterInvoices })));
const SupportRequests = lazy(() => import('../../pages/support-requests/index.js').then(m => ({ default: m.SupportRequests })));

// Coach Pages (Lazy Loaded)
const CoachDashboard = lazy(() => import('../../pages/coach-dashboard/index.js').then(m => ({ default: m.CoachDashboard })));
const TeachingSchedule = lazy(() => import('../../pages/coach-teaching-schedule/index.js').then(m => ({ default: m.TeachingSchedule })));
const ClassMembers = lazy(() => import('../../pages/coach-class-members/index.js').then(m => ({ default: m.ClassMembers })));
const Attendance = lazy(() => import('../../pages/coach-attendance/index.js').then(m => ({ default: m.Attendance })));
const TrainingPlan = lazy(() => import('../../pages/coach-training-plan/index.js').then(m => ({ default: m.TrainingPlan })));
const WorkoutProgress = lazy(() => import('../../pages/coach-workout-progress/index.js').then(m => ({ default: m.WorkoutProgress })));
const CoachNotifications = lazy(() => import('../../pages/coach-notifications/index.js').then(m => ({ default: m.CoachNotifications })));
const AIRecommendation = lazy(() => import('../../pages/coach-ai-recommendation/index.js').then(m => ({ default: m.AIRecommendation })));
const PerformanceDashboard = lazy(() => import('../../pages/coach-performance/index.js').then(m => ({ default: m.PerformanceDashboard })));
const CoachSalaryKPI = PerformanceDashboard;
const CoachResources = lazy(() => import('../../pages/coach-resources/index.js').then(m => ({ default: m.CoachResources })));
const CoachProfessionalHub = lazy(() => import('../../pages/coach-professional-hub/index.js').then(m => ({ default: m.CoachProfessionalHub })));
const ManagerCoachOperations = lazy(() => import('../../pages/manager-coach-operations/index.js').then(m => ({ default: m.ManagerCoachOperations })));
const ManagerSupportCommunications = lazy(() => import('../../pages/manager-support/index.js').then(m => ({ default: m.ManagerSupportCommunications })));

// Member Pages (Lazy Loaded)
const MemberDashboard = lazy(() => import('../../pages/member-dashboard/index.js').then(m => ({ default: m.MemberDashboard })));
const MemberPackages = lazy(() => import('../../pages/member-packages/index.js').then(m => ({ default: m.MemberPackages })));
const ClassScheduleView = lazy(() => import('../../pages/member-class-schedule/index.js').then(m => ({ default: m.ClassScheduleView })));
const MyBookings = lazy(() => import('../../pages/member-bookings/index.js').then(m => ({ default: m.MyBookings })));
const MyProgress = lazy(() => import('../../pages/member-progress/index.js').then(m => ({ default: m.MyProgress })));
const MyAttendance = lazy(() => import('../../pages/member-attendance/index.js').then(m => ({ default: m.MyAttendance })));
const MemberNotifications = lazy(() => import('../../pages/member-notifications/index.js').then(m => ({ default: m.MemberNotifications })));
const MemberAIAssistant = lazy(() => import('../../pages/member-ai-assistant/index.js').then(m => ({ default: m.MemberAIAssistant })));
const PaymentResult = lazy(() => import('../../pages/payment-result/index.js').then(m => ({ default: m.PaymentResult })));
const MemberCoachPortal = lazy(() => import('../../pages/member-coach-portal/index.js').then(m => ({ default: m.MemberCoachPortal })));
const MySupportRequests = lazy(() => import('../../pages/my-support-requests/index.js').then(m => ({ default: m.MySupportRequests })));
const MemberRefundRequests = lazy(() => import('../../pages/member-refund-requests/index.js').then(m => ({ default: m.MemberRefundRequests })));
const PayrollPage = lazy(() => import('../../pages/payroll/index.js').then(m => ({ default: m.PayrollPage })));


function Navigate({ to, replace = true }) {
  useEffect(() => {
    if (replace) {
      window.location.replace(to);
    } else {
      window.location.hash = to;
    }
  }, [to, replace]);
  return null;
}

function RouteFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-8">
      <div className="flex items-center gap-2.5 text-brand-navy-500 text-sm font-medium">
        <span className="w-4 h-4 border-2 border-brand-danger-600 border-t-transparent rounded-full animate-spin" />
        <span>Đang tải màn hình...</span>
      </div>
    </div>
  );
}

function getRouteHash() {
  const hash = typeof window !== 'undefined' ? window.location.hash || '' : '';
  return normalizeRouteHash(hash);
}

function AppRouter() {
  const { initializing, initializationError, currentUser } = useAuth();
  const { language } = useLanguage();
  const [currentHash, setCurrentHash] = useState(getRouteHash);

  useEffect(() => {
    const handleHashChange = () => {
      const normalized = normalizeRouteHash(window.location.hash || '#/');
      setCurrentHash(normalized);

      const cleanAnchor = normalized.replace(/^#\/?/, '').split('?')[0];
      const targetElement = document.getElementById(cleanAnchor);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      } else if (!cleanAnchor.includes('co-so-vat-chat') && !cleanAnchor.includes('khoa-hoc') && !cleanAnchor.includes('ve-chung-toi')) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Only update if normalized hash differs from current state to prevent double render on mount
    const initial = getRouteHash();
    setCurrentHash(prev => (prev !== initial ? initial : prev));
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const path = currentHash.split('?')[0];
  if (initializing) return <RouteFallback />;
  if (initializationError) return <div role="alert" className="p-8 text-center text-brand-danger-700 dark:text-brand-danger-400">
    <p>{initializationError}</p>
    <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 rounded border">Thử lại</button>
  </div>;

  // Helper bọc layout & guard cho role Manager & Admin
  const renderManagerRoute = (
    Component,
    requiredCapability,
    allowedRoles = ['MANAGER', 'ADMIN']
  ) => (
    <ProtectedRoute>
      <RoleGuard allowedRoles={allowedRoles} requiredCapability={requiredCapability}>
        <AppLayout currentPath={path}>
          <Component />
        </AppLayout>
      </RoleGuard>
    </ProtectedRoute>
  );

  const renderReceptionistRoute = (Component, requiredCapability) => (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['RECEPTIONIST']} requiredCapability={requiredCapability}>
        <AppLayout currentPath={path}>
          <Component />
        </AppLayout>
      </RoleGuard>
    </ProtectedRoute>
  );

  const renderCoachRoute = (Component, requiredCapability) => (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['COACH']} requiredCapability={requiredCapability}>
        <AppLayout currentPath={path}>
          <Component />
        </AppLayout>
      </RoleGuard>
    </ProtectedRoute>
  );

  const renderMemberRoute = (Component, requiredCapability) => (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['MEMBER']} requiredCapability={requiredCapability}>
        <AppLayout currentPath={path}>
          <Component />
        </AppLayout>
      </RoleGuard>
    </ProtectedRoute>
  );

  const renderAdminRoute = (Component, props = {}) => (
    <ProtectedRoute>
      <RoleGuard allowedRoles={['ADMIN', 'SYSTEMADMIN']}>
        <AppLayout currentPath={path}>
          <Component {...props} />
        </AppLayout>
      </RoleGuard>
    </ProtectedRoute>
  );

  const renderRouteContent = () => {
    // The activation link must work even when someone is signed in on this browser.
    if (path === '#/verify-email') return <VerifyEmailPage />;
    // Accounts still on the default (phone) password must set a new one before using any screen.
    if (currentUser?.mustChangePassword) return <InitialPasswordPage />;
    if (isLandingRoute(path)) {
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
        return <Navigate to="#/admin/dashboard" />;
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
        return <ProtectedRoute><RoleGuard allowedRoles={['MANAGER']}><AppLayout currentPath={path}><ManagerSupportCommunications /></AppLayout></RoleGuard></ProtectedRoute>;
      case '#/manager/home-content':
        return renderManagerRoute(HomeContentManagement, undefined, ['MANAGER', 'ADMIN']);

      // RECEPTIONIST ROUTES (4 chức năng)
      case '#/receptionist':
        return <Navigate to="#/receptionist/dashboard" />;
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
        return <ProtectedRoute><RoleGuard allowedRoles={['MEMBER', 'COACH']}><AppLayout currentPath={path}><MySupportRequests /></AppLayout></RoleGuard></ProtectedRoute>;

      // COACH ROUTES (8 chức năng)
      case '#/coach':
        return <Navigate to="#/coach/dashboard" />;
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
      case '#/coach/resources':
        return renderCoachRoute(CoachResources, 'manage_coach_workspace');
      case '#/coach/professional':
      case '#/coach/messages':
        return renderCoachRoute(CoachProfessionalHub, 'manage_coach_workspace');

      // MEMBER ROUTES
      case '#/member':
        return <Navigate to="#/member/dashboard" />;
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

      // 404 NOT FOUND ROUTE: Luxury Olympic sports arena empty/not-found screen
      default:
        return <NotFoundView path={path} currentUser={currentUser} />;
    }
  };

  return (
    <PageErrorBoundary resetKey={path} language={language}>
      <Suspense fallback={<RouteFallback />}>
        {renderRouteContent()}
      </Suspense>
    </PageErrorBoundary>
  );
}

export default AppRouter;
export { AppRouter, normalizeRouteHash, ROUTE_TYPO_MAP, isLandingRoute };
