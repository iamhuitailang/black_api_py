import request from '@/utils/request'
import type { ApiResponse, OverviewStatistics, TrendData, TagDistribution, ProjectDistribution, CalendarData, KanbanData, PersonalStats } from '@/types'

export const getOverviewStatistics = (params?: {
  start_date?: string
  end_date?: string
}): Promise<ApiResponse<OverviewStatistics>> => {
  return request.get('/todo/statistics/overview/get', { params })
}

export const getTrendData = (days?: number): Promise<ApiResponse<TrendData[]>> => {
  return request.get('/todo/statistics/trend/get', { params: { days } })
}

export const getTagDistribution = (): Promise<ApiResponse<TagDistribution[]>> => {
  return request.get('/todo/statistics/tag/distribution/get')
}

export const getProjectDistribution = (): Promise<ApiResponse<ProjectDistribution[]>> => {
  return request.get('/todo/statistics/project/distribution/get')
}

export const getCalendarData = (year: number, month: number): Promise<ApiResponse<CalendarData[]>> => {
  return request.get('/todo/statistics/calendar/get', { params: { year, month } })
}

export const getKanbanData = (project_id?: number): Promise<ApiResponse<KanbanData>> => {
  return request.get('/todo/statistics/kanban/get', { params: { project_id } })
}

export const getPersonalStats = (): Promise<ApiResponse<PersonalStats>> => {
  return request.get('/todo/statistics/personal/get')
}
