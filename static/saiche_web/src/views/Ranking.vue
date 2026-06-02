<template>
  <div class="min-h-screen p-8">
    <nav class="flex justify-between items-center mb-8">
      <div class="flex items-center gap-4">
        <router-link to="/lobby" class="text-white/60 hover:text-white">← 返回大厅</router-link>
        <h1 class="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
          🏆 全服排行榜
        </h1>
      </div>
    </nav>

    <div class="card p-6 max-w-3xl mx-auto">
      <div class="space-y-3">
        <div v-for="(user, index) in rankings" :key="user.id"
             class="flex items-center gap-4 p-4 rounded-xl transition-all"
             :class="index < 3 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20' : 'bg-white/5'">
          <div class="w-12 h-12 flex items-center justify-center text-2xl font-bold">
            <span v-if="index === 0">🥇</span>
            <span v-else-if="index === 1">🥈</span>
            <span v-else-if="index === 2">🥉</span>
            <span v-else class="text-white/40">{{ index + 1 }}</span>
          </div>

          <div class="flex-1">
            <div class="font-bold text-lg">{{ user.nickname || '匿名玩家' }}</div>
            <div class="text-sm text-white/60">
              Lv.{{ user.level }} · 胜率 {{ user.win_rate || 0 }}%
            </div>
          </div>

          <div class="text-right">
            <div class="text-2xl font-bold text-orange-400">{{ user.total_coins_earned || 0 }}</div>
            <div class="text-sm text-white/60">累计金币</div>
          </div>
        </div>
      </div>

      <div v-if="rankings.length === 0" class="text-center py-10">
        <div class="text-6xl mb-4">🏆</div>
        <p class="text-white/60">暂无排行数据</p>
      </div>

      <div class="mt-6 flex justify-center gap-2">
        <button @click="loadRankings(currentPage - 1)" 
                :disabled="currentPage <= 1"
                class="px-4 py-2 bg-white/10 rounded-lg disabled:opacity-50 hover:bg-white/20">
          上一页
        </button>
        <span class="px-4 py-2">第 {{ currentPage }} 页</span>
        <button @click="loadRankings(currentPage + 1)"
                class="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20">
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'

const rankings = ref([])
const currentPage = ref(1)

onMounted(async () => {
  await loadRankings(1)
})

async function loadRankings(page) {
  if (page < 1) return
  const response = await api.get(`/saiche/race/rank/list/get?page=${page}&page_size=20`)
  if (response.code === 0) {
    rankings.value = response.data.items
    currentPage.value = page
  }
}
</script>
