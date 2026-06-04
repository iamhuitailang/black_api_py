import request from '../utils/request'

export const api = {
  login(username, password) {
    return request.post('/auth/login', { username, password })
  },

  register(username, password, nickname) {
    return request.post('/maomi/register', { username, password, nickname })
  },

  getGameState() {
    return request.get('/maomi/game/state/get')
  },

  initGame() {
    return request.get('/maomi/game/init/get')
  },

  getGameRecords() {
    return request.get('/maomi/game/records/get')
  },

  getProfile() {
    return request.get('/maomi/profile/get')
  },

  updateProfile(data) {
    return request.post('/maomi/profile/update', data)
  },

  getLeaderboard() {
    return request.get('/maomi/leaderboard/get')
  },

  getCats() {
    return request.get('/maomi/cat/list/get')
  },

  getCat(catId) {
    return request.get(`/maomi/cat/get?id=${catId}`)
  },

  addCat(data) {
    return request.post('/maomi/cat/add', data)
  },

  feedCat(catId) {
    return request.get(`/maomi/cat/feed/get?id=${catId}`)
  },

  playCat(catId) {
    return request.get(`/maomi/cat/play/get?id=${catId}`)
  },

  cleanCat(catId) {
    return request.get(`/maomi/cat/clean/get?id=${catId}`)
  },

  getMenu() {
    return request.get('/maomi/drink/list/get')
  },

  getAvailableMenu() {
    return request.get('/maomi/drink/available/get')
  },

  getOrders() {
    return request.get('/maomi/order/list/get')
  },

  getPendingOrders() {
    return request.get('/maomi/order/pending/get')
  },

  getCompletedOrders() {
    return request.get('/maomi/order/completed/get')
  },

  generateOrder() {
    return request.get('/maomi/order/random/get')
  },

  completeOrder(orderId) {
    return request.get(`/maomi/order/complete/get?id=${orderId}`)
  },

  cancelOrder(orderId) {
    return request.get(`/maomi/order/cancel/get?id=${orderId}`)
  },

  getOrderStatistics() {
    return request.get('/maomi/order/statistics/get')
  },

  getShopItems() {
    return request.get('/maomi/item/shop/get')
  },

  getUserItems() {
    return request.get('/maomi/item/user/get')
  },

  buyItem(itemId) {
    return request.post('/maomi/item/buy', { item_id: itemId })
  },

  useItem(itemId, catId = null) {
    const data = { item_id: itemId }
    if (catId) data.cat_id = catId
    return request.post('/maomi/item/use', data)
  },

  getActivities() {
    return request.get('/maomi/activity/list/get')
  },

  getActiveActivities() {
    return request.get('/maomi/activity/active/get')
  },

  startActivity(activityId) {
    return request.get(`/maomi/activity/start/get?id=${activityId}`)
  },

  endActivity(activityId) {
    return request.get(`/maomi/activity/end/get?id=${activityId}`)
  },

  getVisitors() {
    return request.get('/maomi/visitor/list/get')
  },

  getActiveVisitors() {
    return request.get('/maomi/visitor/active/get')
  },

  generateVisitor() {
    return request.get('/maomi/visitor/generate/get')
  },

  toggleCafeOpen() {
    return request.get('/maomi/cafe/toggle/open/get')
  },

  getCafe() {
    return request.get('/maomi/cafe/get')
  },

  upgradeCafe() {
    return request.get('/maomi/cafe/upgrade/get')
  },

  cleanCafe() {
    return request.get('/maomi/cafe/clean/get')
  },

  updateWeather(weather) {
    return request.get(`/maomi/cafe/update/weather/get?weather=${weather}`)
  },

  dailyCheckin() {
    return request.get('/maomi/daily/checkin/get')
  },

  share() {
    return request.get('/maomi/share/get')
  }
}

export default api
