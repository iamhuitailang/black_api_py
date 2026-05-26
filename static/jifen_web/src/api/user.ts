import request from './request'

export interface LoginParams {
  username: string
  password: string
}

export interface RegisterParams {
  username: string
  password: string
  nickname?: string
  invite_code?: string
}

export interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar: string
  phone: string
  email: string
  points: number
  total_points: number
  role: string
  profile_completed: boolean
  invite_code: string
}

export const userApi = {
  login: (data: LoginParams) => request.post('/user/login', data),
  register: (data: RegisterParams) => request.post('/user/register', data),
  getUserInfo: () => request.get('/user/info'),
  updateUser: (data: any) => request.put('/user/update', data),
  completeProfile: () => request.post('/user/complete-profile'),
  getUserList: (params?: any) => request.get('/user/list', { params }),
  updateUserRole: (userId: number, role: string) => request.put(`/user/role/${userId}`, null, { params: { role } }),
  updateUserStatus: (userId: number, status: string) => request.put(`/user/status/${userId}`, null, { params: { status } }),
  deleteUser: (userId: number) => request.delete(`/user/${userId}`),
  getPointsRank: (limit: number = 20) => request.get('/user/rank', { params: { limit } }),
  getMyRank: () => request.get('/user/my-rank')
}
