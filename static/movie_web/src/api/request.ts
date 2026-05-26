import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/types'

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000
})

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('movie_token')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data
    if (res.code === 0) {
      return res
    }
    ElMessage.error(res.msg || '请求失败')
    return Promise.reject(new Error(res.msg || '请求失败'))
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('movie_token')
      localStorage.removeItem('movie_user')
      window.location.href = '/#/login'
    } else {
      ElMessage.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default request

export const api = {
  get: <T = any>(url: string, params?: any, config?: any): Promise<ApiResponse<T>> =>
    request.get(url, { params, ...config }),
  post: <T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> =>
    request.post(url, data, config),
  put: <T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> =>
    request.put(url, data, config),
  delete: <T = any>(url: string, config?: any): Promise<ApiResponse<T>> =>
    request.delete(url, config)
}