<template>
  <div class="min-h-screen bg-space relative overflow-hidden">
    <div class="absolute inset-0 opacity-30">
      <StarField :star-count="3000" />
    </div>

    <div class="relative z-10 h-screen flex flex-col">
      <GameHeader
        :game-state="gameStore.gameState"
        :resources="gameStore.resources"
        :mars-time="marsTime"
        :event-count="gameStore.activeEvents.length"
        @toggle-pause="togglePause"
        @set-speed="setSpeed"
        @open-events="showEventLog = true"
      />

      <div class="flex-1 flex relative">
        <GameSidebar
          :current-page="currentPage"
          :current-region="gameStore.gameState.currentRegion"
          :regions="gameStore.unlockedRegions"
          :event-count="gameStore.activeEvents.length"
          @navigate="handleNavigate"
        />

        <div class="flex-1 p-6 overflow-auto">
          <div class="max-w-7xl mx-auto">
            <div class="mb-6">
              <h1 class="text-3xl font-bold text-white mb-2" style="font-family: 'Orbitron', sans-serif;">
                🗺️ 探索地图
              </h1>
              <p class="text-gray-400">
                派遣火星车探索未知区域，发现稀有资源和远古遗迹
              </p>
            </div>

            <ExploreMap />
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import StarField from '@/components/three/StarField.vue'
import GameHeader from '@/components/layout/GameHeader.vue'
import GameSidebar from '@/components/layout/GameSidebar.vue'
import EventModal from '@/components/ui/EventModal.vue'
import EventLog from '@/components/game/EventLog.vue'
import ExploreMap from '@/components/game/ExploreMap.vue'
import { useGameStore } from '@/stores/gameStore'
import { gameEngine } from '@/engine/GameEngine'
import { timeSystem } from '@/engine/TimeSystem'
import { EVENTS } from '@/config/events'

const router = useRouter()
const gameStore = useGameStore()

const currentPage = ref<'base' | 'explore' | 'tech' | 'hall'>('explore')
const showEventLog = ref(false)
const marsTime = ref('')

const pendingEvent = computed(() => gameEngine.getPendingEvent())

const currentEventConfig = computed(() => {
  if (!pendingEvent.value) return null
  return EVENTS.find(e => e.id === pendingEvent.value!.configId) || null
})

let timeUpdateInterval: number | null = null

onMounted(() => {
  if (!gameStore.initialized) {
    router.push('/')
    return
  }
  updateMarsTime()
  timeUpdateInterval = window.setInterval(updateMarsTime, 1000)
})

onUnmounted(() => {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval)
  }
})

function updateMarsTime() {
  marsTime.value = timeSystem.getTimeString()
}

function handleNavigate(page: string) {
  if (page === 'explore') {
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
</script>
