<template>
  <div class="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-black"></div>

    <div class="relative z-10">
      <h1 class="font-wuxia text-5xl text-yellow-500 text-center mb-12">选择关卡</h1>

      <div class="grid grid-cols-2 gap-6 max-w-3xl">
        <div v-for="level in levels" :key="level.id"
             class="relative">
          <button @click="selectLevel(level.id)"
                  :disabled="!isUnlocked(level.id)"
                  class="panel-border p-6 w-full text-left transition-all duration-300"
                  :class="[
                    isUnlocked(level.id) 
                      ? 'hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-500/20 cursor-pointer' 
                      : 'opacity-50 cursor-not-allowed'
                  ]">
            <div class="flex items-start gap-4">
              <div class="w-16 h-16 rounded-lg flex items-center justify-center text-3xl"
                   :class="getThemeColor(level.theme)">
                {{ getThemeIcon(level.theme) }}
              </div>
              <div class="flex-1">
                <h3 class="font-wuxia text-2xl text-yellow-500 mb-1">
                  第{{ level.id }}关：{{ level.name }}
                </h3>
                <p class="text-gray-400 text-sm">{{ level.description }}</p>
                <div v-if="!isUnlocked(level.id)" class="mt-2 text-red-500 text-sm">
                  🔒 未解锁
                </div>
                <div v-else class="mt-2 text-green-500 text-sm">
                  ✓ 已解锁
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <button @click="goBack" class="btn-gold mt-12 mx-auto block">
        返回主菜单
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'
import { LEVEL_INFO } from '../game/levels/index.js'

const router = useRouter()
const gameStore = useGameStore()

const levels = LEVEL_INFO

function isUnlocked(levelId) {
  return gameStore.unlockedLevels.includes(levelId)
}

function selectLevel(levelId) {
  if (isUnlocked(levelId)) {
    gameStore.setCurrentLevel(levelId)
    gameStore.restorePlayerStats()
    gameStore.resetLevelState()
    router.push(`/game/${levelId}`)
  }
}

function goBack() {
  router.push('/')
}

function getThemeColor(theme) {
  const colors = {
    bamboo: 'bg-green-900',
    castle: 'bg-gray-700',
    swamp: 'bg-teal-900',
    snow: 'bg-blue-300'
  }
  return colors[theme] || 'bg-gray-700'
}

function getThemeIcon(theme) {
  const icons = {
    bamboo: '🎋',
    castle: '🏯',
    swamp: '🌿',
    snow: '❄️'
  }
  return icons[theme] || '🎮'
}
</script>
