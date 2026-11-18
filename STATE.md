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
- PAUSED 2026-11-18: the user asked for a login page redesign mid-phase.

## Next
- 2f-2: DAL/DependencyInjection.cs AddDataAccess(connStr) (DbContext + repos); BLL/DependencyInjection.cs AddBusinessLogic(connStr) (BLL services; typed HttpClients VnPay/MoMo/Gemini stay in the API, because the BLL has no Microsoft.Extensions.Http); API/Extensions: ResolveConnectionString, AddApiServices, InitializeDatabaseAsync, UseApiPipeline (move verbatim); DatabaseHealthCheck -> API/HealthChecks.
- 2g: Tests -> <Layer>/<Domain>/. Then the Phase 2 report.
- Every step: dotnet build + test (51/51) + check-api-routes diff.

## Assumptions
- Entities keep their namespace. The DbContext class name is kept, because migrations reference it in [DbContext(typeof(...))].
