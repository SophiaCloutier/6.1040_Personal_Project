# Claimed!

Claimed! is a marketplace for MIT senior sales, helping students discover, buy, and sell secondhand items. It supports fixed-price claims, offers, messaging, and confirmation of payments made outside the app.

## P4 submission

- [Live app](https://claimed.mit-sdg.dev/)
- [Final design summary](Design/7.%20Final%20Design.md)
- [Narrated demo video](https://youtu.be/okTUj_0g6fc?si=KFJ8KMpkkZE8IR1P)
- [Validation record](validation/P4-validation.md) and [automated tests](backend/tests)

## Build, run, and test locally

Install Bun 1.4.2 and Docker Desktop, then run from the repository root:

```powershell
docker compose up -d mongo
cd backend
bun install --frozen-lockfile
bun run build
bun run start
```

Open http://localhost:3000. Keep MongoDB running for tests; in another terminal, from `backend`:

```powershell
bun test
bun run check
bun run check:web
```

See [setup and test isolation](SETUP.md) for configuration, persistence, and saving test output. Tests require local MongoDB and use temporary databases.

## Specifications and design history

- Current [concept specifications](backend/design/concepts), [reactions and endpoints](backend/design/compositions), [types](backend/design/types.md), and [generated application contract](backend/generated/claimed.md)
- [Problem framing](Design/1.%20Problem%20Framing.md), [stakeholders](Design/1.1%20Stakeholders.md), and [application pitch](Design/2.%20Application%20Pitch.md)
- [P1 concept proposal](Design/3.%20Concepts%20%26%20Reactions.md) and [UI sketches](Design/4.%20UI%20sketches.md)
- [Buying and selling journeys](Design/5.%20User%20Journey.md), [P3 visual study](Design/6.%20Visual%20Study.md), and [design notebook](Notebook.md)
- [Validation evidence index](validation/README.md), including earlier test runs and screenshots
- [Alpha demo](https://youtu.be/WtIpPg8ImIA)
