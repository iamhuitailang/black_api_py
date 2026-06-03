import request from '@/utils/request'

export function register(data) {
  return request({
    url: '/sc/user/register',
    method: 'post',
    data
  })
}

export function login(data) {
  return request({
    url: '/sc/user/login',
    method: 'post',
    data
  })
}

export function logout() {
  return request({
    url: '/sc/user/logout',
    method: 'post'
  })
}

export function getCurrentUser() {
  return request({
    url: '/sc/user/current/get',
    method: 'get'
  })
}

export function updateProfile(data) {
  return request({
    url: '/sc/user/profile/update',
    method: 'post',
    data
  })
}

export function changePassword(data) {
  return request({
    url: '/sc/user/password/change',
    method: 'post',
    data
  })
}
