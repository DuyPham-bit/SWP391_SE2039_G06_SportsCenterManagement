# Progress

## Milestone 13: Đồng bộ màu theo Landing — XONG (Phase 1, a–g + kiểm chứng); chờ quyết định màu ngoài bảng của landing (2026-11-07 → 2026-11-08)

- [x] Graphify extract (code-only) trước khi tìm code.
- [x] Khảo sát nguồn màu: theme.css (`--primary-color` FPT `#1A3B8B`) xung đột tiya-theme.css (`#81B29A`); `colors.fpt.*` trong tailwind config.
- [x] Quét landing: xác nhận 7 màu trong đề bài + bổ sung `#1B4332`, `#5E987E`, `#D45D3E`, `#E9B872`, `#E5A33C`, `#A8DADC`, `#FAF8F5`, dải navy tối.
- [x] Baseline: 14.230 class màu mặc định / 238 file; 2.187 class hex tùy ý; 0 class ghép động; 43 hex inline; 111 hex trong theme.css.
- [x] Sinh 6 thang 50–950 (OKLCH, neo màu gốc, bám độ sáng họ Tailwind tương ứng) + bảng tương phản (findings §13.4–13.5).
- [x] Viết implementation plan + so sánh phương án (task_plan.md Milestone 13).
- [x] Đã duyệt: phương án B; blue/sky→teal, tím→navy; landing chỉnh nhẹ cho AA; nâng nấc chữ 500/600→700.
- [x] Công cụ kiểm chứng: ảnh chụp + "dấu vân màu" (computed colours) của 13 trang × light/dark (landing, login, otp, payment-result, member×2, coach×2, counter×2, manager×2, admin). Baseline = snaps/before.
- [x] **Phase 1 – token layer**: thêm `src/app/styles/tokens.css` (6 thang brand 50–950 dạng kênh RGB + 29 semantic token light/dark + 8 màu chart; 58/58 cặp semantic đạt AA); `tailwind.config.cjs` thêm `brand.*`, `primary/secondary/accent/on/surface/line/ink/success/warning/danger/info/focus/chart`; `colors.fpt.*` thành alias deprecated; `theme.css` bỏ biến FPT (giữ alias deprecated, 0 chỗ dùng); `tiya-theme.css` biến màu thành alias của token; `main.jsx` nạp tokens.css đầu tiên.
  - Kiểm chứng: build pass, npm test 144/144; so dấu vân màu với baseline: 24/26 ảnh trùng hoàn toàn, landing light/dark chỉ đổi `#717275→#6C6D70` (chỉnh AA đã duyệt).
- [x] **Phase a – shared/ui + widgets**: semantic token cho Modal, Toast, PageErrorBoundary, app-shell (Header/Sidebar/AppLayout), support-inbox… (608 sửa; chỉ gộp khi có cặp dark: tương ứng để không trộn nền đổi màu với chữ cố định); phần còn lại codemod brand-* (334 class + 227 hex, 14 lượt nâng nấc AA). Sửa class chết `slate-750` (không tồn tại trong Tailwind) → `brand-navy-800`. Landing/login/otp/payment-result không đổi.
- [x] **Phase b – auth** (login, otp-verification, features/auth): 294 class + 126 hex. Phát hiện & sửa lỗi quy tắc: indigo/tím map theo độ sáng ra navy-500 (xám) làm nút chính trông như disabled → quy tắc mới: tím 400–600 → navy-700, 700+ → navy-800 (giữ phân biệt hover), chỉ áp cho class light mode. 56 class được sửa lại bằng đối chiếu từng dòng với git HEAD. Test: security-auth, email-verification pass.
- [x] **Phase c – member** (pages/member-*, my-support-requests, features/member-ai-chat, notifications, payment-checkout): 2.461 class + 476 hex, 47 nâng nấc AA. Sửa 5 class dark: tím bị nâng nhầm lên navy-700 (chữ tối trên nền tối) về nấc gốc. Test: payment-checkout, coach-chat pass; soát ảnh member light/dark.
  - Ghi chú: tiền tố `pages/member-` cũng đã migrate luôn `member-checkin`, `member-lookup` (vốn thuộc Phase e).
