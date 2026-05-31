import request from '@/utils/request'

export function createRoom(data) {
  return request({
    url: '/room',
    method: 'post',
    data
  })
}

export function getRoom(id) {
  return request({
    url: `/room/${id}`,
    method: 'get'
  })
}

export function getRoomByCode(code) {
  return request({
    url: `/room/code/${code}`,
    method: 'get'
  })
}

export function getRoomList(params) {
  return request({
    url: '/room',
    method: 'get',
    params
  })
}

export function joinRoom(id, data) {
  return request({
    url: `/room/${id}/join`,
    method: 'post',
    data
  })
}

export function leaveRoom(id, userId) {
  return request({
    url: `/room/${id}/leave`,
    method: 'post',
    params: { user_id: userId }
  })
}

export function startGame(id, userId) {
  return request({
    url: `/room/${id}/start`,
    method: 'post',
    params: { user_id: userId }
  })
}

export function deleteRoom(id) {
  return request({
    url: `/room/${id}`,
    method: 'delete'
  })
}

export function quickMatch(data) {
  return request({
    url: '/room/quick-match',
    method: 'post',
    data
  })
}