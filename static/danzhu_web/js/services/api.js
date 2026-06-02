const API_BASE = '/api';

const API = {
    async request(endpoint, options = {}) {
        const url = API_BASE + endpoint;
        const token = Storage.getToken();
        const adminToken = Storage.getAdminToken();

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        } else if (adminToken) {
            headers['Authorization'] = `Bearer ${adminToken}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            return {
                code: -1,
                msg: '网络错误，请稍后重试',
                data: null
            };
        }
    },

    get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    },

    post(endpoint, data = {}, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    delete(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'DELETE' });
    },

    user: {
        register(data) {
            return API.post('/danzhu/user/register', data);
        },
        login(data) {
            return API.post('/danzhu/user/login', data);
        },
        logout() {
            return API.post('/danzhu/user/logout');
        },
        getCurrent() {
            return API.get('/danzhu/user/current/get');
        },
        updateProfile(data) {
            return API.post('/danzhu/user/profile/update', data);
        },
        changePassword(data) {
            return API.post('/danzhu/user/password/change', data);
        },
        getList(params) {
            return API.get('/danzhu/user/list/get', params);
        },
        updateStatus(params) {
            return API.post('/danzhu/user/status/update', null, params);
        }
    },

    admin: {
        login(data) {
            return API.post('/danzhu/admin/login', data);
        },
        logout() {
            return API.post('/danzhu/admin/logout');
        },
        getCurrent() {
            return API.get('/danzhu/admin/current/get');
        },
        changePassword(data) {
            return API.post('/danzhu/admin/password/change', data);
        }
    },

    game: {
        getConfig(levelId = 0) {
            return API.get('/danzhu/game/config/get', { level_id: levelId });
        },
        getLevels() {
            return API.get('/danzhu/game/levels/get');
        },
        saveResult(data) {
            return API.post('/danzhu/game/result/save', data);
        },
        getHistory(params) {
            return API.get('/danzhu/game/history/get', params);
        }
    },

    level: {
        getList(params) {
            return API.get('/danzhu/level/list/get', params);
        },
        getPublished() {
            return API.get('/danzhu/level/published/get');
        },
        getDetail(id) {
            return API.get('/danzhu/level/detail/get', { level_id: id });
        },
        create(data) {
            return API.post('/danzhu/level/create', data);
        },
        update(id, data) {
            return API.post('/danzhu/level/update', data, { level_id: id });
        },
        delete(id) {
            return API.post('/danzhu/level/delete', null, { level_id: id });
        }
    },

    item: {
        getList(params) {
            return API.get('/danzhu/item/list/get', params);
        },
        getActive() {
            return API.get('/danzhu/item/active/get');
        },
        getByType(type) {
            return API.get('/danzhu/item/type/get', { type });
        },
        getDetail(id) {
            return API.get('/danzhu/item/detail/get', { item_id: id });
        },
        create(data) {
            return API.post('/danzhu/item/create', data);
        },
        update(id, data) {
            return API.post('/danzhu/item/update', data, { item_id: id });
        },
        delete(id) {
            return API.post('/danzhu/item/delete', null, { item_id: id });
        }
    },

    score: {
        getTop(params) {
            return API.get('/danzhu/score/top/get', params);
        },
        getUser(params) {
            return API.get('/danzhu/score/user/get', params);
        },
        getHigh(userId) {
            const params = userId ? { user_id: userId } : {};
            return API.get('/danzhu/score/high/get', params);
        },
        getRank(params) {
            return API.get('/danzhu/score/rank/get', params);
        }
    },

    achievement: {
        getAll() {
            return API.get('/danzhu/achievement/all/get');
        },
        getUser() {
            return API.get('/danzhu/achievement/user/get');
        },
        getList(params) {
            return API.get('/danzhu/achievement/list/get', params);
        },
        getDetail(id) {
            return API.get('/danzhu/achievement/detail/get', { achievement_id: id });
        },
        create(data) {
            return API.post('/danzhu/achievement/create', data);
        },
        update(id, data) {
            return API.post('/danzhu/achievement/update', data, { achievement_id: id });
        },
        delete(id) {
            return API.post('/danzhu/achievement/delete', null, { achievement_id: id });
        }
    },

    statistics: {
        getOverview() {
            return API.get('/danzhu/statistics/overview/get');
        },
        getGame(params) {
            return API.get('/danzhu/statistics/game/get', params);
        },
        getDaily(days = 7) {
            return API.get('/danzhu/statistics/daily/get', { days });
        },
        getUserGrowth(days = 7) {
            return API.get('/danzhu/statistics/user/growth/get', { days });
        },
        getAchievement() {
            return API.get('/danzhu/statistics/achievement/get');
        },
        getLevel() {
            return API.get('/danzhu/statistics/level/get');
        },
        getTopPlayers(limit = 10) {
            return API.get('/danzhu/statistics/top/players/get', { limit });
        }
    }
};
