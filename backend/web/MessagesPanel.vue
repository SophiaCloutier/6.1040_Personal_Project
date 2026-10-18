<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import type { ClaimedWireHttp } from '../generated/wire';
import { api, checked, errorText } from './api';
const props = defineProps<{ user: string; listing?: string; seller?: string; titles?: Record<string, string> }>();
const emit = defineEmits<{ open: [listing: string] }>();
type Conversation = ClaimedWireHttp['/messages/conversations']['output']['inbox']['conversations'][number];
type Message = ClaimedWireHttp['/messages/thread']['output']['conversation']['messages'][number];
type Selection = { listing: string; buyer: string; seller: string };
const conversations = ref<Conversation[]>([]), selected = ref<Selection | null>(null), messages = ref<Message[]>([]);
const drafts = reactive<Record<string, string>>({});
const search = ref(''), showList = ref(true), olderBusy = ref(false), hasEarlier = ref(false);
const busy = ref(false), loading = ref(false), loadError = ref(''), sendError = ref(''), notice = ref('');
const history = ref<HTMLElement | null>(null);
const keyOf = (thread: Selection) => JSON.stringify([thread.listing, thread.buyer]);
const selectedKey = computed(() => selected.value ? keyOf(selected.value) : '');
const text = computed({ get: () => drafts[selectedKey.value] ?? '', set: value => { drafts[selectedKey.value] = value; } });
const partner = (thread: Selection) => thread.seller === props.user ? thread.buyer : thread.seller;
const titleOf = (thread: Selection) => props.titles?.[thread.listing] || 'This listing';
const shown = computed(() => conversations.value.filter(c => (!props.listing || c.listing === props.listing) && [partner(c), titleOf(c), c.text].join(' ').toLowerCase().includes(search.value.trim().toLowerCase())));
const clock = (value: string) => new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const dateLabel = (value: string) => new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
const newDay = (index: number) => index === 0 || new Date(messages.value[index - 1].sentAt).toDateString() !== new Date(messages.value[index].sentAt).toDateString();
const otherPerson = computed(() => !selected.value ? '' : selected.value.seller === props.user ? selected.value.buyer : selected.value.seller);
let generation = 0, inboxGeneration = 0, refreshPending = false;
function choose(conversation: Selection) {
  if (busy.value) return;
  showList.value = false;
  if (keyOf(conversation) === selectedKey.value) return;
  selected.value = { listing: conversation.listing, buyer: conversation.buyer, seller: conversation.seller };
}
async function loadInbox() {
  const version = ++inboxGeneration;
  if (!props.user) return;
  const result = checked(await api.messages.conversations({}));
  if (version !== inboxGeneration || !('inbox' in result)) return;
  conversations.value = result.inbox.conversations;
  if (!selected.value && conversations.value.length) {
    const first = conversations.value.find(c => !props.listing || c.listing === props.listing);
    if (first) selected.value = { listing: first.listing, buyer: first.buyer, seller: first.seller };
  }
}
async function loadThread(scroll = false) {
  const thread = selected.value;
  if (!thread) return;
  const key = keyOf(thread), version = ++generation;
  const shouldScroll = scroll || !history.value || history.value.scrollHeight - history.value.scrollTop - history.value.clientHeight < 60;
  const result = checked(await api.messages.history({ listing: thread.listing, buyer: thread.buyer, before: '' }));
  if (version !== generation || selectedKey.value !== key || !('conversation' in result)) return;
  const latest = result.conversation.messages;
  if (!messages.value.length) { messages.value = latest; hasEarlier.value = latest.length === 200; }
  else {
    // Keep previously loaded older pages while polling updates the newest page.
    const start = latest[0] ? messages.value.findIndex(message => message.message === latest[0].message) : -1;
    const prefix = start >= 0 ? messages.value.slice(0, start) : messages.value.filter(message => !latest.some(row => row.message === message.message));
    messages.value = [...prefix, ...latest];
  }
  if (shouldScroll) { await nextTick(); if (history.value) history.value.scrollTop = history.value.scrollHeight; }
}
async function loadEarlier() {
  if (olderBusy.value || !selected.value || !messages.value.length) return;
  const thread = { ...selected.value }, key = selectedKey.value, before = messages.value[0].message;
  olderBusy.value = true;
  try {
    const result = checked(await api.messages.history({ listing: thread.listing, buyer: thread.buyer, before }));
    if (key !== selectedKey.value || !('conversation' in result)) return;
    const oldHeight = history.value?.scrollHeight ?? 0, oldTop = history.value?.scrollTop ?? 0;
    const ids = new Set(messages.value.map(message => message.message));
    messages.value = [...result.conversation.messages.filter(message => !ids.has(message.message)), ...messages.value];
    hasEarlier.value = result.conversation.messages.length === 200;
    await nextTick(); if (history.value) history.value.scrollTop = oldTop + history.value.scrollHeight - oldHeight;
    loadError.value = '';
  } catch (error) { if (key === selectedKey.value) loadError.value = errorText(error); }
  finally { olderBusy.value = false; }
}
async function refresh() {
  if (refreshPending || busy.value || !props.user) return;
  refreshPending = true;
  try { await Promise.all([loadInbox(), loadThread()]); loadError.value = ''; }
  catch (error) { loadError.value = errorText(error); }
  finally { refreshPending = false; }
}
watch(() => [props.user, props.listing, props.seller], (current, previous) => {
  if (previous && current[0] !== previous[0]) for (const key of Object.keys(drafts)) delete drafts[key];
  search.value = ''; showList.value = !(props.listing && props.seller && props.user !== props.seller);
  generation++; inboxGeneration++; conversations.value = []; messages.value = [];
  selected.value = props.listing && props.seller && props.user !== props.seller ? { listing: props.listing, buyer: props.user, seller: props.seller } : null;
  loadError.value = ''; sendError.value = ''; notice.value = '';
  if (props.user) void refresh();
}, { immediate: true });
watch(selectedKey, async () => {
  generation++; messages.value = []; hasEarlier.value = false; sendError.value = ''; notice.value = '';
  if (!selected.value) return;
  const key = selectedKey.value; loading.value = true;
  try { await loadThread(true); if (key === selectedKey.value) loadError.value = ''; }
  catch (error) { if (key === selectedKey.value) loadError.value = errorText(error); }
  finally { if (key === selectedKey.value) loading.value = false; }
}, { immediate: true });
async function send() {
  if (busy.value || !selected.value || !text.value.trim()) return;
  const thread = { ...selected.value }, key = selectedKey.value, submitted = text.value;
  busy.value = true; sendError.value = ''; notice.value = '';
  try {
    checked(await api.messages.send({ listing: thread.listing, buyer: thread.buyer, text: submitted }));
    if (drafts[key] === submitted) drafts[key] = '';
    notice.value = 'Message sent.';
    try { await Promise.all([loadInbox(), loadThread(true)]); loadError.value = ''; }
    catch (error) { loadError.value = errorText(error); }
  } catch (error) { sendError.value = errorText(error); }
  finally { busy.value = false; }
}
function keyboard(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); void send(); }
}
let timer: ReturnType<typeof setInterval>;
onMounted(() => { timer = setInterval(() => { if (!document.hidden) void refresh(); }, 3000); });
onUnmounted(() => { generation++; inboxGeneration++; clearInterval(timer); });
</script>
<template>
  <section v-if="user" class="feature-panel messages-panel" aria-label="Private messages">
    <h2>Messages</h2>
    <div class="messenger-shell" :class="{ 'is-compact': !!listing, 'chat-open': !!selected && !showList }">
      <aside class="messenger-sidebar" aria-label="Conversations">
        <div class="messenger-sidebar-heading"><strong>Conversations</strong><small>{{ conversations.filter(c => !listing || c.listing === listing).length }}</small></div>
        <input v-model="search" class="conversation-search" type="search" aria-label="Search conversations" placeholder="Search conversations…">
        <div class="messenger-conversations">
          <button v-for="conversation in shown" :key="keyOf(conversation)" type="button" class="messenger-conversation" :class="{ selected: selectedKey === keyOf(conversation) }" :aria-pressed="selectedKey === keyOf(conversation)" :aria-label="'Open conversation with ' + partner(conversation) + ' about ' + titleOf(conversation)" :disabled="busy" @click="choose(conversation)">
            <span class="chat-avatar" aria-hidden="true">{{ partner(conversation)[0]?.toUpperCase() }}</span>
            <span class="conversation-preview"><strong>{{ partner(conversation) }}</strong><span>{{ titleOf(conversation) }}</span><small>{{ conversation.text }}</small></span>
            <time :datetime="conversation.sentAt">{{ clock(conversation.sentAt) }}</time>
          </button>
          <p v-if="!shown.length" class="messenger-placeholder">{{ search ? 'No matching conversations.' : listing ? 'No conversations yet. Buyers can message the seller here.' : 'No conversations yet. Open a listing to contact its seller.' }}</p>
        </div>
        <p class="messenger-sidebar-note">Your 100 most recent conversations</p>
      </aside>
      <div class="messenger-chat" :aria-label="selected ? 'Chat with ' + otherPerson : 'Select a conversation'">
        <template v-if="selected">
          <header class="chat-header">
            <button type="button" class="chat-back quiet" aria-label="Back to conversations" @click="showList = true">‹</button>
            <span class="chat-avatar" aria-hidden="true">{{ otherPerson[0]?.toUpperCase() }}</span>
            <div class="chat-header-copy"><h3>{{ otherPerson }}</h3><small>{{ titleOf(selected) }}</small></div>
            <button v-if="!listing" type="button" class="quiet chat-listing-link" @click="emit('open', selected.listing)">View listing ↗</button>
          </header>
          <div ref="history" class="chat-history" role="log" aria-label="Conversation history" aria-live="polite" aria-relevant="additions" :aria-busy="loading">
            <button v-if="hasEarlier" type="button" class="chat-load-earlier quiet" :disabled="olderBusy" @click="loadEarlier">{{ olderBusy ? 'Loading…' : 'Load earlier messages' }}</button>
            <p v-if="loading" role="status" class="messenger-placeholder">Loading messages…</p>
            <p v-else-if="!messages.length" class="messenger-placeholder">Start a conversation with {{ otherPerson }}. Only the two of you can read it.</p>
            <template v-for="(message, index) in messages" :key="message.message">
              <div v-if="newDay(index)" class="chat-date">{{ dateLabel(message.sentAt) }}</div>
              <article class="chat-message" :class="{ 'is-own': message.sender === user }" :aria-label="message.sender === user ? 'Your message' : 'Message from ' + message.sender">
                <div class="chat-bubble"><p>{{ message.text }}</p></div>
                <small class="chat-message-meta">{{ message.sender === user ? 'You' : message.sender }} · <time :datetime="message.sentAt">{{ clock(message.sentAt) }}</time></small>
              </article>
            </template>
          </div>
          <div v-if="loadError" class="chat-error" role="status">{{ loadError }}<button type="button" class="quiet" @click="refresh">Retry</button></div>
          <div v-if="sendError" class="chat-error" role="alert">{{ sendError }} Your draft is still here.</div>
          <form class="chat-composer" @submit.prevent="send">
            <textarea v-model="text" :aria-label="'Message to ' + otherPerson" :placeholder="'Message ' + otherPerson + '…'" maxlength="2000" rows="2" required :disabled="busy" @keydown="keyboard"></textarea>
            <button class="dark chat-send" :disabled="busy || !text.trim()">{{ busy ? 'Sending…' : 'Send' }}</button>
            <div class="chat-composer-help"><span>Enter to send · Shift+Enter for a new line</span><span>{{ text.length }}/2000</span></div>
            <span v-if="notice" class="chat-sent-status" role="status">{{ notice }}</span>
          </form>
        </template>
        <div v-else class="chat-empty"><span aria-hidden="true">✉</span><h3>Your conversations</h3><p>Select a conversation to see past messages and reply.</p></div>
      </div>
    </div>
    <p v-if="loadError && !selected" class="inline-error" role="status">{{ loadError }}<button type="button" class="quiet" @click="refresh">Retry</button></p>
  </section>
