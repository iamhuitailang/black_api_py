import axios from 'axios'
import { storage } from './storage'
import router from '@/router'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use(
  config => {
    const token = storage.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code === 401) {
      storage.clearAll()
      router.push('/login')
    }
    return res
  },
  error => {
    if (error.response?.status === 401) {
      storage.clearAll()
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

export default request
