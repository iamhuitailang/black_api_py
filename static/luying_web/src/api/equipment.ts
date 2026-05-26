import request from '@/utils/request'
import type { ApiResponse, Equipment, ListResponse } from '@/types'

export const createEquipment = (userId: number, data: Partial<Equipment>): Promise<ApiResponse<Equipment>> => {
  return request.post('/equipment/create', data, { params: { user_id: userId } })
}

export const getEquipmentList = (userId: number, params?: { page?: number; page_size?: number; category?: string }): Promise<ApiResponse<ListResponse<Equipment>>> => {
  return request.get('/equipment/list', { params: { user_id: userId, ...params } })
}

export const getPublicEquipments = (params?: { page?: number; page_size?: number; keyword?: string }): Promise<ApiResponse<ListResponse<Equipment>>> => {
  return request.get('/equipment/public', { params })
}

export const getEquipmentDetail = (equipmentId: number): Promise<ApiResponse<Equipment>> => {
  return request.get(`/equipment/${equipmentId}`)
}

export const getCategories = (userId?: number): Promise<ApiResponse<{ categories: string[] }>> => {
  return request.get('/equipment/categories', { params: { user_id: userId } })
}

export const updateEquipment = (equipmentId: number, data: Partial<Equipment>): Promise<ApiResponse<Equipment>> => {
  return request.put(`/equipment/${equipmentId}`, data)
}

export const deleteEquipment = (equipmentId: number): Promise<ApiResponse<null>> => {
  return request.delete(`/equipment/${equipmentId}`)
}
