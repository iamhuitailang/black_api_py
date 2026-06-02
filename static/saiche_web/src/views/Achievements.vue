<template>
  <div class="min-h-screen p-8">
    <nav class="flex justify-between items-center mb-8">
      <div class="flex items-center gap-4">
        <router-link to="/lobby" class="text-white/60 hover:text-white">← 返回大厅</router-link>
        <h1 class="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
          🎖️ 成就系统
        </h1>
      </div>
    </nav>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="achievement in achievements" :key="achievement.id"
           class="card p-6"
           :class="{ 'ring-2 ring-yellow-400': achievement.is_unlocked }">
        <div class="flex items-start gap-4">
          <div class="text-5xl" :class="{ 'grayscale opacity-50': !achievement.is_unlocked }">
            {{ achievement.icon || '🏆' }}
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-bold" :class="{ 'text-yellow-400': achievement.is_unlocked }">
              {{ achievement.name }}
            </h3>
            <p class="text-sm text-white/60 mt-1">{{ achievement.description }}</p>
            
            <div class="mt-3">
              <div class="flex justify-between text-xs mb-1">
                <span class="text-white/60">进度</span>
                <span>{{ Math.min(achievement.progress || 0, achievement.condition_value) }}/{{ achievement.condition_value }}</span>
              </div>
              <div class="h-2 bg-white/10 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all"
                     :style="{ width: `${Math.min((achievement.progress || 0) / achievement.condition_value * 100, 100)}%` }"></div>
              </div>
            </div>

            <div class="mt-3 flex items-center gap-3 text-sm">
              <span class="text-yellow-400">💰 {{ achievement.reward_coins }}</span>
              <span class="text-blue-400">⭐ {{ achievement.reward_exp }} EXP</span>
            </div>

            <div v-if="achievement.is_unlocked" class="mt-3 text-green-400 text-sm font-bold">
              ✅ 已解锁
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

const achievements = ref([])

onMounted(async () => {
  await loadAchievements()
})

async function loadAchievements() {
  const response = await api.get('/saiche/achievement/user/list/get')
  if (response.code === 0) {
    achievements.value = response.data
  }
}
</script>
