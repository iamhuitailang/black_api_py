const API_BASE = '/api';

class ApiService {
    constructor() {
        this.baseUrl = API_BASE;
    }

    getToken() {
        return localStorage.getItem('majiang_token');
    }

    setToken(token) {
        localStorage.setItem('majiang_token', token);
    }

    clearToken() {
        localStorage.removeItem('majiang_token');
    }

    async request(endpoint, options = {}) {
        const url = this.baseUrl + endpoint;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method: 'GET',
            headers,
            ...options
        };

        if (options.body && typeof options.body !== 'string') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            return {
                code: 500,
                msg: '网络请求失败',
                data: null
            };
        }
    }

    get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    post(endpoint, data = {}, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, {
            method: 'POST',
            body: data
        });
    }

    put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data
        });
    }

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    user = {
        register: (data) => this.post('/majiang/user/register', data),
        login: (data) => this.post('/majiang/user/login', data),
        logout: () => this.post('/majiang/user/logout'),
        getCurrent: () => this.get('/majiang/user/current/get'),
        updateProfile: (data) => this.post('/majiang/user/profile/update', data),
        changePassword: (data) => this.post('/majiang/user/password/change', data),
        getStatistics: () => this.get('/majiang/statistics/user/get'),
        getGameHistory: (params) => this.get('/majiang/game/history/get', params)
    };

    admin = {
        login: (data) => this.post('/majiang/admin/login', data),
        logout: () => this.post('/majiang/admin/logout'),
        getCurrent: () => this.get('/majiang/admin/current/get'),
        getUserList: (params) => this.get('/majiang/admin/user/list/get', params)
    };

    ai = {
        getAll: () => this.get('/majiang/ai/all/get'),
        getList: (params) => this.get('/majiang/ai/list/get', params),
        getById: (id) => this.get('/majiang/ai/detail/get', { ai_id: id })
    };

    game = {
        create: (difficulty = 2) => this.post('/majiang/game/create', {}, { difficulty }),
        createTest: (testType = 'ready') => this.post('/majiang/game/test/create', {}, { test_type: testType }),
        getState: () => this.get('/majiang/game/state/get'),
        draw: () => this.post('/majiang/game/draw'),
        discard: (data) => this.post('/majiang/game/discard', data),
        aiPlay: () => this.post('/majiang/game/ai/play'),
        hu: () => this.post('/majiang/game/hu'),
        cancel: () => this.post('/majiang/game/cancel'),
        checkReady: () => this.get('/majiang/game/check/ready/get'),
        calculateFan: (data) => this.post('/majiang/game/calculate/fan', data)
    };

    ranking = {
        get: (params) => this.get('/majiang/ranking/get', params),
        getUser: (rankingType) => this.get('/majiang/ranking/user/get', { ranking_type: rankingType }),
        getAll: () => this.get('/majiang/ranking/all/get'),
        refresh: (rankingType) => this.post('/majiang/ranking/refresh', {}, { ranking_type: rankingType })
    };

    achievement = {
        getAll: () => this.get('/majiang/achievement/all/get'),
        getByCategory: (category) => this.get('/majiang/achievement/category/get', { category }),
        getUser: () => this.get('/majiang/achievement/user/get'),
        check: () => this.post('/majiang/achievement/check'),
        claim: (achievementId) => this.post('/majiang/achievement/claim', {}, { achievement_id: achievementId })
    };

    statistics = {
        overall: () => this.get('/majiang/statistics/overall/get'),
        daily: (days) => this.get('/majiang/statistics/daily/get', { days }),
        difficulty: () => this.get('/majiang/statistics/difficulty/get'),
        topPlayers: (limit = 10) => this.get('/majiang/statistics/top/players/get', { limit }),
        ai: () => this.get('/majiang/statistics/ai/get')
    };
}

const api = new ApiService();
