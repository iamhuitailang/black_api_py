<script setup lang="ts">
import { onMounted } from 'vue'
import { useGameStore } from '@/store/gameStore'
import MainMenu from '@/components/MainMenu.vue'

const gameStore = useGameStore()

onMounted(() => {
  gameStore.initGame()
  gameStore.changeScene('menu')
})
</script>

<template>
  <MainMenu />
</template>
