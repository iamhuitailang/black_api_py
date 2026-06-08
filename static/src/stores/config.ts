import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PinballConfig } from '@/types'
import { getActiveConfigs, getAllConfigs } from '@/api/pinball'

export const useConfigStore = defineStore('config', () => {
  const activeConfigs = ref<PinballConfig[]>([])
  const allConfigs = ref<PinballConfig[]>([])

  async function fetchActiveConfigs() {
    try {
      const res = await getActiveConfigs()
      if (res.code === 0 && res.data) {
        activeConfigs.value = res.data.items
      }
    } catch (e) {
      console.error('Fetch active configs error:', e)
    }
  }

  async function fetchAllConfigs() {
    try {
      const res = await getAllConfigs()
      if (res.code === 0 && res.data) {
        allConfigs.value = res.data.items
      }
    } catch (e) {
      console.error('Fetch all configs error:', e)
    }
  }

  return {
    activeConfigs,
    allConfigs,
    fetchActiveConfigs,
    fetchAllConfigs,
  }
})
