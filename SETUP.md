# Local development setup

From the repository root:

```powershell
docker compose up -d mongo
docker compose ps
docker compose exec mongo mongosh --quiet --eval "db.adminCommand('ping')"
```

MongoDB is available at `mongodb://127.0.0.1:27017`. Application data will use the `claimed` database. The named volume retains data across container restarts. `docker compose stop` stops the database without deleting data.

Backend scaffold validation:

```powershell
cd backend
bun install
bun run generate
bun run check
bun run check:web
bun test
bun run build
bun run start
```

Open http://localhost:3000.
After changing frontend source, run `bun run build` and refresh the browser. Backend source changes require restarting `bun run start`. Keep the same database name to retain your listings.

For isolated browser checks, set `PORT`, matching `PUBLIC_ORIGIN`, and a separate `MONGODB_DATABASE` before starting. For example, port 3001 uses `http://localhost:3001` as its public origin. These variables default to the original localhost:3000 setup.

## Automated tests

Requirements: Bun and a running MongoDB at `mongodb://127.0.0.1:27017`. Start the database from the repository root with `docker compose up -d mongo`. No application server or seeded application data is needed.

From the repository root, in PowerShell:

```powershell
cd backend
bun install
bun test
# To save the execution output:
bun test 2>&1 | Tee-Object -FilePath ../validation/p3-tests.txt
```

Each database-backed test file or scenario selects a fresh UUID-named database and removes that database afterward. Fixtures are created through concept actions or the HTTP handler. The session-expiry test deliberately changes an expiration timestamp to simulate time passing. Tests also check rejected requests, participant access, competing claims, cancellation races, saved purchase terms, private payment evidence, and message history.

Use local MongoDB for this suite: some tests explicitly connect to localhost. Do not set `MONGODB_URI` to the deployed database or use production credentials. If tests report `ECONNREFUSED 127.0.0.1:27017`, start Docker Desktop and the MongoDB container before retrying.

Additional implementation checks, from `backend`, are `bun run check`, `bun run check:web`, and `bun run build`. The [validation record](validation/P3-validation.md) distinguishes automated integration tests from checks performed through the deployed interface.
