import request from './request'
import type { ApiResponse, User } from '@/types'

export function login(username: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
  return request.post('/auth/login', { username, password })
}

export function register(username: string, password: string): Promise<ApiResponse<User>> {
  return request.post('/auth/register', { username, password })
}

export function logout(): Promise<ApiResponse<null>> {
  return request.post('/auth/logout')
}

export function getCurrentUser(): Promise<ApiResponse<User>> {
  return request.get('/auth/current/user/get')
}

export function changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<null>> {
  return request.post('/auth/password/change', {
    old_password: oldPassword,
    new_password: newPassword,
  })
}
