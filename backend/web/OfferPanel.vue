<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { ClaimedWireHttp } from '../generated/wire';
import { api, checked, errorText } from './api';
const props = defineProps<{ user: string; listing?: string; seller?: string; available?: boolean; enabled?: boolean; titles?: Record<string, string> }>();
const emit = defineEmits<{ changed: []; open: [listing: string] }>();
type Offer = ClaimedWireHttp['/marketplace/offers']['output']['inbox']['offers'][number];
const offers = ref<Offer[]>([]), amount = ref<string | number>(''), busy = ref(false), error = ref(''), notice = ref('');
const shown = computed(() => offers.value.filter(o => !props.listing || o.listing === props.listing).slice().reverse());
let generation = 0;
async function load() { const current = ++generation; if (!props.user && !props.listing) { offers.value = []; return; }
  try { const result = checked(await (props.listing ? api.marketplace['listing-offers']({ listing: props.listing }) : api.marketplace.offers({}))); if (current === generation && 'inbox' in result) offers.value = result.inbox.offers; }
  catch (e) { if (current === generation) error.value = errorText(e); }
}
async function act(kind: 'offer' | 'accept' | 'declined' | 'withdrawn', offer = '') {
  if (busy.value) return; busy.value = true; error.value = ''; notice.value = '';
  try {
    if (kind === 'offer') { checked(await api.marketplace.offer({ listing: props.listing!, amount: String(amount.value) })); amount.value = ''; notice.value = 'Offer sent. The item remains available until the seller accepts.'; }
    else if (kind === 'accept') { checked(await api.marketplace['accept-offer']({ offer })); notice.value = 'Offer accepted and item reserved. The agreed price is saved.'; }
    else { checked(await api.marketplace['resolve-offer']({ offer, decision: kind })); notice.value = kind === 'declined' ? 'Offer declined.' : 'Offer withdrawn.'; }
    await load(); emit('changed');
  } catch (e) { error.value = errorText(e); } finally { busy.value = false; }
}
watch(() => [props.user, props.listing], load, { immediate: true });
let timer: ReturnType<typeof setInterval>;
onMounted(() => { timer = setInterval(() => { if (!document.hidden && !busy.value) void load(); }, 3000); });
onUnmounted(() => { generation++; clearInterval(timer); });
const price = (offer: Offer) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(JSON.parse(offer.terms).price);
</script>
<template>
  <section v-if="user || listing" class="feature-panel" aria-label="Offers">
    <h2>Offers</h2>
    <form v-if="user && listing && enabled && available && user !== seller" @submit.prevent="act('offer')"><label>Your offer ($)<input v-model="amount" type="number" min="0.01" max="100000" step="0.01" required :disabled="busy"></label><button class="dark" :disabled="busy">{{ busy ? 'Sending offer…' : 'Send offer' }}</button><p class="form-help">An offer does not reserve the item. You will pay the agreed amount if the seller accepts.</p></form>
    <p v-if="!shown.length" class="form-help">No offers yet.</p>
    <article v-for="offer in shown" :key="offer.offer" class="conversation-message">
      <button v-if="!listing" class="quiet" @click="emit('open', offer.listing)">{{ titles?.[offer.listing] || 'View listing' }}</button>
      <p>{{ offer.buyer }} offered <strong>{{ price(offer) }}</strong> · {{ offer.status }}</p>
      <template v-if="offer.status === 'pending' && (offer.seller === user || offer.buyer === user) && (!listing || available)"><button v-if="offer.seller === user" class="dark" :disabled="busy" @click="act('accept', offer.offer)">Accept &amp; reserve</button> <button class="quiet" :disabled="busy" @click="act(offer.seller === user ? 'declined' : 'withdrawn', offer.offer)">{{ offer.seller === user ? 'Decline' : 'Withdraw' }}</button></template>
    </article>
    <p v-if="notice" role="status">{{ notice }}</p><p v-if="error" class="inline-error" role="alert">{{ error }}</p>
  </section>
</template>
