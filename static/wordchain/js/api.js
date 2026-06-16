const API_BASE = '/api';

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('wordchain_token') || '';
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('wordchain_token', token);
    }

    clearToken() {
        this.token = '';
        localStorage.removeItem('wordchain_token');
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

    async request(url, method, data = null) {
        const options = {
            method: method,
            headers: this.getHeaders()
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${API_BASE}${url}`, options);
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API请求错误:', error);
            return {
                code: 500,
                message: '网络错误，请稍后重试',
                data: null
            };
        }
    }

    async get(url) {
        return this.request(url, 'GET');
    }

    async post(url, data) {
        return this.request(url, 'POST', data);
    }

    async register(username, password) {
        return this.post('/wordchain/register', { username, password });
    }

    async login(username, password) {
        return this.post('/auth/login', { username, password });
    }

    async logout() {
        return this.post('/auth/logout');
    }

    async getCurrentUser() {
        return this.get('/auth/current/user/get');
    }

    async startGame() {
        return this.post('/wordchain/game/start');
    }

    async submitWord(gameId, word) {
        return this.post('/wordchain/game/submit', { game_id: gameId, word });
    }

    async timeout(gameId) {
        return this.post('/wordchain/game/timeout', { game_id: gameId });
    }

    async getGameHistory(gameId) {
        return this.get(`/wordchain/game/history/get?game_id=${gameId}`);
    }

    async getUserStats() {
        return this.get('/wordchain/user/stats/get');
    }

    async resumeGame() {
        return this.get('/wordchain/game/resume/get');
    }
}

const api = new ApiClient();

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) {
        const toastDiv = document.createElement('div');
        toastDiv.id = 'toast';
        toastDiv.className = 'toast';
        document.body.appendChild(toastDiv);
    }
    
    const toastEl = document.getElementById('toast');
    toastEl.textContent = message;
    toastEl.className = `toast ${type} show`;
    
    setTimeout(() => {
        toastEl.classList.remove('show');
    }, 2500);
}
