<template>
  <div class="event-log bg-slate-900/90 rounded-xl p-4 border border-slate-700">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-bold text-white flex items-center gap-2">
        <span>📜</span> 事件日志
      </h3>
      <div class="flex items-center gap-2">
        <button
          v-for="filter in filters"
          :key="filter.value"
          @click="toggleFilter(filter.value)"
          class="text-xs px-3 py-1 rounded-full transition-all flex items-center gap-1"
          :class="activeFilters.includes(filter.value)
            ? filter.activeClass
            : 'bg-slate-800 text-slate-500 hover:bg-slate-700'"
        >
          <span>{{ filter.icon }}</span>
          <span>{{ filter.label }}</span>
        </button>
        <button
          @click="clearLog"
          class="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300 transition-all"
        >
          清空
        </button>
      </div>
    </div>

    <div
      ref="logContainer"
      class="log-container h-80 overflow-y-auto pr-2 space-y-2"
    >
      <div
        v-for="(log, index) in filteredLogs"
        :key="index"
        class="log-item p-3 rounded-lg border transition-all hover:bg-slate-800/80"
        :class="getLogItemClass(log.type)"
        :style="{ animationDelay: `${index * 50}ms` }"
      >
        <div class="flex items-start gap-3">
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            :class="getLogIconClass(log.type)"
          >
            {{ getLogIcon(log.type) }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-slate-200 break-words">{{ log.message }}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs text-slate-500 flex items-center gap-1">
                <span>⏰</span>
                {{ log.time }}
              </span>
              <span
                class="text-xs px-2 py-0.5 rounded-full"
                :class="getLogTypeClass(log.type)"
              >
                {{ getLogTypeName(log.type) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="filteredLogs.length === 0"
        class="flex flex-col items-center justify-center h-full text-slate-500"
      >
        <span class="text-4xl mb-2">📭</span>
        <p class="text-sm">暂无事件记录</p>
        <p class="text-xs mt-1">开始游戏后，重要事件将显示在这里</p>
      </div>
    </div>

    <div
      v-if="unreadCount > 0"
      class="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between"
    >
      <span class="text-sm text-slate-400">
        还有 <span class="text-blue-400 font-medium">{{ unreadCount }}</span> 条新消息
      </span>
      <button
        @click="scrollToBottom"
        class="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
      >
        <span>↓</span> 滚动到底部
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../../stores/gameStore'

const gameStore = useGameStore()
const { eventLog } = storeToRefs(gameStore)

const logContainer = ref<HTMLDivElement | null>(null)
const activeFilters = ref<string[]>(['info', 'success', 'warning', 'danger'])
const lastLogLength = ref(0)

const filters = [
  { value: 'info', label: '信息', icon: 'ℹ️', activeClass: 'bg-blue-600/20 text-blue-400' },
  { value: 'success', label: '成功', icon: '✅', activeClass: 'bg-green-600/20 text-green-400' },
  { value: 'warning', label: '警告', icon: '⚠️', activeClass: 'bg-yellow-600/20 text-yellow-400' },
  { value: 'danger', label: '危险', icon: '🚨', activeClass: 'bg-red-600/20 text-red-400' }
]

const filteredLogs = computed(() => {
  return eventLog.value.filter(log => activeFilters.value.includes(log.type))
})

const unreadCount = computed(() => {
  const newLogs = eventLog.value.length - lastLogLength.value
  return Math.max(0, newLogs)
})

const toggleFilter = (filter: string): void => {
  const index = activeFilters.value.indexOf(filter)
  if (index > -1) {
    if (activeFilters.value.length > 1) {
      activeFilters.value.splice(index, 1)
    }
  } else {
    activeFilters.value.push(filter)
  }
}

const getLogIcon = (type: string): string => {
  const icons: Record<string, string> = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    danger: '🚨',
    discovery: '🔍',
    disaster: '🌪️',
    opportunity: '🎁',
    malfunction: '⚙️'
  }
  return icons[type] || '📝'
}

const getLogIconClass = (type: string): string => {
  const classes: Record<string, string> = {
    info: 'bg-blue-500/20 text-blue-400',
    success: 'bg-green-500/20 text-green-400',
    warning: 'bg-yellow-500/20 text-yellow-400',
    danger: 'bg-red-500/20 text-red-400',
    discovery: 'bg-purple-500/20 text-purple-400',
    disaster: 'bg-red-600/20 text-red-500',
    opportunity: 'bg-emerald-500/20 text-emerald-400',
    malfunction: 'bg-orange-500/20 text-orange-400'
  }
  return classes[type] || 'bg-slate-500/20 text-slate-400'
}

const getLogItemClass = (type: string): string => {
  const classes: Record<string, string> = {
    info: 'bg-slate-800/40 border-slate-700',
    success: 'bg-green-900/10 border-green-500/20',
    warning: 'bg-yellow-900/10 border-yellow-500/20',
    danger: 'bg-red-900/10 border-red-500/20',
    discovery: 'bg-purple-900/10 border-purple-500/20',
    disaster: 'bg-red-900/20 border-red-600/30',
    opportunity: 'bg-emerald-900/10 border-emerald-500/20',
    malfunction: 'bg-orange-900/10 border-orange-500/20'
  }
  return classes[type] || 'bg-slate-800/40 border-slate-700'
}

const getLogTypeClass = (type: string): string => {
  const classes: Record<string, string> = {
    info: 'bg-blue-500/10 text-blue-400',
    success: 'bg-green-500/10 text-green-400',
    warning: 'bg-yellow-500/10 text-yellow-400',
    danger: 'bg-red-500/10 text-red-400',
    discovery: 'bg-purple-500/10 text-purple-400',
    disaster: 'bg-red-600/10 text-red-500',
    opportunity: 'bg-emerald-500/10 text-emerald-400',
    malfunction: 'bg-orange-500/10 text-orange-400'
  }
  return classes[type] || 'bg-slate-500/10 text-slate-400'
}

const getLogTypeName = (type: string): string => {
  const names: Record<string, string> = {
    info: '信息',
    success: '成功',
    warning: '警告',
    danger: '危险',
    discovery: '发现',
    disaster: '灾难',
    opportunity: '机遇',
    malfunction: '故障'
  }
  return names[type] || '事件'
}

const scrollToBottom = (): void => {
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
      lastLogLength.value = eventLog.value.length
    }
  })
}

const clearLog = (): void => {
  eventLog.value.length = 0
  lastLogLength.value = 0
}

watch(
  () => eventLog.value.length,
  () => {
    if (logContainer.value) {
      const { scrollTop, scrollHeight, clientHeight } = logContainer.value
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50

      if (isAtBottom) {
        scrollToBottom()
      }
    }
  }
)
</script>

<style scoped>
.log-container::-webkit-scrollbar {
  width: 6px;
}

.log-container::-webkit-scrollbar-track {
  background: #1e293b;
  border-radius: 3px;
}

.log-container::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 3px;
}

.log-container::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

.log-item {
  animation: slideIn 0.3s ease-out forwards;
  opacity: 0;
  transform: translateY(-10px);
}

@keyframes slideIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
