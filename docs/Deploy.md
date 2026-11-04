# Deploy Render

Deploy the API and frontend as separate Render services. Docker Compose is for
local development only; Render does not provide its Compose service DNS names.

## Backend web service

- Runtime: Docker
- Dockerfile path: `docker/backend.Dockerfile`
- Docker build context: repository root (`.`)
- Health check path: `/health`

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
AI, VNPay, MoMo, and PayOS). Payment return/IPN URLs must use the public Render
URLs, not `localhost`. Database migrations run during API startup and a failed
migration stops deployment rather than attempting to create a replacement
schema.

If Google Drive OAuth is enabled, upload the service-account JSON as a Render
Secret File and set `GoogleDrive__CredentialsPath` to its mounted path (for
example `/etc/secrets/google-drive.json`). Do not place it in the repository or
the Docker build context.

## Frontend (recommended: Static Site)

- Root directory: `Frontend`
- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Environment variables at build time:

```text
VITE_API_BASE_URL=https://<your-backend>.onrender.com/api
VITE_SPORTS_CENTER_ID=<existing-center-id>
VITE_GOOGLE_CLIENT_ID=<Google web client id, if used>
```

Set the backend CORS origin to the exact frontend URL shown by Render.

## Frontend as a Docker web service (optional)

Use `docker/frontend.Dockerfile` with repository root as the build context and
set `API_UPSTREAM=https://<your-backend>.onrender.com`. The image uses Render's
`PORT`; do not set it manually. This option is useful only when same-origin
`/api` proxying is required. The Static Site option is simpler and preferred.

## Secrets cleanup

Never commit `.env.local`, `credentials.json`, or
`appsettings.Development.json`. Their old values should be revoked/rotated in
the respective providers. Removing a file from the latest commit does not erase
it from already-pushed Git history; rewrite the history or create fresh
credentials before publishing the repository.
