<template>
  <div class="min-h-screen flex items-center justify-center p-8">
    <div class="card p-8 w-full max-w-md">
      <h2 class="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
        用户登录
      </h2>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-sm mb-2 text-white/70">手机号</label>
          <input
            v-model="form.phone"
            type="tel"
            placeholder="请输入手机号"
            class="input-field"
            required
          />
        </div>

        <div>
          <label class="block text-sm mb-2 text-white/70">密码</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            class="input-field"
            required
          />
        </div>

        <div v-if="errorMessage" class="text-red-400 text-sm text-center">
          {{ errorMessage }}
        </div>

        <button type="submit" class="btn-primary w-full" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-white/60">
          还没有账号？
          <router-link to="/register" class="text-orange-400 hover:text-orange-300">
            立即注册
          </router-link>
        </p>
      </div>

      <div class="mt-6 pt-6 border-t border-white/10">
        <button @click="showAdminLogin = !showAdminLogin" class="text-white/40 text-sm w-full text-center hover:text-white/60">
          {{ showAdminLogin ? '返回用户登录' : '管理员登录' }}
        </button>

        <form v-if="showAdminLogin" @submit.prevent="handleAdminLogin" class="mt-6 space-y-6">
          <div>
            <label class="block text-sm mb-2 text-white/70">管理员账号</label>
            <input
              v-model="adminForm.username"
              type="text"
              placeholder="请输入管理员账号"
              class="input-field"
              required
            />
          </div>

          <div>
            <label class="block text-sm mb-2 text-white/70">密码</label>
            <input
              v-model="adminForm.password"
              type="password"
              placeholder="请输入密码"
              class="input-field"
              required
            />
          </div>

          <button type="submit" class="btn-secondary w-full" :disabled="adminLoading">
            {{ adminLoading ? '登录中...' : '管理员登录' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const form = ref({
  phone: '',
  password: ''
})

const adminForm = ref({
  username: '',
  password: ''
})

const loading = ref(false)
const adminLoading = ref(false)
const errorMessage = ref('')
const showAdminLogin = ref(false)

//#region debug-point login-form-submit
const __DBG = {
  sessionId: 'saiche-login-register-bug',
  runId: Date.now(),
  report: (data) => {
    try {
      fetch('http://127.0.0.1:7777/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(() => {})
    } catch (e) {}
  }
}
//#endregion debug-point login-form-submit

async function handleLogin() {
  //#region debug-point login-form-submit
  __DBG.report({
    sessionId: __DBG.sessionId,
    runId: __DBG.runId,
    hypothesisId: 'H5',
    location: 'Login.vue:handleLogin:start',
    type: 'info',
    data: { phone: form.value.phone, hasPassword: !!form.value.password }
  })
  //#endregion debug-point login-form-submit
  
  console.log('开始登录, 手机号:', form.value.phone)
  loading.value = true
  errorMessage.value = ''

  try {
    //#region debug-point login-form-submit
    __DBG.report({
      sessionId: __DBG.sessionId,
      runId: __DBG.runId,
      hypothesisId: 'H1',
      location: 'Login.vue:handleLogin:before-store-call',
      type: 'info',
      data: { phone: form.value.phone }
    })
    //#endregion debug-point login-form-submit
    
    const result = await userStore.login(form.value.phone, form.value.password)
    
    //#region debug-point login-form-submit
    __DBG.report({
      sessionId: __DBG.sessionId,
      runId: __DBG.runId,
      hypothesisId: 'H3',
      location: 'Login.vue:handleLogin:after-store-call',
      type: 'info',
      data: { result, phone: form.value.phone }
    })
    //#endregion debug-point login-form-submit
    
    console.log('登录结果:', result)
    if (result.success) {
      //#region debug-point login-form-submit
      __DBG.report({
        sessionId: __DBG.sessionId,
        runId: __DBG.runId,
        hypothesisId: 'H4',
        location: 'Login.vue:handleLogin:before-router-push',
        type: 'info',
        data: { target: '/lobby' }
      })
      //#endregion debug-point login-form-submit
      
      console.log('登录成功，跳转到大厅')
      router.push('/lobby')
    } else {
      errorMessage.value = result.message
    }
  } catch (e) {
    //#region debug-point login-form-submit
    __DBG.report({
      sessionId: __DBG.sessionId,
      runId: __DBG.runId,
      hypothesisId: 'H2',
      location: 'Login.vue:handleLogin:catch-error',
      type: 'error',
      data: { message: e.message, stack: e.stack }
    })
    //#endregion debug-point login-form-submit
    
    console.error('登录异常:', e)
    errorMessage.value = '登录异常: ' + e.message
  }

  loading.value = false
}

async function handleAdminLogin() {
  adminLoading.value = true
  errorMessage.value = ''

  const result = await userStore.adminLogin(adminForm.value.username, adminForm.value.password)
  if (result.success) {
    router.push('/admin')
  } else {
    errorMessage.value = result.message
  }

  adminLoading.value = false
}
</script>
