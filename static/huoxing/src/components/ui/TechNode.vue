<script setup lang="ts">
import { computed } from 'vue'
import { FlaskConical, Lock, CheckCircle, Loader2, Sparkles, Zap, Clock } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { formatNumber, formatTime } from '@/utils/formatters'
import type { TechConfig, TechState, ResourceType, ResourceState } from '@/config/types'

interface Props {
  config: TechConfig
  state?: TechState
  resources: Record<ResourceType, ResourceState>
  canResearch?: boolean
  prerequisitesMet?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  canResearch: true,
  prerequisitesMet: true,
  class: ''
})

const emit = defineEmits({
  research: () => true
})

type TechStatus = 'locked' | 'available' | 'researching' | 'completed'

const status = computed<TechStatus>(() => {
  if (props.state?.researched) return 'completed'
  if (props.state?.researching) return 'researching'
  if (!props.prerequisitesMet || !props.canResearch) return 'locked'
  return 'available'
})

const canAfford = computed(() => {
  return (
    props.resources.techFragment?.current >= props.config.cost.techFragment &&
    props.resources.energy?.current >= props.config.cost.energy
  )
})

const statusStyles = computed(() => {
  const styles = {
    locked: 'border-space-500/30 bg-space-700/30 opacity-50',
    available: 'border-tech/50 bg-space-700/60 hover:border-tech hover:shadow-neon-blue',
    researching: 'border-warning/50 bg-space-700/60',
    completed: 'border-green-500/50 bg-space-700/60'
  }
  return styles[status.value]
})

const progressRing = computed(() => {
  const progress = props.state?.progress || 0
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - progress * circumference
  return {
    circumference,
    offset,
    color: status.value === 'completed' ? '#22C55E' : status.value === 'researching' ? '#FF6B00' : '#00D4FF'
  }
})

const getResourceIcon = (type: ResourceType) => {
  const icons: Record<ResourceType, string> = {
    energy: '⚡',
    water: '💧',
    oxygen: '🌬️',
    food: '🍞',
    iron: '⚙️',
    rareMineral: '💎',
    techFragment: '🔮'
  }
  return icons[type]
}
</script>

<template>
  <div 
    :class="cn(
      'group relative rounded-xl border transition-all duration-300 cursor-pointer',
      'backdrop-blur-md',
      statusStyles,
      status === 'available' && canAfford && 'animate-pulse-slow',
      props.class
    )"
    @click="status === 'available' && canAfford && emit('research')"
  >
    <div class="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    
    <div class="relative p-4">
      <div class="flex items-start gap-4">
        <div class="relative">
          <svg class="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              :r="progressRing.circumference / (2 * Math.PI)"
              fill="none"
              stroke="#1A1A2D"
              stroke-width="4"
            />
            <circle
              cx="40"
              cy="40"
              :r="progressRing.circumference / (2 * Math.PI)"
              fill="none"
              :stroke="progressRing.color"
              stroke-width="4"
              stroke-linecap="round"
              :stroke-dasharray="progressRing.circumference"
              :stroke-dashoffset="progressRing.offset"
              class="transition-all duration-500"
            />
          </svg>
          
          <div class="absolute inset-0 flex items-center justify-center">
            <div 
              :class="cn(
                'w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300',
                status === 'completed' ? 'bg-green-500/20 border-green-500/30' :
                status === 'researching' ? 'bg-warning/20 border-warning/30' :
                status === 'available' ? 'bg-tech/20 border-tech/30 group-hover:scale-110' :
                'bg-space-600/50 border-space-500/30'
              )"
            >
              <FlaskConical 
                v-if="status !== 'completed'"
                :class="cn(
                  'w-6 h-6 transition-colors duration-300',
                  status === 'available' ? 'text-tech' : 
                  status === 'researching' ? 'text-warning animate-spin' :
                  'text-space-400'
                )" 
              />
              <CheckCircle v-else class="w-6 h-6 text-green-500" />
            </div>
          </div>

          <div 
            v-if="status === 'locked'"
            class="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-space-600 flex items-center justify-center border border-space-500"
          >
            <Lock class="w-3 h-3 text-space-400" />
          </div>
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <h4 class="font-bold text-space-100 truncate">{{ config.name }}</h4>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-space-600/50 text-space-300">
              T{{ config.tier }}
            </span>
          </div>
          <p class="text-xs text-space-400 line-clamp-2 mb-3">{{ config.description }}</p>

          <div v-if="status !== 'completed'" class="space-y-2">
            <div class="flex flex-wrap gap-2">
              <div 
                :class="cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono border',
                  resources.techFragment?.current >= config.cost.techFragment
                    ? 'bg-space-600/50 text-space-200 border-space-500/30'
                    : 'bg-mars/20 text-mars border-mars/30'
                )"
              >
                <span>🔮</span>
                <span>{{ formatNumber(config.cost.techFragment) }}</span>
              </div>
              <div 
                :class="cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono border',
                  resources.energy?.current >= config.cost.energy
                    ? 'bg-space-600/50 text-space-200 border-space-500/30'
                    : 'bg-mars/20 text-mars border-mars/30'
                )"
              >
                <span>⚡</span>
                <span>{{ formatNumber(config.cost.energy) }}</span>
              </div>
              <div class="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono bg-space-600/50 text-space-300 border border-space-500/30">
                <Clock class="w-3 h-3" />
                <span>{{ formatTime(config.researchTime) }}</span>
              </div>
            </div>

            <div v-if="config.prerequisites.length > 0" class="flex items-center gap-2">
              <span class="text-[10px] text-space-400">前置:</span>
              <div class="flex gap-1">
                <div 
                  v-for="pre in config.prerequisites" 
                  :key="pre"
                  class="w-2 h-2 rounded-full"
                  :class="prerequisitesMet ? 'bg-green-500' : 'bg-mars'"
                />
              </div>
            </div>
          </div>

          <div v-else class="flex items-center gap-2 text-green-400 text-xs">
            <Sparkles class="w-4 h-4" />
            <span class="font-semibold">研发完成</span>
          </div>
        </div>
      </div>

      <div 
        v-if="status === 'researching' && state"
        class="mt-3 pt-3 border-t border-space-600/50"
      >
        <div class="flex items-center justify-between text-xs mb-2">
          <span class="text-warning flex items-center gap-1">
            <Loader2 class="w-3 h-3 animate-spin" />
            研发中...
          </span>
          <span class="font-mono text-space-300">
            {{ formatTime((1 - state.progress) * config.researchTime) }}
          </span>
        </div>
        <div class="relative h-1.5 bg-space-900 rounded-full overflow-hidden">
          <div 
            class="h-full bg-gradient-to-r from-warning to-warning/70 transition-all duration-300"
            :style="{ width: `${state.progress * 100}%` }"
          >
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-scan" />
          </div>
        </div>
      </div>

      <div 
        v-if="status === 'available' && canAfford"
        class="mt-3 flex items-center justify-center gap-2 py-2 rounded-lg bg-tech/10 text-tech text-xs font-semibold border border-tech/30 group-hover:bg-tech/20 transition-all duration-300"
      >
        <Zap class="w-4 h-4" />
        <span>点击开始研发</span>
      </div>
    </div>

    <div 
      v-if="status === 'researching'"
      class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-warning/50 to-transparent animate-pulse" 
    />
  </div>
</template>
