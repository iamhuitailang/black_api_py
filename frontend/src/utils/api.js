import axios from 'axios'
import router from '../router'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000
})

request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('kpi_token')
    if (token) {
      config.headers.Authorization = 'Bearer ' + token
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('API Error:', error)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('kpi_token')
      localStorage.removeItem('kpi_user')
      router.push('/login')
    }
    if (error.response && error.response.status === 403) {
      alert('权限不足：' + (error.response.data?.detail || '您没有此操作权限'))
    }
    return Promise.reject(error)
  }
)

export default {
  login: (username, password) => request.post('/auth/login', { username, password }),
  logout: () => request.post('/auth/logout'),
  getCurrentUser: () => request.get('/auth/current/user/get'),

  getEmployees: () => request.get('/kpi/employees'),
  getEmployeeByUser: (userId) => request.get(`/kpi/employees/user/${userId}`),
  getDepartments: () => request.get('/kpi/departments'),
  getSubordinates: (supervisorId) => request.get(`/kpi/employees/${supervisorId}/subordinates`),

  getCycles: () => request.get('/kpi/cycles'),
  getCycle: (id) => request.get(`/kpi/cycles/${id}`),
  createCycle: (data) => request.post('/kpi/cycles', data),
  updateCycle: (id, data) => request.put(`/kpi/cycles/${id}`, data),
  deleteCycle: (id) => request.delete(`/kpi/cycles/${id}`),
  publishCycle: (id) => request.post(`/kpi/cycles/${id}/publish`),

  getRecords: (params) => request.get('/kpi/records', { params }),
  getRecord: (id) => request.get(`/kpi/records/${id}`),
  submitSelfReview: (id, data) => request.post(`/kpi/records/${id}/self-review`, data),
  submitSupervisorReview: (id, data) => request.post(`/kpi/records/${id}/supervisor-review`, data),

  getStatistics: (params) => request.get('/kpi/statistics', { params }),
  getEmployeeTrend: (employeeId) => request.get(`/kpi/employees/${employeeId}/trend`)
}
