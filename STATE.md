# STATE

## Goal
Structure cleanup per the refactor brief (2026-11-18). BE: strict API → BLL → DAL. FE: strict FSD in JS. Aggressive dead-code removal with no change to routes, JSON shape or UI. One commit per phase on branch `refactor/structure-cleanup`.
Decisions: FE stays JS + FSD; keep the HttpOnly cookie session; no new runtime libraries (devDeps allowed: steiger, knip, eslint-plugin-boundaries).

## Done
- Splash motion upgrade (widgets/app-splash) and removal of the "Ghi danh lớp học" sidebar item (Sidebar.jsx). Both uncommitted.
- Phase 0: docs/refactor/baseline.md (BE 51/51, FE 200/200, builds PASS, 243 API + 68 FE routes), plus api-routes/fe-routes.baseline.txt and the deletion-manifest.md draft.

## Phase 0 findings
- BE: 12 controllers inject SportsCenterDbContext/entities (Auth, AdminManagement, Ai, CampusMap, CenterPermissions, ClassManagement, ClassResources, GoogleAuth, Health, Invoices, MediaUpload, Payments). Other API classes that use the DbContext: JwtAccountValidator, PasswordResetEmailSender, SystemAdminBootstrapper, CenterCapabilityAttribute, CenterScope, CommunicationDeliveryWorker, R2StorageService.
- BLL: 17 service files use the DbContext. Interfaces live flat in BLL/Interfaces (23 files) plus a stray Services/Interfaces/IBusinessClock.cs. DTO folders are mixed (*Dtos.cs vs Requests/Responses). Exceptions are spread over Common/ and Exceptions/. Seed/ is empty. 69 try/catch blocks in 11 controllers. No IExceptionHandler. Program.cs is 540 lines. Dapper is referenced by BLL.csproj.
- API also holds Services/ (R2, SendMail, MedicalNlp), Models/ and DTOs/Auth. DAL seeding sits in Context/ (DbInitializer, CampusMapSeed). Tests are flat.
- FE is already close to FSD: every slice has an index.js, there are 0 upward imports and 0 fetch calls outside api/. Remaining: 1 deep import (manager-home-content → features/campus-map/api), app/campus-map-page.jsx, 2 @x files (class/@x/report, member/@x/staff), and features with a single consumer (media-upload, member-ai-chat, refund-review).
- Junk: 0 tracked files. Frontend/tmp is 386 MB of local files. Duplicates: the two logo-mark PNGs and two copies of formStyles.js.

