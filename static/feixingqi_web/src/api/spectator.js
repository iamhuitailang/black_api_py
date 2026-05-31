import request from '@/utils/request'

export function joinSpectator(roomId, userId) {
  return request({
    url: `/spectator/${roomId}/join`,
    method: 'post',
    params: { user_id: userId }
  })
}

export function leaveSpectator(roomId, userId) {
  return request({
    url: `/spectator/${roomId}/leave`,
    method: 'post',
    params: { user_id: userId }
  })
}

export function getRoomSpectators(roomId) {
  return request({
    url: `/spectator/room/${roomId}`,
    method: 'get'
  })
}

export function getUserSpectatingRooms(userId) {
  return request({
    url: `/spectator/user/${userId}`,
    method: 'get'
  })
}
