import { defineStore } from 'pinia'
import api from '../utils/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),
    characters: [],
    levels: [],
    currentLevel: null,
    currentCharacter: null,
    progress: []
  }),

  actions: {
    async login(username, password) {
      const res = await api.post('/renlei/login', { username, password })
      if (res.code === 0) {
        this.token = res.data.token
        this.userInfo = res.data.user
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('userInfo', JSON.stringify(res.data.user))
      }
      return res
    },

    async register(username, password, email, nickname) {
      return await api.post('/renlei/register', { username, password, email, nickname })
    },

    async getUserInfo() {
      const res = await api.get('/renlei/getuserinfo')
      if (res.code === 0) {
        this.userInfo = res.data
        localStorage.setItem('userInfo', JSON.stringify(res.data))
      }
      return res
    },

    async getCharacters() {
      const res = await api.get('/renlei/getcharacters')
      if (res.code === 0) {
        this.characters = res.data
      }
      return res
    },

    async getLevels() {
      const res = await api.get('/renlei/getlevels')
      if (res.code === 0) {
        this.levels = res.data
      }
      return res
    },

    async setCharacter(characterId) {
      const res = await api.post('/renlei/setcharacter', { character_id: characterId })
      if (res.code === 0) {
        this.userInfo.current_character_id = characterId
        localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
      }
      return res
    },

    async setLevel(levelId) {
      const res = await api.post('/renlei/setlevel', { level_id: levelId })
      if (res.code === 0) {
        this.userInfo.current_level_id = levelId
        localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
      }
      return res
    },

    async getProgress() {
      const res = await api.get('/renlei/getmyprogress')
      if (res.code === 0) {
        this.progress = res.data
      }
      return res
    },

    async completeLevel(levelId, completionTime) {
      return await api.post('/renlei/completelevel', { level_id: levelId, completion_time: completionTime })
    },

    async incrementAttempts(levelId) {
      return await api.post('/renlei/incrementattempts', { level_id: levelId })
    },

    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    },

    isLoggedIn() {
      return !!this.token && !!this.userInfo
    }
  }
})
