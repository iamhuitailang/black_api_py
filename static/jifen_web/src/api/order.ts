import request from './request'

export const orderApi = {
  create: (data: any) => request.post('/order/', data),
  getMyOrders: (params?: any) => request.get('/order/my', { params }),
  getList: (params?: any) => request.get('/order/list', { params }),
  getById: (id: number) => request.get(`/order/${id}`),
  updateStatus: (id: number, status: string) => request.put(`/order/status/${id}`, null, { params: { status } }),
  updateExpress: (id: number, express_no: string, express_company: string) => request.put(`/order/express/${id}`, null, { params: { express_no, express_company } }),
  delete: (id: number) => request.delete(`/order/${id}`)
}
