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
                🔬 科技研发
              </h1>
              <p class="text-gray-400">
                研究新科技，提升基地效率和生存能力
              </p>
            </div>

            <div class="grid grid-cols-12 gap-6">
              <div class="col-span-9">
                <TechTree />
              </div>

              <div class="col-span-3 space-y-6">
                <SciFiPanel title="研发进度" border-color="purple">
                  <div class="p-4 space-y-4">
                    <div v-if="researchingTech">
                      <div class="flex items-center gap-3 mb-3">
                        <span class="text-3xl">{{ researchingConfig?.icon }}</span>
                        <div>
                          <p class="text-white font-bold">{{ researchingConfig?.name }}</p>
                          <p class="text-xs text-gray-500">Tier {{ researchingConfig?.tier }}</p>
                        </div>
                      </div>
                      <div class="relative h-3 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          class="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 to-tech transition-all duration-300"
                          :style="{ width: `${researchingTech.progress}%` }"
                        />
                      </div>
                      <p class="text-right text-xs text-gray-400 mt-1">
                        {{ researchingTech.progress.toFixed(1) }}%
                      </p>
                    </div>
                    <div v-else class="text-center text-gray-500 py-4">
                      <p class="text-4xl mb-2">📚</p>
                      <p>暂无进行中的研究</p>
                      <p class="text-xs mt-2">点击科技节点开始研发</p>
                    </div>
                  </div>
                </SciFiPanel>

                <SciFiPanel title="科技统计" border-color="blue">
                  <div class="p-4 space-y-3">
                    <div class="flex justify-between items-center">
                      <span class="text-gray-400">已解锁科技</span>
                      <span class="text-tech font-bold">{{ researchedCount }}/{{ totalTechCount }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-gray-400">完成度</span>
                      <span class="text-white font-bold">{{ techProgress.toFixed(1) }}%</span>
                    </div>
                    <div class="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        class="absolute inset-y-0 left-0 bg-gradient-to-r from-tech to-green-500 transition-all duration-300"
                        :style="{ width: `${techProgress}%` }"
                      />
                    </div>
                    <div class="pt-3 border-t border-gray-800">
                      <p class="text-xs text-gray-500 mb-2">科技碎片</p>
                      <div class="flex items-center gap-2">
                        <span class="text-2xl">🔮</span>
                        <span class="text-2xl font-bold" :style="{ color: '#FF6B00' }">
                          {{ techFragmentCount.toFixed(0) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </SciFiPanel>

                <SciFiPanel title="研究实验室" border-color="orange">
                  <div class="p-4">
                    <div class="flex items-center justify-between mb-3">
                      <span class="text-gray-400">实验室数量</span>
                      <span class="text-white font-bold">{{ labCount }}</span>
                    </div>
                    <p class="text-xs text-gray-500">
                      每座实验室提供 +25% 研发速度加成
                    </p>
                    <p class="text-xs text-tech mt-2">
                      当前加成: +{{ (labCount * 25) }}%
                    </p>
                  </div>
                </SciFiPanel>
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
import TechTree from '@/components/game/TechTree.vue'
import { useGameStore } from '@/stores/gameStore'
import { gameEngine } from '@/engine/GameEngine'
import { timeSystem } from '@/engine/TimeSystem'
import { TECHNOLOGIES } from '@/config/technologies'
import { EVENTS } from '@/config/events'

const router = useRouter()
const gameStore = useGameStore()
const { technologies, buildings, resources } = storeToRefs(gameStore)

const currentPage = ref<'base' | 'explore' | 'tech' | 'hall'>('tech')
const showEventLog = ref(false)
const marsTime = ref('')

const researchingTech = computed(() => {
  return Object.values(technologies.value).find(t => t.researching)
})

const researchingConfig = computed(() => {
  if (!researchingTech.value) return null
  return TECHNOLOGIES.find(t => t.id === researchingTech.value!.id)
})

const researchedCount = computed(() => {
  return Object.values(technologies.value).filter(t => t.researched).length
})

const totalTechCount = computed(() => TECHNOLOGIES.length)

const techProgress = computed(() => {
  return (researchedCount.value / totalTechCount.value) * 100
})

const techFragmentCount = computed(() => {
  return resources.value.techFragment?.current || 0
})

const labCount = computed(() => {
  return buildings.value.filter(b => b.built && b.configId === 'research_lab').length
})

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

function handleNavigate(page: string) {
  if (page === 'tech') {
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
