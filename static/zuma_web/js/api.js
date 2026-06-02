const API_BASE = '/api/zuma';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('zuma_token') || '';
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('zuma_token', token);
    }

    clearToken() {
        this.token = '';
        localStorage.removeItem('zuma_token');
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async request(url, options = {}) {
        const response = await fetch(`${API_BASE}${url}`, {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers
            }
        });
        return response.json();
    }

    async register(username, password, nickname = '') {
        return this.request('/user/register', {
            method: 'POST',
            body: JSON.stringify({ username, password, nickname })
        });
    }

    async login(username, password) {
        return this.request('/user/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async logout() {
        const result = await this.request('/user/logout', { method: 'POST' });
        this.clearToken();
        return result;
    }

    async getCurrentUser() {
        return this.request('/user/current/get');
    }

    async updateProfile(data) {
        return this.request('/user/profile/update', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async changePassword(oldPassword, newPassword) {
        return this.request('/user/password/change', {
            method: 'POST',
            body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
        });
    }

    async getRankings(limit = 100) {
        return this.request(`/user/ranking/get?limit=${limit}`);
    }

    async submitScore(score, level, combo = 0, duration = 0, ballsFired = 0, ballsMatched = 0) {
        return this.request('/game/score/submit', {
            method: 'POST',
            body: JSON.stringify({
                score,
                level,
                combo,
                duration,
                balls_fired: ballsFired,
                balls_matched: ballsMatched
            })
        });
    }

    async getTopScores(limit = 100) {
        return this.request(`/game/score/top/get?limit=${limit}`);
    }

    async getMyScores(page = 1, pageSize = 20) {
        return this.request(`/game/score/my/get?page=${page}&page_size=${pageSize}`);
    }

    async saveGameState(gameState) {
        return this.request('/game/state/save', {
            method: 'POST',
            body: JSON.stringify({ game_state: gameState })
        });
    }

    async getGameState() {
        return this.request('/game/state/get');
    }

    async clearGameState() {
        return this.request('/game/state/clear', { method: 'POST' });
    }

    async getAllAchievements() {
        return this.request('/achievement/all/get');
    }

    async getMyAchievements() {
        return this.request('/achievement/my/get');
    }

    async getAllItems() {
        return this.request('/item/all/get');
    }

    async getMyItems() {
        return this.request('/item/my/get');
    }

    async buyItem(itemType, quantity = 1) {
        return this.request('/item/buy', {
            method: 'POST',
            body: JSON.stringify({ item_type: itemType, quantity })
        });
    }

    async useItem(itemType) {
        return this.request('/item/use', {
            method: 'POST',
            body: JSON.stringify({ item_type: itemType })
        });
    }
}

export const api = new ApiService();
