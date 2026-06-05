<template>
  <div class="resource-panel bg-slate-900/90 rounded-xl p-4 border border-slate-700">
    <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
      <span>📊</span> 资源监控
    </h3>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      <div
        v-for="type in RESOURCE_ORDER"
        :key="type"
        class="resource-card bg-slate-800/80 rounded-lg p-3 border transition-all"
        :class="[
          getWarningClass(type),
          { 'border-red-500/50 animate-pulse': isCritical(type) },
          { 'border-yellow-500/50': isWarning(type) && !isCritical(type) },
          { 'border-slate-600': !isWarning(type) && !isCritical(type) }
        ]"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-xl">{{ RESOURCES[type].icon }}</span>
            <span class="text-sm font-medium text-slate-300">{{ RESOURCES[type].name }}</span>
          </div>
          <span
            v-if="isWarning(type)"
            class="text-xs px-2 py-0.5 rounded-full"
            :class="isCritical(type) ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'"
          >
            {{ isCritical(type) ? '危险' : '警告' }}
          </span>
        </div>

        <div class="text-2xl font-bold mb-2" :style="{ color: RESOURCES[type].color }">
          {{ formatNumber(resources[type].current) }}
          <span class="text-sm text-slate-500 font-normal">/ {{ formatNumber(resources[type].max) }}</span>
        </div>

        <div class="w-full bg-slate-700 rounded-full h-2 mb-2">
          <div
            class="h-2 rounded-full transition-all duration-500"
            :style="{
              width: `${resources[type].ratio * 100}%`,
              backgroundColor: RESOURCES[type].color
            }"
          />
        </div>

        <div class="flex justify-between text-xs">
          <span class="text-green-400">+{{ formatNumber(resources[type].production) }}/s</span>
          <span class="text-red-400">-{{ formatNumber(resources[type].consumption) }}/s</span>
          <span
            :class="netProduction[type] >= 0 ? 'text-green-400' : 'text-red-400'"
          >
            {{ netProduction[type] >= 0 ? '+' : '' }}{{ formatNumber(netProduction[type]) }}/s
          </span>
        </div>

        <div
          v-if="getTimeToEmpty(type) !== null"
          class="mt-2 text-xs text-red-400"
        >
          ⚠️ 预计 {{ getTimeToEmpty(type) }} 秒后耗尽
        </div>
      </div>
    </div>

    <div class="bg-slate-800/60 rounded-lg p-4">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-sm font-medium text-slate-300">生产/消耗趋势</h4>
        <div class="flex gap-2">
          <button
            v-for="range in trendRanges"
            :key="range.value"
            @click="selectedRange = range.value"
            class="text-xs px-3 py-1 rounded transition-colors"
            :class="selectedRange === range.value ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'"
          >
            {{ range.label }}
          </button>
        </div>
      </div>
      <canvas ref="chartCanvas" class="w-full h-48" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Chart, registerables } from 'chart.js'
import { useGameStore } from '../../stores/gameStore'
import { RESOURCES, RESOURCE_ORDER } from '../../config/resources'
import type { ResourceType } from '../../config/types'

Chart.register(...registerables)

const gameStore = useGameStore()
const { resources, netProduction } = storeToRefs(gameStore)

const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const selectedRange = ref<'1m' | '5m' | '15m'>('1m')
const trendRanges = [
  { label: '1分钟', value: '1m' as const },
  { label: '5分钟', value: '5m' as const },
  { label: '15分钟', value: '15m' as const }
]

const historyData = ref<Record<string, { time: string; production: number; consumption: number }[]>>({})

RESOURCE_ORDER.forEach(type => {
  historyData.value[type] = []
})

const formatNumber = (num: number): string => {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toFixed(1)
}

const isWarning = (type: ResourceType): boolean => {
  return resources[type]?.ratio < 0.3
}

const isCritical = (type: ResourceType): boolean => {
  return resources[type]?.ratio < 0.1
}

const getWarningClass = (type: ResourceType): string => {
  if (isCritical(type)) return 'bg-red-900/20'
  if (isWarning(type)) return 'bg-yellow-900/20'
  return ''
}

const getTimeToEmpty = (type: ResourceType): string | null => {
  const net = netProduction.value[type]
  if (net >= 0) return null
  const seconds = Math.floor(resources[type].current / Math.abs(net))
  if (seconds > 600) return null
  if (seconds >= 60) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
  return `${seconds}秒`
}

const initChart = () => {
  if (!chartCanvas.value) return

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: RESOURCE_ORDER.slice(0, 5).map(type => ({
        label: RESOURCES[type].name + ' 净产出',
        data: [],
        borderColor: RESOURCES[type].color,
        backgroundColor: RESOURCES[type].color + '20',
        tension: 0.4,
        fill: false,
        pointRadius: 0,
        borderWidth: 2
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#94a3b8',
            font: { size: 11 },
            boxWidth: 12
          }
        },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#f1f5f9',
          bodyColor: '#cbd5e1',
          borderColor: '#334155',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { color: '#33415540' },
          ticks: { color: '#64748b', font: { size: 10 } }
        },
        y: {
          grid: { color: '#33415540' },
          ticks: { color: '#64748b', font: { size: 10 } }
        }
      }
    }
  })
}

const updateChart = () => {
  if (!chartInstance) return

  const maxPoints = selectedRange.value === '1m' ? 60 : selectedRange.value === '5m' ? 150 : 300
  const data = historyData.value

  const labels = data[RESOURCE_ORDER[0]].slice(-maxPoints).map(d => d.time)

  chartInstance.data.labels = labels
  chartInstance.data.datasets = RESOURCE_ORDER.slice(0, 5).map(type => ({
    label: RESOURCES[type].name + ' 净产出',
    data: data[type].slice(-maxPoints).map(d => d.production - d.consumption),
    borderColor: RESOURCES[type].color,
    backgroundColor: RESOURCES[type].color + '20',
    tension: 0.4,
    fill: false,
    pointRadius: 0,
    borderWidth: 2
  }))

  chartInstance.update('none')
}

const recordDataPoint = () => {
  const now = new Date()
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

  RESOURCE_ORDER.forEach(type => {
    historyData.value[type].push({
      time: timeStr,
      production: resources[type].production,
      consumption: resources[type].consumption
    })

    const maxPoints = 300
    if (historyData.value[type].length > maxPoints) {
      historyData.value[type].shift()
    }
  })

  updateChart()
}

let dataInterval: number | null = null

watch(selectedRange, () => {
  updateChart()
})

onMounted(() => {
  initChart()
  dataInterval = window.setInterval(recordDataPoint, 1000)
})

onUnmounted(() => {
  if (dataInterval) clearInterval(dataInterval)
  if (chartInstance) chartInstance.destroy()
})
</script>

<style scoped>
.resource-card {
  backdrop-filter: blur(8px);
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
