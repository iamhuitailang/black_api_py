import request from '@/utils/request'

export function startResearch(data) {
  return request({
    url: '/sc/research/start',
    method: 'post',
    data
  })
}

export function getUserResearch() {
  return request({
    url: '/sc/research/user/list/get',
    method: 'get'
  })
}

export function addProgress(data) {
  return request({
    url: '/sc/research/progress/add',
    method: 'post',
    data
  })
}

export function getResearchDetail(researchId) {
  return request({
    url: '/sc/research/detail/get',
    method: 'get',
    params: { research_id: researchId }
  })
}

export function cancelResearch(researchId) {
  return request({
    url: '/sc/research/cancel',
    method: 'post',
    data: { research_id: researchId }
  })
}
