<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare class="w-8 h-8 text-white" />
          </div>
          <h1 class="text-2xl font-bold text-gray-800">社区意见处理平台</h1>
          <p class="text-gray-500 mt-2">透明高效的社区治理闭环</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <div class="relative">
              <User class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                v-model="form.username"
                type="text"
                placeholder="请输入用户名"
                class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>
          </div>

          <div v-if="error" class="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            <Loader v-if="loading" class="w-5 h-5 animate-spin" />
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>

        <div class="mt-6 pt-6 border-t border-gray-100">
          <p class="text-xs text-gray-500 mb-2 text-center">测试账号：</p>
          <div class="grid grid-cols-3 gap-2 text-xs">
            <div class="bg-gray-50 p-2 rounded text-center">
              <div class="font-medium text-gray-700">居民</div>
              <div class="text-gray-500">resident1 / 123456</div>
            </div>
            <div class="bg-gray-50 p-2 rounded text-center">
              <div class="font-medium text-gray-700">工作人员</div>
              <div class="text-gray-500">staff1 / 123456</div>
            </div>
            <div class="bg-gray-50 p-2 rounded text-center">
              <div class="font-medium text-gray-700">管理员</div>
              <div class="text-gray-500">admin / admin123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { MessageSquare, User, Lock, Loader } from 'lucide-vue-next'
import { authApi, setToken, setUser } from '@/api'

const router = useRouter()
const form = ref({ username: '', password: '' })
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!form.value.username || !form.value.password) {
    error.value = '请输入用户名和密码'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await authApi.login(form.value.username, form.value.password)
    if (res.code === 0 && res.data) {
      setToken(res.data.token)
      setUser(res.data.user)
      if (res.data.user.role === 'admin') {
        router.push('/admin')
      } else if (res.data.user.role === 'staff') {
        router.push('/staff')
      } else {
        router.push('/resident')
      }
    } else {
      error.value = res.message || '登录失败'
    }
  } catch (e) {
    error.value = '网络错误，请重试'
  } finally {
    loading.value = false
  }
}
</script>
