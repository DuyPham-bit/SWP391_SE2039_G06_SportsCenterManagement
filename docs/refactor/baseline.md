# Refactor baseline (Phase 0)

Recorded 2026-11-18 on branch `refactor/structure-cleanup`, branched from `feature/rbac-admin-manager-integrated` at 14f834f. The working tree had 122 uncommitted changes when this was recorded, and they are included in these results.

Every later phase must keep these results at least as good, and must keep both route lists identical.

## Build and test

| Check | Command | Result |
|---|---|---|
| BE build | `dotnet build Backend/SWP391_SE2039_G06_SportsCenterManagement1.slnx` | PASS: 0 warnings, 0 errors |
| BE tests | `dotnet test Backend/SWP391_SE2039_G06_SportsCenterManagement1.slnx` | PASS: 51/51 (0 failed, 0 skipped) |
| FE build | `npm run build` (Frontend) | PASS (existing warning: some chunks are larger than 1000 kB) |
| FE build into API | `npm run build:api` | PASS. Output goes to `API/wwwroot`, which `Backend/.gitignore:61` already ignores |
| FE unit tests | `npm test` (`node --test tests/*.test.cjs`) | PASS: 200/200 |

Notes:
- The `verification/*` audit projects are not part of the solution, so the build and tests above do not cover them.
- The solution file is `SWP391_SE2039_G06_SportsCenterManagement1.slnx`, not `SportsCenterManagement.slnx`.

## API routes (243 endpoints)

These were taken from the `[Route]` and `[Http*]` attributes; the count matches the 243 `[Http*]` attributes. 18 controllers have no class-level `[Route]`, so some of their routes are served without the `/api` prefix (for example `/ai/chat`). They are recorded exactly as they are served today.

