import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getUser, removeUser } from './storage'

const request = axios.create({
  baseURL: '/api/feixingqi',
  timeout: 10000
})

request.interceptors.request.use(config => {
  const user = getUser()
  if (user) {
    config.headers['X-User-Id'] = user.id
  }
  return config
}, error => {
  return Promise.reject(error)
})

request.interceptors.response.use(response => {
  const res = response.data
  if (res.code === 200) {
    return res.data
  } else {
    ElMessage.error(res.message || '请求失败')
    if (res.code === 401) {
      removeUser()
      window.location.href = '/login'
    }
    return Promise.reject(res)
  }
}, error => {
  ElMessage.error(error.message || '网络错误')
  return Promise.reject(error)
})

export default request
