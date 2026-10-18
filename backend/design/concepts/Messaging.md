# Messaging
## Purpose
Keep private conversations between two people about a subject.
## Principle
A buyer starts a conversation with a seller. Both can then send plain-text messages and read their shared history. Other identities cannot read or send to that conversation. The legacy inbox returns 500 messages. Conversation summaries select the latest message per buyer and subject, ordered by most recent activity, up to 100 threads. Each thread query returns its latest 200 messages in chronological order and requires a participant.
## Types
```types
external Actor
  A participant identity.
external Subject
  A topic supplied by the application.
```
## State
```state
a set of Messages with
  a subject Subject
  a buyer Actor
  a seller Actor
  a sender Actor
  a text String
  a sentAt String
```
## Actions
```actions
send (actor: Actor, buyer: Actor, seller: Actor, subject: Subject, text: String) : returns (message: Message)
  where text is empty or exceeds 2000 characters, buyer equals seller, actor is neither participant, or seller starts a nonexistent conversation
  then
    refuses INVALID_MESSAGE "Write a valid message in your own conversation."
  where actor is buyer or seller of an existing conversation and text is valid
  then
    persist a fresh message with sender and timestamp
    returns message
  where actor is buyer starting a conversation with a different seller and text is valid
  then
    persist a fresh message with sender and timestamp
    returns message
```
## Queries
```queries
_conversations (actor: Actor) : many (subject: Subject, buyer: Actor, seller: Actor, message: Message, text: String, sentAt: String)
  answers the latest message of each conversation involving actor, newest conversation first, up to 100
_thread (actor: Actor, subject: Subject, buyer: Actor) : many (message: Message, subject: Subject, buyer: Actor, seller: Actor, sender: Actor, text: String, sentAt: String)
  answers the latest 200 messages in the selected conversation oldest first; nonparticipants get no rows
_history (actor: Actor, subject: Subject, buyer: Actor, before: String) : many (message: Message, subject: Subject, buyer: Actor, seller: Actor, sender: Actor, text: String, sentAt: String)
  answers up to 200 messages in chronological order before the named message, or latest messages for empty before; actor and cursor must belong to this conversation
_inbox (actor: Actor) : many (message: Message, subject: Subject, buyer: Actor, seller: Actor, sender: Actor, text: String, sentAt: String)
  answers the latest 500 messages involving actor, ordered oldest first
```
