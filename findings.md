# Findings — Milestone 13: Đồng bộ màu toàn Frontend theo bảng màu Landing (Bước 0, 2026-11-07)

## 13.1 Hiện trạng nguồn màu
- `theme.css` và `tiya-theme.css` **cùng định nghĩa `--primary-color`**: theme.css = `#1A3B8B` (FPT blue), tiya-theme.css = `#81B29A` (sage). `main.jsx` nạp tiya-theme.css sau nên giá trị hiệu lực là sage; mọi chỗ dùng `--fpt-*` / `colors.fpt.*` vẫn ra xanh/cam FPT.
- `tailwind.config.cjs`: chỉ có `colors.fpt.*` (blue `#1A3B8B`, orange `#F26522`, green `#008744`), `darkMode: 'class'`, Tailwind **3.4** (không có `@theme` của v4 → token khai báo bằng `rgb(var(--x) / <alpha-value>)`).
- Dark mode: `html.dark` + 5.828 lớp `dark:` viết tay theo từng nấc.

## 13.2 Thống kê màu trong `Frontend/src` (baseline để so sánh sau migrate)
| Loại | Số lượt |
|---|---|
| Class màu Tailwind mặc định (mọi tiền tố bg/text/border/ring/from/via/to/fill/stroke/…) | **14.230** trên **238 file** |
| ↳ slate 8.817 · emerald 1.621 · amber 1.196 · rose 789 · red 407 · blue 360 · teal 255 · sky 213 · indigo 209 · purple 158 · cyan 79 · orange 51 · lime 38 · gray 25 · violet 7 · yellow 3 · pink 1 · green 1 | |
| Riêng landing (`pages/landing`) | 122 (slate 40, emerald 26, amber 19, teal 17, rose 16, …) |
| Class hex tùy ý `[#xxxxxx]` | 2.187 (đa số đã là brand: `[#81B29A]` 548, `[#2D6A4F]` 477, `[#F2CC8F]` 188, `[#1E2235]` 122, `[#1B4332]` 109, `[#24828F]` 98, `[#2F7B5D]` 82, `[#E5A33C]` 65 …; lạc tông: `[#4F46E5]` 22, `[#3730A3]` 12 (indigo), `[#5E4014]`, `[#184534]`, `[#144850]` …) |
| Class màu ghép động (`bg-${x}-500`) | **0** → codemod đổi tên class an toàn |
| Hex trong `style={{…}}` inline (chủ yếu biểu đồ) | 43 |
| Hex trong `theme.css` | 111 |

## 13.3 Bảng màu gốc cuối cùng (quét landing: tiya-theme.css + pages/landing/ui)
| Vai trò | Màu | Nguồn |
|---|---|---|
| Navy / ink (secondary) | `#3D405B`; tối hơn: `#2B2D42`, `#1E2235` (nền dark), `#25283C`, `#32354D` | tiya-theme, landing dark |
| Sage (primary) | `#81B29A`; `#5E987E`; đậm `#2D6A4F`, `#2F7B5D`; rừng `#1B4332` | landing, app |
| Cream (surface) | `#F4F1DE`; off-white ấm `#FAF8F5` | tiya-theme |
| Sand / gold (accent, CTA) | `#F2CC8F`; `#F5CF96`, `#E9B872`, gold `#E5A33C` | tiya-theme, app |
| Terracotta (hover / nhấn) | `#E07A5F`; đậm `#D45D3E` | tiya-theme |
| Teal phụ | `#3FAEB8`, `#24828F`; nhạt `#A8DADC`; đậm `#1B5760` | landing |
| Muted text | `#717275` | tiya-theme `--p-color` |
| Màu bổ sung bị bỏ sót trong đề bài | `#1B4332`, `#5E987E`, `#D45D3E`, `#E9B872`, `#E5A33C`, `#A8DADC`, `#FAF8F5`, dải navy tối `#1E2235/#25283C/#2B2D42/#32354D` | |

## 13.4 Thang 50–950 (bản nháp, OKLCH, neo đúng màu gốc)
Mỗi thang bám độ sáng của **họ Tailwind mà nó thay thế** (navy←slate, sage←emerald, sand←amber, terra←orange, teal←teal, danger←rose) để đổi class giữ nguyên nấc vẫn giữ quan hệ tương phản. Màu gốc được neo chính xác vào nấc gần nhất; thang đơn điệu về độ sáng.

| scale | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| navy | #F9FAFB | #F4F4F5 | #E7E7E9 | #D3D4D7 | #A0A1A5 | **#717275** | #505363 | **#3D405B** | **#2B2D42** | **#1E2235** | #05070F |
| sage | #EFFCF5 | #E6F2EC | #CEE7DA | #A7DAC1 | #91C2AA | **#81B29A** | **#5E987E** | **#2D6A4F** | #2A5C46 | **#1B4332** | #162920 |
| sand | **#FAF8F5** | **#F4F1DE** | #EDE6D1 | **#F2CC8F** | #F3C071 | **#E5A33C** | #BF8832 | #9A6705 | #7C5200 | #664307 | #392401 |
| terra | #FEF6F4 | #FFEBE5 | #FED3C8 | #FEB5A1 | #F89074 | **#E07A5F** | **#D45D3E** | #B54E34 | #99351A | #753322 | #431407 |
| teal | #F0FDFD | #E6F2F3 | #CEE7E8 | **#A8DADC** | #7CC8CD | **#3FAEB8** | **#24828F** | #27727D | **#1B5760** | #264A50 | #122D31 |
| danger | #FFF2EF | #FEE5E1 | #FECFC6 | #FFA698 | #FD7462 | #E25D4C | #CD493A | **#C0392B** | #A0190F | #7E2A20 | #4A0C07 |
(**đậm** = màu gốc neo cứng). Danger là đỏ gạch hue ~25°, đứng cạnh terracotta nhưng vẫn đọc là "lỗi".

