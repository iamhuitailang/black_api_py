<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Map as MapIcon, Star, Lock, Zap } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import TopBar from '@/components/TopBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import { usePlayerStore } from '@/stores/player'
import { useGameStore } from '@/stores/game'
import { storeToRefs } from 'pinia'
import { MAPS } from '@/data/gameData'

const router = useRouter()
const playerStore = usePlayerStore()
const gameStore = useGameStore()
const { player, levelInfo } = storeToRefs(playerStore)

const selectedMapId = ref<string | null>(null)

const selectedMap = computed(() => {
  return MAPS.find(m => m.id === selectedMapId.value) || null
})

function isMapUnlocked(mapId: string): boolean {
  return player.value.unlocked.maps.includes(mapId)
}

function selectMap(mapId: string) {
  if (isMapUnlocked(mapId)) {
    selectedMapId.value = mapId
  }
}

function startGame() {
  if (selectedMapId.value) {
    gameStore.setMap(selectedMapId.value)
    router.push('/game/prepare')
  }
}

function getWeatherName(weather: string): string {
  const names: Record<string, string> = {
    snow: '飘雪',
    clear: '晴朗',
    blizzard: '暴风雪',
    aurora: '极光'
  }
  return names[weather] || '未知'
}

onMounted(() => {
  playerStore.loadPlayer()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-ice-200 via-blue-100 to-white pb-20 pt-20">
    <TopBar />
    
    <div class="max-w-lg mx-auto px-4 py-6">
      <h1 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <MapIcon class="text-blue-500" :size="28" />
        地图选择
      </h1>
      
      <div class="space-y-4">
        <div
          v-for="map in MAPS"
          :key="map.id"
          @click="selectMap(map.id)"
          class="relative rounded-2xl overflow-hidden shadow-soft transition-all duration-300"
          :class="[
            isMapUnlocked(map.id) ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : 'cursor-not-allowed',
            selectedMapId === map.id ? 'ring-4 ring-ice-400 scale-[1.02]' : ''
          ]"
        >
          <div 
            class="h-36 p-5 flex items-end"
            :style="{ background: `linear-gradient(135deg, ${map.bgGradient[0]}, ${map.bgGradient[1]})` }"
          >
            <div class="flex items-end gap-4 flex-1">
              <div class="text-5xl">{{ map.previewEmoji }}</div>
              <div class="text-white">
                <div class="font-bold text-xl mb-1">{{ map.name }}</div>
                <div class="text-sm opacity-90">{{ map.description }}</div>
                <div class="flex items-center gap-2 mt-2">
                  <span class="bg-white/30 px-2 py-0.5 rounded-full text-xs">
                    {{ getWeatherName(map.weather) }}
                  </span>
                  <span class="text-yellow-300 text-sm">
                    {'⭐'.repeat(map.difficulty)}
                  </span>
                </div>
              </div>
            </div>
            
            <div v-if="!isMapUnlocked(map.id)" class="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <div class="text-center text-white">
                <Lock :size="32" class="mx-auto mb-2" />
                <div class="text-sm font-medium">{{ map.unlockCondition }}</div>
                <div class="text-xs opacity-80 mt-1">Lv.{{ map.unlockLevel }} 解锁</div>
              </div>
            </div>
          </div>
          
          <div v-if="isMapUnlocked(map.id)" class="bg-white p-3 flex items-center justify-between">
            <div class="text-sm text-gray-500">
              机关数量: {{ map.obstacles.length }} 个
            </div>
            <div v-if="selectedMapId === map.id" class="text-ice-500 font-bold text-sm">
              ✓ 已选择
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="selectedMap" class="mt-6 bg-white/80 backdrop-blur rounded-2xl p-4 shadow-soft">
        <h3 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Zap :size="18" class="text-yellow-500" />
          地图机关
        </h3>
        <div class="grid grid-cols-2 gap-2">
          <div 
            v-for="(obstacle, index) in selectedMap.obstacles.slice(0, 4)" 
            :key="index"
            class="bg-gray-50 rounded-lg p-2 text-center"
          >
            <div class="text-xl mb-1">
              {{ obstacle.type === 'snowdrift' ? '🏔️' : 
                 obstacle.type === 'ice_crack' ? '💎' :
                 obstacle.type === 'ice_ramp' ? '⚡' :
                 obstacle.type === 'bounce_pad' ? '🎾' : '🪨' }}
            </div>
            <div class="text-xs text-gray-600">
              {{ obstacle.type === 'snowdrift' ? '雪堆' : 
                 obstacle.type === 'ice_crack' ? '冰裂缝' :
                 obstacle.type === 'ice_ramp' ? '加速坡' :
                 obstacle.type === 'bounce_pad' ? '弹跳垫' : '岩石' }}
            </div>
          </div>
        </div>
      </div>
      
      <button
        v-if="selectedMap && isMapUnlocked(selectedMap.id)"
        @click="startGame"
        class="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-ice-400 to-blue-500 text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
      >
        开始游戏
      </button>
    </div>
    
    <BottomNav />
  </div>
</template>
