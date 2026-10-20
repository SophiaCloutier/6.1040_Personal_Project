# Design Notebook

## Entry 1: Keeping the first version manageable

I'm happy with how the idea is taking shape, but I'm starting to think the offer-based buying (OBO) feature might be too much for the first version. Negotiating offers would add a lot of complexity to what is already a fairly involved buying process. I'm going to focus on fixed-price listings first and only revisit OBO if I have time. I'm otherwise sticking pretty closely to my original problem framing. The concept and reaction specifications have been the most useful places to work out how those ideas should actually fit together.

## Entry 2: Planning the alpha - October 13, 2026

For the alpha, I'm limiting the buying process to five main steps: a seller posts a fixed-price listing, a buyer claims it, the buyer reports that they paid outside the site, the seller confirms receipt, and the listing is marked sold. I'm leaving offers, messaging, and cancellation out of this first pass. Keeping the flow small should make it easier to check that the basic transaction works before adding more options.

I'll build it in stages: get the app and database running, add accounts and sessions, implement listings and browsing, then claiming and payment confirmation. After that I'll test the whole process with two separate accounts, including what happens if two buyers try to claim the same item. The main example will be a $24 reading chair: Sophia lists it, Percy claims and pays for it, and Sophia confirms the payment.

I also need to make a few adjustments to the original specifications. Listings will include pickup details and payment instructions, and I'll start with image URLs rather than uploads. The transaction should refer to the actual listing instance, not just a general listing concept. I'm keeping the original `Design` folder as a record of the proposal and putting the implementation specifications in `backend/design`, partly because Windows does not distinguish `Design` and `design` as separate folder names.

## Entry 3: Decisions from the first implementation - October 13, 2026

I decided to keep authentication and sessions as separate concepts, following the framework's message-board example. Passwords are stored as Argon2id hashes, and sessions use expiring IDs in HTTP-only cookies. This lets actions check who is signed in without mixing account management into the marketplace concepts.

For listings, I'm storing the details together as validated JSON rather than splitting every field into separate state fields as I originally planned. It seems simpler for the first version, while still covering title, description, price, category, pickup, payment instructions, and an optional image URL. I'm also postponing listing edits, removal, and claim release. Claiming needs to be atomic so two buyers cannot reserve the same item, and buyers should not be able to claim their own listings. The payment concept separately checks that only the buyer can report payment and only the seller can confirm it.

One issue changed how I want to test the design. The initial browse query required a transaction to exist, which accidentally hid listings that nobody had claimed yet. I changed that to an optional `whether` read. More importantly, I'll check the intermediate states of the buyer journey, not just whether an item ends up sold. An available listing needs to show up before anyone can claim it.

I'm including search, categories, separate buying and selling views, and item details. Changes made in the current session should appear immediately; periodic polling can pick up changes made by someone else. Account membership verification and recovery from crashes between concept reactions are still outside this version's scope.

## Entry 4: Cancellation and a new visual direction - October 13, 2026

After trying the first version, I realized cancellation really does need to be part of the basic flow. Someone might claim an item and then decide not to buy it, and the seller needs a way to make that item available again. I'm allowing either the buyer or seller to cancel **before** payment is reported. Cancellation removes the unpaid transaction and releases the associated claim, so someone else can reserve the item. Once payment has been reported, cancellation through this flow is no longer allowed. The cancellation and payment updates are conditional so they cannot both succeed on the same transaction.

The initial interface also wasn't working for me visually. I'm moving away from the warm illustrated style toward something closer to eBay: white backgrounds, charcoal text, light gray accents, and more room for the listings themselves. I also prefer a dedicated page for each item rather than trying to squeeze all the details into a card or dialog. Each `/items/<id>` page will have a larger photo area, description, seller and pickup information, and the item's transaction status. I'll keep a separate `/activity` page for buying and selling history.

I'm making a few related usability changes: clearer progress through a sale, better keyboard behavior in dialogs, fallback images, and a reconnect message if updates fail. If polling fails, the interface should keep showing its last saved state rather than suddenly looking empty.


## Entry 5: Switching to photo uploads - October 13, 2026

Asking sellers to paste an image URL is not a great experience, so I'm replacing it with an actual file picker. I decided to make uploading a separate `ImageUploading` concept instead of burying it inside listing creation. That keeps the responsibility for checking and storing files separate from the responsibility for publishing a listing.

