<script setup lang="ts">
import { computed } from 'vue'
import { Zap, Droplets, Wind, Apple, Cog, Gem, Sparkles, TrendingUp, TrendingDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/utils/formatters'
import type { ResourceType, ResourceState } from '@/config/types'
import { RESOURCES } from '@/config/resources'

interface Props {
  type: ResourceType
  state: ResourceState
  showRate?: boolean
  compact?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  showRate: true,
  compact: false,
  class: ''
})

const config = computed(() => RESOURCES[props.type])
const netRate = computed(() => props.state.production - props.state.consumption)

const iconComponent = computed(() => {
  const icons: Record<ResourceType, any> = {
    energy: Zap,
    water: Droplets,
    oxygen: Wind,
    food: Apple,
    iron: Cog,
    rareMineral: Gem,
    techFragment: Sparkles
  }
  return icons[props.type]
})

const progressColor = computed(() => {
  const ratio = props.state.ratio
  if (ratio < 0.2) return 'bg-mars'
  if (ratio < 0.5) return 'bg-warning'
  return 'bg-tech'
})

const progressGlow = computed(() => {
  const ratio = props.state.ratio
  if (ratio < 0.2) return 'shadow-neon-red'
  if (ratio < 0.5) return 'shadow-neon-orange'
  return 'shadow-neon-blue'
})
</script>

<template>
  <div :class="cn('group relative', compact ? 'px-2 py-1' : 'p-3', props.class)">
    <div class="flex items-center gap-3">
      <div 
        class="relative flex items-center justify-center rounded-lg p-2 transition-all duration-300 group-hover:scale-110"
        :style="{ backgroundColor: config.color + '20' }"
      >
        <component 
          :is="iconComponent" 
          class="w-5 h-5 transition-colors duration-300"
          :style="{ color: config.color }"
        />
        <div 
          class="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-md"
          :style="{ backgroundColor: config.color }"
        />
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-medium text-space-200 uppercase tracking-wider">{{ config.name }}</span>
          <div class="flex items-center gap-2">
            <span v-if="showRate" class="text-xs font-mono flex items-center gap-1">
              <TrendingUp v-if="netRate > 0" class="w-3 h-3 text-green-400" />
              <TrendingDown v-else-if="netRate < 0" class="w-3 h-3 text-mars" />
              <span 
                :class="[
                  'font-bold',
                  netRate > 0 ? 'text-green-400' : netRate < 0 ? 'text-mars' : 'text-space-400'
                ]"
              >
                {{ netRate > 0 ? '+' : '' }}{{ netRate.toFixed(1) }}/s
              </span>
            </span>
            <span class="text-sm font-mono text-space-100">
              <span class="font-bold">{{ formatNumber(state.current) }}</span>
              <span class="text-space-400">/{{ formatNumber(state.max) }}</span>
            </span>
          </div>
        </div>

        <div class="relative h-2 bg-space-900 rounded-full overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-r from-space-800 to-space-900" />
          <div 
            :class="cn('relative h-full rounded-full transition-all duration-500', progressColor)"
            :style="{ width: `${Math.min(state.ratio * 100, 100)}%` }"
          >
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-scan" 
                 :style="{ backgroundSize: '50% 100%' }" />
            <div 
              v-if="state.ratio > 0.1" 
              :class="cn('absolute right-0 top-0 bottom-0 w-2 rounded-full blur-sm', progressGlow)"
            />
          </div>
          <div class="absolute inset-0 border border-white/10 rounded-full" />
        </div>

        <div v-if="!compact" class="flex justify-between mt-1 text-[10px] text-space-400 font-mono">
          <span>产出: +{{ state.production.toFixed(1) }}/s</span>
          <span>消耗: -{{ state.consumption.toFixed(1) }}/s</span>
        </div>
      </div>
    </div>

    <div 
      v-if="state.ratio < 0.2" 
      class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-mars animate-pulse"
    />
  </div>
</template>
