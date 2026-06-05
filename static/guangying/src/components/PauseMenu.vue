<script setup lang="ts">
import { computed } from 'vue'
import { Play, RotateCcw, LayoutGrid, Home } from 'lucide-vue-next'
import { useGameStore } from '@/store/gameStore'

const emit = defineEmits<{
  (e: 'resume'): void
  (e: 'restart'): void
  (e: 'levelSelect'): void
  (e: 'mainMenu'): void
}>()

const gameStore = useGameStore()

const isVisible = computed(() => {
  return gameStore.currentScene === 'paused'
})

const handleResume = () => {
  emit('resume')
}

const handleRestart = () => {
  emit('restart')
}

const handleLevelSelect = () => {
  emit('levelSelect')
}

const handleMainMenu = () => {
  emit('mainMenu')
}
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isVisible"
      class="pause-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <Transition name="scale">
        <div
          v-if="isVisible"
          class="pause-panel relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 rounded-2xl p-8 border border-white/10 shadow-2xl max-w-md w-full mx-4"
        >
          <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-500/5 to-purple-500/5 pointer-events-none" />

          <div class="relative">
            <h2 class="text-3xl font-bold text-center text-white mb-2">游戏暂停</h2>
            <p class="text-center text-gray-400 mb-8">休息一下，随时继续冒险</p>

            <div class="space-y-4">
              <button
                class="pause-btn w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-green-500/25"
                @click="handleResume"
              >
                <Play class="w-5 h-5 fill-current" />
                继续游戏
              </button>

              <button
                class="pause-btn w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-bold rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-blue-500/25"
                @click="handleRestart"
              >
                <RotateCcw class="w-5 h-5" />
                重新开始
              </button>

              <button
                class="pause-btn w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-amber-500/25"
                @click="handleLevelSelect"
              >
                <LayoutGrid class="w-5 h-5" />
                关卡选择
              </button>

              <button
                class="pause-btn w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all duration-200 active:scale-95 border border-white/10"
                @click="handleMainMenu"
              >
                <Home class="w-5 h-5" />
                返回主菜单
              </button>
            </div>

            <p class="text-center text-gray-500 text-sm mt-6">
              按 <kbd class="px-2 py-1 bg-white/10 rounded text-gray-300">ESC</kbd> 继续游戏
            </p>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.pause-btn {
  position: relative;
  overflow: hidden;
}

.pause-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.pause-btn:hover::before {
  left: 100%;
}

.pause-panel {
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>
