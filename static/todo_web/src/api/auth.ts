import request from '@/utils/request'
import type { ApiResponse, LoginData, User } from '@/types'

export interface RegisterParams {
  username: string
  email: string
  password: string
  nickname?: string
}

export interface LoginParams {
  login_name: string
  password: string
}

export const register = (data: RegisterParams): Promise<ApiResponse<LoginData>> => {
  return request.post('/todo/auth/register', data)
}

export const login = (data: LoginParams): Promise<ApiResponse<LoginData>> => {
  return request.post('/todo/auth/login', data)
}

export const logout = (): Promise<ApiResponse> => {
  return request.post('/todo/auth/logout')
}

export const getCurrentUser = (): Promise<ApiResponse<User>> => {
  return request.get('/todo/auth/current/get')
}
