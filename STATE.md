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

## Next
- Phase 2 (BE file moves). Before starting, ask about WIP files that overlap the moves (Program.cs, DbInitializer, Room/Sport entities, LandingContentService, PublicCatalogService, AdminFlowTests are modified but uncommitted).

## Assumptions
- Entities keep their namespace. The DbContext class name is kept, because migrations reference it in [DbContext(typeof(...))].
