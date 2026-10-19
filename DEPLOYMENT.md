# Deploy Claimed! on 6.1040 Apps

The repository root wraps the application in `backend/`. Use these platform settings:

| Setting | Value |
| --- | --- |
| Repository | https://github.com/SophiaCloutier/6.1040_Personal_Project |
| Branch | main |
| Runtime | Bun |
| Package directories | backend |
| Build script | build |
| Start script | start |
| Port | 3000 |
| Health check | /health |

The root package.json pins Bun 1.4.2 and delegates build/start to backend.
Only backend needs dependency installation (backend/bun.lock).

1. Add MongoDB in Settings and save its suggested connection string as `MONGODB_URI`.
   Leave `MONGODB_DATABASE` unset: the connection string selects the platform database.
2. Add S3 storage and save the default `S3_` variables. Images are encoded on the
   server and stored in S3. `/uploads/...` streams them through the app; no public
   bucket or browser upload permission is required.
3. Set `PUBLIC_ORIGIN=https://<app-name>.mit-sdg.dev`. The platform manages the reserved `NODE_ENV` variable.
4. Push the deployment changes, select that exact commit, and deploy.
5. Check `/health`, then register/sign in, publish a listing with a photo, reload
   the item page, and verify it still loads after a redeployment.

Local preview: start MongoDB with `docker compose up -d mongo`, then run
`bun run preview` from the root and open http://localhost:3000.
The local preview uses disk image storage; production requires S3.
Existing local accounts, listings, and image files are not automatically migrated.
Do not run backend/scripts/reset-demo.ts against a deployed database.

Before pushing, run these from backend: `bun run check`, `bun run check:web`,
`bun test`, and `bun run build`. Keep .env and uploads out of git.
