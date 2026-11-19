# Deletion manifest (Phase 0 draft)

Nothing has been deleted yet. Under Action, "pending" means it waits for its phase, and "NEEDS CONFIRMATION" means the owner decides.

## Groups 1 and 2: generated files, backups and duplicates

| Path | Category | Evidence | Action |
|---|---|---|---|
| `**/bin/`, `**/obj/`, `TestResults/`, `node_modules/`, `dist/`, `.vs/`, `*.user`, `*.log`, `.DS_Store`, `Thumbs.db` | G1 generated | `git ls-files` shows 0 tracked files; all are already in `.gitignore` | None needed (not tracked). Optionally clean the local disk |
| `Backend/SportsCenterManagement.API/wwwroot/*` | G1 FE build output | 0 tracked; ignored by `Backend/.gitignore:61-62` | Already ignored. **No `.gitkeep`:** `npm run build:api` uses `--emptyOutDir`, which deletes everything in the folder except `.git`, so a tracked `.gitkeep` would show as deleted after every build. The build creates the folder anyway |
| `coverage/`, `*.coverage` | G1 | Not in the root `.gitignore` | **Done (Phase 1):** added to `.gitignore` |
| `Frontend/tmp/` (386 MB of headless-Chrome profiles from `tests/*.browser.cjs`) | G1 test artefacts | Untracked; ignored by `tmp/`; the browser tests recreate it | **Deleted (Phase 1)** from local disk |
| `**/bin`, `**/obj`, `node_modules` on local disk | G1 | Ignored and untracked | Kept: they are the current build and dependency cache, and deleting them changes nothing in git |
| `docker/migration-backups/SportsCenterDB-local-before-docker-migration.bak` | G2 `*.bak` | Untracked and ignored, but it is a **database backup** | Kept (owner did not ask to delete it) |
| `Frontend/src/widgets/app-splash/model/splashCopy.js` | Matches `*copy*` | False positive: the splash copy text, imported by `SplashScreen.jsx` | Keep |
| `Frontend/public/logo-olympic-mark-dark.png` = `logo-olympic-mark.png` | G2 same hash | The two files are byte-identical. The dark variant may be referenced by a path string | Kept (owner did not ask to merge them) |
| `Frontend/src/pages/manager-members/ui/formStyles.js` = `pages/manager-staff/ui/formStyles.js` | G2 same hash | FSD does not allow one page to import from another, so removing one needs a `shared/ui` home | pending Phase 4: move to `shared/ui/formStyles.js` and delete both copies |

Searches for `*.bak`, `*.old`, `*.orig`, `*.tmp`, `*-old.*`, `*2.jsx`, and `backup/`, `old/`, `temp/` folders found **0 tracked files**.

## Group 3: dead code (filled in during Phase 5 from knip and BE reference scans)

| Path | Category | Evidence | Action |
|---|---|---|---|
| `Backend/SportsCenterManagement.BLL/Seed/` | Empty folder | Contains 0 files | pending |
| `Backend/SportsCenterManagement.API/DTOs/` | Wrapper folder | Only `DTOs/Auth` (2 files), which moves to the BLL in Phase 2 | pending Phase 2 |

## Group 4: non-code folders (proposal approved 2026-11-18; carried out in Phase 6)

`verification/*` was added to the `.slnx` in Phase 1, so it now compiles with every build.

| Path | Used by | Up to date? | Proposed action |
|---|---|---|---|
| `Backend/verification/` (AiSafetyAudit, CoachBusinessAudit, LogicAudit, TimezoneAudit) | Referenced by `Backend/docs/*.md`, `docs/TECHNICAL_NOTES.md`, `docs/FINAL_AUDIT_*.md` and `Frontend/docs/tab-session-fix.md`. Not in the `.slnx` and not in CI | They reference `SportsCenterDbContext` and BLL services directly, so the Phase 2/3 moves will break them | **Keep, and add them to the solution** (or a separate `verification.slnx`) so they are compiled |
| `Backend/postman/` (2 collections, 3 environments, a generator `.ps1`) | Its own README only | Generated from the route list; may be stale | **Consolidate into `tools/postman`** and regenerate from the baseline |
| `Backend/database/` (`SportsCenterDB.sql` + README) | `Backend/README.md`, `docker/postgres/README.md`, `docs/findings.md`, `Frontend/docs/real-database.md` | A SQL dump next to EF migrations, so it can drift | **Keep** (docs depend on it). Confirm that it is still current |
| `Backend/tools/SqlScriptRunner` | No real references (only `.claude/skills` matches, which are unrelated) | Unknown | **Delete**, or keep if you still run it by hand |

## Phase 5 results (dead code)

| Path | Category | Evidence | Action |
|---|---|---|---|
| `BLL/DTOs/Auth` `LoginResponse`; `BLL/DTOs/Classes` `ClassSessionResponse`, `CenterScheduleResponse`, `ClassOptionResponse`, `SportOptionResponse`; `BLL/DTOs/Payments` `MomoOption` | G3 BE unused types | Each name appears only at its own declaration across API/BLL/DAL/Tests/verification, Frontend and docs | **Deleted** (`a3ab7b1c`, `13e8ef7c`, `5451ed64`) |
| 155 `using` / `global using` lines in 96 files | G3 IDE0005 | `dotnet format style --diagnostics IDE0005` (Migrations excluded); the diff contains removals only | **Deleted** (`6b3f43b8`) |
| NuGet: DAL `BCrypt.Net-Next`, DAL `Microsoft.Extensions.Configuration.Abstractions`, BLL `System.IdentityModel.Tokens.Jwt` | G3 unused packages | 0 references in the project; build-checked one at a time | **Removed** (`c5c10216`) |
| `Frontend/src/shared/ui/gradients.js` | G3 FE unused file | knip (entries: main, campus entry, tests) + no string/dynamic reference | **Deleted** (`e5edcd2b`) |
| `pages/manager-members/ui/formStyles.js` = `pages/manager-staff/ui/formStyles.js` | G2 same hash | Byte-identical | **Merged** into `shared/ui/formStyles.js` (`e5edcd2b`) |
| 77 "unused exports" reported by knip | G3 | Many are read by tests through `vm` or source reads, which knip cannot see | Kept. NEEDS CONFIRMATION per export |
| Debug `console.log` / `debugger` / `Console.WriteLine`; `TODO`/`FIXME` | G3 | Searches return 0 | Nothing to remove |
| Unused i18n keys; commented-out code blocks | G3 | Keys are often built dynamically (`` t(`landing.nav.${x}`) ``) | Not removed. NEEDS CONFIRMATION |
| `System.Security.Cryptography.Pkcs` (DAL) | Package | No direct use; looks like a transitive security pin | Kept. NEEDS CONFIRMATION |

## Phase 6 results (Group 4, approved 2026-11-18)

| Path | Action |
|---|---|
| `Backend/verification/` | **Kept**, and builds with the solution since Phase 1 |
| `Backend/database/` | **Kept** (referenced by READMEs and docker docs) |
| `Backend/postman/` | **Moved** to `Backend/tools/postman/`. The generator script resolves paths relative to itself |
| `Backend/tools/SqlScriptRunner/` | **Deleted** from disk. It was never tracked and held only `bin/` and `obj/` build output, no source |
