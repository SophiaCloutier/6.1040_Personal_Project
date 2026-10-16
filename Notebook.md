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

In recording the video I though of some things I would like to remeber to work on in the Beta. One thing is allowing users to center their images after uploading. Another is that for some reason highlighting the username text in the sign in page closes the sign in page. Finally, I am thinking of maybe requiering some form of uploading proof of payment (like a screenshot) to allow the user to click that they paid. I am not sure how I would implement that yet though. 

I will also need to implement the OBO feature and possibly a chat feature.
