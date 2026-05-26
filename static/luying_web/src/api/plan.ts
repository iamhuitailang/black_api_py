import request from '@/utils/request'
import type { ApiResponse, CampingPlan, ListResponse, PlanItem } from '@/types'

export const createPlan = (userId: number, data: any): Promise<ApiResponse<CampingPlan>> => {
  return request.post('/plan/create', data, { params: { user_id: userId } })
}

export const getPlanList = (userId: number, params?: { page?: number; page_size?: number }): Promise<ApiResponse<ListResponse<CampingPlan>>> => {
  return request.get('/plan/list', { params: { user_id: userId, ...params } })
}

export const getPlanDetail = (planId: number): Promise<ApiResponse<CampingPlan>> => {
  return request.get(`/plan/${planId}`)
}

export const getTemplates = (params?: { page?: number; page_size?: number }): Promise<ApiResponse<ListResponse<CampingPlan>>> => {
  return request.get('/plan/templates', { params })
}

export const updatePlan = (planId: number, data: Partial<CampingPlan>): Promise<ApiResponse<CampingPlan>> => {
  return request.put(`/plan/${planId}`, data)
}

export const deletePlan = (planId: number): Promise<ApiResponse<null>> => {
  return request.delete(`/plan/${planId}`)
}

export const createPlanItem = (data: { plan_id: number; name: string; category?: string; quantity?: number }): Promise<ApiResponse<PlanItem>> => {
  return request.post('/plan/item', data)
}

export const updatePlanItem = (itemId: number, data: Partial<PlanItem>): Promise<ApiResponse<PlanItem>> => {
  return request.put(`/plan/item/${itemId}`, data)
}

export const deletePlanItem = (itemId: number): Promise<ApiResponse<null>> => {
  return request.delete(`/plan/item/${itemId}`)
}
