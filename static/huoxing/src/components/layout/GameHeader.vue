<script setup lang="ts">
import { computed } from 'vue'
import { 
  Clock, Zap, Wind, Droplets, Apple, 
  Play, Pause, FastForward, Menu, Bell, Settings
} from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/utils/formatters'
import type { GameState, ResourceType, ResourceState } from '@/config/types'
import { RESOURCES } from '@/config/resources'

interface Props {
  gameState: GameState
  resources: Record<ResourceType, ResourceState>
  marsTime: string
  eventCount?: number
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  eventCount: 0,
  class: ''
})

const emit = defineEmits({
  togglePause: () => true,
  setSpeed: (speed: number) => true,
  openMenu: () => true,
  openEvents: () => true,
  openSettings: () => true
})

const coreResources = computed(() => {
  return ['energy', 'oxygen', 'water', 'food'] as ResourceType[]
})

const formatMarsTime = computed(() => {
  return props.marsTime
})

const getResourceIcon = (type: ResourceType) => {
  const icons: Record<ResourceType, any> = {
    energy: Zap,
    water: Droplets,
    oxygen: Wind,
    food: Apple,
    iron: Zap,
    rareMineral: Zap,
    techFragment: Zap
  }
  return icons[type]
}

const speeds = [1, 2, 5]
</script>

<template>
  <header 
    :class="cn(
      'relative h-16 bg-space-800/90 backdrop-blur-xl border-b border-tech/20',
      'flex items-center justify-between px-4',
      props.class
    )"
  >
    <div class="absolute inset-0 bg-gradient-to-r from-mars/5 via-transparent to-tech/5 pointer-events-none" />
    <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-tech/30 to-transparent" />

    <div class="relative flex items-center gap-6">
      <button 
        class="p-2 rounded-lg bg-space-700/50 text-space-300 hover:text-tech hover:bg-space-600/50 transition-all duration-200"
        @click="emit('openMenu')"
      >
        <Menu class="w-5 h-5" />
      </button>

      <div class="flex items-center gap-3 pl-4 border-l border-space-600/50">
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-mars/10 border border-mars/30">
          <Clock class="w-4 h-4 text-mars" />
          <span class="font-mono text-sm font-bold text-mars">{{ formatMarsTime }}</span>
        </div>

        <div class="flex items-center gap-1">
          <div 
            v-for="type in coreResources" 
            :key="type"
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-space-700/30 border border-space-600/30 hover:border-tech/30 transition-all duration-200 group"
          >
            <component 
              :is="getResourceIcon(type)" 
              class="w-4 h-4 transition-colors duration-200"
              :style="{ color: RESOURCES[type].color }"
            />
            <span class="font-mono text-xs font-semibold text-space-200 group-hover:text-white transition-colors">
              {{ formatNumber(resources[type]?.current || 0) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="relative flex items-center gap-3">
      <div class="flex items-center gap-1 pr-4 border-r border-space-600/50">
        <button 
          class="relative p-2 rounded-lg bg-space-700/50 text-space-300 hover:text-warning hover:bg-space-600/50 transition-all duration-200"
          @click="emit('openEvents')"
        >
          <Bell class="w-5 h-5" />
          <div 
            v-if="eventCount > 0"
            class="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-mars text-white text-[10px] font-bold flex items-center justify-center animate-pulse"
          >
            {{ eventCount > 9 ? '9+' : eventCount }}
          </div>
        </button>

        <button 
          class="p-2 rounded-lg bg-space-700/50 text-space-300 hover:text-tech hover:bg-space-600/50 transition-all duration-200"
          @click="emit('openSettings')"
        >
          <Settings class="w-5 h-5" />
        </button>
      </div>

      <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-space-700/50 border border-space-600/50">
        <button 
          :class="cn(
            'p-1.5 rounded-lg transition-all duration-200',
            gameState.isPaused 
              ? 'bg-warning text-space-900' 
              : 'bg-space-600/50 text-space-300 hover:bg-space-500/50 hover:text-white'
          )"
          @click="emit('togglePause')"
        >
          <Pause v-if="!gameState.isPaused" class="w-4 h-4" />
          <Play v-else class="w-4 h-4" />
        </button>

        <div class="w-px h-5 bg-space-600/50" />

        <div class="flex items-center gap-0.5">
          <button
            v-for="speed in speeds"
            :key="speed"
            :class="cn(
              'px-2 py-1 rounded-md text-xs font-bold font-mono transition-all duration-200',
              gameState.gameSpeed === speed && !gameState.isPaused
                ? 'bg-tech text-space-900'
                : 'text-space-400 hover:text-white hover:bg-space-600/50'
            )"
            @click="emit('setSpeed', speed)"
          >
            <FastForward v-if="speed > 1" class="w-3 h-3 inline mr-0.5" />
            {{ speed }}x
          </button>
        </div>
      </div>
    </div>

    <div class="absolute bottom-0 left-0 right-0 h-px">
      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-tech/20 to-transparent" />
      <div 
        class="h-full bg-gradient-to-r from-tech via-tech/80 to-tech animate-scan"
        style="width: 20%; background-size: 200% 100%;"
      />
    </div>
  </header>
</template>
