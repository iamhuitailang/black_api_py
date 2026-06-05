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
                🏗️ 基地建设
              </h1>
              <p class="text-gray-400">
                当前区域: {{ currentRegion?.name }} · 基地等级: {{ gameStore.gameState.baseLevel }}
              </p>
            </div>

            <div class="grid grid-cols-12 gap-6">
              <div class="col-span-8">
                <BaseBuilder />
              </div>

              <div class="col-span-4 space-y-6">
                <ResourcePanel />

                <SciFiPanel title="当前区域建筑" border-color="blue">
                  <div class="p-4 space-y-3 max-h-80 overflow-auto">
                    <div
                      v-for="building in regionBuildings"
                      :key="building.id"
                      class="flex items-center justify-between p-3 bg-space/50 rounded-lg border border-gray-800"
                    >
                      <div class="flex items-center gap-3">
                        <span class="text-2xl">{{ getBuildingIcon(building.configId) }}</span>
                        <div>
                          <p class="text-white text-sm">{{ getBuildingName(building.configId) }}</p>
                          <p class="text-xs text-gray-500">等级 {{ building.level }}</p>
                        </div>
                      </div>
                      <div>
                        <span v-if="building.built" class="text-xs text-green-500">运行中</span>
                        <span v-else class="text-xs text-yellow-500">
                          建造中 {{ building.progress.toFixed(0) }}%
                        </span>
                      </div>
                    </div>
                    <div v-if="regionBuildings.length === 0" class="text-center text-gray-500 py-8">
                      暂无建筑，开始建造你的第一座设施吧！
                    </div>
                  </div>
                </SciFiPanel>

                <EnvironmentStatus compact />
              </div>
            </div>
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
import { storeToRefs } from 'pinia'
import StarField from '@/components/three/StarField.vue'
import GameHeader from '@/components/layout/GameHeader.vue'
import GameSidebar from '@/components/layout/GameSidebar.vue'
import SciFiPanel from '@/components/ui/SciFiPanel.vue'
import EventModal from '@/components/ui/EventModal.vue'
import EventLog from '@/components/game/EventLog.vue'
import ResourcePanel from '@/components/game/ResourcePanel.vue'
import BaseBuilder from '@/components/game/BaseBuilder.vue'
import EnvironmentStatus from '@/components/game/EnvironmentStatus.vue'
import { useGameStore } from '@/stores/gameStore'
import { gameEngine } from '@/engine/GameEngine'
import { timeSystem } from '@/engine/TimeSystem'
import { BUILDINGS } from '@/config/buildings'
import { EVENTS } from '@/config/events'
import { REGIONS } from '@/config/regions'

const router = useRouter()
const gameStore = useGameStore()
const { buildings } = storeToRefs(gameStore)

const currentPage = ref<'base' | 'explore' | 'tech' | 'hall'>('base')
const showEventLog = ref(false)
const marsTime = ref('')

const currentRegion = computed(() => {
  return REGIONS[gameStore.gameState.currentRegion]
})

const regionBuildings = computed(() => {
  return buildings.value.filter(b => b.regionId === gameStore.gameState.currentRegion)
})

const pendingEvent = computed(() => gameEngine.getPendingEvent())

const currentEventConfig = computed(() => {
  if (!pendingEvent.value) return null
  return EVENTS.find(e => e.id === pendingEvent.value!.configId) || null
})

let timeUpdateInterval: number | null = null

onMounted(() => {
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

function getBuildingIcon(configId: string): string {
  const config = BUILDINGS.find(b => b.id === configId)
  return config?.icon || '🏠'
}

function getBuildingName(configId: string): string {
  const config = BUILDINGS.find(b => b.id === configId)
  return config?.name || '未知建筑'
}

function handleNavigate(page: string) {
  if (page === 'base') {
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
