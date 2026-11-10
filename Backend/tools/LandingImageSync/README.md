# Landing content sync (PostgreSQL only)

Run from the repository root with .NET 10. The tool never uploads/deletes R2
objects, runs schema migrations, or imports business tables. Target PostgreSQL
must already have the deployed R2 schema (`uploaded_media.storage_key`).

Copy `docker/landing-sync.env.example` to ignored `docker/landing-sync.env` and
set `LANDING_SYNC_TARGET_CONNECTION` to the Render external PostgreSQL URL.
Never commit or share this file. Target must be the same DB as the deployed API.
The default source is local Docker PostgreSQL (`localhost:5433`, `scms`,
`SportsCenterManagement`), with its password read from `docker/.env`.
Optional environment overrides: `LANDING_SYNC_SOURCE_CONNECTION`,
`LANDING_SYNC_PUBLIC_DOMAIN` (otherwise read from `R2_PUBLIC_DOMAIN` in docker/.env).

```powershell
# Connection/schema inspection only:
dotnet run --project Backend/tools/LandingImageSync -- --inspect

# Default: preserve target text/layout, patch matching image slots only.
dotnet run --project Backend/tools/LandingImageSync

# Explicitly copy all local landing text/layout and remap image IDs by R2 key:
dotnet run --project Backend/tools/LandingImageSync -- --copy-content

# After reviewing the preview, pass its exact PlanHash:
dotnet run --project Backend/tools/LandingImageSync -- --copy-content --apply --expected-plan REVIEWED_HASH

# Read-only content/key comparison and public HTTPS image HEAD checks:
dotnet run --project Backend/tools/LandingImageSync -- --verify --check-assets

# Guarded rollback (refuses a different DB or later content edits):
dotnet run --project Backend/tools/LandingImageSync -- --rollback .validation/landing-image-sync/landing-before-....json
```

Only `system_settings` with key `site.landing-content` and new `uploaded_media`
rows for referenced dashboard image keys are written. Source IDs and tenant/user
ownership are never copied. An existing target setting keeps its owner; a new
setting/media has no source owner attached. Existing catalog rows are reused by
R2 key and never overwritten. Blank legacy keys or ambiguous matches require review.

Dry-run is read-only. Apply uses a serializable transaction and checks the reviewed
snapshot hash again. A durable backup is required before commit. The backup captures
the previous landing row (or its absence) and the applied content. Rollback restores
the old setting only and retains imported media metadata to avoid breaking other
references. Backups are local ignored files; treat their content as private.

Verification proves DB references and the configured public domain, not the deployed
API's environment or browser rendering. The Render API needs the same public domain
in `R2Storage__PublicDomain`; the tool does not change Render service settings.

Tests: `dotnet run --project Backend/verification/LandingImageSyncAudit`.
Set `SCMS_AUDIT_CONNECTION` to a **local** PostgreSQL admin connection to include
real migrated-DB integration tests. They create/drop only uniquely named
`scms_image_sync_audit_*` databases, never the source/target application databases.
