import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)

  const isLogin = computed(() => !!user.value)
  const userId = computed(() => user.value?.id)
  const userRole = computed(() => user.value?.role)
  const nickname = computed(() => user.value?.nickname || '')
  const phone = computed(() => user.value?.phone || '')
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isSender = computed(() => user.value?.role === 'sender' || user.value?.role === 'admin')

  function setUser(userData) {
    user.value = userData
    if (userData) {
      localStorage.setItem('pet_user', JSON.stringify(userData))
    } else {
      localStorage.removeItem('pet_user')
    }
  }

  function setNickname(nickname) {
    if (user.value) {
      user.value.nickname = nickname
      localStorage.setItem('pet_user', JSON.stringify(user.value))
    }
  }

  function logout() {
    user.value = null
    localStorage.removeItem('pet_user')
  }

  function initUser() {
    const savedUser = localStorage.getItem('pet_user')
    if (savedUser) {
      user.value = JSON.parse(savedUser)
    }
  }

  return {
    user,
    isLogin,
    userId,
    userRole,
    nickname,
    phone,
    isAdmin,
    isSender,
    setUser,
    setNickname,
    logout,
    initUser
  }
})
