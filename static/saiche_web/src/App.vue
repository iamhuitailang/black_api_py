<template>
  <div class="min-h-screen">
    <router-view v-if="appReady" />
    <div v-else class="min-h-screen flex items-center justify-center flex-col gap-4">
      <div class="text-2xl text-orange-400">加载中...</div>
      <div class="text-sm text-white/40">{{ loadStatus }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const appReady = ref(false)
const loadStatus = ref('正在初始化...')

onMounted(async () => {
  try {
    loadStatus.value = '正在恢复用户状态...'
    userStore.loadFromStorage()
    
    loadStatus.value = '检查登录状态...'
    console.log('App初始化完成, isLoggedIn:', userStore.isLoggedIn)
    console.log('用户信息:', userStore.user)
    
    loadStatus.value = '准备就绪'
    setTimeout(() => {
      appReady.value = true
    }, 100)
  } catch (e) {
    console.error('App初始化失败:', e)
    loadStatus.value = '初始化失败: ' + e.message
    appReady.value = true
  }
})
</script>