- [x] **Phase d – coach** (pages/coach-*, features/coach-workspace): 2.178 class + 302 hex, 47 nâng nấc AA. Build pass, 144/144, coach-chat pass.
- [x] **Sửa hồi quy dark mode (phát hiện khi soát ảnh Phase d)**: hệ dark mode toàn cục trong `theme.css` (`html.dark .bg-white/.text-slate-700… !important`) khớp theo tên class cũ, codemod đổi tên nên thẻ bật sáng trong dark. Viết lại khối này:
  - selector khớp cả tên mới (`brand-navy-*`) lẫn tên cũ (giữ tới khi migrate hết), màu lấy từ token (`--color-surface*`, `--color-text*`, `--color-border`) thay hex cứng; bỏ 2 rule cho `#EBF2FC`/`#1A3B8B` (0 chỗ dùng);
  - chữ navy đậm không bị ép sáng khi chính phần tử tự tô nền accent sáng (sand/sage/teal/terra) mà không có `dark:bg-` (badge PRO);
  - nền trung tính nhạt `bg-brand-navy-50/x`, `-100`, `-200` không có `dark:bg-` → `navy-700/60` ở dark (chip/ô icon từng thành chữ sáng trên nền sáng);
  - chữ phụ `navy-400` ở dark → `--color-text-muted` (trước 2.6:1, nay ≥ 4.5:1).
- [x] **Kiểm tra tương phản tự động**: `color-snap` đo tỉ lệ tương phản mọi phần tử có chữ (so với nền đặc gần nhất); baseline đo trên bản build từ git HEAD. Kết quả: 0 lỗi tương phản mới so với HEAD (trừ counter-invoices — HEAD crash nên không có baseline; các mục còn lại ở đó là icon sidebar giống mọi trang), 162 lỗi có sẵn từ HEAD đã hết.
  - Các sửa AA đi kèm: chữ trắng trên nền `sage/teal/terra-500/600` → nền 700, hover 800 (26 chuỗi class, gồm nút OTP/Profile); 8 chữ accent gốc hex (`#81B29A`/`#E07A5F`) → nấc 700 (codemod nay áp luôn quy tắc nâng nấc cho hex); `warning-soft` light sand-200 → sand-100; nền soft trạng thái ở dark 900 → 950 (66/66 cặp semantic đạt AA, thêm kiểm tra text-muted trên nền soft).
  - Thêm biến thể `dark:` cho các khối chỉ có màu light: lịch tuần hội viên (header, cột, thẻ đã đặt), theme màu bộ môn ở `calendarView.js` (member + coach), thẻ thống kê lịch học/điểm danh, ô icon nhắc lịch; header cột "hôm nay" (điểm danh) → nền đỏ thương hiệu `danger-700` để chữ trắng đạt AA.
  - Kiểm chứng: build pass, npm test 144/144; soát ảnh coach-attendance/member-schedule dark.
