import { get, post, del, type ApiResult } from './request'

export interface UserInfo {
  id: number
  username: string
  nickname?: string
  avatar?: string
  email?: string
  bio?: string
  site_url?: string
  github?: string
  created_at?: string
  updated_at?: string
}

export interface LoginData {
  user: UserInfo
  token: string
}

export const authApi = {
  login: (username: string, password: string) =>
    post<LoginData>('/blog/auth/login', { username, password }),
  register: (payload: Record<string, string>) =>
    post<LoginData>('/blog/auth/register', payload),
  logout: () => post('/blog/auth/logout'),
  currentUser: () => get<UserInfo>('/blog/auth/current/user/get'),
  changePassword: (oldPassword: string, newPassword: string) =>
    post('/blog/auth/password/change', { old_password: oldPassword, new_password: newPassword }),
  updateProfile: (payload: Record<string, string>) =>
    post<UserInfo>('/blog/auth/profile/update', payload)
}

export type AuthApi = typeof authApi
