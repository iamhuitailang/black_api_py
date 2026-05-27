import request from '@/utils/request'

export const gameApi = {
  saveRecord(data) {
    return request({
      url: '/game/record',
      method: 'post',
      data
    })
  },
  
  getMyRecords(params) {
    return request({
      url: '/game/records',
      method: 'get',
      params
    })
  },
  
  getAllRecords(params) {
    return request({
      url: '/game/all',
      method: 'get',
      params
    })
  }
}
