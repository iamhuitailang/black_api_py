<template>
  <div class="w-screen h-screen bg-space overflow-hidden">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { gameEngine } from '@/engine/GameEngine'
import { hasSavedGame } from '@/utils/storage'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()

onMounted(() => {
  const publicRoutes = ['/']
  
  if (!publicRoutes.includes(route.path) && !gameStore.initialized) {
    if (hasSavedGame() && gameStore.loadSavedGame()) {
      gameEngine.init(gameStore)
      gameEngine.start()
    } else {
      router.push('/')
    }
  }
})
</script>