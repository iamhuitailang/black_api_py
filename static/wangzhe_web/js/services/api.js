const API_BASE = '/api';

const ApiService = {
    async request(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        const token = Storage.get('wangzhe_token');
        const adminToken = Storage.get('wangzhe_admin_token');
        
        if (token && !url.includes('/admin/')) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        if (adminToken && url.includes('/admin/')) {
            headers['Authorization'] = `Bearer ${adminToken}`;
        }

        try {
            const response = await fetch(`${API_BASE}${url}`, {
                ...options,
                headers
            });

            const data = await response.json();
            return data;
        } catch (e) {
            console.error('API Error:', url, e);
            return { code: 1, msg: '网络请求失败', data: null };
        }
    },

    get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'GET' });
    },

    post(url, data = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    put(url, data = {}) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    delete(url) {
        return this.request(url, { method: 'DELETE' });
    },

    user: {
        register(data) {
            return ApiService.post('/wangzhe/user/register', data);
        },
        login(data) {
            return ApiService.post('/wangzhe/user/login', data);
        },
        logout() {
            return ApiService.post('/wangzhe/user/logout');
        },
        getCurrent() {
            return ApiService.get('/wangzhe/user/current/get');
        },
        updateProfile(data) {
            return ApiService.post('/wangzhe/user/profile/update', data);
        },
        changePassword(data) {
            return ApiService.post('/wangzhe/user/password/change', data);
        },
        getById(id) {
            return ApiService.get(`/wangzhe/user/detail/get?id=${id}`);
        }
    },

    admin: {
        login(data) {
            return ApiService.post('/wangzhe/admin/login', data);
        },
        logout() {
            return ApiService.post('/wangzhe/admin/logout');
        },
        getCurrent() {
            return ApiService.get('/wangzhe/admin/current/get');
        },
        changePassword(data) {
            return ApiService.post('/wangzhe/admin/password/change', data);
        },
        getUserList(params) {
            return ApiService.get('/wangzhe/admin/user/list/get', params);
        },
        updateUserStatus(data) {
            return ApiService.post('/wangzhe/admin/user/status/update', data);
        },
        getHeroList(params) {
            return ApiService.get('/wangzhe/admin/hero/list/get', params);
        },
        createHero(data) {
            return ApiService.post('/wangzhe/admin/hero/create', data);
        },
        updateHero(data) {
            return ApiService.post('/wangzhe/admin/hero/update', data);
        },
        deleteHero(id) {
            return ApiService.post('/wangzhe/admin/hero/delete', { id });
        },
        getEquipmentList(params) {
            return ApiService.get('/wangzhe/admin/equipment/list/get', params);
        },
        createEquipment(data) {
            return ApiService.post('/wangzhe/admin/equipment/create', data);
        },
        updateEquipment(data) {
            return ApiService.post('/wangzhe/admin/equipment/update', data);
        },
        deleteEquipment(id) {
            return ApiService.post('/wangzhe/admin/equipment/delete', { id });
        },
        getStatistics() {
            return ApiService.get('/wangzhe/admin/statistics/get');
        }
    },

    hero: {
        getList(params) {
            return ApiService.get('/wangzhe/hero/list/get', params);
        },
        getDetail(id) {
            return ApiService.get(`/wangzhe/hero/detail/get?id=${id}`);
        },
        getMyHeroes() {
            return ApiService.get('/wangzhe/hero/my/get');
        },
        buy(id) {
            return ApiService.post('/wangzhe/hero/buy', { hero_id: id });
        }
    },

    equipment: {
        getList(params) {
            return ApiService.get('/wangzhe/equipment/list/get', params);
        },
        getDetail(id) {
            return ApiService.get(`/wangzhe/equipment/detail/get?id=${id}`);
        }
    },

    game: {
        createRoom(data) {
            return ApiService.post('/wangzhe/game/room/create', data);
        },
        joinRoom(data) {
            return ApiService.post('/wangzhe/game/room/join', data);
        },
        selectHero(data) {
            return ApiService.post('/wangzhe/game/hero/select', data);
        },
        quickStart(data) {
            return ApiService.post('/wangzhe/game/quick/start', data);
        },
        start(gameId) {
            return ApiService.post('/wangzhe/game/start', { game_id: gameId });
        },
        end(gameId) {
            return ApiService.post('/wangzhe/game/end', { game_id: gameId });
        },
        getResult(gameId) {
            return ApiService.get(`/wangzhe/game/result/get?game_id=${gameId}`);
        },
        getHistory(params) {
            return ApiService.get('/wangzhe/game/history/get', params);
        },
        getStatistics() {
            return ApiService.get('/wangzhe/game/statistics/get');
        }
    },

    ranking: {
        getList(params) {
            return ApiService.get('/wangzhe/ranking/list/get', params);
        },
        getMyRanking() {
            return ApiService.get('/wangzhe/ranking/my/get');
        },
        getTierList() {
            return ApiService.get('/wangzhe/ranking/tier/list/get');
        }
    },

    achievement: {
        getList(params) {
            return ApiService.get('/wangzhe/achievement/list/get', params);
        },
        getMyAchievements() {
            return ApiService.get('/wangzhe/achievement/my/get');
        },
        claim(achievementId) {
            return ApiService.post('/wangzhe/achievement/claim', { achievement_id: achievementId });
        },
        getUnclaimedCount() {
            return ApiService.get('/wangzhe/achievement/unclaimed/get');
        }
    }
};

window.ApiService = ApiService;
