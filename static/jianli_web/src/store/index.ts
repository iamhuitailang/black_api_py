import { defineStore } from 'pinia'
import type { User, Admin } from '@/types'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string>(localStorage.getItem('jianli_token') || '')
  const admin = ref<Admin | null>(null)
  const adminToken = ref<string>(localStorage.getItem('jianli_admin_token') || '')

  const isLoggedIn = computed(() => !!token.value)
  const isAdminLoggedIn = computed(() => !!adminToken.value)

  function setUser(userData: User, userToken: string) {
    user.value = userData
    token.value = userToken
    localStorage.setItem('jianli_token', userToken)
    localStorage.setItem('jianli_user', JSON.stringify(userData))
  }

  function setAdmin(adminData: Admin, aToken: string) {
    admin.value = adminData
    adminToken.value = aToken
    localStorage.setItem('jianli_admin_token', aToken)
    localStorage.setItem('jianli_admin', JSON.stringify(adminData))
  }

  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('jianli_token')
    localStorage.removeItem('jianli_user')
  }

  function adminLogout() {
    admin.value = null
    adminToken.value = ''
    localStorage.removeItem('jianli_admin_token')
    localStorage.removeItem('jianli_admin')
  }

  function initUserFromStorage() {
    const userStr = localStorage.getItem('jianli_user')
    if (userStr) {
      try {
        user.value = JSON.parse(userStr)
      } catch (e) {
        console.error('Parse user data error:', e)
      }
    }
    const adminStr = localStorage.getItem('jianli_admin')
    if (adminStr) {
      try {
        admin.value = JSON.parse(adminStr)
      } catch (e) {
        console.error('Parse admin data error:', e)
      }
    }
  }

  return {
    user,
    token,
    admin,
    adminToken,
    isLoggedIn,
    isAdminLoggedIn,
    setUser,
    setAdmin,
    logout,
    adminLogout,
    initUserFromStorage
  }
})

export default useUserStore
