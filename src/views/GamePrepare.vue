<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Play, MapPin, Zap, Shield, Target } from 'lucide-vue-next'
import { useGameStore } from '@/stores/game'
import { usePlayerStore } from '@/stores/player'
import { storeToRefs } from 'pinia'
import { MAPS, ITEMS } from '@/data/gameData'
import type { Difficulty } from '@/types/game'

const router = useRouter()
const gameStore = useGameStore()
const playerStore = usePlayerStore()
const { selectedMap, selectedDifficulty, selectedItems, maxItemSlots } = storeToRefs(gameStore)
const { player } = storeToRefs(playerStore)

const showMapSelect = ref(false)
const showItemSelect = ref(false)

const difficulties: { value: Difficulty; label: string; color: string; desc: string; emoji: string }[] = [
  { value: 'easy', label: '简单', color: 'bg-green-400', desc: '适合新手', emoji: '😊' },
  { value: 'normal', label: '普通', color: 'bg-blue-400', desc: '标准挑战', emoji: '😐' },
  { value: 'hard', label: '困难', color: 'bg-orange-400', desc: '高手对决', emoji: '😤' },
  { value: 'expert', label: '专家', color: 'bg-red-500', desc: '极限挑战', emoji: '🔥' },
]

const availableItems = computed(() => {
  return ITEMS.filter(item => {
    const count = player.value.unlocked.items[item.id] || 0
    return count > 0
  })
})

function goBack() {
  router.push('/')
}

function selectMap(mapId: string) {
  if (player.value.unlocked.maps.includes(mapId)) {
    gameStore.setMap(mapId)
    showMapSelect.value = false
  }
}

function selectDifficulty(diff: Difficulty) {
  gameStore.setDifficulty(diff)
}

function toggleItem(itemId: string) {
  if (selectedItems.value.includes(itemId)) {
    gameStore.removeSelectedItem(itemId)
  } else if (selectedItems.value.length < maxItemSlots.value) {
    gameStore.addSelectedItem(itemId)
  }
}

function startGame() {
  router.push('/game/play')
}

function getItemCount(itemId: string): number {
  return player.value.unlocked.items[itemId] || 0
}

