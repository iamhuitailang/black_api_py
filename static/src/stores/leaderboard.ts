import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ScoreRecord } from '@/types'
import { getLeaderboard, getUserBest, getMyScores } from '@/api/game'

export const useLeaderboardStore = defineStore('leaderboard', () => {
  const leaderboard = ref<ScoreRecord[]>([])
  const myBest = ref<ScoreRecord | null>(null)
  const myRank = ref<number | null>(null)
  const myScores = ref<ScoreRecord[]>([])
  const currentPeriod = ref<'all' | 'daily' | 'weekly'>('all')

  async function fetchLeaderboard(period: 'all' | 'daily' | 'weekly' = 'all') {
    currentPeriod.value = period
    const res = await getLeaderboard(period, 50)
    if (res.code === 0 && res.data) {
      leaderboard.value = res.data.items
    }
    return leaderboard.value
  }

  async function fetchMyBest() {
    try {
      const res = await getUserBest()
      if (res.code === 0 && res.data) {
        myBest.value = res.data.best_score
        myRank.value = res.data.rank
      }
    } catch (e) {
      console.error('Fetch my best error:', e)
    }
  }

  async function fetchMyScores() {
    try {
      const res = await getMyScores(20)
      if (res.code === 0 && res.data) {
        myScores.value = res.data.items
      }
    } catch (e) {
      console.error('Fetch my scores error:', e)
    }
  }

  return {
    leaderboard,
    myBest,
    myRank,
    myScores,
    currentPeriod,
    fetchLeaderboard,
    fetchMyBest,
    fetchMyScores,
  }
})
