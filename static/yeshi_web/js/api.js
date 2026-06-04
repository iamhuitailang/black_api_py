const API_BASE = '/api';

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('yeshi_token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('yeshi_token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('yeshi_token');
    }

    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            return {
                code: -1,
                message: '网络请求失败',
                data: null
            };
        }
    }

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    async login(username, password) {
        return this.post('/auth/login', { username, password });
    }

    async register(username, password) {
        return this.post('/yeshi/register', { username, password });
    }

    async logout() {
        const result = await this.post('/auth/logout', {});
        this.clearToken();
        return result;
    }

    async getCurrentUser() {
        return this.get('/auth/current/user/get');
    }

    async getGameUser() {
        return this.get('/yeshi/user/get');
    }

    async startGame() {
        return this.post('/yeshi/game/start', {});
    }

    async endGame() {
        return this.post('/yeshi/game/end', {});
    }

    async getSession() {
        return this.get('/yeshi/game/session/get');
    }

    async getWeather() {
        return this.get('/yeshi/weather/get');
    }

    async generateGuest() {
        return this.post('/yeshi/guest/generate', {});
    }

    async getActiveGuests() {
        return this.get('/yeshi/guest/active/get');
    }

    async getAllFoods(page = 1, pageSize = 50) {
        return this.get(`/yeshi/food/all/get?page=${page}&page_size=${pageSize}`);
    }

    async getUnlockedFoods() {
        return this.get('/yeshi/food/unlocked/get');
    }

    async getUnlockableFoods() {
        return this.get('/yeshi/food/unlockable/get');
    }

    async unlockFood(foodId) {
        return this.post('/yeshi/food/unlock', { food_id: foodId });
    }

    async createOrder(foodId, guestId = null) {
        return this.post('/yeshi/order/create', {
            food_id: foodId,
            guest_id: guestId
        });
    }

    async getPendingOrders() {
        return this.get('/yeshi/order/pending/get');
    }

    async completeOrder(orderId, success = true, quality = 80, timeSpent = 0) {
        return this.post('/yeshi/order/complete', {
            order_id: orderId,
            success,
            quality,
            time_spent: timeSpent
        });
    }

    async getOrderStats() {
        return this.get('/yeshi/order/stats/get');
    }

    async getAllUpgrades() {
        return this.get('/yeshi/upgrade/all/get');
    }

    async getAvailableUpgrades() {
        return this.get('/yeshi/upgrade/available/get');
    }

    async purchaseUpgrade(upgradeId) {
        return this.post('/yeshi/upgrade/purchase', { upgrade_id: upgradeId });
    }

    async getUserUpgrades() {
        return this.get('/yeshi/upgrade/user/get');
    }

    async getGameStats() {
        return this.get('/yeshi/stats/get');
    }

    async getLeaderboard(limit = 10) {
        return this.get(`/yeshi/leaderboard/get?limit=${limit}`);
    }

    async getGameConfig() {
        return this.get('/yeshi/config/get');
    }
}

const api = new ApiClient();
