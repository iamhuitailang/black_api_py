import request from '@/utils/request'

export function initGame(roomId) {
  return request({
    url: `/game/${roomId}/init`,
    method: 'post'
  })
}

export function getGameState(roomId) {
  return request({
    url: `/game/${roomId}/state`,
    method: 'get'
  })
}

export function rollDice(roomId, userId) {
  return request({
    url: `/game/${roomId}/roll`,
    method: 'post',
    params: { user_id: userId }
  })
}

export function movePiece(roomId, userId, pieceId) {
  return request({
    url: `/game/${roomId}/move`,
    method: 'post',
    params: { user_id: userId, piece_id: pieceId }
  })
}

export function useItem(roomId, data) {
  return request({
    url: `/game/${roomId}/use-item`,
    method: 'post',
    data
  })
}

export function getGameRecords(params) {
  return request({
    url: '/game/records',
    method: 'get',
    params
  })
}
