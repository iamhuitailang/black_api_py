import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { login as loginApi, logout as logoutApi, register as registerApi, getCurrentUser } from '@/api/auth'
import type { LoginParams, RegisterParams } from '@/api/auth'

const TOKEN_KEY = 'todo_token'
const USER_KEY = 'todo_user'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem(TOKEN_KEY) || '')
  const user = ref<User | null>(localStorage.getItem(USER_KEY) ? JSON.parse(localStorage.getItem(USER_KEY)!) : null)

  const isLoggedIn = computed(() => !!token.value && !!user.value)

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem(TOKEN_KEY, newToken)
  }

  const setUser = (newUser: User) => {
    user.value = newUser
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
  }

  const clearAuth = () => {
    token.value = ''
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  const login = async (params: LoginParams) => {
    const res = await loginApi(params)
    if (res.code === 0) {
      setToken(res.data.token)
      setUser(res.data.user)
    }
    return res
  }

  const register = async (params: RegisterParams) => {
    const res = await registerApi(params)
    if (res.code === 0) {
      setToken(res.data.token)
      setUser(res.data.user)
    }
    return res
  }

  const logout = async () => {
    try {
      await logoutApi()
    } catch (e) {
      console.error('Logout error:', e)
    }
    clearAuth()
  }

  const fetchCurrentUser = async () => {
    if (!token.value) return null
    try {
      const res = await getCurrentUser()
      if (res.code === 0) {
        setUser(res.data)
        return res.data
      }
    } catch (e) {
      clearAuth()
    }
    return null
  }

  const updateUser = (userData: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...userData }
      localStorage.setItem(USER_KEY, JSON.stringify(user.value))
    }
  }

  return {
    token,
    user,
    isLoggedIn,
    login,
    register,
    logout,
    fetchCurrentUser,
    updateUser,
    clearAuth
  }
})
