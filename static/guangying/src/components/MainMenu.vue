<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Play, Settings, Info, Star, Sparkles } from 'lucide-vue-next'
import { useGameStore } from '@/store/gameStore'

const router = useRouter()
const gameStore = useGameStore()

/** 开始游戏 - 进入最近的未完成关卡 */
const startGame = (): void => {
  gameStore.changeScene('levelSelect')
  router.push('/levels')
}

/** 进入关卡选择 */
const goToLevels = (): void => {
  gameStore.changeScene('levelSelect')
  router.push('/levels')
}

/** 继续游戏 - 进入当前关卡 */
const continueGame = (): void => {
  gameStore.changeScene('playing')
  router.push(`/game/${gameStore.currentLevel}`)
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-indigo-950 via-purple-950 to-gray-950">
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;" />
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 0.5s;" />
    </div>

    <div class="relative z-10 text-center mb-12">
      <div class="flex items-center justify-center gap-3 mb-4">
        <Sparkles :size="48" class="text-yellow-400 animate-pulse" />
        <h1 class="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400">
          光与影
        </h1>
        <Sparkles :size="48" class="text-yellow-400 animate-pulse" />
      </div>
      <p class="text-xl text-gray-300 mt-4">光明与黑暗的奇幻冒险</p>
    </div>

    <div class="relative z-10 flex items-center justify-center gap-8 mb-12">
      <div class="bg-black/40 backdrop-blur-sm rounded-xl px-6 py-3 text-center">
        <div class="flex items-center justify-center gap-2 text-yellow-400 mb-1">
          <Star :size="18" />
          <span class="text-sm text-gray-400">总星级</span>
        </div>
        <p class="text-2xl font-bold text-white">{{ gameStore.totalStars }}</p>
      </div>
      <div class="bg-black/40 backdrop-blur-sm rounded-xl px-6 py-3 text-center">
        <div class="flex items-center justify-center gap-2 text-purple-400 mb-1">
          <Sparkles :size="18" />
          <span class="text-sm text-gray-400">光粒子</span>
        </div>
        <p class="text-2xl font-bold text-white">{{ gameStore.totalParticles }}</p>
      </div>
    </div>

    <div class="relative z-10 w-full max-w-sm space-y-4 px-4">
      <button
        @click="continueGame"
        class="w-full flex items-center justify-center gap-3 py-4 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-xl font-bold rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-green-500/30"
      >
        <Play :size="24" />
        继续游戏
      </button>

      <button
        @click="startGame"
        class="w-full flex items-center justify-center gap-3 py-4 px-8 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xl font-bold rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-amber-500/30"
      >
        <Play :size="24" />
        开始游戏
      </button>

      <button
        @click="goToLevels"
        class="w-full flex items-center justify-center gap-3 py-4 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xl font-bold rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/30"
      >
        关卡选择
      </button>

      <div class="grid grid-cols-2 gap-4 mt-6">
        <button
          class="flex items-center justify-center gap-2 py-3 px-6 bg-gray-700/80 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
        >
          <Settings :size="20" />
          设置
        </button>
        <button
          class="flex items-center justify-center gap-2 py-3 px-6 bg-gray-700/80 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
        >
          <Info :size="20" />
          关于
        </button>
      </div>
    </div>

    <p class="relative z-10 text-gray-500 text-sm mt-12">
      版本 1.0.0
    </p>
  </div>
</template>
