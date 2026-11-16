# Backend Logic Hardening & Production Ready Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix and harden the Backend against all 7 identified audit issues (`BE-003 → BE-001 → BE-002 → BE-005 → BE-004 → BE-006 → BE-007`) without breaking existing REST API contracts or frontend functionality.

**Architecture:** ASP.NET Core 8 Web API + Entity Framework Core (SQL Server) + Cloudflare R2 / S3-compatible Object Storage + Background Hosted Service (IHostedService). Maintain strict 3-tier decoupling (API → BLL → DAL).

**Tech Stack:** C# 12, .NET 8, EF Core 8, AWSSDK.S3, Microsoft.AspNetCore.HttpOverrides, Microsoft.Extensions.Diagnostics.HealthChecks.

**Spec:** Priority order requested by user:
1. `BE-003` (High) — Refund proof privacy & access control
2. `BE-001` (High) — Notification worker concurrency lease & retry backoff
3. `BE-002` (High) — HTTPS webhook enforcement & secret sanitization
4. `BE-005` (Medium) — Forwarded headers & real client IP behind reverse proxy
5. `BE-004` (Medium) — Startup migration & seeding concurrency lock
6. `BE-006` (Medium) — Centralized business clock (`IBusinessClock`)
7. `BE-007` (Low) — Observability health check endpoints (`/health/live`, `/health/ready`)

---

## Global Constraints
- Do not break existing API contracts or response schemas used by the React Frontend.
- Do not introduce breaking database schema changes for existing operational tables.
- All timestamps in SQL Server database must be stored in UTC (`DateTimeKind.Utc`).
- Preserve 3-tier boundary: Controllers call BLL; BLL calls DAL; DAL encapsulates EF Core queries.
- Build must always compile cleanly: 0 warnings, 0 errors.

---

## Review Focus
1. **BE-003 (Refund Proof Leak):** Direct GET request to R2 public domain for `refund-bills/` must not be publicly guessable or cached publicly. Authorized Manager of Center 15 must be able to view Center 15 proof, but rejected if accessing Center 16 proof.
2. **BE-001 (Worker Concurrency):** Multiple instances of `CommunicationDeliveryWorker` running simultaneously against the same DB must never deliver the same notification twice.
3. **BE-002 (Insecure Webhook):** Setting an `http://` webhook for external notifications must be rejected at startup or skipped with an alert in production.
4. **BE-005 (Client IP behind Reverse Proxy):** VNPay return and RateLimiter must see real client IP (`X-Forwarded-For`), not internal proxy IP `127.0.0.1`.
5. **BE-006 (Timezone Midnight Shift):** Midnight transitions and booking dates must remain consistent with Vietnam timezone (`UTC+7`) without hardcoding `.AddHours(7)`.

---

## Detailed Tasks

### Task 1: BE-003 (High) — Refund Proof Privacy & Signed URL Access Control

**Files:**
- Modify: `Backend/SportsCenterManagement.API/Services/IR2StorageService.cs`
- Modify: `Backend/SportsCenterManagement.API/Services/R2StorageService.cs`
- Modify: `Backend/SportsCenterManagement.BLL/Services/PaymentService.cs`
- Modify: `Backend/SportsCenterManagement.API/Controllers/PaymentsController.cs`

**Steps:**
- [ ] In `IR2StorageService`: add method `Task<string> GetPresignedUrlAsync(string key, TimeSpan expiresIn, CancellationToken ct = default);`.
- [ ] In `R2StorageService`:
  - Implement `GetPresignedUrlAsync` using `S3Client.GetPreSignedURLAsync(new GetPreSignedURLRequest { BucketName = ..., Key = ..., Expires = DateTime.UtcNow.Add(expiresIn) })`.
  - In `UploadImageAsync`, when `folder == "refund-bills"`, set `request.Headers.CacheControl = "private, no-cache, no-store, max-age=0";` (do not set public immutable).
  - In `UploadRefundBillAsync`, persist relative key (`refund-bills/yyyy/MM/...`) rather than public URL.
- [ ] In `PaymentService`:
  - In `GetManualRefundRequestsAsync`, when returning `TransferProofUrl`, if it starts with `refund-bills/`, do NOT prepend public domain; either return the relative key or delegate presigned URL generation.
