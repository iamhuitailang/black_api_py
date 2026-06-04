<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      'pixel-btn',
      `pixel-btn--${variant}`,
      `pixel-btn--${size}`,
      {
        'pixel-btn--disabled': disabled,
        'pixel-btn--block': block,
      },
    ]"
    @click="handleClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <span class="pixel-btn__content">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
  disabled: false,
  block: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const isHovered = ref(false)

const buttonClasses = computed(() => ({
  'pixel-btn': true,
  [`pixel-btn--${props.variant}`]: true,
  [`pixel-btn--${props.size}`]: true,
  'pixel-btn--disabled': props.disabled,
  'pixel-btn--block': props.block,
  'pixel-btn--hover': isHovered.value,
}))

function handleClick(event: MouseEvent) {
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>

<style scoped>
.pixel-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: 'Press Start 2P', monospace;
  font-weight: normal;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  border: none;
  background: none;
  transition: all 0.1s ease;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

.pixel-btn__content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.pixel-btn--sm {
  font-size: 8px;
  padding: 6px 12px;
}

.pixel-btn--md {
  font-size: 10px;
  padding: 10px 20px;
}

.pixel-btn--lg {
  font-size: 12px;
  padding: 14px 28px;
}

.pixel-btn--block {
  width: 100%;
}

.pixel-btn--primary {
  color: #fff;
  background: #4a90d9;
  box-shadow:
    4px 4px 0 0 #2c5aa0,
    inset -2px -2px 0 0 #2c5aa0,
    inset 2px 2px 0 0 #7ab8ff;
}

.pixel-btn--primary:hover:not(.pixel-btn--disabled) {
  background: #5aa0e9;
  transform: translate(-2px, -2px);
  box-shadow:
    6px 6px 0 0 #2c5aa0,
    inset -2px -2px 0 0 #2c5aa0,
    inset 2px 2px 0 0 #7ab8ff;
}

.pixel-btn--primary:active:not(.pixel-btn--disabled) {
  transform: translate(2px, 2px);
  box-shadow:
    2px 2px 0 0 #2c5aa0,
    inset -2px -2px 0 0 #2c5aa0,
    inset 2px 2px 0 0 #7ab8ff;
}

.pixel-btn--secondary {
  color: #fff;
  background: #6b7280;
  box-shadow:
    4px 4px 0 0 #374151,
    inset -2px -2px 0 0 #374151,
    inset 2px 2px 0 0 #9ca3af;
}

.pixel-btn--secondary:hover:not(.pixel-btn--disabled) {
  background: #7b8290;
  transform: translate(-2px, -2px);
  box-shadow:
    6px 6px 0 0 #374151,
    inset -2px -2px 0 0 #374151,
    inset 2px 2px 0 0 #9ca3af;
}

.pixel-btn--secondary:active:not(.pixel-btn--disabled) {
  transform: translate(2px, 2px);
  box-shadow:
    2px 2px 0 0 #374151,
    inset -2px -2px 0 0 #374151,
    inset 2px 2px 0 0 #9ca3af;
}

.pixel-btn--danger {
  color: #fff;
  background: #dc2626;
  box-shadow:
    4px 4px 0 0 #991b1b,
    inset -2px -2px 0 0 #991b1b,
    inset 2px 2px 0 0 #f87171;
}

.pixel-btn--danger:hover:not(.pixel-btn--disabled) {
  background: #ec3636;
  transform: translate(-2px, -2px);
  box-shadow:
    6px 6px 0 0 #991b1b,
    inset -2px -2px 0 0 #991b1b,
    inset 2px 2px 0 0 #f87171;
}

.pixel-btn--danger:active:not(.pixel-btn--disabled) {
  transform: translate(2px, 2px);
  box-shadow:
    2px 2px 0 0 #991b1b,
    inset -2px -2px 0 0 #991b1b,
    inset 2px 2px 0 0 #f87171;
}

.pixel-btn--success {
  color: #fff;
  background: #16a34a;
  box-shadow:
    4px 4px 0 0 #166534,
    inset -2px -2px 0 0 #166534,
    inset 2px 2px 0 0 #4ade80;
}

.pixel-btn--success:hover:not(.pixel-btn--disabled) {
  background: #26b35a;
  transform: translate(-2px, -2px);
  box-shadow:
    6px 6px 0 0 #166534,
    inset -2px -2px 0 0 #166534,
    inset 2px 2px 0 0 #4ade80;
}

.pixel-btn--success:active:not(.pixel-btn--disabled) {
  transform: translate(2px, 2px);
  box-shadow:
    2px 2px 0 0 #166534,
    inset -2px -2px 0 0 #166534,
    inset 2px 2px 0 0 #4ade80;
}

.pixel-btn--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(30%);
}
</style>