onMounted(() => {
  playerStore.loadPlayer()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-ice-200 via-ice-100 to-white pb-8">
    <div class="bg-white/80 backdrop-blur-md border-b border-ice-100 sticky top-0 z-30">
      <div class="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
        <button @click="goBack" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft :size="24" class="text-gray-600" />
        </button>
        <h1 class="text-xl font-bold text-gray-800">游戏准备</h1>
      </div>
    </div>
    
    <div class="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div class="bg-white/80 backdrop-blur rounded-2xl p-4 shadow-soft">
        <div class="flex items-center gap-2 mb-4">
          <MapPin :size="20" class="text-ice-500" />
          <h2 class="font-bold text-gray-800">选择地图</h2>
        </div>
        
        <div 
          @click="showMapSelect = true"
          class="relative rounded-xl overflow-hidden cursor-pointer transform hover:scale-[1.02] transition-transform"
        >
          <div 
            class="h-32 p-4 flex items-end"
            :style="{ background: `linear-gradient(135deg, ${selectedMap.bgGradient[0]}, ${selectedMap.bgGradient[1]})` }"
          >
            <div class="text-white">
              <div class="text-2xl mb-1">{{ selectedMap.previewEmoji }}</div>
              <div class="font-bold text-lg">{{ selectedMap.name }}</div>
              <div class="text-sm opacity-90">{{ selectedMap.description }}</div>
            </div>
          </div>
          <div class="absolute top-3 right-3 bg-white/80 px-2 py-1 rounded-full text-xs font-bold text-gray-600">
            难度: {'⭐'.repeat(selectedMap.difficulty)}
          </div>
        </div>
      </div>
      
      <div class="bg-white/80 backdrop-blur rounded-2xl p-4 shadow-soft">
        <div class="flex items-center gap-2 mb-4">
          <Target :size="20" class="text-orange-500" />
          <h2 class="font-bold text-gray-800">选择难度</h2>
        </div>
        
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="diff in difficulties"
            :key="diff.value"
            @click="selectDifficulty(diff.value)"
            class="p-3 rounded-xl text-center transition-all duration-200"
            :class="selectedDifficulty === diff.value 
              ? 'bg-ice-100 ring-2 ring-ice-400 scale-105' 
              : 'bg-gray-50 hover:bg-gray-100'"
          >
            <div class="text-2xl mb-1">{{ diff.emoji }}</div>
            <div class="text-sm font-bold" :class="selectedDifficulty === diff.value ? 'text-ice-600' : 'text-gray-700'">{{ diff.label }}</div>
          </button>
        </div>
        
        <div class="mt-3 p-3 bg-ice-50 rounded-xl">
          <div class="text-sm text-gray-600">
            {{ difficulties.find(d => d.value === selectedDifficulty)?.desc }}
            <span class="ml-2 text-ice-600 font-medium">
              {{ selectedDifficulty === 'easy' ? '2名对手' : 
                 selectedDifficulty === 'normal' ? '3名对手' : 
                 selectedDifficulty === 'hard' ? '4名对手' : '5名对手' }}
            </span>
          </div>
        </div>
      </div>
      
      <div class="bg-white/80 backdrop-blur rounded-2xl p-4 shadow-soft">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <Zap :size="20" class="text-yellow-500" />
            <h2 class="font-bold text-gray-800">道具装备</h2>
          </div>
          <span class="text-xs text-gray-400">{{ selectedItems.length }}/{{ maxItemSlots }}</span>
        </div>
        
        <div class="grid grid-cols-4 gap-3">
          <div
            v-for="i in maxItemSlots"
            :key="i"
            class="aspect-square rounded-xl bg-gray-50 flex items-center justify-center text-3xl border-2 border-dashed border-gray-200"
            :class="selectedItems[i - 1] ? 'border-solid border-ice-300 bg-ice-50' : ''"
            @click="showItemSelect = true"
          >
            <template v-if="selectedItems[i - 1]">
              {{ ITEMS.find(item => item.id === selectedItems[i - 1])?.emoji || '❓' }}
            </template>
            <template v-else>
              <span class="text-gray-300">+</span>
            </template>
          </div>
        </div>
        
        <div class="mt-3 text-xs text-gray-400 text-center">
          点击添加道具，游戏中按数字键 1-4 使用
        </div>
      </div>
      
      <button
        @click="startGame"
        class="w-full py-5 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3"
      >
        <Play :size="28" fill="white" />
        开始比赛
      </button>
    </div>
    
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showMapSelect" class="fixed inset-0 z-50 flex items-end justify-center">
          <div class="absolute inset-0 bg-black/50" @click="showMapSelect = false"></div>
          <div class="relative bg-white rounded-t-3xl w-full max-w-lg max-h-[70vh] overflow-y-auto">
            <div class="sticky top-0 bg-white px-6 py-4 border-b border-gray-100">
              <h3 class="text-lg font-bold text-gray-800">选择地图</h3>
            </div>
            <div class="p-4 space-y-3">
              <div
                v-for="map in MAPS"
                :key="map.id"
                @click="selectMap(map.id)"
                class="relative rounded-xl overflow-hidden cursor-pointer transform hover:scale-[1.02] transition-all"
                :class="{ 'opacity-50': !player.unlocked.maps.includes(map.id) }"
              >
                <div 
                  class="h-24 p-4 flex items-center"
                  :style="{ background: `linear-gradient(135deg, ${map.bgGradient[0]}, ${map.bgGradient[1]})` }"
                >
                  <div class="text-4xl mr-4">{{ map.previewEmoji }}</div>
                  <div class="text-white">
                    <div class="font-bold text-lg">{{ map.name }}</div>
                    <div class="text-sm opacity-90">
                      {{ player.unlocked.maps.includes(map.id) ? map.description : map.unlockCondition }}
                    </div>
                  </div>
                  <div class="ml-auto text-white">
                    {'⭐'.repeat(map.difficulty)}
                  </div>
                </div>
                <div v-if="selectedMapId === map.id" class="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                  已选择
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showItemSelect" class="fixed inset-0 z-50 flex items-end justify-center">
          <div class="absolute inset-0 bg-black/50" @click="showItemSelect = false"></div>
          <div class="relative bg-white rounded-t-3xl w-full max-w-lg max-h-[70vh] overflow-y-auto">
            <div class="sticky top-0 bg-white px-6 py-4 border-b border-gray-100">
              <h3 class="text-lg font-bold text-gray-800">选择道具</h3>
            </div>
            <div class="p-4 grid grid-cols-4 gap-3">
              <div
                v-for="item in availableItems"
                :key="item.id"
                @click="toggleItem(item.id)"
                class="aspect-square rounded-xl bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-all"
                :class="selectedItems.includes(item.id) ? 'bg-ice-100 ring-2 ring-ice-400' : 'hover:bg-gray-100'"
              >
                <div class="text-3xl mb-1">{{ item.emoji }}</div>
                <div class="text-xs text-gray-500">x{{ getItemCount(item.id) }}</div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
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
</style>
