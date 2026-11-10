# Task Plan

## Milestone 13: Đồng bộ màu toàn Frontend theo bảng màu Landing (đã duyệt, đang làm, 2026-11-07)
Mục tiêu: mọi trang (landing, login, OTP, member, coach, counter, manager, admin, payment-result…) dùng chung một
bảng màu lấy từ landing. Chỉ đổi styling; không đổi logic, API, routing, text. Landing nhìn y hệt hiện tại.
Chi tiết khảo sát và bảng màu: findings.md §13.

### Phương án token hoá (đã so sánh)
| | A. Ghi đè palette Tailwind (`slate`→navy, `emerald`→sage… trong config) | B. Codemod đổi tên class sang `brand-*` giữ nguyên nấc + semantic token | C. Viết lại tay từng component bằng semantic token |
|---|---|---|---|
| Công sức | Rất thấp (chỉ config) | Trung bình (script + rà từng phase) | Rất cao (14.230 chỗ) |
| Rủi ro vỡ giao diện | Thấp | Thấp–trung bình (giữ nấc, có test + soát mắt) | Cao |
| Rõ nghĩa / bảo trì | Kém: `bg-emerald-500` thực ra là sage, dễ gây nhầm | Tốt: tên class nói đúng màu brand; semantic cho phần dùng chung | Tốt nhất |
| Chặn màu lạc tông về sau | Không (palette mặc định vẫn "có vẻ" dùng được) | Có: tắt palette mặc định khỏi config sau khi migrate | Có |
**Đề xuất: B**, kết hợp semantic token cho shared/ui và widgets (phase a). A chỉ dùng tạm nếu cần đồng màu ngay trong 1 bước.

### Kiến trúc token
1. `app/styles/tokens.css` (mới, nguồn duy nhất): biến kênh RGB cho 6 thang `--brand-{navy|sage|sand|terra|teal|danger}-{50..950}`
   (tĩnh, không đổi theo dark mode) + semantic token đổi theo `html.dark`:
   `--color-primary, --color-primary-hover, --color-primary-strong, --color-secondary, --color-accent, --color-accent-hover,
   --color-surface, --color-surface-muted, --color-surface-raised, --color-border, --color-text (ink), --color-text-muted,
   --color-success/-soft, --color-warning/-soft, --color-danger/-soft, --color-info/-soft, --color-focus`.
2. `tailwind.config.cjs`: `colors.brand.{navy,sage,sand,terra,teal,danger}.{50..950}` + semantic
   (`primary`, `secondary`, `accent`, `surface`, `ink`, `ink-muted`, `line`, `success`, `warning`, `danger`, `info`) dạng
   `rgb(var(--…) / <alpha-value>)` để giữ được `bg-primary/20`. Palette categorical cho biểu đồ: `chart-1..8` từ màu gốc.
3. `theme.css` + `tiya-theme.css`: bỏ định nghĩa màu trùng; `--primary-color`, `--secondary-color`, `--fpt-*`, `--p-color`…
   thành alias trỏ vào token (comment `@deprecated`). `colors.fpt.*` giữ lại, trỏ sang token, đánh dấu deprecated.
4. Sau phase cuối: bỏ palette Tailwind mặc định không còn dùng (giữ white/black/transparent/current) để chặn tái phát.

### Quy tắc map (codemod, giữ nguyên nấc 50–950, kể cả tiền tố `dark:`, `hover:`, `/opacity`)
- slate, gray, zinc, neutral, stone → `brand-navy`
- emerald, green, lime → `brand-sage` · teal, cyan → `brand-teal` · amber, yellow → `brand-sand`
- orange → `brand-terra` · rose, red, pink → `brand-danger`
- blue, sky → **(cần quyết)** · indigo, violet, purple → **(cần quyết)**
- Hex tùy ý: `[#81B29A]`→`brand-sage-500`, `[#2D6A4F]`→`brand-sage-700`, `[#F2CC8F]`→`brand-sand-300` … (bảng đầy đủ sinh từ findings §13.4);
  hex lạc tông (`[#4F46E5]`, `[#E5A33C]`…) map về nấc gần nhất của thang tương ứng.
- Nâng nấc chữ để đạt AA **(cần quyết)**: `text-brand-{sage,sand,terra,teal}-{500,600}` không có tiền tố `dark:` → `-700`.
- Inline `style` hex của biểu đồ → `chart-*` token (đọc qua `getComputedStyle` hoặc hằng số dùng chung).

### Các phase (mỗi phase: codemod → build → npm test → test trình duyệt liên quan → soát mắt light/dark → ghi progress.md)
- [x] 0. Khảo sát màu landing, thống kê baseline, sinh thang + bảng tương phản (findings §13)
- [ ] 1. Token layer: tokens.css, tailwind.config.cjs, alias deprecated trong theme.css/tiya-theme.css. Landing chưa đổi gì → so ảnh chụp trước/sau phải trùng.
- [ ] a. shared/ui + widgets (Button, Modal, Table, StatCard, BusinessAlert, Toast, Logo, app-shell Header/Sidebar/Layout, support-inbox, …) — dùng semantic token
- [ ] b. auth: login, otp-verification (+ features/auth)
- [ ] c. member-* (+ features/member-ai-chat, notifications)
- [ ] d. coach-* (+ features/coach-workspace, widgets/coach-performance)
- [ ] e. counter-* / receptionist (member-lookup, member-checkin, counter-*, receptionist-dashboard, features/counter-desk)
- [ ] f. manager-*, admin-dashboard, audit-logs, roles-permissions, payroll
- [ ] g. payment-result, landing (chỉ đổi sang token, giá trị y hệt), các trang còn lại; bỏ palette mặc định khỏi config
- [ ] Kiểm chứng cuối: build, npm test, mọi test:*:browser, grep thống kê lại so với baseline, ảnh chụp landing + 1 trang/role × light/dark

