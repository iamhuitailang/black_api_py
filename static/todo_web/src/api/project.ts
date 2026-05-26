import request from '@/utils/request'
import type { ApiResponse, Project, PaginationResult } from '@/types'

export interface CreateProjectParams {
  name: string
  description?: string
  color?: string
  icon?: string
  sort_order?: number
}

export interface UpdateProjectParams {
  name?: string
  description?: string
  color?: string
  icon?: string
  sort_order?: number
  status?: number
}

export const createProject = (data: CreateProjectParams): Promise<ApiResponse<Project>> => {
  return request.post('/todo/project/create', data)
}

export const updateProject = (project_id: number, data: UpdateProjectParams): Promise<ApiResponse<Project>> => {
  return request.post('/todo/project/update', data, { params: { project_id } })
}

export const deleteProject = (project_id: number): Promise<ApiResponse> => {
  return request.post('/todo/project/delete', null, { params: { project_id } })
}

export const getProjectDetail = (project_id: number): Promise<ApiResponse<Project>> => {
  return request.get('/todo/project/detail/get', { params: { project_id } })
}

export const getProjectList = (params: {
  page?: number
  page_size?: number
  status?: number
  keyword?: string
}): Promise<ApiResponse<PaginationResult<Project>>> => {
  return request.get('/todo/project/list/get', { params })
}

export const getAllProjects = (status?: number): Promise<ApiResponse<Project[]>> => {
  return request.get('/todo/project/all/get', { params: { status } })
}

export const getProjectProgress = (project_id: number): Promise<ApiResponse> => {
  return request.get('/todo/project/progress/get', { params: { project_id } })
}

export const archiveProject = (project_id: number): Promise<ApiResponse<Project>> => {
  return request.post('/todo/project/archive', null, { params: { project_id } })
}

export const unarchiveProject = (project_id: number): Promise<ApiResponse<Project>> => {
  return request.post('/todo/project/unarchive', null, { params: { project_id } })
}
