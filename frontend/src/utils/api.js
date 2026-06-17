import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000
})

request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export default {
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
