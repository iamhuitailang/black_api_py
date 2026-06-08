import request from './request'
import type { ApiResponse, ScoreRecord } from '@/types'

export function saveGameState(state: {
  state_json: string
  score: number
  combo: number
  balls_left: number
  highest_combo: number
}): Promise<ApiResponse<{ id: number }>> {
  return request.post('/danzhu/game/state/save', state)
}

export function getGameState(): Promise<ApiResponse<any>> {
  return request.get('/danzhu/game/state/get')
}

export function clearGameState(): Promise<ApiResponse<null>> {
  return request.post('/danzhu/game/state/clear')
}

export function submitScore(data: {
  score: number
  highest_combo?: number
  level_id?: number
  level_name?: string
  balls_used?: number
}): Promise<ApiResponse<{ id: number; rank: number }>> {
  return request.post('/danzhu/score/submit', data)
}

export function getLeaderboard(period: 'all' | 'daily' | 'weekly' = 'all', limit = 50): Promise<ApiResponse<{ items: ScoreRecord[]; total: number; period: string }>> {
  return request.get('/danzhu/score/leaderboard/get', { params: { period, limit } })
}

export function getUserBest(): Promise<ApiResponse<{ best_score: ScoreRecord; rank: number }>> {
  return request.get('/danzhu/score/best/get')
}

export function getMyScores(limit = 20): Promise<ApiResponse<{ items: ScoreRecord[]; total: number }>> {
  return request.get('/danzhu/score/my/get', { params: { limit } })
}
