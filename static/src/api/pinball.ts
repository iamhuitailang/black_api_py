import request from './request'
import type { ApiResponse, PinballConfig } from '@/types'

export function getActiveConfigs(): Promise<ApiResponse<{ items: PinballConfig[]; total: number }>> {
  return request.get('/danzhu/config/list/get')
}

export function getAllConfigs(): Promise<ApiResponse<{ items: PinballConfig[]; total: number }>> {
  return request.get('/danzhu/config/all/get')
}

export function getConfigById(id: number): Promise<ApiResponse<PinballConfig>> {
  return request.get('/danzhu/config/item/get', { params: { id } })
}

export function addConfig(data: Partial<PinballConfig>): Promise<ApiResponse<PinballConfig>> {
  return request.post('/danzhu/config/item/add', data)
}

export function updateConfig(data: Partial<PinballConfig> & { id: number }): Promise<ApiResponse<PinballConfig>> {
  return request.post('/danzhu/config/item/update', data)
}

export function deleteConfig(id: number): Promise<ApiResponse<null>> {
  return request.delete('/danzhu/config/delete', { params: { id } })
}
