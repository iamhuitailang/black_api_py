<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">📊 数据统计</h2>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      <div class="card p-6 text-center">
        <div class="text-4xl mb-2">👥</div>
        <div class="text-3xl font-bold text-orange-400">{{ stats?.total_users || 0 }}</div>
        <div class="text-sm text-white/60">总用户数</div>
      </div>
      <div class="card p-6 text-center">
        <div class="text-4xl mb-2">🏎️</div>
        <div class="text-3xl font-bold text-green-400">{{ stats?.total_races || 0 }}</div>
        <div class="text-sm text-white/60">总比赛场次</div>
      </div>
      <div class="card p-6 text-center">
        <div class="text-4xl mb-2">🏁</div>
        <div class="text-3xl font-bold text-blue-400">{{ stats?.total_tracks || 0 }}</div>
        <div class="text-sm text-white/60">赛道数量</div>
      </div>
      <div class="card p-6 text-center">
        <div class="text-4xl mb-2">💰</div>
        <div class="text-3xl font-bold text-yellow-400">{{ stats?.total_coins || 0 }}</div>
        <div class="text-sm text-white/60">累计金币发放</div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card p-6">
        <h3 class="text-xl font-bold mb-4">📈 今日数据</h3>
        <div class="space-y-4">
          <div class="flex justify-between">
            <span class="text-white/60">今日比赛场次</span>
            <span class="font-bold">{{ stats?.today_races || 0 }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-white/60">总胜利场次</span>
            <span class="font-bold">{{ stats?.total_wins || 0 }}</span>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <h3 class="text-xl font-bold mb-4">🕐 最近比赛</h3>
        <div class="space-y-3">
          <div v-for="race in stats?.recent_races || []" :key="race.id"
               class="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div>
              <div class="font-bold">{{ race.nickname }}</div>
              <div class="text-sm text-white/60">{{ race.track_name }}</div>
            </div>
            <div class="text-right">
              <div class="text-orange-400">{{ race.finish_time?.toFixed(2) }}s</div>
              <div class="text-sm text-yellow-400">+{{ race.reward_coins }}💰</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'

const stats = ref(null)

onMounted(async () => {
  await loadStats()
})

async function loadStats() {
  const response = await api.get('/saiche/admin/stats/get')
  if (response.code === 0) {
    stats.value = response.data
  }
}
</script>
