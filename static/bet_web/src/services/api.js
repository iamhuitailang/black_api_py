import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8002/api',
  timeout: 10000
})

api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.code === 200) {
      return response.data.data
    }
    return Promise.reject(response.data || response)
  },
  (error) => {
    return Promise.reject(error)
  }
)

export const playerApi = {
  create: (name) => api.post('/player', { name }),
  get: (id) => api.get(`/player/${id}`),
  getAll: (skip = 0, limit = 100) => api.get('/player', { params: { skip, limit } }),
  update: (id, data) => api.put(`/player/${id}`, data),
  delete: (id) => api.delete(`/player/${id}`),
  addWin: (id) => api.post(`/player/${id}/win`),
  addLoss: (id) => api.post(`/player/${id}/loss`)
}

export const sceneApi = {
  get: (id) => api.get(`/scene/${id}`),
  getByName: (name) => api.get(`/scene/name/${name}`),
  getAll: () => api.get('/scene'),
  getActive: () => api.get('/scene/active/all')
}

export const bulletApi = {
  get: (id) => api.get(`/bullet/${id}`),
  getByName: (name) => api.get(`/bullet/name/${name}`),
  getAll: () => api.get('/bullet')
}

export const skillApi = {
  get: (id) => api.get(`/skill/${id}`),
  getByName: (name) => api.get(`/skill/name/${name}`),
  getActive: () => api.get('/skill/active/all')
}

export const gameSaveApi = {
  create: (data) => api.post('/game-save', data),
  get: (id) => api.get(`/game-save/${id}`),
  getActive: (playerId) => api.get(`/game-save/player/${playerId}/active`),
  getByPlayer: (playerId) => api.get(`/game-save/player/${playerId}`),
  update: (id, data) => api.put(`/game-save/${id}`, data),
  delete: (id) => api.delete(`/game-save/${id}`)
}

export const gameRecordApi = {
  create: (data) => api.post('/game-record', data),
  get: (id) => api.get(`/game-record/${id}`),
  getByPlayer: (playerId) => api.get(`/game-record/player/${playerId}`),
  getAll: () => api.get('/game-record')
}

export default api
