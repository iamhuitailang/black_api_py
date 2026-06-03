import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, register as apiRegister, getCurrentUser, logout as apiLogout } from '@/api/user'

const TOKEN_KEY = 'sc_token'
const USER_KEY = 'sc_user'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const user = ref(JSON.parse(localStorage.getItem(USER_KEY) || 'null'))

  const isLoggedIn = computed(() => !!token.value)

  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem(TOKEN_KEY, newToken)
  }

  function setUser(newUser) {
    user.value = newUser
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
  }

  async function login(username, password) {
    const response = await apiLogin({ username, password })
    if (response.code === 0) {
      setToken(response.data.token)
      setUser(response.data.user)
    }
    return response
  }

  async function register(username, password, nickname) {
    const response = await apiRegister({ username, password, nickname })
    return response
  }

  async function fetchCurrentUser() {
    if (!token.value) return null
    try {
      const response = await getCurrentUser()
      if (response.code === 0) {
        setUser(response.data)
      }
      return response
    } catch (error) {
      return null
    }
  }

  function logout() {
    apiLogout().catch(() => {})
    token.value = ''
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return {
    token,
    user,
    isLoggedIn,
    setToken,
    setUser,
    login,
    register,
    fetchCurrentUser,
    logout
  }
})
