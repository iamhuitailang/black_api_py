import request from '@/utils/request'
import type { ApiResponse, Reminder } from '@/types'

export interface CreateReminderParams {
  task_id: number
  reminder_time: string
  reminder_type?: string
  message?: string
}

export const createReminder = (data: CreateReminderParams): Promise<ApiResponse<Reminder>> => {
  return request.post('/todo/reminder/create', data)
}

export const deleteReminder = (reminder_id: number): Promise<ApiResponse> => {
  return request.post('/todo/reminder/delete', null, { params: { reminder_id } })
}

export const cancelReminder = (reminder_id: number): Promise<ApiResponse> => {
  return request.post('/todo/reminder/cancel', null, { params: { reminder_id } })
}

export const getTaskReminders = (task_id: number): Promise<ApiResponse<Reminder[]>> => {
  return request.get('/todo/reminder/task/get', { params: { task_id } })
}

export const getReminderList = (status?: number): Promise<ApiResponse<Reminder[]>> => {
  return request.get('/todo/reminder/list/get', { params: { status } })
}
