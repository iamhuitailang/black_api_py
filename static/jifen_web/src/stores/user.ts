import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi, type UserInfo, type LoginParams, type RegisterParams } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)

  const isLogin = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.role === 'admin')

  function initFromStorage() {
    const storedUser = localStorage.getItem('userInfo')
    if (storedUser) {
      try {
        userInfo.value = JSON.parse(storedUser)
      } catch (e) {
        console.error('Failed to parse userInfo:', e)
        localStorage.removeItem('userInfo')
      }
    }
  }

  initFromStorage()

  async function login(data: LoginParams) {
    const res = await userApi.login(data)
    if (res && res.data) {
      token.value = res.data.access_token || ''
      userInfo.value = {
        id: res.data.user_id || 0,
        username: res.data.username || '',
        nickname: res.data.nickname || '',
        avatar: res.data.avatar || '',
        phone: '',
        email: '',
        points: res.data.points || 0,
        total_points: res.data.points || 0,
        role: res.data.role || 'user',
        profile_completed: false,
        invite_code: ''
      }
      localStorage.setItem('token', token.value)
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    }
    return res
  }

  async function register(data: RegisterParams) {
    const res = await userApi.register(data)
    return res
  }

  async function getUserInfo() {
    const res = await userApi.getUserInfo()
    if (res && res.data) {
      userInfo.value = res.data
      localStorage.setItem('userInfo', JSON.stringify(res.data))
    }
    return res
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  function updatePoints(points: number) {
    if (userInfo.value) {
      userInfo.value.points = points
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    }
  }

  return {
    token,
    userInfo,
    isLogin,
    isAdmin,
    login,
    register,
    getUserInfo,
    logout,
    updatePoints
  }
})
