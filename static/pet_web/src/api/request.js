import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({
  baseURL: '/api',
  timeout: 15000
})

service.interceptors.request.use(
  config => {
    const user = localStorage.getItem('pet_user')
    if (user) {
      config.headers['Authorization'] = `Bearer ${JSON.parse(user).id}`
    }
    return config
  },
  error => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code === 200) {
      return res
    } else {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || 'Error'))
    }
  },
  error => {
    console.error('Response error:', error)
    ElMessage.error('网络请求失败，请稍后重试')
    return Promise.reject(error)
  }
)

export default service