</template>

<style scoped>
.messages-panel{min-width:0}.messenger-shell{display:grid;grid-template-columns:290px minmax(0,1fr);height:min(700px,76vh);min-height:460px;border:1px solid var(--line);border-radius:6px;overflow:hidden;margin-top:18px;background:#fff}.messenger-sidebar{display:flex;flex-direction:column;min-height:0;border-right:1px solid var(--line);background:#fafafa}.messenger-sidebar-heading{display:flex;justify-content:space-between;align-items:center;padding:20px 16px 12px;font-size:14px}.messenger-sidebar-heading small{color:#92969e;font-weight:400}.conversation-search{width:calc(100% - 24px);margin:0 12px 12px;padding:10px 12px;border:1px solid #e2e5e9;border-radius:5px;background:#fff;font-size:12px}.messenger-conversations{flex:1;overflow:auto;min-height:0}.messenger-conversation{display:flex;gap:10px;width:100%;padding:15px 12px;text-align:left;background:transparent;border-bottom:1px solid #eceef1;align-items:flex-start;color:inherit}.messenger-conversation:hover{background:#f0f2f5}.messenger-conversation.selected{background:#e9edf2;box-shadow:inset 3px 0 #343b45}.chat-avatar{flex-shrink:0;display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#e4e7eb;color:#59616c;font-size:13px;font-weight:600}.conversation-preview{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}.conversation-preview strong{font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.conversation-preview>span{font-size:10px;color:#818894;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.conversation-preview small{font-size:12px;color:#737b86;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.messenger-conversation>time{font-size:9px;color:#9299a2;white-space:nowrap;padding-top:2px}.messenger-sidebar-note{font-size:10px;color:#9399a2;padding:12px 16px;margin:0;border-top:1px solid var(--line)}.messenger-chat{display:flex;flex-direction:column;min-width:0;min-height:0;background:#fff}.chat-header{display:flex;align-items:center;gap:12px;flex-shrink:0;padding:16px 20px;border-bottom:1px solid var(--line)}.chat-header-copy{min-width:0;flex:1}.chat-header h3{font-size:14px;font-weight:600;margin:0 0 4px;overflow-wrap:anywhere}.chat-header-copy small{font-size:11px;color:#9299a2;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.chat-listing-link{font-size:10px;white-space:nowrap;padding:4px 0}.chat-back{display:none;font-size:28px;padding:0 6px 3px 0}.chat-history{display:flex;flex-direction:column;gap:12px;flex:1;min-height:0;overflow:auto;padding:20px 24px;scrollbar-gutter:stable;background:#fdfdfd;overscroll-behavior:contain}.chat-message{display:flex;flex-direction:column;align-items:flex-start;align-self:flex-start;max-width:78%;flex-shrink:0;min-width:0}.chat-message.is-own{align-items:flex-end;align-self:flex-end}.chat-bubble{padding:11px 15px;background:#edf0f4;color:#313944;border-radius:14px 14px 14px 3px;max-width:100%;min-width:28px}.is-own .chat-bubble{background:#303741;color:white;border-radius:14px 14px 3px 14px}.chat-bubble p{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;line-height:1.6;margin:0}.chat-message-meta{font-size:9px;color:#959ca6;margin:5px 3px 0}.chat-date{align-self:center;font-size:10px;color:#969da6;padding:6px 12px;margin:4px 0}.chat-composer{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 12px;align-items:end;padding:15px 20px 10px;margin:0;border-top:1px solid var(--line);flex-shrink:0;background:#fff}.chat-composer textarea{margin:0;padding:10px 12px;min-height:44px;max-height:140px;border:1px solid #dfe3e8;border-radius:6px;resize:vertical;width:100%;font-size:13px;background:#fafbfc;line-height:1.5}.chat-send{margin:0;align-self:stretch;padding:10px 19px;font-size:12px;border-radius:5px;min-width:70px}.chat-composer-help{grid-column:1/-1;display:flex;justify-content:space-between;font-size:9px;color:#969da7;gap:8px}.chat-sent-status{grid-column:1/-1;font-size:10px;color:#6a7d70}.chat-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;text-align:center;padding:28px;color:#9098a3}.chat-empty>span{font-size:38px;color:#b0b7c1}.chat-empty h3{font-size:17px;font-weight:500;color:#67717e}.chat-empty p{font-size:12px;line-height:1.7;max-width:250px}.messenger-placeholder{font-size:12px;line-height:1.7;color:#939ba5;text-align:center;padding:20px 15px;margin:auto}.chat-error{background:#fff3ef;color:#955b4d;padding:10px 16px;font-size:11px;line-height:1.6;flex-shrink:0}.chat-error button{margin-left:10px;font-size:11px;text-decoration:underline}.chat-load-earlier{font-size:11px;align-self:center;padding:7px 12px;flex-shrink:0}
.is-compact{grid-template-columns:minmax(0,1fr);height:540px;min-height:420px}.is-compact .chat-back{display:block}.is-compact.chat-open .messenger-sidebar{display:none}.is-compact:not(.chat-open) .messenger-chat{display:none}.is-compact .messenger-sidebar{border:0}.is-compact .chat-header{padding:14px 12px}.is-compact .chat-history{padding:16px 12px}.is-compact .chat-composer{padding:12px}.is-compact .chat-message{max-width:86%}
@media(max-width:760px){.messenger-shell{grid-template-columns:minmax(0,1fr);height:min(680px,78dvh);min-height:460px}.chat-back{display:block}.chat-open .messenger-sidebar{display:none}.messenger-shell:not(.chat-open) .messenger-chat{display:none}.messenger-sidebar{border:0}.chat-history{padding:16px 12px}.chat-header{padding:14px 12px}.chat-composer{padding:12px}.chat-message{max-width:86%}}
</style>
