<template>
  <div class="environment-status bg-slate-900/90 rounded-xl p-4 border border-slate-700">
    <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
      <span>🌍</span> 环境状态
    </h3>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm text-slate-400 flex items-center gap-1">
            <span>🌡️</span> 温度
          </span>
          <span
            class="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
            :class="getTempTrendClass()"
          >
            {{ getTempTrendArrow() }}
            {{ getTempTrend() }}
          </span>
        </div>

        <div class="text-center mb-3">
          <span
            class="text-4xl font-bold"
            :class="getTempColor(currentEnv.temperature.current)"
          >
            {{ currentEnv.temperature.current }}°C
          </span>
        </div>

        <div class="relative h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            class="absolute h-full bg-gradient-to-r from-cyan-500 via-green-500 to-red-500 rounded-full"
            style="left: 0; width: 100%;"
          />
          <div
            class="absolute top-1/2 w-4 h-4 bg-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 border-2 border-slate-800"
            :style="{ left: `${getTempPosition(currentEnv.temperature.current)}%` }"
          />
        </div>

        <div class="flex justify-between text-xs text-slate-500 mt-2">
          <span>{{ currentEnv.temperature.min }}°C</span>
          <span>{{ currentEnv.temperature.max }}°C</span>
        </div>
      </div>

      <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm text-slate-400 flex items-center gap-1">
            <span>☢️</span> 辐射等级
          </span>
          <span
            class="text-xs px-2 py-0.5 rounded-full"
            :class="getRadiationSeverityClass()"
          >
            {{ getRadiationSeverity() }}
          </span>
        </div>

        <div class="relative w-full aspect-square max-w-32 mx-auto mb-3">
          <svg class="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#334155"
              stroke-width="10"
              stroke-linecap="round"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              :stroke="getRadiationColor(currentEnv.radiation)"
              stroke-width="10"
              stroke-linecap="round"
              :stroke-dasharray="`${getRadiationDash()} 251.2`"
              :stroke-dashoffset="62.8"
              transform="rotate(-90 50 50)"
              class="transition-all duration-500"
            />
            <text
              x="50"
              y="55"
              text-anchor="middle"
              class="font-bold"
              :fill="getRadiationColor(currentEnv.radiation)"
              style="font-size: 24px;"
            >
              {{ currentEnv.radiation }}
            </text>
          </svg>
        </div>

        <div class="flex justify-center gap-1">
          <div
            v-for="i in 5"
            :key="i"
            class="w-full h-2 rounded-full transition-all"
            :class="i <= currentEnv.radiation ? getRadiationBgClass(i) : 'bg-slate-700'"
          />
        </div>
        <div class="text-center text-xs text-slate-500 mt-2">
          {{ getRadiationLevel(currentEnv.radiation) }}
        </div>
      </div>

      <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm text-slate-400 flex items-center gap-1">
            <span>🌪️</span> 沙尘等级
          </span>
          <span
            class="text-xs px-2 py-0.5 rounded-full"
            :class="getDustSeverityClass()"
          >
            {{ getDustSeverity() }}
          </span>
        </div>

        <div class="text-center mb-4">
          <div class="relative inline-block">
            <span class="text-5xl">{{ getDustIcon() }}</span>
            <span
              v-if="currentEnv.dustLevel >= 3"
              class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center animate-pulse"
            >
              !
            </span>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-400">能见度</span>
            <span :class="getDustColor(currentEnv.dustLevel)">
              {{ getVisibility() }}
            </span>
          </div>
          <div class="w-full bg-slate-700 rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all duration-500"
              :class="getDustBgClass(currentEnv.dustLevel)"
              :style="{ width: `${(currentEnv.dustLevel / 5) * 100}%` }"
            />
          </div>
          <div class="flex justify-between text-xs text-slate-500">
            <span>清晰</span>
            <span>沙尘暴</span>
          </div>
        </div>

        <div
          v-if="currentEnv.dustLevel >= 4"
          class="mt-3 p-2 bg-red-900/20 border border-red-500/30 rounded-lg text-xs text-red-400 text-center"
        >
          ⚠️ 沙尘暴警告：太阳能效率降低50%
        </div>
      </div>

      <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm text-slate-400 flex items-center gap-1">
            <span>⏰</span> 昼夜状态
          </span>
          <span
            class="text-xs px-2 py-0.5 rounded-full"
            :class="timeSystem.isNight ? 'bg-indigo-500/20 text-indigo-400' : 'bg-yellow-500/20 text-yellow-400'"
          >
            {{ timeSystem.isNight ? '🌙 夜晚' : '☀️ 白天' }}
          </span>
        </div>

        <div class="relative h-24 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-lg overflow-hidden mb-3">
          <div
            class="absolute w-10 h-10 transition-all duration-1000 ease-in-out"
            :style="getSunMoonPosition()"
          >
            <span class="text-3xl">{{ timeSystem.isNight ? '🌙' : '☀️' }}</span>
          </div>

          <div
            class="absolute bottom-0 left-0 right-0 h-8"
            :style="{ background: `linear-gradient(to top, ${getSkyGradient()} 0%, transparent 100%)` }"
          />

          <div
            v-if="timeSystem.isNight"
            class="absolute inset-0 overflow-hidden"
          >
            <span
              v-for="i in 20"
              :key="i"
              class="absolute text-white animate-twinkle"
              :style="{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 60}%`,
                fontSize: `${Math.random() * 4 + 4}px`,
                animationDelay: `${Math.random() * 2}s`
              }"
            >
              ✦
            </span>
          </div>
        </div>

        <div class="text-center mb-3">
          <div class="text-2xl font-bold text-white">
            {{ timeSystem.getTimeString() }}
          </div>
          <div class="text-xs text-slate-500 mt-1">
            太阳强度: {{ Math.floor(timeSystem.sunIntensity * 100) }}%
          </div>
        </div>

        <div class="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-indigo-600 via-yellow-500 to-indigo-600 transition-all duration-1000"
            :style="{ width: `${timeSystem.dayProgress * 100}%` }"
          />
        </div>
        <div class="flex justify-between text-xs text-slate-500 mt-1">
          <span>日出</span>
          <span>日落</span>
        </div>
      </div>
    </div>

    <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-slate-800/40 rounded-lg p-3 border border-slate-700">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🛡️</span>
          <div>
            <div class="text-sm text-slate-400">环境抗性</div>
            <div class="flex gap-3 mt-1">
              <div class="flex items-center gap-1">
                <span class="text-cyan-400 text-xs">❄️</span>
                <span class="text-xs text-slate-300">
                  {{ Math.floor((environmentResist.cold || 0) * 100) }}%
                </span>
              </div>
              <div class="flex items-center gap-1">
                <span class="text-yellow-400 text-xs">☀️</span>
                <span class="text-xs text-slate-300">
                  {{ Math.floor((environmentResist.heat || 0) * 100) }}%
                </span>
              </div>
              <div class="flex items-center gap-1">
                <span class="text-orange-400 text-xs">☢️</span>
                <span class="text-xs text-slate-300">
                  {{ Math.floor((environmentResist.radiation || 0) * 100) }}%
                </span>
              </div>
              <div class="flex items-center gap-1">
                <span class="text-orange-300 text-xs">🌪️</span>
                <span class="text-xs text-slate-300">
                  {{ Math.floor((environmentResist.dust || 0) * 100) }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-slate-800/40 rounded-lg p-3 border border-slate-700">
        <div class="flex items-center gap-2">
          <span class="text-2xl">📍</span>
          <div>
            <div class="text-sm text-slate-400">当前位置</div>
            <div class="text-white font-medium">
              {{ currentRegionName }}
            </div>
            <div class="text-xs text-slate-500">
              {{ currentRegionCoords }}
            </div>
          </div>
        </div>
      </div>

      <div class="bg-slate-800/40 rounded-lg p-3 border border-slate-700">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🏠</span>
          <div>
            <div class="text-sm text-slate-400">基地状态</div>
            <div class="flex items-center gap-3">
              <span class="text-white font-medium">
                等级 {{ baseLevel }}
              </span>
              <span
                class="text-xs px-2 py-0.5 rounded-full"
                :class="gameState.isPaused ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'"
              >
                {{ gameState.isPaused ? '⏸️ 暂停' : '▶️ 运行中' }}
              </span>
              <span class="text-xs text-slate-500">
                {{ totalPlayTime }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../../stores/gameStore'
import { REGIONS } from '../../config/regions'
import { timeSystem } from '../../engine/TimeSystem'
import type { RegionEnvironment } from '../../config/types'

const gameStore = useGameStore()
const { gameState, currentRegionState, environmentResist } = storeToRefs(gameStore)

const tempHistory = ref<number[]>([])

const currentEnv = computed<RegionEnvironment>(() => {
  return currentRegionState.value?.environment || {
    temperature: { min: -60, max: -20, current: -40 },
    radiation: 2,
    dustLevel: 1
  }
})

const currentRegionName = computed(() => {
  return REGIONS[gameState.value.currentRegion]?.name || '未知区域'
})

const currentRegionCoords = computed(() => {
  const pos = REGIONS[gameState.value.currentRegion]?.position
  return pos ? `${pos.lat}, ${pos.lng}` : ''
})

const baseLevel = computed(() => gameState.value.baseLevel)

const totalPlayTime = computed(() => {
  const seconds = gameState.value.totalPlayTime
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
})

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

const getTempTrend = (): string => {
  if (tempHistory.value.length < 2) return '稳定'
  const recent = tempHistory.value.slice(-5)
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length
  const last = recent[recent.length - 1]
  const diff = last - avg

  if (Math.abs(diff) < 0.5) return '稳定'
  if (diff > 0) return '上升'
  return '下降'
}

const getTempTrendArrow = (): string => {
  const trend = getTempTrend()
  if (trend === '上升') return '↑'
  if (trend === '下降') return '↓'
  return '→'
}

const getTempTrendClass = (): string => {
  const trend = getTempTrend()
  if (trend === '上升') return 'bg-red-500/20 text-red-400'
  if (trend === '下降') return 'bg-blue-500/20 text-blue-400'
  return 'bg-slate-500/20 text-slate-400'
}

const getRadiationColor = (level: number): string => {
  if (level <= 2) return '#22C55E'
  if (level <= 4) return '#EAB308'
  if (level <= 6) return '#F97316'
  return '#EF4444'
}

const getRadiationBgClass = (level: number): string => {
  if (level <= 2) return 'bg-green-500'
  if (level <= 4) return 'bg-yellow-500'
  if (level <= 6) return 'bg-orange-500'
  return 'bg-red-500'
}

const getRadiationDash = (): number => {
  return (currentEnv.value.radiation / 5) * 251.2 * 0.75
}

const getRadiationLevel = (level: number): string => {
  if (level <= 1) return '极低'
  if (level <= 2) return '低'
  if (level <= 3) return '中等'
  if (level <= 4) return '较高'
  if (level <= 5) return '高'
  return '极高'
}

const getRadiationSeverity = (): string => {
  const level = currentEnv.value.radiation
  if (level <= 2) return '安全'
  if (level <= 4) return '注意'
  return '危险'
}

const getRadiationSeverityClass = (): string => {
  const severity = getRadiationSeverity()
  if (severity === '安全') return 'bg-green-500/20 text-green-400'
  if (severity === '注意') return 'bg-yellow-500/20 text-yellow-400'
  return 'bg-red-500/20 text-red-400'
}

const getDustColor = (level: number): string => {
  if (level <= 1) return 'text-green-400'
  if (level <= 2) return 'text-yellow-400'
  if (level <= 3) return 'text-orange-400'
  return 'text-red-400'
}

const getDustBgClass = (level: number): string => {
  if (level <= 1) return 'bg-green-500'
  if (level <= 2) return 'bg-yellow-500'
  if (level <= 3) return 'bg-orange-500'
  return 'bg-red-500'
}

const getDustLevel = (level: number): string => {
  if (level <= 1) return '平静'
  if (level <= 2) return '轻微'
  if (level <= 3) return '中等'
  if (level <= 4) return '严重'
  return '沙尘暴'
}

const getDustIcon = (): string => {
  const level = currentEnv.value.dustLevel
  if (level <= 1) return '🌤️'
  if (level <= 2) return '🌥️'
  if (level <= 3) return '🌪️'
  if (level <= 4) return '🌪️'
  return '🏜️'
}

const getDustSeverity = (): string => {
  const level = currentEnv.value.dustLevel
  if (level <= 1) return '良好'
  if (level <= 2) return '一般'
  if (level <= 3) return '较差'
  return '危险'
}

const getDustSeverityClass = (): string => {
  const severity = getDustSeverity()
  if (severity === '良好') return 'bg-green-500/20 text-green-400'
  if (severity === '一般') return 'bg-yellow-500/20 text-yellow-400'
  if (severity === '较差') return 'bg-orange-500/20 text-orange-400'
  return 'bg-red-500/20 text-red-400'
}

const getVisibility = (): string => {
  const level = currentEnv.value.dustLevel
  if (level <= 1) return '极佳'
  if (level <= 2) return '良好'
  if (level <= 3) return '一般'
  if (level <= 4) return '较差'
  return '极差'
}

const getSunMoonPosition = (): string => {
  const progress = timeSystem.dayProgress
  const height = 96
  const width = 100

  const x = progress * width
  const arcHeight = height * 0.6
  const y = height - arcHeight * Math.sin(progress * Math.PI) - 40

  return `left: ${x}%; top: ${y}px; transform: translateX(-50%);`
}

const getSkyGradient = (): string => {
  const sky = timeSystem.getSkyColor()
  return `rgb(${Math.floor(sky.r * 255)}, ${Math.floor(sky.g * 255)}, ${Math.floor(sky.b * 255)})`
}

let updateInterval: number | null = null

onMounted(() => {
  tempHistory.value.push(currentEnv.value.temperature.current)

  updateInterval = window.setInterval(() => {
    tempHistory.value.push(currentEnv.value.temperature.current)
    if (tempHistory.value.length > 30) {
      tempHistory.value.shift()
    }
  }, 1000)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style scoped>
.animate-twinkle {
  animation: twinkle 2s ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
</style>
