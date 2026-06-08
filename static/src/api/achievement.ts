import request from './request'
import type { ApiResponse, Achievement } from '@/types'

export function getAchievements(): Promise<ApiResponse<{ items: Achievement[]; total: number }>> {
  return request.get('/danzhu/achievement/list/get')
}

export function checkAchievements(data: {
  score?: number
  highest_combo?: number
  gadget_types?: string[]
  levels_played?: number[]
  launch_count?: number
}): Promise<ApiResponse<{ newly_unlocked: Achievement[]; total_unlocked: number }>> {
  return request.post('/danzhu/achievement/check', data)
}