- [x] **Phase e – quầy/lễ tân** (pages/counter-*, receptionist-dashboard, support-requests, features/counter-desk, refund-review): 959 class + 203 hex, 20 nâng nấc AA, 0 class mặc định còn sót. Test: test:invoices:browser (dev server tạm 127.0.0.1:3104), test:manager:browser pass; 0 lỗi tương phản mới so với HEAD.
- [x] **Phase f – manager/admin** (pages/manager-*, admin-dashboard, audit-logs, roles-permissions, payroll): 7.063 class + 810 hex, 117 nâng nấc AA, 0 class mặc định còn sót. Test: test:manager:browser, test:admin:browser, test:invoices:browser pass; build pass, 144/144.
  - Codemod: thêm map chính xác cho hex amber/yellow của Tailwind (→ sand, theo quy tắc amber→sand; trước đó `#D97706` theo sắc độ bị đẩy sang terra) và `#253047` (→ navy-900, không phải teal). Sửa lại 5 chỗ amber→terra ở phase trước (toast cảnh báo, tóm tắt lịch dạy, đặt chỗ quầy).
  - Class chết (Tailwind không có nấc 750/850): 23 chỗ `dark:bg-slate-750(/x)`, `dark:hover:bg-slate-750`, `dark:bg-slate-850/60` → `brand-navy-800/700/900`. Hiện 0 chỗ.
  - Chữ trắng trên nền `sand-500/600` → nền 700 (8 chuỗi; white trên sand-600 chỉ 2.9:1).
  - Hồi quy dark do nâng nấc AA: chữ accent 700+ không có `dark:text-` giữ màu đậm trên nền tối (2.1–2.4:1). Thêm `dark:text-brand-<họ>-400` cho 198 chuỗi không tự tô nền (190 chip tự tô nền sáng giữ nguyên). 0 lỗi mới so với HEAD; 173 lỗi có sẵn đã hết.
- [x] **Phase g – phần còn lại, landing, hex inline, CSS**:
  - Ngoài landing: payment-result, app/router, media-upload, entities, shared/lib (259 class + 36 hex); 1 class `group-hover/cardqr:` codemod bỏ sót → sửa tay. Màu logo Google giữ nguyên.
  - Hex/rgba inline trong JS (style, SVG, cấu hình biểu đồ, file xuất báo cáo, class tuỳ ý trong Toast): 207 literal → đúng giá trị thang thương hiệu (giữ dạng hex để canvas/xuất file/nối chuỗi alpha vẫn chạy). Thuộc tính SVG của biểu đồ (39) → token: series dùng palette categorical `--color-chart-*`, lưới/track `--color-border`, chữ `--color-text-*` → biểu đồ tự đổi theo dark mode (đã kiểm tra màu tính toán: lưới = `--color-border`).
  - CSS: `tiya-theme.css` 124 literal → `rgb(var(--brand-*) / a)` (chỉ màu trùng, ΔE ≤ 0.02 — landing y hệt); `theme.css` 84 literal → token (map theo họ màu, riêng selector intro/landing chỉ đổi khi trùng). Codemod CSS bỏ qua hex nằm trong selector đã escape (`.text-\[\#…\]`).
  - Landing: 49 class màu trùng → token; CTA chữ trắng trên sand (1.52:1) → chữ navy (AA, đã duyệt); hover terracotta → chữ navy-900. Nền dark của landing (header/footer/thẻ) giữ đúng màu cũ bằng rule riêng. 99 class + 51 literal CSS ngoài bảng thương hiệu giữ nguyên, chờ quyết định (findings §13.7).
  - Dọn `theme.css`: bỏ selector dark cũ không còn dùng (`.text-[#1E2235]`, `.bg-slate-50`, `.border-slate-*`, `.hover:bg-slate-*`…); giữ `.text-slate-900/800/500/400` cho landing. Palette mặc định Tailwind giữ trong config (landing còn dùng).
  - Sửa lỗi map: hex trùng màu Tailwind theo quy tắc họ (trước đó slate → teal, tint nhạt → xám): StatCard 3 tint trạng thái, 3 gradient xanh lá tối.
- [x] **Kiểm chứng cuối (2026-11-08)**:
  - `npm run build` pass; `npm test` 144/144; `test:security|payment|manager|admin|chat|landing|invoices:browser` đều pass (invoices chạy với dev server tạm 127.0.0.1:3104).
  - Thống kê so baseline: class màu mặc định 14.230/238 file → **99/4 file (chỉ landing)**; class hex 2.187 → **4 (logo Google)**; class brand 16.129, semantic 301, biến thể `dark:` 5.828 → 6.011; hex inline ngoài landing/artwork: 0 màu ngoài thang.
  - Tương phản: 0 lỗi mới so với HEAD, 181 lỗi có sẵn đã hết; landing 0 lỗi; 66/66 cặp semantic đạt AA.
  - `npm run dev` (vite, cổng tạm 3104): chụp landing + login/otp/payment-result + 1–2 trang mỗi role (member, coach, lễ tân, manager, admin) × light/dark — soát ảnh đồng bộ; exception duy nhất là error boundary của counter-invoices khi fixture chung trả `[]` (đúng thiết kế; test thật pass).
  - Graphify extract chạy lại (246 file, 4.941 node). Dev server tạm đã tắt.

