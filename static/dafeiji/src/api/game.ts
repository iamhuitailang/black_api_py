import { get, post } from './request'
import type { ApiResponse, Plane, Wave, GameState, Score, Achievement, UserStats } from '@/types'

export const gameApi = {
  getPlanes(): Promise<ApiResponse<Plane[]>> {
    return get('/dafeiji/game/planes')
  },

  getWaves(): Promise<ApiResponse<Wave[]>> {
    return get('/dafeiji/game/waves')
  },

  getWave(wave: number): Promise<ApiResponse<Wave>> {
    return get('/dafeiji/game/wave', { wave })
  },

  saveState(data: {
    plane_id: string
    state_data: any
    score: number
    wave: number
    is_paused: boolean
  }): Promise<ApiResponse<{ state_id: number }>> {
    return post('/dafeiji/game/state/save', data)
  },

  loadState(): Promise<ApiResponse<GameState | null>> {
    return get('/dafeiji/game/state/load')
  },

  endGame(data: {
    state_id: number
    score: number
    wave: number
    kills: number
    play_time: number
    plane_id: string
    collected_items: string[]
    used_planes: string[]
    perfect_waves: number
  }): Promise<ApiResponse<{ new_achievements: Achievement[] }>> {
    return post('/dafeiji/game/end', data)
  },

  getLeaderboard(type: string = 'daily', limit: number = 50): Promise<ApiResponse<Score[]>> {
    return get('/dafeiji/game/leaderboard', { type, limit })
  },

  getAchievements(): Promise<ApiResponse<Achievement[]>> {
    return get('/dafeiji/game/achievements')
  },

  getUserStats(): Promise<ApiResponse<UserStats>> {
    return get('/dafeiji/game/user/stats')
  },

  recordBossKill(): Promise<ApiResponse> {
    return post('/dafeiji/game/boss/kill', {})
  }
}
