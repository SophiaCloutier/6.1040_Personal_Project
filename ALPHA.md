# Claimed! alpha

## Core user journey

Starting with an empty database, Sophia creates an account and publishes a fixed-price $24 reading chair with a description, optional uploaded photo, pickup location, and external payment instructions. Percy creates his own account, finds the chair through the marketplace, opens its details, and claims it. The chair becomes reserved for Percy, preventing other buyers from claiming it. Percy pays Sophia externally and clicks “I've paid”; Sophia signs in, opens her Selling activity, and confirms receiving payment. The chair becomes sold, with the interface updating without a page refresh and the result retained in MongoDB. Pickup is coordinated outside the app.

## Demonstration recording — target 1 minute 50 seconds

Use a fresh database for the recording by setting a new database name before starting the server; do not delete existing data:

```powershell
cd backend
$env:MONGODB_DATABASE = 'claimed_recording_01'
bun run start
```

If the server is already running, stop it with Ctrl+C first. A different unused database name ensures the journey begins empty. Sign out of any prior browser session. Use fictional details and do not make a real payment.

| Time | Action | Suggested narration |
|---|---|---|
| 0:00–0:20 | Create Sophia's account. | “Claimed helps MIT students give items a second home. We start with an empty database and create a seller.” |
| 0:20–0:50 | Publish Reading chair, $24, Furniture, Maseeh Hall, and fictional payment instructions. | “Sophia lists her chair. Publishing makes it available through a reaction.” |
| 0:50–1:10 | Sign out, register Percy, search for the chair, and open it. | “Percy finds the item in one marketplace rather than searching PowerPoints.” |
| 1:10–1:25 | Claim, then click I've paid. | “The claim reserves it exclusively. Payment happens outside the app; Percy reports sending it.” |
| 1:25–1:45 | Sign out, sign in as Sophia, open My activity → Selling, and confirm payment. | “Only the seller can confirm receipt. A reaction completes the claim and marks the item sold.” |
| 1:45–1:50 | Show Sold status. | “The interface updates without a refresh, and MongoDB retains the sale.” |

Record your own screen and narration with Windows Snipping Tool or your preferred recorder. The recording is still a user deliverable; this script is preparation, not a completed recording.

## Scope for P3

OBO offers, messaging, listing editing/removal, richer profile/contact information, verified MIT membership, and deployment remain future work. Buyer or seller cancellation is supported before payment is reported; it releases the reservation and permits another buyer to claim the item. Current accounts use usernames and passwords; MIT membership is not verified. No timeout automatically releases a claim. Multi-concept actions persist independently, so crash recovery across reactions needs additional work before public deployment.

