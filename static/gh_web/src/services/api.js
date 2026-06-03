import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
}

export const ghostAPI = {
  getAll: () => api.get('/ghost-types'),
  getById: (id) => api.get(`/ghost-types/${id}`)
}

export const locationAPI = {
  getAll: () => api.get('/locations'),
  getById: (id) => api.get(`/locations/${id}`)
}

export const equipmentAPI = {
  getAll: () => api.get('/equipments'),
  getById: (id) => api.get(`/equipments/${id}`)
}

export const taskAPI = {
  getAll: () => api.get('/tasks'),
  getById: (id) => api.get(`/tasks/${id}`)
}

export const evidenceAPI = {
  getAllTypes: () => api.get('/evidence-types')
}

export const gameAPI = {
  getState: () => api.get('/game/state'),
  startExplore: (locationId, taskId) => api.post('/game/explore/start', { location_id: locationId, task_id: taskId }),
  stopExplore: () => api.post('/game/explore/stop'),
  collectEvidence: (data) => api.post('/game/evidence/collect', data),
  performExorcism: (data) => api.post('/game/exorcism', data),
  getMyTasks: (status) => api.get('/game/tasks', { params: { status } }),
  acceptTask: (taskId) => api.post(`/game/tasks/${taskId}/accept`),
  getMyEvidence: (taskId) => api.get('/game/evidence', { params: { task_id: taskId } }),
  getInventory: () => api.get('/game/inventory'),
  upgradeEquipment: (inventoryId) => api.post('/game/inventory/upgrade', { inventory_id: inventoryId }),
  buyEquipment: (equipmentId) => api.post(`/game/inventory/buy/${equipmentId}`),
  getArchive: () => api.get('/game/archive'),
  toggleNightMode: (isNight) => api.post('/game/night-mode', null, { params: { is_night: isNight } })
}

export default api
