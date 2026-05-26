import request from '@/utils/request'
import type { ApiResponse, Tag } from '@/types'

export interface CreateTagParams {
  name: string
  color?: string
}

export interface UpdateTagParams {
  name?: string
  color?: string
}

export const createTag = (data: CreateTagParams): Promise<ApiResponse<Tag>> => {
  return request.post('/todo/tag/create', data)
}

export const updateTag = (tag_id: number, data: UpdateTagParams): Promise<ApiResponse<Tag>> => {
  return request.post('/todo/tag/update', data, { params: { tag_id } })
}

export const deleteTag = (tag_id: number): Promise<ApiResponse> => {
  return request.post('/todo/tag/delete', null, { params: { tag_id } })
}

export const getAllTags = (): Promise<ApiResponse<Tag[]>> => {
  return request.get('/todo/tag/all/get')
}
