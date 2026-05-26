import request from './request'

export const lotteryApi = {
  draw: (productId: number) => request.post('/lottery/draw', null, { params: { product_id: productId } }),
  getMyRecords: (params?: any) => request.get('/lottery/my-records', { params }),
  getAllRecords: (params?: any) => request.get('/lottery/all-records', { params })
}
