const API = {
    baseUrl: '/api',
    token: localStorage.getItem('knife_token') || '',

    setToken(token) {
        this.token = token;
        localStorage.setItem('knife_token', token);
    },

    clearToken() {
        this.token = '';
        localStorage.removeItem('knife_token');
    },

    async request(endpoint, options = {}) {
        const url = this.baseUrl + endpoint;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API请求错误:', error);
            return {
                code: 500,
                message: '网络错误',
                data: null
            };
        }
    },

    async login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    },

    async register(username, password) {
        try {
            const response = await fetch(this.baseUrl + '/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (data.code === 0) return data;
        } catch (e) {}
        return {
            code: 1,
            message: '注册功能暂未开放，请使用默认账号登录',
            data: null
        };
    },

    async logout() {
        return this.request('/auth/logout', {
            method: 'POST'
        });
    },

    async getCurrentUser() {
        return this.request('/auth/current/user/get');
    },

    async getLevel(levelNum) {
        return this.request(`/game/level/get?level_num=${levelNum}`);
    },

    async getAllLevels() {
        return this.request('/game/levels/get');
    },

    async getProgress() {
        return this.request('/game/progress/get');
    },

    async completeLevel(levelNum) {
        return this.request('/game/level/complete', {
            method: 'POST',
            body: JSON.stringify({ level_num: levelNum })
        });
    },

    async failLevel() {
        return this.request('/game/level/fail', {
            method: 'POST'
        });
    },

    async getSkins() {
        return this.request('/game/skins/get');
    },

    async selectSkin(skinKey) {
        return this.request('/game/skin/select', {
            method: 'POST',
            body: JSON.stringify({ skin_key: skinKey })
        });
    },

    async selectLevel(levelNum) {
        return this.request('/game/level/select', {
            method: 'POST',
            body: JSON.stringify({ level_num: levelNum })
        });
    }
};
