<template>
  <div class="min-h-screen flex items-center justify-center p-8">
    <div class="card p-8 w-full max-w-md">
      <h2 class="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
        用户注册
      </h2>

      <form @submit.prevent="handleRegister" class="space-y-6">
        <div>
          <label class="block text-sm mb-2 text-white/70">昵称</label>
          <input
            v-model="form.nickname"
            type="text"
            placeholder="请输入昵称"
            class="input-field"
          />
        </div>

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
            placeholder="请输入密码（至少6位）"
            class="input-field"
            required
          />
        </div>

        <div>
          <label class="block text-sm mb-2 text-white/70">确认密码</label>
          <input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            class="input-field"
            required
          />
        </div>

        <div v-if="errorMessage" class="text-red-400 text-sm text-center">
          {{ errorMessage }}
        </div>

        <button type="submit" class="btn-primary w-full" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-white/60">
          已有账号？
          <router-link to="/login" class="text-orange-400 hover:text-orange-300">
            立即登录
          </router-link>
        </p>
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
  nickname: '',
  phone: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const errorMessage = ref('')

//#region debug-point register-form-submit
const __DBG_REG = {
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
//#endregion debug-point register-form-submit

async function handleRegister() {
  //#region debug-point register-form-submit
  __DBG_REG.report({
    sessionId: __DBG_REG.sessionId,
    runId: __DBG_REG.runId,
    hypothesisId: 'H5',
    location: 'Register.vue:handleRegister:start',
    type: 'info',
    data: { phone: form.value.phone, nickname: form.value.nickname, hasPassword: !!form.value.password }
  })
  //#endregion debug-point register-form-submit
  
  console.log('开始注册, 手机号:', form.value.phone, '昵称:', form.value.nickname)
  
  if (form.value.password !== form.value.confirmPassword) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }

  if (form.value.password.length < 6) {
    errorMessage.value = '密码长度至少6位'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    //#region debug-point register-form-submit
    __DBG_REG.report({
      sessionId: __DBG_REG.sessionId,
      runId: __DBG_REG.runId,
      hypothesisId: 'H1',
      location: 'Register.vue:handleRegister:before-store-call',
      type: 'info',
      data: { phone: form.value.phone, nickname: form.value.nickname }
    })
    //#endregion debug-point register-form-submit
    
    const result = await userStore.register(form.value.phone, form.value.password, form.value.nickname)
    
    //#region debug-point register-form-submit
    __DBG_REG.report({
      sessionId: __DBG_REG.sessionId,
      runId: __DBG_REG.runId,
      hypothesisId: 'H3',
      location: 'Register.vue:handleRegister:after-store-call',
      type: 'info',
      data: { result, phone: form.value.phone }
    })
    //#endregion debug-point register-form-submit
    
    console.log('注册结果:', result)
    if (result.success) {
      //#region debug-point register-form-submit
      __DBG_REG.report({
        sessionId: __DBG_REG.sessionId,
        runId: __DBG_REG.runId,
        hypothesisId: 'H4',
        location: 'Register.vue:handleRegister:before-router-push',
        type: 'info',
        data: { target: '/lobby' }
      })
      //#endregion debug-point register-form-submit
      
      console.log('注册成功，跳转到大厅')
      router.push('/lobby')
    } else {
      errorMessage.value = result.message
    }
  } catch (e) {
    //#region debug-point register-form-submit
    __DBG_REG.report({
      sessionId: __DBG_REG.sessionId,
      runId: __DBG_REG.runId,
      hypothesisId: 'H2',
      location: 'Register.vue:handleRegister:catch-error',
      type: 'error',
      data: { message: e.message, stack: e.stack }
    })
    //#endregion debug-point register-form-submit
    
    console.error('注册异常:', e)
    errorMessage.value = '注册异常: ' + e.message
  }

  loading.value = false
}
</script>