For now, uploaded photos will be stored locally. The upload will accept JPEG, PNG, and WebP files, with a 5 MB limit, and will resize them to fit within 1600 by 1600 pixels. I'll convert them to WebP and remove original metadata. Generated filenames also mean uploaded filenames never become filesystem paths. Existing listings that use image URLs should still work.

The form will let sellers preview, replace, or remove a selected photo. Uploading will happen when the listing is published, and a successfully uploaded file should be reused if the final publish step fails and has to be retried. I'm not tackling cleanup of unused uploaded files yet.

## Entry 6: Grid layout, public browsing, and tags - October 13, 2026

I've changed my mind about the marketplace layout again. A grid makes more sense for browsing secondhand items, especially now that photos are part of the listing process. I'm keeping the dedicated item pages for the full details.

I also don't think people should have to make an account just to see what's available. Guests will be able to browse listings and view photos, descriptions, tags, and availability. If they try to claim something, they'll be prompted to sign in without losing the item they were viewing. Publishing and all transaction actions will still require an account. Guest-facing responses also need to leave out private information such as payment instructions, buyer identity, and transaction details.

I'm replacing the fixed category bar with tags because items don't always fit neatly into one category. Sellers can choose suggested tags or create their own, and published custom tags can become suggestions for later listings. I'll limit each listing to 12 tags of at most 40 characters, normalize duplicates, and keep older category-based listings working through a fallback. Search will cover the title, description, pickup details, and tags. The filter panel will combine tags, availability, and a price range, with all selected tags required to match.

## Entry 8: Optional clothing sizes - October 15, 2026

Clothing and shoes need a size field, but I don't want every listing to be required to have one. Sellers can enter a suggested clothing or shoe size or a custom value, and common names such as “medium” will normalize to “M.” Numeric sizes can also become available as filter choices.

One detail matters for filtering: a selected size should only rule out listings that have a *different* size. Listings without any size should stay visible. Otherwise, choosing XL while searching for bikes would hide bikes that never needed a size in the first place. Size will appear on listings and item pages and work alongside the existing search and filters.

## Entry 9: Allowing multiple photos - October 15, 2026

One photo often isn't enough to show the condition of a used item, so I'm allowing up to five photos per listing. Sellers will be able to select several at once, add more later, preview them, and remove them before publishing. Each image still follows the same upload restrictions, and successful uploads can be reused if something goes wrong during publication.

I'm keeping the photos in an ordered list, with the first image acting as the cover. Older listings with a single image should continue to work. On the item page, a carousel with thumbnails and arrow controls will let buyers look through the photos; keyboard and swipe controls should work too. I want the current photo to stay selected when the page polls for updates, unless the photo set itself changes.

## Entry 10: Hiding sold listings without losing history - October 15, 2026

Completed sales shouldn't keep appearing in the marketplace grid as if the items were still available. I'm excluding sold listings from public browsing and the signed-in marketplace, but not deleting their records. Buyers and sellers still need those transactions in their activity history. This separates what people can shop for now from what they've already bought or sold.

## Entry 11: Notes for the Beta - October 15, 2026

In recording the video I thought of some things I would like to remember to work on in the Beta. One thing is allowing users to center their images after uploading. Another is that for some reason highlighting the username text in the sign-in page closes the sign-in page. Finally, I am thinking of maybe requiring some form of proof of payment (like a screenshot) before the user can click that they paid. I am not sure how I would implement that yet, though.

I will also need to implement the OBO feature and possibly a chat feature.

## Entry 12: Editing listings and bringing back offers - October 17, 2026
I wanted sellers to be able to fix or update listings without starting over, so I'm reusing the listing form for edits. Only the seller can make changes, and an edit should fail if someone else has changed the listing since it was opened. I also fixed the sign-in dialog closing when someone drags to select text. It should only close when a click actually starts on the background.
I'm finally adding OBO, but sellers can choose whether to allow offers. Making an offer won't reserve the item, so someone can still buy it at full price. If a seller accepts an offer, it goes through the same claiming system as a normal purchase to prevent two people from getting the same item. I'm keeping Negotiating separate from Claiming, and saving the agreed price and payment terms when the item is reserved. That way, editing a listing later can't change what a buyer already agreed to pay.

