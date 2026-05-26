import request from './request'

export const pointsApi = {
  getSummary: () => request.get('/points/summary'),
  getRecords: (params?: any) => request.get('/points/records', { params }),
  getAllRecords: (params?: any) => request.get('/points/all-records', { params })
}
