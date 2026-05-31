import request from '@/utils/request'

export function getRankList(params) {
  return request({
    url: '/rank',
    method: 'get',
    params
  })
}

export function getUserRank(userId) {
  return request({
    url: `/rank/user/${userId}`,
    method: 'get'
  })
}

export function getStatistics() {
  return request({
    url: '/rank/statistics',
    method: 'get'
  })
}
