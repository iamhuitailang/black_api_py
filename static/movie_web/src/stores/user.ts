import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('movie_token') || '')
  const user = ref<User | null>(null)

  const savedUser = localStorage.getItem('movie_user')
  if (savedUser) {
    try {
      user.value = JSON.parse(savedUser)
    } catch {}
  }

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  function setLogin(newToken: string, userData: User) {
    token.value = newToken
    user.value = userData
    localStorage.setItem('movie_token', newToken)
    localStorage.setItem('movie_user', JSON.stringify(userData))
  }

  function setUser(userData: User) {
    user.value = userData
    localStorage.setItem('movie_user', JSON.stringify(userData))
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('movie_token')
    localStorage.removeItem('movie_user')
  }

  return {
    token,
    user,
    isLoggedIn,
    isAdmin,
    setLogin,
    setUser,
    logout
  }
})