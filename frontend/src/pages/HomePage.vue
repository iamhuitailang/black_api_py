<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
    <div class="text-center">
      <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
        <MessageSquare class="w-10 h-10 text-indigo-600" />
      </div>
      <h1 class="text-3xl font-bold text-gray-800 mb-2">社区意见处理平台</h1>
      <p class="text-gray-500 mb-8">透明高效的社区治理闭环系统</p>
      <div v-if="loading" class="text-gray-400 text-sm">正在跳转...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessageSquare } from 'lucide-vue-next'
import { getUser } from '@/api'

const router = useRouter()
const loading = ref(true)

onMounted(() => {
  const user = getUser()
  setTimeout(() => {
    if (!user) {
      router.replace('/login')
    } else if (user.role === 'admin') {
      router.replace('/admin')
    } else if (user.role === 'staff') {
      router.replace('/staff')
    } else {
      router.replace('/resident')
    }
  }, 500)
})
</script>
