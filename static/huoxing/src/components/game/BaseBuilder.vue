<template>
  <div class="base-builder bg-slate-900/90 rounded-xl p-4 border border-slate-700">
    <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
      <span>🏗️</span> 基地建设
    </h3>

    <div class="flex flex-wrap gap-2 mb-4">
      <button
        v-for="(cat, key) in BUILDING_CATEGORIES"
        :key="key"
        @click="selectedCategory = key as BuildingCategory"
        class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
        :class="selectedCategory === key
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'"
      >
        <span>{{ cat.icon }}</span>
        <span>{{ cat.name }}</span>
        <span
          class="text-xs px-1.5 py-0.5 rounded-full"
          :class="selectedCategory === key ? 'bg-white/20' : 'bg-slate-700'"
        >
          {{ getCategoryCount(key as BuildingCategory) }}
        </span>
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="lg:col-span-2">
        <h4 class="text-sm font-medium text-slate-400 mb-3">可建造建筑</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="building in filteredBuildings"
            :key="building.id"
            class="building-card bg-slate-800/80 rounded-lg p-4 border transition-all cursor-pointer hover:border-blue-500/50"
            :class="{
              'border-slate-600 opacity-60': !isBuildingUnlocked(building.id),
              'border-slate-600 hover:shadow-lg': isBuildingUnlocked(building.id),
              'border-red-500/30': isBuildingUnlocked(building.id) && !canAfford(building.cost)
            }"
            @click="selectBuilding(building)"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center gap-3">
                <span class="text-3xl">{{ building.icon }}</span>
                <div>
                  <h5 class="font-medium text-white">{{ building.name }}</h5>
                  <p class="text-xs text-slate-400 line-clamp-2">{{ building.description }}</p>
                </div>
              </div>
              <span
                v-if="!isBuildingUnlocked(building.id)"
                class="text-xs bg-slate-700 text-slate-400 px-2 py-1 rounded"
              >
                🔒 未解锁
              </span>
            </div>

            <div class="space-y-2 mt-3">
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="(amount, type) in building.cost"
                  :key="type"
                  class="flex items-center gap-1 text-xs px-2 py-1 rounded"
                  :class="canAffordResource(type as ResourceType, amount!)
                    ? 'bg-slate-700 text-slate-300'
                    : 'bg-red-900/30 text-red-400'"
                >
                  <span>{{ RESOURCES[type as ResourceType].icon }}</span>
                  <span>{{ amount }}</span>
                </div>
              </div>

              <div class="flex items-center justify-between text-xs">
                <div class="flex gap-3">
                  <span v-if="hasProduction(building)" class="text-green-400">
                    +{{ formatProduction(building.production) }}
                  </span>
                  <span v-if="hasConsumption(building)" class="text-red-400">
                    -{{ formatProduction(building.consumption) }}
                  </span>
                </div>
                <span class="text-slate-500">
                  ⏱️ {{ building.buildTime }}s
                </span>
              </div>
            </div>

            <div
              v-if="!isBuildingUnlocked(building.id) && building.unlockCondition"
              class="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-500"
            >
              <div v-if="building.unlockCondition.tech">
                需要科技: {{ getTechName(building.unlockCondition.tech) }}
              </div>
              <div v-if="building.unlockCondition.region">
                需要区域: {{ getRegionName(building.unlockCondition.region) }}
              </div>
              <div v-if="building.unlockCondition.baseLevel">
                需要基地等级: {{ building.unlockCondition.baseLevel }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 class="text-sm font-medium text-slate-400 mb-3">
          当前区域建筑 ({{ currentRegionBuildings.length }})
        </h4>
        <div class="space-y-2 max-h-96 overflow-y-auto pr-2">
          <div
            v-for="building in currentRegionBuildings"
            :key="building.id"
            class="bg-slate-800/60 rounded-lg p-3 border border-slate-700"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-xl">{{ getBuildingConfig(building.configId)?.icon }}</span>
                <div>
                  <h6 class="text-sm font-medium text-white">
                    {{ getBuildingConfig(building.configId)?.name }}
                  </h6>
                  <p class="text-xs text-slate-500">
                    等级 {{ building.level }} / {{ getBuildingConfig(building.configId)?.maxLevel }}
                  </p>
                </div>
              </div>
              <span
                v-if="building.built"
                class="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded"
              >
                运行中
              </span>
              <span
                v-else
                class="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded"
              >
                建造中
              </span>
            </div>

            <div v-if="!building.built" class="mb-2">
              <div class="flex justify-between text-xs text-slate-400 mb-1">
                <span>建造进度</span>
                <span>{{ Math.floor(building.progress) }}%</span>
              </div>
              <div class="w-full bg-slate-700 rounded-full h-1.5">
                <div
                  class="h-1.5 rounded-full bg-yellow-500 transition-all"
                  :style="{ width: `${building.progress}%` }"
                />
              </div>
            </div>

            <div v-else class="flex gap-2">
              <button
                v-if="building.level < (getBuildingConfig(building.configId)?.maxLevel || 1)"
                class="flex-1 text-xs py-1.5 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 transition-colors"
              >
                ⬆️ 升级
              </button>
              <button class="flex-1 text-xs py-1.5 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors">
                🗑️ 拆除
              </button>
            </div>
          </div>

          <div
            v-if="currentRegionBuildings.length === 0"
            class="text-center py-8 text-slate-500 text-sm"
          >
            暂无建筑，选择左侧建筑开始建造
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="selectedBuilding"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      @click.self="selectedBuilding = null"
    >
      <div class="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-slate-600 shadow-2xl">
        <div class="flex items-start gap-4 mb-4">
          <span class="text-5xl">{{ selectedBuilding.icon }}</span>
          <div class="flex-1">
            <h4 class="text-xl font-bold text-white">{{ selectedBuilding.name }}</h4>
            <p class="text-sm text-slate-400 mt-1">{{ selectedBuilding.description }}</p>
          </div>
          <button
            @click="selectedBuilding = null"
            class="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <h5 class="text-sm font-medium text-slate-300 mb-2">建造消耗</h5>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="(amount, type) in selectedBuilding.cost"
                :key="type"
                class="flex items-center gap-1.5 px-3 py-2 rounded-lg"
                :class="canAffordResource(type as ResourceType, amount!)
                  ? 'bg-slate-700 text-slate-300'
                  : 'bg-red-900/40 text-red-400'"
              >
                <span class="text-lg">{{ RESOURCES[type as ResourceType].icon }}</span>
                <span class="font-medium">{{ amount }}</span>
                <span class="text-xs opacity-70">
                  ({{ Math.floor(resources[type as ResourceType].current) }})
                </span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div v-if="hasProduction(selectedBuilding)">
              <h5 class="text-sm font-medium text-slate-300 mb-2">产出</h5>
              <div class="space-y-1">
                <div
                  v-for="(amount, type) in selectedBuilding.production"
                  :key="type"
                  class="flex items-center gap-2 text-sm text-green-400"
                >
                  <span>{{ RESOURCES[type as ResourceType].icon }}</span>
                  <span>+{{ amount }}/s</span>
                  <span>{{ RESOURCES[type as ResourceType].name }}</span>
                </div>
              </div>
            </div>

            <div v-if="hasConsumption(selectedBuilding)">
              <h5 class="text-sm font-medium text-slate-300 mb-2">消耗</h5>
              <div class="space-y-1">
                <div
                  v-for="(amount, type) in selectedBuilding.consumption"
                  :key="type"
                  class="flex items-center gap-2 text-sm text-red-400"
                >
                  <span>{{ RESOURCES[type as ResourceType].icon }}</span>
                  <span>-{{ amount }}/s</span>
                  <span>{{ RESOURCES[type as ResourceType].name }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between text-sm text-slate-400">
            <span>建造时间: {{ selectedBuilding.buildTime }} 秒</span>
            <span>最高等级: {{ selectedBuilding.maxLevel }}</span>
          </div>

          <div class="flex gap-3 pt-2">
            <button
              @click="selectedBuilding = null"
              class="flex-1 py-3 bg-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-600 transition-colors"
            >
              取消
            </button>
            <button
              @click="buildSelectedBuilding"
              :disabled="!canAfford(selectedBuilding.cost)"
              class="flex-1 py-3 rounded-lg font-medium transition-all"
              :class="canAfford(selectedBuilding.cost)
                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/30'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'"
            >
              🏗️ 开始建造
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../../stores/gameStore'
import { BUILDINGS, BUILDING_CATEGORIES } from '../../config/buildings'
import { RESOURCES } from '../../config/resources'
import { TECHNOLOGIES } from '../../config/technologies'
import { REGIONS } from '../../config/regions'
import type { BuildingCategory, BuildingConfig, ResourceType } from '../../config/types'

const gameStore = useGameStore()
const { resources, currentRegionState } = storeToRefs(gameStore)
const { startBuilding, isBuildingUnlocked, hasEnoughResources } = gameStore

const selectedCategory = ref<BuildingCategory>('habitat')
const selectedBuilding = ref<BuildingConfig | null>(null)

const filteredBuildings = computed(() => {
  return BUILDINGS.filter(b => b.category === selectedCategory.value)
})

const currentRegionBuildings = computed(() => {
  return currentRegionState.value?.buildings || []
})

const getCategoryCount = (category: BuildingCategory): number => {
  return BUILDINGS.filter(b => b.category === category).length
}

const canAfford = (cost: Partial<Record<ResourceType, number>>): boolean => {
  return hasEnoughResources(cost)
}

const canAffordResource = (type: ResourceType, amount: number): boolean => {
  return resources[type]?.current >= amount
}

const hasProduction = (building: BuildingConfig): boolean => {
  return Object.keys(building.production || {}).length > 0
}

const hasConsumption = (building: BuildingConfig): boolean => {
  return Object.keys(building.consumption || {}).length > 0
}

const formatProduction = (prod: Partial<Record<ResourceType, number>>): string => {
  return Object.entries(prod)
    .map(([type, amount]) => `${amount}${RESOURCES[type as ResourceType].icon}`)
    .join(' ')
}

const getBuildingConfig = (configId: string): BuildingConfig | undefined => {
  return BUILDINGS.find(b => b.id === configId)
}

const getTechName = (techId: string): string => {
  return TECHNOLOGIES.find(t => t.id === techId)?.name || techId
}

const getRegionName = (regionId: string): string => {
  return REGIONS[regionId as keyof typeof REGIONS]?.name || regionId
}

const selectBuilding = (building: BuildingConfig): void => {
  if (isBuildingUnlocked(building.id)) {
    selectedBuilding.value = building
  }
}

const buildSelectedBuilding = (): void => {
  if (!selectedBuilding.value || !currentRegionState.value) return

  const success = startBuilding(selectedBuilding.value.id, currentRegionState.value.id)
  if (success) {
    selectedBuilding.value = null
  }
}
</script>

<style scoped>
.building-card {
  backdrop-filter: blur(8px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.max-h-96::-webkit-scrollbar {
  width: 6px;
}

.max-h-96::-webkit-scrollbar-track {
  background: #1e293b;
  border-radius: 3px;
}

.max-h-96::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 3px;
}

.max-h-96::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
</style>
