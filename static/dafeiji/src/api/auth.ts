import { post, get } from './request'
import type { User, ApiResponse } from '@/types'

export const authApi = {
  login(username: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    return post('/dafeiji/auth/login', { username, password })
  },

  register(username: string, password: string, confirm_password: string): Promise<ApiResponse> {
    return post('/dafeiji/auth/register', { username, password, confirm_password })
  },

  changePassword(old_password: string, new_password: string): Promise<ApiResponse> {
    return post('/dafeiji/auth/change/password', { old_password, new_password })
  },

  getUserInfo(): Promise<ApiResponse<User>> {
    return get('/dafeiji/auth/user/info')
  }
}
