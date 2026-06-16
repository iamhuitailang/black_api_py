<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { Sword, Trophy, PlayCircle, BookOpen } from 'lucide-vue-next'

const router = useRouter()
const gameStore = useGameStore()

const hasSave = computed(() => gameStore.hasSave && gameStore.playerExists)
const unlockedEndingsCount = computed(() => gameStore.unlockedEndings.length)

function startNewGame() {
  gameStore.resetAll()
  router.push('/select-sect')
}

function continueGame() {
  router.push('/story')
}

function goArena() {
  if (!gameStore.playerExists) {
    router.push('/select-sect')
  } else {
    router.push('/arena')
  }
}
</script>

<template>
  <div class="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
    <div class="absolute inset-0 pointer-events-none opacity-30">
      <div class="absolute top-10 left-10 w-64 h-64 bg-cinnabar/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-20 right-20 w-96 h-96 bg-gold/10 rounded-full blur-3xl"></div>
    </div>

    <div class="relative z-10 text-center mb-16 animate-fade-in">
      <div class="text-sm tracking-[0.5em] text-gold/70 mb-4 font-wuxia">前 朝 末 年 · 江 湖 风 云</div>
      <h1 class="text-7xl md:text-8xl font-wuxia text-shadow-gold tracking-[0.3em] mb-4 text-gold">
        武 侠 传
      </h1>
      <div class="flex items-center justify-center gap-4 text-ink-300">
        <span class="w-20 h-px bg-gradient-to-r from-transparent to-gold/50"></span>
        <span class="text-sm font-song tracking-widest">重 温 儿 时 经 典</span>
        <span class="w-20 h-px bg-gradient-to-l from-transparent to-gold/50"></span>
      </div>
    </div>

    <div class="relative z-10 flex flex-col gap-4 w-72 animate-slide-up">
      <button
        class="wuxia-btn wuxia-btn-primary flex items-center justify-center gap-3"
        @click="startNewGame"
      >
        <PlayCircle :size="20" />
        <span>开 始 新 游 戏</span>
      </button>

      <button
        class="wuxia-btn flex items-center justify-center gap-3"
        :disabled="!hasSave"
        @click="continueGame"
      >
        <Sword :size="20" />
        <span>继 续 游 戏</span>
      </button>

      <button
        class="wuxia-btn flex items-center justify-center gap-3"
        @click="goArena"
      >
        <Trophy :size="20" />
        <span>比 武 场</span>
      </button>

      <div class="mt-8 text-center">
        <div class="text-xs text-ink-400 font-song space-y-1">
          <p>⚔️ 四大门派 · 各具特色</p>
          <p>📖 三章剧情 · 九种结局</p>
          <p>🏆 比武竞技 · 神兵利器</p>
        </div>
        <div v-if="unlockedEndingsCount > 0" class="mt-4 text-xs text-gold/70 font-song">
          已解锁结局：{{ unlockedEndingsCount }} / 9
        </div>
      </div>
    </div>

    <div class="absolute bottom-6 text-ink-500 text-xs font-song">
      <BookOpen :size="12" class="inline mr-1" />
      进度自动保存于本地，刷新不丢失
    </div>
  </div>
</template>
