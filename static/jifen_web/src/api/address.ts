import request from './request'

export const addressApi = {
  getList: () => request.get('/address/list'),
  getById: (id: number) => request.get(`/address/${id}`),
  getDefault: () => request.get('/address/default'),
  create: (data: any) => request.post('/address/', data),
  update: (id: number, data: any) => request.put(`/address/${id}`, data),
  setDefault: (id: number) => request.put(`/address/default/${id}`),
  delete: (id: number) => request.delete(`/address/${id}`)
}
