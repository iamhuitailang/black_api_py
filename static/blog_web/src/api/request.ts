import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import storage from '@/utils/storage'
import router from '@/router'

const request: AxiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:8441/api',
  timeout: 15000
})

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    if (res && typeof res === 'object' && 'code' in res) {
      if (res.code === 0) {
        return res
      }
      if (res.code === 401) {
        storage.clear()
        router.push('/login')
        ElMessage.warning(res.message || '登录已过期')
        return Promise.reject(res)
      }
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(res)
    }
    return response
  },
  (error) => {
    const message = error?.response?.data?.message || error.message || '网络异常'
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default request

export interface ApiResult<T = unknown> {
  code: number
  message: string
  data: T
}

export const get = <T = unknown>(url: string, params?: Record<string, unknown>) =>
  request.get<unknown, ApiResult<T>>(url, { params })

export const post = <T = unknown>(url: string, data?: Record<string, unknown>) =>
  request.post<unknown, ApiResult<T>>(url, data)

export const put = <T = unknown>(url: string, data?: Record<string, unknown>) =>
  request.put<unknown, ApiResult<T>>(url, data)

export const del = <T = unknown>(url: string, params?: Record<string, unknown>) =>
  request.delete<unknown, ApiResult<T>>(url, { params })
