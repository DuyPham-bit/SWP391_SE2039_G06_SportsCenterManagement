# Refactor acceptance (Phase 7)

Recorded 2026-11-18 on `feature/rbac-admin-manager-integrated` at 99ac9fcb, which carries the refactor commits together with the team's feature commits. The baseline is [baseline.md](baseline.md).

## Checks against the baseline

| Check | Baseline | Now | Result |
|---|---|---|---|
| BE build (solution, including `verification/*` since Phase 1) | 0 warnings / 0 errors | 0 / 0 | PASS |
| `dotnet test` | 51/51 | 51/51 | PASS |
| API route list (`check-api-routes.sh`) | 243 | 243, diff 0 lines | Identical |
| FE route list (`AppRouter.jsx`) | 68 | diff 0 lines | Identical |
| `npm run build` / `npm run build:api` | PASS | PASS | PASS |
| `npm test` | 200/200 | 200/200 | PASS |
| `npm run lint:arch` (steiger + eslint-plugin-boundaries) | not set up | 0 errors | PASS (11 eslint warnings, see below) |
| Empty-migration check | n/a | `__StructureCheck` had an empty Up/Down | PASS |

The 11 eslint warnings come from inline `eslint-disable` comments for the app's regular rules, which the architecture-only config ignores on purpose.

## Before and after

"Before" is 8d50654, the snapshot taken right before the refactor. The frontend numbers at HEAD also include the team's feature work made in the meantime (splash, login, auth), so the frontend columns do not measure the refactor alone.

| Metric | Before | After |
|---|---|---|
| Backend `.cs` files (excluding migrations) | 291 | 308 (split interfaces, DI/extension files, guard/health services, split tests) |
| Backend non-blank LOC (excluding migrations) | 33,373 | 33,292 |
| `Program.cs` | 540 lines | 18 lines |
| NuGet package references (API/BLL/DAL/Tests) | 24 | 21 |
| Frontend `src` files (`.js/.jsx/.css`) | 500 | 503 |
| Frontend non-blank LOC | 80,974 | 80,991 |
| npm dependencies / devDependencies | 9 / 6 | 9 / 11 (+ steiger, @feature-sliced/steiger-plugin, knip, eslint, eslint-plugin-boundaries) |

## Not done (left on purpose)

- **Phase 3 remainder.** These still use `SportsCenterDbContext` directly:
  - Controllers: AdminManagement, CenterPermissions, Auth, Ai, ClassResources, GoogleAuth, MediaUpload.
  - API classes: JwtAccountValidator, SystemAdminBootstrapper, PasswordResetEmailSender, R2StorageService, CenterCapabilityAttribute, CommunicationDeliveryWorker, InitializeDatabaseAsync.
  - The BLL reaches EF through `unitOfWork.Context` (about 500 places). It no longer *injects* the DbContext, but it has not moved to `Query()` and specific repositories.

  Each of these needs domain-by-domain work with more tests, because the source-reading FE tests pin several controller implementations.
- **Errors.** There is still no single `IExceptionHandler` / ProblemDetails handler. The existing inline middleware in `UseApiPipeline` and the `FlowExceptionFilter` remain, so error bodies are unchanged. Controllers still contain try/catch blocks.
- **Contract choices.** `CenterAccessGuard` (403/404 with an InvalidOperationException body) and `ICenterScopeService` (BusinessException, 403 for unknown classes) still both exist, because merging them changes API responses.

## NEEDS CONFIRMATION

See [deletion-manifest.md](deletion-manifest.md) for the full list:

- Knip's 77 unused exports.
- Unused i18n keys.
- Commented-out code.
- The `System.Security.Cryptography.Pkcs` pin.
- The duplicate logo PNGs.
- The DB backup `.bak`.
- The `Reports` domain.
- The `LoginRequest` → `LoginCredentialsRequest` rename.
- Merging `CenterAccessGuard` into `ICenterScopeService`.
