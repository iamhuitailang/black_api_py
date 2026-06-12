<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ShoppingBag, Sparkles, Cat, Gift, Package } from 'lucide-vue-next'
import TopBar from '@/components/TopBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import { usePlayerStore } from '@/stores/player'
import { storeToRefs } from 'pinia'
import { HAMSTER_SKINS, SNOWBALL_EFFECTS, DECORATIONS, ITEMS } from '@/data/gameData'
import BaseModal from '@/components/BaseModal.vue'

const playerStore = usePlayerStore()
const { player } = storeToRefs(playerStore)

const activeTab = ref('hamster')
const selectedItem = ref<any>(null)
const showDetail = ref(false)
const purchaseSuccess = ref(false)

const tabs = [
  { id: 'hamster', name: '仓鼠', icon: Cat },
  { id: 'snowball', name: '雪球', icon: Sparkles },
  { id: 'decoration', name: '装饰', icon: Gift },
  { id: 'item', name: '道具', icon: Package },
]

const currentItems = computed(() => {
  switch (activeTab.value) {
    case 'hamster':
      return HAMSTER_SKINS
    case 'snowball':
      return SNOWBALL_EFFECTS
    case 'decoration':
      return DECORATIONS
    case 'item':
      return ITEMS
    default:
      return []
  }
})

function isUnlocked(item: any): boolean {
  switch (activeTab.value) {
    case 'hamster':
      return player.value.unlocked.hamsterSkins.includes(item.id)
    case 'snowball':
      return player.value.unlocked.snowballEffects.includes(item.id)
    case 'decoration':
      return player.value.unlocked.decorations.includes(item.id)
    case 'item':
      return (player.value.unlocked.items[item.id] || 0) > 0
    default:
      return false
  }
}

function getItemCount(item: any): number {
  if (activeTab.value === 'item') {
    return player.value.unlocked.items[item.id] || 0
  }
  return 0
}

function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: 'bg-gray-400',
    rare: 'bg-blue-500',
    epic: 'bg-purple-500',
    legendary: 'bg-gradient-to-r from-yellow-400 to-orange-500'
  }
  return colors[rarity] || colors.common
}

function getRarityName(rarity: string): string {
  const names: Record<string, string> = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  }
  return names[rarity] || '普通'
}

function openDetail(item: any) {
  selectedItem.value = item
  showDetail.value = true
}

function purchaseItem() {
  if (!selectedItem.value) return
  
  let success = false
  
  switch (activeTab.value) {
    case 'hamster':
      success = playerStore.unlockHamsterSkin(selectedItem.value.id)
      break
    case 'snowball':
      success = playerStore.unlockSnowballEffect(selectedItem.value.id)
      break
    case 'decoration':
      success = playerStore.unlockDecoration(selectedItem.value.id)
      break
    case 'item':
      success = playerStore.buyItem(selectedItem.value.id, 1)
      break
  }
  
  if (success) {
    purchaseSuccess.value = true
    setTimeout(() => {
      purchaseSuccess.value = false
    }, 1500)
  }
}

function canAfford(item: any): boolean {
  if (item.currency === 'coins') {
    return player.value.coins >= item.price
  } else {
    return player.value.diamonds >= item.price
  }
}

onMounted(() => {
  playerStore.loadPlayer()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-ice-200 via-ice-100 to-white pb-20 pt-20">
    <TopBar />
    
    <div class="max-w-lg mx-auto px-4 py-6">
      <h1 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <ShoppingBag class="text-ice-500" :size="28" />
        商店
      </h1>
      
      <div class="bg-white/80 backdrop-blur rounded-2xl p-1 mb-6 shadow-soft">
        <div class="flex">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl transition-all duration-200"
            :class="activeTab === tab.id 
              ? 'bg-ice-500 text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-100'"
          >
            <component :is="tab.icon" :size="18" />
            <span class="text-sm font-medium">{{ tab.name }}</span>
          </button>
        </div>
      </div>
      
      <div class="grid grid-cols-3 gap-3">
        <div
          v-for="item in currentItems"
          :key="item.id"
          @click="openDetail(item)"
          class="bg-white/80 backdrop-blur rounded-2xl p-3 text-center shadow-soft hover:shadow-md transform hover:-translate-y-1 transition-all duration-200 cursor-pointer relative"
        >
          <div 
            class="absolute top-2 right-2 text-[10px] text-white px-2 py-0.5 rounded-full font-bold"
            :class="getRarityColor(item.rarity)"
          >
            {{ getRarityName(item.rarity) }}
          </div>
          
          <div class="text-4xl mb-2 h-12 flex items-center justify-center">
            {{ item.emoji || '❄️' }}
          </div>
          <div class="font-bold text-gray-800 text-sm mb-1 truncate">{{ item.name }}</div>
          
          <div v-if="activeTab === 'item'" class="text-xs text-gray-400 mb-1">
            拥有: {{ getItemCount(item) }}
          </div>
          
          <div v-if="!isUnlocked(item) || activeTab === 'item'" class="flex items-center justify-center gap-1">
            <span v-if="item.currency === 'coins'" class="text-yellow-500">💰</span>
            <span v-else class="text-blue-500">💎</span>
            <span class="font-bold text-sm" :class="canAfford(item) ? 'text-gray-700' : 'text-red-400'">
              {{ item.price }}
            </span>
          </div>
          <div v-else class="text-green-500 text-sm font-medium">
            ✓ 已拥有
          </div>
        </div>
      </div>
    </div>
    
    <BottomNav />
    
    <BaseModal v-if="selectedItem" :show="showDetail" :title="selectedItem.name" @close="showDetail = false">
      <div class="text-center">
        <div class="text-6xl mb-4">{{ selectedItem.emoji || '❄️' }}</div>
        
        <div 
          class="inline-block text-xs text-white px-3 py-1 rounded-full font-bold mb-3"
          :class="getRarityColor(selectedItem.rarity)"
        >
          {{ getRarityName(selectedItem.rarity) }}
        </div>
        
        <p class="text-gray-600 mb-6">{{ selectedItem.description }}</p>
        
        <div v-if="activeTab !== 'item' && isUnlocked(selectedItem)" class="mb-4">
          <div class="text-green-500 font-bold">✓ 已拥有</div>
        </div>
        
        <div v-else class="flex items-center justify-center gap-2 mb-6">
          <span class="text-2xl">{{ selectedItem.currency === 'coins' ? '💰' : '💎' }}</span>
          <span class="text-3xl font-bold" :class="canAfford(selectedItem) ? 'text-gray-800' : 'text-red-400'">
            {{ selectedItem.price }}
          </span>
        </div>
        
        <button
          @click="purchaseItem"
          :disabled="!canAfford(selectedItem) && !isUnlocked(selectedItem)"
          class="w-full py-4 rounded-xl font-bold text-lg transition-all"
          :class="canAfford(selectedItem) 
            ? 'bg-gradient-to-r from-ice-400 to-ice-600 text-white hover:shadow-lg' 
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'"
        >
          {{ purchaseSuccess ? '✓ 购买成功！' : (activeTab === 'item' ? '购买' : (isUnlocked(selectedItem) ? '已拥有' : '立即购买')) }}
        </button>
      </div>
    </BaseModal>
  </div>
</template>
