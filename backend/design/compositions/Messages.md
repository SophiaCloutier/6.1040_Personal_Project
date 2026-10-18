# Messages
[Inbox](former:Messages.Conversations.Inbox) and [List](reaction:Messages.Conversations.List) authenticate the reader and return only their private conversations. [Send](reaction:Messages.Conversations.Send) resolves the seller from Listing, then Messaging verifies that the session actor is the buyer or an existing conversation's seller. Supplying another buyer cannot impersonate that buyer. Messages are plain text; attachments and notifications are outside this increment.
```endpoints
Messages.Conversations.List at /messages/list
Messages.Conversations.Send at /messages/send
Messages.Conversations.Conversations at /messages/conversations
Messages.Conversations.Thread at /messages/thread
Messages.Conversations.History at /messages/history
```

[Conversation summaries](former:Messages.Conversations.ConversationList) are returned by [Conversations](reaction:Messages.Conversations.Conversations), keeping old threads discoverable even if another thread has many messages. [Thread messages](former:Messages.Conversations.ThreadMessages) and [Thread](reaction:Messages.Conversations.Thread) scope history to the selected listing and buyer, with the authenticated actor enforced inside Messaging. The frontend opens that exact conversation inline, preserves drafts by conversation, and refreshes history without replacing the selected recipient. The inbox shows the 100 most recent conversations, while history is loaded in pages of 200 with a Load earlier messages control. Pagination of the conversation list remains future work.

[Paged history](former:Messages.Conversations.HistoryMessages) and [History](reaction:Messages.Conversations.History) let participants load earlier messages by cursor. Messaging validates the cursor in the same conversation and actor scope, so a different conversation cannot supply its cursor. The client preserves already loaded history during polling and when prepending an older page.
