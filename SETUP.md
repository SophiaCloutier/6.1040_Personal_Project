# Local development setup

## Requirements

- Bun 1.4.2 (the version declared in package.json).
- Docker Desktop with its Linux engine running, for MongoDB.
- Run commands from the repository root unless a step changes directories.

## Install and run

Start MongoDB and wait until it reports healthy:

```powershell
docker compose up -d mongo
docker compose ps
docker compose exec mongo mongosh --quiet --eval "db.adminCommand('ping')"
```

Install the locked dependencies, build the frontend, and start the application:

```powershell
cd backend
bun install --frozen-lockfile
bun run build
bun run start
```

Open http://localhost:3000. No seed data is required: register accounts and publish listings through the app.

After changing frontend source, rebuild and refresh the browser. Backend changes require restarting the server.

## Configuration and persistence

Local defaults work without an environment file. For overrides, copy `backend/.env.example` to `backend/.env` and edit it. Bun reads that file when commands run from `backend`. Environment files containing credentials are ignored by Git.

| Variable | Local default | Purpose |
| --- | --- | --- |
| MONGODB_URI | mongodb://127.0.0.1:27017/claimed | MongoDB connection |
| MONGODB_DATABASE | claimed | Application database |
| PORT | 3000 | Backend HTTP port |
| PUBLIC_ORIGIN | http://localhost:3000 | Allowed browser origin; match the backend URL |
| UPLOAD_DIRECTORY | backend/uploads | Local photo storage; optional override |

The database uses the named Docker volume `claimed_mongo`; uploads are stored separately in `backend/uploads`. Both persist across application restarts. `docker compose stop` stops MongoDB without deleting its volume. Keep the same database and upload directory to retain application data.

For an isolated local instance, use a separate database name and matching `PORT`/`PUBLIC_ORIGIN`, such as port 3001 and http://localhost:3001.

Production requires `NODE_ENV=production`, `MONGODB_URI`, `PUBLIC_ORIGIN`, and S3 storage configuration (`S3_BUCKET` and the credentials/endpoint settings supplied by the hosting platform). The deployed class platform supplies production configuration; do not commit its credentials. Local development uses filesystem storage and requires no S3 configuration.

## Automated tests and checks

Keep local MongoDB running. No application server, seed data, or production credentials are required. From `backend`:

```powershell
bun test
bun run check
bun run check:web
bun run build
```

The database-backed tests create temporary UUID-named databases and remove them afterward. Fixtures are created through concept actions or the HTTP handler. The session-expiry test changes a timestamp to simulate time passing.

Use local MongoDB: some tests explicitly connect to localhost. Do not configure the suite with a deployed database. If it reports `ECONNREFUSED 127.0.0.1:27017`, check that Docker Desktop is running and MongoDB is healthy.

To save output in PowerShell, from `backend`:

```powershell
bun test 2>&1 | Tee-Object -FilePath ../validation/p4-tests-final.txt
# Preserve the test runner's exit status in scripted checks:
exit $LASTEXITCODE
```

See the [P4 validation record](validation/P4-validation.md) for results and the [validation index](validation/README.md) for historical evidence. The live check is separate and explicitly opt-in because it creates test records on the deployed app.

## Updating specifications

Concept specifications live in `backend/design/concepts`, and compositions live in `backend/design/compositions`. Generated artifacts are tracked for reproducibility. After intentionally changing specifications, compositions, or the HTTP boundary, regenerate and verify them from `backend`:

```powershell
bun run generate
bun run check
```

Generation is not required to install or start the existing application. Review generated changes alongside the source change.
