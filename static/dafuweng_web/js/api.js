const BASE_URL = '/api'

async function request(url, options = {}) {
  const isAdmin = url.includes('/dafuweng/admin/')
  const token = isAdmin
    ? localStorage.getItem('adminToken')
    : localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const response = await fetch(BASE_URL + url, { ...options, headers })
  const data = await response.json()
  return data
}

function get(url) {
  return request(url)
}

function toSnakeCase(obj) {
  const newBody = {}
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      newBody[snakeKey] = obj[key]
    }
  }
  return Object.keys(newBody).length ? newBody : obj
}

function post(url, body) {
  return request(url, { method: 'POST', body: JSON.stringify(toSnakeCase(body)) })
}

function put(url, body) {
  return request(url, { method: 'PUT', body: JSON.stringify(toSnakeCase(body)) })
}

function del(url, body) {
  return request(url, { method: 'DELETE', body: JSON.stringify(toSnakeCase(body)) })
}

const Api = {
  register(data) { return post('/dafuweng/user/register', data) },
  login(data) { return post('/dafuweng/user/login', data) },
  logout() { return post('/dafuweng/user/logout') },
  getCurrentUser() { return get('/dafuweng/user/current/get') },
  updateProfile(data) { return post('/dafuweng/user/profile/update', data) },
  changePassword(data) { return post('/dafuweng/user/password/change', data) },

  createGame(data) { return post('/dafuweng/game/create', data) },
  joinGame(data) { return post('/dafuweng/game/join', data) },
  startGame(data) { return post('/dafuweng/game/start', data) },
  rollDice(data) { return post('/dafuweng/game/roll', data) },
  buyLand(data) { return post('/dafuweng/game/buy/land', data) },
  upgradeLand(data) { return post('/dafuweng/game/upgrade/land', data) },
  sellLand(data) { return post('/dafuweng/game/sell/land', data) },
  buyItem(data) { return post('/dafuweng/game/buy/item', data) },
  useItem(data) { return post('/dafuweng/game/use/item', data) },
  triggerEvent(data) { return post('/dafuweng/game/event/trigger', data) },
  nextTurn(data) { return post('/dafuweng/game/next/turn', data) },
  getGameState(gameId) { 
    if (typeof gameId === 'object') gameId = gameId.gameId
    return get('/dafuweng/game/state/get?game_id=' + gameId) 
  },
  getGameList(params = '') { 
    if (typeof params === 'object') {
      const arr = []
      for (const k in params) arr.push(k + '=' + params[k])
      params = arr.join('&')
    }
    return get('/dafuweng/game/list/get' + (params ? '?' + params : '')) 
  },

  getMapList() { return get('/dafuweng/map/list/get') },
  getMapDetail(cellId) { return get('/dafuweng/map/detail/get?cell_id=' + cellId) },
  createMapCell(data) { return post('/dafuweng/map/create', data) },
  updateMapCell(data) { return post('/dafuweng/map/update', data) },
  deleteMapCell(data) { return del('/dafuweng/map/delete', data) },
  resetMap() { return post('/dafuweng/map/reset') },

  getItemList() { return get('/dafuweng/item/list/get') },
  getItemDetail(itemId) { return get('/dafuweng/item/detail/get?item_id=' + itemId) },
  createItem(data) { return post('/dafuweng/item/create', data) },
  updateItem(data) { return post('/dafuweng/item/update', data) },
  deleteItem(data) { return del('/dafuweng/item/delete', data) },
  resetItems() { return post('/dafuweng/item/reset') },

  getAchievements() { return get('/dafuweng/achievement/list/get') },
  getMyAchievements() { return get('/dafuweng/achievement/my/get') },
  createAchievement(data) { return post('/dafuweng/achievement/create', data) },
  updateAchievement(data) { return post('/dafuweng/achievement/update', data) },
  deleteAchievement(data) { return del('/dafuweng/achievement/delete', data) },

  getCoinsRank(params = '') { return get('/dafuweng/rank/coins/get' + (params ? '?' + params : '')) },
  getWinsRank(params = '') { return get('/dafuweng/rank/wins/get' + (params ? '?' + params : '')) },
  getGameRank(gameId) { return get('/dafuweng/rank/game/get?game_id=' + gameId) },

  getDashboardStats() { return get('/dafuweng/stats/dashboard/get') },
  getUserStats(params = '') { return get('/dafuweng/stats/users/get' + (params ? '?' + params : '')) },
  getGameStats(params = '') { return get('/dafuweng/stats/games/get' + (params ? '?' + params : '')) },

  adminLogin(data) { return post('/dafuweng/admin/login', data) },
  adminLogout() { return post('/dafuweng/admin/logout') },
  getCurrentAdmin() { return get('/dafuweng/admin/current/get') },
  adminChangePassword(data) { return post('/dafuweng/admin/password/change', data) },
  getAdminList(params = '') { return get('/dafuweng/admin/list/get' + (params ? '?' + params : '')) },
  createAdmin(data) { return post('/dafuweng/admin/create', data) },
  updateAdminStatus(data) { return post('/dafuweng/admin/status/update', data) },
  getAdminUserList(params = '') { return get('/dafuweng/admin/user/list/get' + (params ? '?' + params : '')) },
  updateUserStatus(data) { return post('/dafuweng/admin/user/status/update', data) },

  getUserList(params = '') { return get('/dafuweng/user/list/get' + (params ? '?' + params : '')) }
}

export default Api
