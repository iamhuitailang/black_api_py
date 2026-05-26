import request from '@/utils/request'
import type { ApiResponse, Campsite, Review, ListResponse } from '@/types'

export const createCampsite = (userId: number, data: Partial<Campsite>): Promise<ApiResponse<Campsite>> => {
  return request.post('/campsite/create', data, { params: { user_id: userId } })
}

export const getCampsiteList = (params?: { page?: number; page_size?: number; keyword?: string; difficulty?: string }): Promise<ApiResponse<ListResponse<Campsite>>> => {
  return request.get('/campsite/list', { params })
}

export const getCampsiteDetail = (campsiteId: number, userId?: number): Promise<ApiResponse<Campsite>> => {
  return request.get(`/campsite/${campsiteId}`, { params: { user_id: userId } })
}

export const updateCampsite = (campsiteId: number, data: Partial<Campsite>): Promise<ApiResponse<Campsite>> => {
  return request.put(`/campsite/${campsiteId}`, data)
}

export const deleteCampsite = (campsiteId: number): Promise<ApiResponse<null>> => {
  return request.delete(`/campsite/${campsiteId}`)
}

export const createReview = (userId: number, data: { campsite_id: number; rating: number; content?: string }): Promise<ApiResponse<Review>> => {
  return request.post('/campsite/review', data, { params: { user_id: userId } })
}

export const getReviews = (campsiteId: number, params?: { page?: number; page_size?: number }): Promise<ApiResponse<ListResponse<Review>>> => {
  return request.get(`/campsite/review/list/${campsiteId}`, { params })
}

export const deleteReview = (reviewId: number): Promise<ApiResponse<null>> => {
  return request.delete(`/campsite/review/${reviewId}`)
}

export const toggleFavorite = (campsiteId: number, userId: number): Promise<ApiResponse<{ is_favorited: boolean }>> => {
  return request.post('/campsite/favorite', null, { params: { campsite_id: campsiteId, user_id: userId } })
}

export const getFavorites = (userId: number, params?: { page?: number; page_size?: number }): Promise<ApiResponse<ListResponse<Campsite>>> => {
  return request.get('/campsite/favorite/list', { params: { user_id: userId, ...params } })
}
