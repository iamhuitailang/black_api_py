<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { User, Trophy, BarChart3, Settings, Edit3, Check } from 'lucide-vue-next'
import TopBar from '@/components/TopBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import { usePlayerStore } from '@/stores/player'
import { storeToRefs } from 'pinia'
import { ACHIEVEMENTS, HAMSTER_SKINS, SNOWBALL_EFFECTS } from '@/data/gameData'
import BaseModal from '@/components/BaseModal.vue'

const playerStore = usePlayerStore()
const { player, levelInfo, winRate, currentHamsterSkin } = storeToRefs(playerStore)

const activeTab = ref('stats')
const editingName = ref(false)
const newNickname = ref('')
const showAchievementDetail = ref(false)
const selectedAchievement = ref<any>(null)

const tabs = [
  { id: 'stats', name: '数据', icon: BarChart3 },
  { id: 'achievements', name: '成就', icon: Trophy },
  { id: 'collection', name: '收藏', icon: User },
]

const unlockedAchievements = computed(() => {
  return ACHIEVEMENTS.filter(a => player.value.achievements[a.id])
})

const claimedAchievements = computed(() => {
  return ACHIEVEMENTS.filter(a => player.value.claimedAchievements[a.id])
})

const unlockedSkinCount = computed(() => {
  return player.value.unlocked.hamsterSkins.length
})

const totalSkinCount = computed(() => {
  return HAMSTER_SKINS.length
})

const unlockedEffectCount = computed(() => {
  return player.value.unlocked.snowballEffects.length
})

const totalEffectCount = computed(() => {
  return SNOWBALL_EFFECTS.length
})

function startEditName() {
  newNickname.value = player.value.nickname
  editingName.value = true
}

function saveNickname() {
  if (newNickname.value.trim()) {
    playerStore.updateNickname(newNickname.value.trim())
  }
  editingName.value = false
}

function openAchievement(achievement: any) {
  selectedAchievement.value = achievement
  showAchievementDetail.value = true
}

function claimAchievement() {
  if (selectedAchievement.value) {
    playerStore.claimAchievement(selectedAchievement.value.id)
  }
}

function canClaim(achievementId: string): boolean {
  return player.value.achievements[achievementId] && !player.value.claimedAchievements[achievementId]
}

function getAchievementProgress(achievement: any): number {
  const stats = player.value.stats
  const condition = achievement.condition
  
  let current = 0
  switch (condition.type) {
    case 'win_count':
      current = stats.wins
      break
    case 'total_games':
      current = stats.totalGames
      break
    case 'max_snowball':
      current = stats.maxSnowballSize
      break
    case 'total_coins':
      current = stats.totalCoinsEarned
      break
    case 'level':
      current = levelInfo.value.level
      break
  }
  
  return Math.min(100, (current / condition.value) * 100)
}

function getAchievementCurrent(achievement: any): number {
  const stats = player.value.stats
  const condition = achievement.condition
  
  switch (condition.type) {
    case 'win_count':
      return stats.wins
    case 'total_games':
      return stats.totalGames
    case 'max_snowball':
      return stats.maxSnowballSize
    case 'total_coins':
      return stats.totalCoinsEarned
    case 'level':
      return levelInfo.value.level
    default:
      return 0
  }
}

