<template>
  <div
    :class="[
      'pixel-card',
      `pixel-card--${variant}`,
      `pixel-card--${size}`,
      {
        'pixel-card--hoverable': hoverable,
        'pixel-card--active': isActive,
      },
    ]"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div v-if="$slots.header" class="pixel-card__header">
      <slot name="header" />
    </div>
    <div class="pixel-card__body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="pixel-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  variant?: 'default' | 'forest' | 'volcano' | 'ice' | 'space'
  size?: 'sm' | 'md' | 'lg'
  hoverable?: boolean
  active?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
  hoverable: false,
  active: false,
})

const isHovered = ref(false)

const isActive = computed(() => props.active || isHovered.value)
</script>

<style scoped>
.pixel-card {
  position: relative;
  background: #1a1a2e;
  color: #fff;
  font-family: 'Press Start 2P', monospace;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  transition: all 0.2s ease;
}

.pixel-card--sm {
  padding: 12px;
}

.pixel-card--md {
  padding: 20px;
}

.pixel-card--lg {
  padding: 28px;
}

.pixel-card--default {
  background: #1a1a2e;
  border: 4px solid #3d3d5c;
  box-shadow:
    6px 6px 0 0 #0f0f1a,
    inset -2px -2px 0 0 #2a2a40,
    inset 2px 2px 0 0 #4d4d7a;
}

.pixel-card--forest {
  background: #0d2818;
  border: 4px solid #2d5a3d;
  box-shadow:
    6px 6px 0 0 #06140c,
    inset -2px -2px 0 0 #1a3d28,
    inset 2px 2px 0 0 #4a8a5a;
}

.pixel-card--volcano {
  background: #2a0d0d;
  border: 4px solid #8b2500;
  box-shadow:
    6px 6px 0 0 #140606,
    inset -2px -2px 0 0 #5a1a00,
    inset 2px 2px 0 0 #c44500;
}

.pixel-card--ice {
  background: #0d1a2d;
  border: 4px solid #2a5a8a;
  box-shadow:
    6px 6px 0 0 #060d14,
    inset -2px -2px 0 0 #1a3d5a,
    inset 2px 2px 0 0 #5aa0d9;
}

.pixel-card--space {
  background: #1a0d2a;
  border: 4px solid #5a2a8a;
  box-shadow:
    6px 6px 0 0 #0d0614,
    inset -2px -2px 0 0 #3d1a5a,
    inset 2px 2px 0 0 #8a5ac4;
}

.pixel-card--hoverable:hover {
  transform: translate(-4px, -4px);
}

.pixel-card--default.pixel-card--hoverable:hover {
  box-shadow:
    10px 10px 0 0 #0f0f1a,
    inset -2px -2px 0 0 #2a2a40,
    inset 2px 2px 0 0 #4d4d7a;
}

.pixel-card--forest.pixel-card--hoverable:hover {
  box-shadow:
    10px 10px 0 0 #06140c,
    inset -2px -2px 0 0 #1a3d28,
    inset 2px 2px 0 0 #4a8a5a;
}

.pixel-card--volcano.pixel-card--hoverable:hover {
  box-shadow:
    10px 10px 0 0 #140606,
    inset -2px -2px 0 0 #5a1a00,
    inset 2px 2px 0 0 #c44500;
}

.pixel-card--ice.pixel-card--hoverable:hover {
  box-shadow:
    10px 10px 0 0 #060d14,
    inset -2px -2px 0 0 #1a3d5a,
    inset 2px 2px 0 0 #5aa0d9;
}

.pixel-card--space.pixel-card--hoverable:hover {
  box-shadow:
    10px 10px 0 0 #0d0614,
    inset -2px -2px 0 0 #3d1a5a,
    inset 2px 2px 0 0 #8a5ac4;
}

.pixel-card--active {
  transform: translate(2px, 2px);
}

.pixel-card--default.pixel-card--active {
  box-shadow:
    4px 4px 0 0 #0f0f1a,
    inset -2px -2px 0 0 #2a2a40,
    inset 2px 2px 0 0 #4d4d7a;
}

.pixel-card__header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid;
}

.pixel-card--default .pixel-card__header {
  border-bottom-color: #3d3d5c;
}

.pixel-card--forest .pixel-card__header {
  border-bottom-color: #2d5a3d;
}

.pixel-card--volcano .pixel-card__header {
  border-bottom-color: #8b2500;
}

.pixel-card--ice .pixel-card__header {
  border-bottom-color: #2a5a8a;
}

.pixel-card--space .pixel-card__header {
  border-bottom-color: #5a2a8a;
}

.pixel-card__body {
  font-size: 10px;
  line-height: 1.8;
}

.pixel-card__footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 2px solid;
}

.pixel-card--default .pixel-card__footer {
  border-top-color: #3d3d5c;
}

.pixel-card--forest .pixel-card__footer {
  border-top-color: #2d5a3d;
}

.pixel-card--volcano .pixel-card__footer {
  border-top-color: #8b2500;
}

.pixel-card--ice .pixel-card__footer {
  border-top-color: #2a5a8a;
}

.pixel-card--space .pixel-card__footer {
  border-top-color: #5a2a8a;
}
</style>
