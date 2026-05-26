import request from '@/utils/request'
import type { ApiResponse, User } from '@/types'

export interface UpdateProfileParams {
  nickname?: string
  email?: string
  avatar?: string
  bio?: string
}

export interface ChangePasswordParams {
  old_password: string
  new_password: string
}

export const updateProfile = (data: UpdateProfileParams): Promise<ApiResponse<User>> => {
  return request.post('/todo/user/profile/update', data)
}

export const changePassword = (data: ChangePasswordParams): Promise<ApiResponse> => {
  return request.post('/todo/user/password/change', data)
}

export const getUserDetail = (user_id: number): Promise<ApiResponse<User>> => {
  return request.get('/todo/user/detail/get', { params: { user_id } })
}
