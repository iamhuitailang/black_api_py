import { defineStore } from 'pinia'
import { ref } from 'vue'
import storage from '@/utils/storage'
import type { UserInfo } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const user = ref<UserInfo | null>(null)
  const token = ref('')

  const initUser = () => {
    const savedToken = storage.getToken()
    const savedUser = storage.getUser()
    if (savedToken) {
      token.value = savedToken
    }
    if (savedUser && typeof savedUser === 'object' && 'id' in savedUser) {
      user.value = savedUser as unknown as UserInfo
    }
  }

  const setLogin = (data: { user: UserInfo; token: string }) => {
    user.value = data.user
    token.value = data.token
    storage.setToken(data.token)
    storage.setUser(data.user as unknown as Record<string, unknown>)
  }

  const setProfile = (profile: UserInfo) => {
    user.value = profile
    storage.setUser(profile as unknown as Record<string, unknown>)
  }

  const logout = () => {
    user.value = null
    token.value = ''
    storage.clear()
  }

  return { user, token, initUser, setLogin, setProfile, logout }
})
