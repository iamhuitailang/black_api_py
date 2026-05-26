import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useUserStore } from '@/store'

const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    const token = userStore.token || localStorage.getItem('jianli_token')
    const adminToken = userStore.adminToken || localStorage.getItem('jianli_admin_token')
    
    if (token && !config.url?.includes('/admin/')) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    if (adminToken && config.url?.includes('/admin/')) {
      config.headers.Authorization = `Bearer ${adminToken}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    
    if (res.code !== 0) {
      ElMessage.error(res.msg || '请求失败')
      
      if (res.code === 401 || res.msg === '请先登录' || res.msg === '请先登录管理员账号') {
        const userStore = useUserStore()
        userStore.logout()
        if (window.location.pathname.includes('/admin')) {
          router.push('/admin/login')
        } else {
          router.push('/login')
        }
      }
      
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
    
    return res.data
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        const userStore = useUserStore()
        userStore.logout()
        router.push('/login')
      }
      ElMessage.error(error.response.data?.msg || error.message || '网络错误')
    } else {
      ElMessage.error('网络连接失败，请检查网络')
    }
    return Promise.reject(error)
  }
)

export default service
