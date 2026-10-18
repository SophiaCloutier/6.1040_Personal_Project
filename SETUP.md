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
