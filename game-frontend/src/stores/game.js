import { defineStore } from 'pinia'
import { api } from '../api'

export const useGameStore = defineStore('game', {
  state: () => ({
    saveId: Number(localStorage.getItem('current_save_id')) || null,
    gameState: null,
    planets: [],
    combatState: null,
    toast: null,
    loading: false,
    _statePromise: null,
    _planetsPromise: null,
  }),
  getters: {
    hasSave: (state) => !!state.saveId,
    player: (state) => state.gameState?.save || null,
    ship: (state) => state.gameState?.ship || null,
    currentPlanet: (state) => state.gameState?.current_planet || null,
    equipment: (state) => state.gameState?.equipment || [],
    items: (state) => state.gameState?.items || [],
    activeMission: (state) => state.gameState?.active_mission || null,
    credits: (state) => state.gameState?.save?.credits || 0,
  },
  actions: {
    showToast(message, type = 'info') {
      this.toast = { message, type }
      setTimeout(() => { this.toast = null }, 2500)
    },
    async ensureStateReady() {
      if (!this.saveId) return false
      if (this.gameState) return true
      if (this._statePromise) return this._statePromise
      this._statePromise = this.refreshState().then(() => true).catch(() => false)
      return this._statePromise
    },
    async ensurePlanetsReady() {
      if (this.planets.length > 0) return true
      if (this._planetsPromise) return this._planetsPromise
      this._planetsPromise = this.loadPlanets().then(() => true).catch(() => false)
      return this._planetsPromise
    },
    async createNewGame(playerName) {
      this.loading = true
      try {
        const res = await api.newGame(playerName)
        if (res.code === 0) {
          this.gameState = res.data
          this.saveId = res.data.save.id
          localStorage.setItem('current_save_id', String(this.saveId))
          this.showToast('新航程开始！愿星海指引你，赏金猎人。')
          return true
        } else {
          this.showToast(res.message || '创建失败', 'error')
          return false
        }
      } finally {
        this.loading = false
      }
    },
    async loadSaves() {
      const res = await api.getSaves()
      return res.code === 0 ? res.data : []
    },
    async deleteSave(saveId) {
      const res = await api.deleteSave(saveId)
      if (res.code === 0) {
        this.showToast('存档已删除')
      } else {
        this.showToast(res.message, 'error')
      }
      return res.code === 0
    },
    selectSave(saveId) {
      this.saveId = saveId
      this.gameState = null
      this._statePromise = null
      localStorage.setItem('current_save_id', String(saveId))
    },
    async refreshState() {
      if (!this.saveId) return null
      const res = await api.getState(this.saveId)
      if (res.code === 0) {
        this.gameState = res.data
        return res.data
      }
      this.showToast(res.message, 'error')
      return null
    },
    async loadPlanets() {
      const res = await api.getPlanets()
      if (res.code === 0) {
        this.planets = res.data
        return res.data
      }
      return []
    },
    async travelTo(planetId) {
      if (!this.saveId) return null
      const res = await api.travel(this.saveId, planetId)
      if (res.code === 0) {
        this.gameState = res.data
        this.showToast(`跃迁至 ${res.data.current_planet.name}`)
        return res.data
      }
      this.showToast(res.message, 'error')
      return null
    },
    async repairShip() {
      if (!this.saveId) return null
      const res = await api.repair(this.saveId)
      if (res.code === 0) {
        this.gameState = res.data
        this.showToast('飞船维修完成！')
        return res.data
      }
      this.showToast(res.message, 'error')
      return null
    },
    async equipItem(invId) {
      if (!this.saveId) return null
      const res = await api.equip(this.saveId, invId)
      if (res.code === 0) {
        this.gameState = res.data
        this.showToast('装备已更换')
        return res.data
      }
      this.showToast(res.message, 'error')
      return null
    },
    async unequipItem(invId) {
      if (!this.saveId) return null
      const res = await api.unequip(this.saveId, invId)
      if (res.code === 0) {
        this.gameState = res.data
        this.showToast('已卸下装备')
        return res.data
      }
      this.showToast(res.message, 'error')
      return null
    },
    setCombatState(state) {
      this.combatState = state
      try {
        if (state && !state.is_over) {
          localStorage.setItem('combat_state_' + this.saveId, JSON.stringify(state))
        } else {
          localStorage.removeItem('combat_state_' + this.saveId)
        }
      } catch (e) {}
    },
    getSavedCombatState() {
      if (!this.saveId) return null
      try {
        const raw = localStorage.getItem('combat_state_' + this.saveId)
        if (!raw) return null
        const state = JSON.parse(raw)
        if (state && !state.is_over) {
          this.combatState = state
          return state
        }
        localStorage.removeItem('combat_state_' + this.saveId)
        return null
      } catch (e) {
        return null
      }
    },
    clearCombat() {
      this.combatState = null
      if (this.saveId) {
        localStorage.removeItem('combat_state_' + this.saveId)
      }
    },
    logout() {
      this.saveId = null
      this.gameState = null
      this.combatState = null
      this.planets = []
      this._statePromise = null
      this._planetsPromise = null
      localStorage.removeItem('current_save_id')
    },
  },
})
