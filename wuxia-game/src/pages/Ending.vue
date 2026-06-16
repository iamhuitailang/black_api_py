<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Home, Trophy, RotateCcw } from 'lucide-vue-next'
import { useGameStore } from '@/stores/game'
import { ENDINGS, getEndingByBranch } from '@/data/story'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()

const branchKey = computed(() => {
  const q = route.query.key as string
  if (q) return q
  return gameStore.getBranchKey()
})

const ending = computed(() => {
  return getEndingByBranch(branchKey.value) || ENDINGS[0]
})

const unlockedCount = computed(() => gameStore.unlockedEndings.length)

onMounted(() => {
  console.log('[Ending] mounted, branchKey:', branchKey.value, 'query:', route.query.key)
  console.log('[Ending] chapterBranches:', JSON.stringify(gameStore.chapterBranches))
  console.log('[Ending] unlockedEndings:', JSON.stringify(gameStore.unlockedEndings))
  gameStore.unlockEnding(branchKey.value)
})

function returnToMenu() {
  router.push('/')
}

function restartGame() {
  gameStore.resetAll()
  router.push('/select-sect')
}

function goArena() {
  router.push('/arena')
}
</script>

<template>
  <div class="w-full h-full flex flex-col items-center justify-center relative overflow-hidden p-6">
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse-slow"></div>
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-cinnabar/10 rounded-full blur-3xl animate-pulse-slow" style="animation-delay: 1s;"></div>
    </div>

    <div class="relative z-10 text-center max-w-2xl animate-fade-in">
      <div class="text-sm tracking-[0.5em] text-gold/60 mb-6 font-wuxia">
        · 全 剧 终 ·
      </div>

      <div class="text-7xl mb-8 animate-float">
        🏯
      </div>

      <h1 class="text-5xl md:text-6xl font-wuxia text-shadow-gold tracking-[0.3em] mb-6 text-gold">
        {{ ending.title }}
      </h1>

      <div class="flex items-center justify-center gap-4 mb-8">
        <span class="w-24 h-px bg-gradient-to-r from-transparent to-gold/50"></span>
        <span class="text-ink-400 font-song text-sm">结 局 · {{ ending.branchKey }}</span>
        <span class="w-24 h-px bg-gradient-to-l from-transparent to-gold/50"></span>
      </div>

      <div class="ink-paper rounded-lg p-8 mb-10 animate-slide-up" style="animation-delay: 0.2s">
        <p class="text-ink-100 font-song text-lg leading-loose">
          {{ ending.description }}
        </p>
      </div>

      <div class="flex flex-col md:flex-row items-center justify-center gap-4 animate-slide-up" style="animation-delay: 0.4s">
        <button
          class="wuxia-btn wuxia-btn-primary flex items-center gap-3"
          @click="restartGame"
        >
          <RotateCcw :size="18" />
          重 新 开 始
        </button>

        <button
          class="wuxia-btn flex items-center gap-3"
          @click="goArena"
        >
          <Trophy :size="18" />
          挑 战 比 武 场
        </button>

        <button
          class="wuxia-btn flex items-center gap-3"
          @click="returnToMenu"
        >
          <Home :size="18" />
          返 回 主 菜 单
        </button>
      </div>

      <div class="mt-12 text-ink-500 text-xs font-song space-y-1">
        <p>感谢游玩《武侠传》</p>
        <p>共 9 种结局，当前已解锁 {{ unlockedCount }} 种</p>
        <p class="text-ink-600 mt-1">分支路径：{{ branchKey }} | 已解锁：{{ gameStore.unlockedEndings.join(', ') || '无' }}</p>
        <p v-if="unlockedCount < 9" class="text-gold/50 mt-2">· 尝试不同的选择，解锁更多结局 ·</p>
        <p v-else class="text-gold mt-2">· 九九归一，江湖路尽 ·</p>
      </div>
    </div>
  </div>
</template>
