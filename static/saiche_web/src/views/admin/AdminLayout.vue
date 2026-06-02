<template>
  <div class="min-h-screen flex">
    <aside class="w-64 bg-dark/80 backdrop-blur-md border-r border-white/10 p-4">
      <h1 class="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent mb-8">
        🏎️ 后台管理
      </h1>

      <nav class="space-y-2">
        <router-link to="/admin" class="block px-4 py-3 rounded-lg transition-all"
                     :class="$route.path === '/admin' ? 'bg-orange-500/20 text-orange-400' : 'hover:bg-white/10'">
          📊 数据统计
        </router-link>
        <router-link to="/admin/users" class="block px-4 py-3 rounded-lg transition-all"
                     :class="$route.path === '/admin/users' ? 'bg-orange-500/20 text-orange-400' : 'hover:bg-white/10'">
          👥 用户管理
        </router-link>
        <router-link to="/admin/tracks" class="block px-4 py-3 rounded-lg transition-all"
                     :class="$route.path === '/admin/tracks' ? 'bg-orange-500/20 text-orange-400' : 'hover:bg-white/10'">
          🏁 赛道管理
        </router-link>
        <router-link to="/admin/cars" class="block px-4 py-3 rounded-lg transition-all"
                     :class="$route.path === '/admin/cars' ? 'bg-orange-500/20 text-orange-400' : 'hover:bg-white/10'">
          🚗 赛车管理
        </router-link>
      </nav>

      <div class="absolute bottom-4 left-4 right-4">
        <button @click="handleLogout" class="w-full px-4 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all">
          🚪 退出管理
        </button>
      </div>
    </aside>

    <main class="flex-1 p-8 overflow-auto">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

function handleLogout() {
  userStore.adminLogout()
  router.push('/')
}
</script>
