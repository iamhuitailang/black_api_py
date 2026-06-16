<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  current: number
  max: number
  label?: string
  showText?: boolean
}>()

const percentage = computed(() => {
  if (props.max <= 0) return 0
  return Math.max(0, Math.min(100, (props.current / props.max) * 100))
})

const displayText = computed(() => {
  return `${Math.max(0, props.current)} / ${props.max}`
})
</script>

<template>
  <div class="w-full">
    <div v-if="label" class="flex justify-between text-xs mb-1">
      <span class="text-ink-200 font-song">{{ label }}</span>
      <span v-if="showText" class="text-ink-100 font-mono">{{ displayText }}</span>
    </div>
    <div class="bar-bg h-3 rounded-sm overflow-hidden relative">
      <div
        class="qi-bar h-full transition-all duration-500 ease-out relative"
        :style="{ width: percentage + '%' }"
      >
        <div class="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
      </div>
      <div class="absolute inset-0 flex items-center justify-center">
        <span v-if="showText || !label" class="text-[10px] text-white font-mono drop-shadow-lg">{{ displayText }}</span>
      </div>
    </div>
  </div>
</template>
