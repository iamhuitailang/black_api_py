<template>
  <div class="min-h-screen p-8">
    <nav class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
        🏎️ QQ飞车
      </h1>
      <div class="flex items-center gap-4">
        <div class="card px-4 py-2 flex items-center gap-2">
          <span class="text-yellow-400">💰</span>
          <span class="font-bold">{{ userStore.user?.coins || 0 }}</span>
        </div>
        <div class="card px-4 py-2 flex items-center gap-2">
          <span class="text-blue-400">⭐</span>
          <span class="font-bold">Lv.{{ userStore.user?.level || 1 }}</span>
        </div>
        <div class="relative">
          <button @click="showUserMenu = !showUserMenu" class="card px-4 py-2 flex items-center gap-2 hover:bg-white/20">
            <span>{{ userStore.user?.nickname || '玩家' }}</span>
            <span class="text-sm">▼</span>
          </button>
          <div v-if="showUserMenu" class="absolute right-0 mt-2 w-48 card py-2 z-50">
            <router-link to="/profile" class="block px-4 py-2 hover:bg-white/10">个人中心</router-link>
            <router-link to="/garage" class="block px-4 py-2 hover:bg-white/10">我的车库</router-link>
            <button @click="handleLogout" class="w-full text-left px-4 py-2 hover:bg-white/10 text-red-400">
              退出登录
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <router-link to="/tracks" class="card p-6 text-center hover:bg-white/20 transition-all">
        <div class="text-5xl mb-4">🏁</div>
        <h3 class="text-xl font-bold mb-2">开始比赛</h3>
        <p class="text-white/60 text-sm">选择赛道，开始竞速</p>
      </router-link>

      <router-link to="/garage" class="card p-6 text-center hover:bg-white/20 transition-all">
        <div class="text-5xl mb-4">🚗</div>
        <h3 class="text-xl font-bold mb-2">我的车库</h3>
        <p class="text-white/60 text-sm">查看和升级赛车</p>
      </router-link>

      <router-link to="/ranking" class="card p-6 text-center hover:bg-white/20 transition-all">
        <div class="text-5xl mb-4">🏆</div>
        <h3 class="text-xl font-bold mb-2">排行榜</h3>
        <p class="text-white/60 text-sm">全服玩家排名</p>
      </router-link>

      <router-link to="/achievements" class="card p-6 text-center hover:bg-white/20 transition-all">
        <div class="text-5xl mb-4">🎖️</div>
        <h3 class="text-xl font-bold mb-2">成就系统</h3>
        <p class="text-white/60 text-sm">查看成就进度</p>
      </router-link>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="card p-6">
        <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
          <span>📊</span> 我的战绩
        </h3>
        <div v-if="stats" class="grid grid-cols-2 gap-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-orange-400">{{ stats.total_races || 0 }}</div>
            <div class="text-sm text-white/60">总场次</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-green-400">{{ stats.win_count || 0 }}</div>
            <div class="text-sm text-white/60">胜利场次</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-400">{{ stats.win_rate || 0 }}%</div>
            <div class="text-sm text-white/60">胜率</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-yellow-400">{{ stats.consecutive_wins || 0 }}</div>
            <div class="text-sm text-white/60">当前连胜</div>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🔥</span> 热门赛道
        </h3>
        <div class="space-y-3">
          <div v-for="track in hotTracks" :key="track.id" class="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🏎️</span>
              <div>
                <div class="font-bold">{{ track.name }}</div>
                <div class="text-sm text-white/60">{{ track.difficulty_text }} · {{ track.laps }}圈</div>
              </div>
            </div>
            <router-link :to="`/game/${track.id}`" class="btn-secondary text-sm">
              开始
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import api from '@/utils/api'

const router = useRouter()
const userStore = useUserStore()
const showUserMenu = ref(false)
const stats = ref(null)
const hotTracks = ref([])

onMounted(async () => {
  await loadStats()
  await loadTracks()
})

async function loadStats() {
  const response = await api.get('/saiche/race/user/stats/get')
  if (response.code === 0) {
    stats.value = response.data
  }
}

async function loadTracks() {
  const response = await api.get('/saiche/track/list/get')
  if (response.code === 0) {
    hotTracks.value = response.data.items.slice(0, 3)
  }
}

function handleLogout() {
  userStore.logout()
  router.push('/')
}
</script>
