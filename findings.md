# Key Findings — Senior Feature-First Full-Stack Audit & Hardening

## 0. Executive Summary of Confirmed Logic Repairs & SQL Execution

### 0.1 Host SQL Server Instance Discovery & Execution
- **Observation:** Prior audit noted tests were `UNVERIFIED` due to LocalDB absence.
- **Root Cause & Resolution:** The default host SQL Server instance (`MSSQLSERVER`, version 15.0.2200 / SQL Server 2019) is active and running on `localhost`.
- **Action:** Enabled flexible connection fallback to `Server=localhost;Database=master;Integrated Security=true;TrustServerCertificate=true` in `LogicAudit`. Each test run provisions a completely isolated temporary database (`SCMS_LogicAudit_<Guid>`), runs full EF Core migrations, executes integration and HTTP assertions, and safely drops the database on completion.
- **Evidence:** `LogicAudit` executed on SQL Server: **107/107 checks PASSED**.

---

### 0.2 Confirmed Bug 1: Missing EF Core Migration for `communication_deliveries` Locking Columns
- **Severity:** High / Data Integrity
- **Location:** `Backend/SportsCenterManagement.DAL/Entities/CoachProfessionalEntities.cs` & `BackgroundServices/CommunicationDeliveryWorker.cs`
- **Root cause:** Properties `AttemptCount`, `NextAttemptAt`, `LeaseUntil`, `LockedBy`, and `LastError` were added to the C# entity and query index in `SportsCenterDbContext`, but no EF Core migration was generated. Whenever any service (like `RequestLeave` or notification dispatch) inserted or queried `communication_deliveries`, SQL Server threw: `Invalid column name 'attempt_count', 'last_error', 'lease_until', 'locked_by', 'next_attempt_at'`.
- **Repair:** Added EF Core migration `20261102120000_AddCommunicationDeliveryLocking.cs` adding the missing columns and the composite index `IX_communication_deliveries_status_next_attempt_at_lease_until`.
- **Evidence:** Concurrent leave requests and all 15 notification/email OTP checks: **PASS**.

---

### 0.3 Confirmed Bug 2: Missing DI Registrations in Test/API Harness
- **Severity:** High / Runtime 500 Failures
- **Location:** `LogicAudit/Program.cs`
- **Root cause:**
  1. `MemberService` required `IBusinessClock`, but `IBusinessClock` was not registered in DI.
  2. `ProfileController` required `IProfileService`, which in turn required `IUserRepository`, neither of which were registered.
  3. Consequently, calls to `/api/members/me`, `/api/profile/me`, and `/api/payments/pending-invoice/...` failed with HTTP 500 during controller activation.
- **Repair:** Registered `IBusinessClock`, `IProfileService`, `IUserRepository`, and generic repository implementations in the DI container.
- **Evidence:** All Profile, Member, and Payment HTTP endpoints: **PASS**.

---

### 0.4 Confirmed Bug 3: `R2StorageService` Inflexibility for Mocked Storage
- **Severity:** Medium / Testability
- **Location:** `Backend/SportsCenterManagement.API/Services/R2StorageService.cs`
- **Root cause:** `R2StorageService` hardcoded creation of `AmazonS3Client` via configuration credentials without accepting an injected `IAmazonS3` instance from DI, crashing tests running with mocked storage providers.
- **Repair:** Allowed optional `Amazon.S3.IAmazonS3? s3Client = null` in `R2StorageService` primary constructor. When provided via DI, it is utilized directly; otherwise it creates the client from `R2StorageOptions`.
- **Evidence:** All R2 media and proof security checks: **PASS**.

---

