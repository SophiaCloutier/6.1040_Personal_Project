# Claimed!

Claimed! is a marketplace designed specifically for MIT senior sales, making it easier for students to discover, buy, and sell secondhand items within the MIT community.

## Beta submission

- [Live app](https://claimed.mit-sdg.dev/)
- [Updated buying and selling journeys](Design/5.%20User%20Journey.md)
- [Visual design study and annotations](Design/6.%20Visual%20Study.md)
- [Automated tests](backend/tests) and [saved test output](validation/p3-tests.txt)
- [Beta Video]()

## Run the app

See [local setup](SETUP.md) for Docker MongoDB and the Bun/Vue app. The interface runs at http://localhost:3000 after building and starting the backend.

## Run the tests

Start MongoDB with `docker compose up -d mongo` from the repository root. Then run `bun install` and `bun test` from `backend`. See [test setup and isolation](SETUP.md#automated-tests) for database requirements and how to save output. Tests use temporary databases; do not point them at the deployed database.

## Current implementation specifications

The current Beta specifications are in [backend/design](backend/design): [concepts](backend/design/concepts), [compositions and endpoints](backend/design/compositions), and [application types](backend/design/types.md). The [generated application contract](backend/generated/claimed.md) documents the assembled actions, queries, and HTTP boundary. The original proposal below is retained as design history.

## Design documents

- [Problem Framing](Design/1.%20Problem%20Framing.md)
- [Stakeholders](Design/1.1%20Stakeholders.md)
- [Application Pitch](Design/2.%20Application%20Pitch.md)
- [Original Concepts & Reactions proposal](Design/3.%20Concepts%20%26%20Reactions.md)
- [UI Sketches](Design/4.%20UI%20sketches.md)
- [User Journey](Design/5.%20User%20Journey.md)
- [Visual Design Study](Design/6.%20Visual%20Study.md)
- [Notebook](Notebook.md)


## Demo

[Alpha demo](https://youtu.be/WtIpPg8ImIA)

[Beta demo]()


