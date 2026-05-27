import axios from 'axios'

const api = axios.create({
  baseURL: '/api/balance',
  timeout: 10000
})

api.interceptors.response.use(
  response => {
    if (response.data.code === 200) {
      return response.data.data
    }
    return Promise.reject(response.data.message)
  },
  error => {
    return Promise.reject(error)
  }
)

export const userApi = {
  login: (username, password) => api.post('/users/login', null, { params: { username, password } }),
  getUsers: () => api.get('/users'),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data)
}

export const levelApi = {
  getLevels: () => api.get('/levels'),
  getLevel: (id) => api.get(`/levels/${id}`)
}

export const saveApi = {
  getSaves: (userId) => api.get('/saves', { params: { user_id: userId } }),
  getSave: (id) => api.get(`/saves/${id}`),
  getAutoSave: (userId, levelId) => api.get(`/saves/auto/${userId}/${levelId}`),
  createSave: (data) => api.post('/saves', data),
  deleteSave: (id) => api.delete(`/saves/${id}`)
}

export const scoreApi = {
  getScores: (params) => api.get('/scores', { params }),
  createScore: (data) => api.post('/scores', data)
}

export const blockApi = {
  getBlocks: () => api.get('/blocks')
}

export default api
