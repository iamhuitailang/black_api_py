<script setup lang="ts">
import { computed } from 'vue'
import { Home, Zap, Wind, Factory, FlaskConical, ArrowUp, Clock, Hammer, CheckCircle, Lock } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { formatNumber, formatTime } from '@/utils/formatters'
import type { BuildingConfig, BuildingInstance, ResourceType, ResourceState } from '@/config/types'
import { RESOURCES } from '@/config/resources'

interface Props {
  config: BuildingConfig
  instance?: BuildingInstance
  resources: Record<ResourceType, ResourceState>
  canBuild?: boolean
  isBuilding?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  canBuild: true,
  isBuilding: false,
  class: ''
})

const emit = defineEmits({
  build: () => true,
  upgrade: () => true
})

const categoryIcon = computed(() => {
  const icons = {
    habitat: Home,
    power: Zap,
    life: Wind,
    production: Factory,
    research: FlaskConical
  }
  return icons[props.config.category]
})

const categoryColor = computed(() => {
  const colors = {
    habitat: 'text-tech',
    power: 'text-yellow-400',
    life: 'text-green-400',
    production: 'text-mars',
    research: 'text-purple-400'
  }
  return colors[props.config.category]
})

const canAfford = computed(() => {
  return Object.entries(props.config.cost).every(([type, amount]) => {
    return props.resources[type as ResourceType]?.current >= (amount || 0)
  })
})

const canUpgrade = computed(() => {
  if (!props.instance || !props.instance.built) return false
  if (props.instance.level >= props.config.maxLevel) return false
  return canAfford.value
})

const isMaxLevel = computed(() => {
  return props.instance && props.instance.level >= props.config.maxLevel
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

const isResourceInsufficient = (type: ResourceType, amount: number) => {
  return props.resources[type]?.current < amount
}
</script>

<template>
  <div 
    :class="cn(
      'group relative rounded-xl border bg-space-700/60 backdrop-blur-md transition-all duration-300',
      'hover:bg-space-600/60 hover:shadow-neon-blue hover:border-tech',
      canBuild ? 'border-tech/30' : 'border-space-500/30 opacity-60',
      props.class
    )"
  >
    <div class="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-tech/30 to-transparent" />

    <div class="relative p-4">
      <div class="flex items-start gap-3 mb-3">
        <div 
          :class="cn(
            'relative flex items-center justify-center w-14 h-14 rounded-xl border transition-all duration-300',
            'group-hover:scale-105',
            categoryColor.replace('text-', 'bg-') + '/20',
            categoryColor.replace('text-', 'border-') + '/30'
          )"
        >
          <component :is="categoryIcon" :class="cn('w-7 h-7', categoryColor)" />
          <div 
            v-if="instance?.built"
            class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
          >
            <CheckCircle class="w-3 h-3 text-white" />
          </div>
          <div 
            v-else-if="isBuilding"
            class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-tech flex items-center justify-center animate-spin"
          >
            <Clock class="w-3 h-3 text-white" />
          </div>
          <div 
            v-else-if="!canBuild"
            class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-space-500 flex items-center justify-center"
          >
            <Lock class="w-3 h-3 text-white" />
          </div>
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-space-100 truncate">{{ config.name }}</h4>
            <div v-if="instance?.built" class="flex items-center gap-1 text-xs font-mono text-tech">
              <span>Lv.{{ instance.level }}</span>
              <span class="text-space-400">/{{ config.maxLevel }}</span>
            </div>
          </div>
          <p class="text-xs text-space-400 line-clamp-2 mt-1">{{ config.description }}</p>
        </div>
      </div>

      <div v-if="isBuilding && instance" class="mb-3">
        <div class="flex items-center justify-between text-xs mb-1">
          <span class="text-tech flex items-center gap-1">
            <Hammer class="w-3 h-3 animate-pulse" />
            建造中...
          </span>
          <span class="font-mono text-space-300">{{ formatTime((1 - instance.progress) * config.buildTime) }}</span>
        </div>
        <div class="relative h-2 bg-space-900 rounded-full overflow-hidden">
          <div 
            class="h-full bg-gradient-to-r from-tech to-tech/70 transition-all duration-300"
            :style="{ width: `${instance.progress * 100}%` }"
          >
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-scan" />
          </div>
        </div>
      </div>

      <div class="space-y-2 mb-4">
        <div v-if="Object.keys(config.cost).length > 0" class="flex flex-wrap gap-2">
          <div 
            v-for="(amount, type) in config.cost" 
            :key="type"
            :class="cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono',
              isResourceInsufficient(type as ResourceType, amount!) 
                ? 'bg-mars/20 text-mars border border-mars/30' 
                : 'bg-space-600/50 text-space-200 border border-space-500/30'
            )"
          >
            <span>{{ getResourceIcon(type as ResourceType) }}</span>
            <span>{{ formatNumber(amount!) }}</span>
          </div>
        </div>

        <div v-if="Object.keys(config.production).length > 0" class="flex flex-wrap gap-2">
          <div 
            v-for="(amount, type) in config.production" 
            :key="type"
            class="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono bg-green-500/10 text-green-400 border border-green-500/20"
          >
            <span>+{{ amount }}/s</span>
            <span>{{ getResourceIcon(type as ResourceType) }}</span>
          </div>
        </div>

        <div v-if="Object.keys(config.consumption).length > 0" class="flex flex-wrap gap-2">
          <div 
            v-for="(amount, type) in config.consumption" 
            :key="type"
            class="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono bg-mars/10 text-mars border border-mars/20"
          >
            <span>-{{ amount }}/s</span>
            <span>{{ getResourceIcon(type as ResourceType) }}</span>
          </div>
        </div>
      </div>

      <button
        v-if="!isBuilding"
        :disabled="(!instance?.built && !canAfford) || (instance?.built && !canUpgrade) || isMaxLevel"
        :class="cn(
          'relative w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-300',
          'flex items-center justify-center gap-2',
          (!instance?.built && canAfford) || (instance?.built && canUpgrade)
            ? 'bg-gradient-to-r from-tech/80 to-tech hover:from-tech hover:to-tech/80 text-space-900 hover:shadow-neon-blue'
            : 'bg-space-600/50 text-space-400 cursor-not-allowed',
          isMaxLevel && 'bg-green-500/20 text-green-400 cursor-not-allowed'
        )"
        @click="instance?.built ? emit('upgrade') : emit('build')"
      >
        <ArrowUp v-if="instance?.built && !isMaxLevel" class="w-4 h-4" />
        <Hammer v-else-if="!instance?.built" class="w-4 h-4" />
        <CheckCircle v-else-if="isMaxLevel" class="w-4 h-4" />
        <span>
          {{ isMaxLevel ? '已满级' : instance?.built ? '升级' : '建造' }}
        </span>
        <div v-if="(!instance?.built && canAfford) || (instance?.built && canUpgrade)" 
             class="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>

    <div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-tech/20 to-transparent" />
  </div>
</template>
