import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

let authToken = ''
let adminAuthToken = ''

api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`
    } else if (adminAuthToken) {
      config.headers.Authorization = `Bearer ${adminAuthToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API Error:', error)
    return {
      code: -1,
      msg: error.message || '网络错误',
      data: null
    }
  }
)

export function setToken(token) {
  authToken = token
}

export function setAdminToken(token) {
  adminAuthToken = token
}

export function getToken() {
  return authToken
}

export function getAdminToken() {
  return adminAuthToken
}

export default api
