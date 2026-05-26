import request from '@/utils/request'
import type { ApiResponse, User, UserLogin, UserRegister, ListResponse } from '@/types'

export const login = (data: UserLogin): Promise<ApiResponse<{ token: string; user: User }>> => {
  return request.post('/user/login', data)
}

export const register = (data: UserRegister): Promise<ApiResponse<User>> => {
  return request.post('/user/register', data)
}

export const getUserInfo = (userId: number): Promise<ApiResponse<User>> => {
  return request.get(`/user/info?user_id=${userId}`)
}

export const updateUser = (userId: number, data: Partial<User>): Promise<ApiResponse<User>> => {
  return request.put(`/user/update?user_id=${userId}`, data)
}

export const getUserList = (params: { page?: number; page_size?: number; keyword?: string }): Promise<ApiResponse<ListResponse<User>>> => {
  return request.get('/user/list', { params })
}

export const deleteUser = (userId: number): Promise<ApiResponse<null>> => {
  return request.delete(`/user/${userId}`)
}
