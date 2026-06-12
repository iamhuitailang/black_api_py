<script setup lang="ts">
import { Coins, Diamond, Settings } from 'lucide-vue-next'
import { usePlayerStore } from '@/stores/player'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

const playerStore = usePlayerStore()
const { player, levelInfo } = storeToRefs(playerStore)

const expPercent = computed(() => {
  const info = levelInfo.value
  return (info.currentExp / info.expForNextLevel) * 100
})
</script>

<template>
  <header class="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-40 border-b border-ice-100">
    <div class="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="text-3xl">{{ player.avatar }}</div>
        <div>
          <div class="font-bold text-gray-800">{{ player.nickname }}</div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-ice-500 font-bold">Lv.{{ levelInfo.level }}</span>
            <div class="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                class="h-full bg-gradient-to-r from-ice-400 to-ice-500 rounded-full transition-all duration-500"
                :style="{ width: expPercent + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1 bg-yellow-100 px-3 py-1.5 rounded-full">
          <Coins class="text-yellow-500" :size="18" />
          <span class="font-bold text-yellow-700 text-sm">{{ player.coins }}</span>
        </div>
        <div class="flex items-center gap-1 bg-blue-100 px-3 py-1.5 rounded-full">
          <Diamond class="text-blue-500" :size="18" />
          <span class="font-bold text-blue-700 text-sm">{{ player.diamonds }}</span>
        </div>
        <button class="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Settings class="text-gray-500" :size="20" />
        </button>
      </div>
    </div>
  </header>
</template>
