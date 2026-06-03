import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import { getUserCars, setActiveCarApi, updateCarStatsApi } from '@/api/car'
import { getUserParts as fetchUserPartsApi, getAllParts } from '@/api/part'
import { getUserResearch } from '@/api/research'

export const useGameStore = defineStore('game', {
  state: () => ({
    cars: [],
    parts: [],
    activeCar: null,
    researchList: [],
    userParts: [],
    loading: false,
    error: null
  }),

  getters: {
    getCarById: (state) => (id) => {
      return state.cars.find(car => car.id === id) || null
    },
    getPartById: (state) => (id) => {
      return state.parts.find(part => part.id === id) || state.userParts.find(part => part.id === id) || null
    }
  },

  actions: {
    async fetchCars() {
      this.loading = true
      this.error = null
      try {
        const res = await getUserCars()
        if (res.code === 0 || res.code === 200) {
          this.cars = res.data || []
          if (this.cars.length > 0 && !this.activeCar) {
            this.activeCar = this.cars.find(car => car.is_active) || this.cars[0]
          }
        } else {
          ElMessage.error(res.msg || '获取车辆列表失败')
        }
      } catch (error) {
        this.error = error.message
        console.error('Fetch cars error:', error)
      } finally {
        this.loading = false
      }
    },

    async setActiveCar(carId) {
      this.loading = true
      this.error = null
      try {
        const res = await setActiveCarApi(carId)
        if (res.code === 0 || res.code === 200) {
          this.cars = this.cars.map(car => ({
            ...car,
            is_active: car.id === carId
          }))
          this.activeCar = this.cars.find(car => car.id === carId) || null
          ElMessage.success('已设置为当前赛车')
        } else {
          ElMessage.error(res.msg || '设置当前赛车失败')
        }
      } catch (error) {
        this.error = error.message
        console.error('Set active car error:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchUserParts() {
      this.loading = true
      this.error = null
      try {
        const [userRes, allRes] = await Promise.all([
          fetchUserPartsApi(),
          getAllParts()
        ])
        if (userRes.code === 0 || userRes.code === 200) {
          this.userParts = userRes.data || []
        } else {
          ElMessage.error(userRes.msg || '获取用户部件失败')
        }
        if (allRes.code === 0 || allRes.code === 200) {
          this.parts = allRes.data || []
        } else {
          ElMessage.error(allRes.msg || '获取部件列表失败')
        }
      } catch (error) {
        this.error = error.message
        console.error('Fetch parts error:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchResearch() {
      this.loading = true
      this.error = null
      try {
        const res = await getUserResearch()
        if (res.code === 0 || res.code === 200) {
          this.researchList = res.data || []
        } else {
          ElMessage.error(res.msg || '获取研究项目失败')
        }
      } catch (error) {
        this.error = error.message
        console.error('Fetch research error:', error)
      } finally {
        this.loading = false
      }
    },

    async updateCarStats(carId, stats) {
      this.loading = true
      this.error = null
      try {
        const res = await updateCarStatsApi(carId, stats)
        if (res.code === 0 || res.code === 200) {
          this.cars = this.cars.map(car => {
            if (car.id === carId) {
              return {
                ...car,
                stats: { ...car.stats, ...stats }
              }
            }
            return car
          })
          if (this.activeCar && this.activeCar.id === carId) {
            this.activeCar = {
              ...this.activeCar,
              stats: { ...this.activeCar.stats, ...stats }
            }
          }
          ElMessage.success('车辆性能已更新')
        } else {
          ElMessage.error(res.msg || '更新车辆性能失败')
        }
      } catch (error) {
        this.error = error.message
        console.error('Update car stats error:', error)
      } finally {
        this.loading = false
      }
    },

    clearGameState() {
      this.cars = []
      this.parts = []
      this.activeCar = null
      this.researchList = []
      this.userParts = []
      this.loading = false
      this.error = null
    }
  }
})
