<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import type { SciFiPanelBorderColor } from '@/config/types'

interface Props {
  title?: string
  borderColor?: SciFiPanelBorderColor
  floating?: boolean
  glowing?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  borderColor: 'blue',
  floating: false,
  glowing: false,
  class: ''
})

const borderClasses = computed(() => {
  const colors: Record<SciFiPanelBorderColor, string> = {
    blue: 'border-tech/50 hover:border-tech',
    red: 'border-mars/50 hover:border-mars',
    orange: 'border-warning/50 hover:border-warning',
    green: 'border-green-500/50 hover:border-green-500',
    purple: 'border-purple-500/50 hover:border-purple-500'
  }
  return colors[props.borderColor]
})

const glowClasses = computed(() => {
  if (!props.glowing) return ''
  const glows: Record<SciFiPanelBorderColor, string> = {
    blue: 'shadow-neon-blue',
    red: 'shadow-neon-red',
    orange: 'shadow-neon-orange',
    green: 'shadow-neon-green',
    purple: 'shadow-neon-purple'
  }
  return glows[props.borderColor]
})
</script>

<template>
  <div
    :class="cn(
      'relative rounded-lg border bg-space-700/80 backdrop-blur-md transition-all duration-300',
      'shadow-glass',
      borderClasses,
      floating && 'animate-float',
      glowing && glowClasses,
      props.class
    )"
  >
    <div class="absolute inset-0 rounded-lg bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    
    <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-tech/50 to-transparent" />
    <div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-tech/30 to-transparent" />
    <div class="absolute top-0 bottom-0 left-0 w-px bg-gradient-to-b from-transparent via-tech/30 to-transparent" />
    <div class="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-transparent via-tech/50 to-transparent" />

    <header v-if="title || $slots.header" class="relative px-4 py-3 border-b border-tech/20">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-1 h-4 bg-tech rounded-full" />
          <slot name="header">
            <h3 class="text-sm font-semibold text-tech tracking-wider uppercase">{{ title }}</h3>
          </slot>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-2 h-2 rounded-full bg-tech/60 animate-pulse" />
          <div class="w-2 h-2 rounded-full bg-mars/60 animate-pulse" style="animation-delay: 0.3s" />
          <div class="w-2 h-2 rounded-full bg-warning/60 animate-pulse" style="animation-delay: 0.6s" />
        </div>
      </div>
      <div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-tech/50 via-transparent to-tech/50" />
    </header>

    <div class="relative p-4">
      <slot />
    </div>

    <div class="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-tech/40" />
    <div class="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-tech/40" />
    <div class="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-tech/40" />
    <div class="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-tech/40" />
  </div>
</template>
