import request from '@/utils/request'
import type { ApiResponse, Task, PaginationResult, TaskQueryParams } from '@/types'

export interface CreateTaskParams {
  title: string
  description?: string
  project_id?: number
  status?: number
  priority?: number
  tags?: string
  due_date?: string
  estimated_time?: number
  sort_order?: number
}

export interface UpdateTaskParams {
  title?: string
  description?: string
  project_id?: number
  status?: number
  priority?: number
  tags?: string[]
  due_date?: string
  estimated_time?: number
  actual_time?: number
  sort_order?: number
}

export const createTask = (data: CreateTaskParams): Promise<ApiResponse<Task>> => {
  return request.post('/todo/task/create', data)
}

export const updateTask = (task_id: number, data: UpdateTaskParams): Promise<ApiResponse<Task>> => {
  return request.post('/todo/task/update', data, { params: { task_id } })
}

export const deleteTask = (task_id: number): Promise<ApiResponse> => {
  return request.post('/todo/task/delete', null, { params: { task_id } })
}

export const batchDeleteTasks = (task_ids: number[]): Promise<ApiResponse> => {
  return request.post('/todo/task/batch/delete', { task_ids })
}

export const getTaskDetail = (task_id: number): Promise<ApiResponse<Task>> => {
  return request.get('/todo/task/detail/get', { params: { task_id } })
}

export const getTaskList = (params: TaskQueryParams): Promise<ApiResponse<PaginationResult<Task>>> => {
  return request.get('/todo/task/list/get', { params })
}

export const getTodayTasks = (): Promise<ApiResponse<Task[]>> => {
  return request.get('/todo/task/today/get')
}

export const getOverdueTasks = (): Promise<ApiResponse<Task[]>> => {
  return request.get('/todo/task/overdue/get')
}

export const completeTask = (task_id: number): Promise<ApiResponse<Task>> => {
  return request.post('/todo/task/complete', null, { params: { task_id } })
}

export const startTask = (task_id: number): Promise<ApiResponse<Task>> => {
  return request.post('/todo/task/start', null, { params: { task_id } })
}

export const pauseTask = (task_id: number): Promise<ApiResponse<Task>> => {
  return request.post('/todo/task/pause', null, { params: { task_id } })
}

export const cancelTask = (task_id: number): Promise<ApiResponse<Task>> => {
  return request.post('/todo/task/cancel', null, { params: { task_id } })
}

export const moveTaskToProject = (task_id: number, project_id: number): Promise<ApiResponse<Task>> => {
  return request.post('/todo/task/move', null, { params: { task_id, project_id } })
}

export const batchUpdateTaskStatus = (task_ids: number[], status: number): Promise<ApiResponse> => {
  return request.post('/todo/task/batch/status', { task_ids }, { params: { status } })
}
