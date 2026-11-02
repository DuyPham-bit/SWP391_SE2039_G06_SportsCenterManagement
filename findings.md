# Key Findings — Senior Feature-First Frontend Refactoring

## 1. Root Cause of Blank Screen (White Screen)
1. **ES Module Export Mismatch in `features/auth/`**:
   - `features/auth/index.js` re-exported `export { LoginPage, default as LoginPageComponent } from './LoginPage.jsx'`.
   - However, `LoginPage.jsx` only had `export function LoginPage()` and lacked `export default LoginPage`.
   - In modern browsers / Vite ES modules, importing `default` from a module without a default export immediately throws an uncaught `SyntaxError: The requested module ... does not provide an export named 'default'`, crashing the React root mount before any DOM can be rendered.
2. **Missing Default Exports in `shared/ui/`**:
   - `Modal.jsx`, `Table.jsx`, `StatCard.jsx`, `BusinessAlert.jsx` only exported named functions.
   - Legacy files and shims importing them via `import Modal from '...'` failed at runtime on pages like `#/payment-result`.
   - Fixed by providing both named and default exports for all UI atoms.
3. **Lazy Import Mismatch in `AppRouter.jsx`**:
   - `AppRouter.jsx` imported `m.ManagerDashboard` and `m.MyBookings`, while page files had exported `ManagerDashboardPage` and `MyBookingsPage`.
   - Fixed by exporting both aliases and default.
4. **Docker vs Vite Port 3004 Synchronization**:
   - Docker container `scms-frontend` was mapped to `127.0.0.1:3004` with an older static build from 11:58 UTC.
   - Synced the fresh `Frontend/dist` (built in 9.8s) into `scms-frontend:/usr/share/nginx/html/` and reloaded Nginx.
   - Now both local Vite (`[::1]:3004`) and Docker Nginx (`127.0.0.1:3004`) serve the exact same error-free application.

## 3. Deep-Dive Security & Architectural Findings (Backend Production Hardening)

1. **P1 — Public Exposure of Refund Proof Images (`R2StorageService`, `PaymentService`)**:
   - `R2StorageService.UploadRefundBillAsync` publishes images directly to `R2Storage:PublicDomain` with `Cache-Control: public, max-age=31536000`.
   - `PaymentService.ManualRefundQuery` explicitly concatenates `publicDomain + "/" + row.Refund.TransferProofUrl`.
   - Bank transfer slips contain sensitive PII (names, bank account numbers, balances, timestamps). Anyone with the URL can inspect them without authentication.
   - Fix strategy: Private bucket prefix (`private/refund-bills/`), presigned URL with short TTL (5–15 mins) generated on demand via `GET /api/refund-bills/{id}/proof` with center-scoped authorization, never logged in audit logs.

2. **P1 — Notification Worker Concurrency & Retry Starvation (`CommunicationDeliveryWorker`)**:
   - `ExternalChannels = ["Email"]`: SMS and Push channels are hard-coded out and permanently remain in `Queued`.
   - `db.SaveChangesAsync()` is only invoked at the end of the batch (after all external HTTP calls complete), causing race conditions and duplicate delivery when scaled to multiple instances.
   - Network timeouts immediately trigger `Status = "Failed"` without retry scheduling or exponential backoff.
   - Fix strategy: DB schema extension (`AttemptCount`, `NextAttemptAt`, `LeaseUntil`, `LockedBy`, `LastError`), atomic claim transaction (`Queued → Processing`), exponential backoff retry, `DeadLetter` status, and `X-Delivery-Id` idempotency header.

3. **P2 — Inconsistent Business Clock & Timezone (`IBusinessClock`)**:
   - Hardcoded `DateTime.UtcNow.AddHours(7)` exists in `CheckinService.cs`, `MemberService.cs`, `StaffManagementService.cs`, `VnPayService.cs`, and `MemberAiContextService.cs`.
   - Concurrently, `PaymentService.cs` and `ReportService.cs` use `TimeZoneInfo.FindSystemTimeZoneById` with `Reports:TimeZoneId`.
   - Fix strategy: Centralize under `IBusinessClock` reading `Business:TimeZoneId`, keeping DB timestamps strictly in UTC and converting only for business date logic and UI presentation.

