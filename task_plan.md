# Task Plan: Senior Feature-First Frontend Refactoring

## 1. Goal
Refactor `Frontend/src` into a clean Senior Feature-First (FSD-lite) architecture:
- 100% preservation of existing UI, visual design, UX behaviors, and API contracts.
- Strict unidirectional dependency rule: `app → pages → features → entities → shared`.
- Thin pages: only handle route binding and composition.
- Standard feature anatomy: `api/`, `model/`, `ui/`, `index.js`.
- Shared domain models in `entities/`.
- Consolidated UI components in `shared/ui/`.
- Standardized API client in `shared/api/`.
- Zero runtime errors, zero blank screens.

---

## 2. Refactoring Phases

### Phase 1: Canonical App Structure (`app/`)
**Status:** complete
- [x] Verify canonical files in `Frontend/src/app/`: `App.jsx`, `AppRouter.jsx`, `AuthProvider.jsx`, `ToastProvider.jsx`, `LanguageProvider.jsx`, `app/layout/`.

### Phase 2: Shared API Client (`shared/api/`)
**Status:** complete
- [x] Created `Frontend/src/shared/api/`: `http.js`, `errors.js`, `endpoints.js`, `index.js`.

### Phase 3: Consolidated Shared UI (`shared/ui/`)
**Status:** complete
- [x] Consolidated UI components in `Frontend/src/shared/ui/`: `Modal.jsx`, `Table.jsx`, `StatCard.jsx`, `Logo.jsx`, `MotionButton.jsx`, `BusinessAlert.jsx`, `OtpVerification.jsx`, `EmptyState.jsx`, `LoadingState.jsx`, `ErrorState.jsx`.
- [x] Added named & default exports to all components.

### Phase 4: Feature Slices (`features/*`)
**Status:** complete
- [x] `features/auth/` (API, UI, models, index.js, LoginPage export default resolved)
- [x] `features/booking/` (API, UI, mapper, index.js)
- [x] `features/payment/` (API, UI, index.js)
- [x] `features/notifications/` (API, UI, index.js)
- [x] `features/media/` (API, UI, model, index.js)
- [x] `features/class-management/` (API, UI, index.js)
- [x] `features/member-management/` (API, UI, index.js)

### Phase 5: Domain Entities (`entities/*`)
**Status:** complete
- [x] `entities/member/`, `entities/class/`, `entities/booking/`, `entities/payment/`, `entities/media/` models & badges.

### Phase 6: Pages Refactoring (`pages/*`)
**Status:** complete
- [x] All 45 pages in `pages/` converted to thin composition wrappers (< 25 lines).
- [x] Named and default export alignment verified across all routes (`ManagerDashboard`, `MyBookings`, etc.).

### Phase 7: Root Cause Fix & Verification
**Status:** complete
- [x] Fixed missing default export in `features/auth/LoginPage.jsx` & `features/auth/index.js`.
- [x] Fixed missing default export in `shared/ui/Modal.jsx`, `Table.jsx`, `StatCard.jsx`, `BusinessAlert.jsx`.
- [x] Fixed duplicate export in `shared/ui/OtpVerification.jsx`.
- [x] Fixed named exports in `ManagerDashboardPage.jsx` and `MyBookingsPage.jsx`.
- [x] Restored `shared/components/common/NotificationInbox.jsx` for test suite compatibility.
- [x] Ran headless Chrome verification across all routes (`#/`, `#/login`, `#/register`, `#/payment-result`, dashboards).
- [x] Full build passed: `npm run build` (778 modules transformed in 15.4s).
- [x] Synced build to Docker container `scms-frontend` and reloaded Nginx.
