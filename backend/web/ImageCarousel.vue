<script setup lang="ts">
import { computed, ref, watch } from 'vue';
const props = defineProps<{ images: string[]; title: string }>();
const index = ref(0);
const failed = ref(new Set<string>());
const current = computed(() => props.images[index.value]);
watch(() => props.images.join('|'), () => { index.value = 0; failed.value.clear(); });
function move(direction: number) { if (props.images.length) index.value = (index.value + direction + props.images.length) % props.images.length; }
let touchStart = 0;
function swipe(event: TouchEvent) { const distance = event.changedTouches[0].clientX - touchStart; if (Math.abs(distance) > 40 && props.images.length > 1) move(distance < 0 ? 1 : -1); }
</script>
<template>
  <section class="image-carousel" aria-label="Item photos" @keydown.left.prevent="move(-1)" @keydown.right.prevent="move(1)">
    <div class="item-photo" @touchstart.passive="touchStart = $event.touches[0].clientX" @touchend.passive="swipe">
      <img v-if="current && !failed.has(current)" :src="current" :alt="title + ', photo ' + (index + 1)" @error="failed.add(current)">
      <div v-else class="photo-placeholder"><span>◇</span><p>{{ current ? 'Photo unavailable' : 'No photo added' }}</p></div>
      <template v-if="images.length > 1"><button type="button" class="carousel-arrow previous" aria-label="Previous photo" @click="move(-1)">‹</button><button type="button" class="carousel-arrow next" aria-label="Next photo" @click="move(1)">›</button><span class="photo-counter" aria-live="polite">{{ index + 1 }} / {{ images.length }}</span></template>
    </div>
    <div v-if="images.length > 1" class="photo-thumbnails" aria-label="Choose a photo"><button v-for="(image, n) in images" :key="image + n" type="button" :aria-label="'Show photo ' + (n + 1)" :aria-pressed="index === n" :class="{ active: index === n }" @click="index = n"><img v-if="!failed.has(image)" :src="image" alt="" @error="failed.add(image)"><span v-else>{{ n + 1 }}</span></button></div>
  </section>
</template>
