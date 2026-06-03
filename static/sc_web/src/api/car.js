import request from '@/utils/request'

export function getUserCars() {
  return request({
    url: '/sc/car/user/list/get',
    method: 'get'
  })
}

export function getCarDetail(carId) {
  return request({
    url: '/sc/car/detail/get',
    method: 'get',
    params: { car_id: carId }
  })
}

export function createCar(data) {
  return request({
    url: '/sc/car/create',
    method: 'post',
    data
  })
}

export function updateCar(data) {
  return request({
    url: '/sc/car/update',
    method: 'post',
    data
  })
}

export function deleteCar(carId) {
  return request({
    url: '/sc/car/delete',
    method: 'post',
    data: { car_id: carId }
  })
}

export function setActiveCarApi(carId) {
  return request({
    url: '/sc/car/active/set',
    method: 'post',
    data: { car_id: carId }
  })
}

export function updateCarStatsApi(carId, stats) {
  return request({
    url: '/sc/car/stats/update',
    method: 'post',
    data: { car_id: carId, stats }
  })
}

export function installPartToCar(carId, partId, slotType) {
  return request({
    url: '/sc/car/part/install',
    method: 'post',
    data: { car_id: carId, part_id: partId, slot_type: slotType }
  })
}

export function uninstallPartFromCar(carId, carPartId) {
  return request({
    url: '/sc/car/part/uninstall',
    method: 'post',
    data: { car_id: carId, car_part_id: carPartId }
  })
}