### 0.5 Confirmed Bug 4: `MediaStorageStatusDto` Property Contract Mismatch
- **Severity:** Low / Contract Consistency
- **Location:** `Backend/SportsCenterManagement.BLL/DTOs/Media/MediaStorageStatusDto.cs`
- **Root cause:** Contract required `totalImages` count, but DTO only exposed `TotalMedia`, causing deserialization failure in clients checking `totalImages`.
- **Repair:** Added `public int TotalImages => TotalMedia;` property to `MediaStorageStatusDto`.
- **Evidence:** `media status does not expose another center's image count`: **PASS**.

---

### 0.6 Confirmed Bug 5: Flow 1 Counter-Sale Tenant Isolation
- **Location:** `Backend/SportsCenterManagement.BLL/Services/MemberService.cs`, `EnsureCanSellToMemberAsync`.
- **Root cause:** A receptionist/manager's center authorization was checked only after an unassigned member's `CenterId` had been mutated and saved. An unauthorized counter-sale request could return 403 while persisting a cross-tenant ownership assignment.
- **Repair:** Validate staff authorization for the target package center before any member mutation.
- **Evidence:** `LogicAudit` verifies an unauthorized counter sale leaves `CenterId` null: **PASS**.

---

### 0.7 Confirmed Bug 6: Flow 2 Session Booking Center Isolation
- **Location:** `Backend/SportsCenterManagement.BLL/Services/SessionBookingService.cs` & `ScheduleSupport.cs`.
- **Root cause:** An unassigned member profile without a center was allowed to book sessions across any center.
- **Repair:** Added check `EnsureMemberCenter(member.CenterId, session.Class.CenterId)` requiring an explicit center match before booking.
- **Evidence:** `CoachBusinessAudit` check `session booking requires an explicit member-center assignment`: **PASS**.

---

### 0.8 Confirmed Bug 7: Flow 3 VNPay Signed Currency Mismatch
- **Location:** `Backend/SportsCenterManagement.BLL/Services/VnPayService.cs`, `ProcessCallback`.
- **Root cause:** `vnp_CurrCode` was parsed but not validated against configured currency. A correctly signed callback with mismatched currency (e.g., USD instead of VND) could proceed to payment completion.
- **Repair:** Provider validation requires an exact match with configured `VnPay:CurrCode` (defaults to VND).
- **Evidence:** `CoachBusinessAudit` regression test: **PASS**.

---

### 0.9 Confirmed Bug 8: Flow 4 Case-Insensitive Attendance Aggregation
- **Location:** `Backend/SportsCenterManagement.BLL/Services/CoachWorkflowRules.cs` & `CoachProfessionalService.cs`.
- **Root cause:** Attendance status writes used uppercase `PRESENT`/`ABSENT`, while KPI aggregation compared against title-case `Present`/`Absent`.
- **Repair:** Introduced `CountsAsPresentAttendance` and `CountsAsAbsentAttendance` with ordinal case-insensitive matching.
- **Evidence:** `CoachBusinessAudit`: **PASS**.

---

## 1. Automated Test Execution Summary Across All Suites

| Suite | Description | Total Tests | Passed | Failed | Status |
|---|---|---|---|---|---|
| **LogicAudit** | End-to-end integration suite against isolated SQL Server (Flows 1, 2, 3, 4, Security, R2, Sessions) | 107 | 107 | 0 | **PASS** |
| **CoachBusinessAudit** | Coach roster, teaching schedule, leaf replacements, VNPay currency, attendance rules | 17 | 17 | 0 | **PASS** |
| **AiSafetyAudit** | Biometric validation, medical restrictions, prompt safety, NLP schema parser | 19 | 19 | 0 | **PASS** |
| **TimezoneAudit** | Vietnam business calendar (`Asia/Ho_Chi_Minh`), leap year, midnight boundary | 7 | 7 | 0 | **PASS** |
| **Frontend Node Suite** | UI state, auth token isolation, booking modals, timezone consistency, calendar grids | 145 | 145 | 0 | **PASS** |
| **Frontend Production Build** | Vite production bundle compilation & static asset distribution | 1 | 1 | 0 | **PASS** |
