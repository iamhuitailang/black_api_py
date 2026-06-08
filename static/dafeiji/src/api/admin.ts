import { get, post } from './request'
import type { ApiResponse, Plane, Wave, User } from '@/types'

export interface UserListResponse {
  list: User[]
  total: number
  page: number
  page_size: number
}

export interface StatisticsResponse {
  total_users: number
  total_games: number
  total_scores: number
  daily_active: number
  top_planes: Array<{ plane_id: string; count: number }>
  daily_scores: Array<{ date: string; count: number; avg_score: number }>
}

export const adminApi = {
  getUsers(page: number = 1, page_size: number = 20): Promise<ApiResponse<UserListResponse>> {
    return get('/dafeiji/admin/users', { page, page_size })
  },

  updateUserStatus(user_id: number, status: number): Promise<ApiResponse> {
    return post('/dafeiji/admin/user/status', { user_id, status })
  },

  updateUserRole(user_id: number, role: string): Promise<ApiResponse> {
    return post('/dafeiji/admin/user/role', { user_id, role })
  },

  deleteUser(user_id: number): Promise<ApiResponse> {
    return post('/dafeiji/admin/user/delete', { user_id })
  },

  getPlanes(): Promise<ApiResponse<Plane[]>> {
    return get('/dafeiji/admin/planes')
  },

  createPlane(data: Partial<Plane>): Promise<ApiResponse> {
    return post('/dafeiji/admin/plane/create', data)
  },

  updatePlane(id: number, data: Partial<Plane>): Promise<ApiResponse> {
    return post('/dafeiji/admin/plane/update', { id, ...data })
  },

  deletePlane(id: number): Promise<ApiResponse> {
    return post('/dafeiji/admin/plane/delete', { id })
  },

  getWaves(page: number = 1, page_size: number = 20): Promise<ApiResponse<UserListResponse>> {
    return get('/dafeiji/admin/waves', { page, page_size })
  },

  createWave(data: Partial<Wave>): Promise<ApiResponse> {
    return post('/dafeiji/admin/wave/create', data)
  },

  updateWave(id: number, data: Partial<Wave>): Promise<ApiResponse> {
    return post('/dafeiji/admin/wave/update', { id, ...data })
  },

  deleteWave(id: number): Promise<ApiResponse> {
    return post('/dafeiji/admin/wave/delete', { id })
  },

  getStatistics(): Promise<ApiResponse<StatisticsResponse>> {
    return get('/dafeiji/admin/statistics')
  }
}
