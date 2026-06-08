import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Achievement } from '@/types'
import { getAchievements, checkAchievements } from '@/api/achievement'

export const useAchievementStore = defineStore('achievement', () => {
  const achievements = ref<Achievement[]>([])
  const newlyUnlocked = ref<Achievement[]>([])
  const totalUnlocked = ref(0)

  async function fetchAchievements() {
    try {
      const res = await getAchievements()
      if (res.code === 0 && res.data) {
        achievements.value = res.data.items
        totalUnlocked.value = res.data.items.filter(a => a.is_unlocked).length
      }
    } catch (e) {
      console.error('Fetch achievements error:', e)
    }
  }

  async function checkAndUnlock(gameData: {
    score?: number
    highest_combo?: number
    gadget_types?: string[]
    levels_played?: number[]
    launch_count?: number
  }) {
    try {
      const res = await checkAchievements(gameData)
      if (res.code === 0 && res.data) {
        if (res.data.newly_unlocked?.length) {
          newlyUnlocked.value = res.data.newly_unlocked
          totalUnlocked.value = res.data.total_unlocked
          setTimeout(() => {
            newlyUnlocked.value = []
          }, 3000)
        }
        return res.data.newly_unlocked || []
      }
    } catch (e) {
      console.error('Check achievements error:', e)
    }
    return []
  }

  return {
    achievements,
    newlyUnlocked,
    totalUnlocked,
    fetchAchievements,
    checkAndUnlock,
  }
})
