<template>
  <div class="min-h-screen p-8">
    <h1 class="text-3xl font-bold text-orange-400 mb-8">测试页面</h1>
    
    <div class="mb-8 p-4 bg-white/10 rounded-lg">
      <h2 class="text-xl font-bold mb-4">用户状态</h2>
      <p>isLoaded: {{ userStore.isLoaded }}</p>
      <p>isLoggedIn: {{ userStore.isLoggedIn }}</p>
      <p>isAdmin: {{ userStore.isAdmin }}</p>
      <p>token: {{ userStore.token ? '已设置' : '未设置' }}</p>
      <p>user: {{ userStore.user ? JSON.stringify(userStore.user) : 'null' }}</p>
    </div>

    <div class="mb-8 p-4 bg-white/10 rounded-lg">
      <h2 class="text-xl font-bold mb-4">快速注册测试</h2>
      <button @click="testRegister" class="btn-primary mr-4">
        测试注册 (test001/123456)
      </button>
      <button @click="testLogin" class="btn-secondary">
        测试登录 (test001/123456)
      </button>
      <div class="mt-4 p-2 bg-black/30 rounded">
        <p>结果: {{ testResult }}</p>
      </div>
    </div>

    <div class="mb-8 p-4 bg-white/10 rounded-lg">
      <h2 class="text-xl font-bold mb-4">API测试</h2>
      <button @click="testApi" class="btn-primary">
        测试赛车列表API
      </button>
      <div class="mt-4 p-2 bg-black/30 rounded">
        <p>API结果: {{ apiResult }}</p>
      </div>
    </div>

    <div class="mb-8 p-4 bg-white/10 rounded-lg">
      <h2 class="text-xl font-bold mb-4">导航</h2>
      <button @click="$router.push('/')" class="btn-secondary mr-2">首页</button>
      <button @click="$router.push('/login')" class="btn-secondary mr-2">登录</button>
      <button @click="$router.push('/register')" class="btn-secondary mr-2">注册</button>
      <button @click="$router.push('/lobby')" class="btn-secondary">大厅</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import api from '@/utils/api'

const userStore = useUserStore()
const testResult = ref('未测试')
const apiResult = ref('未测试')

let testCount = 0

async function testRegister() {
  testCount++
  const phone = `test${String(testCount).padStart(3, '0')}`
  testResult.value = '正在注册...'
  try {
    const result = await userStore.register(phone, '123456', `测试用户${testCount}`)
    testResult.value = JSON.stringify(result)
  } catch (e) {
    testResult.value = '异常: ' + e.message
  }
}

async function testLogin() {
  testResult.value = '正在登录...'
  try {
    const result = await userStore.login('test001', '123456')
    testResult.value = JSON.stringify(result)
  } catch (e) {
    testResult.value = '异常: ' + e.message
  }
}

async function testApi() {
  apiResult.value = '正在请求...'
  try {
    const result = await api.get('/saiche/car/list/get?page_size=2')
    apiResult.value = JSON.stringify(result)
  } catch (e) {
    apiResult.value = '异常: ' + e.message
  }
}
</script>
