const API_BASE = '/api/ranking';

class API {
    constructor() {
        this.token = localStorage.getItem('ranking_token') || '';
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('ranking_token', token);
    }

    clearToken() {
        this.token = '';
        localStorage.removeItem('ranking_token');
    }

    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });
        return response.json();
    }

    async register(username, password) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async logout() {
        return this.request('/auth/logout', {
            method: 'POST'
        });
    }

    async getCurrentUser() {
        return this.request('/auth/current/get');
    }

    async getLeaderboard(gameType, period, limit = 100) {
        return this.request(`/score/leaderboard/get?game_type=${gameType}&period=${period}&limit=${limit}`);
    }

    async submitScore(gameType, period, score) {
        return this.request('/score/submit', {
            method: 'POST',
            body: JSON.stringify({ game_type: gameType, period, score })
        });
    }

    async getUserRank(gameType, period) {
        return this.request(`/score/user/rank/get?game_type=${gameType}&period=${period}`);
    }

    async getUserHistory(gameType = null, limit = 20) {
        const gameParam = gameType ? `&game_type=${gameType}` : '';
        return this.request(`/score/user/history/get?limit=${limit}${gameParam}`);
    }
}

const api = new API();
