# PostgreSQL merge audit

Run only against a local PostgreSQL test server. The account must be allowed to
create databases. Supply the connection in `SCMS_AUDIT_CONNECTION` through your
shell/session; never put its value in Git.

```powershell
dotnet run --project Backend/verification/PostgresMergeAudit
```

The audit creates a database named `scms_merge_audit_<random GUID>`, verifies the
upgrade from the pre-merge PostgreSQL migrations, authorization seeds, reporting
SQL, media ownership, catalog IDs, landing references and the real HTTP login
flow. R2 is stubbed for deterministic media checks; no real objects are uploaded
or deleted. It starts the API on an ephemeral loopback port and removes only its
own database in `finally`. The project's database is never selected.

The old SQL Server `LogicAudit` has been removed. Use this audit plus CoachBusinessAudit,
AiSafetyAudit, TimezoneAudit and the frontend suite for this integration.
