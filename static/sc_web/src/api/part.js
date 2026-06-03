import request from '@/utils/request'

export function getAllParts() {
  return request({
    url: '/sc/part/list/get',
    method: 'get'
  })
}

export function getUserParts() {
  return request({
    url: '/sc/part/user/list/get',
    method: 'get'
  })
}

export function getPartDetail(partId) {
  return request({
    url: '/sc/part/detail/get',
    method: 'get',
    params: { part_id: partId }
  })
}

export function buyPart(partId) {
  return request({
    url: '/sc/part/buy',
    method: 'post',
    data: { part_id: partId }
  })
}

export function installPart(carId, partId) {
  return request({
    url: '/sc/part/install',
    method: 'post',
    data: { car_id: carId, part_id: partId }
  })
}

export function uninstallPart(carId, slotType) {
  return request({
    url: '/sc/part/uninstall',
    method: 'post',
    data: { car_id: carId, slot_type: slotType }
  })
}

export function sellPart(userPartId) {
  return request({
    url: '/sc/part/sell',
    method: 'post',
    data: { user_part_id: userPartId }
  })
}
