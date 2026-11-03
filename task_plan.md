# Task Plan: Olympic Sports Arena Visual Identity, Tab Clarity & Final Delivery

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
