<template>
  <nav class="navbar">
    <router-link to="/" class="navbar-brand">
      👻 幽灵猎人
    </router-link>
    <div class="navbar-nav">
      <router-link to="/">首页</router-link>
      <router-link to="/explore">探索</router-link>
      <router-link to="/tasks">任务</router-link>
      <router-link to="/inventory">背包</router-link>
      <router-link to="/archive">档案</router-link>
      <router-link to="/shop">商店</router-link>
    </div>
    <div class="user-info" v-if="authStore.user">
      <div class="user-stats">
        <span class="stat-item">
          <span>⭐</span>
          <span>Lv.{{ authStore.user.level }}</span>
        </span>
        <span class="stat-item">
          <span>💰</span>
          <span>{{ authStore.user.coins }}</span>
        </span>
        <span class="stat-item">
          <span>❤️</span>
          <span>{{ gameState?.sanity || 100 }}%</span>
        </span>
      </div>
      <button class="btn btn-outline" @click="handleLogout">退出</button>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '../store'
import { useRouter } from 'vue-router'
import { computed } from 'vue'

const authStore = useAuthStore()
const router = useRouter()

const gameState = computed(() => authStore.gameState)

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
