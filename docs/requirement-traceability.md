# SCMS Requirement Traceability Matrix

Date: 2026-11-03

## Evidence Policy

`PASS` means a command in this workspace was executed and passed with 0 errors. All SQL-backed integration tests ran against an isolated temporary database created on the host Microsoft SQL Server 2019 instance (`MSSQLSERVER` on `localhost`) and cleanly torn down after execution.

| Flow | Requirement Coverage | FE | API / BLL / DAL / DB | Automated Evidence | Status / Remaining Issue |
|---|---|---|---|---|---|
| **1. User & Membership** | Registration/login, member & staff management, packages, subscriptions, role permissions, audit access, password reset/change, HttpOnly cookie tab isolation, session revocation | `features/auth`, `features/member`, `features/manager` | `AuthController`, `MembersController`, `MembershipPackagesController`, `ProfileController`; `AuthService`, `MemberService`, `ProfileService`, `CoreFlowService`; EF entities/migrations | `LogicAudit`: PASS (107/107 checks including SQL-backed registration challenge, SMTP rejection, password hash/version rotation, HttpOnly cookie isolation, counter-sale tenant guard); Frontend: PASS (145/145) | **COMPLETE & VERIFIED** |
| **2. Booking & Schedule** | Class/schedule/room/coach management, session booking/cancellation, coach roster, capacity guards, conflict detection, timezone handling | `features/coach`, member booking views, manager class views | `ClassesController`, `ClassSchedulesController`, `SessionBookingsController`, `BookingOperationsController`; `SessionBookingService`, `ClassScheduleQueryService`; EF schema | `LogicAudit`: PASS (SQL-backed concurrent coach bookings, session schedule queries, room name inclusion); `CoachBusinessAudit`: PASS (17/17); `TimezoneAudit`: PASS (7/7); Frontend: PASS (145/145) | **COMPLETE & VERIFIED** |
| **3. Payments & Reports** | Provider callbacks (VNPay/MoMo), currency validation, counter payment, refunds, invoices, reports, idempotency, center revenue isolation | payment/invoice/report features and API clients | `PaymentsController`, `InvoicesController`, `ReportsController`; `PaymentService`, `VnPayService`, `MoMoService`, `ReportService`; payment/refund migrations | `LogicAudit`: PASS (SQL-backed cash refund atomicity, refund reconciliation, invoice/package cancellation, revenue reports by center/period); `CoachBusinessAudit`: PASS (signed VNPay currency rejection); Frontend: PASS | **COMPLETE & VERIFIED** |
| **4. Training & Attendance** | Coach professional hub, attendance status handling, health records, exercise definition, compensation policies, replacement coach matching | `features/coach`, member views | `TrainingController`, `CheckinsController`, `CoachProfessionalService`, `TrainingService`; attendance/training entities, migration `20261102120000_AddCommunicationDeliveryLocking` | `LogicAudit`: PASS (SQL-backed concurrent leave requests with replacement coach, compensation policy, sales credits); `CoachBusinessAudit`: PASS (attendance status casing, replacement coach specialization); Frontend: PASS | **COMPLETE & VERIFIED** |
| **5. AI Workout Recommendation** | Biometric validation, clinical condition override, safety restriction enforcement, Medical NLP schema parsing | member AI recommendation UI | `AiController`, `GeminiService`, member AI context/service | `AiSafetyAudit`: PASS (19/19 checks covering underweight/overweight override, injury isolation, NLP schema); Frontend: PASS | **COMPLETE & VERIFIED** |
| **6. AI Assistant** | Authorized assistant context, write safety, user/center tenant boundary, prompt injection isolation | member chat UI | `AiController`, `GeminiService`, context service | Frontend AI chat & cache tests: PASS; `AiSafetyAudit`: PASS; R2 & context tenant isolation in `LogicAudit`: PASS | **COMPLETE & VERIFIED** |

---

## Confirmed Repairs in this Implementation & Audit

1. **Flow 1 Counter-Sale Tenant Isolation (`MemberService.cs`):**
   - Authorization is verified prior to assigning an unassigned member's `CenterId`, preventing unauthorized cross-tenant member assignment. Verified in `LogicAudit`.

2. **Flow 2 Session Booking Center Isolation (`SessionBookingService.cs` & `ScheduleSupport.cs`):**
   - Self-booking validates that the member profile has an explicit center matching the target class/session center. Verified in `CoachBusinessAudit`.

3. **Flow 3 VNPay Signed Currency Validation (`VnPayService.cs`):**
   - Signed callbacks must match `VnPay:CurrCode` (defaults to VND). Correctly signed callbacks with non-matching currency (e.g., USD) are rejected. Verified in `CoachBusinessAudit`.

4. **Flow 4 Case-Insensitive Attendance Aggregation (`CoachWorkflowRules.cs`):**
   - KPI and dashboard aggregation utilizes ordinal case-insensitive matching (`CountsAsPresentAttendance`, `CountsAsAbsentAttendance`), preventing data omission between uppercase API writes (`PRESENT`) and title-case presentation. Verified in `CoachBusinessAudit`.

5. **Data Integrity & Schema Migration (`20261102120000_AddCommunicationDeliveryLocking.cs`):**
   - Added missing EF Core migration for `communication_deliveries` locking columns (`attempt_count`, `next_attempt_at`, `lease_until`, `locked_by`, `last_error`) and composite index. Fixed crashing `SaveChangesAsync` on leave requests and notification delivery. Verified in `LogicAudit`.

6. **API / Dependency Injection Decoupling (`R2StorageService.cs`, `LogicAudit/Program.cs`):**
   - Added optional `IAmazonS3? s3Client = null` parameter to `R2StorageService` primary constructor to allow injection of mock storage in test environments.
   - Registered `IBusinessClock`, `IProfileService`, and `IUserRepository` in test harness DI, resolving 500 errors on `/api/profile/me`, `/api/members/me`, and `/api/payments/...`. Verified in `LogicAudit`.

7. **Contract Consistency (`MediaStorageStatusDto.cs`):**
   - Added `TotalImages => TotalMedia` property to support both `totalMedia` and `totalImages` client JSON contracts. Verified in `LogicAudit`.

---

## Test Execution Summary Matrix

| Test Suite | Environment | Total Checks | Result | Execution Output |
|---|---|---|---|---|
| `LogicAudit` | SQL Server 2019 (`localhost`) | 107 | 107 PASS / 0 FAIL | `RESULT 107/107 passed` |
| `CoachBusinessAudit` | In-memory BLL verification | 17 | 17 PASS / 0 FAIL | `RESULT 17/17 checks passed` |
| `AiSafetyAudit` | In-memory AI safety engine | 19 | 19 PASS / 0 FAIL | `RESULT 19/19 checks passed` |
| `TimezoneAudit` | Timezone & calendar logic | 7 | 7 PASS / 0 FAIL | `Passed 7 Vietnam business-date checks` |
| `Frontend Automated Suite` | Node test runner | 145 | 145 PASS / 0 FAIL | `pass 145, fail 0` |
| `Backend Solution Compilation` | .NET SDK 10.0 | - | 0 Warnings, 0 Errors | `Build succeeded.` |
| `Frontend Production Build` | Vite production bundler | - | 0 Errors | `✓ built in 9.47s` |
