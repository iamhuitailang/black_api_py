import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { authApi } from '@/api/auth'
import { storage } from '@/utils/storage'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string>('')

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  const init = () => {
    const savedToken = storage.getToken()
    if (savedToken) {
      token.value = savedToken
      fetchUserInfo()
    }
  }

  const login = async (username: string, password: string) => {
    const res = await authApi.login(username, password)
    if (res.code === 0 && res.data) {
      token.value = res.data.token
      user.value = res.data.user
      storage.setToken(res.data.token)
      return true
    }
    return false
  }

  const register = async (username: string, password: string, confirmPassword: string) => {
    const res = await authApi.register(username, password, confirmPassword)
    return res.code === 0
  }

  const logout = () => {
    user.value = null
    token.value = ''
    storage.removeToken()
  }

  const fetchUserInfo = async () => {
    try {
      const res = await authApi.getUserInfo()
      if (res.code === 0 && res.data) {
        user.value = res.data as User
      } else {
        logout()
      }
    } catch {
      logout()
    }
  }

  const changePassword = async (oldPassword: string, newPassword: string) => {
    const res = await authApi.changePassword(oldPassword, newPassword)
    if (res.code === 0) {
      logout()
      return true
    }
    return false
  }

  return {
    user,
    token,
    isLoggedIn,
    isAdmin,
    init,
    login,
    register,
    logout,
    fetchUserInfo,
    changePassword
  }
})
