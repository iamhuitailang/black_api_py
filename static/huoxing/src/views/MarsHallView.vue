<template>
  <div class="w-screen h-screen bg-space relative overflow-hidden">
    <div class="absolute inset-0 z-0">
      <StarField :star-count="8000" />
    </div>

    <div class="absolute inset-0 z-0">
      <DustParticles :wind-speed="0.5" :density="0.6" />
    </div>

    <div class="relative z-10 h-full flex flex-col">
      <GameHeader
        :game-state="gameStore.gameState"
        :resources="gameStore.resources"
        :mars-time="marsTime"
        :event-count="gameStore.activeEvents.length"
        @toggle-pause="togglePause"
        @set-speed="setSpeed"
        @open-events="showEventLog = true"
      />

      <div class="flex-1 flex relative overflow-hidden">
        <GameSidebar
          :current-page="currentPage"
          :current-region="gameStore.gameState.currentRegion"
          :regions="gameStore.unlockedRegions"
          :event-count="gameStore.activeEvents.length"
          @navigate="handleNavigate"
        />

        <div class="flex-1 relative overflow-hidden">
          <div class="absolute inset-0">
            <MarsGlobe
              ref="marsGlobeRef"
              @region-click="handleRegionClick"
              @region-hover="handleRegionHover"
            />
          </div>

          <div v-if="hoveredRegion" class="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
            <SciFiPanel :title="hoveredRegion.name" class="text-center min-w-64" glowing>
              <p class="text-gray-400 text-sm">{{ hoveredRegion.description }}</p>
              <div class="mt-2 flex justify-center gap-4 text-xs">
                <span :style="{ color: getRiskLevelColor(hoveredRegion.environment.radiation) }">
                  辐射: {{ hoveredRegion.environment.radiation }}/10
                </span>
                <span :style="{ color: getRiskLevelColor(hoveredRegion.environment.dustLevel) }">
                  沙尘: {{ hoveredRegion.environment.dustLevel.toFixed(1) }}/10
                </span>
              </div>
            </SciFiPanel>
          </div>

          <div class="absolute right-2 top-16 z-40 w-64 space-y-2 max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
            <EnvironmentStatus />

            <SciFiPanel title="区域概览" border-color="orange">
              <div class="p-3 space-y-2">
                <div v-for="region in regionList" :key="region.id" class="flex items-center gap-2">
                  <div
                    :class="[
                      'w-2 h-2 rounded-full flex-shrink-0',
                      region.unlocked ? 'bg-green-500' : 'bg-gray-600'
                    ]"
                  />
                  <span :class="['flex-1 text-xs truncate', region.unlocked ? 'text-white' : 'text-gray-600']">
                    {{ REGIONS[region.id].name }}
                  </span>
                  <span class="text-[10px] text-gray-500 flex-shrink-0">
                    {{ region.unlocked ? `${region.explored.toFixed(0)}%` : '锁定' }}
                  </span>
                </div>
              </div>
            </SciFiPanel>
          </div>

          <div class="absolute left-2 bottom-4 z-40">
            <SciFiPanel title="操作提示" class="w-52">
              <div class="p-2 text-[10px] text-gray-400 space-y-1">
                <p>🖱️ 左键拖动 - 旋转视角</p>
                <p>🔍 滚轮 - 缩放</p>
                <p>👆 点击标记 - 进入区域</p>
                <p>💡 悬停标记 - 查看详情</p>
              </div>
            </SciFiPanel>
          </div>
        </div>
      </div>
    </div>

    <EventModal
      v-if="pendingEvent"
      :config="currentEventConfig"
      :active-event="pendingEvent"
      :resources="gameStore.resources"
      :show="!!pendingEvent"
      @choice="handleEventChoice"
      @close="closePendingEvent"
    />

    <EventLog
      v-if="showEventLog"
      :event-log="gameStore.eventLog"
      @close="showEventLog = false"
    />

    <div v-if="gameStore.gameState.victory" class="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <SciFiPanel title="🎉 殖民成功！" border-color="green" class="text-center w-96">
        <div class="p-8">
          <div class="text-6xl mb-6">🏆</div>
          <h2 class="text-2xl font-bold text-green-400 mb-4">恭喜完成火星殖民！</h2>
          <p class="text-gray-400 mb-6">你成功在火星建立了人类的第一个永久殖民地，所有区域已探索完毕，所有科技已解锁。</p>
          <p class="text-sm text-gray-500 mb-6">
            总用时: {{ formatTime(gameStore.gameState.totalPlayTime) }}
          </p>
          <button
            @click="backToLaunch"
            class="px-8 py-3 bg-green-600 rounded-lg font-bold hover:bg-green-500 transition-colors"
          >
            返回主菜单
          </button>
        </div>
      </SciFiPanel>
    </div>

    <div v-if="gameStore.gameState.gameOver" class="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <SciFiPanel title="💀 殖民失败" border-color="red" class="text-center w-96">
        <div class="p-8">
          <div class="text-6xl mb-6">☠️</div>
          <h2 class="text-2xl font-bold text-red-400 mb-4">基地资源耗尽</h2>
          <p class="text-gray-400 mb-6">很遗憾，你的殖民地无法继续维持。希望下次能做得更好！</p>
          <p class="text-sm text-gray-500 mb-6">
            坚持了: {{ formatTime(gameStore.gameState.totalPlayTime) }}
          </p>
          <div class="flex gap-3 justify-center">
            <button
              @click="retryGame"
              class="px-6 py-3 bg-mars rounded-lg font-bold hover:bg-orange-600 transition-colors"
            >
              重新开始
            </button>
            <button
              @click="backToLaunch"
              class="px-6 py-3 bg-gray-700 rounded-lg font-bold hover:bg-gray-600 transition-colors"
            >
              返回主菜单
            </button>
          </div>
        </div>
      </SciFiPanel>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import StarField from '@/components/three/StarField.vue'