### Công cụ kiểm chứng sẽ dùng
- Ảnh chụp tự động (Chrome headless, cùng khung test trình duyệt hiện có) cho landing + 1 trang mỗi role × light/dark, trước và sau mỗi phase.
- Script đo tương phản các cặp token chính (findings §13.5) chạy lại sau khi chốt thang.
- grep baseline (findings §13.2) để báo số class mặc định còn sót.

### Quyết định đã duyệt (2026-11-07)
- Phương án **B** (codemod brand-* giữ nấc + semantic token cho shared/ui).
- blue/sky → **brand-teal** (info); indigo/violet/purple → **brand-navy** (secondary).
- Landing: **chỉnh nhẹ cho đạt AA** (muted text tối hơn chút; chữ trắng trên sage/teal/terracotta dùng nấc đậm hơn).
- **Nâng nấc chữ** text-{sage,sand,terra,teal}-{500,600} (không có dark:) → 700.

### (Lưu trữ) Câu hỏi đã trình duyệt
1. Chọn phương án B (khuyến nghị) hay A.
2. `blue/sky` và `indigo/violet/purple` map sang đâu (đề bài: primary hoặc secondary).
3. Landing: giữ y hệt kể cả 4 cặp chưa đạt AA, hay chỉnh nhẹ (`--p-color` #717275 → ~#66676B; chữ trắng trên sage/teal/terracotta → dùng nấc đậm hơn).
4. Quy tắc nâng nấc chữ 500/600 → 700 cho AA.

## Milestone 12: Frontend Feature-Sliced Design migration (Phase 1-3a done, 2026-11-07)
Goal: finish the half-done FSD migration. Real code moves out of role folders (`features/<role>`) into
FSD layers; pass-through wrappers and shim folders are removed. Behaviour and UI must not change.

Layers (upper may import lower only): app → pages → widgets → features → entities → shared.
- [x] Phase 1 — relocate files (no logic changes): script-driven `git mv` + import rewrite.
  - pages/<route-slice>/ui + index.js (one slice per route; router lazy-loads the slice index)
  - widgets: app-shell (AppLayout/Header/Sidebar), support-inbox, coach-performance, member-reminders
  - features: auth, profile-edit, notifications, media-upload, member-ai-chat, refund-review,
    coach-workspace (CoachShared), counter-desk (ReceptionistShared), payment-checkout
  - entities: session (AuthContext), permission, member, coach, membership, landing-content, catalog
  - shared: api (http/authState/api/backendApi), lib (helpers, dateTime, motion, useCountUp),
    i18n (LanguageContext), ui (+ toast)
  - app: router (+RoleGuard), styles
  - delete: old pages/ wrappers, context/, components/, shared/components/, domain wrapper folders,
    duplicate useNotifications, .js re-export twins, BOMs
- [x] Phase 1 verification: orphan scan = 0, layer-violation scan = 0, `npm test`, `npm run build`,
      browser tests.
- [x] Phase 2 — split `shared/api/backendApi.js` + `api.js` into `entities/<x>/api` (@x for member→staff, class→report; AdminDashboard + PaymentResult moved onto entity APIs; tests use tests/helpers/apiSources.cjs).
- [x] Phase 3a — extract sub-components, helpers and constants of large pages into slice ui/lib/model files;
      dedupe identical helpers (shared/lib/calendar, greeting, avatarGradient; shared/ui/gradients;
      features/coach-workspace CoachCards); delete dead code (FacilitiesTab, 3 unused charts, StatusBadge,
      QUICK_SUGGESTIONS); fix MyAttendance ReferenceError and ForgotPasswordModal window.React dependency.
- [ ] Phase 3b — split huge component functions into model/use<Page>.js hook + ui/ section components
      (browser test added before each split).
  - [x] ClassesAndRooms 2140→247, StaffManagement 1914→153, HomeContentManagement 1654→198, PayrollPage 1607→94
  - [x] Fixed: PayrollPage read non-existent useAuth().user → managers/admins never got the payroll report
  - [x] ReportsAnalytics 1580→185, Attendance 1517→235, MemberManagement 1321→133, LandingPage 1254→143,
        MemberDashboard 1215→151, AdminDashboard 1201→178, ClassScheduleView 1119→125, TeachingSchedule 1103→141,
        TrainingPlan 1082→102, CoachAssignment 1043→130, MemberCheckIn 1019→290 (all pages now < 1000 lines)
  - [x] New browser coverage: admin.browser.cjs (new), payroll, members, reports tables, attendance, teaching
        schedule, training plans, member dashboard + class schedule booking, check-in desk
  - [x] Removed vite resolve-js-to-jsx + auto-import-react plugins and window.React globals (no longer needed)
  - [ ] Optional next: ~900-line pages (SupportRequests, PackageManagement, ManagerDashboard, MySupportRequests, ...)

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
