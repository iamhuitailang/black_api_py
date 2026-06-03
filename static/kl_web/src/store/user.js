import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, register, getUserInfo as fetchUserInfoApi } from '@/services/api'
import { setToken, getToken, removeToken, setUserInfo, getUserInfo, removeUserInfo } from '@/utils/storage'

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken() || '')
  const userInfo = ref(getUserInfo() || null)

  const isAuthenticated = computed(() => !!token.value)

  const handleLogin = async (credentials) => {
    const res = await login(credentials)
    if (res.code === 200) {
      token.value = res.data.access_token
      userInfo.value = res.data.user
      setToken(res.data.access_token)
      setUserInfo(res.data.user)
      return true
    }
    return false
  }

  const handleRegister = async (userData) => {
    const res = await register(userData)
    if (res.code === 200) {
      token.value = res.data.access_token
      userInfo.value = res.data.user
      setToken(res.data.access_token)
      setUserInfo(res.data.user)
      return true
    }
    return false
  }

  const fetchUserInfo = async () => {
    const res = await fetchUserInfoApi()
    if (res.code === 200) {
      userInfo.value = res.data
      setUserInfo(res.data)
    }
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    removeToken()
    removeUserInfo()
  }

  const updateBalance = (coins, diamonds) => {
    if (userInfo.value) {
      userInfo.value.coins += coins
      userInfo.value.diamonds += diamonds
      setUserInfo(userInfo.value)
    }
  }

  const addExperience = (exp) => {
    if (userInfo.value) {
      userInfo.value.experience += exp
      const expNeeded = userInfo.value.level * 1000
      while (userInfo.value.experience >= expNeeded) {
        userInfo.value.experience -= expNeeded
        userInfo.value.level += 1
      }
      setUserInfo(userInfo.value)
    }
  }

  return {
    token,
    userInfo,
    isAuthenticated,
    handleLogin,
    handleRegister,
    fetchUserInfo,
    logout,
    updateBalance,
    addExperience
  }
})
