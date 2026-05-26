import request from '@/utils/request'
import type { ApiResponse, Statistics, ListResponse, User, Equipment, Campsite, CampingPlan, Post } from '@/types'

export const getStatistics = (): Promise<ApiResponse<Statistics>> => {
  return request.get('/admin/statistics')
}

export const getAdminUsers = (params?: { page?: number; page_size?: number; keyword?: string }): Promise<ApiResponse<ListResponse<User>>> => {
  return request.get('/admin/users', { params })
}

export const deleteAdminUser = (userId: number): Promise<ApiResponse<null>> => {
  return request.delete(`/admin/user/${userId}`)
}

export const getAdminEquipments = (params?: { page?: number; page_size?: number; keyword?: string }): Promise<ApiResponse<ListResponse<Equipment>>> => {
  return request.get('/admin/equipments', { params })
}

export const deleteAdminEquipment = (equipmentId: number): Promise<ApiResponse<null>> => {
  return request.delete(`/admin/equipment/${equipmentId}`)
}

export const createAdminEquipment = (userId: number, data: Partial<Equipment>): Promise<ApiResponse<Equipment>> => {
  return request.post('/admin/equipment/create', data, { params: { user_id: userId } })
}

export const getAdminCampsites = (params?: { page?: number; page_size?: number; keyword?: string }): Promise<ApiResponse<ListResponse<Campsite>>> => {
  return request.get('/admin/campsites', { params })
}

export const deleteAdminCampsite = (campsiteId: number): Promise<ApiResponse<null>> => {
  return request.delete(`/admin/campsite/${campsiteId}`)
}

export const getAdminPlans = (params?: { page?: number; page_size?: number }): Promise<ApiResponse<ListResponse<CampingPlan>>> => {
  return request.get('/admin/plans', { params })
}

export const deleteAdminPlan = (planId: number): Promise<ApiResponse<null>> => {
  return request.delete(`/admin/plan/${planId}`)
}

export const getAdminPosts = (params?: { page?: number; page_size?: number; keyword?: string }): Promise<ApiResponse<ListResponse<Post>>> => {
  return request.get('/admin/posts', { params })
}

export const deleteAdminPost = (postId: number): Promise<ApiResponse<null>> => {
  return request.delete(`/admin/post/${postId}`)
}