## Entry 13: Payment proof and a better photo experience - October 17, 2026
I was considering requiring screenshots as proof of payment, but I don't think that makes sense for cash purchases, and a screenshot doesn't actually prove the seller received the money. Instead, sellers can choose whether to require one, and buyers can attach one voluntarily. Only the buyer and seller should see it. I also realized payment instructions shouldn't be visible to unrelated signed-in users, so those need to stay private too. The seller still has to confirm receipt before a sale is complete.
The photo framing sliders were awkward, so I switched to dragging and zooming directly on the image. The marketplace cover keeps its crop, but the full item viewer should also let people pan, zoom, and fit the whole picture. I removed swipe-to-change-photo there because it conflicts with dragging. I also made the Edit listing and Send offer actions easier to find. Once payment has been reported, listing edits will be locked so the seller can't change the details midway through completing a sale.

## Entry 14: Making messaging feel like actual messaging - October 17, 2026
I wanted buyers to be able to ask sellers questions, but the first version of messaging felt more like a collection of forms than a chat. I'm keeping Messaging as its own concept, with private conversations tied to a specific listing and buyer. The inbox now has a searchable conversation list and a separate chat view, with my messages on the right and the other person's on the left. Drafts should stay with the correct conversation when switching between people, and older messages should be loadable instead of disappearing after the first 200.
I also changed the Buying and Selling pages to put the most useful items first. Sales waiting for seller confirmation come first in Selling, active items come next, and completed sales go last. Buying similarly puts active purchases before completed ones. I think this makes more sense than sorting everything by date when some items still need action.

## Entry 15: Finding a visual style that fits thrifting - October 19, 2026

I've changed my mind about the visual direction again. The cleaner marketplace layout helped make room for the listings, but I want the site to have more personality. I'm going with a retro '70s feel because I think it fits the thrifting side of the app. The posters, prints, and wavy patterns in my visual study gave me a direction for the warm colors and rounded shapes.

I'm using a cream background with dark brown text, rust for primary buttons and prices, and peach, pink, and yellow accents. I feel like this will make the site more welcoming while still giving important actions enough contrast to stand out. The background ribbons will bring in the playful part, with cream surfaces behind the intro text to keep it readable. I'll keep status labels and payment steps explicit so color won't be the only way to understand what's happening.

For typography, I want Cooper Black in the logo and major headings to carry that chunky retro feeling. Trebuchet MS will keep body text and controls straightforward, with Georgia for listing titles and the italic part of the main headline. I'm keeping the photo grid and dedicated item pages because those still make sense for browsing. Arched photos and rounded buttons will tie them into the new style without taking attention away from the items. I'll also keep visible keyboard focus outlines and reduced-motion support, and check that smaller text stays comfortable to read on a phone.



## Entry 16: Beta validation and retaining transaction history - October 19, 2026

I deployed claimed! at https://claimed.mit-sdg.dev/ and manually tested it while using the site. The functionality is working in my testing, and I have not identified an unresolved functional problem from that use. The updated buying and selling journeys describe the Beta's workflow.

The automated tests also passed: 20 tests, 0 failures, and 226 assertions across 10 files. They check the buying flow and persistence, competing claims, cancellation and payment ordering, offers, listing edits, private payment evidence, and messaging access, along with photo handling and filters. The execution output is saved in `validation/p3-tests.txt`; `validation/P3-validation.md` separates these automated checks from manual use and the additional read-only live checks. The implementation check, frontend type check, and production build passed as well. The implementation check still reports advisories, and the build reports dependency externalization warnings.

I decided to keep buying and selling history rather than add the listing removal action from my original proposal. People should be able to look back at what they bought or sold. Completed sales leave the marketplace but remain in both participants' activity histories. I marked the original concept proposal as historical and linked the current Beta specifications so the submission makes that decision clear.

I also decided to drop the free-with-purchase option from my original plan because linking two items would complicate claiming and cancellation, especially if someone claimed the free item separately, and I want to keep each transaction focused on a single listing.

## Entry 17: Last minute updates - October 20, 2026

When I went to record the demo I realized there were still some lingering issues. I wanted everyone to see OBO offers so that users know what the current best offer is. Also I needed a proper back button instead of just using the browser one. Additionally, I decided to put back in a way to remove a listing. Finally, trying to create a new user with an existing username just gave a generic error message and I wanted it to be more specific. I have fixed all these issues. 