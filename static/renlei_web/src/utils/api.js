import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      if (config.method === 'get') {
        config.params = config.params || {}
        config.params.token = token
      } else {
        config.data = config.data || {}
        config.data.token = token
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data && typeof data === 'object' && 'code' in data) {
      return data
    }
    return { code: 0, message: 'success', data }
  },
  (error) => Promise.reject(error)
)

export default api
