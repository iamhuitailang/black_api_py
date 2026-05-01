const API_BASE_URL = '/api';

const ApiService = {
    async request(url, options = {}) {
        const token = Storage.getToken();

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method: options.method || 'GET',
            headers,
            ...options
        };

        if (options.data && config.method !== 'GET') {
            config.body = JSON.stringify(options.data);
        }

        try {
            const response = await fetch(`${API_BASE_URL}${url}`, config);
            const result = await response.json();

            if (response.status === 401 || (result.code === 1 && result.msg && result.msg.includes('token'))) {
                Storage.removeToken();
                Storage.removeUser();
                Storage.removeTank();
                if (window.UIManager) {
                    window.UIManager.showMainMenu();
                }
                throw new Error('登录已过期，请重新登录');
            }

            return result;
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    },

    async get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'GET' });
    },

    async post(url, data = {}) {
        return this.request(url, { method: 'POST', data });
    },

    async put(url, data = {}) {
        return this.request(url, { method: 'PUT', data });
    },

    async delete(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'DELETE' });
    }
};

const TankeApi = {
    async register(username, password, nickname = '') {
        return ApiService.post('/tanke/user/register', {
            username,
            password,
            nickname
        });
    },

    async login(username, password) {
        return ApiService.post('/tanke/user/login', {
            username,
            password
        });
    },

    async logout() {
        return ApiService.post('/tanke/user/logout');
    },

    async getCurrentUser() {
        return ApiService.get('/tanke/user/current/get');
    },

    async updateProfile(data) {
        return ApiService.post('/tanke/user/profile/update', data);
    },

    async changePassword(oldPassword, newPassword) {
        return ApiService.post('/tanke/user/password/change', {
            old_password: oldPassword,
            new_password: newPassword
        });
    },

    async getTankInfo() {
        return ApiService.get('/tanke/tank/info/get');
    },

    async addExp(exp) {
        return ApiService.post('/tanke/tank/exp/add', { exp });
    },

    async updateSkin(skinId) {
        return ApiService.post('/tanke/tank/skin/update', { skin_id: skinId });
    },

    async getSkins() {
        return ApiService.get('/tanke/tank/skin/list/get');
    },

    async saveGameResult(wave, score, killed) {
        return ApiService.post('/tanke/game/save', {
            wave,
            score,
            killed
        });
    },

    async getGameRecords(page = 1, pageSize = 10) {
        return ApiService.get('/tanke/game/records/get', { page, page_size: pageSize });
    },

    async getHighScore() {
        return ApiService.get('/tanke/game/high/score/get');
    },

    async getLeaderboard(limit = 10) {
        return ApiService.get('/tanke/game/leaderboard/get', { limit });
    }
};

window.Api = ApiService;
window.TankeApi = TankeApi;
