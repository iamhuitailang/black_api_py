<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Play, Settings, Info, Star, Sparkles, X } from 'lucide-vue-next'
import { useGameStore } from '@/store/gameStore'

const router = useRouter()
const gameStore = useGameStore()

/** 是否显示设置面板 */
const showSettings = ref(false)

/** 是否显示关于面板 */
const showAbout = ref(false)

/** 开始游戏 - 进入关卡选择 */
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
  const levelId = gameStore.currentLevel || 'level_1'
  gameStore.changeScene('playing')
  router.push(`/game/${levelId}`)
}

/** 打开设置 */
const openSettings = (): void => {
  showSettings.value = true
}

/** 关闭设置 */
const closeSettings = (): void => {
  showSettings.value = false
}

/** 打开关于 */
const openAbout = (): void => {
  showAbout.value = true
}

/** 关闭关于 */
const closeAbout = (): void => {
  showAbout.value = false
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
          @click="openSettings"
          class="flex items-center justify-center gap-2 py-3 px-6 bg-gray-700/80 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
        >
          <Settings :size="20" />
          设置
        </button>
        <button
          @click="openAbout"
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

    <!-- 设置面板 -->
    <div
      v-if="showSettings"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <div class="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-700">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-white">设置</h2>
          <button
            @click="closeSettings"
            class="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X :size="24" class="text-gray-400" />
          </button>
        </div>
        <div class="space-y-4">
          <div class="flex items-center justify-between py-3 border-b border-gray-700">
            <span class="text-gray-300">音效</span>
            <button
              @click="gameStore.toggleSoundEnabled"
              class="px-4 py-2 rounded-lg transition-colors"
              :class="gameStore.settings.sfxEnabled ? 'bg-green-600' : 'bg-gray-600'"
            >
              {{ gameStore.settings.sfxEnabled ? '开启' : '关闭' }}
            </button>
          </div>
          <div class="flex items-center justify-between py-3 border-b border-gray-700">
            <span class="text-gray-300">音乐</span>
            <button
              @click="gameStore.toggleMusicEnabled"
              class="px-4 py-2 rounded-lg transition-colors"
              :class="gameStore.settings.bgmEnabled ? 'bg-green-600' : 'bg-gray-600'"
            >
              {{ gameStore.settings.bgmEnabled ? '开启' : '关闭' }}
            </button>
          </div>
          <div class="py-3 border-b border-gray-700">
            <span class="text-gray-300 block mb-2">画质</span>
            <div class="flex gap-2">
              <button
                v-for="q in ['low', 'medium', 'high']"
                :key="q"
                @click="gameStore.setGraphicsQuality(q as any)"
                class="px-4 py-2 rounded-lg transition-colors flex-1"
                :class="gameStore.settings.graphicsQuality === q ? 'bg-purple-600' : 'bg-gray-600'"
              >
                {{ q === 'low' ? '低' : q === 'medium' ? '中' : '高' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 关于面板 -->
    <div
      v-if="showAbout"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <div class="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-700">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-white">关于游戏</h2>
          <button
            @click="closeAbout"
            class="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X :size="24" class="text-gray-400" />
          </button>
        </div>
        <div class="space-y-4 text-gray-300">
          <div class="text-center mb-6">
            <h3 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2">
              光与影
            </h3>
            <p class="text-gray-400">光明与黑暗的奇幻冒险</p>
          </div>
          <div class="space-y-2 text-sm">
            <p><strong class="text-yellow-400">☀️ 光区能力：</strong>移动速度+50%，跳跃高度+20%</p>
            <p><strong class="text-purple-400">🌙 影区能力：</strong>可穿透障碍物</p>
          </div>
          <div class="mt-6 pt-4 border-t border-gray-700">
            <p class="text-sm text-gray-400 text-center">
              操作说明
            </p>
            <div class="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div class="bg-gray-700/50 rounded-lg p-2 text-center">
                <span class="text-yellow-400 font-bold">A / ←</span>
                <p class="text-gray-400 text-xs">向左移动</p>
              </div>
              <div class="bg-gray-700/50 rounded-lg p-2 text-center">
                <span class="text-yellow-400 font-bold">D / →</span>
                <p class="text-gray-400 text-xs">向右移动</p>
              </div>
              <div class="bg-gray-700/50 rounded-lg p-2 text-center">
                <span class="text-yellow-400 font-bold">空格 / W</span>
                <p class="text-gray-400 text-xs">跳跃</p>
              </div>
              <div class="bg-gray-700/50 rounded-lg p-2 text-center">
                <span class="text-yellow-400 font-bold">ESC</span>
                <p class="text-gray-400 text-xs">暂停</p>
              </div>
            </div>
          </div>
          <p class="text-center text-gray-500 text-sm mt-4">
            版本 1.0.0
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
