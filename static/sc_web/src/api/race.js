import request from '@/utils/request'

export function getUpcomingRaces(params) {
  return request({
    url: '/sc/race/upcoming/list/get',
    method: 'get',
    params
  })
}

export function getRaceDetail(raceId) {
  return request({
    url: '/sc/race/detail/get',
    method: 'get',
    params: { race_id: raceId }
  })
}

export function enterRace(data) {
  return request({
    url: '/sc/race/enter',
    method: 'post',
    data
  })
}

export function getRaceEntries(raceId) {
  return request({
    url: '/sc/race/entry/list/get',
    method: 'get',
    params: { race_id: raceId }
  })
}

export function getUserRaces() {
  return request({
    url: '/sc/race/user/list/get',
    method: 'get'
  })
}

export function simulateRace(raceId) {
  return request({
    url: '/sc/race/simulate',
    method: 'post',
    data: { race_id: raceId }
  })
}

export function getRaceResults(raceId) {
  return request({
    url: '/sc/race/result/list/get',
    method: 'get',
    params: { race_id: raceId }
  })
}

export function getUserResults(params) {
  return request({
    url: '/sc/race/user/result/list/get',
    method: 'get',
    params
  })
}
