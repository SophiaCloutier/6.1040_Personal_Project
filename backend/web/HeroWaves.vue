<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

const scene = ref<HTMLElement | null>(null);
let frame = 0;
let motion: MediaQueryList | undefined;
function updatePerspective() {
  frame = 0;
  const element = scene.value;
  if (!element) return;
  const hero = element.parentElement!;
  const progress = motion?.matches ? 0 : Math.max(-1, Math.min(1, -hero.getBoundingClientRect().top / hero.offsetHeight));
  element.style.setProperty('--wave-rise', `${progress * 95}px`);
  element.style.setProperty('--wave-tilt', `${progress * 12}deg`);
  element.style.setProperty('--wave-turn', `${progress * -5}deg`);
}
function queuePerspective() {
  if (!frame) frame = requestAnimationFrame(updatePerspective);
}
onMounted(() => {
  motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  motion.addEventListener('change', queuePerspective);
  window.addEventListener('scroll', queuePerspective, { passive: true });
  window.addEventListener('resize', queuePerspective);
  updatePerspective();
});
onUnmounted(() => {
  cancelAnimationFrame(frame);
  motion?.removeEventListener('change', queuePerspective);
  window.removeEventListener('scroll', queuePerspective);
  window.removeEventListener('resize', queuePerspective);
});
// Nested strokes make continuous, organic ribbons without image downloads.
const ribbons = [
  { color: '#f4ad61', width: 266 },
  { color: '#ffe8b9', width: 238 },
  { color: '#ed805c', width: 190 },
  { color: '#f5bdc4', width: 178 },
  { color: '#f5cd63', width: 120 },
  { color: '#ed956f', width: 78 },
  { color: '#f6e5b7', width: 10 },
];
</script>

<template>
  <div ref="scene" class="hero-waves" aria-hidden="true">
    <div class="wave-perspective">
    <svg viewBox="0 0 1440 600" preserveAspectRatio="xMidYMid slice" focusable="false">
      <g class="ribbon ribbon-left" fill="none" stroke-linecap="round">
        <path v-for="ribbon in ribbons" :key="ribbon.color" :stroke="ribbon.color" :stroke-width="ribbon.width"
          d="M -180 -160 C 360 -140, 290 60, 120 120 S -90 300, 140 360 S 420 540, 160 760" />
      </g>
      <g class="ribbon ribbon-right" fill="none" stroke-linecap="round">
        <path v-for="ribbon in ribbons" :key="ribbon.color" :stroke="ribbon.color" :stroke-width="ribbon.width"
          d="M 900 -200 C 730 80, 1330 -30, 1160 180 S 880 330, 1130 440 S 1490 450, 1440 800" />
      </g>
      <g class="wave-sparkles" fill="#fff3d9">
        <path d="M 790 62 Q 794 91 818 95 Q 794 99 790 128 Q 786 99 762 95 Q 786 91 790 62 Z" />
        <path d="M 1370 285 Q 1375 318 1402 322 Q 1375 326 1370 359 Q 1365 326 1338 322 Q 1365 318 1370 285 Z" />
        <path d="M 760 430 Q 764 452 784 456 Q 764 460 760 482 Q 756 460 736 456 Q 756 452 760 430 Z" />
        <circle cx="840" cy="155" r="5" /><circle cx="1290" cy="510" r="6" />
      </g>
    </svg>
    </div>
  </div>
</template>

<style scoped>
.hero-waves {
  position: absolute;
  top: -45px;
  bottom: -340px;
  left: calc(50% - 50vw);
  width: 100vw;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background: #f9dec2;
  perspective: 1000px;
  mask-image: linear-gradient(to bottom, transparent, #000 8%, #000 48%, transparent 100%);
}
.wave-perspective {
  position: absolute;
  inset: -70px;
  transform: translateY(var(--wave-rise, 0px)) rotateX(var(--wave-tilt, 0deg)) rotateZ(var(--wave-turn, 0deg)) scale(1.12);
  transform-origin: 50% 25%;
  will-change: transform;
}
.hero-waves svg { display: block; width: 100%; height: 100%; }
.ribbon { transform-box: fill-box; transform-origin: center; }
.ribbon-left { animation: ribbon-drift 10s ease-in-out infinite alternate; }
.ribbon-right { animation: ribbon-drift 13s ease-in-out -6s infinite alternate-reverse; }
.wave-sparkles { animation: sparkle-breathe 7s ease-in-out infinite alternate; }
@keyframes ribbon-drift {
  from { transform: translate(-45px, -35px) rotate(-7deg) scale(1.04); }
  to { transform: translate(45px, 40px) rotate(7deg) scale(1.12); }
}
@keyframes sparkle-breathe { from { opacity: .55; } to { opacity: 1; } }
@media (max-width: 700px) {
  .hero-waves svg { width: 180%; max-width: none; margin-left: -45%; }
}
@media (prefers-reduced-motion: reduce) {
  .ribbon, .wave-sparkles { animation: none; }
  .wave-perspective { transform: none; will-change: auto; }
}
</style>
