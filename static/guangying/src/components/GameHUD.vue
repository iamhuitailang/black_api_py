<script setup lang="ts">
import { computed } from 'vue'
import { Heart, Sparkles, Sun, Moon, Clock, Trophy, Pause } from 'lucide-vue-next'
import { useGameStore } from '@/store/gameStore'

const emit = defineEmits<{
  (e: 'pause'): void
}>()

const gameStore = useGameStore()

const healthHearts = computed(() => {
  const hearts = []
  const maxHealth = gameStore.gameState.maxHealth
  const currentHealth = gameStore.gameState.health

  for (let i = 0; i < maxHealth; i++) {
    hearts.push({
      filled: i < currentHealth,
      key: i
    })
  }
  return hearts
})

const collectibleDisplay = computed(() => {
  return `${gameStore.gameState.collectibles} / ${gameStore.gameState.totalCollectibles}`
})

const formattedTime = computed(() => {
  const totalSeconds = Math.floor(gameStore.gameState.gameTime)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const isLightState = computed(() => {
  return gameStore.gameState.shadowState === 'light'
})

const handlePause = () => {
  emit('pause')
}
</script>

<template>
  <div class="game-hud fixed top-0 left-0 right-0 z-50 px-4 py-3">
    <div class="hud-container max-w-6xl mx-auto flex items-center justify-between bg-black/50 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/10">
      <div class="hud-left flex items-center gap-6">
        <div class="health-display flex items-center gap-1">
          <Heart
            v-for="heart in healthHearts"
            :key="heart.key"
            class="w-6 h-6 transition-all duration-300"
            :class="heart.filled ? 'text-red-500 fill-red-500' : 'text-gray-600'"
          />
        </div>

        <div class="collectibles-display flex items-center gap-2">
          <Sparkles class="w-5 h-5 text-yellow-400" />
          <span class="text-white font-bold text-sm">{{ collectibleDisplay }}</span>
        </div>

        <div class="shadow-state-display flex items-center gap-2">
          <div
            class="state-icon p-1.5 rounded-full transition-all duration-300"
            :class="isLightState ? 'bg-yellow-500/20' : 'bg-purple-500/20'"
          >
            <Sun
              v-if="isLightState"
              class="w-5 h-5 text-yellow-400"
            />
            <Moon
              v-else
              class="w-5 h-5 text-purple-400"
            />
          </div>
          <span
            class="font-bold text-sm transition-colors duration-300"
            :class="isLightState ? 'text-yellow-400' : 'text-purple-400'"
          >
            {{ isLightState ? '光' : '影' }}
          </span>
        </div>
      </div>

      <div class="hud-right flex items-center gap-6">
        <div class="time-display flex items-center gap-2">
          <Clock class="w-5 h-5 text-blue-400" />
          <span class="text-white font-bold text-sm font-mono">{{ formattedTime }}</span>
        </div>

        <div class="score-display flex items-center gap-2">
          <Trophy class="w-5 h-5 text-amber-400" />
          <span class="text-white font-bold text-sm">{{ gameStore.gameState.score }}</span>
        </div>

        <button
          class="pause-btn p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 active:scale-95"
          @click="handlePause"
        >
          <Pause class="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-hud {
  pointer-events: none;
}

.hud-container {
  pointer-events: auto;
}

.pause-btn {
  pointer-events: auto;
}

.health-display svg {
  filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.5));
}

.health-display .text-gray-600 {
  filter: none;
}

.collectibles-display svg {
  filter: drop-shadow(0 0 4px rgba(250, 204, 21, 0.5));
  animation: sparkle 2s ease-in-out infinite;
}

.time-display svg {
  filter: drop-shadow(0 0 4px rgba(96, 165, 250, 0.5));
}

.score-display svg {
  filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.5));
}

.state-icon svg {
  filter: drop-shadow(0 0 6px currentColor);
}

@keyframes sparkle {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}
</style>
