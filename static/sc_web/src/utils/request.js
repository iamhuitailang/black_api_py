import axios from 'axios'
import { ElMessage } from 'element-plus'

const TOKEN_KEY = 'sc_token'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

let routerInstance = null

export function setRouter(router) {
  routerInstance = router
}

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code === 0) {
      return res
    } else {
      ElMessage.error(res.msg || '请求失败')
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem('sc_user')
      if (routerInstance) {
        routerInstance.push('/login')
      } else {
        const basePath = '/static/sc_web'
        window.location.href = basePath + '/login'
      }
      ElMessage.error('登录已过期，请重新登录')
    } else {
      ElMessage.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default request