onMounted(() => {
  playerStore.loadPlayer()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-purple-100 via-pink-50 to-white pb-20 pt-20">
    <TopBar />
    
    <div class="max-w-lg mx-auto px-4 py-6">
      <div class="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-6 text-white shadow-lg mb-6">
        <div class="flex items-center gap-4">
          <div class="text-6xl">{{ currentHamsterSkin.emoji }}</div>
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <h2 class="text-xl font-bold">{{ player.nickname }}</h2>
              <button @click="startEditName" class="p-1 hover:bg-white/20 rounded">
                <Edit3 :size="16" />
              </button>
            </div>
            <div class="text-white/80 text-sm mt-1">Lv.{{ levelInfo.level }}</div>
            <div class="mt-2">
              <div class="flex justify-between text-xs text-white/70 mb-1">
                <span>经验值</span>
                <span>{{ levelInfo.currentExp }} / {{ levelInfo.expForNextLevel }}</span>
              </div>
              <div class="h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-yellow-300 rounded-full transition-all duration-500"
                  :style="{ width: (levelInfo.currentExp / levelInfo.expForNextLevel * 100) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-white/20">
          <div class="text-center">
            <div class="text-2xl font-bold">{{ player.stats.totalGames }}</div>
            <div class="text-xs text-white/70">总场次</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold">{{ winRate }}%</div>
            <div class="text-xs text-white/70">胜率</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold">{{ player.stats.maxSnowballSize }}</div>
            <div class="text-xs text-white/70">最大雪球</div>
          </div>
        </div>
      </div>
      
      <div v-if="editingName" class="bg-white rounded-2xl p-4 mb-4 shadow-soft">
        <input 
          v-model="newNickname"
          type="text"
          class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none text-center text-lg"
          placeholder="输入新昵称"
          maxlength="12"
          @keyup.enter="saveNickname"
        />
        <div class="flex gap-2 mt-3">
          <button 
            @click="editingName = false"
            class="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 font-medium"
          >
            取消
          </button>
          <button 
            @click="saveNickname"
            class="flex-1 py-2 rounded-xl bg-purple-500 text-white font-medium"
          >
            确定
          </button>
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
              ? 'bg-purple-500 text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-100'"
          >
            <component :is="tab.icon" :size="18" />
            <span class="text-sm font-medium">{{ tab.name }}</span>
          </button>
        </div>
      </div>
      
      <div v-if="activeTab === 'stats'" class="space-y-4">
        <div class="bg-white/80 backdrop-blur rounded-2xl p-4 shadow-soft">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 :size="20" class="text-purple-500" />
            详细数据
          </h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-gray-600">总游戏场次</span>
              <span class="font-bold text-gray-800">{{ player.stats.totalGames }} 场</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">胜利场次</span>
              <span class="font-bold text-green-500">{{ player.stats.wins }} 场</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">胜率</span>
              <span class="font-bold text-purple-500">{{ winRate }}%</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">历史最大雪球</span>
              <span class="font-bold text-ice-500">{{ player.stats.maxSnowballSize }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">累计获得金币</span>
              <span class="font-bold text-yellow-500">{{ player.stats.totalCoinsEarned }}</span>
            </div>
          </div>
        </div>
        
        <div class="bg-white/80 backdrop-blur rounded-2xl p-4 shadow-soft">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Trophy :size="20" class="text-yellow-500" />
            成就进度
          </h3>
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-500">
              {{ unlockedAchievements.length }} / {{ ACHIEVEMENTS.length }}
            </div>
            <div class="text-sm text-gray-500 mt-1">已解锁成就</div>
            <div class="w-full h-3 bg-gray-200 rounded-full mt-3 overflow-hidden">
              <div 
                class="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-500"
                :style="{ width: (unlockedAchievements.length / ACHIEVEMENTS.length * 100) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="activeTab === 'achievements'" class="space-y-3">
        <div
          v-for="achievement in ACHIEVEMENTS"
          :key="achievement.id"
          @click="openAchievement(achievement)"
          class="bg-white/80 backdrop-blur rounded-2xl p-4 shadow-soft cursor-pointer hover:shadow-md transition-all"
          :class="{ 'opacity-60': !player.achievements[achievement.id] }"
        >
          <div class="flex items-center gap-4">
            <div 
              class="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
              :class="player.achievements[achievement.id] ? 'bg-yellow-100' : 'bg-gray-100 grayscale'"
            >
              {{ achievement.emoji }}
            </div>
            <div class="flex-1">
              <div class="font-bold text-gray-800">{{ achievement.name }}</div>
              <div class="text-sm text-gray-500">{{ achievement.description }}</div>
              <div class="mt-2">
                <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-500"
                    :style="{ width: getAchievementProgress(achievement) + '%' }"
                  ></div>
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  {{ getAchievementCurrent(achievement) }} / {{ achievement.condition.value }}
                </div>
              </div>
            </div>
            <div v-if="canClaim(achievement.id)" class="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
              领取
            </div>
            <div v-else-if="player.claimedAchievements[achievement.id]" class="text-green-500">
              <Check :size="24" />
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="activeTab === 'collection'" class="space-y-6">
        <div class="bg-white/80 backdrop-blur rounded-2xl p-4 shadow-soft">
          <h3 class="font-bold text-gray-800 mb-4">仓鼠皮肤 ({{ unlockedSkinCount }}/{{ totalSkinCount }})</h3>
          <div class="grid grid-cols-4 gap-2">
            <div
              v-for="skin in HAMSTER_SKINS"
              :key="skin.id"
              class="aspect-square rounded-xl flex items-center justify-center text-3xl"
              :class="player.unlocked.hamsterSkins.includes(skin.id) ? 'bg-ice-50' : 'bg-gray-100 grayscale opacity-50'"
            >
              {{ skin.emoji }}
            </div>
          </div>
        </div>
        
        <div class="bg-white/80 backdrop-blur rounded-2xl p-4 shadow-soft">
          <h3 class="font-bold text-gray-800 mb-4">雪球特效 ({{ unlockedEffectCount }}/{{ totalEffectCount }})</h3>
          <div class="grid grid-cols-5 gap-2">
            <div
              v-for="effect in SNOWBALL_EFFECTS"
              :key="effect.id"
              class="aspect-square rounded-xl flex items-center justify-center text-2xl"
              :class="player.unlocked.snowballEffects.includes(effect.id) ? 'bg-purple-50' : 'bg-gray-100 grayscale opacity-50'"
            >
              ❄️
            </div>
          </div>
        </div>
        
        <div class="bg-white/80 backdrop-blur rounded-2xl p-4 shadow-soft">
          <h3 class="font-bold text-gray-800 mb-4">已解锁地图</h3>
          <div class="space-y-2">
            <div
              v-for="mapId in player.unlocked.maps"
              :key="mapId"
              class="flex items-center gap-3 p-2 rounded-xl bg-gray-50"
            >
              <span class="text-2xl">
                {{ mapId === 'ice_world' ? '🏔️' : 
                   mapId === 'south_pole' ? '🐧' :
                   mapId === 'aurora_snowfield' ? '🌌' : '🍬' }}
              </span>
              <span class="font-medium text-gray-700">
                {{ mapId === 'ice_world' ? '冰雪世界' : 
                   mapId === 'south_pole' ? '南极之巅' :
                   mapId === 'aurora_snowfield' ? '极光雪原' : '糖果冰原' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <BottomNav />
    
    <BaseModal v-if="selectedAchievement" :show="showAchievementDetail" :title="selectedAchievement.name" @close="showAchievementDetail = false">
      <div class="text-center">
        <div class="text-6xl mb-4">{{ selectedAchievement.emoji }}</div>
        <p class="text-gray-600 mb-4">{{ selectedAchievement.description }}</p>
        
        <div class="bg-gray-50 rounded-xl p-4 mb-6">
          <div class="text-sm text-gray-500 mb-2">奖励</div>
          <div class="flex items-center justify-center gap-2">
            <span class="text-2xl">{{ selectedAchievement.reward.type === 'coins' ? '💰' : '💎' }}</span>
            <span class="text-2xl font-bold text-yellow-500">+{{ selectedAchievement.reward.amount }}</span>
          </div>
        </div>
        
        <div class="mb-6">
          <div class="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
              :style="{ width: getAchievementProgress(selectedAchievement) + '%' }"
            ></div>
          </div>
          <div class="text-sm text-gray-500 mt-2">
            {{ getAchievementCurrent(selectedAchievement) }} / {{ selectedAchievement.condition.value }}
          </div>
        </div>
        
        <button
          v-if="canClaim(selectedAchievement.id)"
          @click="claimAchievement"
          class="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-lg hover:shadow-lg transition-all"
        >
          领取奖励
        </button>
        <button
          v-else-if="player.claimedAchievements[selectedAchievement.id]"
          class="w-full py-4 rounded-xl bg-green-100 text-green-600 font-bold text-lg"
          disabled
        >
          ✓ 已领取
        </button>
        <button
          v-else
          class="w-full py-4 rounded-xl bg-gray-200 text-gray-400 font-bold text-lg"
          disabled
        >
          未达成
        </button>
      </div>
    </BaseModal>
  </div>
</template>
