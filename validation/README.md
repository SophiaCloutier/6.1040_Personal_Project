# Validation evidence

## Current P4 review

- [Validation record](P4-validation.md): scope, results, advisories, and limits.
- [Final local test output](p4-tests-final.txt): 37 tests, 256 assertions.
- [Deployed check output](p4-live.txt) and [explicit live-check script](check-p4-live.ts).

Run the normal suite with `bun test` from `backend`; see [setup](../SETUP.md). The live check is separate: from the repository root, `bun run validation/check-p4-live.ts --live` creates two accounts and a temporary listing on the deployed app. It removes the listing and signs out its sessions; accounts remain because there is no deletion endpoint.

## Earlier milestone evidence

These files preserve development history and are not claims about the current test count or a fresh review:

- [P3 test output](p3-tests.txt).
- Earlier test runs: [beta](beta-tests.txt), [follow-up](follow-up-tests.txt), [messaging/activity](messaging-activity-tests.txt), and [traditional messaging](traditional-messaging-tests.txt).
- Layout screenshots: [desktop](visual-desktop.png), [390 px mobile](visual-mobile-390.png), [320 px mobile](visual-mobile-320.png), and [sign-in](visual-signin.png).
- Feature screenshots: [beta interface](beta-ui.png), [gallery and offers](item-gallery-offer.png), [photo editor](photo-editor.png), [selling order](selling-order.png), [inbox](messaging-inbox.png), and [messenger](traditional-messenger.png).
- [Style references](style-references): source images and video frames used while developing the visual direction. The assessed visual study is in [Design](../Design/6.%20Visual%20Study.md).

The screenshots are retained as historical evidence. The old machine-specific screenshot helper and one-off database fixture scripts were removed during P4 repository cleanup; the maintained automated checks are in [backend/tests](../backend/tests).
