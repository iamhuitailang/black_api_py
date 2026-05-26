import request from './request'

export const categoryApi = {
  getList: () => request.get('/category/list'),
  getById: (id: number) => request.get(`/category/${id}`),
  create: (data: any) => request.post('/category/', data),
  update: (id: number, data: any) => request.put(`/category/${id}`, data),
  delete: (id: number) => request.delete(`/category/${id}`)
}
