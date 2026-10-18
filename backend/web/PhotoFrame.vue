<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { clamp, panPhoto, zoomPhoto, type PhotoPosition } from '../shared/photo-framing';
const props = withDefaults(defineProps<{ src: string; alt: string; modelValue?: PhotoPosition; editable?: boolean; viewer?: boolean; disabled?: boolean }>(), { editable: false, viewer: false, disabled: false });
const emit = defineEmits<{ 'update:modelValue': [position: PhotoPosition]; error: [] }>();
const interactive = computed(() => props.editable || props.viewer);
const frame = ref<HTMLElement | null>(null), width = ref(0), height = ref(0), naturalWidth = ref(0), naturalHeight = ref(0), dragging = ref(false);
const position = computed(() => ({ x: props.modelValue?.x ?? 50, y: props.modelValue?.y ?? 50, zoom: props.modelValue?.zoom ?? 1 }));
const dimensions = computed(() => {
  const scale = Math.max(width.value / (naturalWidth.value || 1), height.value / (naturalHeight.value || 1)) * position.value.zoom;
  return { width: naturalWidth.value * scale, height: naturalHeight.value * scale };
});
const minimumZoom = computed(() => props.viewer && naturalWidth.value && naturalHeight.value && width.value && height.value ? Math.min(width.value / naturalWidth.value, height.value / naturalHeight.value) / Math.max(width.value / naturalWidth.value, height.value / naturalHeight.value) : 1);
const style = computed(() => ({ width: dimensions.value.width + 'px', height: dimensions.value.height + 'px', left: (dimensions.value.width > width.value ? -(dimensions.value.width - width.value) * position.value.x / 100 : (width.value - dimensions.value.width) / 2) + 'px', top: (dimensions.value.height > height.value ? -(dimensions.value.height - height.value) * position.value.y / 100 : (height.value - dimensions.value.height) / 2) + 'px', opacity: naturalWidth.value ? 1 : 0 }));
function loaded(event: Event) { const image = event.target as HTMLImageElement; naturalWidth.value = image.naturalWidth; naturalHeight.value = image.naturalHeight; }
function update(value: PhotoPosition) { if (!props.disabled) emit('update:modelValue', value); }
function zoom(factor: number) { update(zoomPhoto(position.value, factor, minimumZoom.value)); }
function reset() { update({ x: 50, y: 50, zoom: minimumZoom.value }); }
const pointers = new Map<number, { x: number; y: number }>();
let last = { x: 0, y: 0, distance: 0 };
function gesture() {
  const points = [...pointers.values()], a = points[0]!, b = points[1] ?? a;
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, distance: Math.hypot(a.x - b.x, a.y - b.y) };
}
function down(event: PointerEvent) {
  if (!interactive.value || props.disabled || (event.pointerType === 'mouse' && event.button !== 0)) return;
  event.preventDefault(); frame.value?.focus(); frame.value?.setPointerCapture(event.pointerId);
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY }); last = gesture(); dragging.value = true;
}
function move(event: PointerEvent) {
  if (!pointers.has(event.pointerId) || props.disabled) return;
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY }); const next = gesture();
  let value = panPhoto(position.value, next.x - last.x, next.y - last.y, dimensions.value.width - width.value, dimensions.value.height - height.value);
  if (next.distance && last.distance) value = zoomPhoto(value, next.distance / last.distance, minimumZoom.value);
  update(value); last = next;
}
function up(event: PointerEvent) {
  pointers.delete(event.pointerId); if (pointers.size) last = gesture(); else dragging.value = false;
  if (frame.value?.hasPointerCapture(event.pointerId)) frame.value.releasePointerCapture(event.pointerId);
}
function wheel(event: WheelEvent) {
  if (!interactive.value || props.disabled) return;
  event.preventDefault(); zoom(Math.exp(-clamp(event.deltaY, -100, 100) / 500));
}
function keyboard(event: KeyboardEvent) {
  if (!interactive.value || props.disabled) return;
  const p = position.value;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    event.preventDefault(); event.stopPropagation(); const step = event.shiftKey ? 10 : 2;
    update({ ...p, x: clamp(p.x + (event.key === 'ArrowLeft' ? step : event.key === 'ArrowRight' ? -step : 0), 0, 100), y: clamp(p.y + (event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0), 0, 100) });
  } else if (['+', '=', '-'].includes(event.key)) { event.preventDefault(); event.stopPropagation(); zoom(event.key === '-' ? 1 / 1.15 : 1.15); }
  else if (event.key === 'Home') { event.preventDefault(); event.stopPropagation(); reset(); }
}
let observer: ResizeObserver;
onMounted(() => { observer = new ResizeObserver(entries => { const rect = entries[0]?.contentRect; if (rect) { width.value = rect.width; height.value = rect.height; } }); if (frame.value) observer.observe(frame.value); });
onUnmounted(() => { observer?.disconnect(); pointers.clear(); });
watch(() => props.src, () => { naturalWidth.value = 0; naturalHeight.value = 0; pointers.clear(); dragging.value = false; });
</script>
<template>
  <div class="photo-framing" :class="{ 'photo-framing-editor': editable, 'photo-framing-viewer': viewer }">
    <div ref="frame" class="photo-frame" :class="{ dragging, editable: interactive }" :tabindex="interactive && !disabled ? 0 : undefined" :role="interactive ? 'group' : undefined" :aria-label="interactive ? (viewer ? 'Explore ' : 'Reposition ') + alt + ': drag to move, scroll or use plus and minus to zoom. Arrow keys move; Home resets.' : undefined" @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up" @lostpointercapture="up" @wheel="wheel" @keydown="keyboard">
      <img :src="src" :alt="alt" :style="style" draggable="false" @load="loaded" @error="emit('error')">
    </div>
    <template v-if="interactive"><div class="photo-zoom-controls"><button type="button" aria-label="Zoom out" :disabled="disabled || position.zoom <= minimumZoom + 0.0001" @click="zoom(1 / 1.15)">−</button><span aria-live="polite">{{ Math.round(position.zoom * 100) }}%</span><button type="button" aria-label="Zoom in" :disabled="disabled || position.zoom >= 4" @click="zoom(1.15)">＋</button><button type="button" :disabled="disabled" @click="reset">{{ viewer ? 'Fit image' : 'Reset' }}</button></div><small class="photo-drag-hint">Drag to position · Scroll or pinch to zoom</small></template>
  </div>
</template>
