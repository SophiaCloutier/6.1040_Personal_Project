<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import PhotoFrame from './PhotoFrame.vue';
import type { PhotoPosition } from '../shared/photo-framing';
const props = defineProps<{ images: string[]; title: string }>();
const index = ref(0);
const framing = ref<Record<string, PhotoPosition>>({});
const failed = ref(new Set<string>());
const current = computed(() => props.images[index.value]);
watch(() => props.images.join('|'), () => { index.value = 0; failed.value.clear(); });
function move(direction: number) { if (props.images.length) index.value = (index.value + direction + props.images.length) % props.images.length; }
</script>
<template>
  <section class="image-carousel" aria-label="Item photos" @keydown.left.prevent="move(-1)" @keydown.right.prevent="move(1)">
    <div class="item-photo">
      <PhotoFrame v-if="current && !failed.has(current)" :key="current" :src="current" :alt="title + ', photo ' + (index + 1)" :model-value="framing[current]" viewer @update:model-value="value => { if (current) framing[current] = value; }" @error="failed.add(current)" />
      <div v-else class="photo-placeholder"><span>◇</span><p>{{ current ? 'Photo unavailable' : 'No photo added' }}</p></div>
      <template v-if="images.length > 1"><button type="button" class="carousel-arrow previous" aria-label="Previous photo" @click="move(-1)">‹</button><button type="button" class="carousel-arrow next" aria-label="Next photo" @click="move(1)">›</button><span class="photo-counter" aria-live="polite">{{ index + 1 }} / {{ images.length }}</span></template>
    </div>
    <div v-if="images.length > 1" class="photo-thumbnails" aria-label="Choose a photo"><button v-for="(image, n) in images" :key="image + n" type="button" :aria-label="'Show photo ' + (n + 1)" :aria-pressed="index === n" :class="{ active: index === n }" @click="index = n"><img v-if="!failed.has(image)" :src="image" alt="" @error="failed.add(image)"><span v-else>{{ n + 1 }}</span></button></div>
  </section>
</template>