## 13.5 Tương phản (bản nháp) — các cặp chính
- ĐẠT: navy-700 trên trắng/cream (8.9:1), navy-500 `#717275` trên trắng (4.81), mọi badge `*-800 trên *-100` (≥ 10:1), dark mode `*-300` trên navy-900 (≥ 10:1), navy-400 muted trên navy-900 (5.95), navy-700 trên sand-300 CTA (6.63).
- KHÔNG ĐẠT, **có sẵn từ Tailwind gốc** và sẽ còn nếu đổi giữ nguyên nấc: `text-sage-600` trên trắng 3.35 (emerald-600 gốc 3.77), `text-sand-600` 3.10 (amber-600 gốc 3.19), `text-terra-600` 3.86; chữ trắng trên các nền `*-600` này tương tự.
- KHÔNG ĐẠT, **thuộc landing gốc**: `#717275` trên cream `#F4F1DE` 4.23:1; chữ trắng trên `#81B29A` 2.40, trên `#E07A5F` 2.95, trên `#3FAEB8` 2.64 (15 chỗ trong app dùng `text-white` trên các nền này).

## 13.6 Kết quả tương phản sau migrate (đo thật trên trang render)

Phương pháp: `color-snap` đo mọi phần tử có chữ trên 13 trang × light/dark (landing, login, otp, payment-result, member ×2, coach ×2, quầy ×2, manager ×2, admin), so chữ với nền đặc gần nhất; ngưỡng 4.5:1 (chữ lớn 3:1), icon 3:1, ký tự trang trí (•, /) bỏ qua. Baseline đo trên bản build từ git HEAD.

- **Token:** 66/66 cặp semantic đạt AA ở cả light và dark (gồm text-muted trên mọi nền soft; `warning-soft` light = sand-100, nền soft trạng thái dark = nấc 950).
- **Hồi quy:** 0 lỗi mới so với HEAD trên mọi trang; **181 lỗi có sẵn từ HEAD đã hết**. Riêng counter-invoices không có baseline (HEAD crash với fixture), 7 mục còn lại ở đó là icon sidebar/breadcrumb giống mọi trang.
- **Landing:** 0 lỗi (trước: CTA chữ trắng trên sand 1.52:1 → chữ navy 6.4:1; hover terracotta → chữ navy-900 5.2:1).
- **Đã sửa trong quá trình:** chữ trắng trên `sage/sand/teal/terra-500/600` → nền 700 (34 chuỗi); chữ accent `500/600` → 700 (codemod + 8 chỗ gốc hex); chữ accent 700+ thiếu `dark:` → thêm `dark:text-*-400` (211 chuỗi); chip trung tính nhạt & thẻ chỉ có màu light → nền/biến thể dark; header cột "hôm nay" → `danger-700`.
- **Còn lại (có sẵn từ trước, không phải hồi quy):** chữ phụ `text-brand-navy-400` (#A0A1A5, tương đương slate-400 cũ) trên nền trắng ở light mode = 2.6:1, ví dụ nhãn "MENU", chú thích nhỏ, icon chevron. Ở dark mode đã đạt (text-muted). Đề xuất: nâng chữ (không phải icon) `navy-400 → navy-500` ở light (5.0:1) — chưa làm vì thay đổi phân cấp chữ toàn app, cần duyệt.

## 13.7 Ngoại lệ có chủ đích & việc chờ quyết định

- **Giữ nguyên:** logo Google (`#4285F4/#EA4335/#FBBC05/#34A853`); mascot `ArenaMascot.jsx` (hình minh hoạ, đã theo tông sand/terracotta); class CSS chết theme FPT cũ trong `theme.css` (`.fpt-*`, `.athletic-tag-gold`, `.scms-highlight-white`, `.toast-capsule-bg` — 0 chỗ dùng; có thể xoá ở đợt dọn dẹp riêng).
- **Landing — màu ngoài bảng thương hiệu (chờ quyết định):** để landing "nhìn y hệt", chỉ màu trùng/gần trùng (ΔE_OKLab ≤ 0.02) được đổi sang token. Còn lại: 99 class Tailwind mặc định trong `sportCategories.js`, `IntroSplashScreen.jsx`, `FacilitiesSection.jsx`, `CoursesSection.jsx` (emerald/teal/amber/rose/slate-500/900, blue-600…, ΔE 0.03–0.18 so với token gần nhất), 51 literal trong `tiya-theme.css` (chủ yếu slate `#0F172A/#1E293B/#64748B/#94A3B8`) và 3 nền dark của landing (`header/footer/.bg-white`, giữ nguyên màu cũ). Nếu đổi hết sang token, landing lệch nhẹ nhưng thấy được (rõ nhất: màu bộ môn emerald/rose/teal rực → sage/danger/teal dịu). Palette mặc định của Tailwind vì vậy vẫn còn trong `tailwind.config.cjs`.
- **Lỗi map phát hiện & đã sửa:** hex map theo sắc độ đẩy slate → teal và tint nhạt → xám; nay hex trùng màu Tailwind map theo quy tắc họ màu, tint nhạt giữ họ màu. Ảnh hưởng thực tế đã sửa: StatCard (3 tint trạng thái), 3 gradient xanh lá tối.

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
