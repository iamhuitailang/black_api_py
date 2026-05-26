import request from './request'

export interface ProductItem {
  id: number
  category_id: number
  category_name: string
  name: string
  description: string
  image: string
  price: number
  original_price: number
  stock: number
  is_hot: boolean
  is_online: boolean
  is_virtual: boolean
  exchange_count: number
  limit_type: string
  limit_count: number
}

export const productApi = {
  getList: (params?: any) => request.get('/product/list', { params }),
  getById: (id: number) => request.get(`/product/${id}`),
  getHot: (limit: number = 10) => request.get('/product/hot', { params: { limit } }),
  getByCategory: (categoryId: number, params?: any) => request.get(`/product/category/${categoryId}`, { params }),
  create: (data: any) => request.post('/product/', data),
  update: (id: number, data: any) => request.put(`/product/${id}`, data),
  delete: (id: number) => request.delete(`/product/${id}`),
  toggleOnline: (id: number) => request.put(`/product/toggle/${id}`)
}
