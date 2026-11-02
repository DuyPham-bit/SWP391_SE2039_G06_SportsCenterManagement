# Task Plan: Frontend Hardening & Accessibility Audit (SCMS)

## Priority Order (User Directed)
`FE-001 → FE-002 → FE-003 → FE-004 → FE-005 → FE-006 → FE-007`

---

## 1. Goal
Harden the Frontend against all 7 audit items with zero regression, preserving 100% of UI design, layout, visual styles, and API contracts.

---

## 2. Milestones & Task Breakdown

### Milestone 1: FE-001 (High) & FE-002 (Medium) — Chat Isolation & Guard Layout Architecture
- [x] **Files**:
  - `Frontend/src/features/member/MemberAIChatPopup.jsx`
  - `Frontend/src/app/providers/AuthContext.jsx`
  - `Frontend/src/app/layout/AppLayout.jsx`
  - `Frontend/src/app/router/AppRouter.jsx`
- [x] **Steps**:
  1. Verify Chat storage isolation: key includes `centerId` and `userId`. Purge chat on logout and user switch.
  2. In `AppLayout.jsx`: Ensure Member AI only mounts when `role === 'MEMBER'`, never based on URL.
  3. In `AppRouter.jsx`: Move `<ProtectedRoute>` and `<RoleGuard>` OUTSIDE `<AppLayout>` in all route renderers (`renderManagerRoute`, `renderReceptionistRoute`, `renderCoachRoute`, `renderMemberRoute`, `renderAdminRoute`). When unauthenticated, `AppLayout` is never rendered.

### Milestone 2: FE-003 (Medium) & FE-004 (Medium) — Unified HTTP Client, FormData & Timeouts
- [x] **Files**:
  - `Frontend/src/services/http.js`
  - `Frontend/src/features/media/api/mediaApi.js`
- [x] **Steps**:
  1. Ensure `services/http.js` `apiRequest` seamlessly supports `FormData` without forcing `Content-Type: application/json`.
  2. Implement default timeouts via `AbortController` (15s for GET, 30s for mutations). Differentiate user abort vs timeout.
  3. Verify `mediaApi.js` uses `apiRequest` so that 401 handling, traceId, and auth-version tracking are uniform.

### Milestone 3: FE-005 (Medium) — OTP Modal Accessibility, Focus Trap & Focus Restore
- [x] **Files**:
  - `Frontend/src/features/auth/LoginPage.jsx`
- [x] **Steps**:
  1. Add focus trap to the OTP verification dialog (keep Tab / Shift+Tab within modal focusables).
  2. Add Escape key listener to close modal.
  3. Store trigger element before opening and restore focus when closed.
  4. Add `aria-live="polite"` region for resend countdown and error messages.

### Milestone 4: FE-006 (Low) — Eliminate Navigation Side-Effects During Render
- [x] **Files**:
  - `Frontend/src/app/router/AppRouter.jsx`
  - `Frontend/src/shared/components/auth/RoleGuard.jsx`
- [x] **Steps**:
  1. Create declarative `<Navigate to="..." replace />` component using `useEffect`.
  2. Replace inline `window.location.replace` calls inside `AppRouter`'s switch cases (`#/admin`, `#/receptionist`, `#/coach`, `#/member`).

### Milestone 5: FE-007 (Low) — API Domain Slicing & Test Health
- [x] **Files**:
  - `Frontend/src/features/booking/api/bookingApi.js`
  - `Frontend/src/features/payment/api/paymentApi.js`
  - `Frontend/src/services/backendApi.js`
  - `Frontend/tests/`
- [x] **Steps**:
  1. Extract focused domain APIs for booking and payment.
  2. Maintain `backendApi.js` as backward-compatible facade re-exporting them.
  3. Verify all 145 tests pass cleanly (`npm test`).
  4. Rebuild production bundle (`npm run build`) and sync to Docker container.

---

## 3. Verification & Quality Gates
- [x] Unit & browser test suite: `npm test` -> 145/145 PASS.
- [x] Production build: `npm run build` -> 0 errors.
- [x] Docker container sync & live verification on `http://localhost:3004`.
