<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { api, checked, errorText, fileData } from './api';
const props = defineProps<{ listing: string; user: string; buyer: string; seller: string; status: string }>();
const emit = defineEmits<{ changed: [] }>();
const terms = ref<{ price?: number; payment?: string; requireProof?: boolean }>({}), evidence = ref(''), file = ref<File | null>(null), busy = ref(false), error = ref(''), rejecting = ref(false);
let version = 0;
const participant = computed(() => !!props.user && (props.user === props.buyer || props.user === props.seller));
watch(() => [props.listing, props.user, props.status], async () => {
  const current = ++version; terms.value = {}; evidence.value = ''; file.value = null; error.value = '';
  if (!participant.value || !props.status) return;
  try { const result = checked(await api.marketplace.payment({ listing: props.listing }));
    if (current !== version || !('transaction' in result)) return;
    terms.value = JSON.parse(result.transaction.payment.terms === '{}' ? result.transaction.payment.details ?? '{}' : result.transaction.payment.terms ?? '{}'); evidence.value = result.transaction.payment.evidence ?? '';
  } catch (e) { if (current === version) error.value = errorText(e); }
}, { immediate: true });
function choose(event: Event) {
  const input = event.target as HTMLInputElement, selected = input.files?.[0]; input.value = '';
  if (!selected) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type) || selected.size > 5 * 1024 * 1024) { error.value = 'Choose a JPEG, PNG, or WebP up to 5 MB.'; return; }
  file.value = selected; error.value = '';
}
async function report() {
  if (busy.value) return; busy.value = true; error.value = '';
  try { checked(await api.marketplace['report-evidence']({ listing: props.listing, data: file.value ? await fileData(file.value) : '', mime: file.value?.type ?? '' })); emit('changed'); }
  catch (e) { error.value = errorText(e); } finally { busy.value = false; }
}
async function rejectPayment(decision: 'retry' | 'relist') {
  if (busy.value) return; busy.value = true; error.value = '';
  try { checked(await api.marketplace['reject-payment']({ listing: props.listing, decision })); rejecting.value = false; emit('changed'); }
  catch (e) { error.value = errorText(e); } finally { busy.value = false; }
}

</script>
<template>
  <section v-if="participant && status" class="payment-box" aria-label="Payment details">
    <strong v-if="terms.price !== undefined">Agreed price: {{ new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(terms.price) }}</strong>
    <p v-if="terms.payment">{{ terms.payment }}</p>
    <p v-if="(status === 'awaitingPayment' || status === 'paymentRejected')">Pay using the agreed instructions. Listing edits do not change this reservation.</p>
    <form v-if="user === buyer && (status === 'awaitingPayment' || status === 'paymentRejected')" @submit.prevent="report">
      <label>Payment screenshot {{ terms.requireProof ? '(required)' : '(optional)' }}<input type="file" accept="image/jpeg,image/png,image/webp" :disabled="busy" @change="choose"></label>
      <p class="form-help">Visible only to you and the seller. Crop out unrelated balances and transactions before uploading. A screenshot does not verify payment.</p>
      <p v-if="file">{{ file.name }} <button type="button" class="quiet" :disabled="busy" @click="file = null">Remove</button></p>
      <button class="dark full" :disabled="busy || (terms.requireProof && !file)">{{ busy ? 'Reporting payment…' : 'I have paid' }}</button>
    </form>
    <p v-if="status === 'awaitingConfirmation'">Payment reported. The seller must check receipt before confirming.</p>
    <p v-if="status === 'paymentRejected'" role="status">The seller reported that payment was not received. Your reservation is still held. Check the payment details with the seller, then report payment again with a new screenshot if required.</p>
    <div v-if="user === seller && status === 'awaitingConfirmation'" class="cancellation">
      <button v-if="!rejecting" class="cancel-link" :disabled="busy" @click="rejecting = true">Payment not received</button>
      <div v-else class="cancel-confirm">
        <strong>Reject this payment report?</strong>
        <p>Return it to the buyer to correct payment while keeping their reservation, or release the item for another buyer.</p>
        <button class="quiet" :disabled="busy" @click="rejecting = false">Keep reviewing</button>
        <button class="dark full" :disabled="busy" @click="rejectPayment('retry')">Reject and return to buyer</button>
        <button class="danger full" :disabled="busy" @click="rejectPayment('relist')">Reject and make available again</button>
      </div>
    </div>
    <details v-if="evidence"><summary>View payment screenshot</summary><img :src="evidence" alt="Buyer-provided payment screenshot" style="max-width:100%;max-height:500px;object-fit:contain"></details>
    <p v-if="error" class="inline-error" role="alert">{{ error }}</p>
  </section>
</template>
