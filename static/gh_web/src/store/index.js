import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI, gameAPI } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const gameState = ref(null)

  const isLoggedIn = computed(() => !!token.value)

  const login = async (username, password) => {
    const res = await authAPI.login({ username, password })
    if (res.code === 200) {
      token.value = res.data.access_token
      user.value = res.data.user
      localStorage.setItem('token', res.data.access_token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      await fetchGameState()
    }
    return res
  }

  const register = async (username, email, password) => {
    const res = await authAPI.register({ username, email, password })
    return res
  }

  const logout = () => {
    token.value = ''
    user.value = null
    gameState.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const fetchUser = async () => {
    if (token.value) {
      try {
        const res = await authAPI.getMe()
        if (res.code === 200) {
          user.value = res.data
          localStorage.setItem('user', JSON.stringify(res.data))
        }
      } catch (e) {
        console.error('Fetch user error:', e)
        if (e.response?.status === 401) {
          logout()
        }
      }
    }
  }

  const fetchGameState = async () => {
    if (!token.value) return
    try {
      const res = await gameAPI.getState()
      if (res.code === 200) {
        gameState.value = res.data
      }
    } catch (e) {
      console.error('Fetch game state error:', e)
    }
  }

  const updateCoins = (amount) => {
    if (user.value) {
      user.value.coins += amount
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  const updateExp = (amount) => {
    if (user.value) {
      user.value.exp += amount
      const expNeeded = user.value.level * 100
      while (user.value.exp >= expNeeded) {
        user.value.exp -= expNeeded
        user.value.level += 1
      }
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  return {
    token,
    user,
    gameState,
    isLoggedIn,
    login,
    register,
    logout,
    fetchUser,
    fetchGameState,
    updateCoins,
    updateExp
  }
})

export const useToastStore = defineStore('toast', () => {
  const messages = ref([])

  const show = (message, type = 'success', duration = 3000) => {
    const id = Date.now()
    messages.value.push({ id, message, type })
    setTimeout(() => {
      messages.value = messages.value.filter(m => m.id !== id)
    }, duration)
  }

  const success = (msg) => show(msg, 'success')
  const error = (msg) => show(msg, 'error')
  const warning = (msg) => show(msg, 'warning')
  const info = (msg) => show(msg, 'info')

  return {
    messages,
    show,
    success,
    error,
    warning,
    info
  }
})
