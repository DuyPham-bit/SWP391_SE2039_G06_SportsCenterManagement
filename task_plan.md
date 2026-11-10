# Task Plan: Olympic Sports Arena Visual Identity, Tab Clarity & Final Delivery

## Landing sync — 2026-11-04 (scope expanded by user to full landing)

- [x] User authorized full local landing text/layout plus R2 image references. No R2 writes or business-data imports.
- [x] Write failing planner/full-copy tests, then implement standalone PostgreSQL CLI; dry-run remains the default.
- [x] Require reviewed snapshot hash for apply, durable backup before commit, and guarded rollback.
- [x] Verify ID collisions, reordered arrays, image-only preservation, full-content copy, idempotency and rollback on disposable migrated PostgreSQL DBs.
- [x] Connect read-only to configured Render DB. It has no landing setting and lacks uploaded_media.storage_key.
- [ ] Waiting for correct Render backend deployment/database schema before actual preview/apply. No Render writes performed.

## PostgreSQL integration delivery — 2026-11-04

- [x] Backup local work to dome-94/sports-center-manager, fix/learn-docker (cce0a47).
- [x] Integrate DuyPham-bit feature/rbac-admin-manager-integrated (2afa9c5), preserving PostgreSQL/Docker and media IDs.
- [x] Resolve structural conflicts; retain the active PostgreSQL migration chain and archive SQL Server history.
- [x] Build backend solution with zero warnings/errors; frontend tests pass (151 checks).
- [x] Complete production frontend/Docker builds, PostgreSQL integration audit and final regression checks.
- Publication destination: DuyPham-bit/SWP391_SE2039_G06_SportsCenterManagement, deploy/scms-v1.1. Commit/push and remote hash verification follow this pre-commit log; backup remains on dome-94.

## Milestone 6: SCMS Flow 1 Audit & Hardening (Completed & Verified)
- [x] Map Flow 1 authentication, member ownership, membership purchase, package management, and audit seams.
- [x] Fix unauthorized counter-sale request mutating an unassigned member's `CenterId` (`MemberService.cs`).
- [x] Fix DI registration of `IBusinessClock`, `IProfileService`, and `IUserRepository` in test harness and API layer.
- [x] Execute SQL-backed verification for authentication, OTP challenge/limit, HttpOnly cookie tab isolation, password reset/change lifecycle, and tenant boundaries: PASS (107/107).

## Milestone 7: SCMS Flow 2 Audit & Hardening (Completed & Verified)
- [x] Trace class/schedule management, session booking, cancellation, staff-assisted booking, coach roster, and attendance boundaries.
- [x] Enforce explicit `CenterId` requirement for member profile self-booking in `SessionBookingService.cs` and `ScheduleSupport.cs`.
- [x] Run SQL-backed concurrency tests for overlapping coach bookings and concurrent leave requests: PASS.
- [x] Verified frontend calendar scheduling, booking state refresh, and coach business rules: PASS (145/145 frontend tests, 17/17 coach business audit).

## Milestone 8: SCMS Flow 3 Audit & Hardening (Completed & Verified)
- [x] Trace gateway initiation, signed VNPay/MoMo callback/IPN, counter collection, refund, and reporting boundaries.
- [x] Confirmed server-side amount/reference comparison, idempotency, provider-transaction uniqueness, subscription activation, refund reservation, and center-scoped report queries.
- [x] Reject VNPay callbacks whose signed `vnp_CurrCode` differs from configured currency (`VnPayService.cs`): Verified in `CoachBusinessAudit`.
- [x] Execute isolated SQL integration tests for callback replay, concurrent payment attempts, and revenue/refund aggregation: PASS (107/107 in `LogicAudit`).

## Milestone 9: SCMS Flow 4 Audit & Hardening (Completed & Verified)
- [x] Fix case-insensitive attendance matching (`CountsAsPresentAttendance`, `CountsAsAbsentAttendance` in `CoachWorkflowRules.cs`).
- [x] Add missing EF Core migration for `communication_deliveries` locking columns (`20261102120000_AddCommunicationDeliveryLocking.cs`).
- [x] Verify coach professional workspace, leave requests with replacement coach, compensation policies, and workout progress tracking: PASS (17/17 coach audit, 107/107 logic audit).

## Milestone 10: SCMS Flow 5 & 6 AI Recommendations & Assistant (Completed & Verified)
- [x] Verified clinical assessment, biometric override (BMI/underweight/overweight), safety restriction guards, and NLP parsing: PASS (19/19 in `AiSafetyAudit`).
- [x] Verified multi-account and center isolation in frontend AI chat (`MemberAIChatPopup.jsx`): PASS (145/145 frontend suite).

## Milestone 11: Production Verification & Build Synchronization
- [x] Backend solution build (`SWP391_SE2039_G06_SportsCenterManagement1.slnx`): 0 warnings, 0 errors.
- [x] Frontend automated tests (`npm test`): 145/145 PASS.
- [x] Backend verification suites executed against real SQL Server:
  - `LogicAudit`: 107/107 PASS.
  - `CoachBusinessAudit`: 17/17 PASS.
  - `AiSafetyAudit`: 19/19 PASS.
  - `TimezoneAudit`: 7/7 PASS.
- [x] Frontend production bundle built and synchronized to `Backend/SportsCenterManagement.API/wwwroot`.
## Report period/refund review — 2026-11-06

- Scope: shared manager/admin report filters, printed period, dashboard revenue breakdown; preserve collection/refund processing-date accounting.
- [x] Establish the missing shared-period seam with a failing regression; verify quick-filter dates and print metadata in Chrome.
- [x] Share validated Vietnam period resolution between report requests and controls; distinguish draft dates from applied data.
- [x] Show applied dashboard/report period and complete gross/refund breakdown.
- [x] Run focused/browser regressions, frontend suite/build, backend build; inspect final diff.
- Graphify executable and supplemental named debugging/UI/TDD skills are unavailable in this environment; use targeted source inspection and the installed code-work workflow.
