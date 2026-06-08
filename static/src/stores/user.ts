import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { login as loginApi, logout as logoutApi, getCurrentUser, register as registerApi } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string>(localStorage.getItem('token') || '')
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(username: string, password: string) {
    const res = await loginApi(username, password)
    if (res.code === 0 && res.data) {
      user.value = res.data.user
      token.value = res.data.token
      localStorage.setItem('token', res.data.token)
      return true
    }
    throw new Error(res.message || '登录失败')
  }

  async function register(username: string, password: string) {
    const res = await registerApi(username, password)
    if (res.code === 0) {
      return true
    }
    throw new Error(res.message || '注册失败')
  }

  async function logout() {
    try {
      await logoutApi()
    } catch (e) {
      console.error('Logout error:', e)
    }
    user.value = null
    token.value = ''
    localStorage.removeItem('token')
  }

  async function fetchUser() {
    if (!token.value) return null
    try {
      const res = await getCurrentUser()
      if (res.code === 0 && res.data) {
        user.value = res.data
        return res.data
      }
    } catch (e) {
      token.value = ''
      localStorage.removeItem('token')
    }
    return null
  }

  return {
    user,
    token,
    isLoggedIn,
    isAdmin,
    login,
    register,
    logout,
    fetchUser,
  }
})
