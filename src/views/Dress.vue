<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Palette, Sparkles, Shirt, Crown } from 'lucide-vue-next'
import TopBar from '@/components/TopBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import { usePlayerStore } from '@/stores/player'
import { storeToRefs } from 'pinia'
import { HAMSTER_SKINS, SNOWBALL_EFFECTS, DECORATIONS } from '@/data/gameData'

const playerStore = usePlayerStore()
const { player, currentHamsterSkin, currentSnowballEffect } = storeToRefs(playerStore)

const activeTab = ref('hamster')

const tabs = [
  { id: 'hamster', name: '仓鼠皮肤', icon: Shirt },
  { id: 'snowball', name: '雪球特效', icon: Sparkles },
  { id: 'decoration', name: '装饰', icon: Crown },
]

const unlockedHamsterSkins = computed(() => {
  return HAMSTER_SKINS.filter(skin => 
    player.value.unlocked.hamsterSkins.includes(skin.id)
  )
})

const unlockedSnowballEffects = computed(() => {
  return SNOWBALL_EFFECTS.filter(effect => 
    player.value.unlocked.snowballEffects.includes(effect.id)
  )
})

const unlockedDecorations = computed(() => {
  return DECORATIONS.filter(deco => 
    player.value.unlocked.decorations.includes(deco.id)
  )
})

function equipHamster(skinId: string) {
  playerStore.equipHamsterSkin(skinId)
}

function equipEffect(effectId: string) {
  playerStore.equipSnowballEffect(effectId)
}

function isHamsterEquipped(skinId: string): boolean {
  return player.value.equipped.hamsterSkin === skinId
}

function isEffectEquipped(effectId: string): boolean {
  return player.value.equipped.snowballEffect === effectId
}

onMounted(() => {
  playerStore.loadPlayer()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-pink-100 via-purple-50 to-white pb-20 pt-20">
    <TopBar />
    
    <div class="max-w-lg mx-auto px-4 py-6">
      <h1 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Palette class="text-pink-500" :size="28" />
        装扮
      </h1>
      
      <div class="relative bg-gradient-to-br from-white/80 to-pink-50/80 backdrop-blur rounded-3xl p-8 mb-6 shadow-soft text-center">
        <div class="relative inline-block">
          <div class="absolute inset-0 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full blur-xl opacity-30 scale-150"></div>
          <div class="relative text-8xl animate-float">
            {{ currentHamsterSkin.emoji }}
          </div>
        </div>
        
        <div class="mt-4">
          <div class="text-xl font-bold text-gray-800">{{ player.nickname }}</div>
          <div class="text-sm text-gray-500 mt-1">
            {{ currentHamsterSkin.name }} · {{ currentSnowballEffect.name }}
          </div>
        </div>
        
        <div class="mt-4 flex justify-center gap-2">
          <span class="inline-block px-3 py-1 bg-ice-100 text-ice-600 rounded-full text-xs font-medium">
            ❄️ {{ currentSnowballEffect.name }}
          </span>
        </div>
      </div>
      
      <div class="bg-white/80 backdrop-blur rounded-2xl p-1 mb-6 shadow-soft">
        <div class="flex">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl transition-all duration-200"
            :class="activeTab === tab.id 
              ? 'bg-pink-500 text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-100'"
          >
            <component :is="tab.icon" :size="18" />
            <span class="text-sm font-medium">{{ tab.name }}</span>
          </button>
        </div>
      </div>
      
      <div v-if="activeTab === 'hamster'" class="grid grid-cols-3 gap-3">
        <div
          v-for="skin in HAMSTER_SKINS"
          :key="skin.id"
          @click="unlockedHamsterSkins.find(s => s.id === skin.id) && equipHamster(skin.id)"
          class="bg-white/80 backdrop-blur rounded-2xl p-3 text-center shadow-soft transition-all duration-200"
          :class="isHamsterEquipped(skin.id) 
            ? 'ring-2 ring-pink-500 bg-pink-50' 
            : (unlockedHamsterSkins.find(s => s.id === skin.id) ? 'hover:shadow-md cursor-pointer hover:-translate-y-1' : 'opacity-50')"
        >
          <div class="text-4xl mb-2 h-12 flex items-center justify-center">
            {{ skin.emoji }}
          </div>
          <div class="font-bold text-gray-800 text-sm mb-1">{{ skin.name }}</div>
          <div v-if="isHamsterEquipped(skin.id)" class="text-pink-500 text-xs font-medium">
            ✓ 使用中
          </div>
          <div v-else-if="unlockedHamsterSkins.find(s => s.id === skin.id)" class="text-gray-400 text-xs">
            点击装备
          </div>
          <div v-else class="text-gray-400 text-xs">
            🔒 未解锁
          </div>
        </div>
      </div>
      
      <div v-if="activeTab === 'snowball'" class="grid grid-cols-3 gap-3">
        <div
          v-for="effect in SNOWBALL_EFFECTS"
          :key="effect.id"
          @click="unlockedSnowballEffects.find(e => e.id === effect.id) && equipEffect(effect.id)"
          class="bg-white/80 backdrop-blur rounded-2xl p-3 text-center shadow-soft transition-all duration-200"
          :class="isEffectEquipped(effect.id) 
            ? 'ring-2 ring-ice-500 bg-ice-50' 
            : (unlockedSnowballEffects.find(e => e.id === effect.id) ? 'hover:shadow-md cursor-pointer hover:-translate-y-1' : 'opacity-50')"
        >
          <div class="text-4xl mb-2 h-12 flex items-center justify-center">
            ❄️
          </div>
          <div class="font-bold text-gray-800 text-sm mb-1">{{ effect.name }}</div>
          <div v-if="isEffectEquipped(effect.id)" class="text-ice-500 text-xs font-medium">
            ✓ 使用中
          </div>
          <div v-else-if="unlockedSnowballEffects.find(e => e.id === effect.id)" class="text-gray-400 text-xs">
            点击装备
          </div>
          <div v-else class="text-gray-400 text-xs">
            🔒 未解锁
          </div>
        </div>
      </div>
      
      <div v-if="activeTab === 'decoration'" class="grid grid-cols-3 gap-3">
        <div
          v-for="deco in DECORATIONS"
          :key="deco.id"
          class="bg-white/80 backdrop-blur rounded-2xl p-3 text-center shadow-soft transition-all duration-200"
          :class="unlockedDecorations.find(d => d.id === deco.id) ? 'hover:shadow-md cursor-pointer hover:-translate-y-1' : 'opacity-50'"
        >
          <div class="text-4xl mb-2 h-12 flex items-center justify-center">
            {{ deco.emoji }}
          </div>
          <div class="font-bold text-gray-800 text-sm mb-1">{{ deco.name }}</div>
          <div v-if="unlockedDecorations.find(d => d.id === deco.id)" class="text-gray-400 text-xs">
            已解锁
          </div>
          <div v-else class="text-gray-400 text-xs">
            🔒 未解锁
          </div>
        </div>
      </div>
    </div>
    
    <BottomNav />
  </div>
</template>
