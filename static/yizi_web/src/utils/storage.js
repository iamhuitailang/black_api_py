const TOKEN_KEY = 'yizi_token'
const USER_KEY = 'yizi_user'
const GAME_STATE_KEY = 'yizi_game_state'

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
  
  setGameState(state) {
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state))
  },
  
  getGameState() {
    const stateStr = localStorage.getItem(GAME_STATE_KEY)
    return stateStr ? JSON.parse(stateStr) : null
  },
  
  removeGameState() {
    localStorage.removeItem(GAME_STATE_KEY)
  },
  
  clearAll() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(GAME_STATE_KEY)
  }
}
