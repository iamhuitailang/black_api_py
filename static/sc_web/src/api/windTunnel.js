import request from '@/utils/request'

export function runTest(data) {
  return request({
    url: '/sc/wind/tunnel/run',
    method: 'post',
    data
  })
}

export function getUserTests(params) {
  return request({
    url: '/sc/wind/tunnel/user/list/get',
    method: 'get',
    params
  })
}

export function getCarTests(carId) {
  return request({
    url: '/sc/wind/tunnel/car/list/get',
    method: 'get',
    params: { car_id: carId }
  })
}

export function getLatestTest(carId) {
  return request({
    url: '/sc/wind/tunnel/latest/get',
    method: 'get',
    params: { car_id: carId }
  })
}

export function getTestDetail(testId) {
  return request({
    url: '/sc/wind/tunnel/detail/get',
    method: 'get',
    params: { test_id: testId }
  })
}
