# Deploy Render

Deploy the API and frontend as separate Render services. Docker Compose is for
local development only; Render does not provide its Compose service DNS names.

## Backend web service

- Runtime: Docker
- Dockerfile path: `docker/backend.Dockerfile`
- Docker build context: repository root (`.`)
- Health check path: `/health/ready`

The container listens on Render's `PORT` variable automatically. Configure
these environment variables in Render (do not commit their values):

```text
ConnectionStrings__SportsCenter=Host=...;Port=5432;Database=...;Username=...;Password=...;SSL Mode=Require
Jwt__Key=<random secret of at least 32 bytes>
Jwt__Issuer=SportsCenterManagement.API
Jwt__Audience=SportsCenterManagement.FE
Cors__AllowedOrigins__0=https://<your-frontend>.onrender.com
Bootstrap__SystemAdmin__Username=...
Bootstrap__SystemAdmin__Email=...
Bootstrap__SystemAdmin__Password=...
R2Storage__ServiceUrl=...
R2Storage__AccessKey=...
R2Storage__SecretKey=...
R2Storage__BucketName=...
R2Storage__PublicDomain=...
```

Also configure only the optional integration variables you use (mail, Google,
AI, VNPay, and MoMo). Payment return/IPN URLs must use the public frontend/API
URLs, not `localhost`. Database migrations run during API startup and a failed
migration stops deployment rather than attempting to create a replacement
schema.

Media is stored exclusively in Cloudflare R2. Existing media IDs and relative
keys remain valid; PostgreSQL migrations add the new fields/indexes without
resetting the database. SQL Server migration files are historical backups,
outside the active project. Do not run them against PostgreSQL.

## Frontend (recommended: Docker web service)

- Runtime: Docker
- Dockerfile: `docker/frontend.Dockerfile`
- Build context: repository root (`.`)
- `API_UPSTREAM=https://<your-backend>.onrender.com` (no `/api` suffix)
- `VITE_SPORTS_CENTER_ID=<existing-center-id>`
- `VITE_GOOGLE_CLIENT_ID=<public Google web client id, if used>`

Use the same-origin `/api` proxy: the browser authenticates with HttpOnly cookies
and an `X-SCMS-Session` selector. Keep `VITE_API_BASE_URL=/api` (the Dockerfile
already sets it). The proxy preserves HTTPS information for secure cookies.
The image listens on Render's `PORT` automatically.

## Static Site alternative (requires same-site custom domains)

- Root directory: `Frontend`
- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Environment variables at build time:

```text
VITE_API_BASE_URL=https://<your-backend>.onrender.com/api
VITE_SPORTS_CENTER_ID=<existing-center-id>
VITE_GOOGLE_CLIENT_ID=<Google web client id, if used>
```

Set backend CORS to the exact frontend origin. Cookies use `SameSite=Strict`;
separate unrelated frontend/API domains cannot use this authentication flow.
Use same-site HTTPS custom domains or the recommended Docker proxy above.

## Existing Render service and environment variables

Connect the service to the DuyPham-bit repository and branch `deploy/scms-v1.1`.
Keep the existing Environment settings; Git commits do not contain or replace
their values. A newly created service needs its own Environment configuration.
Use the exact .NET variable names listed above on Render. The short names such
as `POSTGRES_PASSWORD` and `R2_SECRET_KEY` in `docker/.env` are local Compose
inputs; Compose translates them to the .NET names and Render does not.

Render's PostgreSQL URL is not an ADO.NET connection string. Set
`ConnectionStrings__SportsCenter` using Host/Port/Database/Username/Password
as shown above, with TLS for the hosted database. Never point a Render service
at Docker's local hostname `postgres` or your local port 5433.

## Secrets cleanup

Never commit `.env.local`, `credentials.json`, or
`appsettings.Development.json`. Their old values should be revoked/rotated in
the respective providers. Removing a file from the latest commit does not erase
it from already-pushed Git history; rewrite the history or create fresh
credentials before publishing the repository.