- [ ] In `PaymentsController`:
  - Add endpoint `GET /api/payments/refunds/{id}/proof`:
    - `[Authorize(Roles = "MANAGER,ADMIN")]`
    - Verify Manager center tenancy (Manager's `CenterId` must match invoice `CenterId`; Admin can access all).
    - Generate presigned URL with 5-minute TTL via `IR2StorageService.GetPresignedUrlAsync`.
    - Return `Ok(new { proofUrl, expiresInSeconds = 300 })`.
- [ ] Verify build: `dotnet build Backend/SportsCenterManagement.sln`.

---

### Task 2: BE-001 (High) — Notification Worker Concurrency Lease & Retry Backoff

**Files:**
- Modify: `Backend/SportsCenterManagement.DAL/Entities/CoachProfessionalEntities.cs`
- Modify: `Backend/SportsCenterManagement.DAL/Context/SportsCenterDbContext.cs`
- Modify: `Backend/SportsCenterManagement.API/BackgroundServices/CommunicationDeliveryWorker.cs`

**Steps:**
- [ ] In `CommunicationDelivery` entity:
  - Add `public int AttemptCount { get; set; } = 0;`
  - Add `public DateTime? NextAttemptAt { get; set; }`
  - Add `public DateTime? LeaseUntil { get; set; }`
  - Add `public string? LockedBy { get; set; }`
  - Add `public string? LastError { get; set; }`
- [ ] In `SportsCenterDbContext.OnModelCreating`:
  - Map new columns with appropriate indexes: index on `(Status, NextAttemptAt, LeaseUntil)`.
- [ ] In `CommunicationDeliveryWorker`:
  - Generate unique worker instance ID on startup: `private readonly string _workerId = $"{Environment.MachineName}-{Guid.NewGuid():N}";`.
  - Batch Claim: In a transaction or atomic SQL update, query up to 50 deliveries where:
    - `Status == "Queued"` OR (`Status == "Processing"` AND `LeaseUntil < UtcNow`)
    - AND (`NextAttemptAt == null` OR `NextAttemptAt <= UtcNow`)
    - AND `Channel` in enabled channels.
    - Set `Status = "Processing"`, `LockedBy = _workerId`, `LeaseUntil = UtcNow.AddMinutes(2)`, `AttemptCount = AttemptCount + 1`.
  - Process claimed batch:
    - Pass `X-Delivery-Id: {delivery.Id}` header to webhook provider for idempotency.
    - On success: set `Status = "Sent"`, `SentAt = UtcNow`, clear lock.
    - On network/HTTP failure:
      - If `AttemptCount < 5`: set `Status = "Queued"`, `NextAttemptAt = UtcNow.AddMinutes(Math.Pow(2, AttemptCount))`, `LastError = ex.Message`.
      - If `AttemptCount >= 5`: set `Status = "Failed"`, `LastError = ex.Message`.
- [ ] Verify build: `dotnet build Backend/SportsCenterManagement.sln`.

---

### Task 3: BE-002 (High) — HTTPS Webhook Enforcement & Secret Sanitization

**Files:**
- Modify: `Backend/SportsCenterManagement.API/BackgroundServices/CommunicationDeliveryWorker.cs`
- Modify: `Backend/SportsCenterManagement.API/Program.cs`

**Steps:**
- [ ] In `CommunicationDeliveryWorker`:
  - Filter webhook URLs strictly by `uri.Scheme == Uri.UriSchemeHttps`.
  - In Development mode, allow `http://localhost` or `http://127.0.0.1` for local webhook mock testing.
- [ ] In error logging:
  - Redact Authorization header values and email/phone bodies from exception log messages.
- [ ] In `Program.cs`:
  - Validate `ExternalCommunications` configuration on startup, logging a warning if any production external webhook is configured without HTTPS.
- [ ] Verify build: `dotnet build Backend/SportsCenterManagement.sln`.

---

### Task 4: BE-005 (Medium) — Reverse Proxy Forwarded Headers & Real IP

**Files:**
- Modify: `Backend/SportsCenterManagement.API/Program.cs`
- Modify: `Backend/SportsCenterManagement.API/Controllers/PaymentsController.cs`

**Steps:**
- [ ] In `Program.cs`:
  - Configure `builder.Services.Configure<ForwardedHeadersOptions>(options => { options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto; options.KnownNetworks.Clear(); options.KnownProxies.Clear(); });`.
  - Add `app.UseForwardedHeaders();` as the very first middleware before RateLimiter, CORS, and Auth.
- [ ] In `PaymentsController`:
  - Create client IP resolver:
    ```csharp
    private string GetClientIpAddress()
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        return string.IsNullOrWhiteSpace(ip) || ip == "::1" ? "127.0.0.1" : ip;
    }
    ```
  - Use `GetClientIpAddress()` when creating VNPay payment URLs.
- [ ] Verify build: `dotnet build Backend/SportsCenterManagement.sln`.

---

### Task 5: BE-004 (Medium) — Safe Startup Migration / Seeding Guard

**Files:**
- Modify: `Backend/SportsCenterManagement.API/Program.cs`
- Modify: `Backend/SportsCenterManagement.DAL/Context/DbInitializer.cs`

**Steps:**
- [ ] In `Program.cs`:
  - Read configuration `bool autoMigrate = app.Configuration.GetValue<bool>("Database:AutoMigrateOnStartup", app.Environment.IsDevelopment());`.
  - If `autoMigrate` is true:
    - Acquire SQL application lock (`sp_getapplock`) before running `MigrateAsync` to prevent multi-container startup race conditions.
    - Release lock (`sp_releaseapplock`) in `finally`.
  - Ensure `AdminBootstrapper.SeedAsync` is strictly idempotent (checks `db.Users.AnyAsync(u => u.Username == adminUsername)` before inserting).
- [ ] Verify build: `dotnet build Backend/SportsCenterManagement.sln`.

---

### Task 6: BE-006 (Medium) — Centralized Business Clock (`IBusinessClock`)

**Files:**
- Create: `Backend/SportsCenterManagement.BLL/Services/Interfaces/IBusinessClock.cs`
- Create: `Backend/SportsCenterManagement.BLL/Services/BusinessClock.cs`
- Modify: `Backend/SportsCenterManagement.BLL/Services/CheckinService.cs`
- Modify: `Backend/SportsCenterManagement.BLL/Services/VnPayService.cs`
- Modify: `Backend/SportsCenterManagement.BLL/Services/MemberService.cs`
- Modify: `Backend/SportsCenterManagement.BLL/Services/StaffManagementService.cs`
- Modify: `Backend/SportsCenterManagement.API/Controllers/ClassResourcesController.cs`
- Modify: `Backend/SportsCenterManagement.API/Program.cs`

**Steps:**
- [ ] Create `IBusinessClock` interface:
  - `DateTime UtcNow { get; }`
  - `DateTime BusinessNow { get; }`
  - `DateOnly Today { get; }`
  - `TimeZoneInfo TimeZone { get; }`
  - `DateOnly ToBusinessDate(DateTime utcDateTime);`
  - `DateTime StartOfBusinessDayUtc(DateOnly businessDate);`
  - `DateTime EndOfBusinessDayUtc(DateOnly businessDate);`
- [ ] Implement `BusinessClock` reading `"Reports:TimeZoneId"` (fallback to `SE Asia Standard Time` / `Asia/Ho_Chi_Minh`).
- [ ] Register `IBusinessClock` as Singleton in `Program.cs`.
- [ ] Replace `DateTime.UtcNow.AddHours(7)` across all 5 files with `_clock.Today`, `_clock.BusinessNow`, etc.
- [ ] Verify build: `dotnet build Backend/SportsCenterManagement.sln`.

---

### Task 7: BE-007 (Low) — Observability Health Check Endpoints

**Files:**
- Modify: `Backend/SportsCenterManagement.API/Program.cs`

**Steps:**
- [ ] In `Program.cs`:
  - `builder.Services.AddHealthChecks().AddDbContextCheck<SportsCenterDbContext>("database", tags: new[] { "ready" });`.
  - `app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false });` (Liveness: returns 200 without DB hit).
  - `app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = check => check.Tags.Contains("ready") });` (Readiness: verifies SQL Server connectivity).
  - Also alias `/health` to readiness check for general load balancers.
- [ ] Verify build: `dotnet build Backend/SportsCenterManagement.sln`.

---

## Final Verification
- [ ] `dotnet build Backend/SportsCenterManagement.sln` -> 0 errors, 0 warnings.
- [ ] Test endpoints via curl / HTTP:
  - `GET http://localhost:5000/health/live` -> 200 Healthy
  - `GET http://localhost:5000/health/ready` -> 200 Healthy
- [ ] Git commit and push to branch.

