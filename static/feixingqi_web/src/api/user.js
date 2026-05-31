import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/user/login',
    method: 'post',
    data
  })
}

export function register(data) {
  return request({
    url: '/user/register',
    method: 'post',
    data
  })
}

export function updatePassword(data) {
  return request({
    url: '/user/update-password',
    method: 'post',
    data
  })
}

export function updateUser(data) {
  return request({
    url: '/user/update',
    method: 'post',
    data: {
      user_id: data.id,
      nickname: data.nickname,
      role: data.role,
      score: data.score
    }
  })
}

export function getUser(id) {
  return request({
    url: `/user/${id}`,
    method: 'get'
  })
}

export function getUserList(params) {
  return request({
    url: '/user',
    method: 'get',
    params
  })
}

export function deleteUser(id) {
  return request({
    url: `/user/${id}`,
    method: 'delete'
  })
}

export function updateUserStatus(id, status) {
  return request({
    url: `/user/${id}/status`,
    method: 'post',
    params: { status: status === 'active' ? 1 : 0 }
  })
}