## Overall Status: COMPLETE & VERIFIED

### Milestone Breakdown & Verification Status

1. **Host SQL Server Integration & Isolation:**
   - Identified running SQL Server 2019 instance (`MSSQLSERVER`) on `localhost`.
   - Updated `LogicAudit` harness to dynamically target `localhost` with Windows Integrated Security.
   - Every execution creates a fresh temporary database (`SCMS_LogicAudit_<Guid>`), executes all EF Core migrations, runs tests, and terminates with complete database teardown.

2. **Flow 1: User & Membership Management:**
   - **Completed & Verified:** Registration, login, password reset/change lifecycle, HttpOnly cookie tab isolation, OTP rate limiting, staff authorization before unowned member mutation, subscription effective dates and scheduling.
   - **Automated Evidence:** `LogicAudit` (checks 1-13, 30, 39-83) PASS, `Frontend` suite (auth/tab isolation/permission tests) PASS.

3. **Flow 2: Class Booking & Schedule Management:**
   - **Completed & Verified:** Class and schedule queries with Vietnam business dates (`Asia/Ho_Chi_Minh`), room name inclusion, pagination guards, serializable transactions preventing double booking/overbooking, concurrent leave requests with replacement coach verification, member center assignment enforcement.
   - **Automated Evidence:** `LogicAudit` (checks 14-16, 25-34) PASS, `CoachBusinessAudit` (17/17) PASS, `Frontend` scheduling & calendar suite PASS.

4. **Flow 3: Payment & Report Management:**
   - **Completed & Verified:** Server-side price validation, currency verification on VNPay signed callbacks, payment idempotency, refund state machine atomicity, center-scoped revenue reporting without double counting, gateway refund reconciliation.
   - **Automated Evidence:** `LogicAudit` (checks 4-11, 20-24, 35-38) PASS, `CoachBusinessAudit` PASS, `Frontend` checkout/payment suite PASS.

5. **Flow 4: Training & Attendance Management:**
   - **Completed & Verified:** Coach professional hub, attendance status case-insensitivity (`PRESENT`, `LATE`, `ABSENT`), health records, exercise definitions, compensation policies, replacement coach specialization matching, missing EF Core migration for delivery locking columns added.
   - **Automated Evidence:** `LogicAudit` (checks 14-18, 25-27) PASS, `CoachBusinessAudit` PASS, `Frontend` coach dashboard suite PASS.

6. **Flow 5 & 6: AI Workout Recommendation & AI Assistant:**
   - **Completed & Verified:** Biometric safeguards (underweight/overweight override), medical pain condition restrictions, prompt safety guards, Medical NLP schema parsing, multi-account and center isolation in frontend chat popup.
   - **Automated Evidence:** `AiSafetyAudit` (19/19) PASS, `Frontend` AI suite PASS.

7. **Full-Stack Test Execution Summary:**
   - `LogicAudit` (SQL Server): 107/107 PASS (100%).
   - `CoachBusinessAudit`: 17/17 PASS (100%).
   - `AiSafetyAudit`: 19/19 PASS (100%).
   - `TimezoneAudit`: 7/7 PASS (100%).
   - Frontend Suite: 145/145 PASS (100%).
   - Backend Solution Build: 0 warnings, 0 errors.
   - Frontend Production Build: 0 errors, bundle synced to `Backend/SportsCenterManagement.API/wwwroot`.