```text
GET /access/me/capabilities -> CenterPermissionsController.Mine
GET /admin/home-content -> HomeContentController.GetAdmin
PUT /admin/home-content -> HomeContentController.Publish
DELETE /admin/home-content/draft -> HomeContentController.DiscardDraft
GET /admin/home-content/draft -> HomeContentController.GetDraft
PUT /admin/home-content/draft -> HomeContentController.SaveDraft
PUT /admin/home-content/{section} -> HomeContentController.SaveSection
GET /admin/permissions -> CenterPermissionsController.PermissionCatalog
POST /ai/chat -> AiController.Chat
DELETE /ai/conversations -> AiController.ClearConversations
GET /ai/conversations/latest -> AiController.LatestConversation
GET /ai/conversations/{conversationId:long}/messages -> AiController.Messages
POST /ai/recommendations -> AiController.Recommend
POST /api/Mail/send -> MailController.TestSendMail
GET /api/admin/accounts -> AdminManagementController.Accounts
DELETE /api/admin/accounts/{accountId:long} -> AdminManagementController.DeleteMemberAccount
POST /api/admin/accounts/{accountId:long}/lock -> AdminManagementController.LockAccount
POST /api/admin/accounts/{accountId:long}/revoke-sessions -> AdminManagementController.RevokeSessions
POST /api/admin/accounts/{accountId:long}/unlock -> AdminManagementController.UnlockAccount
GET /api/admin/audit-logs -> AuditLogsController.GetSystemLogs
GET /api/admin/centers -> AdminManagementController.Centers
POST /api/admin/centers -> AdminManagementController.CreateCenter
PATCH /api/admin/centers/{centerId:long} -> AdminManagementController.UpdateCenter
POST /api/admin/managers -> AdminManagementController.CreateManager
GET /api/admin/managers -> AdminManagementController.Managers
PATCH /api/admin/managers/{managerId:long} -> AdminManagementController.UpdateManager
GET /api/admin/overview -> AdminManagementController.Overview
GET /api/admin/roles -> RolePermissionsController.GetMatrix
PUT /api/admin/roles/{roleId:long}/permissions -> RolePermissionsController.ReplacePermissions
POST /api/auth/change-password -> AuthController.ChangePassword
POST /api/auth/initial-password -> AuthController.ChangeInitialPassword
POST /api/auth/login -> AuthController.Login
POST /api/auth/logout -> AuthController.Logout
POST /api/auth/register -> AuthController.Register
POST /api/auth/request-change-password-otp -> AuthController.RequestChangePasswordOtp
POST /api/auth/request-email-verification -> AuthController.RequestEmailVerification
POST /api/auth/request-password-reset -> AuthController.RequestPasswordReset
POST /api/auth/reset-password -> AuthController.ResetPassword
POST /api/auth/verify-and-change-password -> AuthController.VerifyAndChangePassword
POST /api/auth/verify-email/preview -> AuthController.PreviewActivation
GET /api/campus-map -> CampusMapController.Get
PUT /api/campus-map/zones/{zoneId:long} -> CampusMapController.UpdateZone
GET /api/centers/{centerId:long}/audit-logs -> AuditLogsController.GetCenterLogs
GET /api/centers/{centerId:long}/invoices -> InvoicesController.List
POST /api/centers/{centerId:long}/members -> MembersController.CreateAtCenter
GET /api/centers/{centerId:long}/members -> MembersController.SearchAtCenter
PATCH /api/centers/{centerId:long}/members/{memberId:long} -> MembersController.UpdateAtCenter
DELETE /api/centers/{centerId:long}/members/{memberId:long}/avatar -> MembersController.RemoveMemberAvatar
POST /api/centers/{centerId:long}/members/{memberId:long}/avatar -> MembersController.UploadMemberAvatar
PATCH /api/centers/{centerId:long}/members/{memberId:long}/basic-info -> MembersController.UpdateBasicInfoAtCenter
PATCH /api/centers/{centerId:long}/members/{memberId:long}/status -> MembersController.SetMemberStatus
POST /api/centers/{centerId:long}/membership-packages -> MembershipPackagesController.Create
GET /api/centers/{centerId:long}/membership-packages -> MembershipPackagesController.GetActive
GET /api/centers/{centerId:long}/membership-packages/all -> MembershipPackagesController.GetAll
DELETE /api/centers/{centerId:long}/membership-packages/{packageId:long} -> MembershipPackagesController.Delete
PUT /api/centers/{centerId:long}/membership-packages/{packageId:long} -> MembershipPackagesController.Update
PATCH /api/centers/{centerId:long}/membership-packages/{packageId:long}/status -> MembershipPackagesController.SetStatus
POST /api/centers/{centerId:long}/staff -> StaffController.Create
GET /api/centers/{centerId:long}/staff -> StaffController.Search
POST /api/centers/{centerId:long}/staff/appointments -> StaffController.Appoint
PATCH /api/centers/{centerId:long}/staff/{staffUserId:long} -> StaffController.Update
POST /api/classes/{classId:long}/enrollments -> ClassEnrollmentsController.Enroll
DELETE /api/classes/{classId:long}/enrollments/{enrollmentId:long} -> ClassEnrollmentsController.Cancel
POST /api/invoices/{invoiceId:long}/payments -> PaymentsController.RecordCashPayment
GET /api/invoices/{invoiceNumber} -> InvoicesController.GetInvoice
POST /api/invoices/{invoiceNumber}/payments -> InvoicesController.RecordPayment
GET /api/landing-content -> LandingContentController.Get
PUT /api/landing-content -> LandingContentController.Save
DELETE /api/landing-content/draft -> LandingContentController.DiscardDraft
GET /api/landing-content/draft -> LandingContentController.GetDraft
PUT /api/landing-content/draft -> LandingContentController.SaveDraft
GET /api/media/files -> MediaUploadController.GetFiles
POST /api/media/migrate-legacy -> MediaUploadController.MigrateLegacyMedia
GET /api/media/recent -> MediaUploadController.GetRecent
GET /api/media/status -> MediaUploadController.GetStatus
POST /api/media/upload -> MediaUploadController.Upload
GET /api/members/me -> MembersController.GetMe
PATCH /api/members/me -> MembersController.UpdateMe
GET /api/members/me/enrollment-options -> ClassEnrollmentsController.GetOptions
GET /api/members/me/enrollments -> ClassEnrollmentsController.GetMine
POST /api/members/me/subscriptions -> MembersController.CreateMySubscription
POST /api/members/{memberId:long}/subscriptions -> MembersController.CreateForMember
GET /api/members/{memberId:long}/subscriptions -> MembersController.GetSubscriptions
PATCH /api/membership-packages/{packageId:long} -> MembershipPackagesController.UpdateFromDirectRoute
POST /api/payments/cancel-pending -> PaymentsController.CancelPending
POST /api/payments/counter-checkout -> PaymentsController.CounterCheckout
POST /api/payments/counter-vnpay-url -> PaymentsController.CreateCounterVnPayPaymentUrl
POST /api/payments/counter-void/{invoiceNumber} -> PaymentsController.CounterVoid
POST /api/payments/create-momo-url -> PaymentsController.CreateMomoPaymentUrl
POST /api/payments/create-vnpay-url -> PaymentsController.CreateVnPayPaymentUrl
GET /api/payments/momo-callback -> PaymentsController.MomoPaymentCallback
POST /api/payments/momo-ipn -> PaymentsController.MomoPaymentIpn
GET /api/payments/my-pending-invoices -> PaymentsController.GetMyPendingInvoices
DELETE /api/payments/pending-invoice/{invoiceNumber} -> PaymentsController.CancelPendingInvoice
DELETE /api/payments/pending-package/{packageId:long} -> PaymentsController.CancelPendingPackage
GET /api/payments/refund-requests/me -> PaymentsController.MyRefundRequests
GET /api/payments/refund-requests/me/eligible-payments -> PaymentsController.RefundEligiblePayments
GET /api/payments/refunds/{id:long}/proof -> PaymentsController.GetRefundProof
POST /api/payments/refunds/{refundId:long}/reconcile -> PaymentsController.ReconcileRefund
GET /api/payments/vnpay-callback -> PaymentsController.VnPayPaymentCallback
GET /api/payments/vnpay-ipn -> PaymentsController.VnPayPaymentIpn
POST /api/payments/{gatewayReference}/reconcile -> PaymentsController.ReconcilePendingPayment
POST /api/payments/{paymentId:long}/refund-requests -> PaymentsController.SubmitRefundRequest
POST /api/payments/{paymentId:long}/refunds -> PaymentsController.Refund
GET /api/permissions -> RolesController.GetAllPermissions
GET /api/profile/me -> ProfileController.GetMe
PATCH /api/profile/me -> ProfileController.UpdateMe
GET /api/public/centers/{centerId:long}/catalog -> PublicCatalogController.Get
DELETE /api/r2-images/avatar -> R2ImageStorageController.DeleteUploadedAvatar
POST /api/r2-images/avatar -> R2ImageStorageController.UploadAvatar
POST /api/r2-images/campus-3d -> R2ImageStorageController.UploadCampus3dHtml
DELETE /api/r2-images/dashboard -> R2ImageStorageController.DeleteDashboardImage
POST /api/r2-images/dashboard -> R2ImageStorageController.UploadDashboardImage
POST /api/receptionist/members/quick-create -> ReceptionistMembersController.QuickCreate
GET /api/receptionist/members/verification-status -> ReceptionistMembersController.VerificationStatus
POST /api/receptionist/members/{memberId:long}/resend-verification -> ReceptionistMembersController.Resend
DELETE /api/refund-bills -> RefundBillStorageController.Delete
POST /api/refund-bills -> RefundBillStorageController.Upload
GET /api/refund-requests -> PaymentsController.RefundRequests
PATCH /api/refund-requests/{refundId:long} -> PaymentsController.ReviewRefundRequest
GET /api/reports/checkins -> ReportsController.GetCheckins
GET /api/reports/classes -> ReportsController.GetClasses
GET /api/reports/membership -> ReportsController.GetMembership
GET /api/reports/operations -> ReportsController.GetOperations
GET /api/reports/revenue -> ReportsController.GetRevenue
GET /api/reports/revenue-by-sport -> ReportsController.GetRevenueBySport
POST /api/roles -> RolesController.CreateRole
GET /api/roles -> RolesController.GetRoles
DELETE /api/roles/{roleId:long} -> RolesController.DeleteRole
PUT /api/roles/{roleId:long} -> RolesController.UpdateRole
GET /api/roles/{roleId:long}/permissions -> RolesController.GetRolePermissions
PUT /api/roles/{roleId:long}/permissions -> RolesController.UpdateRolePermissions
POST /auth/google -> GoogleAuthController.Login
POST /auth/google/link -> GoogleAuthController.Link
POST /centers/{centerId:long}/checkins -> CheckinsController.CheckIn
GET /centers/{centerId:long}/checkins/summary -> CheckinsController.Summary
GET /centers/{centerId:long}/checkins/today -> CheckinsController.GetTodayCheckins
GET /centers/{centerId:long}/classes -> ClassesController.GetPublished
GET /centers/{centerId:long}/classes/all -> ClassResourcesController.Classes
GET /centers/{centerId:long}/coaches -> ClassResourcesController.Coaches
POST /centers/{centerId:long}/notifications -> NotificationsController.SendToCenter
GET /centers/{centerId:long}/roles -> CenterPermissionsController.Matrix
PUT /centers/{centerId:long}/roles/{roleId:long}/permissions -> CenterPermissionsController.Replace
DELETE /centers/{centerId:long}/roles/{roleId:long}/user-permissions -> CenterPermissionsController.ResetUsersForRole
POST /centers/{centerId:long}/rooms -> ClassResourcesController.CreateRoom
GET /centers/{centerId:long}/rooms -> ClassResourcesController.Rooms
PUT /centers/{centerId:long}/rooms/{roomId:long} -> ClassResourcesController.UpdateRoom
POST /centers/{centerId:long}/sports -> ClassResourcesController.CreateSport
GET /centers/{centerId:long}/sports -> ClassResourcesController.Sports
GET /centers/{centerId:long}/sports/all -> ClassResourcesController.AllSports
PUT /centers/{centerId:long}/sports/{sportId:long} -> ClassResourcesController.UpdateSport
POST /centers/{centerId:long}/support-requests -> SupportRequestsController.Create
GET /centers/{centerId:long}/support-requests -> SupportRequestsController.List
GET /centers/{centerId:long}/support-requests/{id:long} -> SupportRequestsController.Get
PATCH /centers/{centerId:long}/support-requests/{id:long} -> SupportRequestsController.Update
GET /centers/{centerId:long}/user-permissions -> CenterPermissionsController.Users
PUT /centers/{centerId:long}/users/{targetUserId:long}/permissions -> CenterPermissionsController.ReplaceUser
DELETE /centers/{centerId:long}/users/{targetUserId:long}/permissions -> CenterPermissionsController.ResetUser
GET /class-sessions -> ClassSchedulesController.GetSessions
POST /class-sessions/{sessionId:long}/bookings -> SessionBookingsController.Book
POST /classes -> ClassManagementController.Create
DELETE /classes/{classId:long} -> ClassManagementController.Cancel
GET /classes/{classId:long} -> ClassManagementController.Get
PUT /classes/{classId:long} -> ClassManagementController.Update
POST /classes/{classId:long}/coaches -> ClassesController.AssignCoach
GET /classes/{classId:long}/coaches -> ClassesController.GetAssignedCoaches
DELETE /classes/{classId:long}/coaches/{coachId:long} -> ClassesController.UnassignCoach
POST /classes/{classId:long}/publish -> ClassManagementController.Publish
POST /classes/{classId:long}/restore -> ClassManagementController.Restore
POST /classes/{classId:long}/schedules -> ClassManagementController.CreateSchedule
GET /classes/{classId:long}/schedules -> ClassManagementController.GetSchedules
DELETE /classes/{classId:long}/schedules/{scheduleId:long} -> ClassManagementController.CancelSchedule
PUT /classes/{classId:long}/schedules/{scheduleId:long} -> ClassManagementController.UpdateSchedule
POST /coaches/me/broadcasts -> CoachProfessionalController.Broadcast
GET /coaches/me/classes -> TrainingController.Classes
GET /coaches/me/classes/{classId:long}/members -> TrainingController.Members
GET /coaches/me/classes/{classId:long}/members/{memberId:long}/ai-context -> AiController.Context
PUT /coaches/me/classes/{classId:long}/members/{memberId:long}/biometrics -> AiController.UpdateBiometrics
POST /coaches/me/equipment-issues -> CoachProfessionalController.ReportIssue
POST /coaches/me/exercises -> CoachProfessionalController.Exercise
POST /coaches/me/homework -> CoachProfessionalController.Homework
PATCH /coaches/me/homework-submissions/{id:long} -> CoachProfessionalController.ReviewHomework
GET /coaches/me/kpi -> CoachProfessionalController.Kpi
GET /coaches/me/leave-replacement-options -> CoachProfessionalController.LeaveReplacementOptions
POST /coaches/me/leave-requests -> CoachProfessionalController.RequestLeave
POST /coaches/me/member-health-records -> CoachProfessionalController.Health
GET /coaches/me/members/{memberId:long}/messages -> CoachProfessionalController.CoachMessages
POST /coaches/me/messages -> CoachProfessionalController.CoachSendMessage
GET /coaches/me/notifications -> NotificationsController.Sent
POST /coaches/me/notifications -> TrainingController.Send
POST /coaches/me/nutrition-plans -> CoachProfessionalController.Nutrition
PUT /coaches/me/personal-training-plans -> TrainingController.SavePersonalPlan
GET /coaches/me/professional -> CoachProfessionalController.CoachWorkspace
GET /coaches/me/progress -> TrainingController.CoachProgress
POST /coaches/me/progress -> TrainingController.RecordProgress
POST /coaches/me/resource-bookings -> CoachProfessionalController.BookResource
DELETE /coaches/me/resource-bookings/{id:long} -> CoachProfessionalController.CancelResource
PUT /coaches/me/sessions/{sessionId:long}/attendance -> BookingOperationsController.Attendance
GET /coaches/me/sessions/{sessionId:long}/members -> BookingOperationsController.Roster
GET /coaches/me/teaching-schedule -> ClassSchedulesController.GetTeachingSchedule
GET /coaches/me/training-plans -> TrainingController.CoachPlans
POST /coaches/me/training-plans -> TrainingController.SavePlan
DELETE /coaches/me/training-plans/{planId:long} -> TrainingController.DeletePlan
POST /coaches/me/work-events -> CoachProfessionalController.CreateEvent
PATCH /coaches/me/work-events/{id:long}/status -> CoachProfessionalController.ChangeEvent
GET /health -> HealthController.Get
GET /health/live -> HealthController.Live
GET /health/ready -> HealthController.Ready
GET /home-content -> HomeContentController.GetPublic
GET /manager/coach-operations -> CoachProfessionalController.ManagerWorkspace
POST /manager/coach-operations/compensation -> CoachProfessionalController.Compensation
PATCH /manager/coach-operations/equipment-issues/{id:long} -> CoachProfessionalController.ResolveIssue
PATCH /manager/coach-operations/leaves/{id:long} -> CoachProfessionalController.ReviewLeave
POST /manager/coach-operations/resources -> CoachProfessionalController.Resource
PATCH /members/me/coach-events/{id:long}/status -> CoachProfessionalController.RespondEvent
POST /members/me/coach-messages -> CoachProfessionalController.MemberSendMessage
GET /members/me/coach-portal -> CoachProfessionalController.MemberPortal
POST /members/me/coach-reviews -> CoachProfessionalController.ReviewCoach
GET /members/me/coaches/{coachId:long}/messages -> CoachProfessionalController.MemberMessages
GET /members/me/entitlements -> ClassSchedulesController.GetMyEntitlements
POST /members/me/food-diary -> CoachProfessionalController.FoodDiary
POST /members/me/homework/{id:long}/submission -> CoachProfessionalController.SubmitHomework
GET /members/me/progress -> TrainingController.MemberProgress
GET /members/me/session-bookings -> SessionBookingsController.GetMine
GET /members/me/session-waitlist -> BookingOperationsController.Waitlist
DELETE /members/me/session-waitlist/{waitlistId:long} -> BookingOperationsController.LeaveWaitlist
GET /members/me/training-plans -> TrainingController.MemberPlans
POST /members/{memberId:long}/class-sessions/{sessionId:long}/bookings -> BookingOperationsController.BookForMember
GET /members/{memberId:long}/session-bookings -> BookingOperationsController.ListForMember
DELETE /members/{memberId:long}/session-bookings/{bookingId:long} -> BookingOperationsController.CancelForMember
GET /members/{memberId:long}/session-waitlist -> BookingOperationsController.WaitlistForMember
DELETE /members/{memberId:long}/session-waitlist/{waitlistId:long} -> BookingOperationsController.LeaveWaitlistForMember
GET /notifications/me -> NotificationsController.Mine
PUT /notifications/me/read-all -> NotificationsController.ReadAll
PUT /notifications/{notificationId:long}/read -> NotificationsController.Read
GET /payroll/me -> PayrollController.Mine
GET /payroll/report -> PayrollController.Report
POST /payroll/staff-policy -> PayrollController.SavePolicy
DELETE /session-bookings/{bookingId:long} -> SessionBookingsController.Cancel
GET /support-requests/me -> MySupportRequestsController.Mine
POST /support-requests/me -> MySupportRequestsController.Submit
GET /support-requests/me/{id:long} -> MySupportRequestsController.Get
POST /support-requests/me/{id:long}/messages -> MySupportRequestsController.Reply
```

