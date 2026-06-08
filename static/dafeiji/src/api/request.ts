import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { useUserStore } from '@/stores/user'
import { storage } from '@/utils/storage'
import type { ApiResponse } from '@/types'

const baseURL = import.meta.env.DEV ? '/api' : '/api'

const request: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000
})

request.interceptors.request.use(
  (config) => {
    const token = storage.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse
    if (data.code === 1 && data.message.includes('登录')) {
      const userStore = useUserStore()
      userStore.logout()
    }
    return response.data
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

export default request

export function get<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return request.get(url, { params, ...config })
}

export function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return request.post(url, data, config)
}
