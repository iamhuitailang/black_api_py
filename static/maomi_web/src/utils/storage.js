const TOKEN_KEY = 'maomi_token'
const USER_KEY = 'maomi_user'
const GAME_STATUS_KEY = 'maomi_game_status'
const CURRENT_ROUTE_KEY = 'maomi_current_route'

export const storage = {
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token)
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY)
  },

  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  getUser() {
    const userStr = localStorage.getItem(USER_KEY)
    return userStr ? JSON.parse(userStr) : null
  },

  removeUser() {
    localStorage.removeItem(USER_KEY)
  },

  setGameStatus(status) {
    localStorage.setItem(GAME_STATUS_KEY, JSON.stringify(status))
  },

  getGameStatus() {
    const statusStr = localStorage.getItem(GAME_STATUS_KEY)
    return statusStr ? JSON.parse(statusStr) : null
  },

  removeGameStatus() {
    localStorage.removeItem(GAME_STATUS_KEY)
  },

  setCurrentRoute(route) {
    localStorage.setItem(CURRENT_ROUTE_KEY, route)
  },

  getCurrentRoute() {
    return localStorage.getItem(CURRENT_ROUTE_KEY)
  },

  removeCurrentRoute() {
    localStorage.removeItem(CURRENT_ROUTE_KEY)
  },

  clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(GAME_STATUS_KEY)
    localStorage.removeItem(CURRENT_ROUTE_KEY)
  }
}

export default storage