import DustParticles from '@/components/three/DustParticles.vue'
import MarsGlobe from '@/components/three/MarsGlobe.vue'
import GameHeader from '@/components/layout/GameHeader.vue'
import GameSidebar from '@/components/layout/GameSidebar.vue'
import SciFiPanel from '@/components/ui/SciFiPanel.vue'
import EventModal from '@/components/ui/EventModal.vue'
import EventLog from '@/components/game/EventLog.vue'
import EnvironmentStatus from '@/components/game/EnvironmentStatus.vue'
import { useGameStore } from '@/stores/gameStore'
import { gameEngine } from '@/engine/GameEngine'
import { timeSystem } from '@/engine/TimeSystem'
import { EVENTS } from '@/config/events'
import { REGIONS } from '@/config/regions'
import type { RegionId } from '@/config/types'
import { getRiskLevelColor, formatTime } from '@/utils/formatters'

const router = useRouter()
const gameStore = useGameStore()
const { regions } = storeToRefs(gameStore)

const marsGlobeRef = ref<InstanceType<typeof MarsGlobe> | null>(null)
const currentPage = ref<'base' | 'explore' | 'tech' | 'hall'>('hall')
const hoveredRegion = ref<any>(null)
const showEventLog = ref(false)
const marsTime = ref('')

const regionList = computed(() => Object.values(regions.value))

const pendingEvent = computed(() => gameEngine.getPendingEvent())

const currentEventConfig = computed(() => {
  if (!pendingEvent.value) return null
  return EVENTS.find(e => e.id === pendingEvent.value!.configId) || null
})

let timeUpdateInterval: number | null = null
let initCheckInterval: number | null = null

onMounted(() => {
  const checkInit = () => {
    if (gameStore.initialized) {
      if (initCheckInterval) {
        clearInterval(initCheckInterval)
        initCheckInterval = null
      }
      updateMarsTime()
      timeUpdateInterval = window.setInterval(updateMarsTime, 1000)
    }
  }
  
  if (gameStore.initialized) {
    checkInit()
  } else {
    initCheckInterval = window.setInterval(checkInit, 100)
    
    setTimeout(() => {
      if (!gameStore.initialized && initCheckInterval) {
        clearInterval(initCheckInterval)
        router.push('/')
      }
    }, 3000)
  }
})

onUnmounted(() => {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval)
  }
  if (initCheckInterval) {
    clearInterval(initCheckInterval)
  }
})

function updateMarsTime() {
  marsTime.value = timeSystem.getTimeString()
}

function handleRegionClick(regionId: RegionId) {
  if (gameStore.regions[regionId]?.unlocked) {
    gameStore.changeRegion(regionId)
    marsGlobeRef.value?.focusOnRegion(regionId)
  }
}

function handleRegionHover(regionId: RegionId | null) {
  if (regionId && gameStore.regions[regionId]?.unlocked) {
    hoveredRegion.value = {
      ...REGIONS[regionId],
      ...gameStore.regions[regionId]
    }
  } else {
    hoveredRegion.value = null
  }
}

function handleNavigate(page: string) {
  if (page === 'hall') {
    currentPage.value = page
  } else {
    router.push(`/${page}`)
  }
}

function togglePause() {
  if (gameStore.gameState.isPaused) {
    gameEngine.resume()
  } else {
    gameEngine.pause()
  }
}

function setSpeed(speed: number) {
  gameEngine.setSpeed(speed)
}

function handleEventChoice(choiceId: string) {
  gameEngine.handleEventChoice(choiceId)
}

function closePendingEvent() {
  gameEngine.clearPendingEvent()
}

function backToLaunch() {
  gameEngine.stop()
  router.push('/')
}

function retryGame() {
  gameEngine.stop()
  gameStore.initNewGame()
  gameEngine.init(gameStore)
  gameEngine.start()
}
</script>
