<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { createHttpClient } from '@mit-sdg/sync-engine-http/client';
import type { ClaimedWireHttp } from '../generated/wire.ts';
import PhotoFrame from './PhotoFrame.vue';
import PaymentPanel from './PaymentPanel.vue';
import OfferPanel from './OfferPanel.vue';
import MessagesPanel from './MessagesPanel.vue';
import TagPicker from './TagPicker.vue';
import ImageCarousel from './ImageCarousel.vue';
import HeroWaves from './HeroWaves.vue';
import { suggestedTags } from './tags.ts';
import { canEditListing, orderActivity } from '../shared/activity';
import { clothingSizes, normalizeClothingSize, matchesClothingSize } from '../shared/clothing-sizes.ts';
const api = createHttpClient<ClaimedWireHttp>({ baseUrl: '/api' });
type Item = ClaimedWireHttp['/marketplace/activity']['output']['marketplace']['listings'][number];
type Details = { title: string; price: number; description: string; category: string; tags: string[]; clothingSize?: string; pickup: string; payment: string; image: string; images?: string[]; imagePositions?: Record<string, { x: number; y: number; zoom?: number }>; obo?: boolean; requireProof?: boolean };
const selectedTags = ref<string[]>([]), filterOpen = ref(false), minPrice = ref<number | ''>(''), maxPrice = ref<number | ''>(''), availability = ref('all');
const selectedSize = ref('');
const user = ref(''), items = ref<Item[]>([]), search = ref(''), page = ref('market'), tab = ref('buying');
const auth = ref(false), register = ref(false), publish = ref(false), selected = ref<string | null>(null), busy = ref(false), message = ref(''), failed = ref(false);
const credentials = reactive({ username: '', password: '' });
const loading = ref(false), disconnected = ref(false), brokenImages = reactive(new Set<string>());
const cancelling = ref(false);
type ChosenPhoto = { id: string; file?: File; preview: string; uploaded: string; x: number; y: number; zoom: number };
const editing = ref<string | null>(null), previousDetails = ref('');
function editListing(item: Item) {
  if (!canEditListing(item)) { note('Listings cannot be edited after payment is sent or the item is sold.', true); return; }
  clearPhoto();
  Object.assign(draft, blank(), details(item));
  editing.value = item.listing; previousDetails.value = item.details;
  photos.value = imagesOf(item).map(url => ({ id: crypto.randomUUID(), preview: url, uploaded: url, x: details(item).imagePositions?.[url]?.x ?? 50, y: details(item).imagePositions?.[url]?.y ?? 50, zoom: details(item).imagePositions?.[url]?.zoom ?? 1 }));
  publish.value = true; message.value = '';
}

