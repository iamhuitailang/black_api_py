import { defineStore } from 'pinia'
import { storage } from '../utils/storage'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: storage.getToken() || '',
    userInfo: storage.getUser() || null,
    gameStatus: storage.getGameStatus() || null,
    currentRoute: storage.getCurrentRoute() || '/'
  }),

  actions: {
    setToken(token) {
      this.token = token
      storage.setToken(token)
    },

    setUserInfo(userInfo) {
      this.userInfo = userInfo
      storage.setUser(userInfo)
    },

    setGameStatus(status) {
      this.gameStatus = status
      storage.setGameStatus(status)
    },

    updateGameStatus(updates) {
      if (this.gameStatus) {
        this.gameStatus = { ...this.gameStatus, ...updates }
      } else {
        this.gameStatus = updates
      }
      storage.setGameStatus(this.gameStatus)
    },

    setCurrentRoute(route) {
      this.currentRoute = route
      storage.setCurrentRoute(route)
    },

    logout() {
      this.token = ''
      this.userInfo = null
      this.gameStatus = null
      this.currentRoute = '/'
      storage.clear()
    }
  }
})

export default useUserStore