## FE routes (68 hash routes in `app/router/AppRouter.jsx`)

```text
#/admin
#/admin/accounts
#/admin/audit-logs
#/admin/centers
#/admin/dashboard
#/admin/home-content
#/admin/managers
#/admin/payroll
#/admin/roles-permissions
#/coach
#/coach/ai-recommendation
#/coach/attendance
#/coach/dashboard
#/coach/kpi
#/coach/members
#/coach/messages
#/coach/notifications
#/coach/performance
#/coach/professional
#/coach/progress
#/coach/resources
#/coach/salary
#/coach/salary-kpi
#/coach/schedule
#/coach/support
#/coach/training-plan
#/login
#/manager
#/manager/audit-logs
#/manager/classes-rooms
#/manager/coach-assignment
#/manager/coach-operations
#/manager/dashboard
#/manager/home-content
#/manager/invoices
#/manager/members
#/manager/packages
#/manager/payroll
#/manager/reports
#/manager/staff
#/manager/support-communications
#/member
#/member/ai-assistant
#/member/attendance
#/member/bookings
#/member/classes
#/member/coach-portal
#/member/dashboard
#/member/notifications
#/member/packages
#/member/progress
#/member/refunds
#/member/schedule
#/member/support
#/otp
#/otp-demo
#/payment-result
#/receptionist
#/receptionist/bookings
#/receptionist/check-in
#/receptionist/counter-register
#/receptionist/dashboard
#/receptionist/invoices
#/receptionist/lookup
#/receptionist/payroll
#/receptionist/support
#/register
#/verify-email
```
