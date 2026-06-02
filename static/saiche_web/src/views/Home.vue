<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-8">
    <div class="text-center mb-12 animate-float">
      <h1 class="game-title mb-4">QQ飞车</h1>
      <p class="text-xl text-white/70">极速竞速，超越极限</p>
    </div>

    <div class="flex flex-col gap-4 w-full max-w-md">
      <router-link to="/lobby" v-if="userStore.isLoggedIn" class="btn-primary text-center text-lg">
        🏎️ 进入游戏
      </router-link>
      <template v-else>
        <router-link to="/login" class="btn-primary text-center text-lg">
          🚀 立即登录
        </router-link>
        <router-link to="/register" class="btn-secondary text-center">
          📝 注册账号
        </router-link>
      </template>
    </div>

    <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
      <div class="card p-6 text-center">
        <div class="text-5xl mb-4">🏎️</div>
        <h3 class="text-xl font-bold mb-2 text-orange-400">极速竞速</h3>
        <p class="text-white/60">多条赛道，多种赛车，体验极致速度</p>
      </div>
      <div class="card p-6 text-center">
        <div class="text-5xl mb-4">💎</div>
        <h3 class="text-xl font-bold mb-2 text-orange-400">道具攻击</h3>
        <p class="text-white/60">氮气加速、导弹攻击，策略制胜</p>
      </div>
      <div class="card p-6 text-center">
        <div class="text-5xl mb-4">🏆</div>
        <h3 class="text-xl font-bold mb-2 text-orange-400">排行榜</h3>
        <p class="text-white/60">全服竞技，争夺车神称号</p>
      </div>
    </div>

    <div class="mt-8 text-white/40 text-sm">
      默认管理员账号: admin / admin123
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
</script>
