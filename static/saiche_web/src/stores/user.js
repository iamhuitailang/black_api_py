import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref('')
  const adminToken = ref('')
  const isLoaded = ref(false)

  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => !!adminToken.value)

  function loadFromStorage() {
    try {
      const savedToken = localStorage.getItem('saiche_token')
      const savedUser = localStorage.getItem('saiche_user')
      const savedAdminToken = localStorage.getItem('saiche_admin_token')

      if (savedToken && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser)
          token.value = savedToken
          user.value = parsedUser
          api.setToken(savedToken)
          console.log('用户状态已恢复:', parsedUser.nickname)
        } catch (e) {
          console.error('解析用户数据失败:', e)
          localStorage.removeItem('saiche_token')
          localStorage.removeItem('saiche_user')
        }
      }

      if (savedAdminToken) {
        adminToken.value = savedAdminToken
        api.setAdminToken(savedAdminToken)
        console.log('管理员状态已恢复')
      }
    } catch (e) {
      console.error('从本地存储加载状态失败:', e)
    } finally {
      isLoaded.value = true
    }
  }

  //#region debug-point store-login-register
  const __DBG_STORE = {
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
  //#endregion debug-point store-login-register

  async function login(phone, password) {
    //#region debug-point store-login-register
    __DBG_STORE.report({
      sessionId: __DBG_STORE.sessionId,
      runId: __DBG_STORE.runId,
      hypothesisId: 'H1',
      location: 'user.js:login:start',
      type: 'info',
      data: { phone }
    })
    //#endregion debug-point store-login-register
    
    try {
      const response = await api.post('/saiche/user/login', { phone, password })
      
      //#region debug-point store-login-register
      __DBG_STORE.report({
        sessionId: __DBG_STORE.sessionId,
        runId: __DBG_STORE.runId,
        hypothesisId: 'H2',
        location: 'user.js:login:api-response',
        type: 'info',
        data: { phone, responseCode: response.code, responseMsg: response.msg, hasData: !!response.data }
      })
      //#endregion debug-point store-login-register
      
      if (response.code === 0) {
        user.value = response.data.user
        token.value = response.data.token
        localStorage.setItem('saiche_token', response.data.token)
        localStorage.setItem('saiche_user', JSON.stringify(response.data.user))
        api.setToken(response.data.token)
        
        //#region debug-point store-login-register
        __DBG_STORE.report({
          sessionId: __DBG_STORE.sessionId,
          runId: __DBG_STORE.runId,
          hypothesisId: 'H3',
          location: 'user.js:login:store-updated',
          type: 'info',
          data: { phone, userId: response.data.user?.id, tokenSet: !!response.data.token }
        })
        //#endregion debug-point store-login-register
        
        return { success: true }
      }
      return { success: false, message: response.msg || '登录失败' }
    } catch (e) {
      //#region debug-point store-login-register
      __DBG_STORE.report({
        sessionId: __DBG_STORE.sessionId,
        runId: __DBG_STORE.runId,
        hypothesisId: 'H2',
        location: 'user.js:login:catch-error',
        type: 'error',
        data: { phone, message: e.message, stack: e.stack }
      })
      //#endregion debug-point store-login-register
      
      console.error('登录请求失败:', e)
      return { success: false, message: '网络错误，请稍后重试' }
    }
  }

  async function register(phone, password, nickname) {
    //#region debug-point store-login-register
    __DBG_STORE.report({
      sessionId: __DBG_STORE.sessionId,
      runId: __DBG_STORE.runId,
      hypothesisId: 'H1',
      location: 'user.js:register:start',
      type: 'info',
      data: { phone, nickname }
    })
    //#endregion debug-point store-login-register
    
    try {
      const response = await api.post('/saiche/user/register', { phone, password, nickname })
      
      //#region debug-point store-login-register
      __DBG_STORE.report({
        sessionId: __DBG_STORE.sessionId,
        runId: __DBG_STORE.runId,
        hypothesisId: 'H2',
        location: 'user.js:register:api-response',
        type: 'info',
        data: { phone, responseCode: response.code, responseMsg: response.msg, hasData: !!response.data }
      })
      //#endregion debug-point store-login-register
      
      if (response.code === 0) {
        user.value = response.data.user
        token.value = response.data.token
        localStorage.setItem('saiche_token', response.data.token)
        localStorage.setItem('saiche_user', JSON.stringify(response.data.user))
        api.setToken(response.data.token)
        
        //#region debug-point store-login-register
        __DBG_STORE.report({
          sessionId: __DBG_STORE.sessionId,
          runId: __DBG_STORE.runId,
          hypothesisId: 'H3',
          location: 'user.js:register:store-updated',
          type: 'info',
          data: { phone, userId: response.data.user?.id, tokenSet: !!response.data.token }
        })
        //#endregion debug-point store-login-register
        
        return { success: true }
      }
      return { success: false, message: response.msg || '注册失败' }
    } catch (e) {
      //#region debug-point store-login-register
      __DBG_STORE.report({
        sessionId: __DBG_STORE.sessionId,
        runId: __DBG_STORE.runId,
        hypothesisId: 'H2',
        location: 'user.js:register:catch-error',
        type: 'error',
        data: { phone, message: e.message, stack: e.stack }
      })
      //#endregion debug-point store-login-register
      
      console.error('注册请求失败:', e)
      return { success: false, message: '网络错误，请稍后重试' }
    }
  }

  async function adminLogin(username, password) {
    try {
      const response = await api.post('/saiche/admin/login', { username, password })
      if (response.code === 0) {
        adminToken.value = response.data.token
        localStorage.setItem('saiche_admin_token', response.data.token)
        api.setAdminToken(response.data.token)
        return { success: true }
      }
      return { success: false, message: response.msg || '登录失败' }
    } catch (e) {
      console.error('管理员登录请求失败:', e)
      return { success: false, message: '网络错误，请稍后重试' }
    }
  }

  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('saiche_token')
    localStorage.removeItem('saiche_user')
    api.setToken('')
  }

  function adminLogout() {
    adminToken.value = ''
    localStorage.removeItem('saiche_admin_token')
    api.setAdminToken('')
  }

  async function updateUser() {
    try {
      const response = await api.get('/saiche/user/current/get')
      if (response.code === 0) {
        user.value = response.data
        localStorage.setItem('saiche_user', JSON.stringify(response.data))
      }
    } catch (e) {
      console.error('更新用户信息失败:', e)
    }
  }

  return {
    user,
    token,
    adminToken,
    isLoaded,
    isLoggedIn,
    isAdmin,
    loadFromStorage,
    login,
    register,
    adminLogin,
    logout,
    adminLogout,
    updateUser
  }
})
