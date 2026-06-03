const API = {
    baseURL: '/api',

    async request(url, options = {}) {
        console.log('API Request:', url, options);
        
        let token = null;
        if (typeof Auth !== 'undefined' && Auth.getToken) {
            token = Auth.getToken();
        }

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        if (options.body && !(options.body instanceof FormData)) {
            config.body = JSON.stringify(options.body);
        }

        console.log('Fetch config:', config);

        try {
            const fullUrl = `${this.baseURL}${url}`;
            console.log('Fetching:', fullUrl);
            const response = await fetch(fullUrl, config);
            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);
            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            return {
                code: -1,
                msg: '网络请求失败: ' + (error.message || '未知错误'),
                data: null
            };
        }
    },

    get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'GET' });
    },

    post(url, data = {}) {
        return this.request(url, { method: 'POST', body: data });
    },

    put(url, data = {}) {
        return this.request(url, { method: 'PUT', body: data });
    },

    delete(url, data = {}) {
        return this.request(url, { method: 'DELETE', body: data });
    },

    upload(url, file, extraData = {}) {
        const formData = new FormData();
        formData.append('file', file);
        
        Object.keys(extraData).forEach(key => {
            formData.append(key, extraData[key]);
        });

        return this.request(url, {
            method: 'POST',
            body: formData,
            headers: {}
        });
    }
};

const YpAPI = {
    user: {
        register(data) {
            return API.post('/yp/user/register', data);
        },
        login(data) {
            return API.post('/yp/user/login', data);
        },
        logout() {
            return API.post('/yp/user/logout');
        },
        profile() {
            return API.get('/yp/user/current/get');
        },
        updateProfile(data) {
            return API.post('/yp/user/profile/update', data);
        },
        updatePassword(data) {
            return API.post('/yp/user/password/change', data);
        },
        leaderboard(params) {
            return API.get('/yp/user/leaderboard/get', params);
        }
    },

    character: {
        list() {
            return API.get('/yp/character/list/get');
        },
        my() {
            return API.get('/yp/character/my/get');
        },
        buy(data) {
            return API.post('/yp/character/purchase', data);
        },
        select(data) {
            return API.post('/yp/character/set', data);
        }
    },

    music: {
        list(params) {
            return API.get('/yp/music/list/get', params);
        },
        my() {
            return API.get('/yp/music/my/get');
        },
        favorite(data) {
            return API.post('/yp/music/favorite/toggle', data);
        },
        upload(file, data) {
            return API.upload('/yp/music/upload', file, data);
        },
        detail(id) {
            return API.get('/yp/music/detail/get', { music_id: id });
        }
    },

    score: {
        submit(data) {
            return API.post('/yp/score/submit', data);
        },
        leaderboard(params) {
            return API.get('/yp/score/leaderboard/get', params);
        },
        my(params) {
            return API.get('/yp/score/my/get', params);
        },
        rank(musicId) {
            return API.get('/yp/score/rank/get', { music_id: musicId || 0 });
        }
    },

    skill: {
        tree() {
            return API.get('/yp/skill/tree/get');
        },
        my() {
            return API.get('/yp/skill/my/get');
        },
        upgrade(data) {
            return API.post('/yp/skill/upgrade', data);
        },
        effects() {
            return API.get('/yp/skill/effects/get');
        }
    },

    game: {
        state() {
            return API.get('/yp/game/state/get');
        },
        updateSettings(data) {
            return API.post('/yp/game/settings/update', data);
        },
        bonuses() {
            return API.get('/yp/game/bonus/get');
        },
        updateMusic(data) {
            return API.post('/yp/game/music/update', data);
        },
        updateCharacter(data) {
            return API.post('/yp/game/character/update', data);
        },
        updatePlayTime() {
            return API.post('/yp/game/playtime/update');
        }
    }
};
