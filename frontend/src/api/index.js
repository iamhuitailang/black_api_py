import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.response.use(
  response => {
    if (response.data && response.data.code === 0) {
      return response.data.data
    }
    return Promise.reject(response.data?.message || '请求失败')
  },
  error => {
    return Promise.reject(error.message || '网络错误')
  }
)

export const projectApi = {
  getList: () => api.get('/project/list'),
  getById: (id) => api.get('/project/get', { params: { id } }),
  create: (data) => api.post('/project/create', data),
  update: (data) => api.post('/project/update', data),
  delete: (id) => api.delete('/project/delete', { params: { id } })
}

export const meetingApi = {
  getList: (params) => api.get('/meeting/list', { params }),
  getById: (id) => api.get('/meeting/get', { params: { id } }),
  create: (data) => api.post('/meeting/create', data),
  update: (data) => api.post('/meeting/update', data),
  delete: (id) => api.delete('/meeting/delete', { params: { id } }),
  search: (keyword, params = {}) => api.get('/meeting/search', { params: { keyword, ...params } }),
  getAttendees: () => api.get('/meeting/attendees')
}

export const actionItemApi = {
  getList: (params) => api.get('/action/list', { params }),
  updateStatus: (id, completed) => api.post('/action/status', { id, completed }),
  setReminder: (id, reminder_time, reminder_email) => api.post('/action/reminder', { id, reminder_time, reminder_email }),
  checkReminders: () => api.get('/action/reminder/check'),
  create: (data) => api.post('/action/create', data),
  update: (data) => api.post('/action/update', data),
  delete: (id) => api.delete('/action/delete', { params: { id } })
}

export const statsApi = {
  getProjectStats: () => api.get('/stats/project')
}

export default api
