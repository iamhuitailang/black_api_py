import { defineStore } from 'pinia'
import api from '../utils/api'

export const useGameStore = defineStore('game', {
  state: () => ({
    sessionToken: localStorage.getItem('sessionToken') || '',
    gameState: JSON.parse(localStorage.getItem('gameState') || 'null'),
    playerPosition: JSON.parse(localStorage.getItem('playerPosition') || 'null'),
    isPlaying: false
  }),

  actions: {
    async createSession(levelId, characterId) {
      const res = await api.post('/renlei/createsession', { level_id: levelId, character_id: characterId })
      if (res.code === 0) {
        this.sessionToken = res.data.session_token
        localStorage.setItem('sessionToken', res.data.session_token)
      }
      return res
    },

    async getActiveSession() {
      return await api.get('/renlei/getactivesession')
    },

    async updateSession(gameState, playerPosition) {
      this.gameState = gameState
      this.playerPosition = playerPosition
      localStorage.setItem('gameState', JSON.stringify(gameState))
      localStorage.setItem('playerPosition', JSON.stringify(playerPosition))
      
      return await api.post('/renlei/updatesession', {
        session_token: this.sessionToken,
        game_state: gameState,
        player_position: playerPosition
      })
    },

    async endSession() {
      const res = await api.post('/renlei/endsession', { session_token: this.sessionToken })
      this.clearSession()
      return res
    },

    clearSession() {
      this.sessionToken = ''
      this.gameState = null
      this.playerPosition = null
      this.isPlaying = false
      localStorage.removeItem('sessionToken')
      localStorage.removeItem('gameState')
      localStorage.removeItem('playerPosition')
    },

    setPlaying(playing) {
      this.isPlaying = playing
    },

    restoreGameState() {
      const savedState = localStorage.getItem('gameState')
      const savedPosition = localStorage.getItem('playerPosition')
      const savedToken = localStorage.getItem('sessionToken')
      
      if (savedToken) {
        this.sessionToken = savedToken
      }
      if (savedState) {
        this.gameState = JSON.parse(savedState)
      }
      if (savedPosition) {
        this.playerPosition = JSON.parse(savedPosition)
      }
      
      return {
        gameState: this.gameState,
        playerPosition: this.playerPosition
      }
    }
  }
})
