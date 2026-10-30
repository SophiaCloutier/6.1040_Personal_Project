# P4 final review — October 29, 2026

## Scope

Reviewed reactions, authentication, concept tests, and submission documents. No application behavior or visual design was changed. The existing video is linked in [P4.md](../P4.md); recording and user testing were outside this review.

## Local automated checks

- `bun test`: **37 passed, 0 failed, 256 assertions** across 11 files. [Final output](p4-tests-final.txt).
- `bun run check`: passed concept source, application diagnostics, generated artifacts, and TypeScript. Diagnostics reported 32 advisories.
- `bun run check:web`: passed.
- `bun run build`: passed, with dependency externalization warnings for `node:crypto` and `node:util` in sync-engine dependencies.
- The first suite attempt could not connect to local MongoDB from the sandbox. The container was confirmed healthy and the suite passed with local network access outside the sandbox. The initial environment failure is not counted as a passing run.

Broad tests in accounts.test.ts, concepts.test.ts, and negotiating.test.ts now expose registration, session persistence/expiry/logout, listing validation, exclusive claiming, payment order/identity, and offer selection/resolution as separately named cases. Fixtures do not depend on earlier tests. Original assertions are retained, with an added payment-state assertion after rejected confirmation. Longer HTTP journeys and race regressions remain to verify interactions between concepts.

## Deployed application

Tested https://claimed.mit-sdg.dev/ through real HTTP endpoints. [Check script](check-p4-live.ts), [saved output](p4-live.txt). Run explicitly with `bun run validation/check-p4-live.ts --live`; this creates two test accounts and a temporary listing.

All 15 checks passed:

- Health and frontend respond successfully.
- Guest activity access fails with 401.
- Two accounts register and a seller publishes.
- Public browsing omits private payment instructions.
- A buyer cannot remove another seller's listing; the seller cannot buy their own listing.
- A buyer reserves the item. Premature receipt confirmation and seller reporting of buyer payment both fail with 403.
- The reservation remains after sign-out, sign-in, and a fresh activity request.
- The buyer cancels the unpaid reservation; the seller removes it; it disappears from public browsing.

The validation listing was removed and issued sessions were signed out. Two test accounts remain because there is no account-deletion endpoint. No real payment was made. This checks persistence across requests and new sessions, not through a deployed-server restart. No new manual browser interaction, responsive-layout audit, or user testing was performed. Completed-sale persistence, messaging privacy, image handling, cancellation races, and competing offer acceptance were checked locally, not in this deployed check.

## Review outcome

Protected endpoints resolve identity through Sessioning before participant actions. Seller ownership and buyer/payee rules are enforced in concepts and compositions. Reservation, removal, payment reporting, and cancellation use conditional state changes; offer acceptance uses the same reservation mechanism. No functional defect was identified. These checks do not establish recovery from a crash between separate reactions.

The README now links the final design, deployed URL, video, specifications, tests, and setup. The stale P1 removal note and missing validation link were corrected. All edits remain local; no commit, push, or deployment was performed.