4. **P2 — Missing Object Storage Access Control for Internal Media**:
   - `MediaAccessScope.cs` enforces tenant filtering only during API queries; the underlying R2 asset is served via a public CDN URL.
   - Fix strategy: Data classification (`PublicMarketing`, `CenterInternal`, `Personal`, `FinancialEvidence`), reserving `PublicDomain` exclusively for `PublicMarketing`.

5. **P2 — Direct DAL / DbContext Bypass in Controllers and BLL**:
   - 10 controllers inject `SportsCenterDbContext`.
   - 27 BLL services bypass repository contracts via `unitOfWork.Context`.
   - Fix strategy: Module-by-module repository decoupling (Payment → Notification → Booking → Checkin → Media → Auth) and architecture unit test enforcement.


## 4. Cross-Reference Table of Backend Logic Audit (BE-001 to BE-007)

| Audit ID | Severity | Module | Direct Code Location | Planned Resolution |
|---|---|---|---|---|
| **BE-003** | High | Refund / R2 | `R2StorageService.cs:113`, `PaymentService.cs:2001` | Private storage prefix, short-lived presigned URL, `GET /api/payments/refunds/{id}/proof` with RBAC & center tenant checks. |
| **BE-001** | High | Notification Worker | `CommunicationDeliveryWorker.cs:70` | Concurrency lock (`UPDLOCK, READPAST`), lease expiration, exponential backoff retry (1m/2m/4m/8m/16m), `X-Delivery-Id` idempotency header. |
| **BE-002** | High | Webhook Security | `CommunicationDeliveryWorker.cs:60` | Strict HTTPS enforcement (`Uri.UriSchemeHttps`), startup configuration validator, bearer token log redaction. |
| **BE-005** | Medium | Proxy / Real IP | `PaymentsController.cs:69`, `Program.cs:120` | `UseForwardedHeaders` middleware before RateLimiter/Auth, forward client IP to VNPay & rate limiter bucket. |
| **BE-004** | Medium | Startup Migration | `Program.cs:140`, `DbInitializer.cs:10` | `Database:AutoMigrateOnStartup` environment guard, SQL distributed application lock (`sp_getapplock`). |
| **BE-006** | Medium | Timezone Clock | `CheckinService.cs:74`, `VnPayService.cs:158`, etc. | Unified `IBusinessClock` reading `Reports:TimeZoneId`, strict UTC DB storage, eliminate raw `UtcNow.AddHours(7)`. |
| **BE-007** | Low | Observability | `Program.cs` | `/health/live` (process liveness) & `/health/ready` (SQL Server connection verification). |


## 5. Cross-Reference Table of Frontend Audit (FE-001 to FE-007)

| Audit ID | Severity | Module | Direct Code Location | Planned Resolution |
|---|---|---|---|---|
| **FE-001** | High | Member AI | `MemberAIChatPopup.jsx:167` | Key scoped by `${centerId}_${userId}`; dynamic reload on user change; full cache cleanup on logout. |
| **FE-002** | Medium | Routing / Auth | `AppRouter.jsx:120`, `AppLayout.jsx:48` | Move `<ProtectedRoute>` and `<RoleGuard>` outside `<AppLayout>`; Member AI mounts strictly on `role === 'MEMBER'`, not URL hash. |
| **FE-003** | Medium | Media Upload | `mediaApi.js:27`, `http.js:52` | Upgrade `apiRequest` to handle `FormData`; unified 401 handling, traceId, and auth versioning. |
| **FE-004** | Medium | HTTP Client | `http.js:60` | Default request timeouts (15s GET, 30s mutation) with `AbortController` and `COMMON-01` distinction. |
| **FE-005** | Medium | Accessibility | `LoginPage.jsx:604` | OTP modal focus trap, Escape key closing, trigger focus restoration, and `aria-live` region for countdown/errors. |
| **FE-006** | Low | Router | `AppRouter.jsx:201` | Replace render-phase `window.location.replace` with declarative `<Navigate to="..." replace />` in `useEffect`. |
| **FE-007** | Low | API / Tests | `backendApi.js` | Domain API slicing (booking, payment, media) with `backendApi.js` as backward-compatible facade; 145/145 green tests. |
