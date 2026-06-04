import axios from 'axios'
import { useUserStore } from '../store'
import router from '../router'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const userStore = useUserStore()
    if (error.response) {
      if (error.response.status === 401) {
        userStore.logout()
        router.push('/login')
        alert('登录已过期，请重新登录')
      } else if (error.response.status >= 500) {
        const message = error.response.data?.message || '服务器错误，请稍后重试'
        alert(message)
      }
    } else if (error.message && !error.message.includes('请求失败')) {
      alert('网络连接失败，请检查网络')
    }
    return Promise.reject(error)
  }
)

export default request
