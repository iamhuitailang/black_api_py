<template>
  <div class="tech-tree bg-slate-900/90 rounded-xl p-4 border border-slate-700 h-full flex flex-col">
    <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2 flex-shrink-0">
      <span>🔬</span> 科技树
    </h3>

    <div class="flex flex-wrap gap-2 mb-4 flex-shrink-0">
      <div
        v-for="tier in 5"
        :key="tier"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
        :style="{ backgroundColor: TECH_TIER_COLORS[tier] + '20', borderColor: TECH_TIER_COLORS[tier] + '40' }"
        style="border-width: 1px;"
      >
        <div
          class="w-2.5 h-2.5 rounded-full"
          :style="{ backgroundColor: TECH_TIER_COLORS[tier] }"
        />
        <span class="text-xs font-medium" :style="{ color: TECH_TIER_COLORS[tier] }">
          T{{ tier }}
        </span>
        <span class="text-[10px] text-slate-500">
          {{ getTierProgress(tier) }}/{{ getTierTotal(tier) }}
        </span>
      </div>
    </div>

    <div class="relative bg-slate-800/40 rounded-xl p-4 border border-slate-700 overflow-x-auto flex-shrink-0">
      <svg
        :width="svgWidth"
        :height="svgHeight"
        class="absolute top-0 left-0 pointer-events-none"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
          </marker>
          <marker
            id="arrowhead-active"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#3B82F6" />
          </marker>
        </defs>

        <g v-for="line in connectionLines" :key="line.id">
          <path
            :d="line.path"
            fill="none"
            :stroke="line.active ? '#3B82F6' : '#475569'"
            :stroke-width="line.active ? 2 : 1.5"
            :stroke-dasharray="line.researched ? 'none' : '5,5'"
            :marker-end="line.active ? 'url(#arrowhead-active)' : 'url(#arrowhead)'"
            :opacity="line.researched ? 1 : 0.5"
          />
        </g>
      </svg>

      <div class="relative" :style="{ width: `${svgWidth}px`, height: `${svgHeight}px` }">
        <div
          v-for="tech in positionedTechs"
          :key="tech.id"
          class="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all"
          :style="{
            left: `${tech.x}px`,
            top: `${tech.y}px`,
            zIndex: tech.id === selectedTech?.id ? 20 : 10
          }"
          @click="selectTech(tech)"
        >
          <div
            class="tech-node w-28 h-32 rounded-xl p-3 border-2 transition-all flex flex-col items-center justify-center text-center"
            :class="getTechNodeClass(tech)"
            :style="{ borderColor: getTechNodeBorderColor(tech) }"
          >
            <div
              class="w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-2"
              :style="{ backgroundColor: TECH_TIER_COLORS[tech.tier] + '30' }"
            >
              {{ tech.icon }}
            </div>
            <div class="text-xs font-medium text-white leading-tight">{{ tech.name }}</div>
            <div
              class="text-xs mt-1 px-2 py-0.5 rounded-full"
              :style="{
                backgroundColor: TECH_TIER_COLORS[tech.tier] + '20',
                color: TECH_TIER_COLORS[tech.tier]
              }"
            >
              T{{ tech.tier }}
            </div>

            <div
              v-if="technologies[tech.id]?.researching"
              class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-24"
            >
              <div class="w-full bg-slate-700 rounded-full h-1.5">
                <div
                  class="h-1.5 rounded-full bg-blue-500 transition-all animate-pulse"
                  :style="{ width: `${technologies[tech.id]?.progress || 0}%` }"
                />
              </div>
            </div>

            <div
              v-if="technologies[tech.id]?.researched"
              class="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs shadow-lg"
            >
              ✓
            </div>

            <div
              v-if="!isTechAvailable(tech) && !technologies[tech.id]?.researched"
              class="absolute inset-0 bg-slate-900/70 rounded-xl flex items-center justify-center"
            >
              <span class="text-2xl">🔒</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="selectedTech"
      class="mt-4 bg-slate-800/95 rounded-xl p-4 border border-slate-700 relative"
    >
      <button
        @click="selectedTech = null"
        class="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 z-10"
      >
        ✕
      </button>
      <div class="flex flex-col md:flex-row md:items-start gap-4 mb-4 pr-10">
        <div
          class="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          :style="{ backgroundColor: TECH_TIER_COLORS[selectedTech.tier] + '30' }"
        >
          {{ selectedTech.icon }}
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h4 class="text-lg font-bold text-white">{{ selectedTech.name }}</h4>
            <span
              class="text-xs px-2 py-0.5 rounded-full"
              :style="{
                backgroundColor: TECH_TIER_COLORS[selectedTech.tier] + '20',
                color: TECH_TIER_COLORS[selectedTech.tier],
                borderColor: TECH_TIER_COLORS[selectedTech.tier] + '40'
              }"
              style="border-width: 1px;"
            >
              T{{ selectedTech.tier }}
            </span>
            <span
              v-if="technologies[selectedTech.id]?.researched"
              class="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex-shrink-0"
            >
              已研究
            </span>
            <span
              v-else-if="technologies[selectedTech.id]?.researching"
              class="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full animate-pulse flex-shrink-0"
            >
              研究中
            </span>
            <span
              v-else-if="!isTechAvailable(selectedTech)"
              class="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full flex-shrink-0"
            >
              🔒 未解锁
            </span>
          </div>
          <p class="text-sm text-slate-400 mt-1">{{ selectedTech.description }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="min-w-0">
          <h5 class="text-sm font-medium text-slate-300 mb-2">研究消耗</h5>
          <div class="bg-slate-800/80 rounded-lg p-3 border border-slate-700 space-y-2">
            <div
              v-for="(amount, type) in selectedTech.cost"
              :key="type"
              class="flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <span class="text-base">{{ RESOURCES[type as ResourceType]?.icon }}</span>
                <span class="text-slate-300 text-sm">{{ RESOURCES[type as ResourceType]?.name }}</span>
              </div>
              <span
                class="font-medium text-sm"
                :class="canAffordResource(type as ResourceType, amount!) ? 'text-green-400' : 'text-red-400'"
              >
                {{ amount }}
                <span class="text-slate-500 font-normal text-xs">
                  ({{ Math.floor(resources[type as ResourceType]?.current || 0) }})
                </span>
              </span>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-slate-700">
              <span class="text-slate-500 text-xs">研究时间</span>
              <span class="text-white font-medium text-sm">{{ selectedTech.researchTime }}s</span>
            </div>
          </div>
        </div>

        <div class="min-w-0">
          <h5 class="text-sm font-medium text-slate-300 mb-2">前置科技</h5>
          <div class="bg-slate-800/80 rounded-lg p-3 border border-slate-700">
            <div
              v-if="selectedTech.prerequisites.length === 0"
              class="text-center text-slate-500 py-3 text-sm"
            >
              无前置需求
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="prereqId in selectedTech.prerequisites"
                :key="prereqId"
                class="flex items-center justify-between"
              >
                <div class="flex items-center gap-1.5 min-w-0">
                  <span class="text-base flex-shrink-0">{{ getTechConfig(prereqId)?.icon }}</span>
                  <span class="text-slate-300 text-sm truncate">{{ getTechConfig(prereqId)?.name }}</span>
                </div>
                <span
                  class="text-xs px-2 py-0.5 rounded flex-shrink-0"
                  :class="technologies[prereqId]?.researched
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'"
                >
                  {{ technologies[prereqId]?.researched ? '✓' : '✗' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="min-w-0">
          <h5 class="text-sm font-medium text-slate-300 mb-2">科技效果</h5>
          <div class="bg-slate-800/80 rounded-lg p-3 border border-slate-700 space-y-2">
            <div
              v-for="(effect, index) in selectedTech.effects"
              :key="index"
              class="flex items-start gap-2 p-2 rounded-lg bg-slate-900/50"
            >
              <span class="text-base flex-shrink-0">{{ getEffectIcon(effect.type) }}</span>
              <div class="min-w-0">
                <div class="text-sm text-white">{{ getEffectDescription(effect) }}</div>
                <div class="text-xs text-green-400">
                  +{{ Math.floor(effect.value * 100) }}% 提升
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="technologies[selectedTech.id]?.researching" class="mt-4">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs text-slate-400">研究进度</span>
          <span class="text-xs text-blue-400">
            {{ Math.floor(technologies[selectedTech.id]?.progress || 0) }}%
          </span>
        </div>
        <div class="w-full bg-slate-700 rounded-full h-2">
          <div
            class="h-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all"
            :style="{ width: `${technologies[selectedTech.id]?.progress || 0}%` }"
          />
        </div>
      </div>

      <div
        v-if="!technologies[selectedTech.id]?.researched && !technologies[selectedTech.id]?.researching"
        class="mt-4 flex justify-end"
      >
        <button
          @click="startResearchSelected"
          :disabled="!canStartResearch(selectedTech)"
          class="px-6 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2"
          :class="canStartResearch(selectedTech)
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-600/30'
            : 'bg-slate-700 text-slate-500 cursor-not-allowed'"
        >
          <span>🔬</span>
          开始研究
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../../stores/gameStore'
import { TECHNOLOGIES, TECH_TIER_COLORS } from '../../config/technologies'
import { RESOURCES } from '../../config/resources'
import type { TechConfig, TechEffect, ResourceType } from '../../config/types'

interface PositionedTech extends TechConfig {
  x: number
  y: number
}

interface ConnectionLine {
  id: string
  path: string
  active: boolean
  researched: boolean
}

const gameStore = useGameStore()
const { resources, technologies, researchingTech } = storeToRefs(gameStore)
const { startResearch } = gameStore

const selectedTech = ref<TechConfig | null>(null)
const positionedTechs = ref<PositionedTech[]>([])
const connectionLines = ref<ConnectionLine[]>([])

const NODE_WIDTH = 112
const NODE_HEIGHT = 128
const HORIZONTAL_GAP = 40
const VERTICAL_GAP = 80
const PADDING = 60

const svgWidth = computed(() => {
  const maxPerTier = Math.max(...Array.from({ length: 5 }, (_, i) =>
    TECHNOLOGIES.filter(t => t.tier === i + 1).length
  ))
  return maxPerTier * (NODE_WIDTH + HORIZONTAL_GAP) + PADDING * 2
})

const svgHeight = computed(() => {
  return 5 * (NODE_HEIGHT + VERTICAL_GAP) + PADDING
})

const getTierProgress = (tier: number): number => {
  return TECHNOLOGIES.filter(t => t.tier === tier && technologies.value[t.id]?.researched).length
}

const getTierTotal = (tier: number): number => {
  return TECHNOLOGIES.filter(t => t.tier === tier).length
}

const getTechConfig = (techId: string): TechConfig | undefined => {
  return TECHNOLOGIES.find(t => t.id === techId)
}

const isTechAvailable = (tech: TechConfig): boolean => {
  if (technologies.value[tech.id]?.researched) return true
  return tech.prerequisites.every(prereqId => technologies.value[prereqId]?.researched)
}

const canAffordResource = (type: ResourceType, amount: number): boolean => {
  return resources.value[type]?.current >= amount
}

const canStartResearch = (tech: TechConfig): boolean => {
  if (!isTechAvailable(tech)) return false
  if (technologies.value[tech.id]?.researched) return false
  if (technologies.value[tech.id]?.researching) return false
  if (researchingTech.value) return false
  return gameStore.hasEnoughResources(tech.cost)
}

const getTechNodeClass = (tech: TechConfig): string => {
  const baseClass = 'bg-slate-800/90 backdrop-blur-sm'

  if (technologies.value[tech.id]?.researched) {
    return `${baseClass} hover:scale-105`
  }
  if (technologies.value[tech.id]?.researching) {
    return `${baseClass} hover:scale-105 ring-2 ring-blue-500 ring-opacity-50`
  }
  if (isTechAvailable(tech)) {
    return `${baseClass} hover:scale-105 hover:shadow-lg`
  }
  return `${baseClass} opacity-60`
}

const getTechNodeBorderColor = (tech: TechConfig): string => {
  if (technologies.value[tech.id]?.researched) {
    return '#22C55E'
  }
  if (technologies.value[tech.id]?.researching) {
    return '#3B82F6'
  }
  if (isTechAvailable(tech)) {
    return TECH_TIER_COLORS[tech.tier] + '60'
  }
  return '#475569'
}

const getEffectIcon = (type: TechEffect['type']): string => {
  const icons: Record<string, string> = {
    production_modifier: '📈',
    production_bonus: '📈',
    storage_bonus: '📦',
    unlock_building: '🏗️',
    unlock_region: '🗺️',
    environment_resist: '🛡️'
  }
  return icons[type] || '✨'
}

const getEffectDescription = (effect: TechEffect): string => {
  const targetName = effect.target === 'all' ? '所有资源' : RESOURCES[effect.target as ResourceType]?.name || effect.target

  switch (effect.type) {
    case 'production_modifier':
      return `${targetName} 产出提升`
    case 'storage_bonus':
      return `${targetName} 存储上限提升`
    case 'unlock_building':
      return `解锁建筑: ${getTechConfig(effect.target)?.name || effect.target}`
    case 'unlock_region':
      return `解锁区域: ${effect.target}`
    case 'environment_resist':
      return `环境抗性提升`
    default:
      return '未知效果'
  }
}

const selectTech = (tech: TechConfig): void => {
  selectedTech.value = tech
}

const startResearchSelected = (): void => {
  if (selectedTech.value) {
    startResearch(selectedTech.value.id)
  }
}

const calculateLayout = (): void => {
  const techsByTier: Record<number, TechConfig[]> = {}

  for (let tier = 1; tier <= 5; tier++) {
    techsByTier[tier] = TECHNOLOGIES.filter(t => t.tier === tier)
  }

  const positioned: PositionedTech[] = []

  for (let tier = 1; tier <= 5; tier++) {
    const tierTechs = techsByTier[tier]
    const tierWidth = tierTechs.length * (NODE_WIDTH + HORIZONTAL_GAP) - HORIZONTAL_GAP
    const startX = (svgWidth.value - tierWidth) / 2 + NODE_WIDTH / 2

    tierTechs.forEach((tech, index) => {
      positioned.push({
        ...tech,
        x: startX + index * (NODE_WIDTH + HORIZONTAL_GAP),
        y: PADDING + (tier - 1) * (NODE_HEIGHT + VERTICAL_GAP) + NODE_HEIGHT / 2
      })
    })
  }

  positionedTechs.value = positioned

  const lines: ConnectionLine[] = []

  positioned.forEach(tech => {
    tech.prerequisites.forEach(prereqId => {
      const prereq = positioned.find(p => p.id === prereqId)
      if (prereq) {
        const startX = prereq.x
        const startY = prereq.y + NODE_HEIGHT / 2
        const endX = tech.x
        const endY = tech.y - NODE_HEIGHT / 2

        const midY = (startY + endY) / 2
        const path = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`

        const isActive = technologies.value[prereqId]?.researched && isTechAvailable(tech)
        const isResearched = technologies.value[tech.id]?.researched

        lines.push({
          id: `${prereqId}-${tech.id}`,
          path,
          active: isActive,
          researched: isResearched
        })
      }
    })
  })

  connectionLines.value = lines
}

onMounted(() => {
  calculateLayout()
})
</script>

<style scoped>
.tech-node {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

.tech-node:hover {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
