<template>
  <div class="explore-map bg-slate-900/90 rounded-xl p-4 border border-slate-700">
    <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
      <span>🗺️</span> 区域探索
    </h3>

    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
      <div
        v-for="regionId in REGION_ORDER"
        :key="regionId"
        class="region-card rounded-xl p-4 border transition-all cursor-pointer"
        :class="[
          getRegionCardClass(regionId),
          { 'ring-2 ring-blue-500': selectedRegion === regionId }
        ]"
        @click="selectRegion(regionId)"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
              :class="getRegionBgClass(regionId)"
            >
              {{ getRegionIcon(regionId) }}
            </div>
            <div>
              <h4 class="font-bold text-white">{{ REGIONS[regionId].name }}</h4>
              <p class="text-xs text-slate-400">
                {{ REGIONS[regionId].position.lat }}, {{ REGIONS[regionId].position.lng }}
              </p>
            </div>
          </div>
          <span
            v-if="!regions[regionId]?.unlocked"
            class="text-xs bg-slate-700 text-slate-400 px-2 py-1 rounded flex items-center gap-1"
          >
            🔒 未解锁
          </span>
          <span
            v-else-if="currentRegion === regionId"
            class="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded flex items-center gap-1"
          >
            📍 当前
          </span>
        </div>

        <p class="text-sm text-slate-400 mb-3 line-clamp-2">
          {{ REGIONS[regionId].description }}
        </p>

        <div class="mb-3">
          <div class="flex justify-between text-xs mb-1">
            <span class="text-slate-400">探索进度</span>
            <span class="text-slate-300">{{ Math.floor(regions[regionId]?.explored || 0) }}%</span>
          </div>
          <div class="w-full bg-slate-700 rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all duration-500"
              :class="getRegionProgressClass(regionId)"
              :style="{ width: `${regions[regionId]?.explored || 0}%` }"
            />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="bg-slate-800/60 rounded-lg p-2">
            <div class="text-lg">🌡️</div>
            <div class="text-xs text-slate-400">温度</div>
            <div class="text-sm font-medium" :class="getTempColor(REGIONS[regionId].environment.temperature.current)">
              {{ REGIONS[regionId].environment.temperature.current }}°C
            </div>
          </div>
          <div class="bg-slate-800/60 rounded-lg p-2">
            <div class="text-lg">☢️</div>
            <div class="text-xs text-slate-400">辐射</div>
            <div class="text-sm font-medium" :class="getRadiationColor(REGIONS[regionId].environment.radiation)">
              {{ getRadiationLevel(REGIONS[regionId].environment.radiation) }}
            </div>
          </div>
          <div class="bg-slate-800/60 rounded-lg p-2">
            <div class="text-lg">🌪️</div>
            <div class="text-xs text-slate-400">沙尘</div>
            <div class="text-sm font-medium" :class="getDustColor(REGIONS[regionId].environment.dustLevel)">
              {{ getDustLevel(REGIONS[regionId].environment.dustLevel) }}
            </div>
          </div>
        </div>

        <div
          v-if="regions[regionId]?.roverPresent"
          class="mt-3 text-xs text-blue-400 flex items-center gap-1"
        >
          🚗 火星车正在此区域
        </div>
      </div>
    </div>

    <div
      v-if="selectedRegion && regions[selectedRegion]?.unlocked"
      class="bg-slate-800/60 rounded-xl p-5 border border-slate-700"
    >
      <div class="flex items-start justify-between mb-4">
        <div>
          <h4 class="text-xl font-bold text-white flex items-center gap-2">
            <span class="text-3xl">{{ getRegionIcon(selectedRegion) }}</span>
            {{ REGIONS[selectedRegion].name }}
          </h4>
          <p class="text-sm text-slate-400 mt-1">{{ REGIONS[selectedRegion].description }}</p>
        </div>
        <div class="flex gap-2">
          <button
            v-if="selectedRegion !== currentRegion"
            @click="travelToRegion"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors flex items-center gap-2"
          >
            🚀 前往此区域
          </button>
          <button
            @click="toggleRover"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            :class="regions[selectedRegion]?.roverPresent
              ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
              : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'"
          >
            🚗 {{ regions[selectedRegion]?.roverPresent ? '召回火星车' : '派遣火星车' }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h5 class="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <span>📋</span> 区域任务
          </h5>
          <div class="space-y-3">
            <div
              v-for="task in regions[selectedRegion]?.tasks"
              :key="task.id"
              class="bg-slate-800/80 rounded-lg p-4 border transition-all"
              :class="task.completed ? 'border-green-500/30 bg-green-900/10' : 'border-slate-700'"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-lg">{{ getTaskIcon(task.type) }}</span>
                    <h6 class="font-medium text-white">{{ task.name }}</h6>
                    <span
                      v-if="task.completed"
                      class="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded"
                    >
                      已完成
                    </span>
                  </div>
                  <p class="text-xs text-slate-400 mt-1">{{ task.description }}</p>
                </div>
              </div>

              <div class="mb-2">
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-slate-400">任务进度</span>
                  <span class="text-slate-300">{{ Math.floor(task.progress) }} / {{ task.target }}</span>
                </div>
                <div class="w-full bg-slate-700 rounded-full h-2">
                  <div
                    class="h-2 rounded-full transition-all duration-500"
                    :class="task.completed ? 'bg-green-500' : 'bg-blue-500'"
                    :style="{ width: `${(task.progress / task.target) * 100}%` }"
                  />
                </div>
              </div>

              <div class="flex items-center justify-between">
                <div class="flex flex-wrap gap-1">
                  <span class="text-xs text-slate-500">奖励:</span>
                  <span
                    v-for="(amount, type) in task.reward"
                    :key="type"
                    class="text-xs text-yellow-400 flex items-center gap-1"
                  >
                    {{ RESOURCES[type as ResourceType].icon }} +{{ amount }}
                  </span>
                </div>
                <span
                  class="text-xs px-2 py-0.5 rounded"
                  :class="getTaskTypeClass(task.type)"
                >
                  {{ getTaskTypeName(task.type) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div>
            <h5 class="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <span>🌍</span> 环境信息
            </h5>
            <div class="bg-slate-800/80 rounded-lg p-4 border border-slate-700 space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">🌡️</span>
                  <div>
                    <div class="text-sm text-slate-400">温度范围</div>
                    <div class="font-medium text-white">
                      {{ REGIONS[selectedRegion].environment.temperature.min }}°C ~ {{ REGIONS[selectedRegion].environment.temperature.max }}°C
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm text-slate-400">当前</div>
                  <div
                    class="font-bold text-xl"
                    :class="getTempColor(REGIONS[selectedRegion].environment.temperature.current)"
                  >
                    {{ REGIONS[selectedRegion].environment.temperature.current }}°C
                  </div>
                </div>
              </div>

              <div class="h-2 bg-slate-700 rounded-full relative">
                <div
                  class="absolute h-2 rounded-full bg-gradient-to-r from-blue-500 via-green-500 to-red-500"
                  :style="{ left: '0%', width: '100%' }"
                />
                <div
                  class="absolute w-3 h-3 bg-white rounded-full -top-0.5 shadow-lg transform -translate-x-1/2 transition-all"
                  :style="{ left: `${getTempPosition(REGIONS[selectedRegion].environment.temperature.current)}%` }"
                />
              </div>

              <div class="grid grid-cols-2 gap-4 pt-2">
                <div class="bg-slate-900/50 rounded-lg p-3">
                  <div class="flex items-center gap-2 mb-1">
                    <span>☢️</span>
                    <span class="text-xs text-slate-400">辐射等级</span>
                  </div>
                  <div class="flex gap-1">
                    <div
                      v-for="i in 5"
                      :key="i"
                      class="flex-1 h-2 rounded-full transition-all"
                      :class="i <= REGIONS[selectedRegion].environment.radiation ? 'bg-yellow-500' : 'bg-slate-700'"
                    />
                  </div>
                  <div
                    class="text-sm font-medium mt-1"
                    :class="getRadiationColor(REGIONS[selectedRegion].environment.radiation)"
                  >
                    {{ getRadiationLevel(REGIONS[selectedRegion].environment.radiation) }}
                  </div>
                </div>

                <div class="bg-slate-900/50 rounded-lg p-3">
                  <div class="flex items-center gap-2 mb-1">
                    <span>🌪️</span>
                    <span class="text-xs text-slate-400">沙尘等级</span>
                  </div>
                  <div class="flex gap-1">
                    <div
                      v-for="i in 5"
                      :key="i"
                      class="flex-1 h-2 rounded-full transition-all"
                      :class="i <= REGIONS[selectedRegion].environment.dustLevel ? 'bg-orange-500' : 'bg-slate-700'"
                    />
                  </div>
                  <div
                    class="text-sm font-medium mt-1"
                    :class="getDustColor(REGIONS[selectedRegion].environment.dustLevel)"
                  >
                    {{ getDustLevel(REGIONS[selectedRegion].environment.dustLevel) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h5 class="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <span>💎</span> 资源分布
            </h5>
            <div class="bg-slate-800/80 rounded-lg p-4 border border-slate-700">
              <div class="space-y-3">
                <div
                  v-for="(res, type) in REGIONS[selectedRegion].resources"
                  :key="type"
                  class="flex items-center gap-3"
                >
                  <span class="text-xl">{{ RESOURCES[type as ResourceType].icon }}</span>
                  <div class="flex-1">
                    <div class="flex justify-between text-sm mb-1">
                      <span class="text-slate-300">{{ RESOURCES[type as ResourceType].name }}</span>
                      <span class="text-slate-400">丰度 {{ Math.floor(res.abundance * 100) }}%</span>
                    </div>
                    <div class="w-full bg-slate-700 rounded-full h-2">
                      <div
                        class="h-2 rounded-full transition-all"
                        :style="{
                          width: `${res.abundance * 100}%`,
                          backgroundColor: RESOURCES[type as ResourceType].color
                        }"
                      />
                    </div>
                  </div>
                  <span class="text-xs text-slate-500">
                    最大开采: {{ res.maxExtract }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="selectedRegion && !regions[selectedRegion]?.unlocked"
      class="bg-slate-800/60 rounded-xl p-8 border border-slate-700 text-center"
    >
      <div class="text-5xl mb-4">🔒</div>
      <h4 class="text-xl font-bold text-white mb-2">区域未解锁</h4>
      <p class="text-slate-400 mb-4">{{ REGIONS[selectedRegion].description }}</p>
      <div
        v-if="REGIONS[selectedRegion].unlockCondition"
        class="inline-block text-left bg-slate-900/50 rounded-lg p-4 text-sm"
      >
        <div class="text-slate-300 font-medium mb-2">解锁条件:</div>
        <div v-if="REGIONS[selectedRegion].unlockCondition?.tech" class="text-yellow-400">
          🧪 需要科技: {{ getTechName(REGIONS[selectedRegion].unlockCondition!.tech!) }}
        </div>
        <div v-if="REGIONS[selectedRegion].unlockCondition?.baseLevel" class="text-blue-400">
          🏠 需要基地等级: {{ REGIONS[selectedRegion].unlockCondition!.baseLevel }}
        </div>
        <div v-if="REGIONS[selectedRegion].unlockCondition?.completedRegion" class="text-green-400">
          🗺️ 需要完成区域: {{ REGIONS[REGIONS[selectedRegion].unlockCondition!.completedRegion!].name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../../stores/gameStore'
import { REGIONS, REGION_ORDER } from '../../config/regions'
import { RESOURCES } from '../../config/resources'
import { TECHNOLOGIES } from '../../config/technologies'
import type { RegionId, ResourceType, RegionTask } from '../../config/types'

const gameStore = useGameStore()
const { regions, gameState } = storeToRefs(gameStore)
const { changeRegion, addEventLog } = gameStore

const selectedRegion = ref<RegionId | null>(null)

const currentRegion = computed(() => gameState.value.currentRegion)

const getRegionIcon = (regionId: RegionId): string => {
  const icons: Record<RegionId, string> = {
    landing: '🚀',
    canyon: '🏜️',
    polar: '🧊',
    volcano: '🌋',
    ruins: '🛸'
  }
  return icons[regionId] || '🗺️'
}

const getRegionCardClass = (regionId: RegionId): string => {
  const unlocked = regions.value[regionId]?.unlocked
  if (!unlocked) return 'bg-slate-800/40 border-slate-700 opacity-60'
  return 'bg-slate-800/80 border-slate-600 hover:border-blue-500/50 hover:shadow-lg'
}

const getRegionBgClass = (regionId: RegionId): string => {
  const classes: Record<RegionId, string> = {
    landing: 'bg-blue-600/20',
    canyon: 'bg-orange-600/20',
    polar: 'bg-cyan-600/20',
    volcano: 'bg-red-600/20',
    ruins: 'bg-purple-600/20'
  }
  return classes[regionId] || 'bg-slate-600/20'
}

const getRegionProgressClass = (regionId: RegionId): string => {
  const explored = regions.value[regionId]?.explored || 0
  if (explored >= 100) return 'bg-green-500'
  if (explored >= 50) return 'bg-blue-500'
  return 'bg-yellow-500'
}

const getTempColor = (temp: number): string => {
  if (temp <= -80) return 'text-cyan-400'
  if (temp <= -40) return 'text-blue-400'
  if (temp <= 0) return 'text-green-400'
  if (temp <= 20) return 'text-yellow-400'
  return 'text-red-400'
}

const getTempPosition = (temp: number): number => {
  const min = -130
  const max = 30
  return Math.max(0, Math.min(100, ((temp - min) / (max - min)) * 100))
}

const getRadiationColor = (level: number): string => {
  if (level <= 2) return 'text-green-400'
  if (level <= 4) return 'text-yellow-400'
  if (level <= 6) return 'text-orange-400'
  return 'text-red-400'
}

const getRadiationLevel = (level: number): string => {
  if (level <= 1) return '极低'
  if (level <= 2) return '低'
  if (level <= 3) return '中等'
  if (level <= 4) return '较高'
  if (level <= 5) return '高'
  return '极高'
}

const getDustColor = (level: number): string => {
  if (level <= 1) return 'text-green-400'
  if (level <= 2) return 'text-yellow-400'
  if (level <= 3) return 'text-orange-400'
  return 'text-red-400'
}

const getDustLevel = (level: number): string => {
  if (level <= 1) return '平静'
  if (level <= 2) return '轻微'
  if (level <= 3) return '中等'
  if (level <= 4) return '严重'
  return '沙尘暴'
}

const getTaskIcon = (type: RegionTask['type']): string => {
  const icons = {
    explore: '🔍',
    collect: '📦',
    build: '🏗️',
    research: '🔬'
  }
  return icons[type] || '📋'
}

const getTaskTypeName = (type: RegionTask['type']): string => {
  const names = {
    explore: '探索',
    collect: '采集',
    build: '建造',
    research: '研究'
  }
  return names[type] || type
}

const getTaskTypeClass = (type: RegionTask['type']): string => {
  const classes = {
    explore: 'bg-blue-500/20 text-blue-400',
    collect: 'bg-green-500/20 text-green-400',
    build: 'bg-orange-500/20 text-orange-400',
    research: 'bg-purple-500/20 text-purple-400'
  }
  return classes[type] || 'bg-slate-500/20 text-slate-400'
}

const getTechName = (techId: string): string => {
  return TECHNOLOGIES.find(t => t.id === techId)?.name || techId
}

const selectRegion = (regionId: RegionId): void => {
  selectedRegion.value = regionId
}

const travelToRegion = (): void => {
  if (selectedRegion.value) {
    changeRegion(selectedRegion.value)
    addEventLog(`已前往 ${REGIONS[selectedRegion.value].name}`, 'info')
  }
}

const toggleRover = (): void => {
  if (!selectedRegion.value) return

  const region = regions.value[selectedRegion.value]
  if (region) {
    region.roverPresent = !region.roverPresent
    if (region.roverPresent) {
      addEventLog(`火星车已派遣至 ${REGIONS[selectedRegion.value].name}`, 'info')
    } else {
      addEventLog(`火星车已从 ${REGIONS[selectedRegion.value].name} 召回`, 'info')
    }
  }
}
</script>

<style scoped>
.region-card {
  backdrop-filter: blur(8px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
