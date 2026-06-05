<script setup lang="ts">
import { computed } from 'vue'
import { 
  Home, Building2, Map, FlaskConical, 
  ChevronRight, Bell, Lock, CheckCircle
} from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { RegionId, RegionState } from '@/config/types'
import { REGIONS } from '@/config/regions'

interface Props {
  currentPage: 'base' | 'explore' | 'tech' | 'hall'
  currentRegion: RegionId
  regions: RegionState[]
  eventCount?: number
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  eventCount: 0,
  class: ''
})

const emit = defineEmits({
  navigate: (page: 'base' | 'explore' | 'tech' | 'hall') => true
})

const navItems = [
  { id: 'hall', label: '火星大厅', icon: Home },
  { id: 'base', label: '基地建设', icon: Building2 },
  { id: 'explore', label: '探索地图', icon: Map },
  { id: 'tech', label: '科技研发', icon: FlaskConical }
] as const

const currentRegionName = computed(() => {
  return REGIONS[props.currentRegion]?.name || '未知区域'
})

const unlockedRegions = computed(() => {
  return props.regions
    .filter(state => state.unlocked)
    .map(state => state.id as RegionId)
})

const isItemActive = (id: string) => props.currentPage === id

const getRegionById = (id: RegionId) => {
  return props.regions.find(r => r.id === id)
}
</script>

<template>
  <aside 
    :class="cn(
      'relative w-64 bg-space-800/90 backdrop-blur-xl border-r border-tech/20',
      'flex flex-col',
      props.class
    )"
  >
    <div class="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-tech/30 to-transparent" />
    <div class="absolute inset-0 bg-gradient-to-b from-mars/5 via-transparent to-tech/5 pointer-events-none" />

    <div class="relative p-4 border-b border-space-700/50">
      <div class="flex items-center gap-3">
        <div class="relative">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-mars/30 to-mars/10 border border-mars/30 flex items-center justify-center">
            <span class="text-2xl">🔴</span>
          </div>
          <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-space-800 animate-pulse" />
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-space-100">火星殖民地</h3>
          <div class="flex items-center gap-1.5 mt-0.5">
            <span class="w-1.5 h-1.5 rounded-full bg-tech animate-pulse" />
            <span class="text-xs text-space-400">{{ currentRegionName }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="relative px-3 py-4 border-b border-space-700/50">
      <h4 class="text-[10px] font-bold text-space-500 uppercase tracking-wider px-3 mb-2">主导航</h4>
      <nav class="space-y-1">
        <button
          v-for="item in navItems"
          :key="item.id"
          :class="cn(
            'relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group',
            isItemActive(item.id)
              ? 'bg-tech/10 text-tech border border-tech/30'
              : 'text-space-400 hover:text-space-100 hover:bg-space-700/50 border border-transparent'
          )"
          @click="emit('navigate', item.id)"
        >
          <div 
            :class="cn(
              'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300',
              isItemActive(item.id)
                ? 'bg-tech/20'
                : 'bg-space-700/50 group-hover:bg-space-600/50'
            )"
          >
            <component 
              :is="item.icon" 
              :class="cn('w-5 h-5 transition-colors duration-300', isItemActive(item.id) && 'text-tech')"
            />
          </div>
          
          <span class="flex-1 text-left font-medium text-sm">{{ item.label }}</span>
          
          <div 
            v-if="item.id === 'hall' && eventCount > 0"
            class="relative"
          >
            <Bell class="w-4 h-4 text-warning animate-pulse" />
            <span class="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-mars text-white text-[9px] font-bold flex items-center justify-center">
              {{ eventCount > 9 ? '9+' : eventCount }}
            </span>
          </div>

          <ChevronRight 
            v-if="isItemActive(item.id)"
            class="w-4 h-4 text-tech" 
          />

          <div 
            v-if="isItemActive(item.id)"
            class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-px w-1 h-6 rounded-r-full bg-tech shadow-neon-blue"
          />
        </button>
      </nav>
    </div>

    <div class="relative px-3 py-4 flex-1">
      <h4 class="text-[10px] font-bold text-space-500 uppercase tracking-wider px-3 mb-2">已解锁区域</h4>
      <div class="space-y-1">
        <div
          v-for="regionId in unlockedRegions"
          :key="regionId"
          :class="cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
            currentRegion === regionId
              ? 'bg-mars/10 border border-mars/30'
              : 'hover:bg-space-700/30 border border-transparent'
          )"
        >
          <div 
            :class="cn(
              'w-8 h-8 rounded-lg flex items-center justify-center text-sm',
              currentRegion === regionId
                ? 'bg-mars/20'
                : 'bg-space-700/50'
            )"
          >
            📍
          </div>
          <div class="flex-1 min-w-0">
            <p 
              :class="cn(
                'text-sm font-medium truncate',
                currentRegion === regionId ? 'text-mars' : 'text-space-300'
              )"
            >
              {{ REGIONS[regionId]?.name }}
            </p>
            <div class="flex items-center gap-1 mt-0.5">
                <div 
                  class="w-1.5 h-1.5 rounded-full"
                  :class="getRegionById(regionId)?.roverPresent ? 'bg-green-500' : 'bg-space-500'"
                />
                <span class="text-[10px] text-space-500">
                  探索度: {{ Math.round(getRegionById(regionId)?.explored * 100) }}%
                </span>
              </div>
          </div>
          <CheckCircle 
            v-if="currentRegion === regionId"
            class="w-4 h-4 text-mars" 
          />
        </div>
      </div>

      <div v-if="unlockedRegions.length < 5" class="mt-3">
        <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-space-700/20 border border-space-600/20 opacity-50">
          <div class="w-8 h-8 rounded-lg bg-space-700/50 flex items-center justify-center">
            <Lock class="w-4 h-4 text-space-500" />
          </div>
          <div class="flex-1">
            <p class="text-sm text-space-500">更多区域</p>
            <p class="text-[10px] text-space-600">完成任务解锁</p>
          </div>
        </div>
      </div>
    </div>

    <div class="relative px-4 py-3 border-t border-space-700/50">
      <div class="flex items-center justify-between text-[10px] text-space-500">
        <div class="flex items-center gap-1.5">
          <div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span>系统运行正常</span>
        </div>
        <span class="font-mono">v0.1.0</span>
      </div>
    </div>

    <div class="absolute top-3 left-3 w-2 h-2 border-l border-t border-tech/40" />
    <div class="absolute top-3 right-3 w-2 h-2 border-r border-t border-tech/40" />
    <div class="absolute bottom-3 left-3 w-2 h-2 border-l border-b border-tech/40" />
    <div class="absolute bottom-3 right-3 w-2 h-2 border-r border-b border-tech/40" />
  </aside>
</template>