- Phase 1 (committed): .gitignore gets coverage/; Frontend/tmp deleted (386 MB, local); verification/* added to the .slnx (BE build 0 errors, 51/51). No wwwroot/.gitkeep, because build:api empties the folder.
- User decisions (2026-11-18): proposals approved. Keep the .bak and both logos. Group 4: keep verification + database, move postman → tools/, delete tools/SqlScriptRunner (do this in Phase 6). Uncommitted WIP: option (c), so each phase stages only its own files.

- WIP snapshot committed as 8d50654 (user picked option a).
- Phase 2a ea84dcd: entities -> DAL/Entities/<Domain>/, namespaces unchanged; the __StructureCheck migration came out empty and was removed.
- Phase 2b 459554c: BLL Interfaces+Services -> Services/<Domain>/ (ns BLL.Services.<Domain>); IFlow2Services split; BusinessClock -> Common. GlobalUsings.cs in BLL/API/Tests/verification x3.
- Phase 2c f4ab5fa: controllers -> Controllers/<Domain>/ (FlowControllerBase + Health stay at root). Route check script: docs/refactor/check-api-routes.sh (243/243 identical).
- Phase 2d 8bb95eb: API/DTOs/Auth merged into BLL/DTOs/Auth (API LoginRequest -> LoginCredentialsRequest, same JSON). Exceptions -> BLL/Common/Exceptions. DAL seeds -> DAL/Seed.
- Domains = the BLL/DTOs folder names, plus Reports (ReportService has no DTO folder). AI services/controller -> Training. SportManagementService -> Classes (its DTOs live in DTOs.Classes).
- Kept on purpose: BLL/Seed/home-content.seed.json (an embedded resource read by LandingContentService, not a DB seed); API/Services (R2, SendMail, MedicalNlp) are infrastructure and are reviewed in Phase 3.

- Phase 2e c820f5b: each DTO domain now has Requests.cs/Responses.cs (216/216 types kept; Members.Activation ns -> Members). Catalog, CoachProfessional and Media have only one of the two files, because the other would be empty.
- Phase 2f-1: repositories -> Repositories/Common (Generic, UnitOfWork) + Auth/Catalog/Classes/Notifications; global usings updated.
- Side branch feature/login-premium (login redesign + sports constellation) is branched from 4cd182b and is not merged.
- 676ddcb: Frontend/tests read backend sources by path; repointed them to the Phase 2 folders (npm test 200/200). LESSON: run npm test after every BE move.
- Phase 2f-2: Program.cs is now 19 lines. DAL AddDataAccess, BLL AddBusinessLogic, API/Extensions (ResolveConnectionString, AddApiServices, InitializeDatabaseAsync, UseApiPipeline), API/HealthChecks/DatabaseHealthCheck. Code moved verbatim: 68/68 DI registrations and the middleware order are identical. Smoke run on :5099 (AutoMigrate off): health 200, public 200, protected 401. config-secrets test now also scans API/Extensions.

- Phase 2g: Tests -> Tests/BLL/<Domain>/ (namespace Tests.BLL.<Domain>; TestDb stays at the root). AdminFlowTests was split into BLL/Payroll/PayrollPolicyTests + BLL/Catalog/LandingContentServiceTests. The split exposed a timing-flaky test (versions <1 ms apart count as equal); added a 5 ms gap between the saves in the test, product logic unchanged. 51/51 over 5 runs.
- PHASE 2 DONE.

- Phase 3a ab34547: the 7 BLL services that injected the DbContext now take IUnitOfWork (db = unitOfWork.Context; bodies unchanged).
- Phase 3b: CenterScope DB checks -> BLL CenterAccessGuard (verbatim: InvalidOperationException + Data StatusCode); invoice list query -> IPaymentService.ListCenterInvoicesAsync (same JSON field order); health -> BLL SystemHealthService. ClassManagement, CampusMap, Invoices, Health and DatabaseHealthCheck no longer touch the DbContext.
- PHASE 3 REMAINDER (not done, needs careful per-domain work + more tests): the DbContext is still used by AdminManagement, CenterPermissions, Auth, Ai, ClassResources, GoogleAuth, MediaUpload controllers and by JwtAccountValidator, SystemAdminBootstrapper, PasswordResetEmailSender, R2StorageService, CenterCapabilityAttribute, CommunicationDeliveryWorker, InitializeDatabaseAsync. The BLL still reads unitOfWork.Context (~500 sites); full Query()/repository migration not started. NEEDS CONFIRMATION: merge CenterAccessGuard into ICenterScopeService (changes 404->403 + error body).

- Phase 4 (re-committed by the user as small commits), Phase 5 (e5edcd2b, 6b3f43b8, c5c10216 + user commits a3ab7b1c/13e8ef7c/5451ed64/e8abc51b), Phase 6 (99ac9fcb), Phase 7: docs/refactor/acceptance.md - everything green, both route lists identical.
- NOTE: the work now lives on feature/rbac-admin-manager-integrated (the user moved it there); refactor/structure-cleanup stopped at 80c45b1.

## Next
- Phase 3 remainder (see acceptance.md "Not done"): one domain at a time, starting with Auth; add tests first; update the source-reading FE tests that pin controller code.
- Single IExceptionHandler/ProblemDetails needs agreement on the error body (today: custom problem+json with code/message/proposedHandling).
- Resolve the NEEDS CONFIRMATION list in deletion-manifest.md.
