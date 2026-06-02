<template>
  <div class="min-h-screen p-8">
    <nav class="flex justify-between items-center mb-8">
      <div class="flex items-center gap-4">
        <router-link to="/lobby" class="text-white/60 hover:text-white">← 返回大厅</router-link>
        <h1 class="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
          🏁 赛道选择
        </h1>
      </div>
    </nav>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="track in tracks" :key="track.id" class="card p-6 hover:bg-white/15 transition-all">
        <div class="text-center mb-4">
          <div class="text-6xl mb-2">{{ getTrackIcon(track.difficulty) }}</div>
          <h3 class="text-xl font-bold">{{ track.name }}</h3>
          <p class="text-sm text-white/60 mt-1">{{ track.description }}</p>
        </div>

        <div class="space-y-2 mb-6">
          <div class="flex justify-between">
            <span class="text-white/60">难度</span>
            <span class="flex">
              <span v-for="i in 5" :key="i" 
                    :class="i <= track.difficulty ? 'text-yellow-400' : 'text-white/20'">★</span>
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-white/60">圈数</span>
            <span>{{ track.laps }}圈</span>
          </div>
          <div class="flex justify-between">
            <span class="text-white/60">赛道长度</span>
            <span>{{ track.length }}m</span>
          </div>
          <div class="flex justify-between">
            <span class="text-white/60">获胜奖励</span>
            <span class="text-yellow-400">💰{{ track.reward_coins }}</span>
          </div>
        </div>

        <router-link :to="`/game/${track.id}`" class="btn-primary w-full block text-center">
          开始比赛
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'

const tracks = ref([])

onMounted(async () => {
  await loadTracks()
})

async function loadTracks() {
  const response = await api.get('/saiche/track/list/get?page_size=20')
  if (response.code === 0) {
    tracks.value = response.data.items
  }
}

function getTrackIcon(difficulty) {
  const icons = ['🌆', '🏜️', '❄️', '🌋', '🌌']
  return icons[Math.min(difficulty - 1, icons.length - 1)]
}
</script>
