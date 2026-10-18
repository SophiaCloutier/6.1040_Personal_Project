# Claimed!

Claimed! is a marketplace designed specifically for MIT senior sales, making it easier for students to discover, buy, and sell secondhand items within the MIT community.

## Run the app

See [local setup](SETUP.md) for Docker MongoDB and the Bun/Vue app. The interface runs at http://localhost:3000 after building and starting the backend.

The beta supports accounts, editable listings, photo framing, fixed-price claims and OBO offers, private messaging, external payment evidence, and seller confirmation. See [the beta journey and validation](BETA.md). The [alpha journey and recording script](ALPHA.md) documents the earlier milestone. Implementation specifications are in `backend/design/`; the original `Design/` documents remain unchanged and changes are denoted in the Notebook.

The marketplace has a responsive grid and public item pages. Guests can browse without an account; claiming requires sign-in. Sellers can upload photos and create custom tags, and buyers can combine keyword search with tag, price, and availability filters.

## Automated tests

Start MongoDB from the repository root with `docker compose up -d mongo`. Then run `cd backend`, `bun install`, and `bun test`. Tests use unique temporary databases on `mongodb://127.0.0.1:27017` and drop them after execution; do not point tests at application data. Most tests also support `MONGODB_URI`, but `concepts.test.ts` uses localhost explicitly. Session expiry is simulated by updating the expiry timestamp; other fixtures are created through actions or HTTP requests.

Save output in PowerShell with `bun test 2>&1 | Tee-Object -FilePath ../validation/p3-tests.txt`. See [latest P3 execution output](validation/p3-tests.txt). Coverage includes accounts, sessions, listings, claims, offers, payment confirmation, image uploads, messaging, access restrictions, persistence, and competing reservations. Interface walkthroughs remain a separate manual check; automated HTTP journeys do not establish that every browser interaction works.

## Design documents

- [Visual direction and typography slide outline](Design/6.%20Visual%20Study.md)

- [Problem Framing](Design/1.%20Problem%20Framing.md)
- [Stakeholders](Design/1.1%20Stakeholders.md)
- [Application Pitch](Design/2.%20Application%20Pitch.md)
- [Concepts & Reactions](Design/3.%20Concepts%20%26%20Reactions.md)
- [UI Sketches](Design/4.%20UI%20Sketches.md)
- [User Journey](Design/5.%20User%20Journey.md)
- [Notebook](Notebook.md)

## Demo

<video controls width="100%" src="https://github.com/SophiaCloutier/6.1040_Personal_Project/raw/refs/heads/main/Alpha%20Demo.mp4">
	<a href="Alpha%20Demo.mp4">Watch the alpha demo</a>
</video>

If the video player does not load, [download the alpha demo](Alpha%20Demo.mp4).