const photos = ref<ChosenPhoto[]>([]);
function removePhoto(id: string) {
  const photo = photos.value.find(p => p.id === id);
  if (photo) photo.file && URL.revokeObjectURL(photo.preview);
  photos.value = photos.value.filter(p => p.id !== id);
}
function clearPhoto() {
  photos.value.forEach(photo => photo.file && URL.revokeObjectURL(photo.preview));
  photos.value = []; draft.image = ''; draft.images = [];
}
function choosePhoto(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = '';
  if (!files.length) return;
  if (files.length + photos.value.length > 5) { note('You can add up to five photos. Remove a photo before adding more.', true); return; }
  if (files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
    note('Each photo must be a JPEG, PNG, or WebP up to 5 MB.', true); return;
  }
  photos.value.push(...files.map(file => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file), uploaded: '', x: 50, y: 50, zoom: 1 })));
  message.value = '';
}
function photoData(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('This photo could not be read. Please choose another file.'));
    reader.readAsDataURL(file);
  });
}
let loadVersion = 0;
let loadPending = false;
let focusBeforeDialog: HTMLElement | null = null;
const modalOpen = computed(() => auth.value || publish.value);
const steps = ['Reserved', 'Payment sent', 'Confirmed'];
const stepIndex = (item: Item) => item.claim?.status === 'completed' ? 2 : item.transaction?.status === 'awaitingConfirmation' ? 1 : 0;
const blank = (): Details => ({ title: '', price: 0, description: '', category: 'Other', tags: [], clothingSize: '', pickup: '', payment: '', image: '', images: [], imagePositions: {}, obo: false, requireProof: false });
const draft = reactive(blank());
const tagsOf = (item: Item): string[] => { const d = details(item); return d.tags?.length ? d.tags : d.category && d.category !== 'Other' ? [d.category.toLowerCase()] : []; };
const allTags = computed(() => [...new Set([...suggestedTags, ...items.value.flatMap(tagsOf), ...draft.tags])].sort());
const sizeOptions = computed(() => [...new Set([...clothingSizes, ...items.value.map(item => normalizeClothingSize(details(item).clothingSize ?? '')).filter(Boolean)])]);
const filterCount = computed(() => selectedTags.value.length + Number(minPrice.value !== '') + Number(maxPrice.value !== '') + Number(availability.value !== 'all') + Number(selectedSize.value !== ''));
function clearFilters() { selectedTags.value = []; minPrice.value = ''; maxPrice.value = ''; availability.value = 'all'; selectedSize.value = ''; }
const details = (item: Item): Details => JSON.parse(item.details);
const imagesOf = (item: Item): string[] => { const d = details(item); return d.images?.length ? d.images : d.image ? [d.image] : []; };
const itemTitles = computed(() => Object.fromEntries(items.value.map(item => [item.listing, details(item).title])));
const active = computed(() => items.value.find(x => x.listing === selected.value));
const filtered = computed(() => { const matching = items.value.filter(item => {
  const d = details(item);
  const words = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const text = [d.title, d.description, d.pickup, ...tagsOf(item)].join(' ').toLowerCase();
  const matches = words.every(word => text.includes(word)) && selectedTags.value.every(tag => tagsOf(item).includes(tag))
    && matchesClothingSize(d.clothingSize, selectedSize.value)
    && (minPrice.value === '' || d.price >= minPrice.value) && (maxPrice.value === '' || d.price <= maxPrice.value)
    && (availability.value === 'all' || item.claim?.status === availability.value);
  return matches && !(page.value === 'market' && item.claim?.status === 'completed') && (page.value === 'market' || (tab.value === 'selling' ? item.seller === user.value : item.claim?.claimer === user.value));
}); return page.value === 'activity' ? orderActivity(matching, tab.value === 'selling') : matching; });
const status = (item: Item) => item.claim?.status === 'completed' ? 'Sold' : item.transaction?.status === 'awaitingConfirmation' ? 'Payment sent' : item.claim?.status === 'claimed' ? 'Reserved' : 'Available';
const money = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(price);
const errors: Record<string, string> = { LISTING_LOCKED: 'Payment has been sent or this item is sold. Listing edits are closed.', INVALID_CREDENTIALS: 'That username or password is incorrect.', USERNAME_TAKEN: 'That username is already taken.', INVALID_USERNAME: 'Use 3–32 letters, numbers, underscores, or hyphens.', WEAK_PASSWORD: 'Use a password with 8–128 characters.', UNKNOWN_SESSION: 'Your session has expired. Please sign in again.', CLAIM_UNAVAILABLE: 'Someone has already claimed this item.', CANNOT_BUY: 'You cannot claim your own listing.', INVALID_TRANSACTION: 'This payment action is not available to your account yet.', INVALID_IMAGE: 'This photo could not be uploaded. Choose a JPEG, PNG, or WebP up to 5 MB.', INVALID_LISTING: 'Check your listing: title, price, pickup, and payment instructions are required.', INVALID_INPUT: 'Please check the information you entered.', CANCELLATION_UNAVAILABLE: 'This reservation cannot be cancelled after payment is reported.', NETWORK_ERROR: 'We can’t reach the server. Your information is still here; please try again.', BAD_STATUS: 'The server could not complete this request. Please try again.', BAD_JSON: 'The server returned an unexpected response. Please try again.' };
function note(text: string, error = false) { message.value = text; failed.value = error; }
function check<T extends object>(result: T): T {
  if ('error' in result) {
    if (result.error === 'UNKNOWN_SESSION') { loadVersion++; user.value = ''; items.value = []; publish.value = false; auth.value = true; void load().catch(() => {}); }
    throw new Error(errors[String(result.error)] ?? 'The request could not be completed. Please try again.');
  }
  return result;
}
async function load() {
  const version = ++loadVersion;
  if (user.value) {
    const result = await api.marketplace.activity({});
    if (version !== loadVersion) return;
    if ('error' in result) { check(result); return; }
    items.value = result.marketplace.listings.slice().reverse();
  } else {
    const result = await api.marketplace.list({});
    if (version !== loadVersion) return;
    if ('error' in result) { check(result); return; }
    items.value = result.marketplace.listings.slice().reverse().map(item => ({ ...item, claim: { ...item.claim, claimer: '' }, transaction: { payer: null, payee: null, status: null } }));
  }
  disconnected.value = false;
}
async function run(task: () => Promise<void>) {
  if (busy.value) return;
  busy.value = true; message.value = '';
  try { await task(); } catch (error) { note(error instanceof Error ? error.message : 'Could not connect. Please try again.', true); }
  finally { busy.value = false; }
}
async function signIn() {
  await run(async () => {
    const result = register.value ? await api.auth.register({ ...credentials }) : await api.auth['sign-in']({ ...credentials });
    check(result);
    if ('account' in result) user.value = result.account;
    credentials.password = ''; auth.value = false; await load(); note(register.value ? 'Welcome to Claimed! Your next find is waiting.' : `Welcome back, ${user.value}.`);
  });
}
async function signOut() {
  await run(async () => { check(await api.auth['sign-out']({})); loadVersion++; user.value = ''; items.value = []; selected.value = null; navigate('market'); search.value = ''; clearFilters(); await load(); note('You have signed out.'); });
}
function sell() { if (!user.value) { register.value = true; auth.value = true; } else { clearPhoto(); Object.assign(draft, blank()); editing.value = null; publish.value = true; message.value = ''; } }
async function createListing() {
  await run(async () => {
    const current = editing.value && items.value.find(item => item.listing === editing.value);
    if (current && !canEditListing(current)) throw new Error('Payment has been sent or this item is sold. Listing edits are closed.');
    for (const photo of photos.value) {
      if (photo.uploaded || !photo.file) continue;
      const result = await api.images.upload({ data: await photoData(photo.file), mime: photo.file.type });
      check(result);
      if ('image' in result) photo.uploaded = result.image;
    }
    draft.images = photos.value.map(photo => photo.uploaded);
    draft.image = draft.images[0] ?? '';
    draft.imagePositions = Object.fromEntries(photos.value.map(photo => [photo.uploaded, { x: photo.x, y: photo.y, zoom: photo.zoom }]));
    if (editing.value) check(await api.marketplace.edit({ listing: editing.value, previous: previousDetails.value, details: JSON.stringify(draft) }));
    else check(await api.marketplace.publish({ details: JSON.stringify(draft) }));
    clearPhoto(); Object.assign(draft, blank()); publish.value = false; navigate('activity'); tab.value = 'selling'; search.value = ''; clearFilters(); await load(); note(editing.value ? 'Listing updated.' : 'Your listing is live.'); editing.value = null;
  });
}
async function action(kind: 'claim' | 'report-paid' | 'confirm' | 'cancel') {
  if (!active.value) return;
  if (!user.value) { auth.value = true; register.value = false; return; }
  const listing = active.value.listing;
  await run(async () => { check(await api.marketplace[kind]({ listing })); cancelling.value = false; await load(); note(kind === 'cancel' ? 'Reservation cancelled. The item is available again.' : kind === 'claim' ? 'It’s reserved for you. Pay the seller, then report your payment.' : kind === 'report-paid' ? 'Payment reported. The seller will confirm receipt.' : 'Payment confirmed. The item is now sold.'); });
}
function navigate(next: 'market' | 'activity') {
  selected.value = null; cancelling.value = false; page.value = next;
  history.pushState({}, '', next === 'activity' ? '/activity' : '/');
  window.scrollTo({ top: 0 });
}
function openItem(listing: string) {
  selected.value = listing; cancelling.value = false; page.value = 'item'; message.value = '';
  history.pushState({}, '', '/items/' + listing);
  window.scrollTo({ top: 0 });
}
function followItem(event: MouseEvent, listing: string) {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault();
  openItem(listing);
}
function syncRoute() {
  const match = location.pathname.match(/^\/items\/([a-f0-9-]{36})$/);
  selected.value = match?.[1] ?? null;
  page.value = match ? 'item' : location.pathname === '/activity' ? 'activity' : 'market';
  cancelling.value = false;
}
watch(active, item => { document.title = item ? details(item).title + ' — Claimed!' : 'Claimed! — MIT marketplace'; });
let timer: ReturnType<typeof setInterval>;
function closeDialog() {
  if (busy.value) return;
  auth.value = false; publish.value = false;
  cancelling.value = false;
  credentials.password = '';
}
// A drag that starts in an input and ends outside can generate a backdrop click.
const backdropPressed = ref(false);
function backdropDown(event: PointerEvent) { backdropPressed.value = event.target === event.currentTarget; }
function backdropClick(event: MouseEvent) {
  if (backdropPressed.value && event.target === event.currentTarget) closeDialog();
  backdropPressed.value = false;
}
function keyboard(event: KeyboardEvent) {
  if (!modalOpen.value) return;
  if (event.key === 'Escape') { event.preventDefault(); closeDialog(); return; }
  if (event.key !== 'Tab') return;
  const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
  const controls = Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]') ?? []).filter(el => el.getClientRects().length);
  const first = controls[0], last = controls.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && (document.activeElement === first || !dialog?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && (document.activeElement === last || !dialog?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
}
watch(modalOpen, async open => {
  if (open) {
    focusBeforeDialog = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    await nextTick();
    (document.querySelector<HTMLElement>('[role="dialog"] input') ?? document.querySelector<HTMLElement>('[role="dialog"] button'))?.focus();
  } else {
    document.body.style.overflow = '';
    credentials.password = '';
    await nextTick();
    if (focusBeforeDialog?.isConnected) focusBeforeDialog.focus();
  }
});
onMounted(async () => {
  syncRoute();
  window.addEventListener('popstate', syncRoute);
  document.addEventListener('keydown', keyboard);
  loading.value = true;
  try { const current = await api.auth.current({}); if ('username' in current) user.value = current.username; await load(); } catch { note('Could not connect to the app. Please try again.', true); }
  finally { loading.value = false; }
  timer = setInterval(() => {
    if (busy.value || loadPending || document.hidden) return;
    loadPending = true;
    void load().catch(error => { disconnected.value = true; }).finally(() => { loadPending = false; });
  }, 3000);
});
onUnmounted(() => { clearPhoto(); clearInterval(timer); window.removeEventListener('popstate', syncRoute); document.removeEventListener('keydown', keyboard); document.body.style.overflow = ''; });
</script>

<template>
  <header class="nav" :inert="modalOpen">
    <a href="#" class="logo" @click.prevent="navigate('market')">claimed<span>!</span><i class="logo-dot">↗</i></a>
    <nav aria-label="Main navigation"><button :class="{ current: page === 'market' }" @click="navigate('market')">Marketplace</button><button v-if="user" :class="{ current: page === 'activity' }" @click="navigate('activity')">My activity</button></nav>
    <div class="nav-end"><button v-if="!user" class="quiet" @click="auth = true; register = false">Sign in</button><button v-else class="account quiet" @click="signOut" :disabled="busy"><span class="avatar">{{ user[0]?.toUpperCase() }}</span>{{ user }} <small>Sign out</small></button><button class="dark" aria-label="Sell an item" @click="sell">＋ <span>Sell an item</span></button></div>
  </header>
  <main :inert="modalOpen">
    <section v-if="page === 'market'" class="hero">
      <HeroWaves />
      <div class="hero-copy"><span class="eyebrow"><span class="live-dot"></span> MIT SENIOR SALES, SIMPLIFIED</span><h1>Good things.<br><em>Next chapter.</em></h1><p>Find what you need. Pass on what you love.<br>Buy and sell with your MIT community.</p><a class="browse-link" href="#marketplace">Find your next favorite <span aria-hidden="true">↘</span></a></div>
      <div class="hero-guide"><span class="guide-label">A BETTER WAY TO BUY SECONDHAND</span><div><span>01</span><p><strong>Find your next favorite</strong><small>Browse items from people on campus.</small></p></div><div><span>02</span><p><strong>Make it yours</strong><small>Reserve it before you send payment.</small></p></div><div><span>03</span><p><strong>Meet. Pick up. Enjoy.</strong><small>Confirm payment and coordinate pickup.</small></p></div></div>
    </section>
    <section v-if="page !== 'item'" id="marketplace" class="market-section">
      <div class="section-heading"><div><span class="eyebrow">{{ page === 'market' ? 'EXPLORE THE MARKETPLACE' : 'YOUR LITTLE CORNER' }}</span><h2>{{ page === 'market' ? 'Browse listings' : 'My activity' }}<span v-if="page !== 'activity' || tab === 'buying' || tab === 'selling'" class="count">{{ filtered.length }}</span></h2></div><label v-if="page !== 'activity' || tab === 'buying' || tab === 'selling'" class="search"><span>⌕</span><input v-model="search" placeholder="Search items, descriptions…" aria-label="Search listings"></label></div>
      <div v-if="page === 'activity'" class="activity-tabs"><button :aria-pressed="tab === 'buying'" :class="{ chosen: tab === 'buying' }" @click="tab = 'buying'">Buying</button><button :aria-pressed="tab === 'selling'" :class="{ chosen: tab === 'selling' }" @click="tab = 'selling'">Selling</button><button :aria-pressed="tab === 'offers'" :class="{ chosen: tab === 'offers' }" @click="tab = 'offers'">Offers</button><button :aria-pressed="tab === 'messages'" :class="{ chosen: tab === 'messages' }" @click="tab = 'messages'">Messages</button></div>
      <OfferPanel v-if="page === 'activity' && tab === 'offers'" :user="user" :titles="itemTitles" @open="openItem" @changed="load" />
      <MessagesPanel v-if="page === 'activity' && tab === 'messages'" :user="user" :titles="itemTitles" @open="openItem" />
      <template v-if="page !== 'activity' || tab === 'buying' || tab === 'selling'">
      <div class="filter-row"><span class="local-label">{{ page === 'activity' ? tab === 'selling' ? 'Needs confirmation first · Sold last' : 'Active first · Sold last' : 'Newest first' }}</span><button class="filter-toggle" :aria-expanded="filterOpen" aria-controls="market-filters" @click="filterOpen = !filterOpen">Filters <span v-if="filterCount">{{ filterCount }}</span> {{ filterOpen ? '−' : '+' }}</button></div>
      <section v-if="filterOpen" id="market-filters" class="filter-panel" aria-label="Listing filters"><div><TagPicker v-model="selectedTags" :options="allTags" label="Filter by tags" /></div><div class="filter-details"><label>Clothing size<select v-model="selectedSize"><option value="">Any clothing size</option><option v-for="size in sizeOptions" :key="size" :value="size">{{ size }}</option></select></label><label>Availability<select v-model="availability"><option value="all">All items</option><option value="available">Available to claim</option><option value="claimed">Reserved</option><option value="completed">Sold</option></select></label><div class="form-row"><label>Min price ($)<input v-model.number="minPrice" type="number" min="0" placeholder="Any"></label><label>Max price ($)<input v-model.number="maxPrice" type="number" min="0" placeholder="Any"></label></div><button class="quiet" @click="clearFilters">Clear filters</button></div></section>
      <div v-if="selectedTags.length && !filterOpen" class="chosen-tags"><button v-for="tag in selectedTags" :key="tag" class="tag selected-tag" @click="selectedTags = selectedTags.filter(t => t !== tag)">{{ tag }} ×</button></div>
      <p v-if="minPrice !== '' && maxPrice !== '' && minPrice > maxPrice" class="inline-error">Minimum price must be less than maximum price.</p>
      <p v-if="disconnected" class="connection-note" role="status">Connection interrupted. Showing the last saved listings; reconnecting automatically.</p>
      <p v-if="message" class="notice" :class="{ error: failed }" role="status">{{ message }}<button @click="message = ''" aria-label="Dismiss message">×</button></p>
      <div v-if="loading" class="empty" role="status"><span class="empty-symbol">↗</span><h3>Finding your good things…</h3></div>
      <div v-else-if="page === 'activity' && !user" class="empty"><h3>Sign in to see your activity.</h3><p>You can browse the marketplace without an account.</p><button class="dark" @click="auth = true; register = false">Sign in</button></div>
      <div v-else-if="!filtered.length" class="empty"><span class="empty-symbol">✳</span><h3>{{ page === 'activity' ? 'A fresh start.' : search || filterCount ? 'No finds just yet.' : 'Be the first to pass something on.' }}</h3><p>{{ page === 'activity' ? 'Your purchases and listings will appear here.' : search || filterCount ? 'Try another keyword or adjust your filters.' : 'That chair, lamp, or stack of books deserves a next chapter.' }}</p><button v-if="page === 'market' && !search" class="dark" @click="sell">Create a listing ↗</button></div>
      <div v-else class="market-grid"><article v-for="item in filtered" :key="item.listing" class="market-row"><a class="market-card-link" :href="'/items/' + item.listing" @click="followItem($event, item.listing)"><div class="row-photo"><PhotoFrame v-if="imagesOf(item)[0] && !brokenImages.has(imagesOf(item)[0])" :src="imagesOf(item)[0]" :model-value="details(item).imagePositions?.[imagesOf(item)[0]]" :alt="details(item).title" @error="brokenImages.add(imagesOf(item)[0])" /><span v-else>No photo</span></div><div class="row-content"><div class="item-tags"><span v-for="tag in tagsOf(item).slice(0, 3)" :key="tag">{{ tag }}</span></div><h3>{{ details(item).title }}</h3><span v-if="details(item).clothingSize" class="clothing-size-label">Size {{ details(item).clothingSize }}</span><p class="row-description">{{ details(item).description || 'View this item for more details.' }}</p><span class="row-meta">⌖ {{ details(item).pickup }} <span>· Listed by {{ item.seller }}</span></span></div><div class="row-end"><strong>{{ money(details(item).price) }}</strong><span class="item-status" :class="{ sold: status(item) === 'Sold' }">{{ status(item) }}</span><span class="view-item">{{ item.seller === user ? 'Manage item' : item.claim?.status === 'available' ? 'View & reserve' : 'View item' }} <span>→</span></span></div></a><button v-if="item.seller === user && canEditListing(item)" type="button" class="quiet listing-edit" :disabled="busy" @click="editListing(item)">Edit listing</button></article></div>
      </template>
    </section>
    <section v-if="page === 'item'" class="item-page">
      <div class="breadcrumbs"><button @click="navigate('market')">Marketplace</button><span>/</span><span>{{ active ? 'Item details' : 'Item' }}</span></div>
      <div v-if="loading" class="empty" role="status"><h2>Loading item…</h2></div>
      <div v-else-if="!active" class="empty"><h2>This listing could not be found.</h2><p>Browse the marketplace to find another item.</p><button class="dark" @click="navigate('market')">Back to marketplace</button></div>
      <div v-else class="item-layout">
        <div class="item-gallery">
          <ImageCarousel :images="imagesOf(active)" :title="details(active).title" />
          <div class="item-description"><h2>About this item</h2><p>{{ details(active).description || 'The seller has not added a description.' }}</p></div>
        </div>
        <div class="item-summary">
          <div class="item-kicker"><div class="item-tags"><span v-for="tag in tagsOf(active)" :key="tag">{{ tag }}</span></div><span class="item-status" :class="{ sold: active.claim?.status === 'completed' }">{{ status(active) }}</span></div>
          <h1>{{ details(active).title }}</h1><strong class="item-price">{{ money(details(active).price) }}</strong><span v-if="details(active).clothingSize" class="clothing-size-detail">Size: {{ details(active).clothingSize }}</span><span class="price-caption">{{ details(active).obo ? 'Or best offer' : 'Fixed price' }} · Payment arranged directly</span>
          <div v-if="active.claim?.status === 'available' && active.seller !== user" class="reserve-action">
            <button class="dark full" :disabled="busy || active.seller === user" @click="action('claim')">{{ busy ? 'Reserving…' : 'Claim for ' + money(details(active).price) }}</button>
            <p v-if="active.seller === user">You are signed in as the seller. Buyers can reserve this item; you cannot claim your own listing.</p>
            <p v-else>Reserve this item exclusively before paying the seller.</p>
          </div>
          <p v-if="active.seller === user && !canEditListing(active)" class="form-help">Editing is closed because payment has been sent or the item is sold.</p><button v-if="active.seller === user && canEditListing(active)" class="dark listing-edit" :disabled="busy" @click="editListing(active)">Edit listing</button><div class="item-seller"><span class="seller-avatar">{{ active.seller[0]?.toUpperCase() }}</span><div><small>Listed by</small><strong>{{ active.seller }}</strong></div></div>
          <div class="pickup-line"><span>⌖</span><div><small>Pickup location</small><strong>{{ details(active).pickup }}</strong></div></div>
          <ol v-if="active.claim?.status !== 'available'" class="sale-progress" aria-label="Sale progress"><li v-for="(step, index) in steps" :key="step" :class="{ complete: index <= stepIndex(active) }" :aria-current="index === stepIndex(active) ? 'step' : undefined"><span>{{ index < stepIndex(active) ? '✓' : index + 1 }}</span>{{ step }}</li></ol>

          <p v-if="message" :class="failed ? 'inline-error' : 'inline-success'" role="status">{{ message }}</p>
          <PaymentPanel :key="active.listing + user" :listing="active.listing" :user="user" :buyer="active.claim?.claimer ?? ''" :seller="active.seller" :status="active.transaction?.status ?? ''" @changed="load" />
          <button v-if="active.seller === user && active.transaction?.status === 'awaitingConfirmation'" class="dark full" :disabled="busy" @click="action('confirm')">{{ busy ? 'Confirming…' : 'Confirm payment received' }}</button>
          <div v-if="(active.claim?.claimer === user || active.seller === user) && active.transaction?.status === 'awaitingPayment'" class="cancellation"><button v-if="!cancelling" class="cancel-link" :disabled="busy" @click="cancelling = true">Cancel reservation</button><div v-else class="cancel-confirm"><strong>Cancel this reservation?</strong><p>The item will become available again. Only cancel if payment has not been sent.</p><div><button class="quiet" :disabled="busy" @click="cancelling = false">Keep reservation</button><button class="danger" :disabled="busy" @click="action('cancel')">{{ busy ? 'Cancelling…' : 'Yes, cancel' }}</button></div></div></div>
          <p v-if="active.claim?.status === 'completed'" class="sold-note">Sale complete. Ready for its next home. ✓</p>
          <p v-else-if="active.seller === user && active.claim?.status === 'available'" class="form-help">This is your listing. It is live and available to buyers.</p>
          <p v-else-if="active.claim?.status === 'claimed' && active.claim?.claimer !== user && active.seller !== user" class="form-help">Another buyer has reserved this item. Check back in case it becomes available.</p>
          <OfferPanel :key="'offers-' + active.listing + user" :user="user" :listing="active.listing" :seller="active.seller" :available="active.claim?.status === 'available'" :enabled="details(active).obo" @changed="load" />
          <MessagesPanel :key="'messages-' + active.listing + user" :user="user" :listing="active.listing" :seller="active.seller" :titles="itemTitles" />
          <p class="transaction-note">Claimed! reserves items and records payment confirmations. Payments happen directly between buyer and seller.</p>
        </div>
      </div>
    </section>
    <section v-if="page !== 'item'" class="bottom-strip"><span>Good for your room. Better for the planet.</span><p>For the things you love, and the things you’re ready to let go.</p></section>
  </main>
  <footer :inert="modalOpen"><a class="logo" href="#" @click.prevent="navigate('market')">claimed<span>!</span></a><span>The marketplace for MIT senior sales.</span><span>Built for the MIT community.</span></footer>

  <div v-if="auth" class="overlay" @pointerdown="backdropDown" @click="backdropClick"><section class="dialog auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button class="close" @click="closeDialog" :disabled="busy" aria-label="Close">×</button><span class="eyebrow">CLAIMED! · MIT MARKETPLACE</span><h2 id="auth-title">{{ register ? 'Join the marketplace.' : 'Welcome back.' }}</h2><p>{{ page === 'item' ? 'Sign in to reserve this item. You can keep browsing without an account.' : 'One community. Plenty of good finds.' }}</p><form @submit.prevent="signIn"><label>Username<input v-model="credentials.username" required minlength="3" maxlength="32" autocomplete="username" autofocus></label><label>Password<input v-model="credentials.password" type="password" required minlength="8" maxlength="128" :autocomplete="register ? 'new-password' : 'current-password'"></label><p v-if="message && failed" class="inline-error" role="alert">{{ message }}</p><button class="dark full" :disabled="busy">{{ busy ? 'Just a moment…' : register ? 'Create account ↗' : 'Sign in ↗' }}</button></form><button class="switch" @click="register = !register; message = ''">{{ register ? 'Already part of the community? Sign in' : 'New here? Create an account' }}</button></section></div>
  <div v-if="publish" class="overlay" @pointerdown="backdropDown" @click="backdropClick"><section class="dialog sell-dialog" role="dialog" aria-modal="true" aria-labelledby="sell-title"><button class="close" @click="closeDialog" :disabled="busy" aria-label="Close">×</button><span class="eyebrow">{{ editing ? 'EDIT LISTING' : 'CREATE A LISTING' }}</span><h2 id="sell-title">{{ editing ? 'Edit your listing.' : 'Sell something great.' }}</h2><p>Tell the community a little about your item.</p><form @submit.prevent="createListing"><label>Item name<input v-model="draft.title" required maxlength="100" placeholder="e.g. Your favorite reading chair"></label><label>Price ($)<input v-model.number="draft.price" type="number" required min="0" max="100000" step="0.01"></label><label><span><input v-model="draft.obo" type="checkbox"> Allow offers (OBO)</span></label><label><span><input v-model="draft.requireProof" type="checkbox"> Require a payment screenshot</span></label><p v-if="editing" class="form-help">Reserved items keep their agreed terms. Editing closes once payment is sent or the item is sold.</p><TagPicker v-model="draft.tags" :options="allTags" allow-create label="Tags" /><label>Clothing size <small>Optional · for clothing and shoes</small><input v-model="draft.clothingSize" list="clothing-sizes" maxlength="24" placeholder="e.g. M, US 8, EU 40"><datalist id="clothing-sizes"><option v-for="size in sizeOptions" :key="size" :value="size"></option></datalist></label><label>Description<textarea v-model="draft.description" maxlength="2000" rows="3" placeholder="Condition, dimensions, and what makes it great"></textarea></label><div class="photo-field"><span class="photo-label">Item photos <small>Optional · {{ photos.length }}/5</small></span><div v-if="photos.length" class="upload-photo-grid"><div v-for="(photo, n) in photos" :key="photo.id" class="upload-photo"><PhotoFrame :src="photo.preview" :alt="'Selected photo ' + (n + 1)" :model-value="photo" editable :disabled="busy" @update:model-value="value => { photo.x = value.x; photo.y = value.y; photo.zoom = value.zoom ?? 1; }" /><span v-if="n === 0" class="cover-label">Cover</span><button type="button" :aria-label="'Remove photo ' + (n + 1)" :disabled="busy" @click="removePhoto(photo.id)">×</button><small>{{ photo.file?.name || 'Saved photo' }}</small></div></div><label v-if="photos.length < 5" class="photo-picker"><span>＋ Add photos</span><small>Up to 5 photos · JPEG, PNG, or WebP · 5 MB each</small><input type="file" multiple accept="image/jpeg,image/png,image/webp" aria-label="Upload item photos" :disabled="busy" @change="choosePhoto"></label></div><div class="form-row"><label>Pickup location<input v-model="draft.pickup" required maxlength="200" placeholder="e.g. Maseeh Hall"></label><label>Payment instructions<input v-model="draft.payment" required maxlength="200" placeholder="e.g. Venmo @your-handle"></label></div><p class="form-help">Payment happens directly between buyer and seller. Claimed! records your confirmations.</p><p v-if="message && failed" class="inline-error" role="alert">{{ message }}</p><button class="dark full" :disabled="busy">{{ busy ? 'Saving…' : editing ? 'Save changes' : 'Publish listing ↗' }}</button></form></section></div>

</template>
