import { endpoint, receive, respond } from '@mit-sdg/sync-engine/boundary';
import { each, form, former } from '@mit-sdg/sync-engine/language';
import { concepts } from '../concepts.ts';
import { validator, sessionOnlyInput } from './validators.ts';
const { Sessioning, Listing, Messaging } = concepts;
const Inbox = former('my messages', ({ user }, { message, listing, buyer, seller, sender, text, sentAt }) => form({
  messages: each(Messaging._inbox({ actor: user }).is({ message, subject: listing, buyer, seller, sender, text, sentAt })).form({ message, listing, buyer, seller, sender, text, sentAt }),
}));
const List = endpoint('/messages/list', ({ session, user }) => receive({ session })
  .then(Sessioning.current({ session }).responds({ subject: user }))
  .then(respond({ inbox: Inbox({ user }) })), { input: { required: ['session'] }, validators: { input: sessionOnlyInput } });
const ConversationList = former('my conversation summaries', ({ user }, { listing, buyer, seller, message, text, sentAt }) => form({
  conversations: each(Messaging._conversations({ actor: user }).is({ subject: listing, buyer, seller, message, text, sentAt })).form({ listing, buyer, seller, message, text, sentAt }),
}));
const Conversations = endpoint('/messages/conversations', ({ session, user }) => receive({ session })
  .then(Sessioning.current({ session }).responds({ subject: user }))
  .then(respond({ inbox: ConversationList({ user }) })), { input: { required: ['session'] }, validators: { input: sessionOnlyInput } });
const ThreadMessages = former('private conversation history', ({ user, listing, buyer }, { message, seller, sender, text, sentAt }) => form({
  messages: each(Messaging._thread({ actor: user, subject: listing, buyer }).is({ message, seller, sender, text, sentAt })).form({ message, listing, buyer, seller, sender, text, sentAt }),
}));
const Thread = endpoint('/messages/thread', ({ session, user, listing, buyer }) => receive({ session, listing, buyer })
  .then(Sessioning.current({ session }).responds({ subject: user }))
  .then(respond({ conversation: ThreadMessages({ user, listing, buyer }) })), { input: { required: ['session', 'listing', 'buyer'] }, validators: { input: validator(v => Object.keys(v).length === 3 && (typeof v.session === 'string' || v.session === null) && typeof v.listing === 'string' && v.listing.length <= 100 && typeof v.buyer === 'string' && v.buyer.length <= 32, 'Choose a conversation.') } });
const HistoryMessages = former('paged private conversation history', ({ user, listing, buyer, before }, { message, seller, sender, text, sentAt }) => form({
  messages: each(Messaging._history({ actor: user, subject: listing, buyer, before }).is({ message, seller, sender, text, sentAt })).form({ message, listing, buyer, seller, sender, text, sentAt }),
}));
const History = endpoint('/messages/history', ({ session, user, listing, buyer, before }) => receive({ session, listing, buyer, before })
  .then(Sessioning.current({ session }).responds({ subject: user }))
  .then(respond({ conversation: HistoryMessages({ user, listing, buyer, before }) })), { input: { required: ['session', 'listing', 'buyer', 'before'] }, validators: { input: validator(v => Object.keys(v).length === 4 && (typeof v.session === 'string' || v.session === null) && typeof v.listing === 'string' && v.listing.length <= 100 && typeof v.buyer === 'string' && v.buyer.length <= 32 && typeof v.before === 'string' && v.before.length <= 100, 'Choose a conversation and a valid history cursor.') } });
const Send = endpoint('/messages/send', ({ session, user, listing, buyer, seller, text, message }) => receive({ session, listing, buyer, text })
  .then(Sessioning.current({ session }).responds({ subject: user }))
  .then(Listing.owner({ listing }).responds({ seller }))
  .then(Messaging.send({ actor: user, buyer, seller, subject: listing, text }).responds({ message }))
  .then(respond({ message })), { input: { required: ['session', 'listing', 'buyer', 'text'] }, validators: { input: validator(v => Object.keys(v).length === 4 && (typeof v.session === 'string' || v.session === null) && typeof v.listing === 'string' && v.listing.length <= 100 && typeof v.buyer === 'string' && v.buyer.length <= 32 && typeof v.text === 'string' && !!v.text.trim() && v.text.length <= 2000, 'Write a message of 1–2000 characters.') } });
export const composition = { Conversations: { Inbox, List, ConversationList, Conversations, ThreadMessages, Thread, HistoryMessages, History, Send } };
