import request from '@/utils/request'

export function createPaint(data) {
  return request({
    url: '/sc/paint/create',
    method: 'post',
    data
  })
}

export function getUserPaints() {
  return request({
    url: '/sc/paint/user/list/get',
    method: 'get'
  })
}

export function getPublicPaints(params) {
  return request({
    url: '/sc/paint/public/list/get',
    method: 'get',
    params
  })
}

export function updatePaint(data) {
  return request({
    url: '/sc/paint/update',
    method: 'post',
    data
  })
}

export function deletePaint(paintId) {
  return request({
    url: '/sc/paint/delete',
    method: 'post',
    data: { paint_id: paintId }
  })
}

export function buyPaint(paintId) {
  return request({
    url: '/sc/paint/buy',
    method: 'post',
    data: { paint_id: paintId }
  })
}
