import { reactive } from 'vue'

const state = reactive({
  user: null,
  token: localStorage.getItem('token') || '',
  isAdmin: false,
  adminToken: localStorage.getItem('adminToken') || '',
  admin: null,
  currentGame: null
})

const Store = {
  state,

  setUser(user) {
    state.user = user
  },

  setToken(token) {
    state.token = token
    localStorage.setItem('token', token)
  },

  clearUser() {
    state.user = null
    state.token = ''
    localStorage.removeItem('token')
  },

  setAdmin(admin) {
    state.admin = admin
    state.isAdmin = !!admin
  },

  setAdminToken(token) {
    state.adminToken = token
    localStorage.setItem('adminToken', token)
  },

  clearAdmin() {
    state.admin = null
    state.isAdmin = false
    state.adminToken = ''
    localStorage.removeItem('adminToken')
  },

  setCurrentGame(game) {
    state.currentGame = game
  },

  loadFromStorage() {
    const token = localStorage.getItem('token')
    const adminToken = localStorage.getItem('adminToken')
    if (token) state.token = token
    if (adminToken) state.adminToken = adminToken
  },

  get isLoggedIn() {
    return !!state.token
  },

  get isAdminLoggedIn() {
    return !!state.adminToken
  }
}

export default Store
